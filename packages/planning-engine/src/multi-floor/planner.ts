/** Deterministic floor allocation, capacity budgeting, and cross-floor evidence. */
import type {
  Building,
  FloorAllocationEvidence,
  MultiFloorPlanningSummary,
  Room,
  RoomProgram,
  RoomProgramItem,
} from '@ai-floor-planner/core';
import { DaylightLevel, FunctionalZone, PrivacyLevel, RoomType } from '@ai-floor-planner/core';
import { polygonArea } from '@ai-floor-planner/geometry-engine';
import { sourceProgramItemId } from '../graph/scorer';

const CORE_TYPES = new Set([RoomType.Staircase, RoomType.Lift]);
const GROUND_ANCHOR_TYPES = new Set([
  RoomType.Living,
  RoomType.Dining,
  RoomType.Kitchen,
  RoomType.Foyer,
  RoomType.Parking,
  RoomType.Garden,
]);

export interface FloorProgramAllocationOptions {
  readonly availableAreaMm2?: number;
  readonly circulationAllowanceRatio?: number;
  readonly wallAllowanceRatio?: number;
  readonly requireOccupiedFloor?: boolean;
  readonly distributionStrategy?: 'upper_private' | 'ground_guest' | 'top_master';
}

export interface FloorAreaBudget {
  readonly level: number;
  readonly availableAreaMm2: number | null;
  readonly minimumRoomAreaMm2: number;
  readonly targetRoomAreaMm2: number;
  readonly circulationAllowanceMm2: number;
  readonly wallAllowanceMm2: number;
  readonly requiredAreaMm2: number;
  readonly utilizationRatio: number | null;
  readonly feasible: boolean;
}

export interface FloorProgramAllocationResult {
  readonly floors: readonly (readonly RoomProgramItem[])[];
  readonly budgets: readonly FloorAreaBudget[];
}

export class FloorProgramAllocationError extends Error {
  readonly code = 'INFEASIBLE_PROGRAM';

  constructor(
    readonly floorLevel: number,
    readonly requiredAreaMm2: number,
    readonly availableAreaMm2: number,
    message?: string,
    readonly problematicRooms: readonly string[] = [],
    readonly suggestedResolutions: readonly string[] = [
      'Move a flexible room to another floor',
      'Reduce preferred room sizes',
      'Reduce the requested room count or increase the buildable footprint',
    ],
  ) {
    super(message ?? `INFEASIBLE_PROGRAM: Floor ${floorLevel} requires approximately ${(requiredAreaMm2 / 1e6).toFixed(1)} m² but only ${(availableAreaMm2 / 1e6).toFixed(1)} m² is available.`);
    this.name = 'FloorProgramAllocationError';
  }
}

function cloneForFloor(item: RoomProgramItem, floorLevel: number): RoomProgramItem {
  return { ...item, id: `${item.id}_floor_${floorLevel}`, floorLevel };
}

function lowestLoadFloor(loads: readonly number[], candidates: readonly number[]): number {
  return candidates.reduce((best, level) => loads[level]! < loads[best]! ? level : best, candidates[0]!);
}

function buildBudget(
  level: number,
  items: readonly RoomProgramItem[],
  options: FloorProgramAllocationOptions,
): FloorAreaBudget {
  const minimumRoomAreaMm2 = items.reduce((sum, item) => sum + item.minAreaMm2, 0);
  const targetRoomAreaMm2 = items.reduce((sum, item) => sum + item.targetAreaMm2, 0);
  const hasExplicitCirculation = items.some(item => item.type === RoomType.Corridor);
  const circulationAllowanceMm2 = hasExplicitCirculation ? 0 : Math.round(
    minimumRoomAreaMm2 * (options.circulationAllowanceRatio ?? 0.12),
  );
  const wallAllowanceMm2 = Math.round(
    minimumRoomAreaMm2 * (options.wallAllowanceRatio ?? 0.06),
  );
  const requiredAreaMm2 = minimumRoomAreaMm2 + circulationAllowanceMm2 + wallAllowanceMm2;
  const availableAreaMm2 = options.availableAreaMm2 ?? null;
  return {
    level,
    availableAreaMm2,
    minimumRoomAreaMm2,
    targetRoomAreaMm2,
    circulationAllowanceMm2,
    wallAllowanceMm2,
    requiredAreaMm2,
    utilizationRatio: availableAreaMm2 ? requiredAreaMm2 / availableAreaMm2 : null,
    feasible: availableAreaMm2 === null || requiredAreaMm2 <= availableAreaMm2,
  };
}

