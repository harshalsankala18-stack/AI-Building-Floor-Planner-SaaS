/**
 * True Image-to-Editable-CAD Vector Reconstruction — Phase 2.7.
 *
 * Reconstructs a canonical, editable `Building` from the spatial interpretation
 * of ONE accepted master floor-plan image. The image's own arrangement is the
 * only source of topology: room positions, proportions, adjacency, circulation,
 * openings, stairs, parking and outdoor spaces all come from what was read in
 * the drawing.
 *
 * What this module does NOT do, by design:
 * - It never substitutes a deterministic template when reconstruction is hard.
 *   A failure is returned as a failure, with the real reason.
 * - It never silently moves geometry. Every normalization (grid snap, envelope
 *   clamp, overlap resolution) is recorded as a traceable `GeometryAdjustment`
 *   and flagged `material` when it alters the design intent.
 * - It never invents an architectural feature the image did not show. Features
 *   the image contained but conversion could not place are reported in
 *   `unplacedFeatures` instead of being fabricated.
 *
 * Coordinate handling: the interpretation arrives in a fixed normalized frame
 * (see `INTERPRETATION_FRAME`). The drawn content's bounding box is fitted into
 * the buildable envelope with a SINGLE uniform scale, so room proportions and
 * the overall footprint aspect survive the conversion unchanged.
 */

import {
  type Building,
  type BuildingImageProvenance,
  type Direction,
  type Door,
  type EntityImageProvenance,
  type Floor,
  type FloorImageProvenance,
  type GeometryAdjustment,
  type Point,
  type Polygon,
  type Room,
  type SourceImageRegion,
  type Stair,
  type Wall,
  type Window,
  type DesignRequirementSpecification,
  PlotShape,
  RoomType,
  WallType,
  DoorType,
  SwingDirection,
  WindowType,
  StairType,
  createBuilding,
  createRoom,
  createWall,
  createDoor,
  createWindow,
  createStair,
  IMAGE_DERIVED_TAG,
} from '@ai-floor-planner/core';
import {
  StructuralCoordinationEngine,
  clampOpeningPositionOnWall,
  containsPolygon,
  containsPolygonWithTolerance,
  extractedRoomType,
  isValidPolygon,
  pointInPolygonWithTolerance,
  polygonArea,
  polygonIntersectionAreaConcave,
} from '@ai-floor-planner/planning-engine';
import type { ExtractedPlan } from '@ai-floor-planner/planning-engine';

export interface ExtractionSite {
  readonly plotWidth: number;
  readonly plotDepth: number;
  readonly orientation: number;
  readonly roadFacing: string;
  readonly frontSetback: number;
  readonly rearSetback: number;
  readonly leftSetback: number;
  readonly rightSetback: number;
  readonly plannedFloorCount?: number;
}

/** Identity of the master image this conversion is reconstructing. */
export interface ImageSourceIdentity {
  readonly artifactId: string;
  /** sha256 of the exact image bytes. */
  readonly imageHash: string;
  readonly generationRevision: number;
  readonly projectFingerprint: string;
  readonly visionModel?: string;
  readonly interpretationSource: string;
  /** Actual decoded pixel size of the raster. */
  readonly imageWidePixels: number;
  readonly imageTallPixels: number;
}

export interface ImageToCadReconstructionOptions {
  readonly plan: ExtractedPlan;
  readonly rawVisionPayload?: unknown;
  readonly requirements: DesignRequirementSpecification;
  readonly site: ExtractionSite;
  readonly projectId: string;
  readonly projectName: string;
  readonly source: ImageSourceIdentity;
  readonly conversionJobId?: string;
}

/** Outcome of a conversion attempt. Failure carries the real reason. */
export type ImageToCadReconstructionResult =
  | {
      readonly ok: true;
      readonly building: Building;
      readonly provenance: BuildingImageProvenance;
      readonly adjustments: readonly GeometryAdjustment[];
      readonly unplacedFeatures: readonly string[];
    }
  | {
      readonly ok: false;
      readonly errorCode: ImageToCadErrorCode;
      readonly message: string;
      /** What the conversion did manage to read, for the user-facing report. */
      readonly detail: Readonly<Record<string, unknown>>;
    };

export type ImageToCadErrorCode =
  | 'IMAGE_CAD_NO_ROOMS_READ'
  | 'IMAGE_CAD_DEGENERATE_FRAME'
  | 'IMAGE_CAD_BUILDABLE_ENVELOPE_TOO_SMALL'
  | 'IMAGE_CAD_GEOMETRY_COLLAPSED'
  | 'IMAGE_CAD_FOOTPRINT_UNRECOVERABLE'
  | 'IMAGE_CAD_INTERNAL_ERROR';

/** Architectural grid the reconstruction snaps to. */
const GRID_MM = 50;
/** A snap larger than this is reported as materially changing the design. */
const MATERIAL_SNAP_MM = 300;
const EXTERNAL_WALL_THICKNESS = 230;
const INTERNAL_WALL_THICKNESS = 115;
/** Collinearity/overlap tolerance when pairing room edges into shared walls. */
const WALL_PAIR_TOLERANCE_MM = 300;
/**
 * Overlap below this is construction noise, not a planning fault. Matches the
 * threshold the geometry evaluator treats as significant (0.05 m²), so the
 * reconstruction and the acceptance check agree on what counts as an overlap.
 */
const MIN_SIGNIFICANT_OVERLAP_MM2 = 50_000;
/** A carved container must keep at least this much depth to stay a usable room. */
const MIN_CARVED_REMAINDER_MM = 1500;

function snapGrid(value: number): number {
  return Math.round(value / GRID_MM) * GRID_MM;
}

/** Room types that are open/outdoor and must not be treated as enclosed rooms. */
const OPEN_SPACE_TYPES = new Set<string>([
  RoomType.Balcony,
  RoomType.Terrace,
  RoomType.Garden,
  RoomType.OTS,
  RoomType.Porch,
  RoomType.Parking,
  RoomType.ServiceShaft,
]);

/** Map extra vision vocabulary the shared mapper does not cover. */
function resolveRoomType(rawType: string, rawName: string): RoomType {
  const token = `${rawType} ${rawName}`.toLowerCase();
  if (token.includes('ots') || token.includes('open to sky') || token.includes('open-to-sky')) return RoomType.OTS;
  if (token.includes('shaft') || token.includes('duct')) return RoomType.ServiceShaft;
  if (token.includes('dress') || token.includes('wardrobe') || token.includes('walk-in')) return RoomType.Dressing;
  if (token.includes('verandah') || token.includes('veranda') || token.includes('porch') || token.includes('sit-out') || token.includes('sitout')) return RoomType.Porch;
  if (token.includes('lobby') || token.includes('passage') || token.includes('corridor')) return RoomType.Corridor;
  if (token.includes('pooja') || token.includes('puja') || token.includes('temple') || token.includes('mandir')) return RoomType.Pooja;
  if (token.includes('pantry')) return RoomType.Utility;
  if (token.includes('linen') || token.includes('store') || token.includes('storage')) return RoomType.Storage;
  if (token.includes('utility') || token.includes('wash') || token.includes('laundry')) return RoomType.Utility;
  if (token.includes('terrace') || token.includes('deck')) return RoomType.Terrace;
  return extractedRoomType(rawType || rawName);
}

interface ReadEntity {
  readonly id: string;
  readonly name: string;
  readonly type: RoomType;
  readonly floorLevel: number;
  /** Frame-space rectangle exactly as read from the image. */
  readonly frame: { x: number; y: number; width: number; height: number };
  /** Optional explicit polygon boundary in frame coordinates. */
  readonly polygon?: readonly Point[];
  readonly compassZone?: string;
  readonly connectedTo: readonly string[];
  readonly confidence: number;
  readonly kind: 'room' | 'stair' | 'parking';
}

interface PlacedSpace {
  readonly read: ReadEntity;
  rect: Rect;
  polygon?: Polygon;
}

interface PlacedRoom {
  readonly read: ReadEntity;
  readonly room: Room;
}

/** Axis-aligned rectangle in millimetres. */
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function rectToPoly(r: Rect): Polygon {
  return {
    points: [
      { x: r.x, y: r.y },
      { x: r.x + r.width, y: r.y },
      { x: r.x + r.width, y: r.y + r.height },
      { x: r.x, y: r.y + r.height },
    ],
  };
}

