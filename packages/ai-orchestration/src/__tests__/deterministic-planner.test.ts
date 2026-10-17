import { describe, expect, it } from 'vitest';
import {
  planDeterministicApartment,
  type DeterministicPlannerInput,
  type ApartmentLayoutStrategy,
} from '../index';
import { measureApartmentBuilding } from '@ai-floor-planner/planning-engine';

describe('Deterministic Architectural Planner — Core Invariants & Program', () => {
  const baseSite = {
    plotWidthMm: 45000,
    plotDepthMm: 50000,
    setbacksMm: { front: 4000, rear: 3000, left: 2500, right: 2500 },
    roadFacing: 'north',
    orientationDegrees: 0,
  };

  it('plans a 2-flat floor plate (1 × 2BHK, 1 × 3BHK) with authoritative geometry and canonical Building Model', () => {
    const input: DeterministicPlannerInput = {
      site: baseSite,
      flatsPerFloor: 2,
      unitMix: [
        { unitType: '2BHK', count: 1, carpetAreaSqFt: 750 },
        { unitType: '3BHK', count: 1, carpetAreaSqFt: 1100 },
      ],
      commonCore: {
        passengerLifts: 2,
        serviceLifts: 0,
        staircaseCount: 2,
        commonLobby: true,
      },
      strategy: 'balanced',
      seed: 42,
    };

    const output = planDeterministicApartment(input);

    expect(output.success).toBe(true);
    expect(output.status).toBe('SUCCESS');
    expect(output.reasonCodes).toHaveLength(0);

    // 1. Exact flat count and unit mix
    expect(output.schematic.flatCount).toBe(2);
    expect(output.schematic.units).toHaveLength(2);
    expect(output.schematic.units[0]!.unitType).toBe('2BHK');
    expect(output.schematic.units[1]!.unitType).toBe('3BHK');

    // 2. Exact 2BHK room program
    const unit2BHK = output.schematic.units[0]!;
    const rooms2BHK = [...unit2BHK.rooms, ...unit2BHK.balconies];
    const beds2BHK = rooms2BHK.filter(r => r.type === 'master_bedroom' || r.type === 'bedroom');
    const baths2BHK = rooms2BHK.filter(r => r.type === 'master_toilet' || r.type === 'common_toilet' || r.type === 'powder_room');
    const kitchen2BHK = rooms2BHK.find(r => r.type === 'kitchen');
    const livingDining2BHK = rooms2BHK.find(r => r.type === 'living_dining');
    const foyer2BHK = rooms2BHK.find(r => r.type === 'foyer');

    expect(beds2BHK).toHaveLength(2);
    expect(baths2BHK.length).toBeGreaterThanOrEqual(2);
    expect(kitchen2BHK).toBeDefined();
    expect(livingDining2BHK).toBeDefined();
    expect(foyer2BHK).toBeDefined();

    // 3. Exact 3BHK room program (must never be interpreted as 2-bedroom unit)
    const unit3BHK = output.schematic.units[1]!;
    const rooms3BHK = [...unit3BHK.rooms, ...unit3BHK.balconies];
    const beds3BHK = rooms3BHK.filter(r => r.type === 'master_bedroom' || r.type === 'bedroom');
    const baths3BHK = rooms3BHK.filter(r => r.type === 'master_toilet' || r.type === 'common_toilet' || r.type === 'powder_room');

    expect(beds3BHK).toHaveLength(3);
    expect(baths3BHK.length).toBeGreaterThanOrEqual(2);
    expect(unit3BHK.actualCarpetAreaSqM).toBeGreaterThan(unit2BHK.actualCarpetAreaSqM * 1.2);

    // 4. Common Core outside flats (never part of flat ownership)
    expect(output.schematic.core.lifts).toHaveLength(2);
    expect(output.schematic.core.stairs).toHaveLength(2);
    expect(output.schematic.core.lobby).toBeDefined();

    // 5. Canonical Building Model
    expect(output.canonicalBuilding).not.toBeNull();
    const measured = measureApartmentBuilding(output.canonicalBuilding!);
    expect(measured.flats).toBe(2);
    expect(measured.lifts).toBe(2);
    expect(measured.stairs).toBe(2);
    expect(measured.bedrooms).toBe(5); // 2 + 3

    // 6. Structural representation for high-res rendering
    expect(output.structuralRepresentation.outerBuildingWalls.length).toBeGreaterThan(0);
    expect(output.structuralRepresentation.flatBoundaries).toHaveLength(2);
    expect(output.structuralRepresentation.commonCore.lifts).toHaveLength(2);
    expect(output.structuralRepresentation.commonCore.stairs).toHaveLength(2);
    expect(output.structuralRepresentation.recommendedRenderResolutions.targetResolutionPx).toBe(2048);

    // 7. Diagnostics
    expect(output.diagnostics.status).toBe('SUCCESS');
    expect(output.diagnostics.flatCount.planned).toBe(2);
    expect(output.diagnostics.summaryText).toContain('STATUS: SUCCESS');
  });

  it('enforces deterministic reproducibility: same input + strategy + seed produces identical output', () => {
    const input: DeterministicPlannerInput = {
      site: baseSite,
      flatsPerFloor: 3,
      unitMix: [
        { unitType: '2BHK', count: 2, carpetAreaSqFt: 750 },
        { unitType: '3BHK', count: 1, carpetAreaSqFt: 1100 },
      ],
      strategy: 'daylight',
      seed: 12345,
    };

    const out1 = planDeterministicApartment(input);
    const out2 = planDeterministicApartment(input);

    expect(JSON.stringify(out1.schematic)).toBe(JSON.stringify(out2.schematic));
    expect(JSON.stringify(out1.structuralRepresentation)).toBe(JSON.stringify(out2.structuralRepresentation));
    expect(JSON.stringify(out1.diagnostics)).toBe(JSON.stringify(out2.diagnostics));
  });

  it('all four strategies produce valid but meaningfully distinct layouts for the same program', () => {
    const strategies: ApartmentLayoutStrategy[] = ['balanced', 'daylight', 'privacy', 'circulation'];
    const outputs = strategies.map(st =>
      planDeterministicApartment({
        site: baseSite,
        flatsPerFloor: 4,
        unitMix: [
          { unitType: '2BHK', count: 2, carpetAreaSqFt: 750 },
          { unitType: '3BHK', count: 2, carpetAreaSqFt: 1100 },
        ],
        strategy: st,
        seed: 42,
      }),
    );

    // All must succeed and pass hard validation
    outputs.forEach((out, i) => {
      expect(out.success, `Strategy ${strategies[i]} failed`).toBe(true);
      expect(out.status).toBe('SUCCESS');
      expect(out.schematic.flatCount).toBe(4);
    });

    // Signatures must be distinct
    const signatures = outputs.map(o =>
      JSON.stringify({
        units: o.schematic.units.map(u => u.bodyBounds),
        lifts: o.schematic.core.lifts.map(l => l.bounds),
        footprint: o.schematic.buildingFootprint,
      }),
    );

    expect(new Set(signatures).size).toBe(4);
  });
});

