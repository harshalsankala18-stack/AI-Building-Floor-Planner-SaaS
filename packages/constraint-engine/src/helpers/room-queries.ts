/**
 * Room query utilities for constraint evaluation.
 */

import type { Building, Floor, Room, RoomType, Polygon } from '@ai-floor-planner/core';
import { polygonsAdjacent, polygonCentroid, distance } from '@ai-floor-planner/geometry-engine';

/** Get all rooms across all floors. */
export function getAllRooms(building: Building): Room[] {
  return building.floors.flatMap(f => [...f.rooms]);
}

/** Get all rooms of a specific type across all floors. */
export function getRoomsByType(building: Building, type: RoomType): Room[] {
  return getAllRooms(building).filter(r => r.type === type);
}

/** Get all rooms on a specific floor. */
export function getFloorRooms(floor: Floor): Room[] {
  return [...floor.rooms];
}

/** Get the "master" bedroom (largest bedroom, or first with priority >= 8). */
export function getMasterBedroom(building: Building): Room | null {
  const bedrooms = getRoomsByType(building, 'bedroom' as RoomType);
  if (bedrooms.length === 0) return null;

  // Priority-based first
  const highPriority = bedrooms.filter(b => b.priority >= 8);
  if (highPriority.length > 0) {
    return highPriority.reduce((a, b) => a.area > b.area ? a : b);
  }

  // Fallback: largest bedroom
  return bedrooms.reduce((a, b) => a.area > b.area ? a : b);
}

/** Get rooms adjacent to a given room (sharing a wall). */
export function getAdjacentRooms(room: Room, allRooms: readonly Room[]): Room[] {
  return allRooms.filter(other =>
    other.id !== room.id && polygonsAdjacent(room.boundary, other.boundary),
  );
}

/** Check if a room has an external wall (shares edge with floor boundary). */
export function hasExternalWall(room: Room, floorBoundary: Polygon): boolean {
  if (floorBoundary.points.length < 3) return false;
  return polygonsAdjacent(room.boundary, floorBoundary);
}

/** Compute centroid-to-centroid distance between two rooms. */
export function roomCentroidDistance(a: Room, b: Room): number {
  const ca = polygonCentroid(a.boundary);
  const cb = polygonCentroid(b.boundary);
  return distance(ca, cb);
}

/** Check if any room of a given type is adjacent to the target room. */
export function isAdjacentToType(
  room: Room,
  targetType: RoomType,
  allRooms: readonly Room[],
): boolean {
  return allRooms.some(other =>
    other.id !== room.id &&
    other.type === targetType &&
    polygonsAdjacent(room.boundary, other.boundary),
  );
}

/** Get rooms on a specific floor by type. */
export function getFloorRoomsByType(floor: Floor, type: RoomType): Room[] {
  return floor.rooms.filter(r => r.type === type);
}