function overlapArea(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

function spaceOverlapArea(a: PlacedSpace, b: PlacedSpace): number {
  const boxArea = overlapArea(a.rect, b.rect);
  if (boxArea <= 0) return 0;
  if (!a.polygon && !b.polygon) return boxArea;
  return polygonIntersectionAreaConcave(a.polygon ?? rectToPoly(a.rect), b.polygon ?? rectToPoly(b.rect));
}

/**
 * Clean a polygon's vertex ring: remove consecutive duplicate points, remove a
 * duplicate closing vertex if it repeats `points[0]`, and strip collinear
 * intermediate vertices along straight edges.
 */
export function cleanPolygonPoints(rawPoints: readonly Point[], snapToleranceMm = 1): Point[] {
  const deduped: Point[] = [];
  for (const pt of rawPoints) {
    const prev = deduped[deduped.length - 1];
    if (!prev || Math.hypot(pt.x - prev.x, pt.y - prev.y) > snapToleranceMm) {
      deduped.push({ x: pt.x, y: pt.y });
    }
  }
  while (
    deduped.length > 1 &&
    Math.hypot(deduped[0]!.x - deduped[deduped.length - 1]!.x, deduped[0]!.y - deduped[deduped.length - 1]!.y) <= snapToleranceMm
  ) {
    deduped.pop();
  }
  if (deduped.length < 3) return deduped;

  const simplified: Point[] = [];
  const n = deduped.length;
  for (let i = 0; i < n; i++) {
    const prev = deduped[(i - 1 + n) % n]!;
    const curr = deduped[i]!;
    const next = deduped[(i + 1) % n]!;
    const v1x = curr.x - prev.x;
    const v1y = curr.y - prev.y;
    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;
    const len1 = Math.hypot(v1x, v1y);
    const len2 = Math.hypot(v2x, v2y);
    if (len1 <= snapToleranceMm || len2 <= snapToleranceMm) continue;
    const cross = Math.abs(v1x * v2y - v1y * v2x) / (len1 * len2);
    const dot = (v1x * v2x + v1y * v2y) / (len1 * len2);
    // Collinear continuing in the same direction
    if (cross <= 1e-3 && dot > 0) continue;
    simplified.push(curr);
  }
  return simplified.length >= 3 ? simplified : deduped;
}

/**
 * Synthesize a closed orthogonal polygon footprint around a set of placed spaces
 * on a floor. Preserves L-shaped, U-shaped, T-shaped, H-shaped, cross-shaped,
 * and stepped layouts without collapsing them into a 4-point bounding box,
 * while guaranteeing 100% containment of every space on the floor.
 */
export function computePolygonalFootprintForSpaces(
  spaces: readonly { rect: Rect; polygon?: Polygon }[],
  envelope: Rect,
): Polygon {
  const fallbackBox = (): Polygon => {
    const rects = spaces.map(s => s.rect);
    const box = rects.length > 0 ? boundingBox(rects) : envelope;
    const x1 = snapGrid(Math.max(envelope.x, box.x - EXTERNAL_WALL_THICKNESS));
    const y1 = snapGrid(Math.max(envelope.y, box.y - EXTERNAL_WALL_THICKNESS));
    const x2 = snapGrid(Math.min(envelope.x + envelope.width, box.x + box.width + EXTERNAL_WALL_THICKNESS));
    const y2 = snapGrid(Math.min(envelope.y + envelope.height, box.y + box.height + EXTERNAL_WALL_THICKNESS));
    return { points: [{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 }] };
  };

  if (spaces.length === 0) return fallbackBox();

  const pad = snapGrid(EXTERNAL_WALL_THICKNESS);
  const minEnvX = envelope.x;
  const minEnvY = envelope.y;
  const maxEnvX = envelope.x + envelope.width;
  const maxEnvY = envelope.y + envelope.height;

  const xSet = new Set<number>();
  const ySet = new Set<number>();
  const spacePolys: Polygon[] = [];

  for (const sp of spaces) {
    const poly = sp.polygon && sp.polygon.points.length >= 3 ? sp.polygon : rectToPoly(sp.rect);
    spacePolys.push(poly);
    for (const pt of poly.points) {
      xSet.add(snapGrid(Math.min(maxEnvX, Math.max(minEnvX, pt.x - pad))));
      xSet.add(snapGrid(Math.min(maxEnvX, Math.max(minEnvX, pt.x))));
      xSet.add(snapGrid(Math.min(maxEnvX, Math.max(minEnvX, pt.x + pad))));
      ySet.add(snapGrid(Math.min(maxEnvY, Math.max(minEnvY, pt.y - pad))));
      ySet.add(snapGrid(Math.min(maxEnvY, Math.max(minEnvY, pt.y))));
      ySet.add(snapGrid(Math.min(maxEnvY, Math.max(minEnvY, pt.y + pad))));
    }
  }

  const xs = [...xSet].sort((a, b) => a - b);
  const ys = [...ySet].sort((a, b) => a - b);
  const W = xs.length - 1;
  const H = ys.length - 1;
  if (W <= 0 || H <= 0) return fallbackBox();

  const filled: boolean[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => false));
  for (let iy = 0; iy < H; iy++) {
    const cy = (ys[iy]! + ys[iy + 1]!) / 2;
    for (let ix = 0; ix < W; ix++) {
      const cx = (xs[ix]! + xs[ix + 1]!) / 2;
      for (const poly of spacePolys) {
        if (pointInPolygonWithTolerance({ x: cx, y: cy }, poly.points, pad - 1)) {
          filled[iy]![ix] = true;
          break;
        }
      }
    }
  }

  // Bridge narrow inter-room vision gaps (<= 600mm after wall padding, ~1100mm raw)
  const MAX_BRIDGE_GAP_MM = 600;
  for (let iy = 0; iy < H; iy++) {
    let lastFilled = -1;
    for (let ix = 0; ix < W; ix++) {
      if (filled[iy]![ix]) {
        if (lastFilled >= 0 && ix > lastFilled + 1) {
          const gapMm = xs[ix]! - xs[lastFilled + 1]!;
          if (gapMm <= MAX_BRIDGE_GAP_MM) {
            for (let k = lastFilled + 1; k < ix; k++) filled[iy]![k] = true;
          }
        }
        lastFilled = ix;
      }
    }
  }
  for (let ix = 0; ix < W; ix++) {
    let lastFilled = -1;
    for (let iy = 0; iy < H; iy++) {
      if (filled[iy]![ix]) {
        if (lastFilled >= 0 && iy > lastFilled + 1) {
          const gapMm = ys[iy]! - ys[lastFilled + 1]!;
          if (gapMm <= MAX_BRIDGE_GAP_MM) {
            for (let k = lastFilled + 1; k < iy; k++) filled[k]![ix] = true;
          }
        }
        lastFilled = iy;
      }
    }
  }

  // Connect any remaining disconnected 4-connected components via shortest Manhattan bridge
  const findComponents = (): Array<Array<[number, number]>> => {
    const seen = Array.from({ length: H }, () => Array.from({ length: W }, () => false));
    const comps: Array<Array<[number, number]>> = [];
    const dirs: ReadonlyArray<readonly [number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let iy = 0; iy < H; iy++) {
      for (let ix = 0; ix < W; ix++) {
        if (!filled[iy]![ix] || seen[iy]![ix]) continue;
        const comp: Array<[number, number]> = [];
        const queue: Array<[number, number]> = [[ix, iy]];
        seen[iy]![ix] = true;
        while (queue.length > 0) {
          const [cx, cy] = queue.pop()!;
          comp.push([cx, cy]);
          for (const [dx, dy] of dirs) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx >= 0 && nx < W && ny >= 0 && ny < H && filled[ny]![nx] && !seen[ny]![nx]) {
              seen[ny]![nx] = true;
              queue.push([nx, ny]);
            }
          }
        }
        comps.push(comp);
      }
    }
    return comps;
  };

  let comps = findComponents();
  while (comps.length > 1) {
    const baseComp = comps[0]!;
    let bestA: [number, number] = baseComp[0]!;
    let bestB: [number, number] = comps[1]![0]!;
    let bestDist = Infinity;
    for (let cIdx = 1; cIdx < comps.length; cIdx++) {
      for (const a of baseComp) {
        for (const b of comps[cIdx]!) {
          const d = Math.abs(xs[a[0]]! - xs[b[0]]!) + Math.abs(ys[a[1]]! - ys[b[1]]!);
          if (d < bestDist) {
            bestDist = d;
            bestA = a;
            bestB = b;
          }
        }
      }
    }
    const minIx = Math.min(bestA[0], bestB[0]);
    const maxIx = Math.max(bestA[0], bestB[0]);
    for (let ix = minIx; ix <= maxIx; ix++) filled[bestA[1]]![ix] = true;
    const minIy = Math.min(bestA[1], bestB[1]);
    const maxIy = Math.max(bestA[1], bestB[1]);
    for (let iy = minIy; iy <= maxIy; iy++) filled[iy]![bestB[0]] = true;
    comps = findComponents();
  }

  // Fill interior holes and eliminate 2x2 diagonal checkerboard pinch points
  const fillInteriorHoles = () => {
    const outside = Array.from({ length: H }, () => Array.from({ length: W }, () => false));
    const q: Array<[number, number]> = [];
    for (let iy = 0; iy < H; iy++) {
      for (let ix = 0; ix < W; ix++) {
        if ((ix === 0 || ix === W - 1 || iy === 0 || iy === H - 1) && !filled[iy]![ix]) {
          outside[iy]![ix] = true;
          q.push([ix, iy]);
        }
      }
    }
    const dirs: ReadonlyArray<readonly [number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (q.length > 0) {
      const [cx, cy] = q.pop()!;
      for (const [dx, dy] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx >= 0 && nx < W && ny >= 0 && ny < H && !filled[ny]![nx] && !outside[ny]![nx]) {
          outside[ny]![nx] = true;
          q.push([nx, ny]);
        }
      }
    }
    for (let iy = 0; iy < H; iy++) {
      for (let ix = 0; ix < W; ix++) {
        if (!filled[iy]![ix] && !outside[iy]![ix]) {
          filled[iy]![ix] = true;
        }
      }
    }
  };

  let changed = true;
  let guard = 0;
  while (changed && guard++ < 16) {
    changed = false;
    fillInteriorHoles();
    for (let iy = 0; iy < H - 1; iy++) {
      for (let ix = 0; ix < W - 1; ix++) {
        const a = filled[iy]![ix]!;
        const b = filled[iy]![ix + 1]!;
        const c = filled[iy + 1]![ix]!;
        const d = filled[iy + 1]![ix + 1]!;
        if (a === d && b === c && a !== b) {
          filled[iy]![ix] = true;
          filled[iy]![ix + 1] = true;
          filled[iy + 1]![ix] = true;
          filled[iy + 1]![ix + 1] = true;
          changed = true;
        }
      }
    }
  }
  fillInteriorHoles();

  // Collect directed outer boundary edges
  const ptKey = (p: Point) => `${Math.round(p.x)},${Math.round(p.y)}`;
  const nextEdge = new Map<string, { start: Point; end: Point }>();
  for (let iy = 0; iy < H; iy++) {
    for (let ix = 0; ix < W; ix++) {
      if (!filled[iy]![ix]) continue;
      const x1 = xs[ix]!;
      const x2 = xs[ix + 1]!;
      const y1 = ys[iy]!;
      const y2 = ys[iy + 1]!;
      if (iy === 0 || !filled[iy - 1]![ix]) {
        const start = { x: x1, y: y1 };
        nextEdge.set(ptKey(start), { start, end: { x: x2, y: y1 } });
      }
      if (ix === W - 1 || !filled[iy]![ix + 1]) {
        const start = { x: x2, y: y1 };
        nextEdge.set(ptKey(start), { start, end: { x: x2, y: y2 } });
      }
      if (iy === H - 1 || !filled[iy + 1]![ix]) {
        const start = { x: x2, y: y2 };
        nextEdge.set(ptKey(start), { start, end: { x: x1, y: y2 } });
      }
      if (ix === 0 || !filled[iy]![ix - 1]) {
        const start = { x: x1, y: y2 };
        nextEdge.set(ptKey(start), { start, end: { x: x1, y: y1 } });
      }
    }
  }

  if (nextEdge.size < 4) return fallbackBox();

  // Start at the top-leftmost boundary vertex
  let startEdge = [...nextEdge.values()][0]!;
  for (const edge of nextEdge.values()) {
    if (edge.start.y < startEdge.start.y || (edge.start.y === startEdge.start.y && edge.start.x < startEdge.start.x)) {
      startEdge = edge;
    }
  }

  const loop: Point[] = [];
  const visited = new Set<string>();
  let curr = startEdge.start;
  while (!visited.has(ptKey(curr))) {
    visited.add(ptKey(curr));
    loop.push(curr);
    const e = nextEdge.get(ptKey(curr));
    if (!e) break;
    curr = e.end;
  }

  const cleaned = cleanPolygonPoints(loop);
  if (cleaned.length < 4) return fallbackBox();
  const candidate: Polygon = { points: cleaned };
  if (!isValidPolygon(candidate)) return fallbackBox();
  const containsAll = spacePolys.every(sp => containsPolygonWithTolerance(candidate.points, sp.points, 25));
  return containsAll ? candidate : fallbackBox();
}

/**
 * Measure the maximum protrusion (in mm) of any space polygon outside a
 * candidate footprint polygon. Returns 0 when every space is strictly inside
 * (within 1mm), or Infinity when any space protrudes by more than 600mm.
 */
function measureFootprintProtrusionMm(footprint: Polygon, spacePolys: readonly Polygon[]): number {
  if (spacePolys.every(sp => containsPolygon(footprint, sp) && containsPolygonWithTolerance(footprint.points, sp.points, 1))) {
    return 0;
  }
  const probeSteps = [10, 25, 50, 100, 150, 200, 300, 400, 500, 600];
  for (const tol of probeSteps) {
    if (spacePolys.every(sp => containsPolygonWithTolerance(footprint.points, sp.points, tol))) {
      return tol;
    }
  }
  return Number.POSITIVE_INFINITY;
}

/**
 * Calibrate a stated footprint polygon so that rooms sitting within minor
 * drafting tolerance (<= 600mm) of its edges are strictly contained (within 1mm),
 * preventing false RECONSTRUCTION_ROOM_OUT_OF_BOUNDS failures.
 */
