/**
 * All soft constraint exports.
 */

export { KitchenDining, DiningLiving, MasterBathroom, UtilityKitchen, ParkingEntrance, PoojaAccess } from './adjacency';
export { CorridorRatio, NoDeadEnds, DirectAccess, PathLength } from './circulation';
export { BedroomExternal, LivingExternal, KitchenExternal, WindowOrientation, AllHabitableLight } from './daylight';
export { BedroomSeparation, MasterIsolation, BathroomVisibility, GuestSeparation } from './privacy';
export { PublicPrivateSeparation, ServiceZoneGrouping, NightDaySeparation } from './zoning';
export { AspectRatio, RoomSizeRange, DimensionBalance } from './geometry-proportion';
export { WallAlignment, ColumnGrid } from './structural';
export { FloorSpaceUtilization } from './space-utilization';

import type { Constraint } from '../../types';
import { KitchenDining, DiningLiving, MasterBathroom, UtilityKitchen, ParkingEntrance, PoojaAccess } from './adjacency';
import { CorridorRatio, NoDeadEnds, DirectAccess, PathLength } from './circulation';
import { BedroomExternal, LivingExternal, KitchenExternal, WindowOrientation, AllHabitableLight } from './daylight';
import { BedroomSeparation, MasterIsolation, BathroomVisibility, GuestSeparation } from './privacy';
import { PublicPrivateSeparation, ServiceZoneGrouping, NightDaySeparation } from './zoning';
import { AspectRatio, RoomSizeRange, DimensionBalance } from './geometry-proportion';
import { WallAlignment, ColumnGrid } from './structural';
import { FloorSpaceUtilization } from './space-utilization';

/** All built-in soft constraints. */
export const ALL_SOFT_CONSTRAINTS: Constraint[] = [
  // Adjacency
  KitchenDining,
  DiningLiving,
  MasterBathroom,
  UtilityKitchen,
  ParkingEntrance,
  PoojaAccess,
  // Circulation
  CorridorRatio,
  NoDeadEnds,
  DirectAccess,
  PathLength,
  // Daylight
  BedroomExternal,
  LivingExternal,
  KitchenExternal,
  WindowOrientation,
  AllHabitableLight,
  // Privacy
  BedroomSeparation,
  MasterIsolation,
  BathroomVisibility,
  GuestSeparation,
  // Zoning
  PublicPrivateSeparation,
  ServiceZoneGrouping,
  NightDaySeparation,
  // Geometry
  AspectRatio,
  RoomSizeRange,
  DimensionBalance,
  // Structural
  WallAlignment,
  ColumnGrid,
  FloorSpaceUtilization,
];
