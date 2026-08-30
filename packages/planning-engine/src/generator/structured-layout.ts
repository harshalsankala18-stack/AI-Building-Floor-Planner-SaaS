import type {
  Building,
  DesignRequirementSpecification,
  InstanceDesignGraph,
  Room,
  RoomProgram,
  RoomProgramItem,
  Wall,
} from '@ai-floor-planner/core';
import { relationshipUtility } from '../graph/scorer';
import { FloorProgramPlanner } from '../multi-floor/planner';
import {
  Direction,
  DoorType,
  RoomType,
  WallType,
  WindowType,
  addDoor,
  addRoom,
  addStair,
  addWall,
  addWindow,
  createBuilding,
} from '@ai-floor-planner/core';

export type LayoutStrategy = 'compact_zoning' | 'open_circulation' | 'vastu_aligned';

export interface LayoutStrategyProfile {
  readonly strategy: LayoutStrategy;
  readonly name: string;
  readonly description: string;
  readonly columnRatio: number;
  readonly priority: Readonly<Partial<Record<RoomType, number>>>;
}

export const LAYOUT_STRATEGIES: readonly LayoutStrategyProfile[] = [
  {
    strategy: 'compact_zoning',
    name: 'Compact Space-Efficient',
    description: 'Balanced two-zone layout with short, fully connected circulation paths.',
    columnRatio: 0.5,
    priority: {
      [RoomType.Living]: 1,
      [RoomType.Dining]: 2,
      [RoomType.Kitchen]: 3,
      [RoomType.Bedroom]: 4,
      [RoomType.Bathroom]: 5,
    },
  },
  {
    strategy: 'open_circulation',
    name: 'Open Cross-Ventilated',
    description: 'Public rooms lead the circulation chain while private spaces retain external light.',
    columnRatio: 0.52,
    priority: {
      [RoomType.Living]: 1,
      [RoomType.Dining]: 2,
      [RoomType.Bedroom]: 3,
      [RoomType.Kitchen]: 4,
      [RoomType.Bathroom]: 5,
    },
  },
  {
    strategy: 'vastu_aligned',
    name: 'Vastu-Oriented',
    description: 'Directional ordering favors public space, kitchen, and private-room separation.',
    columnRatio: 0.48,
    priority: {
      [RoomType.Living]: 1,
      [RoomType.Pooja]: 2,
      [RoomType.Dining]: 3,
      [RoomType.Kitchen]: 4,
      [RoomType.Bedroom]: 5,
      [RoomType.Bathroom]: 6,
    },
  },
];

interface ColumnPlacement {
  readonly item: RoomProgramItem;
  readonly minimumHeight: number;
}

interface PlacedRoom {
  readonly item: RoomProgramItem;
  readonly room: Room;
}

interface FloorLayoutResult {
  readonly building: Building;
  readonly placedRooms: readonly PlacedRoom[];
}

interface FloorFootprintPlan {
  readonly leftDepth: number;
  readonly rightDepth: number;
  readonly leftColumn: readonly ColumnPlacement[];
  readonly rightColumn: readonly ColumnPlacement[];
  readonly leftHeights: readonly number[];
  readonly rightHeights: readonly number[];
}

const DOOR_WIDTH_MM = 900;
const WINDOW_WIDTH_MM = 1000;
const OPENING_EDGE_CLEARANCE_MM = 200;

function roundUp(value: number, step = 10): number {
  return Math.ceil(value / step) * step;
}

function requiredCounts(program: RoomProgram): Partial<Record<RoomType, number>> {
  const counts: Partial<Record<RoomType, number>> = {};
  for (const item of program.items) {
    counts[item.type] = (counts[item.type] ?? 0) + 1;
  }
  return counts;
}

export function roomProgramCounts(program: RoomProgram): Partial<Record<RoomType, number>> {
  return requiredCounts(program);
}

function resolvedSetbacks(spec: DesignRequirementSpecification) {
  return spec.setbacksMm ?? {
    front: Math.min(2000, Math.max(1000, Math.round(spec.hard.plotDepthMm * 0.1))),
    rear: Math.min(1500, Math.max(1000, Math.round(spec.hard.plotDepthMm * 0.08))),
    left: Math.min(1200, Math.max(900, Math.round(spec.hard.plotWidthMm * 0.08))),
    right: Math.min(1200, Math.max(900, Math.round(spec.hard.plotWidthMm * 0.08))),
  };
}

