/**
 * Vastu Rule Provider.
 *
 * Produces Vastu-specific soft constraints based on configuration.
 * Vastu is NOT hard-coded into the core evaluator — it's a pluggable provider.
 */

import type { Constraint, ConstraintResult, EvaluationContext, ResolvedConstraintConfig, RuleProvider } from '../types';
import { ConstraintSeverity, ConstraintCategory } from '../types';
import { RoomType } from '@ai-floor-planner/core';
import { getRoomQuadrant, quadrantMatches, isInHalf } from '../helpers/direction';
import { polygonBoundingBox, polygonCentroid } from '@ai-floor-planner/geometry-engine';
import { getMasterBedroom, getRoomsByType } from '../helpers/room-queries';
import type { Quadrant } from '../helpers/direction';

/**
 * Vastu Rule Provider — produces constraints when Vastu is enabled.
 */
export class VastuRuleProvider implements RuleProvider {
  readonly name = 'vastu';

  getConstraints(config: ResolvedConstraintConfig): Constraint[] {
    if (!config.enableVastu) {
      return [];
    }

    const strictness = config.vastuStrictness;
    const orientation = config.orientation;

    return [
      this.kitchenSE(orientation, strictness),
      this.masterSW(orientation, strictness),
      this.poojaNE(orientation, strictness),
      this.livingNorthOrNE(orientation, strictness),
      this.bathroomNWOrW(orientation, strictness),
      this.entranceFacing(orientation, strictness),
      this.staircaseSW(orientation, strictness),
      this.toiletNotNE(orientation, strictness),
    ];
  }

  private kitchenSE(orientation: number, strictness: 'strict' | 'moderate' | 'flexible'): Constraint {
    return this.quadrantConstraint(
      'SC-VASTU-001', 'Vastu: Kitchen in SE', 'Kitchen should be in the Southeast (Agni) corner',
      RoomType.Kitchen, 'SE', 15, orientation, strictness,
    );
  }

  private masterSW(_orientation: number, _strictness: 'strict' | 'moderate' | 'flexible'): Constraint {
    return {
      id: 'SC-VASTU-002',
      name: 'Vastu: Master Bedroom in SW',
      description: 'Master bedroom should be in the Southwest corner for stability',
      category: ConstraintCategory.VASTU,
      severity: ConstraintSeverity.SOFT,
      enabled: true,
      evaluate(ctx: EvaluationContext): ConstraintResult[] {
        const orientation = ctx.config.orientation;
        const strictness = ctx.config.vastuStrictness;
        const master = getMasterBedroom(ctx.building);
        if (!master) {
          return [{
            constraintId: 'SC-VASTU-002',
            passed: true, severity: ConstraintSeverity.SOFT,
            score: 15, maxScore: 15,
            message: 'Vastu master bedroom: no master identified',
            affectedEntities: [], explanation: 'No master bedroom to evaluate.',
          }];
        }

        const floorBoundary = ctx.building.floors[0]?.boundary;
        if (!floorBoundary || floorBoundary.points.length < 3) {
          return [{
            constraintId: 'SC-VASTU-002',
            passed: true, severity: ConstraintSeverity.SOFT,
            score: 15, maxScore: 15,
            message: 'Vastu master bedroom: no floor boundary',
            affectedEntities: [], explanation: 'Cannot evaluate without floor boundary.',
          }];
        }

        const quadrant = getRoomQuadrant(master.boundary, floorBoundary, orientation);
        const match = quadrantMatches(quadrant, 'SW', strictness);

        let score: number;
        if (match.matches) score = 15;
        else if (match.partial) score = 8;
        else score = 0;

        return [{
          constraintId: 'SC-VASTU-002',
          passed: match.matches,
          severity: ConstraintSeverity.SOFT,
          score, maxScore: 15,
          message: match.matches
            ? 'Master bedroom is in SW (Vastu compliant)'
            : `Master bedroom is in ${quadrant} (Vastu recommends SW)`,
          affectedEntities: match.matches ? [] : [master.id],
          explanation: match.matches
            ? 'The master bedroom is correctly placed in the Southwest corner per Vastu Shastra principles for stability and restful sleep.'
            : `The master bedroom is in the ${quadrant} quadrant. Vastu Shastra recommends the Southwest corner for the master bedroom as it provides stability.`,
        }];
      },
    };
  }

