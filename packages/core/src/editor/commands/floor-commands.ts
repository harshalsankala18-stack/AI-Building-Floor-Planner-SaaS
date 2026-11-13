/**
 * Floor Management Commands.
 * Handles adding and removing building levels with vertical circulation awareness.
 */

import type { Building, Floor } from '../../types';
import { generateId } from '../../models/id';
import { addFloorToBuilding, removeFloorFromBuilding, updateEntity } from '../../models/updaters';
import type { IEditorCommand, EditorState, CommandExecutionResult } from '../types';

export interface AddFloorParams {
  name?: string;
  floorHeight?: number;
}

/** Command to append a new floor level to the building model. */
export class AddFloorCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly affectedEntityId?: string;
  private prevBuilding: Building | null = null;
  private prevFloorId: string = '';
  private params?: AddFloorParams;

  constructor(params?: AddFloorParams, description?: string) {
    this.id = generateId();
    this.params = params;
    this.description = description ?? `Add ${params?.name ?? 'Floor'}`;
  }

  execute(building: Building, state: EditorState): CommandExecutionResult {
    this.prevBuilding = building;
    this.prevFloorId = state.activeFloorId;

    const { building: nextBuilding, floor } = addFloorToBuilding(building, this.params);

    return {
      building: nextBuilding,
      stateUpdates: {
        activeFloorId: floor.id,
        selection: null,
        selections: [],
      },
    };
  }

  undo(building: Building, _state: EditorState): CommandExecutionResult {
    if (!this.prevBuilding) return { building, stateUpdates: {} };
    return {
      building: this.prevBuilding,
      stateUpdates: {
        activeFloorId: this.prevFloorId || (this.prevBuilding.floors[0]?.id ?? ''),
        selection: null,
        selections: [],
      },
    };
  }
}

/** Command to remove a floor level from the building. */
export class RemoveFloorCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly targetFloorId: string;
  private prevBuilding: Building | null = null;
  private prevFloorId: string = '';

  constructor(targetFloorId: string, description?: string) {
    this.id = generateId();
    this.targetFloorId = targetFloorId;
    this.description = description ?? 'Remove Floor';
  }

  execute(building: Building, state: EditorState): CommandExecutionResult {
    this.prevBuilding = building;
    this.prevFloorId = state.activeFloorId;

    if (building.floors.length <= 1) {
      return { building, stateUpdates: {} };
    }

    const nextBuilding = removeFloorFromBuilding(building, this.targetFloorId);
    const nextActiveFloorId = state.activeFloorId === this.targetFloorId
      ? nextBuilding.floors[0]!.id
      : state.activeFloorId;

    return {
      building: nextBuilding,
      stateUpdates: {
        activeFloorId: nextActiveFloorId,
        selection: null,
        selections: [],
      },
    };
  }

  undo(building: Building, _state: EditorState): CommandExecutionResult {
    if (!this.prevBuilding) return { building, stateUpdates: {} };
    return {
      building: this.prevBuilding,
      stateUpdates: {
        activeFloorId: this.prevFloorId,
        selection: null,
        selections: [],
      },
    };
  }
}

/** Command to update a floor's name or clear floor height (mm). */
export class UpdateFloorPropertiesCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly affectedEntityId: string;
  private previous?: Partial<Pick<Floor, 'name' | 'floorHeight'>>;

  constructor(
    readonly floorId: string,
    readonly updates: Partial<Pick<Floor, 'name' | 'floorHeight'>>,
  ) {
    this.id = generateId();
    this.affectedEntityId = floorId;
    this.description = `Update floor ${updates.name ?? ''} properties`.trim();
  }

  execute(building: Building, _state: EditorState): CommandExecutionResult {
    const floor = building.floors.find(f => f.id === this.floorId);
    if (!floor) return { building };

    this.previous = {
      ...(this.updates.name !== undefined ? { name: floor.name } : {}),
      ...(this.updates.floorHeight !== undefined ? { floorHeight: floor.floorHeight } : {}),
    };

    const sanitized: Partial<Pick<Floor, 'name' | 'floorHeight'>> = {
      ...this.updates,
      ...(this.updates.floorHeight !== undefined
        ? { floorHeight: Math.max(2100, Math.min(6000, Math.round(this.updates.floorHeight))) }
        : {}),
    };

    return {
      building: updateEntity(building, 'floor', this.floorId, sanitized),
    };
  }

  undo(building: Building, _state: EditorState): CommandExecutionResult {
    if (!this.previous) return { building };
    return {
      building: updateEntity(building, 'floor', this.floorId, this.previous),
    };
  }
}