function calibrateFootprintToSpaces(
  stated: Polygon,
  spacePolys: readonly Polygon[],
  envelope: Rect,
): Polygon | null {
  const initialProtrusion = measureFootprintProtrusionMm(stated, spacePolys);
  if (initialProtrusion === 0) return stated;
  if (initialProtrusion > 600) return null;

  // Snap vertices of `stated` that lie near protruding room vertices outward
  const minEnvX = envelope.x;
  const minEnvY = envelope.y;
  const maxEnvX = envelope.x + envelope.width;
  const maxEnvY = envelope.y + envelope.height;
  const pts = stated.points.map(p => ({ x: p.x, y: p.y }));
  const n = pts.length;

  // Adjust axis-aligned boundary segments outward to cover protruding room vertices
  for (let i = 0; i < n; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % n]!;
    if (Math.abs(a.y - b.y) <= GRID_MM) {
      // Horizontal edge
      const segMinX = Math.min(a.x, b.x) - 600;
      const segMaxX = Math.max(a.x, b.x) + 600;
      const yEdge = a.y;
      // Determine whether interior is below (y > yEdge) or above (y < yEdge)
      const midX = (a.x + b.x) / 2;
      const interiorBelow = pointInPolygonWithTolerance({ x: midX, y: yEdge + GRID_MM * 2 }, pts, 1);
      for (const sp of spacePolys) {
        for (const rp of sp.points) {
          if (rp.x < segMinX || rp.x > segMaxX) continue;
          if (interiorBelow && rp.y < yEdge && yEdge - rp.y <= 600) {
            const newY = snapGrid(Math.max(minEnvY, rp.y));
            a.y = newY;
            b.y = newY;
          } else if (!interiorBelow && rp.y > yEdge && rp.y - yEdge <= 600) {
            const newY = snapGrid(Math.min(maxEnvY, rp.y));
            a.y = newY;
            b.y = newY;
          }
        }
      }
    } else if (Math.abs(a.x - b.x) <= GRID_MM) {
      // Vertical edge
      const segMinY = Math.min(a.y, b.y) - 600;
      const segMaxY = Math.max(a.y, b.y) + 600;
      const xEdge = a.x;
      const midY = (a.y + b.y) / 2;
      const interiorRight = pointInPolygonWithTolerance({ x: xEdge + GRID_MM * 2, y: midY }, pts, 1);
      for (const sp of spacePolys) {
        for (const rp of sp.points) {
          if (rp.y < segMinY || rp.y > segMaxY) continue;
          if (interiorRight && rp.x < xEdge && xEdge - rp.x <= 600) {
            const newX = snapGrid(Math.max(minEnvX, rp.x));
            a.x = newX;
            b.x = newX;
          } else if (!interiorRight && rp.x > xEdge && rp.x - xEdge <= 600) {
            const newX = snapGrid(Math.min(maxEnvX, rp.x));
            a.x = newX;
            b.x = newX;
          }
        }
      }
    }
  }

  const cleaned = cleanPolygonPoints(pts);
  if (cleaned.length < 3) return null;
  const candidate: Polygon = { points: cleaned };
  if (!isValidPolygon(candidate)) return null;
  if (measureFootprintProtrusionMm(candidate, spacePolys) <= 25) {
    return candidate;
  }
  return null;
}

/**
 * Read every spatial entity out of the interpretation, in frame coordinates,
 * without altering a single number. Floor assignment uses the level the vision
 * reported; when a multi-floor plan is required but the image showed only one
 * level, the rooms stay on level 0 and the shortfall is reported rather than
 * invented.
 */
function readEntities(
  plan: ExtractedPlan,
  rawPayload: unknown,
  targetFloorCount: number,
): { entities: ReadEntity[]; notes: string[]; aliasIdMap: Map<string, string> } {
  const notes: string[] = [];
  const aliasIdMap = new Map<string, string>();
  const rawObj = (rawPayload && typeof rawPayload === 'object' ? rawPayload : {}) as Record<string, unknown>;
  const rawRooms = Array.isArray(rawObj.rooms) ? (rawObj.rooms as Array<Record<string, unknown>>) : [];
  const rawById = new Map<string, Record<string, unknown>>();
  for (const raw of rawRooms) {
    const id = typeof raw.id === 'string' ? raw.id : undefined;
    if (id) rawById.set(id, raw);
  }

  const entities: ReadEntity[] = [];

  for (const room of plan.rooms) {
    const raw = rawById.get(room.id);
    const parsedLevel = room.floorLevel ?? Number(raw?.floorLevel ?? 0);
    const level = Number.isFinite(parsedLevel) ? Math.max(0, Math.min(targetFloorCount - 1, Math.trunc(parsedLevel))) : 0;
    const confidence = plan.confidence?.[room.id];
    const compassZone = room.compassZone ?? (typeof raw?.compassZone === 'string' ? raw.compassZone : undefined);
    const connectedTo =
      room.connectedTo && room.connectedTo.length > 0
        ? [...room.connectedTo]
        : Array.isArray(raw?.connectedTo)
          ? (raw!.connectedTo as unknown[]).map(String)
          : [];
    const resolvedType = resolveRoomType(room.type, room.name);
    entities.push({
      id: room.id,
      name: room.name,
      type: resolvedType,
      floorLevel: level,
      frame: { x: room.imageX, y: room.imageY, width: room.imageWidth, height: room.imageHeight },
      ...(room.polygon && room.polygon.length >= 3 ? { polygon: room.polygon.map(p => ({ x: p.x, y: p.y })) } : {}),
      ...(compassZone ? { compassZone } : {}),
      connectedTo,
      confidence: confidence === 'confirmed' ? 1 : confidence === 'ambiguous' ? 0.4 : 0.75,
      kind: resolvedType === RoomType.Staircase ? 'stair' : resolvedType === RoomType.Parking ? 'parking' : 'room',
    });
  }

  for (const stair of plan.stairs) {
    const stairLevel = Number.isFinite(stair.floorLevel)
      ? Math.max(0, Math.min(targetFloorCount - 1, Math.trunc(stair.floorLevel!)))
      : 0;
    const stairFrame = { x: stair.imageX, y: stair.imageY, width: stair.imageWidth, height: stair.imageHeight };
    entities.push({
      id: stair.id,
      name: stair.name || 'Staircase',
      type: RoomType.Staircase,
      floorLevel: stairLevel,
      frame: stairFrame,
      connectedTo: [],
      confidence: 0.75,
      kind: 'stair',
    });
  }

  for (const park of plan.parking) {
    const parkFrame = { x: park.imageX, y: park.imageY, width: park.imageWidth, height: park.imageHeight };
    entities.push({
      id: park.id,
      name: park.name || 'Parking',
      type: RoomType.Parking,
      floorLevel: 0,
      frame: parkFrame,
      connectedTo: [],
      confidence: 0.75,
      kind: 'parking',
    });
  }

  const levelsSeen = new Set(entities.map(e => e.floorLevel));
  if (targetFloorCount > 1 && levelsSeen.size === 1) {
    notes.push(
      `The brief asks for ${targetFloorCount} floors but the image showed spaces for only ${levelsSeen.size} level. ` +
        'Upper-floor spaces were NOT invented; add them in the editor or regenerate the image showing every floor.',
    );
  }

  return { entities, notes, aliasIdMap };
}

