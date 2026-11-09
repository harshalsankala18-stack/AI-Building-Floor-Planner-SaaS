/**
 * Structured Indian Apartment Typologies (Studio, 1BHK, 2BHK, 3BHK, 4BHK) & Spatial Allocation Engine.
 * Updated for Phase 2: Genuine distinct room programmes, canonical unit-type normalization,
 * independent expected-programme contract, and unit-mix integrity validation.
 */

import type { ApartmentRulesProfile } from './jurisdiction';

export type ApartmentUnitType = 'Studio' | '1BHK' | '2BHK' | '3BHK' | '4BHK';

export const SUPPORTED_APARTMENT_UNIT_TYPES: readonly ApartmentUnitType[] = [
  'Studio',
  '1BHK',
  '2BHK',
  '3BHK',
  '4BHK',
] as const;

export class UnsupportedUnitTypeError extends Error {
  constructor(public readonly rawUnitType: string) {
    super(
      `Unsupported apartment unit type: "${rawUnitType}". Supported types are: Studio, 1BHK, 2BHK, 3BHK, 4BHK.`,
    );
    this.name = 'UnsupportedUnitTypeError';
  }
}

/**
 * Normalizes input strings to canonical ApartmentUnitType with strict validation.
 * Handles case variations ('studio', '1bhk', '2bhk', '3bhk', '4bhk', 'Studio', '1BHK', etc.)
 * Throws UnsupportedUnitTypeError for unknown or invalid inputs (never falls back to 2BHK).
 */
export function normalizeUnitType(raw: string): ApartmentUnitType {
  const trimmed = String(raw ?? '').trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'studio') return 'Studio';
  if (lower === '1bhk') return '1BHK';
  if (lower === '2bhk') return '2BHK';
  if (lower === '3bhk') return '3BHK';
  if (lower === '4bhk') return '4BHK';
  throw new UnsupportedUnitTypeError(raw);
}

export function isSupportedUnitType(raw: string): raw is ApartmentUnitType {
  const lower = String(raw ?? '').trim().toLowerCase();
  return lower === 'studio' || lower === '1bhk' || lower === '2bhk' || lower === '3bhk' || lower === '4bhk';
}

export type CirculationTier = 'PUBLIC' | 'SEMI_PRIVATE' | 'PRIVATE';

export interface RoomAllocation {
  readonly id: string;
  readonly name: string;
  readonly type:
    | 'foyer'
    | 'living_dining'
    | 'kitchen'
    | 'utility'
    | 'master_bedroom'
    | 'bedroom'
    | 'master_toilet'
    | 'common_toilet'
    | 'powder_room'
    | 'balcony'
    | 'puja'
    | 'service_duct';
  readonly tier: CirculationTier;
  readonly minAreaSqM: number;
  readonly minWidthM: number;
  readonly targetAreaSqM: number;
  readonly isEnsuite?: boolean;
  readonly hasBalcony?: boolean;
  /** Vastu preferred zone (e.g. 'NE' for puja, 'SW' for master bed) */
  readonly vastuZone?: string;
}

export interface UnitTypologyAllocationResult {
  readonly unitType: ApartmentUnitType;
  readonly flatLabel: string;
  readonly targetCarpetAreaSqM: number;
  readonly targetCarpetAreaSqFt: number;
  readonly targetBuiltUpAreaSqM: number;
  readonly targetBuiltUpAreaSqFt: number;
  readonly internalCirculationSqM: number;
  readonly internalWallsSqM: number;
  readonly usablePlanningBalanceSqM: number;
  readonly rooms: readonly RoomAllocation[];
  readonly planningSequence: readonly string[];
}

export interface TypologyTemplate {
  readonly unitType: ApartmentUnitType;
  readonly defaultCarpetAreaSqM: number;
  readonly roomTemplates: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly type: RoomAllocation['type'];
    readonly tier: CirculationTier;
    readonly weight: number;
    readonly isEnsuite?: boolean;
    readonly hasBalcony?: boolean;
    readonly vastuZone?: string;
  }>;
  readonly planningSequence: readonly string[];
}

