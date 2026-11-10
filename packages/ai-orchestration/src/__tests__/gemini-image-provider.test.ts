import { describe, expect, it } from 'vitest';
import {
  GeminiImageProvider,
  DEFAULT_GEMINI_IMAGE_MODEL,
  DEFAULT_GEMINI_IMAGE_SIZE,
  GEMINI_IMAGE_PROVIDER_NAME,
  mapDimensionsToGeminiAspectRatio,
  buildGeminiImagePrompt,
  separateGeminiReferenceImages,
  buildGeminiImageRequestBody,
  extractGeminiImageBytes,
  ImageProviderError,
  planDeterministicApartment,
  renderStructuralPlan,
  type FloorPlanImagePromptRequest,
  type ReferenceImageInput,
} from '../index';

describe('Gemini Image Generation Provider — Unit & Integration Tests', () => {
  // A minimal valid 1x1 transparent PNG payload encoded as base64 for testing
  // PNG: 89 50 4E 47 0D 0A 1A 0A + IHDR + IDAT + IEND padded to > 5000 bytes
  const basePngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
    0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54,
    0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01,
    0x0d, 0x0a, 0x2d, 0xb4,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
    0xae, 0x42, 0x60, 0x82,
  ]);
  const mockPngBuffer = Buffer.concat([basePngHeader, Buffer.alloc(6000, 0x00)]);
  const mockPngBase64 = mockPngBuffer.toString('base64');

  const basePromptRequest: FloorPlanImagePromptRequest = {
    schemaVersion: 1,
    promptVersion: 3,
    prompt: '2-flat floor plan on 35x25m site',
    negativePrompt: 'perspective, 3d render',
    seed: 42,
    width: 2048,
    height: 1536,
    metadata: {
      projectName: 'Test Project',
      plotWidthMm: 35000,
      plotDepthMm: 25000,
      floorsCount: 1,
      roadFacing: 'north',
      projectType: 'apartment',
    },
  };

  describe('1. Provider Initialization & Configuration', () => {
    it('initializes with default model gemini-3-pro-image and 2K size', () => {
      const provider = new GeminiImageProvider({ apiKey: 'test-key' });
      expect(provider.name).toBe(GEMINI_IMAGE_PROVIDER_NAME);
      expect(provider.getModel()).toBe(DEFAULT_GEMINI_IMAGE_MODEL);
      expect(provider.getModel()).toBe('gemini-3-pro-image');
      expect(provider.getImageSize()).toBe(DEFAULT_GEMINI_IMAGE_SIZE);
      expect(provider.getImageSize()).toBe('2K');
      expect(provider.isConfigured()).toBe(true);
    });

    it('allows custom model and size configuration (1K, 4K)', () => {
      const provider1K = new GeminiImageProvider({
        apiKey: 'test-key',
        model: 'gemini-3-pro-image',
        imageSize: '1K',
      });
      expect(provider1K.getImageSize()).toBe('1K');

      const provider4K = new GeminiImageProvider({
        apiKey: 'test-key',
        model: 'gemini-3-pro-image',
        imageSize: '4K',
      });
      expect(provider4K.getImageSize()).toBe('4K');
    });

    it('reports not configured and rejects when apiKey is empty', async () => {
      const provider = new GeminiImageProvider({ apiKey: '' });
      expect(provider.isConfigured()).toBe(false);
      await expect(provider.generateFloorPlan(basePromptRequest)).rejects.toThrow(
        /GEMINI_API_KEY missing/i
      );
    });
  });

  describe('2. Aspect Ratio Mapping', () => {
    it('maps dimensions to supported Gemini aspect ratios', () => {
      // Landscape 4:3 (2048x1536 is 1.33)
      expect(mapDimensionsToGeminiAspectRatio(2048, 1536)).toBe('4:3');
      // Wide Landscape 16:9 (1920x1080 is 1.78)
      expect(mapDimensionsToGeminiAspectRatio(1920, 1080)).toBe('16:9');
      // Square 1:1 (2048x2048 is 1.0)
      expect(mapDimensionsToGeminiAspectRatio(2048, 2048)).toBe('1:1');
      // Portrait 3:4 (1536x2048 is 0.75)
      expect(mapDimensionsToGeminiAspectRatio(1536, 2048)).toBe('3:4');
      // Tall Portrait 9:16 (1080x1920 is 0.56)
      expect(mapDimensionsToGeminiAspectRatio(1080, 1920)).toBe('9:16');
      // Missing or zero defaults to 4:3
      expect(mapDimensionsToGeminiAspectRatio(undefined, undefined)).toBe('4:3');
      expect(mapDimensionsToGeminiAspectRatio(0, 0)).toBe('4:3');
    });
  });

  describe('3. Reference Separation & Semantic Roles', () => {
    const structuralRef: ReferenceImageInput = {
      id: 'structural_reference',
      name: 'structural_reference.png',
      base64Data: mockPngBase64,
      mimeType: 'image/png',
    };
    const styleRef1: ReferenceImageInput = {
      id: 'style_ref_1',
      name: 'style_01.png',
      base64Data: mockPngBase64,
      mimeType: 'image/png',
    };
    const styleRef2: ReferenceImageInput = {
      id: 'style_ref_2',
      name: 'style_02.png',
      base64Data: mockPngBase64,
      mimeType: 'image/png',
    };

    it('separates structural reference as primary input 1 and others as style references', () => {
      const { structuralRef: sRef, styleRefs } = separateGeminiReferenceImages([
        styleRef1,
        structuralRef,
        styleRef2,
      ]);
      expect(sRef?.id).toBe('structural_reference');
      expect(styleRefs.length).toBe(2);
      expect(styleRefs.map(r => r.id)).toEqual(['style_ref_1', 'style_ref_2']);
    });

    it('builds request payload with structural plan as first image part and imageConfig in generationConfig', () => {
      const reqWithRefs: FloorPlanImagePromptRequest = {
        ...basePromptRequest,
        referenceImages: [structuralRef, styleRef1],
      };

      const built = buildGeminiImageRequestBody(reqWithRefs, {
        model: 'gemini-3-pro-image',
        imageSize: '2K',
      });

      expect(built.structuralRef?.id).toBe('structural_reference');
      expect(built.styleRefs.length).toBe(1);
      expect(built.referenceIdsSent).toEqual(['structural_reference', 'style_ref_1']);
      expect(built.aspectRatio).toBe('4:3');

      // Verify Gemini contents payload
      const contents = built.body.contents as Array<{ role: string; parts: Array<Record<string, unknown>> }>;
      expect(contents.length).toBe(1);
      const userContent = contents[0]!;
      expect(userContent.parts.length).toBe(3); // structural + 1 style + 1 text prompt

      // Part 0: structural image
      expect(userContent.parts[0]!.inlineData).toEqual({
        mimeType: 'image/png',
        data: mockPngBase64,
      });

      // Part 1: style reference
      expect(userContent.parts[1]!.inlineData).toEqual({
        mimeType: 'image/png',
        data: mockPngBase64,
      });

      // Part 2: directive prompt text
      expect(typeof userContent.parts[2]!.text).toBe('string');
      const promptText = userContent.parts[2]!.text as string;
      expect(promptText).toContain('PRIMARY MANDATE (IMAGE 1 — AUTHORITATIVE STRUCTURAL PLAN)');
      expect(promptText).toContain('Treat the supplied structural plan as authoritative');
      expect(promptText).toContain('Preserve its geometry exactly');
      expect(promptText).toContain('Do not redesign the layout');
      expect(promptText).toContain('Do not move the core');
      expect(promptText).toContain('THE STRUCTURAL PLAN WINS');

      // Verify generationConfig
      const genConfig = built.body.generationConfig as Record<string, unknown>;
      expect(genConfig.responseModalities).toEqual(['IMAGE']);
      expect(genConfig.imageConfig).toEqual({
        aspectRatio: '4:3',
        imageSize: '2K',
      });
    });

    it('enforces prompt instructions against creative drift and non-plan imagery', () => {
      const prompt = buildGeminiImagePrompt(basePromptRequest, {
        hasStructuralPlan: true,
        styleReferenceCount: 2,
      });

      expect(prompt).toContain('Do NOT generate 3D perspective views');
      expect(prompt).toContain('Do NOT generate exterior building renderings');
      expect(prompt).toContain('Do NOT render authoritative room labels');
      expect(prompt).toContain('Top-down orthographic 2D floor plan view only');
    });
  });

  describe('4. Response Extraction & Error Handling', () => {
    it('extracts image bytes from candidates[0].content.parts format', () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: mockPngBase64,
                  },
                },
              ],
            },
          },
        ],
      };

      const extracted = extractGeminiImageBytes(mockResponse);
      expect(extracted.mimeType).toBe('image/png');
      expect(extracted.buffer.length).toBe(mockPngBuffer.length);
    });

    it('extracts image bytes from multi-part response with accompanying text', () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                { text: 'Rendered architectural floor plan as requested.' },
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: mockPngBase64,
                  },
                },
              ],
            },
          },
        ],
      };

      const extracted = extractGeminiImageBytes(mockResponse);
      expect(extracted.mimeType).toBe('image/png');
      expect(extracted.textParts).toEqual(['Rendered architectural floor plan as requested.']);
    });

    it('extracts image from predictions format (vertex/imagen compatibility)', () => {
      const mockResponse = {
        predictions: [
          {
            bytesBase64Encoded: mockPngBase64,
            mimeType: 'image/png',
          },
        ],
      };

      const extracted = extractGeminiImageBytes(mockResponse);
      expect(extracted.mimeType).toBe('image/png');
      expect(extracted.buffer.length).toBe(mockPngBuffer.length);
    });

    it('throws IMAGE_EMPTY when no image part is returned', () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'I cannot generate this image.' }],
            },
          },
        ],
      };

      expect(() => extractGeminiImageBytes(mockResponse)).toThrow(ImageProviderError);
      try {
        extractGeminiImageBytes(mockResponse);
      } catch (err: any) {
        expect(err.code).toBe('IMAGE_EMPTY');
        expect(err.message).toContain('I cannot generate this image');
      }
    });

    it('throws IMAGE_EMPTY when payload is suspiciously small', () => {
      const smallBuf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00]);
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ inlineData: { mimeType: 'image/png', data: smallBuf.toString('base64') } }],
            },
          },
        ],
      };

      expect(() => extractGeminiImageBytes(mockResponse)).toThrow(ImageProviderError);
      try {
        extractGeminiImageBytes(mockResponse);
      } catch (err: any) {
        expect(err.code).toBe('IMAGE_EMPTY');
      }
    });

    it('throws GEMINI_AUTH_ERROR on HTTP 401/403 or error envelope', () => {
      const mockResponse = {
        error: {
          code: 401,
          message: 'API key not valid. Please pass a valid API key.',
          status: 'UNAUTHENTICATED',
        },
      };

      try {
        extractGeminiImageBytes(mockResponse);
      } catch (err: any) {
        expect(err.code).toBe('GEMINI_AUTH_ERROR');
        expect(err.status).toBe(401);
      }
    });

    it('throws GEMINI_RATE_LIMITED on 429 RESOURCE_EXHAUSTED', () => {
      const mockResponse = {
        error: {
          code: 429,
          message: 'Quota exceeded for metric: generativelanguage.googleapis.com',
          status: 'RESOURCE_EXHAUSTED',
        },
      };

      try {
        extractGeminiImageBytes(mockResponse);
      } catch (err: any) {
        expect(err.code).toBe('GEMINI_RATE_LIMITED');
        expect(err.status).toBe(429);
      }
    });
  });

  describe.skip('5. End-to-End Mocked Generation with Provenance', () => {
    it('executes generateFloorPlan and attaches complete provenance', async () => {
      const fakeFetch: typeof fetch = async () => {
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      inlineData: {
                        mimeType: 'image/png',
                        data: mockPngBase64,
                      },
                    },
                  ],
                },
              },
            ],
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'x-request-id': 'req-test-12345',
            },
          }
        );
      };

      const provider = new GeminiImageProvider({
        apiKey: 'test-api-key',
        model: 'gemini-3-pro-image',
        imageSize: '2K',
        fetchImpl: fakeFetch,
      });

      const result = await provider.generateFloorPlan(basePromptRequest);

      expect(result.provider).toBe('gemini');
      expect(result.model).toBe('gemini-3-pro-image');
      expect(result.mimeType).toBe('image/png');
      expect(result.imageBase64).toBe(mockPngBase64);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.providerRequest).toBeDefined();

      const prov = result.providerRequest as any;
      expect(prov.size).toBe('2K');
      expect(prov.aspectRatio).toBe('4:3');
      expect(prov.apiRequestId).toBe('req-test-12345');
      expect(prov.promptHash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe.skip('6. Multi-Flat Pipeline Integration with Deterministic Planner', () => {
    const testPlans = [
      {
        name: '1-Flat 3BHK Plan',
        config: {
          site: { plotWidthMm: 30000, plotDepthMm: 25000, setbacksMm: { front: 3000, rear: 2000, left: 2000, right: 2000 } },
          flatsPerFloor: 1,
          unitMix: [{ unitType: '3BHK', count: 1 }],
          commonCore: { passengerLifts: 1, staircaseCount: 1, commonLobby: true },
          strategy: 'balanced' as const,
          seed: 10,
        },
      },
      {
        name: '2-Flat Mixed 2BHK + 3BHK Plan',
        config: {
          site: { plotWidthMm: 45000, plotDepthMm: 50000, setbacksMm: { front: 4000, rear: 3000, left: 3000, right: 3000 } },
          flatsPerFloor: 2,
          unitMix: [
            { unitType: '2BHK', count: 1 },
            { unitType: '3BHK', count: 1 },
          ],
          commonCore: { passengerLifts: 2, staircaseCount: 2, commonLobby: true },
          strategy: 'daylight' as const,
          seed: 42,
        },
      },
      {
        name: '4-Flat Plan',
        config: {
          site: { plotWidthMm: 60000, plotDepthMm: 60000, setbacksMm: { front: 4000, rear: 3000, left: 3000, right: 3000 } },
          flatsPerFloor: 4,
          unitMix: [
            { unitType: '2BHK', count: 2 },
            { unitType: '3BHK', count: 2 },
          ],
          commonCore: { passengerLifts: 2, staircaseCount: 2, commonLobby: true },
          strategy: 'privacy' as const,
          seed: 99,
        },
      },
    ];

    for (const testPlan of testPlans) {
      it(`renders high-res structural reference and prepares Gemini request for ${testPlan.name}`, async () => {
        const planned = planDeterministicApartment(testPlan.config);
        expect(planned.success).toBe(true);

        const structuralRender = renderStructuralPlan(planned.structuralRepresentation);
        expect(structuralRender.png.length).toBeGreaterThan(5000);

        const structuralRef: ReferenceImageInput = {
          id: 'structural_reference',
          name: 'structural_reference.png',
          base64Data: structuralRender.png.toString('base64'),
          mimeType: 'image/png',
        };

        const req: FloorPlanImagePromptRequest = {
          schemaVersion: 1,
          promptVersion: 3,
          prompt: `Apartment floor plan for ${testPlan.name}`,
          negativePrompt: 'perspective, 3d render',
          seed: testPlan.config.seed,
          width: structuralRender.width,
          height: structuralRender.height,
          referenceImages: [structuralRef],
          metadata: {
            projectName: testPlan.name,
            plotWidthMm: testPlan.config.site.plotWidthMm,
            plotDepthMm: testPlan.config.site.plotDepthMm,
            floorsCount: 1,
            roadFacing: 'north',
            projectType: 'apartment',
            structuralRepresentationHash: structuralRender.hash,
          },
        };

        let requestCaptured: any = null;
        const fakeFetch: typeof fetch = async (_url, init) => {
          requestCaptured = JSON.parse(init?.body as string);
          return new Response(
            JSON.stringify({
              candidates: [
                {
                  content: {
                    parts: [{ inlineData: { mimeType: 'image/png', data: mockPngBase64 } }],
                  },
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        };

        const provider = new GeminiImageProvider({
          apiKey: 'mock-key',
          model: 'gemini-3-pro-image',
          imageSize: '2K',
          fetchImpl: fakeFetch,
        });

        const res = await provider.generateFloorPlan(req);
        expect(res.provider).toBe('gemini');
        expect(res.model).toBe('gemini-3-pro-image');
        expect(requestCaptured).toBeDefined();

        // Verify structural PNG was the FIRST part sent
        const firstPart = requestCaptured.contents[0].parts[0];
        expect(firstPart.inlineData.mimeType).toBe('image/png');
        expect(firstPart.inlineData.data).toBe(structuralRender.png.toString('base64'));

        // Verify aspect ratio preservation
        const prov = res.providerRequest as any;
        expect(prov.structuralRepresentationHash).toBe(structuralRender.hash);
        expect(prov.rendererVersion).toBe('1.0.0');
      });
    }
  });
});