/** Uniform frame→mm transform that keeps the drawn plan's proportions. */
interface FrameTransform {
  readonly scale: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

/**
 * Fit the drawn content into the buildable envelope with one uniform scale.
 * A single scale factor is what preserves room proportions and the footprint's
 * aspect; separate x/y factors would stretch the architecture to fill the plot.
 */
function computeFrameTransform(
  contentBox: Rect,
  envelope: Rect,
): FrameTransform {
  const scale = Math.min(envelope.width / contentBox.width, envelope.height / contentBox.height);
  const scaledW = contentBox.width * scale;
  const scaledH = contentBox.height * scale;
  return {
    scale,
    offsetX: envelope.x + (envelope.width - scaledW) / 2 - contentBox.x * scale,
    offsetY: envelope.y + (envelope.height - scaledH) / 2 - contentBox.y * scale,
  };
}

function applyTransform(frame: { x: number; y: number; width: number; height: number }, t: FrameTransform): Rect {
  return {
    x: frame.x * t.scale + t.offsetX,
    y: frame.y * t.scale + t.offsetY,
    width: frame.width * t.scale,
    height: frame.height * t.scale,
  };
}

function boundingBox(rects: readonly { x: number; y: number; width: number; height: number }[]): Rect {
  const minX = Math.min(...rects.map(r => r.x));
  const minY = Math.min(...rects.map(r => r.y));
  const maxX = Math.max(...rects.map(r => r.x + r.width));
  const maxY = Math.max(...rects.map(r => r.y + r.height));
  return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}

/** Fraction of the smaller rectangle that must be covered to count as nested. */
const NESTED_COVERAGE = 0.85;

/**
 * Resolve overlaps left by the image read, preferring the smallest possible
 * movement, and record each one.
 *
 * Two different situations have to be told apart, because treating them the
 * same is what produced broken geometry:
 *
 * - NESTED: a small space drawn wholly inside a larger one is an en-suite bath,
 *   a dressing room or a shaft carved OUT of that room. The small space is the
 *   real one; the container must give up the strip it occupies. Shrinking the
 *   small space instead (the obvious "smaller yields" rule) destroys the
 *   bathroom and leaves the overlap in place.
 * - ABUTTING: two rooms whose edges merely interpenetrate by a wall's
 *   thickness. Here the smaller room yields along its shallowest axis.
 *
 * Runs to a fixed point: pulling one room back can expose an overlap with a
 * third. Corrections are kept on the drafting grid so this does not fight the
 * snapping step.
 */
function clampPolygonToRect(polygon: Polygon | undefined, rect: Rect): Polygon | undefined {
  if (!polygon || polygon.points.length < 3) return undefined;
  const clamped = cleanPolygonPoints(
    polygon.points.map(p => ({
      x: snapGrid(Math.min(Math.max(p.x, rect.x), rect.x + rect.width)),
      y: snapGrid(Math.min(Math.max(p.y, rect.y), rect.y + rect.height)),
    })),
  );
  if (clamped.length >= 3 && isValidPolygon({ points: clamped })) {
    return { points: clamped };
  }
  return undefined;
}

function resolveOverlaps(
  placed: PlacedSpace[],
  adjustments: GeometryAdjustment[],
): { resolved: boolean; remaining: number } {
  // Accumulate per-entity movement so one adjustment is reported per room,
  // not one per iteration.
  const moved = new Map<string, { name: string; delta: number; against: Set<string>; carved: boolean }>();
  const note = (entity: ReadEntity, againstName: string, delta: number, carved: boolean) => {
    const record = moved.get(entity.id) ?? { name: entity.name, delta: 0, against: new Set<string>(), carved: false };
    record.delta += delta;
    record.against.add(againstName);
    record.carved = record.carved || carved;
    moved.set(entity.id, record);
  };

  const MAX_PASSES = 16;
  let pass = 0;
  let dirty = true;

  while (dirty && pass < MAX_PASSES) {
    dirty = false;
    pass++;
    // Largest first, so a container is compared against its carve-outs early.
    const order = [...placed].sort((a, b) => b.rect.width * b.rect.height - a.rect.width * a.rect.height);

    for (let i = 0; i < order.length; i++) {
      for (let j = i + 1; j < order.length; j++) {
        const bigger = order[i]!;
        const smaller = order[j]!;
        const area = spaceOverlapArea(smaller, bigger);
        if (area <= MIN_SIGNIFICANT_OVERLAP_MM2) continue;

        const smallerArea = smaller.polygon ? polygonArea(smaller.polygon) : smaller.rect.width * smaller.rect.height;
        const nested = smallerArea > 0 && area / smallerArea >= NESTED_COVERAGE;

        if (nested) {
          // Carve the container back to the nearest free edge of the nested
          // space, choosing the side that costs the container the least while
          // keeping the container above MIN_CARVED_REMAINDER_MM along both axes.
          const cutLeft = smaller.rect.x + smaller.rect.width - bigger.rect.x;
          const cutRight = bigger.rect.x + bigger.rect.width - smaller.rect.x;
          const cutTop = smaller.rect.y + smaller.rect.height - bigger.rect.y;
          const cutBottom = bigger.rect.y + bigger.rect.height - smaller.rect.y;

          const options = [
            { dir: 'left' as const, raw: cutLeft, cut: Math.ceil(cutLeft / GRID_MM) * GRID_MM, remW: bigger.rect.width - Math.ceil(cutLeft / GRID_MM) * GRID_MM, remH: bigger.rect.height },
            { dir: 'right' as const, raw: cutRight, cut: Math.ceil(cutRight / GRID_MM) * GRID_MM, remW: bigger.rect.width - Math.ceil(cutRight / GRID_MM) * GRID_MM, remH: bigger.rect.height },
            { dir: 'top' as const, raw: cutTop, cut: Math.ceil(cutTop / GRID_MM) * GRID_MM, remW: bigger.rect.width, remH: bigger.rect.height - Math.ceil(cutTop / GRID_MM) * GRID_MM },
            { dir: 'bottom' as const, raw: cutBottom, cut: Math.ceil(cutBottom / GRID_MM) * GRID_MM, remW: bigger.rect.width, remH: bigger.rect.height - Math.ceil(cutBottom / GRID_MM) * GRID_MM },
          ].filter(o => Number.isFinite(o.raw) && o.raw > 0);

          if (options.length === 0) continue;

          const validFull = options.filter(o => o.remW >= MIN_CARVED_REMAINDER_MM && o.remH >= MIN_CARVED_REMAINDER_MM);
          const validRelaxed = options.filter(o => o.remW >= 900 && o.remH >= 900);
          const chosenPool = validFull.length > 0 ? validFull : validRelaxed;

          if (chosenPool.length === 0) {
            // Neither space can fully absorb the other without collapsing: split along the longer shared axis
            if (bigger.rect.width >= bigger.rect.height) {
              const splitW = snapGrid(Math.max(800, Math.floor(bigger.rect.width / 2)));
              const oldX = bigger.rect.x;
              const totalW = bigger.rect.width;
              smaller.rect.x = oldX;
              smaller.rect.width = splitW;
              bigger.rect.x = oldX + splitW;
              bigger.rect.width = Math.max(800, totalW - splitW);
              smaller.polygon = clampPolygonToRect(smaller.polygon, smaller.rect);
              bigger.polygon = clampPolygonToRect(bigger.polygon, bigger.rect);
              note(bigger.read, smaller.read.name, splitW, true);
            } else {
              const splitH = snapGrid(Math.max(800, Math.floor(bigger.rect.height / 2)));
              const oldY = bigger.rect.y;
              const totalH = bigger.rect.height;
              smaller.rect.y = oldY;
              smaller.rect.height = splitH;
              bigger.rect.y = oldY + splitH;
              bigger.rect.height = Math.max(800, totalH - splitH);
              smaller.polygon = clampPolygonToRect(smaller.polygon, smaller.rect);
              bigger.polygon = clampPolygonToRect(bigger.polygon, bigger.rect);
              note(bigger.read, smaller.read.name, splitH, true);
            }
            dirty = true;
            continue;
          }

          chosenPool.sort((a, b) => a.cut - b.cut);
          const bestChoice = chosenPool[0]!;
          const cut = bestChoice.cut;

          if (bestChoice.dir === 'left') {
            bigger.rect.x += cut;
            bigger.rect.width -= cut;
          } else if (bestChoice.dir === 'right') {
            bigger.rect.width -= cut;
          } else if (bestChoice.dir === 'top') {
            bigger.rect.y += cut;
            bigger.rect.height -= cut;
          } else {
            bigger.rect.height -= cut;
          }
          bigger.polygon = clampPolygonToRect(bigger.polygon, bigger.rect);
          note(bigger.read, smaller.read.name, cut, true);
          dirty = true;
          continue;
        }

        // Abutting: the smaller room yields along its shallowest penetration
        // that keeps both dimensions usable (>= 750 mm).
        const penLeft = bigger.rect.x + bigger.rect.width - smaller.rect.x;
        const penRight = smaller.rect.x + smaller.rect.width - bigger.rect.x;
        const penTop = bigger.rect.y + bigger.rect.height - smaller.rect.y;
        const penBottom = smaller.rect.y + smaller.rect.height - bigger.rect.y;

        const penOptions = [
          { dir: 'left' as const, pen: penLeft, cut: Math.ceil(penLeft / GRID_MM) * GRID_MM, rem: smaller.rect.width - Math.ceil(penLeft / GRID_MM) * GRID_MM },
          { dir: 'right' as const, pen: penRight, cut: Math.ceil(penRight / GRID_MM) * GRID_MM, rem: smaller.rect.width - Math.ceil(penRight / GRID_MM) * GRID_MM },
          { dir: 'top' as const, pen: penTop, cut: Math.ceil(penTop / GRID_MM) * GRID_MM, rem: smaller.rect.height - Math.ceil(penTop / GRID_MM) * GRID_MM },
          { dir: 'bottom' as const, pen: penBottom, cut: Math.ceil(penBottom / GRID_MM) * GRID_MM, rem: smaller.rect.height - Math.ceil(penBottom / GRID_MM) * GRID_MM },
        ].filter(o => Number.isFinite(o.pen) && o.pen > 0);

        if (penOptions.length === 0) continue;
        const usablePen = penOptions.filter(o => o.rem >= 750);
        const penPool = usablePen.length > 0 ? usablePen : penOptions;
        penPool.sort((a, b) => a.cut - b.cut);
        const chosenPen = penPool[0]!;
        const cut = chosenPen.cut;

        if (chosenPen.dir === 'left') {
          smaller.rect.x += cut;
          smaller.rect.width = Math.max(GRID_MM, smaller.rect.width - cut);
        } else if (chosenPen.dir === 'right') {
          smaller.rect.width = Math.max(GRID_MM, smaller.rect.width - cut);
        } else if (chosenPen.dir === 'top') {
          smaller.rect.y += cut;
          smaller.rect.height = Math.max(GRID_MM, smaller.rect.height - cut);
        } else {
          smaller.rect.height = Math.max(GRID_MM, smaller.rect.height - cut);
        }
        smaller.polygon = clampPolygonToRect(smaller.polygon, smaller.rect);
        note(smaller.read, bigger.read.name, cut, false);
        dirty = true;
      }
    }
  }

  for (const [entityId, record] of moved) {
    const names = [...record.against].map(n => `"${n}"`).join(', ');
    adjustments.push({
      entityId,
      entityName: record.name,
      kind: 'resolve_overlap',
      description: record.carved
        ? `${names} overlapped and is drawn inside "${record.name}" in the image, so "${record.name}" was carved back by ${Math.round(record.delta)} mm to host it as a separate space.`
        : `"${record.name}" overlapped ${names} as read from the image; its boundary was pulled back by ${Math.round(record.delta)} mm in total.`,
      material: record.delta > MATERIAL_SNAP_MM,
      deltaMm: Math.round(record.delta),
    });
  }

  // Report whether anything is still overlapping, so the caller never assumes.
  let remaining = 0;
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      if (spaceOverlapArea(placed[i]!, placed[j]!) > MIN_SIGNIFICANT_OVERLAP_MM2) remaining++;
    }
  }
  return { resolved: remaining === 0, remaining };
}

/**
 * Close small vision wall-thickness gaps (<= 300mm) between adjacent rectangular
 * spaces on the same floor when doing so introduces zero new overlaps.
 */
function closeSmallInterRoomGaps(placed: PlacedSpace[]): void {
  const MAX_GAP_MM = 300;
  const MIN_SHARED_SPAN_MM = 600;

  for (let i = 0; i < placed.length; i++) {
    const a = placed[i]!;
    if (a.polygon) continue;
    for (let j = 0; j < placed.length; j++) {
      if (i === j) continue;
      const b = placed[j]!;
      if (b.polygon) continue;

      // Check horizontal gap: a is to the left of b
      const gapX = b.rect.x - (a.rect.x + a.rect.width);
      const overlapY = Math.min(a.rect.y + a.rect.height, b.rect.y + b.rect.height) - Math.max(a.rect.y, b.rect.y);
      if (gapX > 0 && gapX <= MAX_GAP_MM && overlapY >= MIN_SHARED_SPAN_MM) {
        const candidateRect: Rect = { ...a.rect, width: a.rect.width + gapX };
        const causesOverlap = placed.some((c, k) => k !== i && overlapArea(candidateRect, c.rect) > 0);
        if (!causesOverlap) {
          a.rect.width += gapX;
        }
      }

      // Check vertical gap: a is above b
      const gapY = b.rect.y - (a.rect.y + a.rect.height);
      const overlapX = Math.min(a.rect.x + a.rect.width, b.rect.x + b.rect.width) - Math.max(a.rect.x, b.rect.x);
      if (gapY > 0 && gapY <= MAX_GAP_MM && overlapX >= MIN_SHARED_SPAN_MM) {
        const candidateRect: Rect = { ...a.rect, height: a.rect.height + gapY };
        const causesOverlap = placed.some((c, k) => k !== i && overlapArea(candidateRect, c.rect) > 0);
        if (!causesOverlap) {
          a.rect.height += gapY;
        }
      }
    }
  }
}

interface WallCandidate {
  start: Point;
  end: Point;
  readonly roomIds: string[];
  isExternal: boolean;
  /** True while this edge is known only to open/outdoor spaces. */
  openOnly: boolean;
}

function isHorizontal(a: Point, b: Point): boolean {
  return Math.abs(a.y - b.y) <= GRID_MM && Math.abs(a.x - b.x) > GRID_MM;
}

function isVertical(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) <= GRID_MM && Math.abs(a.y - b.y) > GRID_MM;
}

/** Pair collinear, overlapping room edges (horizontal, vertical, or angled) so shared partitions become one wall. */
function sharedEdge(a: WallCandidate, b: WallCandidate): boolean {
  const aH = isHorizontal(a.start, a.end);
  const bH = isHorizontal(b.start, b.end);
  const aV = isVertical(a.start, a.end);
  const bV = isVertical(b.start, b.end);

  if (aH && bH) {
    if (Math.abs(a.start.y - b.start.y) > WALL_PAIR_TOLERANCE_MM) return false;
    const [a1, a2] = [Math.min(a.start.x, a.end.x), Math.max(a.start.x, a.end.x)];
    const [b1, b2] = [Math.min(b.start.x, b.end.x), Math.max(b.start.x, b.end.x)];
    return Math.min(a2, b2) - Math.max(a1, b1) > GRID_MM;
  }
  if (aV && bV) {
    if (Math.abs(a.start.x - b.start.x) > WALL_PAIR_TOLERANCE_MM) return false;
    const [a1, a2] = [Math.min(a.start.y, a.end.y), Math.max(a.start.y, a.end.y)];
    const [b1, b2] = [Math.min(b.start.y, b.end.y), Math.max(b.start.y, b.end.y)];
    return Math.min(a2, b2) - Math.max(a1, b1) > GRID_MM;
  }
  if (!aH && !aV && !bH && !bV) {
    const lenA = Math.hypot(a.end.x - a.start.x, a.end.y - a.start.y);
    const lenB = Math.hypot(b.end.x - b.start.x, b.end.y - b.start.y);
    if (lenA <= GRID_MM || lenB <= GRID_MM) return false;
    const uxA = (a.end.x - a.start.x) / lenA;
    const uyA = (a.end.y - a.start.y) / lenA;
    const uxB = (b.end.x - b.start.x) / lenB;
    const uyB = (b.end.y - b.start.y) / lenB;
    // Must be parallel within ~5 degrees
    if (Math.abs(uxA * uyB - uyA * uxB) > 0.09) return false;
    // Perpendicular distance between lines must be within tolerance
    const perpDist = Math.abs((b.start.x - a.start.x) * uyA - (b.start.y - a.start.y) * uxA);
    if (perpDist > WALL_PAIR_TOLERANCE_MM) return false;
    // Projections onto line A must overlap by > GRID_MM
    const projB1 = (b.start.x - a.start.x) * uxA + (b.start.y - a.start.y) * uyA;
    const projB2 = (b.end.x - a.start.x) * uxA + (b.end.y - a.start.y) * uyA;
    const minB = Math.min(projB1, projB2);
    const maxB = Math.max(projB1, projB2);
    return Math.min(lenA, maxB) - Math.max(0, minB) > GRID_MM;
  }
  return false;
}

