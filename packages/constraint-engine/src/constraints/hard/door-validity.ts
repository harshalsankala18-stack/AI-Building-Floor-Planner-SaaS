/**
 * Hard Constraints: Door Validity
 * HC-011: Every door must reference an existing wall.
 * HC-012: Door swing clearance (WARNING level).
 */

import type { Constraint, ConstraintResult, EvaluationContext } from '../../types';
import { ConstraintSeverity, ConstraintCategory } from '../../types';
import { validateDoorPlacement } from '@ai-floor-planner/geometry-engine';

const OUTSIDE_IDS = new Set(['', 'outside', '__outside__']);

function isFinitePoint(value: unknown): value is { x: number; y: number } {
  if (!value || typeof value !== 'object') return false;
  const point = value as { x?: unknown; y?: unknown };
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

export const DoorOnWall: Constraint = {
  id: 'HC-011',
  name: 'Door On Wall',
  description: 'Every door must be placed on an existing wall',
  category: ConstraintCategory.GEOMETRY,
  severity: ConstraintSeverity.HARD,
  enabled: true,

  evaluate(context: EvaluationContext): ConstraintResult[] {
    const results: ConstraintResult[] = [];

    for (const floor of context.building.floors) {
      if (floor.doors.length === 0) continue;

      const wallsById = new Map(floor.walls.map(wall => [wall.id, wall]));
      const roomIds = new Set(floor.rooms.map(room => room.id));

      for (const door of floor.doors) {
        const wall = wallsById.get(door.wallId);
        if (!wall) {
          results.push({
            constraintId: 'HC-011',
            passed: false,
            severity: ConstraintSeverity.HARD,
            score: 0,
            maxScore: 0,
            message: `A door on "${floor.name}" references a non-existent wall`,
            affectedEntities: [door.id],
            explanation: `Door ${door.id} references wall "${door.wallId}" which does not exist on "${floor.name}". The door must be placed on a valid wall segment.`,
            suggestedFixes: [{
              description: 'Place the door on an existing wall between the connected rooms',
              actionType: 'move',
              targetEntity: door.id,
              priority: 1,
            }],
          });
          continue;
        }

        if (door.floorId !== floor.id || wall.floorId !== floor.id) {
          results.push({
            constraintId: 'HC-011',
            passed: false,
            severity: ConstraintSeverity.HARD,
            score: 0,
            maxScore: 0,
            message: `Door "${door.id}" has inconsistent floor references`,
            affectedEntities: [door.id, wall.id],
            explanation: `The door, host wall, and containing floor must all reference "${floor.id}".`,
            suggestedFixes: [{
              description: 'Move the door to a wall on the same floor',
              actionType: 'move',
              targetEntity: door.id,
              priority: 1,
            }],
          });
        }

        const [fromRoomId, toRoomId] = door.connectsRooms;
        const fromOutside = OUTSIDE_IDS.has(fromRoomId);
        const toOutside = OUTSIDE_IDS.has(toRoomId);
        const invalidEndpoints =
          fromRoomId === toRoomId ||
          (fromOutside && toOutside) ||
          (!fromOutside && !roomIds.has(fromRoomId)) ||
          (!toOutside && !roomIds.has(toRoomId));

        if (invalidEndpoints) {
          results.push({
            constraintId: 'HC-011',
            passed: false,
            severity: ConstraintSeverity.HARD,
            score: 0,
            maxScore: 0,
            message: `Door "${door.id}" does not connect two valid spaces`,
            affectedEntities: [door.id],
            explanation: 'A door must connect two different rooms, or exactly one room and the outside. Both room references must exist on the same floor.',
            suggestedFixes: [{
              description: 'Assign the door to the actual spaces on both sides of its host wall',
              actionType: 'move',
              targetEntity: door.id,
              priority: 1,
            }],
          });
        }

        if (!isFinitePoint(door.position)) {
          results.push({
            constraintId: 'HC-011',
            passed: false,
            severity: ConstraintSeverity.HARD,
            score: 0,
            maxScore: 0,
            message: `Door "${door.id}" has an invalid position`,
            affectedEntities: [door.id],
            explanation: 'Door position must be a finite {x, y} coordinate on its host wall.',
            suggestedFixes: [{
              description: 'Place the door at a valid coordinate on its host wall',
              actionType: 'move',
              targetEntity: door.id,
              priority: 1,
            }],
          });
          continue;
        }

        const placement = validateDoorPlacement(door, wall);
        if (!placement.valid) {
          results.push({
            constraintId: 'HC-011',
            passed: false,
            severity: ConstraintSeverity.HARD,
            score: 0,
            maxScore: 0,
            message: `Door "${door.id}" is not valid on its host wall`,
            affectedEntities: [door.id, wall.id],
            explanation: placement.reason ?? 'The door opening does not fit on its host wall.',
            suggestedFixes: [{
              description: 'Move or resize the door so it fits entirely on its host wall',
              actionType: 'move',
              targetEntity: door.id,
              priority: 1,
            }],
          });
        }
      }
    }

    if (results.length === 0) {
      results.push({
        constraintId: 'HC-011',
        passed: true,
        severity: ConstraintSeverity.HARD,
        score: 0,
        maxScore: 0,
        message: 'All doors are placed on valid walls',
        affectedEntities: [],
        explanation: 'Every door references an existing wall, fits on that wall, and connects valid spaces on the same floor.',
      });
    }

    return results;
  },
};

export const DoorClearance: Constraint = {
  id: 'HC-012',
  name: 'Door Swing Clearance',
  description: 'Door swing arc should not be blocked',
  category: ConstraintCategory.ACCESSIBILITY,
  severity: ConstraintSeverity.WARNING,
  enabled: true,

  evaluate(_context: EvaluationContext): ConstraintResult[] {
    // For Phase 4 MVP: return pass. Full swing-arc collision is complex.
    // The geometry engine has isDoorSwingClear() but requires wall polygons.
    return [{
      constraintId: 'HC-012',
      passed: true,
      severity: ConstraintSeverity.WARNING,
      score: 10,
      maxScore: 10,
      message: 'Door swing clearance not fully validated in this phase',
      affectedEntities: [],
      explanation: 'Door swing clearance requires full wall polygon data. Deferred to interactive editor validation.',
    }];
  },
};
