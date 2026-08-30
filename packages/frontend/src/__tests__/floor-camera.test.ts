import { describe, expect, it } from 'vitest';
import { createBuilding } from '@ai-floor-planner/core';
import type { ViewTransform } from '@ai-floor-planner/core';
import { worldToScreen } from '@ai-floor-planner/renderer';
import {
  fitFloorToViewport,
  rememberFloorCamera,
  restoreOrFitFloorCamera,
} from '../services/floor-camera';

function floors() {
  return createBuilding({
    projectId: 'camera-test',
    name: 'Camera test',
    site: { plotWidth: 80000, plotDepth: 50000 },
    floors: [
      {
        buildingId: '', level: 0, name: 'Ground',
        boundary: { points: [{ x: 0, y: 0 }, { x: 10000, y: 0 }, { x: 10000, y: 16000 }, { x: 0, y: 16000 }] },
      },
      {
        buildingId: '', level: 1, name: 'Upper',
        boundary: { points: [{ x: 50000, y: 25000 }, { x: 62000, y: 25000 }, { x: 62000, y: 33000 }, { x: 50000, y: 33000 }] },
      },
    ],
  }).floors;
}

describe('per-floor camera memory', () => {
  it('fits a newly visited distant floor inside the viewport', () => {
    const upper = floors()[1]!;
    const transform = fitFloorToViewport(upper, 900, 600);
    const first = worldToScreen(upper.boundary.points[0]!, transform);
    const opposite = worldToScreen(upper.boundary.points[2]!, transform);
    expect(first.x).toBeGreaterThanOrEqual(49);
    expect(first.y).toBeGreaterThanOrEqual(49);
    expect(opposite.x).toBeLessThanOrEqual(851);
    expect(opposite.y).toBeLessThanOrEqual(551);
  });

  it('restores the remembered camera for each floor without sharing transforms', () => {
    const [ground, upper] = floors();
    const cameras = new Map<string, ViewTransform>();
    const groundCamera = { scale: 0.08, offsetX: 31, offsetY: 42 };
    rememberFloorCamera(cameras, ground!.id, groundCamera);
    const upperCamera = restoreOrFitFloorCamera(cameras, upper!, 900, 600);
    rememberFloorCamera(cameras, upper!.id, upperCamera);
    expect(restoreOrFitFloorCamera(cameras, ground!, 900, 600)).toEqual(groundCamera);
    expect(restoreOrFitFloorCamera(cameras, upper!, 900, 600)).toEqual(upperCamera);
    expect(upperCamera).not.toEqual(groundCamera);
  });
});
