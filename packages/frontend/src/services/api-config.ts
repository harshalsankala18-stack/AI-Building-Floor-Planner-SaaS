import { BackendError } from './backend-api';

export interface ApiConfigEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly PROD?: boolean;
  readonly DEV?: boolean;
  readonly MODE?: string;
}

export interface ApiUrlResolution {
  readonly baseUrl: string | null;
  readonly isConfigured: boolean;
  readonly isProduction: boolean;
  readonly error?: BackendError;
}

export function isLocalhostAddress(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host === '[::1]' ||
      host.startsWith('127.')
    );
  } catch {
    const lower = urlStr.toLowerCase();
    return lower.includes('localhost') || lower.includes('127.0.0.1') || lower.includes('0.0.0.0');
  }
}

/**
 * Resolves the backend API base URL with production safeguards.
 *
 * Rules:
 * 1. An explicit URL passed directly is validated to ensure production builds
 *    never connect to localhost/127.0.0.1.
 * 2. In production (PROD = true, MODE !== 'test'), VITE_API_BASE_URL is mandatory
 *    and cannot point to localhost/127.0.0.1.
 * 3. In development (DEV = true or MODE !== 'production'), defaults to http://127.0.0.1:4200
 *    when VITE_API_BASE_URL is omitted.
 * 4. In production without VITE_API_BASE_URL, returns a meaningful error without
 *    attempting any localhost requests.
 */
export function resolveApiBaseUrl(
  explicitUrl?: string,
  envOverride?: ApiConfigEnv,
): ApiUrlResolution {
  const isMetaAvailable = typeof import.meta !== 'undefined' && Boolean(import.meta.env);

  const envUrl = envOverride ? envOverride.VITE_API_BASE_URL : (isMetaAvailable ? import.meta.env.VITE_API_BASE_URL : undefined);

  // In production builds (or when envOverride explicitly specifies production):
  const isProduction = envOverride
    ? Boolean(envOverride.PROD) && !envOverride.DEV && envOverride.MODE !== 'test'
    : (isMetaAvailable ? Boolean(import.meta.env.PROD) && !import.meta.env.DEV && import.meta.env.MODE !== 'test' : false);

  // Case 1: Explicit URL provided
  if (explicitUrl && explicitUrl.trim().length > 0) {
    const trimmed = explicitUrl.trim().replace(/\/+$/, '');
    if (isProduction && isLocalhostAddress(trimmed)) {
      return {
        baseUrl: null,
        isConfigured: false,
        isProduction,
        error: new BackendError(
          'INVALID_PRODUCTION_API_URL',
          'Production build cannot connect to localhost or 127.0.0.1. Configure VITE_API_BASE_URL with your production backend URL.',
        ),
      };
    }
    return {
      baseUrl: trimmed,
      isConfigured: true,
      isProduction,
    };
  }

  // Case 2: Read from VITE_API_BASE_URL environment variable
  const rawEnvUrl = (envUrl ?? '').trim();
  if (rawEnvUrl.length > 0) {
    const trimmed = rawEnvUrl.replace(/\/+$/, '');
    if (isProduction && isLocalhostAddress(trimmed)) {
      return {
        baseUrl: null,
        isConfigured: false,
        isProduction,
        error: new BackendError(
          'INVALID_PRODUCTION_API_URL',
          'VITE_API_BASE_URL cannot point to localhost or 127.0.0.1 in a production build. Set it to your deployed backend URL.',
        ),
      };
    }
    return {
      baseUrl: trimmed,
      isConfigured: true,
      isProduction,
    };
  }

  // Case 3: Missing VITE_API_BASE_URL in production
  if (isProduction) {
    return {
      baseUrl: null,
      isConfigured: false,
      isProduction: true,
      error: new BackendError(
        'MISSING_API_BASE_URL',
        'Backend API URL is not configured. Please set VITE_API_BASE_URL in your production deployment environment.',
      ),
    };
  }

  // Case 4: Local development and test fallback
  // In development, default to local backend on port 4200.
  // Using import.meta.env.DEV ensures Vite dead-code eliminates this branch in production bundles.
  if (import.meta.env.DEV) {
    return {
      baseUrl: 'http://127.0.0.1:4200',
      isConfigured: true,
      isProduction: false,
    };
  }

  return {
    baseUrl: null,
    isConfigured: false,
    isProduction: false,
    error: new BackendError(
      'MISSING_API_BASE_URL',
      'Backend API URL is not configured.',
    ),
  };
}
