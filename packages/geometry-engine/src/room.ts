/**
 * Room Geometry Operations.
 * Bridges geometric primitives with the Room domain entity.
 * Area and spatial boundaries are derived strictly from geometry.
 */

import type { Room, Polygon, BoundingBox, Point } from '@ai-floor-planner/core';
import { TOLERANCES } from '@ai-floor-planner/core';
import {
  polygonArea,
  polygonPerimeter,
  polygonCentroid,
  polygonBoundingBox,
  isValidPolygon,
  offsetPolygon,
} from './polygon';
import { DegenerateGeometryError } from './errors';

export interface RoomGeometryInfo {
  readonly boundary: Polygon;
  readonly boundingBox: BoundingBox;
  readonly area: number;
  readonly perimeter: number;
  readonly centroid: Point;
  readonly width: number;
  readonly height: number;
}

/**
 * Compute all derived geometric properties for a room.
 * Area is computed directly from the boundary polygon using shoelace formula.
 */
export function computeRoomGeometry(room: Room): RoomGeometryInfo {
  const boundary = room.boundary;
  const area = polygonArea(boundary);
  const perimeter = polygonPerimeter(boundary);
  const centroid = polygonCentroid(boundary);
  const bbox = polygonBoundingBox(boundary);

  return {
    boundary,
    boundingBox: bbox,
    area,
    perimeter,
    centroid,
    width: bbox.width,
    height: bbox.height,
  };
}

/** Compute carpet area (net usable interior area excluding wall boundary thickness). */
export function computeCarpetArea(room: Room, wallThickness: number): number {
  if (wallThickness <= 0) return polygonArea(room.boundary);
  // Offset inward by half wall thickness on each boundary edge
  const halfThickness = wallThickness / 2;
  const interior = offsetPolygon(room.boundary, -halfThickness);
  return polygonArea(interior);
}

/** Compute interior boundary polygon of a room factoring in wall thickness. */
export function computeInteriorPolygon(room: Room, wallThickness: number): Polygon {
  if (wallThickness <= 0) return room.boundary;
  return offsetPolygon(room.boundary, -(wallThickness / 2));
}

/**
 * Validate room geometry for architectural consistency.
 * Throws explicit error if room has degenerate geometry or invalid dimensions.
 */
export function validateRoomGeometry(room: Room): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (room.width <= 0) {
    errors.push(`Room width (${room.width}) must be positive`);
  }
  if (room.height <= 0) {
    errors.push(`Room height (${room.height}) must be positive`);
  }
  if (!Number.isFinite(room.x) || !Number.isFinite(room.y)) {
    errors.push(`Room origin (${room.x}, ${room.y}) must have finite coordinates`);
  }
  if (!isValidPolygon(room.boundary)) {
    errors.push('Room boundary polygon is invalid (must have >= 3 non-intersecting points and positive area)');
  }

  const derivedArea = polygonArea(room.boundary);
  if (derivedArea <= TOLERANCES.AREA) {
    errors.push(`Derived room area (${derivedArea} mm²) is below minimum threshold`);
  }

  if (room.minArea !== undefined && derivedArea < room.minArea) {
    errors.push(`Room area (${derivedArea}) is less than required minArea (${room.minArea})`);
  }
  if (room.maxArea !== undefined && derivedArea > room.maxArea) {
    errors.push(`Room area (${derivedArea}) is greater than allowed maxArea (${room.maxArea})`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/** Assert room geometry is valid, throwing if invalid. */
export function assertRoomGeometry(room: Room): void {
  const result = validateRoomGeometry(room);
  if (!result.valid) {
    throw new DegenerateGeometryError(`Room [${room.id} (${room.name})]`, result.errors.join('; '));
  }
}
