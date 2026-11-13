/**
 * Acceptance checks for geometry reconstructed from an accepted master image.
 *
 * Phase 2.7 draws a line the previous pipeline did not:
 *
 * - INTEGRITY faults make the model unusable as an editable CAD plan — rooms
 *   that overlap, fall outside their floor, have non-finite or zero dimensions,
 *   or openings hosted on a wall that does not exist. These block acceptance.
 *
 * - PROGRAMME shortfalls mean the image does not contain what the brief asked
 *   for (a bathroom the drawing never showed). These block acceptance too, but
 *   the remedy is to correct or regenerate the IMAGE — never to swap in
 *   different geometry.
 *
 * - SIZE advisories (a room below a recommended minimum area or dimension) are
 *   reported and carried to the user, and do NOT block. A tight living room the
 *   user accepted is still their design; silently discarding the whole plan over
 *   it is what used to hand them an unrelated template instead.
 *
 * Minimum room sizes here are project quality guidance, not a code compliance
 * determination. PROFESSIONAL REVIEW REQUIRED.
 */

import type { Building, DesignRequirementSpecification } from '@ai-floor-planner/core';
import { MINIMUM_ROOM_AREAS, MINIMUM_DIMENSIONS, RoomType } from '@ai-floor-planner/core';
import type { DiagnosticFragment, ExtractedPlan } from '@ai-floor-planner/planning-engine';
import {
  containsPolygonWithTolerance,
  detectRoomCollisions,
  extractedRoomType,
  isValidPolygon,
} from '@ai-floor-planner/planning-engine';

export interface ReconstructionAcceptance {
  /** True when the reconstruction may be installed as the editable CAD plan. */
  readonly accepted: boolean;
  /** Faults that make the geometry unusable. Blocking. */
  readonly integrityIssues: readonly DiagnosticFragment[];
  /**
   * Requested spaces the accepted image does not contain. Surfaced prominently
   * and recorded against the conversion, but NOT blocking: the remedy is to
   * draw the missing space in the editor or regenerate the image, and blocking
   * would leave the user with nothing editable to do either in. Nothing is
   * ever invented to fill the gap.
   */
  readonly programmeIssues: readonly DiagnosticFragment[];
  /** Rooms below recommended sizes; reported, never blocking. */
  readonly sizeAdvisories: readonly DiagnosticFragment[];
  readonly geometryHealthy: boolean;
}

/** Spaces whose size is driven by the drawing, not by habitable-room minimums. */
const SIZE_EXEMPT_TYPES = new Set<string>([
  RoomType.Balcony,
  RoomType.Terrace,
  RoomType.Garden,
  RoomType.OTS,
  RoomType.ServiceShaft,
  RoomType.Porch,
  RoomType.Parking,
  RoomType.Corridor,
  RoomType.Staircase,
  RoomType.Foyer,
]);

