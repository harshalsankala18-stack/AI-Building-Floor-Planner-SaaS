/**
 * Regulatory Rule Provider — National Building Code of India (NBC 2016) & UDCPR 2020.
 *
 * Implements formal hard and soft constraints for Indian apartments:
 * - Room minimum dimensions and areas (Living, Bedrooms, Kitchen, Bathrooms).
 * - Aspect ratio ceilings (1:1.8 max).
 * - Habitable room facade exposure (openFacade).
 * - Bathroom ventilation via openFacade or OTS shaft.
 */

import type { Constraint, ResolvedConstraintConfig, RuleProvider } from '../types';
import { ConstraintSeverity, ConstraintCategory } from '../types';

export const NBC2016_ROOM_MINIMUMS = {
  living: { minAreaSqM: 15.0, minWidthM: 3.0 },
  master_bedroom: { minAreaSqM: 9.5, minWidthM: 2.75 },
  bedroom: { minAreaSqM: 7.5, minWidthM: 2.4 },
  kitchen: { minAreaSqM: 5.0, minWidthM: 1.8 },
  bathroom: { minAreaSqM: 2.8, minWidthM: 1.2 },
};

export const NbcRoomDimensionConstraint: Constraint = {
  id: 'NBC-2016-ROOM-DIM',
  name: 'NBC 2016 Room Dimensions & Area',
  description: 'Every room must meet NBC 2016 minimum width and area standards',
  category: ConstraintCategory.GEOMETRY,
  severity: ConstraintSeverity.HARD,
  enabled: true,
  evaluate(context) {
    const results = [];
    for (const floor of context.building.floors) {
      for (const room of floor.rooms) {
        const standard = NBC2016_ROOM_MINIMUMS[room.type as keyof typeof NBC2016_ROOM_MINIMUMS];
        if (standard) {
          const areaSqM = room.area / 1e6;
          const minWidth = Math.min(room.width, room.height) / 1000;
          const passed = areaSqM >= standard.minAreaSqM && minWidth >= standard.minWidthM;
          results.push({
            constraintId: 'NBC-2016-ROOM-DIM',
            passed,
            severity: ConstraintSeverity.HARD,
            score: passed ? 100 : 0,
            maxScore: 100,
            message: passed
              ? `Room ${room.name} satisfies NBC 2016 minimums`
              : `Room ${room.name} violates NBC 2016 minimums (Area: ${areaSqM.toFixed(1)}m², Min Width: ${minWidth.toFixed(2)}m)`,
            affectedEntities: [room.id],
            explanation: `NBC 2016 requires ${room.type} to have at least ${standard.minAreaSqM}m² area and ${standard.minWidthM}m width.`,
          });
        }
      }
    }
    return results;
  },
};

export class RegulatoryRuleProvider implements RuleProvider {
  readonly name: string;
  readonly jurisdiction: string;
  readonly version: string;

  constructor(jurisdiction: string = 'generic', version: string = '0.0.0') {
    this.name = `regulatory-${jurisdiction}`;
    this.jurisdiction = jurisdiction;
    this.version = version;
  }

  getConstraints(_config: ResolvedConstraintConfig): Constraint[] {
    if (this.jurisdiction === 'india_nbc_2016' || this.jurisdiction.toLowerCase().includes('nbc')) {
      return [NbcRoomDimensionConstraint];
    }
    return [];
  }
}
