/**
 * Phase 3 - Gemini architectural evaluation (PRD 25).
 *
 * Gemini evaluates a VALID plan (already accepted by the deterministic system)
 * against the original requirements and the generated image. It produces a
 * STRUCTURED score + analysis, never free-form scoring text. This is separate
 * from deterministic validation: the system asks "Is this plan valid?" and
 * Gemini answers "How good is this valid plan?" (PRD 26).
 */

import { AISafetyError, type BaseAIProvider } from '../providers/base';

/** Structured architectural evaluation returned by Gemini. */
export const ARCHITECTURAL_EVALUATION_SCHEMA = {
  type: 'object',
  required: ['overallScore', 'requirementSatisfaction', 'spatialQuality', 'circulation', 'adjacency', 'zoning', 'privacy', 'daylight', 'efficiency', 'roomProportions', 'orientation', 'strengths', 'concerns'],
  properties: {
    overallScore: { type: 'number', minimum: 0, maximum: 100 },
    requirementSatisfaction: { type: 'number', minimum: 0, maximum: 100 },
    spatialQuality: { type: 'number', minimum: 0, maximum: 100 },
    circulation: { type: 'number', minimum: 0, maximum: 100 },
    adjacency: { type: 'number', minimum: 0, maximum: 100 },
    zoning: { type: 'number', minimum: 0, maximum: 100 },
    privacy: { type: 'number', minimum: 0, maximum: 100 },
    daylight: { type: 'number', minimum: 0, maximum: 100 },
    efficiency: { type: 'number', minimum: 0, maximum: 100 },
    roomProportions: { type: 'number', minimum: 0, maximum: 100 },
    orientation: { type: 'number', minimum: 0, maximum: 100 },
    strengths: { type: 'array', items: { type: 'string' } },
    concerns: { type: 'array', items: { type: 'string' } },
    rationale: { type: 'string' },
  },
} as const;

export interface ArchitecturalEvaluationOptions {
  readonly buildingSummary: string;
  readonly requirementsSummary: string;
  readonly imageBase64?: string;
  readonly imageMimeType?: string;
  readonly timeoutMs?: number;
}

export interface ArchitecturalEvaluationResult {
  readonly overallScore: number;
  readonly requirementSatisfaction: number;
  readonly spatialQuality: number;
  readonly circulation: number;
  readonly adjacency: number;
  readonly zoning: number;
  readonly privacy: number;
  readonly daylight: number;
  readonly efficiency: number;
  readonly roomProportions: number;
  readonly orientation: number;
  readonly strengths: readonly string[];
  readonly concerns: readonly string[];
  readonly rationale: string;
  readonly model: string;
  readonly latencyMs: number;
}

/**
 * Evaluate a valid plan architecturally using Gemini. Requires the plan to
 * have already passed deterministic validation.
 */
