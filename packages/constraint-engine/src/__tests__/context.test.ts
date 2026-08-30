import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { buildEvaluationContext } from '../context';
import { resolveConfig } from '../config';
import type { Building } from '@ai-floor-planner/core';
import { RoomType } from '@ai-floor-planner/core';

const FIXTURES_DIR = path.resolve(__dirname, '../../../../tests/fixtures');

function loadFixture(name: string): Building {
  const json = fs.readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf-8');
  return JSON.parse(json) as Building;
}

describe('EvaluationContext', () => {
  it('builds valid buildable envelope from site dimensions and setbacks', () => {
    const building = loadFixture('30x50-2bhk');
    const config = resolveConfig({}, building);
    const ctx = buildEvaluationContext(building, config);

    expect(ctx.buildableEnvelope.points).toHaveLength(4);
    // setbacks: front: 1500, rear: 1000, left: 900, right: 900
    // width: 9144, depth: 15240
    expect(ctx.buildableEnvelope.points[0]).toEqual({ x: 900, y: 1500 });
    expect(ctx.buildableEnvelope.points[1]).toEqual({ x: 9144 - 900, y: 1500 });
    expect(ctx.buildableEnvelope.points[2]).toEqual({ x: 9144 - 900, y: 15240 - 1000 });
    expect(ctx.buildableEnvelope.points[3]).toEqual({ x: 900, y: 15240 - 1000 });
  });

  it('populates spatial index with all rooms', () => {
    const building = loadFixture('30x50-2bhk');
    const config = resolveConfig({}, building);
    const ctx = buildEvaluationContext(building, config);

    const totalRooms = building.floors.reduce((sum, f) => sum + f.rooms.length, 0);
    expect(ctx.allRooms).toHaveLength(totalRooms);
    expect(ctx.spatialIndex.size()).toBe(totalRooms);
  });

  it('preserves required room types and user preferences', () => {
    const building = loadFixture('minimal-1room');
    const config = resolveConfig({}, building);
    const reqs = [RoomType.Kitchen, RoomType.Bathroom];
    const prefs = [
      {
        type: 'adjacency' as const,
        subject: 'kitchen',
        target: 'dining',
        strength: 'required' as const,
        weight: 1.0,
      },
    ];

    const ctx = buildEvaluationContext(building, config, reqs, prefs);
    expect(ctx.requiredRoomTypes).toEqual(reqs);
    expect(ctx.userPreferences).toEqual(prefs);
  });

  it('creates immutable context without mutating input building', () => {
    const building = loadFixture('30x50-2bhk');
    const originalJson = JSON.stringify(building);
    const config = resolveConfig({}, building);

    const ctx = buildEvaluationContext(building, config);
    expect(JSON.stringify(ctx.building)).toBe(originalJson);
    expect(JSON.stringify(building)).toBe(originalJson);
  });
});
