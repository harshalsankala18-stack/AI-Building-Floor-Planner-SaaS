import {
  AdjacencyStrength, FunctionalZone, RoomType,
  type SpaceBuildingCategory, type SpaceDefinition, type SpaceFloorPreferenceKind,
  type SpaceFunctionalGroup, type SpaceGeneratorSupport, type SpaceOccupancy,
  type SpacePriority, type SpaceProgramPreset,
} from '../types';

const M2 = 1_000_000;
const R: SpaceBuildingCategory[] = ['residential', 'mixed_use'];
const C: SpaceBuildingCategory[] = ['commercial', 'mixed_use'];
const E: SpaceBuildingCategory[] = ['educational'];

interface DefinitionOptions {
  canonicalType?: RoomType;
  occupancy?: SpaceOccupancy;
  synonyms?: string[];
  quantity?: number;
  max?: number;
  priority?: SpacePriority;
  floor?: SpaceFloorPreferenceKind;
  support?: SpaceGeneratorSupport;
  tags?: string[];
  relationships?: SpaceDefinition['relationships'];
}

function definition(
  id: string,
  displayName: string,
  categories: SpaceBuildingCategory[],
  group: SpaceFunctionalGroup,
  zone: FunctionalZone,
  minimumM2: number,
  preferredM2: number,
  options: DefinitionOptions = {},
): SpaceDefinition {
  const occupancy = options.occupancy ?? (categories[0] === 'educational' ? 'educational' : categories[0] === 'commercial' ? 'commercial' : 'residential');
  return {
    id, displayName, categories, group, zone, occupancy,
    canonicalType: options.canonicalType,
    synonyms: options.synonyms ?? [],
    defaultQuantity: options.quantity ?? 1,
    minimumAreaMm2: minimumM2 * M2,
    preferredAreaMm2: preferredM2 * M2,
    maximumAreaMm2: options.max ? options.max * M2 : undefined,
    defaultPriority: options.priority ?? 'preferred',
    defaultFloorPreference: options.floor ?? 'any',
    generatorSupport: options.support ?? 'program_only',
    tags: options.tags ?? [],
    relationships: options.relationships,
  };
}

