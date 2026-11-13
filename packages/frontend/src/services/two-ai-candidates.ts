/**
 * Phase 3 recovery — honest presentation of Two-AI generation outcomes.
 *
 * Pure view-model helpers (no React) so the rules are unit-testable:
 * - A numeric architectural score is shown ONLY when a real Gemini evaluation
 *   exists. A visual-preflight rejection is "Rejected at visual preflight —
 *   not scored", never "0/100".
 * - A FALLBACK_DETERMINISTIC candidate is labelled as coming from the
 *   deterministic planner and is never described as AI/FLUX generated.
 */

import type {
  CandidateAcceptanceState,
  CandidateRejectionStage,
  CandidateSource,
  MultiFloorGenerationStatus,
  OrchestratedCandidateResult,
  PipelineStagesState,
  TwoAIGenerationResult,
} from './backend-api';

/** Three distinct states (Phase 5): never one numeric field for all of them. */
export type CandidateScoreView =
  | { readonly kind: 'SCORED'; readonly score: number; readonly label: string }
  | { readonly kind: 'NOT_SCORED'; readonly label: string; readonly reason: string }
  | { readonly kind: 'REJECTED'; readonly label: string; readonly reason: string };

export interface CandidateSourceView {
  readonly source: CandidateSource;
  readonly label: string;
  readonly visualLabel: string;
  readonly isAiGenerated: boolean;
  readonly description: string;
}

export interface RejectedAttemptView {
  readonly id: string;
  readonly attempt: number | null;
  readonly seed: number;
  readonly artifactId: string;
  readonly stage: CandidateRejectionStage;
  readonly headline: string;
  readonly reasons: readonly string[];
}

export interface GenerationOutcomeView {
  readonly candidateSource: CandidateSource | null;
  /** Truthful label of the accepted candidate's source (image model from provenance), null when none. */
  readonly acceptedSourceLabel: string | null;
  readonly fallbackUsed: boolean;
  readonly fallbackMessage: string | null;
  readonly attemptsUsed: number;
  readonly maxAttemptsPerCandidate: number;
  readonly rejectedAttempts: readonly RejectedAttemptView[];
  /** Real stage rows: the authoritative candidate's own stages, else the run summary. */
  readonly stageRows: readonly StageRow[];
  readonly stageRowsSource: 'CANDIDATE' | 'RUN_SUMMARY';
  readonly multiFloorStatus?: MultiFloorGenerationStatus;
}

export const FALLBACK_NOTICE =
  'AI visual generation did not produce an acceptable candidate after the allowed attempts. ' +
  'A deterministic apartment plan has been generated instead.';

export function candidateSourceOf(
  candidate: Pick<OrchestratedCandidateResult, 'source'> & {
    readonly artifact?: { readonly provider?: string; readonly model?: string } | null;
    readonly savedArtifact?: { readonly provider?: string; readonly model?: string } | null;
  },
): CandidateSource {
  if (candidate.source) return candidate.source;
  const prov = (candidate.artifact?.provider ?? (candidate as any).savedArtifact?.provider ?? '').toUpperCase();
  if (prov === 'GEMINI') return 'GEMINI';
  if (prov === 'POLLINATIONS') return 'POLLINATIONS';
  if (prov === 'DETERMINISTIC_FALLBACK') return 'FALLBACK_DETERMINISTIC';
  return 'FLUX';
}

