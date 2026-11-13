/**
 * Gemini Image Provider — Server-side image generation using Google Generative AI API.
 * Supports configurable models (gemini-3-pro-image, gemini-3.1-flash-image, etc.).
 */

import crypto from 'node:crypto';
import {
  ImageProviderError,
  type GeneratedPlanImage,
  type GeneratedPlanImageRequestProvenance,
  type ImageGenerationProvider,
} from './image-generation.js';
import type { FloorPlanImagePromptRequest, ReferenceImageInput } from '../orchestration/image-prompt-compiler.js';

export const DEFAULT_GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-lite-image' as const;
export const DEFAULT_GEMINI_IMAGE_SIZE = '1K' as const;
export const GEMINI_IMAGE_PROVIDER_NAME = 'gemini' as const;
export const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export type GeminiImageAspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16';
export type GeminiImageSize = '1K' | '2K' | '4K';

export type GeminiAccessStatus =
  | 'REACHABLE'
  | 'AUTH_FAILED'
  | 'RATE_LIMITED'
  | 'QUOTA_EXCEEDED'
  | 'MODEL_UNAVAILABLE'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'NOT_CONFIGURED';

export interface GeminiAccessCheck {
  readonly status: GeminiAccessStatus;
  readonly reachable: boolean;
  readonly imageModelReachable: boolean;
  readonly model: string;
  readonly detail?: string;
  readonly authenticationStatus: 'AUTHENTICATED' | 'AUTH_FAILED' | 'NOT_CONFIGURED';
  readonly modelAvailability: 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN';
  readonly rateLimits: 'OK' | 'EXCEEDED' | 'UNKNOWN';
  readonly quotaState: 'OK' | 'EXCEEDED' | 'UNKNOWN';
  readonly lastSuccessfulGeneration: string | null;
}

export interface GeminiImageProviderOptions {
  readonly apiKey: string;
  readonly model?: string;
  readonly endpointBase?: string;
  readonly imageSize?: GeminiImageSize;
  readonly timeoutMs?: number;
  readonly fetchImpl?: typeof fetch;
}

export interface GeminiImageRequestProvenance extends GeneratedPlanImageRequestProvenance {
  readonly promptHash: string;
  readonly structuralImageHash?: string;
  readonly structuralRepresentationHash?: string;
  readonly referenceHashes: readonly string[];
  readonly rendererVersion?: string;
  readonly aspectRatio: GeminiImageAspectRatio;
  readonly apiRequestId?: string;
}

export function mapDimensionsToGeminiAspectRatio(width?: number, height?: number): GeminiImageAspectRatio {
  if (!width || !height || width <= 0 || height <= 0) {
    return '4:3';
  }
  const ratio = width / height;
  if (Math.abs(ratio - 1) < 0.1) return '1:1';
  if (Math.abs(ratio - 4 / 3) < 0.15) return '4:3';
  if (Math.abs(ratio - 3 / 4) < 0.15) return '3:4';
  if (Math.abs(ratio - 16 / 9) < 0.15) return '16:9';
  if (Math.abs(ratio - 9 / 16) < 0.15) return '9:16';
  return ratio > 1 ? '4:3' : '3:4';
}

export function buildGeminiImagePrompt(request: FloorPlanImagePromptRequest, options: { hasStructuralPlan: boolean; styleReferenceCount: number }): string {
  const parts: string[] = [];
  if (options.hasStructuralPlan) {
    parts.push('PRIMARY MANDATE (IMAGE 1 — AUTHORITATIVE STRUCTURAL PLAN)');
    parts.push('Treat the supplied structural plan as authoritative.');
    parts.push('Preserve its geometry exactly.');
    parts.push('Do not redesign the layout.');
    parts.push('Do not move the core.');
    parts.push('THE STRUCTURAL PLAN WINS.');
  }
  parts.push(request.prompt);
  parts.push('Do NOT generate 3D perspective views.');
  parts.push('Do NOT generate exterior building renderings.');
  if (options.hasStructuralPlan) {
    parts.push('Do NOT render authoritative room labels.');
  } else {
    parts.push('Use clear English room labels where supported. Do NOT invent exact technical dimensions, certifications, or building-code approvals.');
  }
  parts.push('Top-down orthographic 2D floor plan view only.');
  return parts.join('\n');
}

