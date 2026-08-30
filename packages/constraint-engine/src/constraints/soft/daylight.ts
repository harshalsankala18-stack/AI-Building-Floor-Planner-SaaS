/**
 * Soft Constraints: Daylight / Natural Light
 * SC-DAY-001: Bedroom external wall
 * SC-DAY-002: Living room external wall
 * SC-DAY-003: Kitchen external wall
 * SC-DAY-004: Window orientation (simplified)
 * SC-DAY-005: All habitable rooms have daylight
 */

import type { Constraint, ConstraintResult, EvaluationContext } from '../../types';
import { ConstraintSeverity, ConstraintCategory, EvaluationStatus } from '../../types';
import { RoomType } from '@ai-floor-planner/core';
import { hasExternalWall } from '../../helpers/room-queries';

export const BedroomExternal: Constraint = {
  id: 'SC-DAY-001',
  name: 'Bedroom Daylight',
  description: 'Each bedroom should have at least one external wall for natural light',
  category: ConstraintCategory.DAYLIGHT,
  severity: ConstraintSeverity.SOFT,
  enabled: true,

  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    const results: ConstraintResult[] = [];

    for (const floor of ctx.building.floors) {
      const bedrooms = floor.rooms.filter(r => r.type === RoomType.Bedroom);
      for (const room of bedrooms) {
        const external = hasExternalWall(room, floor.boundary);
        results.push({
          constraintId: 'SC-DAY-001',
          passed: external,
          severity: ConstraintSeverity.SOFT,
          score: external ? 20 : 0,
          maxScore: 20,
          message: external
            ? `"${room.name}" has natural light access`
            : `"${room.name}" lacks natural light (no external wall)`,
          affectedEntities: external ? [] : [room.id],
          explanation: external
            ? `"${room.name}" shares a wall with the building exterior, allowing natural light and ventilation.`
            : `"${room.name}" is surrounded by other rooms with no external wall. This limits natural light and ventilation. Consider repositioning it to touch the floor boundary.`,
          suggestedFixes: external ? undefined : [{
            description: `Move "${room.name}" to an external wall position`,
            actionType: 'move',
            targetEntity: room.id,
            priority: 3,
          }],
          classification: 'proxy',
        });
      }
    }

    if (results.length === 0) {
      results.push({
        constraintId: 'SC-DAY-001',
        passed: true,
        severity: ConstraintSeverity.SOFT,
        score: 0,
        maxScore: 0,
        status: EvaluationStatus.NOT_APPLICABLE,
        classification: 'proxy',
        message: 'Bedroom daylight potential: not applicable',
        affectedEntities: [],
        explanation: 'No bedrooms present in the plan.',
      });
    }

    return results;
  },
};

export const LivingExternal: Constraint = {
  id: 'SC-DAY-002',
  name: 'Living Room Daylight',
  description: 'Living room should have external wall access',
  category: ConstraintCategory.DAYLIGHT,
  severity: ConstraintSeverity.SOFT,
  enabled: true,

  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    for (const floor of ctx.building.floors) {
      const livings = floor.rooms.filter(r => r.type === RoomType.Living);
      for (const room of livings) {
        const external = hasExternalWall(room, floor.boundary);
        return [{
          constraintId: 'SC-DAY-002',
          passed: external,
          severity: ConstraintSeverity.SOFT,
          score: external ? 25 : 0,
          maxScore: 25,
          message: external
            ? `"${room.name}" has excellent natural light`
            : `"${room.name}" has no external wall access`,
          affectedEntities: external ? [] : [room.id],
          explanation: external
            ? `"${room.name}" is positioned on an external wall for maximum daylight.`
            : `"${room.name}" has no direct access to the building exterior. Living rooms benefit greatly from natural light.`,
          classification: 'proxy',
        }];
      }
    }

    return [{
      constraintId: 'SC-DAY-002',
      passed: true,
      severity: ConstraintSeverity.SOFT,
      score: 0,
      maxScore: 0,
      status: EvaluationStatus.NOT_APPLICABLE,
      classification: 'proxy',
      message: 'Living-room daylight potential: not applicable',
      affectedEntities: [],
      explanation: 'No living room present.',
    }];
  },
};

