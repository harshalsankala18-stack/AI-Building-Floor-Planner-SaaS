import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  KitchenDining,
  DiningLiving,
  MasterBathroom,
  UtilityKitchen,
  ParkingEntrance,
  PoojaAccess,
} from '../../constraints/soft/adjacency';
import { buildEvaluationContext } from '../../context';
import { resolveConfig } from '../../config';
import type { Building } from '@ai-floor-planner/core';

const FIXTURES_DIR = path.resolve(__dirname, '../../../../../tests/fixtures');

function loadFixture(name: string): Building {
  const json = fs.readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf-8');
  return JSON.parse(json) as Building;
}

describe('Soft Constraints: Adjacency', () => {
  it('SC-ADJ-001: awards full 20 points when Kitchen is adjacent to Dining in 30x50-2bhk', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = KitchenDining.evaluate(ctx);
    expect(results).toHaveLength(1);
    expect(results[0]?.passed).toBe(true);
    expect(results[0]?.score).toBe(20);
    expect(results[0]?.maxScore).toBe(20);
  });

  it('SC-ADJ-002: awards full 15 points when Dining is adjacent to Living', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = DiningLiving.evaluate(ctx);
    expect(results).toHaveLength(1);
    expect(results[0]?.passed).toBe(true);
    expect(results[0]?.score).toBe(15);
  });

  it('SC-ADJ-003: evaluates master bedroom with attached bathroom', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = MasterBathroom.evaluate(ctx);
    expect(results).toHaveLength(1);
    expect(results[0]?.maxScore).toBe(20);
    expect(results[0]?.score).toBeGreaterThanOrEqual(0);
  });

  it('returns graceful pass when room types are not in plan', () => {
    const building = loadFixture('minimal-1room');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const resUtility = UtilityKitchen.evaluate(ctx);
    expect(resUtility[0]?.passed).toBe(true);
    expect(resUtility[0]?.message).toContain('not applicable');

    const resParking = ParkingEntrance.evaluate(ctx);
    expect(resParking[0]?.passed).toBe(true);

    const resPooja = PoojaAccess.evaluate(ctx);
    expect(resPooja[0]?.passed).toBe(true);
  });
});
