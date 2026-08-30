import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  CorridorRatio,
  NoDeadEnds,
  DirectAccess,
  PathLength,
} from '../../constraints/soft/circulation';
import { buildEvaluationContext } from '../../context';
import { resolveConfig } from '../../config';
import type { Building } from '@ai-floor-planner/core';

const FIXTURES_DIR = path.resolve(__dirname, '../../../../../tests/fixtures');

function loadFixture(name: string): Building {
  const json = fs.readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf-8');
  return JSON.parse(json) as Building;
}

describe('Soft Constraints: Circulation', () => {
  it('SC-CIR-001: awards full score for efficient circulation in 30x50-2bhk', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = CorridorRatio.evaluate(ctx);
    expect(results).toHaveLength(1);
    expect(results[0]?.score).toBeGreaterThan(0);
  });

  it('SC-CIR-001: penalizes corridor ratio > 20% in quality-poor-circulation', () => {
    const building = loadFixture('quality-poor-circulation');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = CorridorRatio.evaluate(ctx);
    expect(results).toHaveLength(1);
    expect(results[0]?.passed).toBe(false);
    expect(results[0]?.score).toBe(0);
    expect(results[0]?.message).toMatch(/Excessive corridor area/i);
  });

  it('SC-CIR-002: evaluates dead ends', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = NoDeadEnds.evaluate(ctx);
    expect(results).toHaveLength(1);
    expect(results[0]?.score).toBe(15);
  });

  it('SC-CIR-003: awards points for direct room access', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = DirectAccess.evaluate(ctx);
    expect(results).toHaveLength(1);
    expect(results[0]?.score).toBe(15);
  });

  it('SC-CIR-004: evaluates path length', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = PathLength.evaluate(ctx);
    expect(results).toHaveLength(1);
    expect(results[0]?.score).toBeGreaterThanOrEqual(0);
  });
});
