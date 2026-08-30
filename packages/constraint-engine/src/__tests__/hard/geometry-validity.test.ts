import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  ValidPolygons,
  PositiveArea,
  WallIntegrity,
} from '../../constraints/hard/geometry-validity';
import { buildEvaluationContext } from '../../context';
import { resolveConfig } from '../../config';
import type { Building } from '@ai-floor-planner/core';
import { WallType } from '@ai-floor-planner/core';

const FIXTURES_DIR = path.resolve(__dirname, '../../../../../tests/fixtures');

function loadFixture(name: string): Building {
  const json = fs.readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf-8');
  return JSON.parse(json) as Building;
}

describe('Hard Constraints: Geometry Validity', () => {
  describe('HC-004: ValidPolygons', () => {
    it('passes for valid polygon boundaries', () => {
      const building = loadFixture('30x50-2bhk');
      const ctx = buildEvaluationContext(building, resolveConfig({}, building));
      const results = ValidPolygons.evaluate(ctx);
      expect(results.every(r => r.passed)).toBe(true);
    });

    it('fails when room boundary has fewer than 3 points', () => {
      const building = loadFixture('minimal-1room');
      const invalidRoom = {
        ...building.floors[0]!.rooms[0]!,
        boundary: {
          points: [
            { x: 0, y: 0 },
            { x: 1000, y: 0 },
          ],
        },
      };
      const modified = {
        ...building,
        floors: [{ ...building.floors[0]!, rooms: [invalidRoom] }],
      };
      const ctx = buildEvaluationContext(modified, resolveConfig({}, modified));
      const results = ValidPolygons.evaluate(ctx);
      expect(results.some(r => !r.passed && r.constraintId === 'HC-004')).toBe(true);
    });
  });

  describe('HC-005: PositiveArea', () => {
    it('passes for rooms with positive area', () => {
      const building = loadFixture('30x50-2bhk');
      const ctx = buildEvaluationContext(building, resolveConfig({}, building));
      const results = PositiveArea.evaluate(ctx);
      expect(results.every(r => r.passed)).toBe(true);
    });

    it('fails when room has 0 or negative area', () => {
      const building = loadFixture('minimal-1room');
      const zeroAreaRoom = {
        ...building.floors[0]!.rooms[0]!,
        area: 0,
      };
      const modified = {
        ...building,
        floors: [{ ...building.floors[0]!, rooms: [zeroAreaRoom] }],
      };
      const ctx = buildEvaluationContext(modified, resolveConfig({}, modified));
      const results = PositiveArea.evaluate(ctx);
      const violations = results.filter(r => !r.passed);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0]?.constraintId).toBe('HC-005');
      expect(violations[0]?.message).toMatch(/non-positive area/i);
    });
  });

  describe('HC-006: WallIntegrity', () => {
    it('passes for walls with valid length and thickness', () => {
      const building = loadFixture('30x50-2bhk');
      const ctx = buildEvaluationContext(building, resolveConfig({}, building));
      const results = WallIntegrity.evaluate(ctx);
      expect(results.every(r => r.passed)).toBe(true);
    });

    it('fails for zero-length walls or zero-thickness walls', () => {
      const building = loadFixture('30x50-2bhk');
      const zeroLenWall = {
        id: 'bad-wall-1',
        floorId: 'floor-gf-001',
        startPoint: { x: 1000, y: 1000 },
        endPoint: { x: 1000, y: 1000 },
        thickness: 0,
        height: 3000,
        type: WallType.Internal,
        roomIds: [],
        hasOpening: false,
        isExterior: false,
        loadBearing: false,
        material: 'brick',
      };
      const modified = {
        ...building,
        floors: [{ ...building.floors[0]!, walls: [zeroLenWall] }],
      };
      const ctx = buildEvaluationContext(modified, resolveConfig({}, modified));
      const results = WallIntegrity.evaluate(ctx);
      const violations = results.filter(r => !r.passed);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some(v => v.constraintId === 'HC-006')).toBe(true);
    });
  });
});