/**
 * Studio Apartment Template (Product Default ~38.0 m² / ~409 sq ft):
 * - Open living and sleeping suite (no separate partitioned bedroom)
 * - Kitchenette / Kitchen
 * - 1 Bathroom (common toilet)
 * - Entrance Foyer and Sit-out Balcony
 */
export const TYPOLOGY_STUDIO_TEMPLATE: TypologyTemplate = {
  unitType: 'Studio',
  defaultCarpetAreaSqM: 38.0,
  planningSequence: [
    'Main Entrance Door',
    'Entrance Foyer',
    'Studio Living & Sleeping Suite',
    'Kitchenette / Kitchen',
    'Bathroom',
    'Sit-Out Balcony',
  ],
  roomTemplates: [
    { id: 'foyer', name: 'Entrance Foyer', type: 'foyer', tier: 'PUBLIC', weight: 0.06 },
    { id: 'living_dining', name: 'Studio Living & Sleeping Suite', type: 'living_dining', tier: 'PUBLIC', weight: 0.58, hasBalcony: true },
    { id: 'kitchen', name: 'Kitchenette / Kitchen', type: 'kitchen', tier: 'SEMI_PRIVATE', weight: 0.18, vastuZone: 'SE' },
    { id: 'common_toilet', name: 'Bathroom', type: 'common_toilet', tier: 'PRIVATE', weight: 0.12, vastuZone: 'NW' },
    { id: 'living_balcony', name: 'Sit-out Balcony', type: 'balcony', tier: 'PUBLIC', weight: 0.06, hasBalcony: true },
  ],
};

/**
 * 1BHK Apartment Template (Product Default ~52.0 m² / ~560 sq ft):
 * - Exactly 1 separate bedroom (Master Bedroom)
 * - 1 Bathroom (Common Toilet)
 * - Living & Dining Room
 * - Kitchen + Dry Utility Balcony
 * - Entrance Foyer and Sit-out Balcony
 */
export const TYPOLOGY_1BHK_TEMPLATE: TypologyTemplate = {
  unitType: '1BHK',
  defaultCarpetAreaSqM: 52.0,
  planningSequence: [
    'Main Entrance Door',
    'Entrance Foyer',
    'Living & Dining Room',
    'Sit-Out Balcony',
    'Kitchen',
    'Dry Utility Balcony',
    'Master Bedroom',
    'Common Toilet',
  ],
  roomTemplates: [
    { id: 'foyer', name: 'Entrance Foyer', type: 'foyer', tier: 'PUBLIC', weight: 0.05 },
    { id: 'living_dining', name: 'Living & Dining Room', type: 'living_dining', tier: 'PUBLIC', weight: 0.36, hasBalcony: true },
    { id: 'kitchen', name: 'Kitchen', type: 'kitchen', tier: 'SEMI_PRIVATE', weight: 0.14, vastuZone: 'SE' },
    { id: 'utility', name: 'Dry Utility Balcony', type: 'utility', tier: 'SEMI_PRIVATE', weight: 0.06 },
    { id: 'master_bedroom', name: 'Master Bedroom', type: 'master_bedroom', tier: 'PRIVATE', weight: 0.25, vastuZone: 'SW' },
    { id: 'common_toilet', name: 'Common Toilet', type: 'common_toilet', tier: 'PRIVATE', weight: 0.08, vastuZone: 'NW' },
    { id: 'living_balcony', name: 'Sit-out Balcony', type: 'balcony', tier: 'PUBLIC', weight: 0.06, hasBalcony: true },
  ],
};

/**
 * 2BHK Indian Apartment Template (Phase 1.2 baseline ~70.0 m²):
 * Public Tier: Main Entrance -> Entrance Foyer (1.2m x 1.5m) -> Living + Dining + Sit-Out Balcony + Puja Alcove (NE)
 * Semi-Private Tier: Central Brahmasthana Dining Spine -> Kitchen -> Attached Dry Utility Balcony (1.2m x 1.8m)
 * Private Tier: Private Passage (min 1.0m wide) -> Master Bedroom (SW) + Attached Bath + Secondary Bedroom + Common Bath
 */
