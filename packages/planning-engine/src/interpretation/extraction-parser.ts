/**
 * Phase 3 - Parse untrusted vision output into a typed ExtractedPlan.
 *
 * Gemini output is UNTRUSTED. This parser only maps structurally valid values
 * and rejects malformed payloads; it never fills in missing geometry or
 * silently substitutes defaults for rooms the model failed to return.
 */

import type {
  DiagnosticFragment,
  ExtractedBoundary,
  ExtractedCoreElement,
  ExtractedDoor,
  ExtractedFlat,
  ExtractedFloorRegion,
  ExtractedParking,
  ExtractedPlan,
  ExtractedRoom,
  ExtractedStair,
  ExtractedWindow,
  ExtractionMetadata,
} from './extraction';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function pointList(value: unknown): ExtractedBoundary | null {
  if (!Array.isArray(value) || value.length < 3) return null;
  const points: { x: number; y: number }[] = [];
  for (const entry of value) {
    const record = asRecord(entry);
    const x = record ? num(record.x) : null;
    const y = record ? num(record.y) : null;
    if (x === null || y === null) return null;
    points.push({ x, y });
  }
  return { points };
}

const DOOR_TYPES = new Set(['single', 'double', 'sliding', 'open_passage', 'unknown']);
const SWINGS = new Set(['inward', 'outward', 'left', 'right', 'unknown']);

/** Build the extraction metadata for a specific image and site. */
export function createExtractionMetadata(params: {
  readonly imageWidePixels: number;
  readonly imageTallPixels: number;
  /** Coordinate frame the interpretation uses; defaults to the pixel size for legacy callers. */
  readonly frameWidth?: number;
  readonly frameHeight?: number;
  readonly plotWidth: number;
  readonly plotDepth: number;
  readonly orientation: number;
  readonly roadFacing: string;
  readonly extractionSource: string;
  readonly confidence: string;
}): ExtractionMetadata {
  const imageAspectRatio = params.imageTallPixels > 0 ? params.imageWidePixels / params.imageTallPixels : 0;
  const plotAspectRatio = params.plotDepth > 0 ? params.plotWidth / params.plotDepth : 0;
  const frameWidth = params.frameWidth && params.frameWidth > 0 ? params.frameWidth : params.imageWidePixels;
  const frameHeight = params.frameHeight && params.frameHeight > 0 ? params.frameHeight : params.imageTallPixels;
  return {
    imageWidePixels: params.imageWidePixels,
    imageTallPixels: params.imageTallPixels,
    frameWidth,
    frameHeight,
    imageAspectRatio,
    plotAspectRatio,
    aspectMismatchRatio: plotAspectRatio > 0 ? Math.abs(imageAspectRatio - plotAspectRatio) / plotAspectRatio : 0,
    orientationDegrees: params.orientation,
    roadFacing: params.roadFacing,
    extractionSource: params.extractionSource,
    confidence: params.confidence,
    normalizedAt: '',
  };
}

/**
 * Parse a raw vision payload into an ExtractedPlan. Returns `null` when the
 * payload cannot be trusted (missing boundary or room geometry).
 */
