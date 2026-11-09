/**
 * Server-side credential & service configuration — Master PRD Phase 2 / §36.
 *
 * ALL Cloudflare credentials are read from environment variables here, inside
 * the backend process only. They are never sent to the React frontend, never
 * hard-coded and never logged.
 */

import path from 'path';
import {
  DEFAULT_FLUX_MODEL,
  DEFAULT_POLLINATIONS_IMAGE_MODEL,
  POLLINATIONS_BASE_URL,
  DEFAULT_GEMINI_IMAGE_MODEL,
  DEFAULT_GEMINI_IMAGE_SIZE,
} from '@ai-floor-planner/ai-orchestration';

export type ImageProviderKind = 'cloudflare' | 'pollinations' | 'gemini' | 'local-stub';

export interface ImageServiceConfig {
  readonly cloudflareAccountId: string;
  readonly cloudflareApiToken: string;
  readonly fluxModel: string;
  readonly fluxSteps: number;
  readonly providerTimeoutMs: number;
  /**
   * IMAGE_GENERATION_PROVIDER (falls back to legacy IMAGE_PROVIDER):
   * 'cloudflare' (default), 'gemini', 'pollinations', or 'local-stub' (explicit dev opt-in only).
   */
  readonly imageProviderKind: ImageProviderKind;
  /** Server-side only; never sent to the frontend or logged. */
  readonly pollinationsApiKey: string;
  readonly pollinationsImageModel: string;
  readonly pollinationsBaseUrl: string;
  readonly pollinationsTimeoutMs: number;
  /** Dedicated Gemini Image generation model (defaults to gemini-3-pro-image). */
  readonly geminiImageModel: string;
  /** Gemini Image output resolution (defaults to 2K). */
  readonly geminiImageSize: string;
  /** 'gemini' (default) or 'local-stub' (explicit dev opt-in only). */
  readonly imageInterpreterKind: 'gemini' | 'local-stub';
  readonly geminiApiKey: string;
  readonly geminiModel: string;
  readonly geminiFallbackModel: string;
  readonly port: number;
  readonly artifactDir: string;
  /**
   * DETERMINISTIC_CAD_FIRST: defaults to true.
   * When true, apartment generation uses the deterministic stepped-polygon CAD
   * engine directly as the primary generator, bypassing raster image models.
   */
  readonly deterministicCadFirst: boolean;
  /**
   * Allowed CORS origins. In development, defaults to local dev frontends.
   * In production, must be explicitly configured via CORS_ALLOWED_ORIGINS.
   */
  readonly corsAllowedOrigins: readonly string[];
  /**
   * ENABLE_ARCHLANG: defaults to false.
   * When true, compiles generated buildings with ArchLang and runs geometry parity checks.
   */
  readonly enableArchLang: boolean;
}

export function cloudflareConfigured(config: Pick<ImageServiceConfig, 'cloudflareAccountId' | 'cloudflareApiToken'>): boolean {
  return config.cloudflareAccountId.length > 0 && config.cloudflareApiToken.length > 0;
}

/** Credentials present for the SELECTED image provider (local-stub needs none). */
export function imageProviderConfigured(
  config: Pick<ImageServiceConfig, 'cloudflareAccountId' | 'cloudflareApiToken'> &
    Partial<Pick<ImageServiceConfig, 'imageProviderKind' | 'pollinationsApiKey' | 'geminiApiKey'>>,
): boolean {
  if (config.imageProviderKind === 'local-stub') return true;
  if (config.imageProviderKind === 'gemini') return (config.geminiApiKey ?? '').length > 0;
  if (config.imageProviderKind === 'pollinations') return (config.pollinationsApiKey ?? '').length > 0;
  return cloudflareConfigured(config);
}

function resolveImageProviderKind(env: NodeJS.ProcessEnv): ImageProviderKind {
  const kind = (env.IMAGE_GENERATION_PROVIDER ?? env.IMAGE_PROVIDER ?? 'cloudflare').trim().toLowerCase();
  if (kind === 'local-stub') return 'local-stub';
  if (kind === 'gemini') return 'gemini';
  if (kind === 'pollinations') return 'pollinations';
  return 'cloudflare';
}

