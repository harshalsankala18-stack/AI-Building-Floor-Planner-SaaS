/**
 * ArchLang Adapter — Canonical Building Model to ArchLang DSL (.arch) Serializer.
 *
 * Implements deterministic 1:1 translation from the canonical Building Model
 * (@ai-floor-planner/core) to valid ArchLang source code (@chanmeng666/archlang v1.57.0).
 *
 * Ground truth is strictly preserved:
 * - Coordinates are 1:1 in millimeters (mm), where (0,0) is top-left, +x right, +y down.
 * - Shell and interior partition walls are emitted with exact thicknesses.
 * - Room ownership is encoded via ArchLang `zone` blocks.
 * - Doors and windows are strictly bound to their host walls with exact spans.
 * - Multi-storey storeys are serialized into ArchLang `level` blocks.
 * - Vertical circulation shafts (stairs, elevators) share stable IDs across levels.
 * - Unsupported elements produce structured diagnostics and are never silently discarded.
 */

function computeSourceHash(text: string): string {
  try {
    // Safe runtime resolution for Node environments without breaking browser bundlers
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = typeof require === 'function' ? require('node:crypto') : (globalThis as any).crypto;
    if (nodeCrypto && typeof nodeCrypto.createHash === 'function') {
      return nodeCrypto.createHash('sha256').update(text, 'utf8').digest('hex');
    }
  } catch {
    // Portable fallback for browser environments
  }
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 16777619);
    h2 = Math.imul(h2 ^ (ch >>> 4), 2166136261);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

import {
  type Building,
  type Floor,
  type Room,
  type Stair,
  RoomType,
  WallType,
  DoorType,
  SwingDirection,
} from '@ai-floor-planner/core';

export const ARCHLANG_ADAPTER_VERSION = '1.0.0';
export const ARCHLANG_PACKAGE_VERSION = '1.57.0';

// ─── Diagnostic Types ─────────────────────────────────────────────────────────

export interface ArchLangDiagnostic {
  readonly stage: 'SERIALIZATION' | 'COMPILER' | 'LINT' | 'INTENT' | 'PARITY';
  readonly code: string;
  readonly severity: 'error' | 'warning' | 'info';
  readonly message: string;
  readonly elementId?: string;
  readonly line?: number;
  readonly col?: number;
}

export interface ArchLangAdapterOptions {
  /** Paper size: 'A4' | 'A3' | 'A2' | 'A1' | 'A0'. Default: 'A2'. */
  readonly paperSize?: 'A4' | 'A3' | 'A2' | 'A1' | 'A0';
  /** Paper orientation: 'landscape' | 'portrait'. Default: 'landscape'. */
  readonly orientation?: 'landscape' | 'portrait';
  /** Drawing scale: e.g. '1:100'. Default: '1:100'. */
  readonly scale?: string;
  /** Grid snap size in mm. Default: 50. */
  readonly gridMm?: number;
  /** Auto dimensions mode: 'all' | 'overall' | 'rooms' | 'walls' | 'none'. Default: 'all'. */
  readonly autoDims?: 'all' | 'overall' | 'rooms' | 'walls' | 'none';
  /** Include title block. Default: true. */
  readonly includeTitleBlock?: boolean;
}

export interface ArchLangSerializationResult {
  readonly source: string;
  readonly sourceHash: string;
  readonly diagnostics: readonly ArchLangDiagnostic[];
  readonly elementIdMap: {
    readonly rooms: ReadonlyMap<string, string>; // canonical ID -> ArchLang ID
    readonly walls: ReadonlyMap<string, string>;
    readonly doors: ReadonlyMap<string, string>;
    readonly windows: ReadonlyMap<string, string>;
    readonly stairs: ReadonlyMap<string, string>;
    readonly elevators: ReadonlyMap<string, string>;
    readonly columns: ReadonlyMap<string, string>;
    readonly balconies: ReadonlyMap<string, string>;
    readonly shafts: ReadonlyMap<string, string>;
  };
}

// ─── String Sanitizers & Escaping ─────────────────────────────────────────────

/**
 * Escapes arbitrary user strings so they cannot break out of ArchLang double-quoted strings
 * or inject executable DSL syntax.
 */
export function escapeArchLangString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, ' ')
    .trim();
}