export const TYPOLOGY_2BHK_TEMPLATE: TypologyTemplate = {
  unitType: '2BHK',
  defaultCarpetAreaSqM: 70.0,
  planningSequence: [
    'Main Entrance Door',
    'Entrance Foyer (1.2m x 1.5m)',
    'Living & Dining Room (Brahmasthana Spine)',
    'Sit-Out Balcony (Open Facade)',
    'Puja Alcove (NE Zone)',
    'Kitchen',
    'Dry Utility Balcony (1.2m x 1.8m)',
    'Private Passage (min 1.0m wide)',
    'Master Bedroom (SW Zone) + Attached Bath + 600mm Wardrobe',
    'Bedroom 2',
    'Common Toilet (Clustered on OTS Shaft)',
  ],
  roomTemplates: [
    { id: 'foyer', name: 'Entrance Foyer', type: 'foyer', tier: 'PUBLIC', weight: 0.04 },
    { id: 'living_dining', name: 'Living & Dining Room', type: 'living_dining', tier: 'PUBLIC', weight: 0.35, hasBalcony: true },
    { id: 'puja', name: 'Puja Alcove', type: 'puja', tier: 'PUBLIC', weight: 0.03, vastuZone: 'NE' },
    { id: 'kitchen', name: 'Kitchen', type: 'kitchen', tier: 'SEMI_PRIVATE', weight: 0.12, vastuZone: 'SE' },
    { id: 'utility', name: 'Dry Utility Balcony', type: 'utility', tier: 'SEMI_PRIVATE', weight: 0.05 },
    { id: 'master_bedroom', name: 'Master Bedroom', type: 'master_bedroom', tier: 'PRIVATE', weight: 0.20, isEnsuite: true, vastuZone: 'SW' },
    { id: 'master_toilet', name: 'Master Toilet (En-suite)', type: 'master_toilet', tier: 'PRIVATE', weight: 0.04, isEnsuite: true },
    { id: 'bedroom_2', name: 'Bedroom 2', type: 'bedroom', tier: 'PRIVATE', weight: 0.13 },
    { id: 'common_toilet', name: 'Common Toilet', type: 'common_toilet', tier: 'PRIVATE', weight: 0.04, vastuZone: 'NW' },
    { id: 'living_balcony', name: 'Sit-out Balcony', type: 'balcony', tier: 'PUBLIC', weight: 0.0, hasBalcony: true },
  ],
};

/**
 * 3BHK Indian Apartment Template (Phase 1.2 baseline ~105.0 m²):
 * 3-Tier circulation with grand foyer, Brahmasthana dining spine, kitchen + dry utility, master suite + 2 secondary bedrooms + clustered wet wall on OTS shaft.
 */
export const TYPOLOGY_3BHK_TEMPLATE: TypologyTemplate = {
  unitType: '3BHK',
  defaultCarpetAreaSqM: 105.0,
  planningSequence: [
    'Main Entrance Door',
    'Entrance Foyer (1.2m x 1.5m)',
    'Living & Dining Room (Brahmasthana Spine)',
    'Sit-Out Balcony (Open Facade)',
    'Puja Room (NE Zone)',
    'Kitchen',
    'Dry Utility Balcony (1.2m x 1.8m)',
    'Private Passage (min 1.0m wide)',
    'Master Suite (SW Zone) + Attached Bath + Walk-in Wardrobe',
    'Bedroom 2 + Attached Bath',
    'Bedroom 3',
    'Common Toilet / Powder Room',
  ],
  roomTemplates: [
    { id: 'foyer', name: 'Entrance Foyer', type: 'foyer', tier: 'PUBLIC', weight: 0.04 },
    { id: 'living_dining', name: 'Living & Dining Room', type: 'living_dining', tier: 'PUBLIC', weight: 0.32, hasBalcony: true },
    { id: 'puja', name: 'Puja Room', type: 'puja', tier: 'PUBLIC', weight: 0.03, vastuZone: 'NE' },
    { id: 'kitchen', name: 'Kitchen', type: 'kitchen', tier: 'SEMI_PRIVATE', weight: 0.11, vastuZone: 'SE' },
    { id: 'utility', name: 'Dry Utility Balcony', type: 'utility', tier: 'SEMI_PRIVATE', weight: 0.05 },
    { id: 'master_bedroom', name: 'Master Bedroom', type: 'master_bedroom', tier: 'PRIVATE', weight: 0.18, isEnsuite: true, hasBalcony: true, vastuZone: 'SW' },
    { id: 'master_toilet', name: 'Master Toilet (En-suite)', type: 'master_toilet', tier: 'PRIVATE', weight: 0.04, isEnsuite: true },
    { id: 'bedroom_2', name: 'Bedroom 2', type: 'bedroom', tier: 'PRIVATE', weight: 0.13, isEnsuite: true },
    { id: 'toilet_2', name: 'Toilet 2 (Attached)', type: 'master_toilet', tier: 'PRIVATE', weight: 0.03, isEnsuite: true },
    { id: 'bedroom_3', name: 'Bedroom 3 / Guest Room', type: 'bedroom', tier: 'PRIVATE', weight: 0.12 },
    { id: 'common_toilet', name: 'Common Toilet / Powder', type: 'common_toilet', tier: 'PRIVATE', weight: 0.03, vastuZone: 'NW' },
    { id: 'living_balcony', name: 'Living Sit-Out Balcony', type: 'balcony', tier: 'PUBLIC', weight: 0.02, hasBalcony: true },
  ],
};