  private poojaNE(orientation: number, strictness: 'strict' | 'moderate' | 'flexible'): Constraint {
    return this.quadrantConstraint(
      'SC-VASTU-003', 'Vastu: Pooja Room in NE', 'Pooja/prayer room should be in the Northeast (Ishaan) corner',
      RoomType.Pooja, 'NE', 15, orientation, strictness,
    );
  }

  private livingNorthOrNE(_orientation: number, _strictness: 'strict' | 'moderate' | 'flexible'): Constraint {
    return {
      id: 'SC-VASTU-004',
      name: 'Vastu: Living Room in N/NE',
      description: 'Living room should be in the North or Northeast zone',
      category: ConstraintCategory.VASTU,
      severity: ConstraintSeverity.SOFT,
      enabled: true,
      evaluate(ctx: EvaluationContext): ConstraintResult[] {
        const orientation = ctx.config.orientation;
        const livings = getRoomsByType(ctx.building, RoomType.Living);
        if (livings.length === 0) {
          return [{
            constraintId: 'SC-VASTU-004',
            passed: true, severity: ConstraintSeverity.SOFT,
            score: 10, maxScore: 10,
            message: 'Vastu living room: not applicable',
            affectedEntities: [], explanation: 'No living room present.',
          }];
        }

        const floorBoundary = ctx.building.floors[0]?.boundary;
        if (!floorBoundary || floorBoundary.points.length < 3) {
          return [{
            constraintId: 'SC-VASTU-004',
            passed: true, severity: ConstraintSeverity.SOFT,
            score: 10, maxScore: 10,
            message: 'Vastu living room: no floor boundary',
            affectedEntities: [], explanation: 'Cannot evaluate.',
          }];
        }

        const room = livings[0]!;
        const bounds = polygonBoundingBox(floorBoundary);
        const centroid = polygonCentroid(room.boundary);
        const inNorthHalf = isInHalf(centroid, bounds, orientation, 'N');

        return [{
          constraintId: 'SC-VASTU-004',
          passed: inNorthHalf,
          severity: ConstraintSeverity.SOFT,
          score: inNorthHalf ? 10 : 0,
          maxScore: 10,
          message: inNorthHalf
            ? 'Living room is in the North zone (Vastu compliant)'
            : 'Living room is not in the North/NE zone',
          affectedEntities: inNorthHalf ? [] : [room.id],
          explanation: inNorthHalf
            ? 'The living room is in the northern half, aligned with Vastu recommendations for social energy.'
            : 'Vastu recommends the living room in the North or Northeast for positive social energy.',
        }];
      },
    };
  }

