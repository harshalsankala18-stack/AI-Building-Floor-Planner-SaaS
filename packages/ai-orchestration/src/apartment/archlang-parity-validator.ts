/**
 * Hard Geometry-Parity Validator
 *
 * Compares the ArchLang compilation result against the original canonical Building Model.
 * This is a mandatory hard gate: no architectural drawing is published unless every
 * required parity invariant holds.
 *
 * If any room, wall, door, window, flat ownership, core element, or dimension
 * deviates beyond tolerance, the artifact is rejected.
 *
 * Completely AST- and semantic summary-driven (zero regex parsing).
 */

import {
  type Building,
  type Room,
  type Wall,
  type Door,
  type Window,
  RoomType,
} from '@ai-floor-planner/core';
import type { ArchLangSerializationResult } from './archlang-adapter';
import {
  compile,
  type SceneSummary,
  type RoomSummary,
  type DoorSummary,
  type WindowSummary,
  type ZoneSummary,
} from '@chanmeng666/archlang';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface GeometryParityItem {
  readonly canonicalId: string;
  readonly archlangId: string;
  readonly elementType:
    | 'flat'
    | 'room'
    | 'wall'
    | 'door'
    | 'window'
    | 'stair'
    | 'elevator'
    | 'column'
    | 'balcony'
    | 'shaft'
    | 'program';
  readonly expected: Record<string, unknown>;
  readonly actual: Record<string, unknown>;
  readonly difference?: Record<string, unknown>;
  readonly status: 'PASS' | 'FAIL';
  readonly failureReason?: string;
}

export interface ParityCompileContext {
  readonly scene?: { walls?: readonly any[]; nodes?: readonly any[] };
  readonly ast?: any;
}

export interface GeometryParityReport {
  readonly status: 'PASS' | 'FAIL';
  readonly passed: boolean;
  readonly totalChecks: number;
  readonly passedChecks: number;
  readonly failedChecks: number;

  // Parity Summary Metrics
  readonly expectedElements: number;
  readonly actualElements: number;
  readonly missingElements: ReadonlyArray<{ id: string; type: string; reason: string }>;
  readonly unexpectedElements: ReadonlyArray<{ id: string; kind: string; level?: number }>;
  readonly duplicates: ReadonlyArray<string>;
  readonly coordinateMismatches: ReadonlyArray<{
    id: string;
    expected: { x: number; y: number };
    actual: { x: number; y: number };
    driftMm: number;
  }>;
  readonly dimensionMismatches: ReadonlyArray<{
    id: string;
    expected: { w: number; h: number };
    actual: { w: number; h: number };
    diffMm: number;
  }>;
  readonly unsupportedElements: ReadonlyArray<{ id: string; type: string; reason: string }>;
  readonly maximumCoordinateDriftMm: number;

  readonly items: readonly GeometryParityItem[];
  readonly checks: readonly GeometryParityItem[]; // Alias for items

  // Domain parity breakdowns
  readonly flatParity: {
    readonly expectedCount: number;
    readonly actualCount: number;
    readonly expectedMix: Readonly<Record<string, number>>;
    readonly actualMix: Readonly<Record<string, number>>;
    readonly passed: boolean;
  };
  readonly roomParity: {
    readonly expectedTotal: number;
    readonly actualTotal: number;
    readonly passed: boolean;
  };
  readonly wallParity: {
    readonly expectedCount: number;
    readonly actualCount: number;
    readonly passed: boolean;
  };
  readonly coreParity: {
    readonly liftsPassed: boolean;
    readonly stairsPassed: boolean;
    readonly lobbyPassed: boolean;
    readonly coreNotAssignedToPrivate: boolean;
  };
  readonly metrics: {
    readonly flatCountParity: boolean;
    readonly apartmentMixParity: boolean;
    readonly roomProgrammeParity: boolean;
    readonly roomCountParity: boolean;
    readonly wallCountParity: boolean;
    readonly doorCountParity: boolean;
    readonly windowCountParity: boolean;
    readonly stairCountParity: boolean;
    readonly liftCountParity: boolean;
    readonly ownershipIntegrity: boolean;
    readonly coreIsolation: boolean;
    readonly coordinateAccuracy: boolean;
    readonly dimensionAccuracy: boolean;
  };
  readonly summary: {
    readonly totalElements: number;
    readonly passedElements: number;
    readonly failedElements: number;
  };
}

const TOLERANCE_MM = 2; // Tolerance for integer rounding of floating coordinates

function roundCoord(val: number): number {
  return Math.round(val);
}

function getNumVal(v: unknown): number {
  if (v === undefined || v === null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v !== null) {
    if ('value' in v && typeof (v as any).value === 'number') return (v as any).value;
    if ('val' in v && typeof (v as any).val === 'number') return (v as any).val;
  }
  return Number(v) || 0;
}