export function separateGeminiReferenceImages(images: readonly ReferenceImageInput[]): { structuralRef?: ReferenceImageInput; styleRefs: ReferenceImageInput[] } {
  const structural = images.find(i => i.id === 'structural_reference');
  const styles = images.filter(i => i.id !== 'structural_reference');
  return { structuralRef: structural, styleRefs: [...styles] };
}

export function buildGeminiImageRequestBody(request: FloorPlanImagePromptRequest, options: { model: string; imageSize: GeminiImageSize }): any {
  const { structuralRef, styleRefs } = separateGeminiReferenceImages(request.referenceImages ?? []);
  const aspect = mapDimensionsToGeminiAspectRatio(request.width, request.height);
  const parts: Array<Record<string, unknown>> = [];
  const referenceIdsSent: string[] = [];

  if (structuralRef) {
    parts.push({ inlineData: { mimeType: structuralRef.mimeType, data: structuralRef.base64Data } });
    referenceIdsSent.push(structuralRef.id);
  }
  for (const ref of styleRefs) {
    parts.push({ inlineData: { mimeType: ref.mimeType, data: ref.base64Data } });
    referenceIdsSent.push(ref.id);
  }
  parts.push({ text: buildGeminiImagePrompt(request, { hasStructuralPlan: Boolean(structuralRef), styleReferenceCount: styleRefs.length }) });

  return {
    structuralRef,
    styleRefs,
    referenceIdsSent,
    aspectRatio: aspect,
    body: {
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: aspect,
          imageSize: options.imageSize,
        },
      },
    },
  };
}

export function extractGeminiImageBytes(response: any): { mimeType: string; buffer: Buffer; textParts?: string[] } {
  if (response.error) {
    const code = response.error.code;
    if (code === 401 || code === 403 || response.error.status === 'UNAUTHENTICATED' || response.error.status === 'PERMISSION_DENIED') {
      const err = new ImageProviderError('GEMINI_AUTH_ERROR', response.error.message || 'Gemini authentication failed', code ?? 401);
      throw err;
    }
    if (code === 429 || response.error.status === 'RESOURCE_EXHAUSTED') {
      const err = new ImageProviderError('GEMINI_RATE_LIMITED', response.error.message || 'Gemini rate limited', 429);
      throw err;
    }
    throw new ImageProviderError('API_ERROR', response.error.message || 'Gemini error', typeof code === 'number' ? code : undefined);
  }

  const textParts: string[] = [];
  const candidates = response.candidates ?? [];
  for (const cand of candidates) {
    const parts = cand.content?.parts ?? [];
    for (const part of parts) {
      if (part.text) {
        textParts.push(part.text);
      }
      const inlineData = part.inlineData ?? part.inline_data;
      if (inlineData) {
        const mimeType = inlineData.mimeType ?? inlineData.mime_type;
        const data = inlineData.data;
        if (mimeType && data) {
          const buf = Buffer.from(data, 'base64');
          if (buf.length < 50) {
            throw new ImageProviderError('IMAGE_EMPTY', 'Received empty or suspiciously small image payload from Gemini');
          }
          return { mimeType, buffer: buf, ...(textParts.length > 0 ? { textParts } : {}) };
        }
      }
    }
  }

  const predictions = response.predictions ?? [];
  for (const pred of predictions) {
    const mimeType = pred.mimeType ?? pred.mime_type;
    const data = pred.bytesBase64Encoded ?? pred.bytes_base64_encoded;
    if (data && mimeType) {
      const buf = Buffer.from(data, 'base64');
      if (buf.length < 50) {
        throw new ImageProviderError('IMAGE_EMPTY', 'Received empty or suspiciously small image payload from Gemini');
      }
      return { mimeType, buffer: buf };
    }
  }

  throw new ImageProviderError('IMAGE_EMPTY', textParts[0] || 'No image data in Gemini response');
}

export class GeminiImageProvider implements ImageGenerationProvider {
  readonly name = GEMINI_IMAGE_PROVIDER_NAME;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly endpointBase: string;
  private readonly imageSize: GeminiImageSize;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private lastSuccessfulGeneration: string | null = null;

