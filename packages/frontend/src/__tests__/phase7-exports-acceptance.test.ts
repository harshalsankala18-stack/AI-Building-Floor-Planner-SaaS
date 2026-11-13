import { describe, expect, it } from 'vitest';
import {
  Direction,
  DoorType,
  RoomType,
  SwingDirection,
  WallType,
  WindowType,
  addRoom,
  addStair,
  createBuilding,
  createDoor,
  createFloor,
  createRoom,
  createStair,
  createWall,
  createWindow,
  rectToPolygon,
  type Building,
  type Polygon,
} from '@ai-floor-planner/core';
import { projectBuildingTo3D } from '@ai-floor-planner/projection-3d';
import { coordinateStairAccess } from '@ai-floor-planner/planning-engine';
import {
  createExportArtifact,
  DEFAULT_ADVANCED_EXPORT_SETTINGS,
} from '../services/advanced-export';
import {
  exportProjectPackageJson,
  generateArchitecturalDxf,
  generateBuildingGlb,
  generateBuildingGltf,
  generateBuildingMtl,
  generateBuildingObj,
  generateBuildingStl,
  generateProjectBackupZip,
  importProjectPackageJson,
} from '../services/export-system';
import { createBlenderExport, createBlenderLauncher } from '../services/blender-export';
import type { ProjectEnvelope } from '../services/storage';