/**
 * 4BHK Indian Apartment Template (Product Default ~145.0 m² / ~1560 sq ft):
 * 4 separate bedrooms (Master Suite + 3 Secondary Bedrooms), 4 bathrooms (3 En-suite + 1 Common/Powder),
 * Grand Living & Dining, Puja Room, Kitchen + Dry Utility, Sit-out Balcony.
 */
export const TYPOLOGY_4BHK_TEMPLATE: TypologyTemplate = {
  unitType: '4BHK',
  defaultCarpetAreaSqM: 145.0,
  planningSequence: [
    'Main Entrance Door',
    'Entrance Foyer',
    'Living & Dining Room',
    'Sit-Out Balcony',
    'Puja Room (NE Zone)',
    'Kitchen',
    'Dry Utility Balcony',
    'Private Passage',
    'Master Suite (SW Zone) + Attached Bath',
    'Bedroom 2 + Attached Bath',
    'Bedroom 3 + Attached Bath',
    'Bedroom 4 / Guest Room',
    'Common Toilet / Powder Room',
  ],
  roomTemplates: [
    { id: 'foyer', name: 'Entrance Foyer', type: 'foyer', tier: 'PUBLIC', weight: 0.04 },
    { id: 'living_dining', name: 'Living & Dining Room', type: 'living_dining', tier: 'PUBLIC', weight: 0.28, hasBalcony: true },
    { id: 'puja', name: 'Puja Room', type: 'puja', tier: 'PUBLIC', weight: 0.025, vastuZone: 'NE' },
    { id: 'kitchen', name: 'Kitchen', type: 'kitchen', tier: 'SEMI_PRIVATE', weight: 0.10, vastuZone: 'SE' },
    { id: 'utility', name: 'Dry Utility Balcony', type: 'utility', tier: 'SEMI_PRIVATE', weight: 0.045 },
    { id: 'master_bedroom', name: 'Master Bedroom', type: 'master_bedroom', tier: 'PRIVATE', weight: 0.16, isEnsuite: true, hasBalcony: true, vastuZone: 'SW' },
    { id: 'master_toilet', name: 'Master Toilet (En-suite)', type: 'master_toilet', tier: 'PRIVATE', weight: 0.035, isEnsuite: true },
    { id: 'bedroom_2', name: 'Bedroom 2', type: 'bedroom', tier: 'PRIVATE', weight: 0.11, isEnsuite: true },
    { id: 'toilet_2', name: 'Toilet 2 (Attached)', type: 'master_toilet', tier: 'PRIVATE', weight: 0.03, isEnsuite: true },
    { id: 'bedroom_3', name: 'Bedroom 3', type: 'bedroom', tier: 'PRIVATE', weight: 0.10, isEnsuite: true },
    { id: 'toilet_3', name: 'Toilet 3 (Attached)', type: 'master_toilet', tier: 'PRIVATE', weight: 0.03, isEnsuite: true },
    { id: 'bedroom_4', name: 'Bedroom 4 / Guest Room', type: 'bedroom', tier: 'PRIVATE', weight: 0.09 },
    { id: 'common_toilet', name: 'Common Toilet / Powder', type: 'common_toilet', tier: 'PRIVATE', weight: 0.03, vastuZone: 'NW' },
    { id: 'living_balcony', name: 'Living Sit-Out Balcony', type: 'balcony', tier: 'PUBLIC', weight: 0.025, hasBalcony: true },
  ],
};