function minimumHeight(item: RoomProgramItem, width: number): number {
  return roundUp(Math.max(item.minHeightMm, item.minAreaMm2 / width), 10);
}

function desiredHeight(item: RoomProgramItem, width: number): number {
  const minimum = minimumHeight(item, width);
  if (item.isFixed) return minimum;
  const target = roundUp(Math.max(item.minHeightMm, item.targetAreaMm2 / width), 10);
  const maximum = Math.max(minimum, Math.floor(item.maxAreaMm2 / width));
  return Math.max(minimum, Math.min(target, maximum));
}

function orderItems(items: readonly RoomProgramItem[], profile: LayoutStrategyProfile): RoomProgramItem[] {
  return [...items].sort((a, b) => {
    const priorityA = a.type === RoomType.Staircase ? -100 : a.type === RoomType.Lift ? -90 : profile.priority[a.type] ?? 50;
    const priorityB = b.type === RoomType.Staircase ? -100 : b.type === RoomType.Lift ? -90 : profile.priority[b.type] ?? 50;
    return priorityA - priorityB || b.minAreaMm2 - a.minAreaMm2 || a.id.localeCompare(b.id);
  });
}

function packColumns(
  items: readonly RoomProgramItem[],
  leftWidth: number,
  rightWidth: number,
  depth: number,
  profile: LayoutStrategyProfile,
  graph: InstanceDesignGraph,
): [ColumnPlacement[], ColumnPlacement[]] {
  const columns: [ColumnPlacement[], ColumnPlacement[]] = [[], []];
  const minimumLoads: [number, number] = [0, 0];
  const targetLoads: [number, number] = [0, 0];

  for (const item of orderItems(items, profile)) {
    let candidates = [
      { index: 0 as const, width: leftWidth },
      { index: 1 as const, width: rightWidth },
    ].filter(candidate => candidate.width >= item.minWidthMm);
    if (item.isFixed && candidates.some(candidate => candidate.index === 0)) {
      candidates = candidates.filter(candidate => candidate.index === 0);
    }

    if (candidates.length === 0) {
      throw new Error(`"${item.name}" needs at least ${item.minWidthMm} mm width, but neither layout column can provide it.`);
    }

    candidates.sort((a, b) => {
      const cost = (candidate: { index: 0 | 1; width: number }) => {
        const column = columns[candidate.index];
        const affinity = column.reduce((best, placement) =>
          Math.max(best, relationshipUtility(graph, item, placement.item)),
        -1);
        const zoneMatches = column.filter(placement => placement.item.zone === item.zone).length;
        const projectedLoad = targetLoads[candidate.index] + desiredHeight(item, candidate.width);
        // Keep assignment independent of the provisional floor depth so the
        // sizing pass and final placement pass cannot choose different columns.
        return projectedLoad / 1500 - affinity * 4 - zoneMatches * 0.35;
      };
      return cost(a) - cost(b) || b.width - a.width;
    });

    const fitting = candidates.find(candidate =>
      minimumLoads[candidate.index] + minimumHeight(item, candidate.width) <= depth,
    );
    const target = fitting ?? candidates[0]!;
    const height = minimumHeight(item, target.width);
    columns[target.index].push({ item, minimumHeight: height });
    minimumLoads[target.index] += height;
    targetLoads[target.index] += desiredHeight(item, target.width);
  }

  if (minimumLoads[0] > depth || minimumLoads[1] > depth) {
    throw new Error('The room program cannot fit the buildable depth while preserving minimum room dimensions.');
  }

  const arrange = (column: ColumnPlacement[]): ColumnPlacement[] => {
    if (column.length < 2) return column;
    const fixed = orderItems(column.filter(placement => placement.item.isFixed).map(placement => placement.item), profile);
    const remaining = column.filter(placement => !placement.item.isFixed);
    const ordered: ColumnPlacement[] = fixed.map(item => column.find(placement => placement.item.id === item.id)!);
    if (ordered.length === 0 && remaining.length > 0) {
      const firstItem = orderItems(remaining.map(placement => placement.item), profile)[0]!;
      const firstIndex = remaining.findIndex(placement => placement.item.id === firstItem.id);
      ordered.push(remaining.splice(firstIndex, 1)[0]!);
    }

    while (remaining.length > 0) {
      const current = ordered.at(-1)!.item;
      remaining.sort((a, b) => {
        const value = (placement: ColumnPlacement) =>
          relationshipUtility(graph, current, placement.item) * 10
          + (current.zone === placement.item.zone ? 1 : 0)
          - (profile.priority[placement.item.type] ?? 50) * 0.001;
        return value(b) - value(a) || a.item.id.localeCompare(b.item.id);
      });
      ordered.push(remaining.shift()!);
    }
    return ordered;
  };

  return [arrange(columns[0]), arrange(columns[1])];
}

