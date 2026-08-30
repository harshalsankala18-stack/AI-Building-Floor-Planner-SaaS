/**
 * Soft Constraints: Geometry / Proportion
 * SC-GEO-001: Room aspect ratios
 * SC-GEO-002: Room size within range
 * SC-GEO-003: Bedroom size balance
 */

import type { Constraint, ConstraintResult, EvaluationContext } from '../../types';
import { ConstraintSeverity, ConstraintCategory } from '../../types';
import { RoomType } from '@ai-floor-planner/core';

export const AspectRatio: Constraint = {
  id: 'SC-GEO-001',
  name: 'Room Aspect Ratios',
  description: 'Rooms should have reasonable proportions (ideally ≤ 2:1)',
  category: ConstraintCategory.GEOMETRY,
  severity: ConstraintSeverity.SOFT,
  enabled: true,

  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    const results: ConstraintResult[] = [];

    for (const room of ctx.allRooms) {
      const aspect = room.width > room.height
        ? room.width / room.height
        : room.height / room.width;

      let score: number;
      let message: string;

      if (aspect <= 2.0) {
        score = 10;
        message = `"${room.name}" has good proportions (${aspect.toFixed(1)}:1)`;
      } else if (aspect <= 3.0) {
        score = 5;
        message = `"${room.name}" is somewhat elongated (${aspect.toFixed(1)}:1)`;
      } else {
        score = 0;
        message = `"${room.name}" is excessively elongated (${aspect.toFixed(1)}:1)`;
      }

      results.push({
        constraintId: 'SC-GEO-001',
        passed: aspect <= 2.0,
        severity: ConstraintSeverity.SOFT,
        score,
        maxScore: 10,
        message,
        affectedEntities: aspect > 2.0 ? [room.id] : [],
        explanation: aspect <= 2.0
          ? `"${room.name}" has a balanced ${aspect.toFixed(1)}:1 aspect ratio, ideal for furniture placement.`
          : `"${room.name}" has an aspect ratio of ${aspect.toFixed(1)}:1. Ratios above 2:1 make rooms feel corridor-like and limit furniture arrangement.`,
        suggestedFixes: aspect > 2.0 ? [{
          description: `Adjust "${room.name}" to a more balanced proportion`,
          actionType: 'resize',
          targetEntity: room.id,
          priority: 3,
        }] : undefined,
      });
    }

    if (results.length === 0) {
      results.push({
        constraintId: 'SC-GEO-001',
        passed: true,
        severity: ConstraintSeverity.SOFT,
        score: 10,
        maxScore: 10,
        message: 'No rooms to evaluate aspect ratios',
        affectedEntities: [],
        explanation: 'No rooms present.',
      });
    }

    return results;
  },
};

export const RoomSizeRange: Constraint = {
  id: 'SC-GEO-002',
  name: 'Room Size Within Range',
  description: 'Room areas should be within configured min/max for their type',
  category: ConstraintCategory.GEOMETRY,
  severity: ConstraintSeverity.SOFT,
  enabled: true,

  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    const results: ConstraintResult[] = [];

    for (const room of ctx.allRooms) {
      const withinRange =
        (room.minArea === undefined || room.area >= room.minArea) &&
        (room.maxArea === undefined || room.area <= room.maxArea);

      results.push({
        constraintId: 'SC-GEO-002',
        passed: withinRange,
        severity: ConstraintSeverity.SOFT,
        score: withinRange ? 10 : 3,
        maxScore: 10,
        message: withinRange
          ? `"${room.name}" is within target size range`
          : `"${room.name}" is outside target size range`,
        affectedEntities: withinRange ? [] : [room.id],
        explanation: withinRange
          ? `"${room.name}" area is within the expected range for its type.`
          : `"${room.name}" area is outside the configured min/max target. Adjust size for optimal space utilization.`,
      });
    }

    if (results.length === 0) {
      results.push({
        constraintId: 'SC-GEO-002',
        passed: true,
        severity: ConstraintSeverity.SOFT,
        score: 10,
        maxScore: 10,
        message: 'Room sizes: no rooms to evaluate',
        affectedEntities: [],
        explanation: 'No rooms present.',
      });
    }

    return results;
  },
};

export const DimensionBalance: Constraint = {
  id: 'SC-GEO-003',
  name: 'Bedroom Size Balance',
  description: 'Bedroom sizes should be reasonably balanced (stdev < 20% of mean)',
  category: ConstraintCategory.GEOMETRY,
  severity: ConstraintSeverity.SOFT,
  enabled: true,

  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    const bedrooms = ctx.allRooms.filter(r => r.type === RoomType.Bedroom);

    if (bedrooms.length < 2) {
      return [{
        constraintId: 'SC-GEO-003',
        passed: true,
        severity: ConstraintSeverity.SOFT,
        score: 15,
        maxScore: 15,
        message: 'Bedroom balance: fewer than 2 bedrooms',
        affectedEntities: [],
        explanation: 'Need at least 2 bedrooms to evaluate size balance.',
      }];
    }

    const areas = bedrooms.map(b => b.area);
    const mean = areas.reduce((s, a) => s + a, 0) / areas.length;
    const variance = areas.reduce((s, a) => s + (a - mean) ** 2, 0) / areas.length;
    const stdev = Math.sqrt(variance);
    const cv = mean > 0 ? stdev / mean : 0; // coefficient of variation

    const balanced = cv < 0.20;

    return [{
      constraintId: 'SC-GEO-003',
      passed: balanced,
      severity: ConstraintSeverity.SOFT,
      score: balanced ? 15 : cv < 0.35 ? 8 : 0,
      maxScore: 15,
      message: balanced
        ? 'Bedroom sizes are well-balanced'
        : `Bedroom sizes vary significantly (CV: ${(cv * 100).toFixed(0)}%)`,
      affectedEntities: balanced ? [] : bedrooms.map(b => b.id),
      explanation: balanced
        ? `Bedroom areas have a coefficient of variation of ${(cv * 100).toFixed(0)}%, indicating balanced sizing.`
        : `Bedroom areas vary by ${(cv * 100).toFixed(0)}% (coefficient of variation). Consider making bedrooms more similar in size unless one is intentionally a master suite.`,
    }];
  },
};
