/**
 * Constraint configuration — defaults, weights, and resolution.
 */

import type { ConstraintConfig } from '@ai-floor-planner/core';
import type { Building } from '@ai-floor-planner/core';
import { MINIMUM_ROOM_AREAS, MINIMUM_DIMENSIONS } from '@ai-floor-planner/core';
import { ConstraintCategory, type ResolvedConstraintConfig, type CategoryWeights } from './types';

/** Default category weights (sum ≈ 1.0). */
export const DEFAULT_WEIGHTS: CategoryWeights = {
  [ConstraintCategory.GEOMETRY]: 0.15,
  [ConstraintCategory.ACCESSIBILITY]: 0.20,
  [ConstraintCategory.CIRCULATION]: 0.15,
  [ConstraintCategory.DAYLIGHT]: 0.15,
  [ConstraintCategory.PRIVACY]: 0.12,
  [ConstraintCategory.FUNCTIONAL_ZONING]: 0.08,
  [ConstraintCategory.VASTU]: 0.10,
  [ConstraintCategory.USER_PREFERENCE]: 0.05,
};

/** Weights when Vastu is disabled (redistributed). */
export const DEFAULT_WEIGHTS_NO_VASTU: CategoryWeights = {
  [ConstraintCategory.GEOMETRY]: 0.17,
  [ConstraintCategory.ACCESSIBILITY]: 0.22,
  [ConstraintCategory.CIRCULATION]: 0.17,
  [ConstraintCategory.DAYLIGHT]: 0.17,
  [ConstraintCategory.PRIVACY]: 0.13,
  [ConstraintCategory.FUNCTIONAL_ZONING]: 0.09,
  [ConstraintCategory.VASTU]: 0.00,
  [ConstraintCategory.USER_PREFERENCE]: 0.05,
};

/**
 * Resolve a partial user config into a fully-specified config.
 */
export function resolveConfig(
  partial?: Partial<ConstraintConfig>,
  building?: Building,
): ResolvedConstraintConfig {
  const enableVastu = partial?.enableVastu ?? true;
  const weights = enableVastu ? { ...DEFAULT_WEIGHTS } : { ...DEFAULT_WEIGHTS_NO_VASTU };

  // Apply custom weights if provided
  if (partial?.weights) {
    for (const [key, val] of Object.entries(partial.weights)) {
      if (key in weights) {
        (weights as Record<string, number>)[key] = val;
      }
    }
  }

  return {
    enableVastu,
    vastuStrictness: partial?.vastuStrictness ?? 'moderate',
    minimumRoomSizes: { ...MINIMUM_ROOM_AREAS, ...partial?.minimumRoomSizes },
    minimumDimensions: { ...MINIMUM_DIMENSIONS },
    minimumCorridorWidth: partial?.minimumCorridorWidth ?? 900,
    weights,
    orientation: building?.site.orientation ?? 0,
  };
}
