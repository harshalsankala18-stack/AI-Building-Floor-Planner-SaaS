import { describe, it, expect } from 'vitest';
import {
  planDeterministicApartment,
  type DeterministicPlannerInput,
} from '../index';
import { compileBuildingWithArchLang } from '../apartment/archlang-compiler';
import {
  type Building,
  RoomType,
  WallType,
  DoorType,
  WindowType,
  SwingDirection,
} from '@ai-floor-planner/core';

describe('ArchLang End-to-End Integration Test Suite — 8 Canonical Configurations', () => {
  const largeSite = {
    plotWidthMm: 70000,
    plotDepthMm: 70000,
    setbacksMm: { front: 5000, rear: 4000, left: 4000, right: 4000 },
    roadFacing: 'north',
    orientationDegrees: 0,
  };

  const mediumSite = {
    plotWidthMm: 50000,
    plotDepthMm: 50000,
    setbacksMm: { front: 4000, rear: 3000, left: 3000, right: 3000 },
    roadFacing: 'north',
    orientationDegrees: 0,
  };

  // ─── Fixture 1: One 2BHK apartment ──────────────────────────────────────────
  it('Fixture 1: generates and compiles one 2BHK apartment floor plan with 100% parity', async () => {
    const input: DeterministicPlannerInput = {
      site: mediumSite,
      flatsPerFloor: 1,
      unitMix: [{ unitType: '2BHK', count: 1, carpetAreaSqFt: 850 }],
      commonCore: { passengerLifts: 1, serviceLifts: 0, staircaseCount: 1, commonLobby: true },
      strategy: 'balanced',
      seed: 101,
    };

    const planned = planDeterministicApartment(input);
    expect(planned.success).toBe(true);
    expect(planned.canonicalBuilding).not.toBeNull();

    const result = await compileBuildingWithArchLang(planned.canonicalBuilding!, {
      generateDxf: true,
      generatePdf: false,
      generatePng: false,
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('ACCEPTED');
    expect(result.svg).toBeDefined();
    expect(result.svg).toContain('<svg');
    expect(result.parityReport?.passed).toBe(true);
    expect(result.parityReport?.flatParity.actualCount).toBe(1);
    expect(result.provenance?.exportStatus).toBe('ACCEPTED');
  });

  // ─── Fixture 2: One 3BHK apartment ──────────────────────────────────────────
  it('Fixture 2: generates and compiles one 3BHK apartment floor plan with 100% parity', async () => {
    const input: DeterministicPlannerInput = {
      site: mediumSite,
      flatsPerFloor: 1,
      unitMix: [{ unitType: '3BHK', count: 1, carpetAreaSqFt: 1250 }],
      commonCore: { passengerLifts: 1, serviceLifts: 0, staircaseCount: 1, commonLobby: true },
      strategy: 'daylight',
      seed: 202,
    };

    const planned = planDeterministicApartment(input);
    if (!planned.success) {
      console.log('Fixture 5 planner failed:', planned.status, planned.reasonCodes, planned.diagnostics?.summaryText);
    }
    expect(planned.success).toBe(true);
    expect(planned.canonicalBuilding).not.toBeNull();

    const result = await compileBuildingWithArchLang(planned.canonicalBuilding!, {
      generateDxf: true,
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('ACCEPTED');
    expect(result.svg).toBeDefined();
    expect(result.parityReport?.passed).toBe(true);
    expect(result.parityReport?.flatParity.actualCount).toBe(1);
  });

  // ─── Fixture 3: Two-flat floor with mixed 2BHK + 3BHK ───────────────────────
  it('Fixture 3: generates and compiles 2-flat floor with mixed 2BHK + 3BHK', async () => {
    const input: DeterministicPlannerInput = {
      site: mediumSite,
      flatsPerFloor: 2,
      unitMix: [
        { unitType: '2BHK', count: 1, carpetAreaSqFt: 750 },
        { unitType: '3BHK', count: 1, carpetAreaSqFt: 1100 },
      ],
      commonCore: { passengerLifts: 2, serviceLifts: 0, staircaseCount: 2, commonLobby: true },
      strategy: 'balanced',
      seed: 303,
    };

    const planned = planDeterministicApartment(input);
    if (!planned.success) {
      console.log('Fixture 5 planner failed:', planned.status, planned.reasonCodes, planned.diagnostics?.summaryText);
    }
    expect(planned.success).toBe(true);
    expect(planned.canonicalBuilding).not.toBeNull();

    const result = await compileBuildingWithArchLang(planned.canonicalBuilding!, {
      generateDxf: true,
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('ACCEPTED');
    expect(result.parityReport?.passed).toBe(true);
    expect(result.parityReport?.flatParity.actualCount).toBe(2);
    expect(result.parityReport?.metrics.ownershipIntegrity).toBe(true);
    expect(result.parityReport?.metrics.coreIsolation).toBe(true);
  });

  // ─── Fixture 4: Four-flat apartment floor with common core ─────────────────
  it('Fixture 4: generates and compiles 4-flat floor with common lobby, staircase and lift', async () => {
    const input: DeterministicPlannerInput = {
      site: largeSite,
      flatsPerFloor: 4,
      unitMix: [
        { unitType: '2BHK', count: 2, carpetAreaSqFt: 750 },
        { unitType: '3BHK', count: 2, carpetAreaSqFt: 1050 },
      ],
      commonCore: { passengerLifts: 2, serviceLifts: 0, staircaseCount: 2, commonLobby: true },
      strategy: 'balanced',
      seed: 404,
    };

    const planned = planDeterministicApartment(input);
    if (!planned.success) {
      console.log('Fixture 5 planner failed:', planned.status, planned.reasonCodes, planned.diagnostics?.summaryText);
    }
    expect(planned.success).toBe(true);
    expect(planned.canonicalBuilding).not.toBeNull();

    const result = await compileBuildingWithArchLang(planned.canonicalBuilding!, {
      generateDxf: true,
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('ACCEPTED');
    expect(result.parityReport?.passed).toBe(true);
    expect(result.parityReport?.flatParity.actualCount).toBe(4);
    expect(result.parityReport?.coreParity.liftsPassed).toBe(true);
    expect(result.parityReport?.coreParity.stairsPassed).toBe(true);
  });

  // ─── Fixture 5: Six-flat configuration ──────────────────────────────────────
  it('Fixture 5: generates and compiles 6-flat floor configuration where supported', async () => {
    const input: DeterministicPlannerInput = {
      site: {
        plotWidthMm: 90000,
        plotDepthMm: 90000,
        setbacksMm: { front: 6000, rear: 5000, left: 5000, right: 5000 },
        roadFacing: 'north',
        orientationDegrees: 0,
      },
      flatsPerFloor: 6,
      unitMix: [
        { unitType: '2BHK', count: 4, carpetAreaSqFt: 770 },
        { unitType: '3BHK', count: 2, carpetAreaSqFt: 950 },
      ],
      commonCore: { passengerLifts: 3, serviceLifts: 0, staircaseCount: 2, commonLobby: true },
      strategy: 'balanced',
      seed: 505,
    };

    const planned = planDeterministicApartment(input);
    expect(planned.success).toBe(true);
    expect(planned.canonicalBuilding).not.toBeNull();

    const result = await compileBuildingWithArchLang(planned.canonicalBuilding!);
    expect(result.success).toBe(true);
    expect(result.status).toBe('ACCEPTED');
    expect(result.parityReport?.passed).toBe(true);
    expect(result.parityReport?.flatParity.actualCount).toBe(6);
  });

  // ─── Fixture 6: Multi-storey apartment with vertically aligned circulation ──
  it('Fixture 6: compiles multi-storey apartment where stairs and lift shafts align across levels', async () => {
    const input: DeterministicPlannerInput = {
      site: mediumSite,
      flatsPerFloor: 2,
      unitMix: [{ unitType: '2BHK', count: 2, carpetAreaSqFt: 750 }],
      commonCore: { passengerLifts: 1, serviceLifts: 0, staircaseCount: 1, commonLobby: true },
      strategy: 'balanced',
      seed: 606,
    };

    const planned = planDeterministicApartment(input);
    expect(planned.success).toBe(true);
    const groundFloor = planned.canonicalBuilding!.floors[0]!;

    // Create a 2-storey building with vertically aligned circulation
    const multiStoreyBuilding: Building = {
      ...planned.canonicalBuilding!,
      floors: [
        groundFloor,
        {
          ...groundFloor,
          id: `${groundFloor.id}_lvl1`,
          buildingId: groundFloor.buildingId,
          level: 1,
          name: 'First Floor',
          rooms: groundFloor.rooms.map(r => ({
            ...r,
            id: `${r.id}_l1`,
            floorId: `${groundFloor.id}_lvl1`,
            tags: (r.tags ?? []).map(t => (t.startsWith('flat:') ? `${t}_l1` : t)),
          })),
          walls: groundFloor.walls.map(w => ({ ...w, id: `${w.id}_l1`, floorId: `${groundFloor.id}_lvl1` })),
          doors: groundFloor.doors.map(d => ({ ...d, id: `${d.id}_l1`, floorId: `${groundFloor.id}_lvl1`, wallId: d.wallId ? `${d.wallId}_l1` : d.wallId })),
          windows: groundFloor.windows.map(w => ({ ...w, id: `${w.id}_l1`, floorId: `${groundFloor.id}_lvl1`, wallId: w.wallId ? `${w.wallId}_l1` : w.wallId })),
          stairs: groundFloor.stairs.map(s => ({ ...s, id: `${s.id}_l1`, floorId: `${groundFloor.id}_lvl1` })),
        },
      ],
    };

    const result = await compileBuildingWithArchLang(multiStoreyBuilding);
    expect(result.success).toBe(true);
    expect(result.status).toBe('ACCEPTED');
    expect(result.pages).toHaveLength(2);
    expect(result.pages![0]!.level).toBe(0);
    expect(result.pages![1]!.level).toBe(1);
    expect(result.parityReport?.passed).toBe(true);
  });

  // ─── Fixture 7: Intentionally infeasible building request ────────────────────
  it('Fixture 7: rejects intentionally infeasible building request and publishes no broken output', async () => {
    // A plot of 10m x 10m with 4m setbacks leaves a 2m x 2m buildable envelope
    // Requesting 6 large 3BHK flats is physically impossible
    const infeasibleInput: DeterministicPlannerInput = {
      site: {
        plotWidthMm: 10000,
        plotDepthMm: 10000,
        setbacksMm: { front: 4000, rear: 4000, left: 4000, right: 4000 },
        roadFacing: 'north',
        orientationDegrees: 0,
      },
      flatsPerFloor: 6,
      unitMix: [{ unitType: '3BHK', count: 6, carpetAreaSqFt: 1500 }],
      commonCore: { passengerLifts: 2, serviceLifts: 0, staircaseCount: 2, commonLobby: true },
      strategy: 'balanced',
      seed: 707,
    };

    const planned = planDeterministicApartment(infeasibleInput);
    // Deterministic planner preflight must catch this
    expect(planned.success).toBe(false);
    expect(planned.status).toBe('FEASIBILITY_FAIL');
    expect(planned.canonicalBuilding).toBeNull();

    // Now test corrupted building model rejection in the ArchLang compiler
    const corruptedBuilding: Building = {
      id: 'corrupted-b',
      name: 'Corrupted Infeasible Building',
      site: {
        id: 's-bad',
        plotWidth: 5000,
        plotDepth: 5000,
        orientation: 0,
        setbacks: { front: 0, rear: 0, left: 0, right: 0 },
        plotBoundary: { points: [] },
        plotArea: 25000000,
        plotShape: 'rectangular',
        accessPoints: [],
        roadFacing: 'north',
      },
      floors: [
        {
          id: 'f-bad',
          level: 0,
          name: 'Ground',
          boundary: { points: [] },
          rooms: [
            {
              id: 'r-bad-1',
              floorId: 'f-bad',
              name: 'Living',
              type: RoomType.Living,
              x: 0,
              y: 0,
              width: 4000,
              height: 4000,
              area: 16000000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['flat:A'],
            },
          ],
          walls: [
            // Wall with missing endpoint / corrupted geometry
            {
              id: 'w-corrupt',
              floorId: 'f-bad',
              startPoint: { x: NaN, y: NaN },
              endPoint: { x: NaN, y: NaN },
              thickness: 200,
              type: WallType.External,
              roomIds: [],
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
      metadata: {},
    } as unknown as Building;

    const compileResult = await compileBuildingWithArchLang(corruptedBuilding);
    // Compiler must reject corrupted geometry
    expect(compileResult.success).toBe(false);
    expect(compileResult.status).toBe('REJECTED');
    expect(compileResult.diagnostics.some(d => d.severity === 'error')).toBe(true);
  });

  // ─── Fixture 8: Plan containing every supported structural element ─────────
  it('Fixture 8: compiles plan containing every supported structural element (walls, rooms, doors, windows, stairs, lifts, columns, balconies, shafts/voids)', async () => {
    const comprehensiveBuilding: Building = {
      id: 'b-comprehensive',
      name: 'Full Structural Elements Building',
      site: {
        id: 's-comp',
        plotWidth: 30000,
        plotDepth: 30000,
        orientation: 0,
        setbacks: { front: 3000, rear: 3000, left: 3000, right: 3000 },
        plotBoundary: { points: [{ x: 0, y: 0 }, { x: 30000, y: 0 }, { x: 30000, y: 30000 }, { x: 0, y: 30000 }] },
        plotArea: 900000000,
        plotShape: 'rectangular',
        accessPoints: [],
        roadFacing: 'north',
      },
      floors: [
        {
          id: 'f-comp-0',
          level: 0,
          name: 'Ground Floor',
          boundary: { points: [{ x: 0, y: 0 }, { x: 16000, y: 0 }, { x: 16000, y: 12000 }, { x: 0, y: 12000 }] },
          rooms: [
            // Common Core: lobby, stair, lift, service shaft
            {
              id: 'r-lobby',
              floorId: 'f-comp-0',
              name: 'Common Lobby',
              type: RoomType.Corridor,
              x: 6000,
              y: 0,
              width: 4000,
              height: 4000,
              area: 16000000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['core:lobby'],
            },
            {
              id: 'r-stair',
              floorId: 'f-comp-0',
              name: 'Fire Staircase',
              type: RoomType.Staircase,
              x: 6000,
              y: 4000,
              width: 2400,
              height: 3000,
              area: 7200000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['core:stair'],
            },
            {
              id: 'r-lift',
              floorId: 'f-comp-0',
              name: 'Passenger Lift',
              type: RoomType.Lift,
              x: 8400,
              y: 4000,
              width: 1600,
              height: 3000,
              area: 4800000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['core:lift'],
            },
            {
              id: 'r-shaft',
              floorId: 'f-comp-0',
              name: 'MEP Service Shaft',
              type: RoomType.ServiceShaft,
              x: 6000,
              y: 7000,
              width: 1200,
              height: 1200,
              area: 1440000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['core:shaft'],
            },
            // Flat A (2BHK)
            {
              id: 'r-fa-living',
              floorId: 'f-comp-0',
              name: 'Flat A Living',
              type: RoomType.Living,
              x: 0,
              y: 0,
              width: 6000,
              height: 4000,
              area: 24000000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['flat:A', 'unit-type:2BHK', 'living'],
            },
            {
              id: 'r-fa-bed1',
              floorId: 'f-comp-0',
              name: 'Flat A Bed 1',
              type: RoomType.Bedroom,
              x: 0,
              y: 4000,
              width: 6000,
              height: 4000,
              area: 24000000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['flat:A', 'unit-type:2BHK', 'bedroom'],
            },
            {
              id: 'r-fa-bed2',
              floorId: 'f-comp-0',
              name: 'Flat A Bed 2',
              type: RoomType.Bedroom,
              x: 0,
              y: 8000,
              width: 6000,
              height: 4000,
              area: 24000000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['flat:A', 'unit-type:2BHK', 'bedroom'],
            },
            // Balcony in Flat A
            {
              id: 'r-fa-balcony',
              floorId: 'f-comp-0',
              name: 'Flat A Living Balcony',
              type: RoomType.Balcony,
              x: 0,
              y: 12000,
              width: 6000,
              height: 1500,
              area: 9000000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['flat:A', 'balcony'],
            },
          ],
          walls: [
            {
              id: 'w-ext-north',
              floorId: 'f-comp-0',
              startPoint: { x: 0, y: 0 },
              endPoint: { x: 10000, y: 0 },
              thickness: 200,
              type: WallType.External,
              roomIds: [],
              hasOpening: false,
              loadBearing: true,
            },
            {
              id: 'w-ext-west',
              floorId: 'f-comp-0',
              startPoint: { x: 0, y: 0 },
              endPoint: { x: 0, y: 12000 },
              thickness: 200,
              type: WallType.External,
              roomIds: [],
              hasOpening: false,
              loadBearing: true,
            },
            {
              id: 'w-ext-south',
              floorId: 'f-comp-0',
              startPoint: { x: 0, y: 12000 },
              endPoint: { x: 10000, y: 12000 },
              thickness: 200,
              type: WallType.External,
              roomIds: [],
              hasOpening: false,
              loadBearing: true,
            },
            {
              id: 'w-ext-east',
              floorId: 'f-comp-0',
              startPoint: { x: 10000, y: 0 },
              endPoint: { x: 10000, y: 12000 },
              thickness: 200,
              type: WallType.External,
              roomIds: [],
              hasOpening: false,
              loadBearing: true,
            },
          ],
          doors: [
            {
              id: 'd-main',
              floorId: 'f-comp-0',
              wallId: 'w-ext-north',
              position: { x: 6000, y: 0 },
              width: 1000,
              direction: SwingDirection.Inward,
              hingeSide: 'left' as any,
              type: DoorType.Single,
              roomIds: ['r-fa-living', 'r-lobby'],
            },
          ],
          windows: [
            {
              id: 'win-west',
              floorId: 'f-comp-0',
              wallId: 'w-ext-west',
              position: { x: 0, y: 2000 },
              width: 1500,
              height: 1200,
              sillHeight: 900,
              type: WindowType.Casement,
              roomId: 'r-fa-living',
            },
          ],
          stairs: [],
          columns: [
            {
              id: 'col-1',
              floorId: 'f-comp-0',
              position: { x: 6000, y: 4000 },
              width: 300,
              depth: 300,
              dimensions: { width: 300, depth: 300 },
              gridIntersection: 'C-2',
            },
          ],
        },
      ],
      metadata: { projectId: 'comp-p' },
    } as unknown as Building;

    const result = await compileBuildingWithArchLang(comprehensiveBuilding, {
      generateDxf: true,
      generatePdf: true,
      generatePng: true,
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('ACCEPTED');
    expect(result.svg).toBeDefined();
    expect(result.dxf).toBeDefined();
    expect(result.pdf).toBeDefined();
    expect(result.png).toBeDefined();
    expect(result.parityReport?.passed).toBe(true);

    // Verify source contains representations for all elements
    expect(result.source).toContain('wall id=');
    expect(result.source).toContain('room id=');
    expect(result.source).toContain('door id=');
    expect(result.source).toContain('window id=');
    expect(result.source).toContain('stair id=');
    expect(result.source).toContain('elevator id=');
    expect(result.source).toContain('column id=');
    expect(result.source).toContain('outdoor id='); // balcony
    expect(result.source).toContain('void id='); // service shaft
  });
});
