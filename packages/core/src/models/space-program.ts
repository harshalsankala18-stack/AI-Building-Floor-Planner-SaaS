import type {
  Building, DesignRequirementSpecification, GenerationReadiness, ProgramCapacityResult, RoomProgram,
  ProgramValidationIssue, ProgramValidationResult, ResidentialProgramAdapterResult,
  SpaceBuildingCategory, SpaceDefinition, SpaceFloorPreference, SpaceFunctionalGroup,
  SpaceOccupancy, SpacePriority, SpaceProgram, SpaceProgramItem, SpaceProgramPreset,
} from '../types';
import { DaylightLevel, Direction, FunctionalZone, PlotShape, PreferenceLevel, PrivacyLevel, RoomType } from '../types';
import { calculateSiteMetrics } from './site-intelligence';
import { getSpaceDefinition } from './space-catalog';

const CIRCULATION_RESERVE_RATIO = 0.12;
const VERTICAL_CORE_RESERVE_RATIO = 0.04;
const WALL_SERVICE_RESERVE_RATIO = 0.06;
const TOTAL_RESERVE_RATIO = CIRCULATION_RESERVE_RATIO + VERTICAL_CORE_RESERVE_RATIO + WALL_SERVICE_RESERVE_RATIO;

export function createEmptySpaceProgram(category: SpaceBuildingCategory): SpaceProgram {
  return { schemaVersion: 1, category, items: [], provenance: 'NOT_YET_DEFINED', updatedAt: new Date().toISOString() };
}

export function createProgramItem(
  definition: SpaceDefinition,
  id: string,
  overrides: Partial<SpaceProgramItem> = {},
): SpaceProgramItem {
  return {
    id,
    definitionId: definition.id,
    name: definition.displayName,
    quantity: definition.defaultQuantity,
    minimumAreaMm2: definition.minimumAreaMm2,
    preferredAreaMm2: definition.preferredAreaMm2,
    maximumAreaMm2: definition.maximumAreaMm2,
    priority: definition.defaultPriority,
    floorPreference: { kind: definition.defaultFloorPreference },
    group: definition.group,
    zone: definition.zone,
    occupancy: definition.occupancy,
    canonicalType: definition.canonicalType,
    generatorSupport: definition.generatorSupport,
    isCustom: false,
    ...overrides,
  };
}

export function createCustomProgramItem(
  id: string,
  name: string,
  minimumAreaMm2: number,
  preferredAreaMm2: number,
  priority: SpacePriority = 'preferred',
  group: SpaceFunctionalGroup = 'special',
  occupancy: SpaceOccupancy = 'shared',
): SpaceProgramItem {
  return {
    id, definitionId: 'custom', name, quantity: 1, minimumAreaMm2, preferredAreaMm2,
    priority, group, occupancy, zone: groupToZone(group), floorPreference: { kind: 'any' },
    generatorSupport: 'program_only', isCustom: true,
  };
}

function groupToZone(group: SpaceFunctionalGroup): FunctionalZone {
  if (group === 'private') return FunctionalZone.Private;
  if (group === 'service' || group === 'baths' || group === 'technical') return FunctionalZone.Service;
  if (group === 'circulation') return FunctionalZone.Circulation;
  if (group === 'outdoor' || group === 'vehicle') return FunctionalZone.Outdoor;
  if (group === 'living' || group === 'learning' || group === 'work') return FunctionalZone.SemiPublic;
  return FunctionalZone.Public;
}

export function applySpaceProgramPreset(
  preset: SpaceProgramPreset,
  idFactory: (definitionId: string, index: number) => string = (definitionId, index) => 'program_' + definitionId + '_' + index,
): SpaceProgram {
  const items = preset.items.flatMap((entry, index) => {
    const definition = getSpaceDefinition(entry.definitionId);
    if (!definition) return [];
    return [createProgramItem(definition, idFactory(definition.id, index), {
      quantity: entry.quantity ?? definition.defaultQuantity,
      priority: entry.priority ?? definition.defaultPriority,
      floorPreference: entry.floorPreference ?? { kind: definition.defaultFloorPreference },
    })];
  });
  return { schemaVersion: 1, category: preset.category, items, provenance: 'PRESET', presetId: preset.id, updatedAt: new Date().toISOString() };
}

