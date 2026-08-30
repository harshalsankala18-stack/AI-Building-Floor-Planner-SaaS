/**
 * Coordinate transform bridge: world space (mm) ↔ screen space (px).
 * Authoritative mathematical authority is `@ai-floor-planner/geometry-engine`.
 */

import type { ViewTransform } from '@ai-floor-planner/core';
import { fitBoundsToViewport } from '@ai-floor-planner/geometry-engine';

export {
  worldToScreen,
  screenToWorld,
  worldRectToScreen,
  screenRectToWorld,
  fitBoundsToViewport,
} from '@ai-floor-planner/geometry-engine';

/**
 * Calculate a ViewTransform that fits the given bounding box
 * into a viewport of the given size, with padding.
 * Canonical alias for `fitBoundsToViewport`.
 */
export const fitToView = fitBoundsToViewport;

/** Scale a dimension from world to screen. */
export function scaleToScreen(value: number, transform: ViewTransform): number {
  return value * transform.scale;
}
