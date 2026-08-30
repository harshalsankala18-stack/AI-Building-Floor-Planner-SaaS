/**
 * Hard Constraints: Accessibility
 * HC-010: Every room must be reachable from outside via doors.
 * HC-013: Every corridor must meet minimum width.
 */

import type { Constraint, ConstraintResult, EvaluationContext } from '../../types';
import { ConstraintSeverity, ConstraintCategory } from '../../types';
import { RoomType } from '@ai-floor-planner/core';
import { findUnreachableRooms } from '../../helpers/connectivity';

export const RoomAccessibility: Constraint = {
  id: 'HC-010',
  name: 'Room Accessibility',
  description: 'Every room must be reachable from the entrance via doors',
  category: ConstraintCategory.ACCESSIBILITY,
  severity: ConstraintSeverity.HARD,
  enabled: true,

  evaluate(context: EvaluationContext): ConstraintResult[] {
    const results: ConstraintResult[] = [];

    for (const floor of context.building.floors) {
      if (floor.rooms.length === 0) continue;

      if (context.allowIncompleteDraft && floor.doors.length === 0) continue;

      const unreachable = findUnreachableRooms(floor);

      for (const roomId of unreachable) {
        const room = floor.rooms.find(r => r.id === roomId);
        const roomName = room?.name ?? roomId;

        results.push({
          constraintId: 'HC-010',
          passed: false,
          severity: ConstraintSeverity.HARD,
          score: 0,
          maxScore: 0,
          message: `"${roomName}" is not reachable from the entrance`,
          affectedEntities: [roomId],
          explanation: `"${roomName}" on "${floor.name}" has no path connecting it to the entrance through doors. Add a door connecting this room to an adjacent accessible room.`,
          suggestedFixes: [{
            description: `Add a door connecting "${roomName}" to an adjacent accessible space`,
            actionType: 'add',
            targetEntity: roomId,
            priority: 1,
          }],
        });
      }
    }

    if (results.length === 0) {
      results.push({
        constraintId: 'HC-010',
        passed: true,
        severity: ConstraintSeverity.HARD,
        score: 0,
        maxScore: 0,
        message: 'All rooms are accessible',
        affectedEntities: [],
        explanation: 'Every room is reachable from the entrance via doors.',
      });
    }

    return results;
  },
};

export const CorridorWidth: Constraint = {
  id: 'HC-013',
  name: 'Corridor Width',
  description: 'Every corridor must meet minimum width requirement',
  category: ConstraintCategory.ACCESSIBILITY,
  severity: ConstraintSeverity.HARD,
  enabled: true,

  evaluate(context: EvaluationContext): ConstraintResult[] {
    const results: ConstraintResult[] = [];
    const minWidth = context.config.minimumCorridorWidth;

    for (const floor of context.building.floors) {
      for (const room of floor.rooms) {
        if (room.type !== RoomType.Corridor) continue;

        const smallestDim = Math.min(room.width, room.height);
        if (smallestDim < minWidth) {
          results.push({
            constraintId: 'HC-013',
            passed: false,
            severity: ConstraintSeverity.HARD,
            score: 0,
            maxScore: 0,
            message: `Corridor "${room.name}" is too narrow (${smallestDim} mm, minimum: ${minWidth} mm)`,
            affectedEntities: [room.id],
            explanation: `"${room.name}" has a minimum dimension of ${smallestDim} mm, which is below the required ${minWidth} mm for corridors. Widen the corridor to meet accessibility requirements.`,
            suggestedFixes: [{
              description: `Widen "${room.name}" to at least ${minWidth} mm`,
              actionType: 'resize',
              targetEntity: room.id,
              priority: 2,
            }],
          });
        }
      }
    }

    if (results.length === 0) {
      results.push({
        constraintId: 'HC-013',
        passed: true,
        severity: ConstraintSeverity.HARD,
        score: 0,
        maxScore: 0,
        message: 'All corridors meet minimum width',
        affectedEntities: [],
        explanation: 'All corridors have adequate width for circulation.',
      });
    }

    return results;
  },
};
