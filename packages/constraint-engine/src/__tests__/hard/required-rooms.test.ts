import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { RequiredRoomsPresent } from '../../constraints/hard/required-rooms';
import { buildEvaluationContext } from '../../context';
import { resolveConfig } from '../../config';
import type { Building } from '@ai-floor-planner/core';
import { RoomType } from '@ai-floor-planner/core';

const FIXTURES_DIR = path.resolve(__dirname, '../../../../../tests/fixtures');

function loadFixture(name: string): Building {
  const json = fs.readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf-8');
  return JSON.parse(json) as Building;
}

describe('Hard Constraint: Required Rooms Present (HC-020)', () => {
  it('passes when no required room types are specified', () => {
    const building = loadFixture('minimal-1room');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building), []);
    const results = RequiredRoomsPresent.evaluate(ctx);
    expect(results.every(r => r.passed)).toBe(true);
    expect(results[0]?.constraintId).toBe('HC-020');
  });

  it('passes when all required room types exist in the plan', () => {
    const building = loadFixture('30x50-2bhk');
    const required = [RoomType.Living, RoomType.Kitchen, RoomType.Bedroom, RoomType.Bathroom];
    const ctx = buildEvaluationContext(building, resolveConfig({}, building), required);
    const results = RequiredRoomsPresent.evaluate(ctx);
    expect(results.every(r => r.passed)).toBe(true);
  });

  it('fails when a required room type is missing from invalid-missing-room', () => {
    const building = loadFixture('invalid-missing-room');
    // Required rooms including Kitchen and Bathroom (which are missing in invalid-missing-room)
    const required = [RoomType.Kitchen, RoomType.Bathroom];
    const ctx = buildEvaluationContext(building, resolveConfig({}, building), required);
    const results = RequiredRoomsPresent.evaluate(ctx);
    const violations = results.filter(r => !r.passed);

    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]?.constraintId).toBe('HC-020');
    expect(violations[0]?.message).toMatch(/missing from the plan/);
    expect(violations[0]?.suggestedFixes).toBeDefined();
    expect(violations[0]?.suggestedFixes?.[0]?.actionType).toBe('add');
  });

  it('fails when the room type exists but the required instance count is not met', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(
      building,
      resolveConfig({}, building),
      [],
      [],
      false,
      { [RoomType.Bedroom]: 3 },
    );
    const violations = RequiredRoomsPresent.evaluate(ctx).filter(result => !result.passed);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('2 of 3 required "bedroom"');
    expect(violations[0]?.suggestedFixes?.[0]?.parameters?.missingCount).toBe(1);
  });
});
