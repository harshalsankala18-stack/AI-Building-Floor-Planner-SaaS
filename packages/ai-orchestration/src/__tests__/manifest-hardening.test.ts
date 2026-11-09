import { describe, expect, it } from 'vitest';
import {
  buildApartmentGenerationManifest,
  validateSchematicMatchesManifest,
  classifySchematicUnitRooms,
} from '../apartment/manifest';
import { generateDeterministicApartmentSchematic, type SchematicRoomItem } from '../apartment/schematic';
import { getApartmentRulesProfile } from '../apartment/jurisdiction';
import { CANONICAL_ROOM_PROGRAMMES, type ApartmentUnitType } from '../apartment/typologies';

describe('Phase 2.1 — Room-Programme Validation & Exact Manifest Matching', () => {
  const rulesProfile = getApartmentRulesProfile('pune_pmc');
  const site = {
    plotWidthMm: 35000,
    plotDepthMm: 40000,
    setbacksMm: { front: 3000, rear: 2000, left: 2000, right: 2000 },
  };

  const TYPOLOGIES: readonly ApartmentUnitType[] = ['Studio', '1BHK', '2BHK', '3BHK', '4BHK'];

  const createBrief = (unitType: string, count = 1) => ({
    projectType: 'apartment' as const,
    jurisdiction: 'pune_pmc' as const,
    floorCount: 1,
    flatsPerFloor: count,
    unitMix: [{ unitType, count }],
    commonCore: { passengerLifts: 1, serviceLifts: 0, staircaseCount: 1, commonLobby: true, fireStaircaseRequired: false },
    parking: { residentParkingCount: 1, visitorParkingCount: 1 },
    amenities: { groundSiteAmenities: [], buildingAmenities: [] },
  });

  const coreConfig = { passengerLifts: 1, serviceLifts: 0, staircaseCount: 1, commonLobby: true };

  describe('1. Positive Baseline Agreement for All 5 Typologies', () => {
    for (const unitType of TYPOLOGIES) {
      it(`schematic matches manifest exactly for 1-flat ${unitType}`, () => {
        const expected = CANONICAL_ROOM_PROGRAMMES[unitType];

        const manifest = buildApartmentGenerationManifest({
          site,
          apartmentConfig: createBrief(unitType),
          rulesProfile,
        });

        const schematic = generateDeterministicApartmentSchematic({
          siteWidthM: 35,
          siteDepthM: 40,
          setbacksM: { front: 3, rear: 2, left: 2, right: 2 },
          flatsPerFloor: 1,
          unitMix: [{ unitType, count: 1 }],
          commonCoreConfig: coreConfig,
          rulesProfile,
        });

        expect(schematic.units).toHaveLength(1);
        const sUnit = schematic.units[0]!;
        const classified = classifySchematicUnitRooms(sUnit);

        expect(classified.bedrooms).toBe(expected.bedrooms);
        expect(classified.bathrooms).toBe(expected.bathrooms);
        expect(classified.livingRooms).toBe(expected.livingRooms);
        expect(classified.diningRooms).toBe(expected.diningRooms);
        expect(classified.kitchens).toBe(expected.kitchens);
        expect(classified.utilities).toBe(expected.utilities);
        expect(classified.balconies).toBe(expected.balconies);

        const check = validateSchematicMatchesManifest(schematic, manifest);
        expect(check.matches).toBe(true);
        expect(check.discrepancies).toEqual([]);
      });
    }
  });

  describe('2. Negative Tests — Deliberate Room Removal (Shortfall)', () => {
    function createSchematicAndManifest(unitType: ApartmentUnitType) {
      const manifest = buildApartmentGenerationManifest({
        site,
        apartmentConfig: createBrief(unitType),
        rulesProfile,
      });

      const schematic = generateDeterministicApartmentSchematic({
        siteWidthM: 35,
        siteDepthM: 40,
        setbacksM: { front: 3, rear: 2, left: 2, right: 2 },
        flatsPerFloor: 1,
        unitMix: [{ unitType, count: 1 }],
        commonCoreConfig: coreConfig,
        rulesProfile,
      });

      return { manifest, schematic };
    }

    it('rejects Studio when bathroom is removed', () => {
      const { manifest, schematic } = createSchematicAndManifest('Studio');
      const alteredUnit = {
        ...schematic.units[0]!,
        rooms: schematic.units[0]!.rooms.filter(r => !r.type.includes('toilet')),
      };
      const alteredSchematic = { ...schematic, units: [alteredUnit] };

      const check = validateSchematicMatchesManifest(alteredSchematic, manifest);
      expect(check.matches).toBe(false);
      expect(check.discrepancies.some(d => d.includes('bathroom') && d.includes('manifest requires 1'))).toBe(true);
    });

    it('rejects Studio when living/sleeping suite is removed', () => {
      const { manifest, schematic } = createSchematicAndManifest('Studio');
      const alteredUnit = {
        ...schematic.units[0]!,
        rooms: schematic.units[0]!.rooms.filter(r => r.type !== 'living_dining'),
      };
      const alteredSchematic = { ...schematic, units: [alteredUnit] };

      const check = validateSchematicMatchesManifest(alteredSchematic, manifest);
      expect(check.matches).toBe(false);
      expect(check.discrepancies.some(d => d.includes('living room') && d.includes('manifest requires 1'))).toBe(true);
    });

    it('rejects Studio when balcony is removed', () => {
      const { manifest, schematic } = createSchematicAndManifest('Studio');
      const alteredUnit = {
        ...schematic.units[0]!,
        balconies: [],
      };
      const alteredSchematic = { ...schematic, units: [alteredUnit] };

      const check = validateSchematicMatchesManifest(alteredSchematic, manifest);
      expect(check.matches).toBe(false);
      expect(check.discrepancies.some(d => d.includes('balcony') && d.includes('manifest requires 1'))).toBe(true);
    });

    it('rejects 1BHK when bedroom is removed', () => {
      const { manifest, schematic } = createSchematicAndManifest('1BHK');
      const alteredUnit = {
        ...schematic.units[0]!,
        rooms: schematic.units[0]!.rooms.filter(r => r.type !== 'master_bedroom'),
      };
      const alteredSchematic = { ...schematic, units: [alteredUnit] };

      const check = validateSchematicMatchesManifest(alteredSchematic, manifest);
      expect(check.matches).toBe(false);
      expect(check.discrepancies.some(d => d.includes('bedroom') && d.includes('manifest requires 1'))).toBe(true);
    });

    it('rejects 1BHK when utility is removed', () => {
      const { manifest, schematic } = createSchematicAndManifest('1BHK');
      const alteredUnit = {
        ...schematic.units[0]!,
        rooms: schematic.units[0]!.rooms.filter(r => r.type !== 'utility'),
      };
      const alteredSchematic = { ...schematic, units: [alteredUnit] };

      const check = validateSchematicMatchesManifest(alteredSchematic, manifest);
      expect(check.matches).toBe(false);
      expect(check.discrepancies.some(d => d.includes('utility room') && d.includes('manifest requires 1'))).toBe(true);
    });

    it('rejects 2BHK when 1 bedroom is removed (1 of 2)', () => {
      const { manifest, schematic } = createSchematicAndManifest('2BHK');
      // Remove secondary bedroom, leaving master bedroom
      const alteredUnit = {
        ...schematic.units[0]!,
        rooms: schematic.units[0]!.rooms.filter(r => r.type !== 'bedroom'),
      };
      const alteredSchematic = { ...schematic, units: [alteredUnit] };

      const check = validateSchematicMatchesManifest(alteredSchematic, manifest);
      expect(check.matches).toBe(false);
      expect(check.discrepancies.some(d => d.includes('has 1 bedroom(s); manifest requires 2'))).toBe(true);
    });

    it('rejects 3BHK when 1 bathroom is removed (2 of 3)', () => {
      const { manifest, schematic } = createSchematicAndManifest('3BHK');
      let removedOne = false;
      const alteredRooms = schematic.units[0]!.rooms.filter(r => {
        if (!removedOne && (r.type.includes('toilet') || r.type === 'master_toilet')) {
          removedOne = true;
          return false;
        }
        return true;
      });
      const alteredSchematic = { ...schematic, units: [{ ...schematic.units[0]!, rooms: alteredRooms }] };

      const check = validateSchematicMatchesManifest(alteredSchematic, manifest);
      expect(check.matches).toBe(false);
      expect(check.discrepancies.some(d => d.includes('has 2 bathroom(s); manifest requires 3'))).toBe(true);
    });
  });

  describe('3. Negative Tests — Deliberate Extra Rooms (Excess)', () => {
    function createSchematicAndManifest(unitType: ApartmentUnitType) {
      const manifest = buildApartmentGenerationManifest({
        site,
        apartmentConfig: createBrief(unitType),
        rulesProfile,
      });

      const schematic = generateDeterministicApartmentSchematic({
        siteWidthM: 35,
        siteDepthM: 40,
        setbacksM: { front: 3, rear: 2, left: 2, right: 2 },
        flatsPerFloor: 1,
        unitMix: [{ unitType, count: 1 }],
        commonCoreConfig: coreConfig,
        rulesProfile,
      });

      return { manifest, schematic };
    }

    const dummyBounds = { x: 0, y: 0, width: 3, height: 3 };

    it('rejects Studio when a separate bedroom is added (0 required, got 1)', () => {
      const { manifest, schematic } = createSchematicAndManifest('Studio');
      const extraBedroom: SchematicRoomItem = {
        id: 'flat_01_extra_bed',
        name: 'Extra Bedroom',
        type: 'bedroom',
        bounds: dummyBounds,
        areaSqM: 10,
      };
      const alteredUnit = {
        ...schematic.units[0]!,
        rooms: [...schematic.units[0]!.rooms, extraBedroom],
      };
      const alteredSchematic = { ...schematic, units: [alteredUnit] };

      const check = validateSchematicMatchesManifest(alteredSchematic, manifest);
      expect(check.matches).toBe(false);
      expect(check.discrepancies.some(d => d.includes('has 1 bedroom(s); manifest requires 0'))).toBe(true);
    });

    it('rejects Studio when an explicit dining room is added (0 required, got 1)', () => {
      const { manifest, schematic } = createSchematicAndManifest('Studio');
      const extraDining: SchematicRoomItem = {
        id: 'flat_01_extra_dining',
        name: 'Dining Room',
        type: 'dining',
        bounds: dummyBounds,
        areaSqM: 8,
      };
      const alteredUnit = {
        ...schematic.units[0]!,
        rooms: [...schematic.units[0]!.rooms, extraDining],
      };
      const alteredSchematic = { ...schematic, units: [alteredUnit] };

      const check = validateSchematicMatchesManifest(alteredSchematic, manifest);
      expect(check.matches).toBe(false);
      expect(check.discrepancies.some(d => d.includes('has 1 dining area(s); manifest requires 0'))).toBe(true);
    });

    it('rejects Studio when a utility room is added (0 required, got 1)', () => {
      const { manifest, schematic } = createSchematicAndManifest('Studio');
      const extraUtility: SchematicRoomItem = {
        id: 'flat_01_extra_util',
        name: 'Utility Room',
        type: 'utility',
        bounds: dummyBounds,
        areaSqM: 3,
      };
      const alteredUnit = {
        ...schematic.units[0]!,
        rooms: [...schematic.units[0]!.rooms, extraUtility],
      };
      const alteredSchematic = { ...schematic, units: [alteredUnit] };

      const check = validateSchematicMatchesManifest(alteredSchematic, manifest);
      expect(check.matches).toBe(false);
      expect(check.discrepancies.some(d => d.includes('has 1 utility room(s); manifest requires 0'))).toBe(true);
    });

    it('rejects 1BHK when an extra bedroom is added (1 required, got 2)', () => {
      const { manifest, schematic } = createSchematicAndManifest('1BHK');
      const extraBed: SchematicRoomItem = {
        id: 'flat_01_extra_bed',
        name: 'Second Bedroom',
        type: 'bedroom',
        bounds: dummyBounds,
        areaSqM: 10,
      };
      const alteredUnit = {
        ...schematic.units[0]!,
        rooms: [...schematic.units[0]!.rooms, extraBed],
      };
      const alteredSchematic = { ...schematic, units: [alteredUnit] };

      const check = validateSchematicMatchesManifest(alteredSchematic, manifest);
      expect(check.matches).toBe(false);
      expect(check.discrepancies.some(d => d.includes('has 2 bedroom(s); manifest requires 1'))).toBe(true);
    });

    it('rejects 2BHK when an extra bathroom is added (2 required, got 3)', () => {
      const { manifest, schematic } = createSchematicAndManifest('2BHK');
      const extraBath: SchematicRoomItem = {
        id: 'flat_01_extra_bath',
        name: 'Powder Room',
        type: 'powder_room',
        bounds: dummyBounds,
        areaSqM: 2.5,
      };
      const alteredUnit = {
        ...schematic.units[0]!,
        rooms: [...schematic.units[0]!.rooms, extraBath],
      };
      const alteredSchematic = { ...schematic, units: [alteredUnit] };

      const check = validateSchematicMatchesManifest(alteredSchematic, manifest);
      expect(check.matches).toBe(false);
      expect(check.discrepancies.some(d => d.includes('has 3 bathroom(s); manifest requires 2'))).toBe(true);
    });

    it('rejects 1BHK when an extra separate dining room is added on top of living_dining (1 required, got 2)', () => {
      const { manifest, schematic } = createSchematicAndManifest('1BHK');
      const extraDining: SchematicRoomItem = {
        id: 'flat_01_extra_dining',
        name: 'Separate Dining Room',
        type: 'dining',
        bounds: dummyBounds,
        areaSqM: 8,
      };
      const alteredUnit = {
        ...schematic.units[0]!,
        rooms: [...schematic.units[0]!.rooms, extraDining],
      };
      const alteredSchematic = { ...schematic, units: [alteredUnit] };

      const check = validateSchematicMatchesManifest(alteredSchematic, manifest);
      expect(check.matches).toBe(false);
      expect(check.discrepancies.some(d => d.includes('has 2 dining area(s); manifest requires 1'))).toBe(true);
    });
  });

  describe('4. Studio Living/Sleeping Suite Dining Rule Semantics', () => {
    it('verifies Studio living_dining satisfies living room but NOT dining', () => {
      const manifest = buildApartmentGenerationManifest({
        site,
        apartmentConfig: createBrief('Studio'),
        rulesProfile,
      });

      const schematic = generateDeterministicApartmentSchematic({
        siteWidthM: 35,
        siteDepthM: 40,
        setbacksM: { front: 3, rear: 2, left: 2, right: 2 },
        flatsPerFloor: 1,
        unitMix: [{ unitType: 'Studio', count: 1 }],
        commonCoreConfig: coreConfig,
        rulesProfile,
      });

      const sUnit = schematic.units[0]!;
      const classified = classifySchematicUnitRooms(sUnit);

      // Studio has 1 living room, 0 separate bedrooms, 0 dining areas
      expect(classified.livingRooms).toBe(1);
      expect(classified.bedrooms).toBe(0);
      expect(classified.diningRooms).toBe(0);

      const check = validateSchematicMatchesManifest(schematic, manifest);
      expect(check.matches).toBe(true);
    });
  });
});
