import { describe, expect, it, vi } from 'vitest';
import { resolveApiBaseUrl, isLocalhostAddress } from '../services/api-config';
import { BackendAPI, BackendError } from '../services/backend-api';

describe('Frontend API URL Resolution (api-config)', () => {
  describe('isLocalhostAddress', () => {
    it('identifies localhost hostnames and loopback IPs', () => {
      expect(isLocalhostAddress('http://localhost:4200')).toBe(true);
      expect(isLocalhostAddress('http://127.0.0.1:4200')).toBe(true);
      expect(isLocalhostAddress('http://0.0.0.0:8080')).toBe(true);
      expect(isLocalhostAddress('http://[::1]:4200')).toBe(true);
      expect(isLocalhostAddress('https://127.0.0.2:3000')).toBe(true);
    });

    it('identifies non-localhost domain names', () => {
      expect(isLocalhostAddress('https://api.floorplanner.com')).toBe(false);
      expect(isLocalhostAddress('https://floor-planner-backend.onrender.com')).toBe(false);
      expect(isLocalhostAddress('https://backend-service.railway.app')).toBe(false);
    });
  });

  describe('resolveApiBaseUrl', () => {
    it('defaults to http://127.0.0.1:4200 in development when VITE_API_BASE_URL is not set', () => {
      const res = resolveApiBaseUrl(undefined, {
        DEV: true,
        PROD: false,
        MODE: 'development',
      });
      expect(res.isConfigured).toBe(true);
      expect(res.baseUrl).toBe('http://127.0.0.1:4200');
      expect(res.error).toBeUndefined();
    });

    it('uses VITE_API_BASE_URL in development when provided', () => {
      const res = resolveApiBaseUrl(undefined, {
        VITE_API_BASE_URL: 'http://localhost:8000',
        DEV: true,
        PROD: false,
        MODE: 'development',
      });
      expect(res.isConfigured).toBe(true);
      expect(res.baseUrl).toBe('http://localhost:8000');
    });

    it('uses VITE_API_BASE_URL in production when configured with a remote URL', () => {
      const res = resolveApiBaseUrl(undefined, {
        VITE_API_BASE_URL: 'https://backend.example.com/',
        DEV: false,
        PROD: true,
        MODE: 'production',
      });
      expect(res.isConfigured).toBe(true);
      expect(res.baseUrl).toBe('https://backend.example.com');
      expect(res.error).toBeUndefined();
    });

    it('rejects missing VITE_API_BASE_URL in production with MISSING_API_BASE_URL error', () => {
      const res = resolveApiBaseUrl(undefined, {
        VITE_API_BASE_URL: '',
        DEV: false,
        PROD: true,
        MODE: 'production',
      });
      expect(res.isConfigured).toBe(false);
      expect(res.baseUrl).toBeNull();
      expect(res.error).toBeInstanceOf(BackendError);
      expect(res.error?.code).toBe('MISSING_API_BASE_URL');
      expect(res.error?.message).toContain('VITE_API_BASE_URL');
    });

    it('rejects localhost in production with INVALID_PRODUCTION_API_URL error', () => {
      const res = resolveApiBaseUrl(undefined, {
        VITE_API_BASE_URL: 'http://127.0.0.1:4200',
        DEV: false,
        PROD: true,
        MODE: 'production',
      });
      expect(res.isConfigured).toBe(false);
      expect(res.baseUrl).toBeNull();
      expect(res.error?.code).toBe('INVALID_PRODUCTION_API_URL');
    });

    it('rejects explicit localhost URL in production mode', () => {
      const res = resolveApiBaseUrl('http://localhost:4200', {
        DEV: false,
        PROD: true,
        MODE: 'production',
      });
      expect(res.isConfigured).toBe(false);
      expect(res.baseUrl).toBeNull();
      expect(res.error?.code).toBe('INVALID_PRODUCTION_API_URL');
    });

    it('accepts explicit remote URL in production mode', () => {
      const res = resolveApiBaseUrl('https://api.my-domain.com', {
        DEV: false,
        PROD: true,
        MODE: 'production',
      });
      expect(res.isConfigured).toBe(true);
      expect(res.baseUrl).toBe('https://api.my-domain.com');
    });
  });

  describe('BackendAPI with production configuration guards', () => {
    it('returns degraded health without throwing or fetching when unconfigured in production', async () => {
      const mockFetch = vi.fn();
      const backend = new BackendAPI(
        undefined,
        mockFetch as unknown as typeof fetch,
        { PROD: true, DEV: false, MODE: 'production', VITE_API_BASE_URL: '' },
      );

      expect(backend.isConfigured()).toBe(false);
      expect(backend.getConfigurationError()?.code).toBe('MISSING_API_BASE_URL');

      const health = await backend.checkHealth();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(health.status).toBe('degraded');
      expect(health.imageProvider).toBe('not_configured');
      expect(health.cloudflare.status).toBe('NOT_CONFIGURED');
      expect(health.gemini.status).toBe('NOT_CONFIGURED');
      expect(health.cloudflare.detail).toContain('VITE_API_BASE_URL');
    });

    it('throws MISSING_API_BASE_URL on runTwoAIGeneration without attempting localhost fetch', async () => {
      const mockFetch = vi.fn();
      const backend = new BackendAPI(
        undefined,
        mockFetch as unknown as typeof fetch,
        { PROD: true, DEV: false, MODE: 'production', VITE_API_BASE_URL: '' },
      );

      await expect(
        backend.runTwoAIGeneration({
          projectId: 'p1',
          site: { plotWidth: 10000, plotDepth: 10000, roadFacing: 'North' },
          roomCounts: { bedrooms: 2, bathrooms: 2 },
        }),
      ).rejects.toThrowError(BackendError);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('makes request to configured production URL when VITE_API_BASE_URL is set', async () => {
      const mockFetch = vi.fn(async () =>
        new Response(
          JSON.stringify({
            status: 'ok',
            imageProvider: 'configured',
            cloudflare: { configured: true, reachable: true, status: 'REACHABLE', model: 'flux' },
            gemini: { configured: true, reachable: true, status: 'REACHABLE', model: 'gemini' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );

      const backend = new BackendAPI(
        undefined,
        mockFetch as unknown as typeof fetch,
        {
          PROD: true,
          DEV: false,
          MODE: 'production',
          VITE_API_BASE_URL: 'https://backend.myproductiondomain.com',
        },
      );

      expect(backend.isConfigured()).toBe(true);
      expect(backend.getBaseUrl()).toBe('https://backend.myproductiondomain.com');

      const health = await backend.checkHealth();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://backend.myproductiondomain.com/api/v1/health',
        expect.objectContaining({ method: 'GET' }),
      );
      expect(health.status).toBe('ok');
    });
  });
});

