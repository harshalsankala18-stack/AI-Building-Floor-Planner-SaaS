import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { createBackendServer, resolveCorsHeaders } from '../server';
import { ImageArtifactStore } from '../services/image-artifact-store';
import { LocalStubImageProvider } from '../services/local-stub-image-provider';
import type { ImageServiceConfig } from '../env';
import { Direction } from '@ai-floor-planner/core';

const dirs: string[] = [];

async function setupTestServer(configOverrides: Partial<ImageServiceConfig> = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), 'afp-endpoints-test-'));
  dirs.push(dir);
  const store = new ImageArtifactStore(dir);
  const provider = new LocalStubImageProvider();

  const config: ImageServiceConfig = {
    cloudflareAccountId: '',
    cloudflareApiToken: '',
    fluxModel: 'fake-flux',
    fluxSteps: 4,
    providerTimeoutMs: 5000,
    imageProviderKind: 'local-stub',
    pollinationsApiKey: '',
    pollinationsImageModel: 'flux',
    pollinationsBaseUrl: 'https://pollinations.ai',
    pollinationsTimeoutMs: 5000,
    geminiImageModel: 'gemini-image',
    geminiImageSize: '2K',
    imageInterpreterKind: 'local-stub',
    geminiApiKey: '',
    geminiModel: 'gemini-2.5-flash',
    geminiFallbackModel: 'gemini-2.0-flash',
    port: 0,
    artifactDir: dir,
    deterministicCadFirst: true,
    corsAllowedOrigins: configOverrides.corsAllowedOrigins ?? [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    enableArchLang: false,
    ...configOverrides,
  };

  const server = createBackendServer({
    provider,
    store,
    gemini: null,
    interpreterKind: 'local-stub',
    config,
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  return { server, baseUrl, dir, config };
}

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

describe('Backend Server Endpoints & CORS', () => {
  describe('GET /api/v1/health', () => {
    it('returns 200 with status info', async () => {
      const { server, baseUrl } = await setupTestServer();
      try {
        const res = await fetch(`${baseUrl}/api/v1/health`);
        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.status).toBeDefined();
        expect(json.imageProvider).toBe('configured');
        expect(json.imageGeneration).toBeDefined();
        expect(json.gemini).toBeDefined();
      } finally {
        server.close();
      }
    });
  });

  describe('POST /api/v1/generation/run', () => {
    it('returns 400 with INVALID_JSON when body is invalid JSON', async () => {
      const { server, baseUrl } = await setupTestServer();
      try {
        const res = await fetch(`${baseUrl}/api/v1/generation/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'not-valid-json',
        });
        expect(res.status).toBe(400);
        const json = (await res.json()) as any;
        expect(json.error?.code).toBe('INVALID_JSON');
      } finally {
        server.close();
      }
    });

    it('processes apartment generation request and returns 200', async () => {
      const { server, baseUrl } = await setupTestServer();
      try {
        const payload = {
          projectId: 'endpoint-test-project',
          projectName: 'Endpoint Test Apartment',
          projectType: 'apartment',
          site: {
            plotWidth: 35000,
            plotDepth: 40000,
            roadFacing: Direction.North,
            setbacks: { front: 3000, rear: 2000, left: 2000, right: 2000 },
          },
          apartmentConfig: {
            projectType: 'apartment',
            jurisdiction: 'pune_pmc',
            floorCount: 1,
            flatsPerFloor: 2,
            unitMix: [
              { unitType: '2BHK', count: 1, carpetAreaSqFt: 750 },
              { unitType: '3BHK', count: 1, carpetAreaSqFt: 1100 },
            ],
            commonCore: {
              passengerLifts: 1,
              serviceLifts: 0,
              staircaseCount: 1,
              fireStaircaseRequired: false,
              commonLobby: true,
            },
            floorStrategy: 'typical',
            parking: {
              residentParkingCount: 2,
              visitorParkingCount: 1,
              twoWheelerParkingCount: 4,
            },
            amenities: {
              groundSiteAmenities: [],
              buildingAmenities: [],
            },
          },
          candidateCount: 1,
          seed: 42,
        };

        const res = await fetch(`${baseUrl}/api/v1/generation/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.candidates).toHaveLength(1);
        expect(json.candidates[0].building).toBeDefined();
      } finally {
        server.close();
      }
    });
  });

  describe('CORS preflight and origin verification', () => {
    it('allows development localhost origins on OPTIONS preflight', async () => {
      const { server, baseUrl } = await setupTestServer({
        corsAllowedOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      });
      try {
        const res = await fetch(`${baseUrl}/api/v1/health`, {
          method: 'OPTIONS',
          headers: {
            Origin: 'http://localhost:3000',
            'Access-Control-Request-Method': 'GET',
          },
        });
        expect(res.status).toBe(204);
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
        expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      } finally {
        server.close();
      }
    });

    it('attaches Access-Control-Allow-Origin to GET requests from allowed origins', async () => {
      const { server, baseUrl } = await setupTestServer({
        corsAllowedOrigins: ['http://localhost:3000'],
      });
      try {
        const res = await fetch(`${baseUrl}/api/v1/health`, {
          headers: { Origin: 'http://localhost:3000' },
        });
        expect(res.status).toBe(200);
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
        expect(res.headers.get('Vary')).toBe('Origin');
      } finally {
        server.close();
      }
    });

    it('rejects forbidden origins in production mode with 403 on preflight', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const { server, baseUrl } = await setupTestServer({
        corsAllowedOrigins: ['https://ai-floor-planner.vercel.app'],
      });
      try {
        // Preflight from unauthorized origin
        const res = await fetch(`${baseUrl}/api/v1/health`, {
          method: 'OPTIONS',
          headers: {
            Origin: 'https://malicious-site.com',
            'Access-Control-Request-Method': 'GET',
          },
        });
        expect(res.status).toBe(403);
        const json = (await res.json()) as any;
        expect(json.error?.code).toBe('CORS_FORBIDDEN');
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
        server.close();
      }
    });

    it('accepts configured production origin on OPTIONS preflight in production mode', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const { server, baseUrl } = await setupTestServer({
        corsAllowedOrigins: ['https://ai-floor-planner.vercel.app'],
      });
      try {
        const res = await fetch(`${baseUrl}/api/v1/generation/run`, {
          method: 'OPTIONS',
          headers: {
            Origin: 'https://ai-floor-planner.vercel.app',
            'Access-Control-Request-Method': 'POST',
          },
        });
        expect(res.status).toBe(204);
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://ai-floor-planner.vercel.app');
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
        server.close();
      }
    });
  });

  describe('resolveCorsHeaders unit helper', () => {
    it('handles wildcard in development', () => {
      const headers = resolveCorsHeaders('http://foo.com', ['*'], false);
      expect(headers['Access-Control-Allow-Origin']).toBe('*');
    });

    it('does not allow wildcard in production', () => {
      const headers = resolveCorsHeaders('http://foo.com', ['*'], true);
      expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
    });

    it('matches explicit production origin', () => {
      const headers = resolveCorsHeaders(
        'https://my-frontend.vercel.app',
        ['https://my-frontend.vercel.app'],
        true,
      );
      expect(headers['Access-Control-Allow-Origin']).toBe('https://my-frontend.vercel.app');
      expect(headers['Vary']).toBe('Origin');
    });

    it('denies unknown origin in production', () => {
      const headers = resolveCorsHeaders(
        'https://evil.com',
        ['https://my-frontend.vercel.app'],
        true,
      );
      expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
    });
  });
});

