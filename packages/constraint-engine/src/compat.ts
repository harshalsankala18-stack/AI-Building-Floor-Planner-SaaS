/**
 * Backward-compatible wrapper.
 * Provides the legacy `validate()` function signature used by existing consumers.
 */

import type {
  Building,
  ValidationReport,
  ConstraintConfig,
  HardConstraintViolation,
  SoftConstraintViolation,
  RepairSuggestion,
  RoomType,
} from '@ai-floor-planner/core';
import { PlanValidator } from './validator';
import { createDefaultRegistry } from './constraints/index';
import { resolveConfig } from './config';
import { ConstraintSeverity } from './types';

/**
 * Legacy validate function — backward compatible with the Phase 3 API.
 *
 * @deprecated Use PlanValidator.validate() for the new architecture.
 */
export function validate(
  building: Building,
  config?: Partial<ConstraintConfig>,
  requiredRoomTypes: RoomType[] = [],
): ValidationReport {
  const resolvedConfig = resolveConfig(config, building);
  const registry = createDefaultRegistry(resolvedConfig);
  const validator = new PlanValidator(registry, config, building);

  const legacyOptions = {
    requiredRoomTypes,
    allowIncompleteDraft: true,
  };
  const summary = validator.validate(building, legacyOptions);

  // Convert ValidationSummary → ValidationReport
  const hardViolations: HardConstraintViolation[] = summary.violations
    .filter(v => v.severity === ConstraintSeverity.HARD)
    .map(v => ({
      constraintId: v.constraintId,
      description: v.message,
      severity: 'critical' as const,
      affectedEntities: [...v.affectedEntities],
      details: { explanation: v.explanation },
    }));

  const softViolations: SoftConstraintViolation[] = summary.violations
    .filter(v => v.severity !== ConstraintSeverity.HARD)
    .map(v => ({
      category: v.constraintId.startsWith('SC-') ? v.constraintId.split('-')[1]?.toLowerCase() ?? 'general' : 'general',
      factor: v.constraintId,
      description: v.message,
      severity: (v.severity === ConstraintSeverity.WARNING ? 'warning' : 'info') as 'warning' | 'info',
      scorePenalty: v.maxScore - v.score,
      affectedEntities: [...v.affectedEntities],
    }));

  const suggestions: RepairSuggestion[] = summary.suggestions.map((s) => ({
    constraintId: s.targetEntity ?? 'general',
    description: s.description,
    suggestedAction: s.description,
    affectedEntities: s.targetEntity ? [s.targetEntity] : [],
    priority: s.priority,
  }));

  return {
    isValid: summary.isValid,
    score: validator.score(building, legacyOptions),
    hardViolations,
    softViolations,
    suggestions,
    timestamp: summary.timestamp,
  };
}
