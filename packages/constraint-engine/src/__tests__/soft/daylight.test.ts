import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  BedroomExternal,
  LivingExternal,
  KitchenExternal,
  WindowOrientation,
  AllHabitableLight,
} from '../../constraints/soft/daylight';
import { buildEvaluationContext } from '../../context';
import { resolveConfig } from '../../config';
import { createWindow, type Building } from '@ai-floor-planner/core';
import { ConstraintCategory, EvaluationStatus } from '../../types';
import {
  isScoreableResult,
  resolveEvaluationStatus,
  summarizeCategoryEvaluation,
} from '../../evaluation-status';

const FIXTURES_DIR = path.resolve(__dirname, '../../../../../tests/fixtures');

function loadFixture(name: string): Building {
  const json = fs.readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf-8');
  return JSON.parse(json) as Building;
}

describe('Soft Constraints: Daylight', () => {
  it('SC-DAY-001: awards full 20 points per bedroom on exterior wall in 30x50-2bhk', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = BedroomExternal.evaluate(ctx);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.passed)).toBe(true);
    expect(results.every(r => r.score === 20)).toBe(true);
  });

  it('SC-DAY-001: penalizes interior bedrooms lacking exterior walls in quality-poor-daylight', () => {
    const building = loadFixture('quality-poor-daylight');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = BedroomExternal.evaluate(ctx);
    const failed = results.filter(r => !r.passed);
    expect(failed.length).toBeGreaterThan(0);
    expect(failed[0]?.score).toBe(0);
    expect(failed[0]?.message).toMatch(/lacks natural light/i);
  });

  it('SC-DAY-002: evaluates living room daylight', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = LivingExternal.evaluate(ctx);
    expect(results[0]?.passed).toBe(true);
    expect(results[0]?.score).toBe(25);
  });

  it('SC-DAY-003: evaluates kitchen exterior wall access', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = KitchenExternal.evaluate(ctx);
    expect(results[0]?.passed).toBe(true);
    expect(results[0]?.score).toBe(15);
  });

  it('SC-DAY-004 & SC-DAY-005: window orientation and all habitable rooms light', () => {
    const fixture = loadFixture('30x50-2bhk');
    const floor = fixture.floors[0]!;
    const building: Building = {
      ...fixture,
      floors: [{
        ...floor,
        windows: [createWindow({
          floorId: floor.id,
          wallId: 'documented-opening',
          position: { x: 0, y: 0 },
          roomId: floor.rooms[0]!.id,
        })],
      }],
    };
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const resOrientation = WindowOrientation.evaluate(ctx);
    expect(resOrientation).toHaveLength(1);
    expect(resolveEvaluationStatus(resOrientation[0]!)).toBe(EvaluationStatus.NOT_ANALYZED);
    expect(isScoreableResult(resOrientation[0]!)).toBe(false);

    const resHabitable = AllHabitableLight.evaluate(ctx);
    expect(resHabitable[0]?.score).toBeGreaterThanOrEqual(0);
  });

  it('does not award window-orientation points when no windows exist', () => {
    const building = loadFixture('minimal-1room');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const result = WindowOrientation.evaluate(ctx)[0]!;
    expect(resolveEvaluationStatus(result)).toBe(EvaluationStatus.INSUFFICIENT_INPUT);
    expect(result.score).toBe(0);
    expect(result.maxScore).toBe(0);
    expect(isScoreableResult(result)).toBe(false);
    const category = summarizeCategoryEvaluation(ConstraintCategory.DAYLIGHT, [result], 100);
    expect(category.status).toBe(EvaluationStatus.INSUFFICIENT_INPUT);
    expect(category.score).toBeNull();
  });
});
