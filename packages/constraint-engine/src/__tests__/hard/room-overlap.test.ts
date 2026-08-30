import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { NoIllegalOverlap } from '../../constraints/hard/room-overlap';
import { buildEvaluationContext } from '../../context';
import { resolveConfig } from '../../config';
import type { Building } from '@ai-floor-planner/core';

const FIXTURES_DIR = path.resolve(__dirname, '../../../../../tests/fixtures');

function loadFixture(name: string): Building {
  const json = fs.readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf-8');
  return JSON.parse(json) as Building;
}

describe('Hard Constraint: Room Overlap (HC-003)', () => {
  it('passes for non-overlapping valid fixture (30x50-2bhk)', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = NoIllegalOverlap.evaluate(ctx);
    expect(results.every(r => r.passed)).toBe(true);
    expect(results[0]?.constraintId).toBe('HC-003');
  });

  it('detects overlapping rooms with quantified measurement in invalid-overlap', () => {
    const building = loadFixture('invalid-overlap');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = NoIllegalOverlap.evaluate(ctx);
    const violations = results.filter(r => !r.passed);

    expect(violations.length).toBeGreaterThan(0);
    const v = violations[0]!;
    expect(v.constraintId).toBe('HC-003');
    expect(v.affectedEntities).toHaveLength(2);
    expect(v.message).toMatch(/overlaps/i);
    expect(v.message).toMatch(/sq ft/i);
    expect(v.explanation).toMatch(/sq mm/i);
    expect(v.suggestedFixes).toHaveLength(1);
    expect(v.suggestedFixes?.[0]?.actionType).toBe('move');
  });
});
