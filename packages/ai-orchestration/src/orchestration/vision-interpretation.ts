/**
 * Gemini Vision Floor-Plan Interpretation Layer (Phase 2.5 & Recovery Phase 4).
 *
 * Extracts structured architectural layout and spatial geometry from a
 * generated floor-plan image using Gemini Vision (`gemini-2.5-flash`).
 * Supports both single-family residential (villa / bungalow / house shapes)
 * and multi-unit apartment floor plates.
 */

import { AISafetyError, AIRequestValidationError, type BaseAIProvider } from '../providers/base';

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
    floors: {
      type: 'array',
      description: 'Detected distinct architectural floor plan drawings shown in this image (e.g. Ground Floor, First Floor).',
      items: {
        type: 'object',
        required: ['level', 'name', 'region'],
        properties: {
          id: { type: 'string' },
          level: { type: 'integer', description: 'Floor level index (0 for Ground Floor, 1 for First Floor, etc.)' },
          name: { type: 'string', description: 'Drawing title as written (e.g. "GROUND FLOOR PLAN", "FIRST FLOOR PLAN")' },
          region: {
            type: 'object',
            required: ['x', 'y', 'width', 'height'],
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
              width: { type: 'number' },
              height: { type: 'number' },
            },
          },
          boundary: {
            type: 'object',
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
          floorLevel: { type: 'integer', description: 'Floor level (0 for Ground Floor, 1 for First Floor, etc.)' },
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
          floorLevel: { type: 'integer', description: 'Floor level (0 for Ground Floor, 1 for First Floor, etc.)' },
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
          floorLevel: { type: 'integer', description: 'Floor level where this stair flight starts' },
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

export interface FloorDrawingRegion {
  readonly id: string;
  readonly level: number;
  readonly name: string;
  readonly region: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  readonly boundary?: {
    readonly points: readonly { readonly x: number; readonly y: number }[];
  };
}

/**
 * Resolves or dynamically detects independent architectural floor regions from an interpretation payload.
 * If the vision response declared `floors`, validates and returns them.
 * If not, uses room spatial distribution (Y-split or X-split, floorLevel, name prefixes)
 * to segment the sheet into distinct floor regions.
 */
export function detectFloorRegionsFromPayload(
  payload: unknown,
  frameWidth = 1000,
  frameHeight = 1000,
): FloorDrawingRegion[] {
  const rec = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
  const rawFloors = Array.isArray(rec.floors) ? (rec.floors as Array<Record<string, unknown>>) : [];

  if (rawFloors.length > 0) {
    const valid: FloorDrawingRegion[] = [];
    for (let i = 0; i < rawFloors.length; i++) {
      const f = rawFloors[i]!;
      const level = typeof f.level === 'number' ? Math.max(0, Math.trunc(f.level)) : i;
      const name = typeof f.name === 'string' && f.name.trim() ? f.name.trim() : (level === 0 ? 'Ground Floor' : `Floor ${level}`);
      const reg = f.region as Record<string, unknown> | undefined;
      const rx = typeof reg?.x === 'number' ? reg.x : 0;
      const ry = typeof reg?.y === 'number' ? reg.y : 0;
      const rw = typeof reg?.width === 'number' && reg.width > 0 ? reg.width : frameWidth;
      const rh = typeof reg?.height === 'number' && reg.height > 0 ? reg.height : frameHeight;
      const pts = (f.boundary as Record<string, unknown> | undefined)?.points;
      const boundary = Array.isArray(pts) && pts.length >= 3 ? {
        points: pts.map((p: any) => ({ x: Number(p?.x ?? 0), y: Number(p?.y ?? 0) })),
      } : undefined;
      valid.push({
        id: typeof f.id === 'string' ? f.id : `floor_${level}`,
        level,
        name,
        region: { x: rx, y: ry, width: rw, height: rh },
        ...(boundary ? { boundary } : {}),
      });
    }
    if (valid.length > 0) {
      return valid.sort((a, b) => a.level - b.level);
    }
  }

  // Fallback: Infer from rooms if payload did not include explicit `floors`
  const rawRooms = Array.isArray(rec.rooms) ? (rec.rooms as Array<Record<string, unknown>>) : [];
  if (rawRooms.length === 0) {
    return [{
      id: 'floor_0',
      level: 0,
      name: 'Ground Floor',
      region: { x: 0, y: 0, width: frameWidth, height: frameHeight },
    }];
  }

  // Check if rooms have floorLevel >= 1 or name hints
  const roomsByLevel = new Map<number, Array<{ x: number; y: number; width: number; height: number; name: string }>>();
  for (const r of rawRooms) {
    const name = String(r.name ?? '').toLowerCase();
    const id = String(r.id ?? '').toLowerCase();
    let lvl = typeof r.floorLevel === 'number' ? Math.max(0, Math.trunc(r.floorLevel)) : null;
    if (lvl === null) {
      if (name.includes('first floor') || name.startsWith('ff_') || id.startsWith('ff_') || name.includes('upper') || name.includes('bedroom 2') || name.includes('master bedroom')) {
        // If master bedroom or bedroom 2 or upper balcony in a multi-story brief
        if (name.includes('upper') || name.startsWith('ff_') || id.startsWith('ff_') || name.includes('first floor')) {
          lvl = 1;
        }
      } else if (name.includes('ground floor') || name.startsWith('gf_') || id.startsWith('gf_') || name.includes('living') || name.includes('kitchen') || name.includes('parking') || name.includes('foyer')) {
        if (name.includes('ground') || name.startsWith('gf_') || id.startsWith('gf_')) {
          lvl = 0;
        }
      }
    }
    const finalLvl = lvl ?? 0;
    const list = roomsByLevel.get(finalLvl) ?? [];
    list.push({
      x: Number(r.x ?? 0),
      y: Number(r.y ?? 0),
      width: Number(r.width ?? 50),
      height: Number(r.height ?? 50),
      name: String(r.name ?? ''),
    });
    roomsByLevel.set(finalLvl, list);
  }

  // If rooms explicitly exist on multiple levels (e.g. 0 and 1)
  if (roomsByLevel.size > 1) {
    const regions: FloorDrawingRegion[] = [];
    for (const [lvl, rooms] of roomsByLevel.entries()) {
      const minX = Math.min(...rooms.map(r => r.x));
      const minY = Math.min(...rooms.map(r => r.y));
      const maxX = Math.max(...rooms.map(r => r.x + r.width));
      const maxY = Math.max(...rooms.map(r => r.y + r.height));
      const padX = Math.min(minX, 30);
      const padY = Math.min(minY, 30);
      regions.push({
        id: `floor_${lvl}`,
        level: lvl,
        name: lvl === 0 ? 'Ground Floor' : lvl === 1 ? 'First Floor' : `Floor ${lvl}`,
        region: {
          x: Math.max(0, minX - padX),
          y: Math.max(0, minY - padY),
          width: Math.min(frameWidth, (maxX - minX) + padX * 2),
          height: Math.min(frameHeight, (maxY - minY) + padY * 2),
        },
      });
    }
    return regions.sort((a, b) => a.level - b.level);
  }

  // Also check if rooms are vertically clustered into two distinct groups (e.g. ground on top, first on bottom)
  // when room count >= 6
  if (rawRooms.length >= 6) {
    const yCentres = rawRooms.map(r => Number(r.y ?? 0) + Number(r.height ?? 0) / 2).sort((a, b) => a - b);
    let maxGap = 0;
    let splitY = 0;
    for (let i = 0; i < yCentres.length - 1; i++) {
      const gap = yCentres[i + 1]! - yCentres[i]!;
      if (gap > maxGap && gap > 60) {
        maxGap = gap;
        splitY = (yCentres[i]! + yCentres[i + 1]!) / 2;
      }
    }
    if (maxGap > 60 && splitY > 200 && splitY < 800) {
      return [
        {
          id: 'floor_0',
          level: 0,
          name: 'Ground Floor',
          region: { x: 0, y: 0, width: frameWidth, height: splitY },
        },
        {
          id: 'floor_1',
          level: 1,
          name: 'First Floor',
          region: { x: 0, y: splitY, width: frameWidth, height: frameHeight - splitY },
        },
      ];
    }

    // Also check horizontal split (two floor drawings side by side)
    const xCentres = rawRooms.map(r => Number(r.x ?? 0) + Number(r.width ?? 0) / 2).sort((a, b) => a - b);
    let maxXGap = 0;
    let splitX = 0;
    for (let i = 0; i < xCentres.length - 1; i++) {
      const gap = xCentres[i + 1]! - xCentres[i]!;
      if (gap > maxXGap && gap > 60) {
        maxXGap = gap;
        splitX = (xCentres[i]! + xCentres[i + 1]!) / 2;
      }
    }
    if (maxXGap > 60 && splitX > 200 && splitX < 800) {
      return [
        {
          id: 'floor_0',
          level: 0,
          name: 'Ground Floor',
          region: { x: 0, y: 0, width: splitX, height: frameHeight },
        },
        {
          id: 'floor_1',
          level: 1,
          name: 'First Floor',
          region: { x: splitX, y: 0, width: frameWidth - splitX, height: frameHeight },
        },
      ];
    }
  }

  // Single floor fallback
  return [{
    id: 'floor_0',
    level: 0,
    name: 'Ground Floor',
    region: { x: 0, y: 0, width: frameWidth, height: frameHeight },
  }];
}

/**
 * Strict schema validation for raw vision payload to ensure all mandatory
 * structural fields exist with correct geometric types before handing to extraction.
 */
export function validateVisionInterpretationPayload(
  payload: unknown,
  isApartment: boolean,
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { isValid: false, errors: ['Interpretation payload is not a valid JSON object.'] };
  }
  const rec = payload as Record<string, unknown>;

  // 1. Boundary check
  if (!rec.boundary || typeof rec.boundary !== 'object' || Array.isArray(rec.boundary)) {
    errors.push('Missing or invalid boundary object.');
  } else {
    const pts = (rec.boundary as Record<string, unknown>).points;
    if (!Array.isArray(pts) || pts.length < 3) {
      errors.push('Boundary points must be an array of at least 3 points.');
    } else {
      const invalidPts = pts.some(
        p => !p || typeof p !== 'object' || typeof (p as Record<string, unknown>).x !== 'number' || typeof (p as Record<string, unknown>).y !== 'number',
      );
      if (invalidPts) {
        errors.push('Boundary points contains entries missing numeric x or y coordinates.');
      }
    }
  }

  // 2. Rooms check
  if (!Array.isArray(rec.rooms)) {
    errors.push('Missing or invalid rooms array.');
  } else if (rec.rooms.length === 0) {
    errors.push('Rooms array is empty; at least 1 room required.');
  } else {
    for (let i = 0; i < rec.rooms.length; i++) {
      const r = rec.rooms[i];
      if (!r || typeof r !== 'object') {
        errors.push(`Room at index ${i} is not a valid object.`);
        continue;
      }
      const roomRec = r as Record<string, unknown>;
      if (!roomRec.id || typeof roomRec.id !== 'string') errors.push(`Room at index ${i} is missing string id.`);
      if (!roomRec.name || typeof roomRec.name !== 'string') errors.push(`Room at index ${i} is missing string name.`);
      if (!roomRec.type || typeof roomRec.type !== 'string') errors.push(`Room at index ${i} is missing string type.`);
      if (typeof roomRec.x !== 'number' || typeof roomRec.y !== 'number') errors.push(`Room at index ${i} is missing numeric coordinates x, y.`);
      if (typeof roomRec.width !== 'number' || roomRec.width <= 0) errors.push(`Room at index ${i} has invalid width (must be > 0).`);
      if (typeof roomRec.height !== 'number' || roomRec.height <= 0) errors.push(`Room at index ${i} has invalid height (must be > 0).`);
    }
  }

  // 4. Optional architectural arrays (must be arrays if provided)
  if (rec.doors !== undefined && !Array.isArray(rec.doors)) errors.push('doors must be an array.');
  if (rec.windows !== undefined && !Array.isArray(rec.windows)) errors.push('windows must be an array.');
  if (rec.stairs !== undefined && !Array.isArray(rec.stairs)) errors.push('stairs must be an array.');
  if (rec.parking !== undefined && !Array.isArray(rec.parking)) errors.push('parking must be an array.');

  // 5. Floors array check (optional, but must be valid if present)
  if (rec.floors !== undefined) {
    if (!Array.isArray(rec.floors)) {
      errors.push('floors must be an array.');
    } else {
      for (let i = 0; i < rec.floors.length; i++) {
        const f = rec.floors[i];
        if (!f || typeof f !== 'object') {
          errors.push(`Floor at index ${i} is not a valid object.`);
          continue;
        }
        const floorRec = f as Record<string, unknown>;
        if (typeof floorRec.level !== 'number' || floorRec.level < 0) {
          errors.push(`Floor at index ${i} must have non-negative numeric level.`);
        }
        if (!floorRec.name || typeof floorRec.name !== 'string') {
          errors.push(`Floor at index ${i} must have a non-empty string name.`);
        }
        const reg = floorRec.region as Record<string, unknown> | undefined;
        if (!reg || typeof reg !== 'object' || typeof reg.x !== 'number' || typeof reg.y !== 'number' || typeof reg.width !== 'number' || typeof reg.height !== 'number' || reg.width <= 0 || reg.height <= 0) {
          errors.push(`Floor at index ${i} has invalid region (must have numeric x, y, width > 0, height > 0).`);
        }
      }
    }
  }

  // 6. Apartment-specific arrays
  if (isApartment) {
    if (!Array.isArray(rec.flats)) errors.push('Apartment interpretation requires flats array.');
    if (!Array.isArray(rec.lifts)) errors.push('Apartment interpretation requires lifts array.');
    if (!Array.isArray(rec.lobbies)) errors.push('Apartment interpretation requires lobbies array.');
    if (!Array.isArray(rec.corridors)) errors.push('Apartment interpretation requires corridors array.');
    if (!Array.isArray(rec.shafts)) errors.push('Apartment interpretation requires shafts array.');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Interpret a generated floor-plan image with Gemini Vision.
 */
export async function interpretPlanImageWithGemini(
  provider: BaseAIProvider,
  options: InterpretPlanImageOptions,
): Promise<PlanInterpretationResponse> {
  // Pre-flight image payload validation: fail immediately on client errors without network calls
  if (!options.imageBase64 || typeof options.imageBase64 !== 'string' || options.imageBase64.trim().length === 0) {
    throw new AIRequestValidationError('Image data is empty or missing.');
  }
  const cleanBase64 = options.imageBase64.replace(/\s+/g, '');
  if (cleanBase64.startsWith('data:')) {
    throw new AIRequestValidationError('Image data must be raw base64, not a data URL.');
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cleanBase64)) {
    throw new AIRequestValidationError('Image data is not valid base64 encoding.');
  }
  const rawMime = (options.imageMimeType ?? 'image/png').trim().toLowerCase();
  const validMimes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif']);
  if (!validMimes.has(rawMime)) {
    throw new AIRequestValidationError(`Image MIME type "${options.imageMimeType}" is unsupported by Gemini.`);
  }

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

  const validation = validateVisionInterpretationPayload(parsed, Boolean(apartment));
  if (!validation.isValid) {
    throw new AISafetyError(`Gemini vision interpretation failed schema validation: ${validation.errors.join('; ')}`);
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
