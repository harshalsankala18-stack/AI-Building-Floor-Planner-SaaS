import { DEFAULTS } from '@ai-floor-planner/core';
import type { Building3DProjectionSettings, ParameterProvenance, ProjectionParameter } from './types';

export const DEFAULT_PROJECTION_SETTINGS: Building3DProjectionSettings = Object.freeze({
  defaultFloorToFloorHeight: { value: DEFAULTS.FLOOR_HEIGHT, provenance: 'DEFAULT' },
  defaultWallHeight: { value: 2700, provenance: 'DEFAULT' },
  slabThickness: { value: 150, provenance: 'DEFAULT' },
  defaultDoorHeight: { value: DEFAULTS.DOOR_HEIGHT, provenance: 'DEFAULT' },
  defaultWindowSillHeight: { value: DEFAULTS.WINDOW_SILL_HEIGHT, provenance: 'DEFAULT' },
  defaultWindowHeight: { value: DEFAULTS.WINDOW_HEIGHT, provenance: 'DEFAULT' },
  parapetHeight: { value: 900, provenance: 'DEFAULT' },
} satisfies Building3DProjectionSettings);

function validParameter(value: ProjectionParameter | undefined, fallback: ProjectionParameter): ProjectionParameter {
  if (!value || !Number.isFinite(value.value) || value.value <= 0) return fallback;
  const validProvenance: readonly ParameterProvenance[] = ['DEFAULT', 'USER_PROVIDED', 'DERIVED'];
  return validProvenance.includes(value.provenance) ? value : fallback;
}

export function resolveProjectionSettings(
  settings: Partial<Building3DProjectionSettings> = {},
): Building3DProjectionSettings {
  return {
    defaultFloorToFloorHeight: validParameter(settings.defaultFloorToFloorHeight, DEFAULT_PROJECTION_SETTINGS.defaultFloorToFloorHeight),
    defaultWallHeight: validParameter(settings.defaultWallHeight, DEFAULT_PROJECTION_SETTINGS.defaultWallHeight),
    slabThickness: validParameter(settings.slabThickness, DEFAULT_PROJECTION_SETTINGS.slabThickness),
    defaultDoorHeight: validParameter(settings.defaultDoorHeight, DEFAULT_PROJECTION_SETTINGS.defaultDoorHeight),
    defaultWindowSillHeight: validParameter(settings.defaultWindowSillHeight, DEFAULT_PROJECTION_SETTINGS.defaultWindowSillHeight),
    defaultWindowHeight: validParameter(settings.defaultWindowHeight, DEFAULT_PROJECTION_SETTINGS.defaultWindowHeight),
    parapetHeight: validParameter(settings.parapetHeight, DEFAULT_PROJECTION_SETTINGS.parapetHeight),
  };
}