/** Score badge: numeric only for a real Gemini evaluation of a hard-valid plan. */
export function describeCandidateScore(
  candidate: Pick<OrchestratedCandidateResult, 'evaluation' | 'rejectionStage' | 'status'> &
    Partial<Pick<OrchestratedCandidateResult, 'evaluationStatus'>> & {
      readonly masterEvaluation?: { readonly passed?: boolean; readonly overallScore?: number; readonly hardConstraintViolations?: readonly string[] } | null;
    },
): CandidateScoreView {
  if (candidate.masterEvaluation && typeof candidate.masterEvaluation.overallScore === 'number') {
    const mScore = Math.round(candidate.masterEvaluation.overallScore);
    const mPass = Boolean(candidate.masterEvaluation.passed && mScore >= 80 && (candidate.masterEvaluation.hardConstraintViolations?.length ?? 0) === 0);
    if (mPass && candidate.status !== 'REJECTED') {
      return { kind: 'SCORED', score: mScore, label: `Accepted: ${mScore}/100 (≥80)` };
    }
    const violations = candidate.masterEvaluation.hardConstraintViolations ?? [];
    return {
      kind: 'REJECTED',
      label: `Rejected: ${mScore}/100 (<80)`,
      reason: violations.length > 0 ? violations.join(' · ') : `Quality gate requires ≥ 80/100 (scored ${mScore}/100).`,
    };
  }
  const score = candidate.evaluation?.overallScore;
  if (candidate.status !== 'REJECTED' && candidate.evaluation && typeof score === 'number' && Number.isFinite(score)) {
    const rounded = Math.round(score);
    return { kind: 'SCORED', score: rounded, label: `Gemini (advisory): ${rounded}/100` };
  }
  if (candidate.rejectionStage === 'QUALITY_GATE') {
    return {
      kind: 'REJECTED',
      label: 'Rejected by architectural quality gate (<80/100)',
      reason: 'The master image did not meet the 80/100 architectural quality threshold.',
    };
  }
  if (candidate.rejectionStage === 'VISUAL_PREFLIGHT') {
    return {
      kind: 'REJECTED',
      label: 'Rejected at visual preflight — not scored',
      reason: 'The image failed the apartment visual preflight, so no architectural evaluation ran.',
    };
  }
  if (candidate.status === 'REJECTED') {
    return {
      kind: 'REJECTED',
      label: 'Rejected at hard validation — not scored',
      reason: 'The plan did not pass deterministic hard validation, so no architectural evaluation ran.',
    };
  }
  if (candidate.evaluationStatus === 'UNAVAILABLE') {
    return {
      kind: 'NOT_SCORED',
      label: 'Gemini evaluation unavailable — not scored',
      reason: 'The plan passed hard validation, but the advisory Gemini evaluation call failed.',
    };
  }
  if (candidate.evaluationStatus === 'NOT_CONFIGURED') {
    return {
      kind: 'NOT_SCORED',
      label: 'Not scored (Gemini not configured)',
      reason: 'The plan passed hard validation; no Gemini provider is configured on the server.',
    };
  }
  return {
    kind: 'NOT_SCORED',
    label: 'Not scored',
    reason: 'No Gemini architectural evaluation is available for this plan.',
  };
}

/** Shown wherever an advisory score appears. */
export const ADVISORY_EVALUATION_NOTICE =
  'Advisory AI assessment only — not legal approval, code compliance, structural certification or professional approval. ' +
  'Hard validation decides validity. PROFESSIONAL REVIEW REQUIRED.';

const ADVISORY_CATEGORY_LABELS: ReadonlyArray<readonly [keyof NonNullable<OrchestratedCandidateResult['evaluation']>, string]> = [
  ['requirementSatisfaction', 'Requirement satisfaction'],
  ['spatialQuality', 'Spatial quality'],
  ['circulation', 'Circulation'],
  ['adjacency', 'Adjacency'],
  ['zoning', 'Zoning'],
  ['privacy', 'Privacy'],
  ['daylight', 'Daylight'],
  ['efficiency', 'Efficiency'],
  ['roomProportions', 'Room proportions'],
  ['orientation', 'Orientation'],
];

export interface AdvisoryCategory {
  readonly key: string;
  readonly label: string;
  readonly score: number;
}

/** The evaluator's existing categories (no new ones), only those actually returned. */
export function advisoryCategories(evaluation: OrchestratedCandidateResult['evaluation'] | null | undefined): AdvisoryCategory[] {
  if (!evaluation) return [];
  const out: AdvisoryCategory[] = [];
  for (const [key, label] of ADVISORY_CATEGORY_LABELS) {
    const value = evaluation[key];
    if (typeof value === 'number' && Number.isFinite(value)) out.push({ key, label, score: Math.round(value) });
  }
  return out;
}

