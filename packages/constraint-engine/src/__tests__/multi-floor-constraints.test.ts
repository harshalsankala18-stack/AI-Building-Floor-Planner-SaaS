import { describe, expect, it } from 'vitest';
import {
  Direction,
  RoomType,
  addRoom,
  addStair,
  createBuilding,
} from '@ai-floor-planner/core';
import { buildEvaluationContext } from '../context';
import { resolveConfig } from '../config';
import { VerticalCirculationContinuity } from '../constraints/hard/vertical-continuity';
import { FloorSpaceUtilization } from '../constraints/soft/space-utilization';

function makeConnectedBuilding() {
  let building = createBuilding({
    projectId: 'vertical-test',
    name: 'Connected Building',
    site: { plotWidth: 12000, plotDepth: 18000 },
    floors: Array.from({ length: 3 }, (_, level) => ({ buildingId: '', level, name: `Level ${level}` })),
  });
  for (const floor of building.floors) {
    building = addRoom(building, floor.id, {
      floorId: floor.id,
      type: RoomType.Staircase,
      name: 'Primary Stair',
      x: 1000, y: 1000, width: 2400, height: 3000,
    });
    const pair: [number, number] = floor.level === 2 ? [1, 2] : [floor.level, floor.level + 1];
    building = addStair(building, floor.id, {
      floorId: floor.id,
      x: 1000, y: 1000, width: 1200, length: 3000,
      direction: Direction.North,
      connectsFloors: pair,
      verticalCoreId: 'primary-stair-core',
    });
  }
  return building;
}

describe('multi-floor constraints', () => {
  it('passes one aligned stair core covering every adjacent floor pair', () => {
    const building = makeConnectedBuilding();
    const results = VerticalCirculationContinuity.evaluate(buildEvaluationContext(building, resolveConfig({}, building)));
    expect(results.every(result => result.passed)).toBe(true);
  });

  it('fails a missing staircase and a disconnected adjacent pair', () => {
    const building = makeConnectedBuilding();
    const broken = {
      ...building,
      floors: building.floors.map(floor => {
        if (floor.level === 1) return { ...floor, stairs: [] };
        if (floor.level === 0) {
          return { ...floor, stairs: floor.stairs.map(stair => ({ ...stair, connectsFloors: [0, 2] as [number, number] })) };
        }
        return floor;
      }),
    };
    const results = VerticalCirculationContinuity.evaluate(buildEvaluationContext(broken, resolveConfig({}, broken)));
    expect(results.some(result => !result.passed && /missing/i.test(result.message))).toBe(true);
    expect(results.some(result => !result.passed && /lack an explicit stair connection/i.test(result.message))).toBe(true);
  });

  it('penalizes a giant unexplained unused floor region', () => {
    let building = createBuilding({
      projectId: 'unused-test',
      name: 'Unused Space Building',
      site: { plotWidth: 100000, plotDepth: 100000 },
      floors: [{
        buildingId: '', level: 0, name: 'Ground Floor',
        boundary: { points: [{ x: 0, y: 0 }, { x: 100000, y: 0 }, { x: 100000, y: 100000 }, { x: 0, y: 100000 }] },
      }],
    });
    const floor = building.floors[0]!;
    building = addRoom(building, floor.id, {
      floorId: floor.id, type: RoomType.Bedroom,
      x: 1000, y: 1000, width: 3000, height: 3000,
    });
    const results = FloorSpaceUtilization.evaluate(buildEvaluationContext(building, resolveConfig({}, building)));
    expect(results[0]!.passed).toBe(false);
    expect(results[0]!.message).toMatch(/unexplained unused area/i);
    expect(results[0]!.score).toBeLessThan(results[0]!.maxScore);
  });
});