const residential: SpaceDefinition[] = [
  definition('primary_bedroom', 'Primary Bedroom', R, 'private', FunctionalZone.Private, 12, 16, { max: 22, canonicalType: RoomType.Bedroom, support: 'supported', priority: 'required', floor: 'upper_preferred', synonyms: ['master bedroom', 'owner bedroom'] }),
  definition('bedroom', 'Bedroom', R, 'private', FunctionalZone.Private, 9.5, 13, { max: 18, canonicalType: RoomType.Bedroom, support: 'supported', quantity: 2, priority: 'required', floor: 'upper_preferred', synonyms: ['bed room', 'kids room'] }),
  definition('guest_bedroom', 'Guest Bedroom', R, 'private', FunctionalZone.Private, 9.5, 13, { max: 18, canonicalType: RoomType.Bedroom, support: 'supported', floor: 'ground_preferred', synonyms: ['guest room'] }),
  definition('children_bedroom', 'Children Bedroom', R, 'private', FunctionalZone.Private, 9.5, 12, { max: 16, canonicalType: RoomType.Bedroom, support: 'supported', floor: 'upper_preferred', synonyms: ['child room', 'kids bedroom'] }),
  definition('study', 'Study / Home Office', R, 'private', FunctionalZone.Private, 6, 9, { max: 14, canonicalType: RoomType.Study, support: 'supported', synonyms: ['office', 'home office'] }),
  definition('dressing', 'Dressing / Walk-in Closet', R, 'private', FunctionalZone.Private, 3, 5, { max: 8, synonyms: ['closet', 'wardrobe'] }),
  definition('primary_bathroom', 'Primary Bathroom', R, 'baths', FunctionalZone.Service, 3, 4.5, { max: 7, canonicalType: RoomType.Bathroom, support: 'supported', priority: 'required', floor: 'upper_preferred', synonyms: ['master bath', 'ensuite'] }),
  definition('attached_bathroom', 'Attached Bathroom', R, 'baths', FunctionalZone.Service, 2.5, 4, { max: 6, canonicalType: RoomType.Bathroom, support: 'supported', synonyms: ['ensuite bathroom'] }),
  definition('common_bathroom', 'Common Bathroom', R, 'baths', FunctionalZone.Service, 2.5, 4, { max: 6, canonicalType: RoomType.Bathroom, support: 'supported', priority: 'required', synonyms: ['washroom', 'toilet'] }),
  definition('powder_room', 'Powder Room', R, 'baths', FunctionalZone.Service, 1.8, 2.5, { max: 4, canonicalType: RoomType.Bathroom, support: 'supported', synonyms: ['guest toilet', 'half bath'] }),
  definition('living', 'Living Room', R, 'living', FunctionalZone.Public, 12, 18, { max: 26, canonicalType: RoomType.Living, support: 'supported', priority: 'required', floor: 'ground_required', synonyms: ['lounge', 'drawing room'] }),
  definition('family_lounge', 'Family Lounge', R, 'living', FunctionalZone.SemiPublic, 10, 15, { max: 22, canonicalType: RoomType.FamilyLiving, support: 'program_only', floor: 'upper_preferred', synonyms: ['family living'] }),
  definition('dining', 'Dining', R, 'living', FunctionalZone.SemiPublic, 8, 12, { max: 18, canonicalType: RoomType.Dining, support: 'supported', priority: 'required', floor: 'ground_preferred', relationships: [{ targetDefinitionId: 'kitchen', strength: AdjacencyStrength.Preferred, reason: 'Short food-service path' }] }),
  definition('breakfast', 'Breakfast / Informal Dining', R, 'living', FunctionalZone.SemiPublic, 5, 8, { max: 12, synonyms: ['breakfast nook'] }),
  definition('kitchen', 'Kitchen', R, 'service', FunctionalZone.Service, 5.5, 9, { max: 14, canonicalType: RoomType.Kitchen, support: 'supported', priority: 'required', floor: 'ground_preferred', relationships: [{ targetDefinitionId: 'dining', strength: AdjacencyStrength.Preferred, reason: 'Short food-service path' }, { targetDefinitionId: 'utility', strength: AdjacencyStrength.Preferred, reason: 'Connected service workflow' }] }),
  definition('pantry', 'Pantry', R, 'service', FunctionalZone.Service, 2, 3.5, { max: 6, synonyms: ['food store'] }),
  definition('utility', 'Utility', R, 'service', FunctionalZone.Service, 3, 5, { max: 8, canonicalType: RoomType.Utility, support: 'supported', floor: 'ground_preferred' }),
  definition('store', 'Store', R, 'service', FunctionalZone.Service, 2, 4, { max: 7, canonicalType: RoomType.Storage, support: 'program_only', synonyms: ['storage'] }),
  definition('laundry', 'Laundry', R, 'service', FunctionalZone.Service, 3, 5, { max: 8 }),
  definition('pooja', 'Pooja Room', R, 'special', FunctionalZone.Private, 2, 3.5, { max: 6, canonicalType: RoomType.Pooja, support: 'supported', synonyms: ['prayer room', 'puja'] }),
  definition('foyer', 'Entrance / Foyer', R, 'circulation', FunctionalZone.Public, 3, 5, { max: 9, canonicalType: RoomType.Foyer, support: 'program_only', floor: 'ground_required', synonyms: ['entry', 'entrance'] }),
  definition('corridor', 'Hall / Passage', R, 'circulation', FunctionalZone.Circulation, 3, 6, { max: 12, canonicalType: RoomType.Corridor, support: 'program_only', synonyms: ['hallway'] }),
  definition('staircase', 'Staircase', R, 'circulation', FunctionalZone.Circulation, 5, 7.5, { max: 12, canonicalType: RoomType.Staircase, support: 'supported', priority: 'required', floor: 'ground_required', synonyms: ['stairs'] }),
  definition('lift', 'Lift', R, 'circulation', FunctionalZone.Circulation, 4, 5, { max: 7, canonicalType: RoomType.Lift, support: 'supported', synonyms: ['elevator'] }),
  definition('balcony', 'Balcony', R, 'outdoor', FunctionalZone.Outdoor, 3, 5, { max: 9, canonicalType: RoomType.Balcony, support: 'supported', floor: 'upper_preferred' }),
  definition('terrace', 'Terrace', R, 'outdoor', FunctionalZone.Outdoor, 8, 14, { max: 30, canonicalType: RoomType.Terrace, support: 'program_only', floor: 'top_preferred', synonyms: ['roof terrace'] }),
  definition('sit_out', 'Sit-out', R, 'outdoor', FunctionalZone.Outdoor, 4, 7, { max: 12, synonyms: ['veranda'] }),
  definition('porch', 'Porch', R, 'outdoor', FunctionalZone.Outdoor, 5, 8, { max: 14, floor: 'ground_required' }),
  definition('car_parking', 'Car Parking', R, 'vehicle', FunctionalZone.Outdoor, 14, 15, { max: 20, canonicalType: RoomType.Parking, support: 'supported', priority: 'required', floor: 'ground_required', synonyms: ['car', 'parking bay'] }),
  definition('two_wheeler_parking', 'Two-Wheeler Parking', R, 'vehicle', FunctionalZone.Outdoor, 3, 5, { max: 8, synonyms: ['bike parking', 'scooter parking'] }),
  definition('garage', 'Garage', R, 'vehicle', FunctionalZone.Outdoor, 16, 20, { max: 28, canonicalType: RoomType.Parking, support: 'supported', floor: 'ground_required' }),
];