function allocatedHeights(column: readonly ColumnPlacement[], width: number, depth: number): number[] {
  if (column.length === 0) return [];
  const minimumTotal = column.reduce((sum, placement) => sum + placement.minimumHeight, 0);
  const desired = column.map(placement => desiredHeight(placement.item, width));
  const desiredTotalHeight = desired.reduce((sum, height) => sum + height, 0);
  if (desiredTotalHeight <= depth) return desired;

  const remaining = Math.max(0, depth - minimumTotal);
  const desiredExtras = desired.map((height, index) =>
    Math.max(0, height - column[index]!.minimumHeight),
  );
  const desiredTotal = desiredExtras.reduce((sum, value) => sum + value, 0);
  return column.map((placement, index) => {
    if (placement.item.isFixed || desiredTotal === 0) return placement.minimumHeight;
    const share = desiredTotal > 0
      ? Math.floor(remaining * (desiredExtras[index]! / desiredTotal))
      : 0;
    return placement.minimumHeight + share;
  });
}

function requiredFloorFootprint(
  items: readonly RoomProgramItem[],
  width: number,
  maximumDepth: number,
  profile: LayoutStrategyProfile,
  graph: InstanceDesignGraph,
): FloorFootprintPlan {
  const leftWidth = Math.round(width * profile.columnRatio);
  const rightWidth = width - leftWidth;
  const [leftColumn, rightColumn] = packColumns(items, leftWidth, rightWidth, maximumDepth, profile, graph);
  const leftHeights = allocatedHeights(leftColumn, leftWidth, maximumDepth);
  const rightHeights = allocatedHeights(rightColumn, rightWidth, maximumDepth);
  const leftDepth = leftHeights.reduce((sum, value) => sum + value, 0);
  const rightDepth = rightHeights.reduce((sum, value) => sum + value, 0);
  return {
    leftDepth: Math.max(3000, Math.min(maximumDepth, leftDepth)),
    rightDepth: Math.max(3000, Math.min(maximumDepth, rightDepth)),
    leftColumn,
    rightColumn,
    leftHeights,
    rightHeights,
  };
}

function footprintBoundary(
  x: number,
  y: number,
  width: number,
  leftWidth: number,
  footprint: FloorFootprintPlan,
) {
  if (footprint.leftDepth === footprint.rightDepth) {
    return { points: [
      { x, y }, { x: x + width, y },
      { x: x + width, y: y + footprint.leftDepth }, { x, y: y + footprint.leftDepth },
    ] };
  }
  return { points: [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + footprint.rightDepth },
    { x: x + leftWidth, y: y + footprint.rightDepth },
    { x: x + leftWidth, y: y + footprint.leftDepth },
    { x, y: y + footprint.leftDepth },
  ] };
}

function openingStart(segmentStart: number, segmentLength: number, openingWidth: number): number {
  const centered = segmentStart + Math.floor((segmentLength - openingWidth) / 2);
  return Math.max(
    segmentStart + OPENING_EDGE_CLEARANCE_MM,
    Math.min(centered, segmentStart + segmentLength - openingWidth - OPENING_EDGE_CLEARANCE_MM),
  );
}

