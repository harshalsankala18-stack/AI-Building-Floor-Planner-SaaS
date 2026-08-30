/**
 * Phase 4 Constraint Engine — Type Definitions
 *
 * Formal constraint abstraction, registry, validator, and evaluation types.
 */

import type {
  Building,
  Floor,
  Room,
  Polygon,
  CategoryScore,
  PlanScore,
  RoomType,
} from '@ai-floor-planner/core';
import type { ISpatialIndex } from '@ai-floor-planner/geometry-engine';

// ─── Enums ──────────────────────────────────────────────────────────────────

/** Constraint severity levels. */
export enum ConstraintSeverity {
  /** Plan is INVALID if violated. Cannot be overridden by score. */
  HARD = 'hard',
  /** Reduces plan quality score. Plan remains valid. */
  SOFT = 'soft',
  /** Informational flag. Small score impact. */
  WARNING = 'warning',
  /** Pure information. No score impact. */
  INFORMATIONAL = 'informational',
}

/** Constraint categories. */
export enum ConstraintCategory {
  GEOMETRY = 'geometry',
  PROGRAM = 'program',
  ACCESSIBILITY = 'accessibility',
  CIRCULATION = 'circulation',
  DAYLIGHT = 'daylight',
  PRIVACY = 'privacy',
  FUNCTIONAL_ZONING = 'functional_zoning',
  STRUCTURAL = 'structural',
  VASTU = 'vastu',
  REGULATORY = 'regulatory',
  USER_PREFERENCE = 'user_preference',
}

/** Evaluation state is independent from legacy pass/fail and numerical scoring. */
export enum EvaluationStatus {
  PASS = 'PASS',
  FAIL = 'FAIL',
  WARNING = 'WARNING',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  NOT_ANALYZED = 'NOT_ANALYZED',
  NOT_CHECKED = 'NOT_CHECKED',
  INSUFFICIENT_INPUT = 'INSUFFICIENT_INPUT',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
}

export type MetricClassification = 'calculated' | 'heuristic' | 'proxy' | 'not_implemented';

// ─── Suggested Fix ──────────────────────────────────────────────────────────

/** A repair suggestion attached to a constraint result. */
export interface SuggestedFix {
  readonly description: string;
  readonly actionType: 'move' | 'resize' | 'add' | 'remove' | 'reorient';
  readonly targetEntity?: string;
  readonly parameters?: Record<string, unknown>;
  readonly priority: number;
}

// ─── Constraint Result ──────────────────────────────────────────────────────

/** The result of evaluating a single constraint. */
export interface ConstraintResult {
  readonly constraintId: string;
  readonly passed: boolean;
  readonly severity: ConstraintSeverity;
  readonly score: number;
  readonly maxScore: number;
  readonly message: string;
  readonly affectedEntities: readonly string[];
  readonly explanation: string;
  readonly suggestedFixes?: readonly SuggestedFix[];
  /** Explicit status for non-binary states. Omitted legacy results are resolved centrally. */
  readonly status?: EvaluationStatus;
  /** Communicates the strength of evidence behind the result. */
  readonly classification?: MetricClassification;
}

export interface CategoryEvaluation {
  readonly category: ConstraintCategory;
  readonly status: EvaluationStatus;
  readonly score: number | null;
  readonly classification: MetricClassification;
  readonly explanation: string;
}

// ─── Evaluation Context ─────────────────────────────────────────────────────

/** Resolved configuration for constraint evaluation. */
export interface ResolvedConstraintConfig {
  readonly enableVastu: boolean;
  readonly vastuStrictness: 'strict' | 'moderate' | 'flexible';
  readonly minimumRoomSizes: Record<string, number>;
  readonly minimumDimensions: Record<string, number>;
  readonly minimumCorridorWidth: number;
  readonly weights: CategoryWeights;
  readonly orientation: number;
}

/** Category weight configuration. */
export interface CategoryWeights {
  readonly [ConstraintCategory.GEOMETRY]: number;
  readonly [ConstraintCategory.ACCESSIBILITY]: number;
  readonly [ConstraintCategory.CIRCULATION]: number;
  readonly [ConstraintCategory.DAYLIGHT]: number;
  readonly [ConstraintCategory.PRIVACY]: number;
  readonly [ConstraintCategory.FUNCTIONAL_ZONING]: number;
  readonly [ConstraintCategory.VASTU]: number;
  readonly [ConstraintCategory.USER_PREFERENCE]: number;
}

/** User constraint preference (structured input from AI layer). */
export interface UserConstraintPreference {
  readonly type: 'adjacency' | 'separation' | 'orientation' | 'size' | 'position';
  readonly subject: string;
  readonly target?: string;
  readonly strength: 'required' | 'preferred' | 'avoid';
  readonly weight?: number;
}

/**
 * Context passed to every constraint evaluator.
 * Contains precomputed data to avoid redundant geometry operations.
 */
