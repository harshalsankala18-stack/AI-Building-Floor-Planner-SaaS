import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { RoomContainment, FloorContainment } from '../../constraints/hard/plot-containment';
import { buildEvaluationContext } from '../../context';
import { resolveConfig } from '../../config';
import type { Building } from '@ai-floor-planner/core';

const FIXTURES_DIR = path.resolve(__dirname, '../../../../../tests/fixtures');

function loadFixture(name: string): Building {
  const json = fs.readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf-8');
  return JSON.parse(json) as Building;
}

describe('Hard Constraint: Plot & Floor Containment', () => {
  it('HC-001: passes for valid 30x50-2bhk plan', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = RoomContainment.evaluate(ctx);
    expect(results.every(r => r.passed)).toBe(true);
    expect(results[0]?.constraintId).toBe('HC-001');
  });

  it('HC-001: detects room extending outside floor boundary in invalid-outside-boundary', () => {
    const building = loadFixture('invalid-outside-boundary');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = RoomContainment.evaluate(ctx);
    const violations = results.filter(r => !r.passed);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]?.constraintId).toBe('HC-001');
    expect(violations[0]?.affectedEntities.length).toBeGreaterThan(0);
    expect(violations[0]?.message).toMatch(/extends outside the floor boundary/i);
    expect(violations[0]?.suggestedFixes).toBeDefined();
    expect(violations[0]?.suggestedFixes?.[0]?.actionType).toBe('move');
  });

  it('HC-002: passes for valid 30x50-2bhk floor within setbacks', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = FloorContainment.evaluate(ctx);
    expect(results.every(r => r.passed)).toBe(true);
    expect(results[0]?.constraintId).toBe('HC-002');
  });

  it('HC-002: detects floor boundary exceeding plot setbacks', () => {
    const building = loadFixture('30x50-2bhk');
    // Modify floor boundary to extend past setback limits
    const violatingFloor = {
      ...building.floors[0]!,
      boundary: {
        points: [
          { x: 0, y: 0 },
          { x: 9144, y: 0 },
          { x: 9144, y: 15240 },
          { x: 0, y: 15240 },
        ],
      },
    };
    const modified = { ...building, floors: [violatingFloor] };
    const ctx = buildEvaluationContext(modified, resolveConfig({}, modified));
    const results = FloorContainment.evaluate(ctx);
    const violations = results.filter(r => !r.passed);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]?.constraintId).toBe('HC-002');
    expect(violations[0]?.message).toContain('Ground Floor');
  });
});
