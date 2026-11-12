import type { Point, Polygon } from './geometry';

export type FootprintShapeType =
  | 'rectangle'
  | 'square'
  | 'l_shape'
  | 'u_shape'
  | 'courtyard'
  | 'h_shape'
  | 't_shape'
  | 'v_shape'
  | 'z_shape'
  | 'linear'
  | 'stepped'
  | 'custom'
  | 'flexible';
export type FloorPlateStrategy = 'same_all_levels' | 'custom_per_floor';
export type FootprintStatus = 'VALID' | 'WARNING' | 'INVALID' | 'PROGRAM_TOO_LARGE' | 'PROGRAM_TIGHT' | 'NOT_CONFIGURED';
export type CoreAnchor = 'center' | 'front' | 'rear' | 'left' | 'right';

export interface FootprintParameters {
  readonly width: number;
  readonly depth: number;
  readonly wingWidth?: number;
  readonly wingDepth?: number;
  readonly stemWidth?: number;
  readonly barDepth?: number;
  readonly courtyardWidth?: number;
  readonly courtyardDepth?: number;
  readonly openingDirection?: 'north' | 'east' | 'south' | 'west';
  readonly courtyardSize?: 'compact' | 'medium' | 'spacious';
  readonly wingOrientation?: 'balanced' | 'deep' | 'wide';
  readonly entranceSide?: 'front' | 'rear' | 'left' | 'right';
  readonly openSpacePreference?: 'garden' | 'compact' | 'balanced';
}

export interface FootprintTransform {
  readonly x: number;
  readonly y: number;
  readonly rotation: 0 | 90 | 180 | 270;
  readonly mirrored: boolean;
}

export interface FloorPlateOverride {
  readonly floorLevel: number;
  readonly scalePercent: number;
}

export interface FootprintIntent {
  readonly schemaVersion: 1;
  readonly shape: FootprintShapeType;
  readonly parameters: FootprintParameters;
  readonly transform: FootprintTransform;
  readonly strategy: FloorPlateStrategy;
  readonly floorOverrides: readonly FloorPlateOverride[];
  readonly customPolygon?: Polygon;
  readonly coreAnchor?: CoreAnchor;
  readonly provenance: 'USER_DEFINED' | 'AUTO_FIT' | 'DERIVED_FROM_EXISTING_FLOOR' | 'DEFAULT';
  readonly updatedAt: string;
}

export interface FootprintShapeDefinition {
  readonly id: FootprintShapeType;
  readonly name: string;
  readonly description: string;
  readonly recommendedCategories: readonly ('residential' | 'commercial' | 'mixed_use' | 'educational')[];
  readonly customSupport?: 'limited';
}

export interface FootprintValidationIssue {
  readonly status: 'WARNING' | 'INVALID';
  readonly field: string;
  readonly message: string;
}

export interface FootprintValidationResult {
  readonly status: 'VALID' | 'WARNING' | 'INVALID';
  readonly issues: readonly FootprintValidationIssue[];
  readonly polygon?: Polygon;
}

export interface FootprintMetrics {
  readonly footprintAreaMm2: number;
  readonly buildableEnvelopeAreaMm2: number;
  readonly plotAreaMm2: number;
  readonly plotCoveragePercent: number;
  readonly maximumCoveragePercent?: number;
  readonly coverageWithinUserLimit?: boolean;
  readonly plannedLevels: number;
  readonly preliminaryFloorAreaMm2: number;
  readonly fsiLimitedFloorAreaMm2?: number;
  readonly effectivePreliminaryFloorAreaMm2: number;
  readonly circulationReserveMm2: number;
  readonly coreReserveMm2: number;
  readonly wallServiceReserveMm2: number;
  readonly estimatedUsableAreaMm2: number;
  readonly programMinimumAreaMm2: number;
  readonly programPreferredAreaMm2: number;
  readonly programFit: 'COMFORTABLE' | 'TIGHT' | 'TOO_SMALL' | 'EXCESS' | 'NOT_CONFIGURED';
  readonly deficitMm2?: number;
  readonly floorPlateAreasMm2: readonly number[];
}

export interface FootprintEnvelope {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly depth: number;
  readonly polygon: Polygon;
}

export interface FootprintDragDelta { readonly dx: number; readonly dy: number }
export interface FootprintDimensionSegment { readonly start: Point; readonly end: Point; readonly length: number }
