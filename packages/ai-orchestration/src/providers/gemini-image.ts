/**
 * Stubbed Gemini Image Provider – legacy raster generation disabled.
 * Retains the same public API but all operational methods report not configured.
 */

import {
  ImageProviderError,
  type GeneratedPlanImage,
  type GeneratedPlanImageRequestProvenance,
  type ImageGenerationProvider,
} from './image-generation.js';
import type { FloorPlanImagePromptRequest, ReferenceImageInput } from '../orchestration/image-prompt-compiler.js';

export const DEFAULT_GEMINI_IMAGE_MODEL = 'gemini-3-pro-image' as const;
export const DEFAULT_GEMINI_IMAGE_SIZE = '2K' as const;
export const GEMINI_IMAGE_PROVIDER_NAME = 'gemini' as const;
export const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export type GeminiImageAspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16';
export type GeminiImageSize = '1K' | '2K' | '4K';

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
  parts.push('Do NOT render authoritative room labels.');
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
    if (code === 401 || response.error.status === 'UNAUTHENTICATED') {
      const err = new ImageProviderError('GEMINI_AUTH_ERROR', response.error.message || 'Gemini authentication failed', 401);
      throw err;
    }
    if (code === 429 || response.error.status === 'RESOURCE_EXHAUSTED') {
      const err = new ImageProviderError('GEMINI_RATE_LIMITED', response.error.message || 'Gemini rate limited', 429);
      throw err;
    }
    throw new ImageProviderError('API_ERROR', response.error.message || 'Gemini error');
  }

  const textParts: string[] = [];
  const candidates = response.candidates ?? [];
  for (const cand of candidates) {
    const parts = cand.content?.parts ?? [];
    for (const part of parts) {
      if (part.text) {
        textParts.push(part.text);
      }
      if (part.inlineData && part.inlineData.mimeType && part.inlineData.data) {
        const buf = Buffer.from(part.inlineData.data, 'base64');
        if (buf.length < 50) {
          throw new ImageProviderError('IMAGE_EMPTY', 'Received empty or suspiciously small image payload from Gemini');
        }
        return { mimeType: part.inlineData.mimeType, buffer: buf, ...(textParts.length > 0 ? { textParts } : {}) };
      }
    }
  }

  const predictions = response.predictions ?? [];
  for (const pred of predictions) {
    if (pred.bytesBase64Encoded && pred.mimeType) {
      const buf = Buffer.from(pred.bytesBase64Encoded, 'base64');
      if (buf.length < 50) {
        throw new ImageProviderError('IMAGE_EMPTY', 'Received empty or suspiciously small image payload from Gemini');
      }
      return { mimeType: pred.mimeType, buffer: buf };
    }
  }

  throw new ImageProviderError('IMAGE_EMPTY', textParts[0] || 'No image data in Gemini response');
}

export class GeminiImageProvider implements ImageGenerationProvider {
  readonly name = GEMINI_IMAGE_PROVIDER_NAME;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly imageSize: GeminiImageSize;

  constructor(options: GeminiImageProviderOptions) {
    this.apiKey = (options.apiKey ?? '').trim();
    this.model = (options.model ?? '').trim() || DEFAULT_GEMINI_IMAGE_MODEL;
    this.imageSize = options.imageSize ?? DEFAULT_GEMINI_IMAGE_SIZE;
    void options.endpointBase;
    void options.timeoutMs;
    void options.fetchImpl;
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async isAvailable(): Promise<boolean> {
    return false;
  }

  getModel(): string {
    return this.model;
  }

  getImageSize(): GeminiImageSize {
    return this.imageSize;
  }

  async generateFloorPlan(_request: FloorPlanImagePromptRequest): Promise<GeneratedPlanImage> {
    if (!this.apiKey) {
      throw new ImageProviderError('GEMINI_AUTH_ERROR', 'GEMINI_API_KEY missing');
    }
    throw new ImageProviderError('IMAGE_PROVIDER_NOT_CONFIGURED', 'Gemini image generation is disabled.');
  }
}
