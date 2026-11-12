import { describe, expect, it } from 'vitest';
import {
  type Building,
  createBuilding,
  RoomType,
  WallType,
  DoorType,
  SwingDirection,
} from '@ai-floor-planner/core';
import {
  StructuralCoordinationEngine,
  STRUCTURAL_COORDINATION_DISCLAIMER,
} from '../index';

describe('Phase 2.4 — Conceptual Structural Coordination Engine', () => {
  const engine = new StructuralCoordinationEngine();

  it('generates structural grid lines, columns, and beams with the required engineering disclaimer', () => {
    const building: Building = {
      ...createBuilding({
        projectId: 'struct-test-01',
        name: 'Structural Test Villa',
        site: {
          plotWidth: 12192,
          plotDepth: 18288,
          roadFacing: 'east' as any,
          setbacks: { front: 2134, rear: 1219, left: 1219, right: 1219 },
        },
      }),
      floors: [
        {
          id: 'fl-0',
          buildingId: 'struct-test-01',
          level: 0,
          name: 'Ground Floor',
          floorHeight: 3000,
          boundary: {
            points: [
              { x: 1219, y: 2134 },
              { x: 10973, y: 2134 },
              { x: 10973, y: 17069 },
              { x: 1219, y: 17069 },
            ],
          },
          rooms: [
            {
              id: 'room-living',
              floorId: 'fl-0',
              name: 'Living Room',
              type: RoomType.Living,
              x: 1219,
              y: 2134,
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
                  { x: 1219, y: 2134 },
                  { x: 6219, y: 2134 },
                  { x: 6219, y: 8134 },
                  { x: 1219, y: 8134 },
                ],
              },
            },
            {
              id: 'room-dining',
              floorId: 'fl-0',
              name: 'Dining Hall',
              type: RoomType.Dining,
              x: 6219,
              y: 2134,
              width: 4754,
              height: 6000,
              rotation: 0,
              area: 28524000,
              priority: 2,
              tags: [],
              adjacencyRequirements: [],
              daylightRequirement: 'medium' as any,
              privacyRequirement: 'medium' as any,
              ventilationRequired: true,
              isFixed: false,
              boundary: {
                points: [
                  { x: 6219, y: 2134 },
                  { x: 10973, y: 2134 },
                  { x: 10973, y: 8134 },
                  { x: 6219, y: 8134 },
                ],
              },
            },
          ],
          walls: [
            {
              id: 'w-front',
              floorId: 'fl-0',
              startPoint: { x: 1219, y: 2134 },
              endPoint: { x: 10973, y: 2134 },
              thickness: 230,
              type: WallType.External,
              roomIds: ['room-living', 'room-dining'],
              hasOpening: false,
              loadBearing: true,
            },
            {
              id: 'w-mid',
              floorId: 'fl-0',
              startPoint: { x: 6219, y: 2134 },
              endPoint: { x: 6219, y: 8134 },
              thickness: 115,
              type: WallType.Internal,
              roomIds: ['room-living', 'room-dining'],
              hasOpening: true,
              loadBearing: true,
            },
            {
              id: 'w-rear',
              floorId: 'fl-0',
              startPoint: { x: 1219, y: 8134 },
              endPoint: { x: 10973, y: 8134 },
              thickness: 230,
              type: WallType.Internal,
              roomIds: ['room-living', 'room-dining'],
              hasOpening: false,
              loadBearing: true,
            },
          ],
          doors: [
            {
              id: 'd-entry',
              floorId: 'fl-0',
              wallId: 'w-front',
              position: { x: 3000, y: 2134 },
              width: 1000,
              height: 2100,
              type: DoorType.Single,
              swingDirection: SwingDirection.Inward,
              connectsRooms: ['room-living', 'room-living'],
            },
          ],
          windows: [],
          stairs: [],
          columns: [],
        },
      ],
    };

    const result = engine.coordinateBuilding(building);

    // 1. Mandatory Disclaimer Verification
    expect(result.disclaimer).toBe(STRUCTURAL_COORDINATION_DISCLAIMER);
    expect(result.disclaimer).toContain('CONCEPTUAL STRUCTURAL COORDINATION — ENGINEER REVIEW REQUIRED');

    // 2. Structural Grid Lines
    expect(result.systems.length).toBe(1);
    const system = result.systems[0]!;
    expect(system.xGridLines.length).toBeGreaterThanOrEqual(2);
    expect(system.yGridLines.length).toBeGreaterThanOrEqual(2);
    expect(system.xGridLines[0]?.label).toBe('1');
    expect(system.yGridLines[0]?.label).toBe('A');

    // 3. Columns placement
    expect(system.columns.length).toBeGreaterThan(0);
    const firstCol = system.columns[0]!;
    expect(firstCol.width).toBe(230);
    expect(firstCol.depth).toBe(380);
    expect(firstCol.isStructural).toBe(true);
    expect(firstCol.gridReference).toBeDefined();

    // 4. Beams connection
    expect(system.beams.length).toBeGreaterThan(0);
    const firstBeam = system.beams[0]!;
    expect(firstBeam.spanMm).toBeGreaterThan(0);
    expect(firstBeam.widthMm).toBe(230);
    expect(firstBeam.depthMm).toBeGreaterThanOrEqual(350);

    // 5. Canonical Building Enrichment
    expect(result.building.floors[0]?.columns.length).toBe(system.columns.length);
  });

  it('enforces vertical column continuity across multiple floors (G+1)', () => {
    const building: Building = {
      ...createBuilding({
        projectId: 'struct-multi-floor',
        name: '2-Storey Villa',
        site: {
          plotWidth: 12192,
          plotDepth: 18288,
          roadFacing: 'north' as any,
          setbacks: { front: 2134, rear: 1219, left: 1219, right: 1219 },
        },
      }),
      floors: [
        {
          id: 'fl-0',
          buildingId: 'struct-multi-floor',
          level: 0,
          name: 'Ground Floor',
          floorHeight: 3000,
          boundary: {
            points: [
              { x: 1219, y: 2134 },
              { x: 10973, y: 2134 },
              { x: 10973, y: 17069 },
              { x: 1219, y: 17069 },
            ],
          },
          rooms: [
            {
              id: 'r0',
              floorId: 'fl-0',
              name: 'Living',
              type: RoomType.Living,
              x: 1219,
              y: 2134,
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
                  { x: 1219, y: 2134 },
                  { x: 6219, y: 2134 },
                  { x: 6219, y: 8134 },
                  { x: 1219, y: 8134 },
                ],
              },
            },
          ],
          walls: [
            {
              id: 'w0',
              floorId: 'fl-0',
              startPoint: { x: 1219, y: 2134 },
              endPoint: { x: 6219, y: 2134 },
              thickness: 230,
              type: WallType.External,
              roomIds: ['r0'],
              hasOpening: false,
              loadBearing: true,
            },
            {
              id: 'w1',
              floorId: 'fl-0',
              startPoint: { x: 1219, y: 2134 },
              endPoint: { x: 1219, y: 8134 },
              thickness: 230,
              type: WallType.External,
              roomIds: ['r0'],
              hasOpening: false,
              loadBearing: true,
            },
          ],
          doors: [],
          windows: [],
          stairs: [],
          columns: [],
        },
        {
          id: 'fl-1',
          buildingId: 'struct-multi-floor',
          level: 1,
          name: 'First Floor',
          floorHeight: 3000,
          boundary: {
            points: [
              { x: 1219, y: 2134 },
              { x: 10973, y: 2134 },
              { x: 10973, y: 17069 },
              { x: 1219, y: 17069 },
            ],
          },
          rooms: [
            {
              id: 'r1',
              floorId: 'fl-1',
              name: 'Master Bed',
              type: RoomType.Bedroom,
              x: 1219,
              y: 2134,
              width: 5000,
              height: 6000,
              rotation: 0,
              area: 30000000,
              priority: 1,
              tags: [],
              adjacencyRequirements: [],
              daylightRequirement: 'high' as any,
              privacyRequirement: 'high' as any,
              ventilationRequired: true,
              isFixed: false,
              boundary: {
                points: [
                  { x: 1219, y: 2134 },
                  { x: 6219, y: 2134 },
                  { x: 6219, y: 8134 },
                  { x: 1219, y: 8134 },
                ],
              },
            },
          ],
          walls: [
            {
              id: 'w2',
              floorId: 'fl-1',
              startPoint: { x: 1219, y: 2134 },
              endPoint: { x: 6219, y: 2134 },
              thickness: 230,
              type: WallType.External,
              roomIds: ['r1'],
              hasOpening: false,
              loadBearing: true,
            },
          ],
          doors: [],
          windows: [],
          stairs: [],
          columns: [],
        },
      ],
    };

    const result = engine.coordinateBuilding(building);
    expect(result.systems.length).toBe(2);

    const l0Cols = result.systems[0]!.columns;
    const l1Cols = result.systems[1]!.columns;

    expect(l0Cols.length).toBeGreaterThan(0);
    expect(l1Cols.length).toBeGreaterThan(0);

    // Verify vertical coordinate alignment between Level 0 and Level 1
    l1Cols.forEach(upCol => {
      const match = l0Cols.find(
        lowCol => Math.abs(lowCol.position.x - upCol.position.x) < 5 && Math.abs(lowCol.position.y - upCol.position.y) < 5
      );
      expect(match).toBeDefined();
    });
  });

  it('detects excessive spans (> 5.5m) and issues structural diagnostic warnings', () => {
    const building: Building = {
      ...createBuilding({
        projectId: 'struct-span-test',
        name: 'Large Span Hall',
        site: {
          plotWidth: 20000,
          plotDepth: 20000,
          roadFacing: 'north' as any,
          setbacks: { front: 2000, rear: 2000, left: 2000, right: 2000 },
        },
      }),
      floors: [
        {
          id: 'fl-0',
          buildingId: 'struct-span-test',
          level: 0,
          name: 'Ground Floor',
          floorHeight: 3000,
          boundary: {
            points: [
              { x: 2000, y: 2000 },
              { x: 18000, y: 2000 },
              { x: 18000, y: 18000 },
              { x: 2000, y: 18000 },
            ],
          },
          rooms: [
            {
              id: 'r-big',
              floorId: 'fl-0',
              name: 'Clear Span Hall',
              type: RoomType.Living,
              x: 2000,
              y: 2000,
              width: 6200,
              height: 4000,
              rotation: 0,
              area: 24800000,
              priority: 1,
              tags: [],
              adjacencyRequirements: [],
              daylightRequirement: 'high' as any,
              privacyRequirement: 'low' as any,
              ventilationRequired: true,
              isFixed: false,
              boundary: {
                points: [
                  { x: 2000, y: 2000 },
                  { x: 8200, y: 2000 },
                  { x: 8200, y: 6000 },
                  { x: 2000, y: 6000 },
                ],
              },
            },
          ],
          walls: [
            {
              id: 'w-long',
              floorId: 'fl-0',
              startPoint: { x: 2000, y: 2000 },
              endPoint: { x: 8200, y: 2000 },
              thickness: 230,
              type: WallType.External,
              roomIds: ['r-big'],
              hasOpening: false,
              loadBearing: true,
            },
          ],
          doors: [],
          windows: [],
          stairs: [],
          columns: [],
        },
      ],
    };

    const result = engine.coordinateBuilding(building);
    const system = result.systems[0]!;

    const hasSpanWarning = system.diagnostics.some(d => d.code === 'EXCESSIVE_SPAN');
    expect(hasSpanWarning).toBe(true);
  });
});
