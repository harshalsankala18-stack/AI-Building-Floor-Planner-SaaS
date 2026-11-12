/**
 * Phase 3, 2.5 & 2.7 — AI-to-CAD Extraction & Image Reconstruction Pipeline.
 *
 * RAW IMAGE -> GEMINI VISION INTERPRETATION -> STRUCTURED ARCHITECTURAL PLAN ->
 * IMAGE-DERIVED VECTOR RECONSTRUCTION -> TRACEABLE NORMALIZATION ->
 * CAD FIDELITY GATE -> CANONICAL EDITABLE GEOMETRY.
 *
 * The deterministic system owns acceptance. A rejected extraction is returned
 * as REJECTED with actionable reasons; the original image is never modified.
 *
 * Phase 2.7 rule (non-negotiable): for the AI-to-CAD path the ACCEPTED IMAGE IS
 * THE ONLY SOURCE OF GEOMETRY. When reconstruction fails, the pipeline reports
 * the real conversion error. It never substitutes a deterministic template and
 * labels it as the converted image — that substitution is what made every
 * previous "verified" CAD model unrelated to the drawing the user accepted.
 */

import {
  type Building,
  type DesignRequirementSpecification,
  type SpaceProgram,
} from '@ai-floor-planner/core';
import type { ApartmentGenerationManifest } from '@ai-floor-planner/ai-orchestration';
import {
  attachExtractedOpenings,
  createExtractionMetadata,
  extractedPlanToApartmentStructure,
  extractPlanToBuilding,
  inspectExtractionStructure,
  normalizeExtractedPlan,
  parseExtractionPayload,
  runApartmentPlanValidation,
  validateExtractedPlan,
  type ApartmentPlanValidationResult,
  type DiagnosticFragment,
  type ExtractedPlan,
  type ExtractedPlanValidation,
} from '@ai-floor-planner/planning-engine';
import { apartmentExpectationFromManifest } from './apartment-structure.js';
import {
  reconstructBuildingFromImage,
  type ImageSourceIdentity,
  type ImageToCadReconstructionResult,
} from './image-to-cad-reconstruction.js';
import { evaluateCadFidelity, type CadFidelityReport } from './cad-fidelity.js';
import { assessReconstruction } from './reconstruction-acceptance.js';

export interface ExtractionPipelineInput {
  readonly projectId: string;
  readonly projectName: string;
  readonly requirements: DesignRequirementSpecification;
  readonly program?: SpaceProgram;
  readonly imageWidePixels: number;
  readonly imageTallPixels: number;
  /** Raw vision payload (already fetched). */
  readonly payload: unknown;
  readonly extractionSource: string;
  readonly confidence: string;
  readonly interpretationSource: 'provider' | 'rule_based' | 'rule_based_fallback';
  readonly isApartment?: boolean;
  readonly apartmentManifest?: ApartmentGenerationManifest;
  /**
   * Coordinate frame of the interpretation. The vision layer returns a fixed
   * normalized frame; this is what maps extracted numbers to millimetres, NOT
   * the raster pixel size. Defaults to the pixel size for legacy callers.
   */
  readonly coordinateFrame?: { readonly width: number; readonly height: number };
  /**
   * Identity of the master image being reconstructed. Required to produce
   * image-derived geometry with provenance; when absent the AI-to-CAD
   * reconstruction path is skipped rather than faked.
   */
  readonly imageSource?: ImageSourceIdentity;
}

