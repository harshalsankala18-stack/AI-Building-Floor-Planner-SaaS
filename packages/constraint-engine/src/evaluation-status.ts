import {
  ConstraintCategory,
  ConstraintSeverity,
  EvaluationStatus,
  type CategoryEvaluation,
  type ConstraintResult,
  type MetricClassification,
} from './types';

const NON_SCORABLE = new Set<EvaluationStatus>([
  EvaluationStatus.NOT_APPLICABLE,
  EvaluationStatus.NOT_ANALYZED,
  EvaluationStatus.NOT_CHECKED,
  EvaluationStatus.INSUFFICIENT_INPUT,
  EvaluationStatus.NOT_IMPLEMENTED,
]);

export function resolveEvaluationStatus(result: ConstraintResult): EvaluationStatus {
  if (result.status) return result.status;
  if (!result.passed) {
    return result.severity === ConstraintSeverity.HARD
      ? EvaluationStatus.FAIL
      : EvaluationStatus.WARNING;
  }

  // Compatibility guard for pre-status constraints. Explicit status is preferred,
  // but historical "not applicable = perfect points" results must never score.
  const evidence = `${result.message} ${result.explanation}`.toLowerCase();
  if (/not implemented/.test(evidence)) return EvaluationStatus.NOT_IMPLEMENTED;
  if (/not analyzed|not evaluated/.test(evidence)) return EvaluationStatus.NOT_ANALYZED;
  if (/insufficient (?:data|input)|no (?:windows|doors|columns) (?:defined|placed)|no floor boundary|cannot evaluate/.test(evidence)) {
    return EvaluationStatus.INSUFFICIENT_INPUT;
  }
  if (/not applicable|no .* to evaluate|no .* present|fewer than .* not applicable/.test(evidence)) {
    return EvaluationStatus.NOT_APPLICABLE;
  }
  return EvaluationStatus.PASS;
}

export function isScoreableResult(result: ConstraintResult): boolean {
  const status = resolveEvaluationStatus(result);
  return !NON_SCORABLE.has(status) && result.maxScore > 0;
}

function defaultClassification(category: ConstraintCategory): MetricClassification {
  if (category === ConstraintCategory.DAYLIGHT) return 'proxy';
  if (category === ConstraintCategory.STRUCTURAL || category === ConstraintCategory.VASTU) return 'heuristic';
  return 'calculated';
}

function unavailableStatus(results: readonly ConstraintResult[]): EvaluationStatus {
  const statuses = results.map(resolveEvaluationStatus);
  const priority = [
    EvaluationStatus.INSUFFICIENT_INPUT,
    EvaluationStatus.NOT_IMPLEMENTED,
    EvaluationStatus.NOT_ANALYZED,
    EvaluationStatus.NOT_CHECKED,
    EvaluationStatus.NOT_APPLICABLE,
  ];
  return priority.find(status => statuses.includes(status)) ?? EvaluationStatus.NOT_CHECKED;
}

export function summarizeCategoryEvaluation(
  category: ConstraintCategory,
  results: readonly ConstraintResult[],
  score: number | null,
): CategoryEvaluation {
  const insufficientInput = results.find(
    result => resolveEvaluationStatus(result) === EvaluationStatus.INSUFFICIENT_INPUT,
  );
  if (insufficientInput) {
    return {
      category,
      status: EvaluationStatus.INSUFFICIENT_INPUT,
      score: null,
      classification: insufficientInput.classification ?? defaultClassification(category),
      explanation: insufficientInput.explanation,
    };
  }

  const scoreable = results.filter(isScoreableResult);
  const statuses = scoreable.map(resolveEvaluationStatus);
  const status = scoreable.length === 0
    ? unavailableStatus(results)
    : statuses.includes(EvaluationStatus.FAIL)
      ? EvaluationStatus.FAIL
      : statuses.includes(EvaluationStatus.WARNING)
        ? EvaluationStatus.WARNING
        : EvaluationStatus.PASS;
  const classification = results.find(result => result.classification)?.classification
    ?? defaultClassification(category);
  const unavailable = results.find(result => resolveEvaluationStatus(result) === status);
  return {
    category,
    status,
    score: scoreable.length > 0 ? score : null,
    classification,
    explanation: unavailable?.explanation
      ?? (scoreable.length > 0 ? 'Calculated from applicable deterministic checks.' : 'No applicable scored check was available.'),
  };
}
