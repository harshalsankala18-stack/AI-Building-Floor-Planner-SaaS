/**
 * Curved geometry primitives: Circle and Arc abstractions.
 * Prepared for future non-orthogonal walls, curved bay windows, and circular columns.
 * All measurements in millimeters. All functions are pure.
 */

import type { Point, BoundingBox, Polygon } from '@ai-floor-planner/core';
import { TOLERANCES } from '@ai-floor-planner/core';
import { distance } from './point';
import { DegenerateGeometryError } from './errors';

export interface Circle {
  readonly center: Point;
  readonly radius: number;
}

export interface Arc {
  readonly center: Point;
  readonly radius: number;
  /** Start angle in degrees clockwise from positive X-axis (0-360) */
  readonly startAngle: number;
  /** End angle in degrees clockwise from positive X-axis (0-360) */
  readonly endAngle: number;
}

/** Create a Circle with validation. */
export function createCircle(center: Point, radius: number): Circle {
  if (radius <= 0) {
    throw new DegenerateGeometryError('Circle', `Radius must be positive (received ${radius})`);
  }
  return { center, radius };
}

/** Create an Arc with validation. */
export function createArc(center: Point, radius: number, startAngle: number, endAngle: number): Arc {
  if (radius <= 0) {
    throw new DegenerateGeometryError('Arc', `Radius must be positive (received ${radius})`);
  }
  return { center, radius, startAngle, endAngle };
}

/** Area of a circle. */
export function circleArea(circle: Circle): number {
  return Math.PI * circle.radius * circle.radius;
}

/** Circumference / perimeter of a circle. */
export function circlePerimeter(circle: Circle): number {
  return 2 * Math.PI * circle.radius;
}

/** Check if a point is contained inside a circle. */
export function pointInCircle(point: Point, circle: Circle, tolerance: number = TOLERANCES.LINEAR): boolean {
  return distance(point, circle.center) <= circle.radius + tolerance;
}

/** Axis-aligned bounding box of a circle. */
export function circleBoundingBox(circle: Circle): BoundingBox {
  return {
    x: circle.center.x - circle.radius,
    y: circle.center.y - circle.radius,
    width: circle.radius * 2,
    height: circle.radius * 2,
  };
}

/** Length of an arc. */
export function arcLength(arc: Arc): number {
  let angleDiff = arc.endAngle - arc.startAngle;
  while (angleDiff < 0) angleDiff += 360;
  while (angleDiff >= 360) angleDiff -= 360;
  return (angleDiff / 360) * (2 * Math.PI * arc.radius);
}

/** Compute endpoints of an arc. */
export function arcEndpoints(arc: Arc): { start: Point; end: Point } {
  const startRad = (arc.startAngle * Math.PI) / 180;
  const endRad = (arc.endAngle * Math.PI) / 180;
  return {
    start: {
      x: arc.center.x + arc.radius * Math.cos(startRad),
      y: arc.center.y + arc.radius * Math.sin(startRad),
    },
    end: {
      x: arc.center.x + arc.radius * Math.cos(endRad),
      y: arc.center.y + arc.radius * Math.sin(endRad),
    },
  };
}

/** Discretize an arc into a polygon approximation with N segments. */
export function arcToPolygon(arc: Arc, segments: number = 16): Polygon {
  if (segments < 3) segments = 3;
  let angleDiff = arc.endAngle - arc.startAngle;
  while (angleDiff < 0) angleDiff += 360;

  const points: Point[] = [arc.center];
  for (let i = 0; i <= segments; i++) {
    const angle = arc.startAngle + (angleDiff * i) / segments;
    const rad = (angle * Math.PI) / 180;
    points.push({
      x: arc.center.x + arc.radius * Math.cos(rad),
      y: arc.center.y + arc.radius * Math.sin(rad),
    });
  }

  return { points };
}