// ─── Honest stage rows (Phase 5) ─────────────────────────────────────────────

export type StageRowState = 'done' | 'failed' | 'warning' | 'not_run' | 'pending';

export interface StageRow {
  readonly key: string;
  readonly label: string;
  readonly state: StageRowState;
  readonly detail: string;
}

export const PIPELINE_STAGE_LABELS: ReadonlyArray<readonly [string, string]> = [
  ['requirements', 'Understanding requirements'],
  ['feasibility', 'Checking feasibility'],
  ['imageGeneration', 'Generating image'],
  ['imageArtifact', 'Image saved'],
  ['visualPreflight', 'Visual preflight'],
  ['imageInterpretation', 'Interpreting image'],
  ['imageTo2D', 'Building 2D plan'],
  ['validation', 'Hard validation'],
  ['geminiEvaluation', 'Gemini evaluation (advisory)'],
];

/** While the single server request is in flight nothing is marked complete. */
export function inFlightStageRows(): StageRow[] {
  return PIPELINE_STAGE_LABELS.map(([key, label]) => ({ key, label, state: 'pending', detail: 'Awaiting server result' }));
}

function mapStage(key: string, value: string | undefined): { state: StageRowState; detail: string } {
  switch (value) {
    case 'SUCCESS':
    case 'AVAILABLE':
    case 'PASSED':
      return { state: 'done', detail: key === 'geminiEvaluation' ? 'Advisory score returned' : 'Completed' };
    case 'FAILED':
    case 'AUTH_ERROR':
      return {
        state: 'failed',
        detail: key === 'geminiEvaluation' ? 'Gemini evaluation unavailable'
          : key === 'validation' ? 'Hard validation failed'
          : value === 'AUTH_ERROR' ? 'Provider not configured / unauthorised' : 'Failed',
      };
    case 'TEMPORARILY_UNAVAILABLE':
      return { state: 'failed', detail: 'Provider temporarily unavailable' };
    case 'REJECTED':
      return { state: 'failed', detail: 'Rejected at visual preflight' };
    case 'UNAVAILABLE':
      return { state: 'failed', detail: 'Preflight could not run' };
    case 'EXHAUSTED':
      return { state: 'warning', detail: 'All bounded FLUX attempts were rejected' };
    case 'SKIPPED':
      return { state: 'not_run', detail: key === 'geminiEvaluation' ? 'Not scored' : 'Not run' };
    default:
      return { state: 'not_run', detail: 'Not reached' };
  }
}

const EARLY_FAILURE_STAGE: Readonly<Record<string, 'requirements' | 'feasibility'>> = {
  completeness: 'requirements',
  requirements: 'requirements',
  feasibility: 'feasibility',
  schematic_validation: 'feasibility',
};

/**
 * Rows from the REAL per-stage state reported by the server. Nothing is
 * inferred from elapsed time; a stage the server did not report as completed
 * is never shown as completed.
 */
export function describePipelineStages(input: {
  readonly stages?: Partial<PipelineStagesState> | null;
  readonly error?: { readonly stage?: string } | null;
  readonly requirementsUnderstood: boolean;
}): StageRow[] {
  const early = input.error?.stage ? EARLY_FAILURE_STAGE[input.error.stage] : undefined;
  const reachedPipeline = Boolean(input.stages) && !early;
  return PIPELINE_STAGE_LABELS.map(([key, label]) => {
    if (key === 'requirements') {
      if (early === 'requirements') return { key, label, state: 'failed', detail: 'Brief incomplete' };
      // The feasibility gate only runs on a complete, understood brief.
      return input.requirementsUnderstood || reachedPipeline || early === 'feasibility'
        ? { key, label, state: 'done', detail: 'Completed' }
        : { key, label, state: 'not_run', detail: 'Not reached' };
    }
    if (key === 'feasibility') {
      if (early === 'feasibility') return { key, label, state: 'failed', detail: 'Not feasible on this site' };
      if (early === 'requirements') return { key, label, state: 'not_run', detail: 'Not reached' };
      return reachedPipeline ? { key, label, state: 'done', detail: 'Completed' } : { key, label, state: 'not_run', detail: 'Not reached' };
    }
    if (!reachedPipeline) return { key, label, state: 'not_run', detail: 'Not reached' };
    const mapped = mapStage(key, (input.stages as Record<string, string | undefined>)[key]);
    return { key, label, ...mapped };
  });
}