export function parseExtractionPayload(
  payload: unknown,
  metadata: ExtractionMetadata,
  planId: string,
): { plan: ExtractedPlan | null; diagnostics: DiagnosticFragment[] } {
  const diagnostics: DiagnosticFragment[] = [];
  const source = asRecord(payload);
  if (!source) {
    return { plan: null, diagnostics: [{ code: 'EXTRACTION_PAYLOAD_INVALID', severity: 'error', message: 'The vision response was not a JSON object.' }] };
  }

  const boundary = pointList(asRecord(source.boundary)?.points);
  if (!boundary) {
    return { plan: null, diagnostics: [{ code: 'EXTRACTION_PAYLOAD_BOUNDARY_INVALID', severity: 'error', message: 'The vision response did not contain a valid building boundary polygon.' }] };
  }

  const rawRoomsArray = Array.isArray(source.rooms) ? source.rooms : [];
  const floorRegions = parseFloorRegions(source, rawRoomsArray, diagnostics);

  const rooms: ExtractedRoom[] = [];
  for (const entry of rawRoomsArray) {
    const record = asRecord(entry);
    if (!record) continue;
    const id = str(record.id);
    const name = str(record.name);
    const type = str(record.type) ?? name;
    const x = num(record.x);
    const y = num(record.y);
    const width = num(record.width);
    const height = num(record.height);
    if (!id || !name || !type || x === null || y === null || width === null || height === null) {
      diagnostics.push({ code: 'EXTRACTION_ROOM_SKIPPED', severity: 'warning', message: `Room "${name ?? id ?? 'unknown'}" was skipped because its geometry was incomplete.` });
      continue;
    }
    if (width <= 0 || height <= 0) {
      diagnostics.push({ code: 'EXTRACTION_ROOM_SKIPPED', severity: 'warning', message: `Room "${name}" was skipped because its extracted size was not positive.` });
      continue;
    }

    let floorLevel = num(record.floorLevel);
    let floorRegionId: string | undefined;
    let floorAssignmentReason: string | undefined;
    if (floorLevel !== null) {
      floorAssignmentReason = 'explicit_payload';
      const matched = floorRegions.find(fr => fr.level === Math.max(0, Math.trunc(floorLevel!)));
      if (matched) floorRegionId = matched.id;
    } else if (floorRegions.length > 0) {
      const cx = x + width / 2;
      const cy = y + height / 2;
      const matched = floorRegions.find(fr =>
        cx >= fr.region.x && cx <= fr.region.x + fr.region.width &&
        cy >= fr.region.y && cy <= fr.region.y + fr.region.height
      );
      if (matched) {
        floorLevel = matched.level;
        floorRegionId = matched.id;
        floorAssignmentReason = `region_containment_${matched.name}`;
      }
    }
    if (floorLevel === null) {
      const lowerName = name.toLowerCase();
      const lowerId = id.toLowerCase();
      if (lowerName.includes('first floor') || lowerName.startsWith('ff_') || lowerId.startsWith('ff_') || lowerName.includes('upper')) {
        floorLevel = 1;
        floorAssignmentReason = 'name_heuristic_upper';
      } else {
        floorLevel = 0;
        floorAssignmentReason = 'default_ground';
      }
    }

    const flatId = str(record.flatId);
    rooms.push({
      id, name, type, imageX: x, imageY: y, imageWidth: width, imageHeight: height,
      imageArea: width * height, imageMinWidth: width, imageMinHeight: height,
      floorLevel: Math.max(0, Math.trunc(floorLevel)),
      floorRegionId,
      floorAssignmentReason,
      ...(flatId ? { flatId } : {}),
    });
  }

  if (rooms.length === 0) {
    return { plan: null, diagnostics: [...diagnostics, { code: 'EXTRACTION_NO_ROOMS', severity: 'error', message: 'The vision response contained no usable rooms.' }] };
  }

  const doors: ExtractedDoor[] = [];
  for (const entry of Array.isArray(source.doors) ? source.doors : []) {
    const record = asRecord(entry);
    if (!record) continue;
    const id = str(record.id);
    const x = num(record.x);
    const y = num(record.y);
    const width = num(record.width);
    const height = num(record.height);
    const adjacentRoomId = str(record.adjacentRoomId);
    if (!id || x === null || y === null || width === null || height === null || !adjacentRoomId) continue;
    const rawType = str(record.type) ?? 'unknown';
    const rawSwing = str(record.swingDirection) ?? 'unknown';
    const doorLvl = num(record.floorLevel);
    const adjacentRoom = rooms.find(r => r.id === adjacentRoomId);
    const resolvedDoorLevel = doorLvl !== null ? Math.max(0, Math.trunc(doorLvl)) : (adjacentRoom?.floorLevel ?? 0);
    doors.push({
      id, imageX: x, imageY: y, imageWidth: width, imageHeight: height,
      type: (DOOR_TYPES.has(rawType) ? rawType : 'unknown') as ExtractedDoor['type'],
      swingDirection: (SWINGS.has(rawSwing) ? rawSwing : 'unknown') as ExtractedDoor['swingDirection'],
      connectsRooms: [adjacentRoomId],
      adjacentRoomId,
      floorLevel: resolvedDoorLevel,
    });
  }

  const windows: ExtractedWindow[] = [];
  for (const entry of Array.isArray(source.windows) ? source.windows : []) {
    const record = asRecord(entry);
    if (!record) continue;
    const id = str(record.id);
    const x = num(record.x);
    const y = num(record.y);
    const width = num(record.width);
    const height = num(record.height);
    const adjacentRoomId = str(record.adjacentRoomId);
    if (!id || x === null || y === null || width === null || height === null || !adjacentRoomId) continue;
    const winLvl = num(record.floorLevel);
    const adjacentRoom = rooms.find(r => r.id === adjacentRoomId);
    const resolvedWinLevel = winLvl !== null ? Math.max(0, Math.trunc(winLvl)) : (adjacentRoom?.floorLevel ?? 0);
    windows.push({ id, imageX: x, imageY: y, imageWidth: width, imageHeight: height, adjacentRoomId, floorLevel: resolvedWinLevel });
  }

  const stairs: ExtractedStair[] = [];
  for (const entry of Array.isArray(source.stairs) ? source.stairs : []) {
    const record = asRecord(entry);
    if (!record) continue;
    const id = str(record.id);
    const name = str(record.name) ?? 'Staircase';
    const x = num(record.x);
    const y = num(record.y);
    const width = num(record.width);
    const height = num(record.height);
    if (!id || x === null || y === null || width === null || height === null) continue;
    const flatId = str(record.flatId);
    const stairLvl = num(record.floorLevel) ?? 0;
    stairs.push({
      id, name, imageX: x, imageY: y, imageWidth: width, imageHeight: height,
      floorLevel: Math.max(0, Math.trunc(stairLvl)),
      connectsToLevel: Math.max(0, Math.trunc(stairLvl)) + 1,
      ...(flatId ? { flatId } : {}),
    });
  }

  const parking: ExtractedParking[] = [];
  for (const entry of Array.isArray(source.parking) ? source.parking : []) {
    const record = asRecord(entry);
    if (!record) continue;
    const id = str(record.id);
    const name = str(record.name) ?? 'Parking';
    const x = num(record.x);
    const y = num(record.y);
    const width = num(record.width);
    const height = num(record.height);
    if (!id || x === null || y === null || width === null || height === null) continue;
    parking.push({ id, name, imageX: x, imageY: y, imageWidth: width, imageHeight: height });
  }

  // Apartment structure (recovery Phase 4). Parsed only when the payload
  // carries it; malformed entries are reported and dropped, never invented.
  const apartment = Array.isArray(source.flats)
    ? {
      flats: parseFlats(source.flats, diagnostics),
      lifts: parseCoreElements(source.lifts, 'Lift', diagnostics),
      lobbies: parseCoreElements(source.lobbies, 'Lobby', diagnostics),
      corridors: parseCoreElements(source.corridors, 'Corridor', diagnostics),
      shafts: parseCoreElements(source.shafts, 'Shaft', diagnostics),
    }
    : {};

  return {
    plan: {
      id: planId,
      boundary,
      rooms,
      doors,
      windows,
      stairs,
      parking,
      floors: floorRegions.length > 0 ? floorRegions : undefined,
      ...apartment,
      metadata,
    },
    diagnostics,
  };
}

