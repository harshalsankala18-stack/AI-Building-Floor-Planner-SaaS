/**
 * Score aggregation and normalization.
 * Computes category scores and overall weighted score from constraint results.
 */

import type { CategoryScore, ScoreDetail } from '@ai-floor-planner/core';
import type { ConstraintResult, CategoryWeights } from './types';
import { ConstraintSeverity, ConstraintCategory } from './types';
import type { CategoryEvaluation } from './types';
import { isScoreableResult, summarizeCategoryEvaluation } from './evaluation-status';

/**
 * Compute a category score from a set of constraint results.
 */
export function computeCategoryScore(
  results: ConstraintResult[],
  category: string,
  weight: number,
): CategoryScore {
  // Only include SOFT/WARNING results for scoring
  const scoreable = results.filter(r =>
    (r.severity === ConstraintSeverity.SOFT || r.severity === ConstraintSeverity.WARNING)
    && isScoreableResult(r),
  );

  if (scoreable.length === 0) {
    return {
      category,
      score: 0,
      maxScore: 100,
      weight: 0,
      details: [],
    };
  }

  const totalEarned = scoreable.reduce((s, r) => s + r.score, 0);
  const totalPossible = scoreable.reduce((s, r) => s + r.maxScore, 0);

  const normalized = totalPossible > 0
    ? Math.round((totalEarned / totalPossible) * 100)
    : 0;

  const details: ScoreDetail[] = scoreable.map(r => ({
    factor: r.constraintId,
    points: r.score,
    maxPoints: r.maxScore,
    description: r.message,
  }));

  return {
    category,
    score: Math.max(0, Math.min(100, normalized)),
    maxScore: 100,
    weight,
    details,
  };
}

/**
 * Compute the overall weighted score from category scores.
 */
export function computeOverallScore(
  categoryScores: Partial<Record<ConstraintCategory, CategoryScore>>,
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const cat of Object.values(categoryScores)) {
    if (cat && cat.weight > 0) {
      weightedSum += cat.score * cat.weight;
      totalWeight += cat.weight;
    }
  }

  if (totalWeight === 0) return 0;
  return Math.round(weightedSum / totalWeight);
}

/**
 * Group constraint results by their category and compute scores for each.
 * Uses the configured weights.
 */
export function computeAllCategoryScores(
  results: ConstraintResult[],
  weights: CategoryWeights,
  constraintCategoryMap: Map<string, ConstraintCategory>,
): Partial<Record<ConstraintCategory, CategoryScore>> {
  // Group results by category
  const grouped = new Map<ConstraintCategory, ConstraintResult[]>();

  for (const result of results) {
    const category = constraintCategoryMap.get(result.constraintId) ?? ConstraintCategory.GEOMETRY;
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(result);
  }

  // Compute score for each category
  const scores: Partial<Record<ConstraintCategory, CategoryScore>> = {};

  for (const [category, categoryResults] of grouped) {
    const weight = (weights as unknown as Record<string, number>)[category] ?? 0;
    scores[category] = computeCategoryScore(categoryResults, category, weight);
  }

  // Ensure all configured categories have an entry (even if no constraints ran for them)
  for (const category of Object.keys(weights)) {
    if (!scores[category as ConstraintCategory]) {
      scores[category as ConstraintCategory] = {
        category,
        score: 0,
        maxScore: 100,
        weight: 0,
        details: [],
      };
    }
  }

  return scores;
}

export function computeAllCategoryEvaluations(
  results: ConstraintResult[],
  scores: Partial<Record<ConstraintCategory, CategoryScore>>,
  constraintCategoryMap: Map<string, ConstraintCategory>,
): Partial<Record<ConstraintCategory, CategoryEvaluation>> {
  const grouped = new Map<ConstraintCategory, ConstraintResult[]>();
  for (const result of results) {
    const category = constraintCategoryMap.get(result.constraintId) ?? ConstraintCategory.GEOMETRY;
    const group = grouped.get(category) ?? [];
    group.push(result);
    grouped.set(category, group);
  }
  const categories = new Set<ConstraintCategory>([
    ...Object.values(ConstraintCategory),
    ...grouped.keys(),
  ]);
  const evaluations: Partial<Record<ConstraintCategory, CategoryEvaluation>> = {};
  for (const category of categories) {
    const categoryScore = scores[category];
    evaluations[category] = summarizeCategoryEvaluation(
      category,
      grouped.get(category) ?? [],
      categoryScore && categoryScore.weight > 0 ? categoryScore.score : null,
    );
  }
  return evaluations;
}
