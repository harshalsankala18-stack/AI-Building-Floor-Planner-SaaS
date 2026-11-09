import { describe, expect, it } from 'vitest';
import {
  type ApartmentBriefConfig,
  type ApartmentUnitType,
  CANONICAL_ROOM_PROGRAMMES,
  getApartmentRulesProfile,
  getExpectedRoomProgramme,
  isSupportedUnitType,
  normalizeUnitType,
  resolveAndValidateUnitMix,
  SUPPORTED_APARTMENT_UNIT_TYPES,
  TYPOLOGY_TEMPLATES,
  TYPOLOGY_STUDIO_TEMPLATE,
  TYPOLOGY_1BHK_TEMPLATE,
  TYPOLOGY_2BHK_TEMPLATE,
  TYPOLOGY_3BHK_TEMPLATE,
  TYPOLOGY_4BHK_TEMPLATE,
  UnsupportedUnitTypeError,
  allocateApartmentUnitSpaces,
  buildApartmentGenerationManifest,
  generateDeterministicApartmentSchematic,
  validateSchematicMatchesManifest,
} from '../index';

describe('Phase 2 — Canonical Unit-Type Normalization (§4)', () => {
  it('normalizes all supported case variations to canonical typologies', () => {
    expect(normalizeUnitType('Studio')).toBe('Studio');
    expect(normalizeUnitType('studio')).toBe('Studio');
    expect(normalizeUnitType('STUDIO')).toBe('Studio');
    expect(normalizeUnitType(' Studio ')).toBe('Studio');

    expect(normalizeUnitType('1BHK')).toBe('1BHK');
    expect(normalizeUnitType('1bhk')).toBe('1BHK');
    expect(normalizeUnitType('1Bhk')).toBe('1BHK');
    expect(normalizeUnitType(' 1bhk ')).toBe('1BHK');

    expect(normalizeUnitType('2BHK')).toBe('2BHK');
    expect(normalizeUnitType('2bhk')).toBe('2BHK');
    expect(normalizeUnitType('2Bhk')).toBe('2BHK');

    expect(normalizeUnitType('3BHK')).toBe('3BHK');
    expect(normalizeUnitType('3bhk')).toBe('3BHK');
    expect(normalizeUnitType('3Bhk')).toBe('3BHK');

    expect(normalizeUnitType('4BHK')).toBe('4BHK');
    expect(normalizeUnitType('4bhk')).toBe('4BHK');
    expect(normalizeUnitType('4Bhk')).toBe('4BHK');
  });

  it('rejects unsupported and unknown unit types with UnsupportedUnitTypeError', () => {
    const invalidTypes = ['5BHK', '5bhk', 'Penthouse', 'penthouse', 'Duplex', 'Villa', 'RK', '1RK', '', '  '];
    for (const invalid of invalidTypes) {
      expect(() => normalizeUnitType(invalid)).toThrow(UnsupportedUnitTypeError);
      expect(() => normalizeUnitType(invalid)).toThrow(/Unsupported apartment unit type/);
    }
  });

  it('validates supported unit types via isSupportedUnitType predicate', () => {
    expect(isSupportedUnitType('Studio')).toBe(true);
    expect(isSupportedUnitType('studio')).toBe(true);
    expect(isSupportedUnitType('1BHK')).toBe(true);
    expect(isSupportedUnitType('2bhk')).toBe(true);
    expect(isSupportedUnitType('3BHK')).toBe(true);
    expect(isSupportedUnitType('4BHK')).toBe(true);

    expect(isSupportedUnitType('5BHK')).toBe(false);
    expect(isSupportedUnitType('Villa')).toBe(false);
    expect(isSupportedUnitType('')).toBe(false);
  });
});