function parseFlats(value: unknown, diagnostics: DiagnosticFragment[]): ExtractedFlat[] {
  const flats: ExtractedFlat[] = [];
  for (const entry of Array.isArray(value) ? value : []) {
    const record = asRecord(entry);
    if (!record) continue;
    const id = str(record.id);
    const label = str(record.label) ?? id;
    const unitType = str(record.unitType);
    const x = num(record.x);
    const y = num(record.y);
    const width = num(record.width);
    const height = num(record.height);
    if (!id || !label || x === null || y === null || width === null || height === null || width <= 0 || height <= 0) {
      diagnostics.push({ code: 'EXTRACTION_FLAT_SKIPPED', severity: 'warning', message: `Flat "${label ?? id ?? 'unknown'}" was skipped because its boundary was incomplete.` });
      continue;
    }
    flats.push({ id, label, unitType: unitType ?? '', imageX: x, imageY: y, imageWidth: width, imageHeight: height });
  }
  return flats;
}

function parseCoreElements(value: unknown, fallbackName: string, diagnostics: DiagnosticFragment[]): ExtractedCoreElement[] {
  const elements: ExtractedCoreElement[] = [];
  for (const entry of Array.isArray(value) ? value : []) {
    const record = asRecord(entry);
    if (!record) continue;
    const id = str(record.id);
    const name = str(record.name) ?? fallbackName;
    const x = num(record.x);
    const y = num(record.y);
    const width = num(record.width);
    const height = num(record.height);
    if (!id || x === null || y === null || width === null || height === null || width <= 0 || height <= 0) {
      diagnostics.push({ code: 'EXTRACTION_CORE_ELEMENT_SKIPPED', severity: 'warning', message: `${fallbackName} "${name}" was skipped because its geometry was incomplete.` });
      continue;
    }
    const flatId = str(record.flatId);
    elements.push({ id, name, imageX: x, imageY: y, imageWidth: width, imageHeight: height, ...(flatId ? { flatId } : {}) });
  }
  return elements;
}

