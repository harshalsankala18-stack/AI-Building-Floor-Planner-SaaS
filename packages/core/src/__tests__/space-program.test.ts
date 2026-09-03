import { describe, expect, it } from 'vitest';
import {
  Direction, RoomType, adaptSpaceProgramToResidentialRequirements, addProgramItem,
  applySpaceProgramPreset, calculateProgramCapacity, createBuilding, createCustomProgramItem, createRoom,
  createEmptySpaceProgram, createProgramItem, deriveSpaceProgramFromBuilding,
  getGenerationReadiness, getSpaceCatalog, getSpaceDefinition, getSpaceProgramPresets,
  searchSpaceCatalog, updateProgramItem, validateSpaceProgram,
} from '../index';

const M2 = 1_000_000;

function building(overrides: { width?: number; depth?: number; floors?: number; fsi?: number } = {}) {
  return createBuilding({
    projectId: 'program-project',
    name: 'Program project',
    site: {
      plotWidth: overrides.width ?? 12_000,
      plotDepth: overrides.depth ?? 18_000,
      roadFacing: Direction.East,
      plannedFloorCount: overrides.floors ?? 3,
      setbacks: { front: 1_500, rear: 1_000, left: 1_000, right: 1_000 },
      developmentControls: overrides.fsi === undefined ? undefined : {
        permissibleFsi: { value: overrides.fsi, provenance: 'USER_PROVIDED' },
        maxCoveragePercent: { provenance: 'NOT_CONFIGURED' },
        maxHeight: { provenance: 'NOT_CONFIGURED' },
      },
    },
    floors: [],
  });
}

function definition(id: string) {
  const value = getSpaceDefinition(id);
  if (!value) throw new Error('Missing test definition: ' + id);
  return value;
}

describe('space catalog', () => {
  it('offers substantial category-aware registries without mixing educational into commercial', () => {
    expect(getSpaceCatalog('residential').length).toBeGreaterThanOrEqual(30);
    expect(getSpaceCatalog('commercial').some(item => item.id === 'open_office')).toBe(true);
    expect(getSpaceCatalog('commercial').some(item => item.id === 'classroom')).toBe(false);
    expect(getSpaceCatalog('educational').some(item => item.id === 'classroom')).toBe(true);
  });

  it('composes mixed-use catalog from residential and commercial definitions', () => {
    const ids = getSpaceCatalog('mixed_use').map(item => item.id);
    expect(ids).toEqual(expect.arrayContaining(['living', 'kitchen', 'reception', 'open_office']));
  });

  it('searches names, synonyms, groups, and tags deterministically', () => {
    expect(searchSpaceCatalog('residential', 'master bedroom').map(item => item.id)).toContain('primary_bedroom');
    expect(searchSpaceCatalog('commercial', 'workstations').map(item => item.id)).toEqual(['open_office']);
    expect(searchSpaceCatalog('educational', '', 'learning').every(item => item.group === 'learning')).toBe(true);
  });

  it('exposes the milestone presets for their intended categories', () => {
    expect(getSpaceProgramPresets('residential').map(item => item.name)).toEqual(expect.arrayContaining(['1BHK', '2BHK', '3BHK', 'Duplex']));
    expect(getSpaceProgramPresets('commercial').map(item => item.name)).toContain('Small Office');
    expect(getSpaceProgramPresets('educational').map(item => item.name)).toContain('Classroom Wing');
  });
});

describe('space program intent and validation', () => {
  it('treats an empty program as invalid rather than footprint-ready', () => {
    expect(validateSpaceProgram(createEmptySpaceProgram('residential'), 2)).toEqual(expect.objectContaining({ status: 'INVALID' }));
  });

  it('applies a preset with stable quantities, priorities, and provenance', () => {
    const preset = getSpaceProgramPresets('residential').find(item => item.name === '3BHK')!;
    const program = applySpaceProgramPreset(preset, (id, index) => id + '-' + index);
    expect(program.provenance).toBe('PRESET');
    expect(program.items.find(item => item.definitionId === 'bedroom')?.quantity).toBe(2);
    expect(validateSpaceProgram(program, 3).status).toBe('VALID');
  });

  it('supports immutable quantity, priority, area, floor, and notes edits', () => {
    const original = addProgramItem(createEmptySpaceProgram('residential'), createProgramItem(definition('living'), 'living-1'));
    const edited = updateProgramItem(original, 'living-1', {
      quantity: 2, priority: 'optional', preferredAreaMm2: 20 * M2,
      floorPreference: { kind: 'specific', specificFloor: 1 }, notes: 'Double-height option',
    });
    expect(original.items[0]?.quantity).toBe(1);
    expect(edited.items[0]).toEqual(expect.objectContaining({ quantity: 2, priority: 'optional', notes: 'Double-height option' }));
    expect(validateSpaceProgram(edited, 2).status).toBe('VALID');
  });

  it('rejects invalid areas and references to unplanned floors', () => {
    const item = createProgramItem(definition('living'), 'bad', {
      minimumAreaMm2: 20 * M2,
      preferredAreaMm2: 10 * M2,
      floorPreference: { kind: 'specific', specificFloor: 4 },
    });
    const result = validateSpaceProgram(addProgramItem(createEmptySpaceProgram('residential'), item), 2);
    expect(result.status).toBe('INVALID');
    expect(result.issues.map(issue => issue.field)).toEqual(expect.arrayContaining(['preferredAreaMm2', 'floorPreference']));
  });

  it('creates custom spaces as explicit program-only intent and survives serialization', () => {
    const custom = createCustomProgramItem('custom-1', 'Music Room', 10 * M2, 16 * M2, 'preferred');
    const program = addProgramItem(createEmptySpaceProgram('residential'), custom);
    expect(custom.generatorSupport).toBe('program_only');
    expect(JSON.parse(JSON.stringify(program))).toEqual(program);
    expect(getGenerationReadiness(program)).toBe('NOT_SUPPORTED');
  });
});