/**
 * Truthful label for the image model that produced an artifact (from the
 * stored provenance), e.g. "Cloudflare FLUX" or "Pollinations (qwen/qwen-image-2.1)".
 */
export function imageProviderLabel(artifact?: { readonly provider?: string; readonly model?: string } | null): string {
  const provider = (artifact?.provider ?? '').toLowerCase();
  if (provider === 'gemini') return `Gemini${artifact?.model ? ` (${artifact.model})` : ''}`;
  if (provider === 'pollinations') return `Pollinations${artifact?.model ? ` (${artifact.model})` : ''}`;
  if (provider === 'cloudflare' || provider === 'cloudflare-workers-ai' || provider === 'flux' || provider === '') return 'Cloudflare FLUX';
  return artifact?.model ? `${artifact.provider} (${artifact.model})` : String(artifact?.provider);
}

export function describeCandidateSource(
  candidate: Pick<OrchestratedCandidateResult, 'source'> & { readonly artifact?: { readonly provider?: string; readonly model?: string } | null },
): CandidateSourceView {
  const src = candidateSourceOf(candidate);
  if (src === 'DETERMINISTIC_CAD') {
    return {
      source: 'DETERMINISTIC_CAD',
      label: 'Deterministic Stepped CAD',
      visualLabel: 'Stepped 2D CAD Blueprint',
      isAiGenerated: false,
      description: 'Deterministic Stepped-Polygon CAD Engine. Zero external image latency.',
    };
  }
  if (src === 'FALLBACK_DETERMINISTIC') {
    return {
      source: 'FALLBACK_DETERMINISTIC',
      label: 'Deterministic planner (fallback)',
      visualLabel: 'Deterministic Base Plan',
      isAiGenerated: false,
      description: `${FALLBACK_NOTICE} Source: Deterministic planner.`,
    };
  }
  const label = imageProviderLabel(candidate.artifact);
  const isFlux = src === 'FLUX' || label === 'Cloudflare FLUX';
  const isGemini = src === 'GEMINI' || label.startsWith('Gemini');
  return {
    source: src,
    label,
    visualLabel: isGemini ? 'Concept Image (Gemini)' : isFlux ? 'Concept Image (FLUX)' : 'Concept Image (AI)',
    isAiGenerated: true,
    description: `AI Floor Plan (${label} + Gemini Vision). Validated canonical geometry.`,
  };
}

/**
 * Strict fail-closed gate: A candidate may ONLY be applied to the project if:
 * 1. Building exists and is not null.
 * 2. Status is not REJECTED.
 * 3. AcceptanceState is not QUALITY_REJECTED (if set, must be READY_FOR_EDITING).
 * 4. Master evaluation passed (overallScore >= 80, passed === true, 0 hard violations).
 * 5. Deterministic validation passed.
 */
export function isCandidateAppliable(cand?: {
  readonly status?: string;
  readonly acceptanceState?: CandidateAcceptanceState;
  readonly masterEvaluation?: { readonly passed?: boolean; readonly overallScore?: number; readonly hardConstraintViolations?: readonly string[] } | null;
  readonly validation?: { readonly isValid?: boolean } | null;
  readonly building?: any | null;
} | null): boolean {
  if (!cand || !cand.building) return false;
  if (cand.status === 'REJECTED') return false;
  if (cand.acceptanceState && cand.acceptanceState !== 'READY_FOR_EDITING') return false;
  if (cand.masterEvaluation) {
    if (!cand.masterEvaluation.passed) return false;
    if (typeof cand.masterEvaluation.overallScore === 'number' && cand.masterEvaluation.overallScore < 80) return false;
    if (cand.masterEvaluation.hardConstraintViolations && cand.masterEvaluation.hardConstraintViolations.length > 0) return false;
  }
  if (cand.validation && cand.validation.isValid === false) return false;
  return true;
}