function parseFloorRegions(
  source: Record<string, unknown>,
  rawRooms: unknown[],
  _diagnostics: DiagnosticFragment[],
): ExtractedFloorRegion[] {
  const regions: ExtractedFloorRegion[] = [];
  if (Array.isArray(source.floors)) {
    for (const f of source.floors) {
      const rec = asRecord(f);
      if (!rec) continue;
      const level = num(rec.level);
      const name = str(rec.name);
      const reg = asRecord(rec.region);
      const rx = num(reg?.x);
      const ry = num(reg?.y);
      const rw = num(reg?.width);
      const rh = num(reg?.height);
      if (level !== null && name && rx !== null && ry !== null && rw !== null && rh !== null && rw > 0 && rh > 0) {
        const b = pointList(asRecord(rec.boundary)?.points);
        regions.push({
          id: str(rec.id) ?? `floor_${level}`,
          level: Math.max(0, Math.trunc(level)),
          name,
          region: { x: rx, y: ry, width: rw, height: rh },
          ...(b ? { boundary: b } : {}),
        });
      }
    }
  }

  if (regions.length > 0) {
    return regions.sort((a, b) => a.level - b.level);
  }

  // Fallback: Infer from rooms if payload did not include explicit `floors`
  const roomsByLevel = new Map<number, Array<{ x: number; y: number; width: number; height: number }>>();
  for (const entry of rawRooms) {
    const rec = asRecord(entry);
    if (!rec) continue;
    const name = (str(rec.name) ?? '').toLowerCase();
    const id = (str(rec.id) ?? '').toLowerCase();
    let lvl = num(rec.floorLevel);
    if (lvl === null) {
      if (name.includes('first floor') || name.startsWith('ff_') || id.startsWith('ff_') || name.includes('upper')) {
        lvl = 1;
      } else if (name.includes('ground floor') || name.startsWith('gf_') || id.startsWith('gf_')) {
        lvl = 0;
      }
    }
    const finalLvl = lvl !== null ? Math.max(0, Math.trunc(lvl)) : null;
    const x = num(rec.x);
    const y = num(rec.y);
    const w = num(rec.width);
    const h = num(rec.height);
    if (finalLvl !== null && x !== null && y !== null && w !== null && h !== null) {
      const list = roomsByLevel.get(finalLvl) ?? [];
      list.push({ x, y, width: w, height: h });
      roomsByLevel.set(finalLvl, list);
    }
  }

  if (roomsByLevel.size > 1) {
    for (const [lvl, rooms] of roomsByLevel.entries()) {
      const minX = Math.min(...rooms.map(r => r.x));
      const minY = Math.min(...rooms.map(r => r.y));
      const maxX = Math.max(...rooms.map(r => r.x + r.width));
      const maxY = Math.max(...rooms.map(r => r.y + r.height));
      const padX = Math.min(minX, 20);
      const padY = Math.min(minY, 20);
      regions.push({
        id: `floor_${lvl}`,
        level: lvl,
        name: lvl === 0 ? 'Ground Floor' : lvl === 1 ? 'First Floor' : `Floor ${lvl}`,
        region: {
          x: Math.max(0, minX - padX),
          y: Math.max(0, minY - padY),
          width: Math.min(1000, (maxX - minX) + padX * 2),
          height: Math.min(1000, (maxY - minY) + padY * 2),
        },
      });
    }
    return regions.sort((a, b) => a.level - b.level);
  }

  // Check vertical clustering
  if (rawRooms.length >= 6) {
    const parsedCoords = rawRooms
      .map(asRecord)
      .filter((r): r is Record<string, unknown> => r !== null)
      .map(r => ({ y: num(r.y) ?? 0, h: num(r.height) ?? 0 }))
      .map(r => r.y + r.h / 2)
      .sort((a, b) => a - b);
    let maxGap = 0;
    let splitY = 0;
    for (let i = 0; i < parsedCoords.length - 1; i++) {
      const gap = parsedCoords[i + 1]! - parsedCoords[i]!;
      if (gap > maxGap && gap > 60) {
        maxGap = gap;
        splitY = (parsedCoords[i]! + parsedCoords[i + 1]!) / 2;
      }
    }
    if (maxGap > 60 && splitY > 200 && splitY < 800) {
      return [
        {
          id: 'floor_0',
          level: 0,
          name: 'Ground Floor',
          region: { x: 0, y: 0, width: 1000, height: splitY },
        },
        {
          id: 'floor_1',
          level: 1,
          name: 'First Floor',
          region: { x: 0, y: splitY, width: 1000, height: 1000 - splitY },
        },
      ];
    }
  }

  return [];
}
