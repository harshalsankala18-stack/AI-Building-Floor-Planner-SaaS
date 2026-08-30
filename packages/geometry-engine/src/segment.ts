/**
 * Line segment operations.
 * All measurements in millimeters.
 * All functions are pure — no side effects.
 */

import type { Point, LineSegment, BoundingBox } from '@ai-floor-planner/core';
import { TOLERANCES } from '@ai-floor-planner/core';
import { distance, pointsEqual } from './point';
import { DegenerateGeometryError } from './errors';

/** Create a line segment between two points. */
export function createSegment(start: Point, end: Point): LineSegment {
  return { start, end };
}

/** Length of a segment in millimeters. */
export function segmentLength(segment: LineSegment): number {
  const dx = segment.end.x - segment.start.x;
  const dy = segment.end.y - segment.start.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Angle of a segment relative to the X axis, in degrees (-180 to 180). */
export function segmentAngle(segment: LineSegment): number {
  const dx = segment.end.x - segment.start.x;
  const dy = segment.end.y - segment.start.y;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/** Midpoint of a segment. */
export function segmentMidpoint(segment: LineSegment): Point {
  return {
    x: (segment.start.x + segment.end.x) / 2,
    y: (segment.start.y + segment.end.y) / 2,
  };
}

/** Bounding box of a line segment. */
export function segmentBoundingBox(segment: LineSegment): BoundingBox {
  const minX = Math.min(segment.start.x, segment.end.x);
  const minY = Math.min(segment.start.y, segment.end.y);
  const maxX = Math.max(segment.start.x, segment.end.x);
  const maxY = Math.max(segment.start.y, segment.end.y);
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Intersection of two line segments.
 * Returns the intersection point, or null if segments do not intersect.
 * Handles crossing, collinear overlap endpoints, and T-touching properly.
 */
export function segmentIntersection(a: LineSegment, b: LineSegment): Point | null {
  const x1 = a.start.x, y1 = a.start.y;
  const x2 = a.end.x, y2 = a.end.y;
  const x3 = b.start.x, y3 = b.start.y;
  const x4 = b.end.x, y4 = b.end.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (Math.abs(denom) < 1e-10) {
    // Parallel or collinear
    const eps = TOLERANCES.LINEAR;
    if (pointOnSegmentDirect(a.start, b, eps)) return a.start;
    if (pointOnSegmentDirect(a.end, b, eps)) return a.end;
    if (pointOnSegmentDirect(b.start, a, eps)) return b.start;
    if (pointOnSegmentDirect(b.end, a, eps)) return b.end;
    return null;
  }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  const eps = 1e-6;
  if (t >= -eps && t <= 1 + eps && u >= -eps && u <= 1 + eps) {
    const clampedT = Math.max(0, Math.min(1, t));
    return {
      x: x1 + clampedT * (x2 - x1),
      y: y1 + clampedT * (y2 - y1),
    };
  }

  return null;
}

/** Helper: checks if point lies directly on segment within tolerance. */
function pointOnSegmentDirect(p: Point, seg: LineSegment, tolerance: number): boolean {
  const d = pointToSegmentDistance(p, seg);
  return d <= tolerance;
}

/** Closest point on a line segment to a target point. */
export function pointClosestPoint(point: Point, segment: LineSegment): Point {
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

/** Perpendicular distance from a point to a line segment. */
export function pointToSegmentDistance(point: Point, segment: LineSegment): number {
  const closest = pointClosestPoint(point, segment);
  return distance(point, closest);
}

/** Minimum Euclidean distance between two line segments. */
export function segmentToSegmentDistance(a: LineSegment, b: LineSegment): number {
  if (segmentIntersection(a, b) !== null) {
    return 0;
  }
  const d1 = pointToSegmentDistance(a.start, b);
  const d2 = pointToSegmentDistance(a.end, b);
  const d3 = pointToSegmentDistance(b.start, a);
  const d4 = pointToSegmentDistance(b.end, a);
  return Math.min(d1, d2, d3, d4);
}

/** Offset a segment parallel by a given distance on the specified side. */
export function offsetSegment(
  segment: LineSegment,
  dist: number,
  side: 'left' | 'right',
): LineSegment {
  const dx = segment.end.x - segment.start.x;
  const dy = segment.end.y - segment.start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1e-10) {
    throw new DegenerateGeometryError('LineSegment', 'Cannot offset a zero-length segment');
  }

  // Unit normal vectors:
  // In world space (X East, Y South):
  // Left normal: (dy / len, -dx / len)
  // Right normal: (-dy / len, dx / len)
  let nx = dy / len;
  let ny = -dx / len;

  if (side === 'right') {
    nx = -nx;
    ny = -ny;
  }

  return {
    start: { x: segment.start.x + nx * dist, y: segment.start.y + ny * dist },
    end: { x: segment.end.x + nx * dist, y: segment.end.y + ny * dist },
  };
}

/** Split a segment at parameter t (0 < t < 1) or at a projection point. */
export function splitSegmentAtPoint(segment: LineSegment, point: Point): [LineSegment, LineSegment] {
  return [
    { start: segment.start, end: point },
    { start: point, end: segment.end },
  ];
}

/** Check if two segments are approximately equal (either forward or reversed). */
export function segmentsEqual(a: LineSegment, b: LineSegment, tolerance: number = TOLERANCES.LINEAR): boolean {
  return (
    (pointsEqual(a.start, b.start, tolerance) && pointsEqual(a.end, b.end, tolerance)) ||
    (pointsEqual(a.start, b.end, tolerance) && pointsEqual(a.end, b.start, tolerance))
  );
}
