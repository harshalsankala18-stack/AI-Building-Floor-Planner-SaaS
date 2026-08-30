import { polygonArea } from '@ai-floor-planner/geometry-engine';
import type { Constraint, ConstraintResult, EvaluationContext } from '../../types';
import { ConstraintCategory, ConstraintSeverity } from '../../types';

const WARNING_THRESHOLD = 0.35;

/** Penalizes unexplained residual floor area without forcing total coverage. */
export const FloorSpaceUtilization: Constraint = {
  id: 'SC-EFF-001',
  name: 'Floor Space Utilization',
  description: 'Each floor should avoid excessive unallocated residual area',
  category: ConstraintCategory.FUNCTIONAL_ZONING,
  severity: ConstraintSeverity.SOFT,
  enabled: true,

  evaluate(context: EvaluationContext): ConstraintResult[] {
    return context.building.floors.map(floor => {
      const floorArea = polygonArea(floor.boundary);
      const assignedArea = floor.rooms.reduce((sum, room) => sum + room.area, 0);
      const unusedRatio = floorArea > 0 ? Math.max(0, floorArea - assignedArea) / floorArea : 1;
      const passed = unusedRatio <= WARNING_THRESHOLD;
      const score = Math.max(0, Math.round(20 * (1 - Math.max(0, unusedRatio - 0.1) / 0.5)));
      return {
        constraintId: 'SC-EFF-001',
        passed,
        severity: ConstraintSeverity.SOFT,
        score,
        maxScore: 20,
        message: passed
          ? `${floor.name} uses ${Math.round((1 - unusedRatio) * 100)}% of its floor boundary`
          : `${floor.name} has ${Math.round(unusedRatio * 100)}% unexplained unused area`,
        affectedEntities: passed ? [] : [floor.id],
        explanation: passed
          ? 'Residual area is within the schematic planning allowance.'
          : 'This area is not represented as a room, circulation space, terrace, void, or other intentional use.',
        suggestedFixes: passed ? undefined : [{
          description: `Redistribute rooms or reduce ${floor.name}'s footprint`,
          actionType: 'resize' as const,
          targetEntity: floor.id,
          priority: 4,
        }],
      };
    });
  },
};
