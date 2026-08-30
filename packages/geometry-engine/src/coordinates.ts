/**
 * World Coordinate System & Screen Space Mapping.
 *
 * CANONICAL WORLD COORDINATE SYSTEM:
 * - Origin (0, 0): North-West (top-left) corner of the plot.
 * - X-Axis: Increases to the East (right).
 * - Y-Axis: Increases to the South (downward).
 * - Rotation: Clockwise degrees from North (0° = North, 90° = East, 180° = South, 270° = West).
 * - Internal Unit: Millimeters (mm).
 *
 * SCREEN COORDINATES:
 * - Viewport pixels (x, y).
 * - The geometry engine is completely decoupled from screen pixels.
 * - This module provides explicit, deterministic projection transforms between world and screen space.
 */

import type { Point, BoundingBox, ViewTransform, ScreenPoint } from '@ai-floor-planner/core';
import { DegenerateGeometryError } from './errors';

/** Convert a world point (mm) to screen point (pixels). */
export function worldToScreen(worldPoint: Point, transform: ViewTransform): ScreenPoint {
  return {
    x: worldPoint.x * transform.scale + transform.offsetX,
    y: worldPoint.y * transform.scale + transform.offsetY,
  };
}

/** Convert a screen point (pixels) to world point (mm). */
export function screenToWorld(screenPoint: ScreenPoint, transform: ViewTransform): Point {
  if (transform.scale === 0) {
    throw new DegenerateGeometryError('ViewTransform', 'Scale cannot be zero');
  }
  return {
    x: (screenPoint.x - transform.offsetX) / transform.scale,
    y: (screenPoint.y - transform.offsetY) / transform.scale,
  };
}

/** Convert a world bounding box (mm) to a screen rectangle (pixels). */
export function worldRectToScreen(
  worldBounds: BoundingBox,
  transform: ViewTransform,
): { x: number; y: number; width: number; height: number } {
  return {
    x: worldBounds.x * transform.scale + transform.offsetX,
    y: worldBounds.y * transform.scale + transform.offsetY,
    width: worldBounds.width * transform.scale,
    height: worldBounds.height * transform.scale,
  };
}

/** Convert a screen rectangle (pixels) to world bounding box (mm). */
export function screenRectToWorld(
  screenRect: { x: number; y: number; width: number; height: number },
  transform: ViewTransform,
): BoundingBox {
  if (transform.scale === 0) {
    throw new DegenerateGeometryError('ViewTransform', 'Scale cannot be zero');
  }
  return {
    x: (screenRect.x - transform.offsetX) / transform.scale,
    y: (screenRect.y - transform.offsetY) / transform.scale,
    width: screenRect.width / transform.scale,
    height: screenRect.height / transform.scale,
  };
}

/**
 * Compute the optimal ViewTransform to fit world bounds into a screen viewport
 * with uniform aspect ratio scaling and centering padding.
 */
export function fitBoundsToViewport(
  worldBounds: BoundingBox,
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 40, // pixels
): ViewTransform {
  if (worldBounds.width <= 0 || worldBounds.height <= 0) {
    return { scale: 1, offsetX: viewportWidth / 2, offsetY: viewportHeight / 2 };
  }

  const availWidth = Math.max(10, viewportWidth - 2 * padding);
  const availHeight = Math.max(10, viewportHeight - 2 * padding);

  const scaleX = availWidth / worldBounds.width;
  const scaleY = availHeight / worldBounds.height;
  const scale = Math.min(scaleX, scaleY);

  const scaledWidth = worldBounds.width * scale;
  const scaledHeight = worldBounds.height * scale;

  const offsetX = (viewportWidth - scaledWidth) / 2 - worldBounds.x * scale;
  const offsetY = (viewportHeight - scaledHeight) / 2 - worldBounds.y * scale;

  return {
    scale,
    offsetX,
    offsetY,
  };
}
