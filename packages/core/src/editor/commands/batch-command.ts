/**
 * Batch / Compound Command.
 * Executes multiple commands atomically as a single reversible transaction in history.
 */

import type { Building } from '../../types';
import { generateId } from '../../models/id';
import type { IEditorCommand, EditorState, CommandExecutionResult } from '../types';

export class BatchCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly commands: readonly IEditorCommand[];

  constructor(description: string, commands: IEditorCommand[]) {
    this.id = generateId();
    this.description = description;
    this.commands = [...commands];
  }

  execute(building: Building, state: EditorState): CommandExecutionResult {
    let currentBuilding = building;
    let accumulatedStateUpdates: Partial<EditorState> = {};

    for (const cmd of this.commands) {
      const result = cmd.execute(currentBuilding, {
        ...state,
        ...accumulatedStateUpdates,
      });
      currentBuilding = result.building;
      if (result.stateUpdates) {
        accumulatedStateUpdates = {
          ...accumulatedStateUpdates,
          ...result.stateUpdates,
        };
      }
    }

    return {
      building: currentBuilding,
      stateUpdates: accumulatedStateUpdates,
    };
  }

  undo(building: Building, state: EditorState): CommandExecutionResult {
    let currentBuilding = building;
    let accumulatedStateUpdates: Partial<EditorState> = {};

    // Undo commands in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      const cmd = this.commands[i]!;
      const result = cmd.undo(currentBuilding, {
        ...state,
        ...accumulatedStateUpdates,
      });
      currentBuilding = result.building;
      if (result.stateUpdates) {
        accumulatedStateUpdates = {
          ...accumulatedStateUpdates,
          ...result.stateUpdates,
        };
      }
    }

    return {
      building: currentBuilding,
      stateUpdates: accumulatedStateUpdates,
    };
  }
}
