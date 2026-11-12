/**
 * Backend HTTP boundary â€” Master PRD Phase 2 (Â§17/Â§18/Â§36).
 *
 * A minimal dependency-free node:http server. It is the ONLY process that holds
 * Cloudflare credentials; the React frontend talks to it over HTTP and never
 * sees a token. Run with `pnpm --filter @ai-floor-planner/backend start`.
 */

import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {
  CloudflareImageProvider,
  GeminiImageProvider,
  GeminiProvider,
  PollinationsImageProvider,
  POLLINATIONS_PROVIDER_NAME,
  GEMINI_IMAGE_PROVIDER_NAME,
  ImageProviderError,
  type FloorPlanImagePromptRequest,
  type BaseAIProvider,
  type ImageGenerationProvider,
} from '@ai-floor-planner/ai-orchestration';
import { handleArtifactGet, handleFloorPlanGeneration, type ImageRouteDeps } from './api/image-routes.js';
import { handleArchitecturalEvaluation, handleImageInterpretation, type InterpretationRouteDeps } from './api/interpretation-routes.js';
import { cloudflareConfigured, imageProviderConfigured, resolveImageServiceConfig, type ImageServiceConfig } from './env.js';
import { ImageArtifactStore } from './services/image-artifact-store.js';
import { LocalStubImageProvider } from './services/local-stub-image-provider.js';

// Auto-load .env file if available in process.env or common locations
if (typeof process.loadEnvFile === 'function') {
  for (const candidate of [
    '.env',
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'packages', 'backend', '.env'),
  ]) {
    try {
      if (fs.existsSync(candidate)) {
        process.loadEnvFile(candidate);
        break;
      }
    } catch {
      // Ignored
    }
  }
}

const MAX_BODY_BYTES = 2_000_000;

export function resolveCorsHeaders(
  requestOrigin: string | undefined,
  allowedOrigins: readonly string[],
  isProduction: boolean,
): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (!isProduction) {
    if (allowedOrigins.includes('*')) {
      headers['Access-Control-Allow-Origin'] = '*';
      return headers;
    }
    headers['Access-Control-Allow-Origin'] = requestOrigin || '*';
    if (requestOrigin) headers['Vary'] = 'Origin';
    return headers;
  }

  if (!requestOrigin) {
    return headers;
  }

  if (allowedOrigins.includes(requestOrigin)) {
    headers['Access-Control-Allow-Origin'] = requestOrigin;
    headers['Vary'] = 'Origin';
    return headers;
  }

  return headers;
}

export function createImageProvider(config: ImageServiceConfig): ImageGenerationProvider | null {
  if (config.imageProviderKind === 'local-stub') return new LocalStubImageProvider();
  if (!imageProviderConfigured(config)) return null;
  if (config.imageProviderKind === 'gemini') {
    return new GeminiImageProvider({
      apiKey: config.geminiApiKey,
      model: config.geminiImageModel,
      imageSize: config.geminiImageSize as any,
      timeoutMs: config.providerTimeoutMs,
    });
  }
  if (config.imageProviderKind === 'pollinations') {
    return new PollinationsImageProvider({
      apiKey: config.pollinationsApiKey,
      model: config.pollinationsImageModel,
      baseUrl: config.pollinationsBaseUrl,
      timeoutMs: config.pollinationsTimeoutMs,
    });
  }
  return new CloudflareImageProvider({
    accountId: config.cloudflareAccountId,
    apiToken: config.cloudflareApiToken,
    model: config.fluxModel,
    steps: config.fluxSteps,
    timeoutMs: config.providerTimeoutMs,
  });
}

/** Server-side Gemini provider for Phase 3 vision + evaluation (PRD §36). */
export function createGeminiProvider(config: ImageServiceConfig): GeminiProvider | null {
  if (config.geminiApiKey.length === 0) return null;
  return new GeminiProvider({
    apiKey: config.geminiApiKey,
    model: config.geminiModel,
    fallbackModel: config.geminiFallbackModel,
    timeoutMs: config.providerTimeoutMs,
  });
}

export type CloudflareStatus =
  | 'NOT_CONFIGURED'
  | 'REACHABLE'
  | 'AUTH_FAILED'
  | 'MODEL_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR';

export type GeminiStatus =
  | 'NOT_CONFIGURED'
  | 'REACHABLE'
  | 'AUTH_FAILED'
  | 'RATE_LIMITED'
  | 'QUOTA_EXCEEDED'
  | 'MODEL_UNAVAILABLE'
  | 'TEMPORARILY_UNAVAILABLE'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'REQUEST_ERROR';

export interface ProviderStatusInfo {
  readonly configured: boolean;
  readonly reachable: boolean;
  readonly status: CloudflareStatus | GeminiStatus | string;
  readonly model: string;
  readonly detail?: string;
}

