/**
 * Point operations.
 * All coordinates in millimeters (canonical world units).
 * All functions are pure — no side effects.
 */

import type { Point, LineSegment, Polygon } from '@ai-floor-planner/core';
import { TOLERANCES } from '@ai-floor-planner/core';
import { InvalidCoordinateError } from './errors';

/** Create a Point with validation for finite numeric coordinates. */
export function createPoint(x: number, y: number): Point {
  if (!Number.isFinite(x)) {
    throw new InvalidCoordinateError('x', x, 'must be a finite number');
  }
  if (!Number.isFinite(y)) {
    throw new InvalidCoordinateError('y', y, 'must be a finite number');
  }
  return { x, y };
}

/** Euclidean distance between two points. */
export function distance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Manhattan (taxicab) distance between two points (|x1 - x2| + |y1 - y2|). */
export function manhattanDistance(a: Point, b: Point): number {
  return Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
}

/** Midpoint of two points. */
export function midpoint(a: Point, b: Point): Point {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

/** Linear interpolation between two points by ratio t (0 <= t <= 1). */
export function lerpPoint(a: Point, b: Point, t: number): Point {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

/** Rotate a point around an origin by an angle in degrees (clockwise). */
export function rotatePoint(point: Point, angleDeg: number, origin: Point = { x: 0, y: 0 }): Point {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  };
}

/** Translate a point by dx, dy. */
export function translatePoint(point: Point, dx: number, dy: number): Point {
  return {
    x: point.x + dx,
    y: point.y + dy,
  };
}

/** Scale a point relative to an origin. */
export function scalePoint(point: Point, scaleX: number, scaleY: number = scaleX, origin: Point = { x: 0, y: 0 }): Point {
  return {
    x: origin.x + (point.x - origin.x) * scaleX,
    y: origin.y + (point.y - origin.y) * scaleY,
  };
}

/** Closest point on a line segment to a query point. */
export function closestPointOnSegment(point: Point, segment: LineSegment): Point {
  const dx = segment.end.x - segment.start.x;
  const dy = segment.end.y - segment.start.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq < 1e-10) {
    return { x: segment.start.x, y: segment.start.y };
  }

  let t = ((point.x - segment.start.x) * dx + (point.y - segment.start.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  return {
    x: segment.start.x + t * dx,
    y: segment.start.y + t * dy,
  };
}

/** Perpendicular distance from a point to a segment. */
export function pointToSegmentDistanceDirect(point: Point, segment: LineSegment): number {
  const closest = closestPointOnSegment(point, segment);
  return distance(point, closest);
}

/**
 * Check if a point lies on a line segment within tolerance.
 * Uses exact Euclidean closest-point distance.
 */
export function pointOnSegment(
  point: Point,
  segment: LineSegment,
  tolerance: number = TOLERANCES.LINEAR,
): boolean {
  return pointToSegmentDistanceDirect(point, segment) <= tolerance;
}

/**
 * Check if a point is inside a polygon using ray casting.
 * Points exactly on the edge are considered inside.
 */
export function pointInPolygon(point: Point, polygon: Polygon): boolean {
  const pts = polygon.points;
  const n = pts.length;
  if (n < 3) return false;

  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const pi = pts[i]!;
    const pj = pts[j]!;

    // Check if point is on edge
    const seg: LineSegment = { start: pi, end: pj };
    if (pointOnSegment(point, seg, TOLERANCES.LINEAR)) return true;

    if (
      (pi.y > point.y) !== (pj.y > point.y) &&
      point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x
    ) {
      inside = !inside;
    }
  }
  return inside;
}

/** Check if two points are approximately equal within tolerance. */
export function pointsEqual(a: Point, b: Point, tolerance: number = TOLERANCES.LINEAR): boolean {
  return Math.abs(a.x - b.x) <= tolerance && Math.abs(a.y - b.y) <= tolerance;
}
