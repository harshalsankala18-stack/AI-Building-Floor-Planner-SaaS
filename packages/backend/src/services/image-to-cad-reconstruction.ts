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
import { StructuralCoordinationEngine } from '@ai-floor-planner/planning-engine';
import type { ExtractedPlan } from '@ai-floor-planner/planning-engine';
import { extractedRoomType } from '@ai-floor-planner/planning-engine';

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
  | 'IMAGE_CAD_INTERNAL_ERROR';

/** Architectural grid the reconstruction snaps to. */
const GRID_MM = 50;
/** A snap larger than this is reported as materially changing the design. */
const MATERIAL_SNAP_MM = 300;
const EXTERNAL_WALL_THICKNESS = 230;
const INTERNAL_WALL_THICKNESS = 115;
/** Collinearity/overlap tolerance when pairing room edges into shared walls. */
const WALL_PAIR_TOLERANCE_MM = 260;
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
  if (token.includes('verandah') || token.includes('veranda') || token.includes('porch')) return RoomType.Porch;
  if (token.includes('lobby') || token.includes('passage') || token.includes('corridor')) return RoomType.Corridor;
  if (token.includes('pooja') || token.includes('puja') || token.includes('temple')) return RoomType.Pooja;
  if (token.includes('terrace')) return RoomType.Terrace;
  return extractedRoomType(rawType || rawName);
}