export interface ExtractionPipelineResult {
  readonly status: 'ACCEPTED' | 'REJECTED';
  readonly planId: string;
  readonly extractedPlan: ExtractedPlan | null;
  /** Candidate canonical Building; present only when ACCEPTED (PRD 23). */
  readonly building: Building | null;
  readonly validation: ExtractedPlanValidation | null;
  readonly diagnostics: readonly DiagnosticFragment[];
  readonly interpretationSource: string;
  readonly confidence: string;
  /** Apartment staged hard-validation outcome (Phase 4). */
  readonly apartmentValidation?: Pick<ApartmentPlanValidationResult, 'stages' | 'counts' | 'source'>;
  /**
   * Where the returned geometry actually came from. `IMAGE_RECONSTRUCTION` is
   * the only value that may be presented as the converted AI image.
   */
  readonly geometrySource?: 'IMAGE_RECONSTRUCTION' | 'EXTRACTED_DIRECT' | 'APARTMENT_STRUCTURE';
  /** Image-to-CAD fidelity evaluation; independent of the image-quality score. */
  readonly cadFidelity?: CadFidelityReport;
  /** The real conversion error when image reconstruction failed. */
  readonly conversionError?: { readonly code: string; readonly message: string; readonly detail: Readonly<Record<string, unknown>> };
}

export function siteContext(requirements: DesignRequirementSpecification) {
  const hard = requirements.hard;
  return {
    plotWidth: hard.plotWidthMm,
    plotDepth: hard.plotDepthMm,
    orientation: requirements.orientationDegrees,
    roadFacing: hard.roadFacing,
    frontSetback: requirements.setbacksMm?.front ?? 0,
    rearSetback: requirements.setbacksMm?.rear ?? 0,
    leftSetback: requirements.setbacksMm?.left ?? 0,
    rightSetback: requirements.setbacksMm?.right ?? 0,
  };
}

/**
 * Reconstruct the accepted master image into editable canonical geometry.
 *
 * Phase 2.7: this is the ONLY path that may produce geometry presented as the
 * converted AI image. It returns the reconstruction result verbatim — success
 * with provenance, or the real failure — so no caller can mistake a template
 * for the image's own architecture.
 */
function reconstructFromAcceptedImage(
  plan: ExtractedPlan,
  rawPayload: unknown,
  requirements: DesignRequirementSpecification,
  projectId: string,
  projectName: string,
  source: ImageSourceIdentity,
): ImageToCadReconstructionResult {
  return reconstructBuildingFromImage({
    plan,
    rawVisionPayload: rawPayload,
    requirements,
    site: siteContext(requirements),
    projectId,
    projectName,
    source,
  });
}



