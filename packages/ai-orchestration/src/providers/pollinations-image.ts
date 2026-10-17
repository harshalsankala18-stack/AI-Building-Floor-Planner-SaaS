/**
 * Stubbed Pollinations Image Provider – legacy raster generation disabled.
 * This file retains the public API surface required by barrel exports but
 * disables any runtime execution. All methods report not configured.
 */

import type { FloorPlanImagePromptRequest, ReferenceImageInput } from '../orchestration/image-prompt-compiler';
import { ImageProviderError, type GeneratedPlanImage, type ImageGenerationProvider } from './image-generation';

export const POLLINATIONS_PROVIDER_NAME = 'pollinations' as const;
export const POLLINATIONS_BASE_URL = 'https://gen.pollinations.ai' as const;
export const DEFAULT_POLLINATIONS_IMAGE_MODEL = 'qwen/qwen-image-2.1' as const;
export const POLLINATIONS_EDITS_PATH = '/v1/images/edits' as const;
export const POLLINATIONS_GENERATIONS_PATH = '/v1/images/generations' as const;
export const POLLINATIONS_IMAGE_MODELS_PATH = '/image/models' as const;
export const POLLINATIONS_KEY_INFO_PATH = '/account/key' as const;
export const STRUCTURAL_REFERENCE_ID = 'schematic_scaffold' as const;

export interface PollinationsModelCapabilities {
  readonly model: string;
  readonly found: boolean;
  readonly acceptsImageInput: boolean;
  readonly supportsEdits: boolean;
  readonly supportsGenerations: boolean;
  readonly maxReferenceImages: number;
  readonly paidOnly: boolean | null;
  readonly source: 'CATALOG' | 'UNAVAILABLE';
  readonly detail?: string;
}

export interface PollinationsImageRequest {
  readonly endpointPath: typeof POLLINATIONS_EDITS_PATH | typeof POLLINATIONS_GENERATIONS_PATH;
  readonly body: Record<string, unknown>;
  readonly referenceIdsSent: readonly string[];
}

export interface PollinationsImageProviderOptions {
  readonly apiKey: string;
  readonly model?: string;
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
  readonly fetchImpl?: typeof fetch;
}

export interface PollinationsAccessCheck {
  readonly status:
    | 'REACHABLE'
    | 'NOT_CONFIGURED'
    | 'AUTH_FAILED'
    | 'MODEL_UNAVAILABLE'
    | 'RATE_LIMITED'
    | 'TIMEOUT'
    | 'NETWORK_ERROR';
  readonly reachable: boolean;
  readonly detail?: string;
  readonly capabilities?: PollinationsModelCapabilities;
}

export function buildPollinationsImageRequest(request: any, model?: string, referenceImages?: readonly ReferenceImageInput[]): any {
  // model defaults to default model if not provided.
  const usedModel = model ?? DEFAULT_POLLINATIONS_IMAGE_MODEL;
  const refs = referenceImages ?? request.referenceImages ?? [];
  const hasRefs = refs.length > 0;
  const endpoint = hasRefs ? POLLINATIONS_EDITS_PATH : POLLINATIONS_GENERATIONS_PATH;
  const body: any = {
    model: usedModel,
    size: `${request.width}x${request.height}`,
    n: 1,
    response_format: 'b64_json',
    prompt: request.prompt,
  } as any;
  if (hasRefs) {
    body.image = (refs as any[]).map((r: any) => ({ image_url: `data:${r.mimeType};base64,${r.base64Data}` }));
    body.referenceIdsSent = (refs as any[]).map((r: any) => r.id);
  } else {
    body.referenceIdsSent = [];
  }
  return { endpointPath: endpoint, body, referenceIdsSent: body.referenceIdsSent } as any;
}

export function parsePollinationsModelCapabilities(catalog: any, modelName: string): any {
  // Support catalog as array or object with data property.
  const data = Array.isArray(catalog) ? catalog : catalog?.data ?? [];
  const entry = data.find((m: any) => m.name === modelName || (m.aliases && m.aliases.includes(modelName)));
  if (!entry) {
    return { model: modelName, found: false, acceptsImageInput: false, supportsEdits: false, supportsGenerations: false, maxReferenceImages: 0, paidOnly: null, source: 'UNAVAILABLE' as const };
  }
  const acceptsImageInput = entry.input_modalities?.includes('image') ?? false;
  const supportsEdits = entry.supported_endpoints?.some((e: string) => e.includes('edits')) ?? false;
  const supportsGenerations = entry.supported_endpoints?.some((e: string) => e.includes('generations')) ?? false;
  return {
    model: entry.name,
    found: true,
    acceptsImageInput,
    supportsEdits,
    supportsGenerations,
    maxReferenceImages: entry.max_reference_images ?? 0,
    paidOnly: entry.paid_only ?? null,
    source: 'CATALOG' as const,
    detail: entry.detail,
  } as any;
}

export class PollinationsImageProvider implements ImageGenerationProvider {
  readonly name = POLLINATIONS_PROVIDER_NAME;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(options: PollinationsImageProviderOptions) {
    this.model = options.model?.trim() || DEFAULT_POLLINATIONS_IMAGE_MODEL;
    this.baseUrl = (options.baseUrl?.trim() || POLLINATIONS_BASE_URL).replace(/\/+$/, '');
  }

  isConfigured(): boolean { return false; }
  async isAvailable(): Promise<boolean> { return false; }
  getModel(): string { return this.model; }
  getBaseUrl(): string { return this.baseUrl; }

  async checkAccess(): Promise<PollinationsAccessCheck> {
    return { status: 'NOT_CONFIGURED', reachable: false, detail: 'Pollinations provider disabled.', capabilities: undefined as any };
  }

  async generateFloorPlan(_request: FloorPlanImagePromptRequest): Promise<GeneratedPlanImage> {
    throw new ImageProviderError('IMAGE_PROVIDER_NOT_CONFIGURED', 'Pollinations image generation is disabled.');
  }
}

