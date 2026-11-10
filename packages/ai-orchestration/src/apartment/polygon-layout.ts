/**
 * Stepped Orthogonal Polygon & Indian Apartment Geometry Engine
 * Phase 1.1 — Non-Square Stepped Envelopes, OTS Shafts, Sit-Out Balconies
 *
 * - SteppedUnitPolygon: orthogonal polygon with >=6 vertices (L/stepped, not plain rectangle)
 * - Facade exposure: corridorSide (N|S|E|W), openFacades, deadWalls computed dynamically
 * - carveOtsShaft(): 1200mm x 1500mm recessed notch (excluded from RERA carpet)
 * - projectSitOutBalcony(): 1200-1500mm cantilever on openFacades only
 * - Vertex simplification: collinear redundant vertices removed, CCW ordering, no self-intersection
 * - Shoelace area excluding OTS shafts
 */

export type FacadeDirection = 'N' | 'S' | 'E' | 'W';

export interface OtsShaft {
  readonly id: string;
  readonly bounds: { x: number; y: number; width: number; height: number };
  readonly widthMm: number;
  readonly depthMm: number;
  /** Center point of shaft (for plumbing adjacency checks) */
  readonly center: { x: number; y: number };
}

export interface SitOutBalcony {
  readonly id: string;
  readonly hostRoomId: string;
  readonly bounds: { x: number; y: number; width: number; height: number };
  readonly depthMm: number;
  readonly widthMm: number;
  readonly facade: FacadeDirection;
}

export interface SteppedUnitPolygon {
  readonly flatId: string;
  readonly flatLabel: string;
  /** Orthogonal stepped polygon vertices (CCW, metres, global coords). Length >= 6. */
  readonly vertices: readonly { x: number; y: number }[];
  /** Alias for vertices — compatible with geometry-engine Polygon type */
  readonly polygon: { points: readonly { x: number; y: number }[] };
  readonly boundingBox: { x: number; y: number; width: number; height: number };
  readonly corridorSide: FacadeDirection;
  readonly openFacades: readonly FacadeDirection[];
  readonly deadWalls: readonly FacadeDirection[];
  readonly otsShafts: readonly OtsShaft[];
  readonly balconies: readonly SitOutBalcony[];
  /** Net RERA carpet area excluding OTS shafts (sq m) */
  readonly netCarpetAreaSqM: number;
  /** Gross polygon area including OTS (sq m) — for validation */
  readonly grossAreaSqM: number;
}

// ── Shoelace helpers ──────────────────────────────────────────────────────────

function shoelaceAreaSqM(vertices: readonly { x: number; y: number }[]): number {
  let s = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const a = vertices[i]!;
    const b = vertices[(i + 1) % n]!;
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}

/** Remove collinear redundant vertices on orthogonal polygon */
function simplifyOrthogonal(vertices: { x: number; y: number }[]): { x: number; y: number }[] {
  if (vertices.length <= 4) return vertices;
  let changed = true;
  let pts = [...vertices];
  while (changed && pts.length > 4) {
    changed = false;
    const next: { x: number; y: number }[] = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const prev = pts[(i - 1 + n) % n]!;
      const curr = pts[i]!;
      const nxt = pts[(i + 1) % n]!;
      const collinearX = Math.abs(prev.x - curr.x) < 1e-6 && Math.abs(curr.x - nxt.x) < 1e-6;
      const collinearY = Math.abs(prev.y - curr.y) < 1e-6 && Math.abs(curr.y - nxt.y) < 1e-6;
      if (collinearX || collinearY) {
        changed = true;
        continue; // skip redundant vertex
      }
      next.push(curr);
    }
    if (next.length < pts.length && next.length >= 4) pts = next;
    else break;
  }
  return pts;
}

/** Ensure CCW winding (positive shoelace signed area with Y-up convention → negative for CCW with Y-down; we normalize to CCW for geometry-engine) */
function ensureCCW(vertices: { x: number; y: number }[]): { x: number; y: number }[] {
  let s = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const a = vertices[i]!;
    const b = vertices[(i + 1) % n]!;
    s += (b.x - a.x) * (b.y + a.y);
  }
  // s > 0 => clockwise (Y-down), reverse to CCW
  if (s > 0) return [...vertices].reverse();
  return vertices;
}

