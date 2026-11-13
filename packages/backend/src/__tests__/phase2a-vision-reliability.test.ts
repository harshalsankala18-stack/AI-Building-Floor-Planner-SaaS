import { describe, expect, it, vi } from 'vitest';
import { GenerationOrchestrator } from '../services/generation-orchestrator.js';
import { ImageArtifactStore } from '../services/image-artifact-store.js';
import { createBackendServer } from '../server.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function createTempStore(): { store: ImageArtifactStore; cleanup: () => void; dir: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'afp-phase2a-test-'));
  return {
    dir,
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

const sampleBase64 = Buffer.alloc(120, 0xff).toString('base64');

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

describe('Phase 2A — Gemini Vision Reliability & Interpretation Recovery', () => {
  it('reinterprets an existing persisted artifact without invoking image generation', async () => {
    const { store, cleanup } = createTempStore();
    try {
      // 1. Save artifact (simulating previous attempt)
      const artifact = await store.save('proj-phase2a', {
        imageBase64: sampleBase64,
        mimeType: 'image/jpeg',
        seed: 31777,
        model: 'gemini-3.1-flash-lite-image',
        provider: 'gemini',
        promptVersion: 1,
        prompt: 'Architectural floor plan for an L-shaped residence',
        generatedAt: new Date().toISOString(),
        latencyMs: 1400,
      }, {
        schemaVersion: 1,
        promptVersion: 1,
        prompt: 'Architectural floor plan for an L-shaped residence',
        negativePrompt: '',
        seed: 31777,
        width: 1024,
        height: 1024,
        metadata: { projectId: 'proj-phase2a', projectName: 'Villa 2A', plotWidthMm: 12190, plotDepthMm: 18290, floorsCount: 1, roadFacing: 'north' },
      });

      // 2. Mock image provider: MUST NOT be called!
      const mockImageGen = {
        generateFloorPlan: vi.fn(),
        isAvailable: vi.fn(async () => true),
        getModelInfo: () => ({ model: 'gemini-3.1-flash-lite-image', provider: 'gemini' }),
      };

      // 3. Mock Gemini Vision: returns structured interpretation
      const mockVision = {
        name: 'gemini',
        complete: vi.fn(async () => ({
          content: JSON.stringify(mockInterpretation),
          parsed: mockInterpretation,
          usage: { promptTokens: 300, completionTokens: 150, totalTokens: 450 },
          model: 'gemini-3.1-flash-lite',
          latencyMs: 820,
        })),
        isAvailable: vi.fn(async () => true),
        getModelInfo: () => ({ model: 'gemini-3.1-flash-lite', provider: 'gemini' }),
      };

      const orchestrator = new GenerationOrchestrator({
        provider: mockImageGen as any,
        store,
        gemini: mockVision as any,
        interpreterKind: 'gemini',
      });

      // 4. Perform reinterpretation
      const result = await orchestrator.reinterpretArtifact({
        artifactId: artifact.generationId,
        projectId: 'proj-phase2a',
      });

      // 5. Verify image generation was NEVER called
      expect(mockImageGen.generateFloorPlan).not.toHaveBeenCalled();

      // 6. Verify vision provider was called with exact artifact
      expect(mockVision.complete).toHaveBeenCalledTimes(1);

      // 7. Verify result properties & provenance
      expect(result.success).toBe(true);
      expect(result.artifactId).toBe(artifact.generationId);
      expect(result.projectId).toBe('proj-phase2a');
      expect(result.model).toBe('gemini-3.1-flash-lite');
      expect(result.validated).toBe(true);
      expect(result.validationErrors).toEqual([]);
      expect(result.originalStatus).toBe('REJECTED');
      expect(result.isAccepted).toBe(false); // Does not activate CAD
    } finally {
      cleanup();
    }
  });

  it('rejects reinterpretation if artifact is not found in store', async () => {
    const { store, cleanup } = createTempStore();
    try {
      const orchestrator = new GenerationOrchestrator({
        provider: {} as any,
        store,
        gemini: { isAvailable: async () => true } as any,
        interpreterKind: 'gemini',
      });

      const result = await orchestrator.reinterpretArtifact({
        artifactId: 'non_existent_artifact_id',
        projectId: 'proj-1',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ARTIFACT_NOT_FOUND');
    } finally {
      cleanup();
    }
  });

  it('rejects reinterpretation if requested project ID does not match artifact project ID', async () => {
    const { store, cleanup } = createTempStore();
    try {
      const artifact = await store.save('proj-legit', {
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
        metadata: { projectId: 'proj-legit', projectName: 'Home', plotWidthMm: 10000, plotDepthMm: 10000, floorsCount: 1, roadFacing: 'north' },
      });

      const orchestrator = new GenerationOrchestrator({
        provider: {} as any,
        store,
        gemini: { isAvailable: async () => true } as any,
        interpreterKind: 'gemini',
      });

      const result = await orchestrator.reinterpretArtifact({
        artifactId: artifact.generationId,
        projectId: 'proj-imposter',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PROJECT_MISMATCH');
    } finally {
      cleanup();
    }
  });

  it('correctly reports transient network error during reinterpretation', async () => {
    const { store, cleanup } = createTempStore();
    try {
      const artifact = await store.save('proj-net-test', {
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
        metadata: { projectId: 'proj-net-test', projectName: 'Home', plotWidthMm: 10000, plotDepthMm: 10000, floorsCount: 1, roadFacing: 'north' },
      });

      const netErr = new Error('read ECONNRESET');
      (netErr as any).code = 'ECONNRESET';

      const mockVision = {
        name: 'gemini',
        complete: vi.fn(async () => {
          throw netErr;
        }),
        isAvailable: vi.fn(async () => true),
        getModelInfo: () => ({ model: 'gemini-3.1-flash-lite', provider: 'gemini' }),
      };

      const orchestrator = new GenerationOrchestrator({
        provider: {} as any,
        store,
        gemini: mockVision as any,
        interpreterKind: 'gemini',
      });

      const result = await orchestrator.reinterpretArtifact({
        artifactId: artifact.generationId,
        projectId: 'proj-net-test',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PROVIDER_UNAVAILABLE');
      expect(result.error?.isTransient).toBe(true);
    } finally {
      cleanup();
    }
  });

  it('HTTP endpoint /api/v1/generation/reinterpret-artifact processes reinterpretation requests', async () => {
    const { store, cleanup } = createTempStore();
    try {
      const artifact = await store.save('proj-http-test', {
        imageBase64: sampleBase64,
        mimeType: 'image/jpeg',
        seed: 31777,
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
        seed: 31777,
        width: 1024,
        height: 1024,
        metadata: { projectId: 'proj-http-test', projectName: 'Home', plotWidthMm: 10000, plotDepthMm: 10000, floorsCount: 1, roadFacing: 'north' },
      });

      const mockVision = {
        name: 'gemini',
        complete: vi.fn(async () => ({
          content: JSON.stringify(mockInterpretation),
          parsed: mockInterpretation,
          usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
          model: 'gemini-3.1-flash-lite',
          latencyMs: 500,
        })),
        isAvailable: vi.fn(async () => true),
        getModelInfo: () => ({ model: 'gemini-3.1-flash-lite', provider: 'gemini' }),
      };

      const server = createBackendServer({
        provider: {} as any,
        store,
        gemini: mockVision as any,
        interpreterKind: 'gemini',
      });

      const port = await new Promise<number>((resolve) => {
        const s = server.listen(0, () => {
          const addr = s.address();
          resolve(typeof addr === 'object' && addr ? addr.port : 0);
        });
      });

      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/v1/generation/reinterpret-artifact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            artifactId: artifact.generationId,
            projectId: 'proj-http-test',
          }),
        });

        expect(res.status).toBe(200);
        const data = (await res.json()) as Record<string, any>;
        expect(data.success).toBe(true);
        expect(data.artifactId).toBe(artifact.generationId);
        expect(data.model).toBe('gemini-3.1-flash-lite');
        expect(data.validated).toBe(true);
        expect(data.isAccepted).toBe(false);
      } finally {
        server.close();
      }
    } finally {
      cleanup();
    }
  });
});