export interface ImageGenerationStatusInfo extends ProviderStatusInfo {
  /** Active image-generation provider name (e.g. 'gemini', 'pollinations', 'cloudflare-workers-ai'). */
  readonly provider: string;
  readonly imageModelReachable: boolean;
  readonly authenticationStatus: 'AUTHENTICATED' | 'AUTH_FAILED' | 'NOT_CONFIGURED';
  readonly modelAvailability: 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN';
  readonly rateLimits: 'OK' | 'EXCEEDED' | 'UNKNOWN';
  readonly quotaState: 'OK' | 'EXCEEDED' | 'UNKNOWN';
  readonly lastSuccessfulGeneration: string | null;
  readonly capabilities?: { readonly acceptsImageInput: boolean; readonly maxReferenceImages: number; readonly source: string };
}

export interface VisionStatusInfo extends ProviderStatusInfo {
  readonly visionModelReachable: boolean;
  readonly authenticationStatus: 'AUTHENTICATED' | 'AUTH_FAILED' | 'NOT_CONFIGURED';
  readonly modelAvailability: 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN';
  readonly rateLimits: 'OK' | 'EXCEEDED' | 'UNKNOWN';
  readonly quotaState: 'OK' | 'EXCEEDED' | 'UNKNOWN';
}

export interface BackendHealthResponse {
  readonly status: 'ok' | 'degraded';
  readonly imageProvider: 'configured' | 'not_configured';
  readonly imageProviderName?: string;
  readonly imageProviderStatus?: string;
  readonly configuredImageModel?: string;
  readonly imageProviderConfigured: boolean;
  readonly imageModelReachable: boolean;
  readonly visionModelReachable: boolean;
  readonly authenticationStatus: 'AUTHENTICATED' | 'AUTH_FAILED' | 'NOT_CONFIGURED';
  readonly modelAvailability: 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN';
  readonly rateLimits: 'OK' | 'EXCEEDED' | 'UNKNOWN';
  readonly quotaState: 'OK' | 'EXCEEDED' | 'UNKNOWN';
  readonly lastSuccessfulGeneration: string | null;
  /** Status of the ACTIVE image-generation provider. */
  readonly imageGeneration: ImageGenerationStatusInfo;
  /** Status of the Vision / Evaluation model. */
  readonly vision: VisionStatusInfo;
  /** Cloudflare status; 'INACTIVE' when another image provider is selected. */
  readonly cloudflare: ProviderStatusInfo;
  readonly gemini: ProviderStatusInfo;
}

