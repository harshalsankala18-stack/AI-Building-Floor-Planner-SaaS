import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { WallAlignment, ColumnGrid } from '../../constraints/soft/structural';
import { buildEvaluationContext } from '../../context';
import { resolveConfig } from '../../config';
import type { Building } from '@ai-floor-planner/core';
import { ConstraintSeverity, EvaluationStatus } from '../../types';
import { resolveEvaluationStatus } from '../../evaluation-status';

const FIXTURES_DIR = path.resolve(__dirname, '../../../../../tests/fixtures');

function loadFixture(name: string): Building {
  const json = fs.readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf-8');
  return JSON.parse(json) as Building;
}

describe('Soft / Warning Constraints: Structural', () => {
  it('SC-STR-001: WallAlignment is WARNING severity', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = WallAlignment.evaluate(ctx);
    expect(results).toHaveLength(1);
    expect(results[0]?.severity).toBe(ConstraintSeverity.WARNING);
    expect(resolveEvaluationStatus(results[0]!)).toBe(EvaluationStatus.NOT_APPLICABLE);
  });

  it('SC-STR-002: ColumnGrid is INFORMATIONAL severity', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = ColumnGrid.evaluate(ctx);
    expect(results).toHaveLength(1);
    expect(results[0]?.severity).toBe(ConstraintSeverity.INFORMATIONAL);
    expect(resolveEvaluationStatus(results[0]!)).toBe(EvaluationStatus.NOT_ANALYZED);
    expect(results[0]?.maxScore).toBe(0);
  });
});