describe('Phase 2 — Explicit Default Room Programmes Contract (§3, §5)', () => {
  it('defines distinct, documented room-programme contracts for all 5 canonical unit types', () => {
    expect(SUPPORTED_APARTMENT_UNIT_TYPES).toEqual(['Studio', '1BHK', '2BHK', '3BHK', '4BHK']);

    const sampleUnit: ApartmentUnitType = 'Studio';
    expect(sampleUnit).toBe('Studio');
    const studioProg = getExpectedRoomProgramme('Studio');
    expect(CANONICAL_ROOM_PROGRAMMES['Studio']).toEqual(studioProg);
    expect(studioProg).toEqual({
      unitType: 'Studio',
      bedrooms: 0,
      bathrooms: 1,
      livingRooms: 1,
      diningRooms: 0,
      kitchens: 1,
      utilities: 0,
      balconies: 1,
    });

    const b1Prog = getExpectedRoomProgramme('1BHK');
    expect(b1Prog).toEqual({
      unitType: '1BHK',
      bedrooms: 1,
      bathrooms: 1,
      livingRooms: 1,
      diningRooms: 1,
      kitchens: 1,
      utilities: 1,
      balconies: 1,
    });

    const b2Prog = getExpectedRoomProgramme('2BHK');
    expect(b2Prog).toEqual({
      unitType: '2BHK',
      bedrooms: 2,
      bathrooms: 2,
      livingRooms: 1,
      diningRooms: 1,
      kitchens: 1,
      utilities: 1,
      balconies: 1,
    });

    const b3Prog = getExpectedRoomProgramme('3BHK');
    expect(b3Prog).toEqual({
      unitType: '3BHK',
      bedrooms: 3,
      bathrooms: 3,
      livingRooms: 1,
      diningRooms: 1,
      kitchens: 1,
      utilities: 1,
      balconies: 1,
    });

    const b4Prog = getExpectedRoomProgramme('4BHK');
    expect(b4Prog).toEqual({
      unitType: '4BHK',
      bedrooms: 4,
      bathrooms: 4,
      livingRooms: 1,
      diningRooms: 1,
      kitchens: 1,
      utilities: 1,
      balconies: 1,
    });
  });

  it('provides distinct, non-aliased templates for each typology in TYPOLOGY_TEMPLATES', () => {
    expect(TYPOLOGY_TEMPLATES['Studio']).toBe(TYPOLOGY_STUDIO_TEMPLATE);
    expect(TYPOLOGY_TEMPLATES['1BHK']).toBe(TYPOLOGY_1BHK_TEMPLATE);
    expect(TYPOLOGY_TEMPLATES['2BHK']).toBe(TYPOLOGY_2BHK_TEMPLATE);
    expect(TYPOLOGY_TEMPLATES['3BHK']).toBe(TYPOLOGY_3BHK_TEMPLATE);
    expect(TYPOLOGY_TEMPLATES['4BHK']).toBe(TYPOLOGY_4BHK_TEMPLATE);

    // Defect check: ensure 1BHK is NOT aliased to 2BHK and 4BHK is NOT aliased to 3BHK
    expect(TYPOLOGY_TEMPLATES['1BHK']).not.toBe(TYPOLOGY_TEMPLATES['2BHK']);
    expect(TYPOLOGY_TEMPLATES['4BHK']).not.toBe(TYPOLOGY_TEMPLATES['3BHK']);
    expect(TYPOLOGY_TEMPLATES['Studio']).not.toBe(TYPOLOGY_TEMPLATES['2BHK']);
  });
});

