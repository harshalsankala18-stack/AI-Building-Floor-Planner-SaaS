/**
 * Gemini Vision Floor-Plan Interpretation Layer (Phase 2.5 & Recovery Phase 4).
 *
 * Extracts structured architectural layout and spatial geometry from a
 * generated floor-plan image using Gemini Vision (`gemini-2.5-flash`).
 * Supports both single-family residential (villa / bungalow / house shapes)
 * and multi-unit apartment floor plates.
 */

import { AISafetyError, type BaseAIProvider } from '../providers/base';

/**
 * Structured extraction schema returned by Gemini Vision for single-family
 * and residential floor plans. All required fields are explicitly defined in
 * `properties` and conform to Gemini's OpenAPI response_schema specification.
 */
export const IMAGE_INTERPRETATION_SCHEMA = {
  type: 'object',
  required: ['boundary', 'rooms', 'doors', 'windows', 'stairs', 'parking'],
  properties: {
    footprintShape: {
      type: 'string',
      description: 'Detected building footprint typology (e.g., rectangular, l-shape, u-shape, courtyard, v-shape, h-shape, t-shape, stepped).',
    },
    entranceSide: {
      type: 'string',
      description: 'Primary entrance side or compass orientation observed in the plan (north, south, east, west).',
    },
    circulationNotes: {
      type: 'string',
      description: 'Concise summary of the spatial arrangement, verandah/foyer entry, living-dining flow, and private room zoning.',
    },
    boundary: {
      type: 'object',
      required: ['points'],
      properties: {
        points: {
          type: 'array',
          items: {
            type: 'object',
            required: ['x', 'y'],
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
            },
          },
        },
      },
    },
    rooms: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'type', 'x', 'y', 'width', 'height'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string' },
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' },
           orientationHint: { type: 'string' },
          compassZone: {
            type: 'string',
            description: 'Approximate compass zone or quadrant in the plan (e.g., NE, SE, SW, NW, N, S, E, W, CENTER).',
          },
          floorLevel: {
            type: 'integer',
            description: 'Floor level index (0 for Ground Floor, 1 for First Floor if multi-floor plan is shown).',
          },
          connectedTo: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs or names of directly connected adjacent rooms.',
          },
        },
      },
    },
    doors: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'x', 'y', 'width', 'height', 'adjacentRoomId'],
        properties: {
          id: { type: 'string' },
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' },
          type: { type: 'string' },
          swingDirection: { type: 'string' },
          connectsRooms: { type: 'array', items: { type: 'string' } },
          adjacentRoomId: { type: 'string' },
        },
      },
    },
    windows: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'x', 'y', 'width', 'height', 'adjacentRoomId'],
        properties: {
          id: { type: 'string' },
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' },
          adjacentRoomId: { type: 'string' },
        },
      },
    },
    stairs: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'x', 'y', 'width', 'height'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' },
        },
      },
    },
    parking: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'x', 'y', 'width', 'height'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' },
        },
      },
    },
  },
} as const;

export const COMMON_AREA_FLAT_ID = 'COMMON' as const;
/**
 * Every interpretation — apartment and single-family alike — is expressed in
 * this normalized frame. Raster floor-plan images arrive at provider-chosen
 * pixel sizes (and an artifact's recorded width/height is the *requested* size,
 * not necessarily the returned one), so asking for pixel coordinates made the
 * image→millimetre scale unverifiable. A fixed frame makes the mapping exact.
 */
export const INTERPRETATION_FRAME = { width: 1000, height: 1000 } as const;
export const APARTMENT_INTERPRETATION_FRAME = INTERPRETATION_FRAME;

const coreBoxItem = {
  type: 'object',
  required: ['id', 'x', 'y', 'width', 'height', 'flatId'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    x: { type: 'number' },
    y: { type: 'number' },
    width: { type: 'number' },
    height: { type: 'number' },
    flatId: { type: 'string' },
  },
} as const;

/**
 * Apartment-aware interpretation schema extending the base schema with flat
 * grouping and common core elements.
 */
export const APARTMENT_IMAGE_INTERPRETATION_SCHEMA = {
  type: 'object',
  required: ['boundary', 'rooms', 'doors', 'windows', 'stairs', 'parking', 'flats', 'lifts', 'lobbies', 'corridors', 'shafts'],
  properties: {
    ...IMAGE_INTERPRETATION_SCHEMA.properties,
    rooms: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'type', 'x', 'y', 'width', 'height', 'flatId'],
        properties: {
          ...IMAGE_INTERPRETATION_SCHEMA.properties.rooms.items.properties,
          flatId: { type: 'string' },
        },
      },
    },
    doors: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'x', 'y', 'width', 'height', 'adjacentRoomId'],
        properties: {
          ...IMAGE_INTERPRETATION_SCHEMA.properties.doors.items.properties,
          isFlatEntrance: { type: 'boolean' },
        },
      },
    },
    stairs: {
      type: 'array',
      items: coreBoxItem,
    },
    flats: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'unitType', 'x', 'y', 'width', 'height'],
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          unitType: { type: 'string' },
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' },
          entranceDoorId: { type: 'string' },
        },
      },
    },
    lifts: { type: 'array', items: coreBoxItem },
    lobbies: { type: 'array', items: coreBoxItem },
    corridors: { type: 'array', items: coreBoxItem },
    shafts: { type: 'array', items: coreBoxItem },
  },
} as const;

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

