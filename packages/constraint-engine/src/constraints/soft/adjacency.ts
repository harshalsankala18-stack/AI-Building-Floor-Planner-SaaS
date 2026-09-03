/**
 * Soft Constraints: Adjacency
 * SC-ADJ-001: Kitchen adjacent to dining
 * SC-ADJ-002: Dining adjacent to living
 * SC-ADJ-003: Master bedroom adjacent to bathroom
 * SC-ADJ-004: Utility adjacent to kitchen
 * SC-ADJ-005: Parking adjacent to entrance zone
 * SC-ADJ-006: Pooja accessible from living
 */

import type { Constraint, ConstraintResult, EvaluationContext } from '../../types';
import { ConstraintSeverity, ConstraintCategory } from '../../types';
import { RoomType } from '@ai-floor-planner/core';
import { polygonsAdjacent } from '@ai-floor-planner/geometry-engine';
import { getMasterBedroom, getRoomsByType } from '../../helpers/room-queries';

function adjacencyCheck(
  id: string,
  name: string,
  _description: string,
  sourceType: RoomType,
  targetType: RoomType,
  maxScore: number,
  context: EvaluationContext,
): ConstraintResult {
  const sources = getRoomsByType(context.building, sourceType);
  const targets = getRoomsByType(context.building, targetType);

  if (sources.length === 0 || targets.length === 0) {
    return {
      constraintId: id,
      passed: true,
      severity: ConstraintSeverity.SOFT,
      score: maxScore,
      maxScore,
      message: `${name}: not applicable (missing room type)`,
      affectedEntities: [],
      explanation: `Cannot evaluate ${name.toLowerCase()} because one or both room types are not present in the plan.`,
    };
  }

  let found = false;
  for (const s of sources) {
    for (const t of targets) {
      if (s.floorId === t.floorId && polygonsAdjacent(s.boundary, t.boundary)) {
        found = true;
        break;
      }
    }
    if (found) break;
  }

  if (found) {
    return {
      constraintId: id,
      passed: true,
      severity: ConstraintSeverity.SOFT,
      score: maxScore,
      maxScore,
      message: `${name}: satisfied`,
      affectedEntities: [],
      explanation: `At least one ${sourceType} is adjacent to a ${targetType}, supporting good functional flow.`,
    };
  }

  return {
    constraintId: id,
    passed: false,
    severity: ConstraintSeverity.SOFT,
    score: 0,
    maxScore,
    message: `${name}: ${sourceType} is not adjacent to ${targetType}`,
    affectedEntities: [...sources.map(r => r.id), ...targets.map(r => r.id)],
    explanation: `No ${sourceType} shares a wall with any ${targetType}. For better workflow, place these rooms adjacent to each other.`,
    suggestedFixes: [{
      description: `Move ${sourceType} adjacent to ${targetType}`,
      actionType: 'move',
      targetEntity: sources[0]?.id,
      priority: 2,
    }],
  };
}

export const KitchenDining: Constraint = {
  id: 'SC-ADJ-001',
  name: 'Kitchen-Dining Adjacency',
  description: 'Kitchen should be adjacent to dining for workflow efficiency',
  category: ConstraintCategory.ACCESSIBILITY,
  severity: ConstraintSeverity.SOFT,
  enabled: true,
  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    return [adjacencyCheck('SC-ADJ-001', 'Kitchen-Dining Adjacency', this.description, RoomType.Kitchen, RoomType.Dining, 20, ctx)];
  },
};

export const DiningLiving: Constraint = {
  id: 'SC-ADJ-002',
  name: 'Dining-Living Adjacency',
  description: 'Dining should be adjacent to living for social flow',
  category: ConstraintCategory.ACCESSIBILITY,
  severity: ConstraintSeverity.SOFT,
  enabled: true,
  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    return [adjacencyCheck('SC-ADJ-002', 'Dining-Living Adjacency', this.description, RoomType.Dining, RoomType.Living, 15, ctx)];
  },
};

export const MasterBathroom: Constraint = {
  id: 'SC-ADJ-003',
  name: 'Master Bedroom-Bathroom Adjacency',
  description: 'Master bedroom should have an attached bathroom',
  category: ConstraintCategory.ACCESSIBILITY,
  severity: ConstraintSeverity.SOFT,
  enabled: true,
  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    const master = getMasterBedroom(ctx.building);
    const bathrooms = getRoomsByType(ctx.building, RoomType.Bathroom);

    if (!master || bathrooms.length === 0) {
      return [{
        constraintId: 'SC-ADJ-003',
        passed: true,
        severity: ConstraintSeverity.SOFT,
        score: 20,
        maxScore: 20,
        message: 'Master-Bathroom: not applicable',
        affectedEntities: [],
        explanation: 'No master bedroom or bathroom present.',
      }];
    }

    const hasAttached = bathrooms.some(b =>
      b.floorId === master.floorId && polygonsAdjacent(master.boundary, b.boundary),
    );

    return [{
      constraintId: 'SC-ADJ-003',
      passed: hasAttached,
      severity: ConstraintSeverity.SOFT,
      score: hasAttached ? 20 : 0,
      maxScore: 20,
      message: hasAttached
        ? 'Master bedroom has attached bathroom'
        : 'Master bedroom lacks attached bathroom',
      affectedEntities: hasAttached ? [] : [master.id],
      explanation: hasAttached
        ? 'The master bedroom is adjacent to a bathroom, providing convenience.'
        : 'The master bedroom has no adjacent bathroom. Place a bathroom next to the master bedroom.',
      suggestedFixes: hasAttached ? undefined : [{
        description: 'Place a bathroom adjacent to the master bedroom',
        actionType: 'move',
        priority: 2,
      }],
    }];
  },
};

export const UtilityKitchen: Constraint = {
  id: 'SC-ADJ-004',
  name: 'Utility-Kitchen Adjacency',
  description: 'Utility room should be near the kitchen',
  category: ConstraintCategory.ACCESSIBILITY,
  severity: ConstraintSeverity.SOFT,
  enabled: true,
  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    return [adjacencyCheck('SC-ADJ-004', 'Utility-Kitchen Adjacency', this.description, RoomType.Utility, RoomType.Kitchen, 10, ctx)];
  },
};

export const ParkingEntrance: Constraint = {
  id: 'SC-ADJ-005',
  name: 'Parking-Entrance Adjacency',
  description: 'Parking should be near the entrance/foyer',
  category: ConstraintCategory.ACCESSIBILITY,
  severity: ConstraintSeverity.SOFT,
  enabled: true,
  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    return [adjacencyCheck('SC-ADJ-005', 'Parking-Entrance Adjacency', this.description, RoomType.Parking, RoomType.Foyer, 10, ctx)];
  },
};

export const PoojaAccess: Constraint = {
  id: 'SC-ADJ-006',
  name: 'Pooja-Living Access',
  description: 'Pooja room should be accessible from living area',
  category: ConstraintCategory.ACCESSIBILITY,
  severity: ConstraintSeverity.SOFT,
  enabled: true,
  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    return [adjacencyCheck('SC-ADJ-006', 'Pooja-Living Access', this.description, RoomType.Pooja, RoomType.Living, 5, ctx)];
  },
};
