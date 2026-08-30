import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { MinimumRoomSize } from '../../constraints/hard/minimum-size';
import { buildEvaluationContext } from '../../context';
import { resolveConfig } from '../../config';
import type { Building } from '@ai-floor-planner/core';
import { RoomType, DaylightLevel, PrivacyLevel } from '@ai-floor-planner/core';

const FIXTURES_DIR = path.resolve(__dirname, '../../../../../tests/fixtures');

function loadFixture(name: string): Building {
  const json = fs.readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf-8');
  return JSON.parse(json) as Building;
}

describe('Hard Constraint: Minimum Room Size (HC-023)', () => {
  it('passes for 30x50-2bhk fixture where all rooms meet area and dimension requirements', () => {
    const building = loadFixture('30x50-2bhk');
    const ctx = buildEvaluationContext(building, resolveConfig({}, building));
    const results = MinimumRoomSize.evaluate(ctx);
    expect(results.every(r => r.passed)).toBe(true);
    expect(results[0]?.constraintId).toBe('HC-023');
  });

  it('fails when a bedroom is smaller than minimum required area', () => {
    const building = loadFixture('minimal-1room');
    const smallBedroom = {
      id: 'tiny-bed',
      floorId: 'floor-gf-001',
      type: RoomType.Bedroom,
      name: 'Tiny Bedroom',
      boundary: {
        points: [
          { x: 1000, y: 1000 },
          { x: 3000, y: 1000 },
          { x: 3000, y: 3000 },
          { x: 1000, y: 3000 },
        ],
      },
      x: 1000,
      y: 1000,
      width: 2000,
      height: 2000,
      rotation: 0,
      area: 4000000, // 4 sq m < 9.5 sq m
      priority: 8,
      tags: [],
      adjacencyRequirements: [],
      daylightRequirement: DaylightLevel.Medium,
      privacyRequirement: PrivacyLevel.Medium,
      ventilationRequired: true,
      isFixed: false,
    };

    const modified = {
      ...building,
      floors: [{ ...building.floors[0]!, rooms: [smallBedroom] }],
    };
    const ctx = buildEvaluationContext(modified, resolveConfig({}, modified));
    const results = MinimumRoomSize.evaluate(ctx);
    const violations = results.filter(r => !r.passed);

    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]?.constraintId).toBe('HC-023');
    expect(violations[0]?.message).toMatch(/too small/i);
    expect(violations[0]?.suggestedFixes).toBeDefined();
  });

  it('fails when room shortest side is narrower than minimum dimension', () => {
    const building = loadFixture('minimal-1room');
    const elongatedLiving = {
      id: 'narrow-living',
      floorId: 'floor-gf-001',
      type: RoomType.Living,
      name: 'Narrow Living Room',
      boundary: {
        points: [
          { x: 1000, y: 1000 },
          { x: 2500, y: 1000 },
          { x: 2500, y: 10000 },
          { x: 1000, y: 10000 },
        ],
      },
      x: 1000,
      y: 1000,
      width: 1500, // 1.5m < 3.0m minimum for living room
      height: 9000,
      rotation: 0,
      area: 13500000, // Area is 13.5 sq m > 12 sq m, but side is too narrow
      priority: 8,
      tags: [],
      adjacencyRequirements: [],
      daylightRequirement: DaylightLevel.High,
      privacyRequirement: PrivacyLevel.None,
      ventilationRequired: true,
      isFixed: false,
    };

    const modified = {
      ...building,
      floors: [{ ...building.floors[0]!, rooms: [elongatedLiving] }],
    };
    const ctx = buildEvaluationContext(modified, resolveConfig({}, modified));
    const results = MinimumRoomSize.evaluate(ctx);
    const violations = results.filter(r => !r.passed);

    expect(violations.length).toBeGreaterThan(0);
    expect(violations.some(v => v.message.includes('too narrow'))).toBe(true);
  });
});