/** Distance from a point to a segment, used to host openings on real walls. */
function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function projectOntoSegment(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { x: a.x, y: a.y };
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return { x: a.x + t * dx, y: a.y + t * dy };
}

/**
 * Reconstruct an editable canonical Building from one accepted master image.
 * Returns a typed failure instead of substituting unrelated geometry.
 */
export function reconstructBuildingFromImage(
  options: ImageToCadReconstructionOptions,
): ImageToCadReconstructionResult {
  const { plan, rawVisionPayload, requirements, site, projectId, projectName, source } = options;
  const conversionJobId = options.conversionJobId ?? `cadjob_${Date.now().toString(36)}`;
  const geometryRevisionId = `geomrev_${source.artifactId}_${conversionJobId}`;

  try {
    const frameWidth = plan.metadata.frameWidth > 0 ? plan.metadata.frameWidth : plan.metadata.imageWidePixels;
    const frameHeight = plan.metadata.frameHeight > 0 ? plan.metadata.frameHeight : plan.metadata.imageTallPixels;
    if (!(frameWidth > 0) || !(frameHeight > 0)) {
      return {
        ok: false,
        errorCode: 'IMAGE_CAD_DEGENERATE_FRAME',
        message:
          'The interpretation did not declare a usable coordinate frame, so image coordinates cannot be mapped to millimetres. No CAD geometry was produced.',
        detail: { frameWidth, frameHeight },
      };
    }

    const adjustments: GeometryAdjustment[] = [];
    const unplacedFeatures: string[] = [];

    // ── Floor count comes from the brief and from what the image actually shows.
    const rawObj = (rawVisionPayload && typeof rawVisionPayload === 'object' ? rawVisionPayload : {}) as Record<string, unknown>;
    const rawRooms = Array.isArray(rawObj.rooms) ? (rawObj.rooms as Array<Record<string, unknown>>) : [];
    const maxVisionLevel = rawRooms.reduce((max, r) => {
      const lvl = Number(r.floorLevel);
      return Number.isFinite(lvl) ? Math.max(max, Math.trunc(lvl)) : max;
    }, 0);
    const targetFloorCount = Math.max(
      1,
      requirements.hard.floorsCount || 1,
      site.plannedFloorCount || 1,
      maxVisionLevel + 1,
    );

    const { entities, notes, aliasIdMap } = readEntities(plan, rawVisionPayload, targetFloorCount);
    unplacedFeatures.push(...notes);

    if (entities.length === 0) {
      return {
        ok: false,
        errorCode: 'IMAGE_CAD_NO_ROOMS_READ',
        message:
          'The image interpretation contained no spatial entities, so there is nothing to reconstruct. The accepted image was not replaced and no substitute plan was created.',
        detail: { visionRooms: plan.rooms.length },
      };
    }

    // ── Buildable envelope (setbacks are authoritative).
    const minEnvX = Math.ceil(site.leftSetback / GRID_MM) * GRID_MM;
    const minEnvY = Math.ceil(site.frontSetback / GRID_MM) * GRID_MM;
    const maxEnvX = Math.floor((site.plotWidth - site.rightSetback) / GRID_MM) * GRID_MM;
    const maxEnvY = Math.floor((site.plotDepth - site.rearSetback) / GRID_MM) * GRID_MM;
    const envelope: Rect = {
      x: minEnvX,
      y: minEnvY,
      width: Math.max(0, maxEnvX - minEnvX),
      height: Math.max(0, maxEnvY - minEnvY),
    };
    if (envelope.width < 2000 || envelope.height < 2000) {
      return {
        ok: false,
        errorCode: 'IMAGE_CAD_BUILDABLE_ENVELOPE_TOO_SMALL',
        message: `The buildable envelope after setbacks is ${Math.round(envelope.width)}×${Math.round(envelope.height)} mm, too small to host a reconstructed plan. Check plot dimensions and setbacks.`,
        detail: { envelope, site },
      };
    }

    // ── Global fallback transform and per-floor independent transforms (`transformByLevel`)
    //    so multi-floor sheets (stacked vertically or side-by-side) map each floor
    //    into the same (X, Y) buildable envelope rather than displacing Floor 1 to the rear of the plot.
    const contentRects = entities.map(e => e.frame);
    const boundaryPoints = plan.boundary.points;
    const contentBox = boundingBox([
      ...contentRects,
      ...(boundaryPoints.length >= 3
        ? [boundingBox(boundaryPoints.map(p => ({ x: p.x, y: p.y, width: 0.0001, height: 0.0001 })))]
        : []),
    ]);
    const transform = computeFrameTransform(contentBox, envelope);
    const transformByLevel = new Map<number, FrameTransform>();
    const populatedLevels = new Set(entities.map(e => e.floorLevel));
    const isMultiFloorDrawing = populatedLevels.size > 1;

    // ── Place every entity where the image drew it, then clamp, de-overlap and
    //    snap. This happens BEFORE the footprint is fixed, so the outline can
    //    be checked against the geometry it has to contain.
    const placedByLevel = new Map<number, PlacedSpace[]>();
    for (let level = 0; level < targetFloorCount; level++) {
      const levelEntities = entities.filter(e => e.floorLevel === level);
      if (levelEntities.length === 0) {
        transformByLevel.set(level, transform);
        placedByLevel.set(level, []);
        continue;
      }

      const levelEntityBox = boundingBox(levelEntities.map(e => e.frame));
      const floorRegion = plan.floors?.find(f => f.level === level);
      let levelContentBox = levelEntityBox;
      if (!isMultiFloorDrawing) {
        levelContentBox = contentBox;
      } else if (floorRegion?.boundary?.points && floorRegion.boundary.points.length >= 3) {
        const fbBox = boundingBox(floorRegion.boundary.points.map(p => ({ x: p.x, y: p.y, width: 0.0001, height: 0.0001 })));
        if (fbBox.height <= levelEntityBox.height * 1.4 && fbBox.width <= levelEntityBox.width * 1.4) {
          levelContentBox = boundingBox([levelEntityBox, fbBox]);
        }
      } else if (level === 0 && boundaryPoints.length >= 3) {
        const bBox = boundingBox(boundaryPoints.map(p => ({ x: p.x, y: p.y, width: 0.0001, height: 0.0001 })));
        if (bBox.height <= levelEntityBox.height * 1.4 && bBox.width <= levelEntityBox.width * 1.4) {
          levelContentBox = boundingBox([levelEntityBox, bBox]);
        }
      }
      const levelTransform = computeFrameTransform(levelContentBox, envelope);
      transformByLevel.set(level, levelTransform);

      const placed: PlacedSpace[] = levelEntities.map(read => {
        const rect = applyTransform(read.frame, levelTransform);
        let polygon: Polygon | undefined;
        if (read.polygon && read.polygon.length >= 3) {
          const transformedPts = cleanPolygonPoints(
            read.polygon.map(p => ({
              x: snapGrid(Math.min(Math.max(p.x * levelTransform.scale + levelTransform.offsetX, envelope.x), envelope.x + envelope.width)),
              y: snapGrid(Math.min(Math.max(p.y * levelTransform.scale + levelTransform.offsetY, envelope.y), envelope.y + envelope.height)),
            })),
          );
          if (transformedPts.length >= 3 && isValidPolygon({ points: transformedPts })) {
            polygon = { points: transformedPts };
          }
        }
        return { read, rect, ...(polygon ? { polygon } : {}) };
      });

      // Clamp into the envelope, recording any movement.
      for (const item of placed) {
        const before = { ...item.rect };
        item.rect.width = Math.min(item.rect.width, envelope.width);
        item.rect.height = Math.min(item.rect.height, envelope.height);
        item.rect.x = Math.min(Math.max(item.rect.x, envelope.x), envelope.x + envelope.width - item.rect.width);
        item.rect.y = Math.min(Math.max(item.rect.y, envelope.y), envelope.y + envelope.height - item.rect.height);
        item.polygon = clampPolygonToRect(item.polygon, item.rect);
        const moved = Math.hypot(item.rect.x - before.x, item.rect.y - before.y);
        const resized = Math.abs(item.rect.width - before.width) + Math.abs(item.rect.height - before.height);
        if (moved > GRID_MM || resized > GRID_MM) {
          adjustments.push({
            entityId: item.read.id,
            entityName: item.read.name,
            kind: 'clamp_to_envelope',
            description: `"${item.read.name}" extended past the buildable envelope as read from the image and was pulled inside by ${Math.round(moved)} mm.`,
            material: moved > MATERIAL_SNAP_MM || resized > MATERIAL_SNAP_MM,
            deltaMm: Math.round(Math.max(moved, resized)),
          });
        }
      }

      resolveOverlaps(placed, adjustments);

      // Grid snap last, so snapping cannot reintroduce an overlap.
      for (const item of placed) {
        const before = { ...item.rect };
        item.rect.x = snapGrid(item.rect.x);
        item.rect.y = snapGrid(item.rect.y);
        item.rect.width = Math.max(GRID_MM, snapGrid(item.rect.width));
        item.rect.height = Math.max(GRID_MM, snapGrid(item.rect.height));
        // Keep the snapped rectangle inside the envelope.
        item.rect.x = Math.min(Math.max(item.rect.x, envelope.x), envelope.x + envelope.width - item.rect.width);
        item.rect.y = Math.min(Math.max(item.rect.y, envelope.y), envelope.y + envelope.height - item.rect.height);
        item.polygon = clampPolygonToRect(item.polygon, item.rect);
        const delta = Math.max(
          Math.abs(item.rect.x - before.x),
          Math.abs(item.rect.y - before.y),
          Math.abs(item.rect.width - before.width),
          Math.abs(item.rect.height - before.height),
        );
        if (delta >= GRID_MM) {
          adjustments.push({
            entityId: item.read.id,
            entityName: item.read.name,
            kind: 'snap_to_grid',
            description: `"${item.read.name}" was snapped to the ${GRID_MM} mm drafting grid (${Math.round(delta)} mm).`,
            material: delta > MATERIAL_SNAP_MM,
            deltaMm: Math.round(delta),
          });
        }
      }

      // Snapping and the envelope clamp can nudge rectangles back together;
      // settle once more and report anything still overlapping instead of
      // letting the acceptance gate discover it.
      const settled = resolveOverlaps(placed, adjustments);
      if (!settled.resolved) {
        unplacedFeatures.push(
          `${settled.remaining} pair(s) of spaces on level ${level} still overlap after conversion; the image's own room boundaries could not be separated cleanly. Compare against the reference image and adjust in the editor.`,
        );
      } else {
        closeSmallInterRoomGaps(placed);
      }

      placedByLevel.set(level, placed);
    }

    // ── Align vertical staircase cores across Ground Floor and upper floors
    //    when independent floor drawings introduced slight horizontal jitter.
    if (targetFloorCount > 1) {
      const gfSpaces = placedByLevel.get(0) ?? [];
      const gfStairs = gfSpaces.filter(s => s.read.type === RoomType.Staircase);
      if (gfStairs.length > 0) {
        for (let level = 1; level < targetFloorCount; level++) {
          const upperSpaces = placedByLevel.get(level) ?? [];
          const usedGfStairs = new Set<PlacedSpace>();
          for (const upperStair of upperSpaces.filter(s => s.read.type === RoomType.Staircase)) {
            const uCx = upperStair.rect.x + upperStair.rect.width / 2;
            const uCy = upperStair.rect.y + upperStair.rect.height / 2;
            let bestGf: PlacedSpace | null = null;
            let bestDist = Number.POSITIVE_INFINITY;
            for (const gfStair of gfStairs) {
              if (usedGfStairs.has(gfStair)) continue;
              const gCx = gfStair.rect.x + gfStair.rect.width / 2;
              const gCy = gfStair.rect.y + gfStair.rect.height / 2;
              const d = Math.hypot(uCx - gCx, uCy - gCy);
              if (d < bestDist) {
                bestDist = d;
                bestGf = gfStair;
              }
            }
            if (bestGf && bestDist > 0 && bestDist <= 3500) {
              usedGfStairs.add(bestGf);
              const snapshot = upperSpaces.map(s => ({ rect: { ...s.rect }, polygon: s.polygon ? { points: s.polygon.points.map(p => ({ ...p })) } : undefined }));
              const trialAdjustments: GeometryAdjustment[] = [];
              upperStair.rect = { ...bestGf.rect };
              upperStair.polygon = bestGf.polygon ? { points: bestGf.polygon.points.map(p => ({ ...p })) } : undefined;
              const reSettled = resolveOverlaps(upperSpaces, trialAdjustments);
              const allUsable = upperSpaces.every(s => s.rect.width >= 750 && s.rect.height >= 750);
              if (reSettled.resolved && allUsable) {
                closeSmallInterRoomGaps(upperSpaces);
                adjustments.push(...trialAdjustments);
              } else {
                // Restore snapshot if alignment would conflict with upper-floor rooms
                for (let idx = 0; idx < upperSpaces.length; idx++) {
                  upperSpaces[idx]!.rect = snapshot[idx]!.rect;
                  upperSpaces[idx]!.polygon = snapshot[idx]!.polygon;
                }
              }
            }
          }
        }
      }
    }

    // ── Footprint: preserve non-rectangular shapes (L, U, T, H, Cross, V, Stepped)
    //    per floor (`footprintByLevel`) and record per-floor provenance (`floorProvenanceList`).
    //    Never silently collapse an explicit irregular footprint into a 4-point rectangle.
    const allPlacedSpaces = [...placedByLevel.values()].flat();
    const footprintByLevel = new Map<number, Polygon>();
    const floorProvenanceList: FloorImageProvenance[] = [];

    for (let level = 0; level < targetFloorCount; level++) {
      const levelSpaces = placedByLevel.get(level) ?? [];
      const levelTransform = transformByLevel.get(level) ?? transform;
      const floorName = level === 0 ? 'Ground Floor' : level === 1 ? 'First Floor' : `Floor ${level}`;
      const floorRegion = plan.floors?.find(f => f.level === level);
      const referenceSpaces = levelSpaces.length > 0 ? levelSpaces : allPlacedSpaces;
      const contourFootprint = computePolygonalFootprintForSpaces(referenceSpaces, envelope);

      let rawLevelBoundary: readonly Point[] | null = null;
      let statedSourceKind: 'stated_floor_boundary' | 'stated_plan_boundary' = 'stated_plan_boundary';
      if (floorRegion?.boundary?.points && floorRegion.boundary.points.length >= 3) {
        rawLevelBoundary = floorRegion.boundary.points;
        statedSourceKind = 'stated_floor_boundary';
      } else if ((level === 0 || !isMultiFloorDrawing) && boundaryPoints.length >= 3) {
        rawLevelBoundary = boundaryPoints;
        statedSourceKind = 'stated_plan_boundary';
      }

      let chosenFootprint: Polygon = contourFootprint;
      let chosenSource: FloorImageProvenance['footprintSource'] = 'polygonal_room_contour';

      if (levelSpaces.length === 0 && level > 0) {
        chosenFootprint = footprintByLevel.get(0) ?? contourFootprint;
        chosenSource = 'polygonal_room_contour';
      } else if (!rawLevelBoundary) {
        chosenFootprint = contourFootprint;
        chosenSource = 'polygonal_room_contour';
        if (level === 0) {
          unplacedFeatures.push(
            'The image interpretation returned no building outline, so a polygonal contour was synthesized from the drawn spaces.',
          );
        }
      } else {
        const cleanedStatedPts = cleanPolygonPoints(
          rawLevelBoundary.map(p => ({
            x: snapGrid(Math.min(Math.max(p.x * levelTransform.scale + levelTransform.offsetX, envelope.x), envelope.x + envelope.width)),
            y: snapGrid(Math.min(Math.max(p.y * levelTransform.scale + levelTransform.offsetY, envelope.y), envelope.y + envelope.height)),
          })),
        );
        const statedPoly: Polygon | null =
          cleanedStatedPts.length >= 3 && isValidPolygon({ points: cleanedStatedPts })
            ? { points: cleanedStatedPts }
            : null;
        const spacePolys = referenceSpaces.map(s => s.polygon ?? rectToPoly(s.rect));
        const protrusion = statedPoly ? measureFootprintProtrusionMm(statedPoly, spacePolys) : Number.POSITIVE_INFINITY;
        const calibrated = statedPoly ? calibrateFootprintToSpaces(statedPoly, spacePolys, envelope) : null;

        if (calibrated) {
          // If the stated boundary was a generic 4-point bounding box while the
          // rooms genuinely form an irregular (>= 6 vertices) polygon occupying
          // < 92% of that box, upgrade to the polygonal room contour.
          const isGenericBoxOverIrregularRooms =
            calibrated.points.length === 4 &&
            contourFootprint.points.length >= 6 &&
            polygonArea(contourFootprint) < polygonArea(calibrated) * 0.92;

          if (isGenericBoxOverIrregularRooms) {
            chosenFootprint = contourFootprint;
            chosenSource = 'polygonal_room_contour';
            adjustments.push({
              entityId: `footprint_L${level}`,
              entityName: `${floorName} footprint`,
              kind: 'calibrate_footprint',
              description: `Upgraded generic 4-point bounding box on ${floorName} to a ${contourFootprint.points.length}-vertex polygonal contour matching the irregular room arrangement.`,
              material: false,
            });
          } else {
            chosenFootprint = calibrated;
            chosenSource = statedSourceKind;
            if (protrusion > 0) {
              adjustments.push({
                entityId: `footprint_L${level}`,
                entityName: `${floorName} footprint`,
                kind: 'calibrate_footprint',
                description: `Calibrated ${floorName} footprint edges by up to ${Math.round(protrusion)} mm so every reconstructed room sits strictly inside the floor boundary.`,
                material: protrusion > MATERIAL_SNAP_MM,
                deltaMm: Math.round(protrusion),
              });
            }
          }
        } else {
          // Stated boundary is invalid or excludes rooms by > 600mm.
          // If the stated boundary declared an explicit irregular shape (>= 5 vertices)
          // and the room contour collapses to a 4-point rectangle, fail explicitly
          // rather than silently replacing an irregular footprint with a rectangular box.
          const declaredIrregular = rawLevelBoundary.length >= 5;
          if (declaredIrregular && contourFootprint.points.length <= 4) {
            return {
              ok: false,
              errorCode: 'IMAGE_CAD_FOOTPRINT_UNRECOVERABLE',
              message: `The image declared a ${rawLevelBoundary.length}-vertex irregular footprint on ${floorName}, but the polygon is invalid or contradicts the extracted spaces and cannot be recovered without collapsing to a rectangle.`,
              detail: {
                level,
                floorName,
                declaredVertexCount: rawLevelBoundary.length,
                contourVertexCount: contourFootprint.points.length,
              },
            };
          }

          chosenFootprint = contourFootprint;
          chosenSource = 'polygonal_room_contour';
          unplacedFeatures.push(
            `The outline read for ${floorName} excluded drawn spaces or was self-intersecting, so a ${contourFootprint.points.length}-vertex polygonal footprint was synthesized from the spaces on ${floorName}.`,
          );
          adjustments.push({
            entityId: `footprint_L${level}`,
            entityName: `${floorName} footprint`,
            kind: 'calibrate_footprint',
            description: `Synthesized a ${contourFootprint.points.length}-vertex footprint from the spaces on ${floorName} because the interpreted outline did not enclose all drawn spaces.`,
            material: true,
          });
        }
      }

      footprintByLevel.set(level, chosenFootprint);
      floorProvenanceList.push({
        level,
        floorName,
        ...(floorRegion
          ? {
              sourceImageRegion: {
                x: floorRegion.region.x,
                y: floorRegion.region.y,
                width: floorRegion.region.width,
                height: floorRegion.region.height,
                frameWidth,
                frameHeight,
              },
            }
          : {}),
        scaleMmPerUnitX: levelTransform.scale,
        scaleMmPerUnitY: levelTransform.scale,
        footprintVertexCount: chosenFootprint.points.length,
        footprintSource: chosenSource,
      });
    }

    const footprint: Polygon = footprintByLevel.get(0) ?? computePolygonalFootprintForSpaces(allPlacedSpaces, envelope);

    const canonicalBuildingId = `bldg_${projectId}`;
    const base = createBuilding({
      projectId,
      name: projectName,
      site: {
        plotWidth: site.plotWidth,
        plotDepth: site.plotDepth,
        plotShape: PlotShape.Rectangular,
        orientation: site.orientation,
        roadFacing: site.roadFacing as Direction,
        setbacks: {
          front: site.frontSetback,
          rear: site.rearSetback,
          left: site.leftSetback,
          right: site.rightSetback,
        },
        plannedFloorCount: targetFloorCount,
      },
      floors: Array.from({ length: targetFloorCount }).map((_, level) => ({
        buildingId: canonicalBuildingId,
        level,
        name: level === 0 ? 'Ground Floor' : level === 1 ? 'First Floor' : `Floor ${level}`,
        boundary: footprintByLevel.get(level) ?? footprint,
      })),
    });

    const entityProvenance = (read: ReadEntity): EntityImageProvenance => ({
      sourceImageArtifactId: source.artifactId,
      sourceImageHash: source.imageHash,
      sourceGenerationRevision: source.generationRevision,
      sourceProjectFingerprint: source.projectFingerprint,
      conversionJobId,
      geometryRevisionId,
      sourceImageRegion: {
        x: read.frame.x,
        y: read.frame.y,
        width: read.frame.width,
        height: read.frame.height,
        frameWidth,
        frameHeight,
      } satisfies SourceImageRegion,
      extractionConfidence: read.confidence,
      sourceEntityId: read.id,
    });

    const floors: Floor[] = [];
    const placedByFloor = new Map<number, PlacedRoom[]>();

    for (let level = 0; level < targetFloorCount; level++) {
      const baseFloor = base.floors[level]!;
      const floorId = baseFloor.id;
      // Geometry was placed, clamped, de-overlapped and snapped above.
      const placed = placedByLevel.get(level) ?? [];

      if (placed.length === 0) {
        floors.push(baseFloor);
        placedByFloor.set(level, []);
        continue;
      }

      const floorBox = boundingBox(placed.map(p => p.rect));
      const inferCompassZone = (r: Rect, explicit?: string): string => {
        if (explicit && explicit.trim().length > 0) return explicit.trim().toUpperCase();
        const cx = (r.x + r.width / 2 - floorBox.x) / Math.max(1, floorBox.width);
        const cy = (r.y + r.height / 2 - floorBox.y) / Math.max(1, floorBox.height);
        const ew = cx < 0.36 ? 'W' : cx > 0.64 ? 'E' : '';
        const ns = cy < 0.36 ? 'N' : cy > 0.64 ? 'S' : '';
        return `${ns}${ew}` || 'CENTER';
      };

      const rooms: Room[] = [];
      const placedRooms: PlacedRoom[] = [];
      for (const item of placed) {
        if (item.rect.width < GRID_MM || item.rect.height < GRID_MM) {
          unplacedFeatures.push(
            `"${item.read.name}" collapsed to zero size during conversion and was not placed. It is visible in the reference image but absent from the CAD model.`,
          );
          continue;
        }
        const prov = entityProvenance(item.read);
        const compassZone = inferCompassZone(item.rect, item.read.compassZone);
        const room = createRoom({
          floorId,
          name: item.read.name,
          type: item.read.type,
          x: item.rect.x,
          y: item.rect.y,
          width: item.rect.width,
          height: item.rect.height,
          ...(item.polygon ? { boundary: item.polygon } : {}),
          compassZone,
          ventilationRequired: !OPEN_SPACE_TYPES.has(item.read.type),
          isFixed: item.read.kind === 'stair',
          tags: [
            IMAGE_DERIVED_TAG,
            `extracted:${item.read.id}`,
            `artifact:${source.artifactId}`,
            `geomrev:${geometryRevisionId}`,
            `confidence:${item.read.confidence.toFixed(2)}`,
            `compass:${compassZone}`,
          ],
        });
        // Provenance rides on the room so an edit cannot erase its origin.
        const traced: Room = { ...room, imageProvenance: prov } as Room & { imageProvenance: EntityImageProvenance };
        rooms.push(traced);
        placedRooms.push({ read: item.read, room: traced });
      }

      if (rooms.length === 0) {
        return {
          ok: false,
          errorCode: 'IMAGE_CAD_GEOMETRY_COLLAPSED',
          message: `Every space read from the image collapsed during conversion on level ${level}; no editable geometry could be produced. The accepted image was not replaced.`,
          detail: { level, readEntities: placed.length, adjustments: adjustments.length },
        };
      }

      placedByFloor.set(level, placedRooms);

      // ── Walls from room boundary edges. Supports both rectangular (4-edge)
      //    and polygonal (L-shaped, stepped, angled) room boundaries.
      const candidates: WallCandidate[] = [];
      for (const room of rooms) {
        const open = OPEN_SPACE_TYPES.has(room.type);
        const pts = room.boundary.points;
        for (let idx = 0; idx < pts.length; idx++) {
          const pA = pts[idx]!;
          const pB = pts[(idx + 1) % pts.length]!;
          if (Math.hypot(pB.x - pA.x, pB.y - pA.y) < GRID_MM) continue;
          const start =
            pA.x < pB.x || (pA.x === pB.x && pA.y <= pB.y)
              ? { x: pA.x, y: pA.y }
              : { x: pB.x, y: pB.y };
          const end =
            start.x === pA.x && start.y === pA.y
              ? { x: pB.x, y: pB.y }
              : { x: pA.x, y: pA.y };
          candidates.push({
            start,
            end,
            roomIds: [room.id],
            isExternal: true,
            openOnly: open,
          });
        }
      }

      const merged: WallCandidate[] = [];
      const consumed = new Set<number>();
      for (let i = 0; i < candidates.length; i++) {
        if (consumed.has(i)) continue;
        const current = candidates[i]!;
        for (let j = i + 1; j < candidates.length; j++) {
          if (consumed.has(j)) continue;
          const other = candidates[j]!;
          if (other.roomIds[0] === current.roomIds[0]) continue;
          if (sharedEdge(current, other)) {
            consumed.add(j);
            current.isExternal = false;
            // An edge shared with an enclosed room is a real wall.
            if (!other.openOnly) current.openOnly = false;
            for (const id of other.roomIds) if (!current.roomIds.includes(id)) current.roomIds.push(id);
          }
        }
        // Drop only an open space's own unshared perimeter — a balcony edge
        // facing outside is a railing, not a wall.
        if (current.openOnly && current.isExternal) continue;
        merged.push(current);
      }

      const walls: Wall[] = merged.map(candidate =>
        createWall({
          floorId,
          startPoint: candidate.start,
          endPoint: candidate.end,
          thickness: candidate.isExternal ? EXTERNAL_WALL_THICKNESS : INTERNAL_WALL_THICKNESS,
          type: candidate.isExternal ? WallType.External : WallType.Internal,
          roomIds: candidate.roomIds,
          loadBearing: candidate.isExternal,
        }),
      );

      // Populate explicit room adjacency (`adjacentRoomIds`) from shared walls and vision connections
      const adjByRoomId = new Map<string, Set<string>>();
      for (const r of rooms) adjByRoomId.set(r.id, new Set<string>());
      for (const w of walls) {
        if (w.roomIds.length >= 2) {
          for (let i = 0; i < w.roomIds.length; i++) {
            for (let j = i + 1; j < w.roomIds.length; j++) {
              adjByRoomId.get(w.roomIds[i]!)?.add(w.roomIds[j]!);
              adjByRoomId.get(w.roomIds[j]!)?.add(w.roomIds[i]!);
            }
          }
        }
      }
      for (const pr of placedRooms) {
        for (const token of pr.read.connectedTo) {
          const match = placedRooms.find(
            other =>
              other.room.id !== pr.room.id &&
              (other.read.id.toLowerCase() === token.toLowerCase() ||
                other.room.name.toLowerCase() === token.toLowerCase()),
          );
          if (match) {
            adjByRoomId.get(pr.room.id)?.add(match.room.id);
            adjByRoomId.get(match.room.id)?.add(pr.room.id);
          }
        }
      }
      for (let idx = 0; idx < rooms.length; idx++) {
        const r = rooms[idx]!;
        const adj = [...(adjByRoomId.get(r.id) ?? [])];
        rooms[idx] = { ...r, adjacentRoomIds: adj };
      }

      // ── Openings at the positions the image drew them, hosted on real walls.
      const doors: Door[] = [];
      const windows: Window[] = [];
      const roomByVisionId = new Map(placedRooms.map(p => [p.read.id, p.room]));
      for (const [aliasId, canonicalVisionId] of aliasIdMap.entries()) {
        const mapped = roomByVisionId.get(canonicalVisionId);
        if (mapped) roomByVisionId.set(aliasId, mapped);
      }

      const hostWallForDoor = (point: Point, preferredRoomId?: string): Wall | null => {
        let bestAny: Wall | null = null;
        let bestAnyDist = Number.POSITIVE_INFINITY;
        let bestRoom: Wall | null = null;
        let bestRoomDist = Number.POSITIVE_INFINITY;
        for (const wall of walls) {
          const wallLen = Math.hypot(wall.endPoint.x - wall.startPoint.x, wall.endPoint.y - wall.startPoint.y);
          if (wallLen < 650) continue;
          const d = distanceToSegment(point, wall.startPoint, wall.endPoint);
          if (d < bestAnyDist) {
            bestAnyDist = d;
            bestAny = wall;
          }
          if (preferredRoomId && wall.roomIds.includes(preferredRoomId) && d < bestRoomDist) {
            bestRoomDist = d;
            bestRoom = wall;
          }
        }
        if (bestRoom && bestRoomDist <= 1500 && bestRoomDist <= bestAnyDist + 300) {
          return bestRoom;
        }
        return bestAny && bestAnyDist <= 1500 ? bestAny : null;
      };

      const hostWallForWindow = (point: Point, preferredRoomId?: string): Wall | null => {
        let bestExtRoom: Wall | null = null;
        let bestExtRoomDist = Number.POSITIVE_INFINITY;
        let bestExt: Wall | null = null;
        let bestExtDist = Number.POSITIVE_INFINITY;
        let bestFallback: Wall | null = null;
        let bestFallbackDist = Number.POSITIVE_INFINITY;

        for (const wall of walls) {
          const wallLen = Math.hypot(wall.endPoint.x - wall.startPoint.x, wall.endPoint.y - wall.startPoint.y);
          if (wallLen < 600) continue;
          const d = distanceToSegment(point, wall.startPoint, wall.endPoint);
          const touchesOpenOrShaft = wall.roomIds.some(rid => {
            const r = rooms.find(rm => rm.id === rid);
            return r ? OPEN_SPACE_TYPES.has(r.type) : false;
          });
          const isFacadeLike = wall.type === WallType.External || touchesOpenOrShaft;

          if (d < bestFallbackDist) {
            bestFallbackDist = d;
            bestFallback = wall;
          }
          if (isFacadeLike && d < bestExtDist) {
            bestExtDist = d;
            bestExt = wall;
          }
          if (isFacadeLike && preferredRoomId && wall.roomIds.includes(preferredRoomId) && d < bestExtRoomDist) {
            bestExtRoomDist = d;
            bestExtRoom = wall;
          }
        }
        if (bestExtRoom && bestExtRoomDist <= 1500) return bestExtRoom;
        if (bestExt && bestExtDist <= 1500) return bestExt;
        return bestFallback && bestFallbackDist <= 1500 ? bestFallback : null;
      };

      const levelTransform = transformByLevel.get(level) ?? transform;
      const levelDoors = plan.doors.filter(d => (d.floorLevel ?? 0) === level);
      for (const door of levelDoors) {
        const centre = applyTransform(
          { x: door.imageX, y: door.imageY, width: door.imageWidth, height: door.imageHeight },
          levelTransform,
        );
        const point = { x: snapGrid(centre.x + centre.width / 2), y: snapGrid(centre.y + centre.height / 2) };
        const adjacentRoom = roomByVisionId.get(door.adjacentRoomId);
        const wall = hostWallForDoor(point, adjacentRoom?.id);
        if (!wall) {
          unplacedFeatures.push(
            `Door "${door.id}" was read from the image on level ${level} but no reconstructed wall lies near its position, so it was not placed rather than invented elsewhere.`,
          );
          continue;
        }
        const wallLen = Math.hypot(wall.endPoint.x - wall.startPoint.x, wall.endPoint.y - wall.startPoint.y);
        const targetRoom = adjacentRoom ?? rooms.find(r => r.id === wall.roomIds[0]);
        const isBathOrService =
          targetRoom?.type === RoomType.Bathroom ||
          targetRoom?.type === RoomType.Utility ||
          targetRoom?.type === RoomType.Storage ||
          targetRoom?.type === RoomType.Pooja;
        const isMainEntry =
          wall.type === WallType.External &&
          (targetRoom?.type === RoomType.Foyer || targetRoom?.type === RoomType.Living || targetRoom?.type === RoomType.Porch);
        const defaultDoorWidth =
          door.type === 'double' ? 1500 : isMainEntry ? 1050 : isBathOrService ? 750 : 900;
        const rawSpan = snapGrid(Math.max(centre.width, centre.height)) || defaultDoorWidth;
        const maxAllowedWidth = Math.max(500, Math.floor((wallLen - 150) / GRID_MM) * GRID_MM);
        const width = Math.max(500, Math.min(2400, maxAllowedWidth, Math.max(600, rawSpan)));
        const edgeClearance = wallLen >= width + 200 ? 100 : Math.max(25, Math.floor((wallLen - width) / 2));
        const clamped = clampOpeningPositionOnWall(point, wall, width, edgeClearance);
        const hosted = clamped.valid ? clamped.position : projectOntoSegment(point, wall.startPoint, wall.endPoint);
        const swingDirection =
          door.swingDirection === 'outward'
            ? SwingDirection.Outward
            : door.swingDirection === 'left'
              ? SwingDirection.Left
              : door.swingDirection === 'right'
                ? SwingDirection.Right
                : SwingDirection.Inward;
        const hingeSide: 'left' | 'right' = door.swingDirection === 'right' ? 'right' : 'left';

        doors.push({
          ...createDoor({
            floorId,
            wallId: wall.id,
            position: hosted,
            width,
            height: 2100,
            type:
              door.type === 'double'
                ? DoorType.Double
                : door.type === 'sliding'
                  ? DoorType.Sliding
                  : door.type === 'open_passage'
                    ? DoorType.OpenPassage
                    : DoorType.Single,
            swingDirection,
            hingeSide,
            connectsRooms: [
              adjacentRoom?.id ?? wall.roomIds[0] ?? '__outside__',
              wall.roomIds.find(id => id !== (adjacentRoom?.id ?? wall.roomIds[0])) ?? '__outside__',
            ],
          }),
          imageProvenance: {
            sourceImageArtifactId: source.artifactId,
            sourceImageHash: source.imageHash,
            sourceGenerationRevision: source.generationRevision,
            sourceProjectFingerprint: source.projectFingerprint,
            conversionJobId,
            geometryRevisionId,
            sourceImageRegion: { x: door.imageX, y: door.imageY, width: door.imageWidth, height: door.imageHeight, frameWidth, frameHeight },
            extractionConfidence: 0.7,
            sourceEntityId: door.id,
          },
        } as Door);
      }

      const levelWindows = plan.windows.filter(w => (w.floorLevel ?? 0) === level);
      for (const win of levelWindows) {
        const centre = applyTransform(
          { x: win.imageX, y: win.imageY, width: win.imageWidth, height: win.imageHeight },
          levelTransform,
        );
        const point = { x: snapGrid(centre.x + centre.width / 2), y: snapGrid(centre.y + centre.height / 2) };
        const adjacentRoom = roomByVisionId.get(win.adjacentRoomId);
        const wall = hostWallForWindow(point, adjacentRoom?.id);
        if (!wall) {
          unplacedFeatures.push(
            `Window "${win.id}" was read from the image on level ${level} but no reconstructed wall lies near its position, so it was not placed.`,
          );
          continue;
        }
        const wallLen = Math.hypot(wall.endPoint.x - wall.startPoint.x, wall.endPoint.y - wall.startPoint.y);
        const targetRoom = adjacentRoom ?? rooms.find(r => r.id === wall.roomIds[0]);
        const rawSpan = snapGrid(Math.max(centre.width, centre.height)) || 1200;

        let winType = WindowType.Sliding;
        let winHeight = 1200;
        let sillHeight = 900;
        let desiredWidth = rawSpan;

        if (targetRoom?.type === RoomType.Bathroom) {
          winType = WindowType.Ventilator;
          winHeight = 600;
          sillHeight = 1800;
          desiredWidth = Math.min(rawSpan, 750) || 600;
        } else if (targetRoom?.type === RoomType.Living && rawSpan >= 1800) {
          winType = WindowType.Sliding;
          winHeight = 1500;
          sillHeight = 600;
        } else if (targetRoom?.type === RoomType.Kitchen || targetRoom?.type === RoomType.Utility) {
          winType = WindowType.Casement;
          winHeight = 1050;
          sillHeight = 1050;
          desiredWidth = Math.max(600, Math.min(1500, rawSpan));
        }

        const maxAllowedWidth = Math.max(450, Math.floor((wallLen - 150) / GRID_MM) * GRID_MM);
        const width = Math.max(450, Math.min(4000, maxAllowedWidth, desiredWidth));
        const edgeClearance = wallLen >= width + 200 ? 100 : Math.max(25, Math.floor((wallLen - width) / 2));
        const clamped = clampOpeningPositionOnWall(point, wall, width, edgeClearance);
        const hosted = clamped.valid ? clamped.position : projectOntoSegment(point, wall.startPoint, wall.endPoint);

        windows.push({
          ...createWindow({
            floorId,
            wallId: wall.id,
            position: hosted,
            width,
            height: winHeight,
            sillHeight,
            type: winType,
            roomId: targetRoom?.id ?? wall.roomIds[0] ?? '',
          }),
          imageProvenance: {
            sourceImageArtifactId: source.artifactId,
            sourceImageHash: source.imageHash,
            sourceGenerationRevision: source.generationRevision,
            sourceProjectFingerprint: source.projectFingerprint,
            conversionJobId,
            geometryRevisionId,
            sourceImageRegion: { x: win.imageX, y: win.imageY, width: win.imageWidth, height: win.imageHeight, frameWidth, frameHeight },
            extractionConfidence: 0.7,
            sourceEntityId: win.id,
          },
        } as Window);
      }

      // Mark walls that host doors or windows
      const wallsWithOpenings = new Set<string>([
        ...doors.map(d => d.wallId),
        ...windows.map(w => w.wallId),
      ]);
      for (let wIdx = 0; wIdx < walls.length; wIdx++) {
        if (wallsWithOpenings.has(walls[wIdx]!.id)) {
          walls[wIdx] = { ...walls[wIdx]!, hasOpening: true };
        }
      }

      // ── Stair flights where the image placed the staircase.
      //    Group touching/adjacent Staircase spaces on the same floor into a single
      //    stair flight core so duplicate Vision entries (rooms[] + stairs[]) yield
      //    one cohesive Stair entity per shaft.
      const stairs: Stair[] = [];
      const stairRooms = placedRooms.filter(p => p.read.type === RoomType.Staircase);
      const stairGroups: Array<{ x: number; y: number; width: number; height: number; name: string }> = [];
      for (const sr of stairRooms) {
        const r = sr.room;
        const touching = stairGroups.find(g => {
          const gapX = Math.max(0, Math.max(g.x, r.x) - Math.min(g.x + g.width, r.x + r.width));
          const gapY = Math.max(0, Math.max(g.y, r.y) - Math.min(g.y + g.height, r.y + r.height));
          return gapX <= 150 && gapY <= 150;
        });
        if (touching) {
          const minX = Math.min(touching.x, r.x);
          const minY = Math.min(touching.y, r.y);
          const maxX = Math.max(touching.x + touching.width, r.x + r.width);
          const maxY = Math.max(touching.y + touching.height, r.y + r.height);
          touching.x = minX;
          touching.y = minY;
          touching.width = maxX - minX;
          touching.height = maxY - minY;
          if (/u[- ]?shape|dog[- ]?leg|turn/i.test(sr.read.name)) {
            touching.name = sr.read.name;
          }
        } else {
          stairGroups.push({ x: r.x, y: r.y, width: r.width, height: r.height, name: sr.read.name });
        }
      }
      const upperLevelExists = level + 1 < targetFloorCount;
      const lowerLevelExists = level > 0;
      for (let sIdx = 0; sIdx < stairGroups.length; sIdx++) {
        const room = stairGroups[sIdx]!;
        if (!upperLevelExists && !lowerLevelExists) continue;
        const connectsFloors: [number, number] = upperLevelExists ? [level, level + 1] : [level - 1, level];
        const direction = room.height >= room.width ? ('north' as Direction) : ('east' as Direction);
        const crossWidth = Math.min(room.width, room.height);
        const runLength = Math.max(room.width, room.height);
        const isUShaped =
          crossWidth >= 1600 ||
          (/u[- ]?shape|dog[- ]?leg|turn/i.test(room.name) && crossWidth >= 1200);
        const stairType = isUShaped ? StairType.UShaped : StairType.Straight;
        const riserCount = 20;
        const riserHeight = Math.round((baseFloor.floorHeight || 3000) / riserCount);
        const landingWidth = isUShaped
          ? Math.max(600, Math.min(1200, Math.floor(runLength * 0.26)))
          : Math.min(crossWidth, Math.max(600, Math.floor(runLength * 0.2)));
        const treadDepth = isUShaped
          ? Math.max(150, Math.min(300, Math.floor((runLength - landingWidth) / 9)))
          : Math.max(120, Math.min(280, Math.floor(runLength / 19)));

        stairs.push(
          createStair({
            floorId,
            type: stairType,
            x: room.x,
            y: room.y,
            width: room.width,
            length: room.height,
            direction,
            riserCount,
            riserHeight,
            treadDepth,
            landingWidth,
            connectsFloors,
            verticalCoreId: `stair-core-${sIdx + 1}`,
          }),
        );
      }

      floors.push({ ...baseFloor, rooms, walls, doors, windows, stairs });
    }

    // Report a required staircase the image never drew, instead of adding one.
    if (targetFloorCount > 1 && !entities.some(e => e.type === RoomType.Staircase)) {
      unplacedFeatures.push(
        'The design is multi-storey but the image interpretation found no staircase, so none was created. Vertical circulation must be added in the editor or the image regenerated showing the stair.',
      );
    }

    const provenance: BuildingImageProvenance = {
      sourceImageArtifactId: source.artifactId,
      sourceImageHash: source.imageHash,
      sourceGenerationRevision: source.generationRevision,
      sourceProjectFingerprint: source.projectFingerprint,
      conversionJobId,
      geometryRevisionId,
      convertedAt: new Date().toISOString(),
      ...(source.visionModel ? { visionModel: source.visionModel } : {}),
      interpretationSource: source.interpretationSource,
      frameWidth,
      frameHeight,
      imageWidePixels: source.imageWidePixels,
      imageTallPixels: source.imageTallPixels,
      floors: floorProvenanceList,
      adjustments,
      unplacedFeatures,
    };

    const reconstructed: Building = {
      ...base,
      id: canonicalBuildingId,
      projectId,
      name: projectName,
      floors,
      metadata: {
        ...base.metadata,
        customData: {
          ...((base.metadata.customData as Record<string, unknown> | undefined) ?? {}),
          // The single authoritative statement of where this geometry came from.
          imageProvenance: provenance,
          geometrySource: 'IMAGE_RECONSTRUCTION',
          detectedFootprintShape: typeof rawObj.footprintShape === 'string' ? rawObj.footprintShape : 'unknown',
          detectedEntranceSide: typeof rawObj.entranceSide === 'string' ? rawObj.entranceSide : String(site.roadFacing),
          circulationNotes: typeof rawObj.circulationNotes === 'string' ? rawObj.circulationNotes : '',
        },
      },
    };

    // Conceptual structural coordination (columns/grid) over the reconstructed shell.
    const coordinated = StructuralCoordinationEngine.coordinateBuilding(reconstructed);

    return {
      ok: true,
      building: coordinated.building,
      provenance,
      adjustments,
      unplacedFeatures,
    };
  } catch (error) {
    return {
      ok: false,
      errorCode: 'IMAGE_CAD_INTERNAL_ERROR',
      message: `Image-to-CAD reconstruction threw: ${error instanceof Error ? error.message : String(error)}. No substitute geometry was produced.`,
      detail: { stack: error instanceof Error ? error.stack : undefined },
    };
  }
}
