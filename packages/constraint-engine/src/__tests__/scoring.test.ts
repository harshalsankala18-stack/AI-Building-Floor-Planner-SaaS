import { describe, it, expect } from 'vitest';
import {
  computeCategoryScore,
  computeOverallScore,
  computeAllCategoryScores,
} from '../scoring';
import { ConstraintCategory, ConstraintSeverity, EvaluationStatus } from '../types';
import type { ConstraintResult } from '../types';
import { DEFAULT_WEIGHTS_NO_VASTU } from '../config';

describe('Scoring Module', () => {
  it('gives an unscored category zero weight instead of a fake perfect score', () => {
    const score = computeCategoryScore([], ConstraintCategory.GEOMETRY, 0.2);
    expect(score.score).toBe(0);
    expect(score.maxScore).toBe(100);
    expect(score.weight).toBe(0);
  });

  it('excludes NOT_APPLICABLE results from the applicable denominator', () => {
    const results: ConstraintResult[] = [
      {
        constraintId: 'SC-A', passed: true, severity: ConstraintSeverity.SOFT,
        score: 8, maxScore: 10, message: 'Calculated A', affectedEntities: [], explanation: '',
      },
      {
        constraintId: 'SC-B', passed: true, severity: ConstraintSeverity.SOFT,
        score: 10, maxScore: 10, status: EvaluationStatus.NOT_APPLICABLE,
        message: 'Not applicable', affectedEntities: [], explanation: '',
      },
      {
        constraintId: 'SC-C', passed: true, severity: ConstraintSeverity.SOFT,
        score: 6, maxScore: 10, message: 'Calculated C', affectedEntities: [], explanation: '',
      },
    ];
    expect(computeCategoryScore(results, ConstraintCategory.GEOMETRY, 1).score).toBe(70);
  });

  it('normalizes category score earned over possible', () => {
    const results: ConstraintResult[] = [
      {
        constraintId: 'SC-1',
        passed: true,
        severity: ConstraintSeverity.SOFT,
        score: 15,
        maxScore: 20,
        message: 'Partial pass',
        affectedEntities: [],
        explanation: '',
      },
      {
        constraintId: 'SC-2',
        passed: false,
        severity: ConstraintSeverity.SOFT,
        score: 5,
        maxScore: 10,
        message: 'Partial fail',
        affectedEntities: [],
        explanation: '',
      },
    ];
    // Total earned: 20, total max: 30 => 20/30 = 66.66% -> rounded 67
    const catScore = computeCategoryScore(results, ConstraintCategory.DAYLIGHT, 0.15);
    expect(catScore.score).toBe(67);
    expect(catScore.details).toHaveLength(2);
  });

  it('ignores HARD constraints in category soft scoring', () => {
    const results: ConstraintResult[] = [
      {
        constraintId: 'HC-001',
        passed: false,
        severity: ConstraintSeverity.HARD,
        score: 0,
        maxScore: 0,
        message: 'Hard failure',
        affectedEntities: [],
        explanation: '',
      },
      {
        constraintId: 'SC-GEO-001',
        passed: true,
        severity: ConstraintSeverity.SOFT,
        score: 10,
        maxScore: 10,
        message: 'Passed',
        affectedEntities: [],
        explanation: '',
      },
    ];
    const catScore = computeCategoryScore(results, ConstraintCategory.GEOMETRY, 0.2);
    expect(catScore.score).toBe(100);
  });

  it('computes overall weighted average score', () => {
    const categoryScores = {
      [ConstraintCategory.GEOMETRY]: { category: 'geometry', score: 80, maxScore: 100, weight: 0.5, details: [] },
      [ConstraintCategory.DAYLIGHT]: { category: 'daylight', score: 60, maxScore: 100, weight: 0.5, details: [] },
    };
    const overall = computeOverallScore(categoryScores);
    expect(overall).toBe(70);
  });

  it('handles weights when Vastu is disabled', () => {
    const results: ConstraintResult[] = [
      {
        constraintId: 'SC-GEO-001',
        passed: true,
        severity: ConstraintSeverity.SOFT,
        score: 10,
        maxScore: 10,
        message: '',
        affectedEntities: [],
        explanation: '',
      },
    ];
    const map = new Map<string, ConstraintCategory>([
      ['SC-GEO-001', ConstraintCategory.GEOMETRY],
    ]);

    const catScores = computeAllCategoryScores(results, DEFAULT_WEIGHTS_NO_VASTU, map);
    expect(catScores[ConstraintCategory.VASTU]?.weight).toBe(0);
    const overall = computeOverallScore(catScores);
    expect(overall).toBe(100);
  });

  it('clamps overall score between 0 and 100', () => {
    const perfectCategories = {
      [ConstraintCategory.GEOMETRY]: { category: 'geometry', score: 100, maxScore: 100, weight: 1.0, details: [] },
    };
    expect(computeOverallScore(perfectCategories)).toBe(100);

    const zeroCategories = {
      [ConstraintCategory.GEOMETRY]: { category: 'geometry', score: 0, maxScore: 100, weight: 1.0, details: [] },
    };
    expect(computeOverallScore(zeroCategories)).toBe(0);
  });
});
