/**
 * Soft Constraints: Functional Zoning
 * SC-ZON-001: Public-Private separation
 * SC-ZON-002: Service zone grouping
 * SC-ZON-003: Night-Day separation
 */

import type { Constraint, ConstraintResult, EvaluationContext } from '../../types';
import { ConstraintSeverity, ConstraintCategory } from '../../types';
import { polygonsAdjacent } from '@ai-floor-planner/geometry-engine';
import { getPublicRooms, getPrivateRooms, getServiceRooms } from '../../helpers/zone-classification';

export const PublicPrivateSeparation: Constraint = {
  id: 'SC-ZON-001',
  name: 'Public-Private Zone Separation',
  description: 'Public zone rooms should be separated from private zone rooms',
  category: ConstraintCategory.FUNCTIONAL_ZONING,
  severity: ConstraintSeverity.SOFT,
  enabled: true,

  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    const publicRooms = getPublicRooms(ctx.allRooms);
    const privateRooms = getPrivateRooms(ctx.allRooms);

    if (publicRooms.length === 0 || privateRooms.length === 0) {
      return [{
        constraintId: 'SC-ZON-001',
        passed: true,
        severity: ConstraintSeverity.SOFT,
        score: 25,
        maxScore: 25,
        message: 'Zone separation: not applicable (missing zone)',
        affectedEntities: [],
        explanation: 'Cannot evaluate zone separation — one zone has no rooms.',
      }];
    }

    // Count how many public-private adjacency pairs exist
    let crossZoneAdjacencies = 0;
    for (const pub of publicRooms) {
      for (const priv of privateRooms) {
        if (polygonsAdjacent(pub.boundary, priv.boundary)) {
          crossZoneAdjacencies++;
        }
      }
    }

    // Fewer cross-zone adjacencies = better separation
    const maxPairs = publicRooms.length * privateRooms.length;
    const ratio = crossZoneAdjacencies / maxPairs;

    let score: number;
    if (ratio <= 0.1) score = 25;
    else if (ratio <= 0.3) score = 18;
    else if (ratio <= 0.5) score = 10;
    else score = 3;

    return [{
      constraintId: 'SC-ZON-001',
      passed: score >= 18,
      severity: ConstraintSeverity.SOFT,
      score,
      maxScore: 25,
      message: crossZoneAdjacencies === 0
        ? 'Excellent public-private zone separation'
        : `${crossZoneAdjacencies} cross-zone adjacencies between public and private rooms`,
      affectedEntities: [],
      explanation: `The plan has ${crossZoneAdjacencies} point(s) where public rooms directly touch private rooms. Fewer direct contacts means better functional separation.`,
    }];
  },
};

export const ServiceZoneGrouping: Constraint = {
  id: 'SC-ZON-002',
  name: 'Service Zone Grouping',
  description: 'Service rooms (kitchen, utility) should be grouped together',
  category: ConstraintCategory.FUNCTIONAL_ZONING,
  severity: ConstraintSeverity.SOFT,
  enabled: true,

  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    const serviceRooms = getServiceRooms(ctx.allRooms);

    if (serviceRooms.length < 2) {
      return [{
        constraintId: 'SC-ZON-002',
        passed: true,
        severity: ConstraintSeverity.SOFT,
        score: 15,
        maxScore: 15,
        message: 'Service grouping: fewer than 2 service rooms',
        affectedEntities: [],
        explanation: 'Not enough service rooms to evaluate grouping.',
      }];
    }

    // Check if at least one pair of service rooms is adjacent
    let hasGrouping = false;
    for (let i = 0; i < serviceRooms.length; i++) {
      for (let j = i + 1; j < serviceRooms.length; j++) {
        if (polygonsAdjacent(serviceRooms[i]!.boundary, serviceRooms[j]!.boundary)) {
          hasGrouping = true;
          break;
        }
      }
      if (hasGrouping) break;
    }

    return [{
      constraintId: 'SC-ZON-002',
      passed: hasGrouping,
      severity: ConstraintSeverity.SOFT,
      score: hasGrouping ? 15 : 0,
      maxScore: 15,
      message: hasGrouping
        ? 'Service rooms are grouped together'
        : 'Service rooms are scattered — not grouped',
      affectedEntities: hasGrouping ? [] : serviceRooms.map(r => r.id),
      explanation: hasGrouping
        ? 'At least two service rooms (kitchen, utility, etc.) are adjacent, supporting efficient service flow.'
        : 'Service rooms are not adjacent to each other. Grouping them improves workflow and plumbing efficiency.',
    }];
  },
};

export const NightDaySeparation: Constraint = {
  id: 'SC-ZON-003',
  name: 'Night-Day Room Separation',
  description: 'Night-use rooms (bedrooms) should be separated from day-use rooms',
  category: ConstraintCategory.FUNCTIONAL_ZONING,
  severity: ConstraintSeverity.SOFT,
  enabled: true,

  evaluate(ctx: EvaluationContext): ConstraintResult[] {
    const nightRooms = ctx.allRooms.filter(r =>
      r.type === 'bedroom' || r.type === 'bathroom',
    );
    const dayRooms = ctx.allRooms.filter(r =>
      r.type === 'living' || r.type === 'dining' || r.type === 'kitchen',
    );

    if (nightRooms.length === 0 || dayRooms.length === 0) {
      return [{
        constraintId: 'SC-ZON-003',
        passed: true,
        severity: ConstraintSeverity.SOFT,
        score: 15,
        maxScore: 15,
        message: 'Night-Day separation: not applicable',
        affectedEntities: [],
        explanation: 'Cannot evaluate — missing night or day rooms.',
      }];
    }

    // Count direct night-day adjacencies (bedrooms touching living/dining/kitchen)
    let directContacts = 0;
    for (const night of nightRooms) {
      if (night.type !== 'bedroom') continue; // only count bedrooms, not bathrooms
      for (const day of dayRooms) {
        if (polygonsAdjacent(night.boundary, day.boundary)) {
          directContacts++;
        }
      }
    }

    const score = directContacts === 0 ? 15 : directContacts <= 1 ? 10 : 3;

    return [{
      constraintId: 'SC-ZON-003',
      passed: directContacts <= 1,
      severity: ConstraintSeverity.SOFT,
      score,
      maxScore: 15,
      message: directContacts === 0
        ? 'Excellent night-day separation'
        : `${directContacts} bedroom(s) directly adjacent to living/kitchen areas`,
      affectedEntities: [],
      explanation: directContacts === 0
        ? 'No bedrooms directly touch active day-use rooms. Good acoustic separation.'
        : `${directContacts} bedroom(s) share walls with kitchen, living, or dining rooms. This may cause noise disturbance.`,
    }];
  },
};