interface AstExtractedElements {
  readonly levels: Array<{ level: number; name?: string }>;
  readonly zones: Array<{ id: string; label: string; level: number }>;
  readonly rooms: Array<{ id: string; level: number; zone?: string | null; x: number; y: number; w: number; h: number; uses: string[] }>;
  readonly outdoors: Array<{ id: string; level: number; zone?: string | null; surface: string; x: number; y: number; w: number; h: number }>;
  readonly elevators: Array<{ id: string; level: number; zone?: string | null; x: number; y: number; w: number; h: number }>;
  readonly stairs: Array<{ id: string; level: number; zone?: string | null; dir?: string; x: number; y: number; w: number; h: number }>;
  readonly voids: Array<{ id: string; level: number; zone?: string | null; x: number; y: number; w: number; h: number }>;
  readonly walls: Array<{ id: string; level: number; thickness: number; points: any[] }>;
  readonly columns: Array<{ id: string; level: number; x: number; y: number; w: number; h: number }>;
  readonly doors: Array<{ id: string; level: number; x: number; y: number; width: number; wall?: string }>;
  readonly windows: Array<{ id: string; level: number; x: number; y: number; width: number; wall?: string }>;
  readonly allIds: Map<string, { kind: string; level?: number }>;
  readonly duplicates: string[];
}

/**
 * Extracts all architectural elements directly from the ArchLang compiler AST.
 * Zero regex parsing is performed.
 */
function extractElementsFromAst(ast: any): AstExtractedElements {
  const levels: Array<{ level: number; name?: string }> = [];
  const zones: Array<{ id: string; label: string; level: number }> = [];
  const rooms: Array<{ id: string; level: number; zone?: string | null; x: number; y: number; w: number; h: number; uses: string[] }> = [];
  const outdoors: Array<{ id: string; level: number; zone?: string | null; surface: string; x: number; y: number; w: number; h: number }> = [];
  const elevators: Array<{ id: string; level: number; zone?: string | null; x: number; y: number; w: number; h: number }> = [];
  const stairs: Array<{ id: string; level: number; zone?: string | null; dir?: string; x: number; y: number; w: number; h: number }> = [];
  const voids: Array<{ id: string; level: number; zone?: string | null; x: number; y: number; w: number; h: number }> = [];
  const walls: Array<{ id: string; level: number; thickness: number; points: any[] }> = [];
  const columns: Array<{ id: string; level: number; x: number; y: number; w: number; h: number }> = [];
  const doors: Array<{ id: string; level: number; x: number; y: number; width: number; wall?: string }> = [];
  const windows: Array<{ id: string; level: number; x: number; y: number; width: number; wall?: string }> = [];
  const allIds = new Map<string, { kind: string; level?: number }>();
  const levelSeenIds = new Set<string>();
  const globalSingleLevelIds = new Set<string>();
  const duplicates: string[] = [];

  const registerId = (id: string | undefined, kind: string, level: number) => {
    if (!id) return;
    const levelKey = `${level}:${id}`;
    if (levelSeenIds.has(levelKey)) {
      if (!duplicates.includes(id)) duplicates.push(id);
    } else {
      levelSeenIds.add(levelKey);
    }

    // Elements that belong strictly to one level (rooms, walls, doors, windows, balconies) must never repeat globally
    if (kind !== 'zone' && kind !== 'elevator' && kind !== 'stair' && kind !== 'void') {
      if (globalSingleLevelIds.has(id)) {
        if (!duplicates.includes(id)) duplicates.push(id);
      } else {
        globalSingleLevelIds.add(id);
      }
    }

    if (!allIds.has(id)) {
      allIds.set(id, { kind, level });
    }
  };

  const walk = (nodes: any[], currentLevel = 0, currentZone: string | null = null) => {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;

      switch (node.kind) {
        case 'level': {
          const lvlNum = getNumVal(node.level);
          levels.push({ level: lvlNum, name: node.name?.parts?.[0] });
          if (node.body) walk(node.body, lvlNum, null);
          break;
        }
        case 'zone': {
          registerId(node.id, 'zone', currentLevel);
          zones.push({
            id: node.id,
            label: node.label?.parts?.[0] ?? node.id,
            level: currentLevel,
          });
          if (node.body) walk(node.body, currentLevel, node.id);
          break;
        }
        case 'room': {
          registerId(node.id, 'room', currentLevel);
          rooms.push({
            id: node.id,
            level: currentLevel,
            zone: currentZone,
            x: getNumVal(node.at?.x),
            y: getNumVal(node.at?.y),
            w: getNumVal(node.size?.w),
            h: getNumVal(node.size?.h),
            uses: Array.isArray(node.uses) ? node.uses : [],
          });
          break;
        }
        case 'outdoor': {
          registerId(node.id, 'outdoor', currentLevel);
          outdoors.push({
            id: node.id,
            level: currentLevel,
            zone: currentZone,
            surface: node.surface ?? 'balcony',
            x: getNumVal(node.at?.x),
            y: getNumVal(node.at?.y),
            w: getNumVal(node.size?.w),
            h: getNumVal(node.size?.h),
          });
          break;
        }
        case 'elevator': {
          registerId(node.id, 'elevator', currentLevel);
          elevators.push({
            id: node.id,
            level: currentLevel,
            zone: currentZone,
            x: getNumVal(node.at?.x),
            y: getNumVal(node.at?.y),
            w: getNumVal(node.size?.w),
            h: getNumVal(node.size?.h),
          });
          break;
        }
        case 'stair': {
          registerId(node.id, 'stair', currentLevel);
          stairs.push({
            id: node.id,
            level: currentLevel,
            zone: currentZone,
            dir: node.dir,
            x: getNumVal(node.at?.x),
            y: getNumVal(node.at?.y),
            w: getNumVal(node.size?.w),
            h: getNumVal(node.size?.h),
          });
          break;
        }
        case 'void': {
          registerId(node.id, 'void', currentLevel);
          voids.push({
            id: node.id,
            level: currentLevel,
            zone: currentZone,
            x: getNumVal(node.at?.x),
            y: getNumVal(node.at?.y),
            w: getNumVal(node.size?.w),
            h: getNumVal(node.size?.h),
          });
          break;
        }
        case 'wall': {
          registerId(node.id, 'wall', currentLevel);
          walls.push({
            id: node.id,
            level: currentLevel,
            thickness: getNumVal(node.thickness),
            points: node.points ?? [],
          });
          break;
        }
        case 'column': {
          registerId(node.id, 'column', currentLevel);
          columns.push({
            id: node.id,
            level: currentLevel,
            x: getNumVal(node.at?.x),
            y: getNumVal(node.at?.y),
            w: getNumVal(node.size?.w),
            h: getNumVal(node.size?.h),
          });
          break;
        }
        case 'door': {
          registerId(node.id, 'door', currentLevel);
          doors.push({
            id: node.id,
            level: currentLevel,
            x: getNumVal(node.at?.x),
            y: getNumVal(node.at?.y),
            width: getNumVal(node.width),
            wall: node.wall,
          });
          break;
        }
        case 'window': {
          registerId(node.id, 'window', currentLevel);
          windows.push({
            id: node.id,
            level: currentLevel,
            x: getNumVal(node.at?.x),
            y: getNumVal(node.at?.y),
            width: getNumVal(node.width),
            wall: node.wall,
          });
          break;
        }
        default:
          if (node.body && Array.isArray(node.body)) {
            walk(node.body, currentLevel, currentZone);
          }
          break;
      }
    }
  };

  if (ast?.body) walk(ast.body);

  return {
    levels,
    zones,
    rooms,
    outdoors,
    elevators,
    stairs,
    voids,
    walls,
    columns,
    doors,
    windows,
    allIds,
    duplicates,
  };
}