interface ReadEntity {
  readonly id: string;
  readonly name: string;
  readonly type: RoomType;
  readonly floorLevel: number;
  /** Frame-space rectangle exactly as read from the image. */
  readonly frame: { x: number; y: number; width: number; height: number };
  readonly compassZone?: string;
  readonly connectedTo: readonly string[];
  readonly confidence: number;
  readonly kind: 'room' | 'stair' | 'parking';
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

function overlapArea(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/** Even-odd point-in-polygon test. */
function pointInPolygon(point: Point, polygon: Polygon): boolean {
  const pts = polygon.points;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i]!;
    const b = pts[j]!;
    const intersects =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

/**
 * Whether a rectangle sits inside a polygon, with a small tolerance so a room
 * whose edge coincides with the outline still counts as contained.
 */
function rectInsidePolygon(rect: Rect, polygon: Polygon, tolerance = GRID_MM * 2): boolean {
  const inset = Math.min(tolerance, rect.width / 4, rect.height / 4);
  const corners: Point[] = [
    { x: rect.x + inset, y: rect.y + inset },
    { x: rect.x + rect.width - inset, y: rect.y + inset },
    { x: rect.x + rect.width - inset, y: rect.y + rect.height - inset },
    { x: rect.x + inset, y: rect.y + rect.height - inset },
    { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
  ];
  return corners.every(c => pointInPolygon(c, polygon));
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
): { entities: ReadEntity[]; notes: string[] } {
  const notes: string[] = [];
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
    const level = Number(raw?.floorLevel ?? 0);
    const confidence = plan.confidence?.[room.id];
    entities.push({
      id: room.id,
      name: room.name,
      type: resolveRoomType(room.type, room.name),
      floorLevel: Number.isFinite(level) ? Math.max(0, Math.min(targetFloorCount - 1, Math.trunc(level))) : 0,
      frame: { x: room.imageX, y: room.imageY, width: room.imageWidth, height: room.imageHeight },
      ...(typeof raw?.compassZone === 'string' ? { compassZone: raw.compassZone } : {}),
      connectedTo: Array.isArray(raw?.connectedTo) ? (raw!.connectedTo as unknown[]).map(String) : [],
      extractionConfidenceHolder: undefined,
      confidence: confidence === 'confirmed' ? 1 : confidence === 'ambiguous' ? 0.4 : 0.75,
      kind: 'room',
    } as ReadEntity);
  }

  for (const stair of plan.stairs) {
    entities.push({
      id: stair.id,
      name: stair.name || 'Staircase',
      type: RoomType.Staircase,
      floorLevel: 0,
      frame: { x: stair.imageX, y: stair.imageY, width: stair.imageWidth, height: stair.imageHeight },
      connectedTo: [],
      confidence: 0.75,
      kind: 'stair',
    });
  }

  for (const park of plan.parking) {
    entities.push({
      id: park.id,
      name: park.name || 'Parking',
      type: RoomType.Parking,
      floorLevel: 0,
      frame: { x: park.imageX, y: park.imageY, width: park.imageWidth, height: park.imageHeight },
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

  return { entities, notes };
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
function resolveOverlaps(
  placed: { read: ReadEntity; rect: Rect }[],
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
        const area = overlapArea(smaller.rect, bigger.rect);
        if (area <= MIN_SIGNIFICANT_OVERLAP_MM2) continue;

        const smallerArea = smaller.rect.width * smaller.rect.height;
        const nested = smallerArea > 0 && area / smallerArea >= NESTED_COVERAGE;

        if (nested) {
          // Carve the container back to the nearest free edge of the nested
          // space, choosing the side that costs the container the least.
          const cutLeft = smaller.rect.x + smaller.rect.width - bigger.rect.x; // container starts after small
          const cutRight = bigger.rect.x + bigger.rect.width - smaller.rect.x; // container ends before small
          const cutTop = smaller.rect.y + smaller.rect.height - bigger.rect.y;
          const cutBottom = bigger.rect.y + bigger.rect.height - smaller.rect.y;
          const best = Math.min(cutLeft, cutRight, cutTop, cutBottom);
          if (!Number.isFinite(best) || best <= 0) continue;
          const cut = Math.ceil(best / GRID_MM) * GRID_MM;

          // Never carve the container out of existence; if it cannot give way,
          // fall through to abutting treatment on the next pass.
          const wouldLeaveWidth = best === cutLeft || best === cutRight ? bigger.rect.width - cut : bigger.rect.width;
          const wouldLeaveHeight = best === cutTop || best === cutBottom ? bigger.rect.height - cut : bigger.rect.height;
          if (wouldLeaveWidth < MIN_CARVED_REMAINDER_MM || wouldLeaveHeight < MIN_CARVED_REMAINDER_MM) {
            // Container too small to host the carve-out: the nested space yields.
            smaller.rect.width = Math.max(GRID_MM, smaller.rect.width - cut);
            note(smaller.read, bigger.read.name, cut, false);
            dirty = true;
            continue;
          }

          if (best === cutLeft) {
            bigger.rect.x += cut;
            bigger.rect.width -= cut;
          } else if (best === cutRight) {
            bigger.rect.width -= cut;
          } else if (best === cutTop) {
            bigger.rect.y += cut;
            bigger.rect.height -= cut;
          } else {
            bigger.rect.height -= cut;
          }
          note(bigger.read, smaller.read.name, cut, true);
          dirty = true;
          continue;
        }

        // Abutting: the smaller room yields along its shallowest penetration.
        const penLeft = bigger.rect.x + bigger.rect.width - smaller.rect.x;
        const penRight = smaller.rect.x + smaller.rect.width - bigger.rect.x;
        const penTop = bigger.rect.y + bigger.rect.height - smaller.rect.y;
        const penBottom = smaller.rect.y + smaller.rect.height - bigger.rect.y;
        const smallest = Math.min(penLeft, penRight, penTop, penBottom);
        if (!Number.isFinite(smallest) || smallest <= 0) continue;
        // Round the correction UP to the grid so the gap survives snapping.
        const cut = Math.ceil(smallest / GRID_MM) * GRID_MM;

        if (smallest === penLeft) {
          smaller.rect.x += cut;
          smaller.rect.width = Math.max(GRID_MM, smaller.rect.width - cut);
        } else if (smallest === penRight) {
          smaller.rect.width = Math.max(GRID_MM, smaller.rect.width - cut);
        } else if (smallest === penTop) {
          smaller.rect.y += cut;
          smaller.rect.height = Math.max(GRID_MM, smaller.rect.height - cut);
        } else {
          smaller.rect.height = Math.max(GRID_MM, smaller.rect.height - cut);
        }
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
        ? `${names} is drawn inside "${record.name}" in the image, so "${record.name}" was carved back by ${Math.round(record.delta)} mm to host it as a separate space.`
        : `"${record.name}" overlapped ${names} as read from the image; its boundary was pulled back by ${Math.round(record.delta)} mm in total.`,
      material: record.delta > MATERIAL_SNAP_MM,
      deltaMm: Math.round(record.delta),
    });
  }

  // Report whether anything is still overlapping, so the caller never assumes.
  let remaining = 0;
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      if (overlapArea(placed[i]!.rect, placed[j]!.rect) > MIN_SIGNIFICANT_OVERLAP_MM2) remaining++;
    }
  }
  return { resolved: remaining === 0, remaining };
}

interface WallCandidate {
  readonly start: Point;
  readonly end: Point;
  readonly roomIds: string[];
  isExternal: boolean;
  /** True while this edge is known only to open/outdoor spaces. */
  openOnly: boolean;
}

function isHorizontal(a: Point, b: Point): boolean {
  return Math.abs(a.y - b.y) < Math.abs(a.x - b.x);
}

/** Pair collinear, overlapping room edges so shared partitions become one wall. */
function sharedEdge(a: WallCandidate, b: WallCandidate): boolean {
  const aH = isHorizontal(a.start, a.end);
  const bH = isHorizontal(b.start, b.end);
  if (aH !== bH) return false;
  if (aH) {
    if (Math.abs(a.start.y - b.start.y) > WALL_PAIR_TOLERANCE_MM) return false;
    const [a1, a2] = [Math.min(a.start.x, a.end.x), Math.max(a.start.x, a.end.x)];
    const [b1, b2] = [Math.min(b.start.x, b.end.x), Math.max(b.start.x, b.end.x)];
    return Math.min(a2, b2) - Math.max(a1, b1) > GRID_MM;
  }
  if (Math.abs(a.start.x - b.start.x) > WALL_PAIR_TOLERANCE_MM) return false;
  const [a1, a2] = [Math.min(a.start.y, a.end.y), Math.max(a.start.y, a.end.y)];
  const [b1, b2] = [Math.min(b.start.y, b.end.y), Math.max(b.start.y, b.end.y)];
  return Math.min(a2, b2) - Math.max(a1, b1) > GRID_MM;
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

    const { entities, notes } = readEntities(plan, rawVisionPayload, targetFloorCount);
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
    const envelope: Rect = {
      x: snapGrid(site.leftSetback),
      y: snapGrid(site.frontSetback),
      width: snapGrid(site.plotWidth - site.leftSetback - site.rightSetback),
      height: snapGrid(site.plotDepth - site.frontSetback - site.rearSetback),
    };
    if (envelope.width < 2000 || envelope.height < 2000) {
      return {
        ok: false,
        errorCode: 'IMAGE_CAD_BUILDABLE_ENVELOPE_TOO_SMALL',
        message: `The buildable envelope after setbacks is ${Math.round(envelope.width)}×${Math.round(envelope.height)} mm, too small to host a reconstructed plan. Check plot dimensions and setbacks.`,
        detail: { envelope, site },
      };
    }

    // ── One uniform transform for the whole drawing, derived from the content
    //    the image actually shows (its own bounding box, not the raster edge).
    const contentRects = entities.map(e => e.frame);
    const boundaryPoints = plan.boundary.points;
    const contentBox = boundingBox([
      ...contentRects,
      ...(boundaryPoints.length >= 3
        ? [boundingBox(boundaryPoints.map(p => ({ x: p.x, y: p.y, width: 0.0001, height: 0.0001 })))]
        : []),
    ]);
    const transform = computeFrameTransform(contentBox, envelope);

    // ── Place every entity where the image drew it, then clamp, de-overlap and
    //    snap. This happens BEFORE the footprint is fixed, so the outline can
    //    be checked against the geometry it has to contain.
    const placedByLevel = new Map<number, { read: ReadEntity; rect: Rect }[]>();
    for (let level = 0; level < targetFloorCount; level++) {
      const levelEntities = entities.filter(e => e.floorLevel === level);
      if (levelEntities.length === 0) {
        placedByLevel.set(level, []);
        continue;
      }
      const placed = levelEntities.map(read => ({ read, rect: applyTransform(read.frame, transform) }));

      // Clamp into the envelope, recording any movement.
      for (const item of placed) {
        const before = { ...item.rect };
        item.rect.width = Math.min(item.rect.width, envelope.width);
        item.rect.height = Math.min(item.rect.height, envelope.height);
        item.rect.x = Math.min(Math.max(item.rect.x, envelope.x), envelope.x + envelope.width - item.rect.width);
        item.rect.y = Math.min(Math.max(item.rect.y, envelope.y), envelope.y + envelope.height - item.rect.height);
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
      }

      placedByLevel.set(level, placed);
    }

    // ── Footprint: the image's own outline when it genuinely encloses the
    //    reconstructed spaces, so an L-shape, U-shape or stepped plan keeps its
    //    shape. Vision sometimes returns an outline that excludes a room it
    //    also drew (a notch over the living room, say); adopting that outline
    //    would push real geometry out of bounds, so in that case the plan's own
    //    extent is used and the discrepancy is reported, not hidden.
    const allPlacedRects = [...placedByLevel.values()].flat().map(p => p.rect);
    const statedFootprint: Polygon | null =
      boundaryPoints.length >= 3
        ? {
            points: boundaryPoints.map(p => ({
              x: snapGrid(p.x * transform.scale + transform.offsetX),
              y: snapGrid(p.y * transform.scale + transform.offsetY),
            })),
          }
        : null;

    const extentFootprint = (): Polygon => {
      const box = allPlacedRects.length > 0 ? boundingBox(allPlacedRects) : envelope;
      const x1 = snapGrid(Math.max(envelope.x, box.x - EXTERNAL_WALL_THICKNESS));
      const y1 = snapGrid(Math.max(envelope.y, box.y - EXTERNAL_WALL_THICKNESS));
      const x2 = snapGrid(Math.min(envelope.x + envelope.width, box.x + box.width + EXTERNAL_WALL_THICKNESS));
      const y2 = snapGrid(Math.min(envelope.y + envelope.height, box.y + box.height + EXTERNAL_WALL_THICKNESS));
      return { points: [{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 }] };
    };

    let footprint: Polygon;
    if (!statedFootprint) {
      footprint = extentFootprint();
      unplacedFeatures.push(
        'The image interpretation returned no building outline, so the extent of the drawn spaces was used as the footprint. Non-rectangular footprint steps could not be reconstructed.',
      );
    } else {
      const outside = allPlacedRects.filter(r => !rectInsidePolygon(r, statedFootprint));
      if (outside.length === 0) {
        footprint = statedFootprint;
      } else {
        footprint = extentFootprint();
        unplacedFeatures.push(
          `The outline read from the image excludes ${outside.length} space(s) the same image also drew, so it could not be used as the building footprint; the extent of the drawn spaces was used instead. The footprint's steps may differ from the drawing — compare against the reference image.`,
        );
        adjustments.push({
          entityId: 'footprint',
          entityName: 'Building footprint',
          kind: 'clamp_to_envelope',
          description: `The interpreted outline (${statedFootprint.points.length} points) did not contain every drawn space, so the footprint was taken from the spaces' own extent.`,
          material: true,
        });
      }
    }

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
        // Every level inherits the reconstructed outline so upper floors sit on
        // the same footprint the image drew.
        boundary: footprint,
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
        const room = createRoom({
          floorId,
          name: item.read.name,
          type: item.read.type,
          x: item.rect.x,
          y: item.rect.y,
          width: item.rect.width,
          height: item.rect.height,
          ventilationRequired: !OPEN_SPACE_TYPES.has(item.read.type),
          isFixed: item.read.kind === 'stair',
          tags: [
            IMAGE_DERIVED_TAG,
            `extracted:${item.read.id}`,
            `artifact:${source.artifactId}`,
            `geomrev:${geometryRevisionId}`,
            `confidence:${item.read.confidence.toFixed(2)}`,
            ...(item.read.compassZone ? [`compass:${item.read.compassZone}`] : []),
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

      // ── Walls from room boundary edges. A shared edge becomes one internal
      //    partition; an unshared edge of an enclosed room becomes external
      //    envelope. Open spaces (balcony, verandah, parking, OTS) do not get
      //    their own perimeter, but the edge where they meet an enclosed room
      //    IS a real wall, so their edges are offered for pairing and only the
      //    unshared ones are dropped.
      const candidates: WallCandidate[] = [];
      for (const room of rooms) {
        const open = OPEN_SPACE_TYPES.has(room.type);
        const p1 = { x: room.x, y: room.y };
        const p2 = { x: room.x + room.width, y: room.y };
        const p3 = { x: room.x + room.width, y: room.y + room.height };
        const p4 = { x: room.x, y: room.y + room.height };
        candidates.push(
          { start: p1, end: p2, roomIds: [room.id], isExternal: true, openOnly: open },
          { start: p2, end: p3, roomIds: [room.id], isExternal: true, openOnly: open },
          { start: p4, end: p3, roomIds: [room.id], isExternal: true, openOnly: open },
          { start: p1, end: p4, roomIds: [room.id], isExternal: true, openOnly: open },
        );
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

      // ── Openings at the positions the image drew them, hosted on real walls.
      const doors: Door[] = [];
      const windows: Window[] = [];
      const roomByVisionId = new Map(placedRooms.map(p => [p.read.id, p.room]));

      const hostWallFor = (point: Point): Wall | null => {
        let best: Wall | null = null;
        let bestDistance = Number.POSITIVE_INFINITY;
        for (const wall of walls) {
          const d = distanceToSegment(point, wall.startPoint, wall.endPoint);
          if (d < bestDistance) {
            bestDistance = d;
            best = wall;
          }
        }
        // Only host when the drawn opening is genuinely near a wall line.
        return best && bestDistance <= 1500 ? best : null;
      };

      if (level === 0) {
        for (const door of plan.doors) {
          const centre = applyTransform(
            { x: door.imageX, y: door.imageY, width: door.imageWidth, height: door.imageHeight },
            transform,
          );
          const point = { x: snapGrid(centre.x + centre.width / 2), y: snapGrid(centre.y + centre.height / 2) };
          const wall = hostWallFor(point);
          if (!wall) {
            unplacedFeatures.push(
              `Door "${door.id}" was read from the image but no reconstructed wall lies near its position, so it was not placed rather than invented elsewhere.`,
            );
            continue;
          }
          const hosted = projectOntoSegment(point, wall.startPoint, wall.endPoint);
          const adjacentRoom = roomByVisionId.get(door.adjacentRoomId);
          const width = Math.max(600, Math.min(2400, snapGrid(Math.max(centre.width, centre.height)) || 900));
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
              swingDirection:
                door.swingDirection === 'outward'
                  ? SwingDirection.Outward
                  : door.swingDirection === 'left'
                    ? SwingDirection.Left
                    : door.swingDirection === 'right'
                      ? SwingDirection.Right
                      : SwingDirection.Inward,
              connectsRooms: [
                adjacentRoom?.id ?? wall.roomIds[0] ?? '__outside__',
                wall.roomIds.find(id => id !== adjacentRoom?.id) ?? '__outside__',
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

        for (const win of plan.windows) {
          const centre = applyTransform(
            { x: win.imageX, y: win.imageY, width: win.imageWidth, height: win.imageHeight },
            transform,
          );
          const point = { x: snapGrid(centre.x + centre.width / 2), y: snapGrid(centre.y + centre.height / 2) };
          const wall = hostWallFor(point);
          if (!wall) {
            unplacedFeatures.push(
              `Window "${win.id}" was read from the image but no reconstructed wall lies near its position, so it was not placed.`,
            );
            continue;
          }
          const hosted = projectOntoSegment(point, wall.startPoint, wall.endPoint);
          const adjacentRoom = roomByVisionId.get(win.adjacentRoomId);
          const width = Math.max(500, Math.min(4000, snapGrid(Math.max(centre.width, centre.height)) || 1200));
          windows.push({
            ...createWindow({
              floorId,
              wallId: wall.id,
              position: hosted,
              width,
              height: 1200,
              sillHeight: 900,
              type: WindowType.Sliding,
              roomId: adjacentRoom?.id ?? wall.roomIds[0] ?? '',
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
      }

      // ── Stair flights where the image placed the staircase.
      const stairs: Stair[] = [];
      const stairRooms = placedRooms.filter(p => p.read.type === RoomType.Staircase);
      const upperLevelExists = level + 1 < targetFloorCount;
      for (const stairRoom of stairRooms) {
        if (!upperLevelExists) continue;
        const room = stairRoom.room;
        stairs.push(
          createStair({
            floorId,
            type: StairType.Straight,
            x: room.x,
            y: room.y,
            width: Math.min(room.width, room.height),
            length: Math.max(room.width, room.height),
            direction: room.height >= room.width ? ('north' as Direction) : ('east' as Direction),
            connectsFloors: [level, level + 1],
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
