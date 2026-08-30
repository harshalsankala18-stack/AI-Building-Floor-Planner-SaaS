/**
 * Hard Constraints: Stair Validity
 * HC-014: Stair connectsFloors must reference existing consecutive floors.
 * HC-016: Stair dimensions must meet minimums.
 */

import type { Constraint, ConstraintResult, EvaluationContext } from '../../types';
import { ConstraintSeverity, ConstraintCategory } from '../../types';

export const StairConnectivity: Constraint = {
  id: 'HC-014',
  name: 'Stair Connectivity',
  description: 'Stairs must connect two existing consecutive floor levels',
  category: ConstraintCategory.ACCESSIBILITY,
  severity: ConstraintSeverity.HARD,
  enabled: true,

  evaluate(context: EvaluationContext): ConstraintResult[] {
    const results: ConstraintResult[] = [];
    const floorLevels = new Set(context.building.floors.map(f => f.level));

    for (const floor of context.building.floors) {
      for (const stair of floor.stairs) {
        const [fromLevel, toLevel] = stair.connectsFloors;

        if (!floorLevels.has(fromLevel) || !floorLevels.has(toLevel)) {
          results.push({
            constraintId: 'HC-014',
            passed: false,
            severity: ConstraintSeverity.HARD,
            score: 0,
            maxScore: 0,
            message: `Staircase on "${floor.name}" connects to a non-existent floor level`,
            affectedEntities: [stair.id],
            explanation: `Staircase ${stair.id} declares connection between levels ${fromLevel} and ${toLevel}, but one or both levels do not exist in the building. Ensure both connected floors exist.`,
            suggestedFixes: [{
              description: 'Add the missing floor level or correct the stair connection',
              actionType: 'add',
              priority: 1,
            }],
          });
        } else if (Math.abs(toLevel - fromLevel) !== 1) {
          results.push({
            constraintId: 'HC-014',
            passed: false,
            severity: ConstraintSeverity.HARD,
            score: 0,
            maxScore: 0,
            message: `Staircase on "${floor.name}" connects non-consecutive floors (${fromLevel} to ${toLevel})`,
            affectedEntities: [stair.id],
            explanation: `Staircase ${stair.id} connects level ${fromLevel} to level ${toLevel}, which are not consecutive. Standard stairs connect adjacent floor levels.`,
            suggestedFixes: [{
              description: 'Connect the staircase to consecutive floor levels',
              actionType: 'reorient',
              targetEntity: stair.id,
              priority: 1,
            }],
          });
        }
      }
    }

    if (results.length === 0) {
      results.push({
        constraintId: 'HC-014',
        passed: true,
        severity: ConstraintSeverity.HARD,
        score: 0,
        maxScore: 0,
        message: 'All stairs connect valid consecutive floors',
        affectedEntities: [],
        explanation: 'Every staircase connects two existing consecutive floor levels.',
      });
    }

    return results;
  },
};

export const StairDimensions: Constraint = {
  id: 'HC-016',
  name: 'Stair Dimensions',
  description: 'Stair width and riser height must meet minimum requirements',
  category: ConstraintCategory.GEOMETRY,
  severity: ConstraintSeverity.HARD,
  enabled: true,

  evaluate(context: EvaluationContext): ConstraintResult[] {
    const results: ConstraintResult[] = [];
    const MIN_STAIR_WIDTH = 900; // mm
    const MAX_RISER_HEIGHT = 200; // mm

    for (const floor of context.building.floors) {
      for (const stair of floor.stairs) {
        if (stair.width < MIN_STAIR_WIDTH) {
          results.push({
            constraintId: 'HC-016',
            passed: false,
            severity: ConstraintSeverity.HARD,
            score: 0,
            maxScore: 0,
            message: `Staircase on "${floor.name}" is too narrow (${stair.width} mm, minimum: ${MIN_STAIR_WIDTH} mm)`,
            affectedEntities: [stair.id],
            explanation: `Staircase width is ${stair.width} mm but the minimum required width is ${MIN_STAIR_WIDTH} mm for safe passage.`,
            suggestedFixes: [{
              description: `Widen staircase to at least ${MIN_STAIR_WIDTH} mm`,
              actionType: 'resize',
              targetEntity: stair.id,
              priority: 1,
            }],
          });
        }

        if (stair.riserHeight > MAX_RISER_HEIGHT) {
          results.push({
            constraintId: 'HC-016',
            passed: false,
            severity: ConstraintSeverity.HARD,
            score: 0,
            maxScore: 0,
            message: `Staircase on "${floor.name}" has excessive riser height (${stair.riserHeight} mm, maximum: ${MAX_RISER_HEIGHT} mm)`,
            affectedEntities: [stair.id],
            explanation: `Riser height is ${stair.riserHeight} mm but should not exceed ${MAX_RISER_HEIGHT} mm for comfort and safety.`,
            suggestedFixes: [{
              description: `Reduce riser height to ${MAX_RISER_HEIGHT} mm or less (add more risers)`,
              actionType: 'resize',
              targetEntity: stair.id,
              priority: 2,
            }],
          });
        }
      }
    }

    if (results.length === 0) {
      results.push({
        constraintId: 'HC-016',
        passed: true,
        severity: ConstraintSeverity.HARD,
        score: 0,
        maxScore: 0,
        message: 'All stairs meet dimension requirements',
        affectedEntities: [],
        explanation: 'All staircase widths and riser heights are within acceptable limits.',
      });
    }

    return results;
  },
};