function addPerimeterWalls(
  building: Building,
  floorId: string,
  x: number,
  y: number,
  width: number,
  leftWidth: number,
  leftDepth: number,
  rightDepth: number,
): { building: Building; north: Wall; east: Wall; south: Wall; west: Wall } {
  let next = building;
  const add = (startPoint: { x: number; y: number }, endPoint: { x: number; y: number }) => {
    next = addWall(next, floorId, {
      floorId,
      startPoint,
      endPoint,
      type: WallType.External,
      thickness: 230,
    });
    return next.floors.find(floor => floor.id === floorId)!.walls.at(-1)!;
  };

  const north = add({ x, y }, { x: x + width, y });
  const east = add({ x: x + width, y }, { x: x + width, y: y + rightDepth });
  const rightSouth = add(
    { x: x + leftWidth, y: y + rightDepth },
    { x: x + width, y: y + rightDepth },
  );
  if (leftDepth !== rightDepth) {
    add(
      { x: x + leftWidth, y: y + Math.min(leftDepth, rightDepth) },
      { x: x + leftWidth, y: y + Math.max(leftDepth, rightDepth) },
    );
  }
  const leftSouth = add({ x, y: y + leftDepth }, { x: x + leftWidth, y: y + leftDepth });
  const west = add({ x, y }, { x, y: y + leftDepth });
  const south = leftDepth >= rightDepth ? leftSouth : rightSouth;
  return { building: next, north, east, south, west };
}

function roomTouchingEdge(
  rooms: readonly PlacedRoom[],
  direction: Direction,
  x: number,
  y: number,
  width: number,
  depth: number,
): Room {
  const epsilon = 1;
  const touching = rooms.filter(({ room }) => {
    if (direction === Direction.North) return Math.abs(room.y - y) <= epsilon;
    if (direction === Direction.South) return Math.abs(room.y + room.height - (y + depth)) <= epsilon;
    if (direction === Direction.East) return Math.abs(room.x + room.width - (x + width)) <= epsilon;
    return Math.abs(room.x - x) <= epsilon;
  });
  return (touching.find(({ room }) => room.type === RoomType.Living) ?? touching[0] ?? rooms[0]!).room;
}

function addEntrance(
  building: Building,
  floorId: string,
  room: Room,
  direction: Direction,
  walls: { north: Wall; east: Wall; south: Wall; west: Wall },
): Building {
  const horizontal = direction === Direction.North || direction === Direction.South;
  const wall = direction === Direction.North
    ? walls.north
    : direction === Direction.South
      ? walls.south
      : direction === Direction.East
        ? walls.east
        : walls.west;
  const position = horizontal
    ? { x: openingStart(room.x, room.width, DOOR_WIDTH_MM), y: wall.startPoint.y }
    : { x: wall.startPoint.x, y: openingStart(room.y, room.height, DOOR_WIDTH_MM) };
  return addDoor(building, floorId, {
    floorId,
    wallId: wall.id,
    position,
    width: DOOR_WIDTH_MM,
    height: 2100,
    type: DoorType.Single,
    connectsRooms: ['__outside__', room.id],
  });
}

function addExternalWindows(
  building: Building,
  floorId: string,
  leftRooms: readonly PlacedRoom[],
  rightRooms: readonly PlacedRoom[],
  westWall: Wall,
  eastWall: Wall,
): Building {
  let next = building;
  const addForColumn = (rooms: readonly PlacedRoom[], wall: Wall) => {
    for (const { item, room } of rooms) {
      if (!item.ventilationRequired && item.daylight === 'none') continue;
      const windowWidth = Math.min(WINDOW_WIDTH_MM, room.height - OPENING_EDGE_CLEARANCE_MM * 2);
      if (windowWidth <= 0) continue;
      next = addWindow(next, floorId, {
        floorId,
        wallId: wall.id,
        position: {
          x: wall.startPoint.x,
          y: openingStart(room.y, room.height, windowWidth),
        },
        width: windowWidth,
        height: 1200,
        sillHeight: 900,
        type: WindowType.Sliding,
        roomId: room.id,
      });
    }
  };
  addForColumn(leftRooms, westWall);
  addForColumn(rightRooms, eastWall);
  return next;
}

export class StructuredLayoutGenerator {
  private readonly floorPlanner = new FloorProgramPlanner();

