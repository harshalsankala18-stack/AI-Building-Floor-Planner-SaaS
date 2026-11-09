import { describe, it, expect } from 'vitest';
import { validateGeometryParity } from '../apartment/archlang-parity-validator';
import { buildingModelToArchLangSource } from '../apartment/archlang-adapter';
import { Building, RoomType } from '@ai-floor-planner/core';
import { compile, describe as describeArchLang } from '@chanmeng666/archlang';

describe('ArchLang Hard Geometry-Parity Validator', () => {
  function createSampleBuilding(overrides: Partial<Building> = {}): Building {
    return {
      id: 'b-parity-1',
      name: 'Parity Test Building',
      site: {
        id: 's-1',
        plotWidth: 20000,
        plotDepth: 20000,
        orientation: 0,
        setbacks: { front: 3000, rear: 3000, left: 3000, right: 3000 },
        plotBoundary: { points: [{ x: 0, y: 0 }, { x: 20000, y: 0 }, { x: 20000, y: 20000 }, { x: 0, y: 20000 }] },
        plotArea: 400000000,
        plotShape: 'rectangular',
        accessPoints: [],
        roadFacing: 'north',
      },
      floors: [
        {
          id: 'f-0',
          level: 0,
          name: 'Ground Floor',
          boundary: { points: [{ x: 0, y: 0 }, { x: 12000, y: 0 }, { x: 12000, y: 10000 }, { x: 0, y: 10000 }] },
          rooms: [
            // Common Core
            {
              id: 'r-lobby',
              floorId: 'f-0',
              name: 'Common Lobby',
              type: RoomType.Corridor,
              x: 4000,
              y: 0,
              width: 4000,
              height: 3000,
              area: 12000000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['core:lobby'],
            },
            {
              id: 'r-stair',
              floorId: 'f-0',
              name: 'Staircase',
              type: RoomType.Staircase,
              x: 4000,
              y: 3000,
              width: 2500,
              height: 3000,
              area: 7500000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['core:stair'],
            },
            {
              id: 'r-lift',
              floorId: 'f-0',
              name: 'Lift Shaft',
              type: RoomType.Lift,
              x: 6500,
              y: 3000,
              width: 1500,
              height: 3000,
              area: 4500000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['core:lift'],
            },
            // Flat A (2BHK)
            {
              id: 'r-fa-living',
              floorId: 'f-0',
              name: 'Flat A Living',
              type: RoomType.Living,
              x: 0,
              y: 0,
              width: 4000,
              height: 4000,
              area: 16000000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['flat:A', 'unit-type:2BHK', 'living'],
            },
            {
              id: 'r-fa-bed1',
              floorId: 'f-0',
              name: 'Flat A Master Bed',
              type: RoomType.Bedroom,
              x: 0,
              y: 4000,
              width: 4000,
              height: 3000,
              area: 12000000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['flat:A', 'unit-type:2BHK', 'bedroom'],
            },
            {
              id: 'r-fa-bed2',
              floorId: 'f-0',
              name: 'Flat A Bed 2',
              type: RoomType.Bedroom,
              x: 0,
              y: 7000,
              width: 4000,
              height: 3000,
              area: 12000000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['flat:A', 'unit-type:2BHK', 'bedroom'],
            },
            // Flat B (2BHK)
            {
              id: 'r-fb-living',
              floorId: 'f-0',
              name: 'Flat B Living',
              type: RoomType.Living,
              x: 8000,
              y: 0,
              width: 4000,
              height: 4000,
              area: 16000000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['flat:B', 'unit-type:2BHK', 'living'],
            },
            {
              id: 'r-fb-bed1',
              floorId: 'f-0',
              name: 'Flat B Master Bed',
              type: RoomType.Bedroom,
              x: 8000,
              y: 4000,
              width: 4000,
              height: 3000,
              area: 12000000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['flat:B', 'unit-type:2BHK', 'bedroom'],
            },
            {
              id: 'r-fb-bed2',
              floorId: 'f-0',
              name: 'Flat B Bed 2',
              type: RoomType.Bedroom,
              x: 8000,
              y: 7000,
              width: 4000,
              height: 3000,
              area: 12000000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['flat:B', 'unit-type:2BHK', 'bedroom'],
            },
          ],
          walls: [
            {
              id: 'w-ext-north',
              floorId: 'f-0',
              startPoint: { x: 0, y: 0 },
              endPoint: { x: 12000, y: 0 },
              thickness: 200,
              type: 'external' as any,
              roomIds: [],
              hasOpening: false,
              loadBearing: true,
            },
            {
              id: 'w-ext-east',
              floorId: 'f-0',
              startPoint: { x: 12000, y: 0 },
              endPoint: { x: 12000, y: 10000 },
              thickness: 200,
              type: 'external' as any,
              roomIds: [],
              hasOpening: false,
              loadBearing: true,
            },
            {
              id: 'w-ext-south',
              floorId: 'f-0',
              startPoint: { x: 12000, y: 10000 },
              endPoint: { x: 0, y: 10000 },
              thickness: 200,
              type: 'external' as any,
              roomIds: [],
              hasOpening: false,
              loadBearing: true,
            },
            {
              id: 'w-ext-west',
              floorId: 'f-0',
              startPoint: { x: 0, y: 10000 },
              endPoint: { x: 0, y: 0 },
              thickness: 200,
              type: 'external' as any,
              roomIds: [],
              hasOpening: false,
              loadBearing: true,
            },
          ],
          doors: [
            {
              id: 'd-fa-main',
              floorId: 'f-0',
              wallId: 'w-ext-north',
              position: { x: 4000, y: 2000 },
              width: 1000,
              direction: 'inward' as any,
              hingeSide: 'left' as any,
              type: 'single' as any,
              roomIds: ['r-fa-living', 'r-lobby'],
            },
            {
              id: 'd-fb-main',
              floorId: 'f-0',
              wallId: 'w-ext-north',
              position: { x: 8000, y: 2000 },
              width: 1000,
              direction: 'inward' as any,
              hingeSide: 'left' as any,
              type: 'single' as any,
              roomIds: ['r-fb-living', 'r-lobby'],
            },
          ],
          windows: [
            {
              id: 'win-fa-1',
              floorId: 'f-0',
              wallId: 'w-ext-west',
              position: { x: 0, y: 2000 },
              width: 1500,
              height: 1200,
              sillHeight: 900,
              type: 'casement' as any,
              roomId: 'r-fa-living',
            },
            {
              id: 'win-fb-1',
              floorId: 'f-0',
              wallId: 'w-ext-east',
              position: { x: 12000, y: 2000 },
              width: 1500,
              height: 1200,
              sillHeight: 900,
              type: 'casement' as any,
              roomId: 'r-fb-living',
            },
          ],
          stairs: [],
          columns: [],
        },
      ],
      metadata: { projectId: 'test-p' },
      ...overrides,
    } as unknown as Building;
  }

  it('validates 100% parity on a well-formed 2-flat building', () => {
    const building = createSampleBuilding();
    const serialization = buildingModelToArchLangSource(building);
    expect(serialization.diagnostics.filter(d => d.severity === 'error')).toHaveLength(0);

    const compiled = compile(serialization.source);
    expect(compiled.errors).toHaveLength(0);

    const summary = describeArchLang(serialization.source);
    const report = validateGeometryParity(building, summary, serialization);

    expect(report.status).toBe('PASS');
    expect(report.metrics.flatCountParity).toBe(true);
    expect(report.metrics.apartmentMixParity).toBe(true);
    expect(report.metrics.roomProgrammeParity).toBe(true);
    expect(report.metrics.roomCountParity).toBe(true);
    expect(report.metrics.wallCountParity).toBe(true);
    expect(report.metrics.doorCountParity).toBe(true);
    expect(report.metrics.windowCountParity).toBe(true);
    expect(report.metrics.stairCountParity).toBe(true);
    expect(report.metrics.liftCountParity).toBe(true);
    expect(report.metrics.ownershipIntegrity).toBe(true);
    expect(report.metrics.coreIsolation).toBe(true);
    expect(report.metrics.coordinateAccuracy).toBe(true);
    expect(report.metrics.dimensionAccuracy).toBe(true);
    expect(report.summary.failedElements).toBe(0);
  });

  it('detects core room misassignment if a core element is assigned to a private flat', () => {
    const building = createSampleBuilding();
    const serialization = buildingModelToArchLangSource(building);

    compile(serialization.source);
    const summary = describeArchLang(serialization.source);

    // Find stair room id
    const stairArchId = serialization.elementIdMap.stairs.get('r-stair') ?? serialization.elementIdMap.rooms.get('r-stair') ?? 'stair_r_stair';

    // In summary.zones, add the stair room to flat a zone in both top-level and level-specific zones
    const flatZones = [
      ...(summary.zones ?? []).filter(z => z.id.includes('a') || z.id.includes('A')),
      ...(summary.levels?.flatMap(l => l.zones ?? []) ?? []).filter(z => z.id.includes('a') || z.id.includes('A')),
    ];
    for (const fz of flatZones) {
      (fz.rooms as string[]).push(stairArchId);
    }

    const report = validateGeometryParity(building, summary, serialization);
    expect(report.status).toBe('FAIL');
    expect(report.metrics.coreIsolation).toBe(false);
    expect(report.items.some(i => i.status === 'FAIL' && i.failureReason?.includes('Core room'))).toBe(true);
  });

  it('detects missing wall count discrepancy', () => {
    const building = createSampleBuilding();
    const serialization = buildingModelToArchLangSource(building);

    // Drop a wall from the serialization source to simulate missing wall
    const tamperedSource = serialization.source.replace(/wall id=w_[^\s]+ exterior[^\n]+/, '# removed wall');
    const tamperedSerialization = {
      ...serialization,
      source: tamperedSource,
    };

    const summary = describeArchLang(serialization.source);
    const report = validateGeometryParity(building, summary, tamperedSerialization);
    expect(report.status).toBe('FAIL');
    expect(report.metrics.wallCountParity).toBe(false);
  });

  it('detects room dimension discrepancy when coordinates or sizes deviate', () => {
    const building = createSampleBuilding();
    const serialization = buildingModelToArchLangSource(building);

    const summary = describeArchLang(serialization.source);

    // Tamper with room size in summary across top-level and level-specific rooms
    const allRooms = [
      ...summary.rooms,
      ...(summary.levels?.flatMap(l => l.rooms ?? []) ?? []),
    ];
    for (const r of allRooms) {
      r.bbox.w += 500; // 500mm deviation (> 2mm tolerance)
    }

    const report = validateGeometryParity(building, summary, serialization);
    expect(report.status).toBe('FAIL');
    expect(report.metrics.dimensionAccuracy).toBe(false);
    expect(report.items.some(i => i.status === 'FAIL' && i.failureReason?.includes('width mismatch'))).toBe(true);
  });
});
