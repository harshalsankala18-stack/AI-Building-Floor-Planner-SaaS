/**
 * Hard Constraint: Minimum Room Size
 * HC-023: Every room must meet minimum area AND minimum dimension for its type.
 */

import type { Constraint, ConstraintResult, EvaluationContext } from '../../types';
import { ConstraintSeverity, ConstraintCategory } from '../../types';
import { sqMmToSqM, sqMmToSqFt } from '@ai-floor-planner/geometry-engine';

export const MinimumRoomSize: Constraint = {
  id: 'HC-023',
  name: 'Minimum Room Size',
  description: 'Every room must meet minimum area and dimension requirements for its type',
  category: ConstraintCategory.GEOMETRY,
  severity: ConstraintSeverity.HARD,
  enabled: true,

  evaluate(context: EvaluationContext): ConstraintResult[] {
    const results: ConstraintResult[] = [];
    const { minimumRoomSizes, minimumDimensions } = context.config;

    for (const floor of context.building.floors) {
      for (const room of floor.rooms) {
        // Check minimum area
        const minArea = minimumRoomSizes[room.type];
        if (minArea !== undefined && room.area < minArea) {
          const actualSqM = sqMmToSqM(room.area);
          const minSqM = sqMmToSqM(minArea);
          const actualSqFt = sqMmToSqFt(room.area);
          const minSqFt = sqMmToSqFt(minArea);

          results.push({
            constraintId: 'HC-023',
            passed: false,
            severity: ConstraintSeverity.HARD,
            score: 0,
            maxScore: 0,
            message: `"${room.name}" is too small (${actualSqFt.toFixed(0)} sq ft, minimum: ${minSqFt.toFixed(0)} sq ft for ${room.type})`,
            affectedEntities: [room.id],
            explanation: `"${room.name}" has an area of ${actualSqM.toFixed(1)} sq m (${actualSqFt.toFixed(0)} sq ft), which is below the minimum of ${minSqM.toFixed(1)} sq m (${minSqFt.toFixed(0)} sq ft) for a ${room.type}. Increase the room dimensions.`,
            suggestedFixes: [{
              description: `Increase "${room.name}" area to at least ${minSqM.toFixed(1)} sq m`,
              actionType: 'resize',
              targetEntity: room.id,
              priority: 1,
              parameters: { minimumArea: minArea },
            }],
          });
        }

        // Check minimum dimension
        const minDim = minimumDimensions[room.type];
        if (minDim !== undefined) {
          const smallest = Math.min(room.width, room.height);
          if (smallest < minDim) {
            results.push({
              constraintId: 'HC-023',
              passed: false,
              severity: ConstraintSeverity.HARD,
              score: 0,
              maxScore: 0,
              message: `"${room.name}" has a dimension too narrow (${smallest} mm, minimum: ${minDim} mm for ${room.type})`,
              affectedEntities: [room.id],
              explanation: `"${room.name}" has a minimum dimension of ${smallest} mm. For a ${room.type}, the shortest side must be at least ${minDim} mm. Widen the room.`,
              suggestedFixes: [{
                description: `Widen "${room.name}" to at least ${minDim} mm on the shortest side`,
                actionType: 'resize',
                targetEntity: room.id,
                priority: 1,
                parameters: { minimumDimension: minDim },
              }],
            });
          }
        }
      }
    }

    if (results.length === 0) {
      results.push({
        constraintId: 'HC-023',
        passed: true,
        severity: ConstraintSeverity.HARD,
        score: 0,
        maxScore: 0,
        message: 'All rooms meet minimum size requirements',
        affectedEntities: [],
        explanation: 'Every room meets the minimum area and dimension requirements for its type.',
      });
    }

    return results;
  },
};