export async function evaluatePlanArchitecturally(
  provider: BaseAIProvider,
  options: ArchitecturalEvaluationOptions,
): Promise<ArchitecturalEvaluationResult> {
  const systemPrompt = [
    'You are a senior residential architect reviewing a validated floor plan.',
    'Score each architectural dimension 0-100 and return ONLY the JSON object defined by the schema.',
    'Never claim code compliance, structural safety or professional approval.',
    'Evaluate requirement satisfaction, spatial quality, circulation, adjacency, zoning, privacy, daylight, efficiency, room proportions and orientation separately.',
  ].join(' ');

  const userPrompt = [
    'Evaluate this valid floor plan architecturally.',
    `Plan: ${options.buildingSummary}`,
    `Requirements: ${options.requirementsSummary}`,
  ].join('\n');

  const apiResponse = await provider.complete({
    taskType: 'design_critique' as never,
    systemPrompt,
    userPrompt,
    // Explicit typed image part (recovery Phase 4, P8).
    ...(options.imageBase64
      ? { images: [{ mimeType: options.imageMimeType ?? 'image/png', data: options.imageBase64 }] }
      : {}),
    responseFormat: 'json',
    responseSchema: ARCHITECTURAL_EVALUATION_SCHEMA as Record<string, unknown>,
    maxTokens: 2000,
    temperature: 0,
  });

  const parsed = apiResponse.parsed;
  if (parsed === undefined) {
    throw new AISafetyError('Gemini architectural evaluation returned no structured score.');
  }

  const record = parsed as Record<string, unknown>;
  return {
    overallScore: Number(record.overallScore ?? 0),
    requirementSatisfaction: Number(record.requirementSatisfaction ?? 0),
    spatialQuality: Number(record.spatialQuality ?? 0),
    circulation: Number(record.circulation ?? 0),
    adjacency: Number(record.adjacency ?? 0),
    zoning: Number(record.zoning ?? 0),
    privacy: Number(record.privacy ?? 0),
    daylight: Number(record.daylight ?? 0),
    efficiency: Number(record.efficiency ?? 0),
    roomProportions: Number(record.roomProportions ?? 0),
    orientation: Number(record.orientation ?? 0),
    strengths: Array.isArray(record.strengths) ? record.strengths.map(String) : [],
    concerns: Array.isArray(record.concerns) ? record.concerns.map(String) : [],
    rationale: typeof record.rationale === 'string' ? record.rationale : '',
    model: apiResponse.model,
    latencyMs: apiResponse.latencyMs,
  };
}

/**
 * Phase 2.6 Master Floor Plan 100-Point Evaluation Schema.
 * Evaluates the actual AI-generated concept image against a strict 80/100 quality gate.
 */
export const MASTER_IMAGE_EVALUATION_SCHEMA = {
  type: 'object',
  required: [
    'passed',
    'complianceScore',
    'spatialLayoutScore',
    'footprintScore',
    'circulationScore',
    'draftingClarityScore',
    'vastuDaylightScore',
    'coherenceScore',
    'strengths',
    'concerns',
    'identifiedProblems',
    'missingRequirements',
    'incorrectPlacements',
    'incorrectFloorArrangements',
    'suggestedCorrections',
    'hardConstraintViolations',
    'rationale',
  ],
  properties: {
    overallScore: { type: 'number', minimum: 0, maximum: 100 },
    passed: { type: 'boolean' },
    complianceScore: { type: 'number', minimum: 0, maximum: 25 },
    spatialLayoutScore: { type: 'number', minimum: 0, maximum: 20 },
    footprintScore: { type: 'number', minimum: 0, maximum: 15 },
    circulationScore: { type: 'number', minimum: 0, maximum: 15 },
    draftingClarityScore: { type: 'number', minimum: 0, maximum: 10 },
    vastuDaylightScore: { type: 'number', minimum: 0, maximum: 10 },
    coherenceScore: { type: 'number', minimum: 0, maximum: 5 },
    strengths: { type: 'array', items: { type: 'string' } },
    concerns: { type: 'array', items: { type: 'string' } },
    identifiedProblems: { type: 'array', items: { type: 'string' } },
    missingRequirements: { type: 'array', items: { type: 'string' } },
    incorrectPlacements: { type: 'array', items: { type: 'string' } },
    incorrectFloorArrangements: { type: 'array', items: { type: 'string' } },
    suggestedCorrections: { type: 'array', items: { type: 'string' } },
    hardConstraintViolations: { type: 'array', items: { type: 'string' } },
    rationale: { type: 'string' },
  },
} as const;

export interface MasterImageEvaluationOptions {
  readonly requirementsSummary: string;
  readonly siteSummary: string;
  readonly footprintShape?: string;
  readonly requiredBedrooms?: number;
  readonly requiredBathrooms?: number;
  readonly requiredFloors?: number;
  readonly parkingRequired?: boolean;
  readonly imageBase64: string;
  readonly imageMimeType?: string;
  readonly attemptNumber?: number;
  readonly timeoutMs?: number;
}