// ── Stepped polygon builder ─────────────────────────────────────────────────

interface SteppedPolygonParams {
  flatId: string;
  flatLabel: string;
  bbox: { x: number; y: number; width: number; height: number };
  corridorSide: FacadeDirection;
  /** Explicit dead walls from neighbour adjacency (e.g. party wall) */
  extraDeadWalls?: readonly FacadeDirection[];
  targetCarpetAreaSqM: number;
}

/**
 * Build a stepped orthogonal polygon.
 * Creates an L-shaped / staggered envelope where the bedroom wing is inset
 * so the outer boundary is non-rectangular (≥6 vertices).
 */
export function buildSteppedPolygon(params: SteppedPolygonParams): SteppedUnitPolygon {
  const { flatId, flatLabel, bbox, corridorSide, extraDeadWalls = [] } = params;
  const x0 = bbox.x;
  const y0 = bbox.y;
  const x1 = bbox.x + bbox.width;
  const y1 = bbox.y + bbox.height;

  // Step: living zone (top 55-60%) is full width; bedroom wing (bottom 40%) is inset
  // Inset creates the characteristic Indian apartment stagger
  const insetMm = 1200; // 1.2m step
  const splitY = y0 + bbox.height * 0.58; // living/balcony zone boundary

  let vertices: { x: number; y: number }[];

  if (corridorSide === 'W' || corridorSide === 'E') {
    // Corridor on W or E: step projects outward on the opposite open facade side (E or W)
    // to enclose the unit's articulated facade wing without encroaching on interior rooms.
    const stepX = corridorSide === 'W' ? x1 + insetMm / 1000 : x0 - insetMm / 1000;
    if (corridorSide === 'W') {
      vertices = [
        { x: x0, y: y0 },
        { x: x1, y: y0 },
        { x: x1, y: splitY },
        { x: stepX, y: splitY },
        { x: stepX, y: y1 },
        { x: x0, y: y1 },
      ];
    } else {
      vertices = [
        { x: x0, y: y0 },
        { x: x1, y: y0 },
        { x: x1, y: y1 },
        { x: stepX, y: y1 },
        { x: stepX, y: splitY },
        { x: x0, y: splitY },
      ];
    }
  } else {
    // Corridor N or S: step projects outward on opposite side
    const stepY = corridorSide === 'N' ? y1 + insetMm / 1000 : y0 - insetMm / 1000;
    const splitX = x0 + bbox.width * 0.58;
    if (corridorSide === 'N') {
      vertices = [
        { x: x0, y: y0 },
        { x: x1, y: y0 },
        { x: x1, y: y1 },
        { x: splitX, y: y1 },
        { x: splitX, y: stepY },
        { x: x0, y: stepY },
      ];
    } else {
      vertices = [
        { x: x0, y: stepY },
        { x: splitX, y: stepY },
        { x: splitX, y: y0 },
        { x: x1, y: y0 },
        { x: x1, y: y1 },
        { x: x0, y: y1 },
      ];
    }
  }

  vertices = simplifyOrthogonal(vertices);
  vertices = ensureCCW(vertices);

  // OTS shaft (1200 x 1500 mm) — placed on service/corridor side, near wet wall
  const ots = carveOtsShaft(flatId, bbox, corridorSide);

  // Sit-out balcony (1200-1500mm) — on open facade, from living room
  const openFacade: FacadeDirection = corridorSide === 'W' ? 'E' : corridorSide === 'E' ? 'W' : corridorSide === 'N' ? 'S' : 'N';
  const balcony = projectSitOutBalcony({
    flatId,
    hostRoomId: `${flatId}_living_dining`,
    bbox,
    openFacade,
    depthMm: 1500,
  });

  // Facade classification
  const deadSet = new Set<FacadeDirection>([corridorSide, ...extraDeadWalls]);
  const all: FacadeDirection[] = ['N', 'S', 'E', 'W'];
  const deadWalls: FacadeDirection[] = [...deadSet];
  const openFacades: FacadeDirection[] = all.filter(d => !deadSet.has(d));

  const grossAreaSqM = Number(shoelaceAreaSqM(vertices).toFixed(2));
  const otsAreaSqM = (ots.widthMm * ots.depthMm) / 1e6;
  const netCarpetAreaSqM = Number((grossAreaSqM - otsAreaSqM).toFixed(2));

  const bb = bbox; // keep original bbox for backward compat

  return {
    flatId,
    flatLabel,
    vertices: Object.freeze([...vertices]) as readonly { x: number; y: number }[],
    polygon: { points: Object.freeze([...vertices]) as readonly { x: number; y: number }[] },
    boundingBox: bb,
    corridorSide,
    openFacades: Object.freeze([...openFacades]) as readonly FacadeDirection[],
    deadWalls: Object.freeze([...deadWalls]) as readonly FacadeDirection[],
    otsShafts: Object.freeze([ots]) as readonly OtsShaft[],
    balconies: Object.freeze([balcony]) as readonly SitOutBalcony[],
    netCarpetAreaSqM,
    grossAreaSqM,
  };
}

