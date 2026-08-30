import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  PublicPrivateSeparation,
  ServiceZoneGrouping,
  NightDaySeparation,
} from '../../constraints/soft/zoning';
import { buildEvaluationContext } from '../../context';
import { resolveConfig } from '../../config';
import type { Building } from '@ai-floor-planner/core';

const FIXTURES_DIR = path.resolve(__dirname, '../../../../../tests/fixtures');

function loadFixture(name: string): Building {
  const json = fs.readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf-8');
  return JSON.parse(json) as Building;
}

describe('Soft Constraints: Functional Zoning', () => {
  it('SC-ZON-001: evaluates public-private zone separation', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = PublicPrivateSeparation.evaluate(ctx);
    expect(results).toHaveLength(1);
    expect(results[0]?.score).toBeGreaterThan(0);
    expect(results[0]?.maxScore).toBe(25);
  });

  it('SC-ZON-002: evaluates service zone grouping', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = ServiceZoneGrouping.evaluate(ctx);
    expect(results).toHaveLength(1);
    expect(results[0]?.maxScore).toBe(15);
  });

  it('SC-ZON-003: evaluates night-day separation', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = NightDaySeparation.evaluate(ctx);
    expect(results).toHaveLength(1);
    expect(results[0]?.maxScore).toBe(15);
  });
});
