import { describe, it, expect } from 'vitest';
import { validateBuildingSchema } from '@ai-floor-planner/core';
import { generateResidentialPlanFromBrief } from '../services/residential-generator';
import type { ResidentialWizardBrief } from '../components/wizard/ResidentialPlanningWizard';

describe('Residential Plan Generation Integration', () => {
  const sampleVillaBrief: ResidentialWizardBrief = {
    projectName: 'Shanti Villa 3BHK',
    typology: 'villa',
    floors: 2,
    occupancyType: 'single_family',
    locationCity: 'Pune',
    authority: 'Pune PMC',
    unit: 'ft',
    plotWidth: 40,
    plotDepth: 60,
    plotShape: 'rectangular',
    roadFacing: 'north',
    roadCount: 1,
    roadWidthFt: 30,
    northOrientationDeg: 0,
    setbacks: {
      frontFt: 7,
      rearFt: 4,
      leftFt: 4,
      rightFt: 4,
    },
    footprintShape: 'l_shape',
    openingDirection: 'north',
    courtyardSize: 'medium',
    wingOrientation: 'balanced',
    entranceSide: 'north',
    openSpacePreference: 'garden',
    presetBhk: '3bhk',
    rooms: {
      living: 1,
      dining: 1,
      familyLounge: 0,
      bedrooms: 3,
      attachedBaths: 2,
      commonBaths: 1,
      kitchenType: 'semi_open',
      utility: true,
      pooja: true,
      poojaPlacement: 'northeast_vastu',
      balconies: 1,
      verandah: true,
      courtyard: false,
      dressingRooms: 0,
      servantRoom: false,
      parkingCars: 1,
      parkingTwoWheelers: 2,
    },
    vastuLevel: 'strict',
    ventilationPriority: 'high_daylight',
    spatialLayout: 'traditional',
    idealHomeDescription: 'Sunlit modern 3BHK villa with Vastu compliance and front garden',
    avoidancesDescription: 'No bedroom over kitchen, no toilets in Northeast corner',
  };

  it('generates a complete canonical Building with rooms, walls, doors, and windows for a 40x60 2-floor villa', () => {
    const result = generateResidentialPlanFromBrief(sampleVillaBrief, { seed: 101 });

    expect(result.building).toBeDefined();
    expect(result.building.floors.length).toBeGreaterThanOrEqual(1);

    const groundFloor = result.building.floors[0]!;
    expect(groundFloor.rooms.length).toBeGreaterThan(0);
    expect(groundFloor.walls.length).toBeGreaterThan(0);
    expect(groundFloor.doors.length).toBeGreaterThan(0);
    expect(groundFloor.windows.length).toBeGreaterThan(0);

    // Verify key room types are present
    const roomTypes = groundFloor.rooms.map(r => r.type);
    expect(roomTypes).toContain('living');
    expect(roomTypes).toContain('kitchen');

    // Verify candidates are returned
    expect(result.candidates.length).toBeGreaterThanOrEqual(1);
    expect(result.selectedCandidateId).toBeTruthy();

    // Verify metadata and provenance
    expect(result.building.metadata?.wizardBrief).toBeDefined();
    expect(result.provenanceNotes.length).toBeGreaterThan(0);

    // Verify canonical Building schema validity (deserialization and persistence safety)
    const schemaErrors = validateBuildingSchema(result.building);
    expect(schemaErrors).toEqual([]);
    expect(validateBuildingSchema(result.candidates[0]!.building)).toEqual([]);
  });

  it('generates an apartment floor plan when typology is apartment', () => {
    const aptBrief: ResidentialWizardBrief = {
      ...sampleVillaBrief,
      projectName: 'Aura Heights Typical Floor',
      typology: 'apartment',
      plotWidth: 100,
      plotDepth: 120,
    };

    const result = generateResidentialPlanFromBrief(aptBrief, { seed: 101 });
    expect(result.source).toBe('APARTMENT_SCHEMATIC');
    expect(result.building.floors[0]?.rooms.length).toBeGreaterThan(0);
    expect(result.building.floors[0]?.walls.length).toBeGreaterThan(0);
    expect(validateBuildingSchema(result.building)).toEqual([]);
  });
});
