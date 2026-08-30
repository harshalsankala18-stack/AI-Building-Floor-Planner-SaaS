import { RoomType } from '@ai-floor-planner/core';
import type { Constraint, ConstraintResult, EvaluationContext } from '../../types';
import { ConstraintCategory, ConstraintSeverity, EvaluationStatus } from '../../types';

function geometryKey(entity: { x: number; y: number; width: number; height?: number; length?: number }): string {
  return [entity.x, entity.y, entity.width, entity.height ?? entity.length ?? 0].join('|');
}

/** Multi-floor buildings require one aligned, connected primary stair core. */
export const VerticalCirculationContinuity: Constraint = {
  id: 'HC-031',
  name: 'Vertical Circulation Continuity',
  description: 'Every occupied floor must participate in one aligned staircase core',
  category: ConstraintCategory.ACCESSIBILITY,
  severity: ConstraintSeverity.HARD,
  enabled: true,

  evaluate(context: EvaluationContext): ConstraintResult[] {
    const floors = [...context.building.floors].sort((a, b) => a.level - b.level);
    if (floors.length <= 1) {
      return [{
        constraintId: 'HC-031', passed: true, severity: ConstraintSeverity.HARD,
        score: 0, maxScore: 0, status: EvaluationStatus.NOT_APPLICABLE,
        message: 'Vertical circulation: single floor — not applicable',
        affectedEntities: [], explanation: 'A single-floor plan does not require cross-floor stair continuity.',
      }];
    }

    const results: ConstraintResult[] = [];
    const stairRooms = floors.map(floor => floor.rooms.find(room => room.type === RoomType.Staircase));
    const missingRoomFloors = floors.filter((_, index) => !stairRooms[index]);
    const missingStairFloors = floors.filter(floor => floor.stairs.length === 0);
    if (missingRoomFloors.length > 0 || missingStairFloors.length > 0) {
      const affected = [...missingRoomFloors, ...missingStairFloors].map(floor => floor.id);
      results.push({
        constraintId: 'HC-031', passed: false, severity: ConstraintSeverity.HARD,
        score: 0, maxScore: 0,
        message: `Vertical circulation is missing on ${new Set(affected).size} floor(s)`,
        affectedEntities: [...new Set(affected)],
        explanation: 'Every occupied floor in a multi-floor building requires an explicit staircase room and stair entity.',
        suggestedFixes: [{ description: 'Add the missing aligned staircase continuation', actionType: 'add', priority: 1 }],
      });
    }

    const presentRooms = stairRooms.filter((room): room is NonNullable<typeof room> => Boolean(room));
    if (presentRooms.length > 1 && new Set(presentRooms.map(geometryKey)).size !== 1) {
      results.push({
        constraintId: 'HC-031', passed: false, severity: ConstraintSeverity.HARD,
        score: 0, maxScore: 0, message: 'Staircase rooms are not vertically aligned',
        affectedEntities: presentRooms.map(room => room.id),
        explanation: 'The staircase footprint must use the same coordinates and dimensions on connected floors.',
        suggestedFixes: [{ description: 'Align staircase footprints to one vertical core', actionType: 'move', priority: 1 }],
      });
    }

    const stairs = floors.flatMap(floor => floor.stairs);
    if (stairs.length > 1 && new Set(stairs.map(geometryKey)).size !== 1) {
      results.push({
        constraintId: 'HC-031', passed: false, severity: ConstraintSeverity.HARD,
        score: 0, maxScore: 0, message: 'Stair entities are not vertically aligned',
        affectedEntities: stairs.map(stair => stair.id),
        explanation: 'Every stair entity assigned to the primary core must share its plan footprint.',
      });
    }

    const coveredPairs = new Set(stairs.map(stair => {
      const pair = [...stair.connectsFloors].sort((a, b) => a - b);
      return `${pair[0]}:${pair[1]}`;
    }));
    const missingPairs = floors.slice(0, -1).filter((floor, index) => {
      const next = floors[index + 1]!;
      return !coveredPairs.has(`${floor.level}:${next.level}`);
    });
    if (missingPairs.length > 0) {
      results.push({
        constraintId: 'HC-031', passed: false, severity: ConstraintSeverity.HARD,
        score: 0, maxScore: 0, message: 'One or more adjacent floor pairs lack an explicit stair connection',
        affectedEntities: missingPairs.map(floor => floor.id),
        explanation: 'Every adjacent pair of occupied floor levels must be connected by an explicit stair relationship.',
      });
    }

    if (results.length > 0) return results;
    return [{
      constraintId: 'HC-031', passed: true, severity: ConstraintSeverity.HARD,
      score: 0, maxScore: 0, message: 'Vertical stair core is continuous across all floors',
      affectedEntities: [],
      explanation: 'Stair rooms and stair entities align, and every adjacent floor pair is connected.',
    }];
  },
};