export const KitchenExternal: Constraint = {
  id: 'SC-DAY-003',
  name: 'Kitchen Daylight',
  description: 'Kitchen should have external wall access for ventilation',
  category: ConstraintCategory.DAYLIGHT,
  severity: ConstraintSeverity.SOFT,
  enabled: true,

  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    for (const floor of ctx.building.floors) {
      const kitchens = floor.rooms.filter(r => r.type === RoomType.Kitchen);
      for (const room of kitchens) {
        const external = hasExternalWall(room, floor.boundary);
        return [{
          constraintId: 'SC-DAY-003',
          passed: external,
          severity: ConstraintSeverity.SOFT,
          score: external ? 15 : 0,
          maxScore: 15,
          message: external
            ? `"${room.name}" has ventilation access`
            : `"${room.name}" lacks ventilation (no external wall)`,
          affectedEntities: external ? [] : [room.id],
          explanation: external
            ? `"${room.name}" can be ventilated via the external wall.`
            : `"${room.name}" has no external wall for smoke exhaust and ventilation. This is a significant design concern.`,
          classification: 'proxy',
        }];
      }
    }

    return [{
      constraintId: 'SC-DAY-003',
      passed: true,
      severity: ConstraintSeverity.SOFT,
      score: 0,
      maxScore: 0,
      status: EvaluationStatus.NOT_APPLICABLE,
      classification: 'proxy',
      message: 'Kitchen daylight potential: not applicable',
      affectedEntities: [],
      explanation: 'No kitchen present.',
    }];
  },
};

export const WindowOrientation: Constraint = {
  id: 'SC-DAY-004',
  name: 'Window Orientation',
  description: 'Windows facing East or South receive optimal natural daylight',
  category: ConstraintCategory.DAYLIGHT,
  severity: ConstraintSeverity.SOFT,
  enabled: true,

  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    let totalWindows = 0;
    for (const floor of ctx.building.floors) {
      totalWindows += floor.windows.length;
    }

    if (totalWindows === 0) {
      return [{
        constraintId: 'SC-DAY-004',
        passed: true,
        severity: ConstraintSeverity.SOFT,
        score: 0,
        maxScore: 0,
        status: EvaluationStatus.INSUFFICIENT_INPUT,
        classification: 'proxy',
        message: 'Window orientation potential: insufficient input',
        affectedEntities: [],
        explanation: 'No windows defined in this draft layout.',
      }];
    }

    return [{
      constraintId: 'SC-DAY-004',
      passed: true,
      severity: ConstraintSeverity.SOFT,
      score: 0,
      maxScore: 0,
      status: EvaluationStatus.NOT_ANALYZED,
      classification: 'proxy',
      message: `Window orientation: not analyzed (${totalWindows} opening${totalWindows === 1 ? '' : 's'} documented)`,
      affectedEntities: [],
      explanation: 'Openings are documented, but the current engine does not calculate solar exposure or orientation performance.',
    }];
  },
};

export const AllHabitableLight: Constraint = {
  id: 'SC-DAY-005',
  name: 'All Habitable Rooms Have Light',
  description: 'Bonus: every habitable room (bedroom, living, kitchen) has external access',
  category: ConstraintCategory.DAYLIGHT,
  severity: ConstraintSeverity.SOFT,
  enabled: true,

  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    const habitableTypes = new Set([RoomType.Bedroom, RoomType.Living, RoomType.Kitchen, RoomType.Dining]);
    let allHaveLight = true;

    for (const floor of ctx.building.floors) {
      for (const room of floor.rooms) {
        if (habitableTypes.has(room.type as RoomType)) {
          if (!hasExternalWall(room, floor.boundary)) {
            allHaveLight = false;
            break;
          }
        }
      }
      if (!allHaveLight) break;
    }

    return [{
      constraintId: 'SC-DAY-005',
      passed: allHaveLight,
      severity: ConstraintSeverity.SOFT,
      score: allHaveLight ? 10 : 0,
      maxScore: 10,
      message: allHaveLight
        ? 'All habitable rooms have natural light access'
        : 'Some habitable rooms lack natural light',
      affectedEntities: [],
      explanation: allHaveLight
        ? 'Every bedroom, living, kitchen, and dining room has direct external wall access — excellent design.'
        : 'One or more habitable rooms are fully interior. Consider rearranging the plan so all habitable rooms touch an external wall.',
      classification: 'proxy',
    }];
  },
};
