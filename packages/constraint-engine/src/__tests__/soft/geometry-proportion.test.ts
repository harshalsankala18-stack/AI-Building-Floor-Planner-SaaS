import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  AspectRatio,
  RoomSizeRange,
  DimensionBalance,
} from '../../constraints/soft/geometry-proportion';
import { buildEvaluationContext } from '../../context';
import { resolveConfig } from '../../config';
import type { Building } from '@ai-floor-planner/core';

const FIXTURES_DIR = path.resolve(__dirname, '../../../../../tests/fixtures');

function loadFixture(name: string): Building {
  const json = fs.readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf-8');
  return JSON.parse(json) as Building;
}

describe('Soft Constraints: Geometry & Proportion', () => {
  it('SC-GEO-001: evaluates aspect ratio for all rooms', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = AspectRatio.evaluate(ctx);
    expect(results.length).toBe(building.floors[0]!.rooms.length);
    expect(results.every(r => r.score >= 0 && r.score <= 10)).toBe(true);
  });

  it('SC-GEO-002: evaluates room size within target ranges', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = RoomSizeRange.evaluate(ctx);
    expect(results.length).toBe(building.floors[0]!.rooms.length);
  });

  it('SC-GEO-003: evaluates bedroom dimension balance', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = DimensionBalance.evaluate(ctx);
    expect(results).toHaveLength(1);
    expect(results[0]?.maxScore).toBe(15);
  });
});
