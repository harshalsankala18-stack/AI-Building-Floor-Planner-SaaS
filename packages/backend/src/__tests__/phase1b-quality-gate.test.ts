import { describe, expect, it, vi } from 'vitest';
import { Direction } from '@ai-floor-planner/core';
import {
  GenerationOrchestrator,
  type GenerationOrchestratorInput,
} from '../services/generation-orchestrator.js';
import { ImageArtifactStore } from '../services/image-artifact-store.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function createTempStore(): { store: ImageArtifactStore; cleanup: () => void } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'afp-phase1b-test-'));
  return {
    store: new ImageArtifactStore(dir),
    cleanup: () => {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        // Ignored
      }
    },
  };
}

const mockInterpretation = {
  boundary: { points: [{ x: 50, y: 50 }, { x: 450, y: 50 }, { x: 450, y: 450 }, { x: 50, y: 450 }] },
  rooms: [
    { id: 'living', name: 'Living Room', type: 'living', x: 60, y: 60, width: 180, height: 180 },
    { id: 'bed1', name: 'Bedroom 1', type: 'bedroom', x: 250, y: 60, width: 180, height: 180 },
    { id: 'bath1', name: 'Common Bath', type: 'bathroom', x: 60, y: 250, width: 120, height: 120 },
    { id: 'kitchen', name: 'Kitchen', type: 'kitchen', x: 250, y: 250, width: 180, height: 180 },
  ],
  doors: [
    { id: 'd1', x: 100, y: 60, width: 30, height: 10, type: 'single', adjacentRoomId: 'living' },
  ],
  windows: [
    { id: 'w1', x: 120, y: 50, width: 40, height: 10, adjacentRoomId: 'living' },
  ],
  stairs: [],
  parking: [],
};

// Valid 100-byte base64 image payload for testing
const sampleBase64 = Buffer.alloc(100, 0xff).toString('base64');

