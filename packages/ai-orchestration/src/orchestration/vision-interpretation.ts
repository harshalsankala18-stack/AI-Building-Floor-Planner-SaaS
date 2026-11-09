/**
 * Stubbed Vision Interpretation module – raster image interpretation disabled.
 * Exports definitions retained for type compatibility; runtime functions throw.
 */

import type { BaseAIProvider } from '../providers/base';

/** Minimal placeholder schemas. */
export const IMAGE_INTERPRETATION_SCHEMA: any = {
  type: 'object',
  properties: {
    boundary: { type: 'object' },
    rooms: { type: 'array', items: { type: 'object', required: ['flatId'] } },
    flats: { type: 'array', items: { type: 'object', required: ['id', 'unitType', 'x', 'y', 'width', 'height'] } },
    lifts: { type: 'array', items: { type: 'object', required: ['flatId'] } },
    stairs: { type: 'array', items: { type: 'object', required: ['flatId'] } },
    lobbies: { type: 'array', items: { type: 'object' } },
    corridors: { type: 'array', items: { type: 'object' } },
    shafts: { type: 'array', items: { type: 'object' } },
  },
  required: ['boundary', 'rooms', 'flats', 'lifts', 'stairs', 'lobbies', 'corridors', 'shafts'],
};
export const APARTMENT_IMAGE_INTERPRETATION_SCHEMA: any = IMAGE_INTERPRETATION_SCHEMA;
export const COMMON_AREA_FLAT_ID = 'COMMON' as const;
export const APARTMENT_INTERPRETATION_FRAME = { width: 1000, height: 1000 } as const;

/** Types retained from original implementation for compatibility. */
export interface ApartmentInterpretationContext {
  readonly flatsPerFloor: number;
  readonly unitMix: ReadonlyArray<{ readonly unitType: string; readonly count: number }>;
  readonly lifts: number;
  readonly stairs: number;
  readonly commonLobby: boolean;
}

export interface InterpretPlanImageOptions {
  readonly plotWidthMm: number;
  readonly plotDepthMm: number;
  readonly orientationDegrees: number;
  readonly roadFacing: string;
  readonly userPrompt?: string;
  readonly imageBase64: string;
  readonly imageMimeType: string;
  readonly timeoutMs?: number;
  readonly apartmentContext?: ApartmentInterpretationContext;
  readonly requirements?: Readonly<Record<string, unknown>>;
}

export type InterpretationCoordinateFrame =
  | { readonly kind: 'image_pixels' }
  | { readonly kind: 'normalized'; readonly width: number; readonly height: number };

export interface PlanInterpretationResponse {
  readonly parsed: unknown;
  readonly model: string;
  readonly latencyMs: number;
  readonly usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  readonly coordinateFrame: InterpretationCoordinateFrame;
}

/** Stubbed function – always throws not‑configured error or responds if recording provider is used in test */
export async function interpretPlanImageWithGemini(
  provider: BaseAIProvider,
  options: InterpretPlanImageOptions,
): Promise<PlanInterpretationResponse> {
  if (provider && typeof (provider as any).complete === 'function') {
    const res = await provider.complete({
      taskType: 'image_interpretation' as any,
      systemPrompt: 'Interpret the plan image faithfully. Never invent rooms or elements not present, and do not claim code compliance.',
      userPrompt: `Interpretation for plot width ${options.plotWidthMm}mm, depth ${options.plotDepthMm}mm.${options.userPrompt ? ` Prompt: ${options.userPrompt}` : ''}${options.apartmentContext ? ` context: ${JSON.stringify(options.apartmentContext)}` : ''}${options.requirements ? ` requirements: ${JSON.stringify(options.requirements)}` : ''}`,
      images: [{ mimeType: options.imageMimeType, data: options.imageBase64 }],
      responseFormat: 'json',
      responseSchema: options.apartmentContext ? APARTMENT_IMAGE_INTERPRETATION_SCHEMA : IMAGE_INTERPRETATION_SCHEMA,
    });
    if (!res.parsed || (typeof res.parsed === 'object' && Object.keys(res.parsed).length === 0)) {
      throw new Error('No parsed interpretation returned by provider.');
    }
    return {
      parsed: res.parsed,
      model: res.model ?? 'stubbed',
      latencyMs: res.latencyMs ?? 0,
      usage: res.usage ?? { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      coordinateFrame: { kind: 'image_pixels' },
    };
  }
  throw new Error('Gemini vision interpretation is disabled in this build.');
}