export async function checkProviderHealth(
  config: ImageServiceConfig,
  deps: { provider: ImageGenerationProvider | null; gemini: BaseAIProvider | null; interpreterKind: 'gemini' | 'local-stub' },
): Promise<BackendHealthResponse> {
  const isCloudflare = deps.provider && (deps.provider.name === 'cloudflare-workers-ai' || deps.provider.name === 'cloudflare');
  const isPollinations = deps.provider
    ? deps.provider.name === POLLINATIONS_PROVIDER_NAME
    : config.imageProviderKind === 'pollinations';
  const isGeminiImage = deps.provider
    ? deps.provider.name === GEMINI_IMAGE_PROVIDER_NAME
    : config.imageProviderKind === 'gemini';
  let cfStatus: ProviderStatusInfo;
  let imageGeneration: ImageGenerationStatusInfo | null = null;
  if (isPollinations) {
    // Pollinations is the active image provider: check key + model catalog (no generation, no spend).
    const model = deps.provider instanceof PollinationsImageProvider ? deps.provider.getModel() : config.pollinationsImageModel;
    if (!(deps.provider instanceof PollinationsImageProvider)) {
      imageGeneration = {
        provider: POLLINATIONS_PROVIDER_NAME,
        configured: false,
        reachable: false,
        imageModelReachable: false,
        status: 'NOT_CONFIGURED',
        model,
        detail: 'POLLINATIONS_API_KEY is not configured',
        authenticationStatus: 'NOT_CONFIGURED',
        modelAvailability: 'UNKNOWN',
        rateLimits: 'UNKNOWN',
        quotaState: 'UNKNOWN',
        lastSuccessfulGeneration: null,
      };
    } else {
      const access = await deps.provider.checkAccess();
      imageGeneration = {
        provider: POLLINATIONS_PROVIDER_NAME,
        configured: true,
        reachable: access.reachable,
        imageModelReachable: access.reachable,
        status: access.status,
        model,
        authenticationStatus: access.status === 'AUTH_FAILED' ? 'AUTH_FAILED' : 'AUTHENTICATED',
        modelAvailability: access.status === 'MODEL_UNAVAILABLE' ? 'UNAVAILABLE' : (access.reachable ? 'AVAILABLE' : 'UNKNOWN'),
        rateLimits: access.status === 'RATE_LIMITED' ? 'EXCEEDED' : 'OK',
        quotaState: 'OK',
        lastSuccessfulGeneration: null,
        ...(access.detail ? { detail: access.detail } : {}),
        ...(access.capabilities
          ? { capabilities: { acceptsImageInput: access.capabilities.acceptsImageInput, maxReferenceImages: access.capabilities.maxReferenceImages, source: access.capabilities.source } }
          : {}),
      };
    }
    cfStatus = {
      configured: cloudflareConfigured(config),
      reachable: false,
      status: 'INACTIVE',
      model: config.fluxModel,
      detail: `Active image provider: ${POLLINATIONS_PROVIDER_NAME} (${model})`,
    };
  } else if (isGeminiImage) {
    const model = deps.provider instanceof GeminiImageProvider ? deps.provider.getModel() : config.geminiImageModel;
    if (!(deps.provider instanceof GeminiImageProvider) || !deps.provider.isConfigured()) {
      imageGeneration = {
        provider: GEMINI_IMAGE_PROVIDER_NAME,
        configured: false,
        reachable: false,
        imageModelReachable: false,
        status: 'NOT_CONFIGURED',
        model,
        detail: 'GEMINI_API_KEY is not configured',
        authenticationStatus: 'NOT_CONFIGURED',
        modelAvailability: 'UNKNOWN',
        rateLimits: 'UNKNOWN',
        quotaState: 'UNKNOWN',
        lastSuccessfulGeneration: null,
      };
    } else {
      const access = await deps.provider.checkAccess();
      imageGeneration = {
        provider: GEMINI_IMAGE_PROVIDER_NAME,
        configured: true,
        reachable: access.reachable,
        imageModelReachable: access.imageModelReachable,
        status: access.status,
        model,
        ...(access.detail ? { detail: access.detail } : {}),
        authenticationStatus: access.authenticationStatus,
        modelAvailability: access.modelAvailability,
        rateLimits: access.rateLimits,
        quotaState: access.quotaState,
        lastSuccessfulGeneration: access.lastSuccessfulGeneration,
      };
    }
    cfStatus = {
      configured: cloudflareConfigured(config),
      reachable: false,
      status: 'INACTIVE',
      model: config.fluxModel,
      detail: `Active image provider: ${GEMINI_IMAGE_PROVIDER_NAME} (${model})`,
    };
  } else if (config.imageProviderKind === 'local-stub' || deps.provider instanceof LocalStubImageProvider || (deps.provider && !isCloudflare)) {
    const reachable = (await deps.provider?.isAvailable().catch(() => false)) ?? true;
    cfStatus = {
      configured: true,
      reachable,
      status: reachable ? 'REACHABLE' : 'NOT_CONFIGURED',
      model: deps.provider?.name ?? 'local-stub',
      detail: 'Custom, local or stub provider active',
    };
  } else if (!cloudflareConfigured(config) || !deps.provider) {
    cfStatus = {
      configured: false,
      reachable: false,
      status: 'NOT_CONFIGURED',
      model: config.fluxModel,
      detail: 'CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN is not configured',
    };
  } else {
    try {
      const res = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
        headers: { Authorization: `Bearer ${config.cloudflareApiToken}` },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          cfStatus = {
            configured: true,
            reachable: false,
            status: 'AUTH_FAILED',
            model: config.fluxModel,
            detail: `Cloudflare token is invalid or unauthorized (HTTP ${res.status})`,
          };
        } else if (res.status === 429) {
          cfStatus = {
            configured: true,
            reachable: false,
            status: 'RATE_LIMITED',
            model: config.fluxModel,
            detail: 'Cloudflare rate limit exceeded (HTTP 429)',
          };
        } else {
          cfStatus = {
            configured: true,
            reachable: false,
            status: 'NETWORK_ERROR',
            model: config.fluxModel,
            detail: `HTTP ${res.status}`,
          };
        }
      } else {
        const body = (await res.json().catch(() => ({}))) as { success?: boolean };
        if (!body.success) {
          cfStatus = {
            configured: true,
            reachable: false,
            status: 'AUTH_FAILED',
            model: config.fluxModel,
            detail: 'Cloudflare token verification returned unsuccessful',
          };
        } else {
          // Token is valid; now verify account AI model availability
          try {
            const modelRes = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(config.cloudflareAccountId)}/ai/models/search?search=${encodeURIComponent(config.fluxModel)}`,
              {
                headers: { Authorization: `Bearer ${config.cloudflareApiToken}` },
                signal: AbortSignal.timeout(5000),
              },
            );
            if (modelRes.ok) {
              const modelData = (await modelRes.json().catch(() => ({}))) as { success?: boolean; result?: Array<{ name: string }> };
              const models = modelData.result ?? [];
              const found = models.some(m => m.name === config.fluxModel);
              if (found || models.length > 0) {
                cfStatus = {
                  configured: true,
                  reachable: true,
                  status: 'REACHABLE',
                  model: config.fluxModel,
                };
              } else {
                cfStatus = {
                  configured: true,
                  reachable: false,
                  status: 'MODEL_UNAVAILABLE',
                  model: config.fluxModel,
                  detail: `Model ${config.fluxModel} not available on account`,
                };
              }
            } else if (modelRes.status === 401 || modelRes.status === 403) {
              cfStatus = {
                configured: true,
                reachable: false,
                status: 'AUTH_FAILED',
                model: config.fluxModel,
                detail: `Token not authorized for account ${config.cloudflareAccountId} (HTTP ${modelRes.status})`,
              };
            } else if (modelRes.status === 404) {
              cfStatus = {
                configured: true,
                reachable: false,
                status: 'MODEL_UNAVAILABLE',
                model: config.fluxModel,
                detail: `Model or account endpoint not found (HTTP 404)`,
              };
            } else if (modelRes.status === 429) {
              cfStatus = {
                configured: true,
                reachable: false,
                status: 'RATE_LIMITED',
                model: config.fluxModel,
                detail: 'Cloudflare rate limit on model endpoint',
              };
            } else {
              cfStatus = {
                configured: true,
                reachable: false,
                status: 'NETWORK_ERROR',
                model: config.fluxModel,
                detail: `HTTP ${modelRes.status}`,
              };
            }
          } catch (modelErr) {
            if (modelErr instanceof Error && (modelErr.name === 'AbortError' || modelErr.name === 'TimeoutError')) {
              cfStatus = {
                configured: true,
                reachable: false,
                status: 'TIMEOUT',
                model: config.fluxModel,
                detail: 'Model availability request timed out',
              };
            } else {
              cfStatus = {
                configured: true,
                reachable: false,
                status: 'NETWORK_ERROR',
                model: config.fluxModel,
                detail: modelErr instanceof Error ? modelErr.message : 'Network error checking model',
              };
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
        cfStatus = {
          configured: true,
          reachable: false,
          status: 'TIMEOUT',
          model: config.fluxModel,
          detail: 'Cloudflare token verify timed out',
        };
      } else {
        cfStatus = {
          configured: true,
          reachable: false,
          status: 'NETWORK_ERROR',
          model: config.fluxModel,
          detail: err instanceof Error ? err.message : 'Network unreachable',
        };
      }
    }
  }

  let visionStatus: VisionStatusInfo;
  if (deps.interpreterKind === 'local-stub') {
    visionStatus = {
      configured: true,
      reachable: true,
      visionModelReachable: true,
      status: 'REACHABLE',
      model: 'local-stub',
      detail: 'Local development stub interpreter active',
      authenticationStatus: 'AUTHENTICATED',
      modelAvailability: 'AVAILABLE',
      rateLimits: 'OK',
      quotaState: 'OK',
    };
  } else if (!config.geminiApiKey || !deps.gemini) {
    visionStatus = {
      configured: false,
      reachable: false,
      visionModelReachable: false,
      status: 'NOT_CONFIGURED',
      model: config.geminiModel,
      detail: 'GEMINI_API_KEY is not configured',
      authenticationStatus: 'NOT_CONFIGURED',
      modelAvailability: 'UNKNOWN',
      rateLimits: 'UNKNOWN',
      quotaState: 'UNKNOWN',
    };
  } else {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.geminiModel)}?key=${encodeURIComponent(config.geminiApiKey)}`,
        { signal: AbortSignal.timeout(5000) },
      );
      if (res.ok) {
        visionStatus = {
          configured: true,
          reachable: true,
          visionModelReachable: true,
          status: 'REACHABLE',
          model: config.geminiModel,
          authenticationStatus: 'AUTHENTICATED',
          modelAvailability: 'AVAILABLE',
          rateLimits: 'OK',
          quotaState: 'OK',
        };
      } else {
        let errDetail: string | undefined;
        try {
          const body = (await res.json()) as { error?: { message?: string } };
          if (body?.error?.message) errDetail = body.error.message;
        } catch {
          // Ignored
        }

        if (res.status === 401 || res.status === 403) {
          visionStatus = {
            configured: true,
            reachable: false,
            visionModelReachable: false,
            status: 'AUTH_FAILED',
            model: config.geminiModel,
            detail: errDetail ? `Gemini API key is unauthorized: ${errDetail} (HTTP ${res.status})` : `Gemini API key is invalid or unauthorized (HTTP ${res.status})`,
            authenticationStatus: 'AUTH_FAILED',
            modelAvailability: 'UNKNOWN',
            rateLimits: 'UNKNOWN',
            quotaState: 'UNKNOWN',
          };
        } else if (res.status === 429) {
          const isQuota = /quota|exhausted/i.test(errDetail ?? '');
          visionStatus = {
            configured: true,
            reachable: false,
            visionModelReachable: false,
            status: isQuota ? 'QUOTA_EXCEEDED' : 'RATE_LIMITED',
            model: config.geminiModel,
            detail: errDetail || `Gemini rate limit or quota exceeded (HTTP ${res.status})`,
            authenticationStatus: 'AUTHENTICATED',
            modelAvailability: 'AVAILABLE',
            rateLimits: 'EXCEEDED',
            quotaState: isQuota ? 'EXCEEDED' : 'OK',
          };
        } else if (res.status === 503 || res.status === 504) {
          visionStatus = {
            configured: true,
            reachable: false,
            visionModelReachable: false,
            status: 'TEMPORARILY_UNAVAILABLE',
            model: config.geminiModel,
            detail: errDetail || `Gemini service is temporarily unavailable / experiencing high demand (HTTP ${res.status})`,
            authenticationStatus: 'AUTHENTICATED',
            modelAvailability: 'AVAILABLE',
            rateLimits: 'OK',
            quotaState: 'OK',
          };
        } else if (res.status === 404) {
          visionStatus = {
            configured: true,
            reachable: false,
            visionModelReachable: false,
            status: 'MODEL_UNAVAILABLE',
            model: config.geminiModel,
            detail: errDetail ? `Model ${config.geminiModel} not found: ${errDetail}` : `Model ${config.geminiModel} not found or retired`,
            authenticationStatus: 'AUTHENTICATED',
            modelAvailability: 'UNAVAILABLE',
            rateLimits: 'OK',
            quotaState: 'OK',
          };
        } else {
          visionStatus = {
            configured: true,
            reachable: false,
            visionModelReachable: false,
            status: 'REQUEST_ERROR',
            model: config.geminiModel,
            detail: errDetail ? `HTTP ${res.status}: ${errDetail}` : `HTTP ${res.status}`,
            authenticationStatus: 'UNKNOWN' as any,
            modelAvailability: 'UNKNOWN',
            rateLimits: 'UNKNOWN',
            quotaState: 'UNKNOWN',
          };
        }
      }
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
        visionStatus = {
          configured: true,
          reachable: false,
          visionModelReachable: false,
          status: 'TIMEOUT',
          model: config.geminiModel,
          detail: 'Gemini health check timed out',
          authenticationStatus: 'UNKNOWN' as any,
          modelAvailability: 'UNKNOWN',
          rateLimits: 'UNKNOWN',
          quotaState: 'UNKNOWN',
        };
      } else {
        visionStatus = {
          configured: true,
          reachable: false,
          visionModelReachable: false,
          status: 'NETWORK_ERROR',
          model: config.geminiModel,
          detail: err instanceof Error ? err.message : 'Network timeout or unreachable',
          authenticationStatus: 'UNKNOWN' as any,
          modelAvailability: 'UNKNOWN',
          rateLimits: 'UNKNOWN',
          quotaState: 'UNKNOWN',
        };
      }
    }
  }

  const activeImage: ImageGenerationStatusInfo = imageGeneration ?? {
    provider: deps.provider?.name ?? 'cloudflare-workers-ai',
    imageModelReachable: cfStatus.reachable,
    authenticationStatus: cfStatus.status === 'AUTH_FAILED' ? 'AUTH_FAILED' : (cfStatus.configured ? 'AUTHENTICATED' : 'NOT_CONFIGURED'),
    modelAvailability: cfStatus.status === 'MODEL_UNAVAILABLE' ? 'UNAVAILABLE' : (cfStatus.reachable ? 'AVAILABLE' : 'UNKNOWN'),
    rateLimits: cfStatus.status === 'RATE_LIMITED' ? 'EXCEEDED' : 'OK',
    quotaState: 'OK',
    lastSuccessfulGeneration: null,
    ...cfStatus,
  };

  const imageModelReachable = activeImage.imageModelReachable ?? activeImage.reachable;
  const visionModelReachable = visionStatus.visionModelReachable;

  return {
    status: imageModelReachable && visionModelReachable ? 'ok' : 'degraded',
    imageProvider: deps.provider ? 'configured' : 'not_configured',
    imageProviderName: activeImage.provider,
    imageProviderStatus: imageModelReachable ? 'REACHABLE' : activeImage.status,
    configuredImageModel: activeImage.model,
    imageProviderConfigured: activeImage.configured,
    imageModelReachable,
    visionModelReachable,
    authenticationStatus: activeImage.authenticationStatus === 'AUTHENTICATED' && visionStatus.authenticationStatus === 'AUTHENTICATED'
      ? 'AUTHENTICATED'
      : (activeImage.authenticationStatus === 'AUTH_FAILED' || visionStatus.authenticationStatus === 'AUTH_FAILED' ? 'AUTH_FAILED' : 'NOT_CONFIGURED'),
    modelAvailability: activeImage.modelAvailability === 'AVAILABLE' && visionStatus.modelAvailability === 'AVAILABLE'
      ? 'AVAILABLE'
      : (activeImage.modelAvailability === 'UNAVAILABLE' || visionStatus.modelAvailability === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'UNKNOWN'),
    rateLimits: activeImage.rateLimits === 'EXCEEDED' || visionStatus.rateLimits === 'EXCEEDED' ? 'EXCEEDED' : 'OK',
    quotaState: activeImage.quotaState === 'EXCEEDED' || visionStatus.quotaState === 'EXCEEDED' ? 'EXCEEDED' : 'OK',
    lastSuccessfulGeneration: activeImage.lastSuccessfulGeneration,
    imageGeneration: activeImage,
    vision: visionStatus,
    cloudflare: cfStatus,
    gemini: visionStatus,
  };
}

