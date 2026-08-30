import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { FloorRoomConsistency } from '../../constraints/hard/floor-consistency';
import { buildEvaluationContext } from '../../context';
import { resolveConfig } from '../../config';
import type { Building } from '@ai-floor-planner/core';

const FIXTURES_DIR = path.resolve(__dirname, '../../../../../tests/fixtures');

function loadFixture(name: string): Building {
  const json = fs.readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf-8');
  return JSON.parse(json) as Building;
}

describe('Hard Constraint: Floor-Room Consistency (HC-030)', () => {
  it('passes when all rooms reference their hosting floorId', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = FloorRoomConsistency.evaluate(ctx);
    expect(results.every(r => r.passed)).toBe(true);
    expect(results[0]?.constraintId).toBe('HC-030');
  });

  it('fails when room floorId does not match hosting floor id', () => {
    const building = loadFixture('minimal-1room');
    const mismatchedRoom = {
      ...building.floors[0]!.rooms[0]!,
      floorId: 'wrong-floor-id-999',
    };
    const modified = {
      ...building,
      floors: [{ ...building.floors[0]!, rooms: [mismatchedRoom] }],
    };
    const ctx = buildEvaluationContext(modified, resolveConfig({}, modified));
    const results = FloorRoomConsistency.evaluate(ctx);
    const violations = results.filter(r => !r.passed);

    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]?.constraintId).toBe('HC-030');
    expect(violations[0]?.affectedEntities).toContain(mismatchedRoom.id);
    expect(violations[0]?.message).toMatch(/mismatched floorId/i);
    expect(violations[0]?.suggestedFixes).toBeDefined();
  });
});