const commercial: SpaceDefinition[] = [
  definition('reception', 'Reception', C, 'work', FunctionalZone.Public, 8, 14, { occupancy: 'commercial', priority: 'required', floor: 'ground_required', synonyms: ['front desk'] }),
  definition('retail', 'Retail Area', C, 'work', FunctionalZone.Public, 25, 45, { occupancy: 'commercial', floor: 'ground_required', synonyms: ['shop', 'storefront'] }),
  definition('open_office', 'Open Office', C, 'work', FunctionalZone.SemiPublic, 30, 55, { occupancy: 'commercial', priority: 'required', synonyms: ['workstations', 'office floor'] }),
  definition('private_cabin', 'Private Cabin', C, 'work', FunctionalZone.Private, 8, 12, { occupancy: 'commercial', quantity: 2, synonyms: ['office cabin'] }),
  definition('manager_cabin', 'Manager Cabin', C, 'work', FunctionalZone.Private, 10, 15, { occupancy: 'commercial' }),
  definition('conference', 'Conference Room', C, 'work', FunctionalZone.SemiPublic, 15, 24, { occupancy: 'commercial', synonyms: ['board room'] }),
  definition('meeting', 'Meeting Room', C, 'work', FunctionalZone.SemiPublic, 8, 14, { occupancy: 'commercial' }),
  definition('waiting', 'Waiting Area', C, 'living', FunctionalZone.Public, 8, 15, { occupancy: 'commercial' }),
  definition('commercial_pantry', 'Pantry', C, 'service', FunctionalZone.Service, 4, 7, { occupancy: 'commercial' }),
  definition('staff_dining', 'Staff Dining', C, 'service', FunctionalZone.SemiPublic, 12, 20, { occupancy: 'commercial' }),
  definition('commercial_storage', 'Storage', C, 'service', FunctionalZone.Service, 5, 9, { occupancy: 'commercial', synonyms: ['store'] }),
  definition('server_room', 'Server / IT Room', C, 'technical', FunctionalZone.Service, 6, 10, { occupancy: 'commercial', synonyms: ['it room'] }),
  definition('electrical_room', 'Electrical Room', C, 'technical', FunctionalZone.Service, 5, 8, { occupancy: 'commercial' }),
  definition('male_toilet', 'Male Toilet', [...C, ...E], 'baths', FunctionalZone.Service, 6, 10, { occupancy: 'shared', priority: 'required', synonyms: ['washroom', 'men toilet'] }),
  definition('female_toilet', 'Female Toilet', [...C, ...E], 'baths', FunctionalZone.Service, 6, 10, { occupancy: 'shared', priority: 'required', synonyms: ['washroom', 'women toilet'] }),
  definition('accessible_toilet', 'Accessible Toilet', [...C, ...E], 'baths', FunctionalZone.Service, 4, 5.5, { occupancy: 'shared', priority: 'required', synonyms: ['disabled toilet', 'wheelchair toilet'] }),
  definition('commercial_lift', 'Lift', C, 'circulation', FunctionalZone.Circulation, 4, 6, { occupancy: 'commercial', priority: 'required', floor: 'ground_required', synonyms: ['elevator'] }),
  definition('commercial_stair', 'Staircase', C, 'circulation', FunctionalZone.Circulation, 8, 12, { occupancy: 'commercial', priority: 'required', floor: 'ground_required', synonyms: ['stairs'] }),
  definition('fire_stair', 'Fire Stair', C, 'circulation', FunctionalZone.Circulation, 8, 12, { occupancy: 'commercial', priority: 'required' }),
  definition('service_shaft', 'Service Shaft', C, 'technical', FunctionalZone.Service, 3, 5, { occupancy: 'commercial' }),
  definition('commercial_parking', 'Parking', C, 'vehicle', FunctionalZone.Outdoor, 14, 15, { occupancy: 'commercial', quantity: 4, priority: 'required', floor: 'ground_required', synonyms: ['car parking'] }),
  definition('loading', 'Loading / Service Area', C, 'vehicle', FunctionalZone.Service, 25, 40, { occupancy: 'commercial', floor: 'ground_required' }),
];