export type ServerDeps = ImageRouteDeps & InterpretationRouteDeps & { config?: ImageServiceConfig };

/** Four apartment concepts (FLUX + preflight + interpretation + evaluation each) can exceed Node's 300 s default. */
export const GENERATION_REQUEST_TIMEOUT_MS = 15 * 60 * 1000;

export function createBackendServer(deps: ServerDeps): Server {
  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    void route(request, response, deps);
  });
  server.requestTimeout = GENERATION_REQUEST_TIMEOUT_MS;
  return server;
}

function sendJson(
  response: ServerResponse,
  status: number,
  json: unknown,
  corsHeaders: Record<string, string> = {},
): void {
  response.writeHead(status, { 'Content-Type': 'application/json', ...corsHeaders });
  response.end(JSON.stringify(json));
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body too large.'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
  });
}

export const DEFAULT_SMOKE_TEST_PROMPT = `Create a premium architectural floor-plan concept illustration for a modern Indian L-shaped 3-bedroom villa.

The villa is designed for a 40 ft × 60 ft east-facing residential plot in Ahmedabad, Gujarat.

Create a clean, sophisticated, top-down orthographic architectural floor-plan visualization with a clearly recognizable L-shaped building footprint.

Include these architectural spaces:
- Spacious living room.
- Dining area connected naturally to the living room.
- Semi-open kitchen.
- Three appropriately positioned bedrooms.
- Attached and common bathrooms.
- Dedicated northeast Pooja room.
- Utility space toward the southeast.
- Front verandah or traditional otla.
- Parking provision.
- Internal circulation and staircase provision for a possible G+1 design.

Follow the specified east-facing site orientation and strict Vastu preferences. Make the layout feel realistic, spacious, practical, and architecturally intentional.

Use varied but coherent room proportions, thoughtful circulation, realistic door and window placement, and natural daylight considerations.

Visual style:
- Professional architectural presentation.
- Fine dark architectural outlines.
- Subtle neutral floor finishes.
- Refined material representation.
- Clear spatial separation.
- Minimal visual clutter.
- Balanced composition.
- High-quality architectural visualization.

The result should look like a professionally prepared architectural concept presentation, not a generic collection of rectangular boxes.

Do not invent dimensions, room labels, technical annotations, structural calculations, or building-code certifications. Do not present this generated image as an engineering-approved construction drawing.

Generate an actual image, not a textual description.`;

