import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { WindowOnWall } from '../../constraints/hard/window-validity';
import { buildEvaluationContext } from '../../context';
import { resolveConfig } from '../../config';
import type { Building, Floor, Wall, Window } from '@ai-floor-planner/core';
import { WallType, WindowType } from '@ai-floor-planner/core';

const FIXTURES_DIR = path.resolve(__dirname, '../../../../../tests/fixtures');

function loadFixture(name: string): Building {
  const json = fs.readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf-8');
  return JSON.parse(json) as Building;
}

describe('Hard Constraint: Window Validity (HC-015)', () => {
  it('passes when all windows are placed on existing walls in 30x50-2bhk', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = WindowOnWall.evaluate(ctx);
    expect(results.every(r => r.passed)).toBe(true);
    expect(results[0]?.constraintId).toBe('HC-015');
  });

  it('fails when a window references a non-existent wall in invalid-window-no-wall', () => {
    const building = loadFixture('invalid-window-no-wall');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = WindowOnWall.evaluate(ctx);
    const violations = results.filter(r => !r.passed);

    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]?.constraintId).toBe('HC-015');
    expect(violations[0]?.affectedEntities).toHaveLength(1);
    expect(violations[0]?.message).toMatch(/non-existent wall/i);
    expect(violations[0]?.suggestedFixes).toBeDefined();
    expect(violations[0]?.suggestedFixes?.[0]?.actionType).toBe('move');
  });

  it('fails a window whose coordinate is not on its referenced external wall', () => {
    const building = loadFixture('minimal-1room');
    const floor = building.floors[0]!;
    const room = floor.rooms[0]!;
    const wall: Wall = {
      id: 'window-wall',
      floorId: floor.id,
      startPoint: { x: room.x, y: room.y },
      endPoint: { x: room.x + room.width, y: room.y },
      thickness: 230,
      type: WallType.External,
      roomIds: [room.id],
      hasOpening: true,
      loadBearing: true,
    };
    const win: Window = {
      id: 'off-wall-window',
      floorId: floor.id,
      wallId: wall.id,
      position: { x: room.x + 1000, y: room.y + 1000 },
      width: 1200,
      height: 1200,
      sillHeight: 900,
      type: WindowType.Sliding,
      roomId: room.id,
    };
    const modifiedFloor: Floor = { ...floor, walls: [wall], windows: [win] };
    const modified: Building = { ...building, floors: [modifiedFloor] };
    const ctx = buildEvaluationContext(modified, resolveConfig({}, modified));
    const results = WindowOnWall.evaluate(ctx);

    expect(results.some(result => !result.passed && /host wall/i.test(result.message))).toBe(true);
  });

  it('passes a valid window attached to an existing room and external wall', () => {
    const building = loadFixture('minimal-1room');
    const floor = building.floors[0]!;
    const room = floor.rooms[0]!;
    const wall: Wall = {
      id: 'valid-window-wall',
      floorId: floor.id,
      startPoint: { x: room.x, y: room.y },
      endPoint: { x: room.x + room.width, y: room.y },
      thickness: 230,
      type: WallType.External,
      roomIds: [room.id],
      hasOpening: true,
      loadBearing: true,
    };
    const win: Window = {
      id: 'valid-window',
      floorId: floor.id,
      wallId: wall.id,
      position: { x: room.x + 500, y: room.y },
      width: 1200,
      height: 1200,
      sillHeight: 900,
      type: WindowType.Sliding,
      roomId: room.id,
    };
    const modifiedFloor: Floor = { ...floor, walls: [wall], windows: [win] };
    const modified: Building = { ...building, floors: [modifiedFloor] };
    const ctx = buildEvaluationContext(modified, resolveConfig({}, modified));
    const results = WindowOnWall.evaluate(ctx);

    expect(results.every(result => result.passed)).toBe(true);
  });
});
