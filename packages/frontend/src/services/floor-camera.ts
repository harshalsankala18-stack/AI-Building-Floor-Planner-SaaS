import type { Floor, ViewTransform } from '@ai-floor-planner/core';
import { getFloorContentBounds } from '@ai-floor-planner/geometry-engine';
import { fitToView } from '@ai-floor-planner/renderer';

export function fitFloorToViewport(
  floor: Floor,
  viewportWidth: number,
  viewportHeight: number,
  padding = 50,
): ViewTransform {
  return fitToView(getFloorContentBounds(floor), viewportWidth, viewportHeight, padding);
}

export function rememberFloorCamera(
  cameras: Map<string, ViewTransform>,
  floorId: string,
  transform: ViewTransform,
): void {
  cameras.set(floorId, { ...transform });
}

export function restoreOrFitFloorCamera(
  cameras: ReadonlyMap<string, ViewTransform>,
  floor: Floor,
  viewportWidth: number,
  viewportHeight: number,
  padding = 50,
): ViewTransform {
  const saved = cameras.get(floor.id);
  return saved ? { ...saved } : fitFloorToViewport(floor, viewportWidth, viewportHeight, padding);
}
