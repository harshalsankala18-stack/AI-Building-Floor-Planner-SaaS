/**
 * Standardized Structural Plan Representation (Milestone: Authoritative Deterministic Planner).
 *
 * Exposes provider-independent geometric elements for downstream high-resolution rendering:
 * - outer building walls
 * - flat boundaries
 * - common core (lobby, circulation, lifts, stairs, ducts/shafts)
 * - major partitions (party walls, interior room walls)
 * - doors (with position, swing, wall axis, connected spaces)
 * - balconies (with host connection and projections)
 * - circulation boundaries
 *
 * Crucial policy: Minimal or no textual labels in this representation.
 * Semantic identities and dimensions come strictly from the canonical Building Model
 * and deterministic schematic.
 */

import type { LayoutRect } from './layout-planner';
import type { DeterministicApartmentSchematic } from './schematic';

export interface StructuralPoint2D {
  readonly x: number;
  readonly y: number;
}

export type WallClassification =
  | 'outer_wall'
  | 'party_wall'
  | 'interior_partition'
  | 'core_wall'
  | 'balcony_railing';

export interface StructuralSegment2D {
  readonly id: string;
  readonly start: StructuralPoint2D;
  readonly end: StructuralPoint2D;
  readonly classification: WallClassification;
  readonly thicknessM: number;
  readonly associatedEntityId?: string;
}

export interface StructuralSpaceBoundary {
  readonly id: string;
  readonly label: string;
  readonly category: 'flat' | 'room' | 'lobby' | 'passage' | 'lift' | 'stair' | 'shaft' | 'balcony';
  readonly flatId: string | null;
  readonly bounds: LayoutRect;
  readonly polygon: readonly StructuralPoint2D[];
  readonly isEnclosed: boolean;
}

export interface StructuralDoorOpening {
  readonly id: string;
  readonly kind: 'flat_entrance' | 'internal' | 'balcony' | 'core';
  readonly doorType: 'single' | 'double' | 'sliding' | 'open_passage';
  readonly center: StructuralPoint2D;
  readonly widthM: number;
  readonly wallAxis: 'x' | 'y';
  readonly bounds: LayoutRect;
  readonly connects: readonly [string, string];
  readonly swing: 'inward' | 'outward' | 'left' | 'right';
}

export interface RecommendedRenderResolutions {
  readonly minResolutionPx: number;
  readonly targetResolutionPx: number;
  readonly aspectRatio: number;
  readonly widthPx: number;
  readonly heightPx: number;
}

export interface StructuralPlanRepresentation {
  readonly version: 1;
  readonly unitsOfMeasure: 'metres';
  readonly siteBounds: LayoutRect;
  readonly buildableBounds: LayoutRect;
  readonly buildingFootprint: LayoutRect;
  readonly outerBuildingWalls: readonly StructuralSegment2D[];
  readonly flatBoundaries: readonly StructuralSpaceBoundary[];
  readonly commonCore: {
    readonly bounds: LayoutRect;
    readonly lobby: StructuralSpaceBoundary;
    readonly circulationBoundaries: readonly StructuralSpaceBoundary[];
    readonly lifts: readonly StructuralSpaceBoundary[];
    readonly stairs: readonly StructuralSpaceBoundary[];
    readonly ducts: readonly StructuralSpaceBoundary[];
  };
  readonly majorPartitions: readonly StructuralSegment2D[];
  readonly roomBoundaries: readonly StructuralSpaceBoundary[];
  readonly doors: readonly StructuralDoorOpening[];
  readonly balconies: readonly StructuralSpaceBoundary[];
  readonly recommendedRenderResolutions: RecommendedRenderResolutions;
}

function rectToPolygon(r: LayoutRect): readonly StructuralPoint2D[] {
  return [
    { x: r.x, y: r.y },
    { x: r.x + r.width, y: r.y },
    { x: r.x + r.width, y: r.y + r.height },
    { x: r.x, y: r.y + r.height },
  ];
}

