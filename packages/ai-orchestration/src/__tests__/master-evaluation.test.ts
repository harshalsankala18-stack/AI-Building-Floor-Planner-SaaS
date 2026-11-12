import { describe, expect, it } from 'vitest';
import {
  evaluateMasterImageWithGemini,
  MASTER_QUALITY_GATE_THRESHOLD,
  type MasterImageEvaluationOptions,
} from '../orchestration/architectural-evaluation';
import { BaseAIProvider } from '../providers/base';
import type { AIRequest, AIResponse, AIChunk, ModelInfo } from '@ai-floor-planner/core';

class MockEvaluationProvider extends BaseAIProvider {
  readonly name = 'mock-evaluation';
  public lastRequest?: AIRequest;

  constructor(private readonly mockPayload: Record<string, unknown>) {
    super();
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async complete(request: AIRequest): Promise<AIResponse> {
    this.lastRequest = request;
    return {
      content: JSON.stringify(this.mockPayload),
      parsed: this.mockPayload,
      model: 'gemini-3.1-flash-lite',
      usage: { promptTokens: 150, completionTokens: 250, totalTokens: 400 },
      latencyMs: 120,
    };
  }

  async *stream(_request: AIRequest): AsyncIterable<AIChunk> {
    yield { content: JSON.stringify(this.mockPayload), isComplete: true };
  }

  getModelInfo(): ModelInfo {
    return {
      provider: 'mock',
      model: 'gemini-3.1-flash-lite',
      contextWindow: 128000,
      supportsJson: true,
      supportsStreaming: true,
    };
  }
}

describe('Master Image Evaluation Rubric & 80+ Quality Gate (Phase 2.6)', () => {
  it('defines the master quality gate threshold at exactly 80 points', () => {
    expect(MASTER_QUALITY_GATE_THRESHOLD).toBe(80);
  });

  it('accepts an image when overallScore >= 80 and no hard constraint violations exist', async () => {
    const mockProvider = new MockEvaluationProvider({
      overallScore: 86,
      passed: true,
      complianceScore: 23,
      spatialLayoutScore: 18,
      footprintScore: 14,
      circulationScore: 13,
      draftingClarityScore: 9,
      vastuDaylightScore: 8,
      coherenceScore: 4,
      strengths: ['Clear L-shape footprint with setback compliance', 'Efficient living-dining flow'],
      concerns: ['Guest bath is slightly compact'],
      identifiedProblems: [],
      missingRequirements: [],
      incorrectPlacements: [],
      incorrectFloorArrangements: [],
      suggestedCorrections: ['Widen guest bath by 200mm'],
      hardConstraintViolations: [],
      rationale: 'High quality architectural concept fulfilling all core requirements.',
    });

    const options: MasterImageEvaluationOptions = {
      requirementsSummary: '3 BHK Residential House, 2 Floors, East Facing',
      siteSummary: 'Plot 30ft x 50ft (9144 x 15240 mm)',
      footprintShape: 'L-Shape',
      requiredBedrooms: 3,
      requiredBathrooms: 3,
      requiredFloors: 2,
      parkingRequired: true,
      imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      imageMimeType: 'image/png',
      attemptNumber: 1,
    };

    const result = await evaluateMasterImageWithGemini(mockProvider, options);

    expect(result.passed).toBe(true);
    expect(result.overallScore).toBe(86);
    expect(result.complianceScore).toBe(23);
    expect(result.spatialLayoutScore).toBe(18);
    expect(result.footprintScore).toBe(14);
    expect(result.circulationScore).toBe(13);
    expect(result.draftingClarityScore).toBe(9);
    expect(result.vastuDaylightScore).toBe(8);
    expect(result.coherenceScore).toBe(4);
    expect(result.hardConstraintViolations).toHaveLength(0);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it('rejects an image when overallScore is below 80 even with zero hard violations', async () => {
    const mockProvider = new MockEvaluationProvider({
      overallScore: 72,
      passed: false,
      complianceScore: 18,
      spatialLayoutScore: 14,
      footprintScore: 11,
      circulationScore: 10,
      draftingClarityScore: 8,
      vastuDaylightScore: 8,
      coherenceScore: 3,
      strengths: ['Labels are legible'],
      concerns: ['Tight hallway circulation', 'Kitchen distance to dining'],
      identifiedProblems: ['Trapped passage near bedroom 2'],
      missingRequirements: [],
      incorrectPlacements: ['Kitchen placed far from dining area'],
      incorrectFloorArrangements: [],
      suggestedCorrections: ['Reorient hallway to connect dining directly with kitchen'],
      hardConstraintViolations: [],
      rationale: 'Layout is functional but circulation is constrained below 80.',
    });

    const options: MasterImageEvaluationOptions = {
      requirementsSummary: '3 BHK Residential House',
      siteSummary: 'Plot 30ft x 50ft',
      imageBase64: 'dummyBase64',
    };

    const result = await evaluateMasterImageWithGemini(mockProvider, options);

    expect(result.passed).toBe(false);
    expect(result.overallScore).toBe(72);
    expect(result.hardConstraintViolations).toHaveLength(0);
    expect(result.suggestedCorrections).toContain('Reorient hallway to connect dining directly with kitchen');
  });

  it('strictly rejects and caps score at <= 65 when hard constraint violations exist, even if AI claimed 90', async () => {
    const mockProvider = new MockEvaluationProvider({
      overallScore: 92,
      passed: true, // Mock model mistakenly says true despite violations
      complianceScore: 24,
      spatialLayoutScore: 19,
      footprintScore: 14,
      circulationScore: 14,
      draftingClarityScore: 9,
      vastuDaylightScore: 8,
      coherenceScore: 4,
      strengths: ['Great rendering'],
      concerns: ['Missing upper floor'],
      identifiedProblems: ['Plan only depicts a single ground floor'],
      missingRequirements: ['Second floor (duplex) missing completely'],
      incorrectPlacements: [],
      incorrectFloorArrangements: ['Upper floor not drafted'],
      suggestedCorrections: ['Add upper floor drawing showing Master Bedroom and Bedroom 2'],
      hardConstraintViolations: [
        'Missing 2nd floor for required duplex layout',
        'Missing parking bay in front setback',
      ],
      rationale: 'Looks nice but violates hard multi-floor requirement.',
    });

    const options: MasterImageEvaluationOptions = {
      requirementsSummary: '3 BHK Duplex, 2 Floors',
      siteSummary: 'Plot 30ft x 50ft',
      requiredFloors: 2,
      parkingRequired: true,
      imageBase64: 'dummyBase64',
    };

    const result = await evaluateMasterImageWithGemini(mockProvider, options);

    // Strict safety gate enforcement
    expect(result.passed).toBe(false);
    expect(result.overallScore).toBeLessThanOrEqual(65);
    expect(result.hardConstraintViolations).toContain('Missing 2nd floor for required duplex layout');
    expect(result.hardConstraintViolations).toContain('Missing parking bay in front setback');
  });

  it('clamps rubric component scores to their maximum limits', async () => {
    const mockProvider = new MockEvaluationProvider({
      overallScore: 120, // out of bounds
      passed: true,
      complianceScore: 50, // max is 25
      spatialLayoutScore: 40, // max is 20
      footprintScore: 30, // max is 15
      circulationScore: 30, // max is 15
      draftingClarityScore: 20, // max is 10
      vastuDaylightScore: 20, // max is 10
      coherenceScore: 10, // max is 5
      strengths: [],
      concerns: [],
      identifiedProblems: [],
      missingRequirements: [],
      incorrectPlacements: [],
      incorrectFloorArrangements: [],
      suggestedCorrections: [],
      hardConstraintViolations: [],
      rationale: 'Over-scored mock test',
    });

    const result = await evaluateMasterImageWithGemini(mockProvider, {
      requirementsSummary: '2 BHK',
      siteSummary: 'Plot 30ft x 40ft',
      imageBase64: 'dummyBase64',
    });

    expect(result.complianceScore).toBe(25);
    expect(result.spatialLayoutScore).toBe(20);
    expect(result.footprintScore).toBe(15);
    expect(result.circulationScore).toBe(15);
    expect(result.draftingClarityScore).toBe(10);
    expect(result.vastuDaylightScore).toBe(10);
    expect(result.coherenceScore).toBe(5);
    expect(result.overallScore).toBe(100);
    expect(result.passed).toBe(true);
  });
});