  generate(
    spec: DesignRequirementSpecification,
    program: RoomProgram,
    profile: LayoutStrategyProfile,
    graph: InstanceDesignGraph,
  ): Building {
    const setbacks = resolvedSetbacks(spec);
    const x = setbacks.left;
    const y = setbacks.front;
    const width = spec.hard.plotWidthMm - setbacks.left - setbacks.right;
    const depth = spec.hard.plotDepthMm - setbacks.front - setbacks.rear;
    if (width < 3000 || depth < 3000) {
      throw new Error('Buildable envelope is too small for structured residential generation.');
    }

    const floorsCount = Math.max(1, spec.hard.floorsCount);
    const allocation = this.floorPlanner.allocateDetailed(program, floorsCount, {
      availableAreaMm2: width * depth,
      requireOccupiedFloor: true,
      distributionStrategy: profile.strategy === 'open_circulation'
        ? 'ground_guest'
        : profile.strategy === 'vastu_aligned'
          ? 'top_master'
          : 'upper_private',
    });
    const floorFootprints = allocation.floors.map((items, floorLevel) => {
      try {
        return requiredFloorFootprint(items, width, depth, profile, graph);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`PARTIAL_GENERATION_FAILURE: Floor ${floorLevel} sizing failed. ${reason}`);
      }
    });
    const leftWidth = Math.round(width * profile.columnRatio);
    const building = createBuilding({
      projectId: spec.projectId ?? `generated_${profile.strategy}`,
      name: `${spec.projectName} — ${profile.name}`,
      site: {
        plotWidth: spec.hard.plotWidthMm,
        plotDepth: spec.hard.plotDepthMm,
        orientation: spec.orientationDegrees,
        plotShape: spec.plotShape,
        roadFacing: spec.hard.roadFacing,
        setbacks,
      },
      floors: Array.from({ length: floorsCount }, (_, level) => ({
        buildingId: '',
        level,
        name: level === 0 ? 'Ground Floor' : `Floor ${level}`,
        boundary: footprintBoundary(x, y, width, leftWidth, floorFootprints[level]!),
      })),
    });

    let next = building;
    for (let floorLevel = 0; floorLevel < floorsCount; floorLevel++) {
      const floor = next.floors.find(candidate => candidate.level === floorLevel)!;
      let result: FloorLayoutResult;
      try {
        result = this.layoutFloor(
          next,
          floor.id,
          profile,
          x,
          y,
          width,
          floorFootprints[floorLevel]!,
          floorLevel === 0 ? spec.hard.roadFacing : Direction.North,
        );
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`PARTIAL_GENERATION_FAILURE: Floor ${floorLevel} could not be generated. ${reason}`);
      }
      next = result.building;

