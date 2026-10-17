/**
 * Direction and quadrant utilities for Vastu and orientation-aware scoring.
 *
 * Coordinate system:
 * - Origin = top-left of plot
 * - X increases rightward (East at orientation=0)
 * - Y increases downward (South at orientation=0)
 * - orientation = degrees clockwise that North is rotated from "up" (negative Y)
 *   - orientation=0: North is up
 *   - orientation=90: North is left
 */

import type { Point, BoundingBox, Polygon } from '@ai-floor-planner/core';
import { polygonBoundingBox, polygonCentroid } from '@ai-floor-planner/geometry-engine';

export type Quadrant = 'NE' | 'NW' | 'SE' | 'SW';
export type CompassDirection = 'N' | 'S' | 'E' | 'W';
export type CompassZone = CompassDirection | Quadrant | 'center';

/**
 * 16-Zone MahaVastu angular classification codes (22.5° wedges).
 * Used by the Vastu constraint provider for fine-grained directional scoring.
 */
export type VastuZone16 =
  | 'N' | 'NNE' | 'NE' | 'ENE'
  | 'E' | 'ESE' | 'SE' | 'SSE'
  | 'S' | 'SSW' | 'SW' | 'WSW'
  | 'W' | 'WNW' | 'NW' | 'NNW';

/** Zone metadata for 16-zone MahaVastu classification. */
interface VastuZone16Meta {
  readonly code: VastuZone16;
  readonly startDeg: number;
  readonly endDeg: number;
}

/** The 16 MahaVastu zones, each spanning 22.5° of compass bearing. */
const VASTU_16_ZONE_META: readonly VastuZone16Meta[] = [
  { code: 'N',   startDeg: 348.75, endDeg: 11.25  },
  { code: 'NNE', startDeg: 11.25,  endDeg: 33.75  },
  { code: 'NE',  startDeg: 33.75,  endDeg: 56.25  },
  { code: 'ENE', startDeg: 56.25,  endDeg: 78.75  },
  { code: 'E',   startDeg: 78.75,  endDeg: 101.25 },
  { code: 'ESE', startDeg: 101.25, endDeg: 123.75 },
  { code: 'SE',  startDeg: 123.75, endDeg: 146.25 },
  { code: 'SSE', startDeg: 146.25, endDeg: 168.75 },
  { code: 'S',   startDeg: 168.75, endDeg: 191.25 },
  { code: 'SSW', startDeg: 191.25, endDeg: 213.75 },
  { code: 'SW',  startDeg: 213.75, endDeg: 236.25 },
  { code: 'WSW', startDeg: 236.25, endDeg: 258.75 },
  { code: 'W',   startDeg: 258.75, endDeg: 281.25 },
  { code: 'WNW', startDeg: 281.25, endDeg: 303.75 },
  { code: 'NW',  startDeg: 303.75, endDeg: 326.25 },
  { code: 'NNW', startDeg: 326.25, endDeg: 348.75 },
];

/** Normalise an angle into [0, 360). */
function normaliseDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Compute the compass bearing (0°=N, 90°=E, 180°=S, 270°=W) from a center
 * point to a target point in plan coordinates (Y-down), adjusted for site
 * north rotation (`orientation` = clockwise rotation of North from screen-up).
 */
export function computeBearingDeg(
  center: Point,
  target: Point,
  orientation: number = 0,
): number {
  const dx = target.x - center.x;
  const dy = target.y - center.y;
  // atan2(dx, -dy) gives angle from screen-up direction (0°=Up, CW positive)
  const angleFromUp = normaliseDeg((Math.atan2(dx, -dy) * 180) / Math.PI);
  // Subtract orientation to convert from screen-up to true-north
  return normaliseDeg(angleFromUp - orientation);
}

/**
 * Classify a point into one of the 16 MahaVastu 22.5° angular zones.
 */
export function classifyVastuZone16(
  point: Point,
  center: Point,
  orientation: number = 0,
): VastuZone16 {
  const bearing = computeBearingDeg(center, point, orientation);
  // Shift by half-wedge so 0° (true North centre) maps to zone index 0
  const shifted = normaliseDeg(bearing + 11.25);
  const idx = Math.floor(shifted / 22.5);
  return VASTU_16_ZONE_META[idx % 16]!.code;
}

/**
 * Get the 16-zone MahaVastu classification of a room's centroid
 * relative to the floor boundary's centroid.
 */
