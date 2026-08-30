/**
 * Area and dimension calculations.
 */

import type { Room, Floor, Building } from '@ai-floor-planner/core';
import { polygonArea } from './polygon';

/** Compute carpet area (room interior minus wall thickness). */
export function carpetArea(room: Room, wallThickness: number): number {
  // Carpet area = (width - wallThickness) × (height - wallThickness)
  // Wall thickness is split between two sides
  const effectiveWidth = Math.max(0, room.width - wallThickness);
  const effectiveHeight = Math.max(0, room.height - wallThickness);
  return effectiveWidth * effectiveHeight;
}

/** Compute built-up area of a floor (total area including walls). */
export function builtUpArea(floor: Floor): number {
  return polygonArea(floor.boundary);
}

/** Compute total building area across all floors. */
export function totalBuildingArea(building: Building): number {
  let total = 0;
  for (const floor of building.floors) {
    total += builtUpArea(floor);
  }
  return total;
}

/** Compute room dimensions for display. */
export function roomDimensions(room: Room): { width: number; height: number; area: number } {
  return {
    width: room.width,
    height: room.height,
    area: room.width * room.height,
  };
}

/** Compute floor coverage ratio. */
export function floorCoverageRatio(floor: Floor, plotArea: number): number {
  if (plotArea <= 0) return 0;
  const floorArea = builtUpArea(floor);
  return floorArea / plotArea;
}
