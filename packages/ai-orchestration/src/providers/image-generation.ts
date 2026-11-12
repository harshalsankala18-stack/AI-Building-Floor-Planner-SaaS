/**
 * Stubbed Image Generation Provider module – legacy raster generation disabled.
 * This file retains the type definitions required by the public API but the
 * concrete providers (Cloudflare, etc.) are replaced with no‑op stubs that
 * report not configured. Existing imports from `src/providers/image-generation`
 * continue to work.
 */

/**
 * Image Generation Provider Abstraction — retained for type compatibility.
 */
import type { FloorPlanImagePromptRequest } from '../orchestration/image-prompt-compiler';
import type { ReferenceSelectionDiagnostics } from '../apartment/reference-library.js';

export interface GeneratedPlanImage {
  readonly imageBase64: string;
  readonly mimeType: 'image/png' | 'image/jpeg';
  readonly provider: string;
  readonly model: string;
  readonly seed: number;
  readonly promptVersion: number;
  readonly prompt: string;
  readonly generatedAt: string;
  readonly latencyMs: number;
  readonly referenceDiagnostics?: ReferenceSelectionDiagnostics;
  readonly providerRequest?: GeneratedPlanImageRequestProvenance;
}

export interface GeneratedPlanImageRequestProvenance {
  readonly endpoint: string;
  readonly size: string;
  readonly seedSent: boolean;
  readonly referenceIdsSent: readonly string[];
  readonly maxReferenceImages?: number;
}

export interface ImageGenerationProvider {
  readonly name: string;
  generateFloorPlan(request: FloorPlanImagePromptRequest): Promise<GeneratedPlanImage>;
  isAvailable(): Promise<boolean>;
}

export type FluxTransportDiagnosticStage =
  | 'request_construction_failure'
  | 'reference_preparation_failure'
  | 'network_fetch_failure'
  | 'http_response'
  | 'http_error'
  | 'response_decode_failure';

export type ImageProviderErrorCode =
  | 'IMAGE_PROVIDER_NOT_CONFIGURED'
  | 'REFERENCE_FILE_READ_ERROR'
  | 'REFERENCE_FETCH_ERROR'
  | 'REFERENCE_RESIZE_ERROR'
  | 'CLOUDFLARE_NETWORK_ERROR'
  | 'CLOUDFLARE_TIMEOUT'
  | 'CLOUDFLARE_HTTP_ERROR'
  | 'CLOUDFLARE_RESPONSE_DECODE_ERROR'
  | 'CLOUDFLARE_AUTH_ERROR'
  | 'IMAGE_PROVIDER_TIMEOUT'
  | 'IMAGE_PROVIDER_HTTP_ERROR'
  | 'IMAGE_PROVIDER_INVALID_RESPONSE'
  | 'IMAGE_PROVIDER_NETWORK_ERROR'
  | 'IMAGE_PROVIDER_CAPABILITY_ERROR'
  | 'POLLINATIONS_AUTH_ERROR'
  | 'POLLINATIONS_PAYMENT_REQUIRED'
  | 'POLLINATIONS_RATE_LIMITED'
  | 'GEMINI_AUTH_ERROR'
  | 'GEMINI_RATE_LIMITED'
  | 'GEMINI_UNAVAILABLE'
  | 'IMAGE_EMPTY'
  | 'IMAGE_DECODE_FAILED'
  | 'API_ERROR';

export class ImageProviderError extends Error {
  readonly code: ImageProviderErrorCode;
  readonly status?: number;
  constructor(code: ImageProviderErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'ImageProviderError';
    this.code = code;
    this.status = status;
    Object.setPrototypeOf(this, ImageProviderError.prototype);
  }
}

/** Default FLUX model identifier – retained for compatibility. */
export const DEFAULT_FLUX_MODEL = '@cf/black-forest-labs/flux-2-klein-4b' as const;

/** Options for the legacy Cloudflare provider (now a stub). */
export interface CloudflareImageProviderOptions {
  readonly accountId: string;
  readonly apiToken: string;
  readonly model?: string;
  readonly steps?: number;
  readonly includeSteps?: boolean;
  readonly timeoutMs?: number;
  readonly endpointOverride?: string;
  readonly fetchImpl?: typeof fetch;
  readonly includeNegativePrompt?: boolean;
  readonly includeDimensions?: boolean;
}

export function buildCloudflareImageRequestBody(_request: any, _options?: any): any {
  return {};
}

export function buildCloudflareFormData(_request: any, _options?: any): any {
  return {};
}

export class CloudflareImageProvider implements ImageGenerationProvider {
  readonly name = 'cloudflare-workers-ai';
  private readonly model: string;
  constructor(_options: CloudflareImageProviderOptions) {
    this.model = DEFAULT_FLUX_MODEL;
  }
  isConfigured(): boolean { return false; }
  async isAvailable(): Promise<boolean> { return false; }
  getModel(): string { return this.model; }
  async generateFloorPlan(_request: FloorPlanImagePromptRequest): Promise<GeneratedPlanImage> {
    throw new ImageProviderError('IMAGE_PROVIDER_NOT_CONFIGURED', 'Cloudflare image generation is disabled.');
  }
}
