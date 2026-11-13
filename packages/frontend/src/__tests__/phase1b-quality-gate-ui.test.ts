import { describe, expect, it } from 'vitest';
import {
  isCandidateAppliable,
  describeCandidateScore,
  describeCandidateSource,
} from '../services/two-ai-candidates';
import type { OrchestratedCandidateResult } from '../services/backend-api';

describe('Phase 1B Frontend Quality Gate & UI Acceptance Tests', () => {
  const dummyArtifact = {
    generationId: 'gen_31777_mwdwb5m3_84f08308',
    projectId: 'proj_test',
    seed: 101,
    model: 'gemini-3.1-flash-lite-image',
    provider: 'gemini',
    promptVersion: 1,
    originalPrompt: 'Residential floor plan',
    negativePrompt: '',
    width: 1024,
    height: 1024,
    requestedWidth: 1024,
    requestedHeight: 1024,
    mimeType: 'image/jpeg',
    generatedAt: new Date().toISOString(),
    latencyMs: 1200,
    imageBase64: '',
  };

  const dummyBuilding: any = {
    projectId: 'proj_test',
    name: 'Test Building',
    floors: [{ id: 'f1', rooms: [{ id: 'r1' }] }],
  };

  it('isCandidateAppliable blocks rejected candidate with score 58/100', () => {
    const cand58: OrchestratedCandidateResult = {
      id: 'cand_58',
      seed: 101,
      status: 'REJECTED',
      acceptanceState: 'QUALITY_REJECTED',
      source: 'GEMINI',
      visualSource: 'GEMINI_IMAGE',
      building: null,
      artifact: dummyArtifact,
      validation: {
        isValid: false,
        recommendedForEditing: false,
        geometryHealthy: false,
        overallScore: null,
        verificationIssues: [],
      },
      evaluation: null,
      diagnostics: [],
      rejectedReason: 'Rejected by architectural quality gate (58/100 < 80)',
      masterEvaluation: {
        overallScore: 58,
        passed: false,
        complianceScore: 15,
        spatialLayoutScore: 12,
        footprintScore: 8,
        circulationScore: 8,
        draftingClarityScore: 6,
        vastuDaylightScore: 5,
        coherenceScore: 4,
        strengths: [],
        concerns: ['Rectangular footprint instead of requested L-shape'],
        identifiedProblems: ['Rectangular footprint instead of requested L-shape'],
        missingRequirements: [],
        incorrectPlacements: [],
        incorrectFloorArrangements: [],
        suggestedCorrections: [],
        hardConstraintViolations: ['Rectangular footprint instead of requested L-shape'],
        rationale: 'Rejected',
        model: 'gemini-3.1-flash-lite',
        latencyMs: 120,
      },
    };

    expect(isCandidateAppliable(cand58)).toBe(false);

    const scoreDesc = describeCandidateScore(cand58);
    expect(scoreDesc.kind).toBe('REJECTED');
    expect(scoreDesc.label).toContain('58/100');
    expect(scoreDesc.label).toContain('(<80)');
  });

  it('isCandidateAppliable blocks candidate with score 79/100', () => {
    const cand79: OrchestratedCandidateResult = {
      id: 'cand_79',
      seed: 101,
      status: 'REJECTED',
      acceptanceState: 'QUALITY_REJECTED',
      building: null,
      artifact: dummyArtifact,
      validation: {
        isValid: false,
        recommendedForEditing: false,
        geometryHealthy: false,
        overallScore: null,
        verificationIssues: [],
      },
      evaluation: null,
      diagnostics: [],
      rejectedReason: 'Score 79/100 below 80 threshold',
      masterEvaluation: {
        overallScore: 79,
        passed: false,
        complianceScore: 20,
        spatialLayoutScore: 16,
        footprintScore: 12,
        circulationScore: 12,
        draftingClarityScore: 8,
        vastuDaylightScore: 7,
        coherenceScore: 4,
        strengths: [],
        concerns: [],
        identifiedProblems: [],
        missingRequirements: [],
        incorrectPlacements: [],
        incorrectFloorArrangements: [],
        suggestedCorrections: [],
        hardConstraintViolations: [],
        rationale: 'Score 79 < 80',
        model: 'gemini-3.1-flash-lite',
        latencyMs: 120,
      },
    };

    expect(isCandidateAppliable(cand79)).toBe(false);
  });

  it('isCandidateAppliable blocks candidate with score 95/100 if hardConstraintViolations exist', () => {
    const cand95Violations: OrchestratedCandidateResult = {
      id: 'cand_95',
      seed: 101,
      status: 'REJECTED',
      acceptanceState: 'QUALITY_REJECTED',
      building: null,
      artifact: dummyArtifact,
      validation: {
        isValid: false,
        recommendedForEditing: false,
        geometryHealthy: false,
        overallScore: null,
        verificationIssues: [],
      },
      evaluation: null,
      diagnostics: [],
      rejectedReason: 'Violates hard constraint',
      masterEvaluation: {
        overallScore: 95,
        passed: false,
        complianceScore: 24,
        spatialLayoutScore: 19,
        footprintScore: 14,
        circulationScore: 15,
        draftingClarityScore: 10,
        vastuDaylightScore: 8,
        coherenceScore: 5,
        strengths: [],
        concerns: [],
        identifiedProblems: [],
        missingRequirements: [],
        incorrectPlacements: [],
        incorrectFloorArrangements: [],
        suggestedCorrections: [],
        hardConstraintViolations: ['Missing requested parking'],
        rationale: 'Hard violation',
        model: 'gemini-3.1-flash-lite',
        latencyMs: 120,
      },
    };

    expect(isCandidateAppliable(cand95Violations)).toBe(false);
  });

  it('isCandidateAppliable allows only approved candidate (score >= 80, passed true, 0 violations, valid building)', () => {
    const cand82Approved: OrchestratedCandidateResult = {
      id: 'cand_82',
      seed: 101,
      status: 'ACCEPTED',
      acceptanceState: 'READY_FOR_EDITING',
      source: 'GEMINI',
      visualSource: 'GEMINI_IMAGE',
      building: dummyBuilding,
      artifact: dummyArtifact,
      validation: {
        isValid: true,
        recommendedForEditing: true,
        geometryHealthy: true,
        overallScore: 85,
        verificationIssues: [],
      },
      evaluation: {
        overallScore: 82,
        requirementSatisfaction: 90,
        spatialQuality: 85,
        circulation: 85,
        adjacency: 85,
        zoning: 85,
        privacy: 85,
        daylight: 85,
        efficiency: 85,
        roomProportions: 85,
        orientation: 85,
        strengths: ['Great plan'],
        concerns: [],
        rationale: 'Approved design',
        model: 'gemini-3.6-flash',
      },
      diagnostics: [],
      rejectedReason: null,
      masterEvaluation: {
        overallScore: 82,
        passed: true,
        complianceScore: 21,
        spatialLayoutScore: 17,
        footprintScore: 13,
        circulationScore: 13,
        draftingClarityScore: 8,
        vastuDaylightScore: 6,
        coherenceScore: 4,
        strengths: ['Valid spatial zoning'],
        concerns: [],
        identifiedProblems: [],
        missingRequirements: [],
        incorrectPlacements: [],
        incorrectFloorArrangements: [],
        suggestedCorrections: [],
        hardConstraintViolations: [],
        rationale: 'Passes all criteria',
        model: 'gemini-3.1-flash-lite',
        latencyMs: 120,
      },
    };

    expect(isCandidateAppliable(cand82Approved)).toBe(true);

    const scoreDesc = describeCandidateScore(cand82Approved);
    expect(scoreDesc.kind).toBe('SCORED');
    expect(scoreDesc.label).toContain('82/100');
  });

  it('describeCandidateSource correctly renders Gemini provenance without hardcoded FLUX strings', () => {
    const geminiCand: OrchestratedCandidateResult = {
      id: 'cand_gemini',
      seed: 101,
      status: 'ACCEPTED',
      source: 'GEMINI',
      visualSource: 'GEMINI_IMAGE',
      building: dummyBuilding,
      artifact: dummyArtifact,
      validation: {
        isValid: true,
        recommendedForEditing: true,
        geometryHealthy: true,
        overallScore: null,
        verificationIssues: [],
      },
      evaluation: null,
      diagnostics: [],
      rejectedReason: null,
    };

    const sourceView = describeCandidateSource(geminiCand);
    expect(sourceView.label).toContain('Gemini');
    expect(sourceView.label).not.toContain('FLUX');
    expect(sourceView.isAiGenerated).toBe(true);
  });
});
