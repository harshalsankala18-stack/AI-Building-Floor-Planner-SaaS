/**
 * Hard Constraint: Floor Consistency
 * HC-030: Every entity belongs to its parent floor and only references entities on that floor.
 */

import type { Constraint, ConstraintResult, EvaluationContext } from '../../types';
import { ConstraintSeverity, ConstraintCategory } from '../../types';

export const FloorRoomConsistency: Constraint = {
  id: 'HC-030',
  name: 'Floor Entity Consistency',
  description: 'Every entity must belong to and reference entities on its parent floor',
  category: ConstraintCategory.PROGRAM,
  severity: ConstraintSeverity.HARD,
  enabled: true,

  evaluate(context: EvaluationContext): ConstraintResult[] {
    const results: ConstraintResult[] = [];

    for (const floor of context.building.floors) {
      const roomIds = new Set(floor.rooms.map(room => room.id));
      const wallIds = new Set(floor.walls.map(wall => wall.id));
      const collections = [floor.rooms, floor.walls, floor.doors, floor.windows, floor.stairs, floor.columns] as const;
      for (const entities of collections) {
        for (const entity of entities) {
          if (entity.floorId === floor.id) continue;
          results.push({
            constraintId: 'HC-030',
            passed: false,
            severity: ConstraintSeverity.HARD,
            score: 0,
            maxScore: 0,
            message: `Entity "${entity.id}" has mismatched floorId (expected "${floor.id}", found "${entity.floorId}")`,
            affectedEntities: [entity.id],
            explanation: `The entity is listed on "${floor.name}" but its floorId points to a different floor.`,
            suggestedFixes: [{
              description: `Correct the entity floorId to "${floor.id}"`,
              actionType: 'move',
              targetEntity: entity.id,
              priority: 3,
            }],
          });
        }
      }

      const addReferenceFailure = (entityId: string, reference: string, kind: string) => {
        results.push({
          constraintId: 'HC-030', passed: false, severity: ConstraintSeverity.HARD,
          score: 0, maxScore: 0,
          message: `${kind} "${entityId}" references "${reference}" outside "${floor.name}"`,
          affectedEntities: [entityId],
          explanation: `Reference "${reference}" cannot be resolved within the parent floor.`,
          suggestedFixes: [{ description: 'Repair or remove the cross-floor reference', actionType: 'move', targetEntity: entityId, priority: 3 }],
        });
      };
      for (const wall of floor.walls) {
        (wall.roomIds ?? []).filter(roomId => !roomIds.has(roomId)).forEach(roomId => addReferenceFailure(wall.id, roomId, 'Wall'));
      }
      for (const door of floor.doors) {
        if (!wallIds.has(door.wallId)) addReferenceFailure(door.id, door.wallId, 'Door');
        (door.connectsRooms ?? []).filter(roomId => roomId !== '' && roomId !== 'exterior' && roomId !== '__outside__' && !roomIds.has(roomId))
          .forEach(roomId => addReferenceFailure(door.id, roomId, 'Door'));
      }
      for (const window of floor.windows) {
        if (!wallIds.has(window.wallId)) addReferenceFailure(window.id, window.wallId, 'Window');
        if (!roomIds.has(window.roomId)) addReferenceFailure(window.id, window.roomId, 'Window');
      }
    }

    if (results.length === 0) {
      results.push({
        constraintId: 'HC-030',
        passed: true,
        severity: ConstraintSeverity.HARD,
        score: 0,
        maxScore: 0,
        message: 'All floor entities and references are consistent',
        affectedEntities: [],
        explanation: 'Every entity belongs to its parent floor and all local references resolve on that floor.',
      });
    }

    return results;
  },
};
