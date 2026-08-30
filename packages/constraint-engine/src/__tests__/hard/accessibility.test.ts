import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { RoomAccessibility, CorridorWidth } from '../../constraints/hard/accessibility';
import { buildEvaluationContext } from '../../context';
import { resolveConfig } from '../../config';
import type { Building } from '@ai-floor-planner/core';
import { RoomType, DaylightLevel, PrivacyLevel, DoorType, SwingDirection, WallType } from '@ai-floor-planner/core';

const FIXTURES_DIR = path.resolve(__dirname, '../../../../../tests/fixtures');

function loadFixture(name: string): Building {
  const json = fs.readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf-8');
  return JSON.parse(json) as Building;
}

describe('Hard Constraints: Accessibility', () => {
  describe('HC-010: RoomAccessibility', () => {
    it('passes when no doors exist on floor (trivially valid layout draft)', () => {
      const building = loadFixture('minimal-1room');
      const ctx = buildEvaluationContext(building, resolveConfig({}, building), [], [], true);
      const results = RoomAccessibility.evaluate(ctx);
      expect(results.every(r => r.passed)).toBe(true);
    });

    it('fails a developed floor that has rooms and walls but no entrance doors', () => {
      const building = loadFixture('minimal-1room');
      const room = building.floors[0]!.rooms[0]!;
      const modified = {
        ...building,
        floors: [{
          ...building.floors[0]!,
          walls: [{
            id: 'wall-no-entry',
            floorId: building.floors[0]!.id,
            startPoint: { x: room.x, y: room.y },
            endPoint: { x: room.x + room.width, y: room.y },
            thickness: 230,
            type: WallType.External,
            roomIds: [room.id],
            hasOpening: false,
            loadBearing: true,
          }],
        }],
      };
      const ctx = buildEvaluationContext(modified, resolveConfig({}, modified));
      const results = RoomAccessibility.evaluate(ctx);

      expect(results.some(result => !result.passed && result.affectedEntities.includes(room.id))).toBe(true);
    });

    it('allows a room-only 30x50-2bhk schematic in explicit draft mode', () => {
      const building = loadFixture('30x50-2bhk');
      const ctx = buildEvaluationContext(building, resolveConfig({}, building), [], [], true);
      const results = RoomAccessibility.evaluate(ctx);
      expect(results.every(r => r.passed)).toBe(true);
    });

    it('fails when an isolated room cannot be reached via doors', () => {
      const building = loadFixture('30x50-2bhk');
      // Add an unreachable room with no doors connected
      const isolatedRoom = {
        id: 'isolated-room-99',
        floorId: 'floor-gf-001',
        type: RoomType.Bedroom,
        name: 'Isolated Bedroom',
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
        area: 4000000,
        priority: 5,
        tags: [],
        adjacencyRequirements: [],
        daylightRequirement: DaylightLevel.Medium,
        privacyRequirement: PrivacyLevel.Medium,
        ventilationRequired: true,
        isFixed: false,
      };

      const modified = {
        ...building,
        floors: [
          {
            ...building.floors[0]!,
            rooms: [...building.floors[0]!.rooms, isolatedRoom],
            doors: [
              {
                id: 'door-1',
                floorId: 'floor-gf-001',
                wallId: 'wall-1',
                position: { x: 1000, y: 1000 },
                width: 900,
                height: 2100,
                swingDirection: SwingDirection.Inward,
                connectsRooms: ['', building.floors[0]!.rooms[0]!.id] as [string, string],
                type: DoorType.Single,
              },
            ],
          },
        ],
      };
      const ctx = buildEvaluationContext(modified, resolveConfig({}, modified));
      const results = RoomAccessibility.evaluate(ctx);
      const violations = results.filter(r => !r.passed);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some(v => v.affectedEntities.includes('isolated-room-99'))).toBe(true);
    });
  });

  describe('HC-013: CorridorWidth', () => {
    it('passes when all corridors meet minimum width (900mm)', () => {
      const building = loadFixture('30x50-2bhk');
      const ctx = buildEvaluationContext(building, resolveConfig({}, building));
      const results = CorridorWidth.evaluate(ctx);
      expect(results.every(r => r.passed)).toBe(true);
    });

    it('fails when a corridor is narrower than configured minimum', () => {
      const building = loadFixture('minimal-1room');
      const narrowCorridor = {
        id: 'narrow-corr',
        floorId: 'floor-gf-001',
        type: RoomType.Corridor,
        name: 'Narrow Corridor',
        boundary: {
          points: [
            { x: 1000, y: 1000 },
            { x: 1600, y: 1000 },
            { x: 1600, y: 5000 },
            { x: 1000, y: 5000 },
          ],
        },
        x: 1000,
        y: 1000,
        width: 600, // < 900mm min
        height: 4000,
        rotation: 0,
        area: 2400000,
        priority: 3,
        tags: [],
        adjacencyRequirements: [],
        daylightRequirement: DaylightLevel.None,
        privacyRequirement: PrivacyLevel.None,
        ventilationRequired: false,
        isFixed: false,
      };
      const modified = {
        ...building,
        floors: [{ ...building.floors[0]!, rooms: [narrowCorridor] }],
      };
      const ctx = buildEvaluationContext(modified, resolveConfig({ minimumCorridorWidth: 900 }, modified));
      const results = CorridorWidth.evaluate(ctx);
      const violations = results.filter(r => !r.passed);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0]?.constraintId).toBe('HC-013');
      expect(violations[0]?.message).toMatch(/too narrow/i);
    });
  });
});
