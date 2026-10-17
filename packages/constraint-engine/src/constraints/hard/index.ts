/**
 * All hard constraint exports.
 */

export { RoomContainment, FloorContainment } from './plot-containment';
export { NoIllegalOverlap } from './room-overlap';
export { ValidPolygons, PositiveArea, WallIntegrity } from './geometry-validity';
export { RequiredRoomsPresent } from './required-rooms';
export { RoomAccessibility, CorridorWidth } from './accessibility';
export { DoorOnWall, DoorClearance } from './door-validity';
export { WindowOnWall } from './window-validity';
export { StairConnectivity, StairDimensions } from './stair-validity';
export { FloorRoomConsistency } from './floor-consistency';
export { MinimumRoomSize } from './minimum-size';
export { VerticalCirculationContinuity } from './vertical-continuity';
export { NbcRoomDimensionConstraint } from '../../providers/regulatory-provider';

import type { Constraint } from '../../types';
import { RoomContainment, FloorContainment } from './plot-containment';
import { NoIllegalOverlap } from './room-overlap';
import { ValidPolygons, PositiveArea, WallIntegrity } from './geometry-validity';
import { RequiredRoomsPresent } from './required-rooms';
import { RoomAccessibility, CorridorWidth } from './accessibility';
import { DoorOnWall, DoorClearance } from './door-validity';
import { WindowOnWall } from './window-validity';
import { StairConnectivity, StairDimensions } from './stair-validity';
import { FloorRoomConsistency } from './floor-consistency';
import { MinimumRoomSize } from './minimum-size';
import { VerticalCirculationContinuity } from './vertical-continuity';

/** All built-in hard constraints. */
export const ALL_HARD_CONSTRAINTS: Constraint[] = [
  RoomContainment,
  FloorContainment,
  NoIllegalOverlap,
  ValidPolygons,
  PositiveArea,
  WallIntegrity,
  RequiredRoomsPresent,
  RoomAccessibility,
  CorridorWidth,
  DoorOnWall,
  DoorClearance,
  WindowOnWall,
  StairConnectivity,
  StairDimensions,
  FloorRoomConsistency,
  MinimumRoomSize,
  VerticalCirculationContinuity,
];