/**
 * Canonical Typology Templates Registry.
 * Contains distinct, non-aliased templates for each supported typology.
 */
export const TYPOLOGY_TEMPLATES: Record<string, TypologyTemplate> = {
  Studio: TYPOLOGY_STUDIO_TEMPLATE,
  '1BHK': TYPOLOGY_1BHK_TEMPLATE,
  '2BHK': TYPOLOGY_2BHK_TEMPLATE,
  '3BHK': TYPOLOGY_3BHK_TEMPLATE,
  '4BHK': TYPOLOGY_4BHK_TEMPLATE,
  studio: TYPOLOGY_STUDIO_TEMPLATE,
  '1bhk': TYPOLOGY_1BHK_TEMPLATE,
  '2bhk': TYPOLOGY_2BHK_TEMPLATE,
  '3bhk': TYPOLOGY_3BHK_TEMPLATE,
  '4bhk': TYPOLOGY_4BHK_TEMPLATE,
};

export function getTypologyTemplate(unitType: ApartmentUnitType | string): TypologyTemplate {
  const canonical = normalizeUnitType(unitType);
  const template = TYPOLOGY_TEMPLATES[canonical];
  if (!template) {
    throw new UnsupportedUnitTypeError(String(unitType));
  }
  return template;
}

// ─── Canonical Room-Programme Contract ───────────────────────────────────────

export interface ExpectedRoomProgramme {
  readonly unitType: ApartmentUnitType;
  readonly bedrooms: number;
  readonly bathrooms: number;
  readonly livingRooms: number;
  readonly diningRooms: number;
  readonly kitchens: number;
  readonly utilities: number;
  readonly balconies: number;
}

export const CANONICAL_ROOM_PROGRAMMES: Record<ApartmentUnitType, ExpectedRoomProgramme> = {
  Studio: {
    unitType: 'Studio',
    bedrooms: 0,
    bathrooms: 1,
    livingRooms: 1,
    diningRooms: 0,
    kitchens: 1,
    utilities: 0,
    balconies: 1,
  },
  '1BHK': {
    unitType: '1BHK',
    bedrooms: 1,
    bathrooms: 1,
    livingRooms: 1,
    diningRooms: 1,
    kitchens: 1,
    utilities: 1,
    balconies: 1,
  },
  '2BHK': {
    unitType: '2BHK',
    bedrooms: 2,
    bathrooms: 2,
    livingRooms: 1,
    diningRooms: 1,
    kitchens: 1,
    utilities: 1,
    balconies: 1,
  },
  '3BHK': {
    unitType: '3BHK',
    bedrooms: 3,
    bathrooms: 3,
    livingRooms: 1,
    diningRooms: 1,
    kitchens: 1,
    utilities: 1,
    balconies: 1,
  },
  '4BHK': {
    unitType: '4BHK',
    bedrooms: 4,
    bathrooms: 4,
    livingRooms: 1,
    diningRooms: 1,
    kitchens: 1,
    utilities: 1,
    balconies: 1,
  },
};

/**
 * Returns the independent, canonical expected room programme for a validated unit type.
 * Manifest expectations derive from this contract, never from allocator room counting.
 */
export function getExpectedRoomProgramme(unitType: ApartmentUnitType | string): ExpectedRoomProgramme {
  const canonical = normalizeUnitType(unitType);
  return CANONICAL_ROOM_PROGRAMMES[canonical];
}

// ─── Unit Mix Integrity & Validation ─────────────────────────────────────────

export interface ValidatedUnitMixItem {
  readonly unitType: ApartmentUnitType;
  readonly count: number;
  readonly carpetAreaSqFt?: number;
  readonly carpetAreaSqM?: number;
}