function rectToSegments(
  r: LayoutRect,
  idPrefix: string,
  classification: WallClassification,
  thicknessM: number,
  associatedEntityId?: string,
): readonly StructuralSegment2D[] {
  const p0 = { x: r.x, y: r.y };
  const p1 = { x: r.x + r.width, y: r.y };
  const p2 = { x: r.x + r.width, y: r.y + r.height };
  const p3 = { x: r.x, y: r.y + r.height };

  return [
    { id: `${idPrefix}_top`, start: p0, end: p1, classification, thicknessM, associatedEntityId },
    { id: `${idPrefix}_right`, start: p1, end: p2, classification, thicknessM, associatedEntityId },
    { id: `${idPrefix}_bottom`, start: p2, end: p3, classification, thicknessM, associatedEntityId },
    { id: `${idPrefix}_left`, start: p3, end: p0, classification, thicknessM, associatedEntityId },
  ];
}

/**
 * Creates the provider-independent structural plan representation from a deterministic schematic.
 */
export function createStructuralPlanRepresentation(
  schematic: DeterministicApartmentSchematic,
): StructuralPlanRepresentation {
  const fp = schematic.buildingFootprint;
  const site = schematic.siteFootprint;

  // Outer building envelope walls (230mm standard masonry/concrete)
  const outerBuildingWalls = rectToSegments(fp, 'outer_wall', 'outer_wall', 0.23);

  // Flat boundaries
  const flatBoundaries: StructuralSpaceBoundary[] = schematic.units.map(u => ({
    id: u.flatId,
    label: u.flatLabel,
    category: 'flat',
    flatId: u.flatId,
    bounds: u.bounds,
    polygon: rectToPolygon(u.bounds),
    isEnclosed: true,
  }));

  // Common core elements
  const lobbyBoundary: StructuralSpaceBoundary = {
    id: 'core_lobby',
    label: schematic.core.lobby.label,
    category: 'lobby',
    flatId: null,
    bounds: schematic.core.lobby.bounds,
    polygon: rectToPolygon(schematic.core.lobby.bounds),
    isEnclosed: true,
  };

  const liftBoundaries: StructuralSpaceBoundary[] = schematic.core.lifts.map(l => ({
    id: l.id,
    label: l.label,
    category: 'lift',
    flatId: null,
    bounds: l.bounds,
    polygon: rectToPolygon(l.bounds),
    isEnclosed: true,
  }));

  const stairBoundaries: StructuralSpaceBoundary[] = schematic.core.stairs.map(s => ({
    id: s.id,
    label: s.label,
    category: 'stair',
    flatId: null,
    bounds: s.bounds,
    polygon: rectToPolygon(s.bounds),
    isEnclosed: true,
  }));

  const ductBoundaries: StructuralSpaceBoundary[] = schematic.core.serviceShafts.map((s, i) => ({
    id: `shaft_${i + 1}`,
    label: s.label,
    category: 'shaft',
    flatId: null,
    bounds: s.bounds,
    polygon: rectToPolygon(s.bounds),
    isEnclosed: true,
  }));

  const corridorBoundaries: StructuralSpaceBoundary[] = schematic.core.corridors.map((c, i) => ({
    id: `corridor_${i + 1}`,
    label: c.label,
    category: 'passage',
    flatId: null,
    bounds: c.bounds,
    polygon: rectToPolygon(c.bounds),
    isEnclosed: true,
  }));

  // Room boundaries and balconies
  const roomBoundaries: StructuralSpaceBoundary[] = [];
  const balconies: StructuralSpaceBoundary[] = [];
  const partitions: StructuralSegment2D[] = [];

  // Core walls
  partitions.push(...rectToSegments(schematic.core.lobby.bounds, 'core_lobby', 'core_wall', 0.20, 'core_lobby'));
  for (const l of schematic.core.lifts) {
    partitions.push(...rectToSegments(l.bounds, `core_${l.id}`, 'core_wall', 0.20, l.id));
  }
  for (const s of schematic.core.stairs) {
    partitions.push(...rectToSegments(s.bounds, `core_${s.id}`, 'core_wall', 0.20, s.id));
  }

  for (const unit of schematic.units) {
    // Party walls for unit body (200mm party wall)
    partitions.push(...rectToSegments(unit.bodyBounds, `party_${unit.flatId}`, 'party_wall', 0.20, unit.flatId));

    for (const room of unit.rooms) {
      roomBoundaries.push({
        id: `${unit.flatId}__${room.id}`,
        label: room.name,
        category: room.type === 'passage' ? 'passage' : 'room',
        flatId: unit.flatId,
        bounds: room.bounds,
        polygon: rectToPolygon(room.bounds),
        isEnclosed: true,
      });

      // Internal partitions (115mm drywall/half-brick)
      partitions.push(
        ...rectToSegments(
          room.bounds,
          `room_${unit.flatId}_${room.id}`,
          'interior_partition',
          0.115,
          `${unit.flatId}__${room.id}`,
        ),
      );
    }

    for (const bal of unit.balconies) {
      const balBoundary: StructuralSpaceBoundary = {
        id: `${unit.flatId}__${bal.id}`,
        label: bal.name,
        category: 'balcony',
        flatId: unit.flatId,
        bounds: bal.bounds,
        polygon: rectToPolygon(bal.bounds),
        isEnclosed: false,
      };
      balconies.push(balBoundary);
      partitions.push(
        ...rectToSegments(
          bal.bounds,
          `balcony_${unit.flatId}_${bal.id}`,
          'balcony_railing',
          0.10,
          `${unit.flatId}__${bal.id}`,
        ),
      );
    }
  }

  // Doors
  const doors: StructuralDoorOpening[] = (schematic.doors ?? []).map(d => ({
    id: d.id,
    kind: d.kind,
    doorType: d.doorType,
    center: d.center,
    widthM: d.widthM,
    wallAxis: d.wallAxis,
    bounds: d.bounds,
    connects: d.connects,
    swing: d.swing,
  }));

  // Aspect-ratio-aware resolution configuration for 1536–2048px rendering
  const aspect = site.width / Math.max(1, site.height);
  const targetResolutionPx = 2048;
  const minResolutionPx = 1536;
  let widthPx = targetResolutionPx;
  let heightPx = Math.round(targetResolutionPx / aspect);
  if (aspect < 1.0) {
    heightPx = targetResolutionPx;
    widthPx = Math.round(targetResolutionPx * aspect);
  }

  // Align to 16px blocks
  widthPx = Math.max(minResolutionPx, Math.round(widthPx / 16) * 16);
  heightPx = Math.max(minResolutionPx, Math.round(heightPx / 16) * 16);

  return {
    version: 1,
    unitsOfMeasure: 'metres',
    siteBounds: site,
    buildableBounds: {
      x: schematic.setbacks.left,
      y: schematic.setbacks.rear,
      width: Math.max(0, site.width - schematic.setbacks.left - schematic.setbacks.right),
      height: Math.max(0, site.height - schematic.setbacks.front - schematic.setbacks.rear),
    },
    buildingFootprint: fp,
    outerBuildingWalls,
    flatBoundaries,
    commonCore: {
      bounds: schematic.core.bounds,
      lobby: lobbyBoundary,
      circulationBoundaries: corridorBoundaries,
      lifts: liftBoundaries,
      stairs: stairBoundaries,
      ducts: ductBoundaries,
    },
    majorPartitions: partitions,
    roomBoundaries,
    doors,
    balconies,
    recommendedRenderResolutions: {
      minResolutionPx,
      targetResolutionPx,
      aspectRatio: Number(aspect.toFixed(3)),
      widthPx,
      heightPx,
    },
  };
}
