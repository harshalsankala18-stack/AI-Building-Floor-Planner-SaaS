import type {
  ConstraintResult,
  ValidationSummary,
} from '@ai-floor-planner/constraint-engine';
import { ConstraintSeverity } from '@ai-floor-planner/constraint-engine';
import {
  ConstraintCategory,
  EvaluationStatus,
  type MetricClassification,
} from '@ai-floor-planner/constraint-engine';

export type ValidationFilter = 'all' | 'critical' | 'advisory';

export interface ValidationCategoryDatum {
  readonly id: string;
  readonly label: string;
  readonly score: number | null;
  readonly weight: number;
  readonly status: EvaluationStatus;
  readonly classification: MetricClassification;
  readonly explanation: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  accessibility: 'Access',
  circulation: 'Flow',
  daylight: 'Daylight Potential',
  functional_zoning: 'Zoning',
  geometry: 'Geometry',
  privacy: 'Privacy',
  user_preference: 'Preferences',
  structural: 'Structural Coordination',
  vastu: 'Vastu Guidance',
};

export function getValidationCategories(
  summary: ValidationSummary,
): ValidationCategoryDatum[] {
  const categories = Object.entries(summary.categoryScores)
    .filter((entry): entry is [string, NonNullable<(typeof entry)[1]>] => Boolean(entry[1]))
    .map(([id, category]) => {
      const evaluation = summary.categoryEvaluations[id as ConstraintCategory];
      return {
        id,
        label: CATEGORY_LABELS[id] ?? id.replace(/_/g, ' '),
        score: evaluation?.score ?? null,
        weight: category.weight,
        status: evaluation?.status ?? EvaluationStatus.NOT_CHECKED,
        classification: evaluation?.classification ?? 'calculated',
        explanation: evaluation?.explanation ?? 'This check has not been evaluated.',
      } satisfies ValidationCategoryDatum;
    });

  categories.push({
    id: 'structural_analysis',
    label: 'Structural Analysis',
    score: null,
    weight: 0,
    status: EvaluationStatus.NOT_IMPLEMENTED,
    classification: 'not_implemented',
    explanation: 'No structural solver is implemented. Coordination heuristics are not structural safety analysis.',
  });
  return categories.sort((a, b) => b.weight - a.weight || a.label.localeCompare(b.label));
}

export function filterValidationIssues(
  issues: readonly ConstraintResult[],
  filter: ValidationFilter,
): ConstraintResult[] {
  if (filter === 'all') return [...issues];
  if (filter === 'critical') {
    return issues.filter(issue => issue.severity === ConstraintSeverity.HARD);
  }
  return issues.filter(issue => issue.severity !== ConstraintSeverity.HARD);
}

export function getAffectedEntityIds(summary: ValidationSummary): Set<string> {
  return new Set(summary.violations.flatMap(issue => issue.affectedEntities));
}

export function getQualityLabel(score: number): string {
  if (score >= 90) return 'Exceptional';
  if (score >= 80) return 'High quality';
  if (score >= 65) return 'Promising';
  if (score >= 45) return 'Needs refinement';
  return 'Critical review';
}