export interface EvaluationContext {
  readonly building: Building;
  readonly buildableEnvelope: Polygon;
  readonly spatialIndex: ISpatialIndex<string>;
  readonly config: ResolvedConstraintConfig;
  readonly requiredRoomTypes: RoomType[];
  readonly requiredRoomCounts: Partial<Record<RoomType, number>>;
  readonly userPreferences: readonly UserConstraintPreference[];
  readonly allRooms: readonly Room[];
  readonly floorMap: ReadonlyMap<string, Floor>;
  /** Allows room-only schematic fixtures/imports to defer door connectivity. */
  readonly allowIncompleteDraft: boolean;
}

// ─── Constraint Interface ───────────────────────────────────────────────────

/**
 * A constraint is a named, self-describing rule that can evaluate a Building.
 */
export interface Constraint {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: ConstraintCategory;
  readonly severity: ConstraintSeverity;
  enabled: boolean;
  evaluate(context: EvaluationContext): ConstraintResult[];
}

// ─── Constraint Registry ────────────────────────────────────────────────────

/** Central registry that holds all constraints. */
export interface IConstraintRegistry {
  register(constraint: Constraint): void;
  registerAll(constraints: Constraint[]): void;
  get(id: string): Constraint | undefined;
  getAll(): readonly Constraint[];
  getByCategory(category: ConstraintCategory): readonly Constraint[];
  getBySeverity(severity: ConstraintSeverity): readonly Constraint[];
  setEnabled(id: string, enabled: boolean): void;
  unregister(id: string): void;
  has(id: string): boolean;
  readonly size: number;
}

// ─── Validation Summary ─────────────────────────────────────────────────────

/** Complete result of plan-level evaluation. */
export interface ValidationSummary {
  readonly isValid: boolean;
  readonly overallScore: number;
  readonly categoryScores: Partial<Record<ConstraintCategory, CategoryScore>>;
  readonly categoryEvaluations: Partial<Record<ConstraintCategory, CategoryEvaluation>>;
  readonly totalConstraints: number;
  readonly passed: number;
  readonly failed: number;
  readonly warnings: number;
  readonly results: readonly ConstraintResult[];
  readonly violations: readonly ConstraintResult[];
  readonly suggestions: readonly SuggestedFix[];
  readonly timestamp: string;
  readonly durationMs: number;
}

// ─── Plan Validation Result (Prompt §4) ────────────────────────────────────

/**
 * Structured validation result for validatePlan(plan).
 */
export interface PlanValidationResult {
  /** True only when hardFailures.length === 0. */
  readonly valid: boolean;
  /** All failed HARD constraints. */
  readonly hardFailures: readonly ConstraintResult[];
  /** All WARNING results. */
  readonly warnings: readonly ConstraintResult[];
  /** All INFORMATIONAL results. */
  readonly informationalResults: readonly ConstraintResult[];
  /** Overall soft quality score (0-100). */
  readonly softScore: number;
  /** Breakdown by category score. */
  readonly categoryScores: Partial<Record<ConstraintCategory, CategoryScore>>;
  /** All constraint evaluation results. */
  readonly allResults: readonly ConstraintResult[];
  /** Repair suggestions ordered by priority. */
  readonly suggestions: readonly SuggestedFix[];
  /** Full underlying ValidationSummary. */
  readonly summary: ValidationSummary;
}

// ─── Plan Validator ─────────────────────────────────────────────────────────

/** Options for validation execution. */
export interface ValidateOptions {
  /** Short-circuit after first HARD failure (for candidate generation). */
  readonly shortCircuit?: boolean;
  /** Only evaluate specific categories. */
  readonly categories?: ConstraintCategory[];
  /** Only evaluate specific constraint IDs. */
  readonly constraintIds?: string[];
  /** Required room types from user requirements. */
  readonly requiredRoomTypes?: RoomType[];
  /** Exact minimum instance counts from the normalized room program. */
  readonly requiredRoomCounts?: Partial<Record<RoomType, number>>;
  /** User spatial/adjacency preferences. */
  readonly userPreferences?: readonly UserConstraintPreference[];
  /** Explicitly defer connectivity for schematic drafts with no doors. Defaults to false. */
  readonly allowIncompleteDraft?: boolean;
}

/** The Plan Validator orchestrates constraint evaluation. */
export interface IPlanValidator {
  validate(building: Building, options?: ValidateOptions): ValidationSummary;
  validatePlan(building: Building, options?: ValidateOptions): PlanValidationResult;
  validateOne(building: Building, constraintId: string): ConstraintResult[];
  isValid(building: Building, options?: ValidateOptions): boolean;
  score(building: Building, options?: ValidateOptions): PlanScore;
  readonly registry: IConstraintRegistry;
}

// ─── Rule Provider ──────────────────────────────────────────────────────────

/** Rule providers produce constraints for registration. */
export interface RuleProvider {
  readonly name: string;
  getConstraints(config: ResolvedConstraintConfig): Constraint[];
}