  constructor(options: GeminiImageProviderOptions) {
    this.apiKey = (options.apiKey ?? '').trim();
    this.model = (options.model ?? '').trim() || DEFAULT_GEMINI_IMAGE_MODEL;
    // gemini-3.1-flash-lite-image specifically supports 1K resolution; do not configure unsupported 2K/4K.
    if (this.model === 'gemini-3.1-flash-lite-image') {
      this.imageSize = '1K';
    } else {
      this.imageSize = options.imageSize ?? DEFAULT_GEMINI_IMAGE_SIZE;
    }
    this.endpointBase = (options.endpointBase ?? '').trim() || GEMINI_API_BASE_URL;
    this.timeoutMs = options.timeoutMs ?? 60_000;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  getLastSuccessfulGeneration(): string | null {
    return this.lastSuccessfulGeneration;
  }

  async checkAccess(): Promise<GeminiAccessCheck> {
    if (!this.apiKey) {
      return {
        status: 'NOT_CONFIGURED',
        reachable: false,
        imageModelReachable: false,
        model: this.model,
        detail: 'GEMINI_API_KEY is not configured',
        authenticationStatus: 'NOT_CONFIGURED',
        modelAvailability: 'UNKNOWN',
        rateLimits: 'UNKNOWN',
        quotaState: 'UNKNOWN',
        lastSuccessfulGeneration: this.lastSuccessfulGeneration,
      };
    }

    try {
      const url = `${this.endpointBase}/${encodeURIComponent(this.model)}?key=${encodeURIComponent(this.apiKey)}`;
      const res = await this.fetchImpl(url, {
        method: 'GET',
        signal: AbortSignal.timeout(Math.min(5000, this.timeoutMs)),
      });

      if (res.ok) {
        return {
          status: 'REACHABLE',
          reachable: true,
          imageModelReachable: true,
          model: this.model,
          authenticationStatus: 'AUTHENTICATED',
          modelAvailability: 'AVAILABLE',
          rateLimits: 'OK',
          quotaState: 'OK',
          lastSuccessfulGeneration: this.lastSuccessfulGeneration,
        };
      }

      let errDetail: string | undefined;
      try {
        const body = await res.json() as { error?: { message?: string } };
        if (body?.error?.message) {
          errDetail = body.error.message;
        }
      } catch {
        // Ignored
      }

      if (res.status === 401 || res.status === 403) {
        return {
          status: 'AUTH_FAILED',
          reachable: false,
          imageModelReachable: false,
          model: this.model,
          detail: errDetail ? `Gemini API key is unauthorized: ${errDetail} (HTTP ${res.status})` : `Gemini API key is invalid or unauthorized (HTTP ${res.status})`,
          authenticationStatus: 'AUTH_FAILED',
          modelAvailability: 'UNKNOWN',
          rateLimits: 'UNKNOWN',
          quotaState: 'UNKNOWN',
          lastSuccessfulGeneration: this.lastSuccessfulGeneration,
        };
      }
      if (res.status === 429) {
        const isQuota = /quota|exhausted/i.test(errDetail ?? '');
        return {
          status: isQuota ? 'QUOTA_EXCEEDED' : 'RATE_LIMITED',
          reachable: false,
          imageModelReachable: false,
          model: this.model,
          detail: errDetail || 'Gemini rate limit or quota exceeded',
          authenticationStatus: 'AUTHENTICATED',
          modelAvailability: 'AVAILABLE',
          rateLimits: 'EXCEEDED',
          quotaState: isQuota ? 'EXCEEDED' : 'OK',
          lastSuccessfulGeneration: this.lastSuccessfulGeneration,
        };
      }
      if (res.status === 404) {
        return {
          status: 'MODEL_UNAVAILABLE',
          reachable: false,
          imageModelReachable: false,
          model: this.model,
          detail: errDetail ? `Model ${this.model} not available: ${errDetail}` : `Model ${this.model} not available on account (HTTP 404)`,
          authenticationStatus: 'AUTHENTICATED',
          modelAvailability: 'UNAVAILABLE',
          rateLimits: 'OK',
          quotaState: 'OK',
          lastSuccessfulGeneration: this.lastSuccessfulGeneration,
        };
      }
      return {
        status: 'NETWORK_ERROR',
        reachable: false,
        imageModelReachable: false,
        model: this.model,
        detail: errDetail ? `HTTP ${res.status}: ${errDetail}` : `HTTP ${res.status}`,
        authenticationStatus: 'UNKNOWN' as any,
        modelAvailability: 'UNKNOWN',
        rateLimits: 'UNKNOWN',
        quotaState: 'UNKNOWN',
        lastSuccessfulGeneration: this.lastSuccessfulGeneration,
      };
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
        return {
          status: 'TIMEOUT',
          reachable: false,
          imageModelReachable: false,
          model: this.model,
          detail: 'Gemini health check timed out',
          authenticationStatus: 'UNKNOWN' as any,
          modelAvailability: 'UNKNOWN',
          rateLimits: 'UNKNOWN',
          quotaState: 'UNKNOWN',
          lastSuccessfulGeneration: this.lastSuccessfulGeneration,
        };
      }
      return {
        status: 'NETWORK_ERROR',
        reachable: false,
        imageModelReachable: false,
        model: this.model,
        detail: err instanceof Error ? err.message : 'Network error checking Gemini availability',
        authenticationStatus: 'UNKNOWN' as any,
        modelAvailability: 'UNKNOWN',
        rateLimits: 'UNKNOWN',
        quotaState: 'UNKNOWN',
        lastSuccessfulGeneration: this.lastSuccessfulGeneration,
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    const access = await this.checkAccess();
    return access.reachable;
  }

  getModel(): string {
    return this.model;
  }

  getImageSize(): GeminiImageSize {
    return this.imageSize;
  }

  async generateFloorPlan(request: FloorPlanImagePromptRequest): Promise<GeneratedPlanImage> {
    if (!this.apiKey) {
      throw new ImageProviderError('GEMINI_AUTH_ERROR', 'GEMINI_API_KEY missing', 401);
    }

    const { body, aspectRatio, referenceIdsSent } = buildGeminiImageRequestBody(request, {
      model: this.model,
      imageSize: this.imageSize,
    });

    const url = `${this.endpointBase}/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const startTime = Date.now();
    let res: Response;
    let apiRequestId: string | undefined;

    try {
      res = await this.fetchImpl(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      apiRequestId = res.headers.get('x-request-id') ?? res.headers.get('request-id') ?? undefined;
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
        throw new ImageProviderError('IMAGE_PROVIDER_TIMEOUT', `Gemini request timed out after ${this.timeoutMs}ms`);
      }
      throw new ImageProviderError('IMAGE_PROVIDER_NETWORK_ERROR', err instanceof Error ? err.message : 'Network error communicating with Gemini');
    }

    if (!res.ok) {
      let errJson: any = null;
      try {
        errJson = await res.json();
      } catch {
        // Ignored
      }
      if (errJson && errJson.error) {
        extractGeminiImageBytes(errJson);
      }
      if (res.status === 401 || res.status === 403) {
        throw new ImageProviderError('GEMINI_AUTH_ERROR', `Gemini authentication failed (HTTP ${res.status})`, 401);
      }
      if (res.status === 429) {
        throw new ImageProviderError('GEMINI_RATE_LIMITED', `Gemini rate limit exceeded (HTTP 429)`, 429);
      }
      if (res.status === 503 || res.status === 504) {
        throw new ImageProviderError('GEMINI_UNAVAILABLE', `Gemini service temporarily unavailable (HTTP ${res.status})`, 503);
      }
      throw new ImageProviderError('API_ERROR', `Gemini API returned HTTP ${res.status}`, res.status);
    }

    let json: any;
    try {
      json = await res.json();
    } catch {
      throw new ImageProviderError('IMAGE_PROVIDER_INVALID_RESPONSE', 'Failed to parse Gemini JSON response');
    }

    const { mimeType, buffer } = extractGeminiImageBytes(json);
    this.lastSuccessfulGeneration = new Date().toISOString();
    const latencyMs = Date.now() - startTime;
    const imageBase64 = buffer.toString('base64');
    const promptHash = crypto?.createHash ? crypto.createHash('sha256').update(request.prompt).digest('hex') : '';

    const structuralHash = (request.metadata as any)?.structuralRepresentationHash;
    const providerRequest: GeminiImageRequestProvenance = {
      endpoint: `${this.endpointBase}/${this.model}:generateContent`,
      size: this.imageSize,
      seedSent: false,
      referenceIdsSent,
      referenceHashes: request.referenceImages?.map(r => (r as any).hash || r.id) ?? [],
      aspectRatio,
      promptHash,
      ...(structuralHash ? { structuralRepresentationHash: structuralHash, rendererVersion: '1.0.0' } : {}),
      ...(apiRequestId ? { apiRequestId } : {}),
    };

    return {
      imageBase64,
      mimeType: mimeType === 'image/jpeg' ? 'image/jpeg' : 'image/png',
      provider: this.name,
      model: this.model,
      seed: request.seed,
      promptVersion: request.promptVersion,
      prompt: request.prompt,
      generatedAt: new Date().toISOString(),
      latencyMs,
      providerRequest,
    };
  }
}