export function validateSpaceProgram(program: SpaceProgram, plannedFloorCount?: number): ProgramValidationResult {
  const issues: ProgramValidationIssue[] = [];
  if (program.items.length === 0) {
    issues.push({ status: 'INVALID', field: 'items', message: 'Add at least one space before continuing to footprint planning.' });
  }
  const ids = new Set(program.items.map(item => item.id));
  if (ids.size !== program.items.length) issues.push({ status: 'INVALID', field: 'items', message: 'Program item IDs must be unique.' });
  for (const item of program.items) {
    const invalid = (field: string, message: string) => issues.push({ status: 'INVALID', itemId: item.id, field, message });
    if (!Number.isInteger(item.quantity) || item.quantity < 1) invalid('quantity', 'Quantity must be a whole number of at least one.');
    if (!Number.isFinite(item.minimumAreaMm2) || item.minimumAreaMm2 <= 0) invalid('minimumAreaMm2', 'Minimum area must be greater than zero.');
    if (!Number.isFinite(item.preferredAreaMm2) || item.preferredAreaMm2 < item.minimumAreaMm2) invalid('preferredAreaMm2', 'Preferred area must be at least the minimum area.');
    if (item.maximumAreaMm2 !== undefined && (!Number.isFinite(item.maximumAreaMm2) || item.maximumAreaMm2 < item.preferredAreaMm2)) {
      invalid('maximumAreaMm2', 'Maximum area must be at least the preferred area.');
    }
    if (item.isCustom && !item.name.trim()) invalid('name', 'Custom spaces require a name.');
    if (item.attachedToRoomId !== undefined) {
      const owner = program.items.find(candidate => candidate.id === item.attachedToRoomId);
      if (item.canonicalType !== RoomType.Bathroom || !owner || owner.canonicalType !== RoomType.Bedroom
          || owner.isCustom || owner.generatorSupport !== 'supported') {
        invalid('attachedToRoomId', 'An attached bathroom must reference an existing supported bedroom Program item.');
      } else {
        if (owner.quantity !== 1 && owner.quantity !== item.quantity) {
          invalid('attachedToRoomId', 'Ambiguous suite quantities: use one owner or equal bedroom/bathroom quantities.');
        }
        const requiredLevel = (preference: SpaceFloorPreference) => preference.kind === 'ground_required'
          ? 0 : preference.kind === 'specific' ? preference.specificFloor : undefined;
        const ownerLevel = requiredLevel(owner.floorPreference);
        const bathLevel = requiredLevel(item.floorPreference);
        if (ownerLevel !== undefined && bathLevel !== undefined && ownerLevel !== bathLevel) {
          invalid('attachedToRoomId', 'Attached bathroom and bedroom have conflicting required floors.');
        }
      }
    }
    if (item.floorPreference.kind === 'specific') {
      const floor = item.floorPreference.specificFloor;
      if (!Number.isInteger(floor) || (floor as number) < 0 || plannedFloorCount === undefined || (floor as number) >= plannedFloorCount) {
        invalid('floorPreference', 'Specific floor must reference a planned floor.');
      }
    }
  }
  return { status: issues.some(issue => issue.status === 'INVALID') ? 'INVALID' : 'VALID', issues };
}

export function getGenerationReadiness(program: SpaceProgram): GenerationReadiness {
  if (program.category !== 'residential') return 'NOT_SUPPORTED';
  if (program.items.length === 0) return 'NOT_SUPPORTED';
  const supported = program.items.filter(item => item.generatorSupport === 'supported' && !item.isCustom).length;
  if (supported === 0) return 'NOT_SUPPORTED';
  return supported === program.items.length ? 'FULLY_SUPPORTED' : 'PARTIALLY_SUPPORTED';
}

function itemArea(item: SpaceProgramItem, kind: 'minimum' | 'preferred'): number {
  return (kind === 'minimum' ? item.minimumAreaMm2 : item.preferredAreaMm2) * item.quantity;
}

