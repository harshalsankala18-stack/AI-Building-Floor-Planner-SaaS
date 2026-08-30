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
