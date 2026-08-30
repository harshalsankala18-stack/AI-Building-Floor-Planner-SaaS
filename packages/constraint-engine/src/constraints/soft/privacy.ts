/**
 * Soft Constraints: Privacy
 * SC-PRI-001: Bedrooms separated from entrance
 * SC-PRI-002: Master bedroom isolated from public zone
 * SC-PRI-003: Bathroom visibility (simplified)
 * SC-PRI-004: Guest bedroom separation
 */

import type { Constraint, ConstraintResult, EvaluationContext } from '../../types';
import { ConstraintSeverity, ConstraintCategory } from '../../types';
import { RoomType } from '@ai-floor-planner/core';
import { polygonsAdjacent } from '@ai-floor-planner/geometry-engine';
import { getMasterBedroom, getRoomsByType } from '../../helpers/room-queries';
import { getPublicRooms } from '../../helpers/zone-classification';

export const BedroomSeparation: Constraint = {
  id: 'SC-PRI-001',
  name: 'Bedroom-Entrance Separation',
  description: 'Bedrooms should not be adjacent to foyer/entrance areas',
  category: ConstraintCategory.PRIVACY,
  severity: ConstraintSeverity.SOFT,
  enabled: true,

  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    const results: ConstraintResult[] = [];
    const entranceTypes = new Set([RoomType.Foyer, RoomType.Corridor]);

    for (const floor of ctx.building.floors) {
      const bedrooms = floor.rooms.filter(r => r.type === RoomType.Bedroom);
      const entrances = floor.rooms.filter(r => entranceTypes.has(r.type as RoomType));

      for (const bedroom of bedrooms) {
        let adjacentToEntrance = false;
        for (const entrance of entrances) {
          if (polygonsAdjacent(bedroom.boundary, entrance.boundary)) {
            adjacentToEntrance = true;
            break;
          }
        }

        results.push({
          constraintId: 'SC-PRI-001',
          passed: !adjacentToEntrance,
          severity: ConstraintSeverity.SOFT,
          score: adjacentToEntrance ? 0 : 15,
          maxScore: 15,
          message: adjacentToEntrance
            ? `"${bedroom.name}" is adjacent to entrance — privacy concern`
            : `"${bedroom.name}" is well-separated from entrance`,
          affectedEntities: adjacentToEntrance ? [bedroom.id] : [],
          explanation: adjacentToEntrance
            ? `"${bedroom.name}" shares a wall with a corridor or foyer. This reduces acoustic and visual privacy. Consider placing buffer rooms between bedrooms and the entrance.`
            : `"${bedroom.name}" has adequate separation from public circulation areas.`,
        });
      }
    }

    if (results.length === 0) {
      results.push({
        constraintId: 'SC-PRI-001',
        passed: true,
        severity: ConstraintSeverity.SOFT,
        score: 15,
        maxScore: 15,
        message: 'Bedroom separation: no bedrooms to evaluate',
        affectedEntities: [],
        explanation: 'No bedrooms present.',
      });
    }

    return results;
  },
};

export const MasterIsolation: Constraint = {
  id: 'SC-PRI-002',
  name: 'Master Bedroom Isolation',
  description: 'Master bedroom should be isolated from public zones',
  category: ConstraintCategory.PRIVACY,
  severity: ConstraintSeverity.SOFT,
  enabled: true,

  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    const master = getMasterBedroom(ctx.building);
    if (!master) {
      return [{
        constraintId: 'SC-PRI-002',
        passed: true,
        severity: ConstraintSeverity.SOFT,
        score: 20,
        maxScore: 20,
        message: 'Master isolation: no master bedroom identified',
        affectedEntities: [],
        explanation: 'No master bedroom present to evaluate.',
      }];
    }

    const publicRooms = getPublicRooms(ctx.allRooms);
    let adjacentToPublic = false;

    for (const pub of publicRooms) {
      if (polygonsAdjacent(master.boundary, pub.boundary)) {
        adjacentToPublic = true;
        break;
      }
    }

    return [{
      constraintId: 'SC-PRI-002',
      passed: !adjacentToPublic,
      severity: ConstraintSeverity.SOFT,
      score: adjacentToPublic ? 0 : 20,
      maxScore: 20,
      message: adjacentToPublic
        ? `"${master.name}" is adjacent to a public room — privacy concern`
        : `"${master.name}" is well-isolated from public areas`,
      affectedEntities: adjacentToPublic ? [master.id] : [],
      explanation: adjacentToPublic
        ? `"${master.name}" shares a wall with a public room (living, dining, or foyer). For maximum privacy, place buffer spaces between the master suite and public areas.`
        : `"${master.name}" is separated from public zones, providing good acoustic and visual privacy.`,
    }];
  },
};

