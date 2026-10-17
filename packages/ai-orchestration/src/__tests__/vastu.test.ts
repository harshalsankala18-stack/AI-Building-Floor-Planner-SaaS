/**
 * Phase 3 Tests: The 16-Zone Angular Centroid "Flat Vastu" Engine & Live SVG Chakra Overlay
 */

import { describe, it, expect } from 'vitest';
import {
  computePolygonCentroid,
  classifyPointToVastuZone,
  compute16VastuZones,
  evaluateUnitVastu,
  renderVastuChakraSvgOverlay,
} from '../apartment/vastu';
import { generateDeterministicApartmentSchematic } from '../apartment/schematic';
import { getApartmentRulesProfile } from '../apartment/jurisdiction';

describe('Phase 3: 16-Zone Angular Centroid "Flat Vastu" Engine', () => {
  describe('Task 1: Shoelace Centroid Formula (computePolygonCentroid)', () => {
    it('accurately computes centroid for a simple rectangle', () => {
      const rect = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 6 },
        { x: 0, y: 6 },
      ];
      const centroid = computePolygonCentroid(rect);
      expect(centroid.x).toBeCloseTo(5, 4);
      expect(centroid.y).toBeCloseTo(3, 4);
    });

    it('computes true centroid of an L-shaped stepped orthogonal polygon (differs from bbox midpoint)', () => {
      // 8x8 box with 4x4 top-right quadrant missing:
      // Sub-rect 1: [0,4] x [0,8], area = 32, center = (2, 4)
      // Sub-rect 2: [4,8] x [0,4], area = 16, center = (6, 2)
      // True Center of Mass: Cx = (32*2 + 16*6)/48 = 160/48 = 3.333
      //                      Cy = (32*4 + 16*2)/48 = 160/48 = 3.333
      // Bounding box midpoint would be (4, 4), which is incorrect!
      const lShape = [
        { x: 0, y: 0 },
        { x: 8, y: 0 },
        { x: 8, y: 4 },
        { x: 4, y: 4 },
        { x: 4, y: 8 },
        { x: 0, y: 8 },
      ];

      const centroid = computePolygonCentroid(lShape);
      expect(centroid.x).toBeCloseTo(10 / 3, 3);
      expect(centroid.y).toBeCloseTo(10 / 3, 3);

      // Verify it is NOT the bounding box center (4, 4)
      expect(centroid.x).not.toBeCloseTo(4, 1);
      expect(centroid.y).not.toBeCloseTo(4, 1);
    });
  });

  describe('Task 2: 16 MahaVastu Angular Zones (22.5° Wedges)', () => {
    const center = { x: 50, y: 50 };

    it('classifies 16 directional zones with northAngleDeg = 0', () => {
      // In 2D floorplan space (Y-down):
      // North (0°) is -Y (Up)
      // East (90°) is +X (Right)
      // South (180°) is +Y (Down)
      // West (270°) is -X (Left)

      expect(classifyPointToVastuZone({ x: 50, y: 10 }, center, 0)).toBe('N');
      expect(classifyPointToVastuZone({ x: 75, y: 25 }, center, 0)).toBe('NE');
      expect(classifyPointToVastuZone({ x: 90, y: 50 }, center, 0)).toBe('E');
      expect(classifyPointToVastuZone({ x: 75, y: 75 }, center, 0)).toBe('SE');
      expect(classifyPointToVastuZone({ x: 50, y: 90 }, center, 0)).toBe('S');
      expect(classifyPointToVastuZone({ x: 25, y: 75 }, center, 0)).toBe('SW');
      expect(classifyPointToVastuZone({ x: 10, y: 50 }, center, 0)).toBe('W');
      expect(classifyPointToVastuZone({ x: 25, y: 25 }, center, 0)).toBe('NW');
    });

    it('accounts for site north rotation (northAngleDeg)', () => {
      // If road is East and site north is rotated 90° clockwise:
      // Screen Up (-Y) has geographic bearing = 270° (West)
      expect(classifyPointToVastuZone({ x: 50, y: 10 }, center, 90)).toBe('W');
      // Screen Right (+X) has geographic bearing = 0° (North)
      expect(classifyPointToVastuZone({ x: 90, y: 50 }, center, 90)).toBe('N');
    });

    it('generates 16 contiguous 22.5° wedges spanning full 360°', () => {
      const wedges = compute16VastuZones(center, 100, 0);
      expect(wedges.length).toBe(16);

      // Verify all 16 MahaVastu zone names are present
      const zoneNames = wedges.map(w => w.zone);
      expect(zoneNames).toContain('N');
      expect(zoneNames).toContain('NNE');
      expect(zoneNames).toContain('NE');
      expect(zoneNames).toContain('ENE');
      expect(zoneNames).toContain('E');
      expect(zoneNames).toContain('ESE');
      expect(zoneNames).toContain('SE');
      expect(zoneNames).toContain('SSE');
      expect(zoneNames).toContain('S');
      expect(zoneNames).toContain('SSW');
      expect(zoneNames).toContain('SW');
      expect(zoneNames).toContain('WSW');
      expect(zoneNames).toContain('W');
      expect(zoneNames).toContain('WNW');
      expect(zoneNames).toContain('NW');
      expect(zoneNames).toContain('NNW');

      // Verify each wedge is 22.5° wide
      for (const w of wedges) {
        const span = (w.endDeg - w.startDeg + 360) % 360;
        expect(span).toBeCloseTo(22.5, 2);
      }
    });
  });

  describe('Task 3: 0–100 Flat Vastu Scorecard & Hard Rejections', () => {
    it('flags hard defect and assigns 0 pts when toilet is in North-East (NE)', () => {
      const audit = evaluateUnitVastu({
        unitId: 'test_unit',
        unitCentroid: { x: 50, y: 50 },
        rooms: [
          {
            name: 'Master Toilet',
            roomType: 'toilet',
            center: { x: 80, y: 20 }, // NE in screen space with northAngle=0
            areaSqM: 4.5,
          },
          {
            name: 'Kitchen',
            roomType: 'kitchen',
            center: { x: 80, y: 80 }, // SE
            areaSqM: 8.0,
          },
        ],
        northAngleDeg: 0,
      });

      expect(audit.defects.length).toBeGreaterThan(0);
      expect(audit.defects.some(d => d.includes('Toilet in NE'))).toBe(true);
      const toiletAudit = audit.roomCompliance.find(r => r.roomType === 'toilet');
      expect(toiletAudit?.status).toBe('DEFECT');
      expect(toiletAudit?.score).toBe(0);
    });

    it('flags hard defect and assigns 0 pts when kitchen is in South-West (SW)', () => {
      const audit = evaluateUnitVastu({
        unitId: 'test_unit',
        unitCentroid: { x: 50, y: 50 },
        rooms: [
          {
            name: 'Kitchen',
            roomType: 'kitchen',
            center: { x: 20, y: 80 }, // SW in screen space with northAngle=0
            areaSqM: 8.0,
          },
          {
            name: 'Master Bedroom',
            roomType: 'master_bedroom',
            center: { x: 20, y: 80 }, // SW
            areaSqM: 14.0,
          },
        ],
        northAngleDeg: 0,
      });

      expect(audit.defects.length).toBeGreaterThan(0);
      expect(audit.defects.some(d => d.includes('Kitchen in SW'))).toBe(true);
      const kitchenAudit = audit.roomCompliance.find(r => r.roomType === 'kitchen');
      expect(kitchenAudit?.status).toBe('DEFECT');
      expect(kitchenAudit?.score).toBe(0);
    });

    it('scores an ideally-oriented Indian flat at 90+ out of 100 (Grade A+)', () => {
      const audit = evaluateUnitVastu({
        unitId: 'ideal_unit',
        unitCentroid: { x: 50, y: 50 },
        rooms: [
          { name: 'Kitchen', roomType: 'kitchen', center: { x: 80, y: 80 }, areaSqM: 8.0 }, // SE (25 pts)
          { name: 'Master Bedroom', roomType: 'master_bedroom', center: { x: 20, y: 80 }, areaSqM: 14.0 }, // SW (25 pts)
          { name: 'Toilet', roomType: 'toilet', center: { x: 20, y: 40 }, areaSqM: 4.5 }, // WNW (15 pts)
          { name: 'Puja Mandir', roomType: 'puja', center: { x: 80, y: 20 }, areaSqM: 2.0 }, // NE (10 pts)
          { name: 'Living Room', roomType: 'living', center: { x: 50, y: 20 }, areaSqM: 20.0 }, // N (15 pts)
          { name: 'Entrance Foyer', roomType: 'foyer', center: { x: 80, y: 30 }, areaSqM: 3.0 }, // Auspicious E/NE (10 pts)
        ],
        northAngleDeg: 0,
      });

      expect(audit.defects.length).toBe(0);
      expect(audit.overallScore).toBeGreaterThanOrEqual(90);
      expect(audit.grade).toBe('A+');
    });
  });

  describe('Task 4 & Candidate Integration: VASTU_OPTIMIZED strategy >= 85/100', () => {
    it('evaluates and attaches vastuReport to all units in apartment schematic', () => {
      const profile = getApartmentRulesProfile('mumbai_mcgm');
      const schematic = generateDeterministicApartmentSchematic({
        rulesProfile: profile,
        siteWidthM: 45,
        siteDepthM: 35,
        flatsPerFloor: 4,
        unitMix: [{ unitType: '2BHK', count: 4 }],
        strategy: 'VASTU_OPTIMIZED',
        northAngleDeg: 0,
        seed: 12345,
      });

      expect(schematic.units.length).toBeGreaterThan(0);
      expect(schematic.vastuReport).toBeDefined();
      expect(schematic.vastuReport!.centroid).toBeDefined();
      expect(schematic.vastuReport!.overallScore).toBeGreaterThanOrEqual(85);

      for (const unit of schematic.units) {
        expect(unit.vastuReport).toBeDefined();
        expect(unit.vastuReport!.centroid).toBeDefined();
        expect(unit.vastuReport!.overallScore).toBeGreaterThanOrEqual(85);
        expect(unit.vastuReport!.grade).toMatch(/A\+?/);
      }
    });

    it('renders 16-zone Vastu Chakra compass overlay with Brahmasthana marker and zone badges', () => {
      const center = { x: 100, y: 100 };
      const report = {
        unitId: 'unit-1',
        unitLabel: 'Flat 101',
        centroid: center,
        overallScore: 92,
        grade: 'A+' as const,
        defects: [],
        zones: compute16VastuZones(center, 12, 0),
        roomCompliance: [],
      };
      const svg = renderVastuChakraSvgOverlay(report);

      expect(svg).toContain('class="vastu-chakra-overlay"');
      expect(svg).toContain('class="brahmasthana-core"');
      expect(svg).toContain('class="vastu-radial-ray"');
      expect(svg).toContain('NE');
      expect(svg).toContain('SE');
      expect(svg).toContain('SW');
      expect(svg).toContain('NW');
    });
  });
});
