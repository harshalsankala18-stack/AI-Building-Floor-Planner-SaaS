import type { DesignRequirementSpecification } from '@ai-floor-planner/core';
import {
  BUILDING_CAPABILITIES,
  Direction,
  PlotShape,
  PreferenceLevel,
  RoomType,
  normalizeDesignRequirementSpecification,
} from '@ai-floor-planner/core';

type UnknownRecord = Record<string, unknown>;

export interface RequirementPayloadValidation {
  readonly valid: boolean;
  readonly requirements?: DesignRequirementSpecification;
  readonly errors: readonly string[];
}

function record(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function finiteInRange(value: unknown, min: number, max: number, integer = false): boolean {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= min
    && value <= max
    && (!integer || Number.isInteger(value));
}

function hasFields(source: UnknownRecord, fields: readonly string[], type: 'boolean' | 'string'): boolean {
  return fields.every(field => typeof source[field] === type);
}

/** Runtime boundary for untrusted provider JSON. Normalization happens only
 * after the complete semantic shape passes these checks. */
export function validateRequirementPayload(
  payload: unknown,
  rawPrompt: string,
): RequirementPayloadValidation {
  const errors: string[] = [];
  const source = record(payload);
  const hard = source ? record(source.hard) : null;
  const soft = source ? record(source.soft) : null;

  if (!source || !hard || !soft) {
    return { valid: false, errors: ['Provider response must contain hard and soft requirement objects.'] };
  }

  if (source.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (typeof source.projectName !== 'string' || source.projectName.trim().length === 0) errors.push('projectName is required.');
  if (!Object.values(PlotShape).includes(source.plotShape as PlotShape)) errors.push('plotShape is invalid.');
  if (!finiteInRange(source.orientationDegrees, 0, 359)) errors.push('orientationDegrees must be between 0 and 359.');

  if (!finiteInRange(hard.plotWidthMm, 3000, 200000)) errors.push('plotWidthMm is outside the supported range.');
  if (!finiteInRange(hard.plotDepthMm, 3000, 200000)) errors.push('plotDepthMm is outside the supported range.');
  if (!Object.values(Direction).includes(hard.roadFacing as Direction)) errors.push('roadFacing is invalid.');
  if (!finiteInRange(hard.floorsCount, BUILDING_CAPABILITIES.minimumFloorCount, BUILDING_CAPABILITIES.maximumFloorCount, true)) {
    errors.push(`floorsCount must be an integer from ${BUILDING_CAPABILITIES.minimumFloorCount} to ${BUILDING_CAPABILITIES.maximumFloorCount}.`);
  }
  if (!finiteInRange(hard.bedroomCount, 1, 20, true)) errors.push('bedroomCount must be an integer from 1 to 20.');
  if (!finiteInRange(hard.bathroomCount, 1, 20, true)) errors.push('bathroomCount must be an integer from 1 to 20.');
  if (!finiteInRange(hard.parkingSpacesCount, 0, 20, true)) errors.push('parkingSpacesCount must be an integer from 0 to 20.');
  if (!hasFields(hard, [
    'kitchenRequired', 'livingRoomRequired', 'diningRoomRequired',
    'staircaseRequired', 'parkingRequired', 'liftRequired',
  ], 'boolean')) errors.push('All hard requirement flags must be booleans.');
  if (typeof hard.parkingRequired === 'boolean' && typeof hard.parkingSpacesCount === 'number'
    && hard.parkingRequired !== (hard.parkingSpacesCount > 0)) {
    errors.push('parkingRequired must agree with parkingSpacesCount.');
  }
  if (typeof hard.floorsCount === 'number' && hard.floorsCount > 1 && hard.staircaseRequired !== true) {
    errors.push('Multi-floor requirements must include a staircase.');
  }
  if (hard.customRooms !== undefined) {
    if (!Array.isArray(hard.customRooms)) {
      errors.push('customRooms must be an array.');
    } else {
      for (const entry of hard.customRooms) {
        const custom = record(entry);
        if (!custom
          || !Object.values(RoomType).includes(custom.type as RoomType)
          || !finiteInRange(custom.count, 1, 20, true)
          || typeof custom.name !== 'string') {
          errors.push('Each custom room must have a supported type, count, and name.');
          break;
        }
      }
    }
  }

  if (!hasFields(soft, [
    'vastuCompliance', 'gardenPreference', 'servantQuarter', 'poojaRoom',
    'studyRoom', 'balconyPreferred', 'openKitchen',
  ], 'boolean')) errors.push('All soft preference flags must be booleans.');
  for (const field of ['naturalLightPreference', 'privacyPreference', 'circulationEfficiency'] as const) {
    if (!Object.values(PreferenceLevel).includes(soft[field] as PreferenceLevel)) errors.push(`${field} is invalid.`);
  }
  if (!finiteInRange(soft.attachedBathroomsCount, 0, 20, true)) errors.push('attachedBathroomsCount must be an integer from 0 to 20.');
  if (typeof soft.attachedBathroomsCount === 'number' && typeof hard.bathroomCount === 'number'
    && soft.attachedBathroomsCount > hard.bathroomCount) {
    errors.push('attachedBathroomsCount cannot exceed bathroomCount.');
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    requirements: normalizeDesignRequirementSpecification({
      ...source,
      rawUserPrompt: rawPrompt,
    }),
    errors: [],
  };
}