export const BathroomVisibility: Constraint = {
  id: 'SC-PRI-003',
  name: 'Bathroom Visibility',
  description: 'Bathroom doors should not open directly into living/dining areas',
  category: ConstraintCategory.PRIVACY,
  severity: ConstraintSeverity.SOFT,
  enabled: true,

  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    // Simplified: check if any bathroom is adjacent to living/dining
    const bathrooms = getRoomsByType(ctx.building, RoomType.Bathroom);
    const publicSpaces = ctx.allRooms.filter(r =>
      r.type === RoomType.Living || r.type === RoomType.Dining,
    );

    if (bathrooms.length === 0 || publicSpaces.length === 0) {
      return [{
        constraintId: 'SC-PRI-003',
        passed: true,
        severity: ConstraintSeverity.SOFT,
        score: 15,
        maxScore: 15,
        message: 'Bathroom visibility: not applicable',
        affectedEntities: [],
        explanation: 'No bathrooms or public spaces to evaluate.',
      }];
    }

    let visible = false;
    for (const bath of bathrooms) {
      for (const pub of publicSpaces) {
        if (polygonsAdjacent(bath.boundary, pub.boundary)) {
          visible = true;
          break;
        }
      }
      if (visible) break;
    }

    return [{
      constraintId: 'SC-PRI-003',
      passed: !visible,
      severity: ConstraintSeverity.SOFT,
      score: visible ? 0 : 15,
      maxScore: 15,
      message: visible
        ? 'A bathroom is directly adjacent to a living/dining area'
        : 'Bathrooms are well-hidden from public spaces',
      affectedEntities: [],
      explanation: visible
        ? 'A bathroom opens directly adjacent to living or dining. Consider adding a buffer corridor or repositioning.'
        : 'No bathroom directly abuts a public living space — good privacy.',
    }];
  },
};

export const GuestSeparation: Constraint = {
  id: 'SC-PRI-004',
  name: 'Guest Bedroom Separation',
  description: 'Guest bedroom should be separated from family bedrooms',
  category: ConstraintCategory.PRIVACY,
  severity: ConstraintSeverity.SOFT,
  enabled: true,

  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    const bedrooms = getRoomsByType(ctx.building, RoomType.Bedroom);

    if (bedrooms.length < 2) {
      return [{
        constraintId: 'SC-PRI-004',
        passed: true,
        severity: ConstraintSeverity.SOFT,
        score: 10,
        maxScore: 10,
        message: 'Guest separation: fewer than 2 bedrooms',
        affectedEntities: [],
        explanation: 'Fewer than 2 bedrooms — guest separation not applicable.',
      }];
    }

    // Check if at least one bedroom is non-adjacent to all others
    let hasSeparated = false;
    for (const bed of bedrooms) {
      const adjToOther = bedrooms.some(other =>
        other.id !== bed.id && polygonsAdjacent(bed.boundary, other.boundary),
      );
      if (!adjToOther) {
        hasSeparated = true;
        break;
      }
    }

    return [{
      constraintId: 'SC-PRI-004',
      passed: hasSeparated,
      severity: ConstraintSeverity.SOFT,
      score: hasSeparated ? 10 : 0,
      maxScore: 10,
      message: hasSeparated
        ? 'At least one bedroom is separated from others (potential guest room)'
        : 'All bedrooms are clustered together',
      affectedEntities: [],
      explanation: hasSeparated
        ? 'At least one bedroom is physically separated from the others, suitable for guest use.'
        : 'All bedrooms are adjacent to each other. Consider separating at least one for guest privacy.',
    }];
  },
};