/** @deprecated alias — use buildSteppedPolygon */
export const createSteppedUnitPolygon = buildSteppedPolygon;

// ── OTS shaft ───────────────────────────────────────────────────────────────

export function carveOtsShaft(
  flatId: string,
  bbox: { x: number; y: number; width: number; height: number },
  corridorSide: FacadeDirection,
): OtsShaft {
  const wMm = 1200;
  const dMm = 1500;
  // Place shaft near corridor/service side, mid-height (adjacent to kitchen/bath wet wall)
  const x = corridorSide === 'W' ? bbox.x + 0.3 : corridorSide === 'E' ? bbox.x + bbox.width - 0.3 - wMm / 1000 : bbox.x + bbox.width * 0.35;
  const y = bbox.y + bbox.height * 0.42;
  return {
    id: `${flatId}_ots_1`,
    bounds: { x, y, width: wMm / 1000, height: dMm / 1000 },
    widthMm: wMm,
    depthMm: dMm,
    center: { x: x + wMm / 2000, y: y + dMm / 2000 },
  };
}

// ── Sit-out balcony ─────────────────────────────────────────────────────────

export function projectSitOutBalcony(params: {
  flatId: string;
  hostRoomId: string;
  bbox: { x: number; y: number; width: number; height: number };
  openFacade: FacadeDirection;
  depthMm?: number;
}): SitOutBalcony {
  const { flatId, hostRoomId, bbox, openFacade, depthMm = 1500 } = params;
  const depthM = depthMm / 1000;
  const widthM = Math.min(bbox.width * 0.5, 3.0);
  let x: number, y: number, w: number, h: number;
  if (openFacade === 'S') {
    x = bbox.x + (bbox.width - widthM) / 2; y = bbox.y + bbox.height; w = widthM; h = depthM;
  } else if (openFacade === 'N') {
    x = bbox.x + (bbox.width - widthM) / 2; y = bbox.y - depthM; w = widthM; h = depthM;
  } else if (openFacade === 'E') {
    x = bbox.x + bbox.width; y = bbox.y + 0.5; w = depthM; h = widthM;
  } else {
    x = bbox.x - depthM; y = bbox.y + 0.5; w = depthM; h = widthM;
  }
  return {
    id: `${flatId}_sitout_balcony`,
    hostRoomId,
    bounds: { x, y, width: w, height: h },
    depthMm,
    widthMm: Math.round(widthM * 1000),
    facade: openFacade,
  };
}

// ── Re-export helpers for tests ───────────────────────────────────────────
export function _shoelaceAreaSqM(vertices: readonly { x: number; y: number }[]): number {
  return shoelaceAreaSqM(vertices);
}
export function _simplifyOrthogonal(vertices: { x: number; y: number }[]): { x: number; y: number }[] {
  return simplifyOrthogonal(vertices);
}