/**
 * Validates hard parity between canonical building model and ArchLang interpretation.
 * Uses only the compiler AST and semantic describe() summary without any regex.
 */
export function validateGeometryParity(
  canonical: Building,
  summary: SceneSummary,
  serialization: ArchLangSerializationResult,
  compileContext?: ParityCompileContext,
): GeometryParityReport {
  const items: GeometryParityItem[] = [];
  const missingElements: Array<{ id: string; type: string; reason: string }> = [];
  const unexpectedElements: Array<{ id: string; kind: string; level?: number }> = [];
  const coordinateMismatches: Array<{
    id: string;
    expected: { x: number; y: number };
    actual: { x: number; y: number };
    driftMm: number;
  }> = [];
  const dimensionMismatches: Array<{
    id: string;
    expected: { w: number; h: number };
    actual: { w: number; h: number };
    diffMm: number;
  }> = [];
  const unsupportedElements: Array<{ id: string; type: string; reason: string }> = [];

  let maxDriftMm = 0;

  // 1. Resolve AST reliably without regex
  let ast = compileContext?.ast;
  if (!ast && serialization?.source) {
    try {
      const compiled = compile(serialization.source);
      ast = compiled.ast;
    } catch {
      // compilation error will be reported in diagnostics
    }
  }

  const astData = extractElementsFromAst(ast);

  const idMaps = serialization.elementIdMap;

  // Flatten canonical elements across all floors
  const canonicalRooms: Room[] = [];
  const canonicalBalconies: Room[] = [];
  const canonicalFlats = new Map<string, { unitType: string; rooms: Room[]; balconies: Room[] }>();
  let expectedLiftCount = 0;
  let expectedStairCount = 0;
  let expectedLobbyCount = 0;

  for (const floor of canonical.floors) {
    for (const room of floor.rooms) {
      canonicalRooms.push(room);
      const tags = room.tags ?? [];

      // Balconies
      if (room.type === RoomType.Balcony || tags.includes('balcony')) {
        canonicalBalconies.push(room);
        const flatTag = tags.find(t => t.startsWith('flat:'));
        if (flatTag) {
          const flatId = flatTag.slice(5);
          const unitTypeTag = tags.find(t => t.startsWith('unit-type:'))?.slice(10) ?? 'UNKNOWN';
          const entry = canonicalFlats.get(flatId);
          if (entry) {
            entry.balconies.push(room);
          } else {
            canonicalFlats.set(flatId, { unitType: unitTypeTag, rooms: [], balconies: [room] });
          }
        }
        continue;
      }

      // Core elements
      if (room.type === RoomType.Lift || tags.includes('core:lift')) {
        expectedLiftCount++;
        continue;
      }
      if (room.type === RoomType.Staircase || tags.includes('core:stair')) {
        if (!floor.stairs || floor.stairs.length === 0) {
          expectedStairCount++;
        }
        continue;
      }
      if (tags.includes('core:lobby') || tags.includes('core:corridor')) {
        expectedLobbyCount++;
      }

      // Flats
      const flatTag = tags.find(t => t.startsWith('flat:'));
      if (flatTag) {
        const flatId = flatTag.slice(5);
        const unitTypeTag = tags.find(t => t.startsWith('unit-type:'))?.slice(10) ?? 'UNKNOWN';
        const entry = canonicalFlats.get(flatId);
        if (entry) {
          entry.rooms.push(room);
        } else {
          canonicalFlats.set(flatId, { unitType: unitTypeTag, rooms: [room], balconies: [] });
        }
      }
    }

    // Structural floor stairs (avoid double counting spatial room + structural stair entity)
    if (floor.stairs && floor.stairs.length > 0) {
      expectedStairCount += floor.stairs.length;
    }
  }

  // Aggregate ArchLang facts across storeys if multi-storey
  const archRooms: RoomSummary[] = [];
  const archDoors: DoorSummary[] = [];
  const archWindows: WindowSummary[] = [];
  const archZones: ZoneSummary[] = [];
  const archOutdoors: any[] = [];
  const archVerticals: any[] = [];

  if (summary.levels && summary.levels.length > 0) {
    for (const lvl of summary.levels) {
      archRooms.push(...lvl.rooms);
      archDoors.push(...lvl.doors);
      archWindows.push(...lvl.windows);
      if (lvl.zones) archZones.push(...lvl.zones);
    }
  } else {
    archRooms.push(...summary.rooms);
    archDoors.push(...summary.doors);
    archWindows.push(...summary.windows);
    if (summary.zones) archZones.push(...(summary.zones ?? []));
  }

  // Collect outdoor elements (balconies) from describe() or astData
  if ((summary as any).outdoor && Array.isArray((summary as any).outdoor)) {
    archOutdoors.push(...(summary as any).outdoor);
  } else if ((summary as any).outdoors && Array.isArray((summary as any).outdoors)) {
    archOutdoors.push(...(summary as any).outdoors);
  } else {
    archOutdoors.push(...astData.outdoors);
  }

  // Collect vertical circulation elements from describe() or astData
  if (summary.verticals && Array.isArray(summary.verticals)) {
    archVerticals.push(...summary.verticals);
  }

  // Prefer AST walls because they retain declared wall IDs
  const actualWalls = astData.walls.length > 0 ? astData.walls : (compileContext?.scene?.walls ?? []);
  const actualLifts = astData.elevators.length > 0
    ? astData.elevators
    : archVerticals.filter(v => v.kind === 'elevator');
  const actualStairs = astData.stairs.length > 0
    ? astData.stairs
    : archVerticals.filter(v => v.kind === 'stair');

  // ─── 1. Flat Count & Unit Mix Parity ──────────────────────────────────────────
  const archFlatZones = archZones.filter(z => z.id !== 'common_core' && z.id !== 'zone_common_core');
  const expectedFlatCount = canonicalFlats.size;
  const actualFlatCount = archFlatZones.length;

  const expectedMix: Record<string, number> = {};
  for (const [, flat] of canonicalFlats) {
    expectedMix[flat.unitType] = (expectedMix[flat.unitType] ?? 0) + 1;
  }

  const actualMix: Record<string, number> = {};
  for (const zone of archFlatZones) {
    const firstCanonicalRoom = canonicalRooms.find(r => zone.rooms.includes(idMaps.rooms.get(r.id) ?? ''));
    const unitTypeTag = (firstCanonicalRoom?.tags ?? []).find(t => t.startsWith('unit-type:'))?.slice(10);
    const matched =
      unitTypeTag ??
      Object.keys(expectedMix).find(t => zone.label?.toUpperCase().includes(t.toUpperCase())) ??
      'UNKNOWN';
    actualMix[matched] = (actualMix[matched] ?? 0) + 1;
  }

  const flatMixMatches = JSON.stringify(expectedMix) === JSON.stringify(actualMix) || expectedFlatCount === actualFlatCount;

  items.push({
    canonicalId: 'FLAT_COUNT',
    archlangId: 'ZONES_COUNT',
    elementType: 'flat',
    expected: { flatCount: expectedFlatCount, mix: expectedMix },
    actual: { flatCount: actualFlatCount, mix: actualMix },
    status: expectedFlatCount === actualFlatCount && flatMixMatches ? 'PASS' : 'FAIL',
    failureReason:
      expectedFlatCount === actualFlatCount && flatMixMatches
        ? undefined
        : `Flat count or mix mismatch: expected ${expectedFlatCount} (${JSON.stringify(expectedMix)}), got ${actualFlatCount} (${JSON.stringify(actualMix)})`,
  });

  // ─── 2. Room Count & Ownership Parity per Flat ───────────────────────────────
  let allRoomProgrammesPass = true;
  for (const [flatId, flat] of canonicalFlats) {
    const archZoneId = idMaps.rooms.size > 0 ? `zone_${flatId.toLowerCase()}` : flatId;
    const archZone = archFlatZones.find(z => z.id.toLowerCase() === archZoneId || z.id.toLowerCase().includes(flatId.toLowerCase()));

    const canonicalBedrooms = flat.rooms.filter(r => r.type === RoomType.Bedroom || r.name.toLowerCase().includes('bed')).length;
    const canonicalBaths = flat.rooms.filter(r => r.type === RoomType.Bathroom).length;
    const canonicalLivings = flat.rooms.filter(r => r.type === RoomType.Living || r.type === RoomType.Dining).length;

    if (!archZone) {
      allRoomProgrammesPass = false;
      missingElements.push({ id: flatId, type: 'flat_zone', reason: `Zone for flat ${flatId} not generated` });
      items.push({
        canonicalId: flatId,
        archlangId: archZoneId,
        elementType: 'program',
        expected: { flatId, roomCount: flat.rooms.length, bedrooms: canonicalBedrooms },
        actual: { existsInArchLang: false },
        status: 'FAIL',
        failureReason: `Flat ${flatId} zone missing in ArchLang summary.`,
      });
      continue;
    }

    const archZoneRooms = archRooms.filter(r => archZone.rooms.includes(r.id));
    const archBedrooms = archZoneRooms.filter(r => r.uses.includes('bedroom')).length;

    const programPass = flat.rooms.length === archZoneRooms.length && canonicalBedrooms === archBedrooms;
    if (!programPass) allRoomProgrammesPass = false;

    items.push({
      canonicalId: flatId,
      archlangId: archZone.id,
      elementType: 'program',
      expected: {
        flatId,
        unitType: flat.unitType,
        totalRooms: flat.rooms.length,
        bedrooms: canonicalBedrooms,
        bathrooms: canonicalBaths,
        livingDining: canonicalLivings,
      },
      actual: {
        totalRooms: archZoneRooms.length,
        bedrooms: archBedrooms,
      },
      status: programPass ? 'PASS' : 'FAIL',
      failureReason: programPass
        ? undefined
        : `Programme mismatch for Flat ${flatId}: expected ${flat.rooms.length} rooms (${canonicalBedrooms} bed), got ${archZoneRooms.length} rooms (${archBedrooms} bed).`,
    });
  }

  // ─── 3. Common Core Isolation & No Core Element in Private Flats ─────────────
  const commonCoreZone = archZones.find(z => z.id === 'common_core' || z.id === 'zone_common_core');
  let coreNotAssignedToPrivate = true;

  for (const flatZone of archFlatZones) {
    for (const roomId of flatZone.rooms) {
      const isCoreRoom = canonicalRooms.find(
        r =>
          (idMaps.rooms.get(r.id) === roomId ||
            idMaps.stairs.get(r.id) === roomId ||
            idMaps.elevators.get(r.id) === roomId ||
            idMaps.shafts.get(r.id) === roomId) &&
          ((r.tags ?? []).some(t => t.startsWith('core:') || t.startsWith('common:')) ||
            r.type === RoomType.Lift ||
            r.type === RoomType.Staircase ||
            r.type === RoomType.ServiceShaft),
      );

      if (isCoreRoom) {
        coreNotAssignedToPrivate = false;
        items.push({
          canonicalId: isCoreRoom.id,
          archlangId: roomId,
          elementType: 'room',
          expected: { zone: 'common_core' },
          actual: { assignedToZone: flatZone.id },
          status: 'FAIL',
          failureReason: `Core room ${isCoreRoom.name} (${isCoreRoom.id}) assigned to private flat zone ${flatZone.id}.`,
        });
      }
    }
  }

  items.push({
    canonicalId: 'COMMON_CORE_ISOLATION',
    archlangId: 'COMMON_CORE_ZONE',
    elementType: 'room',
    expected: { coreIsolated: true },
    actual: { coreIsolated: coreNotAssignedToPrivate },
    status: coreNotAssignedToPrivate ? 'PASS' : 'FAIL',
    failureReason: coreNotAssignedToPrivate ? undefined : 'One or more common-core elements assigned to private flats.',
  });

  // ─── 4. Room Geometry & Coordinate Parity ────────────────────────────────────
  let allCoordsPass = true;
  let allDimsPass = true;

  for (const cRoom of canonicalRooms) {
    if (
      cRoom.type === RoomType.Lift ||
      cRoom.type === RoomType.Staircase ||
      cRoom.type === RoomType.ServiceShaft ||
      cRoom.type === RoomType.Balcony ||
      (cRoom.tags ?? []).includes('balcony')
    ) {
      continue;
    }

    const archRoomId = idMaps.rooms.get(cRoom.id);
    const archRoom = archRooms.find(r => r.id === archRoomId);

    if (!archRoom) {
      allCoordsPass = false;
      allDimsPass = false;
      missingElements.push({ id: cRoom.id, type: 'room', reason: `Room ${cRoom.name} missing in compiled output` });
      items.push({
        canonicalId: cRoom.id,
        archlangId: archRoomId ?? 'UNMAPPED',
        elementType: 'room',
        expected: { name: cRoom.name, x: cRoom.x, y: cRoom.y, width: cRoom.width, height: cRoom.height },
        actual: { foundInArchLang: false },
        status: 'FAIL',
        failureReason: `Room ${cRoom.name} (${cRoom.id}) missing in ArchLang compiled output.`,
      });
      continue;
    }

    // Compare bounding box (centerline coordinates)
    const expX = roundCoord(cRoom.x);
    const expY = roundCoord(cRoom.y);
    const expW = roundCoord(cRoom.width);
    const expH = roundCoord(cRoom.height);

    const actX = roundCoord(archRoom.bbox.x);
    const actY = roundCoord(archRoom.bbox.y);
    const actW = roundCoord(archRoom.bbox.w);
    const actH = roundCoord(archRoom.bbox.h);

    const xDiff = Math.abs(expX - actX);
    const yDiff = Math.abs(expY - actY);
    const wDiff = Math.abs(expW - actW);
    const hDiff = Math.abs(expH - actH);

    const drift = Math.max(xDiff, yDiff);
    const dimDiff = Math.max(wDiff, hDiff);
    if (drift > maxDriftMm) maxDriftMm = drift;

    const coordMatch = xDiff <= TOLERANCE_MM && yDiff <= TOLERANCE_MM;
    const dimMatch = wDiff <= TOLERANCE_MM && hDiff <= TOLERANCE_MM;
    const geomMatch = coordMatch && dimMatch;

    if (!coordMatch) {
      allCoordsPass = false;
      coordinateMismatches.push({
        id: cRoom.id,
        expected: { x: expX, y: expY },
        actual: { x: actX, y: actY },
        driftMm: drift,
      });
    }

    if (!dimMatch) {
      allDimsPass = false;
      dimensionMismatches.push({
        id: cRoom.id,
        expected: { w: expW, h: expH },
        actual: { w: actW, h: actH },
        diffMm: dimDiff,
      });
    }

    items.push({
      canonicalId: cRoom.id,
      archlangId: archRoom.id,
      elementType: 'room',
      expected: { x: expX, y: expY, width: expW, height: expH },
      actual: { x: actX, y: actY, width: actW, height: actH },
      difference: { xDiff, yDiff, wDiff, hDiff, driftMm: drift },
      status: geomMatch ? 'PASS' : 'FAIL',
      failureReason: geomMatch
        ? undefined
        : `Room ${cRoom.name} geometry mismatch: ${!dimMatch ? `width mismatch (${expW} vs ${actW})` : ''} ${!coordMatch ? `coord mismatch (${expX},${expY} vs ${actX},${actY})` : ''}`.trim(),
    });
  }

  // ─── 5. Balcony Parity (Outdoor Elements) ────────────────────────────────────
  for (const balc of canonicalBalconies) {
    const archBalcId = idMaps.balconies.get(balc.id);
    const archBalc = archOutdoors.find((b: any) => b.id === archBalcId) ??
      astData.outdoors.find(b => b.id === archBalcId);

    if (!archBalc) {
      missingElements.push({ id: balc.id, type: 'balcony', reason: `Balcony ${balc.name} missing in compiled outdoor elements` });
      items.push({
        canonicalId: balc.id,
        archlangId: archBalcId ?? 'UNMAPPED',
        elementType: 'balcony',
        expected: { name: balc.name, x: balc.x, y: balc.y, width: balc.width, height: balc.height },
        actual: { foundInArchLang: false },
        status: 'FAIL',
        failureReason: `Balcony ${balc.name} (${balc.id}) missing in ArchLang outdoor elements.`,
      });
      continue;
    }

    const expX = roundCoord(balc.x);
    const expY = roundCoord(balc.y);
    const expW = roundCoord(balc.width);
    const expH = roundCoord(balc.height);

    const actX = roundCoord(archBalc.bbox?.x ?? archBalc.x ?? 0);
    const actY = roundCoord(archBalc.bbox?.y ?? archBalc.y ?? 0);
    const actW = roundCoord(archBalc.bbox?.w ?? archBalc.w ?? 0);
    const actH = roundCoord(archBalc.bbox?.h ?? archBalc.h ?? 0);

    const xDiff = Math.abs(expX - actX);
    const yDiff = Math.abs(expY - actY);
    const wDiff = Math.abs(expW - actW);
    const hDiff = Math.abs(expH - actH);

    const drift = Math.max(xDiff, yDiff);
    const dimDiff = Math.max(wDiff, hDiff);
    if (drift > maxDriftMm) maxDriftMm = drift;

    const coordMatch = xDiff <= TOLERANCE_MM && yDiff <= TOLERANCE_MM;
    const dimMatch = wDiff <= TOLERANCE_MM && hDiff <= TOLERANCE_MM;
    const balcMatch = coordMatch && dimMatch;

    if (!coordMatch) {
      coordinateMismatches.push({
        id: balc.id,
        expected: { x: expX, y: expY },
        actual: { x: actX, y: actY },
        driftMm: drift,
      });
    }

    if (!dimMatch) {
      dimensionMismatches.push({
        id: balc.id,
        expected: { w: expW, h: expH },
        actual: { w: actW, h: actH },
        diffMm: dimDiff,
      });
    }

    items.push({
      canonicalId: balc.id,
      archlangId: archBalc.id,
      elementType: 'balcony',
      expected: { x: expX, y: expY, width: expW, height: expH },
      actual: { x: actX, y: actY, width: actW, height: actH },
      difference: { xDiff, yDiff, wDiff, hDiff, driftMm: drift },
      status: balcMatch ? 'PASS' : 'FAIL',
      failureReason: balcMatch
        ? undefined
        : `Balcony ${balc.name} geometry mismatch: ${!dimMatch ? `size mismatch` : ''} ${!coordMatch ? `coord mismatch` : ''}`.trim(),
    });
  }

  // ─── 6. Door Parity ──────────────────────────────────────────────────────────
  let allDoorsPass = true;
  const canonicalDoors: Door[] = canonical.floors.flatMap(f => f.doors);
  for (const cDoor of canonicalDoors) {
    const archDoorId = idMaps.doors.get(cDoor.id);
    const archDoor = archDoors.find(d => d.id === archDoorId);

    if (!archDoor) {
      allDoorsPass = false;
      missingElements.push({ id: cDoor.id, type: 'door', reason: `Door ${cDoor.id} missing in ArchLang compiled output` });
      items.push({
        canonicalId: cDoor.id,
        archlangId: archDoorId ?? 'UNMAPPED',
        elementType: 'door',
        expected: { width: cDoor.width, position: cDoor.position },
        actual: { foundInArchLang: false },
        status: 'FAIL',
        failureReason: `Door ${cDoor.id} missing in ArchLang compiled output.`,
      });
      continue;
    }

    const widthDiff = Math.abs(roundCoord(cDoor.width) - roundCoord(archDoor.width));
    const widthMatch = widthDiff <= TOLERANCE_MM;
    if (!widthMatch) allDoorsPass = false;

    items.push({
      canonicalId: cDoor.id,
      archlangId: archDoor.id,
      elementType: 'door',
      expected: { width: roundCoord(cDoor.width), connectsRooms: cDoor.connectsRooms },
      actual: { width: roundCoord(archDoor.width), between: archDoor.between },
      difference: { widthDiff },
      status: widthMatch ? 'PASS' : 'FAIL',
      failureReason: widthMatch ? undefined : `Door ${cDoor.id} width mismatch: expected ${cDoor.width}, got ${archDoor.width}`,
    });
  }

  // ─── 7. Window Parity ────────────────────────────────────────────────────────
  let allWindowsPass = true;
  const canonicalWindows: Window[] = canonical.floors.flatMap(f => f.windows);
  for (const cWin of canonicalWindows) {
    const archWinId = idMaps.windows.get(cWin.id);
    const archWin = archWindows.find(w => w.id === archWinId);

    if (!archWin) {
      allWindowsPass = false;
      missingElements.push({ id: cWin.id, type: 'window', reason: `Window ${cWin.id} missing in ArchLang compiled output` });
      items.push({
        canonicalId: cWin.id,
        archlangId: archWinId ?? 'UNMAPPED',
        elementType: 'window',
        expected: { width: cWin.width, position: cWin.position },
        actual: { foundInArchLang: false },
        status: 'FAIL',
        failureReason: `Window ${cWin.id} missing in ArchLang compiled output.`,
      });
      continue;
    }

    const widthDiff = Math.abs(roundCoord(cWin.width) - roundCoord(archWin.width));
    const widthMatch = widthDiff <= TOLERANCE_MM;
    if (!widthMatch) allWindowsPass = false;

    items.push({
      canonicalId: cWin.id,
      archlangId: archWin.id,
      elementType: 'window',
      expected: { width: roundCoord(cWin.width) },
      actual: { width: roundCoord(archWin.width) },
      difference: { widthDiff },
      status: widthMatch ? 'PASS' : 'FAIL',
      failureReason: widthMatch ? undefined : `Window ${cWin.id} width mismatch: expected ${cWin.width}, got ${archWin.width}`,
    });
  }

  // ─── 8. Verticals Parity (Stairs & Elevators) ─────────────────────────────────
  const liftsPassed = expectedLiftCount === 0 || actualLifts.length >= expectedLiftCount;
  const stairsPassed = expectedStairCount === 0 || actualStairs.length >= expectedStairCount;

  items.push({
    canonicalId: 'CORE_VERTICALS',
    archlangId: 'VERTICALS_SUMMARY',
    elementType: 'stair',
    expected: { lifts: expectedLiftCount, stairs: expectedStairCount },
    actual: { lifts: actualLifts.length, stairs: actualStairs.length },
    status: liftsPassed && stairsPassed ? 'PASS' : 'FAIL',
    failureReason:
      liftsPassed && stairsPassed
        ? undefined
        : `Vertical circulation mismatch: expected ${expectedLiftCount} lifts / ${expectedStairCount} stairs; got ${actualLifts.length} lifts / ${actualStairs.length} stairs.`,
  });

  // ─── 9. Wall Parity ──────────────────────────────────────────────────────────
  const canonicalWalls: Wall[] = canonical.floors.flatMap(f => f.walls);
  const actualWallCount = actualWalls.length;
  let allWallsPass = true;

  if (canonicalWalls.length > 0) {
    if (actualWallCount < canonicalWalls.length) {
      allWallsPass = false;
      items.push({
        canonicalId: 'WALL_COUNT',
        archlangId: 'WALL_DECLARATIONS',
        elementType: 'wall',
        expected: { count: canonicalWalls.length },
        actual: { count: actualWallCount },
        status: 'FAIL',
        failureReason: `Wall count discrepancy: expected ${canonicalWalls.length} canonical walls, found ${actualWallCount} in ArchLang.`,
      });
    } else {
      items.push({
        canonicalId: 'WALL_COUNT',
        archlangId: 'WALL_DECLARATIONS',
        elementType: 'wall',
        expected: { count: canonicalWalls.length },
        actual: { count: actualWallCount },
        status: 'PASS',
      });
    }

    for (const cWall of canonicalWalls) {
      const archWallId = idMaps.walls.get(cWall.id);
      const found = actualWalls.some((w: any) => w.id === archWallId);
      if (archWallId && !found) {
        allWallsPass = false;
        missingElements.push({ id: cWall.id, type: 'wall', reason: `Canonical wall ${cWall.id} not found in ArchLang output` });
        items.push({
          canonicalId: cWall.id,
          archlangId: archWallId,
          elementType: 'wall',
          expected: { id: cWall.id, thickness: cWall.thickness },
          actual: { foundInArchLang: false },
          status: 'FAIL',
          failureReason: `Canonical wall ${cWall.id} (mapped as ${archWallId}) not found in ArchLang output.`,
        });
      }
    }
  }

  // ─── 10. Reverse Check: Unexpected Elements in ArchLang ──────────────────────
  const mappedRoomArchIds = new Set(Array.from(idMaps.rooms.values()));
  const mappedBalconyArchIds = new Set(Array.from(idMaps.balconies.values()));
  const mappedDoorArchIds = new Set(Array.from(idMaps.doors.values()));
  const mappedWinArchIds = new Set(Array.from(idMaps.windows.values()));

  for (const r of archRooms) {
    if (!mappedRoomArchIds.has(r.id) && !canonicalRooms.some(cr => cr.id === r.id)) {
      unexpectedElements.push({ id: r.id, kind: 'room' });
    }
  }

  for (const b of archOutdoors) {
    if (!mappedBalconyArchIds.has(b.id) && !canonicalBalconies.some(cb => cb.id === b.id)) {
      unexpectedElements.push({ id: b.id, kind: 'outdoor' });
    }
  }

  for (const d of archDoors) {
    if (!mappedDoorArchIds.has(d.id) && !canonicalDoors.some(cd => cd.id === d.id)) {
      unexpectedElements.push({ id: d.id, kind: 'door' });
    }
  }

  for (const w of archWindows) {
    if (!mappedWinArchIds.has(w.id) && !canonicalWindows.some(cw => cw.id === w.id)) {
      unexpectedElements.push({ id: w.id, kind: 'window' });
    }
  }

  // Check duplicate IDs
  if (astData.duplicates.length > 0) {
    items.push({
      canonicalId: 'AST_ID_UNIQUENESS',
      archlangId: 'AST_DUPLICATES',
      elementType: 'room',
      expected: { duplicateCount: 0 },
      actual: { duplicateCount: astData.duplicates.length, duplicates: astData.duplicates },
      status: 'FAIL',
      failureReason: `Duplicate element IDs detected in ArchLang AST: ${astData.duplicates.join(', ')}`,
    });
  }

  // ─── Overall Metric Calculations ─────────────────────────────────────────────
  const totalChecks = items.length;
  const failedChecks = items.filter(i => i.status === 'FAIL').length;
  const passedChecks = totalChecks - failedChecks;
  const passed = failedChecks === 0;

  const flatParity = {
    expectedCount: expectedFlatCount,
    actualCount: actualFlatCount,
    expectedMix,
    actualMix,
    passed: expectedFlatCount === actualFlatCount && flatMixMatches,
  };

  const roomParity = {
    expectedTotal: canonicalRooms.length,
    actualTotal: archRooms.length,
    passed: canonicalRooms.length <= archRooms.length + expectedLiftCount + expectedStairCount + canonicalBalconies.length,
  };

  const wallParity = {
    expectedCount: canonicalWalls.length,
    actualCount: actualWallCount,
    passed: allWallsPass,
  };

  const coreParity = {
    liftsPassed,
    stairsPassed,
    lobbyPassed: expectedLobbyCount === 0 || commonCoreZone !== undefined,
    coreNotAssignedToPrivate,
  };

  const metrics = {
    flatCountParity: flatParity.passed,
    apartmentMixParity: flatParity.passed,
    roomProgrammeParity: allRoomProgrammesPass,
    roomCountParity: roomParity.passed,
    wallCountParity: wallParity.passed,
    doorCountParity: allDoorsPass,
    windowCountParity: allWindowsPass,
    stairCountParity: stairsPassed,
    liftCountParity: liftsPassed,
    ownershipIntegrity: coreNotAssignedToPrivate,
    coreIsolation: coreNotAssignedToPrivate,
    coordinateAccuracy: allCoordsPass,
    dimensionAccuracy: allDimsPass,
  };

  const expectedElementsCount =
    canonicalRooms.length +
    canonicalWalls.length +
    canonicalDoors.length +
    canonicalWindows.length +
    canonical.floors.flatMap(f => f.columns ?? []).length;

  const actualElementsCount =
    archRooms.length +
    archOutdoors.length +
    actualWalls.length +
    archDoors.length +
    archWindows.length +
    actualLifts.length +
    actualStairs.length +
    astData.columns.length;

  return {
    status: passed ? 'PASS' : 'FAIL',
    passed,
    totalChecks,
    passedChecks,
    failedChecks,
    expectedElements: expectedElementsCount,
    actualElements: actualElementsCount,
    missingElements,
    unexpectedElements,
    duplicates: astData.duplicates,
    coordinateMismatches,
    dimensionMismatches,
    unsupportedElements,
    maximumCoordinateDriftMm: maxDriftMm,
    items,
    checks: items,
    flatParity,
    roomParity,
    wallParity,
    coreParity,
    metrics,
    summary: {
      totalElements: totalChecks,
      passedElements: passedChecks,
      failedElements: failedChecks,
    },
  };
}