export interface UnitMixResolutionResult {
  readonly items: readonly ValidatedUnitMixItem[];
  readonly wasDefaultApplied: boolean;
  readonly defaultExplanation?: string;
}

/**
 * Validates and resolves unit mix configurations strictly:
 * - When unitMix is empty or omitted: applies explicit documented default (flatsPerFloor x 2BHK).
 * - When unitMix is provided: enforces positive integer counts, supported typologies, and exact sum = flatsPerFloor.
 * - Rejects any discrepancy with an explicit error (no silent insertion or truncation).
 */
export function resolveAndValidateUnitMix(
  unitMix:
    | ReadonlyArray<{
        unitType?: string;
        count?: number;
        carpetAreaSqFt?: number;
        carpetAreaSqM?: number;
      }>
    | undefined,
  flatsPerFloor: number,
): UnitMixResolutionResult {
  if (!Number.isInteger(flatsPerFloor) || flatsPerFloor <= 0) {
    throw new Error(`flatsPerFloor must be a positive integer, received: ${flatsPerFloor}`);
  }

  // Explicit documented default policy if mix is omitted or empty
  if (!unitMix || unitMix.length === 0) {
    return {
      items: [
        {
          unitType: '2BHK',
          count: flatsPerFloor,
        },
      ],
      wasDefaultApplied: true,
      defaultExplanation: `Unit mix was omitted; applied default policy: ${flatsPerFloor} × 2BHK flats.`,
    };
  }

  let totalCount = 0;
  const validatedItems: ValidatedUnitMixItem[] = [];

  for (let i = 0; i < unitMix.length; i++) {
    const item = unitMix[i]!;
    if (!item.unitType) {
      throw new Error(`Unit mix item at index ${i} is missing required field 'unitType'.`);
    }
    const canonicalType = normalizeUnitType(item.unitType);

    if (item.count === undefined || item.count === null) {
      throw new Error(`Unit mix item for '${item.unitType}' at index ${i} must specify 'count'.`);
    }
    if (!Number.isInteger(item.count) || item.count <= 0) {
      throw new Error(
        `Unit mix item for '${item.unitType}' at index ${i} has invalid count: ${item.count}. Count must be a positive integer.`,
      );
    }

    totalCount += item.count;
    validatedItems.push({
      unitType: canonicalType,
      count: item.count,
      carpetAreaSqFt: item.carpetAreaSqFt,
      carpetAreaSqM: item.carpetAreaSqM,
    });
  }

  if (totalCount !== flatsPerFloor) {
    throw new Error(
      `Unit mix total count (${totalCount}) does not match flatsPerFloor (${flatsPerFloor}). Silent insertion or truncation of flats is prohibited.`,
    );
  }

  return {
    items: validatedItems,
    wasDefaultApplied: false,
  };
}

// ─── Mathematical Spatial Allocation Model ───────────────────────────────────

