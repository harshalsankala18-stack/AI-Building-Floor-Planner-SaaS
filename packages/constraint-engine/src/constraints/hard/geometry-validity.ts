/**
 * Hard Constraints: Geometry Validity
 * HC-004: All boundaries must be valid polygons.
 * HC-005: All rooms must have positive area.
 * HC-006: All walls must have valid length and thickness.
 */

import type { Constraint, ConstraintResult, EvaluationContext } from '../../types';
import { ConstraintSeverity, ConstraintCategory } from '../../types';
import { isValidPolygon, segmentLength } from '@ai-floor-planner/geometry-engine';
import { TOLERANCES } from '@ai-floor-planner/core';

export const ValidPolygons: Constraint = {
  id: 'HC-004',
  name: 'Valid Polygons',
  description: 'All room and floor boundaries must be valid closed polygons',
  category: ConstraintCategory.GEOMETRY,
  severity: ConstraintSeverity.HARD,
  enabled: true,

  evaluate(context: EvaluationContext): ConstraintResult[] {
    const results: ConstraintResult[] = [];

    for (const floor of context.building.floors) {
      for (const room of floor.rooms) {
        if (!isValidPolygon(room.boundary)) {
          results.push({
            constraintId: 'HC-004',
            passed: false,
            severity: ConstraintSeverity.HARD,
            score: 0,
            maxScore: 0,
            message: `Room "${room.name}" has an invalid boundary polygon`,
            affectedEntities: [room.id],
            explanation: `The boundary of "${room.name}" is not a valid closed polygon. It may have fewer than 3 points, self-intersections, or zero area. Correct the room geometry.`,
            suggestedFixes: [{
              description: `Correct the boundary polygon of "${room.name}"`,
              actionType: 'resize',
              targetEntity: room.id,
              priority: 1,
            }],
          });
        }
      }
    }

    if (results.length === 0) {
      results.push({
        constraintId: 'HC-004',
        passed: true,
        severity: ConstraintSeverity.HARD,
        score: 0,
        maxScore: 0,
        message: 'All boundaries are valid polygons',
        affectedEntities: [],
        explanation: 'All room and floor boundary polygons are geometrically valid.',
      });
    }

    return results;
  },
};

export const PositiveArea: Constraint = {
  id: 'HC-005',
  name: 'Positive Area',
  description: 'All rooms must have area greater than zero',
  category: ConstraintCategory.GEOMETRY,
  severity: ConstraintSeverity.HARD,
  enabled: true,

  evaluate(context: EvaluationContext): ConstraintResult[] {
    const results: ConstraintResult[] = [];

    for (const floor of context.building.floors) {
      for (const room of floor.rooms) {
        if (room.area <= 0) {
          results.push({
            constraintId: 'HC-005',
            passed: false,
            severity: ConstraintSeverity.HARD,
            score: 0,
            maxScore: 0,
            message: `Room "${room.name}" has non-positive area (${room.area} sq mm)`,
            affectedEntities: [room.id],
            explanation: `"${room.name}" has an area of ${room.area} sq mm, which is zero or negative. Rooms must have positive width and height to be valid.`,
            suggestedFixes: [{
              description: `Set positive dimensions for "${room.name}"`,
              actionType: 'resize',
              targetEntity: room.id,
              priority: 1,
            }],
          });
        }
      }
    }

    if (results.length === 0) {
      results.push({
        constraintId: 'HC-005',
        passed: true,
        severity: ConstraintSeverity.HARD,
        score: 0,
        maxScore: 0,
        message: 'All rooms have positive area',
        affectedEntities: [],
        explanation: 'Every room has a valid positive area.',
      });
    }

    return results;
  },
};

export const WallIntegrity: Constraint = {
  id: 'HC-006',
  name: 'Wall Integrity',
  description: 'All walls must have non-zero length and valid thickness',
  category: ConstraintCategory.GEOMETRY,
  severity: ConstraintSeverity.HARD,
  enabled: true,

  evaluate(context: EvaluationContext): ConstraintResult[] {
    const results: ConstraintResult[] = [];

    for (const floor of context.building.floors) {
      for (const wall of floor.walls) {
        const len = segmentLength({ start: wall.startPoint, end: wall.endPoint });

        if (len < TOLERANCES.LINEAR) {
          results.push({
            constraintId: 'HC-006',
            passed: false,
            severity: ConstraintSeverity.HARD,
            score: 0,
            maxScore: 0,
            message: `A wall on "${floor.name}" has zero length`,
            affectedEntities: [wall.id],
            explanation: `Wall ${wall.id} has a length of ${len.toFixed(1)} mm, which is below the minimum threshold. Correct the wall endpoints.`,
            suggestedFixes: [{
              description: 'Remove the zero-length wall or correct its endpoints',
              actionType: 'remove',
              targetEntity: wall.id,
              priority: 2,
            }],
          });
        }

        if (wall.thickness <= 0) {
          results.push({
            constraintId: 'HC-006',
            passed: false,
            severity: ConstraintSeverity.HARD,
            score: 0,
            maxScore: 0,
            message: `A wall on "${floor.name}" has invalid thickness (${wall.thickness} mm)`,
            affectedEntities: [wall.id],
            explanation: `Wall ${wall.id} has thickness ${wall.thickness} mm. Walls must have positive thickness.`,
            suggestedFixes: [{
              description: 'Set a valid wall thickness (e.g., 150mm for internal)',
              actionType: 'resize',
              targetEntity: wall.id,
              priority: 2,
            }],
          });
        }
      }
    }

    if (results.length === 0) {
      results.push({
        constraintId: 'HC-006',
        passed: true,
        severity: ConstraintSeverity.HARD,
        score: 0,
        maxScore: 0,
        message: 'All walls have valid geometry',
        affectedEntities: [],
        explanation: 'All walls have non-zero length and valid thickness.',
      });
    }

    return results;
  },
};
