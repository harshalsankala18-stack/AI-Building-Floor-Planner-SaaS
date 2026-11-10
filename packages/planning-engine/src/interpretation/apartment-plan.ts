/**
 * Recovery Phase 4 — apartment-aware plan structure, hard validation and
 * canonical geometry (APARTMENT_GENERATION_DIAGNOSIS_AND_5_PHASE_PLAN.md, Phase 4).
 *
 *   interpreted image (ExtractedPlan)  ─┐
 *                                       ├─► ApartmentPlanStructure (real-world mm)
 *   deterministic schematic (fallback) ─┘
 *        │
 *        ├─ 1. interpretation completeness
 *        ├─ 2. manifest match (exact counts, no "close enough")
 *        ├─ 3. apartment structural checks (party walls, core ownership, unit program)
 *        ├─ 4. canonical geometry (Building Model via core factories)
 *        └─ 5. existing deterministic geometry validation (health, collisions, containment)
 *
 * Gemini interprets; this deterministic module decides. Mismatches are REJECTED
 * with explicit reasons — nothing (flats, lifts, stairs, rooms, boundaries) is
 * ever added, moved or relabelled to make a plan pass.
 */

import {
  createBuilding,
  createRoom,
  createWall,
  MINIMUM_DIMENSIONS,
  MINIMUM_ROOM_AREAS,
  PlotShape,
  RoomType,
  WallType,
  rectToPolygon,
  type Building,
  type Direction,
  type Room,
  type Wall,
  type Door,
  type Window,
  type Floor,
} from '@ai-floor-planner/core';
import {
  containsPolygon,
  detectRoomCollisions,
  pointInPolygon,
  pointToSegmentDistance,
  polygonIntersectionArea,
  validateDoorPlacement,
  validateWindowPlacement,
} from '@ai-floor-planner/geometry-engine';
import { evaluateDesign } from '../diagnostics/design-evaluator';
import type { DiagnosticFragment, ExtractedCoreElement, ExtractedPlan } from './extraction';
import type { ExtractionSite } from './extraction-building';
import type { ExtractedPlanValidation } from './extraction-validation';

export const APARTMENT_COMMON_FLAT_ID = 'COMMON';

/** Provenance of the structure; the fallback is never presented as an interpretation. */
export type ApartmentPlanSource = 'IMAGE_INTERPRETATION' | 'DETERMINISTIC_SCHEMATIC';

