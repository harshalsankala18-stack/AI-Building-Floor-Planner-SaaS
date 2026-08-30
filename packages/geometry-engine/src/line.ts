/**
 * Infinite 2D Line representation and operations.
 * Standard form: Ax + By + C = 0 with normalized coefficients (A^2 + B^2 = 1).
 * All functions are pure.
 */

import type { Point, LineSegment } from '@ai-floor-planner/core';
import { TOLERANCES } from '@ai-floor-planner/core';
import { DegenerateGeometryError } from './errors';

export interface Line {
  /** A coefficient in Ax + By + C = 0 */
  readonly a: number;
  /** B coefficient in Ax + By + C = 0 */
  readonly b: number;
  /** C constant in Ax + By + C = 0 */
  readonly c: number;
}

/** Create a line in standard form Ax + By + C = 0 (normalized). */
export function createLine(a: number, b: number, c: number): Line {
  const norm = Math.sqrt(a * a + b * b);
  if (norm < 1e-10) {
    throw new DegenerateGeometryError('Line', 'A and B cannot both be zero');
  }
  return {
    a: a / norm,
    b: b / norm,
    c: c / norm,
  };
}

/** Create a line passing through two distinct points. */
export function lineFromPoints(p1: Point, p2: Point): Line {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  if (Math.abs(dx) < 1e-10 && Math.abs(dy) < 1e-10) {
    throw new DegenerateGeometryError('Line', 'Cannot create line from two identical points');
  }
  // -dy * x + dx * y + (dy * p1.x - dx * p1.y) = 0
  const a = -dy;
  const b = dx;
  const c = dy * p1.x - dx * p1.y;
  return createLine(a, b, c);
}

/** Create a line from a line segment. */
export function lineFromSegment(segment: LineSegment): Line {
  return lineFromPoints(segment.start, segment.end);
}

/** Signed distance from a point to a line. */
export function signedDistanceToLine(point: Point, line: Line): number {
  return line.a * point.x + line.b * point.y + line.c;
}

/** Absolute perpendicular distance from a point to a line. */
export function distanceToLine(point: Point, line: Line): number {
  return Math.abs(signedDistanceToLine(point, line));
}

/** Project a point onto a line. */
export function projectPointOntoLine(point: Point, line: Line): Point {
  const dist = signedDistanceToLine(point, line);
  return {
    x: point.x - line.a * dist,
    y: point.y - line.b * dist,
  };
}

/**
 * Intersection point of two infinite lines.
 * Returns null if lines are parallel or coincident.
 */
export function lineIntersection(l1: Line, l2: Line): Point | null {
  const det = l1.a * l2.b - l1.b * l2.a;
  if (Math.abs(det) < 1e-10) {
    return null; // Parallel or coincident
  }
  return {
    x: (l1.b * l2.c - l2.b * l1.c) / det,
    y: (l2.a * l1.c - l1.a * l2.c) / det,
  };
}

/** Check if two lines are parallel within angular tolerance. */
export function areLinesParallel(l1: Line, l2: Line, tolerance: number = 1e-5): boolean {
  const det = l1.a * l2.b - l1.b * l2.a;
  return Math.abs(det) <= tolerance;
}

/** Check if a point lies on a line within linear tolerance. */
export function isPointOnLine(point: Point, line: Line, tolerance: number = TOLERANCES.LINEAR): boolean {
  return distanceToLine(point, line) <= tolerance;
}