/**
 * Interpret a generated floor-plan image with Gemini Vision.
 */
export async function interpretPlanImageWithGemini(
  provider: BaseAIProvider,
  options: InterpretPlanImageOptions,
): Promise<PlanInterpretationResponse> {
  const apartment = options.apartmentContext;
  const frame = INTERPRETATION_FRAME;

  const systemPrompt = apartment
    ? [
        'You are an architectural floor-plan vision interpreter for multi-unit residential apartment buildings.',
        'Read the attached floor-plan image and return ONLY the JSON object defined by the schema.',
        `Express every x, y, width, height and boundary point in a normalized 0..${frame.width} by 0..${frame.height} coordinate frame covering the full image (top-left is 0,0; bottom-right is ${frame.width},${frame.height}).`,
        'Group every residential room under its owning flat in `flats` via `flatId` (e.g. "flat_01", "flat_02").',
        'Classify each flat `unitType` strictly from what is drawn in the image (e.g. "1BHK", "2BHK", "3BHK", "4BHK", "Studio").',
        'Use canonical room `type` tokens: `living`, `dining`, `living_dining`, `kitchen`, `bedroom`, `master_bedroom`, `bathroom`, `common_toilet`, `attached_toilet`, `utility`, `balcony`, `foyer`, `passage`.',
        `Report every elevator shaft in \`lifts\`, every stairwell in \`stairs\`, the shared entrance/elevator lobby in \`lobbies\`, shared corridors in \`corridors\`, and service shafts in \`shafts\` with \`flatId: "${COMMON_AREA_FLAT_ID}"\`.`,
        'Wait to verify what is actually visible in the image; do not claim building-code compliance.',
      ].join(' ')
    : [
        'You are a senior architectural CAD vision interpreter.',
        'Inspect the attached floor-plan image and extract its complete spatial layout into the structured JSON schema.',
        `Express every x, y, width, height and boundary point in a normalized 0..${frame.width} by 0..${frame.height} coordinate frame covering the full image (top-left is 0,0; bottom-right is ${frame.width},${frame.height}). Do NOT use the image's pixel dimensions.`,
        '`boundary.points` must trace the OUTER EDGE of the building footprint as drawn — follow every step and re-entrant corner of an L-shape, U-shape or stepped plan rather than returning its bounding rectangle.',
        'Ensure room bounding boxes (`x`, `y`, `width`, `height`) represent the clear interior/partitioned zones of each space without overlapping adjacent rooms, and stay strictly inside `boundary.points`.',
        'Use clear canonical room `type` values: `living`, `dining`, `kitchen`, `bedroom`, `bathroom`, `staircase`, `parking`, `balcony`, `verandah`, `foyer`, `utility`, `pooja`, `study`, `corridor`, `storage`, `ots`, `shaft`, `dressing`.',
        'For each room, also identify its `compassZone` (NE, SE, SW, NW, N, S, E, W, CENTER), `floorLevel` (0 for ground floor, 1 for first floor if shown), and `connectedTo` list of adjacent room IDs.',
        'If the image shows SEVERAL floor plans side by side or stacked, assign every room the `floorLevel` of the plan it is drawn in, and report each plan independently. Report the GROUND-floor outline in `boundary`.',
        'Report every door in `doors` (with `swingDirection` as drawn) and every window in `windows`, each with the `adjacentRoomId` of the room it serves.',
        'Identify the overall `footprintShape` (e.g., l-shape, u-shape, courtyard, rectangular) and `entranceSide`.',
        'Never invent rooms or geometry not visible in the image. Omit what you cannot see rather than guessing. Do not claim code compliance.',
      ].join(' ');

  const userLines = [
    `Interpret the attached floor-plan image for a site of ${options.plotWidthMm}mm width by ${options.plotDepthMm}mm depth.`,
    `Orientation: ${options.orientationDegrees} degrees; road-facing side: ${options.roadFacing}.`,
  ];
  if (apartment) {
    userLines.push(`Expected apartment context (for reference): ${JSON.stringify(apartment)}`);
  }
  if (options.requirements) {
    userLines.push(`Requested architectural program: ${JSON.stringify(options.requirements)}`);
  }
  if (options.userPrompt) {
    userLines.push(`Design brief: ${options.userPrompt}`);
  }

  const schema = apartment ? APARTMENT_IMAGE_INTERPRETATION_SCHEMA : IMAGE_INTERPRETATION_SCHEMA;

  const apiResponse = await provider.complete({
    taskType: 'image_interpretation' as never,
    systemPrompt,
    userPrompt: userLines.join('\n'),
    images: [{ mimeType: options.imageMimeType ?? 'image/png', data: options.imageBase64 }],
    responseFormat: 'json',
    responseSchema: schema as unknown as Record<string, unknown>,
    maxTokens: apartment ? 16384 : 8192,
    temperature: 0,
  });

  const parsed = apiResponse.parsed;
  if (parsed === undefined || parsed === null || (typeof parsed === 'object' && Object.keys(parsed as object).length === 0)) {
    throw new AISafetyError('Gemini vision interpretation returned no structured payload (no parsed interpretation).');
  }

  return {
    parsed,
    model: apiResponse.model,
    latencyMs: apiResponse.latencyMs,
    usage: apiResponse.usage,
    // Both paths now request the same normalized frame, so the caller never has
    // to guess whether the numbers are pixels.
    coordinateFrame: { kind: 'normalized', width: frame.width, height: frame.height },
  };
}
