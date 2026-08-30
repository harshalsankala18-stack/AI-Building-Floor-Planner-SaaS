/**
 * Reversible Delete Command for Selected Entity.
 */

import type { Building, Room, Door, Window, Column, Stair } from '../../types';
import { generateId } from '../../models/id';
import {
  removeRoom,
  removeDoor,
  removeWindow,
  removeColumn,
  removeStair,
  addRoom,
  addDoor,
  addWindow,
  addColumn,
  addStair,
} from '../../models/updaters';
import type { IEditorCommand, EditorState, CommandExecutionResult, EditorEntityType } from '../types';

export class DeleteEntityCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly affectedEntityId: string;
  readonly entityType: EditorEntityType;
  readonly entityId: string;

  private savedEntity?: Room | Door | Window | Column | Stair;
  private floorId?: string;

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
      }
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
      default:
        throw new Error(`Deletion of entity type '${this.entityType}' not supported`);
    }

    return {
      building: updatedBuilding,
      stateUpdates: { selection: null },
    };
  }

  undo(building: Building, _state: EditorState): CommandExecutionResult {
    if (!this.savedEntity || !this.floorId) return { building };

    let restoredBuilding: Building;
    switch (this.entityType) {
      case 'room': {
        const r = this.savedEntity as Room;
        restoredBuilding = addRoom(building, this.floorId, {
          floorId: this.floorId,
          type: r.type,
          name: r.name,
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          rotation: r.rotation,
          priority: r.priority,
          tags: [...r.tags],
          adjacencyRequirements: [...r.adjacencyRequirements],
          daylightRequirement: r.daylightRequirement,
          privacyRequirement: r.privacyRequirement,
          ventilationRequired: r.ventilationRequired,
          isFixed: r.isFixed,
        });
        break;
      }
      case 'door': {
        const d = this.savedEntity as Door;
        restoredBuilding = addDoor(building, this.floorId, {
          floorId: this.floorId,
          wallId: d.wallId,
          position: d.position,
          width: d.width,
          height: d.height,
          type: d.type,
          swingDirection: d.swingDirection,
          connectsRooms: [d.connectsRooms[0], d.connectsRooms[1]],
        });
        break;
      }
      case 'window': {
        const w = this.savedEntity as Window;
        restoredBuilding = addWindow(building, this.floorId, {
          floorId: this.floorId,
          wallId: w.wallId,
          position: w.position,
          width: w.width,
          height: w.height,
          sillHeight: w.sillHeight,
          type: w.type,
          roomId: w.roomId,
        });
        break;
      }
      case 'column': {
        const c = this.savedEntity as Column;
        restoredBuilding = addColumn(building, this.floorId, {
          floorId: this.floorId,
          position: c.position,
          shape: c.shape,
          width: c.width,
          depth: c.depth,
          isStructural: c.isStructural,
          gridReference: c.gridReference,
        });
        break;
      }
      case 'stair': {
        const s = this.savedEntity as Stair;
        restoredBuilding = addStair(building, this.floorId, {
          floorId: this.floorId,
          type: s.type,
          x: s.x,
          y: s.y,
          width: s.width,
          length: s.length,
          direction: s.direction,
          riserCount: s.riserCount,
          riserHeight: s.riserHeight,
          treadDepth: s.treadDepth,
          connectsFloors: [s.connectsFloors[0], s.connectsFloors[1]],
        });
        break;
      }
      default:
        return { building };
    }

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
