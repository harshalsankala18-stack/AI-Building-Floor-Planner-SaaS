import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { DoorOnWall, DoorClearance } from '../../constraints/hard/door-validity';
import { buildEvaluationContext } from '../../context';
import { resolveConfig } from '../../config';
import type { Building } from '@ai-floor-planner/core';

const FIXTURES_DIR = path.resolve(__dirname, '../../../../../tests/fixtures');

function loadFixture(name: string): Building {
  const json = fs.readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf-8');
  return JSON.parse(json) as Building;
}

describe('Hard Constraints: Door Validity', () => {
  describe('HC-011: DoorOnWall', () => {
    it('passes for doors referencing valid wall IDs in 30x50-2bhk', () => {
      const building = loadFixture('30x50-2bhk');
      const ctx = buildEvaluationContext(building, resolveConfig({}, building));
      const results = DoorOnWall.evaluate(ctx);
      expect(results.every(r => r.passed)).toBe(true);
      expect(results[0]?.constraintId).toBe('HC-011');
    });

    it('fails when a door references a non-existent wall in invalid-door-no-wall', () => {
      const building = loadFixture('invalid-door-no-wall');
      const ctx = buildEvaluationContext(building, resolveConfig({}, building));
      const results = DoorOnWall.evaluate(ctx);
      const violations = results.filter(r => !r.passed);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0]?.constraintId).toBe('HC-011');
      expect(violations[0]?.affectedEntities).toHaveLength(1);
      expect(violations[0]?.message).toMatch(/non-existent wall/i);
      expect(violations[0]?.suggestedFixes).toBeDefined();
    });

    it('fails a placeholder entrance that connects outside to outside', () => {
      const building = loadFixture('invalid-door-no-wall');
      const floor = building.floors[0]!;
      const modified = {
        ...building,
        floors: [{
          ...floor,
          doors: [{ ...floor.doors[0]!, connectsRooms: ['', ''] as [string, string] }],
        }],
      };
      const ctx = buildEvaluationContext(modified, resolveConfig({}, modified));
      const results = DoorOnWall.evaluate(ctx);

      expect(results.some(result => !result.passed && /valid spaces/i.test(result.message))).toBe(true);
    });

    it('fails a door whose coordinate is not on its referenced wall', () => {
      const building = loadFixture('invalid-door-no-wall');
      const floor = building.floors[0]!;
      const modified = {
        ...building,
        floors: [{
          ...floor,
          doors: [{ ...floor.doors[0]!, position: { x: 1000, y: 1000 } }],
        }],
      };
      const ctx = buildEvaluationContext(modified, resolveConfig({}, modified));
      const results = DoorOnWall.evaluate(ctx);

      expect(results.some(result => !result.passed && /host wall/i.test(result.message))).toBe(true);
    });
  });

  describe('HC-012: DoorClearance', () => {
    it('evaluates door clearance warning constraint', () => {
      const building = loadFixture('30x50-2bhk');
      const ctx = buildEvaluationContext(building, resolveConfig({}, building));
      const results = DoorClearance.evaluate(ctx);
      expect(results).toHaveLength(1);
      expect(results[0]?.constraintId).toBe('HC-012');
      expect(results[0]?.passed).toBe(true);
    });
  });
});
