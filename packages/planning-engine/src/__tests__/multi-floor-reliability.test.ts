import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  CandidateGenerator,
  FloorProgramAllocationError,
  FloorProgramPlanner,
  RoomProgramGenerator,
} from '../index';
import {
  Direction,
  PlotShape,
  PreferenceLevel,
  RoomType,
  resetIdGenerator,
  setIdSeed,
} from '@ai-floor-planner/core';
import type { Building, DesignRequirementSpecification } from '@ai-floor-planner/core';

interface FixtureInput {
  readonly id: string;
  readonly projectName: string;
  readonly plotWidthMm: number;
  readonly plotDepthMm: number;
  readonly floorsCount: number;
  readonly bedroomCount: number;
  readonly bathroomCount: number;
  readonly parkingSpacesCount: number;
  readonly liftRequired: boolean;
  readonly studyRoom: boolean;
  readonly poojaRoom: boolean;
  readonly balconyPreferred: boolean;
}

const fixturePath = path.resolve(__dirname, '../../../../tests/fixtures/multifloor/requirements.json');
const fixtures = JSON.parse(fs.readFileSync(fixturePath, 'utf-8')) as FixtureInput[];

function specification(input: FixtureInput): DesignRequirementSpecification {
  return {
    schemaVersion: 1,
    projectId: input.id,
    projectName: input.projectName,
    plotShape: PlotShape.Rectangular,
    orientationDegrees: 0,
    hard: {
      plotWidthMm: input.plotWidthMm,
      plotDepthMm: input.plotDepthMm,
      roadFacing: Direction.North,
      floorsCount: input.floorsCount,
      bedroomCount: input.bedroomCount,
      bathroomCount: input.bathroomCount,
      kitchenRequired: true,
      livingRoomRequired: true,
      diningRoomRequired: true,
      staircaseRequired: true,
      parkingRequired: input.parkingSpacesCount > 0,
      parkingSpacesCount: input.parkingSpacesCount,
      liftRequired: input.liftRequired,
    },
    soft: {
      vastuCompliance: false,
      naturalLightPreference: PreferenceLevel.High,
      privacyPreference: PreferenceLevel.High,
      circulationEfficiency: PreferenceLevel.High,
      gardenPreference: false,
      servantQuarter: false,
      poojaRoom: input.poojaRoom,
      studyRoom: input.studyRoom,
      balconyPreferred: input.balconyPreferred,
      openKitchen: false,
      attachedBathroomsCount: Math.min(input.bedroomCount, input.bathroomCount - 1),
    },
  };
}

function assertOwnership(building: Building): void {
  expect(new Set(building.floors.map(floor => floor.id)).size).toBe(building.floors.length);
  expect(new Set(building.floors.map(floor => floor.level)).size).toBe(building.floors.length);
  for (const floor of building.floors) {
    const roomIds = new Set(floor.rooms.map(room => room.id));
    const wallIds = new Set(floor.walls.map(wall => wall.id));
    expect(floor.buildingId).toBe(building.id);
    for (const entity of [...floor.rooms, ...floor.walls, ...floor.doors, ...floor.windows, ...floor.stairs, ...floor.columns]) {
      expect(entity.floorId).toBe(floor.id);
    }
    for (const wall of floor.walls) expect(wall.roomIds.every(id => roomIds.has(id))).toBe(true);
    for (const door of floor.doors) {
      expect(wallIds.has(door.wallId)).toBe(true);
      expect(door.connectsRooms.every(id => id === '__outside__' || id === 'exterior' || id === '' || roomIds.has(id))).toBe(true);
    }
    for (const window of floor.windows) {
      expect(wallIds.has(window.wallId)).toBe(true);
      expect(roomIds.has(window.roomId)).toBe(true);
    }
  }
}

function normalizedGeometry(building: Building): unknown {
  return building.floors.map(floor => ({
    level: floor.level,
    boundary: floor.boundary,
    rooms: floor.rooms.map(room => ({
      name: room.name, type: room.type, x: room.x, y: room.y,
      width: room.width, height: room.height, area: room.area,
    })),
    stairs: floor.stairs.map(stair => ({
      x: stair.x, y: stair.y, width: stair.width, length: stair.length,
      connectsFloors: stair.connectsFloors, verticalCoreId: stair.verticalCoreId,
    })),
  }));
}

describe('multi-floor production fixtures', () => {
  it.each(fixtures)('$projectName is complete, isolated, continuous, and space-aware', input => {
    const spec = specification(input);
    const program = new RoomProgramGenerator().generateProgram(spec);
    const candidates = new CandidateGenerator().generateCandidates(spec, program, 2026);
    expect(candidates).toHaveLength(3);

    for (const candidate of candidates) {
      const { building, multiFloorPlanning } = candidate;
      expect(building.floors).toHaveLength(input.floorsCount);
      expect(candidate.validation.isValid).toBe(true);
      assertOwnership(building);
      expect(building.floors.every(floor => floor.rooms.some(room => ![RoomType.Staircase, RoomType.Lift].includes(room.type)))).toBe(true);
      expect(building.floors.every(floor => floor.boundary.points.length >= 3)).toBe(true);
      expect(multiFloorPlanning.verticalCoreAligned).toBe(true);
      expect(multiFloorPlanning.adjacentFloorPairsCovered).toBe(multiFloorPlanning.requiredAdjacentFloorPairs);
      expect(multiFloorPlanning.verticalContinuityScore).toBe(100);
      expect(multiFloorPlanning.maximumUnusedSpaceRatio).toBeLessThan(0.2);
      expect(candidate.metrics.floorUtilizationScore).toBeGreaterThan(0);
      expect(candidate.metrics.roomDistributionScore).toBeGreaterThan(0);
    }
  });

  it('returns an explicit INFEASIBLE_PROGRAM error for an overloaded floor budget', () => {
    const spec = specification(fixtures[0]!);
    const program = new RoomProgramGenerator().generateProgram(spec);
    expect(() => new FloorProgramPlanner().allocateDetailed(program, 2, {
      availableAreaMm2: 10_000_000,
    })).toThrowError(FloorProgramAllocationError);
    try {
      new FloorProgramPlanner().allocateDetailed(program, 2, { availableAreaMm2: 10_000_000 });
    } catch (error) {
      expect(error).toBeInstanceOf(FloorProgramAllocationError);
      expect((error as FloorProgramAllocationError).code).toBe('INFEASIBLE_PROGRAM');
      expect((error as Error).message).toMatch(/requires approximately .* but only .* is available/i);
    }
  });

  it('produces deterministic geometry for the same requirements and seed', () => {
    const spec = specification(fixtures[3]!);
    const program = new RoomProgramGenerator().generateProgram(spec);
    setIdSeed(9001);
    const first = new CandidateGenerator().generateCandidates(spec, program, 77)[0]!.building;
    resetIdGenerator();
    setIdSeed(9001);
    const second = new CandidateGenerator().generateCandidates(spec, program, 77)[0]!.building;
    expect(normalizedGeometry(second)).toEqual(normalizedGeometry(first));
    resetIdGenerator();
  });

  it('generates alternatives with measured floor-program differences, not random coordinate noise', () => {
    const spec = specification(fixtures[3]!);
    const program = new RoomProgramGenerator().generateProgram(spec);
    const candidates = new CandidateGenerator().generateCandidates(spec, program, 91);
    const distributions = candidates.map(candidate => candidate.building.floors.map(floor =>
      floor.rooms.filter(room => room.type === RoomType.Bedroom).map(room => room.name).sort().join(','),
    ).join('|'));
    expect(new Set(distributions).size).toBeGreaterThanOrEqual(2);
  });
});