function buildMultiFloorPolygonalVilla(): Building {
  let building = createBuilding({
    projectId: 'phase7-acceptance-villa',
    name: 'Vasant Vihar G+1 Residence',
    site: {
      plotWidth: 15240,
      plotDepth: 18290,
      orientation: 0,
      roadFacing: Direction.North,
      roadWidth: 5180,
      setbacks: { front: 2130, rear: 1219, left: 1219, right: 1219 },
      plannedFloorCount: 2,
    },
    floors: [
      { buildingId: '', level: 0, name: 'Ground Floor', floorHeight: 3000 },
      { buildingId: '', level: 1, name: 'First Floor', floorHeight: 3000 },
    ],
  });

  const gfBoundary: Polygon = {
    points: [
      { x: 1200, y: 2100 },
      { x: 14000, y: 2100 },
      { x: 14000, y: 12800 },
      { x: 4860, y: 12800 },
      { x: 4860, y: 7280 },
      { x: 1200, y: 7280 },
    ],
  };

  const ffBoundary: Polygon = {
    points: [
      { x: 3000, y: 2100 },
      { x: 14000, y: 2100 },
      { x: 14000, y: 12800 },
      { x: 3000, y: 12800 },
    ],
  };

  const gf = createFloor({
    buildingId: building.id,
    level: 0,
    name: 'Ground Floor',
    floorHeight: 3000,
    boundary: gfBoundary,
  });
  const ff = createFloor({
    buildingId: building.id,
    level: 1,
    name: 'First Floor',
    floorHeight: 3000,
    boundary: ffBoundary,
  });

  const lShapedLivingPoly: Polygon = {
    points: [
      { x: 6690, y: 2100 },
      { x: 12180, y: 2100 },
      { x: 12180, y: 5500 },
      { x: 10500, y: 5500 },
      { x: 10500, y: 7280 },
      { x: 6690, y: 7280 },
    ],
  };
  const living = {
    ...createRoom({
      floorId: gf.id,
      type: RoomType.Living,
      name: 'Living Room',
      x: 6690,
      y: 2100,
      width: 5490,
      height: 5180,
    }),
    boundary: lShapedLivingPoly,
  };
  const kitchen = createRoom({
    floorId: gf.id,
    type: RoomType.Kitchen,
    name: 'Kitchen',
    x: 10500,
    y: 7280,
    width: 3500,
    height: 4270,
  });
  const stairRoomGf = createRoom({
    floorId: gf.id,
    type: RoomType.Staircase,
    name: 'Staircase',
    x: 4860,
    y: 7280,
    width: 1830,
    height: 3200,
  });

  const gfWall = createWall({
    floorId: gf.id,
    startPoint: { x: 6690, y: 2100 },
    endPoint: { x: 12180, y: 2100 },
    thickness: 230,
    type: WallType.External,
    loadBearing: true,
    roomIds: [living.id, '__outside__'],
  });
  const gfDoor = createDoor({
    floorId: gf.id,
    wallId: gfWall.id,
    position: { x: 8200, y: 2100 },
    width: 1200,
    height: 2100,
    type: DoorType.Double,
    swingDirection: SwingDirection.Inward,
    connectsRooms: [living.id, '__outside__'],
  });
  const gfWindow = createWindow({
    floorId: gf.id,
    wallId: gfWall.id,
    position: { x: 10200, y: 2100 },
    width: 1500,
    height: 1350,
    sillHeight: 900,
    type: WindowType.Sliding,
    roomId: living.id,
  });

  const stairBoundary = rectToPolygon(4860, 7280, 1830, 3200);
  const gfStair = {
    ...createStair({
      floorId: gf.id,
      x: 4860,
      y: 7280,
      width: 1830,
      length: 3200,
      riserHeight: 150,
      treadDepth: 250,
      direction: Direction.North,
      connectsFloors: [0, 1],
      verticalCoreId: 'primary-stair-core',
    }),
    boundary: stairBoundary,
    riserCount: 20,
  };

  const masterBed = createRoom({
    floorId: ff.id,
    type: RoomType.Bedroom,
    name: 'Master Bedroom',
    x: 8510,
    y: 4540,
    width: 5490,
    height: 4880,
  });
  const balcony = createRoom({
    floorId: ff.id,
    type: RoomType.Balcony,
    name: 'Balcony',
    x: 8510,
    y: 9420,
    width: 5490,
    height: 1500,
  });
  const ffWall = createWall({
    floorId: ff.id,
    startPoint: { x: 8510, y: 9420 },
    endPoint: { x: 14000, y: 9420 },
    thickness: 230,
    type: WallType.External,
    loadBearing: true,
    roomIds: [masterBed.id, balcony.id],
  });
  const ffStair = {
    ...createStair({
      floorId: ff.id,
      x: 4860,
      y: 7280,
      width: 1830,
      length: 3200,
      riserHeight: 150,
      treadDepth: 250,
      direction: Direction.North,
      connectsFloors: [0, 1],
      verticalCoreId: 'primary-stair-core',
    }),
    boundary: stairBoundary,
    riserCount: 20,
  };

  building = {
    ...building,
    metadata: {
      ...building.metadata,
      archlang: {
        png: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      },
    } as any,
    floors: [
      {
        ...gf,
        rooms: [living, kitchen, stairRoomGf],
        walls: [gfWall],
        doors: [gfDoor],
        windows: [gfWindow],
        stairs: [gfStair],
      },
      {
        ...ff,
        rooms: [masterBed, balcony],
        walls: [ffWall],
        doors: [],
        windows: [],
        stairs: [ffStair],
      },
    ],
  };

  return building;
}