describe('Phase 2 — Spatial Allocation Engine per Typology (§3)', () => {
  const rules = getApartmentRulesProfile('pune_pmc');

  it('allocates Studio with 0 separate bedrooms, 1 bathroom, open living/sleeping space, and kitchenette', () => {
    const alloc = allocateApartmentUnitSpaces({
      unitType: 'Studio',
      flatLabel: 'Studio Flat',
      rulesProfile: rules,
    });

    expect(alloc.unitType).toBe('Studio');
    const bedrooms = alloc.rooms.filter(r => r.type === 'master_bedroom' || r.type === 'bedroom');
    const bathrooms = alloc.rooms.filter(r => r.type === 'master_toilet' || r.type === 'common_toilet' || r.type === 'powder_room');
    const living = alloc.rooms.filter(r => r.type === 'living_dining');
    const kitchens = alloc.rooms.filter(r => r.type === 'kitchen');

    expect(bedrooms).toHaveLength(0); // Studio has no separate partitioned bedroom
    expect(bathrooms).toHaveLength(1);
    expect(living).toHaveLength(1); // Open living/sleeping space
    expect(kitchens).toHaveLength(1);
  });

  it('allocates 1BHK with exactly 1 separate bedroom and 1 bathroom', () => {
    const alloc = allocateApartmentUnitSpaces({
      unitType: '1BHK',
      flatLabel: 'Flat 1BHK',
      rulesProfile: rules,
    });

    expect(alloc.unitType).toBe('1BHK');
    const bedrooms = alloc.rooms.filter(r => r.type === 'master_bedroom' || r.type === 'bedroom');
    const bathrooms = alloc.rooms.filter(r => r.type === 'master_toilet' || r.type === 'common_toilet');
    const kitchens = alloc.rooms.filter(r => r.type === 'kitchen');

    expect(bedrooms).toHaveLength(1);
    expect(bathrooms).toHaveLength(1);
    expect(kitchens).toHaveLength(1);
  });

  it('allocates 2BHK with exactly 2 separate bedrooms and 2 bathrooms', () => {
    const alloc = allocateApartmentUnitSpaces({
      unitType: '2BHK',
      flatLabel: 'Flat 2BHK',
      rulesProfile: rules,
    });

    expect(alloc.unitType).toBe('2BHK');
    const bedrooms = alloc.rooms.filter(r => r.type === 'master_bedroom' || r.type === 'bedroom');
    const bathrooms = alloc.rooms.filter(r => r.type === 'master_toilet' || r.type === 'common_toilet');

    expect(bedrooms).toHaveLength(2);
    expect(bathrooms).toHaveLength(2);
  });

  it('allocates 3BHK with exactly 3 separate bedrooms and 3 bathrooms', () => {
    const alloc = allocateApartmentUnitSpaces({
      unitType: '3BHK',
      flatLabel: 'Flat 3BHK',
      rulesProfile: rules,
    });

    expect(alloc.unitType).toBe('3BHK');
    const bedrooms = alloc.rooms.filter(r => r.type === 'master_bedroom' || r.type === 'bedroom');
    const bathrooms = alloc.rooms.filter(r => r.type === 'master_toilet' || r.type === 'common_toilet');

    expect(bedrooms).toHaveLength(3);
    expect(bathrooms).toHaveLength(3);
  });

  it('allocates 4BHK with exactly 4 separate bedrooms and 4 bathrooms', () => {
    const alloc = allocateApartmentUnitSpaces({
      unitType: '4BHK',
      flatLabel: 'Flat 4BHK',
      rulesProfile: rules,
    });

    expect(alloc.unitType).toBe('4BHK');
    const bedrooms = alloc.rooms.filter(r => r.type === 'master_bedroom' || r.type === 'bedroom');
    const bathrooms = alloc.rooms.filter(r => r.type === 'master_toilet' || r.type === 'common_toilet');

    expect(bedrooms).toHaveLength(4);
    expect(bathrooms).toHaveLength(4);
  });

  it('preserves carpet-area hierarchy: Studio < 1BHK < 2BHK < 3BHK < 4BHK', () => {
    const studio = allocateApartmentUnitSpaces({ unitType: 'Studio', rulesProfile: rules });
    const b1 = allocateApartmentUnitSpaces({ unitType: '1BHK', rulesProfile: rules });
    const b2 = allocateApartmentUnitSpaces({ unitType: '2BHK', rulesProfile: rules });
    const b3 = allocateApartmentUnitSpaces({ unitType: '3BHK', rulesProfile: rules });
    const b4 = allocateApartmentUnitSpaces({ unitType: '4BHK', rulesProfile: rules });

    expect(studio.targetCarpetAreaSqM).toBeLessThan(b1.targetCarpetAreaSqM);
    expect(b1.targetCarpetAreaSqM).toBeLessThan(b2.targetCarpetAreaSqM);
    expect(b2.targetCarpetAreaSqM).toBeLessThan(b3.targetCarpetAreaSqM);
    expect(b3.targetCarpetAreaSqM).toBeLessThan(b4.targetCarpetAreaSqM);
  });

  it('does NOT count auxiliary spaces (foyer, utility, puja, balcony) as bedrooms or bathrooms', () => {
    const alloc = allocateApartmentUnitSpaces({ unitType: '3BHK', rulesProfile: rules });

    const auxiliary = alloc.rooms.filter(r => ['foyer', 'utility', 'puja', 'balcony'].includes(r.type));
    expect(auxiliary.length).toBeGreaterThan(0);

    for (const aux of auxiliary) {
      expect(aux.type).not.toBe('bedroom');
      expect(aux.type).not.toBe('master_bedroom');
      expect(aux.type).not.toBe('master_toilet');
      expect(aux.type).not.toBe('common_toilet');
    }
  });

  it('rejects unsupported typology with UnsupportedUnitTypeError without silent 2BHK fallback', () => {
    expect(() =>
      allocateApartmentUnitSpaces({
        unitType: 'UnknownTypology',
        rulesProfile: rules,
      }),
    ).toThrow(UnsupportedUnitTypeError);
  });
});

