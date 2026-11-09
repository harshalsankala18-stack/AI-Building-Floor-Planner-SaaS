import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import {
  compileBuildingWithArchLang,
  compileBuildingToArchLang,
  compileBuildingToDxf,
  lintApartmentCadGeometry,
} from '../apartment/archlang-compiler';
import { Building, RoomType, WallType } from '@ai-floor-planner/core';

describe('ArchLang Compiler', () => {
  const mockBuilding: Building = {
    id: 'b1',
    name: 'Test Building',
    site: {
      id: 'site-1',
      plotWidth: 10000,
      plotDepth: 10000,
      orientation: 0,
      setbacks: { front: 3000, rear: 2000, left: 2000, right: 2000 },
      plotBoundary: { points: [{ x: 0, y: 0 }, { x: 10000, y: 0 }, { x: 10000, y: 10000 }, { x: 0, y: 10000 }] },
      plotArea: 100000000,
      plotShape: 'rectangular',
      accessPoints: [],
      roadFacing: 'north',
    },
    floors: [
      {
        id: 'f1',
        name: 'Ground Floor',
        level: 0,
        boundary: { points: [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 1000 }, { x: 0, y: 1000 }] },
        rooms: [
          {
            id: 'r1',
            floorId: 'f1',
            boundary: { points: [] },
            rotation: 0,
            priority: 1,
            name: 'Living',
            type: RoomType.Living,
            x: 0,
            y: 0,
            width: 500,
            height: 500,
            area: 250000,
            tags: ['common:core'],
          },
        ],
        walls: [
          {
            id: 'w1',
            floorId: 'f1',
            startPoint: { x: 0, y: 0 },
            endPoint: { x: 1000, y: 0 },
            type: WallType.External,
            thickness: 200,
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
    metadata: {
      projectId: 'p1',
    },
  } as unknown as Building;

  it('compiles to ArchLang DSL source', () => {
    const dsl = compileBuildingToArchLang(mockBuilding);
    expect(dsl).toContain('plan "Test Building"');
    expect(dsl).toContain('units mm');
    expect(dsl).toContain('room id=r_r1');
  });

  it('compiles to DXF', () => {
    const dxf = compileBuildingToDxf(mockBuilding);
    expect(dxf).toContain('SECTION');
    expect(dxf).toContain('A-WALL-EXT');
    expect(dxf).toContain('EOF');
  });

  it('lints geometry', () => {
    const report = lintApartmentCadGeometry(mockBuilding);
    expect(report.valid).toBe(true);
  });

  it('compiles full building with ArchLang and generates SVG, DXF, PDF, PNG, and provenance', async () => {
    const result = await compileBuildingWithArchLang(mockBuilding, {
      generateDxf: true,
      generatePdf: true,
      generatePng: true,
    });

    expect(result.success).toBe(true);
    expect(result.svg).toBeDefined();
    expect(result.svg).toContain('<svg');
    expect(result.pages).toHaveLength(1);
    expect(result.pages![0]!.level).toBe(0);
    expect(result.pages![0]!.svg).toContain('<svg');

    // DXF output
    expect(result.dxf).toBeDefined();
    expect(result.dxf).toContain('SECTION');

    // PDF output
    expect(result.pdf).toBeDefined();
    expect(result.pdf instanceof Uint8Array).toBe(true);
    expect(result.pdf!.length).toBeGreaterThan(0);

    // PNG output
    expect(result.png).toBeDefined();
    expect(result.png instanceof Uint8Array || Buffer.isBuffer(result.png)).toBe(true);
    expect(result.png!.length).toBeGreaterThan(0);

    // Hashes
    expect(result.sourceHash).toBeDefined();
    expect(result.outputHash).toBeDefined();
    const expectedSourceHash = crypto.createHash('sha256').update(result.source!).digest('hex');
    expect(result.sourceHash).toBe(expectedSourceHash);

    // Provenance
    expect(result.provenance).toBeDefined();
    expect(result.provenance?.archlangVersion).toBe('1.57.0');
    expect(result.provenance?.adapterVersion).toBe('1.0.0');

    // Parity Report
    expect(result.parityReport).toBeDefined();
    expect(result.parityReport?.passed).toBe(true);
  });

  it('compiles multi-storey building producing individual level pages', async () => {
    const multiStoreyBuilding: Building = {
      ...mockBuilding,
      floors: [
        mockBuilding.floors[0],
        {
          id: 'f2',
          name: 'First Floor',
          level: 1,
          boundary: { points: [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 1000 }, { x: 0, y: 1000 }] },
          rooms: [
            {
              id: 'r2',
              floorId: 'f2',
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              name: 'Living Level 1',
              type: RoomType.Living,
              x: 0,
              y: 0,
              width: 500,
              height: 500,
              area: 250000,
              tags: ['common:core'],
            },
          ],
          walls: [
            {
              id: 'w2',
              floorId: 'f2',
              startPoint: { x: 0, y: 0 },
              endPoint: { x: 1000, y: 0 },
              type: WallType.External,
              thickness: 200,
              roomIds: ['r2'],
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
    } as unknown as Building;

    const result = await compileBuildingWithArchLang(multiStoreyBuilding);
    expect(result.success).toBe(true);
    expect(result.pages).toHaveLength(2);
    expect(result.pages![0]!.level).toBe(0);
    expect(result.pages![0]!.name).toBe('Ground Floor');
    expect(result.pages![1]!.level).toBe(1);
    expect(result.pages![1]!.name).toBe('First Floor');
    expect(result.pages![0]!.svg).toContain('<svg');
    expect(result.pages![1]!.svg).toContain('<svg');
  });
});