const educational: SpaceDefinition[] = [
  definition('classroom', 'Classroom', E, 'learning', FunctionalZone.SemiPublic, 35, 48, { occupancy: 'educational', quantity: 4, priority: 'required', synonyms: ['class', 'teaching room'] }),
  definition('laboratory', 'Laboratory', E, 'learning', FunctionalZone.SemiPublic, 45, 65, { occupancy: 'educational', quantity: 2, synonyms: ['lab', 'science lab'] }),
  definition('computer_lab', 'Computer Lab', E, 'learning', FunctionalZone.SemiPublic, 45, 60, { occupancy: 'educational', synonyms: ['computer room'] }),
  definition('library', 'Library', E, 'learning', FunctionalZone.SemiPublic, 55, 90, { occupancy: 'educational', priority: 'required' }),
  definition('staff_room', 'Staff Room', E, 'work', FunctionalZone.Private, 20, 35, { occupancy: 'educational' }),
  definition('principal_office', 'Principal / Head Office', E, 'work', FunctionalZone.Private, 12, 18, { occupancy: 'educational', synonyms: ['head office'] }),
  definition('administration', 'Administration', E, 'work', FunctionalZone.SemiPublic, 20, 35, { occupancy: 'educational', priority: 'required', synonyms: ['admin'] }),
  definition('education_reception', 'Reception', E, 'work', FunctionalZone.Public, 10, 16, { occupancy: 'educational', floor: 'ground_required' }),
  definition('education_meeting', 'Meeting Room', E, 'work', FunctionalZone.SemiPublic, 10, 16, { occupancy: 'educational' }),
  definition('multipurpose', 'Multipurpose Room', E, 'learning', FunctionalZone.SemiPublic, 60, 100, { occupancy: 'educational' }),
  definition('auditorium', 'Auditorium', E, 'learning', FunctionalZone.Public, 120, 220, { occupancy: 'educational', floor: 'ground_preferred' }),
  definition('education_store', 'Store', E, 'service', FunctionalZone.Service, 6, 10, { occupancy: 'educational', synonyms: ['storage'] }),
  definition('education_stair', 'Staircase', E, 'circulation', FunctionalZone.Circulation, 10, 15, { occupancy: 'educational', quantity: 2, priority: 'required', floor: 'ground_required', synonyms: ['stairs'] }),
  definition('education_lift', 'Lift', E, 'circulation', FunctionalZone.Circulation, 5, 7, { occupancy: 'educational', priority: 'required', floor: 'ground_required', synonyms: ['elevator'] }),
  definition('education_corridor', 'Corridor', E, 'circulation', FunctionalZone.Circulation, 30, 55, { occupancy: 'educational', priority: 'required', synonyms: ['passage'] }),
  definition('playground', 'Playground / Outdoor Area', E, 'outdoor', FunctionalZone.Outdoor, 300, 600, { occupancy: 'educational', synonyms: ['outdoor', 'play area'] }),
  definition('education_parking', 'Parking', E, 'vehicle', FunctionalZone.Outdoor, 70, 100, { occupancy: 'educational', floor: 'ground_required', synonyms: ['car parking'] }),
];

export const SPACE_CATALOG: readonly SpaceDefinition[] = Object.freeze([...residential, ...commercial, ...educational]);

