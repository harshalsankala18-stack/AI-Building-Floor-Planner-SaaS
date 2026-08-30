/**
 * Plan Validator — orchestrates constraint evaluation.
 * Runs all registered constraints and produces a ValidationSummary.
 */

import type { Building, PlanScore, CategoryScore } from '@ai-floor-planner/core';
import type {
  ConstraintResult,
  IPlanValidator,
  IConstraintRegistry,
  ValidationSummary,
  PlanValidationResult,
  SuggestedFix,
  ValidateOptions,
  ResolvedConstraintConfig,
} from './types';
import { ConstraintSeverity, ConstraintCategory } from './types';
import { createDefaultRegistry } from './constraints/index';
import { buildEvaluationContext } from './context';
import { resolveConfig } from './config';
import { computeAllCategoryEvaluations, computeAllCategoryScores, computeOverallScore } from './scoring';
import { resolveEvaluationStatus } from './evaluation-status';
import { EvaluationStatus } from './types';
import type { ConstraintConfig } from '@ai-floor-planner/core';

export class PlanValidator implements IPlanValidator {
  registry: IConstraintRegistry;
  private config: ResolvedConstraintConfig;
  private configOverrides: Partial<ConstraintConfig>;
  private readonly managesDefaultRegistry: boolean;

  constructor(
    registry?: IConstraintRegistry,
    config?: Partial<ConstraintConfig>,
    building?: Building,
  ) {
    this.config = resolveConfig(config, building);
    this.configOverrides = { ...config };
    this.managesDefaultRegistry = registry === undefined;
    this.registry = registry ?? createDefaultRegistry(this.config);

    if (this.registry.size === 0) {
      throw new Error(
        'PlanValidator requires at least one registered constraint. ' +
        'Use the default constructor or provide a populated constraint registry.',
      );
    }
  }

  /**
   * Full validation: evaluate all enabled constraints.
   */
  validate(building: Building, options?: ValidateOptions): ValidationSummary {
    const start = performance.now();

    // Resolve building-dependent values (especially orientation) on every pass.
    // A validator is intentionally reusable across projects in the editor.
    this.config = resolveConfig(this.configOverrides, building);

    // Build evaluation context (precomputes spatial index, envelope, etc.)
    const context = buildEvaluationContext(
      building,
      this.config,
      options?.requiredRoomTypes ? [...options.requiredRoomTypes] : [],
      options?.userPreferences ?? [],
      options?.allowIncompleteDraft ?? false,
      options?.requiredRoomCounts ?? {},
    );

    // Get applicable constraints
    let constraints = this.registry.getAll().filter(c => c.enabled);

    // Filter by category if specified
    if (options?.categories && options.categories.length > 0) {
      const catSet = new Set(options.categories);
      constraints = constraints.filter(c => catSet.has(c.category));
    }

    // Filter by specific IDs if specified
    if (options?.constraintIds && options.constraintIds.length > 0) {
      const idSet = new Set(options.constraintIds);
      constraints = constraints.filter(c => idSet.has(c.id));
    }

    if (constraints.length === 0) {
      throw new Error(
        'Plan validation cannot run because no enabled constraints matched the request.',
      );
    }

    // Run constraints
    const allResults: ConstraintResult[] = [];
    const shortCircuit = options?.shortCircuit ?? false;

    // HARD constraints first
    const hardConstraints = constraints.filter(c => c.severity === ConstraintSeverity.HARD);
    const softConstraints = constraints.filter(c => c.severity !== ConstraintSeverity.HARD);

    for (const constraint of hardConstraints) {
      const results = constraint.evaluate(context);
      allResults.push(...results);

      if (shortCircuit && results.some(r => !r.passed)) {
        break; // Stop on first hard failure
      }
    }

    // Run soft constraints (always, for diagnostic scoring)
    if (!shortCircuit || allResults.every(r => r.passed || r.severity !== ConstraintSeverity.HARD)) {
      for (const constraint of softConstraints) {
        const results = constraint.evaluate(context);
        allResults.push(...results);
      }
    }

    // Build category map for scoring
    const constraintCategoryMap = new Map<string, ConstraintCategory>();
    for (const c of this.registry.getAll()) {
      constraintCategoryMap.set(c.id, c.category);
    }

    // Compute scores
    const categoryScores = computeAllCategoryScores(allResults, this.config.weights, constraintCategoryMap);
    const categoryEvaluations = computeAllCategoryEvaluations(allResults, categoryScores, constraintCategoryMap);
    const overallScore = computeOverallScore(categoryScores);

    // Determine validity
    const violations = allResults.filter(r =>
      r.severity === ConstraintSeverity.HARD && resolveEvaluationStatus(r) === EvaluationStatus.FAIL,
    );
    const isValid = violations.length === 0;

    // Collect all violations (hard + soft)
    const allViolations = allResults.filter(r => {
      const status = resolveEvaluationStatus(r);
      return status === EvaluationStatus.FAIL || status === EvaluationStatus.WARNING;
    });

    // Collect suggestions
    const suggestions: SuggestedFix[] = [];
    for (const result of allViolations) {
      if (result.suggestedFixes) {
        suggestions.push(...result.suggestedFixes);
      }
    }
    suggestions.sort((a, b) => a.priority - b.priority);

    // Count warnings
    const warnings = allResults.filter(r => resolveEvaluationStatus(r) === EvaluationStatus.WARNING).length;

    const durationMs = performance.now() - start;

    return {
      isValid,
      overallScore,
      categoryScores,
      categoryEvaluations,
      totalConstraints: allResults.length,
      passed: allResults.filter(r => resolveEvaluationStatus(r) === EvaluationStatus.PASS).length,
      failed: violations.length,
      warnings,
      results: allResults,
      violations: allViolations,
      suggestions,
      timestamp: new Date().toISOString(),
      durationMs,
    };
  }

