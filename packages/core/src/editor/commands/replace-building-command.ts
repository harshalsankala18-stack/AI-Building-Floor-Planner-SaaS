import type { Building } from '../../types';
import { generateId } from '../../models/id';
import type { CommandExecutionResult, EditorState, IEditorCommand } from '../types';

/** Atomically applies an already-validated Building snapshot as one undoable action. */
export class ReplaceBuildingCommand implements IEditorCommand {
  readonly id = generateId();
  readonly description: string;
  private readonly before: Building;
  private readonly after: Building;

  constructor(before: Building, after: Building, description = 'Targeted regeneration') {
    this.before = before;
    this.after = after;
    this.description = description;
  }

  execute(_building: Building, _state: EditorState): CommandExecutionResult {
    return { building: this.after };
  }

  undo(_building: Building, _state: EditorState): CommandExecutionResult {
    return { building: this.before };
  }
}
