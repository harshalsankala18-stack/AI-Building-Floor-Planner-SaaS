/**
 * Typed, Reversible Window Commands for Editor Layer.
 */

import type { Building, Window, Point } from '../../types';
import { generateId } from '../../models/id';
import { addWindow, removeWindow, moveWindow, updateWindow } from '../../models/updaters';
import type { CreateWindowParams } from '../../models/factory';
import type { IEditorCommand, EditorState, CommandExecutionResult } from '../types';

/** Add a new window to a wall. */
export class AddWindowCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly affectedEntityId: string;
  readonly floorId: string;
  readonly windowParams: CreateWindowParams;
  private createdWindowId?: string;

  constructor(floorId: string, params: CreateWindowParams) {
    this.id = generateId();
    this.floorId = floorId;
    this.windowParams = params;
    this.affectedEntityId = params.wallId;
    this.description = `Add ${params.width ?? 1200}mm Window`;
  }

  execute(building: Building, _state: EditorState): CommandExecutionResult {
    const updatedBuilding = addWindow(building, this.floorId, this.windowParams);
    const floor = updatedBuilding.floors.find(f => f.id === this.floorId);
    const addedWin = floor?.windows[floor.windows.length - 1];
    this.createdWindowId = addedWin?.id;

    return {
      building: updatedBuilding,
      stateUpdates: {
        selection: this.createdWindowId
          ? { entityType: 'window', entityId: this.createdWindowId, floorId: this.floorId }
          : null,
      },
    };
  }

  undo(building: Building, _state: EditorState): CommandExecutionResult {
    if (!this.createdWindowId) return { building };
    const restoredBuilding = removeWindow(building, this.createdWindowId);
    return {
      building: restoredBuilding,
      stateUpdates: {
        selection: null,
      },
    };
  }
}

/** Move an existing window along a wall. */
export class MoveWindowCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly affectedEntityId: string;
  readonly windowId: string;
  readonly newPosition: Point;
  private prevPosition?: Point;

  constructor(windowId: string, newPosition: Point) {
    this.id = generateId();
    this.windowId = windowId;
    this.affectedEntityId = windowId;
    this.newPosition = newPosition;
    this.description = `Move Window to (${Math.round(newPosition.x)}, ${Math.round(newPosition.y)})`;
  }

  execute(building: Building, _state: EditorState): CommandExecutionResult {
    const win = this.findWindow(building, this.windowId);
    this.prevPosition = { ...win.position };

    const updatedBuilding = moveWindow(building, this.windowId, this.newPosition);
    return { building: updatedBuilding };
  }

  undo(building: Building, _state: EditorState): CommandExecutionResult {
    if (!this.prevPosition) return { building };
    const restoredBuilding = moveWindow(building, this.windowId, this.prevPosition);
    return { building: restoredBuilding };
  }

  private findWindow(building: Building, windowId: string): Window {
    for (const floor of building.floors) {
      const w = floor.windows.find(win => win.id === windowId);
      if (w) return w;
    }
    throw new Error(`Window not found: ${windowId}`);
  }
}

/** Update window properties (width, height, sillHeight, type). */
export class UpdateWindowPropertiesCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly affectedEntityId: string;
  readonly windowId: string;
  readonly updates: Partial<Window>;
  private prevProperties: Partial<Window> = {};

  constructor(windowId: string, updates: Partial<Window>) {
    this.id = generateId();
    this.windowId = windowId;
    this.affectedEntityId = windowId;
    this.updates = updates;
    this.description = `Update Window Properties`;
  }

  execute(building: Building, _state: EditorState): CommandExecutionResult {
    const win = this.findWindow(building, this.windowId);
    const prev: Partial<Window> = {};
    for (const key of Object.keys(this.updates) as (keyof Window)[]) {
      (prev as Record<string, unknown>)[key] = win[key];
    }
    this.prevProperties = prev;

    const updatedBuilding = updateWindow(building, this.windowId, this.updates);
    return { building: updatedBuilding };
  }

  undo(building: Building, _state: EditorState): CommandExecutionResult {
    const restoredBuilding = updateWindow(building, this.windowId, this.prevProperties);
    return { building: restoredBuilding };
  }

  private findWindow(building: Building, windowId: string): Window {
    for (const floor of building.floors) {
      const w = floor.windows.find(win => win.id === windowId);
      if (w) return w;
    }
    throw new Error(`Window not found: ${windowId}`);
  }
}

/** Remove a window. */
export class RemoveWindowCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly affectedEntityId: string;
  readonly windowId: string;
  private removedWindow?: Window;
  private floorId?: string;

  constructor(windowId: string) {
    this.id = generateId();
    this.windowId = windowId;
    this.affectedEntityId = windowId;
    this.description = `Remove Window`;
  }

  execute(building: Building, _state: EditorState): CommandExecutionResult {
    for (const floor of building.floors) {
      const w = floor.windows.find(win => win.id === this.windowId);
      if (w) {
        this.removedWindow = { ...w };
        this.floorId = floor.id;
        break;
      }
    }

    const updatedBuilding = removeWindow(building, this.windowId);
    return {
      building: updatedBuilding,
      stateUpdates: { selection: null },
    };
  }

  undo(building: Building, _state: EditorState): CommandExecutionResult {
    if (!this.removedWindow || !this.floorId) return { building };
    const restoredBuilding = addWindow(building, this.floorId, {
      floorId: this.floorId,
      wallId: this.removedWindow.wallId,
      position: this.removedWindow.position,
      width: this.removedWindow.width,
      height: this.removedWindow.height,
      sillHeight: this.removedWindow.sillHeight,
      type: this.removedWindow.type,
      roomId: this.removedWindow.roomId,
    });
    return { building: restoredBuilding };
  }
}