  /**
   * Validate a single constraint by ID.
   */
  validateOne(building: Building, constraintId: string): ConstraintResult[] {
    const constraint = this.registry.get(constraintId);
    if (!constraint) {
      return [{
        constraintId,
        passed: false,
        severity: ConstraintSeverity.HARD,
        score: 0,
        maxScore: 0,
        message: `Constraint "${constraintId}" not found in registry`,
        affectedEntities: [],
        explanation: `No constraint with ID "${constraintId}" is registered.`,
      }];
    }

    this.config = resolveConfig(this.configOverrides, building);
    const context = buildEvaluationContext(building, this.config);
    return constraint.evaluate(context);
  }

  /**
   * Quick validity check: only HARD constraints.
   */
  isValid(building: Building, options?: ValidateOptions): boolean {
    const summary = this.validate(building, {
      ...options,
      shortCircuit: true,
    });
    return summary.isValid;
  }

  /**
   * Score only: computes soft constraint scores without validity check.
   */
  score(building: Building, options?: ValidateOptions): PlanScore {
    const summary = this.validate(building, options);

    // Map to PlanScore format (from core types)
    const getOrEmpty = (cat: ConstraintCategory): CategoryScore =>
      summary.categoryScores[cat] ?? { category: cat, score: 0, maxScore: 100, weight: 0, details: [] };

    return {
      overall: summary.overallScore,
      categories: {
        geometry: getOrEmpty(ConstraintCategory.GEOMETRY),
        accessibility: getOrEmpty(ConstraintCategory.ACCESSIBILITY),
        daylight: getOrEmpty(ConstraintCategory.DAYLIGHT),
        privacy: getOrEmpty(ConstraintCategory.PRIVACY),
        vastu: getOrEmpty(ConstraintCategory.VASTU),
        adjacency: getOrEmpty(ConstraintCategory.CIRCULATION),
      },
      hardConstraintsPassed: summary.isValid,
      hardConstraintViolations: summary.violations
        .filter(v => v.severity === ConstraintSeverity.HARD)
        .map(v => ({
          constraintId: v.constraintId,
          description: v.message,
          severity: 'critical' as const,
          affectedEntities: [...v.affectedEntities],
          details: { explanation: v.explanation },
        })),
    };
  }

  /**
   * Plan validation returning structured PlanValidationResult according to Phase 4 spec.
   */
  validatePlan(building: Building, options?: ValidateOptions): PlanValidationResult {
    const summary = this.validate(building, options);
    const hardFailures = summary.results.filter(
      r => !r.passed && r.severity === ConstraintSeverity.HARD,
    );
    const warnings = summary.results.filter(
      r => r.severity === ConstraintSeverity.WARNING,
    );
    const informationalResults = summary.results.filter(
      r => r.severity === ConstraintSeverity.INFORMATIONAL,
    );

    return {
      valid: hardFailures.length === 0,
      hardFailures,
      warnings,
      informationalResults,
      softScore: summary.overallScore,
      categoryScores: summary.categoryScores,
      allResults: summary.results,
      suggestions: summary.suggestions,
      summary,
    };
  }

  /**
   * Update the configuration.
   */
  configure(config: Partial<ConstraintConfig>, building?: Building): void {
    this.configOverrides = { ...this.configOverrides, ...config };
    this.config = resolveConfig(this.configOverrides, building);
    if (this.managesDefaultRegistry) {
      this.registry = createDefaultRegistry(this.config);
    }
  }
}

/**
 * Top-level validatePlan function conforming to Phase 4 Specification.
 * Returns a structured result containing validity, hard failures, warnings, informational results, scores.
 */
export function validatePlan(
  building: Building,
  config?: Partial<ConstraintConfig>,
  options?: ValidateOptions,
): PlanValidationResult {
  const resolvedConfig = resolveConfig(config, building);
  const registry = createDefaultRegistry(resolvedConfig);
  const validator = new PlanValidator(registry, config, building);
  return validator.validatePlan(building, options);
}