export interface ApartmentRectMm {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface ApartmentPlanRoom {
  readonly id: string;
  readonly name: string;
  /** Raw typology/label (e.g. "master_bedroom", "LIVING / DINING"). */
  readonly type: string;
  readonly rect: ApartmentRectMm;
}

export interface ApartmentPlanFlat {
  readonly id: string;
  readonly label: string;
  readonly unitType: string;
  readonly rect: ApartmentRectMm;
  readonly rooms: readonly ApartmentPlanRoom[];
}

export interface ApartmentCoreElement {
  readonly id: string;
  readonly name: string;
  readonly rect: ApartmentRectMm;
  /** Flat the source assigned this element to; any non-null value is a validation error for core elements. */
  readonly assignedFlatId: string | null;
}

export interface ApartmentPlanOpening {
  readonly id: string;
  readonly kind: 'door' | 'window';
  readonly rect: ApartmentRectMm;
  readonly adjacentRoomId: string;
  readonly doorType?: string;
  readonly swingDirection?: string;
  /** Both spaces joined by a door (structure ids; lobby / core ids allowed). */
  readonly connects?: readonly [string, string];
  /** Door from the common lobby/corridor into a flat. */
  readonly isFlatEntrance?: boolean;
}

export interface ApartmentPlanStructure {
  readonly source: ApartmentPlanSource;
  readonly boundary: readonly { readonly x: number; readonly y: number }[];
  readonly flats: readonly ApartmentPlanFlat[];
  /** Shared rooms explicitly marked COMMON (not counted as lifts/stairs/lobbies). */
  readonly commonRooms: readonly ApartmentPlanRoom[];
  /** Rooms whose flatId was missing or referenced an unknown flat. */
  readonly ungroupedRooms: readonly { readonly room: ApartmentPlanRoom; readonly flatId: string | null }[];
  readonly lifts: readonly ApartmentCoreElement[];
  readonly stairs: readonly ApartmentCoreElement[];
  readonly lobbies: readonly ApartmentCoreElement[];
  readonly corridors: readonly ApartmentCoreElement[];
  readonly shafts: readonly ApartmentCoreElement[];
  readonly openings: readonly ApartmentPlanOpening[];
}

export interface ApartmentUnitExpectation {
  readonly label: string;
  readonly unitType: string;
  readonly bedrooms: number;
  readonly bathrooms: number;
  readonly livingRooms: number;
  readonly diningRooms: number;
  readonly kitchens: number;
  readonly utilities: number;
  readonly balconies: number;
}

/** Manifest-derived expectation (the manifest is the authority, not the image). */
export interface ApartmentPlanExpectation {
  readonly flats: number;
  readonly units: readonly ApartmentUnitExpectation[];
  readonly lifts: number;
  readonly stairs: number;
  readonly commonLobby: boolean;
}

export type ApartmentStageStatus = 'PASS' | 'FAIL' | 'SKIPPED';

export interface ApartmentStructureCounts {
  readonly flats: number;
  readonly unitTypes: readonly string[];
  readonly lifts: number;
  readonly stairs: number;
  readonly lobbies: number;
  readonly bedroomsByFlat: Readonly<Record<string, number>>;
}

export interface ApartmentStructureValidation {
  readonly isValid: boolean;
  readonly stages: {
    readonly completeness: ApartmentStageStatus;
    readonly manifestMatch: ApartmentStageStatus;
    readonly structural: ApartmentStageStatus;
  };
  readonly counts: ApartmentStructureCounts;
  readonly issues: readonly DiagnosticFragment[];
}

// ─── Room roles ──────────────────────────────────────────────────────────────

export type ApartmentRoomRole =
  | 'bedroom' | 'bathroom' | 'living' | 'dining' | 'kitchen' | 'utility' | 'balcony'
  | 'foyer' | 'pooja' | 'study' | 'storage'
  /** Private passage inside a flat (NOT common circulation). */
  | 'passage'
  | 'lift' | 'stair' | 'lobby' | 'corridor' | 'shaft' | 'other';

const CORE_ROLES: ReadonlySet<ApartmentRoomRole> = new Set(['lift', 'stair', 'lobby', 'corridor']);

/** Deterministic label → role classification. A combined "living & dining" fills both roles. */
export function apartmentRoomRoles(label: string): ApartmentRoomRole[] {
  const n = ` ${label.toLowerCase().replace(/[_/&,.()-]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
  const has = (...words: string[]) => words.some(w => n.includes(w));
  if (has(' lift', 'elevator')) return ['lift'];
  if (has('stair')) return ['stair'];
  // A flat's own passage/hallway is private circulation, distinct from the common corridor.
  if (has('passage', 'hallway', 'private lobby', 'private corridor', 'internal corridor')) return ['passage'];
  if (has('lobby')) return ['lobby'];
  if (has('corridor')) return ['corridor'];
  if (has('duct', 'shaft', ' ots ', ' ots', 'vent', 'void')) return ['shaft'];
  if (has('toilet', 'bath', ' wc', 'powder', 'ensuite', 'en suite', 'washroom', 'lavatory')) return ['bathroom'];
  if (has('bed', 'guest room')) return ['bedroom'];
  const roles: ApartmentRoomRole[] = [];
  if (has('living', 'drawing', ' hall ')) roles.push('living');
  if (has('dining')) roles.push('dining');
  if (roles.length > 0) return roles;
  if (has('kitchen')) return ['kitchen'];
  if (has('utility', 'wash', 'dry balc', 'service balc', 'ser bal')) return ['utility'];
  if (has('balcon', 'sit out', 'sitout', 'terrace', 'deck')) return ['balcony'];
  if (has('foyer', 'entry', 'entrance')) return ['foyer'];
  if (has('pooja', 'puja', 'prayer')) return ['pooja'];
  if (has('study', 'office')) return ['study'];
  if (has('store', 'storage')) return ['storage'];
  return ['other'];
}

const ROLE_ROOM_TYPE: Readonly<Record<ApartmentRoomRole, RoomType>> = {
  bedroom: RoomType.Bedroom,
  bathroom: RoomType.Bathroom,
  living: RoomType.Living,
  dining: RoomType.Dining,
  kitchen: RoomType.Kitchen,
  utility: RoomType.Utility,
  balcony: RoomType.Balcony,
  foyer: RoomType.Foyer,
  pooja: RoomType.Pooja,
  study: RoomType.Study,
  storage: RoomType.Storage,
  passage: RoomType.Corridor,
  lift: RoomType.Lift,
  stair: RoomType.Staircase,
  lobby: RoomType.Corridor,
  corridor: RoomType.Corridor,
  shaft: RoomType.ServiceShaft,
  other: RoomType.Custom,
};

/** "2 bhk" / "2BHK" → "2BHK"; "studio" → "STUDIO". */
export function normalizeApartmentUnitType(value: string): string {
  return value.toUpperCase().replace(/[\s_-]+/g, '');
}

function bhkBedrooms(unitType: string): number | null {
  const norm = normalizeApartmentUnitType(unitType);
  if (norm === 'STUDIO') return 0;
  const match = /^(\d+)BHK$/.exec(norm);
  return match ? Number(match[1]) : null;
}

// ─── Geometry helpers (axis-aligned) ─────────────────────────────────────────

function area(r: ApartmentRectMm): number {
  return Math.max(0, r.width) * Math.max(0, r.height);
}

function overlapArea(a: ApartmentRectMm, b: ApartmentRectMm): number {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/** Party walls may be drawn with thickness: tolerate ≤1% overlap between flats. */
const FLAT_OVERLAP_TOLERANCE = 0.01;
/** A room must lie (≥95%) inside its own flat boundary. */
const ROOM_CONTAINMENT_MIN = 0.95;
/** Core elements may touch a flat edge but not sit inside it (>10% overlap). */
const CORE_INSIDE_FLAT_TOLERANCE = 0.10;

// ─── Image interpretation → structure ────────────────────────────────────────

/**
 * Map an interpreted apartment plan (image space, given coordinate frame) to
 * real-world millimetres using the KNOWN plot dimensions. Grouping is kept
 * exactly as interpreted; nothing is re-assigned or invented.
 */
export function extractedPlanToApartmentStructure(
  plan: ExtractedPlan,
  site: { readonly plotWidth: number; readonly plotDepth: number },
  frame: { readonly width: number; readonly height: number },
): { structure: ApartmentPlanStructure | null; diagnostics: DiagnosticFragment[] } {
  if (!plan.flats) {
    return {
      structure: null,
      diagnostics: [{
        code: 'APARTMENT_INTERPRETATION_STRUCTURE_MISSING',
        severity: 'error',
        message: 'The interpretation has no apartment structure (flats/core); it cannot be validated as an apartment plan.',
      }],
    };
  }
  if (frame.width <= 0 || frame.height <= 0 || site.plotWidth <= 0 || site.plotDepth <= 0) {
    return {
      structure: null,
      diagnostics: [{ code: 'NORMALIZATION_FAILED_ZERO_DIMENSIONS', severity: 'error', message: 'Image frame or plot dimensions are invalid.' }],
    };
  }
  const sx = site.plotWidth / frame.width;
  const sy = site.plotDepth / frame.height;
  const toMm = (r: { imageX: number; imageY: number; imageWidth: number; imageHeight: number }): ApartmentRectMm => ({
    x: r.imageX * sx,
    y: r.imageY * sy,
    width: r.imageWidth * sx,
    height: r.imageHeight * sy,
  });
  const element = (e: ExtractedCoreElement | { id: string; name: string; imageX: number; imageY: number; imageWidth: number; imageHeight: number; flatId?: string }): ApartmentCoreElement => ({
    id: e.id,
    name: e.name,
    rect: toMm(e),
    assignedFlatId: e.flatId && e.flatId !== APARTMENT_COMMON_FLAT_ID ? e.flatId : null,
  });

  const flatIds = new Set(plan.flats.map(f => f.id));
  const roomsByFlat = new Map<string, ApartmentPlanRoom[]>();
  const commonRooms: ApartmentPlanRoom[] = [];
  const ungroupedRooms: { room: ApartmentPlanRoom; flatId: string | null }[] = [];
  for (const room of plan.rooms) {
    const mapped: ApartmentPlanRoom = { id: room.id, name: room.name, type: room.type || room.name, rect: toMm(room) };
    if (room.flatId === APARTMENT_COMMON_FLAT_ID) commonRooms.push(mapped);
    else if (room.flatId && flatIds.has(room.flatId)) {
      roomsByFlat.set(room.flatId, [...(roomsByFlat.get(room.flatId) ?? []), mapped]);
    } else ungroupedRooms.push({ room: mapped, flatId: room.flatId ?? null });
  }

  return {
    structure: {
      source: 'IMAGE_INTERPRETATION',
      boundary: plan.boundary.points.map(p => ({ x: p.x * sx, y: p.y * sy })),
      flats: plan.flats.map(f => ({
        id: f.id,
        label: f.label,
        unitType: f.unitType,
        rect: toMm(f),
        rooms: roomsByFlat.get(f.id) ?? [],
      })),
      commonRooms,
      ungroupedRooms,
      lifts: (plan.lifts ?? []).map(element),
      stairs: plan.stairs.map(element),
      lobbies: (plan.lobbies ?? []).map(element),
      corridors: (plan.corridors ?? []).map(element),
      shafts: (plan.shafts ?? []).map(element),
      openings: [
        ...plan.doors.map(d => ({
          id: d.id, kind: 'door' as const, rect: toMm(d), adjacentRoomId: d.adjacentRoomId,
          doorType: d.type, swingDirection: d.swingDirection,
        })),
        ...plan.windows.map(w => ({ id: w.id, kind: 'window' as const, rect: toMm(w), adjacentRoomId: w.adjacentRoomId })),
      ],
    },
    diagnostics: [],
  };
}

// ─── Stages 1–3: completeness, manifest match, apartment structure ───────────

const DAY_ROLES: ReadonlySet<ApartmentRoomRole> = new Set(['living', 'dining', 'kitchen']);

/**
 * Classify by typology first, falling back to the visible label. For day
 * spaces only, a combined label (e.g. type "living", label "LIVING/DINING")
 * also fills the dining role; labels never add bedrooms, baths or core roles.
 */
function roomRoles(room: ApartmentPlanRoom): ApartmentRoomRole[] {
  const byType = apartmentRoomRoles(room.type);
  if (byType[0] === 'other') return apartmentRoomRoles(room.name);
  if (byType.every(r => DAY_ROLES.has(r))) {
    const extra = apartmentRoomRoles(room.name).filter(r => (r === 'living' || r === 'dining') && !byType.includes(r));
    return [...byType, ...extra];
  }
  return byType;
}

function roleCounts(rooms: readonly ApartmentPlanRoom[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const room of rooms) for (const role of roomRoles(room)) counts[role] = (counts[role] ?? 0) + 1;
  return counts;
}

export function validateApartmentStructure(
  structure: ApartmentPlanStructure,
  expectation: ApartmentPlanExpectation,
): ApartmentStructureValidation {
  const completeness: DiagnosticFragment[] = [];
  const manifest: DiagnosticFragment[] = [];
  const structural: DiagnosticFragment[] = [];
  const err = (bucket: DiagnosticFragment[], code: string, message: string) => bucket.push({ code, severity: 'error', message });

  // 1. Interpretation completeness
  if (structure.boundary.length < 3) err(completeness, 'APARTMENT_BOUNDARY_MISSING', 'No usable building boundary polygon.');
  if (structure.flats.length === 0) err(completeness, 'APARTMENT_NO_FLATS', 'No apartment units (flats) were identified.');
  const seen = new Set<string>();
  for (const flat of structure.flats) {
    if (seen.has(flat.id)) err(completeness, 'APARTMENT_FLAT_ID_DUPLICATE', `Flat id "${flat.id}" appears more than once.`);
    seen.add(flat.id);
    if (!flat.unitType.trim()) err(completeness, 'APARTMENT_FLAT_UNIT_TYPE_MISSING', `${flat.label} has no unit type.`);
    if (area(flat.rect) <= 0) err(completeness, 'APARTMENT_FLAT_BOUNDARY_DEGENERATE', `${flat.label} has no usable boundary.`);
    if (flat.rooms.length === 0) err(completeness, 'APARTMENT_FLAT_EMPTY', `${flat.label} has no rooms assigned to it.`);
  }
  for (const { room, flatId } of structure.ungroupedRooms) {
    err(completeness, 'APARTMENT_ROOM_UNGROUPED', `Room "${room.name}" is not assigned to a flat or to common space (flatId: ${flatId ?? 'missing'}).`);
  }

  // 2. Manifest match — exact comparisons only
  if (structure.flats.length !== expectation.flats) {
    err(manifest, 'APARTMENT_FLAT_COUNT_MISMATCH', `Requested ${expectation.flats} flat(s), plan has ${structure.flats.length}.`);
  }
  const mix = (types: readonly string[]) => {
    const m = new Map<string, number>();
    for (const t of types) m.set(normalizeApartmentUnitType(t), (m.get(normalizeApartmentUnitType(t)) ?? 0) + 1);
    return m;
  };
  const expectedMix = mix(expectation.units.map(u => u.unitType));
  const actualMix = mix(structure.flats.map(f => f.unitType));
  for (const type of new Set([...expectedMix.keys(), ...actualMix.keys()])) {
    const want = expectedMix.get(type) ?? 0;
    const got = actualMix.get(type) ?? 0;
    if (want !== got) err(manifest, 'APARTMENT_UNIT_MIX_MISMATCH', `Requested ${want} × ${type}, plan has ${got} × ${type}.`);
  }
  if (structure.lifts.length !== expectation.lifts) {
    err(manifest, 'APARTMENT_LIFT_COUNT_MISMATCH', `Requested ${expectation.lifts} lift(s), plan has ${structure.lifts.length}.`);
  }
  if (structure.stairs.length !== expectation.stairs) {
    err(manifest, 'APARTMENT_STAIR_COUNT_MISMATCH', `Requested ${expectation.stairs} stair(s), plan has ${structure.stairs.length}.`);
  }
  if (expectation.commonLobby && structure.lobbies.length === 0) {
    err(manifest, 'APARTMENT_COMMON_LOBBY_MISSING', 'A common lobby is required but none is present.');
  }

  // 3. Apartment-specific structure
  for (const el of [...structure.lifts, ...structure.stairs]) {
    if (el.assignedFlatId) {
      err(structural, 'APARTMENT_CORE_ASSIGNED_TO_UNIT', `Core element "${el.name}" is assigned to flat "${el.assignedFlatId}"; lifts and stairs must be common space.`);
    }
  }
  for (const flat of structure.flats) {
    for (const room of flat.rooms) {
      const roles = roomRoles(room);
      if (roles.some(r => CORE_ROLES.has(r))) {
        err(structural, 'APARTMENT_CORE_ASSIGNED_TO_UNIT', `"${room.name}" is common circulation/core but is assigned to ${flat.label}.`);
      }
      const inside = area(room.rect) > 0 ? overlapArea(room.rect, flat.rect) / area(room.rect) : 0;
      if (inside < ROOM_CONTAINMENT_MIN) {
        err(structural, 'APARTMENT_ROOM_OUTSIDE_UNIT', `"${room.name}" lies outside the ${flat.label} boundary (${Math.round(inside * 100)}% inside).`);
      }
    }
  }
  // Party-wall separation: flats must be distinct, non-overlapping units.
  for (let i = 0; i < structure.flats.length; i++) {
    for (let j = i + 1; j < structure.flats.length; j++) {
      const a = structure.flats[i]!;
      const b = structure.flats[j]!;
      const smaller = Math.min(area(a.rect), area(b.rect));
      const ov = overlapArea(a.rect, b.rect);
      if (smaller <= 0 || ov / smaller > FLAT_OVERLAP_TOLERANCE) {
        err(structural, 'APARTMENT_UNITS_NOT_SEPARATED', `${a.label} and ${b.label} overlap (${smaller > 0 ? Math.round((ov / smaller) * 100) : 100}%); no party-wall separation between units.`);
      }
    }
  }
  for (const el of [...structure.lifts, ...structure.stairs, ...structure.lobbies]) {
    for (const flat of structure.flats) {
      const elArea = area(el.rect);
      if (elArea > 0 && overlapArea(el.rect, flat.rect) / elArea > CORE_INSIDE_FLAT_TOLERANCE) {
        err(structural, 'APARTMENT_CORE_INSIDE_UNIT', `Common element "${el.name}" lies inside ${flat.label}.`);
      }
    }
  }
  // Unit program: nBHK means exactly n bedrooms; manifest minima for the rest.
  const pool = new Map<string, ApartmentUnitExpectation[]>();
  for (const unit of expectation.units) {
    const key = normalizeApartmentUnitType(unit.unitType);
    pool.set(key, [...(pool.get(key) ?? []), unit]);
  }
  const bedroomsByFlat: Record<string, number> = {};
  for (const flat of structure.flats) {
    const counts = roleCounts(flat.rooms);
    const beds = counts.bedroom ?? 0;
    bedroomsByFlat[flat.id] = beds;
    const declared = bhkBedrooms(flat.unitType);
    if (declared !== null && declared !== beds) {
      err(structural, 'APARTMENT_UNIT_TYPE_PROGRAM_MISMATCH', `${flat.label} is labelled ${flat.unitType} but has ${beds} bedroom(s).`);
    }
    const expected = pool.get(normalizeApartmentUnitType(flat.unitType))?.shift();
    if (!expected) continue; // unit-mix mismatch already reported
    if (beds !== expected.bedrooms) {
      err(structural, 'APARTMENT_UNIT_BEDROOM_MISMATCH', `${flat.label} (${flat.unitType}) has ${beds} bedroom(s); manifest requires ${expected.bedrooms}.`);
    }
    const minima: ReadonlyArray<readonly [string, number, 'error' | 'warning']> = [
      ['bathroom', expected.bathrooms, 'error'],
      ['living', expected.livingRooms, 'error'],
      ['dining', expected.diningRooms, 'error'],
      ['kitchen', expected.kitchens, 'error'],
      ['utility', expected.utilities, 'warning'],
      ['balcony', expected.balconies, 'warning'],
    ];
    for (const [role, required, severity] of minima) {
      const got = counts[role] ?? 0;
      if (got < required) {
        structural.push({
          code: severity === 'error' ? 'APARTMENT_UNIT_ROOM_SHORTFALL' : 'APARTMENT_UNIT_OPTIONAL_ROOM_SHORTFALL',
          severity,
          message: `${flat.label} (${flat.unitType}) has ${got} ${role} space(s); manifest lists ${required}.`,
        });
      }
    }
  }

  const status = (bucket: DiagnosticFragment[]): ApartmentStageStatus =>
    bucket.some(i => i.severity === 'error') ? 'FAIL' : 'PASS';
  const issues = [...completeness, ...manifest, ...structural];
  return {
    isValid: !issues.some(i => i.severity === 'error'),
    stages: { completeness: status(completeness), manifestMatch: status(manifest), structural: status(structural) },
    counts: {
      flats: structure.flats.length,
      unitTypes: structure.flats.map(f => normalizeApartmentUnitType(f.unitType)),
      lifts: structure.lifts.length,
      stairs: structure.stairs.length,
      lobbies: structure.lobbies.length,
      bedroomsByFlat,
    },
    issues,
  };
}

// ─── Stage 4: canonical geometry ─────────────────────────────────────────────

const DOOR_TYPE: Readonly<Record<string, string>> = {
  open_passage: 'open_passage', double: 'double', sliding: 'sliding', single: 'single', unknown: 'single',
};

function pointInPolygonWithTolerance(
  p: { x: number; y: number },
  poly: { points: readonly { x: number; y: number }[] },
  tol = 50,
): boolean {
  if (pointInPolygon(p, poly)) return true;
  for (let i = 0; i < poly.points.length; i++) {
    const a = poly.points[i]!;
    const b = poly.points[(i + 1) % poly.points.length]!;
    if (pointToSegmentDistance(p, { start: a, end: b }) <= tol) return true;
  }
  return false;
}

export function generateWallsFromRooms(
  floorId: string,
  rooms: readonly Room[],
): Wall[] {
  const walls: Wall[] = [];
  const edgeMap = new Map<string, { start: { x: number; y: number }; end: { x: number; y: number }; roomIds: string[] }>();

  for (const room of rooms) {
    const x0 = room.x;
    const y0 = room.y;
    const x1 = room.x + room.width;
    const y1 = room.y + room.height;

    const segments = [
      { start: { x: Math.min(x0, x1), y: y0 }, end: { x: Math.max(x0, x1), y: y0 } },
      { start: { x: x1, y: Math.min(y0, y1) }, end: { x: x1, y: Math.max(y0, y1) } },
      { start: { x: Math.min(x0, x1), y: y1 }, end: { x: Math.max(x0, x1), y: y1 } },
      { start: { x: x0, y: Math.min(y0, y1) }, end: { x: x0, y: Math.max(y0, y1) } },
    ];

    for (const seg of segments) {
      const k = seg.start.x === seg.end.x
        ? `v_${seg.start.x}_${seg.start.y}_${seg.end.y}`
        : `h_${seg.start.y}_${seg.start.x}_${seg.end.x}`;

      const entry = edgeMap.get(k);
      if (entry) {
        if (!entry.roomIds.includes(room.id)) {
          entry.roomIds.push(room.id);
        }
      } else {
        edgeMap.set(k, { start: seg.start, end: seg.end, roomIds: [room.id] });
      }
    }
  }

  const roomMap = new Map(rooms.map(r => [r.id, r]));

  for (const [, edge] of edgeMap) {
    const roomObjects = edge.roomIds.map(id => roomMap.get(id)).filter(Boolean);
    const touchesShaft = roomObjects.some(r => r?.type === RoomType.ServiceShaft);
    const isInternal = edge.roomIds.length >= 2 && !touchesShaft;
    const wallType = isInternal ? WallType.Internal : WallType.External;
    const thickness = isInternal ? 100 : 200;

    walls.push(
      createWall({
        floorId,
        startPoint: edge.start,
        endPoint: edge.end,
        type: wallType,
        thickness,
        roomIds: edge.roomIds,
      }),
    );
  }

  return walls;
}

export interface AttachOpeningsResult {
  readonly doors: readonly Door[];
  readonly windows: readonly Window[];
  readonly issues: readonly DiagnosticFragment[];
}

/**
 * Deterministically associates doors and windows to actual host walls on the same floor.
 * Uses opening positions, orientation, spans, adjacent rooms and host-wall geometry.
 * Snaps opening position to lie strictly on the host wall segment.
 * If an opening cannot be attached unambiguously, produces a structured error.
 */
export function attachOpeningsToHostWalls(
  floor: Floor,
  options?: { doorMinEdgeDistance?: number; windowMinEdgeDistance?: number },
): AttachOpeningsResult {
  const issues: DiagnosticFragment[] = [];
  const doorMinEdgeDistance = options?.doorMinEdgeDistance ?? 100;
  const windowMinEdgeDistance = options?.windowMinEdgeDistance ?? 100;

  const roomMap = new Map(floor.rooms.map(r => [r.id, r]));
  const walls = floor.walls;

  const updatedDoors: Door[] = [];
  for (const door of floor.doors) {
    const [rAId, rBId] = door.connectsRooms;
    const rA = roomMap.get(rAId);
    const isOutsideB = rBId === '__outside__';
    const rB = isOutsideB ? null : roomMap.get(rBId);

    if (!rA) {
      issues.push({
        code: 'DOOR_ROOM_NOT_FOUND',
        severity: 'error',
        message: `Door "${door.id}" references room "${rAId}" which does not exist on floor ${floor.id}.`,
      });
      continue;
    }
    if (!isOutsideB && !rB) {
      issues.push({
        code: 'DOOR_ROOM_NOT_FOUND',
        severity: 'error',
        message: `Door "${door.id}" references room "${rBId}" which does not exist on floor ${floor.id}.`,
      });
      continue;
    }

    let candidates = walls.filter(w => {
      if (isOutsideB) {
        return w.roomIds.includes(rAId) && w.type === WallType.External;
      }
      return w.roomIds.includes(rAId) && w.roomIds.includes(rBId);
    });

    if (candidates.length === 0) {
      candidates = walls.filter(w => w.roomIds.includes(rAId));
    }

    if (candidates.length === 0) {
      issues.push({
        code: 'DOOR_HOST_WALL_NOT_FOUND',
        severity: 'error',
        message: `Door "${door.id}" has no candidate host wall for room "${rAId}".`,
      });
      continue;
    }

    let bestWall: Wall | null = null;
    let bestDist = Infinity;
    let bestAlignedPos: { x: number; y: number } | null = null;

    for (const wall of candidates) {
      const minX = Math.min(wall.startPoint.x, wall.endPoint.x);
      const maxX = Math.max(wall.startPoint.x, wall.endPoint.x);
      const minY = Math.min(wall.startPoint.y, wall.endPoint.y);
      const maxY = Math.max(wall.startPoint.y, wall.endPoint.y);
      const isHorizontal = Math.abs(wall.startPoint.y - wall.endPoint.y) <= 5;
      const isVertical = Math.abs(wall.startPoint.x - wall.endPoint.x) <= 5;

      if (!isHorizontal && !isVertical) continue;

      let dist = Infinity;
      let alignedPos: { x: number; y: number } | null = null;

      if (isHorizontal) {
        const wallY = wall.startPoint.y;
        dist = Math.abs(door.position.y - wallY);
        const wallLen = maxX - minX;
        if (wallLen >= door.width + 2 * doorMinEdgeDistance) {
          const clampedX = Math.max(minX + doorMinEdgeDistance, Math.min(maxX - door.width - doorMinEdgeDistance, door.position.x));
          alignedPos = { x: clampedX, y: wallY };
        }
      } else {
        const wallX = wall.startPoint.x;
        dist = Math.abs(door.position.x - wallX);
        const wallLen = maxY - minY;
        if (wallLen >= door.width + 2 * doorMinEdgeDistance) {
          const clampedY = Math.max(minY + doorMinEdgeDistance, Math.min(maxY - door.width - doorMinEdgeDistance, door.position.y));
          alignedPos = { x: wallX, y: clampedY };
        }
      }

      if (alignedPos && dist < bestDist && dist <= 300) {
        bestDist = dist;
        bestWall = wall;
        bestAlignedPos = alignedPos;
      }
    }

    if (!bestWall || !bestAlignedPos) {
      issues.push({
        code: 'DOOR_HOST_WALL_NOT_FOUND',
        severity: 'error',
        message: `Door "${door.id}" could not be geometrically associated with a host wall near (${door.position.x}, ${door.position.y}).`,
      });
      continue;
    }

    const updatedDoor: Door = {
      ...door,
      wallId: bestWall.id,
      position: bestAlignedPos,
    };

    const placement = validateDoorPlacement(updatedDoor, bestWall, doorMinEdgeDistance);
    if (!placement.valid) {
      issues.push({
        code: 'DOOR_PLACEMENT_INVALID',
        severity: 'error',
        message: `Door "${door.id}" placement on wall "${bestWall.id}" is invalid: ${placement.reason}`,
      });
      continue;
    }

    updatedDoors.push(updatedDoor);
  }

  const updatedWindows: Window[] = [];
  for (const win of floor.windows) {
    const room = roomMap.get(win.roomId);
    if (!room) {
      issues.push({
        code: 'WINDOW_ROOM_NOT_FOUND',
        severity: 'error',
        message: `Window "${win.id}" references room "${win.roomId}" which does not exist on floor ${floor.id}.`,
      });
      continue;
    }

    const candidates = walls.filter(w => {
      if (!w.roomIds.includes(win.roomId)) return false;
      if (w.type === WallType.External) return true;
      return w.roomIds.some(id => roomMap.get(id)?.type === RoomType.ServiceShaft);
    });

    if (candidates.length === 0) {
      issues.push({
        code: 'WINDOW_HOST_WALL_NOT_FOUND',
        severity: 'error',
        message: `Window "${win.id}" has no exterior or shaft host wall for room "${win.roomId}".`,
      });
      continue;
    }

    let bestWall: Wall | null = null;
    let bestDist = Infinity;
    let bestAlignedPos: { x: number; y: number } | null = null;

    for (const wall of candidates) {
      const minX = Math.min(wall.startPoint.x, wall.endPoint.x);
      const maxX = Math.max(wall.startPoint.x, wall.endPoint.x);
      const minY = Math.min(wall.startPoint.y, wall.endPoint.y);
      const maxY = Math.max(wall.startPoint.y, wall.endPoint.y);
      const isHorizontal = Math.abs(wall.startPoint.y - wall.endPoint.y) <= 5;
      const isVertical = Math.abs(wall.startPoint.x - wall.endPoint.x) <= 5;

      if (!isHorizontal && !isVertical) continue;

      let dist = Infinity;
      let alignedPos: { x: number; y: number } | null = null;

      if (isHorizontal) {
        const wallY = wall.startPoint.y;
        dist = Math.abs(win.position.y - wallY);
        const wallLen = maxX - minX;
        if (wallLen >= win.width + 2 * windowMinEdgeDistance) {
          const clampedX = Math.max(minX + windowMinEdgeDistance, Math.min(maxX - win.width - windowMinEdgeDistance, win.position.x));
          alignedPos = { x: clampedX, y: wallY };
        }
      } else {
        const wallX = wall.startPoint.x;
        dist = Math.abs(win.position.x - wallX);
        const wallLen = maxY - minY;
        if (wallLen >= win.width + 2 * windowMinEdgeDistance) {
          const clampedY = Math.max(minY + windowMinEdgeDistance, Math.min(maxY - win.width - windowMinEdgeDistance, win.position.y));
          alignedPos = { x: wallX, y: clampedY };
        }
      }

      if (alignedPos && dist < bestDist && dist <= 300) {
        bestDist = dist;
        bestWall = wall;
        bestAlignedPos = alignedPos;
      }
    }

    if (!bestWall || !bestAlignedPos) {
      issues.push({
        code: 'WINDOW_HOST_WALL_NOT_FOUND',
        severity: 'error',
        message: `Window "${win.id}" could not be geometrically associated with a host wall near (${win.position.x}, ${win.position.y}).`,
      });
      continue;
    }

    const updatedWindow: Window = {
      ...win,
      wallId: bestWall.id,
      position: bestAlignedPos,
    };

    const placement = validateWindowPlacement(updatedWindow, bestWall, windowMinEdgeDistance, true);
    if (!placement.valid) {
      issues.push({
        code: 'WINDOW_PLACEMENT_INVALID',
        severity: 'error',
        message: `Window "${win.id}" placement on wall "${bestWall.id}" is invalid: ${placement.reason}`,
      });
      continue;
    }

    updatedWindows.push(updatedWindow);
  }

  return {
    doors: updatedDoors,
    windows: updatedWindows,
    issues,
  };
}

/**
 * Build the canonical Building Model from a validated structure using the
 * core factories. Every room keeps its flat/core membership as tags so the
 * editable plan preserves unit grouping and provenance.
 */
export function apartmentStructureToBuilding(
  structure: ApartmentPlanStructure,
  site: ExtractionSite,
  projectId: string,
  name: string,
): { building: Building; diagnostics: DiagnosticFragment[] } {
  const diagnostics: DiagnosticFragment[] = [];
  const flatBoundaries = structure.flats.map(flat => ({
    flatId: flat.id,
    label: flat.label,
    unitType: flat.unitType,
    rect: flat.rect,
    boundary: rectToPolygon(flat.rect.x, flat.rect.y, flat.rect.width, flat.rect.height),
  }));

  const base = createBuilding({
    projectId,
    name,
    site: {
      plotWidth: site.plotWidth,
      plotDepth: site.plotDepth,
      plotShape: PlotShape.Rectangular,
      orientation: site.orientation,
      roadFacing: site.roadFacing as Direction,
      setbacks: { front: site.frontSetback, rear: site.rearSetback, left: site.leftSetback, right: site.rightSetback },
    },
    floors: [{
      buildingId: 'floor-apartment',
      level: 0,
      name: 'Typical Residential Floor',
      boundary: { points: structure.boundary.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) })) },
    }],
    metadata: {
      flatBoundaries,
    },
  });
  const floorId = base.floors[0]!.id;
  const sourceTag = `source:${structure.source.toLowerCase()}`;
  const rooms: Room[] = [];

  const add = (id: string, roomName: string, type: RoomType, rect: ApartmentRectMm, tags: string[], fixed: boolean) => {
    const x = Math.round(rect.x);
    const y = Math.round(rect.y);
    const width = Math.round(rect.x + rect.width) - x;
    const height = Math.round(rect.y + rect.height) - y;
    const minArea = (MINIMUM_ROOM_AREAS as Record<string, number | undefined>)[type];
    const minDimension = (MINIMUM_DIMENSIONS as Record<string, number | undefined>)[type];
    rooms.push(createRoom({
      floorId,
      name: roomName,
      type,
      x,
      y,
      width,
      height,
      tags: [`apt-room:${id}`, sourceTag, ...tags],
      ...(minArea !== undefined ? { minArea } : {}),
      ...(minDimension !== undefined ? { minWidthMm: minDimension, minHeightMm: minDimension } : {}),
      daylightRequirement: 'medium' as never,
      privacyRequirement: (type === RoomType.Bedroom || type === RoomType.Bathroom ? 'high' : 'low') as never,
      isFixed: fixed,
    }));
  };

  for (const flat of structure.flats) {
    const unitTag = `unit-type:${normalizeApartmentUnitType(flat.unitType)}`;
    for (const room of flat.rooms) {
      const type = ROLE_ROOM_TYPE[roomRoles(room)[0] ?? 'other'];
      add(room.id, `${flat.label} ${room.name}`, type, room.rect, [`flat:${flat.id}`, unitTag, `apt-canonical-type:${room.type}`, `apt-flat:${flat.id}`], false);
    }
  }
  for (const room of structure.commonRooms) {
    add(room.id, room.name, ROLE_ROOM_TYPE[roomRoles(room)[0] ?? 'other'], room.rect, ['common:room'], false);
  }
  for (const el of structure.lifts) add(el.id, el.name, RoomType.Lift, el.rect, ['core:lift'], true);
  for (const el of structure.stairs) add(el.id, el.name, RoomType.Staircase, el.rect, ['core:stair'], true);
  for (const el of structure.lobbies) add(el.id, el.name, RoomType.Corridor, el.rect, ['core:lobby'], true);
  for (const el of structure.corridors) add(el.id, el.name, RoomType.Corridor, el.rect, ['core:corridor'], true);
  for (const el of structure.shafts) add(el.id, el.name, RoomType.ServiceShaft, el.rect, ['core:shaft'], true);

  const initialDoors: Door[] = [];
  const initialWindows: Window[] = [];
  for (const opening of structure.openings) {
    const adjacent = rooms.find(r => r.tags.includes(`apt-room:${opening.adjacentRoomId}`));
    if (!adjacent) {
      diagnostics.push({
        code: 'APARTMENT_OPENING_SKIPPED',
        severity: 'warning',
        message: `${opening.kind === 'door' ? 'Door' : 'Window'} "${opening.id}" was not attached: adjacent room "${opening.adjacentRoomId}" is not in the plan.`,
      });
      continue;
    }
    const position = { x: Math.round(opening.rect.x), y: Math.round(opening.rect.y) };
    const otherId = opening.connects?.find(id => id !== opening.adjacentRoomId);
    const other = otherId ? rooms.find(r => r.tags.includes(`apt-room:${otherId}`)) : undefined;
    if (opening.kind === 'door') {
      initialDoors.push({
        id: opening.id,
        floorId,
        wallId: '__extracted__',
        position,
        width: Math.max(1, Math.round(Math.max(opening.rect.width, opening.rect.height))),
        height: 2100,
        type: (DOOR_TYPE[opening.doorType ?? 'unknown'] ?? 'single') as never,
        swingDirection: (['outward', 'left', 'right'].includes(opening.swingDirection ?? '') ? opening.swingDirection : 'inward') as never,
        connectsRooms: [adjacent.id, other?.id ?? '__outside__'] as [string, string],
      });
    } else {
      const span = Math.max(1, Math.round(Math.max(opening.rect.width, opening.rect.height)));
      initialWindows.push({
        id: opening.id,
        floorId,
        wallId: '__extracted__',
        position,
        width: span,
        height: 1200,
        sillHeight: 900,
        type: 'sliding' as never,
        roomId: adjacent.id,
      });
    }
  }

  // Generate walls from rooms and attach openings deterministically
  const walls = generateWallsFromRooms(floorId, rooms);
  const floorCandidate: Floor = {
    ...base.floors[0]!,
    rooms,
    walls,
    doors: initialDoors,
    windows: initialWindows,
  };

  const { doors: attachedDoors, windows: attachedWindows, issues: attachIssues } = attachOpeningsToHostWalls(floorCandidate);
  diagnostics.push(...attachIssues);

  return {
    building: {
      ...base,
      floors: [{
        ...floorCandidate,
        doors: attachedDoors,
        windows: attachedWindows,
      }],
      metadata: {
        ...base.metadata,
        flatBoundaries,
        ...(attachIssues.length > 0 ? { openingIssues: attachIssues } : {}),
      },
    },
    diagnostics,
  };
}

// ─── Stage 5: existing deterministic geometry validation ─────────────────────

export interface ClassifiedFlatRooms {
  readonly bedrooms: readonly Room[];
  readonly bathrooms: readonly Room[];
  readonly livingRooms: readonly Room[];
  readonly diningAreas: readonly Room[];
  readonly kitchens: readonly Room[];
  readonly utilities: readonly Room[];
  readonly balconies: readonly Room[];
  readonly otherRooms: readonly Room[];
}

export function classifyCanonicalFlatRooms(rooms: readonly Room[], unitType: string): ClassifiedFlatRooms {
  const normType = normalizeApartmentUnitType(unitType);
  const isStudio = normType === 'STUDIO';

  const bedrooms: Room[] = [];
  const bathrooms: Room[] = [];
  const livingRooms: Room[] = [];
  const diningAreas: Room[] = [];
  const kitchens: Room[] = [];
  const utilities: Room[] = [];
  const balconies: Room[] = [];
  const otherRooms: Room[] = [];

  const hasSeparateDining = rooms.some(r => r.type === RoomType.Dining);

  for (const r of rooms) {
    const rawName = r.name.toLowerCase();
    const canonType = r.tags.find(t => t.startsWith('apt-canonical-type:'))?.replace('apt-canonical-type:', '') ?? '';

    if (r.type === RoomType.Bedroom) {
      bedrooms.push(r);
    } else if (r.type === RoomType.Bathroom) {
      bathrooms.push(r);
    } else if (r.type === RoomType.Kitchen) {
      kitchens.push(r);
    } else if (r.type === RoomType.Utility) {
      utilities.push(r);
    } else if (r.type === RoomType.Balcony) {
      balconies.push(r);
    } else if (r.type === RoomType.Dining) {
      diningAreas.push(r);
    } else if (r.type === RoomType.Living) {
      livingRooms.push(r);
      const isLivingDining = canonType === 'living_dining' || /living.*dining|dining.*living|hall/i.test(rawName);
      if (!isStudio && isLivingDining && !hasSeparateDining) {
        // Combined living/dining satisfies dining for 1BHK–4BHK, but only if separate dining room not present
        diningAreas.push(r);
      }
    } else {
      otherRooms.push(r);
    }
  }

  return {
    bedrooms,
    bathrooms,
    livingRooms,
    diningAreas,
    kitchens,
    utilities,
    balconies,
    otherRooms,
  };
}

function matchFlatRooms(
  expectedUnit: ApartmentUnitExpectation,
  allResidentialRooms: readonly Room[],
  unitIndex: number,
  uniqueFlatIds: readonly string[],
): Room[] {
  const normExpected = expectedUnit.label.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Direct tag match
  const byTag = allResidentialRooms.filter(r => {
    return r.tags.some(t => {
      if (!t.startsWith('flat:')) return false;
      const tagVal = t.slice(5).toLowerCase().replace(/[^a-z0-9]/g, '');
      return tagVal === normExpected || tagVal.includes(normExpected) || normExpected.includes(tagVal);
    });
  });
  if (byTag.length > 0) return byTag;

  // 2. Name prefix match
  const byName = allResidentialRooms.filter(r => {
    const normName = r.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return normName.startsWith(normExpected);
  });
  if (byName.length > 0) return byName;

  // 3. Index match among unique flat tags
  if (unitIndex < uniqueFlatIds.length) {
    const targetId = uniqueFlatIds[unitIndex]!;
    return allResidentialRooms.filter(r => r.tags.includes(`flat:${targetId}`));
  }

  return [];
}

/** Structure counts measured on the canonical Building itself (tags). */
export function measureApartmentBuilding(building: Building): {
  readonly flats: number;
  readonly lifts: number;
  readonly stairs: number;
  readonly lobbies: number;
  readonly bedrooms: number;
} {
  const rooms = building.floors.flatMap(f => f.rooms);
  const flats = new Set<string>();
  let lifts = 0;
  let stairs = 0;
  let lobbies = 0;
  let bedrooms = 0;
  for (const room of rooms) {
    for (const tag of room.tags) {
      if (tag.startsWith('flat:')) flats.add(tag);
      if (tag === 'core:lift') lifts++;
      if (tag === 'core:stair') stairs++;
      if (tag === 'core:lobby') lobbies++;
    }
    if (room.type === RoomType.Bedroom && room.tags.some(t => t.startsWith('flat:'))) bedrooms++;
  }
  return { flats: flats.size, lifts, stairs, lobbies, bedrooms };
}

export function validateCanonicalApartmentBuilding(
  building: Building,
  expectation: ApartmentPlanExpectation,
): ExtractedPlanValidation {
  const diagnostics = evaluateDesign(building, { requiredRoomTypes: ['living', 'bedroom'] as never });
  const issues: DiagnosticFragment[] = [];

  for (const warning of diagnostics.warnings) {
    if (warning.severity === 'error') issues.push({ code: `CANONICAL_${warning.code}`, severity: 'error', message: warning.message });
  }

  // ── 1. Per-floor multi-floor-safe validations ──
  for (const floor of building.floors) {
    // A. Entity floor ownership
    for (const room of floor.rooms) {
      if (room.floorId !== floor.id) {
        issues.push({
          code: 'CANONICAL_INVALID_FLOOR_OWNERSHIP',
          severity: 'error',
          message: `Room "${room.id}" has floorId "${room.floorId}" which does not match floor "${floor.id}".`,
        });
      }
    }
    for (const wall of floor.walls) {
      if (wall.floorId !== floor.id) {
        issues.push({
          code: 'CANONICAL_INVALID_FLOOR_OWNERSHIP',
          severity: 'error',
          message: `Wall "${wall.id}" has floorId "${wall.floorId}" which does not match floor "${floor.id}".`,
        });
      }
      if (!Number.isFinite(wall.startPoint.x) || !Number.isFinite(wall.startPoint.y) ||
          !Number.isFinite(wall.endPoint.x) || !Number.isFinite(wall.endPoint.y)) {
        issues.push({
          code: 'CANONICAL_WALL_GEOMETRY_INVALID',
          severity: 'error',
          message: `Wall "${wall.id}" has non-finite coordinates.`,
        });
      }
      const len = Math.hypot(wall.endPoint.x - wall.startPoint.x, wall.endPoint.y - wall.startPoint.y);
      if (len <= 0) {
        issues.push({
          code: 'CANONICAL_WALL_GEOMETRY_INVALID',
          severity: 'error',
          message: `Wall "${wall.id}" has zero length.`,
        });
      }
      for (const rid of wall.roomIds) {
        if (!floor.rooms.some(r => r.id === rid)) {
          issues.push({
            code: 'CANONICAL_WALL_ROOM_NOT_FOUND',
            severity: 'error',
            message: `Wall "${wall.id}" references room "${rid}" which does not exist on floor "${floor.id}".`,
          });
        }
      }
    }

    const wallMap = new Map(floor.walls.map(w => [w.id, w]));

    // B. Doors integrity & host wall placement
    for (const door of floor.doors) {
      if (door.floorId !== floor.id) {
        issues.push({
          code: 'CANONICAL_INVALID_FLOOR_OWNERSHIP',
          severity: 'error',
          message: `Door "${door.id}" has floorId "${door.floorId}" which does not match floor "${floor.id}".`,
        });
      }
      if (!door.wallId || door.wallId === '__extracted__') {
        issues.push({
          code: 'CANONICAL_DOOR_HOST_WALL_INVALID',
          severity: 'error',
          message: `Door "${door.id}" retains placeholder or missing wallId ("${door.wallId}").`,
        });
        continue;
      }
      const hostWall = wallMap.get(door.wallId);
      if (!hostWall) {
        issues.push({
          code: 'CANONICAL_DOOR_HOST_WALL_NOT_FOUND',
          severity: 'error',
          message: `Door "${door.id}" references host wall "${door.wallId}" which does not exist on floor "${floor.id}".`,
        });
        continue;
      }

      const [rA, rB] = door.connectsRooms;
      if (!floor.rooms.some(r => r.id === rA)) {
        issues.push({
          code: 'CANONICAL_DOOR_ROOM_NOT_FOUND',
          severity: 'error',
          message: `Door "${door.id}" references connected room "${rA}" which does not exist on floor "${floor.id}".`,
        });
      }
      if (rB !== '__outside__' && !floor.rooms.some(r => r.id === rB)) {
        issues.push({
          code: 'CANONICAL_DOOR_ROOM_NOT_FOUND',
          severity: 'error',
          message: `Door "${door.id}" references connected room "${rB}" which does not exist on floor "${floor.id}".`,
        });
      }

      if (!hostWall.roomIds.includes(rA) && (rB === '__outside__' || !hostWall.roomIds.includes(rB))) {
        issues.push({
          code: 'CANONICAL_DOOR_ROOMS_NOT_ON_HOST_WALL',
          severity: 'error',
          message: `Host wall "${hostWall.id}" does not connect rooms [${door.connectsRooms.join(', ')}].`,
        });
      }

      const placement = validateDoorPlacement(door, hostWall, 50);
      if (!placement.valid) {
        issues.push({
          code: 'CANONICAL_DOOR_PLACEMENT_INVALID',
          severity: 'error',
          message: `Door "${door.id}" placement on wall "${hostWall.id}" is invalid: ${placement.reason}`,
        });
      }
    }

    // C. Windows integrity & host wall placement
    for (const win of floor.windows) {
      if (win.floorId !== floor.id) {
        issues.push({
          code: 'CANONICAL_INVALID_FLOOR_OWNERSHIP',
          severity: 'error',
          message: `Window "${win.id}" has floorId "${win.floorId}" which does not match floor "${floor.id}".`,
        });
      }
      if (!win.wallId || win.wallId === '__extracted__') {
        issues.push({
          code: 'CANONICAL_WINDOW_HOST_WALL_INVALID',
          severity: 'error',
          message: `Window "${win.id}" retains placeholder or missing wallId ("${win.wallId}").`,
        });
        continue;
      }
      const hostWall = wallMap.get(win.wallId);
      if (!hostWall) {
        issues.push({
          code: 'CANONICAL_WINDOW_HOST_WALL_NOT_FOUND',
          severity: 'error',
          message: `Window "${win.id}" references host wall "${win.wallId}" which does not exist on floor "${floor.id}".`,
        });
        continue;
      }
      if (!floor.rooms.some(r => r.id === win.roomId)) {
        issues.push({
          code: 'CANONICAL_WINDOW_ROOM_NOT_FOUND',
          severity: 'error',
          message: `Window "${win.id}" references room "${win.roomId}" which does not exist on floor "${floor.id}".`,
        });
      }
      if (!hostWall.roomIds.includes(win.roomId)) {
        issues.push({
          code: 'CANONICAL_WINDOW_ROOM_NOT_ON_HOST_WALL',
          severity: 'error',
          message: `Host wall "${hostWall.id}" does not bound window room "${win.roomId}".`,
        });
      }
      const touchesShaft = hostWall.roomIds.some(id => floor.rooms.find(r => r.id === id)?.type === RoomType.ServiceShaft);
      if (hostWall.type !== WallType.External && !touchesShaft) {
        issues.push({
          code: 'CANONICAL_WINDOW_ON_INTERNAL_WALL',
          severity: 'error',
          message: `Window "${win.id}" is hosted on an internal wall that does not face an exterior facade or service shaft.`,
        });
      }
      const placement = validateWindowPlacement(win, hostWall, 50, true);
      if (!placement.valid) {
        issues.push({
          code: 'CANONICAL_WINDOW_PLACEMENT_INVALID',
          severity: 'error',
          message: `Window "${win.id}" placement on wall "${hostWall.id}" is invalid: ${placement.reason}`,
        });
      }
    }

    // D. Stairs integrity
    for (const stair of floor.stairs) {
      if (stair.floorId !== floor.id) {
        issues.push({
          code: 'CANONICAL_INVALID_FLOOR_OWNERSHIP',
          severity: 'error',
          message: `Stair "${stair.id}" has floorId "${stair.floorId}" which does not match floor "${floor.id}".`,
        });
      }
      const [fromLevel, toLevel] = stair.connectsFloors;
      if (fromLevel < 0 || toLevel < 0) {
        issues.push({
          code: 'CANONICAL_STAIR_LEVEL_INVALID',
          severity: 'error',
          message: `Stair "${stair.id}" references invalid floor levels: [${fromLevel}, ${toLevel}].`,
        });
      }
    }

    // E. Collision detection strictly scoped to entities on the same floor
    const collisions = floor.rooms.flatMap(room => detectRoomCollisions(room, floor.rooms));
    if (collisions.length > 0) {
      const names = new Map(floor.rooms.map(r => [r.id, r.name]));
      const sample = collisions.slice(0, 4).map(c => `${names.get(c.entityA)} ↔ ${names.get(c.entityB)}`).join('; ');
      issues.push({
        code: 'CANONICAL_ROOM_COLLISIONS',
        severity: 'error',
        message: `Floor ${floor.level}: ${collisions.length / 2} room overlap(s): ${sample}.`,
      });
    }

    // F. Floor boundary containment on EVERY floor
    const outside = floor.rooms.filter(r => !containsPolygon(floor.boundary, r.boundary));
    if (outside.length > 0) {
      issues.push({
        code: 'CANONICAL_ROOMS_OUT_OF_BOUNDS',
        severity: 'error',
        message: `Floor ${floor.level}: ${outside.length} room(s) fall outside the floor boundary.`,
      });
    }
  }

  // ── 2. Residential rooms flat ownership validation ──
  const allResidentialRooms = building.floors.flatMap(f => f.rooms).filter(r => {
    const isCore = r.tags.some(t => t.startsWith('core:') || t === 'common:room');
    return !isCore && r.type !== RoomType.Lift && r.type !== RoomType.Staircase && r.type !== RoomType.ServiceShaft;
  });

  const uniqueFlatIds: string[] = [];
  const expectedNormLabels = new Set(expectation.units.map(u => u.label.toLowerCase().replace(/[^a-z0-9]/g, '')));

  for (const r of allResidentialRooms) {
    const flatTags = r.tags.filter(t => t.startsWith('flat:'));
    if (flatTags.length === 0) {
      issues.push({
        code: 'CANONICAL_MISSING_FLAT_OWNERSHIP',
        severity: 'error',
        message: `Residential room "${r.name}" (${r.id}) has no flat ownership tag.`,
      });
    } else {
      const distinct = new Set(flatTags);
      if (distinct.size > 1) {
        issues.push({
          code: 'CANONICAL_CONFLICTING_FLAT_OWNERSHIP',
          severity: 'error',
          message: `Residential room "${r.name}" (${r.id}) has conflicting flat ownership tags: ${[...distinct].join(', ')}.`,
        });
      }
      for (const ft of distinct) {
        const flatId = ft.slice(5);
        if (!uniqueFlatIds.includes(flatId)) uniqueFlatIds.push(flatId);
        const normId = flatId.toLowerCase().replace(/[^a-z0-9]/g, '');
        const matchesAny = [...expectedNormLabels].some(enl => enl === normId || enl.includes(normId) || normId.includes(enl));
        if (!matchesAny && expectedNormLabels.size > 0 && uniqueFlatIds.indexOf(flatId) >= expectation.units.length) {
          issues.push({
            code: 'CANONICAL_UNKNOWN_FLAT_OWNERSHIP',
            severity: 'error',
            message: `Residential room "${r.name}" (${r.id}) references unknown flat ID "${flatId}".`,
          });
        }
      }
    }
  }

  // ── 3. Exact 7-category Room Programme per flat ──
  for (let i = 0; i < expectation.units.length; i++) {
    const u = expectation.units[i]!;
    const flatRooms = matchFlatRooms(u, allResidentialRooms, i, uniqueFlatIds);
    if (flatRooms.length === 0) {
      issues.push({
        code: 'CANONICAL_FLAT_MISSING_ROOMS',
        severity: 'error',
        message: `No rooms found for flat "${u.label}" (${u.unitType}) in canonical building model.`,
      });
      continue;
    }

    const classified = classifyCanonicalFlatRooms(flatRooms, u.unitType);

    if (classified.bedrooms.length !== u.bedrooms) {
      const code = classified.bedrooms.length < u.bedrooms ? 'CANONICAL_SHORTFALL_BEDROOMS' : 'CANONICAL_EXCESS_BEDROOMS';
      issues.push({
        code,
        severity: 'error',
        message: `Flat "${u.label}" has ${classified.bedrooms.length} bedrooms; expected ${u.bedrooms}.`,
      });
    }

    if (classified.bathrooms.length !== u.bathrooms) {
      const code = classified.bathrooms.length < u.bathrooms ? 'CANONICAL_SHORTFALL_BATHROOMS' : 'CANONICAL_EXCESS_BATHROOMS';
      issues.push({
        code,
        severity: 'error',
        message: `Flat "${u.label}" has ${classified.bathrooms.length} bathrooms; expected ${u.bathrooms}.`,
      });
    }

    if (classified.livingRooms.length !== u.livingRooms) {
      issues.push({
        code: 'CANONICAL_LIVING_COUNT_MISMATCH',
        severity: 'error',
        message: `Flat "${u.label}" has ${classified.livingRooms.length} living spaces; expected ${u.livingRooms}.`,
      });
    }

    if (classified.diningAreas.length !== u.diningRooms) {
      issues.push({
        code: 'CANONICAL_DINING_COUNT_MISMATCH',
        severity: 'error',
        message: `Flat "${u.label}" has ${classified.diningAreas.length} dining areas; expected ${u.diningRooms}.`,
      });
    }

    if (classified.kitchens.length !== u.kitchens) {
      issues.push({
        code: 'CANONICAL_KITCHEN_COUNT_MISMATCH',
        severity: 'error',
        message: `Flat "${u.label}" has ${classified.kitchens.length} kitchens; expected ${u.kitchens}.`,
      });
    }

    if (classified.utilities.length !== u.utilities) {
      issues.push({
        code: 'CANONICAL_UTILITY_COUNT_MISMATCH',
        severity: 'error',
        message: `Flat "${u.label}" has ${classified.utilities.length} utilities; expected ${u.utilities}.`,
      });
    }

    if (classified.balconies.length !== u.balconies) {
      issues.push({
        code: 'CANONICAL_BALCONY_COUNT_MISMATCH',
        severity: 'error',
        message: `Flat "${u.label}" has ${classified.balconies.length} balconies; expected ${u.balconies}.`,
      });
    }
  }

  // ── 4. Room-to-flat boundary containment & inter-flat isolation ──
  const flatBoundaries = (building.metadata as any)?.flatBoundaries as Array<{
    flatId: string;
    label: string;
    boundary: { points: Array<{ x: number; y: number }> };
    rect?: ApartmentRectMm;
  }> | undefined;

  if (flatBoundaries && flatBoundaries.length > 0) {
    for (const fb of flatBoundaries) {
      const fbPolygon = fb.boundary;
      const flatTag = `flat:${fb.flatId}`;
      const roomsOfFlat = allResidentialRooms.filter(r => r.tags.includes(flatTag) || r.tags.some(t => t.toLowerCase() === flatTag.toLowerCase()));

      for (const r of roomsOfFlat) {
        const isContained = containsPolygon(fbPolygon, r.boundary);
        if (!isContained) {
          const pointsOutside = r.boundary.points.filter(p => !pointInPolygonWithTolerance(p, fbPolygon, 50));
          if (pointsOutside.length > 0) {
            issues.push({
              code: 'CANONICAL_ROOM_OUTSIDE_FLAT_BOUNDARY',
              severity: 'error',
              message: `Room "${r.name}" (${r.id}) falls outside declared flat boundary for "${fb.label}".`,
            });
          }
        }
      }

      // Party wall encroachment: rooms of other flats must not encroach into fbPolygon
      const otherFlatRooms = allResidentialRooms.filter(r => !r.tags.includes(flatTag) && !r.tags.some(t => t.toLowerCase() === flatTag.toLowerCase()));
      for (const otherRoom of otherFlatRooms) {
        const overlap = polygonIntersectionArea(otherRoom.boundary, fbPolygon);
        const roomArea = otherRoom.width * otherRoom.height;
        if (overlap > 0.01 * roomArea && overlap > 50000) {
          issues.push({
            code: 'CANONICAL_ROOM_ENCROACHES_OTHER_FLAT',
            severity: 'error',
            message: `Room "${otherRoom.name}" encroaches into private area of flat "${fb.label}" (${Math.round(overlap / 1e6 * 100) / 100} m² overlap).`,
          });
        }
      }

      // Common core elements must not lie inside flat boundary (>10% overlap)
      const coreRooms = building.floors.flatMap(f => f.rooms).filter(r => r.tags.some(t => t.startsWith('core:')));
      for (const core of coreRooms) {
        const overlap = polygonIntersectionArea(core.boundary, fbPolygon);
        const coreArea = core.width * core.height;
        if (overlap > 0.10 * coreArea && overlap > 100000) {
          issues.push({
            code: 'CANONICAL_CORE_INSIDE_FLAT',
            severity: 'error',
            message: `Common core element "${core.name}" sits inside private flat boundary "${fb.label}".`,
          });
        }
      }
    }
  }

  // ── 5. Re-measured aggregate checks ──
  const measured = measureApartmentBuilding(building);
  const expectedBedrooms = expectation.units.reduce((s, u) => s + u.bedrooms, 0);
  const checks: ReadonlyArray<readonly [string, number, number]> = [
    ['flats', measured.flats, expectation.flats],
    ['lifts', measured.lifts, expectation.lifts],
    ['stairs', measured.stairs, expectation.stairs],
    ['bedrooms', measured.bedrooms, expectedBedrooms],
  ];
  for (const [label, got, want] of checks) {
    if (got !== want) {
      issues.push({ code: 'CANONICAL_COUNT_MISMATCH', severity: 'error', message: `Canonical plan has ${got} ${label}; manifest requires ${want}.` });
    }
  }
  if (expectation.commonLobby && measured.lobbies === 0) {
    issues.push({ code: 'CANONICAL_COUNT_MISMATCH', severity: 'error', message: 'Canonical plan has no common lobby; manifest requires one.' });
  }

  // Include any opening attachment issues
  const metaOpeningIssues = (building.metadata as any)?.openingIssues as DiagnosticFragment[] | undefined;
  if (metaOpeningIssues && metaOpeningIssues.length > 0) {
    for (const oi of metaOpeningIssues) {
      issues.push({ code: `CANONICAL_${oi.code}`, severity: oi.severity, message: oi.message });
    }
  }

  const isValid = issues.length === 0 && diagnostics.geometryHealthy;
  return {
    isValid,
    recommendedForEditing: isValid,
    geometryHealthy: diagnostics.geometryHealthy,
    overallScore: diagnostics.overallScore,
    verificationIssues: issues,
  };
}

// ─── Ordered pipeline (stages 1 → 5) ─────────────────────────────────────────

export interface ApartmentPlanValidationResult {
  readonly status: 'ACCEPTED' | 'REJECTED';
  readonly source: ApartmentPlanSource;
  /** Canonical editable Building; present only when ACCEPTED. */
  readonly building: Building | null;
  readonly stages: {
    readonly completeness: ApartmentStageStatus;
    readonly manifestMatch: ApartmentStageStatus;
    readonly structural: ApartmentStageStatus;
    readonly canonicalGeometry: ApartmentStageStatus;
    readonly geometryValidation: ApartmentStageStatus;
  };
  readonly counts: ApartmentStructureCounts;
  readonly validation: ExtractedPlanValidation;
  readonly diagnostics: readonly DiagnosticFragment[];
}

/**
 * Runs the Phase 4 hard-validation order. Canonical geometry is only built
 * after stages 1–3 pass; acceptance requires every stage to pass.
 */
export function runApartmentPlanValidation(input: {
  readonly structure: ApartmentPlanStructure;
  readonly expectation: ApartmentPlanExpectation;
  readonly site: ExtractionSite;
  readonly projectId: string;
  readonly projectName: string;
}): ApartmentPlanValidationResult {
  const structural = validateApartmentStructure(input.structure, input.expectation);
  if (!structural.isValid) {
    return {
      status: 'REJECTED',
      source: input.structure.source,
      building: null,
      stages: { ...structural.stages, canonicalGeometry: 'SKIPPED', geometryValidation: 'SKIPPED' },
      counts: structural.counts,
      validation: {
        isValid: false,
        recommendedForEditing: false,
        geometryHealthy: false,
        overallScore: 0,
        verificationIssues: structural.issues,
      },
      diagnostics: structural.issues,
    };
  }

  const converted = apartmentStructureToBuilding(input.structure, input.site, input.projectId, input.projectName);
  const canonical = validateCanonicalApartmentBuilding(converted.building, input.expectation);
  const verificationIssues = [...structural.issues, ...canonical.verificationIssues];
  return {
    status: canonical.isValid ? 'ACCEPTED' : 'REJECTED',
    source: input.structure.source,
    building: canonical.isValid ? converted.building : null,
    stages: {
      ...structural.stages,
      canonicalGeometry: 'PASS',
      geometryValidation: canonical.isValid ? 'PASS' : 'FAIL',
    },
    counts: structural.counts,
    validation: { ...canonical, verificationIssues },
    diagnostics: [...verificationIssues, ...converted.diagnostics],
  };
}
