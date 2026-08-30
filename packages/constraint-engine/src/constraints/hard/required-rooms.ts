/**
 * Hard Constraint: Required Rooms
 * HC-020: All user-required room types must exist in the building.
 */

import type { Constraint, ConstraintResult, EvaluationContext } from '../../types';
import { ConstraintSeverity, ConstraintCategory } from '../../types';

export const RequiredRoomsPresent: Constraint = {
  id: 'HC-020',
  name: 'Required Rooms Present',
  description: 'All user-required room types must exist in the building',
  category: ConstraintCategory.PROGRAM,
  severity: ConstraintSeverity.HARD,
  enabled: true,

  evaluate(context: EvaluationContext): ConstraintResult[] {
    const results: ConstraintResult[] = [];
    const requiredCounts: Partial<Record<string, number>> = {
      ...Object.fromEntries(context.requiredRoomTypes.map(type => [type, 1])),
      ...context.requiredRoomCounts,
    };

    // If no requirements specified, constraint passes trivially
    if (Object.keys(requiredCounts).length === 0) {
      results.push({
        constraintId: 'HC-020',
        passed: true,
        severity: ConstraintSeverity.HARD,
        score: 0,
        maxScore: 0,
        message: 'No required room types specified',
        affectedEntities: [],
        explanation: 'No specific room types were required for this plan.',
      });
      return results;
    }

    // Collect all room types present in the building
    const presentCounts = new Map<string, number>();
    for (const floor of context.building.floors) {
      for (const room of floor.rooms) {
        presentCounts.set(room.type, (presentCounts.get(room.type) ?? 0) + 1);
      }
    }

    for (const [requiredType, rawRequiredCount] of Object.entries(requiredCounts)) {
      const requiredCount = Math.max(0, Math.floor(rawRequiredCount ?? 0));
      const presentCount = presentCounts.get(requiredType) ?? 0;
      if (presentCount < requiredCount) {
        const missingCount = requiredCount - presentCount;
        results.push({
          constraintId: 'HC-020',
          passed: false,
          severity: ConstraintSeverity.HARD,
          score: 0,
          maxScore: 0,
          message: presentCount === 0
            ? `Required room type "${requiredType}" is missing from the plan (0 of ${requiredCount} present)`
            : `Plan has ${presentCount} of ${requiredCount} required "${requiredType}" spaces`,
          affectedEntities: [],
          explanation: `The normalized room program requires ${requiredCount} "${requiredType}" spaces, but the plan contains ${presentCount}. Add ${missingCount} more.`,
          suggestedFixes: [{
            description: `Add ${missingCount} "${requiredType}" ${missingCount === 1 ? 'space' : 'spaces'} to the plan`,
            actionType: 'add',
            priority: 1,
            parameters: { roomType: requiredType, missingCount },
          }],
        });
      }
    }

    if (results.length === 0) {
      results.push({
        constraintId: 'HC-020',
        passed: true,
        severity: ConstraintSeverity.HARD,
        score: 0,
        maxScore: 0,
        message: 'All required room types are present',
        affectedEntities: [],
        explanation: 'Every required room type has at least one instance in the building.',
      });
    }

    return results;
  },
};