describe('capacity and generation boundary', () => {
  it('reports comfortable capacity for a modest program on a multi-level site', () => {
    const preset = getSpaceProgramPresets('residential').find(item => item.name === '2BHK')!;
    expect(calculateProgramCapacity(building(), applySpaceProgramPreset(preset)).state).toBe('COMFORTABLE');
  });

  it('uses user-provided FSI as a limiting input and keeps assumptions visible', () => {
    const preset = getSpaceProgramPresets('residential').find(item => item.name === '2BHK')!;
    const result = calculateProgramCapacity(building({ fsi: 0.4 }), applySpaceProgramPreset(preset));
    expect(result.preliminaryGrossCapacityMm2).toBe(result.fsiLimitedCapacityMm2);
    expect(result.assumptions.join(' ')).toContain('user-provided FSI');
  });

  it('detects infeasible required ground-floor pressure without moving intent automatically', () => {
    const huge = createProgramItem(definition('living'), 'huge', {
      quantity: 2, minimumAreaMm2: 70 * M2, preferredAreaMm2: 80 * M2,
      priority: 'required', floorPreference: { kind: 'ground_required' },
    });
    const program = addProgramItem(createEmptySpaceProgram('residential'), huge);
    const result = calculateProgramCapacity(building({ width: 8_000, depth: 10_000, floors: 3 }), program);
    expect(result.state).toBe('INFEASIBLE');
    expect(result.floorPressures[0]?.status).toBe('OVER_CAPACITY');
    expect(program.items[0]?.floorPreference.kind).toBe('ground_required');
  });

  it('marks non-residential programs as program-only, not falsely generator-ready', () => {
    const commercial = addProgramItem(createEmptySpaceProgram('commercial'), createProgramItem(definition('open_office'), 'office'));
    expect(getGenerationReadiness(commercial)).toBe('NOT_SUPPORTED');
    expect(adaptSpaceProgramToResidentialRequirements(commercial, building()).requirements).toBeUndefined();
  });

  it('adapts supported residential intent to existing deterministic requirements', () => {
    const preset = getSpaceProgramPresets('residential').find(item => item.name === '2BHK')!;
    const result = adaptSpaceProgramToResidentialRequirements(applySpaceProgramPreset(preset), building());
    expect(result.readiness).toBe('FULLY_SUPPORTED');
    expect(result.supportedRoomCounts[RoomType.Bedroom]).toBe(2);
    expect(result.requirements?.hard).toEqual(expect.objectContaining({ bedroomCount: 2, kitchenRequired: true, livingRoomRequired: true }));
  });

  it('keeps unsupported residential intent visible instead of discarding it silently', () => {
    const preset = getSpaceProgramPresets('residential').find(item => item.name === '2BHK')!;
    const withCustom = addProgramItem(applySpaceProgramPreset(preset), createCustomProgramItem('music', 'Music Room', 10 * M2, 15 * M2));
    const result = adaptSpaceProgramToResidentialRequirements(withCustom, building());
    expect(result.readiness).toBe('PARTIALLY_SUPPORTED');
    expect(result.unsupportedItemIds).toContain('music');
    expect(result.requirements).toBeDefined();
  });

  it('derives a reviewable residential intent program from existing room geometry', () => {
    const base = createBuilding({
      projectId: 'existing', name: 'Existing', site: { plotWidth: 10_000, plotDepth: 15_000 },
      floors: [{ buildingId: '', level: 0 }],
    });
    const floor = base.floors[0]!;
    const existing = { ...base, floors: [{ ...floor, rooms: [
      createRoom({ floorId: floor.id, type: RoomType.Living, x: 0, y: 0, width: 4_000, height: 4_000 }),
      createRoom({ floorId: floor.id, type: RoomType.Bedroom, x: 4_000, y: 0, width: 3_000, height: 4_000 }),
    ] }] };
    const derived = deriveSpaceProgramFromBuilding(existing, 'residential');
    expect(derived.provenance).toBe('DERIVED_FROM_EXISTING_DESIGN');
    expect(derived.items.map(item => item.definitionId)).toEqual(expect.arrayContaining(['living', 'bedroom']));
    expect(deriveSpaceProgramFromBuilding(existing, 'commercial').items).toEqual([]);
  });
});