export class FloorProgramPlanner {
  allocate(
    program: RoomProgram,
    requestedFloorCount: number,
    options: FloorProgramAllocationOptions = {},
  ): RoomProgramItem[][] {
    return this.allocateDetailed(program, requestedFloorCount, options).floors.map(floor => [...floor]);
  }

  allocateDetailed(
    program: RoomProgram,
    requestedFloorCount: number,
    options: FloorProgramAllocationOptions = {},
  ): FloorProgramAllocationResult {
    const floorCount = Math.max(1, Math.floor(requestedFloorCount));
    const floors = Array.from({ length: floorCount }, () => [] as RoomProgramItem[]);
    const loads = Array.from({ length: floorCount }, () => 0);
    const assigned = new Set<string>();
    const add = (item: RoomProgramItem, level: number, repeatedCore = false) => {
      floors[level]!.push(cloneForFloor(item, level));
      loads[level]! += item.targetAreaMm2;
      if (!repeatedCore) assigned.add(item.id);
    };

    // One aligned representation of every vertical core is reserved on every floor.
    for (const item of program.items.filter(item => CORE_TYPES.has(item.type))) {
      for (let level = 0; level < floorCount; level++) add(item, level, true);
      assigned.add(item.id);
    }

    // Arrival, primary public functions, and site-facing uses prefer the ground floor.
    for (const item of program.items.filter(item => GROUND_ANCHOR_TYPES.has(item.type))) add(item, 0);

    const upperLevels = Array.from({ length: Math.max(0, floorCount - 1) }, (_, index) => index + 1);
    const privateLevels = upperLevels.length > 0 ? upperLevels : [0];
    const bedrooms = program.items.filter(item => item.type === RoomType.Bedroom);
    const bathrooms = program.items.filter(item => item.type === RoomType.Bathroom);
    const attachedBathrooms = bathrooms.filter(item => item.attachedToRoomId || /^Attached Bath/i.test(item.name));

    // Spread bedroom suites across upper floors deterministically.
    bedrooms.forEach((bedroom, index) => {
      const explicit = bedroom.floorLevel > 0
        ? Math.min(floorCount - 1, bedroom.floorLevel)
        : undefined;
      const bathroom = attachedBathrooms.find(item => item.attachedToRoomId === bedroom.id)
        ?? attachedBathrooms[index];
      let preferredLevel = index < privateLevels.length
        ? privateLevels[index]!
        : lowestLoadFloor(loads, privateLevels);
      if (options.distributionStrategy === 'top_master' && index === 0 && floorCount > 1) {
        preferredLevel = floorCount - 1;
      }
      if (options.distributionStrategy === 'ground_guest' && index === bedrooms.length - 1 && floorCount > 1) {
        const extraMinimumArea = bedroom.minAreaMm2 + (bathroom?.minAreaMm2 ?? 0);
        const projectedMinimumArea = floors[0]!.reduce((sum, item) => sum + item.minAreaMm2, 0) + extraMinimumArea;
        const projectedRequiredArea = projectedMinimumArea * (1
          + (options.circulationAllowanceRatio ?? 0.12)
          + (options.wallAllowanceRatio ?? 0.06));
        if (options.availableAreaMm2 === undefined || projectedRequiredArea <= options.availableAreaMm2) {
          preferredLevel = 0;
        }
      }
      const level = explicit ?? preferredLevel;
      add(bedroom, level);
      if (bathroom && !assigned.has(bathroom.id)) add(bathroom, level);
    });

    // Keep one common bathroom with ground-floor public functions when available.
    const commonBathrooms = bathrooms.filter(item => !assigned.has(item.id));
    if (commonBathrooms[0] && floorCount > 1) add(commonBathrooms[0], 0);
    for (const bathroom of commonBathrooms.filter(item => !assigned.has(item.id))) {
      const level = floors.reduce((best, floor, index) => {
        const demand = floor.filter(item => item.type === RoomType.Bedroom).length
          - floor.filter(item => item.type === RoomType.Bathroom).length;
        const bestDemand = floors[best]!.filter(item => item.type === RoomType.Bedroom).length
          - floors[best]!.filter(item => item.type === RoomType.Bathroom).length;
        return demand > bestDemand || (demand === bestDemand && loads[index]! < loads[best]!) ? index : best;
      }, 0);
      add(bathroom, level);
    }

    for (const item of program.items.filter(item => item.type === RoomType.Balcony && !assigned.has(item.id))) {
      add(item, floorCount - 1);
    }

    // Remaining spaces respect explicit levels, then functional zoning, then measured load.
    for (const item of program.items) {
      if (assigned.has(item.id)) continue;
      let candidates = Array.from({ length: floorCount }, (_, level) => level);
      if (item.floorLevel > 0) {
        candidates = [Math.min(floorCount - 1, item.floorLevel)];
      } else if (floorCount > 1 && (item.zone === FunctionalZone.Private || item.type === RoomType.Study)) {
        candidates = privateLevels;
      } else if (item.zone === FunctionalZone.Public || item.zone === FunctionalZone.Service) {
        candidates = [0];
      }
      add(item, lowestLoadFloor(loads, candidates));
    }

    if ((options.requireOccupiedFloor ?? true) && floorCount > 1) {
      const emptyLevel = floors.findIndex(floor => floor.every(item => CORE_TYPES.has(item.type)));
      if (emptyLevel >= 0) {
        throw new FloorProgramAllocationError(
          emptyLevel,
          0,
          options.availableAreaMm2 ?? 0,
          `INFEASIBLE_PROGRAM: Floor ${emptyLevel} has no occupiable room allocation. Reduce the floor count or add a required space for that level.`,
        );
      }
    }

    // Circulation is explicit geometry, not unexplained leftover space. Its
    // area scales with each floor's allocated program and remains deterministic.
    for (let level = 0; level < floorCount; level++) {
      const programmedMinimumArea = floors[level]!.reduce((sum, item) => sum + item.minAreaMm2, 0);
      const targetAreaMm2 = Math.max(3_600_000, Math.round(programmedMinimumArea * 0.12));
      floors[level]!.push({
        id: `circulation_floor_${level}`,
        type: RoomType.Corridor,
        name: level === 0 ? 'Ground Floor Circulation' : `Floor ${level} Circulation`,
        zone: FunctionalZone.Circulation,
        floorLevel: level,
        targetAreaMm2,
        minAreaMm2: Math.max(2_700_000, Math.round(programmedMinimumArea * 0.08)),
        maxAreaMm2: Math.max(5_400_000, Math.round(programmedMinimumArea * 0.18)),
        minWidthMm: 1000,
        minHeightMm: 1000,
        daylight: DaylightLevel.None,
        privacy: PrivacyLevel.Low,
        ventilationRequired: false,
        isFixed: false,
      });
    }

    const budgets = floors.map((floor, level) => buildBudget(level, floor, options));
    const overloaded = budgets.find(budget => !budget.feasible);
    if (overloaded && overloaded.availableAreaMm2 !== null) {
      const problematicRooms = [...floors[overloaded.level]!]
        .sort((a, b) => b.minAreaMm2 - a.minAreaMm2)
        .slice(0, 4)
        .map(item => item.name);
      throw new FloorProgramAllocationError(
        overloaded.level,
        overloaded.requiredAreaMm2,
        overloaded.availableAreaMm2,
        undefined,
        problematicRooms,
      );
    }

    return { floors, budgets };
  }
}