describe('Deterministic Architectural Planner — Flat Count Matrix (1 to 6 Flats)', () => {
  const matrix: Array<{
    flats: number;
    mix: Array<{ unitType: string; count: number; carpetAreaSqFt?: number }>;
    site: { plotWidthMm: number; plotDepthMm: number };
  }> = [
    {
      flats: 1,
      mix: [{ unitType: '3BHK', count: 1, carpetAreaSqFt: 1200 }],
      site: { plotWidthMm: 25000, plotDepthMm: 30000 },
    },
    {
      flats: 2,
      mix: [
        { unitType: '2BHK', count: 1, carpetAreaSqFt: 750 },
        { unitType: '3BHK', count: 1, carpetAreaSqFt: 1100 },
      ],
      site: { plotWidthMm: 45000, plotDepthMm: 45000 },
    },
    {
      flats: 3,
      mix: [
        { unitType: '2BHK', count: 2, carpetAreaSqFt: 750 },
        { unitType: '3BHK', count: 1, carpetAreaSqFt: 1100 },
      ],
      site: { plotWidthMm: 45000, plotDepthMm: 50000 },
    },
    {
      flats: 4,
      mix: [
        { unitType: '2BHK', count: 2, carpetAreaSqFt: 750 },
        { unitType: '3BHK', count: 2, carpetAreaSqFt: 1100 },
      ],
      site: { plotWidthMm: 45000, plotDepthMm: 50000 },
    },
    {
      flats: 5,
      mix: [
        { unitType: '2BHK', count: 3, carpetAreaSqFt: 750 },
        { unitType: '3BHK', count: 2, carpetAreaSqFt: 1050 },
      ],
      site: { plotWidthMm: 50000, plotDepthMm: 60000 },
    },
    {
      flats: 6,
      mix: [
        { unitType: '2BHK', count: 4, carpetAreaSqFt: 750 },
        { unitType: '3BHK', count: 2, carpetAreaSqFt: 1050 },
      ],
      site: { plotWidthMm: 50000, plotDepthMm: 65000 },
    },
  ];

  it.each(matrix)(
    'successfully plans and hard-validates $flats flat(s) per floor with exact program preservation',
    ({ flats, mix, site }) => {
      const out = planDeterministicApartment({
        site: {
          plotWidthMm: site.plotWidthMm,
          plotDepthMm: site.plotDepthMm,
          setbacksMm: { front: 3500, rear: 2500, left: 2500, right: 2500 },
        },
        flatsPerFloor: flats,
        unitMix: mix,
        commonCore: {
          passengerLifts: flats >= 4 ? 2 : 1,
          staircaseCount: flats >= 4 ? 2 : 1,
          commonLobby: true,
        },
        strategy: 'balanced',
        seed: 42,
      });

      expect(out.success).toBe(true);
      expect(out.status).toBe('SUCCESS');
      expect(out.schematic.flatCount).toBe(flats);
      expect(out.schematic.units).toHaveLength(flats);

      // Verify each flat has required rooms
      for (const u of out.schematic.units) {
        const expectedBeds = u.unitType === '3BHK' ? 3 : 2;
        const beds = [...u.rooms, ...u.balconies].filter(r => r.type === 'master_bedroom' || r.type === 'bedroom');
        expect(beds).toHaveLength(expectedBeds);

        // Every flat has an entrance door opening into the foyer
        expect(u.entranceDoorId).not.toBeNull();
        const entrance = out.schematic.doors.find(d => d.id === u.entranceDoorId);
        expect(entrance).toBeDefined();
        expect(entrance?.kind).toBe('flat_entrance');
      }

      // Canonical Building Model must be built and validated
      expect(out.canonicalBuilding).not.toBeNull();
      const measured = measureApartmentBuilding(out.canonicalBuilding!);
      expect(measured.flats).toBe(flats);
    },
  );
});