describe('Phase 1B — Architectural Quality Gate Enforcement & Rejected Image Isolation', () => {
  const sampleInput: GenerationOrchestratorInput = {
    projectId: 'proj-phase1b-test',
    projectName: 'Villa 1B Test',
    projectType: 'residential_independent',
    site: {
      plotWidth: 15000,
      plotDepth: 20000,
      roadFacing: Direction.North,
      setbacks: { front: 2000, rear: 1500, left: 1500, right: 1500 },
    },
    roomCounts: {
      bedrooms: 2,
      bathrooms: 2,
      living: 1,
      dining: 1,
      kitchen: 1,
    },
    preferences: {
      parking: true,
    },
  };

  it('rejects candidate with score 58/100, enforces null building and QUALITY_REJECTED state', async () => {
    const { store, cleanup } = createTempStore();
    try {
      const mockImageProvider = {
        name: 'gemini',
        generateFloorPlan: vi.fn(async () => ({
          imageBase64: sampleBase64,
          mimeType: 'image/jpeg',
          width: 1024,
          height: 1024,
          seed: 101,
          model: 'gemini-3.1-flash-lite-image',
          provider: 'gemini',
          latencyMs: 150,
        })),
        isAvailable: vi.fn(async () => true),
      };

      const mockGemini = {
        name: 'gemini',
        isAvailable: vi.fn(async () => true),
        complete: vi.fn(async (req) => {
          if (req.taskType === 'design_critique' || req.systemPrompt?.includes('chief residential architect')) {
            return {
              content: '{}',
              parsed: {
                overallScore: 58,
                passed: false,
                complianceScore: 15,
                spatialLayoutScore: 12,
                footprintScore: 8,
                circulationScore: 8,
                draftingClarityScore: 6,
                vastuDaylightScore: 5,
                coherenceScore: 4,
                strengths: ['Basic linework present'],
                concerns: ['Rectangular footprint instead of requested L-shape', 'Suboptimal Vastu alignment'],
                identifiedProblems: ['Rectangular footprint instead of requested L-shape'],
                missingRequirements: [],
                incorrectPlacements: ['Kitchen in Northeast instead of Southeast'],
                incorrectFloorArrangements: [],
                suggestedCorrections: ['Redesign with L-shape footprint', 'Relocate kitchen to SE'],
                hardConstraintViolations: ['Rectangular footprint instead of requested L-shape', 'Suboptimal Vastu alignment'],
                rationale: 'Score 58/100 below 80 threshold with hard violations.',
              },
              usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
              model: 'gemini-3.1-flash-lite',
              latencyMs: 120,
            };
          }
          if (req.taskType === 'image_interpretation') {
            return {
              content: '{}',
              parsed: mockInterpretation,
              usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
              model: 'gemini-3.6-flash',
              latencyMs: 120,
            };
          }
          return { content: '{}', parsed: {} };
        }),
      };

      const orchestrator = new GenerationOrchestrator({
        provider: mockImageProvider as any,
        store,
        gemini: mockGemini as any,
        interpreterKind: 'gemini',
        maxVisualAttempts: 1,
      });

      const result = await orchestrator.run(sampleInput);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('QUALITY_GATE_FAILED');
      expect(result.candidates.length).toBe(1);

      const candidate = result.candidates[0]!;
      expect(candidate.status).toBe('REJECTED');
      expect(candidate.acceptanceState).toBe('QUALITY_REJECTED');
      expect(candidate.rejectionStage).toBe('QUALITY_GATE');
      expect(candidate.building).toBeNull();
      expect(candidate.validation.recommendedForEditing).toBe(false);
      expect(candidate.masterEvaluation?.overallScore).toBe(58);
      expect(candidate.masterEvaluation?.passed).toBe(false);
      expect(candidate.source).toBe('GEMINI');
      expect(candidate.visualSource).toBe('GEMINI_IMAGE');
    } finally {
      cleanup();
    }
  });

  it('rejects candidate with score 79/100 and blocks building application', async () => {
    const { store, cleanup } = createTempStore();
    try {
      const mockImageProvider = {
        name: 'gemini',
        generateFloorPlan: vi.fn(async () => ({
          imageBase64: sampleBase64,
          mimeType: 'image/jpeg',
          width: 1024,
          height: 1024,
          seed: 101,
          model: 'gemini-3.1-flash-lite-image',
          provider: 'gemini',
          latencyMs: 150,
        })),
        isAvailable: vi.fn(async () => true),
      };

      const mockGemini = {
        name: 'gemini',
        isAvailable: vi.fn(async () => true),
        complete: vi.fn(async (req) => {
          if (req.taskType === 'design_critique' || req.systemPrompt?.includes('chief residential architect')) {
            return {
              content: '{}',
              parsed: {
                overallScore: 79,
                passed: false,
                complianceScore: 20,
                spatialLayoutScore: 16,
                footprintScore: 12,
                circulationScore: 12,
                draftingClarityScore: 8,
                vastuDaylightScore: 7,
                coherenceScore: 4,
                strengths: ['Good circulation'],
                concerns: ['Slightly cramped hallway'],
                identifiedProblems: [],
                missingRequirements: [],
                incorrectPlacements: [],
                incorrectFloorArrangements: [],
                suggestedCorrections: [],
                hardConstraintViolations: [],
                rationale: 'Score 79/100 is below strict 80 threshold.',
              },
              usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
              model: 'gemini-3.1-flash-lite',
              latencyMs: 120,
            };
          }
          return { content: '{}', parsed: mockInterpretation };
        }),
      };

      const orchestrator = new GenerationOrchestrator({
        provider: mockImageProvider as any,
        store,
        gemini: mockGemini as any,
        interpreterKind: 'gemini',
        maxVisualAttempts: 1,
      });

      const result = await orchestrator.run(sampleInput);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('QUALITY_GATE_FAILED');
      expect(result.candidates[0]!.building).toBeNull();
      expect(result.candidates[0]!.acceptanceState).toBe('QUALITY_REJECTED');
    } finally {
      cleanup();
    }
  });

  it('rejects candidate with score 95/100 if it contains hard constraint violations', async () => {
    const { store, cleanup } = createTempStore();
    try {
      const mockImageProvider = {
        name: 'gemini',
        generateFloorPlan: vi.fn(async () => ({
          imageBase64: sampleBase64,
          mimeType: 'image/jpeg',
          width: 1024,
          height: 1024,
          seed: 101,
          model: 'gemini-3.1-flash-lite-image',
          provider: 'gemini',
          latencyMs: 150,
        })),
        isAvailable: vi.fn(async () => true),
      };

      const mockGemini = {
        name: 'gemini',
        isAvailable: vi.fn(async () => true),
        complete: vi.fn(async (req) => {
          if (req.taskType === 'design_critique' || req.systemPrompt?.includes('chief residential architect')) {
            return {
              content: '{}',
              parsed: {
                overallScore: 95,
                passed: false, // passed is false because of hard violations!
                complianceScore: 24,
                spatialLayoutScore: 19,
                footprintScore: 14,
                circulationScore: 15,
                draftingClarityScore: 10,
                vastuDaylightScore: 8,
                coherenceScore: 5,
                strengths: ['High drafting quality'],
                concerns: ['Missing requested parking'],
                identifiedProblems: ['Missing parking'],
                missingRequirements: ['Parking space'],
                incorrectPlacements: [],
                incorrectFloorArrangements: [],
                suggestedCorrections: ['Add covered car porch'],
                hardConstraintViolations: ['Parking space missing despite mandatory brief requirement'],
                rationale: 'Score is high but mandatory hard constraint is violated.',
              },
              usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
              model: 'gemini-3.1-flash-lite',
              latencyMs: 120,
            };
          }
          return { content: '{}', parsed: mockInterpretation };
        }),
      };

      const orchestrator = new GenerationOrchestrator({
        provider: mockImageProvider as any,
        store,
        gemini: mockGemini as any,
        interpreterKind: 'gemini',
        maxVisualAttempts: 1,
      });

      const result = await orchestrator.run(sampleInput);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('QUALITY_GATE_FAILED');
      expect(result.candidates[0]!.building).toBeNull();
      expect(result.candidates[0]!.acceptanceState).toBe('QUALITY_REJECTED');
    } finally {
      cleanup();
    }
  });

  it('accepts candidate with score 82/100, passed true, and 0 violations', async () => {
    const { store, cleanup } = createTempStore();
    try {
      const mockImageProvider = {
        name: 'gemini',
        generateFloorPlan: vi.fn(async () => ({
          imageBase64: sampleBase64,
          mimeType: 'image/jpeg',
          width: 1024,
          height: 1024,
          seed: 101,
          model: 'gemini-3.1-flash-lite-image',
          provider: 'gemini',
          latencyMs: 150,
        })),
        isAvailable: vi.fn(async () => true),
      };

      const mockGemini = {
        name: 'gemini',
        isAvailable: vi.fn(async () => true),
        complete: vi.fn(async (req) => {
          if (req.taskType === 'design_critique' || req.systemPrompt?.includes('chief residential architect')) {
            return {
              content: '{}',
              parsed: {
                overallScore: 82,
                passed: true,
                complianceScore: 21,
                spatialLayoutScore: 17,
                footprintScore: 13,
                circulationScore: 13,
                draftingClarityScore: 8,
                vastuDaylightScore: 6,
                coherenceScore: 4,
                strengths: ['Valid spatial zoning', 'Adheres to setbacks'],
                concerns: [],
                identifiedProblems: [],
                missingRequirements: [],
                incorrectPlacements: [],
                incorrectFloorArrangements: [],
                suggestedCorrections: [],
                hardConstraintViolations: [],
                rationale: 'Passes all mandatory criteria.',
              },
              usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
              model: 'gemini-3.1-flash-lite',
              latencyMs: 120,
            };
          }
          if (req.taskType === 'image_interpretation') {
            return {
              content: '{}',
              parsed: mockInterpretation,
              usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
              model: 'gemini-3.6-flash',
              latencyMs: 120,
            };
          }
          return {
            content: '{}',
            parsed: {
              overallScore: 85,
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
            },
            usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
            model: 'gemini-3.6-flash',
            latencyMs: 120,
          };
        }),
      };

      const orchestrator = new GenerationOrchestrator({
        provider: mockImageProvider as any,
        store,
        gemini: mockGemini as any,
        interpreterKind: 'gemini',
        maxVisualAttempts: 1,
      });

      const result = await orchestrator.run(sampleInput);

      expect(result.success).toBe(true);
      expect(result.candidates.length).toBe(1);
      const candidate = result.candidates[0]!;
      expect(candidate.status).toBe('ACCEPTED');
      expect(candidate.acceptanceState).toBe('READY_FOR_EDITING');
      expect(candidate.building).not.toBeNull();
      expect(candidate.validation.isValid).toBe(true);
      expect(candidate.masterEvaluation?.overallScore).toBe(82);
      expect(candidate.masterEvaluation?.passed).toBe(true);
    } finally {
      cleanup();
    }
  });

  it('resumeFromArtifact with score 58/100 returns success: false and blocks building', async () => {
    const { store, cleanup } = createTempStore();
    try {
      const artifact = await store.save('proj-phase1b-test', {
        imageBase64: sampleBase64,
        mimeType: 'image/jpeg',
        seed: 101,
        model: 'gemini-3.1-flash-lite-image',
        provider: 'gemini',
        promptVersion: 1,
        prompt: 'test prompt',
        generatedAt: new Date().toISOString(),
        latencyMs: 1200,
      }, {
        schemaVersion: 1,
        promptVersion: 1,
        prompt: 'test prompt',
        negativePrompt: '',
        seed: 101,
        width: 1024,
        height: 1024,
        metadata: { projectId: 'proj-phase1b-test', projectName: 'Villa 1B Test', plotWidthMm: 15000, plotDepthMm: 20000, floorsCount: 1, roadFacing: 'north' },
      });

      const mockGemini = {
        name: 'gemini',
        isAvailable: vi.fn(async () => true),
        complete: vi.fn(async (req) => {
          if (req.systemPrompt?.includes('chief residential architect')) {
            return {
              content: '{}',
              parsed: {
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
              },
              usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
              model: 'gemini-3.1-flash-lite',
              latencyMs: 120,
            };
          }
          if (req.taskType === 'image_interpretation') {
            return {
              content: '{}',
              parsed: mockInterpretation,
              usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
              model: 'gemini-3.6-flash',
              latencyMs: 120,
            };
          }
          return { content: '{}', parsed: {} };
        }),
      };

      const orchestrator = new GenerationOrchestrator({
        provider: null,
        store,
        gemini: mockGemini as any,
        interpreterKind: 'gemini',
      });

      const result = await orchestrator.resumeFromArtifact({
        artifactId: artifact.generationId,
        projectId: sampleInput.projectId,
        projectName: sampleInput.projectName,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('QUALITY_GATE_FAILED');
      expect(result.candidates[0]!.building).toBeNull();
      expect(result.candidates[0]!.acceptanceState).toBe('QUALITY_REJECTED');
    } finally {
      cleanup();
    }
  });
});
