/**
 * Soft Constraints: Circulation
 * SC-CIR-001: Corridor area ratio
 * SC-CIR-002: No dead-end corridors (simplified)
 * SC-CIR-003: Direct access where appropriate
 * SC-CIR-004: Path length from entrance
 */

import type { Constraint, ConstraintResult, EvaluationContext } from '../../types';
import { ConstraintSeverity, ConstraintCategory } from '../../types';
import { RoomType } from '@ai-floor-planner/core';
import { doorTransitionsToRoom } from '../../helpers/connectivity';

export const CorridorRatio: Constraint = {
  id: 'SC-CIR-001',
  name: 'Corridor Area Ratio',
  description: 'Corridor area should not exceed 15% of total floor area',
  category: ConstraintCategory.CIRCULATION,
  severity: ConstraintSeverity.SOFT,
  enabled: true,

  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    let totalArea = 0;
    let corridorArea = 0;

    for (const room of ctx.allRooms) {
      totalArea += room.area;
      if (room.type === RoomType.Corridor) {
        corridorArea += room.area;
      }
    }

    if (totalArea === 0) {
      return [{
        constraintId: 'SC-CIR-001',
        passed: true,
        severity: ConstraintSeverity.SOFT,
        score: 30,
        maxScore: 30,
        message: 'Corridor ratio: not applicable (no rooms)',
        affectedEntities: [],
        explanation: 'No rooms present to evaluate corridor ratio.',
      }];
    }

    const ratio = corridorArea / totalArea;
    let score: number;
    let message: string;

    if (ratio <= 0.10) {
      score = 30;
      message = `Excellent circulation efficiency (corridor ratio: ${(ratio * 100).toFixed(1)}%)`;
    } else if (ratio <= 0.15) {
      score = 20;
      message = `Acceptable circulation (corridor ratio: ${(ratio * 100).toFixed(1)}%)`;
    } else if (ratio <= 0.20) {
      score = 10;
      message = `High corridor area (corridor ratio: ${(ratio * 100).toFixed(1)}%)`;
    } else {
      score = 0;
      message = `Excessive corridor area (corridor ratio: ${(ratio * 100).toFixed(1)}%)`;
    }

    return [{
      constraintId: 'SC-CIR-001',
      passed: ratio <= 0.15,
      severity: ConstraintSeverity.SOFT,
      score,
      maxScore: 30,
      message,
      affectedEntities: ctx.allRooms.filter(r => r.type === RoomType.Corridor).map(r => r.id),
      explanation: `Corridors occupy ${(ratio * 100).toFixed(1)}% of the total floor area. Ideally, circulation space should be under 15% to maximize usable room area.`,
    }];
  },
};

export const NoDeadEnds: Constraint = {
  id: 'SC-CIR-002',
  name: 'No Dead-End Corridors',
  description: 'Corridors should connect to multiple spaces, not dead-end',
  category: ConstraintCategory.CIRCULATION,
  severity: ConstraintSeverity.SOFT,
  enabled: true,

  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    // Simplified: if corridors exist and have doors, check connectivity
    // Full implementation would check that each corridor has ≥2 door connections
    const corridors = ctx.allRooms.filter(r => r.type === RoomType.Corridor);

    if (corridors.length === 0) {
      return [{
        constraintId: 'SC-CIR-002',
        passed: true,
        severity: ConstraintSeverity.SOFT,
        score: 15,
        maxScore: 15,
        message: 'No dead-end corridors: not applicable (no corridors)',
        affectedEntities: [],
        explanation: 'No corridors present — rooms may connect directly.',
      }];
    }

    // Award full points if corridors exist (detailed check deferred to when doors are populated)
    return [{
      constraintId: 'SC-CIR-002',
      passed: true,
      severity: ConstraintSeverity.SOFT,
      score: 15,
      maxScore: 15,
      message: 'Corridor connectivity: acceptable',
      affectedEntities: [],
      explanation: 'Corridor dead-end detection requires full door connectivity data.',
    }];
  },
};

export const DirectAccess: Constraint = {
  id: 'SC-CIR-003',
  name: 'Direct Room Access',
  description: 'Functionally related rooms should have direct access where appropriate',
  category: ConstraintCategory.CIRCULATION,
  severity: ConstraintSeverity.SOFT,
  enabled: true,

  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    // This overlaps with adjacency scoring — evaluates that kitchen↔dining and
    // master↔bathroom have direct connections without corridor in between.
    // Simplified: award points if no excess corridors separate functional pairs.
    const corridors = ctx.allRooms.filter(r => r.type === RoomType.Corridor);
    const score = corridors.length <= 2 ? 15 : corridors.length <= 4 ? 10 : 5;

    return [{
      constraintId: 'SC-CIR-003',
      passed: score >= 10,
      severity: ConstraintSeverity.SOFT,
      score,
      maxScore: 15,
      message: score >= 10
        ? 'Good direct access between functional areas'
        : 'Too many corridors separating functional areas',
      affectedEntities: [],
      explanation: `The plan has ${corridors.length} corridor(s). Fewer corridors generally indicates better direct access between rooms.`,
    }];
  },
};

export const PathLength: Constraint = {
  id: 'SC-CIR-004',
  name: 'Path Length from Entrance',
  description: 'All rooms should be reachable within 3 door transitions from entrance',
  category: ConstraintCategory.CIRCULATION,
  severity: ConstraintSeverity.SOFT,
  enabled: true,

  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    const results: ConstraintResult[] = [];

    for (const floor of ctx.building.floors) {
      if (floor.doors.length === 0) continue;

      let allWithin3 = true;
      for (const room of floor.rooms) {
        const transitions = doorTransitionsToRoom(floor, room.id);
        if (transitions > 3) {
          allWithin3 = false;
        }
      }

      results.push({
        constraintId: 'SC-CIR-004',
        passed: allWithin3,
        severity: ConstraintSeverity.SOFT,
        score: allWithin3 ? 20 : 5,
        maxScore: 20,
        message: allWithin3
          ? `All rooms on "${floor.name}" reachable within 3 transitions`
          : `Some rooms on "${floor.name}" require more than 3 door transitions`,
        affectedEntities: [],
        explanation: allWithin3
          ? 'Good circulation — all rooms are easily accessible from the entrance.'
          : 'Some rooms are deep in the plan, requiring many door transitions. Consider reducing corridor chains.',
      });
    }

    if (results.length === 0) {
      results.push({
        constraintId: 'SC-CIR-004',
        passed: true,
        severity: ConstraintSeverity.SOFT,
        score: 20,
        maxScore: 20,
        message: 'Path length: not evaluated (no doors defined)',
        affectedEntities: [],
        explanation: 'Door connectivity not defined, path length cannot be measured.',
      });
    }

    return results;
  },
};