describe('Deterministic Architectural Planner — Adjacency, Zoning & Spatial Invariants', () => {
  const site = {
    plotWidthMm: 45000,
    plotDepthMm: 50000,
    setbacksMm: { front: 4000, rear: 3000, left: 3000, right: 3000 },
  };

  it('strictly satisfies canonical room adjacency relationships in every flat', () => {
    const out = planDeterministicApartment({
      site,
      flatsPerFloor: 2,
      unitMix: [
        { unitType: '2BHK', count: 1 },
        { unitType: '3BHK', count: 1 },
      ],
      strategy: 'balanced',
    });

    for (const unit of out.schematic.units) {
      const flatDoors = out.schematic.doors.filter(d => d.flatId === unit.flatId);
      const foyer = unit.rooms.find(r => r.type === 'foyer')!;
      const ld = unit.rooms.find(r => r.type === 'living_dining')!;
      const kitchen = unit.rooms.find(r => r.type === 'kitchen')!;
      const masterBed = unit.rooms.find(r => r.type === 'master_bedroom')!;
      const masterBath = unit.rooms.find(r => r.id.endsWith('_master_toilet'))!;

      // 1. Entrance opens to foyer
      const entrance = flatDoors.find(d => d.kind === 'flat_entrance')!;
      expect(entrance.connects).toContain(foyer.id);

      // 2. Foyer opens to living/dining
      expect(flatDoors.some(d => d.connects.includes(foyer.id) && d.connects.includes(ld.id))).toBe(true);

      // 3. Kitchen connects to dining / living
      expect(flatDoors.some(d => d.connects.includes(ld.id) && d.connects.includes(kitchen.id))).toBe(true);

      // 4. Master bedroom connects directly to attached master toilet
      expect(flatDoors.some(d => d.connects.includes(masterBed.id) && d.connects.includes(masterBath.id))).toBe(true);
    }
  });

  it('ensures daylight priority: living/dining and bedrooms are placed on external facades', () => {
    const out = planDeterministicApartment({
      site,
      flatsPerFloor: 2,
      unitMix: [
        { unitType: '2BHK', count: 1 },
        { unitType: '3BHK', count: 1 },
      ],
      strategy: 'daylight',
    });

    for (const unit of out.schematic.units) {
      const ld = unit.rooms.find(r => r.type === 'living_dining')!;
      const beds = unit.rooms.filter(r => r.type === 'master_bedroom' || r.type === 'bedroom');

      expect(ld.onFacade).toBe(true);
      for (const bed of beds) {
        expect(bed.onFacade).toBe(true);
      }
    }
  });

  it('ensures balcony ownership consistency: balconies project from habitable host rooms within flat ownership', () => {
    const out = planDeterministicApartment({
      site,
      flatsPerFloor: 2,
      unitMix: [
        { unitType: '2BHK', count: 1 },
        { unitType: '3BHK', count: 1 },
      ],
      strategy: 'balanced',
    });

    for (const unit of out.schematic.units) {
      for (const bal of unit.balconies) {
        expect(bal.hostRoomId).toBeDefined();
        // Host room must belong to this same flat
        const host = unit.rooms.find(r => r.id === bal.hostRoomId);
        expect(host).toBeDefined();
        expect(['living_dining', 'master_bedroom', 'bedroom']).toContain(host?.type);

        // Balcony door must connect host and balcony
        const balDoor = out.schematic.doors.find(
          d => d.kind === 'balcony' && d.connects.includes(bal.id) && d.connects.includes(host!.id),
        );
        expect(balDoor).toBeDefined();
      }
    }
  });
});