export function assessReconstruction(
  building: Building,
  plan: ExtractedPlan,
  requirements: DesignRequirementSpecification,
): ReconstructionAcceptance {
  const integrityIssues: DiagnosticFragment[] = [];
  const programmeIssues: DiagnosticFragment[] = [];
  const sizeAdvisories: DiagnosticFragment[] = [];
  const allRooms = building.floors.flatMap(f => f.rooms);

  for (const floor of building.floors) {
    const hasBoundary = Boolean(floor.boundary && floor.boundary.points.length >= 3);
    if (hasBoundary && !isValidPolygon(floor.boundary)) {
      integrityIssues.push({
        code: 'RECONSTRUCTION_INVALID_FLOOR_BOUNDARY',
        severity: 'error',
        message: `Floor "${floor.name}" has an invalid or self-intersecting boundary polygon.`,
      });
    }
    for (const room of floor.rooms) {
      // ── Integrity: dimensions must be real.
      if (
        !Number.isFinite(room.x) || !Number.isFinite(room.y) ||
        !Number.isFinite(room.width) || !Number.isFinite(room.height) ||
        room.width <= 0 || room.height <= 0 || room.area <= 0
      ) {
        integrityIssues.push({
          code: 'RECONSTRUCTION_INVALID_DIMENSIONS',
          severity: 'error',
          message: `Room "${room.name}" has invalid dimensions after conversion and cannot be edited.`,
        });
        continue;
      }

      if (!room.boundary || room.boundary.points.length < 3 || !isValidPolygon(room.boundary)) {
        integrityIssues.push({
          code: 'RECONSTRUCTION_INVALID_ROOM_POLYGON',
          severity: 'error',
          message: `Room "${room.name}" has an invalid or self-intersecting boundary polygon on ${floor.name}.`,
        });
        continue;
      }

      // ── Integrity: a room must sit inside its own floor plate (vertex + edge containment).
      if (hasBoundary && !containsPolygonWithTolerance(floor.boundary.points, room.boundary.points, 50)) {
        integrityIssues.push({
          code: 'RECONSTRUCTION_ROOM_OUT_OF_BOUNDS',
          severity: 'error',
          message: `Room "${room.name}" falls outside the reconstructed floor outline on ${floor.name}.`,
        });
      }

      // ── Integrity: rooms must not overlap.
      const significant = detectRoomCollisions(room, [...floor.rooms]).filter(c => c.overlapArea > 50_000);
      if (significant.length > 0) {
        integrityIssues.push({
          code: 'RECONSTRUCTION_ROOM_OVERLAP',
          severity: 'error',
          message: `Room "${room.name}" overlaps another room on ${floor.name} after conversion.`,
        });
      }

      // ── Advisory only: recommended sizes.
      if (!SIZE_EXEMPT_TYPES.has(room.type)) {
        const minArea = (MINIMUM_ROOM_AREAS as Record<string, number | undefined>)[room.type];
        if (minArea !== undefined && room.area < minArea) {
          sizeAdvisories.push({
            code: 'RECONSTRUCTION_ROOM_BELOW_RECOMMENDED_AREA',
            severity: 'warning',
            message: `Room "${room.name}" (${room.type}) is ${(room.area / 1_000_000).toFixed(1)} m², below the project's recommended ${(minArea / 1_000_000).toFixed(1)} m² — this is how the accepted image drew it. Resize it in the editor or regenerate the image. PROFESSIONAL REVIEW REQUIRED.`,
          });
        }
        const minDim = (MINIMUM_DIMENSIONS as Record<string, number | undefined>)[room.type];
        if (minDim !== undefined && Math.min(room.width, room.height) < minDim) {
          sizeAdvisories.push({
            code: 'RECONSTRUCTION_ROOM_BELOW_RECOMMENDED_DIMENSION',
            severity: 'warning',
            message: `Room "${room.name}" is ${Math.round(Math.min(room.width, room.height))} mm on its short side, below the recommended ${minDim} mm — as drawn in the accepted image.`,
          });
        }
      }
    }

    // ── Integrity: an opening must be hosted on a wall that exists.
    for (const door of floor.doors) {
      if (!floor.walls.some(w => w.id === door.wallId)) {
        integrityIssues.push({
          code: 'RECONSTRUCTION_ORPHANED_DOOR',
          severity: 'error',
          message: `A door on ${floor.name} references wall ${door.wallId}, which does not exist.`,
        });
      }
    }
    for (const win of floor.windows) {
      if (!floor.walls.some(w => w.id === win.wallId)) {
        integrityIssues.push({
          code: 'RECONSTRUCTION_ORPHANED_WINDOW',
          severity: 'error',
          message: `A window on ${floor.name} references wall ${win.wallId}, which does not exist.`,
        });
      }
    }
  }

  // ── Blocking: is this actually a residential floor plan?
  // Distinct from the per-space shortfalls below. A drawing with no habitable
  // core (somewhere to live plus a kitchen or bathroom) is not a floor plan at
  // all, and converting it would hand the user an "editable plan" that is
  // really a couple of stray boxes. This is a judgement about the IMAGE, so the
  // remedy is to regenerate it — nothing is substituted either way.
  const habitable = allRooms.filter(r => !SIZE_EXEMPT_TYPES.has(r.type));
  const hasLivingSpace = allRooms.some(r =>
    r.type === RoomType.Living || r.type === RoomType.Drawing || r.type === RoomType.FamilyLiving || r.type === RoomType.Dining,
  );
  const hasServiceSpace = allRooms.some(r => r.type === RoomType.Kitchen || r.type === RoomType.Bathroom);
  if (habitable.length < 3 || !hasLivingSpace || !hasServiceSpace) {
    integrityIssues.push({
      code: 'RECONSTRUCTION_NOT_A_FLOOR_PLAN',
      severity: 'error',
      message:
        `The image interpretation yielded ${habitable.length} habitable space(s)` +
        `${hasLivingSpace ? '' : ', no living/dining space'}` +
        `${hasServiceSpace ? '' : ', no kitchen or bathroom'}` +
        '. That is not a residential floor plan, so no editable CAD model was produced and nothing was substituted. Regenerate the master image.',
    });
  }

  // ── Programme: did the IMAGE contain what the brief asked for?
  const builtCounts = new Map<string, number>();
  for (const room of allRooms) builtCounts.set(room.type, (builtCounts.get(room.type) ?? 0) + 1);

  const imageCounts = new Map<string, number>();
  for (const room of plan.rooms) {
    const type = extractedRoomType(room.type || room.name);
    imageCounts.set(type, (imageCounts.get(type) ?? 0) + 1);
    // A combined "living / dining" space satisfies both.
    if (type === 'living' && /dining/i.test(`${room.type} ${room.name}`)) {
      imageCounts.set('dining', (imageCounts.get('dining') ?? 0) + 1);
    }
  }
  if (plan.parking.length > 0) imageCounts.set('parking', (imageCounts.get('parking') ?? 0) + plan.parking.length);
  if (plan.stairs.length > 0) imageCounts.set('staircase', (imageCounts.get('staircase') ?? 0) + plan.stairs.length);

  const siteParkingZones = (building.site?.siteZones ?? []).filter(z =>
    String((z as unknown as Record<string, unknown>).kind ?? z.name ?? '').toLowerCase().includes('parking'),
  ).length;

  const hard = requirements.hard;
  const required: ReadonlyArray<readonly [string, number]> = [
    ['bedroom', hard.bedroomCount],
    ['bathroom', hard.bathroomCount],
    ['living', hard.livingRoomRequired ? 1 : 0],
    ['kitchen', hard.kitchenRequired ? 1 : 0],
    ['dining', hard.diningRoomRequired ? 1 : 0],
    ['parking', hard.parkingSpacesCount],
  ];
  for (const [type, count] of required) {
    if (count <= 0) continue;
    let present = Math.max(builtCounts.get(type) ?? 0, imageCounts.get(type) ?? 0);
    if (type === 'parking') present = Math.max(present, siteParkingZones);
    if (present < count) {
      programmeIssues.push({
        code: 'RECONSTRUCTION_IMAGE_MISSING_REQUESTED_SPACE',
        severity: 'warning',
        message: `The brief asks for ${count} ${type} space(s) but the accepted image contains ${present}. Nothing was invented to make up the difference: add the missing space in the editor, or regenerate the image showing it.`,
      });
    }
  }

  // Only genuine integrity faults block. A programme gap is the IMAGE's, and
  // the editor is where the user closes it — refusing to open the editable plan
  // would leave them nowhere to do that.
  const accepted = integrityIssues.length === 0;
  return {
    accepted,
    integrityIssues,
    programmeIssues,
    sizeAdvisories,
    geometryHealthy: integrityIssues.length === 0,
  };
}
