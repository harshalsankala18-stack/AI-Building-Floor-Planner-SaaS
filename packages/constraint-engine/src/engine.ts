/**
 * Constraint Engine — main entry point.
 *
 * Evaluates a Building against all hard and soft constraints,
 * producing a ValidationReport with scores and violations.
 */

import type {
  Building,
  ValidationReport,
  PlanScore,
  ConstraintConfig,
  HardConstraintViolation,
  SoftConstraintViolation,
  RepairSuggestion,
  CategoryScore,
} from '@ai-floor-planner/core';
import { RoomType } from '@ai-floor-planner/core';

import { runAllHardConstraints } from './hard-constraints';
import {
  scoreDaylight,
  scorePrivacy,
  scoreVastu,
  scoreAdjacency,
  scoreGeometry,
  scoreAccessibility,
} from './soft-scorers';

/** Default constraint configuration. */
export const DEFAULT_CONSTRAINT_CONFIG: ConstraintConfig = {
  enableVastu: true,
  vastuStrictness: 'moderate',
  minimumRoomSizes: {},
  minimumCorridorWidth: 900,
  weights: {
    geometry: 0.20,
    accessibility: 0.25,
    daylight: 0.15,
    privacy: 0.15,
    vastu: 0.10,
    adjacency: 0.15,
  },
};

/**
 * Validate a building against all constraints.
 * Returns a complete ValidationReport.
 */
export function validate(
  building: Building,
  config: ConstraintConfig = DEFAULT_CONSTRAINT_CONFIG,
  requiredRoomTypes: RoomType[] = [],
): ValidationReport {
  // 1. Run hard constraints
  const hardViolations = runAllHardConstraints(building, requiredRoomTypes);
  const isValid = hardViolations.length === 0;

  // 2. Compute weights (redistribute vastu weight if disabled)
  const weights = { ...config.weights };
  if (!config.enableVastu) {
    const vastuWeight = weights['vastu'] ?? 0.10;
    delete weights['vastu'];
    const remaining = Object.keys(weights);
    const bonus = vastuWeight / remaining.length;
    for (const key of remaining) {
      weights[key] = (weights[key] ?? 0) + bonus;
    }
  }

  // 3. Run soft scorers
  const geometry = scoreGeometry(building, weights['geometry'] ?? 0.20);
  const accessibility = scoreAccessibility(building, weights['accessibility'] ?? 0.25);
  const daylight = scoreDaylight(building, weights['daylight'] ?? 0.15);
  const privacy = scorePrivacy(building, weights['privacy'] ?? 0.15);
  const vastu = config.enableVastu
    ? scoreVastu(building, weights['vastu'] ?? 0.10)
    : emptyCategory('vastu', 0);
  const adjacency = scoreAdjacency(building, weights['adjacency'] ?? 0.15);

  // 4. Compute overall score (weighted average)
  const categories = { geometry, accessibility, daylight, privacy, vastu, adjacency };
  let weightedSum = 0;
  let totalWeight = 0;

  for (const cat of Object.values(categories)) {
    weightedSum += cat.score * cat.weight;
    totalWeight += cat.weight;
  }

  const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  const score: PlanScore = {
    overall,
    categories,
    hardConstraintsPassed: isValid,
    hardConstraintViolations: hardViolations,
  };

  // 5. Collect soft violations
  const softViolations: SoftConstraintViolation[] = [];
  for (const cat of Object.values(categories)) {
    for (const detail of cat.details) {
      if (detail.points < detail.maxPoints) {
        softViolations.push({
          category: cat.category,
          factor: detail.factor,
          description: detail.description,
          severity: detail.points === 0 ? 'warning' : 'info',
          scorePenalty: detail.maxPoints - detail.points,
          affectedEntities: [],
        });
      }
    }
  }

  // 6. Generate repair suggestions for hard violations
  const suggestions: RepairSuggestion[] = hardViolations.map((v, i) =>
    generateSuggestion(v, i),
  );

  return {
    isValid,
    score,
    hardViolations,
    softViolations,
    suggestions,
    timestamp: new Date().toISOString(),
  };
}

function emptyCategory(category: string, weight: number): CategoryScore {
  return {
    category,
    score: 0,
    maxScore: 100,
    weight,
    details: [],
  };
}

function generateSuggestion(
  violation: HardConstraintViolation,
  index: number,
): RepairSuggestion {
  const suggestions: Record<string, string> = {
    'HC-001': 'Move or resize the room to fit within the floor boundary',
    'HC-002': 'Reduce the floor footprint to respect setback requirements',
    'HC-003': 'Move one of the overlapping rooms to eliminate overlap',
    'HC-004': 'Correct the room boundary to form a valid polygon',
    'HC-005': 'Ensure the room has positive width and height',
    'HC-006': 'Correct wall endpoints to ensure non-zero length',
    'HC-011': 'Place the door on an existing wall',
    'HC-020': 'Add the missing required room to the plan',
    'HC-023': 'Increase room dimensions to meet minimum size requirements',
  };

  return {
    constraintId: violation.constraintId,
    description: violation.description,
    suggestedAction: suggestions[violation.constraintId] ?? 'Review and correct the violation',
    affectedEntities: [...violation.affectedEntities],
    priority: index + 1,
  };
}
