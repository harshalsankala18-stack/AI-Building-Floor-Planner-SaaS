/**
 * Hard Constraint: Window Validity
 * HC-015: Every window must reference an existing wall.
 */

import type { Constraint, ConstraintResult, EvaluationContext } from '../../types';
import { ConstraintSeverity, ConstraintCategory } from '../../types';
import { validateWindowPlacement } from '@ai-floor-planner/geometry-engine';

function isFinitePoint(value: unknown): value is { x: number; y: number } {
  if (!value || typeof value !== 'object') return false;
  const point = value as { x?: unknown; y?: unknown };
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

export const WindowOnWall: Constraint = {
  id: 'HC-015',
  name: 'Window On Wall',
  description: 'Every window must be placed on an existing wall',
  category: ConstraintCategory.GEOMETRY,
  severity: ConstraintSeverity.HARD,
  enabled: true,

  evaluate(context: EvaluationContext): ConstraintResult[] {
    const results: ConstraintResult[] = [];

    for (const floor of context.building.floors) {
      if (floor.windows.length === 0) continue;

      const wallsById = new Map(floor.walls.map(wall => [wall.id, wall]));
      const roomIds = new Set(floor.rooms.map(room => room.id));

      for (const win of floor.windows) {
        const wall = wallsById.get(win.wallId);
        if (!wall) {
          results.push({
            constraintId: 'HC-015',
            passed: false,
            severity: ConstraintSeverity.HARD,
            score: 0,
            maxScore: 0,
            message: `A window on "${floor.name}" references a non-existent wall`,
            affectedEntities: [win.id],
            explanation: `Window ${win.id} references wall "${win.wallId}" which does not exist on "${floor.name}". Place the window on a valid external wall.`,
            suggestedFixes: [{
              description: 'Place the window on an existing external wall',
              actionType: 'move',
              targetEntity: win.id,
              priority: 2,
            }],
          });
          continue;
        }

        if (win.floorId !== floor.id || wall.floorId !== floor.id || !roomIds.has(win.roomId)) {
          results.push({
            constraintId: 'HC-015',
            passed: false,
            severity: ConstraintSeverity.HARD,
            score: 0,
            maxScore: 0,
            message: `Window "${win.id}" has invalid floor or room references`,
            affectedEntities: [win.id, wall.id],
            explanation: 'The window, its host wall, and its room must all exist on the same floor.',
            suggestedFixes: [{
              description: 'Attach the window to an existing room and wall on the same floor',
              actionType: 'move',
              targetEntity: win.id,
              priority: 2,
            }],
          });
        }

        if (!isFinitePoint(win.position)) {
          results.push({
            constraintId: 'HC-015',
            passed: false,
            severity: ConstraintSeverity.HARD,
            score: 0,
            maxScore: 0,
            message: `Window "${win.id}" has an invalid position`,
            affectedEntities: [win.id],
            explanation: 'Window position must be a finite {x, y} coordinate on its host wall.',
            suggestedFixes: [{
              description: 'Place the window at a valid coordinate on its host wall',
              actionType: 'move',
              targetEntity: win.id,
              priority: 2,
            }],
          });
          continue;
        }

        const placement = validateWindowPlacement(win, wall);
        if (!placement.valid) {
          results.push({
            constraintId: 'HC-015',
            passed: false,
            severity: ConstraintSeverity.HARD,
            score: 0,
            maxScore: 0,
            message: `Window "${win.id}" is not valid on its host wall`,
            affectedEntities: [win.id, wall.id],
            explanation: placement.reason ?? 'The window opening does not fit on its host wall.',
            suggestedFixes: [{
              description: 'Move or resize the window so it fits on an external wall',
              actionType: 'move',
              targetEntity: win.id,
              priority: 2,
            }],
          });
        }
      }
    }

    if (results.length === 0) {
      results.push({
        constraintId: 'HC-015',
        passed: true,
        severity: ConstraintSeverity.HARD,
        score: 0,
        maxScore: 0,
        message: 'All windows are placed on valid walls',
        affectedEntities: [],
        explanation: 'Every window references an existing room and external wall, and fits on that wall on the same floor.',
      });
    }

    return results;
  },
};