function distributeFloorPressure(
  program: SpaceProgram,
  floorCount: number,
  perFloorCapacity: number,
): ProgramCapacityResult['floorPressures'] {
  const demands = Array.from({ length: floorCount }, () => ({ required: 0, preferred: 0, names: [] as string[] }));
  const upper = Array.from({ length: Math.max(0, floorCount - 1) }, (_, index) => index + 1);
  for (const item of program.items) {
    const preference = item.floorPreference;
    let levels: number[] = [];
    if (preference.kind === 'ground_required' || preference.kind === 'ground_preferred') levels = [0];
    else if (preference.kind === 'specific' && preference.specificFloor !== undefined && preference.specificFloor < floorCount) levels = [preference.specificFloor];
    else if (preference.kind === 'top_preferred') levels = [floorCount - 1];
    else if (preference.kind === 'upper_preferred') levels = upper.length ? upper : [0];
    if (!levels.length) continue;
    const minShare = itemArea(item, 'minimum') / levels.length;
    const preferredShare = itemArea(item, 'preferred') / levels.length;
    levels.forEach(level => {
      demands[level]!.preferred += preferredShare;
      if (item.priority === 'required' && (preference.kind === 'ground_required' || preference.kind === 'specific')) {
        demands[level]!.required += minShare;
      }
      demands[level]!.names.push(item.name + (item.quantity > 1 ? ' ×' + item.quantity : ''));
    });
  }
  return demands.map((demand, floorLevel) => ({
    floorLevel,
    requiredDemandMm2: demand.required,
    preferredDemandMm2: demand.preferred,
    availableAreaMm2: perFloorCapacity,
    status: demand.required > perFloorCapacity ? 'OVER_CAPACITY'
      : demand.preferred > perFloorCapacity ? 'TIGHT' : 'AVAILABLE',
    itemNames: demand.names,
  }));
}

export function calculateProgramCapacity(building: Building, program: SpaceProgram): ProgramCapacityResult {
  const metrics = calculateSiteMetrics(building);
  const floorCount = building.site.plannedFloorCount ?? 0;
  const minimum = program.items.reduce((total, item) => total + itemArea(item, 'minimum'), 0);
  const preferred = program.items.reduce((total, item) => total + itemArea(item, 'preferred'), 0);
  const perFloor = metrics.buildableEnvelopeArea;
  const geometric = perFloor * floorCount;
  const fsiLimited = metrics.permissibleFloorArea;
  const preliminaryGross = fsiLimited === undefined ? geometric : Math.min(geometric, fsiLimited);
  const circulationReserve = preliminaryGross * CIRCULATION_RESERVE_RATIO;
  const verticalCoreReserve = preliminaryGross * VERTICAL_CORE_RESERVE_RATIO;
  const wallServiceReserve = preliminaryGross * WALL_SERVICE_RESERVE_RATIO;
  const usable = preliminaryGross * (1 - TOTAL_RESERVE_RATIO);
  const floorPressures = floorCount > 0 && perFloor > 0 ? distributeFloorPressure(program, floorCount, perFloor * (1 - TOTAL_RESERVE_RATIO)) : [];
  let state: ProgramCapacityResult['state'] = 'INSUFFICIENT_INPUT';
  if (floorCount > 0 && perFloor > 0) {
    if (minimum > usable || floorPressures.some(floor => floor.status === 'OVER_CAPACITY')) state = 'INFEASIBLE';
    else if (preferred > usable * 0.85 || floorPressures.some(floor => floor.status === 'TIGHT')) state = 'TIGHT';
    else state = 'COMFORTABLE';
  }
  return {
    state,
    minimumProgramAreaMm2: minimum,
    preferredProgramAreaMm2: preferred,
    buildableEnvelopePerFloorMm2: perFloor,
    plannedFloorCount: floorCount,
    geometricCapacityMm2: geometric,
    fsiLimitedCapacityMm2: fsiLimited,
    preliminaryGrossCapacityMm2: preliminaryGross,
    circulationReserveMm2: circulationReserve,
    verticalCoreReserveMm2: verticalCoreReserve,
    wallServiceReserveMm2: wallServiceReserve,
    estimatedUsableCapacityMm2: usable,
    utilizationRatio: usable > 0 ? preferred / usable : undefined,
    deficitMm2: minimum > usable ? minimum - usable : undefined,
    floorPressures,
    assumptions: [
      'Geometric capacity equals the setback envelope multiplied by planned levels.',
      'Preliminary gross capacity is limited by user-provided FSI when configured.',
      'Reserve assumptions: 12% circulation, 4% vertical core, and 6% walls/services.',
      'This is preliminary spatial feasibility, not building-code approval.',
    ],
  };
}

const DERIVATION_MAP: Partial<Record<RoomType, string>> = {
  [RoomType.Living]: 'living', [RoomType.Dining]: 'dining', [RoomType.Kitchen]: 'kitchen',
  [RoomType.Bedroom]: 'bedroom', [RoomType.Bathroom]: 'common_bathroom', [RoomType.Utility]: 'utility',
  [RoomType.Pooja]: 'pooja', [RoomType.Study]: 'study', [RoomType.Staircase]: 'staircase',
  [RoomType.Lift]: 'lift', [RoomType.Parking]: 'car_parking', [RoomType.Balcony]: 'balcony',
  [RoomType.Storage]: 'store', [RoomType.Corridor]: 'corridor', [RoomType.Foyer]: 'foyer',
  [RoomType.FamilyLiving]: 'family_lounge', [RoomType.Terrace]: 'terrace',
};

