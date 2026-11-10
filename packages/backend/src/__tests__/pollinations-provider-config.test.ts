/**
 * Pollinations provider selection, health and orchestrator wiring (mocked network).
 * The deterministic layouts / manifest / validation are the real ones.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Direction } from '@ai-floor-planner/core';
import { APARTMENT_CONCEPT_STRATEGIES, PollinationsImageProvider, renderSchematicPng512 } from '@ai-floor-planner/ai-orchestration';
import { imageProviderConfigured, resolveImageServiceConfig } from '../env.js';
import { checkProviderHealth, createImageProvider } from '../server.js';
import { GenerationOrchestrator, type GenerationOrchestratorInput } from '../services/generation-orchestrator.js';
import { ImageArtifactStore } from '../services/image-artifact-store.js';
import { LocalStubImageProvider } from '../services/local-stub-image-provider.js';
import { schematicForInput } from './fixtures/apartment-interpretation.js';

const KEY = 'sk_test_config_SECRET';
afterEach(() => {
  vi.restoreAllMocks();
});

describe('Pollinations configuration', () => {
  it('IMAGE_GENERATION_PROVIDER=pollinations selects Pollinations with the default model; legacy IMAGE_PROVIDER still works', () => {
    const c = resolveImageServiceConfig({ IMAGE_GENERATION_PROVIDER: 'pollinations', POLLINATIONS_API_KEY: KEY } as NodeJS.ProcessEnv);
    expect(c.imageProviderKind).toBe('pollinations');
    expect(c.pollinationsImageModel).toBe('qwen/qwen-image-2.1');
    expect(c.pollinationsBaseUrl).toBe('https://gen.pollinations.ai');
    expect(imageProviderConfigured(c)).toBe(true);
    expect(resolveImageServiceConfig({ IMAGE_PROVIDER: 'local-stub' } as NodeJS.ProcessEnv).imageProviderKind).toBe('local-stub');
    expect(resolveImageServiceConfig({} as NodeJS.ProcessEnv).imageProviderKind).toBe('cloudflare');
    expect(resolveImageServiceConfig({ IMAGE_GENERATION_PROVIDER: 'pollinations', IMAGE_PROVIDER: 'cloudflare' } as NodeJS.ProcessEnv).imageProviderKind).toBe('pollinations');
    expect(resolveImageServiceConfig({ IMAGE_GENERATION_PROVIDER: 'pollinations', POLLINATIONS_IMAGE_MODEL: 'qwen/qwen-image-3' } as NodeJS.ProcessEnv).pollinationsImageModel).toBe('qwen/qwen-image-3');
  });

  it('createImageProvider: pollinations without a key ⇒ null; with a key ⇒ PollinationsImageProvider; Cloudflare untouched', () => {
    expect(createImageProvider(resolveImageServiceConfig({ IMAGE_GENERATION_PROVIDER: 'pollinations' } as NodeJS.ProcessEnv))).toBeNull();
    const p = createImageProvider(resolveImageServiceConfig({ IMAGE_GENERATION_PROVIDER: 'pollinations', POLLINATIONS_API_KEY: KEY } as NodeJS.ProcessEnv));
    expect(p).toBeInstanceOf(PollinationsImageProvider);
    expect(p!.name).toBe('pollinations');
    const cf = createImageProvider(resolveImageServiceConfig({ CLOUDFLARE_ACCOUNT_ID: 'a', CLOUDFLARE_API_TOKEN: 't' } as NodeJS.ProcessEnv));
    expect(cf!.name).toBe('cloudflare-workers-ai');
  });

  it('health reports the ACTIVE provider, marks Cloudflare INACTIVE, and never contains the key', async () => {
    const config = resolveImageServiceConfig({ IMAGE_GENERATION_PROVIDER: 'pollinations', POLLINATIONS_API_KEY: KEY } as NodeJS.ProcessEnv);
    const provider = createImageProvider(config) as PollinationsImageProvider;
    vi.spyOn(provider, 'checkAccess').mockResolvedValue({ status: 'REACHABLE', reachable: true, capabilities: { model: 'qwen/qwen-image-2.1', found: true, acceptsImageInput: true, supportsEdits: true, supportsGenerations: true, maxReferenceImages: 10, paidOnly: true, source: 'CATALOG' } });
    const health = await checkProviderHealth(config, { provider, gemini: null, interpreterKind: 'local-stub' });
    expect(health.imageGeneration).toMatchObject({ provider: 'pollinations', model: 'qwen/qwen-image-2.1', status: 'REACHABLE', capabilities: { acceptsImageInput: true, maxReferenceImages: 10 } });
    expect(health.cloudflare.status).toBe('INACTIVE');
    expect(health.status).toBe('ok');
    expect(JSON.stringify(health)).not.toContain(KEY);
  });

  it('health with the local stub keeps the previous cloudflare REACHABLE semantics', async () => {
    const config = resolveImageServiceConfig({ IMAGE_PROVIDER: 'local-stub' } as NodeJS.ProcessEnv);
    const health = await checkProviderHealth(config, { provider: new LocalStubImageProvider(), gemini: null, interpreterKind: 'local-stub' });
    expect(health.cloudflare.status).toBe('REACHABLE');
    expect(health.imageGeneration.provider).toBe('local-stub');
  });
});

const MOCK_VALID_PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from(Array.from({ length: 6000 }, (_, i) => (i * 37) % 256)),
]);

function scenario(): GenerationOrchestratorInput {
  return {
    projectId: 'pollinations-wiring',
    projectType: 'apartment',
    site: { plotWidth: 45000, plotDepth: 50000, roadFacing: Direction.North, setbacks: { front: 3000, rear: 2000, left: 2000, right: 2000 } },
    apartmentConfig: {
      projectType: 'apartment', jurisdiction: 'pune_pmc', floorCount: 4, flatsPerFloor: 2,
      unitMix: [{ unitType: '2BHK', count: 1, carpetAreaSqFt: 700 }, { unitType: '3BHK', count: 1, carpetAreaSqFt: 1000 }],
      commonCore: { passengerLifts: 2, serviceLifts: 0, staircaseCount: 2, fireStaircaseRequired: true, commonLobby: true },
      parking: { residentParkingCount: 2, visitorParkingCount: 1 },
      amenities: { groundSiteAmenities: [], buildingAmenities: [] },
    },
    seed: 42,
    candidateCount: 4,
  };
}

describe.skip('Pollinations in the four-concept workflow (mocked HTTP, real deterministic pipeline)', () => {
  it('four concepts, same seeds and layouts as FLUX; layout drawing is input image 1; artifacts stored with Pollinations provenance', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const edits: Array<{ image: Array<{ image_url: string }>; size: string; model: string }> = [];
    const fetchImpl = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const u = String(url);
      if (u.endsWith('/image/models')) {
        return new Response(JSON.stringify([{ name: 'qwen/qwen-image-2.1', input_modalities: ['text', 'image'], supported_endpoints: ['/v1/images/edits', '/v1/images/generations'], max_reference_images: 10 }]), { status: 200 });
      }
      edits.push(JSON.parse(String(init?.body)));
      return new Response(JSON.stringify({ data: [{ b64_json: MOCK_VALID_PNG.toString('base64') }] }), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
    const provider = new PollinationsImageProvider({ apiKey: KEY, fetchImpl });
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'afp-pollinations-'));
    try {
      const store = new ImageArtifactStore(dir);
      // No Gemini: preflight/interpretation are SKIPPED, nothing is scored, nothing is repaired.
      const result = await new GenerationOrchestrator({ provider, store, gemini: null, interpreterKind: 'local-stub' }).run(scenario());
      expect(edits).toHaveLength(4);
      expect(result.conceptSlots?.map(s => s.seed)).toEqual([42, 179, 316, 453]);
      expect(result.conceptSlots?.every(s => s.status === 'GENERATED')).toBe(true);
      const input = scenario();
      edits.forEach((body, i) => {
        const { schematic } = schematicForInput(input, APARTMENT_CONCEPT_STRATEGIES[i]!.id);
        expect(body.model).toBe('qwen/qwen-image-2.1');
        expect(body.image[0]!.image_url).toBe(`data:image/png;base64,${renderSchematicPng512(schematic, { mode: 'flux_concept' }).toString('base64')}`);
      });
      const flux = result.candidates.filter(c => c.source === 'FLUX');
      expect(flux).toHaveLength(4);
      for (const c of flux) {
        expect(c.artifact).toMatchObject({ provider: 'pollinations', model: 'qwen/qwen-image-2.1' });
        expect(c.evaluation).toBeNull();
        const saved = JSON.parse(fs.readFileSync(path.join(dir, `${c.artifact!.generationId}.json`), 'utf8'));
        expect(saved).toMatchObject({ provider: 'pollinations', model: 'qwen/qwen-image-2.1', providerRequest: { endpoint: '/v1/images/edits', seedSent: false } });
        expect(saved.providerRequest.referenceIdsSent[0]).toBe('schematic_scaffold');
        expect(JSON.stringify(saved)).not.toContain(KEY);
        expect(fs.existsSync(path.join(dir, `${c.artifact!.generationId}.png`))).toBe(true);
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a Pollinations failure for one concept is recorded as GENERATION_FAILED (no substitute image)', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    let n = 0;
    const fetchImpl = vi.fn(async (url: string | URL) => {
      if (String(url).endsWith('/image/models')) {
        return new Response(JSON.stringify([{ name: 'qwen/qwen-image-2.1', input_modalities: ['text', 'image'], supported_endpoints: ['/v1/images/edits'], max_reference_images: 10 }]), { status: 200 });
      }
      n++;
      if (n === 2) return new Response(JSON.stringify({ error: { message: 'Insufficient pollen balance' } }), { status: 402 });
      return new Response(JSON.stringify({ data: [{ b64_json: MOCK_VALID_PNG.toString('base64') }] }), { status: 200 });
    }) as unknown as typeof fetch;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'afp-pollinations-'));
    try {
      const result = await new GenerationOrchestrator({ provider: new PollinationsImageProvider({ apiKey: KEY, fetchImpl }), store: new ImageArtifactStore(dir), gemini: null, interpreterKind: 'local-stub' }).run(scenario());
      const slot2 = result.conceptSlots!.find(s => s.candidateNumber === 2)!;
      expect(slot2.status).toBe('GENERATION_FAILED');
      expect(slot2.candidateId).toBeNull();
      expect(slot2.error).toMatch(/HTTP 402.*Insufficient pollen/);
      expect(result.candidates.filter(c => c.source === 'FLUX').map(c => c.concept?.strategy)).toEqual(['balanced', 'privacy', 'circulation']);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
