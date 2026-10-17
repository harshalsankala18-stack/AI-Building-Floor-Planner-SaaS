/**
 * Pollinations LIVE provider smoke test — generates ONE real image with the
 * configured model (default qwen/qwen-image-2.1) and verifies a valid image.
 *
 * Opt-in because it spends pollen: POLLINATIONS_LIVE=1 and POLLINATIONS_API_KEY
 * (read from packages/backend/.env when present). Never prints the key.
 *
 *   $env:POLLINATIONS_LIVE='1'; npx vitest run src/__tests__/pollinations-live-smoke.test.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PollinationsImageProvider, type FloorPlanImagePromptRequest } from '@ai-floor-planner/ai-orchestration';
import { resolveImageServiceConfig } from '../env.js';

for (const candidate of [path.join(process.cwd(), '.env'), path.join(process.cwd(), 'packages', 'backend', '.env')]) {
  if (typeof process.loadEnvFile === 'function' && fs.existsSync(candidate)) {
    process.loadEnvFile(candidate);
    break;
  }
}

const config = resolveImageServiceConfig();
const live = process.env.POLLINATIONS_LIVE === '1' && config.pollinationsApiKey.length > 0;

function imageSize(buf: Buffer): { width: number; height: number } | null {
  if (buf[0] === 0x89 && buf.toString('latin1', 12, 16) === 'IHDR') return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) return null;
      const marker = buf[i + 1]!;
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xc3) return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  }
  return null;
}

describe('Pollinations live smoke (one real image)', () => {
  it.runIf(live)(`${config.pollinationsImageModel}: returns a byte-valid PNG/JPEG with truthful provenance`, async () => {
    const provider = new PollinationsImageProvider({
      apiKey: config.pollinationsApiKey,
      model: config.pollinationsImageModel,
      baseUrl: config.pollinationsBaseUrl,
      timeoutMs: config.pollinationsTimeoutMs,
    });
    const access = await provider.checkAccess();
    expect(access.status).toBe('REACHABLE');

    const request: FloorPlanImagePromptRequest = {
      schemaVersion: 1,
      promptVersion: 3,
      prompt: 'Clean 2D top-down architectural floor plan of a small apartment, black walls on white, English labels LIVING, KITCHEN, BEDROOM, BATH.',
      negativePrompt: '',
      seed: 42,
      width: 768,
      height: 768,
      metadata: { projectName: 'pollinations-smoke', plotWidthMm: 10000, plotDepthMm: 10000, floorsCount: 1, roadFacing: 'north' },
    };
    const image = await provider.generateFloorPlan(request);
    const bytes = Buffer.from(image.imageBase64, 'base64');
    const size = imageSize(bytes);
    console.log('[pollinations-live-smoke]', JSON.stringify({ model: image.model, mimeType: image.mimeType, bytes: bytes.length, size, latencyMs: image.latencyMs, providerRequest: image.providerRequest }));

    expect(image.provider).toBe('pollinations');
    expect(image.model).toBe(config.pollinationsImageModel);
    expect(['image/png', 'image/jpeg']).toContain(image.mimeType);
    expect(bytes.length).toBeGreaterThan(1000);
    expect(size).not.toBeNull();
    expect(size!.width).toBeGreaterThan(0);
    expect(size!.height).toBeGreaterThan(0);
    expect(image.providerRequest).toMatchObject({ endpoint: '/v1/images/generations', seedSent: false, referenceIdsSent: [] });
    expect(JSON.stringify(image.providerRequest)).not.toContain(config.pollinationsApiKey);

    const out = path.resolve(process.cwd(), '..', '..', 'scripts', 'provider_ab_output');
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, `pollinations_smoke.${image.mimeType === 'image/jpeg' ? 'jpg' : 'png'}`), bytes);
  }, 240_000);
});
