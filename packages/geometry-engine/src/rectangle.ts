/**
 * Rectangle operations — optimized path for axis-aligned rectangles and bounding boxes.
 * All measurements in millimeters. All functions are pure.
 */

import type { Polygon, BoundingBox, Point } from '@ai-floor-planner/core';
import { TOLERANCES } from '@ai-floor-planner/core';
import { DegenerateGeometryError, InvalidCoordinateError } from './errors';
import { rotatePoint } from './point';

/** Create a rectangle polygon from position and dimensions. */
export function createRect(x: number, y: number, width: number, height: number): Polygon {
  if (width <= 0 || height <= 0) {
    throw new DegenerateGeometryError('Rectangle', `Width (${width}) and height (${height}) must be positive`);
  }
  return {
    points: [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ],
  };
}

/** Create a BoundingBox with validation. */
export function createBoundingBox(x: number, y: number, width: number, height: number): BoundingBox {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new InvalidCoordinateError('BoundingBox origin', { x, y });
  }
  if (width < 0 || height < 0) {
    throw new DegenerateGeometryError('BoundingBox', `Width (${width}) and height (${height}) cannot be negative`);
  }
  return { x, y, width, height };
}

/** Convert a polygon (assumed rectangular or general) to a bounding box. */
export function rectToBoundingBox(x: number, y: number, width: number, height: number): BoundingBox {
  return createBoundingBox(x, y, width, height);
}

/** Compute area of a bounding box. */
export function rectArea(rect: BoundingBox): number {
  return rect.width * rect.height;
}

/** Compute perimeter of a bounding box. */
export function rectPerimeter(rect: BoundingBox): number {
  return 2 * (rect.width + rect.height);
}

/** Compute center point of a bounding box. */
export function rectCenter(rect: BoundingBox): Point {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

/** Check if a point is contained inside a bounding box. */
export function rectContainsPoint(
  rect: BoundingBox,
  point: Point,
  tolerance: number = TOLERANCES.LINEAR,
): boolean {
  return (
    point.x >= rect.x - tolerance &&
    point.x <= rect.x + rect.width + tolerance &&
    point.y >= rect.y - tolerance &&
    point.y <= rect.y + rect.height + tolerance
  );
}

/** Check if outer rectangle fully contains inner rectangle. */
export function rectContains(
  outer: BoundingBox,
  inner: BoundingBox,
  tolerance: number = TOLERANCES.LINEAR,
): boolean {
  return (
    inner.x >= outer.x - tolerance &&
    inner.y >= outer.y - tolerance &&
    inner.x + inner.width <= outer.x + outer.width + tolerance &&
    inner.y + inner.height <= outer.y + outer.height + tolerance
  );
}

/** Check rectangle-rectangle overlap (strict overlap area > linear tolerance). */
export function rectsOverlap(
  a: BoundingBox,
  b: BoundingBox,
  tolerance: number = TOLERANCES.LINEAR,
): boolean {
  if (a.x + a.width <= b.x + tolerance) return false;
  if (b.x + b.width <= a.x + tolerance) return false;
  if (a.y + a.height <= b.y + tolerance) return false;
  if (b.y + b.height <= a.y + tolerance) return false;
  return true;
}

/** Compute intersection rectangle of two bounding boxes (or null if no overlap). */
export function rectIntersection(a: BoundingBox, b: BoundingBox): BoundingBox | null {
  const minX = Math.max(a.x, b.x);
  const minY = Math.max(a.y, b.y);
  const maxX = Math.min(a.x + a.width, b.x + b.width);
  const maxY = Math.min(a.y + a.height, b.y + b.height);

  if (maxX <= minX || maxY <= minY) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/** Compute bounding box union that encompasses both rectangles. */
export function rectUnion(a: BoundingBox, b: BoundingBox): BoundingBox {
  const minX = Math.min(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxX = Math.max(a.x + a.width, b.x + b.width);
  const maxY = Math.max(a.y + a.height, b.y + b.height);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/** Translate a bounding box by dx, dy. */
export function translateRect(rect: BoundingBox, dx: number, dy: number): BoundingBox {
  return {
    x: rect.x + dx,
    y: rect.y + dy,
    width: rect.width,
    height: rect.height,
  };
}

/** Scale a bounding box by scale factors around its top-left or specified origin. */
export function scaleRect(
  rect: BoundingBox,
  scaleX: number,
  scaleY: number = scaleX,
  origin?: Point,
): BoundingBox {
  if (scaleX <= 0 || scaleY <= 0) {
    throw new DegenerateGeometryError('BoundingBox', 'Scale factors must be positive');
  }
  const ox = origin ? origin.x : rect.x;
  const oy = origin ? origin.y : rect.y;

  const newX = ox + (rect.x - ox) * scaleX;
  const newY = oy + (rect.y - oy) * scaleY;
  const newWidth = rect.width * scaleX;
  const newHeight = rect.height * scaleY;

  return {
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight,
  };
}

/**
 * Rotate a rectangle around its center or specified origin, returning a Polygon.
 */
export function rotateRect(
  rect: BoundingBox,
  angleDeg: number,
  origin?: Point,
): Polygon {
  const rotOrigin = origin ?? rectCenter(rect);
  const corners: Point[] = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ];

  return {
    points: corners.map(p => rotatePoint(p, angleDeg, rotOrigin)),
  };
}

/**
 * Check if two rectangles are adjacent (share a wall).
 * Adjacent means touching at an edge with gap <= tolerance and positive overlapping length.
 */
export function rectsAdjacent(
  a: BoundingBox,
  b: BoundingBox,
  tolerance: number = TOLERANCES.ADJACENCY,
): boolean {
  const overlapX = a.x < b.x + b.width - tolerance && b.x < a.x + a.width - tolerance;
  const overlapY = a.y < b.y + b.height - tolerance && b.y < a.y + a.height - tolerance;

  const adjHoriz =
    overlapY &&
    (Math.abs(a.x + a.width - b.x) <= tolerance || Math.abs(b.x + b.width - a.x) <= tolerance);

  const adjVert =
    overlapX &&
    (Math.abs(a.y + a.height - b.y) <= tolerance || Math.abs(b.y + b.height - a.y) <= tolerance);

  return adjHoriz || adjVert;
}

/** Snap a bounding box to the nearest grid positions. */
export function snapRectToGrid(rect: BoundingBox, gridSize: number): BoundingBox {
  if (gridSize <= 0) return rect;
  return {
    x: Math.round(rect.x / gridSize) * gridSize,
    y: Math.round(rect.y / gridSize) * gridSize,
    width: Math.max(gridSize, Math.round(rect.width / gridSize) * gridSize),
    height: Math.max(gridSize, Math.round(rect.height / gridSize) * gridSize),
  };
}

/** Snap a point to the nearest grid intersection. */
export function snapPointToGrid(point: Point, gridSize: number): Point {
  if (gridSize <= 0) return point;
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}