  private bathroomNWOrW(_orientation: number, _strictness: 'strict' | 'moderate' | 'flexible'): Constraint {
    return {
      id: 'SC-VASTU-005',
      name: 'Vastu: Bathroom in NW/W',
      description: 'Bathrooms should be in the Northwest or West zone',
      category: ConstraintCategory.VASTU,
      severity: ConstraintSeverity.SOFT,
      enabled: true,
      evaluate(ctx: EvaluationContext): ConstraintResult[] {
        const orientation = ctx.config.orientation;
        const bathrooms = getRoomsByType(ctx.building, RoomType.Bathroom);
        if (bathrooms.length === 0) {
          return [{
            constraintId: 'SC-VASTU-005',
            passed: true, severity: ConstraintSeverity.SOFT,
            score: 10, maxScore: 10,
            message: 'Vastu bathroom: not applicable',
            affectedEntities: [], explanation: 'No bathrooms present.',
          }];
        }

        const floorBoundary = ctx.building.floors[0]?.boundary;
        if (!floorBoundary || floorBoundary.points.length < 3) {
          return [{
            constraintId: 'SC-VASTU-005',
            passed: true, severity: ConstraintSeverity.SOFT,
            score: 10, maxScore: 10,
            message: 'Vastu bathroom: no floor boundary',
            affectedEntities: [], explanation: 'Cannot evaluate.',
          }];
        }

        const bounds = polygonBoundingBox(floorBoundary);
        const room = bathrooms[0]!;
        const centroid = polygonCentroid(room.boundary);
        const inWestHalf = isInHalf(centroid, bounds, orientation, 'W');

        return [{
          constraintId: 'SC-VASTU-005',
          passed: inWestHalf,
          severity: ConstraintSeverity.SOFT,
          score: inWestHalf ? 10 : 0,
          maxScore: 10,
          message: inWestHalf
            ? 'Bathroom is in West zone (Vastu compliant)'
            : 'Bathroom is not in the NW/W zone',
          affectedEntities: inWestHalf ? [] : [room.id],
          explanation: inWestHalf
            ? 'Bathroom placement in the West/Northwest aligns with Vastu water element principles.'
            : 'Vastu recommends bathrooms in the Northwest or West for proper water element placement.',
        }];
      },
    };
  }

  private entranceFacing(_orientation: number, _strictness: 'strict' | 'moderate' | 'flexible'): Constraint {
    return {
      id: 'SC-VASTU-006',
      name: 'Vastu: Entrance Facing N/E',
      description: 'Main entrance should face North or East',
      category: ConstraintCategory.VASTU,
      severity: ConstraintSeverity.SOFT,
      enabled: true,
      evaluate(ctx: EvaluationContext): ConstraintResult[] {
        const roadFacing = ctx.building.site.roadFacing;
        const favorable = roadFacing === 'north' || roadFacing === 'east';

        return [{
          constraintId: 'SC-VASTU-006',
          passed: favorable,
          severity: ConstraintSeverity.SOFT,
          score: favorable ? 15 : 0,
          maxScore: 15,
          message: favorable
            ? `Entrance faces ${roadFacing} (Vastu auspicious)`
            : `Entrance faces ${roadFacing} (Vastu recommends North or East)`,
          affectedEntities: [],
          explanation: favorable
            ? `The main entrance/road facing is ${roadFacing}, which is considered auspicious in Vastu Shastra.`
            : `The entrance faces ${roadFacing}. Vastu Shastra recommends North or East-facing entrances for positive energy flow.`,
        }];
      },
    };
  }

  private staircaseSW(orientation: number, strictness: 'strict' | 'moderate' | 'flexible'): Constraint {
    return this.quadrantConstraint(
      'SC-VASTU-007', 'Vastu: Staircase in SW/S/W', 'Staircase should be in Southwest, South, or West',
      RoomType.Staircase, 'SW', 10, orientation, strictness,
    );
  }