function roomProgramId(room: Room): string | undefined {
  const tag = room.tags.find(value => value.startsWith('program:'));
  return tag ? sourceProgramItemId(tag.slice('program:'.length)) : undefined;
}

function footprintOverlapRatio(a: Room, b: Room): number {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return (width * height) / Math.max(1, Math.min(a.area, b.area));
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function evaluateMultiFloorPlanning(building: Building): MultiFloorPlanningSummary {
  const orderedFloors = [...building.floors].sort((a, b) => a.level - b.level);
  const allocations: FloorAllocationEvidence[] = orderedFloors.map(floor => {
    const availableAreaMm2 = polygonArea(floor.boundary);
    const assignedRoomAreaMm2 = floor.rooms.reduce((sum, room) => sum + room.area, 0);
    const intentionalOpenSpaceAreaMm2 = 0;
    const unusedSpaceAreaMm2 = Math.max(0, availableAreaMm2 - assignedRoomAreaMm2);
    return {
      level: floor.level,
      roomCount: floor.rooms.length,
      bedroomCount: floor.rooms.filter(room => room.type === RoomType.Bedroom).length,
      bathroomCount: floor.rooms.filter(room => room.type === RoomType.Bathroom).length,
      programItemIds: floor.rooms.map(roomProgramId).filter((id): id is string => id !== undefined).sort(),
      availableAreaMm2,
      assignedRoomAreaMm2,
      intentionalOpenSpaceAreaMm2,
      unusedSpaceAreaMm2,
      utilizationRatio: availableAreaMm2 > 0 ? assignedRoomAreaMm2 / availableAreaMm2 : 0,
      unusedSpaceRatio: availableAreaMm2 > 0 ? unusedSpaceAreaMm2 / availableAreaMm2 : 1,
      nonCoreRoomCount: floor.rooms.filter(room => !CORE_TYPES.has(room.type)).length,
    };
  });

  const coreTypes = [RoomType.Staircase, RoomType.Lift];
  const verticalCoreAligned = coreTypes.every(type => {
    const cores = orderedFloors.flatMap(floor => floor.rooms.filter(room => room.type === type));
    if (cores.length === 0) return true;
    if (cores.length !== orderedFloors.length) return false;
    const anchor = cores[0]!;
    return cores.every(room => room.x === anchor.x && room.y === anchor.y
      && room.width === anchor.width && room.height === anchor.height);
  });

  const bedrooms = orderedFloors.flatMap(floor => floor.rooms.filter(room => room.type === RoomType.Bedroom));
  const bedroomsPaired = bedrooms.filter(bedroom => {
    const floor = orderedFloors.find(candidate => candidate.id === bedroom.floorId)!;
    return floor.rooms.some(room => room.type === RoomType.Bathroom);
  }).length;

  const wetTypes = new Set([RoomType.Bathroom, RoomType.Kitchen, RoomType.Utility]);
  const stackScores: number[] = [];
  for (let index = 0; index < orderedFloors.length - 1; index++) {
    const lowerWet = orderedFloors[index]!.rooms.filter(room => wetTypes.has(room.type));
    const upperWet = orderedFloors[index + 1]!.rooms.filter(room => wetTypes.has(room.type));
    if (lowerWet.length === 0 || upperWet.length === 0) continue;
    const best = lowerWet.reduce((score, lower) => Math.max(score,
      ...upperWet.map(upper => footprintOverlapRatio(lower, upper))), 0);
    stackScores.push(best);
  }

  const requiredAdjacentFloorPairs = Math.max(0, orderedFloors.length - 1);
  const coveredPairs = new Set<string>();
  for (const stair of orderedFloors.flatMap(floor => floor.stairs)) {
    const levels = [...stair.connectsFloors].sort((a, b) => a - b);
    if (levels.length < 2) continue;
    const from = levels[0]!;
    const to = levels[levels.length - 1]!;
    if (to - from === 1) coveredPairs.add(`${from}:${to}`);
  }
  const adjacentFloorPairsCovered = Array.from({ length: requiredAdjacentFloorPairs }, (_, level) => `${level}:${level + 1}`)
    .filter(pair => coveredPairs.has(pair)).length;

  const averageFloorUtilization = allocations.length > 0
    ? allocations.reduce((sum, allocation) => sum + allocation.utilizationRatio, 0) / allocations.length
    : 0;
  const maximumUnusedSpaceRatio = allocations.reduce(
    (maximum, allocation) => Math.max(maximum, allocation.unusedSpaceRatio),
    0,
  );
  const floorUtilizationScore = clampScore(100 - Math.abs(0.78 - averageFloorUtilization) * 170);
  const unusedSpaceScore = clampScore(100 - Math.max(0, maximumUnusedSpaceRatio - 0.15) * 220);
  const nonCoreCounts = allocations.map(allocation => allocation.nonCoreRoomCount);
  const roomDistributionScore = nonCoreCounts.length === 0 || nonCoreCounts.some(count => count === 0)
    ? 0
    : clampScore((Math.min(...nonCoreCounts) / Math.max(...nonCoreCounts)) * 100);
  const coverageScore = requiredAdjacentFloorPairs === 0
    ? 100
    : (adjacentFloorPairsCovered / requiredAdjacentFloorPairs) * 100;
  const hasStairOnEveryFloor = orderedFloors.length <= 1
    || orderedFloors.every(floor => floor.rooms.some(room => room.type === RoomType.Staircase)
      && floor.stairs.length > 0);
  const verticalContinuityScore = clampScore(
    coverageScore * 0.5 + (verticalCoreAligned ? 35 : 0) + (hasStairOnEveryFloor ? 15 : 0),
  );
  const buildingLevelScore = clampScore(
    floorUtilizationScore * 0.3
      + unusedSpaceScore * 0.25
      + roomDistributionScore * 0.2
      + verticalContinuityScore * 0.25,
  );

  return {
    floorCount: orderedFloors.length,
    allocations,
    verticalCoreAligned,
    bedroomBathroomPairingScore: bedrooms.length > 0 ? Math.round((bedroomsPaired / bedrooms.length) * 100) : 100,
    wetAreaStackScore: stackScores.length > 0
      ? Math.round((stackScores.reduce((sum, score) => sum + score, 0) / stackScores.length) * 100)
      : null,
    wetAreaStackPairs: stackScores.length,
    adjacentFloorPairsCovered,
    requiredAdjacentFloorPairs,
    averageFloorUtilization,
    maximumUnusedSpaceRatio,
    floorUtilizationScore,
    unusedSpaceScore,
    roomDistributionScore,
    verticalContinuityScore,
    buildingLevelScore,
  };
}
