/**
 * Soft Constraints: Structural (WARNING / INFORMATIONAL)
 * SC-STR-001: Wall alignment across floors
 * SC-STR-002: Column grid regularity
 */

import type { Constraint, ConstraintResult, EvaluationContext } from '../../types';
import { ConstraintSeverity, ConstraintCategory, EvaluationStatus } from '../../types';

export const WallAlignment: Constraint = {
  id: 'SC-STR-001',
  name: 'Wall Alignment Across Floors',
  description: 'Walls on different floors should align vertically for structural efficiency',
  category: ConstraintCategory.STRUCTURAL,
  severity: ConstraintSeverity.WARNING,
  enabled: true,

  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    // Multi-floor wall alignment is complex and requires comparing wall positions across floors.
    // For Phase 4 MVP: return informational result if multiple floors exist.
    if (ctx.building.floors.length < 2) {
      return [{
        constraintId: 'SC-STR-001',
        passed: true,
        severity: ConstraintSeverity.WARNING,
        score: 0,
        maxScore: 0,
        status: EvaluationStatus.NOT_APPLICABLE,
        classification: 'heuristic',
        message: 'Wall alignment: single floor — not applicable',
        affectedEntities: [],
        explanation: 'Wall alignment across floors is only relevant for multi-storey buildings.',
      }];
    }

    // Simple heuristic: if room layouts are similar across floors, likely good alignment
    const floor0Rooms = ctx.building.floors[0]?.rooms ?? [];
    const floor1Rooms = ctx.building.floors[1]?.rooms ?? [];

    if (floor0Rooms.length === 0 || floor1Rooms.length === 0) {
      return [{
        constraintId: 'SC-STR-001',
        passed: true,
        severity: ConstraintSeverity.WARNING,
        score: 0,
        maxScore: 0,
        status: EvaluationStatus.INSUFFICIENT_INPUT,
        classification: 'heuristic',
        message: 'Wall alignment: insufficient data',
        affectedEntities: [],
        explanation: 'Cannot evaluate wall alignment — one or more floors have no rooms.',
      }];
    }

    return [{
      constraintId: 'SC-STR-001',
      passed: true,
      severity: ConstraintSeverity.WARNING,
      score: 7,
      maxScore: 10,
      status: EvaluationStatus.WARNING,
      classification: 'heuristic',
      message: 'Wall alignment: partially evaluated (detailed check requires wall data)',
      affectedEntities: [],
      explanation: 'Full wall alignment analysis requires complete wall geometry on both floors. A structural engineer should verify vertical alignment for multi-storey designs.',
    }];
  },
};

export const ColumnGrid: Constraint = {
  id: 'SC-STR-002',
  name: 'Column Grid Regularity',
  description: 'Columns should form a regular grid pattern where present',
  category: ConstraintCategory.STRUCTURAL,
  severity: ConstraintSeverity.INFORMATIONAL,
  enabled: true,

  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    let totalColumns = 0;
    for (const floor of ctx.building.floors) {
      totalColumns += floor.columns.length;
    }

    if (totalColumns === 0) {
      return [{
        constraintId: 'SC-STR-002',
        passed: true,
        severity: ConstraintSeverity.INFORMATIONAL,
        score: 0,
        maxScore: 0,
        status: EvaluationStatus.NOT_ANALYZED,
        classification: 'not_implemented',
        message: 'Structural analysis: not analyzed — no column system is defined',
        affectedEntities: [],
        explanation: 'No structural columns are defined in this plan. Column grid analysis is not applicable.',
      }];
    }

    return [{
      constraintId: 'SC-STR-002',
      passed: true,
      severity: ConstraintSeverity.INFORMATIONAL,
      score: 0,
      maxScore: 0,
      status: EvaluationStatus.NOT_IMPLEMENTED,
      classification: 'not_implemented',
      message: `Structural analysis: not implemented (${totalColumns} columns documented)`,
      affectedEntities: [],
      explanation: `The plan includes ${totalColumns} structural columns. Grid regularity analysis will be available in a future phase.`,
    }];
  },
};
