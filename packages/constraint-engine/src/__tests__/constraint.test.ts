import { describe, it, expect } from 'vitest';
import { validate, NoIllegalOverlap, RoomContainment } from '../index';
import { deserializeBuilding } from '@ai-floor-planner/core';
import * as fs from 'fs';
import * as path from 'path';
import { buildEvaluationContext } from '../context';
import { resolveConfig } from '../config';

describe('Constraint Engine', () => {
  function loadFixture(name: string) {
    const cwdPath = path.resolve(process.cwd(), 'tests/fixtures', name);
    const fixturePath = fs.existsSync(cwdPath) ? cwdPath : path.resolve(__dirname, '../../../../tests/fixtures', name);
    const json = fs.readFileSync(fixturePath, 'utf-8');
    return deserializeBuilding(json);
  }

  describe('Hard Constraints', () => {
    it('valid fixture passes all hard constraints', () => {
      const building = loadFixture('minimal-1room.json');
      const report = validate(building);
      expect(report.isValid).toBe(true);
      expect(report.hardViolations).toHaveLength(0);
    });

    it('valid 2BHK fixture passes hard constraints', () => {
      const building = loadFixture('30x50-2bhk.json');
      const report = validate(building);
      expect(report.isValid).toBe(true);
      expect(report.hardViolations).toHaveLength(0);
    });

    it('HC-003: detects overlapping rooms in invalid fixture', () => {
      const building = loadFixture('invalid-overlap.json');
      const config = resolveConfig({}, building);
      const ctx = buildEvaluationContext(building, config);
      const results = NoIllegalOverlap.evaluate(ctx);
      const failures = results.filter(r => !r.passed);
      expect(failures.length).toBeGreaterThan(0);
      expect(failures[0]!.constraintId).toBe('HC-003');
    });

    it('HC-001: detects room outside floor boundary', () => {
      const building = loadFixture('minimal-1room.json');
      // Manually create a building with a room outside bounds
      const modifiedFloor = {
        ...building.floors[0]!,
        rooms: [
          {
            ...building.floors[0]!.rooms[0]!,
            x: 10000,
            y: 10000,
            boundary: {
              points: [
                { x: 10000, y: 10000 },
                { x: 15000, y: 10000 },
                { x: 15000, y: 18000 },
                { x: 10000, y: 18000 },
              ],
            },
          },
        ],
      };
      const config = resolveConfig({}, { ...building, floors: [modifiedFloor] });
      const ctx = buildEvaluationContext({ ...building, floors: [modifiedFloor] }, config);
      const results = RoomContainment.evaluate(ctx);
      const failures = results.filter(r => !r.passed);
      expect(failures.length).toBeGreaterThan(0);
      expect(failures[0]!.constraintId).toBe('HC-001');
    });

    it('invalid-overlap fixture fails validation', () => {
      const building = loadFixture('invalid-overlap.json');
      const report = validate(building);
      expect(report.isValid).toBe(false);
    });
  });

  describe('Soft Scoring', () => {
    it('produces overall score 0-100', () => {
      const building = loadFixture('30x50-2bhk.json');
      const report = validate(building);
      expect(report.score.overall).toBeGreaterThanOrEqual(0);
      expect(report.score.overall).toBeLessThanOrEqual(100);
    });

    it('produces category scores', () => {
      const building = loadFixture('30x50-2bhk.json');
      const report = validate(building);
      const cats = report.score.categories;
      expect(cats.geometry.score).toBeGreaterThanOrEqual(0);
      expect(cats.daylight.score).toBeGreaterThanOrEqual(0);
      expect(cats.privacy.score).toBeGreaterThanOrEqual(0);
      expect(cats.adjacency.score).toBeGreaterThanOrEqual(0);
    });

    it('has correct weight distribution', () => {
      const building = loadFixture('minimal-1room.json');
      const report = validate(building);
      const totalWeight = Object.values(report.score.categories)
        .reduce((sum, cat) => sum + cat.weight, 0);
      // Weights may not sum to exactly 1.0 because the PlanScore maps 
      // a subset of the full category system
      expect(totalWeight).toBeGreaterThan(0);
      expect(totalWeight).toBeLessThanOrEqual(1.01);
    });
  });

  describe('Full Validation Report', () => {
    it('includes suggestions for hard violations', () => {
      const building = loadFixture('invalid-overlap.json');
      const report = validate(building);
      expect(report.suggestions.length).toBeGreaterThan(0);
    });

    it('has a timestamp', () => {
      const building = loadFixture('minimal-1room.json');
      const report = validate(building);
      expect(report.timestamp).toBeTruthy();
    });
  });
});
