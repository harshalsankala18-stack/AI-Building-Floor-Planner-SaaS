/**
 * Room Mutation Commands.
 * Reversibly mutate Room position, dimensions, and semantic properties in the Building Model.
 */

import type { Building, Room } from '../../types';
import { generateId } from '../../models/id';
import { moveRoom, resizeRoom, addRoom, removeRoom, updateEntity } from '../../models/updaters';
import type { CreateRoomParams } from '../../models/factory';
import type { IEditorCommand, EditorState, CommandExecutionResult } from '../types';

/** Move a room to a new position. */
export class MoveRoomCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly affectedEntityId: string;
  readonly roomId: string;
  readonly newX: number;
  readonly newY: number;
  private prevX?: number;
  private prevY?: number;

  constructor(roomId: string, newX: number, newY: number, roomName?: string) {
    this.id = generateId();
    this.roomId = roomId;
    this.affectedEntityId = roomId;
    this.newX = newX;
    this.newY = newY;
    this.description = `Move ${roomName ?? 'Room'} to (${Math.round(newX)}, ${Math.round(newY)})`;
  }

  execute(building: Building, _state: EditorState): CommandExecutionResult {
    // Capture original position for exact reversal
    const room = this.findRoom(building, this.roomId);
    this.prevX = room.x;
    this.prevY = room.y;

    const updatedBuilding = moveRoom(building, this.roomId, this.newX, this.newY);

    return {
      building: updatedBuilding,
    };
  }

  undo(building: Building, _state: EditorState): CommandExecutionResult {
    if (this.prevX === undefined || this.prevY === undefined) {
      return { building };
    }

    const restoredBuilding = moveRoom(building, this.roomId, this.prevX, this.prevY);

    return {
      building: restoredBuilding,
    };
  }

  private findRoom(building: Building, roomId: string): Room {
    for (const floor of building.floors) {
      for (const r of floor.rooms) {
        if (r.id === roomId) return r;
      }
    }
    throw new Error(`Room not found: ${roomId}`);
  }
}

/** Resize a room's width and height. */
export class ResizeRoomCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly affectedEntityId: string;
  readonly roomId: string;
  readonly newWidth: number;
  readonly newHeight: number;
  private prevWidth?: number;
  private prevHeight?: number;

  constructor(roomId: string, newWidth: number, newHeight: number, roomName?: string) {
    this.id = generateId();
    this.roomId = roomId;
    this.affectedEntityId = roomId;
    this.newWidth = newWidth;
    this.newHeight = newHeight;
    this.description = `Resize ${roomName ?? 'Room'} to ${Math.round(newWidth)} × ${Math.round(newHeight)} mm`;
  }

  execute(building: Building, _state: EditorState): CommandExecutionResult {
    const room = this.findRoom(building, this.roomId);
    this.prevWidth = room.width;
    this.prevHeight = room.height;

    const updatedBuilding = resizeRoom(building, this.roomId, this.newWidth, this.newHeight);

    return {
      building: updatedBuilding,
    };
  }

  undo(building: Building, _state: EditorState): CommandExecutionResult {
    if (this.prevWidth === undefined || this.prevHeight === undefined) {
      return { building };
    }

    const restoredBuilding = resizeRoom(building, this.roomId, this.prevWidth, this.prevHeight);

    return {
      building: restoredBuilding,
    };
  }

  private findRoom(building: Building, roomId: string): Room {
    for (const floor of building.floors) {
      for (const r of floor.rooms) {
        if (r.id === roomId) return r;
      }
    }
    throw new Error(`Room not found: ${roomId}`);
  }
}

/** Update room semantic attributes (name, type, requirements, priority). */
export class UpdateRoomPropertiesCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly affectedEntityId: string;
  readonly roomId: string;
  readonly updates: Partial<Room>;
  private prevProperties: Partial<Room> = {};

  constructor(roomId: string, updates: Partial<Room>, roomName?: string) {
    this.id = generateId();
    this.roomId = roomId;
    this.affectedEntityId = roomId;
    this.updates = updates;
    this.description = `Update properties for ${roomName ?? 'Room'}`;
  }

  execute(building: Building, _state: EditorState): CommandExecutionResult {
    const room = this.findRoom(building, this.roomId);

    // Save previous values for keys being modified
    const prev: Partial<Room> = {};
    for (const key of Object.keys(this.updates) as (keyof Room)[]) {
      (prev as Record<string, unknown>)[key] = room[key];
    }
    this.prevProperties = prev;

    const updatedBuilding = updateEntity(building, 'room', this.roomId, this.updates);

    return {
      building: updatedBuilding,
    };
  }

  undo(building: Building, _state: EditorState): CommandExecutionResult {
    const restoredBuilding = updateEntity(building, 'room', this.roomId, this.prevProperties);

    return {
      building: restoredBuilding,
    };
  }

  private findRoom(building: Building, roomId: string): Room {
    for (const floor of building.floors) {
      for (const r of floor.rooms) {
        if (r.id === roomId) return r;
      }
    }
    throw new Error(`Room not found: ${roomId}`);
  }
}

/** Add a new room to a floor. */
export class AddRoomCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly affectedEntityId: string;
  readonly floorId: string;
  readonly roomParams: CreateRoomParams;
  private createdRoomId?: string;

  constructor(floorId: string, params: CreateRoomParams) {
    this.id = generateId();
    this.floorId = floorId;
    this.roomParams = params;
    this.affectedEntityId = floorId;
    this.description = `Add Room '${params.name ?? 'Room'}'`;
  }

  execute(building: Building, _state: EditorState): CommandExecutionResult {
    const updatedBuilding = addRoom(building, this.floorId, this.roomParams);
    const floor = updatedBuilding.floors.find(f => f.id === this.floorId);
    const addedRoom = floor?.rooms[floor.rooms.length - 1];
    this.createdRoomId = addedRoom?.id;

    return {
      building: updatedBuilding,
      stateUpdates: {
        selection: this.createdRoomId
          ? { entityType: 'room', entityId: this.createdRoomId, floorId: this.floorId }
          : null,
      },
    };
  }

  undo(building: Building, _state: EditorState): CommandExecutionResult {
    if (!this.createdRoomId) return { building };
    return {
      building: removeRoom(building, this.createdRoomId),
      stateUpdates: { selection: null },
    };
  }
}
