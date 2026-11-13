/**
 * AI Concept Image panel — Master PRD Phase 2 (§17/§18) & Phase 2.5 Image-Driven CAD & Editing.
 *
 * Drives the real end-to-end Phase 2 / 2.5 loop for a user:
 *   Enter Requirements -> Feasibility -> Generate -> Receive AI Floor Plan Image
 *   -> Edit with instructions / Regenerate -> Interpret with Gemini Vision
 *   -> Normalize into Editable 2D/3D CAD -> Switch between Revision History
 *
 * Honesty rules enforced here:
 *  - The image is labelled an AI concept, NOT a validated plan (PRD §7).
 *  - No fake progress: real pending/error states only; the failed stage is named.
 *  - Regeneration/editing always produces a NEW immutable artifact (PRD §24).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  History,
  ImageOff,
  Loader2,
  Maximize2,
  RefreshCw,
  Sparkles,
  TriangleAlert,
  Wand2,
  ZoomIn,
  ZoomOut,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Building } from '@ai-floor-planner/core';
import type { MasterImageEvaluationResult } from '@ai-floor-planner/ai-orchestration';
import { BackendAPI, BackendError, type CadFidelityReportResult } from '../../services/backend-api';
import {
  compileImageRequest,
  imageContextSignature,
  imageDataUrl,
  resolveImageRequirements,
  computeRequirementsFingerprint,
} from '../../services/ai-concept-image';
import {
  CURRENT_PROJECT_SCHEMA_VERSION,
  projectStorage,
  type FloorPlanImageRevision,
  type FloorPlanImageSession,
  type ProjectEnvelope,
} from '../../services/storage';
import { isCandidateAppliable } from '../../services/two-ai-candidates';

export interface AiConceptImagePanelProps {
  projectId: string;
  /** The live envelope from the workspace, used for freshness comparison. */
  envelope: ProjectEnvelope;
  /** Invoked when a generated or edited concept image is interpreted and synchronized into canonical 2D/3D CAD. */
  onCadSynchronized?: (
    building: Building,
    artifact: {
      generationId: string;
      mimeType: string;
      imageBase64: string;
      model: string;
      provider: string;
      editInstruction?: string;
    },
  ) => void;
  /** Optional callback to switch directly to the 2D Floor Plan editor after syncing CAD. */
  onOpen2DFloorPlan?: () => void;
}

const QUICK_EDIT_SUGGESTIONS = [
  'Make the living room larger and widen the front verandah',
  'Move the kitchen toward the southeast Vastu zone',
  'Improve dining-living circulation and foyer entry',
  'Add a sunlit central courtyard / OTS',
] as const;

