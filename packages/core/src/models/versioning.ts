/**
 * Plan versioning: snapshots, restore, and diff.
 */

import type { Building } from '../types';
import type { ChangeSource } from '../types';
import type { PlanVersion } from '../types';
import { generateId } from './id';
import { cloneBuilding } from './serialization';

/** Differences between two building states. */
export interface BuildingDiff {
  addedRooms: string[];
  removedRooms: string[];
  movedRooms: string[];
  resizedRooms: string[];
  addedWalls: string[];
  removedWalls: string[];
  addedDoors: string[];
  removedDoors: string[];
  addedWindows: string[];
  removedWindows: string[];
  hasChanges: boolean;
}

/** Create a version snapshot from the current building state. */
export function createVersion(
  building: Building,
  changeDescription: string,
  changeSource: ChangeSource,
  createdBy: string,
): PlanVersion {
  return {
    id: generateId(),
    buildingId: building.id,
    versionNumber: building.version,
    snapshot: cloneBuilding(building),
    changeDescription,
    changeSource,
    createdAt: new Date().toISOString(),
    createdBy,
  };
}

/** Restore a building from a version snapshot. */
export function restoreVersion(version: PlanVersion): Building {
  return cloneBuilding(version.snapshot);
}

/** Compare two buildings and return a summary of differences. */
export function diffBuildings(before: Building, after: Building): BuildingDiff {
  const beforeRooms = new Map<string, { x: number; y: number; width: number; height: number }>();
  const afterRooms = new Map<string, { x: number; y: number; width: number; height: number }>();

  for (const floor of before.floors) {
    for (const room of floor.rooms) {
      beforeRooms.set(room.id, { x: room.x, y: room.y, width: room.width, height: room.height });
    }
  }
  for (const floor of after.floors) {
    for (const room of floor.rooms) {
      afterRooms.set(room.id, { x: room.x, y: room.y, width: room.width, height: room.height });
    }
  }

  const addedRooms: string[] = [];
  const removedRooms: string[] = [];
  const movedRooms: string[] = [];
  const resizedRooms: string[] = [];

  // Find removed and changed rooms
  for (const [id, br] of beforeRooms) {
    const ar = afterRooms.get(id);
    if (!ar) {
      removedRooms.push(id);
    } else {
      if (br.x !== ar.x || br.y !== ar.y) movedRooms.push(id);
      if (br.width !== ar.width || br.height !== ar.height) resizedRooms.push(id);
    }
  }

  // Find added rooms
  for (const id of afterRooms.keys()) {
    if (!beforeRooms.has(id)) addedRooms.push(id);
  }

  // Walls
  const beforeWallIds = new Set(before.floors.flatMap(f => f.walls.map(w => w.id)));
  const afterWallIds = new Set(after.floors.flatMap(f => f.walls.map(w => w.id)));
  const addedWalls = [...afterWallIds].filter(id => !beforeWallIds.has(id));
  const removedWalls = [...beforeWallIds].filter(id => !afterWallIds.has(id));

  // Doors
  const beforeDoorIds = new Set(before.floors.flatMap(f => f.doors.map(d => d.id)));
  const afterDoorIds = new Set(after.floors.flatMap(f => f.doors.map(d => d.id)));
  const addedDoors = [...afterDoorIds].filter(id => !beforeDoorIds.has(id));
  const removedDoors = [...beforeDoorIds].filter(id => !afterDoorIds.has(id));

  // Windows
  const beforeWinIds = new Set(before.floors.flatMap(f => f.windows.map(w => w.id)));
  const afterWinIds = new Set(after.floors.flatMap(f => f.windows.map(w => w.id)));
  const addedWindows = [...afterWinIds].filter(id => !beforeWinIds.has(id));
  const removedWindows = [...beforeWinIds].filter(id => !afterWinIds.has(id));

  const hasChanges = addedRooms.length > 0
    || removedRooms.length > 0
    || movedRooms.length > 0
    || resizedRooms.length > 0
    || addedWalls.length > 0
    || removedWalls.length > 0
    || addedDoors.length > 0
    || removedDoors.length > 0
    || addedWindows.length > 0
    || removedWindows.length > 0;

  return {
    addedRooms,
    removedRooms,
    movedRooms,
    resizedRooms,
    addedWalls,
    removedWalls,
    addedDoors,
    removedDoors,
    addedWindows,
    removedWindows,
    hasChanges,
  };
}