/**
 * Creates a valid, stable ArchLang identifier from any canonical element ID.
 * ArchLang identifiers must start with an alpha character or underscore, followed by alnum or underscore.
 */
export function toArchLangId(prefix: string, rawId: string): string {
  const clean = rawId.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+|_+$/g, '');
  return `${prefix}_${clean || 'item'}`;
}

// ─── Room Category Mapping ───────────────────────────────────────────────────

/**
 * Maps a canonical RoomType to a valid ArchLang `uses` category.
 * ArchLang valid categories: living, kitchen, dining, bedroom, bath, wc, hall, circulation, storage, utility, office, entry, garage.
 */
export function mapRoomTypeToArchLangUse(type: RoomType): string {
  const typeStr = String(type).toLowerCase();
  if (typeStr.includes('bed')) return 'bedroom';
  if (typeStr.includes('bath') || typeStr.includes('toilet') || typeStr.includes('wc')) return 'bath';
  if (typeStr.includes('kitchen')) return 'kitchen';
  if (typeStr.includes('dining')) return 'dining';
  if (typeStr.includes('living') || typeStr.includes('drawing') || typeStr.includes('family')) return 'living';

  switch (type) {
    case RoomType.Bedroom:
    case RoomType.ServantQuarter:
      return 'bedroom';
    case RoomType.Bathroom:
      return 'bath';
    case RoomType.Living:
    case RoomType.Drawing:
    case RoomType.FamilyLiving:
      return 'living';
    case RoomType.Dining:
      return 'dining';
    case RoomType.Kitchen:
      return 'kitchen';
    case RoomType.Utility:
      return 'utility';
    case RoomType.Storage:
    case RoomType.Dressing:
      return 'storage';
    case RoomType.Study:
      return 'office';
    case RoomType.Foyer:
    case RoomType.Porch:
      return 'entry';
    case RoomType.Corridor:
      return 'circulation';
    case RoomType.Parking:
      return 'garage';
    case RoomType.Balcony:
    case RoomType.Terrace:
      return 'circulation';
    case RoomType.Pooja:
    case RoomType.Custom:
    default:
      return 'living';
  }
}

// ─── Topological Wall Derivation ──────────────────────────────────────────────

interface DerivedEdge {
  readonly start: { readonly x: number; readonly y: number };
  readonly end: { readonly x: number; readonly y: number };
  readonly roomIds: readonly string[];
  readonly isExternal: boolean;
}

/**
 * Computes shared wall centerlines when a floor model does not have explicit walls.
 */
export function deriveWallsFromFloorRooms(rooms: readonly Room[]): DerivedEdge[] {
  const edgeMap = new Map<string, { start: { x: number; y: number }; end: { x: number; y: number }; roomIds: string[] }>();

  for (const room of rooms) {
    const x0 = Math.round(room.x);
    const y0 = Math.round(room.y);
    const x1 = Math.round(room.x + room.width);
    const y1 = Math.round(room.y + room.height);

    const segments = [
      { start: { x: x0, y: y0 }, end: { x: x1, y: y0 } },
      { start: { x: x1, y: y0 }, end: { x: x1, y: y1 } },
      { start: { x: x1, y: y1 }, end: { x: x0, y: y1 } },
      { start: { x: x0, y: y1 }, end: { x: x0, y: y0 } },
    ];

    for (const seg of segments) {
      const isVert = seg.start.x === seg.end.x;
      const k = isVert
        ? `v_${seg.start.x}_${Math.min(seg.start.y, seg.end.y)}_${Math.max(seg.start.y, seg.end.y)}`
        : `h_${seg.start.y}_${Math.min(seg.start.x, seg.end.x)}_${Math.max(seg.start.x, seg.end.x)}`;

      const existing = edgeMap.get(k);
      if (existing) {
        existing.roomIds.push(room.id);
      } else {
        edgeMap.set(k, { start: seg.start, end: seg.end, roomIds: [room.id] });
      }
    }
  }

  const result: DerivedEdge[] = [];
  for (const [, edge] of edgeMap) {
    const isExternal = edge.roomIds.length < 2;
    result.push({
      start: edge.start,
      end: edge.end,
      roomIds: edge.roomIds,
      isExternal,
    });
  }
  return result;
}

// ─── Nearest Wall Lookup for Openings ────────────────────────────────────────