export function summarizeRejectedAttempts(result: Pick<TwoAIGenerationResult, 'candidates'>): RejectedAttemptView[] {
  return (result.candidates ?? [])
    .filter(c => c.status === 'REJECTED')
    .map(c => {
      const stage: CandidateRejectionStage = c.rejectionStage ?? 'HARD_VALIDATION';
      const reasons = c.validation?.verificationIssues?.filter(i => i.severity === 'error').map(i => i.message) ?? [];
      const headline =
        stage === 'QUALITY_GATE'
          ? 'Rejected at architectural quality gate (<80/100)'
          : stage === 'VISUAL_PREFLIGHT'
          ? 'Rejected at visual preflight'
          : stage === 'CAD_RECONSTRUCTION'
          ? 'Rejected at CAD reconstruction'
          : stage === 'IMAGE_INTERPRETATION'
          ? 'Rejected at image interpretation'
          : 'Rejected at hard validation';
      return {
        id: c.id,
        attempt: c.attempt ?? null,
        seed: c.seed,
        artifactId: c.artifact?.generationId ?? '',
        stage,
        headline,
        reasons: reasons.length > 0 ? reasons : (c.rejectedReason ? [c.rejectedReason] : []),
      };
    });
}

export function summarizeGenerationOutcome(result: TwoAIGenerationResult): GenerationOutcomeView {
  const accepted = (result.candidates ?? []).find(c => c.status === 'ACCEPTED');
  const candidateSource = result.candidateSource ?? (accepted ? candidateSourceOf(accepted) : null);
  return {
    candidateSource,
    acceptedSourceLabel: accepted
      ? describeCandidateSource(accepted).label
      : candidateSource === 'DETERMINISTIC_CAD'
      ? 'Deterministic Stepped CAD'
      : candidateSource === 'FALLBACK_DETERMINISTIC'
      ? 'Deterministic planner'
      : null,
    fallbackUsed: Boolean(result.fallback?.used),
    fallbackMessage: result.fallback?.used ? `${FALLBACK_NOTICE} Source: Deterministic planner.` : null,
    attemptsUsed: result.visualAttempts?.attempted ?? 0,
    maxAttemptsPerCandidate: result.visualAttempts?.maxPerCandidate ?? 0,
    rejectedAttempts: summarizeRejectedAttempts(result),
    stageRows: describePipelineStages({
      stages: accepted?.stages ?? result.stages ?? null,
      error: result.error ?? null,
      requirementsUnderstood: Boolean(result.requirements),
    }),
    stageRowsSource: accepted?.stages ? 'CANDIDATE' : 'RUN_SUMMARY',
    multiFloorStatus: result.multiFloorStatus,
  };
}

// ─── Two-phase upgrade: four controlled concept cards ────────────────────────

export type ConceptCardStatus = 'VALID' | 'REJECTED' | 'GENERATION_FAILED';

