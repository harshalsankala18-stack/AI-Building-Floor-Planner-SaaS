/**
 * Structured Indian Apartment Typologies (2BHK, 3BHK, 1BHK, 4BHK) & Spatial Allocation Engine.
 * Updated for Phase 1.2: 3-Tier circulation, Entrance Foyer (1.2m x 1.5m), Dry Utility Balcony (1.2m x 1.8m),
 * Brahmasthana Dining Spine, and Vastu-compliant Puja alcove positioning.
 */

import type { ApartmentRulesProfile } from './jurisdiction';

export type ApartmentUnitType = '1BHK' | '2BHK' | '3BHK' | '4BHK' | 'Studio';

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
 * 2BHK Indian Apartment Template (Phase 1.2):
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
 * 3BHK Indian Apartment Template (Phase 1.2):
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

export const TYPOLOGY_TEMPLATES: Record<string, TypologyTemplate> = {
  '1BHK': TYPOLOGY_2BHK_TEMPLATE, // fallback
  '2BHK': TYPOLOGY_2BHK_TEMPLATE,
  '3BHK': TYPOLOGY_3BHK_TEMPLATE,
  '4BHK': TYPOLOGY_3BHK_TEMPLATE, // fallback
  '1bhk': TYPOLOGY_2BHK_TEMPLATE,
  '2bhk': TYPOLOGY_2BHK_TEMPLATE,
  '3bhk': TYPOLOGY_3BHK_TEMPLATE,
  '4bhk': TYPOLOGY_3BHK_TEMPLATE,
};

export function allocateApartmentUnitSpaces(options: {
  unitType: ApartmentUnitType | string;
  flatLabel?: string;
  targetCarpetAreaSqFt?: number;
  targetCarpetAreaSqM?: number;
  rulesProfile: ApartmentRulesProfile;
}): UnitTypologyAllocationResult {
  const { unitType, flatLabel = 'Flat 01', rulesProfile } = options;
  const normalizedType = String(unitType || '').trim().toUpperCase();
  const template = TYPOLOGY_TEMPLATES[normalizedType] ?? TYPOLOGY_TEMPLATES[unitType] ?? TYPOLOGY_2BHK_TEMPLATE;

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
