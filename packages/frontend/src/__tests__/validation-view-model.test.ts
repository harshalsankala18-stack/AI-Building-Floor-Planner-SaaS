import { describe, expect, it } from 'vitest';
import {
  ConstraintCategory,
  ConstraintSeverity,
  EvaluationStatus,
  type ValidationSummary,
} from '@ai-floor-planner/constraint-engine';
import {
  filterValidationIssues,
  getAffectedEntityIds,
  getQualityLabel,
  getValidationCategories,
} from '../components/validation/validation-view-model';

const summary: ValidationSummary = {
  isValid: false,
  overallScore: 72,
  categoryScores: {
    [ConstraintCategory.GEOMETRY]: {
      category: ConstraintCategory.GEOMETRY,
      score: 54.4,
      maxScore: 100,
      weight: 1,
      details: [],
    },
    [ConstraintCategory.DAYLIGHT]: {
      category: ConstraintCategory.DAYLIGHT,
      score: 91.2,
      maxScore: 100,
      weight: 0.8,
      details: [],
    },
  },
  categoryEvaluations: {
    [ConstraintCategory.GEOMETRY]: {
      category: ConstraintCategory.GEOMETRY,
      status: EvaluationStatus.WARNING,
      score: 54,
      classification: 'calculated',
      explanation: 'Calculated geometry checks.',
    },
    [ConstraintCategory.DAYLIGHT]: {
      category: ConstraintCategory.DAYLIGHT,
      status: EvaluationStatus.PASS,
      score: 91,
      classification: 'proxy',
      explanation: 'Geometry-based daylight potential.',
    },
  },
  totalConstraints: 3,
  passed: 1,
  failed: 1,
  warnings: 1,
  results: [],
  violations: [
    {
      constraintId: 'HC-003',
      passed: false,
      severity: ConstraintSeverity.HARD,
      score: 0,
      maxScore: 100,
      message: 'Rooms overlap',
      affectedEntities: ['room-a', 'room-b'],
      explanation: 'Rooms cannot occupy the same area.',
    },
    {
      constraintId: 'SC-001',
      passed: false,
      severity: ConstraintSeverity.WARNING,
      score: 50,
      maxScore: 100,
      message: 'Low daylight',
      affectedEntities: ['room-b'],
      explanation: 'The room has limited external exposure.',
    },
  ],
  suggestions: [],
  timestamp: '2026-08-23T00:00:00.000Z',
  durationMs: 1.25,
};

describe('Phase 10 validation view model', () => {
  it('normalizes and orders category scores for visualization', () => {
    expect(getValidationCategories(summary)).toEqual([
      {
        id: 'geometry', label: 'Geometry', score: 54, weight: 1,
        status: EvaluationStatus.WARNING, classification: 'calculated',
        explanation: 'Calculated geometry checks.',
      },
      {
        id: 'daylight', label: 'Daylight Potential', score: 91, weight: 0.8,
        status: EvaluationStatus.PASS, classification: 'proxy',
        explanation: 'Geometry-based daylight potential.',
      },
      {
        id: 'structural_analysis', label: 'Structural Analysis', score: null, weight: 0,
        status: EvaluationStatus.NOT_IMPLEMENTED, classification: 'not_implemented',
        explanation: 'No structural solver is implemented. Coordination heuristics are not structural safety analysis.',
      },
    ]);
  });

  it('filters critical and advisory issues without losing the source summary', () => {
    expect(filterValidationIssues(summary.violations, 'critical')).toHaveLength(1);
    expect(filterValidationIssues(summary.violations, 'advisory')[0]?.constraintId).toBe('SC-001');
    expect(summary.violations).toHaveLength(2);
  });

  it('deduplicates affected entity ids used by canvas highlighting', () => {
    expect([...getAffectedEntityIds(summary)].sort()).toEqual(['room-a', 'room-b']);
  });

  it('communicates quality bands in plain language', () => {
    expect(getQualityLabel(96)).toBe('Exceptional');
    expect(getQualityLabel(83)).toBe('High quality');
    expect(getQualityLabel(30)).toBe('Critical review');
  });
});
