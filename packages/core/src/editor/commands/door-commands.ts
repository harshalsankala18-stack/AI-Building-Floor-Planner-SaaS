/**
 * Typed, Reversible Door Commands for Editor Layer.
 */

import type { Building, Door, Point } from '../../types';
import { generateId } from '../../models/id';
import { addDoor, removeDoor, moveDoor, updateDoor } from '../../models/updaters';
import type { CreateDoorParams } from '../../models/factory';
import type { IEditorCommand, EditorState, CommandExecutionResult } from '../types';

/** Add a new door to a wall. */
export class AddDoorCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly affectedEntityId: string;
  readonly floorId: string;
  readonly doorParams: CreateDoorParams;
  private createdDoorId?: string;

  constructor(floorId: string, params: CreateDoorParams) {
    this.id = generateId();
    this.floorId = floorId;
    this.doorParams = params;
    this.affectedEntityId = params.wallId;
    this.description = `Add ${params.width ?? 900}mm Door`;
  }

  execute(building: Building, _state: EditorState): CommandExecutionResult {
    const updatedBuilding = addDoor(building, this.floorId, this.doorParams);
    const floor = updatedBuilding.floors.find(f => f.id === this.floorId);
    const addedDoor = floor?.doors[floor.doors.length - 1];
    this.createdDoorId = addedDoor?.id;

    return {
      building: updatedBuilding,
      stateUpdates: {
        selection: this.createdDoorId
          ? { entityType: 'door', entityId: this.createdDoorId, floorId: this.floorId }
          : null,
      },
    };
  }

  undo(building: Building, _state: EditorState): CommandExecutionResult {
    if (!this.createdDoorId) return { building };
    const restoredBuilding = removeDoor(building, this.createdDoorId);
    return {
      building: restoredBuilding,
      stateUpdates: {
        selection: null,
      },
    };
  }
}

/** Move an existing door along a wall. */
export class MoveDoorCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly affectedEntityId: string;
  readonly doorId: string;
  readonly newPosition: Point;
  private prevPosition?: Point;

  constructor(doorId: string, newPosition: Point) {
    this.id = generateId();
    this.doorId = doorId;
    this.affectedEntityId = doorId;
    this.newPosition = newPosition;
    this.description = `Move Door to (${Math.round(newPosition.x)}, ${Math.round(newPosition.y)})`;
  }

  execute(building: Building, _state: EditorState): CommandExecutionResult {
    const door = this.findDoor(building, this.doorId);
    this.prevPosition = { ...door.position };

    const updatedBuilding = moveDoor(building, this.doorId, this.newPosition);
    return { building: updatedBuilding };
  }

  undo(building: Building, _state: EditorState): CommandExecutionResult {
    if (!this.prevPosition) return { building };
    const restoredBuilding = moveDoor(building, this.doorId, this.prevPosition);
    return { building: restoredBuilding };
  }

  private findDoor(building: Building, doorId: string): Door {
    for (const floor of building.floors) {
      const d = floor.doors.find(door => door.id === doorId);
      if (d) return d;
    }
    throw new Error(`Door not found: ${doorId}`);
  }
}

/** Update door properties (width, type, swingDirection). */
export class UpdateDoorPropertiesCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly affectedEntityId: string;
  readonly doorId: string;
  readonly updates: Partial<Door>;
  private prevProperties: Partial<Door> = {};

  constructor(doorId: string, updates: Partial<Door>) {
    this.id = generateId();
    this.doorId = doorId;
    this.affectedEntityId = doorId;
    this.updates = updates;
    this.description = `Update Door Properties`;
  }

  execute(building: Building, _state: EditorState): CommandExecutionResult {
    const door = this.findDoor(building, this.doorId);
    const prev: Partial<Door> = {};
    for (const key of Object.keys(this.updates) as (keyof Door)[]) {
      (prev as Record<string, unknown>)[key] = door[key];
    }
    this.prevProperties = prev;

    const updatedBuilding = updateDoor(building, this.doorId, this.updates);
    return { building: updatedBuilding };
  }

  undo(building: Building, _state: EditorState): CommandExecutionResult {
    const restoredBuilding = updateDoor(building, this.doorId, this.prevProperties);
    return { building: restoredBuilding };
  }

  private findDoor(building: Building, doorId: string): Door {
    for (const floor of building.floors) {
      const d = floor.doors.find(door => door.id === doorId);
      if (d) return d;
    }
    throw new Error(`Door not found: ${doorId}`);
  }
}

/** Remove a door. */
export class RemoveDoorCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly affectedEntityId: string;
  readonly doorId: string;
  private removedDoor?: Door;
  private floorId?: string;

  constructor(doorId: string) {
    this.id = generateId();
    this.doorId = doorId;
    this.affectedEntityId = doorId;
    this.description = `Remove Door`;
  }

  execute(building: Building, _state: EditorState): CommandExecutionResult {
    for (const floor of building.floors) {
      const d = floor.doors.find(door => door.id === this.doorId);
      if (d) {
        this.removedDoor = { ...d };
        this.floorId = floor.id;
        break;
      }
    }

    const updatedBuilding = removeDoor(building, this.doorId);
    return {
      building: updatedBuilding,
      stateUpdates: { selection: null },
    };
  }

  undo(building: Building, _state: EditorState): CommandExecutionResult {
    if (!this.removedDoor || !this.floorId) return { building };
    const restoredBuilding = addDoor(building, this.floorId, {
      floorId: this.floorId,
      wallId: this.removedDoor.wallId,
      position: this.removedDoor.position,
      width: this.removedDoor.width,
      height: this.removedDoor.height,
      type: this.removedDoor.type,
      swingDirection: this.removedDoor.swingDirection,
      connectsRooms: [this.removedDoor.connectsRooms[0], this.removedDoor.connectsRooms[1]],
    });
    return { building: restoredBuilding };
  }
}