export function allocateApartmentUnitSpaces(options: {
  unitType: ApartmentUnitType | string;
  flatLabel?: string;
  targetCarpetAreaSqFt?: number;
  targetCarpetAreaSqM?: number;
  rulesProfile: ApartmentRulesProfile;
}): UnitTypologyAllocationResult {
  const { unitType, flatLabel = 'Flat 01', rulesProfile } = options;
  const canonicalType = normalizeUnitType(unitType);
  const template = TYPOLOGY_TEMPLATES[canonicalType];
  if (!template) {
    throw new UnsupportedUnitTypeError(String(unitType));
  }

  let targetCarpetAreaSqM: number;
  if (options.targetCarpetAreaSqM && options.targetCarpetAreaSqM > 0) {
    targetCarpetAreaSqM = options.targetCarpetAreaSqM;
  } else if (options.targetCarpetAreaSqFt && options.targetCarpetAreaSqFt > 0) {
    targetCarpetAreaSqM = options.targetCarpetAreaSqFt * 0.092903;
  } else {
    targetCarpetAreaSqM = template.defaultCarpetAreaSqM;
  }

  const targetBuiltUpAreaSqM = targetCarpetAreaSqM * 1.15;
  const targetCarpetAreaSqFt = Math.round(targetCarpetAreaSqM / 0.092903);
  const targetBuiltUpAreaSqFt = Math.round(targetBuiltUpAreaSqM / 0.092903);

  const internalCirculationSqM = targetCarpetAreaSqM * 0.08;
  const internalWallsSqM = targetCarpetAreaSqM * 0.07;

  let totalMandatoryMinimumsSqM = 0;
  const roomBaseMinimums: Array<{
    template: TypologyTemplate['roomTemplates'][number];
    minArea: number;
    minWidth: number;
  }> = [];

  for (const rt of template.roomTemplates) {
    let minArea = 1.5;
    let minWidth = 1.0;

    switch (rt.type) {
      case 'master_bedroom':
        minArea = rulesProfile.habitableRoomMinimums.masterHabitableRoomMinSqM;
        minWidth = rulesProfile.habitableRoomMinimums.masterHabitableRoomMinWidthM;
        break;
      case 'bedroom':
        minArea = rulesProfile.habitableRoomMinimums.otherHabitableRoomMinSqM;
        minWidth = rulesProfile.habitableRoomMinimums.otherHabitableRoomMinWidthM;
        break;
      case 'living_dining':
        minArea = Math.max(12.0, rulesProfile.habitableRoomMinimums.masterHabitableRoomMinSqM * 1.25);
        minWidth = 3.0;
        break;
      case 'kitchen':
        minArea = rulesProfile.kitchenMinimums.minAreaSqM;
        minWidth = rulesProfile.kitchenMinimums.minWidthM;
        break;
      case 'utility':
        minArea = rulesProfile.utilityMinimums.minAreaSqM;
        minWidth = rulesProfile.utilityMinimums.minWidthM;
        break;
      case 'master_toilet':
      case 'common_toilet':
        minArea = rulesProfile.combinedToiletMinimums.minAreaSqM;
        minWidth = rulesProfile.combinedToiletMinimums.minWidthM;
        break;
      case 'foyer':
        minArea = 2.0;
        minWidth = 1.2;
        break;
      case 'puja':
        minArea = 1.2;
        minWidth = 0.9;
        break;
      case 'balcony':
        minArea = 2.5;
        minWidth = 1.2;
        break;
      default:
        minArea = 1.5;
        minWidth = 1.0;
    }

    totalMandatoryMinimumsSqM += minArea;
    roomBaseMinimums.push({ template: rt, minArea, minWidth });
  }

  const usablePlanningBalanceSqM = Math.max(
    0,
    targetCarpetAreaSqM - totalMandatoryMinimumsSqM - internalCirculationSqM - internalWallsSqM,
  );

  const totalWeight = template.roomTemplates.reduce((sum, r) => sum + r.weight, 0);

  const rooms: RoomAllocation[] = roomBaseMinimums.map(({ template: rt, minArea, minWidth }) => {
    const additionalArea = (rt.weight / totalWeight) * usablePlanningBalanceSqM;
    const targetAreaSqM = Number((minArea + additionalArea).toFixed(2));

    return {
      id: `${flatLabel.toLowerCase().replace(/\s+/g, '_')}_${rt.id}`,
      name: rt.name,
      type: rt.type,
      tier: rt.tier,
      minAreaSqM: minArea,
      minWidthM: minWidth,
      targetAreaSqM,
      isEnsuite: rt.isEnsuite,
      hasBalcony: rt.hasBalcony,
      vastuZone: rt.vastuZone,
    };
  });

  return {
    unitType: template.unitType,
    flatLabel,
    targetCarpetAreaSqM: Number(targetCarpetAreaSqM.toFixed(2)),
    targetCarpetAreaSqFt,
    targetBuiltUpAreaSqM: Number(targetBuiltUpAreaSqM.toFixed(2)),
    targetBuiltUpAreaSqFt,
    internalCirculationSqM: Number(internalCirculationSqM.toFixed(2)),
    internalWallsSqM: Number(internalWallsSqM.toFixed(2)),
    usablePlanningBalanceSqM: Number(usablePlanningBalanceSqM.toFixed(2)),
    rooms,
    planningSequence: template.planningSequence,
  };
}