export function resolveCorsAllowedOrigins(env: NodeJS.ProcessEnv): readonly string[] {
  const raw = (env.CORS_ALLOWED_ORIGINS ?? '').trim();
  if (raw.length > 0) {
    return raw
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }
  const isProd = (env.NODE_ENV ?? 'development') === 'production';
  if (!isProd) {
    return [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:4173',
      'http://127.0.0.1:4173',
    ];
  }
  return [];
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function resolveImageServiceConfig(env: NodeJS.ProcessEnv = process.env): ImageServiceConfig {
  const interpreterKind = (env.IMAGE_INTERPRETER ?? 'gemini').trim().toLowerCase();
  // Phase 1 recovery (P5): Pin real, currently-available Gemini model IDs.
  // "gemini-2.5-flash" and "gemini-2.0-flash" are verified available via Generative Language API.
  // Fictional "gemini-3.x" IDs removed.
  const primaryModel = (env.GEMINI_MODEL ?? '').trim() || 'gemini-2.5-flash';
  const defaultFallback = primaryModel === 'gemini-2.0-flash' ? 'gemini-2.5-flash' : 'gemini-2.0-flash';
  const fallbackModel = (env.GEMINI_FALLBACK_MODEL ?? '').trim() || defaultFallback;

  return {
    cloudflareAccountId: (env.CLOUDFLARE_ACCOUNT_ID ?? '').trim(),
    cloudflareApiToken: (env.CLOUDFLARE_API_TOKEN ?? '').trim(),
    fluxModel: (env.CLOUDFLARE_IMAGE_MODEL ?? env.CLOUDFLARE_FLUX_MODEL ?? '').trim() || DEFAULT_FLUX_MODEL,
    fluxSteps: positiveInt(env.CLOUDFLARE_FLUX_STEPS, 4),
    providerTimeoutMs: positiveInt(env.CLOUDFLARE_FLUX_TIMEOUT_MS, 60_000),
    imageProviderKind: resolveImageProviderKind(env),
    pollinationsApiKey: (env.POLLINATIONS_API_KEY ?? '').trim(),
    pollinationsImageModel: (env.POLLINATIONS_IMAGE_MODEL ?? '').trim() || DEFAULT_POLLINATIONS_IMAGE_MODEL,
    pollinationsBaseUrl: (env.POLLINATIONS_BASE_URL ?? '').trim() || POLLINATIONS_BASE_URL,
    pollinationsTimeoutMs: positiveInt(env.POLLINATIONS_TIMEOUT_MS, 180_000),
    geminiImageModel: (env.GEMINI_IMAGE_MODEL ?? '').trim() || DEFAULT_GEMINI_IMAGE_MODEL,
    geminiImageSize: (env.GEMINI_IMAGE_SIZE ?? '').trim() || DEFAULT_GEMINI_IMAGE_SIZE,
    imageInterpreterKind: interpreterKind === 'local-stub' ? 'local-stub' : 'gemini',
    geminiApiKey: (env.GEMINI_API_KEY ?? '').trim(),
    geminiModel: primaryModel,
    geminiFallbackModel: fallbackModel,
    port: positiveInt(env.PORT, 4200),
    artifactDir: (env.IMAGE_ARTIFACT_DIR ?? '').trim()
      || path.join(process.cwd(), 'data', 'image-artifacts'),
    deterministicCadFirst: (env.DETERMINISTIC_CAD_FIRST ?? 'true').trim().toLowerCase() !== 'false' && (env.DETERMINISTIC_CAD_FIRST ?? 'true').trim() !== '0',
    corsAllowedOrigins: resolveCorsAllowedOrigins(env),
    enableArchLang: (env.ENABLE_ARCHLANG ?? 'false').trim().toLowerCase() === 'true' || (env.ENABLE_ARCHLANG ?? '0').trim() === '1',
  };
}