describe('Phase 2 — Unit Mix Integrity & Validation (§6)', () => {
  it('applies explicit documented default policy when unit mix is omitted or empty', () => {
    const result1 = resolveAndValidateUnitMix(undefined, 3);
    expect(result1.wasDefaultApplied).toBe(true);
    expect(result1.items).toEqual([{ unitType: '2BHK', count: 3 }]);
    expect(result1.defaultExplanation).toContain('applied default policy: 3 × 2BHK flats');

    const result2 = resolveAndValidateUnitMix([], 2);
    expect(result2.wasDefaultApplied).toBe(true);
    expect(result2.items).toEqual([{ unitType: '2BHK', count: 2 }]);
  });

  it('rejects unit mix where total flat count is less than flatsPerFloor (no silent 2BHK insertion)', () => {
    // 1 flat specified, but flatsPerFloor = 2
    expect(() =>
      resolveAndValidateUnitMix([{ unitType: '2BHK', count: 1 }], 2),
    ).toThrow(/Unit mix total count \(1\) does not match flatsPerFloor \(2\)/);
  });

  it('rejects unit mix where total flat count is greater than flatsPerFloor (no silent truncation)', () => {
    // 3 flats specified, but flatsPerFloor = 2
    expect(() =>
      resolveAndValidateUnitMix(
        [
          { unitType: '1BHK', count: 1 },
          { unitType: '2BHK', count: 2 },
        ],
        2,
      ),
    ).toThrow(/Unit mix total count \(3\) does not match flatsPerFloor \(2\)/);
  });

  it('rejects invalid, negative, zero, or non-integer counts in unit mix', () => {
    expect(() =>
      resolveAndValidateUnitMix([{ unitType: '2BHK', count: 0 }], 2),
    ).toThrow(/Count must be a positive integer/);

    expect(() =>
      resolveAndValidateUnitMix([{ unitType: '2BHK', count: -1 }], 2),
    ).toThrow(/Count must be a positive integer/);

    expect(() =>
      resolveAndValidateUnitMix([{ unitType: '2BHK', count: 1.5 }], 2),
    ).toThrow(/Count must be a positive integer/);
  });

  it('rejects unsupported typologies in unit mix with UnsupportedUnitTypeError', () => {
    expect(() =>
      resolveAndValidateUnitMix([{ unitType: '5BHK', count: 2 }], 2),
    ).toThrow(UnsupportedUnitTypeError);
  });
});