export function deriveSpaceProgramFromBuilding(building: Building, category: SpaceBuildingCategory): SpaceProgram {
  if (category !== 'residential') return createEmptySpaceProgram(category);
  const counts = new Map<string, { count: number; type: RoomType }>();
  for (const room of building.floors.flatMap(floor => floor.rooms)) {
    const definitionId = DERIVATION_MAP[room.type];
    if (!definitionId) continue;
    const current = counts.get(definitionId);
    counts.set(definitionId, { count: (current?.count ?? 0) + 1, type: room.type });
  }
  if (!counts.size) return createEmptySpaceProgram(category);
  const items = [...counts.entries()].flatMap(([definitionId, value], index) => {
    const definition = getSpaceDefinition(definitionId);
    return definition ? [createProgramItem(definition, 'derived_' + definitionId + '_' + index, { quantity: value.count })] : [];
  });
  return { schemaVersion: 1, category, items, provenance: 'DERIVED_FROM_EXISTING_DESIGN', updatedAt: new Date().toISOString() };
}

export function adaptSpaceProgramToResidentialRequirements(
  program: SpaceProgram,
  building: Building,
): ResidentialProgramAdapterResult {
  const readiness = getGenerationReadiness(program);
  const supportedRoomCounts: Partial<Record<RoomType, number>> = {};
  const unsupportedItemIds: string[] = [];
  for (const item of program.items) {
    if (item.generatorSupport !== 'supported' || item.isCustom || !item.canonicalType) {
      unsupportedItemIds.push(item.id);
      continue;
    }
    supportedRoomCounts[item.canonicalType] = (supportedRoomCounts[item.canonicalType] ?? 0) + item.quantity;
  }
  if (readiness === 'NOT_SUPPORTED') return { readiness, supportedRoomCounts, unsupportedItemIds };
  const count = (type: RoomType) => supportedRoomCounts[type] ?? 0;
  const requirements: DesignRequirementSpecification = {
    schemaVersion: 1,
    projectId: building.projectId,
    projectName: building.name,
    hard: {
      plotWidthMm: building.site.plotWidth,
      plotDepthMm: building.site.plotDepth,
      roadFacing: building.site.roadFacing ?? Direction.North,
      floorsCount: building.site.plannedFloorCount ?? Math.max(1, building.floors.length),
      bedroomCount: count(RoomType.Bedroom),
      bathroomCount: count(RoomType.Bathroom),
      kitchenRequired: count(RoomType.Kitchen) > 0,
      livingRoomRequired: count(RoomType.Living) > 0,
      diningRoomRequired: count(RoomType.Dining) > 0,
      staircaseRequired: count(RoomType.Staircase) > 0,
      parkingRequired: count(RoomType.Parking) > 0,
      parkingSpacesCount: count(RoomType.Parking),
      liftRequired: count(RoomType.Lift) > 0,
      customRooms: [
        RoomType.Utility, RoomType.Storage, RoomType.Foyer, RoomType.Corridor,
      ].flatMap(type => count(type) ? [{ type, count: count(type) }] : []),
    },
    soft: {
      vastuCompliance: false,
      naturalLightPreference: PreferenceLevel.Medium,
      privacyPreference: PreferenceLevel.Medium,
      circulationEfficiency: PreferenceLevel.Medium,
      gardenPreference: count(RoomType.Garden) > 0,
      servantQuarter: count(RoomType.ServantQuarter) > 0,
      poojaRoom: count(RoomType.Pooja) > 0,
      studyRoom: count(RoomType.Study) > 0,
      balconyPreferred: count(RoomType.Balcony) > 0,
      openKitchen: false,
      attachedBathroomsCount: program.items.filter(item => item.definitionId.includes('attached') || item.definitionId === 'primary_bathroom').reduce((sum, item) => sum + item.quantity, 0),
    },
    plotShape: building.site.plotShape ?? PlotShape.Rectangular,
    orientationDegrees: building.site.orientation,
    setbacksMm: building.site.setbacks,
  };
  return { readiness, supportedRoomCounts, unsupportedItemIds, requirements };
}

/**
 * Converts the reviewed product Space Program into the planning engine's
 * concrete room-instance program without replacing user-entered areas.
 * Unsupported/custom items are deliberately excluded by the readiness gate.
 */