export function decodeImageDimensions(buf: Buffer): { format: 'png' | 'jpeg'; width: number; height: number } | null {
  if (
    buf.length >= 24 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width > 0 && height > 0) {
      return { format: 'png', width, height };
    }
  }
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    let offset = 2;
    while (offset + 9 < buf.length) {
      if (buf[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buf[offset + 1]!;
      if (marker === 0xff) {
        offset++;
        continue;
      }
      // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        const height = buf.readUInt16BE(offset + 5);
        const width = buf.readUInt16BE(offset + 7);
        if (width > 0 && height > 0) {
          return { format: 'jpeg', width, height };
        }
        break;
      }
      if (offset + 3 >= buf.length) break;
      const segLength = buf.readUInt16BE(offset + 2);
      if (segLength < 2) break;
      offset += 2 + segLength;
    }
  }
  return null;
}

export async function handleImageSmokeTest(deps: ServerDeps, rawBody?: string): Promise<{ status: number; json: unknown }> {
  if (!deps.provider) {
    return {
      status: 503,
      json: {
        success: false,
        error: { code: 'NOT_CONFIGURED', message: 'No image generation provider configured on server.' },
      },
    };
  }

  if ('checkAccess' in deps.provider) {
    const access = await (deps.provider as any).checkAccess().catch(() => null);
    if (access && !access.reachable) {
      return {
        status: 502,
        json: {
          success: false,
          provider: deps.provider.name,
          model: (deps.provider as any).getModel?.() ?? 'unknown',
          error: {
            code: access.status || 'IMAGE_PROVIDER_UNREACHABLE',
            message: access.detail || 'Image generation provider is not reachable.',
            status: access.status === 'AUTH_FAILED' ? 403 : 502,
          },
        },
      };
    }
  }

  let customPrompt: string | undefined;
  let customWidth: number | undefined;
  let customHeight: number | undefined;
  let customSeed: number | undefined;
  if (rawBody && rawBody.trim().length > 0) {
    try {
      const parsed = JSON.parse(rawBody) as Record<string, unknown>;
      if (typeof parsed.prompt === 'string' && parsed.prompt.trim().length > 0) {
        customPrompt = parsed.prompt.trim();
      }
      if (typeof parsed.width === 'number' && parsed.width > 0) customWidth = parsed.width;
      if (typeof parsed.height === 'number' && parsed.height > 0) customHeight = parsed.height;
      if (typeof parsed.seed === 'number' && Number.isFinite(parsed.seed)) customSeed = parsed.seed;
    } catch {
      // Fall back to default smoke test prompt
    }
  }

  const testRequest: FloorPlanImagePromptRequest = {
    schemaVersion: 1,
    promptVersion: 1,
    prompt: customPrompt ?? DEFAULT_SMOKE_TEST_PROMPT,
    negativePrompt: 'perspective, 3d exterior render, realistic photography, dimensions, technical text annotations',
    seed: customSeed ?? 1234,
    width: customWidth ?? 1024,
    height: customHeight ?? 768,
    metadata: {
      projectName: 'Ahmedabad L-Shaped 3BHK Villa Smoke Test',
      plotWidthMm: 12192,
      plotDepthMm: 18288,
      floorsCount: 2,
      roadFacing: 'east',
      projectType: 'residential_independent',
    },
  };

  const startedAt = Date.now();
  try {
    const result = await deps.provider.generateFloorPlan(testRequest);
    const latencyMs = Date.now() - startedAt;
    const buf = Buffer.from(result.imageBase64, 'base64');

    const decoded = decodeImageDimensions(buf);
    if (!decoded) {
      return {
        status: 502,
        json: {
          success: false,
          provider: result.provider,
          model: result.model,
          error: { code: 'INVALID_IMAGE_BYTES', message: 'Generated image could not be decoded as a valid PNG or JPEG with positive dimensions.' },
        },
      };
    }

    const artifact = await deps.store.save('smoke-test', result, testRequest);
    const persistedArtifact = await deps.store.get(artifact.generationId);
    if (!persistedArtifact || !persistedArtifact.imageBase64) {
      return {
        status: 500,
        json: {
          success: false,
          provider: result.provider,
          model: result.model,
          error: { code: 'PERSISTENCE_FAILURE', message: 'Generated image could not be verified in artifact storage.' },
        },
      };
    }

    return {
      status: 200,
      json: {
        success: true,
        provider: result.provider,
        model: result.model,
        mimeType: result.mimeType,
        format: decoded.format,
        dimensions: { width: decoded.width, height: decoded.height },
        byteLength: buf.length,
        latencyMs,
        artifactId: artifact.generationId,
        persisted: true,
        provenance: result.providerRequest,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const code = err instanceof ImageProviderError ? err.code : 'IMAGE_GENERATION_FAILED';
    const status = (err instanceof ImageProviderError && (err as any).status) ? (err as any).status : 502;
    return {
      status: status >= 400 && status < 600 ? status : 502,
      json: {
        success: false,
        provider: deps.provider.name,
        model: (deps.provider as any).getModel?.() ?? 'unknown',
        error: { code, message, status },
      },
    };
  }
}

async function route(request: IncomingMessage, response: ServerResponse, deps: ServerDeps): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const method = request.method ?? 'GET';
  const config = deps.config ?? resolveImageServiceConfig();
  const isProduction = (process.env.NODE_ENV ?? 'development') === 'production';
  const corsHeaders = resolveCorsHeaders(request.headers.origin, config.corsAllowedOrigins, isProduction);
  const send = (status: number, json: unknown) => sendJson(response, status, json, corsHeaders);

  if (method === 'OPTIONS') {
    if (request.headers.origin && !corsHeaders['Access-Control-Allow-Origin']) {
      response.writeHead(403, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        error: {
          code: 'CORS_FORBIDDEN',
          message: `Origin ${request.headers.origin} is not allowed by CORS policy.`,
        },
      }));
      return;
    }
    response.writeHead(204, corsHeaders);
    response.end();
    return;
  }

  try {
    if (method === 'GET' && url.pathname === '/api/v1/health') {
      const config = deps.config ?? resolveImageServiceConfig();
      const health = await checkProviderHealth(config, deps);
      send(200, health);
      return;
    }
    if (method === 'POST' && (url.pathname === '/api/v1/image/smoke-test' || url.pathname === '/api/image/smoke-test')) {
      const raw = await readBody(request);
      const smokeResult = await handleImageSmokeTest(deps, raw);
      send(smokeResult.status, smokeResult.json);
      return;
    }
    if (method === 'POST' && (url.pathname === '/api/v1/generation/run' || url.pathname === '/api/generation/run')) {
      const raw = await readBody(request);
      let body: unknown = null;
      try {
        body = raw.length > 0 ? JSON.parse(raw) : null;
      } catch {
        send(400, { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } });
        return;
      }
      const { GenerationOrchestrator } = await import('./services/generation-orchestrator.js');
      const orchestrator = new GenerationOrchestrator({
        provider: deps.provider,
        store: deps.store,
        gemini: deps.gemini,
        interpreterKind: deps.interpreterKind,
        deterministicCadFirst: deps.config?.deterministicCadFirst ?? true,
      });
      const result = await orchestrator.run(body as any);
      send(200, result);
      return;
    }
    if (method === 'POST' && (url.pathname === '/api/v1/generation/resume' || url.pathname === '/api/generation/resume')) {
      const raw = await readBody(request);
      let body: unknown = null;
      try {
        body = raw.length > 0 ? JSON.parse(raw) : null;
      } catch {
        send(400, { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } });
        return;
      }
      const { GenerationOrchestrator } = await import('./services/generation-orchestrator.js');
      const orchestrator = new GenerationOrchestrator({
        provider: deps.provider,
        store: deps.store,
        gemini: deps.gemini,
        interpreterKind: deps.interpreterKind,
        deterministicCadFirst: deps.config?.deterministicCadFirst ?? true,
      });
      const result = await orchestrator.resumeFromArtifact(body as any);
      send(200, result);
      return;
    }
    if (method === 'POST' && url.pathname === '/api/v1/image/floor-plan') {
      const raw = await readBody(request);
      let body: unknown = null;
      try {
        body = raw.length > 0 ? JSON.parse(raw) : null;
      } catch {
        send(400, { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } });
        return;
      }
      const result = await handleFloorPlanGeneration(body, deps);
      send(result.status, result.json);
      return;
    }
    if (method === 'POST' && url.pathname === '/api/v1/image/interpret') {
      const raw = await readBody(request);
      let body: unknown = null;
      try {
        body = raw.length > 0 ? JSON.parse(raw) : null;
      } catch {
        send(400, { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } });
        return;
      }
      const result = await handleImageInterpretation(body, deps);
      send(result.status, result.json);
      return;
    }
    if (method === 'POST' && url.pathname === '/api/v1/architecture/evaluate') {
      const raw = await readBody(request);
      let body: unknown = null;
      try {
        body = raw.length > 0 ? JSON.parse(raw) : null;
      } catch {
        send(400, { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } });
        return;
      }
      const result = await handleArchitecturalEvaluation(body, deps);
      send(result.status, result.json);
      return;
    }
    const artifactMatch = url.pathname.match(/^\/api\/v1\/image\/artifacts\/([^/]+)$/);
    if (method === 'GET' && artifactMatch) {
      const result = await handleArtifactGet(decodeURIComponent(artifactMatch[1]!), deps.store);
      send(result.status, result.json);
      return;
    }
    if (method === 'GET' && url.pathname === '/api/v1/image/artifacts') {
      const projectId = url.searchParams.get('projectId') ?? '';
      if (!projectId) {
        send(400, { error: { code: 'INVALID_REQUEST', message: 'projectId query parameter is required.' } });
        return;
      }
      sendJson(response, 200, { artifacts: await deps.store.listByProject(projectId) });
      return;
    }
    send(404, { error: { code: 'NOT_FOUND', message: 'Unknown endpoint.' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    send(message.includes('too large') ? 413 : 500, { error: { code: 'SERVER_ERROR', message } });
  }
}

export function startBackendServer(port?: number): { server: Server; config: ImageServiceConfig } {
  const config = resolveImageServiceConfig();
  const gemini = createGeminiProvider(config);
  const deps: ServerDeps = {
    provider: createImageProvider(config),
    store: new ImageArtifactStore(config.artifactDir),
    gemini,
    interpreterKind: config.imageInterpreterKind,
    config,
  };
  const server = createBackendServer(deps);
  server.listen(port ?? config.port, () => {
    // Never log credential values — only their presence (PRD §36).
    console.log(`AI floor-planner backend listening on port ${port ?? config.port}`);
    console.log(`CORS allowed origins: ${config.corsAllowedOrigins.length > 0 ? config.corsAllowedOrigins.join(', ') : (process.env.NODE_ENV === 'production' ? 'NONE (explicit origins required)' : 'local dev frontends')}`);
    const providerModel = config.imageProviderKind === 'pollinations' ? config.pollinationsImageModel : config.imageProviderKind === 'gemini' ? config.geminiImageModel : config.imageProviderKind === 'cloudflare' ? config.fluxModel : 'local-stub';
    const missing = config.imageProviderKind === 'pollinations' ? 'POLLINATIONS_API_KEY' : config.imageProviderKind === 'gemini' ? 'GEMINI_API_KEY' : 'CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN';
    console.log(`Image provider: ${deps.provider ? `${deps.provider.name} configured (model ${providerModel})` : `${config.imageProviderKind} NOT CONFIGURED (set ${missing})`}`);
    console.log(`Image interpreter: ${deps.interpreterKind === 'gemini' ? (gemini ? 'gemini configured' : 'gemini NOT CONFIGURED (set GEMINI_API_KEY)') : 'local-stub (dev)'}`);
    console.log(`Image artifact store: ${config.artifactDir}`);
  });
  return { server, config };
}

// Direct-run detection that works both for the raw ESM build (dist/server.js)
// and the bundled CJS server (dist-server/server.cjs). Importing this module
// (tests, libraries) never starts a listener as a side effect.
function isDirectRun(): boolean {
  const entry = (process.argv[1] ?? '').replace(/\\/g, '/');
  return entry.endsWith('server.cjs') || entry.endsWith('server.js');
}

if (isDirectRun()) {
  startBackendServer();
}