      if (floorsCount > 1) {
        const staircaseRoom = result.placedRooms.find(placed => placed.room.type === RoomType.Staircase)?.room;
        if (!staircaseRoom) {
          throw new Error(`Floor ${floorLevel} is missing its required staircase shaft.`);
        }
        const fromLevel = floorLevel === floorsCount - 1 ? floorLevel - 1 : floorLevel;
        const toLevel = floorLevel === floorsCount - 1 ? floorLevel : floorLevel + 1;
        next = addStair(next, floor.id, {
          floorId: floor.id,
          x: staircaseRoom.x,
          y: staircaseRoom.y,
          width: Math.min(1200, staircaseRoom.width),
          length: Math.min(3000, staircaseRoom.height),
          direction: Direction.North,
          connectsFloors: [fromLevel, toLevel],
          verticalCoreId: 'primary-stair-core',
        });
      }
    }

    return next;
  }

  private layoutFloor(
    building: Building,
    floorId: string,
    profile: LayoutStrategyProfile,
    x: number,
    y: number,
    width: number,
    footprint: FloorFootprintPlan,
    entranceDirection: Direction,
  ): FloorLayoutResult {
    const leftWidth = Math.round(width * profile.columnRatio);
    const rightWidth = width - leftWidth;
    const maximumDepth = Math.max(footprint.leftDepth, footprint.rightDepth);
    const leftColumn = footprint.leftColumn;
    const rightColumn = footprint.rightColumn;
    const leftHeights = footprint.leftHeights;
    const rightHeights = footprint.rightHeights;
    let next = building;

    const placeColumn = (
      column: readonly ColumnPlacement[],
      heights: readonly number[],
      columnX: number,
      columnWidth: number,
    ): PlacedRoom[] => {
      let cursorY = y;
      const placed: PlacedRoom[] = [];
      column.forEach((placement, index) => {
        const height = heights[index]!;
        next = addRoom(next, floorId, {
          floorId,
          type: placement.item.type,
          name: placement.item.name,
          x: columnX,
          y: cursorY,
          width: columnWidth,
          height,
          daylightRequirement: placement.item.daylight,
          privacyRequirement: placement.item.privacy,
          ventilationRequired: placement.item.ventilationRequired,
          isFixed: placement.item.isFixed,
          tags: [
            `program:${placement.item.id}`,
            `zone:${placement.item.zone}`,
            `strategy:${profile.strategy}`,
          ],
        });
        const room = next.floors.find(floor => floor.id === floorId)!.rooms.at(-1)!;
        placed.push({ item: placement.item, room });
        cursorY += height;
      });
      return placed;
    };

    const leftRooms = placeColumn(leftColumn, leftHeights, x, leftWidth);
    const rightRooms = placeColumn(rightColumn, rightHeights, x + leftWidth, rightWidth);
    const allRooms = [...leftRooms, ...rightRooms];
    const perimeter = addPerimeterWalls(
      next, floorId, x, y, width, leftWidth, footprint.leftDepth, footprint.rightDepth,
    );
    next = perimeter.building;

    let centerWall: Wall | undefined;
    if (leftRooms.length > 0 && rightRooms.length > 0) {
      next = addWall(next, floorId, {
        floorId,
        startPoint: { x: x + leftWidth, y },
        endPoint: { x: x + leftWidth, y: y + Math.min(footprint.leftDepth, footprint.rightDepth) },
        type: WallType.Internal,
        thickness: 115,
        roomIds: [leftRooms[0]!.room.id, rightRooms[0]!.room.id],
      });
      centerWall = next.floors.find(floor => floor.id === floorId)!.walls.at(-1)!;
    }

    const connectColumn = (rooms: readonly PlacedRoom[]) => {
      for (let index = 0; index < rooms.length - 1; index++) {
        const current = rooms[index]!.room;
        const nextRoom = rooms[index + 1]!.room;
        const boundaryY = current.y + current.height;
        next = addWall(next, floorId, {
          floorId,
          startPoint: { x: current.x, y: boundaryY },
          endPoint: { x: current.x + current.width, y: boundaryY },
          type: WallType.Internal,
          thickness: 115,
          roomIds: [current.id, nextRoom.id],
        });
        const wall = next.floors.find(floor => floor.id === floorId)!.walls.at(-1)!;
        next = addDoor(next, floorId, {
          floorId,
          wallId: wall.id,
          position: { x: openingStart(current.x, current.width, DOOR_WIDTH_MM), y: boundaryY },
          width: DOOR_WIDTH_MM,
          height: 2100,
          type: DoorType.Single,
          connectsRooms: [current.id, nextRoom.id],
        });
      }
    };
    connectColumn(leftRooms);
    connectColumn(rightRooms);

    if (centerWall && leftRooms[0] && rightRooms[0]) {
      const sharedHeight = Math.min(leftRooms[0].room.height, rightRooms[0].room.height);
      next = addDoor(next, floorId, {
        floorId,
        wallId: centerWall.id,
        position: { x: x + leftWidth, y: openingStart(y, sharedHeight, DOOR_WIDTH_MM) },
        width: DOOR_WIDTH_MM,
        height: 2100,
        type: DoorType.Single,
        connectsRooms: [leftRooms[0].room.id, rightRooms[0].room.id],
      });
    }

    const entranceRoom = roomTouchingEdge(allRooms, entranceDirection, x, y, width, maximumDepth);
    next = addEntrance(next, floorId, entranceRoom, entranceDirection, perimeter);
    next = addExternalWindows(next, floorId, leftRooms, rightRooms, perimeter.west, perimeter.east);

    return { building: next, placedRooms: allRooms };
  }
}