export function adaptSpaceProgramToPlannerProgram(
  program: SpaceProgram,
  plannedFloorCount: number,
): RoomProgram {
  const floorCount = Math.max(1, plannedFloorCount);
  const validation = validateSpaceProgram(program, floorCount);
  if (validation.status === 'INVALID') throw new Error(validation.issues.map(issue => issue.message).join(' '));
  const items = program.items.flatMap(item => {
    const canonicalType = item.canonicalType;
    if (item.generatorSupport !== 'supported' || item.isCustom || !canonicalType) return [];
    return Array.from({ length: item.quantity }, (_, index) => {
      const floorLevel = item.floorPreference.kind === 'specific'
        ? Math.min(floorCount - 1, Math.max(0, item.floorPreference.specificFloor ?? 0))
        : item.floorPreference.kind === 'top_preferred'
          ? floorCount - 1
          : 0;
      const aspect = canonicalType === RoomType.Parking ? 0.5
        : item.group === 'circulation' ? 0.72
          : item.group === 'baths' ? 0.78 : 0.9;
      const minWidthMm = Math.max(1_200, Math.round(Math.sqrt(item.minimumAreaMm2 * aspect) / 10) * 10);
      const minHeightMm = Math.max(1_500, Math.ceil(item.minimumAreaMm2 / minWidthMm / 10) * 10);
      const daylight = item.group === 'private' || item.group === 'living' || item.group === 'work' || item.group === 'learning'
        ? DaylightLevel.High
        : item.group === 'baths' || item.group === 'technical'
          ? DaylightLevel.Low : DaylightLevel.Medium;
      const privacy = item.group === 'private' || item.group === 'baths'
        ? PrivacyLevel.High
        : item.group === 'service' || item.group === 'technical'
          ? PrivacyLevel.Medium : PrivacyLevel.Low;
      return {
        id: `${item.id}_${index + 1}`,
        type: canonicalType,
        name: item.quantity > 1 ? `${item.name} ${index + 1}` : item.name,
        zone: item.zone,
        floorLevel,
        floorPreference: { ...item.floorPreference },
        attachedToRoomId: item.attachedToRoomId === undefined ? undefined
          : `${item.attachedToRoomId}_${program.items.find(owner => owner.id === item.attachedToRoomId)!.quantity === 1 ? 1 : index + 1}`,
        targetAreaMm2: item.preferredAreaMm2,
        minAreaMm2: item.minimumAreaMm2,
        maxAreaMm2: Math.max(item.preferredAreaMm2, item.maximumAreaMm2 ?? item.preferredAreaMm2 * 1.5),
        minWidthMm,
        minHeightMm,
        daylight,
        privacy,
        ventilationRequired: item.group !== 'technical',
        isFixed: canonicalType === RoomType.Staircase || canonicalType === RoomType.Lift,
      };
    });
  });
  return {
    items,
    totalTargetAreaMm2: items.reduce((sum, item) => sum + item.targetAreaMm2, 0),
    totalMinAreaMm2: items.reduce((sum, item) => sum + item.minAreaMm2, 0),
    totalMaxAreaMm2: items.reduce((sum, item) => sum + item.maxAreaMm2, 0),
  };
}

export function updateProgramItem(program: SpaceProgram, itemId: string, changes: Partial<SpaceProgramItem>): SpaceProgram {
  return { ...program, items: program.items.map(item => item.id === itemId ? { ...item, ...changes } : item), provenance: 'USER_DEFINED', updatedAt: new Date().toISOString() };
}

export function removeProgramItem(program: SpaceProgram, itemId: string): SpaceProgram {
  return { ...program, items: program.items.filter(item => item.id !== itemId), provenance: 'USER_DEFINED', updatedAt: new Date().toISOString() };
}

export function addProgramItem(program: SpaceProgram, item: SpaceProgramItem): SpaceProgram {
  return { ...program, items: [...program.items, item], provenance: 'USER_DEFINED', updatedAt: new Date().toISOString() };
}

export function floorPreferenceLabel(preference: SpaceFloorPreference, floorCount: number): string {
  if (preference.kind === 'specific') return preference.specificFloor === 0 ? 'Ground floor' : 'Floor ' + preference.specificFloor;
  if (preference.kind === 'ground_required') return 'Ground required';
  if (preference.kind === 'ground_preferred') return 'Ground preferred';
  if (preference.kind === 'upper_preferred') return floorCount > 1 ? 'Upper floor preferred' : 'Any floor';
  if (preference.kind === 'top_preferred') return floorCount > 1 ? 'Top floor preferred' : 'Any floor';
  return 'Any floor';
}
