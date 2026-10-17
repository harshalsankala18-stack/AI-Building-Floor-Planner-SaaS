/**
 * Tests for Stepped Orthogonal Polygon & Indian Apartment Geometry (Phase 1.1 & 1.2)
 */

import { describe, it, expect } from 'vitest';
import { buildSteppedPolygon, _shoelaceAreaSqM, _simplifyOrthogonal } from '../apartment/polygon-layout';
import { generateDeterministicApartmentSchematic } from '../apartment/schematic';
import { getApartmentRulesProfile } from '../apartment/jurisdiction';

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