describe('Phase 2 — Manifest Independence & Schematic Validation Gate (§5, §7)', () => {
  const site = {
    plotWidthMm: 45000,
    plotDepthMm: 50000,
    setbacksMm: { front: 3000, rear: 2000, left: 2000, right: 2000 },
  };
  const rules = getApartmentRulesProfile('pune_pmc');

  const makeConfig = (flatsPerFloor: number, unitMix: ApartmentBriefConfig['unitMix']): ApartmentBriefConfig => ({
    projectType: 'apartment',
    jurisdiction: 'pune_pmc',
    floorCount: 4,
    flatsPerFloor,
    unitMix,
    commonCore: {
      passengerLifts: 2,
      serviceLifts: 0,
      staircaseCount: 2,
      fireStaircaseRequired: true,
      commonLobby: true,
    },
    parking: { residentParkingCount: flatsPerFloor, visitorParkingCount: 1 },
    amenities: { groundSiteAmenities: [], buildingAmenities: [] },
  });

  it('Studio manifest and schematic agree: exactly 0 bedrooms, 1 bathroom, 1 living room, 1 kitchen', () => {
    const config = makeConfig(2, [{ unitType: 'Studio', count: 2 }]);
    const manifest = buildApartmentGenerationManifest({ site, apartmentConfig: config });

    expect(manifest.roomTotals.bedrooms).toBe(0);
    expect(manifest.units.units[0]?.bedrooms).toBe(0);
    expect(manifest.units.units[0]?.bathrooms).toBe(1);

    const schematic = generateDeterministicApartmentSchematic({
      siteWidthM: 45,
      siteDepthM: 50,
      flatsPerFloor: 2, unitMix: config.unitMix, commonCoreConfig: config.commonCore, rulesProfile: rules,
    });

    const check = validateSchematicMatchesManifest(schematic, manifest);
    expect(check.matches).toBe(true);
    expect(check.discrepancies).toEqual([]);

    for (const u of schematic.units) {
      const bedrooms = u.rooms.filter(r => r.type === 'master_bedroom' || r.type === 'bedroom');
      const baths = u.rooms.filter(r => r.type === 'master_toilet' || r.type === 'common_toilet');
      expect(bedrooms).toHaveLength(0);
      expect(baths).toHaveLength(1);
    }
  });

  it('1BHK manifest and schematic agree: exactly 1 bedroom, 1 bathroom', () => {
    const config = makeConfig(2, [{ unitType: '1BHK', count: 2 }]);
    const manifest = buildApartmentGenerationManifest({ site, apartmentConfig: config });

    expect(manifest.roomTotals.bedrooms).toBe(2); // 1 + 1 = 2
    expect(manifest.units.units[0]?.bedrooms).toBe(1);
    expect(manifest.units.units[0]?.bathrooms).toBe(1);

    const schematic = generateDeterministicApartmentSchematic({
      siteWidthM: 45,
      siteDepthM: 50,
      flatsPerFloor: 2, unitMix: config.unitMix, commonCoreConfig: config.commonCore, rulesProfile: rules,
    });

    const check = validateSchematicMatchesManifest(schematic, manifest);
    expect(check.matches).toBe(true);
    expect(check.discrepancies).toEqual([]);

    for (const u of schematic.units) {
      const bedrooms = u.rooms.filter(r => r.type === 'master_bedroom' || r.type === 'bedroom');
      const baths = u.rooms.filter(r => r.type === 'master_toilet' || r.type === 'common_toilet');
      expect(bedrooms).toHaveLength(1);
      expect(baths).toHaveLength(1);
    }
  });

  it('4BHK manifest and schematic agree: exactly 4 bedrooms, 4 bathrooms', () => {
    const config = makeConfig(2, [{ unitType: '4BHK', count: 2 }]);
    const manifest = buildApartmentGenerationManifest({ site, apartmentConfig: config });

    expect(manifest.roomTotals.bedrooms).toBe(8); // 4 + 4 = 8
    expect(manifest.units.units[0]?.bedrooms).toBe(4);
    expect(manifest.units.units[0]?.bathrooms).toBe(4);

    const schematic = generateDeterministicApartmentSchematic({
      siteWidthM: 45,
      siteDepthM: 50,
      flatsPerFloor: 2, unitMix: config.unitMix, commonCoreConfig: config.commonCore, rulesProfile: rules,
    });

    const check = validateSchematicMatchesManifest(schematic, manifest);
    expect(check.matches).toBe(true);
    expect(check.discrepancies).toEqual([]);

    for (const u of schematic.units) {
      const bedrooms = u.rooms.filter(r => r.type === 'master_bedroom' || r.type === 'bedroom');
      const baths = u.rooms.filter(r => r.type === 'master_toilet' || r.type === 'common_toilet');
      expect(bedrooms).toHaveLength(4);
      expect(baths).toHaveLength(4);
    }
  });

  it('Mixed-unit floor plate (1x Studio + 1x 1BHK + 1x 2BHK + 1x 3BHK) verifies with exact room counts', () => {
    const mixedMix = [
      { unitType: 'Studio', count: 1 },
      { unitType: '1BHK', count: 1 },
      { unitType: '2BHK', count: 1 },
      { unitType: '3BHK', count: 1 },
    ];
    const config = makeConfig(4, mixedMix);
    const manifest = buildApartmentGenerationManifest({ site, apartmentConfig: config });

    // Total bedrooms across floor: 0 (Studio) + 1 (1BHK) + 2 (2BHK) + 3 (3BHK) = 6
    expect(manifest.roomTotals.bedrooms).toBe(6);
    // Total bathrooms across floor: 1 (Studio) + 1 (1BHK) + 2 (2BHK) + 3 (3BHK) = 7
    expect(manifest.roomTotals.bathrooms).toBe(7);

    const schematic = generateDeterministicApartmentSchematic({
      siteWidthM: 45,
      siteDepthM: 50,
      flatsPerFloor: 4, unitMix: mixedMix, commonCoreConfig: config.commonCore, rulesProfile: rules,
    });

    const check = validateSchematicMatchesManifest(schematic, manifest);
    expect(check.matches).toBe(true);
    expect(check.discrepancies).toEqual([]);

    expect(schematic.units[0]?.unitType).toBe('Studio');
    expect(schematic.units[1]?.unitType).toBe('1BHK');
    expect(schematic.units[2]?.unitType).toBe('2BHK');
    expect(schematic.units[3]?.unitType).toBe('3BHK');

    const beds = (i: number) =>
      schematic.units[i]!.rooms.filter(r => r.type === 'master_bedroom' || r.type === 'bedroom').length;
    const baths = (i: number) =>
      schematic.units[i]!.rooms.filter(r => r.type === 'master_toilet' || r.type === 'common_toilet').length;

    expect(beds(0)).toBe(0);
    expect(beds(1)).toBe(1);
    expect(beds(2)).toBe(2);
    expect(beds(3)).toBe(3);

    expect(baths(0)).toBe(1);
    expect(baths(1)).toBe(1);
    expect(baths(2)).toBe(2);
    expect(baths(3)).toBe(3);
  });

  it('rejects deliberate bedroom or bathroom count mismatch in validateSchematicMatchesManifest', () => {
    const config = makeConfig(2, [{ unitType: '2BHK', count: 2 }]);
    const manifest = buildApartmentGenerationManifest({ site, apartmentConfig: config });

    // Generate schematic with 3BHK instead of 2BHK
    const mismatchedSchematic = generateDeterministicApartmentSchematic({
      siteWidthM: 45,
      siteDepthM: 50,
      flatsPerFloor: 2,
      unitMix: [{ unitType: '3BHK', count: 2 }],
      rulesProfile: rules,
    });

    const check = validateSchematicMatchesManifest(mismatchedSchematic, manifest);
    expect(check.matches).toBe(false);
    expect(check.discrepancies.some(d => d.includes('type mismatch'))).toBe(true);
    expect(check.discrepancies.some(d => d.includes('bedroom(s); manifest requires'))).toBe(true);
  });
});
