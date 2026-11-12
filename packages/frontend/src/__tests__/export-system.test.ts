import { describe, expect, it } from 'vitest';
import {
  generateArchitecturalDxf,
  generateBuildingObj,
  generateBuildingMtl,
  generateBuildingStl,
  generateBuildingGlb,
  generateProjectBackupZip,
  buildZipArchive,
  DXF_LAYERS,
} from '../services/export-system';
import { createBuilding, PlotShape, Direction, WallType, RoomType, type Building } from '@ai-floor-planner/core';
import type { ProjectEnvelope } from '../services/storage';

describe('Master Complete Export System (Phase 2.6)', () => {
  const baseBuilding = createBuilding({
    projectId: 'proj_export_test',
    name: 'Modern 3BHK Villa',
    site: {
      plotWidth: 9144,
      plotDepth: 15240,
      plotShape: PlotShape.Rectangular,
      orientation: 90,
      roadFacing: Direction.East,
      setbacks: { front: 1500, rear: 1500, left: 1000, right: 1000 },
      plannedFloorCount: 2,
    },
    floors: [{ buildingId: 'proj_export_test', level: 0, name: 'Ground Floor' }],
  });

  const sampleBuilding: Building = ({
    ...baseBuilding,
    floors: [
      {
        ...baseBuilding.floors[0]!,
        rooms: [
          {
            id: 'rm_living',
            floorId: baseBuilding.floors[0]!.id,
            name: 'Living Room',
            type: RoomType.Living,
            x: 1000,
            y: 1500,
            width: 4500,
            height: 4000,
            area: 18000000,
            tags: [],
            isFixed: false,
          },
        ],
        walls: [
          {
            id: 'w_ext_1',
            floorId: baseBuilding.floors[0]!.id,
            startPoint: { x: 1000, y: 1500 },
            endPoint: { x: 5500, y: 1500 },
            thickness: 200,
            type: WallType.External,
            roomIds: ['rm_living'],
            hasOpening: false,
            loadBearing: true,
          },
        ],
        doors: [
          {
            id: 'd_1',
            floorId: baseBuilding.floors[0]!.id,
            wallId: 'w_ext_1',
            position: { x: 2000, y: 1500 },
            width: 1000,
            height: 2100,
            type: 'single' as any,
            swingDirection: 'inside_left' as any,
            connectsRooms: ['rm_living', 'exterior'] as [string, string],
          },
        ],
        windows: [
          {
            id: 'win_1',
            floorId: baseBuilding.floors[0]!.id,
            wallId: 'w_ext_1',
            position: { x: 3500, y: 1500 },
            width: 1200,
            height: 1200,
            sillHeight: 900,
            type: 'standard' as any,
            roomId: 'rm_living',
          },
        ],
        columns: [
          {
            id: 'col_1',
            floorId: baseBuilding.floors[0]!.id,
            position: { x: 1000, y: 1500 },
            dimensions: { width: 230, depth: 380 },
            shape: 'rectangular' as any,
            gridReference: 'A1',
            isStructural: true,
          },
        ],
      },
    ],
  } as unknown) as Building;

  const sampleEnvelope: ProjectEnvelope = {
    projectId: 'proj_export_test',
    name: 'Modern 3BHK Villa',
    projectNumber: 'FP-2026-001',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    building: sampleBuilding,
    floorPlanImage: {
      schemaVersion: 1,
      generationId: 'gen_test_123',
      seed: 42,
      attempt: 1,
      generatedAt: new Date().toISOString(),
      promptVersion: 1,
      model: 'gemini-3.1-flash-lite-image',
      provider: 'gemini',
      mimeType: 'image/jpeg',
      imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      contextSignature: 'sig_123',
      evaluation: {
        overallScore: 88,
        passed: true,
        complianceScore: 23,
        spatialLayoutScore: 18,
        footprintScore: 14,
        circulationScore: 13,
        draftingClarityScore: 9,
        vastuDaylightScore: 8,
        coherenceScore: 3,
        strengths: ['Well balanced'],
        concerns: [],
        identifiedProblems: [],
        missingRequirements: [],
        incorrectPlacements: [],
        incorrectFloorArrangements: [],
        suggestedCorrections: [],
        hardConstraintViolations: [],
        rationale: 'Passed 80+ gate',
        model: 'gemini-3.1-flash-lite',
        latencyMs: 120,
      },
    },
  } as unknown as ProjectEnvelope;

  it('generates genuine AutoCAD DXF with all 11 standard layers', () => {
    const dxf = generateArchitecturalDxf(sampleBuilding, { includeAllFloors: true });

    expect(dxf).toContain('SECTION\n2\nHEADER');
    expect(dxf).toContain('$ACADVER\n1\nAC1009');
    expect(dxf).toContain('ENTITIES');
    expect(dxf).toContain('EOF');

    // Verify all 11 architectural layers are declared
    for (const layer of DXF_LAYERS) {
      expect(dxf).toContain(`2\n${layer.name}`);
    }

    // Verify critical entity types
    expect(dxf).toContain('0\nLINE');
    expect(dxf).toContain('0\nARC');       // Door swing arc
    expect(dxf).toContain('0\nPOLYLINE');  // Room boundary
    expect(dxf).toContain('0\nTEXT');      // Room & dimension labels
    expect(dxf).toContain('Living Room');
    expect(dxf).toContain('SITE_BOUNDARY');
    expect(dxf).toContain('SETBACKS');
    expect(dxf).toContain('STRUCTURE');
  });

  it('generates valid 3D Wavefront OBJ and MTL models', () => {
    const obj = generateBuildingObj(sampleBuilding);
    expect(obj).toContain('mtllib building-model.mtl');
    expect(obj).toContain('v ');
    expect(obj).toContain('f ');
    expect(obj).toContain('usemtl Wall_Exterior');
    expect(obj).toContain('usemtl Floor_Slab');
    expect(obj).toContain('usemtl Column_Concrete');

    const mtl = generateBuildingMtl();
    expect(mtl).toContain('newmtl Wall_Exterior');
    expect(mtl).toContain('newmtl Floor_Slab');
    expect(mtl).toContain('newmtl Column_Concrete');
    expect(mtl).toContain('newmtl Window_Glass');
  });

  it('generates valid 3D STL stereolithography mesh', () => {
    const stl = generateBuildingStl(sampleBuilding);
    expect(stl.startsWith('solid BuildingModel')).toBe(true);
    expect(stl.endsWith('endsolid BuildingModel')).toBe(true);
    expect(stl).toContain('facet normal');
    expect(stl).toContain('outer loop');
    expect(stl).toContain('vertex');
    expect(stl).toContain('endloop');
    expect(stl).toContain('endfacet');
  });

  it('generates valid binary glTF (GLB 2.0) file with correct magic header', () => {
    const glb = generateBuildingGlb(sampleBuilding);
    expect(glb).toBeInstanceOf(Uint8Array);
    expect(glb.length).toBeGreaterThan(50);

    // Check 'glTF' magic header: 0x67, 0x6C, 0x54, 0x46 (little-endian: 0x46546C67)
    const view = new DataView(glb.buffer);
    const magic = view.getUint32(0, true);
    expect(magic).toBe(0x46546c67);
    const version = view.getUint32(4, true);
    expect(version).toBe(2);
    const totalLength = view.getUint32(8, true);
    expect(totalLength).toBe(glb.length);
  });

  it('generates a valid, non-empty Project Backup ZIP package with PKZIP signature', () => {
    const zip = generateProjectBackupZip(sampleEnvelope);
    expect(zip).toBeInstanceOf(Uint8Array);
    expect(zip.length).toBeGreaterThan(200);

    // Check standard PKZIP signature: PK\x03\x04 (0x50, 0x4b, 0x03, 0x04)
    expect(zip[0]).toBe(0x50);
    expect(zip[1]).toBe(0x4b);
    expect(zip[2]).toBe(0x03);
    expect(zip[3]).toBe(0x04);
  });

  it('buildZipArchive correctly packs multiple binary and text files', () => {
    const testZip = buildZipArchive([
      { path: 'hello.txt', data: 'Hello World!' },
      { path: 'nested/test.json', data: '{"status":"ok"}' },
      { path: 'binary.dat', data: new Uint8Array([1, 2, 3, 4, 5]) },
    ]);

    expect(testZip.length).toBeGreaterThan(100);
    expect(testZip[0]).toBe(0x50);
    expect(testZip[1]).toBe(0x4b);
  });
});
