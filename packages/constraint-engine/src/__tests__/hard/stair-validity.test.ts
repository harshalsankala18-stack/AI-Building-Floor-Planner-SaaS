import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { StairConnectivity, StairDimensions } from '../../constraints/hard/stair-validity';
import { buildEvaluationContext } from '../../context';
import { resolveConfig } from '../../config';
import type { Building } from '@ai-floor-planner/core';
import { StairType, Direction } from '@ai-floor-planner/core';

const FIXTURES_DIR = path.resolve(__dirname, '../../../../../tests/fixtures');

function loadFixture(name: string): Building {
  const json = fs.readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf-8');
  return JSON.parse(json) as Building;
}

describe('Hard Constraints: Stair Validity', () => {
  describe('HC-014: StairConnectivity', () => {
    it('passes when no stairs are present or stairs connect valid consecutive floors', () => {
      const building = loadFixture('30x50-2bhk');
      const ctx = buildEvaluationContext(building, resolveConfig({}, building));
      const results = StairConnectivity.evaluate(ctx);
      expect(results.every(r => r.passed)).toBe(true);
      expect(results[0]?.constraintId).toBe('HC-014');
    });

    it('fails when stair connects to non-existent floor level in invalid-stair-no-floor', () => {
      const building = loadFixture('invalid-stair-no-floor');
      const ctx = buildEvaluationContext(building, resolveConfig({}, building));
      const results = StairConnectivity.evaluate(ctx);
      const violations = results.filter(r => !r.passed);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0]?.constraintId).toBe('HC-014');
      expect(violations[0]?.message).toMatch(/non-existent floor level/i);
      expect(violations[0]?.suggestedFixes).toBeDefined();
    });

    it('fails when stair connects non-consecutive floor levels (e.g. level 0 to level 2)', () => {
      const building = loadFixture('minimal-1room');
      const multiFloor = {
        ...building,
        floors: [
          {
            ...building.floors[0]!,
            level: 0,
            stairs: [
              {
                id: 'stair-skip-1',
                floorId: 'floor-gf-001',
                type: StairType.Straight,
                boundary: { points: [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 3000 }, { x: 0, y: 3000 }] },
                x: 0,
                y: 0,
                width: 1000,
                length: 3000,
                riserCount: 16,
                treadDepth: 250,
                riserHeight: 180,
                landingWidth: 1000,
                connectsFloors: [0, 2] as [number, number],
                direction: Direction.North,
              },
            ],
          },
          {
            ...building.floors[0]!,
            id: 'floor-2',
            level: 2,
          },
        ],
      };

      const ctx = buildEvaluationContext(multiFloor, resolveConfig({}, multiFloor));
      const results = StairConnectivity.evaluate(ctx);
      const violations = results.filter(r => !r.passed);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0]?.message).toMatch(/non-consecutive/i);
    });
  });

  describe('HC-016: StairDimensions', () => {
    it('fails when stair width is less than 900mm or riser is > 200mm', () => {
      const building = loadFixture('minimal-1room');
      const badStair = {
        ...building,
        floors: [
          {
            ...building.floors[0]!,
            stairs: [
              {
                id: 'stair-bad-dim',
                floorId: 'floor-gf-001',
                type: StairType.Straight,
                boundary: { points: [{ x: 0, y: 0 }, { x: 700, y: 0 }, { x: 700, y: 3000 }, { x: 0, y: 3000 }] },
                x: 0,
                y: 0,
                width: 700, // < 900
                length: 3000,
                riserCount: 12,
                treadDepth: 250,
                riserHeight: 250, // > 200
                landingWidth: 700,
                connectsFloors: [0, 1] as [number, number],
                direction: Direction.North,
              },
            ],
          },
          {
            ...building.floors[0]!,
            id: 'floor-1',
            level: 1,
          },
        ],
      };

      const ctx = buildEvaluationContext(badStair, resolveConfig({}, badStair));
      const results = StairDimensions.evaluate(ctx);
      const violations = results.filter(r => !r.passed);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some(v => v.constraintId === 'HC-016')).toBe(true);
    });
  });
});
