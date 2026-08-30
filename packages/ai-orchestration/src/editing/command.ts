import type {
  Building,
  CommandExecutionResult,
  EditorState,
  IEditorCommand,
  PlanVersion,
} from '@ai-floor-planner/core';
import { ChangeSource, createVersion, generateId } from '@ai-floor-planner/core';

/** One immutable, versioned editor transaction created from a validated preview. */
export class AIEditCommand implements IEditorCommand {
  readonly id = generateId();
  readonly affectedEntityId: string;
  readonly versionSnapshot: PlanVersion;

  constructor(
    readonly description: string,
    private readonly expectedBuilding: Building,
    private readonly validatedBuilding: Building,
    affectedEntityId: string,
    private readonly floorId: string,
  ) {
    this.affectedEntityId = affectedEntityId;
    this.versionSnapshot = createVersion(validatedBuilding, description, ChangeSource.AIEdit, 'ai-editor');
  }

  execute(building: Building, _state: EditorState): CommandExecutionResult {
    if (building !== this.expectedBuilding) {
      throw new Error('The plan changed after this AI edit was previewed. Preview the instruction again.');
    }
    return {
      building: this.validatedBuilding,
      stateUpdates: {
        activeFloorId: this.floorId,
        selection: { entityType: 'room', entityId: this.affectedEntityId, floorId: this.floorId },
      },
    };
  }

  undo(_building: Building, _state: EditorState): CommandExecutionResult {
    return {
      building: this.expectedBuilding,
      stateUpdates: {
        activeFloorId: this.floorId,
        selection: { entityType: 'room', entityId: this.affectedEntityId, floorId: this.floorId },
      },
    };
  }
}