export function getSpaceDefinition(id: string): SpaceDefinition | undefined {
  return SPACE_CATALOG.find(item => item.id === id);
}

export function getSpaceCatalog(category: SpaceBuildingCategory): readonly SpaceDefinition[] {
  return SPACE_CATALOG.filter(item => item.categories.includes(category));
}

export function searchSpaceCatalog(category: SpaceBuildingCategory, query: string, group?: SpaceFunctionalGroup): readonly SpaceDefinition[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return getSpaceCatalog(category).filter(item => {
    if (group && item.group !== group) return false;
    const haystack = [item.displayName, item.group, ...item.synonyms, ...item.tags].join(' ').toLowerCase();
    return terms.every(term => haystack.includes(term));
  });
}

export const SPACE_PROGRAM_PRESETS: readonly SpaceProgramPreset[] = Object.freeze([
  { id: 'residential_1bhk', name: '1BHK', category: 'residential', items: [
    { definitionId: 'living' }, { definitionId: 'dining' }, { definitionId: 'kitchen' },
    { definitionId: 'primary_bedroom' }, { definitionId: 'common_bathroom' }, { definitionId: 'car_parking' },
  ] },
  { id: 'residential_2bhk', name: '2BHK', category: 'residential', items: [
    { definitionId: 'living' }, { definitionId: 'dining' }, { definitionId: 'kitchen' },
    { definitionId: 'primary_bedroom' }, { definitionId: 'bedroom', quantity: 1 },
    { definitionId: 'primary_bathroom' }, { definitionId: 'common_bathroom' },
    { definitionId: 'utility' }, { definitionId: 'car_parking' }, { definitionId: 'staircase' },
  ] },
  { id: 'residential_3bhk', name: '3BHK', category: 'residential', items: [
    { definitionId: 'living' }, { definitionId: 'dining' }, { definitionId: 'kitchen' },
    { definitionId: 'primary_bedroom' }, { definitionId: 'bedroom', quantity: 2 },
    { definitionId: 'primary_bathroom' }, { definitionId: 'common_bathroom', quantity: 2 },
    { definitionId: 'utility' }, { definitionId: 'pooja', priority: 'preferred' },
    { definitionId: 'car_parking' }, { definitionId: 'staircase' }, { definitionId: 'balcony' },
  ] },
  { id: 'residential_duplex', name: 'Duplex', category: 'residential', items: [
    { definitionId: 'living' }, { definitionId: 'dining' }, { definitionId: 'kitchen' },
    { definitionId: 'guest_bedroom', floorPreference: { kind: 'ground_preferred' } },
    { definitionId: 'primary_bedroom', floorPreference: { kind: 'upper_preferred' } },
    { definitionId: 'bedroom', quantity: 2, floorPreference: { kind: 'upper_preferred' } },
    { definitionId: 'common_bathroom', quantity: 3 }, { definitionId: 'staircase' }, { definitionId: 'balcony' },
  ] },
  { id: 'commercial_small_office', name: 'Small Office', category: 'commercial', items: [
    { definitionId: 'reception' }, { definitionId: 'open_office' }, { definitionId: 'private_cabin', quantity: 2 },
    { definitionId: 'meeting' }, { definitionId: 'commercial_pantry' },
    { definitionId: 'male_toilet' }, { definitionId: 'female_toilet' }, { definitionId: 'accessible_toilet' },
    { definitionId: 'commercial_stair' }, { definitionId: 'commercial_parking', quantity: 2 },
  ] },
  { id: 'educational_classroom_wing', name: 'Classroom Wing', category: 'educational', items: [
    { definitionId: 'classroom', quantity: 6 }, { definitionId: 'laboratory', quantity: 2 },
    { definitionId: 'library' }, { definitionId: 'staff_room' }, { definitionId: 'administration' },
    { definitionId: 'male_toilet' }, { definitionId: 'female_toilet' }, { definitionId: 'accessible_toilet' },
    { definitionId: 'education_stair', quantity: 2 }, { definitionId: 'education_lift' },
  ] },
]);

export function getSpaceProgramPresets(category: SpaceBuildingCategory): readonly SpaceProgramPreset[] {
  return SPACE_PROGRAM_PRESETS.filter(preset => preset.category === category);
}
