/**
 * Constraint validation and scoring types.
 */

import type { RoomType } from './enums';

// ─── Score Types ────────────────────────────────────────────────────────────

/** Detail about a single scoring factor. */
export interface ScoreDetail {
  readonly factor: string;
  readonly points: number;
  readonly maxPoints: number;
  readonly description: string;
}

/** Score for one constraint category. */
export interface CategoryScore {
  readonly category: string;
  readonly score: number;       // 0-100
  readonly maxScore: number;    // 100
  readonly weight: number;
  readonly details: readonly ScoreDetail[];
}

/** Complete plan quality scores. */
export interface PlanScore {
  readonly overall: number;  // 0-100 weighted average
  readonly categories: {
    readonly geometry: CategoryScore;
    readonly accessibility: CategoryScore;
    readonly daylight: CategoryScore;
    readonly privacy: CategoryScore;
    readonly vastu: CategoryScore;
    readonly adjacency: CategoryScore;
  };
  readonly hardConstraintsPassed: boolean;
  readonly hardConstraintViolations: readonly HardConstraintViolation[];
}

// ─── Violation Types ────────────────────────────────────────────────────────

/** A hard constraint violation (plan is invalid). */
export interface HardConstraintViolation {
  readonly constraintId: string;
  readonly description: string;
  readonly severity: 'critical';
  readonly affectedEntities: readonly string[];
  readonly details: Record<string, unknown>;
}

/** A soft constraint violation (reduces score). */
export interface SoftConstraintViolation {
  readonly category: string;
  readonly factor: string;
  readonly description: string;
  readonly severity: 'warning' | 'info';
  readonly scorePenalty: number;
  readonly affectedEntities: readonly string[];
}

/** Suggested action to repair a constraint violation. */
export interface RepairSuggestion {
  readonly constraintId: string;
  readonly description: string;
  readonly suggestedAction: string;
  readonly affectedEntities: readonly string[];
  readonly priority: number;
}

// ─── Validation Report ──────────────────────────────────────────────────────

/** Full validation report for a building plan. */
export interface ValidationReport {
  readonly isValid: boolean;
  readonly score: PlanScore;
  readonly hardViolations: readonly HardConstraintViolation[];
  readonly softViolations: readonly SoftConstraintViolation[];
  readonly suggestions: readonly RepairSuggestion[];
  readonly timestamp: string;
}

/** Summary of validation status for UI and candidate evaluation. */
export interface ValidationSummary {
  readonly isValid: boolean;
  readonly overallScore: number;
  readonly violations: readonly any[];
  readonly suggestions: readonly any[];
}

// ─── Constraint Configuration ───────────────────────────────────────────────

/** User-configurable constraint settings. */
export interface ConstraintConfig {
  readonly enableVastu: boolean;
  readonly vastuStrictness: 'strict' | 'moderate' | 'flexible';
  readonly minimumRoomSizes: Partial<Record<RoomType, number>>;
  readonly minimumCorridorWidth: number;
  readonly weights: Record<string, number>;
}