export interface ConceptCardView {
  readonly candidateNumber: number;
  /** "Candidate 01 — Balanced / symmetric". */
  readonly title: string;
  readonly strategy: string;
  readonly intent: string;
  readonly seed: number;
  readonly candidateId: string | null;
  readonly status: ConceptCardStatus;
  /** Original FLUX image (null when the FLUX call failed). */
  readonly imageDataUrl: string | null;
  /** Deterministic schematic sent to FLUX as input image 1. */
  readonly schematicDataUrl: string | null;
  readonly preflightLabel: string;
  readonly score: CandidateScoreView;
  readonly reasons: readonly string[];
  /** Only a hard-valid candidate with a canonical plan can be applied — by the user. */
  readonly canApply: boolean;
  readonly referenceIds: readonly string[];
  /** Distinct references available to the backend (null when not reported). */
  readonly distinctReferencesAvailable: number | null;
  readonly layoutChecksLabel: string;
  /** Image model that produced this concept (from artifact provenance); null when no image. */
  readonly imageModelLabel: string | null;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

function preflightLabelOf(candidate: OrchestratedCandidateResult | undefined): string {
  if (!candidate) return 'Not run (no image)';
  const pf = candidate.stages?.visualPreflight;
  if (candidate.rejectionStage === 'VISUAL_PREFLIGHT') return pf === 'UNAVAILABLE' ? 'Preflight unavailable' : 'Preflight: rejected';
  if (pf === 'PASSED' || candidate.preflight?.pass) return 'Preflight: passed';
  if (pf === 'SKIPPED') return 'Preflight: not configured';
  return 'Preflight: not run';
}

/**
 * One card per concept slot, in candidate order. Rejected cards carry their
 * reasons and "Not scored"; a numeric score appears only for a real Gemini
 * evaluation of a hard-valid plan (never 0/100 for a rejection).
 */
export function describeConceptCards(result: Pick<TwoAIGenerationResult, 'candidates' | 'conceptSlots'>): ConceptCardView[] {
  const slots = result.conceptSlots ?? [];
  const candidates = result.candidates ?? [];
  return [...slots]
    .sort((a, b) => a.candidateNumber - b.candidateNumber)
    .map(slot => {
      const cand = slot.candidateId ? candidates.find(c => c.id === slot.candidateId) : undefined;
      const concept = cand?.concept;
      const title = `Concept ${pad2(slot.candidateNumber)} — ${slot.label}`;
      const distinctReferencesAvailable = slot.distinctReferencesAvailable ?? null;
      if (!cand || slot.status === 'GENERATION_FAILED') {
        return {
          candidateNumber: slot.candidateNumber,
          title,
          strategy: slot.strategy,
          intent: '',
          seed: slot.seed,
          candidateId: null,
          status: 'GENERATION_FAILED' as const,
          imageDataUrl: null,
          schematicDataUrl: null,
          preflightLabel: 'Not run (no image)',
          score: { kind: 'NOT_SCORED' as const, label: 'Not scored', reason: 'FLUX did not return an image for this concept.' },
          reasons: [`FLUX image generation failed: ${slot.error ?? 'unknown error'}`],
          canApply: false,
          referenceIds: slot.referenceIds,
          distinctReferencesAvailable,
          layoutChecksLabel: '',
          imageModelLabel: null,
        };
      }
      const valid = cand.status === 'ACCEPTED' && cand.building !== null;
      const errors = cand.validation?.verificationIssues?.filter(i => i.severity === 'error').map(i => i.message) ?? [];
      return {
        candidateNumber: slot.candidateNumber,
        title,
        strategy: slot.strategy,
        intent: concept?.intent ?? '',
        seed: cand.seed,
        candidateId: cand.id,
        status: valid ? ('VALID' as const) : ('REJECTED' as const),
        imageDataUrl: cand.artifact?.imageBase64 ? `data:${cand.artifact.mimeType};base64,${cand.artifact.imageBase64}` : null,
        schematicDataUrl: concept?.schematicPngBase64 ? `data:image/png;base64,${concept.schematicPngBase64}` : null,
        preflightLabel: preflightLabelOf(cand),
        score: describeCandidateScore(cand),
        reasons: valid ? [] : errors.length > 0 ? errors : cand.rejectedReason ? [cand.rejectedReason] : [],
        canApply: valid,
        referenceIds: slot.referenceIds,
        distinctReferencesAvailable,
        layoutChecksLabel: concept ? `Deterministic layout checks: ${concept.spatialChecksPassed}/${concept.spatialChecksTotal} passed` : '',
        imageModelLabel: cand.artifact ? imageProviderLabel(cand.artifact) : null,
      };
    });
}