  private toiletNotNE(_orientation: number, _strictness: 'strict' | 'moderate' | 'flexible'): Constraint {
    return {
      id: 'SC-VASTU-008',
      name: 'Vastu: Toilet NOT in NE',
      description: 'Toilets/bathrooms must not be in the sacred Northeast corner',
      category: ConstraintCategory.VASTU,
      severity: ConstraintSeverity.SOFT,
      enabled: true,
      evaluate(ctx: EvaluationContext): ConstraintResult[] {
        const orientation = ctx.config.orientation;
        const bathrooms = getRoomsByType(ctx.building, RoomType.Bathroom);
        if (bathrooms.length === 0) {
          return [{
            constraintId: 'SC-VASTU-008',
            passed: true, severity: ConstraintSeverity.SOFT,
            score: 10, maxScore: 10,
            message: 'Vastu toilet NE check: no bathrooms',
            affectedEntities: [], explanation: 'No bathrooms present.',
          }];
        }

        const floorBoundary = ctx.building.floors[0]?.boundary;
        if (!floorBoundary || floorBoundary.points.length < 3) {
          return [{
            constraintId: 'SC-VASTU-008',
            passed: true, severity: ConstraintSeverity.SOFT,
            score: 10, maxScore: 10,
            message: 'Vastu toilet NE check: no floor boundary',
            affectedEntities: [], explanation: 'Cannot evaluate.',
          }];
        }

        let violating = false;
        const affectedIds: string[] = [];
        for (const bath of bathrooms) {
          const quadrant = getRoomQuadrant(bath.boundary, floorBoundary, orientation);
          if (quadrant === 'NE') {
            violating = true;
            affectedIds.push(bath.id);
          }
        }

        return [{
          constraintId: 'SC-VASTU-008',
          passed: !violating,
          severity: ConstraintSeverity.SOFT,
          score: violating ? 0 : 10,
          maxScore: 10,
          message: violating
            ? 'A bathroom is in the NE corner (Vastu violation)'
            : 'No bathroom in NE corner (Vastu compliant)',
          affectedEntities: affectedIds,
          explanation: violating
            ? 'A bathroom/toilet is placed in the Northeast (Ishaan) corner, which Vastu considers sacred. Move the bathroom to a different quadrant.'
            : 'No bathrooms pollute the sacred Northeast corner — good Vastu compliance.',
        }];
      },
    };
  }

  /** Helper: creates a quadrant-check constraint for a room type. */
  private quadrantConstraint(
    id: string,
    name: string,
    description: string,
    roomType: RoomType,
    targetQuadrant: Quadrant,
    maxScore: number,
    _orientation: number,
    _strictness: 'strict' | 'moderate' | 'flexible',
  ): Constraint {
    return {
      id, name, description,
      category: ConstraintCategory.VASTU,
      severity: ConstraintSeverity.SOFT,
      enabled: true,
      evaluate(ctx: EvaluationContext): ConstraintResult[] {
        const orientation = ctx.config.orientation;
        const strictness = ctx.config.vastuStrictness;
        const rooms = getRoomsByType(ctx.building, roomType);
        if (rooms.length === 0) {
          return [{
            constraintId: id, passed: true, severity: ConstraintSeverity.SOFT,
            score: maxScore, maxScore,
            message: `${name}: not applicable (no ${roomType})`,
            affectedEntities: [], explanation: `No ${roomType} room present to evaluate.`,
          }];
        }

        const floorBoundary = ctx.building.floors[0]?.boundary;
        if (!floorBoundary || floorBoundary.points.length < 3) {
          return [{
            constraintId: id, passed: true, severity: ConstraintSeverity.SOFT,
            score: maxScore, maxScore,
            message: `${name}: no floor boundary`,
            affectedEntities: [], explanation: 'Cannot evaluate without floor boundary.',
          }];
        }

        const room = rooms[0]!;
        const quadrant = getRoomQuadrant(room.boundary, floorBoundary, orientation);
        const match = quadrantMatches(quadrant, targetQuadrant, strictness);

        let score: number;
        if (match.matches) score = maxScore;
        else if (match.partial) score = Math.round(maxScore * 0.5);
        else score = 0;

        return [{
          constraintId: id,
          passed: match.matches,
          severity: ConstraintSeverity.SOFT,
          score, maxScore,
          message: match.matches
            ? `${roomType} is in ${targetQuadrant} (Vastu compliant)`
            : `${roomType} is in ${quadrant} (Vastu recommends ${targetQuadrant})`,
          affectedEntities: match.matches ? [] : [room.id],
          explanation: match.matches
            ? `The ${roomType} is correctly placed in the ${targetQuadrant} quadrant per Vastu Shastra.`
            : `The ${roomType} is in the ${quadrant} quadrant. Vastu Shastra recommends placing it in the ${targetQuadrant} quadrant.`,
        }];
      },
    };
  }
}
