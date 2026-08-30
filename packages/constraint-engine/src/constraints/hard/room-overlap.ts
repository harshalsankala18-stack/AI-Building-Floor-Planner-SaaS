/**
 * Hard Constraint: Room Overlap
 * HC-003: No two rooms on the same floor may overlap beyond tolerance.
 */

import type { Constraint, ConstraintResult, EvaluationContext } from '../../types';
import { ConstraintSeverity, ConstraintCategory } from '../../types';
import { polygonIntersectionArea } from '@ai-floor-planner/geometry-engine';
import { TOLERANCES } from '@ai-floor-planner/core';
import { sqMmToSqFt } from '@ai-floor-planner/geometry-engine';

export const NoIllegalOverlap: Constraint = {
  id: 'HC-003',
  name: 'No Illegal Overlap',
  description: 'No two rooms on the same floor may overlap beyond tolerance',
  category: ConstraintCategory.GEOMETRY,
  severity: ConstraintSeverity.HARD,
  enabled: true,

  evaluate(context: EvaluationContext): ConstraintResult[] {
    const results: ConstraintResult[] = [];

    for (const floor of context.building.floors) {
      const rooms = floor.rooms;

      for (let i = 0; i < rooms.length; i++) {
        for (let j = i + 1; j < rooms.length; j++) {
          const a = rooms[i]!;
          const b = rooms[j]!;

          const overlapArea = polygonIntersectionArea(a.boundary, b.boundary);

          if (overlapArea > TOLERANCES.OVERLAP) {
            const sqFt = sqMmToSqFt(overlapArea);

            results.push({
              constraintId: 'HC-003',
              passed: false,
              severity: ConstraintSeverity.HARD,
              score: 0,
              maxScore: 0,
              message: `"${a.name}" overlaps "${b.name}" by approximately ${sqFt.toFixed(1)} sq ft`,
              affectedEntities: [a.id, b.id],
              explanation: `The boundary of "${a.name}" intersects with the boundary of "${b.name}". The overlapping region has an area of approximately ${sqFt.toFixed(1)} sq ft (${Math.round(overlapArea)} sq mm). Move one of the rooms so their boundaries do not overlap.`,
              suggestedFixes: [
                {
                  description: `Move "${b.name}" away from "${a.name}" to eliminate overlap`,
                  actionType: 'move',
                  targetEntity: b.id,
                  priority: 1,
                },
              ],
            });
          }
        }
      }
    }

    if (results.length === 0) {
      results.push({
        constraintId: 'HC-003',
        passed: true,
        severity: ConstraintSeverity.HARD,
        score: 0,
        maxScore: 0,
        message: 'No rooms overlap',
        affectedEntities: [],
        explanation: 'All rooms have non-overlapping boundaries.',
      });
    }

    return results;
  },
};
