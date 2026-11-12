/**
 * Reversible Delete Command for a Selected Entity.
 *
 * Deletion cascades to the geometry that only existed to serve the deleted
 * entity (see `removeRoom` / `removeWall`), so nothing is left referencing an
 * entity that no longer exists. Undo restores the entity AND its dependents.
 */

import type { Building, Room, Door, Window, Column, Stair, Wall } from '../../types';
import { generateId } from '../../models/id';
import {
  removeRoom,
  removeDoor,
  removeWindow,
  removeColumn,
  removeStair,
  removeWall,
} from '../../models/updaters';
import type { IEditorCommand, EditorState, CommandExecutionResult, EditorEntityType } from '../types';

export class DeleteEntityCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly affectedEntityId: string;
  readonly entityType: EditorEntityType;
  readonly entityId: string;

  private savedEntity?: Room | Door | Window | Column | Stair | Wall;
  private floorId?: string;
  /**
   * Dependents removed by the cascade, so undo can put the plan back exactly
   * as it was rather than restoring an entity with its openings missing.
   */
  private removedWalls: Wall[] = [];
  private removedDoors: Door[] = [];
  private removedWindows: Window[] = [];
  /** `roomIds` of surviving walls before this room was dropped from them. */
  private wallRoomIdsBefore = new Map<string, readonly string[]>();

  constructor(entityType: EditorEntityType, entityId: string, label?: string) {
    this.id = generateId();
    this.entityType = entityType;
    this.entityId = entityId;
    this.affectedEntityId = entityId;
    this.description = label ?? `Delete ${entityType}`;
  }

  execute(building: Building, _state: EditorState): CommandExecutionResult {
    // Capture snapshot for reversible undo
    for (const floor of building.floors) {
      if (this.entityType === 'room') {
        const r = floor.rooms.find(room => room.id === this.entityId);
        if (r) { this.savedEntity = { ...r }; this.floorId = floor.id; break; }
      } else if (this.entityType === 'door') {
        const d = floor.doors.find(door => door.id === this.entityId);
        if (d) { this.savedEntity = { ...d }; this.floorId = floor.id; break; }
      } else if (this.entityType === 'window') {
        const w = floor.windows.find(win => win.id === this.entityId);
        if (w) { this.savedEntity = { ...w }; this.floorId = floor.id; break; }
      } else if (this.entityType === 'column') {
        const c = floor.columns.find(col => col.id === this.entityId);
        if (c) { this.savedEntity = { ...c }; this.floorId = floor.id; break; }
      } else if (this.entityType === 'stair') {
        const s = floor.stairs.find(stair => stair.id === this.entityId);
        if (s) { this.savedEntity = { ...s }; this.floorId = floor.id; break; }
      } else if (this.entityType === 'wall') {
        const w = floor.walls.find(wall => wall.id === this.entityId);
        if (w) { this.savedEntity = { ...w }; this.floorId = floor.id; break; }
      }
    }

    if (!this.savedEntity || !this.floorId) {
      return {
        building,
        rejectedReason: `No ${this.entityType} with id ${this.entityId} is on the plan, so nothing was deleted.`,
      };
    }

    // Record the dependents the cascade is about to take, so undo can restore
    // the plan exactly.
    const sourceFloor = building.floors.find(f => f.id === this.floorId)!;
    if (this.entityType === 'room') {
      this.removedWalls = sourceFloor.walls
        .filter(w => w.roomIds.includes(this.entityId) && w.roomIds.every(id => id === this.entityId))
        .map(w => ({ ...w }));
      const goneWallIds = new Set(this.removedWalls.map(w => w.id));
      // Shared walls keep existing but lose this room; remember their original
      // membership so undo restores the adjacency.
      this.wallRoomIdsBefore = new Map(
        sourceFloor.walls
          .filter(w => !goneWallIds.has(w.id) && w.roomIds.includes(this.entityId))
          .map(w => [w.id, [...w.roomIds]] as const),
      );
      this.removedDoors = sourceFloor.doors.filter(d => goneWallIds.has(d.wallId)).map(d => ({ ...d }));
      this.removedWindows = sourceFloor.windows
        .filter(w => goneWallIds.has(w.wallId) || w.roomId === this.entityId)
        .map(w => ({ ...w }));
    } else if (this.entityType === 'wall') {
      this.removedDoors = sourceFloor.doors.filter(d => d.wallId === this.entityId).map(d => ({ ...d }));
      this.removedWindows = sourceFloor.windows.filter(w => w.wallId === this.entityId).map(w => ({ ...w }));
    }

    let updatedBuilding: Building;
    switch (this.entityType) {
      case 'room':
        updatedBuilding = removeRoom(building, this.entityId);
        break;
      case 'door':
        updatedBuilding = removeDoor(building, this.entityId);
        break;
      case 'window':
        updatedBuilding = removeWindow(building, this.entityId);
        break;
      case 'column':
        updatedBuilding = removeColumn(building, this.entityId);
        break;
      case 'stair':
        updatedBuilding = removeStair(building, this.entityId);
        break;
      case 'wall':
        updatedBuilding = removeWall(building, this.entityId);
        break;
      default:
        return {
          building,
          rejectedReason: `Deleting a ${this.entityType} is not supported. Rooms, walls, doors, windows, stairs and columns can be deleted.`,
        };
    }

    return {
      building: updatedBuilding,
      stateUpdates: { selection: null },
    };
  }

  /**
   * Restore the deleted entity AND everything the cascade took with it.
   *
   * Entities are spliced back with their ORIGINAL ids rather than re-created
   * through the `add*` factories: a new id would leave every reference to the
   * old one (a window's `roomId`, an opening's `wallId`, a wall's `roomIds`,
   * the selection) pointing at an entity that no longer exists, so "undo"
   * would quietly produce a different model.
   */
  undo(building: Building, _state: EditorState): CommandExecutionResult {
    if (!this.savedEntity || !this.floorId) return { building };

    const restoredBuilding: Building = {
      ...building,
      floors: building.floors.map(floor => {
        if (floor.id !== this.floorId) return floor;
        const next = { ...floor };

        switch (this.entityType) {
          case 'room':
            next.rooms = [...floor.rooms, this.savedEntity as Room];
            break;
          case 'door':
            next.doors = [...floor.doors, this.savedEntity as Door];
            break;
          case 'window':
            next.windows = [...floor.windows, this.savedEntity as Window];
            break;
          case 'column':
            next.columns = [...floor.columns, this.savedEntity as Column];
            break;
          case 'stair':
            next.stairs = [...floor.stairs, this.savedEntity as Stair];
            break;
          case 'wall':
            next.walls = [...floor.walls, this.savedEntity as Wall];
            break;
          default:
            return floor;
        }

        // Put back the cascaded dependents, and re-attach this room to the
        // walls that merely dropped it from `roomIds`.
        if (this.removedWalls.length > 0) {
          next.walls = [...next.walls, ...this.removedWalls];
        }
        if (this.entityType === 'room') {
          next.walls = next.walls.map(w => {
            const original = this.wallRoomIdsBefore.get(w.id);
            return original ? { ...w, roomIds: [...original] } : w;
          });
        }
        if (this.removedDoors.length > 0) {
          next.doors = [...next.doors, ...this.removedDoors];
        }
        if (this.removedWindows.length > 0) {
          next.windows = [...next.windows, ...this.removedWindows];
        }
        return next;
      }),
      updatedAt: new Date().toISOString(),
    };

    return {
      building: restoredBuilding,
      stateUpdates: {
        selection: {
          entityType: this.entityType,
          entityId: this.entityId,
          floorId: this.floorId,
        },
      },
    };
  }
}