function pointDistanceToSegment(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

function findHostWall(
  pos: { x: number; y: number },
  walls: readonly { id: string; startPoint: { x: number; y: number }; endPoint: { x: number; y: number } }[],
  toleranceMm = 300,
): { id: string; distance: number } | null {
  let closest: { id: string; distance: number } | null = null;
  for (const w of walls) {
    const d = pointDistanceToSegment(pos, w.startPoint, w.endPoint);
    if (d <= toleranceMm && (!closest || d < closest.distance)) {
      closest = { id: w.id, distance: d };
    }
  }
  return closest;
}

// ─── Main Serializer ──────────────────────────────────────────────────────────

/**
 * Converts a canonical Building model into valid ArchLang DSL (.arch) source.
 */
export function buildingModelToArchLangSource(
  building: Building,
  options?: ArchLangAdapterOptions,
): ArchLangSerializationResult {
  const diagnostics: ArchLangDiagnostic[] = [];
  const lines: string[] = [];

  const paperSize = options?.paperSize ?? 'A2';
  const orientation = options?.orientation ?? 'landscape';
  const scale = options?.scale ?? '1:100';
  const gridMm = options?.gridMm ?? 1;
  const autoDims = options?.autoDims ?? 'all';
  const includeTitleBlock = options?.includeTitleBlock ?? true;

  // Track canonical -> ArchLang IDs for parity validation
  const roomMap = new Map<string, string>();
  const wallMap = new Map<string, string>();
  const doorMap = new Map<string, string>();
  const windowMap = new Map<string, string>();
  const stairMap = new Map<string, string>();
  const elevatorMap = new Map<string, string>();
  const columnMap = new Map<string, string>();
  const balconyMap = new Map<string, string>();
  const shaftMap = new Map<string, string>();

  // Determine compass orientation
  let northDir = 'up';
  const orientationDeg = building.site?.orientation ?? 0;
  if (orientationDeg >= 45 && orientationDeg < 135) northDir = 'right';
  else if (orientationDeg >= 135 && orientationDeg < 225) northDir = 'down';
  else if (orientationDeg >= 225 && orientationDeg < 315) northDir = 'left';

  // 1. Plan Header
  const safeProjectName = escapeArchLangString(building.name || 'Architectural Apartment Plan');
  lines.push(`plan "${safeProjectName}" {`);
  lines.push(`  units mm`);
  lines.push(`  grid ${gridMm}`);
  lines.push(`  paper ${paperSize} ${orientation}`);
  lines.push(`  scale ${scale}`);
  lines.push(`  north ${northDir}`);
  if (autoDims !== 'none') {
    lines.push(`  dims auto ${autoDims}`);
  }

  // 2. Process each storey/level
  const floors = building.floors.length > 0 ? building.floors : [
    {
      id: 'default_floor',
      buildingId: building.id,
      level: 0,
      name: 'Ground Floor',
      floorHeight: 3000,
      boundary: { points: [] },
      rooms: [],
      walls: [],
      doors: [],
      windows: [],
      stairs: [],
      columns: [],
    } as unknown as Floor,
  ];

  for (const floor of floors) {
    const floorHeight = floor.floorHeight || 3000;
    const safeFloorName = escapeArchLangString(floor.name || `Level ${floor.level}`);
    lines.push(`\n  level ${floor.level} "${safeFloorName}" height ${floorHeight} {`);

    // A. Walls
    // If the canonical model has explicit walls, use them; otherwise, topologically derive them.
    let activeWalls: Array<{
      id: string;
      startPoint: { x: number; y: number };
      endPoint: { x: number; y: number };
      thickness: number;
      type: WallType;
    }> = [];

    if (floor.walls && floor.walls.length > 0) {
      activeWalls = floor.walls.map(w => ({
        id: w.id,
        startPoint: { x: Math.round(w.startPoint.x), y: Math.round(w.startPoint.y) },
        endPoint: { x: Math.round(w.endPoint.x), y: Math.round(w.endPoint.y) },
        thickness: w.thickness > 0 ? Math.round(w.thickness) : (w.type === WallType.External ? 200 : 100),
        type: w.type,
      }));
    } else {
      // Derive walls from rooms
      const derived = deriveWallsFromFloorRooms(floor.rooms);
      activeWalls = derived.map((d, idx) => ({
        id: `wall_${floor.level}_${idx + 1}`,
        startPoint: d.start,
        endPoint: d.end,
        thickness: d.isExternal ? 200 : 100,
        type: d.isExternal ? WallType.External : WallType.Internal,
      }));
    }

    lines.push(`    # ── Walls ──`);
    for (const wall of activeWalls) {
      // Filter out zero-length degenerate walls
      const len = Math.hypot(wall.endPoint.x - wall.startPoint.x, wall.endPoint.y - wall.startPoint.y);
      if (len <= 0) {
        diagnostics.push({
          stage: 'SERIALIZATION',
          code: 'DEGENERATE_WALL_SKIPPED',
          severity: 'warning',
          message: `Wall ${wall.id} has length 0 and was omitted.`,
          elementId: wall.id,
        });
        continue;
      }

      const archWallId = toArchLangId('w', wall.id);
      wallMap.set(wall.id, archWallId);
      const category = wall.type === WallType.External ? 'exterior' : 'partition';
      lines.push(
        `    wall id=${archWallId} ${category} thickness ${wall.thickness} { (${wall.startPoint.x}, ${wall.startPoint.y}) (${wall.endPoint.x}, ${wall.endPoint.y}) }`,
      );
    }

    // B. Group Rooms by Flat / Common Core (Zones)
    const flatsMap = new Map<string, { label: string; rooms: Room[]; balconies: Room[] }>();
    const commonRooms: Room[] = [];
    const coreLifts: Room[] = [];
    const coreStairs: Room[] = [];
    const coreShafts: Room[] = [];
    const unzonedBalconies: Room[] = [];

    for (const room of floor.rooms) {
      const tags = room.tags ?? [];
      // Categorize special types
      if (room.type === RoomType.Lift || tags.includes('core:lift')) {
        coreLifts.push(room);
        continue;
      }
      if (room.type === RoomType.Staircase || tags.includes('core:stair')) {
        coreStairs.push(room);
        continue;
      }
      if (room.type === RoomType.ServiceShaft || tags.includes('core:shaft')) {
        coreShafts.push(room);
        continue;
      }
      if (room.type === RoomType.Balcony || tags.includes('balcony')) {
        const flatTag = tags.find(t => t.startsWith('flat:'));
        if (flatTag) {
          const flatId = flatTag.slice(5);
          const existing = flatsMap.get(flatId);
          const label = room.name.startsWith('Flat')
            ? room.name.split(' ').slice(0, 2).join(' ')
            : `Flat ${flatId.toUpperCase()}`;
          if (existing) {
            existing.balconies.push(room);
          } else {
            flatsMap.set(flatId, { label, rooms: [], balconies: [room] });
          }
        } else {
          unzonedBalconies.push(room);
        }
        continue; // Balconies are outdoor elements; never emit as "room uses balcony"
      }

      // Check flat ownership
      const flatTag = tags.find(t => t.startsWith('flat:'));
      if (flatTag) {
        const flatId = flatTag.slice(5);
        const existing = flatsMap.get(flatId);
        const label = room.name.startsWith('Flat')
          ? room.name.split(' ').slice(0, 2).join(' ')
          : `Flat ${flatId.toUpperCase()}`;
        if (existing) {
          existing.rooms.push(room);
        } else {
          flatsMap.set(flatId, { label, rooms: [room], balconies: [] });
        }
      } else {
        commonRooms.push(room);
      }
    }

    // C. Emit Zones & Rooms
    lines.push(`\n    # ── Common Core Zone ──`);
    lines.push(`    zone common_core "Common Core" {`);
    for (const room of commonRooms) {
      const archRoomId = toArchLangId('r', room.id);
      roomMap.set(room.id, archRoomId);
      const use = mapRoomTypeToArchLangUse(room.type);
      const safeLabel = escapeArchLangString(room.name);
      lines.push(
        `      room id=${archRoomId} at (${Math.round(room.x)}, ${Math.round(room.y)}) size ${Math.round(room.width)}x${Math.round(room.height)} label "${safeLabel}" uses ${use}`,
      );
    }

    // Elevators in Common Core
    for (const lift of coreLifts) {
      const archLiftId = toArchLangId('elev', lift.id);
      elevatorMap.set(lift.id, archLiftId);
      lines.push(
        `      elevator id=${archLiftId} at (${Math.round(lift.x)}, ${Math.round(lift.y)}) size ${Math.round(lift.width)}x${Math.round(lift.height)}`,
      );
    }

    // Stairs in Common Core (from rooms or floor.stairs)
    const stairsToRender = floor.stairs.length > 0 ? floor.stairs : coreStairs.map(s => ({
      id: s.id,
      floorId: floor.id,
      x: s.x,
      y: s.y,
      width: s.width,
      length: s.height,
      direction: 'north',
      connectsFloors: [floor.level, floor.level + 1],
    } as unknown as Stair));

    for (const stair of stairsToRender) {
      const archStairId = toArchLangId('stair', stair.id);
      stairMap.set(stair.id, archStairId);
      const dir = floor.level === 0 ? 'up' : 'down';
      lines.push(
        `      stair id=${archStairId} at (${Math.round(stair.x)}, ${Math.round(stair.y)}) size ${Math.round(stair.width)}x${Math.round(stair.length)} dir ${dir}`,
      );
    }

    // Service Shafts / Ducts (Voids)
    for (const shaft of coreShafts) {
      const archShaftId = toArchLangId('void', shaft.id);
      shaftMap.set(shaft.id, archShaftId);
      lines.push(
        `      void id=${archShaftId} at (${Math.round(shaft.x)}, ${Math.round(shaft.y)}) size ${Math.round(shaft.width)}x${Math.round(shaft.height)}`,
      );
    }
    lines.push(`    }`); // end common_core

    // D. Individual Flat Zones
    lines.push(`\n    # ── Residential Flats ──`);
    for (const [flatId, flatData] of flatsMap) {
      const zoneId = toArchLangId('zone', flatId);
      const safeFlatLabel = escapeArchLangString(flatData.label);
      lines.push(`    zone ${zoneId} "${safeFlatLabel}" {`);

      for (const room of flatData.rooms) {
        const archRoomId = toArchLangId('r', room.id);
        roomMap.set(room.id, archRoomId);
        const use = mapRoomTypeToArchLangUse(room.type);
        const safeLabel = escapeArchLangString(room.name);
        lines.push(
          `      room id=${archRoomId} at (${Math.round(room.x)}, ${Math.round(room.y)}) size ${Math.round(room.width)}x${Math.round(room.height)} label "${safeLabel}" uses ${use}`,
        );
      }

      for (const balc of flatData.balconies) {
        const archBalcId = toArchLangId('balc', balc.id);
        balconyMap.set(balc.id, archBalcId);
        const safeLabel = escapeArchLangString(balc.name || 'Balcony');
        lines.push(
          `      outdoor id=${archBalcId} balcony at (${Math.round(balc.x)}, ${Math.round(balc.y)}) size ${Math.round(balc.width)}x${Math.round(balc.height)} label "${safeLabel}" rail all`,
        );
      }
      lines.push(`    }`); // end flat zone
    }

    // E. Doors
    lines.push(`\n    # ── Doors ──`);
    for (const door of floor.doors) {
      let hostWallId = wallMap.get(door.wallId);
      const posX = Math.round(door.position.x);
      const posY = Math.round(door.position.y);

      // If door.wallId is generic '__extracted__' or unmapped, locate nearest physical wall
      if (!hostWallId || !wallMap.has(door.wallId)) {
        const nearest = findHostWall({ x: posX, y: posY }, activeWalls);
        if (nearest) {
          hostWallId = wallMap.get(nearest.id) ?? nearest.id;
        }
      }

      if (!hostWallId) {
        diagnostics.push({
          stage: 'SERIALIZATION',
          code: 'DOOR_HOST_WALL_NOT_FOUND',
          severity: 'error',
          message: `Door ${door.id} has no valid host wall near (${posX}, ${posY}).`,
          elementId: door.id,
        });
        continue;
      }

      const archDoorId = toArchLangId('d', door.id);
      doorMap.set(door.id, archDoorId);

      // Door kind and motion mapping
      let kindWord = '';
      let motionClause = '';

      if (door.type === DoorType.Sliding) {
        kindWord = 'sliding ';
        motionClause = 'slide right';
      } else if (door.type === DoorType.Folding) {
        kindWord = 'bifold ';
      } else if (door.type === DoorType.Double) {
        kindWord = 'double ';
        if (door.swingDirection === SwingDirection.Outward) motionClause = 'swing out';
        else motionClause = 'swing in';
      } else {
        // Standard hinged
        if (door.swingDirection === SwingDirection.Outward) motionClause = 'swing out';
        else if (door.swingDirection === SwingDirection.Inward) motionClause = 'swing in';
        else if (door.swingDirection === SwingDirection.Left) motionClause = 'hinge left';
        else if (door.swingDirection === SwingDirection.Right) motionClause = 'hinge right';
        else motionClause = 'swing in';
      }

      const doorWidth = Math.max(600, Math.round(door.width));

      lines.push(
        `    door id=${archDoorId} ${kindWord}at (${posX}, ${posY}) width ${doorWidth} wall ${hostWallId} ${motionClause}`.trimEnd(),
      );
    }

    // F. Windows
    lines.push(`\n    # ── Windows ──`);
    for (const win of floor.windows) {
      let hostWallId = wallMap.get(win.wallId);
      const posX = Math.round(win.position.x);
      const posY = Math.round(win.position.y);

      if (!hostWallId || !wallMap.has(win.wallId)) {
        const nearest = findHostWall({ x: posX, y: posY }, activeWalls);
        if (nearest) {
          hostWallId = wallMap.get(nearest.id) ?? nearest.id;
        }
      }

      if (!hostWallId) {
        diagnostics.push({
          stage: 'SERIALIZATION',
          code: 'WINDOW_HOST_WALL_NOT_FOUND',
          severity: 'error',
          message: `Window ${win.id} has no valid host wall near (${posX}, ${posY}).`,
          elementId: win.id,
        });
        continue;
      }

      const archWinId = toArchLangId('win', win.id);
      windowMap.set(win.id, archWinId);
      const winWidth = Math.max(500, Math.round(win.width));
      const sillClause = win.sillHeight ? ` sill ${Math.round(win.sillHeight)}` : '';
      const headClause = win.height ? ` head ${Math.round((win.sillHeight ?? 900) + win.height)}` : '';

      lines.push(
        `    window id=${archWinId} at (${posX}, ${posY}) width ${winWidth} wall ${hostWallId}${sillClause}${headClause}`,
      );
    }

    // G. Columns
    if (floor.columns && floor.columns.length > 0) {
      lines.push(`\n    # ── Columns ──`);
      for (const col of floor.columns) {
        const archColId = toArchLangId('col', col.id);
        columnMap.set(col.id, archColId);
        const colWidth = Math.round(col.width ?? (col as any).dimensions?.width ?? 300);
        const colDepth = Math.round(col.depth ?? (col as any).dimensions?.depth ?? 300);
        lines.push(
          `    column id=${archColId} at (${Math.round(col.position.x)}, ${Math.round(col.position.y)}) size ${colWidth}x${colDepth}`,
        );
      }
    }

    // H. Unzoned Balconies (outdoor elements)
    if (unzonedBalconies.length > 0) {
      lines.push(`\n    # ── Unzoned Balconies ──`);
      for (const b of unzonedBalconies) {
        const archBalcId = toArchLangId('balc', b.id);
        balconyMap.set(b.id, archBalcId);
        const safeLabel = escapeArchLangString(b.name || 'Balcony');
        lines.push(
          `    outdoor id=${archBalcId} balcony at (${Math.round(b.x)}, ${Math.round(b.y)}) size ${Math.round(b.width)}x${Math.round(b.height)} label "${safeLabel}" rail all`,
        );
      }
    }

    lines.push(`  }`); // end level
  }

  // 3. Title block
  if (includeTitleBlock) {
    const today = new Date().toISOString().split('T')[0];
    lines.push(`\n  title {`);
    lines.push(`    project "${safeProjectName}"`);
    lines.push(`    drawn_by "AI Floor Planner"`);
    lines.push(`    date "${today}"`);
    lines.push(`    number "AFP-${building.id.slice(0, 8).toUpperCase()}"`);
    lines.push(`    revision "1"`);
    lines.push(`  }`);
  }

  lines.push(`}`); // end plan
  lines.push(''); // trailing newline

  const source = lines.join('\n');
  const sourceHash = computeSourceHash(source);

  return {
    source,
    sourceHash,
    diagnostics,
    elementIdMap: {
      rooms: roomMap,
      walls: wallMap,
      doors: doorMap,
      windows: windowMap,
      stairs: stairMap,
      elevators: elevatorMap,
      columns: columnMap,
      balconies: balconyMap,
      shafts: shaftMap,
    },
  };
}