describe('Deterministic Architectural Planner — Feasibility Gate & Failure Codes', () => {
  it('returns FEASIBILITY_FAIL with reason codes when program cannot fit the buildable envelope (no silent shrink)', () => {
    const tinySite = {
      plotWidthMm: 12000, // 12m
      plotDepthMm: 15000, // 15m
      setbacksMm: { front: 3000, rear: 2000, left: 2000, right: 2000 },
    };

    const out = planDeterministicApartment({
      site: tinySite,
      flatsPerFloor: 4,
      unitMix: [
        { unitType: '3BHK', count: 4, carpetAreaSqFt: 1200 }, // 4 x 1200 = 4800 sq ft (~445 m²) on a ~56 m² envelope
      ],
      strategy: 'balanced',
    });

    expect(out.success).toBe(false);
    expect(out.status).toBe('FEASIBILITY_FAIL');
    expect(out.reasonCodes).toContain('PLANNER_FEASIBILITY_FAIL');
    expect(out.diagnostics.status).toBe('FEASIBILITY_FAIL');
    expect(out.canonicalBuilding).toBeNull();
  });
});

describe('Deterministic Architectural Planner — Image Regression Guard', () => {
  it('REGRESSION: plan contains complete kitchen, dining, bedroom, lift, stair and flat structure BEFORE any image model', () => {
    const out = planDeterministicApartment({
      site: {
        plotWidthMm: 40000,
        plotDepthMm: 45000,
        setbacksMm: { front: 4000, rear: 3000, left: 2500, right: 2500 },
      },
      flatsPerFloor: 2,
      unitMix: [
        { unitType: '2BHK', count: 1, carpetAreaSqFt: 750 },
        { unitType: '3BHK', count: 1, carpetAreaSqFt: 1100 },
      ],
      commonCore: {
        passengerLifts: 2,
        serviceLifts: 0,
        staircaseCount: 2,
        commonLobby: true,
      },
      strategy: 'balanced',
      seed: 42,
    });

    // The plan is 100% authoritative and complete BEFORE any image generation is invoked
    expect(out.success).toBe(true);

    // Flat count is exact
    expect(out.schematic.flatCount).toBe(2);

    // Core is exact
    expect(out.schematic.core.lifts).toHaveLength(2);
    expect(out.schematic.core.stairs).toHaveLength(2);
    expect(out.schematic.core.lobby.label).toBe('COMMON LOBBY');

    // Total rooms inventory
    expect(out.manifest.roomTotals.bedrooms).toBe(5); // 2 + 3
    expect(out.manifest.roomTotals.kitchens).toBe(2);
    expect(out.manifest.roomTotals.livingRooms).toBe(2);
    expect(out.manifest.roomTotals.diningRooms).toBe(2);

    // Each flat has explicit semantic identities for every space
    for (const unit of out.schematic.units) {
      expect(unit.rooms.some(r => r.name.toLowerCase().includes('kitchen'))).toBe(true);
      expect(unit.rooms.some(r => r.name.toLowerCase().includes('living'))).toBe(true);
      expect(unit.rooms.some(r => r.name.toLowerCase().includes('bedroom'))).toBe(true);
      expect(unit.rooms.some(r => r.name.toLowerCase().includes('toilet') || r.name.toLowerCase().includes('bath'))).toBe(true);
    }

    // Structural output is generated without needing any AI image
    expect(out.structuralRepresentation.outerBuildingWalls.length).toBeGreaterThan(0);
    expect(out.structuralRepresentation.doors.length).toBeGreaterThan(0);
    expect(out.structuralRepresentation.flatBoundaries).toHaveLength(2);
  });
});
