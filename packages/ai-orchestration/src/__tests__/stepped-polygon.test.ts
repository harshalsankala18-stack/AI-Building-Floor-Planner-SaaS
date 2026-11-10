/**
 * Tests for Stepped Orthogonal Polygon & Indian Apartment Geometry (Phase 1.1 & 1.2)
 */

import { describe, it, expect } from 'vitest';
import { buildSteppedPolygon, _shoelaceAreaSqM, _simplifyOrthogonal } from '../apartment/polygon-layout';
import { generateDeterministicApartmentSchematic } from '../apartment/schematic';
import { getApartmentRulesProfile } from '../apartment/jurisdiction';
import {
  adaptSchematicToBuilding,
  schematicToApartmentStructure,
  validateAndConvertSteppedPolygon,
  apartmentExpectationFromManifest,
} from '../apartment/adapter';
import { buildApartmentGenerationManifest } from '../apartment/manifest';
import { validateCanonicalApartmentBuilding } from '@ai-floor-planner/planning-engine';

describe('SteppedUnitPolygon — Geometry & Facade Invariants (Phase 1.1)', () => {
  const bbox = { x: 5, y: 5, width: 10, height: 12 };

  it('produces a stepped orthogonal polygon with >= 6 vertices (never a plain rectangle)', () => {
    const stepped = buildSteppedPolygon({
      flatId: 'flat_01',
      flatLabel: 'Flat 01',
      bbox,
      corridorSide: 'W',
      targetCarpetAreaSqM: 70,
    });

    expect(stepped.vertices.length).toBeGreaterThanOrEqual(6);
    expect(stepped.polygon.points.length).toBeGreaterThanOrEqual(6);
  });

  it('excludes carved OTS shaft from net carpet area (Shoelace formula)', () => {
    const stepped = buildSteppedPolygon({
      flatId: 'flat_01',
      flatLabel: 'Flat 01',
      bbox,
      corridorSide: 'W',
      targetCarpetAreaSqM: 70,
    });

    expect(stepped.otsShafts.length).toBe(1);
    const ots = stepped.otsShafts[0]!;
    expect(ots.widthMm).toBe(1200);
    expect(ots.depthMm).toBe(1500);

    const otsAreaSqM = (ots.widthMm * ots.depthMm) / 1e6; // 1.8 sqm
    expect(stepped.netCarpetAreaSqM).toBeCloseTo(stepped.grossAreaSqM - otsAreaSqM, 2);
    expect(stepped.netCarpetAreaSqM).toBeLessThan(stepped.grossAreaSqM);
  });

  it('projects a sit-out balcony on an open facade (never on corridorSide or deadWalls)', () => {
    const stepped = buildSteppedPolygon({
      flatId: 'flat_01',
      flatLabel: 'Flat 01',
      bbox,
      corridorSide: 'W',
      targetCarpetAreaSqM: 70,
    });

    expect(stepped.balconies.length).toBe(1);
    const bal = stepped.balconies[0]!;
    expect(bal.depthMm).toBe(1500);
    expect(stepped.corridorSide).toBe('W');
    expect(stepped.deadWalls).toContain('W');
    expect(stepped.openFacades).toContain(bal.facade);
    expect(stepped.deadWalls).not.toContain(bal.facade);
  });

  it('simplifies orthogonal collinear vertices correctly', () => {
    // A 4-point rectangle with an extra collinear vertex on the top edge
    const collinearPts = [
      { x: 0, y: 0 },
      { x: 5, y: 0 }, // collinear with (0,0) and (10,0)
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    const simplified = _simplifyOrthogonal(collinearPts);
    expect(simplified.length).toBe(4);
  });

  it('calculates shoelace area accurately for orthogonal polygons', () => {
    // 10m x 10m square = 100 sqm
    const sq = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(_shoelaceAreaSqM(sq)).toBeCloseTo(100, 2);

    // L-shape: 10x10 with 4x4 cutout in top-right = 100 - 16 = 84 sqm
    const lShape = [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 4 },
      { x: 10, y: 4 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(_shoelaceAreaSqM(lShape)).toBeCloseTo(84, 2);
  });
});

describe('Schematic Integration — Stepped Polygon Units on Floor Plate (Phase 1.1)', () => {
  const profile = getApartmentRulesProfile('pune_pmc');

  it('generates 2BHK/3BHK units with stepped orthogonal polygons and OTS shafts in schematic', () => {
    const schematic = generateDeterministicApartmentSchematic({
      siteWidthM: 35,
      siteDepthM: 40,
      flatsPerFloor: 2,
      unitMix: [
        { unitType: '2BHK', count: 1, carpetAreaSqFt: 750 },
        { unitType: '3BHK', count: 1, carpetAreaSqFt: 1100 },
      ],
      rulesProfile: profile,
    });

    expect(schematic.units.length).toBe(2);
    for (const unit of schematic.units) {
      expect(unit.steppedPolygon).toBeDefined();
      expect(unit.steppedPolygon!.vertices.length).toBeGreaterThanOrEqual(6);
      expect(unit.steppedPolygon!.otsShafts.length).toBeGreaterThanOrEqual(1);
      expect(unit.steppedPolygon!.balconies.length).toBeGreaterThanOrEqual(1);
    }

    // SVG scaffold renders polygon points and OTS
    expect(schematic.svgScaffold).toContain('<polygon points=');
    expect(schematic.svgScaffold).toContain('OTS');
  });
});

describe('Stepped Polygon Adapter Integration & Fail-Closed Validation (Phase 2.2.2.1)', () => {
  const profile = getApartmentRulesProfile('pune_pmc');

  it('rejects a malformed/self-intersecting supplied stepped polygon through the actual adapter (fails closed)', () => {
    const schematic = generateDeterministicApartmentSchematic({
      siteWidthM: 35,
      siteDepthM: 40,
      flatsPerFloor: 1,
      unitMix: [{ unitType: '2BHK', count: 1, carpetAreaSqFt: 750 }],
      rulesProfile: profile,
    });

    // Artificially corrupt the unit's stepped polygon with self-intersecting / malformed geometry
    const unit = schematic.units[0]!;
    const corruptedUnit = {
      ...unit,
      steppedPolygon: {
        ...unit.steppedPolygon!,
        vertices: [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
          { x: 10, y: 0 },
          { x: 5, y: 5 },
          { x: 0, y: 0 },
        ],
      },
    };

    const validationResult = validateAndConvertSteppedPolygon(corruptedUnit, 50);
    expect(validationResult.status).toBe('INVALID_TOPOLOGY');

    const corruptedSchematic = {
      ...schematic,
      units: [corruptedUnit],
    };

    const building = adaptSchematicToBuilding(corruptedSchematic);
    const metaIssues = (building.metadata as any)?.steppedPolygonValidationIssues;
    expect(metaIssues).toBeDefined();
    expect(metaIssues.some((i: any) => i.code === 'STEPPED_POLYGON_INVALID')).toBe(true);

    // Canonical validation must fail closed
    const manifest = buildApartmentGenerationManifest({
      site: { plotWidthMm: 35000, plotDepthMm: 40000 },
      apartmentConfig: {
        projectType: 'apartment',
        jurisdiction: 'pune_pmc',
        floorCount: 1,
        flatsPerFloor: 1,
        unitMix: [{ unitType: '2BHK', count: 1, carpetAreaSqFt: 750 }],
        commonCore: { passengerLifts: 1, serviceLifts: 0, staircaseCount: 1, fireStaircaseRequired: false, commonLobby: true },
        parking: { residentParkingCount: 2, visitorParkingCount: 1 },
        amenities: { groundSiteAmenities: [], buildingAmenities: [] },
      },
    });
    const expectation = apartmentExpectationFromManifest(manifest);
    const result = validateCanonicalApartmentBuilding(building, expectation);
    expect(result.isValid).toBe(false);
    expect(result.verificationIssues.some(i => i.code === 'STEPPED_POLYGON_INVALID')).toBe(true);
  });

  it('supports an intentionally rectangular plan without stepped geometry', () => {
    const schematic = generateDeterministicApartmentSchematic({
      siteWidthM: 35,
      siteDepthM: 40,
      flatsPerFloor: 1,
      unitMix: [{ unitType: '2BHK', count: 1, carpetAreaSqFt: 750 }],
      rulesProfile: profile,
    });

    // Remove stepped polygon entirely to represent a genuine rectangular plan
    const unit = schematic.units[0]!;
    const rectangularUnit = {
      ...unit,
      steppedPolygon: undefined,
    };

    const validationResult = validateAndConvertSteppedPolygon(rectangularUnit, 50);
    expect(validationResult.status).toBe('RECTANGULAR');
    expect(validationResult.pointsMm).toBeNull();

    const rectangularSchematic = {
      ...schematic,
      units: [rectangularUnit],
    };

    const structure = schematicToApartmentStructure(rectangularSchematic);
    expect(structure.flats[0]!.boundary).toBeUndefined();

    const building = adaptSchematicToBuilding(rectangularSchematic);
    const storedBoundaries = (building.metadata as any)?.flatBoundaries;
    expect(storedBoundaries).toBeDefined();
    // Genuine rectangle preserved with 4 points
    expect(storedBoundaries[0].boundary.points).toHaveLength(4);
  });

  it('preserves cantilever balcony attachment on open facade without treating as interior encroachment', () => {
    const schematic = generateDeterministicApartmentSchematic({
      siteWidthM: 35,
      siteDepthM: 40,
      flatsPerFloor: 1,
      unitMix: [{ unitType: '2BHK', count: 1, carpetAreaSqFt: 750 }],
      rulesProfile: profile,
    });

    const unit = schematic.units[0]!;
    expect(unit.balconies.length).toBeGreaterThanOrEqual(1);

    const validationResult = validateAndConvertSteppedPolygon(unit, 50);
    expect(validationResult.status).toBe('VALID_STEPPED');

    const building = adaptSchematicToBuilding(schematic);
    const manifest = buildApartmentGenerationManifest({
      site: { plotWidthMm: 35000, plotDepthMm: 40000 },
      apartmentConfig: {
        projectType: 'apartment',
        jurisdiction: 'pune_pmc',
        floorCount: 1,
        flatsPerFloor: 1,
        unitMix: [{ unitType: '2BHK', count: 1, carpetAreaSqFt: 750 }],
        commonCore: { passengerLifts: 1, serviceLifts: 0, staircaseCount: 1, fireStaircaseRequired: false, commonLobby: true },
        parking: { residentParkingCount: 2, visitorParkingCount: 1 },
        amenities: { groundSiteAmenities: [], buildingAmenities: [] },
      },
    });
    const expectation = apartmentExpectationFromManifest(manifest);
    const result = validateCanonicalApartmentBuilding(building, expectation);
    expect(result.verificationIssues.some(i => i.code === 'CANONICAL_BALCONY_ATTACHMENT_INVALID')).toBe(false);
  });

  it('validates a complete production adapter-path from schematic generation to canonical building', () => {
    const schematic = generateDeterministicApartmentSchematic({
      siteWidthM: 35,
      siteDepthM: 40,
      flatsPerFloor: 2,
      unitMix: [
        { unitType: '2BHK', count: 1, carpetAreaSqFt: 750 },
        { unitType: '3BHK', count: 1, carpetAreaSqFt: 1100 },
      ],
      rulesProfile: profile,
    });

    const building = adaptSchematicToBuilding(schematic, {
      projectId: 'prod_test_p1',
      projectName: 'Production Adapter Path Test',
    });

    expect(building.floors).toHaveLength(1);
    expect(building.floors[0]!.rooms.length).toBeGreaterThan(0);
    expect(building.floors[0]!.walls.length).toBeGreaterThan(0);
    expect(building.floors[0]!.doors.length).toBeGreaterThan(0);
    expect(building.floors[0]!.windows.length).toBeGreaterThan(0);

    const flatBoundaries = (building.metadata as any)?.flatBoundaries;
    expect(flatBoundaries).toHaveLength(2);
    for (const fb of flatBoundaries) {
      expect(fb.boundary.points.length).toBeGreaterThanOrEqual(6);
    }

    const manifest = buildApartmentGenerationManifest({
      site: { plotWidthMm: 35000, plotDepthMm: 40000 },
      apartmentConfig: {
        projectType: 'apartment',
        jurisdiction: 'pune_pmc',
        floorCount: 1,
        flatsPerFloor: 2,
        unitMix: [
          { unitType: '2BHK', count: 1, carpetAreaSqFt: 750 },
          { unitType: '3BHK', count: 1, carpetAreaSqFt: 1100 },
        ],
        commonCore: { passengerLifts: 1, serviceLifts: 0, staircaseCount: 1, fireStaircaseRequired: false, commonLobby: true },
        parking: { residentParkingCount: 2, visitorParkingCount: 1 },
        amenities: { groundSiteAmenities: [], buildingAmenities: [] },
      },
    });
    const expectation = apartmentExpectationFromManifest(manifest);
    const result = validateCanonicalApartmentBuilding(building, expectation);
    expect(result.isValid).toBe(true);
    expect(result.verificationIssues.filter(i => i.severity === 'error')).toHaveLength(0);
  });
});
