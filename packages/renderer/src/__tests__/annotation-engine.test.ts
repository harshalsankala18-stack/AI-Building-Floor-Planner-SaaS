import { describe, expect, it } from 'vitest';
import {
  type Floor,
  RoomType,
} from '@ai-floor-planner/core';
import { fitToView } from '../coordinate-transform';
import {
  AnnotationEngine,
  getAbbreviation,
} from '../annotation-engine';

describe('Phase 2.4 — Professional Intelligent Annotation Engine', () => {
  it('correctly maps room names to standard architectural abbreviations', () => {
    expect(getAbbreviation('Master Bedroom', RoomType.Bedroom)).toBe('MBR');
    expect(getAbbreviation('Attached Bathroom', RoomType.Bathroom)).toBe('BATH');
    expect(getAbbreviation('Common Toilet', RoomType.Bathroom)).toBe('TOILET');
    expect(getAbbreviation('Open to Sky Shaft', RoomType.OTS)).toBe('OTS');
    expect(getAbbreviation('Utility & Wet Kitchen', RoomType.Utility)).toBe('UTIL');
    expect(getAbbreviation('Pooja Room', RoomType.Pooja)).toBe('POOJA');
    expect(getAbbreviation('Front Verandah', RoomType.Porch)).toBe('PORCH');
    expect(getAbbreviation('Balcony', RoomType.Balcony)).toBe('BALC');
    expect(getAbbreviation('Domestic Staff', RoomType.ServantQuarter)).toBe('STAFF');
  });

  it('computes non-overlapping room labels with full hierarchy for large rooms', () => {
    const floor: Floor = {
      id: 'fl-test',
      buildingId: 'b-test',
      level: 0,
      name: 'Ground Floor',
      floorHeight: 3000,
      boundary: {
        points: [
          { x: 0, y: 0 },
          { x: 12000, y: 0 },
          { x: 12000, y: 15000 },
          { x: 0, y: 15000 },
        ],
      },
      rooms: [
        {
          id: 'r-liv',
          floorId: 'fl-test',
          name: 'Living Room',
          type: RoomType.Living,
          x: 1000,
          y: 1000,
          width: 5000,
          height: 6000,
          rotation: 0,
          area: 30000000,
          priority: 1,
          tags: [],
          adjacencyRequirements: [],
          daylightRequirement: 'high' as any,
          privacyRequirement: 'low' as any,
          ventilationRequired: true,
          isFixed: false,
          boundary: {
            points: [
              { x: 1000, y: 1000 },
              { x: 6000, y: 1000 },
              { x: 6000, y: 7000 },
              { x: 1000, y: 7000 },
            ],
          },
        },
      ],
      walls: [],
      doors: [],
      windows: [],
      stairs: [],
      columns: [],
    };

    const bounds = { minX: 0, minY: 0, maxX: 12000, maxY: 15000, width: 12000, height: 15000, x: 0, y: 0 };
    const transform = fitToView(bounds, 800, 600);
    const placements = AnnotationEngine.computeRoomLabels(floor, transform);

    expect(placements.length).toBe(1);
    const p = placements[0]!;
    expect(p.displayName).toBe('Living Room');
    expect(p.visibleLines.name).toBe(true);
    expect(p.visibleLines.dimensions).toBe(true);
    expect(p.visibleLines.area).toBe(true);
    expect(p.useLeaderLine).toBe(false);
  });

  it('automatically triggers leader line callouts for narrow or compact spaces (< 45px)', () => {
    const floor: Floor = {
      id: 'fl-test',
      buildingId: 'b-test',
      level: 0,
      name: 'Ground Floor',
      floorHeight: 3000,
      boundary: {
        points: [
          { x: 0, y: 0 },
          { x: 12000, y: 0 },
          { x: 12000, y: 15000 },
          { x: 0, y: 15000 },
        ],
      },
      rooms: [
        {
          id: 'r-ots',
          floorId: 'fl-test',
          name: 'OTS Shaft',
          type: RoomType.OTS,
          x: 6000,
          y: 2000,
          width: 600, // Very narrow: 600mm
          height: 1200,
          rotation: 0,
          area: 720000,
          priority: 5,
          tags: [],
          adjacencyRequirements: [],
          daylightRequirement: 'none' as any,
          privacyRequirement: 'low' as any,
          ventilationRequired: true,
          isFixed: false,
          boundary: {
            points: [
              { x: 6000, y: 2000 },
              { x: 6600, y: 2000 },
              { x: 6600, y: 3200 },
              { x: 6000, y: 3200 },
            ],
          },
        },
      ],
      walls: [],
      doors: [],
      windows: [],
      stairs: [],
      columns: [],
    };

    const bounds = { minX: 0, minY: 0, maxX: 12000, maxY: 15000, width: 12000, height: 15000, x: 0, y: 0 };
    const transform = fitToView(bounds, 800, 600);
    const placements = AnnotationEngine.computeRoomLabels(floor, transform);

    expect(placements.length).toBe(1);
    const p = placements[0]!;
    expect(p.useLeaderLine).toBe(true);
    expect(p.leaderPath).toBeDefined();
    expect(p.displayName).toBe('OTS');

    const svg = AnnotationEngine.renderLabelsSvg(placements);
    expect(svg).toContain('room-annotation-leader');
    expect(svg).toContain('polyline');
  });

  it('prevents collisions between adjacent small rooms by abbreviating and packing boxes', () => {
    const floor: Floor = {
      id: 'fl-test',
      buildingId: 'b-test',
      level: 0,
      name: 'Ground Floor',
      floorHeight: 3000,
      boundary: {
        points: [
          { x: 0, y: 0 },
          { x: 12000, y: 0 },
          { x: 12000, y: 15000 },
          { x: 0, y: 15000 },
        ],
      },
      rooms: [
        {
          id: 'r-bath1',
          floorId: 'fl-test',
          name: 'Attached Bathroom 1',
          type: RoomType.Bathroom,
          x: 4000,
          y: 4000,
          width: 1500,
          height: 1800,
          rotation: 0,
          area: 2700000,
          priority: 3,
          tags: [],
          adjacencyRequirements: [],
          daylightRequirement: 'low' as any,
          privacyRequirement: 'high' as any,
          ventilationRequired: true,
          isFixed: false,
          boundary: {
            points: [
              { x: 4000, y: 4000 },
              { x: 5500, y: 4000 },
              { x: 5500, y: 5800 },
              { x: 4000, y: 5800 },
            ],
          },
        },
        {
          id: 'r-bath2',
          floorId: 'fl-test',
          name: 'Attached Bathroom 2',
          type: RoomType.Bathroom,
          x: 5500,
          y: 4000,
          width: 1500,
          height: 1800,
          rotation: 0,
          area: 2700000,
          priority: 3,
          tags: [],
          adjacencyRequirements: [],
          daylightRequirement: 'low' as any,
          privacyRequirement: 'high' as any,
          ventilationRequired: true,
          isFixed: false,
          boundary: {
            points: [
              { x: 5500, y: 4000 },
              { x: 7000, y: 4000 },
              { x: 7000, y: 5800 },
              { x: 5500, y: 5800 },
            ],
          },
        },
      ],
      walls: [],
      doors: [],
      windows: [],
      stairs: [],
      columns: [],
    };

    const bounds = { minX: 0, minY: 0, maxX: 12000, maxY: 15000, width: 12000, height: 15000, x: 0, y: 0 };
    const transform = fitToView(bounds, 800, 600);
    const placements = AnnotationEngine.computeRoomLabels(floor, transform);

    expect(placements.length).toBe(2);
    const p1 = placements[0]!;
    const p2 = placements[1]!;

    // Check abbreviation
    expect(p1.displayName).toBe('BATH');
    expect(p2.displayName).toBe('BATH');

    // Check no box collision
    const b1 = p1.box;
    const b2 = p2.box;
    const collides = !(
      b1.maxX < b2.minX ||
      b1.minX > b2.maxX ||
      b1.maxY < b2.minY ||
      b1.minY > b2.maxY
    );
    expect(collides).toBe(false);
  });

  it('generates professional exterior building dimensions outside perimeter walls', () => {
    const floor: Floor = {
      id: 'fl-test',
      buildingId: 'b-test',
      level: 0,
      name: 'Ground Floor',
      floorHeight: 3000,
      boundary: {
        points: [
          { x: 1000, y: 2000 },
          { x: 10000, y: 2000 },
          { x: 10000, y: 14000 },
          { x: 1000, y: 14000 },
        ],
      },
      rooms: [
        {
          id: 'r1',
          floorId: 'fl-test',
          name: 'Hall',
          type: RoomType.Living,
          x: 1000,
          y: 2000,
          width: 9000,
          height: 12000,
          rotation: 0,
          area: 108000000,
          priority: 1,
          tags: [],
          adjacencyRequirements: [],
          daylightRequirement: 'high' as any,
          privacyRequirement: 'low' as any,
          ventilationRequired: true,
          isFixed: false,
          boundary: {
            points: [
              { x: 1000, y: 2000 },
              { x: 10000, y: 2000 },
              { x: 10000, y: 14000 },
              { x: 1000, y: 14000 },
            ],
          },
        },
      ],
      walls: [],
      doors: [],
      windows: [],
      stairs: [],
      columns: [],
    };

    const bounds = { minX: 0, minY: 0, maxX: 12000, maxY: 16000, width: 12000, height: 16000, x: 0, y: 0 };
    const transform = fitToView(bounds, 800, 600);
    const dimsSvg = AnnotationEngine.renderExteriorBuildingDimensions(floor, transform);

    expect(dimsSvg).toContain('building-ext-dim-width');
    expect(dimsSvg).toContain('building-ext-dim-depth');
    expect(dimsSvg).toContain('9.00m');
    expect(dimsSvg).toContain('12.00m');
  });

  it('renders structural grid lines with labeled bubbles A, B... and 1, 2...', () => {
    const floor: Floor = {
      id: 'fl-test',
      buildingId: 'b-test',
      level: 0,
      name: 'Ground Floor',
      floorHeight: 3000,
      boundary: { points: [] },
      rooms: [],
      walls: [],
      doors: [],
      windows: [],
      stairs: [],
      columns: [
        {
          id: 'col-1',
          floorId: 'fl-test',
          position: { x: 2000, y: 2000 },
          width: 230,
          depth: 380,
          shape: 'rectangular' as any,
          isStructural: true,
          gridReference: 'A-1',
        },
        {
          id: 'col-2',
          floorId: 'fl-test',
          position: { x: 7000, y: 2000 },
          width: 230,
          depth: 380,
          shape: 'rectangular' as any,
          isStructural: true,
          gridReference: 'A-2',
        },
        {
          id: 'col-3',
          floorId: 'fl-test',
          position: { x: 2000, y: 8000 },
          width: 230,
          depth: 380,
          shape: 'rectangular' as any,
          isStructural: true,
          gridReference: 'B-1',
        },
        {
          id: 'col-4',
          floorId: 'fl-test',
          position: { x: 7000, y: 8000 },
          width: 230,
          depth: 380,
          shape: 'rectangular' as any,
          isStructural: true,
          gridReference: 'B-2',
        },
      ],
    };

    const bounds = { minX: 0, minY: 0, maxX: 10000, maxY: 10000, width: 10000, height: 10000, x: 0, y: 0 };
    const transform = fitToView(bounds, 800, 600);
    const gridSvg = AnnotationEngine.renderStructuralGrid(floor, transform);

    expect(gridSvg).toContain('structural-grid-line-x');
    expect(gridSvg).toContain('structural-grid-line-y');
    expect(gridSvg).toContain('data-grid-index="1"');
    expect(gridSvg).toContain('data-grid-index="2"');
    expect(gridSvg).toContain('data-grid-index="A"');
    expect(gridSvg).toContain('data-grid-index="B"');
    expect(gridSvg).toContain('stroke-dasharray="6,4"');
  });
});