export interface MasterImageEvaluationResult {
  readonly overallScore: number;
  readonly passed: boolean;
  readonly complianceScore: number;
  readonly spatialLayoutScore: number;
  readonly footprintScore: number;
  readonly circulationScore: number;
  readonly draftingClarityScore: number;
  readonly vastuDaylightScore: number;
  readonly coherenceScore: number;
  readonly strengths: readonly string[];
  readonly concerns: readonly string[];
  readonly identifiedProblems: readonly string[];
  readonly missingRequirements: readonly string[];
  readonly incorrectPlacements: readonly string[];
  readonly incorrectFloorArrangements: readonly string[];
  readonly suggestedCorrections: readonly string[];
  readonly hardConstraintViolations: readonly string[];
  readonly rationale: string;
  readonly model: string;
  readonly latencyMs: number;
}

/** Minimum passing threshold for Master Floor Plan image (Phase 2.6). */
export const MASTER_QUALITY_GATE_THRESHOLD = 80;

/**
 * Evaluate an AI-generated architectural floor-plan image directly using Gemini Vision
 * against the 100-point rubric and strict 80-point quality gate.
 */
export async function evaluateMasterImageWithGemini(
  provider: BaseAIProvider,
  options: MasterImageEvaluationOptions,
): Promise<MasterImageEvaluationResult> {
  const systemPrompt = [
    'You are a senior chief residential architect and plan examiner rigorously evaluating an AI-generated floor-plan image.',
    'You must evaluate the image against the provided brief and return a strict structured JSON assessment according to the schema.',
    'RUBRIC BREAKDOWN (Total: 100 points):',
    '1. Compliance (25 points): Plot dimensions, road orientation, required bedrooms/bathrooms count, multi-floor split.',
    '2. Spatial Layout & Adjacency (20 points): Kitchen near dining, bedrooms private, toilets accessible, realistic room proportions.',
    '3. Footprint & Orientation (15 points): Footprint shape matches brief (e.g. L-shape, U-shape, Rectangular), orientation & setbacks respected.',
    '4. Circulation & Openings (15 points): Clear hallways, no trapped rooms, entry foyer, staircase present if multi-floor, external doors and ventilation windows.',
    '5. Drafting Clarity (10 points): Legible room labels, crisp wall linework, dimensional scale, professional architectural drafting representation.',
    '6. Vastu & Daylight (10 points): Kitchen in SE/NW, master bedroom in SW, cross-ventilation, daylight access.',
    '7. Architectural Coherence & Elegance (5 points): Aesthetic balance and usable layout.',
    'CRITICAL RULES:',
    '- If the image violates any hard constraint (e.g. wrong plot orientation, missing requested bedrooms, missing upper floor for duplex, missing parking when requested), list it in hardConstraintViolations.',
    '- If hardConstraintViolations has any items, overallScore CANNOT exceed 65, and passed MUST be false.',
    '- The passing threshold is score >= 80 and ZERO hardConstraintViolations.',
    '- Under suggestedCorrections, provide concrete, actionable architectural instructions that can be fed into an AI image prompt to fix identified defects.',
  ].join('\n');

  const userPrompt = [
    `EVALUATION BRIEF (Attempt #${options.attemptNumber ?? 1}):`,
    `Site & Plot: ${options.siteSummary}`,
    `Requirements: ${options.requirementsSummary}`,
    options.footprintShape ? `Footprint Typology: ${options.footprintShape}` : '',
    options.requiredBedrooms !== undefined ? `Required Bedrooms: ${options.requiredBedrooms}` : '',
    options.requiredBathrooms !== undefined ? `Required Bathrooms: ${options.requiredBathrooms}` : '',
    options.requiredFloors !== undefined ? `Required Floors: ${options.requiredFloors}` : '',
    options.parkingRequired !== undefined ? `Parking Required: ${options.parkingRequired ? 'YES' : 'NO'}` : '',
    '',
    'Examine the attached floor plan drawing image carefully. Assess linework, room labels, room counts, and spatial flow.',
  ].filter(Boolean).join('\n');

  const apiResponse = await provider.complete({
    taskType: 'design_critique' as never,
    systemPrompt,
    userPrompt,
    images: [{
      mimeType: options.imageMimeType ?? 'image/jpeg',
      data: options.imageBase64,
    }],
    responseFormat: 'json',
    responseSchema: MASTER_IMAGE_EVALUATION_SCHEMA as Record<string, unknown>,
    maxTokens: 2500,
    temperature: 0.1,
  });

  const parsed = apiResponse.parsed;
  if (!parsed || typeof parsed !== 'object') {
    throw new AISafetyError('Gemini master image evaluation returned no structured result.');
  }

  const rec = parsed as Record<string, unknown>;
  const rawViolations = Array.isArray(rec.hardConstraintViolations)
    ? rec.hardConstraintViolations.map(String).filter(s => s.trim().length > 0)
    : [];

  const rawCompliance = Math.min(25, Math.max(0, Number(rec.complianceScore ?? 0)));
  const rawSpatial = Math.min(20, Math.max(0, Number(rec.spatialLayoutScore ?? 0)));
  const rawFootprint = Math.min(15, Math.max(0, Number(rec.footprintScore ?? 0)));
  const rawCirculation = Math.min(15, Math.max(0, Number(rec.circulationScore ?? 0)));
  const rawDrafting = Math.min(10, Math.max(0, Number(rec.draftingClarityScore ?? 0)));
  const rawVastu = Math.min(10, Math.max(0, Number(rec.vastuDaylightScore ?? 0)));
  const rawCoherence = Math.min(5, Math.max(0, Number(rec.coherenceScore ?? 0)));

  const computedSum = rawCompliance + rawSpatial + rawFootprint + rawCirculation + rawDrafting + rawVastu + rawCoherence;
  let overallScore = Math.min(100, Math.max(0, Number(rec.overallScore ?? computedSum)));

  // If there's an arithmetic discrepancy, prefer the computed sum
  if (Math.abs(overallScore - computedSum) > 10) {
    overallScore = computedSum;
  }

  // Enforce strict quality gate logic
  const hasHardViolations = rawViolations.length > 0;
  if (hasHardViolations) {
    overallScore = Math.min(overallScore, 65);
  }

  const passed = overallScore >= MASTER_QUALITY_GATE_THRESHOLD && !hasHardViolations;

  return {
    overallScore,
    passed,
    complianceScore: rawCompliance,
    spatialLayoutScore: rawSpatial,
    footprintScore: rawFootprint,
    circulationScore: rawCirculation,
    draftingClarityScore: rawDrafting,
    vastuDaylightScore: rawVastu,
    coherenceScore: rawCoherence,
    strengths: Array.isArray(rec.strengths) ? rec.strengths.map(String) : [],
    concerns: Array.isArray(rec.concerns) ? rec.concerns.map(String) : [],
    identifiedProblems: Array.isArray(rec.identifiedProblems) ? rec.identifiedProblems.map(String) : [],
    missingRequirements: Array.isArray(rec.missingRequirements) ? rec.missingRequirements.map(String) : [],
    incorrectPlacements: Array.isArray(rec.incorrectPlacements) ? rec.incorrectPlacements.map(String) : [],
    incorrectFloorArrangements: Array.isArray(rec.incorrectFloorArrangements) ? rec.incorrectFloorArrangements.map(String) : [],
    suggestedCorrections: Array.isArray(rec.suggestedCorrections) ? rec.suggestedCorrections.map(String) : [],
    hardConstraintViolations: rawViolations,
    rationale: typeof rec.rationale === 'string' ? rec.rationale : '',
    model: apiResponse.model,
    latencyMs: apiResponse.latencyMs,
  };
}