export const AiConceptImagePanel: React.FC<AiConceptImagePanelProps> = ({
  projectId,
  envelope,
  onCadSynchronized,
  onOpen2DFloorPlan,
}) => {
  const backend = useMemo(() => new BackendAPI(), []);
  const running = useRef<AbortController>();
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      running.current?.abort();
    };
  }, []);

  const [session, setSession] = useState<FloorPlanImageSession | undefined>(() => {
    const saved = projectStorage.load(projectId)?.floorPlanImage ?? envelope.floorPlanImage;
    return saved ?? undefined;
  });
  const [revisions, setRevisions] = useState<FloorPlanImageRevision[]>(() => {
    const saved = projectStorage.load(projectId)?.imageRevisions ?? envelope.imageRevisions;
    return saved ? [...saved] : [];
  });
  const [busy, setBusy] = useState(false);
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [error, setError] = useState<{ code: string; message: string } | undefined>();
  const [healthInfo, setHealthInfo] = useState<{ provider: string; model: string; reachable: boolean; detail?: string } | undefined>();
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [editInstruction, setEditInstruction] = useState<string>('');
  const [cadSyncMessage, setCadSyncMessage] = useState<string | undefined>();
  /**
   * Image-to-CAD fidelity for the last conversion attempt. Shown separately
   * from the Gemini image-quality score, because a good-looking image is not
   * evidence that the conversion reproduced it.
   */
  const [cadFidelity, setCadFidelity] = useState<CadFidelityReportResult | undefined>();
  /** Warnings and errors the conversion reported, shown rather than swallowed. */
  const [conversionDiagnostics, setConversionDiagnostics] = useState<
    readonly { code: string; severity: string; message: string }[]
  >([]);
  const [showRubricBreakdown, setShowRubricBreakdown] = useState<boolean>(true);

  useEffect(() => {
    backend.checkHealth().then(h => {
      if (mounted.current && h.imageGeneration) {
        setHealthInfo({
          provider: h.imageGeneration.provider,
          model: h.imageGeneration.model,
          reachable: h.imageGeneration.reachable,
          detail: h.imageGeneration.detail,
        });
      }
    }).catch(() => {});
  }, [backend]);

  useEffect(() => {
    const loaded = projectStorage.load(projectId);
    setSession(loaded?.floorPlanImage ?? envelope.floorPlanImage ?? undefined);
    setRevisions(loaded?.imageRevisions ? [...loaded.imageRevisions] : (envelope.imageRevisions ? [...envelope.imageRevisions] : []));
  }, [projectId, envelope.floorPlanImage?.generationId]);

  const requirements = useMemo(() => resolveImageRequirements(envelope), [envelope]);
  const liveSignature = imageContextSignature(envelope.building);
  const currentFingerprint = useMemo(() => computeRequirementsFingerprint(envelope), [envelope]);
  const isRequirementsOutdated = Boolean(
    session?.requirementsFingerprint && session.requirementsFingerprint !== currentFingerprint
  );
  const stale = (!!session && session.contextSignature !== liveSignature) || isRequirementsOutdated;

  const PIPELINE_STAGES = [
    'Preparing architectural reference',
    'Generating concept image',
    'Receiving image artifact',
    'Interpreting with Gemini Vision',
    'Validating geometry',
    'Creating editable CAD model',
    'Completing architectural evaluation',
  ] as const;

  const executeGeneration = useCallback(async (instruction?: string, useReferenceImage?: boolean) => {
    if (busy) return;
    const attempt = (session?.attempt ?? -1) + 1;
    const trimmedInstruction = instruction?.trim();
    const request = compileImageRequest(envelope, attempt, {
      editInstruction: trimmedInstruction || undefined,
      referenceImage: useReferenceImage && session
        ? { mimeType: session.mimeType, imageBase64: session.imageBase64 }
        : undefined,
    });
    if (!request) {
      setError({ code: 'IMAGE_REQUIREMENTS_MISSING', message: 'Save a reviewed Space Program before requesting a concept image.' });
      return;
    }
    setBusy(true);
    setCurrentStage(1);
    setError(undefined);
    setCadSyncMessage(undefined);
    const controller = new AbortController();
    running.current = controller;
    try {
      setCurrentStage(2);
      const artifact = await backend.generateFloorPlanImage(projectId, request, controller.signal);
      setCurrentStage(3);
      if (!mounted.current) return;

      let synchronizedBuilding: Building | undefined;
      let masterEval: MasterImageEvaluationResult | null = null;
      if (onCadSynchronized) {
        try {
          setCurrentStage(4);
          const resumeResult = await backend.resumeTwoAIGeneration({
            artifactId: artifact.generationId,
            projectId,
            projectName: envelope.name || 'Studio Residence',
            projectType: 'single_family',
            site: {
              plotWidth: envelope.building.site.plotWidth,
              plotDepth: envelope.building.site.plotDepth,
              plannedFloorCount: Math.max(1, envelope.building.site.plannedFloorCount || envelope.building.floors.length || 1),
              roadFacing: String(envelope.building.site.roadFacing || 'North'),
              setbacks: envelope.building.site.setbacks,
              orientation: envelope.building.site.orientation,
            },
          });
          setCurrentStage(5);
          const candidate = (resumeResult.candidates ?? [])[0];
          const accepted = (resumeResult.candidates ?? []).find(c => c.status === 'ACCEPTED' && c.building);
          masterEval = (resumeResult as any)?.masterEvaluation || (accepted as any)?.masterEvaluation || null;
          setCadFidelity(candidate?.cadFidelity ?? undefined);
          setConversionDiagnostics(
            (candidate?.diagnostics ?? []).filter(d => d.severity === 'error' || d.severity === 'warning'),
          );
          if (accepted?.building && isCandidateAppliable(accepted)) {
            setCurrentStage(6);
            synchronizedBuilding = accepted.building;
            setCurrentStage(7);
          } else {
            const evalScore = masterEval?.overallScore;
            if (evalScore !== undefined && evalScore < 80) {
              setError({
                code: 'QUALITY_GATE_FAILED',
                message: `Concept image scored ${evalScore}/100 (< 80) — rejected by architectural quality gate. Not applied to 2D/3D CAD.`,
              });
            } else if (candidate?.conversionError) {
              setError({
                code: candidate.conversionError.code,
                message: candidate.conversionError.message,
              });
            }
          }
        } catch (syncErr) {
          console.warn('Vision CAD sync after image generation encountered an issue:', syncErr);
        }
      }

      if (!masterEval && artifact.imageBase64 && artifact.imageBase64.length > 100) {
        try {
          const evalRes = await backend.evaluateMasterPlan({
            requirementsSummary: `${requirements?.hard.bedroomCount ?? 2} bedrooms, ${requirements?.hard.bathroomCount ?? 2} bathrooms`,
            siteSummary: `${envelope.building.site.plotWidth}x${envelope.building.site.plotDepth}mm, road facing ${envelope.building.site.roadFacing}`,
            footprintShape: (envelope.wizardBrief as any)?.footprintShape,
            requiredBedrooms: requirements?.hard.bedroomCount ?? 2,
            requiredBathrooms: requirements?.hard.bathroomCount ?? 2,
            requiredFloors: requirements?.hard.floorsCount ?? 1,
            parkingRequired: Boolean(requirements?.hard.parkingRequired),
            imageBase64: artifact.imageBase64,
            imageMimeType: artifact.mimeType,
            attemptNumber: attempt + 1,
          });
          masterEval = evalRes.evaluation;
        } catch (eErr) {
          console.warn('Direct master evaluation failed in executeGeneration:', eErr);
        }
      }

      const activeBuildingForSig = synchronizedBuilding ?? envelope.building;
      const nextSignature = imageContextSignature(activeBuildingForSig);
      const next: FloorPlanImageSession = {
        schemaVersion: 1,
        generationId: artifact.generationId,
        seed: artifact.seed,
        attempt,
        generatedAt: artifact.generatedAt,
        promptVersion: artifact.promptVersion,
        model: artifact.model,
        provider: artifact.provider,
        mimeType: artifact.mimeType,
        imageBase64: artifact.imageBase64,
        request,
        contextSignature: nextSignature,
        editInstruction: trimmedInstruction || undefined,
        requirementsFingerprint: currentFingerprint,
        evaluation: masterEval ?? null,
      };

      const current = projectStorage.load(projectId) ?? envelope;
      const existingRevisions: FloorPlanImageRevision[] = current.imageRevisions
        ? [...current.imageRevisions]
        : current.floorPlanImage
        ? [{ ...current.floorPlanImage, revisionNumber: 1 }]
        : [];
      const nextRevisionNumber = existingRevisions.length + 1;
      const newRevision: FloorPlanImageRevision = {
        ...next,
        revisionNumber: nextRevisionNumber,
        buildingSnapshot: synchronizedBuilding ?? current.building,
      };
      const updatedRevisions = [...existingRevisions, newRevision];

      projectStorage.save({
        ...current,
        schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
        building: synchronizedBuilding ?? current.building,
        floorPlanImage: next,
        imageRevisions: updatedRevisions,
        updatedAt: new Date().toISOString(),
      });
      setSession(next);
      setRevisions(updatedRevisions);
      if (trimmedInstruction) setEditInstruction('');

      if (synchronizedBuilding && onCadSynchronized) {
        onCadSynchronized(synchronizedBuilding, {
          generationId: artifact.generationId,
          mimeType: artifact.mimeType,
          imageBase64: artifact.imageBase64,
          model: artifact.model,
          provider: artifact.provider,
          editInstruction: trimmedInstruction || undefined,
        });
        setCadSyncMessage(
          trimmedInstruction
            ? `Revision #${nextRevisionNumber} generated ("${trimmedInstruction}") & synchronized with 2D/3D CAD.`
            : `Revision #${nextRevisionNumber} generated & synchronized with 2D/3D CAD.`,
        );
      }
      setCurrentStage(0);
    } catch (cause) {
      if (!mounted.current) return;
      if (cause instanceof BackendError) setError({ code: cause.code, message: cause.message });
      else setError({ code: 'IMAGE_GENERATION_FAILED', message: cause instanceof Error ? cause.message : 'Image generation failed.' });
      setCurrentStage(0);
    } finally {
      if (mounted.current) setBusy(false);
      running.current = undefined;
    }
  }, [backend, busy, envelope, onCadSynchronized, projectId, session]);

  const run = useCallback(() => {
    void executeGeneration(undefined, false);
  }, [executeGeneration]);

  const handleApplyEditInstruction = useCallback(() => {
    if (!editInstruction.trim() || busy) return;
    void executeGeneration(editInstruction.trim(), Boolean(session));
  }, [busy, editInstruction, executeGeneration, session]);

  const handleSelectRevision = useCallback((rev: FloorPlanImageRevision) => {
    if (busy) return;
    setSession(rev);
    const current = projectStorage.load(projectId);
    if (current) {
      projectStorage.save({
        ...current,
        floorPlanImage: rev,
        building: rev.buildingSnapshot ?? current.building,
        updatedAt: new Date().toISOString(),
      });
    }
    if (rev.buildingSnapshot && onCadSynchronized) {
      onCadSynchronized(rev.buildingSnapshot, {
        generationId: rev.generationId,
        mimeType: rev.mimeType,
        imageBase64: rev.imageBase64,
        model: rev.model,
        provider: rev.provider,
        editInstruction: rev.editInstruction,
      });
      setCadSyncMessage(`Restored Revision #${rev.revisionNumber} (${rev.generationId}) to 2D & 3D CAD.`);
    }
  }, [busy, onCadSynchronized, projectId]);

  const handleDownloadImage = useCallback(() => {
    if (!session) return;
    const ext = session.mimeType.includes('jpeg') || session.mimeType.includes('jpg') ? 'jpg' : 'png';
    const link = document.createElement('a');
    link.href = imageDataUrl(session.mimeType, session.imageBase64);
    link.download = `${(envelope.name || 'floor-plan-concept').replace(/\s+/g, '_')}_${session.generationId}.${ext}`;
    link.click();
  }, [envelope.name, session]);

  const handleConvertToCad = useCallback(async () => {
    if (!session || busy) return;
    if (isRequirementsOutdated) return;
    const evalObj = session.evaluation;
    const passedQuality = Boolean(
      evalObj &&
      evalObj.passed &&
      evalObj.overallScore >= 80 &&
      (evalObj.hardConstraintViolations?.length ?? 0) === 0
    );
    if (!passedQuality) return;

    const currentBuilding = projectStorage.load(projectId)?.building ?? envelope.building;
    const hasRooms = currentBuilding.floors.some(f => f.rooms.length > 0);

    if (hasRooms && onOpen2DFloorPlan) {
      onOpen2DFloorPlan();
      return;
    }

    setBusy(true);
    setError(undefined);
    try {
      const resumeResult = await backend.resumeTwoAIGeneration({
        artifactId: session.generationId,
        projectId,
        projectName: envelope.name || 'Studio Residence',
        projectType: 'single_family',
        site: {
          plotWidth: envelope.building.site.plotWidth,
          plotDepth: envelope.building.site.plotDepth,
          plannedFloorCount: Math.max(1, envelope.building.site.plannedFloorCount || envelope.building.floors.length || 1),
          roadFacing: String(envelope.building.site.roadFacing || 'North'),
          setbacks: envelope.building.site.setbacks,
          orientation: envelope.building.site.orientation,
        },
      });
      const candidate = (resumeResult.candidates ?? [])[0];
      const accepted = (resumeResult.candidates ?? []).find(c => c.status === 'ACCEPTED' && c.building);

      // Record the fidelity evaluation for display, whatever the outcome.
      setCadFidelity(candidate?.cadFidelity ?? undefined);

      if (!accepted?.building) {
        // Report the ACTUAL conversion failure. The accepted image stays as it
        // is and no substitute plan is installed.
        const reason =
          candidate?.conversionError?.message ??
          resumeResult.error?.message ??
          candidate?.rejectedReason ??
          'The accepted image could not be reconstructed into editable CAD geometry.';
        setError({
          code: candidate?.conversionError?.code ?? resumeResult.error?.code ?? 'IMAGE_TO_CAD_CONVERSION_FAILED',
          message: reason,
        });
        setConversionDiagnostics(
          (candidate?.diagnostics ?? []).filter(d => d.severity === 'error' || d.severity === 'warning'),
        );
        return;
      }

      setConversionDiagnostics(
        (accepted.diagnostics ?? []).filter(d => d.severity === 'warning'),
      );

      if (onCadSynchronized) {
        onCadSynchronized(accepted.building, {
          generationId: session.generationId,
          mimeType: session.mimeType,
          imageBase64: session.imageBase64,
          model: session.model,
          provider: session.provider,
          editInstruction: session.editInstruction,
        });
        const fidelity = accepted.cadFidelity;
        setCadSyncMessage(
          fidelity
            ? `Reconstructed into editable vector CAD from image ${fidelity.comparedArtifactId} · CAD fidelity ${fidelity.overallScore}/100.`
            : 'Floor plan converted into editable vector 2D CAD & synchronized with 3D.',
        );
      }
      if (onOpen2DFloorPlan) {
        onOpen2DFloorPlan();
      }
    } catch (cause) {
      if (!mounted.current) return;
      setError({
        code: 'CAD_CONVERSION_FAILED',
        message: cause instanceof Error ? cause.message : 'CAD conversion failed.',
      });
    } finally {
      if (mounted.current) setBusy(false);
    }
  }, [backend, busy, envelope, isRequirementsOutdated, onCadSynchronized, onOpen2DFloorPlan, projectId, session]);

  const hasProgram = !!requirements;
  const activeProvider = healthInfo?.provider ?? session?.provider ?? 'gemini';
  const activeModel = healthInfo?.model ?? session?.model ?? 'gemini-3.1-flash-lite-image';

  const evaluation = session?.evaluation;
  const isScorePassed = Boolean(
    evaluation &&
    evaluation.passed &&
    evaluation.overallScore >= 80 &&
    (evaluation.hardConstraintViolations?.length ?? 0) === 0
  );
  const evaluationScore = evaluation?.overallScore ?? 0;
  const canConvertCad = Boolean(
    session &&
    isScorePassed &&
    !isRequirementsOutdated &&
    !busy
  );

  return (
    <section className="generation-concept-image" aria-label="AI architectural concept image">
      <header className="concept-image-header">
        <div>
          <span className="eyebrow">
            SINGLE MASTER AI FLOOR PLAN · {activeProvider.toUpperCase()} ({activeModel})
            {healthInfo && !healthInfo.reachable && (
              <span style={{ color: '#DC2626', marginLeft: 8 }}>● Offline: {healthInfo.detail}</span>
            )}
            {healthInfo?.reachable && (
              <span style={{ color: '#16A34A', marginLeft: 8 }}>● Online</span>
            )}
          </span>
          <h2>Architectural Floor-Plan Concept</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {session && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleConvertToCad}
              disabled={!canConvertCad}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: !canConvertCad ? '#94A3B8' : '#1E3A2F',
                color: '#FFFFFF',
                borderColor: !canConvertCad ? '#94A3B8' : '#1E3A2F',
                cursor: !canConvertCad ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: 12,
                padding: '6px 14px',
                borderRadius: 6,
              }}
              title={
                isRequirementsOutdated
                  ? 'Requirements changed. Regenerate master concept first.'
                  : evaluation && !isScorePassed
                  ? 'Quality score must be ≥ 80/100 to convert to CAD.'
                  : 'Convert AI concept into editable 2D vector CAD & open editor'
              }
            >
              <span>Convert to Editable 2D CAD</span>
              <ArrowRight size={14} />
            </button>
          )}
          <button
            className="btn-secondary"
            onClick={run}
            disabled={busy || !hasProgram}
            title={hasProgram ? undefined : 'Save a reviewed Space Program first'}
          >
            {busy ? <Loader2 size={14} className="spin" /> : session ? <RefreshCw size={14} /> : <Sparkles size={14} />}
            {busy ? 'Generating…' : session ? 'Regenerate alternative' : 'Generate concept image'}
          </button>
        </div>
      </header>

      {/* Outdated Requirements Alert */}
      {isRequirementsOutdated && !busy && (
        <div
          role="alert"
          className="concept-image-outdated-alert"
          style={{
            padding: '12px 16px',
            margin: '12px 0',
            background: '#FFFBEB',
            border: '1px solid #FCD34D',
            borderRadius: 8,
            color: '#92400E',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <TriangleAlert size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
              Requirements Have Changed (Concept Outdated)
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.4 }}>
              The plot dimensions, road facing, setbacks, or room program were modified after this concept was generated.
              Regenerate the Master Concept to ensure the architectural design reflects your updated requirements.
            </div>
          </div>
          <button
            type="button"
            onClick={run}
            disabled={busy}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: '#D97706',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 600,
              fontSize: 12,
              cursor: busy ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Regenerate Master Concept
          </button>
        </div>
      )}

      {/* Verified 80+ Quality Gate Score Banner */}
      {evaluation && !busy && (
        <div
          className="concept-quality-badge-container"
          style={{
            padding: '12px 16px',
            background: isScorePassed ? '#F0FDF4' : '#FEF2F2',
            border: `1px solid ${isScorePassed ? '#86EFAC' : '#FCA5A5'}`,
            borderRadius: 8,
            margin: '12px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 999,
                  background: isScorePassed ? '#15803D' : '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {isScorePassed ? <CheckCircle2 size={15} /> : <TriangleAlert size={15} />}
                <span>
                  Score: {evaluationScore}/100 · {isScorePassed ? 'PASSED (≥80 Gate)' : 'REVISION REQUIRED (<80 Gate)'}
                </span>
              </div>
              <span style={{ fontSize: 12, color: isScorePassed ? '#166534' : '#991B1B', fontWeight: 500 }}>
                {isScorePassed
                  ? 'Approved for vector CAD reconstruction and multi-format export.'
                  : 'Quality score below 80 or violations present. Automatic retry or edit required before CAD conversion.'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowRubricBreakdown(v => !v)}
              style={{
                background: 'none',
                border: 'none',
                color: isScorePassed ? '#15803D' : '#DC2626',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>{showRubricBreakdown ? 'Hide 7-Category Rubric' : 'View 7-Category Rubric Breakdown'}</span>
              {showRubricBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Expandable 7-Category Rubric Breakdown */}
          {showRubricBreakdown && (
            <div
              className="concept-rubric-breakdown"
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: `1px solid ${isScorePassed ? '#BBF7D0' : '#FECACA'}`,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 12, color: '#0F172A', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>100-Point Architectural Quality Rubric</span>
                <span style={{ fontSize: 11, color: '#64748B' }}>Evaluator: {evaluation.model || 'Gemini 3.1 Flash Lite'}</span>
              </div>

              {/* 7 Categories Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginBottom: 10 }}>
                {[
                  { name: 'Compliance & Feasibility', score: evaluation.complianceScore, max: 25 },
                  { name: 'Spatial Layout & Proportions', score: evaluation.spatialLayoutScore, max: 20 },
                  { name: 'Footprint & Orientation', score: evaluation.footprintScore, max: 15 },
                  { name: 'Circulation & Openings', score: evaluation.circulationScore, max: 15 },
                  { name: 'Drafting Clarity & Style', score: evaluation.draftingClarityScore, max: 10 },
                  { name: 'Vastu & Natural Daylight', score: evaluation.vastuDaylightScore, max: 10 },
                  { name: 'Structural Coherence', score: evaluation.coherenceScore, max: 5 },
                ].map(cat => {
                  const pct = Math.round((cat.score / cat.max) * 100);
                  return (
                    <div key={cat.name} style={{ background: '#FFFFFF', padding: '6px 10px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                        <span>{cat.name}</span>
                        <span style={{ color: cat.score >= cat.max * 0.8 ? '#15803D' : '#B45309' }}>{cat.score}/{cat.max}</span>
                      </div>
                      <div style={{ height: 5, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? '#22C55E' : pct >= 60 ? '#F59E0B' : '#EF4444' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hard Violations if any */}
              {evaluation.hardConstraintViolations && evaluation.hardConstraintViolations.length > 0 && (
                <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, marginBottom: 8, fontSize: 12, color: '#991B1B' }}>
                  <strong>Hard Violations:</strong>
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: 18 }}>
                    {evaluation.hardConstraintViolations.map((v, i) => <li key={i}>{v}</li>)}
                  </ul>
                </div>
              )}

              {/* Suggested corrections */}
              {evaluation.suggestedCorrections && evaluation.suggestedCorrections.length > 0 && (
                <div style={{ padding: '8px 12px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, marginBottom: 8, fontSize: 12, color: '#1E40AF' }}>
                  <strong>Suggested Adjustments:</strong>
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: 18 }}>
                    {evaluation.suggestedCorrections.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}

              {/* Rationale */}
              {evaluation.rationale && (
                <p style={{ margin: 0, fontSize: 11, color: '#475569', fontStyle: 'italic', lineHeight: 1.4 }}>
                  <strong>Evaluator Summary:</strong> {evaluation.rationale}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {busy && (
        <div className="concept-image-progress" style={{ padding: '12px', background: '#F8FAFC', borderRadius: 8, margin: '12px 0', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Loader2 size={14} className="spin" /> Pipeline Execution Stages
          </div>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {PIPELINE_STAGES.map((st, idx) => {
              const num = idx + 1;
              const isCurrent = currentStage === num;
              const isDone = currentStage > num;
              return (
                <li key={st} style={{
                  color: isCurrent ? '#2563EB' : isDone ? '#16A34A' : '#94A3B8',
                  fontWeight: isCurrent ? 700 : isDone ? 600 : 400
                }}>
                  {st} {isCurrent ? '— (In Progress…)' : isDone ? '✓' : ''}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {!hasProgram && (
        <p className="concept-image-note"><TriangleAlert size={14} /> A reviewed Space Program is required before a concept image can be requested.</p>
      )}

      {error && (
        <p className="concept-image-error" role="alert" data-code={error.code}>
          <TriangleAlert size={14} /> {error.message}
        </p>
      )}

      {/*
        Image-to-CAD fidelity. Deliberately separate from the image-quality
        score above: this one answers "did the editable drawing reproduce the
        image?", which the picture's own score says nothing about.
      */}
      {cadFidelity && !busy && (
        <div
          className="cad-fidelity-report"
          data-testid="cad-fidelity-report"
          aria-label="Image-to-CAD fidelity"
          style={{
            padding: '12px 16px',
            margin: '12px 0',
            background: cadFidelity.passed ? '#F0F9FF' : '#FEF2F2',
            border: `1px solid ${cadFidelity.passed ? '#7DD3FC' : '#FCA5A5'}`,
            borderRadius: 8,
            fontSize: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 13 }}>
              CAD Fidelity {cadFidelity.overallScore}/100{' '}
              <span style={{ fontWeight: 500, color: '#475569' }}>
                (threshold {cadFidelity.threshold} · {cadFidelity.passed ? 'PASSED' : 'BELOW THRESHOLD'})
              </span>
            </strong>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#64748B' }}>
              vs image {cadFidelity.comparedArtifactId}
            </span>
          </div>
          <p style={{ margin: '4px 0 8px', color: '#475569' }}>
            How closely the editable vector drawing reproduces the accepted image. This is not the
            image-quality score.
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 2 }}>
            {cadFidelity.dimensions.map(dimension => (
              <li key={dimension.id} style={{ color: dimension.score >= 70 ? '#166534' : '#9A3412' }}>
                <strong>{dimension.label}: {Math.round(dimension.score)}</strong> — {dimension.detail}
                {dimension.missing.length > 0 && (
                  <ul style={{ margin: '2px 0 0', paddingLeft: 16, color: '#9A3412' }}>
                    {dimension.missing.map(item => <li key={item}>{item}</li>)}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          {cadFidelity.missingMandatory.length > 0 && (
            <div style={{ marginTop: 8, color: '#991B1B' }}>
              <strong>Unaccounted architectural features:</strong>
              <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
                {cadFidelity.missingMandatory.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}
          {cadFidelity.materialAdjustments.length > 0 && (
            <div style={{ marginTop: 8, color: '#92400E' }}>
              <strong>Adjustments that changed the original design:</strong>
              <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
                {cadFidelity.materialAdjustments.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}
          {cadFidelity.lowConfidenceEntities.length > 0 && (
            <div style={{ marginTop: 8, color: '#92400E' }}>
              <strong>Low-confidence reads (shown, not invented):</strong>{' '}
              {cadFidelity.lowConfidenceEntities.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Everything the conversion could not place, stated rather than hidden. */}
      {conversionDiagnostics.length > 0 && !busy && (
        <details
          data-testid="conversion-diagnostics"
          style={{ margin: '8px 0', padding: '8px 12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 12 }}
        >
          <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#92400E' }}>
            {conversionDiagnostics.length} conversion note(s) — what differs from the image
          </summary>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18, display: 'grid', gap: 2, color: '#78350F' }}>
            {conversionDiagnostics.map((diagnostic, index) => (
              <li key={`${diagnostic.code}-${index}`}>
                <strong>{diagnostic.code}</strong>: {diagnostic.message}
              </li>
            ))}
          </ul>
        </details>
      )}

      {cadSyncMessage && !busy && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '10px 14px',
            margin: '10px 0',
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: 8,
            color: '#065F46',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={15} /> {cadSyncMessage}
          </span>
          {onOpen2DFloorPlan && (
            <button
              type="button"
              onClick={onOpen2DFloorPlan}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid #059669',
                background: '#059669',
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Inspect in 2D CAD →
            </button>
          )}
        </div>
      )}

      {session && (
        <>
          {/* Zoom & Download Toolbar */}
          <div
            className="concept-image-toolbar"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              padding: '8px 12px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderBottom: 'none',
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={() => setZoomPercent(z => Math.max(50, z - 25))}
                title="Zoom Out"
                style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}
              >
                <ZoomOut size={13} />
              </button>
              <button
                type="button"
                onClick={() => setZoomPercent(100)}
                title="Reset Zoom / Fit to Screen"
                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}
              >
                <Maximize2 size={12} />
                <span>{zoomPercent}%</span>
              </button>
              <button
                type="button"
                onClick={() => setZoomPercent(z => Math.min(250, z + 25))}
                title="Zoom In"
                style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}
              >
                <ZoomIn size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {session.editInstruction && (
                <span style={{ fontSize: 11, background: '#EFF6FF', color: '#1D4ED8', padding: '3px 8px', borderRadius: 999, fontWeight: 600 }}>
                  Edited: &ldquo;{session.editInstruction}&rdquo;
                </span>
              )}
              <button
                type="button"
                onClick={handleDownloadImage}
                title="Download Concept Image"
                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#1E293B' }}
              >
                <Download size={13} />
                <span>Download Image</span>
              </button>
            </div>
          </div>

          <figure
            className="concept-image-frame"
            style={{
              margin: 0,
              maxHeight: 540,
              overflow: 'auto',
              background: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
              border: '1px solid #CBD5E1',
            }}
          >
            <img
              src={imageDataUrl(session.mimeType, session.imageBase64)}
              alt="AI generated architectural floor-plan concept"
              style={{
                width: `${zoomPercent}%`,
                maxWidth: zoomPercent === 100 ? '100%' : 'none',
                maxHeight: zoomPercent === 100 ? 500 : 'none',
                objectFit: 'contain',
                borderRadius: 6,
                transition: 'width 0.15s ease',
              }}
            />
          </figure>

          {/* Instruction-Based Concept Image Editing & CAD Re-Interpretation */}
          <div
            className="concept-image-editor-box"
            style={{
              marginTop: 12,
              padding: '14px 16px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label
                htmlFor={`concept-edit-input-${projectId}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#0F172A' }}
              >
                <Wand2 size={15} color="#C86D48" />
                <span>Edit Concept Image with Instructions (Reference-Guided AI + CAD Sync)</span>
              </label>
              <span style={{ fontSize: 11, color: '#64748B' }}>
                Preserves current layout reference while applying modifications
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                id={`concept-edit-input-${projectId}`}
                type="text"
                value={editInstruction}
                onChange={e => setEditInstruction(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && editInstruction.trim() && !busy) {
                    handleApplyEditInstruction();
                  }
                }}
                placeholder="e.g., Make the living room larger and widen the front verandah..."
                disabled={busy}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  fontSize: 13,
                  background: '#FFFFFF',
                  color: '#0F172A',
                }}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={handleApplyEditInstruction}
                disabled={busy || !editInstruction.trim() || !hasProgram}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: '#C86D48',
                  border: '1px solid #C86D48',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: busy || !editInstruction.trim() ? 'not-allowed' : 'pointer',
                  opacity: busy || !editInstruction.trim() ? 0.65 : 1,
                }}
              >
                {busy ? <Loader2 size={14} className="spin" /> : <Wand2 size={14} />}
                <span>Apply Edit & Sync CAD</span>
              </button>
            </div>

            {/* Quick Edit Suggestion Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {QUICK_EDIT_SUGGESTIONS.map(suggestion => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={busy}
                  onClick={() => setEditInstruction(suggestion)}
                  style={{
                    fontSize: 11,
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid #CBD5E1',
                    background: editInstruction === suggestion ? '#FDF8F5' : '#FFFFFF',
                    color: editInstruction === suggestion ? '#C86D48' : '#475569',
                    cursor: busy ? 'not-allowed' : 'pointer',
                    fontWeight: 500,
                  }}
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Revision History Selector */}
          {revisions.length > 0 && (
            <div
              className="concept-image-revisions"
              style={{
                marginTop: 10,
                padding: '10px 14px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#334155' }}>
                <History size={14} color="#64748B" />
                <span>Revision History ({revisions.length}):</span>
              </span>
              {revisions.map(rev => {
                const isCurrent = rev.generationId === session.generationId;
                return (
                  <button
                    key={rev.generationId}
                    type="button"
                    disabled={busy}
                    onClick={() => handleSelectRevision(rev)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: isCurrent ? '2px solid #1E3A2F' : '1px solid #CBD5E1',
                      background: isCurrent ? '#ECFDF5' : '#F8FAFC',
                      color: isCurrent ? '#065F46' : '#334155',
                      fontSize: 11,
                      fontWeight: isCurrent ? 700 : 500,
                      cursor: busy ? 'not-allowed' : 'pointer',
                    }}
                    title={rev.editInstruction ? `Edited: ${rev.editInstruction}` : `Initial generation (${rev.generationId})`}
                  >
                    Rev #{rev.revisionNumber}{rev.evaluation ? ` (${rev.evaluation.overallScore}/100)` : ''} {rev.editInstruction ? `· "${rev.editInstruction.slice(0, 18)}${rev.editInstruction.length > 18 ? '…' : ''}"` : '· Base'}
                  </button>
                );
              })}
            </div>
          )}

          {stale && (
            <p className="concept-image-stale">
              <TriangleAlert size={14} /> This image was generated from an earlier revision of the Site or Program. Regenerate to reflect the current inputs.
            </p>
          )}
          <dl className="concept-image-metadata">
            <div><dt>Generation</dt><dd>{session.generationId}</dd></div>
            <div><dt>Seed</dt><dd>{session.seed}</dd></div>
            <div><dt>Attempt</dt><dd>{session.attempt + 1}</dd></div>
            <div><dt>Model</dt><dd>{session.model}</dd></div>
            <div><dt>Provider</dt><dd>{session.provider}</dd></div>
            <div><dt>Prompt version</dt><dd>v{session.promptVersion}</dd></div>
          </dl>
          <details className="concept-image-prompt">
            <summary>Original generation prompt</summary>
            <p>{session.request.prompt}</p>
            <p className="concept-image-negative"><strong>Excluded:</strong> {session.request.negativePrompt}</p>
          </details>
        </>
      )}

      <p className="concept-image-disclaimer">
        AI-generated concept image — illustrative and not to scale. NOT A VALIDATED PLAN. Use the editable CAD plan for authoritative geometry and dimensions.
      </p>

      {!session && !busy && hasProgram && (
        <p className="concept-image-note"><ImageOff size={14} /> No concept image generated yet for this project.</p>
      )}
    </section>
  );
};
