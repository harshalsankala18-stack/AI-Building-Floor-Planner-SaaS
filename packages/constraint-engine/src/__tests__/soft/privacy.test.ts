import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  BedroomSeparation,
  MasterIsolation,
  BathroomVisibility,
  GuestSeparation,
} from '../../constraints/soft/privacy';
import { buildEvaluationContext } from '../../context';
import { resolveConfig } from '../../config';
import type { Building } from '@ai-floor-planner/core';

const FIXTURES_DIR = path.resolve(__dirname, '../../../../../tests/fixtures');

function loadFixture(name: string): Building {
  const json = fs.readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf-8');
  return JSON.parse(json) as Building;
}

describe('Soft Constraints: Privacy', () => {
  it('SC-PRI-001: passes for bedrooms well-separated from entrance in 30x50-2bhk', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = BedroomSeparation.evaluate(ctx);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.passed)).toBe(true);
  });

  it('SC-PRI-001: detects bedroom directly adjacent to entrance in quality-poor-privacy', () => {
    const building = loadFixture('quality-poor-privacy');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = BedroomSeparation.evaluate(ctx);
    const failed = results.filter(r => !r.passed);
    expect(failed.length).toBeGreaterThan(0);
    expect(failed[0]?.score).toBe(0);
    expect(failed[0]?.message).toMatch(/adjacent to entrance/i);
  });

  it('SC-PRI-002: evaluates master bedroom isolation', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = MasterIsolation.evaluate(ctx);
    expect(results).toHaveLength(1);
    expect(results[0]?.maxScore).toBe(20);
  });

  it('SC-PRI-003 & SC-PRI-004: bathroom visibility and guest separation', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const resBath = BathroomVisibility.evaluate(ctx);
    expect(resBath).toHaveLength(1);

    const resGuest = GuestSeparation.evaluate(ctx);
    expect(resGuest).toHaveLength(1);
  });
});
