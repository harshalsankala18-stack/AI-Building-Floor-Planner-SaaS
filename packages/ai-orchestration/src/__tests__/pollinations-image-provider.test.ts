/**
 * PollinationsImageProvider — mocked transport (no network, no spend).
 * The live one-image smoke test lives in packages/backend (POLLINATIONS_LIVE=1).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildPollinationsImageRequest,
  DEFAULT_POLLINATIONS_IMAGE_MODEL,
  parsePollinationsModelCapabilities,
  PollinationsImageProvider,
  POLLINATIONS_EDITS_PATH,
  POLLINATIONS_GENERATIONS_PATH,
} from '../providers/pollinations-image';
import { ImageProviderError } from '../providers/image-generation';
import type { FloorPlanImagePromptRequest, ReferenceImageInput } from '../orchestration/image-prompt-compiler';

const KEY = 'sk_test_SECRET_value_123';
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489', 'hex');
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46]);

const QWEN = {
  name: 'qwen/qwen-image-2.1', aliases: [], input_modalities: ['text', 'image'], output_modalities: ['image'],
  supported_endpoints: ['/v1/images/generations', '/v1/images/edits', '/image/{prompt}'], max_reference_images: 10, paid_only: true,
};
const TEXT_ONLY = { name: 'vendor/text-only-image', aliases: ['tio'], input_modalities: ['text'], supported_endpoints: ['/v1/images/generations'], max_reference_images: 0 };
const TWO_REFS = { ...QWEN, name: 'vendor/two-refs', max_reference_images: 2 };

const ref = (id: string): ReferenceImageInput => ({ id, name: `${id}.png`, base64Data: PNG.toString('base64'), mimeType: 'image/png' });
function request(refs: ReferenceImageInput[] = [ref('schematic_scaffold'), ref('ref_concept_01'), ref('ref_concept_02')]): FloorPlanImagePromptRequest {
  return {
    schemaVersion: 1, promptVersion: 3, prompt: 'Generate ONE professional top-down Indian apartment floor plan.', negativePrompt: 'NO VILLA',
    seed: 42, width: 960, height: 1088, referenceImages: refs,
    referenceDiagnostics: { bucket: 'flats_2', requestedReferenceIds: ['ref_concept_01', 'ref_concept_02'], selectedReferenceIds: ['ref_concept_01', 'ref_concept_02'], attachedReferenceIds: ['ref_concept_01', 'ref_concept_02'], drops: [], status: 'AVAILABLE', distinctReferencesAvailable: 2 },
    metadata: { projectName: 'p', plotWidthMm: 45000, plotDepthMm: 50000, floorsCount: 4, roadFacing: 'north' },
  };
}

interface Call { url: string; init?: RequestInit }
function mockFetch(catalog: unknown[], reply: (call: Call) => Response) {
  const calls: Call[] = [];
  const fn = vi.fn(async (url: string | URL, init?: RequestInit) => {
    const call = { url: String(url), init };
    calls.push(call);
    if (call.url.endsWith('/image/models')) return new Response(JSON.stringify(catalog), { status: 200, headers: { 'content-type': 'application/json' } });
    return reply(call);
  });
  return { fn: fn as unknown as typeof fetch, calls };
}
const okJson = (bytes: Buffer) => new Response(JSON.stringify({ created: 1, data: [{ b64_json: bytes.toString('base64') }] }), { status: 200, headers: { 'content-type': 'application/json' } });
const bodyOf = (c: Call) => JSON.parse(String(c.init?.body)) as Record<string, unknown>;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('parsePollinationsModelCapabilities', () => {
  it('reads image-input support and the reference cap from the catalog (name or alias)', () => {
    expect(parsePollinationsModelCapabilities([QWEN], 'qwen/qwen-image-2.1')).toMatchObject({ found: true, acceptsImageInput: true, supportsEdits: true, maxReferenceImages: 10, paidOnly: true });
    expect(parsePollinationsModelCapabilities([TEXT_ONLY], 'tio')).toMatchObject({ found: true, acceptsImageInput: false, maxReferenceImages: 0 });
    expect(parsePollinationsModelCapabilities({ data: [QWEN] }, 'qwen/qwen-image-2.1').found).toBe(true);
    expect(parsePollinationsModelCapabilities([QWEN], 'nope/missing')).toMatchObject({ found: false, maxReferenceImages: 0 });
  });
});

describe('buildPollinationsImageRequest', () => {
  it('references → /v1/images/edits with data URIs in order (layout drawing first); no seed, no negative prompt', () => {
    const r = buildPollinationsImageRequest(request(), DEFAULT_POLLINATIONS_IMAGE_MODEL, request().referenceImages!);
    expect(r.endpointPath).toBe(POLLINATIONS_EDITS_PATH);
    expect(r.referenceIdsSent).toEqual(['schematic_scaffold', 'ref_concept_01', 'ref_concept_02']);
    expect(r.body).toMatchObject({ model: 'qwen/qwen-image-2.1', size: '960x1088', n: 1, response_format: 'b64_json', prompt: request().prompt });
    expect((r.body.image as { image_url: string }[])[0]!.image_url.startsWith('data:image/png;base64,')).toBe(true);
    expect(r.body).not.toHaveProperty('seed');
    expect(r.body).not.toHaveProperty('negative_prompt');
  });

  it('no references → /v1/images/generations without an image field; deterministic for the same input', () => {
    const a = buildPollinationsImageRequest(request([]), 'm', []);
    expect(a.endpointPath).toBe(POLLINATIONS_GENERATIONS_PATH);
    expect(a.body).not.toHaveProperty('image');
    expect(JSON.stringify(buildPollinationsImageRequest(request([]), 'm', []))).toBe(JSON.stringify(a));
  });
});

describe('PollinationsImageProvider.generateFloorPlan', () => {
  it('sends the layout drawing + references, returns a valid image with truthful provenance, never leaks the key', async () => {
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => void logs.push(a.join(' ')));
    vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => void logs.push(a.join(' ')));
    const { fn, calls } = mockFetch([QWEN], () => okJson(PNG));
    const p = new PollinationsImageProvider({ apiKey: KEY, fetchImpl: fn });
    const img = await p.generateFloorPlan(request());
    const gen = calls.find(c => c.url.endsWith(POLLINATIONS_EDITS_PATH))!;
    expect(gen.url).toBe('https://gen.pollinations.ai/v1/images/edits');
    expect((gen.init!.headers as Record<string, string>).Authorization).toBe(`Bearer ${KEY}`);
    expect((bodyOf(gen).image as unknown[]).length).toBe(3);
    expect(img).toMatchObject({ provider: 'pollinations', model: 'qwen/qwen-image-2.1', mimeType: 'image/png', seed: 42, promptVersion: 3 });
    expect(Buffer.from(img.imageBase64, 'base64').equals(PNG)).toBe(true);
    expect(img.providerRequest).toEqual({ endpoint: POLLINATIONS_EDITS_PATH, size: '960x1088', seedSent: false, referenceIdsSent: ['schematic_scaffold', 'ref_concept_01', 'ref_concept_02'], maxReferenceImages: 10 });
    expect(img.referenceDiagnostics?.attachedReferenceIds).toEqual(['ref_concept_01', 'ref_concept_02']);
    expect(img.referenceDiagnostics?.distinctReferencesAvailable).toBe(2);
    expect(logs.join('\n')).not.toContain(KEY);
    expect(logs.some(l => l.includes('"stage":"success"'))).toBe(true);
  });

  it('caps references at the catalog max_reference_images and records the drops (layout drawing kept first)', async () => {
    const { fn, calls } = mockFetch([TWO_REFS], () => okJson(JPEG));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const img = await new PollinationsImageProvider({ apiKey: KEY, model: 'vendor/two-refs', fetchImpl: fn }).generateFloorPlan(request());
    const sent = bodyOf(calls.find(c => c.url.endsWith(POLLINATIONS_EDITS_PATH))!).image as unknown[];
    expect(sent).toHaveLength(2);
    expect(img.mimeType).toBe('image/jpeg');
    expect(img.providerRequest?.referenceIdsSent).toEqual(['schematic_scaffold', 'ref_concept_01']);
    expect(img.referenceDiagnostics?.status).toBe('PARTIAL');
    expect(img.referenceDiagnostics?.drops.map(d => d.id)).toEqual(['ref_concept_02']);
  });

  it('never silently drops the layout drawing: text-only model ⇒ IMAGE_PROVIDER_CAPABILITY_ERROR and no generation call', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { fn, calls } = mockFetch([TEXT_ONLY], () => okJson(PNG));
    await expect(new PollinationsImageProvider({ apiKey: KEY, model: 'vendor/text-only-image', fetchImpl: fn }).generateFloorPlan(request()))
      .rejects.toMatchObject({ code: 'IMAGE_PROVIDER_CAPABILITY_ERROR' });
    expect(calls.filter(c => !c.url.endsWith('/image/models'))).toHaveLength(0);
  });

  it('catalog unavailable ⇒ capability NOT confirmed ⇒ no references sent (layout request fails honestly)', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const fn = vi.fn(async (url: string | URL) => (String(url).endsWith('/image/models') ? new Response('down', { status: 503 }) : okJson(PNG))) as unknown as typeof fetch;
    await expect(new PollinationsImageProvider({ apiKey: KEY, fetchImpl: fn }).generateFloorPlan(request()))
      .rejects.toMatchObject({ code: 'IMAGE_PROVIDER_CAPABILITY_ERROR' });
  });

  it('style-only references on a text-only model are dropped with a recorded reason and the request goes to /generations', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { fn, calls } = mockFetch([TEXT_ONLY], () => okJson(PNG));
    const img = await new PollinationsImageProvider({ apiKey: KEY, model: 'tio', fetchImpl: fn }).generateFloorPlan(request([ref('ref_concept_01')]));
    expect(calls.some(c => c.url.endsWith(POLLINATIONS_GENERATIONS_PATH))).toBe(true);
    expect(img.providerRequest?.referenceIdsSent).toEqual([]);
    expect(img.referenceDiagnostics?.status).toBe('DROPPED');
    expect(img.referenceDiagnostics?.drops[0]!.reason).toMatch(/does not confirm image input/);
  });

  it.each([
    [401, 'POLLINATIONS_AUTH_ERROR'],
    [402, 'POLLINATIONS_PAYMENT_REQUIRED'],
    [429, 'POLLINATIONS_RATE_LIMITED'],
    [504, 'IMAGE_PROVIDER_TIMEOUT'],
    [400, 'IMAGE_PROVIDER_HTTP_ERROR'],
  ])('HTTP %i ⇒ %s with the provider message, key redacted', async (status, code) => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const warns: string[] = [];
    vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => void warns.push(a.join(' ')));
    const { fn } = mockFetch([QWEN], () => new Response(JSON.stringify({ error: { message: `upstream said no for ${KEY}` } }), { status, headers: { 'content-type': 'application/json' } }));
    const err = (await new PollinationsImageProvider({ apiKey: KEY, fetchImpl: fn }).generateFloorPlan(request()).catch(e => e)) as ImageProviderError;
    expect(err).toBeInstanceOf(ImageProviderError);
    expect(err.code).toBe(code);
    expect(err.status).toBe(status);
    expect(err.message).toContain('upstream said no');
    expect(err.message).not.toContain(KEY);
    expect(warns.join('\n')).not.toContain(KEY);
  });

  it('rejects responses that are not PNG/JPEG or contain no image', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const webp = Buffer.from('RIFF0000WEBPVP8 ', 'latin1');
    const a = mockFetch([QWEN], () => okJson(webp));
    await expect(new PollinationsImageProvider({ apiKey: KEY, fetchImpl: a.fn }).generateFloorPlan(request())).rejects.toMatchObject({ code: 'IMAGE_PROVIDER_INVALID_RESPONSE' });
    const b = mockFetch([QWEN], () => new Response(JSON.stringify({ data: [] }), { status: 200, headers: { 'content-type': 'application/json' } }));
    await expect(new PollinationsImageProvider({ apiKey: KEY, fetchImpl: b.fn }).generateFloorPlan(request())).rejects.toMatchObject({ code: 'IMAGE_PROVIDER_INVALID_RESPONSE' });
  });

  it('not configured ⇒ IMAGE_PROVIDER_NOT_CONFIGURED without any network call', async () => {
    const fn = vi.fn() as unknown as typeof fetch;
    await expect(new PollinationsImageProvider({ apiKey: '  ', fetchImpl: fn }).generateFloorPlan(request())).rejects.toMatchObject({ code: 'IMAGE_PROVIDER_NOT_CONFIGURED' });
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('PollinationsImageProvider.checkAccess (health, no generation)', () => {
  it('valid key + permitted model + catalog ⇒ REACHABLE with capabilities', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { fn, calls } = mockFetch([QWEN], () => new Response(JSON.stringify({ valid: true, permissions: { models: ['qwen/qwen-image-2.1'] } }), { status: 200 }));
    const r = await new PollinationsImageProvider({ apiKey: KEY, fetchImpl: fn }).checkAccess();
    expect(r).toMatchObject({ status: 'REACHABLE', reachable: true, capabilities: { acceptsImageInput: true, maxReferenceImages: 10 } });
    expect(calls.some(c => c.url.endsWith('/v1/images/edits') || c.url.endsWith('/v1/images/generations'))).toBe(false);
  });

  it('rejected key ⇒ AUTH_FAILED; model not permitted ⇒ MODEL_UNAVAILABLE', async () => {
    const auth = mockFetch([QWEN], () => new Response('{}', { status: 401 }));
    expect((await new PollinationsImageProvider({ apiKey: KEY, fetchImpl: auth.fn }).checkAccess()).status).toBe('AUTH_FAILED');
    const perm = mockFetch([QWEN], () => new Response(JSON.stringify({ valid: true, permissions: { models: ['other/model'] } }), { status: 200 }));
    expect((await new PollinationsImageProvider({ apiKey: KEY, fetchImpl: perm.fn }).checkAccess()).status).toBe('MODEL_UNAVAILABLE');
  });
});