export function runExtractionPipeline(input: ExtractionPipelineInput): ExtractionPipelineResult {
  const diagnostics: DiagnosticFragment[] = [];
  const planId = `extract_${input.projectId}_${input.imageWidePixels}x${input.imageTallPixels}`;
  const site = siteContext(input.requirements);

  // The interpretation's coordinate frame — NOT the raster pixel size — is what
  // maps the extracted numbers onto the authoritative plot.
  const frame = input.coordinateFrame ?? { width: input.imageWidePixels, height: input.imageTallPixels };

  const metadata = createExtractionMetadata({
    imageWidePixels: input.imageWidePixels,
    imageTallPixels: input.imageTallPixels,
    frameWidth: frame.width,
    frameHeight: frame.height,
    plotWidth: site.plotWidth,
    plotDepth: site.plotDepth,
    orientation: site.orientation,
    roadFacing: site.roadFacing,
    extractionSource: input.extractionSource,
    confidence: input.confidence,
  });

  // Recovery Phase 4: apartment-aware IMAGE → 2D → hard validation.
  if (input.isApartment && input.apartmentManifest) {
    const parsed = parseExtractionPayload(input.payload, metadata, planId);
    diagnostics.push(...parsed.diagnostics);
    if (!parsed.plan) return rejected(planId, null, diagnostics, input);

    const mapped = extractedPlanToApartmentStructure(parsed.plan, { plotWidth: site.plotWidth, plotDepth: site.plotDepth }, frame);
    diagnostics.push(...mapped.diagnostics);
    if (!mapped.structure) return rejected(planId, parsed.plan, diagnostics, input);

    const result = runApartmentPlanValidation({
      structure: mapped.structure,
      expectation: apartmentExpectationFromManifest(input.apartmentManifest),
      site,
      projectId: input.projectId,
      projectName: input.projectName,
    });
    diagnostics.push(...result.diagnostics);
    return {
      status: result.status,
      planId,
      extractedPlan: parsed.plan,
      building: result.building,
      validation: result.validation,
      diagnostics,
      interpretationSource: input.interpretationSource,
      confidence: input.confidence,
      apartmentValidation: { stages: result.stages, counts: result.counts, source: result.source },
    };
  }

  // Generic single-family residential pipeline:
  // 1. Parse the untrusted interpretation payload.
  const parsed = parseExtractionPayload(input.payload, metadata, planId);
  diagnostics.push(...parsed.diagnostics);
  if (!parsed.plan) {
    return rejected(planId, null, diagnostics, input);
  }

  // 2. Structural sanity before geometry work.
  const structural = inspectExtractionStructure(parsed.plan);
  diagnostics.push(...structural);
  if (structural.some((issue: DiagnosticFragment) => issue.severity === 'error')) {
    return rejected(planId, parsed.plan, diagnostics, input);
  }

  // 3. Normalize image space into real-world millimetres (site is authoritative).
  const normalized = normalizeExtractedPlan(parsed.plan, {
    plotWidth: site.plotWidth,
    plotDepth: site.plotDepth,
    orientation: site.orientation,
    roadFacing: site.roadFacing,
  });
  diagnostics.push(...normalized.diagnostics);
  if (!normalized.normalized) {
    return rejected(planId, parsed.plan, diagnostics, input);
  }
  const plan = normalized.normalized;

  // 4. PHASE 2.7 — IMAGE-DERIVED RECONSTRUCTION.
  // For a real vision interpretation of an accepted master image, the image is
  // the only source of geometry. The reconstruction is attempted first, and its
  // outcome decides the result: there is no template to fall back to.
  if (input.interpretationSource === 'provider' && input.imageSource) {
    const reconstruction = reconstructFromAcceptedImage(
      plan,
      input.payload,
      input.requirements,
      input.projectId,
      input.projectName,
      input.imageSource,
    );

    if (!reconstruction.ok) {
      // Surface the ACTUAL conversion error. Nothing is substituted.
      diagnostics.push({
        code: reconstruction.errorCode,
        severity: 'error',
        message: reconstruction.message,
      });
      return {
        ...rejected(planId, plan, diagnostics, input),
        conversionError: {
          code: reconstruction.errorCode,
          message: reconstruction.message,
          detail: reconstruction.detail,
        },
      };
    }

    const reconstructed = reconstruction.building;

    // Report every traceable adjustment, and call out the material ones.
    for (const adjustment of reconstruction.adjustments) {
      diagnostics.push({
        code: adjustment.material ? 'IMAGE_CAD_MATERIAL_ADJUSTMENT' : 'IMAGE_CAD_ADJUSTMENT',
        severity: adjustment.material ? 'warning' : 'info',
        message: adjustment.description,
      });
    }
    // Features the image showed but conversion could not place are shown,
    // never invented.
    for (const feature of reconstruction.unplacedFeatures) {
      diagnostics.push({
        code: 'IMAGE_CAD_FEATURE_NOT_PLACED',
        severity: 'warning',
        message: feature,
      });
    }

    // 5. CAD FIDELITY GATE — its own score, never the image-quality score.
    const fidelity = evaluateCadFidelity({
      building: reconstructed,
      plan,
      comparedArtifactId: input.imageSource.artifactId,
      materialAdjustments: reconstruction.adjustments.filter(a => a.material).map(a => a.description),
      unplacedFeatures: reconstruction.unplacedFeatures,
    });
    diagnostics.push({
      code: 'CAD_FIDELITY_EVALUATED',
      severity: fidelity.passed ? 'success' : 'error',
      message: `CAD fidelity ${fidelity.overallScore}/100 (threshold ${fidelity.threshold}) against image ${fidelity.comparedArtifactId}. ${fidelity.dimensions.map(d => `${d.label} ${d.score}`).join(' · ')}`,
    });
    for (const missing of fidelity.missingMandatory) {
      diagnostics.push({ code: 'CAD_FIDELITY_MISSING_FEATURE', severity: 'error', message: missing });
    }

    // 6. Acceptance: integrity and requested programme are blocking; room-size
    //    advisories are reported and carried, never a reason to discard the
    //    user's accepted design.
    const assessment = assessReconstruction(reconstructed, plan, input.requirements);
    diagnostics.push(...assessment.integrityIssues, ...assessment.programmeIssues, ...assessment.sizeAdvisories);

    const reconstructionValidation: ExtractedPlanValidation = {
      isValid: assessment.accepted,
      recommendedForEditing: assessment.accepted,
      geometryHealthy: assessment.geometryHealthy,
      overallScore: fidelity.overallScore,
      verificationIssues: [...assessment.integrityIssues, ...assessment.programmeIssues],
    };

    // Acceptance for the AI-to-CAD path needs a faithful reconstruction AND a
    // structurally usable model. Spaces the IMAGE never drew are reported, not
    // substituted — the user adds them in the editor.
    const accepted = fidelity.passed && assessment.accepted;

    const failureReason = !fidelity.passed
      ? {
          code: 'CAD_FIDELITY_BELOW_THRESHOLD',
          message: `The reconstruction scored ${fidelity.overallScore}/100 against the accepted image (threshold ${fidelity.threshold})${fidelity.missingMandatory.length ? ` and ${fidelity.missingMandatory.length} mandatory feature(s) are unaccounted for` : ''}. No substitute plan was created.`,
          detail: { fidelity } as Readonly<Record<string, unknown>>,
        }
      : assessment.integrityIssues.length > 0
        ? {
            code: 'IMAGE_CAD_GEOMETRY_INVALID',
            message: `The geometry reconstructed from the accepted image is not a usable editable plan: ${assessment.integrityIssues.slice(0, 4).map(i => i.message).join(' ')} No substitute plan was created.`,
            detail: { issues: assessment.integrityIssues.map(i => i.message) } as Readonly<Record<string, unknown>>,
          }
        : null;

    return {
      status: accepted ? 'ACCEPTED' : 'REJECTED',
      planId,
      extractedPlan: plan,
      building: accepted ? reconstructed : null,
      validation: reconstructionValidation,
      diagnostics,
      interpretationSource: input.interpretationSource,
      confidence: input.confidence,
      geometrySource: 'IMAGE_RECONSTRUCTION',
      cadFidelity: fidelity,
      ...(failureReason ? { conversionError: failureReason } : {}),
    };
  }

  // Non-image path (locally synthesized interpretation, no image identity):
  // convert the extracted plan directly and let hard validation decide. This
  // path is explicitly NOT presented as a converted AI image.
  const conversion = extractPlanToBuilding(plan, site, input.projectId, input.projectName);
  diagnostics.push(...conversion.diagnostics);
  if (!conversion.building) {
    return rejected(planId, plan, diagnostics, input);
  }

  const withOpenings = attachExtractedOpenings(conversion.building, plan, {
    plotWidth: site.plotWidth,
    plotDepth: site.plotDepth,
  });
  diagnostics.push(...withOpenings.diagnostics);

  const candidateBuilding = withOpenings.building;
  const validation = validateExtractedPlan(candidateBuilding, plan, input.requirements);
  diagnostics.push(...validation.verificationIssues);

  return {
    status: validation.isValid ? 'ACCEPTED' : 'REJECTED',
    planId,
    extractedPlan: plan,
    building: validation.isValid ? candidateBuilding : null,
    validation,
    diagnostics,
    interpretationSource: input.interpretationSource,
    confidence: input.confidence,
    geometrySource: 'EXTRACTED_DIRECT',
  };
}

function rejected(
  planId: string,
  extractedPlan: ExtractedPlan | null,
  diagnostics: readonly DiagnosticFragment[],
  input: ExtractionPipelineInput,
): ExtractionPipelineResult {
  return {
    status: 'REJECTED',
    planId,
    extractedPlan,
    building: null,
    validation: null,
    diagnostics,
    interpretationSource: input.interpretationSource,
    confidence: input.confidence,
  };
}
