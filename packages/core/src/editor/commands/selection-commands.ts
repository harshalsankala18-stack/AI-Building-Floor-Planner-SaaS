/**
 * Selection & View Commands.
 * These commands update editor state (such as selection or active floor) deterministically.
 */

import type { Building } from '../../types';
import { generateId } from '../../models/id';
import type { IEditorCommand, EditorState, CommandExecutionResult, EditorSelection, EditorTool } from '../types';

/** Select an entity on the canvas or in the tree. */
export class SelectEntityCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly affectedEntityId?: string;
  private prevSelection: EditorSelection | null = null;
  private newSelection: EditorSelection | null;

  constructor(selection: EditorSelection | null, description?: string) {
    this.id = generateId();
    this.newSelection = selection;
    this.affectedEntityId = selection?.entityId;
    this.description = description ?? (selection ? `Select ${selection.entityType} [${selection.entityId.slice(0, 8)}]` : 'Deselect');
  }

  execute(building: Building, state: EditorState): CommandExecutionResult {
    this.prevSelection = state.selection;
    return {
      building,
      stateUpdates: {
        selection: this.newSelection,
        selections: this.newSelection ? [this.newSelection] : [],
      },
    };
  }

  undo(building: Building, _state: EditorState): CommandExecutionResult {
    return {
      building,
      stateUpdates: {
        selection: this.prevSelection,
        selections: this.prevSelection ? [this.prevSelection] : [],
      },
    };
  }
}

/** Replace the current selection set while keeping a deterministic primary item. */
export class SetSelectionsCommand implements IEditorCommand {
  readonly id = generateId();
  readonly description = 'Update multi-selection';
  private readonly next: readonly EditorSelection[];
  private previous: readonly EditorSelection[] = [];

  constructor(selections: readonly EditorSelection[]) {
    this.next = [...selections];
  }

  execute(building: Building, state: EditorState): CommandExecutionResult {
    this.previous = state.selections ?? (state.selection ? [state.selection] : []);
    return { building, stateUpdates: { selections: this.next, selection: this.next.at(-1) ?? null } };
  }

  undo(building: Building, _state: EditorState): CommandExecutionResult {
    return { building, stateUpdates: { selections: this.previous, selection: this.previous.at(-1) ?? null } };
  }
}

/** Clear active selection. */
export class ClearSelectionCommand extends SelectEntityCommand {
  constructor() {
    super(null, 'Clear Selection');
  }
}

/** Switch active floor level. */
export class SwitchFloorCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly targetFloorId: string;
  private prevFloorId: string = '';
  private prevSelection: EditorSelection | null = null;

  constructor(targetFloorId: string, floorName?: string) {
    this.id = generateId();
    this.targetFloorId = targetFloorId;
    this.description = `Switch to ${floorName ?? 'Floor'}`;
  }

  execute(building: Building, state: EditorState): CommandExecutionResult {
    this.prevFloorId = state.activeFloorId;
    this.prevSelection = state.selection;

    if (!building.floors.some(floor => floor.id === this.targetFloorId)) {
      return { building, stateUpdates: {} };
    }

    // Clear selection if selected entity does not belong to target floor
    const shouldClearSelection = state.selection?.floorId && state.selection.floorId !== this.targetFloorId;

    return {
      building,
      stateUpdates: {
        activeFloorId: this.targetFloorId,
        selection: shouldClearSelection ? null : state.selection,
        selections: shouldClearSelection ? [] : (state.selections ?? []),
      },
    };
  }

  undo(building: Building, _state: EditorState): CommandExecutionResult {
    return {
      building,
      stateUpdates: {
        activeFloorId: this.prevFloorId,
        selection: this.prevSelection,
      },
    };
  }
}

/** Change active editor tool. */
export class SetToolCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly newTool: EditorTool;
  private prevTool: EditorTool = 'select';

  constructor(tool: EditorTool) {
    this.id = generateId();
    this.newTool = tool;
    this.description = `Activate tool: ${tool}`;
  }

  execute(building: Building, state: EditorState): CommandExecutionResult {
    this.prevTool = state.activeTool;
    return {
      building,
      stateUpdates: {
        activeTool: this.newTool,
      },
    };
  }

  undo(building: Building, _state: EditorState): CommandExecutionResult {
    return {
      building,
      stateUpdates: {
        activeTool: this.prevTool,
      },
    };
  }
}
