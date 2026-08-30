/**
 * 2D Vector operations.
 * Vectors represent direction, displacement, and magnitude in millimeters.
 * All functions are pure.
 */

import type { Vector2D, Point } from '@ai-floor-planner/core';
import { TOLERANCES } from '@ai-floor-planner/core';
import { DegenerateGeometryError } from './errors';

/** Create a 2D vector from components. */
export function createVector(dx: number, dy: number): Vector2D {
  return { dx, dy };
}

/** Create a vector from point A to point B (B - A). */
export function vectorFromPoints(from: Point, to: Point): Vector2D {
  return {
    dx: to.x - from.x,
    dy: to.y - from.y,
  };
}

/** Add two vectors (u + v). */
export function vectorAdd(u: Vector2D, v: Vector2D): Vector2D {
  return {
    dx: u.dx + v.dx,
    dy: u.dy + v.dy,
  };
}

/** Subtract vector v from u (u - v). */
export function vectorSubtract(u: Vector2D, v: Vector2D): Vector2D {
  return {
    dx: u.dx - v.dx,
    dy: u.dy - v.dy,
  };
}

/** Scale vector by a scalar factor. */
export function vectorScale(v: Vector2D, scalar: number): Vector2D {
  return {
    dx: v.dx * scalar,
    dy: v.dy * scalar,
  };
}

/** Negate vector (-v). */
export function vectorNegate(v: Vector2D): Vector2D {
  return {
    dx: -v.dx,
    dy: -v.dy,
  };
}

/** Squared Euclidean magnitude of a vector. */
export function vectorMagnitudeSquared(v: Vector2D): number {
  return v.dx * v.dx + v.dy * v.dy;
}

/** Euclidean magnitude (length) of a vector. */
export function vectorMagnitude(v: Vector2D): number {
  return Math.sqrt(vectorMagnitudeSquared(v));
}

/** Normalize vector to unit length. Throws if vector has zero magnitude. */
export function vectorNormalize(v: Vector2D): Vector2D {
  const mag = vectorMagnitude(v);
  if (mag < 1e-10) {
    throw new DegenerateGeometryError('Vector2D', 'Cannot normalize a zero-length vector');
  }
  return {
    dx: v.dx / mag,
    dy: v.dy / mag,
  };
}

/** Dot product of two vectors (u · v). */
export function vectorDot(u: Vector2D, v: Vector2D): number {
  return u.dx * v.dx + u.dy * v.dy;
}

/**
 * 2D Cross product (scalar determinant) of two vectors: u.dx * v.dy - u.dy * v.dx.
 * Positive if v is counter-clockwise relative to u, negative if clockwise, 0 if collinear.
 */
export function vectorCross(u: Vector2D, v: Vector2D): number {
  return u.dx * v.dy - u.dy * v.dx;
}

/** Angle of vector relative to positive X-axis in degrees (-180 to 180). */
export function vectorAngle(v: Vector2D): number {
  return (Math.atan2(v.dy, v.dx) * 180) / Math.PI;
}

/**
 * Angle between two vectors in degrees (0 to 180).
 */
export function vectorAngleBetween(u: Vector2D, v: Vector2D): number {
  const dot = vectorDot(u, v);
  const magU = vectorMagnitude(u);
  const magV = vectorMagnitude(v);
  if (magU < 1e-10 || magV < 1e-10) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (magU * magV)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** Perpendicular vector rotated 90 degrees clockwise or counter-clockwise. */
export function vectorPerpendicular(v: Vector2D, orientation: 'cw' | 'ccw' = 'cw'): Vector2D {
  return orientation === 'cw' ? { dx: -v.dy, dy: v.dx } : { dx: v.dy, dy: -v.dx };
}

/** Vector projection of u onto v. */
export function vectorProject(u: Vector2D, v: Vector2D): Vector2D {
  const vMagSq = vectorMagnitudeSquared(v);
  if (vMagSq < 1e-10) return { dx: 0, dy: 0 };
  const scalar = vectorDot(u, v) / vMagSq;
  return vectorScale(v, scalar);
}

/** Check if two vectors are approximately equal within linear tolerance. */
export function vectorsEqual(u: Vector2D, v: Vector2D, tolerance: number = TOLERANCES.LINEAR): boolean {
  return Math.abs(u.dx - v.dx) <= tolerance && Math.abs(u.dy - v.dy) <= tolerance;
}

/** Check if two vectors are approximately parallel (or anti-parallel). */
export function vectorsParallel(u: Vector2D, v: Vector2D, tolerance: number = 1e-5): boolean {
  const cross = vectorCross(u, v);
  const denom = vectorMagnitude(u) * vectorMagnitude(v);
  if (denom < 1e-10) return true;
  return Math.abs(cross / denom) <= tolerance;
}