export function getRoomVastuZone16(
  roomBoundary: Polygon,
  floorBoundary: Polygon,
  orientation: number,
): VastuZone16 {
  const roomCenter = polygonCentroid(roomBoundary);
  const floorCenter = polygonCentroid(floorBoundary);
  return classifyVastuZone16(roomCenter, floorCenter, orientation);
}

/**
 * Determine the quadrant of a point within a bounding box,
 * accounting for building orientation.
 *
 * Algorithm:
 * 1. Find center of bounding box.
 * 2. Compute relative position of point from center.
 * 3. Rotate relative position by -orientation to get "true north" frame.
 * 4. Classify based on rotated position.
 */
export function getQuadrant(
  point: Point,
  bounds: BoundingBox,
  orientation: number,
): Quadrant {
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;

  // Relative to center
  const dx = point.x - cx;
  const dy = point.y - cy;

  // Rotate by -orientation (convert to true-north frame)
  const rad = (-orientation * Math.PI) / 180;
  const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
  const ry = dx * Math.sin(rad) + dy * Math.cos(rad);

  // In true-north frame:
  // ry < 0 = North, ry > 0 = South
  // rx > 0 = East, rx < 0 = West
  const isNorth = ry < 0;
  const isEast = rx > 0;

  if (isNorth && isEast) return 'NE';
  if (isNorth && !isEast) return 'NW';
  if (!isNorth && isEast) return 'SE';
  return 'SW';
}

/**
 * Determine compass direction of a point relative to center.
 */
export function getCompassDirection(
  point: Point,
  bounds: BoundingBox,
  orientation: number,
): CompassDirection {
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;

  const dx = point.x - cx;
  const dy = point.y - cy;

  const rad = (-orientation * Math.PI) / 180;
  const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
  const ry = dx * Math.sin(rad) + dy * Math.cos(rad);

  // Dominant axis
  if (Math.abs(rx) > Math.abs(ry)) {
    return rx > 0 ? 'E' : 'W';
  }
  return ry < 0 ? 'N' : 'S';
}

/**
 * Get the quadrant of a room's centroid within the floor boundary.
 */
export function getRoomQuadrant(
  roomBoundary: Polygon,
  floorBoundary: Polygon,
  orientation: number,
): Quadrant {
  const centroid = polygonCentroid(roomBoundary);
  const bounds = polygonBoundingBox(floorBoundary);
  return getQuadrant(centroid, bounds, orientation);
}

/**
 * Check if a quadrant matches a target zone (with optional flexibility).
 * 'strict': exact match only
 * 'moderate': exact or adjacent quadrant (50% credit)
 * 'flexible': correct half (50% credit)
 */
export function quadrantMatches(
  actual: Quadrant,
  target: Quadrant,
  strictness: 'strict' | 'moderate' | 'flexible',
): { matches: boolean; partial: boolean } {
  if (actual === target) {
    return { matches: true, partial: false };
  }

  if (strictness === 'strict') {
    return { matches: false, partial: false };
  }

  // Adjacent quadrants share one direction letter
  const isAdjacent = actual[0] === target[0] || actual[1] === target[1];

  if (strictness === 'moderate' && isAdjacent) {
    return { matches: false, partial: true };
  }

  if (strictness === 'flexible' && isAdjacent) {
    return { matches: false, partial: true };
  }

  return { matches: false, partial: false };
}

/**
 * Check if a point or quadrant is in a specific compass half.
 */
export function isInHalf(
  pointOrQuadrant: Point | Quadrant,
  boundsOrHalf: BoundingBox | string,
  orientation?: number,
  halfDirection?: 'N' | 'S' | 'E' | 'W',
): boolean {
  if (typeof pointOrQuadrant === 'string') {
    const quad = pointOrQuadrant as Quadrant;
    const h = (typeof boundsOrHalf === 'string' ? boundsOrHalf : '').toLowerCase();
    if (h === 'north' || h === 'n') return quad.includes('N');
    if (h === 'south' || h === 's') return quad.includes('S');
    if (h === 'east' || h === 'e') return quad.includes('E');
    if (h === 'west' || h === 'w') return quad.includes('W');
    return false;
  }

  const point = pointOrQuadrant as Point;
  const bounds = boundsOrHalf as BoundingBox;
  const orient = orientation ?? 0;
  const half = halfDirection ?? 'N';

  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;

  const dx = point.x - cx;
  const dy = point.y - cy;

  const rad = (-orient * Math.PI) / 180;
  const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
  const ry = dx * Math.sin(rad) + dy * Math.cos(rad);

  switch (half) {
    case 'N': return ry < 0;
    case 'S': return ry > 0;
    case 'E': return rx > 0;
    case 'W': return rx < 0;
  }
}