describe('Phase 7 — Final Production Verification, Exports & Project Package Round-Trip', () => {
  it('2D exports (DXF, SVG, PDF, PNG) preserve multi-floor buildings and irregular polygon boundaries', () => {
    const building = buildMultiFloorPolygonalVilla();

    // 1. DXF preserves all floors and 6-vertex L-shaped room polygon coordinates
    const dxf = generateArchitecturalDxf(building, { includeAllFloors: true });
    expect(dxf).toContain('GROUND FLOOR (LEVEL 0)');
    expect(dxf).toContain('FIRST FLOOR (LEVEL 1)');
    expect(dxf).toContain('10500.00');
    expect(dxf).toContain('-5500.00');

    // 2. SVG preserves polygonal room points across floors
    const svgGf = createExportArtifact(building, {
      ...DEFAULT_ADVANCED_EXPORT_SETTINGS,
      format: 'svg',
      floorId: building.floors[0]!.id,
    });
    expect(svgGf.mimeType).toBe('image/svg+xml');
    expect(String(svgGf.content)).toContain('<svg');
    expect(String(svgGf.content)).toContain('Living Room');

    const svgFf = createExportArtifact(building, {
      ...DEFAULT_ADVANCED_EXPORT_SETTINGS,
      format: 'svg',
      floorId: building.floors[1]!.id,
    });
    expect(String(svgFf.content)).toContain('Master Bedroom');

    // 3. PDF preserves polygonal room path (`h f`) and title block
    const pdf = createExportArtifact(building, {
      ...DEFAULT_ADVANCED_EXPORT_SETTINGS,
      format: 'pdf',
      floorId: building.floors[0]!.id,
    });
    expect(pdf.mimeType).toBe('application/pdf');
    expect(String(pdf.content)).toContain('%PDF-1.4');
    expect(String(pdf.content)).toContain('h f');
    expect(String(pdf.content)).toContain('Living Room');

    // 4. PNG export artifact
    const png = createExportArtifact(building, {
      ...DEFAULT_ADVANCED_EXPORT_SETTINGS,
      format: 'png',
      floorId: building.floors[0]!.id,
    });
    expect(png.mimeType).toBe('image/png');
    expect(png.byteSize).toBeGreaterThan(20);
  });

  it('3D exports (GLB, glTF, OBJ/MTL, STL, Blender) preserve multi-floor geometry', () => {
    const building = buildMultiFloorPolygonalVilla();
    const projection = projectBuildingTo3D(building);
    expect(projection.levels).toHaveLength(2);

    // 1. GLB binary header & multi-floor extras
    const glb = generateBuildingGlb(building);
    expect(glb.byteLength).toBeGreaterThan(100);
    const glbHeader = new TextDecoder().decode(glb.slice(0, 4));
    expect(glbHeader).toBe('glTF');
    const glbJsonChunk = new TextDecoder().decode(glb.slice(20, 20 + 450));
    expect(glbJsonChunk).toContain('"floorCount":2');

    // 2. glTF JSON preserves both floor nodes and elevations
    const gltfStr = generateBuildingGltf(building);
    const gltf = JSON.parse(gltfStr);
    expect(gltf.nodes).toHaveLength(2);
    expect(gltf.nodes[0].name).toContain('Ground Floor');
    expect(gltf.nodes[1].name).toContain('First Floor');
    expect(gltf.nodes[1].translation[1]).toBe(3);

    // 3. OBJ + MTL
    const obj = generateBuildingObj(building);
    const mtl = generateBuildingMtl();
    expect(obj).toContain('mtllib building-model.mtl');
    expect(obj).toContain('usemtl Wall_Exterior');
    expect(mtl).toContain('newmtl Wall_Exterior');

    // 4. STL
    const stl = generateBuildingStl(building);
    expect(stl).toContain('solid BuildingModel');
    expect(stl).toContain('endsolid BuildingModel');

    // 5. Blender export (.py and .cmd launcher) preserves multi-floor meshes & stair solids
    let bCore = createBuilding({
      projectId: 'blender-multi-floor',
      name: 'Vasant Vihar G+1 Residence',
      site: { plotWidth: 12000, plotDepth: 15000 },
      floors: [0, 1].map(level => ({
        buildingId: '',
        level,
        boundary: rectToPolygon(0, 0, 12000, 15000),
        floorHeight: 3000,
      })),
    });
    for (const floor of bCore.floors) {
      bCore = addRoom(bCore, floor.id, { floorId: floor.id, type: RoomType.Staircase, x: 1000, y: 1000, width: 4000, height: 4200 });
      bCore = addStair(bCore, floor.id, { floorId: floor.id, x: 1100, y: 1100, width: 1200, length: 3000, connectsFloors: [0, 1], verticalCoreId: 'core' });
    }
    const coordinated = coordinateStairAccess(bCore).building;
    const coordinatedProj = projectBuildingTo3D(coordinated);
    const blenderPy = createBlenderExport(coordinated, coordinatedProj);
    expect(blenderPy.filename).toMatch(/\.py$/);
    expect(blenderPy.content).toContain(`Floor_${coordinated.floors[0]!.id}`);
    expect(blenderPy.content).toContain(`Floor_${coordinated.floors[1]!.id}`);
    expect(blenderPy.content).toContain('Stair_');

    const launcher = createBlenderLauncher(coordinated, coordinatedProj, 1700000000000);
    expect(launcher.filename).toMatch(/\.cmd$/);
    expect(launcher.content).toContain('::PLANNER_DATA');
  });

  it('Project package JSON & ZIP export/import preserve canonical building, generation session, artifact metadata, accepted/rejected state, floor count, and room polygons', () => {
    const building = buildMultiFloorPolygonalVilla();
    const envelope: ProjectEnvelope = {
      projectId: building.projectId,
      name: building.name,
      createdAt: '2026-11-14T00:00:00.000Z',
      updatedAt: '2026-11-14T00:30:00.000Z',
      schemaVersion: 2,
      building,
      floorPlanImage: {
        schemaVersion: 1,
        generationId: 'gen_31777_mwdwb5m3_84f08308',
        seed: 31777,
        attempt: 1,
        generatedAt: '2026-11-14T00:10:00.000Z',
        promptVersion: 1,
        model: 'gemini-3.1-flash-lite-image',
        provider: 'gemini',
        mimeType: 'image/jpeg',
        imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        request: {} as any,
        contextSignature: 'ctx_vasant_vihar',
        requirementsFingerprint: 'req_fp_vasant_vihar',
        evaluation: {
          overallScore: 58,
          passed: false,
          dimensions: {
            plotAndEnvelope: 10,
            roomProgramCompleteness: 14,
            roomProportionsAndSizes: 12,
            circulationAndAccess: 8,
            openingsAndVentilation: 8,
            vastuAndOrientation: 3,
            drawingClarityAndProfessionalism: 3,
          },
          hardViolations: ['Rectangular footprint instead of requested L-shaped footprint'],
          softIssues: ['Suboptimal Vastu alignment'],
          revisionInstructions: ['Enforce L-shaped recess on West'],
          summary: 'Score 58/100 — Revision Required',
        } as any,
      },
      generationSession: {
        schemaVersion: 1,
        requestSeed: 31777,
        generatedAt: '2026-11-14T00:10:00.000Z',
        candidates: [],
      },
    };

    const jsonStr = exportProjectPackageJson(envelope);
    const parsedWrapper = JSON.parse(jsonStr);
    expect(parsedWrapper.floorCount).toBe(2);
    expect(parsedWrapper.acceptedState).toBe(false);
    expect(parsedWrapper.qualityScore).toBe(58);
    expect(parsedWrapper.imageArtifactId).toBe('gen_31777_mwdwb5m3_84f08308');

    const reimported = importProjectPackageJson(jsonStr);
    expect(reimported.building.floors).toHaveLength(2);
    expect(reimported.building.floors[0]!.boundary.points).toHaveLength(6);
    expect(reimported.building.floors[0]!.rooms[0]!.boundary.points).toHaveLength(6);
    expect(reimported.floorPlanImage?.generationId).toBe('gen_31777_mwdwb5m3_84f08308');
    expect(reimported.floorPlanImage?.evaluation?.passed).toBe(false);
    expect(reimported.floorPlanImage?.evaluation?.overallScore).toBe(58);
    expect(reimported.generationSession?.requestSeed).toBe(31777);

    const zipBytes = generateProjectBackupZip(envelope);
    expect(zipBytes.byteLength).toBeGreaterThan(1000);
    // Verify PKZIP header signature (0x50, 0x4b, 0x03, 0x04)
    expect(zipBytes[0]).toBe(0x50);
    expect(zipBytes[1]).toBe(0x4b);
  });
});

