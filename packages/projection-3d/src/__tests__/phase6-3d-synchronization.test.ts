import { describe, expect, it } from 'vitest';
import {
  AddDoorCommand,
  AddWindowCommand,
  ColumnShape,
  DeleteEntityCommand,
  Direction,
  DoorType,
  EditorEngine,
  MoveDoorCommand,
  MoveWindowCommand,
  RoomType,
  SwingDirection,
  UpdateFloorPropertiesCommand,
  UpdateRoomBoundaryCommand,
  UpdateRoomGeometryCommand,
  WallType,
  WindowType,
  createBuilding,
  createColumn,
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
import { Building3DProjector, projectBuildingTo3D } from '../index';

function createGPlusOneVillaFixture(): Building {
  let building = createBuilding({
    projectId: 'phase6-3d-villa',
    name: 'Vasant Vihar G+1 Villa',
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

  const gfLShape: Polygon = {
    points: [
      { x: 1200, y: 2100 },
      { x: 14000, y: 2100 },
      { x: 14000, y: 12800 },
      { x: 4860, y: 12800 },
      { x: 4860, y: 7300 },
      { x: 1200, y: 7300 },
    ],
  };

  const ffStepped: Polygon = {
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
    boundary: gfLShape,
  });
  const ff = createFloor({
    buildingId: building.id,
    level: 1,
    name: 'First Floor',
    floorHeight: 3000,
    boundary: ffStepped,
  });

  // Ground floor rooms
  const living = createRoom({ floorId: gf.id, type: RoomType.Living, name: 'Living Room', x: 6690, y: 2100, width: 5490, height: 5180 });
  const dining = createRoom({ floorId: gf.id, type: RoomType.Dining, name: 'Dining Room', x: 6690, y: 7280, width: 4570, height: 4270 });
  const kitchen = createRoom({ floorId: gf.id, type: RoomType.Kitchen, name: 'Kitchen', x: 11260, y: 7280, width: 3660, height: 4270 });
  const parking = createRoom({ floorId: gf.id, type: RoomType.Parking, name: 'Parking', x: 1200, y: 7280, width: 3660, height: 5490 });
  const stairRoomGf = createRoom({ floorId: gf.id, type: RoomType.Staircase, name: 'Staircase', x: 4860, y: 7280, width: 1830, height: 3200 });

  // Ground floor walls & openings
  const gfNorthExt = createWall({
    floorId: gf.id,
    startPoint: { x: 6690, y: 2100 },
    endPoint: { x: 12180, y: 2100 },
    thickness: 230,
    type: WallType.External,
    loadBearing: true,
    roomIds: [living.id, '__outside__'],
  });
  const gfIntWall = createWall({
    floorId: gf.id,
    startPoint: { x: 6690, y: 7280 },
    endPoint: { x: 11260, y: 7280 },
    thickness: 115,
    type: WallType.Internal,
    roomIds: [living.id, dining.id],
  });
  const mainDoor = createDoor({
    floorId: gf.id,
    wallId: gfNorthExt.id,
    position: { x: 8500, y: 2100 },
    width: 1200,
    height: 2100,
    type: DoorType.Double,
    swingDirection: SwingDirection.Inward,
    hingeSide: 'left',
    connectsRooms: [living.id, '__outside__'],
  });
  const livingWin = createWindow({
    floorId: gf.id,
    wallId: gfNorthExt.id,
    position: { x: 10500, y: 2100 },
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

  const gfCol = createColumn({
    floorId: gf.id,
    position: { x: 6690, y: 2100 },
    width: 300,
    depth: 300,
    shape: ColumnShape.Rectangular,
  });

  // First floor rooms
  const masterBed = createRoom({ floorId: ff.id, type: RoomType.Bedroom, name: 'Master Bedroom', x: 8510, y: 4540, width: 5490, height: 4880 });
  const masterBath = createRoom({ floorId: ff.id, type: RoomType.Bathroom, name: 'En-Suite Bath', x: 8510, y: 2100, width: 2740, height: 2440 });
  const balcony = createRoom({ floorId: ff.id, type: RoomType.Balcony, name: 'Balcony', x: 8510, y: 9420, width: 5490, height: 1500 });
  const stairRoomFf = createRoom({ floorId: ff.id, type: RoomType.Staircase, name: 'Staircase Landing', x: 4860, y: 7280, width: 1830, height: 3200 });

  const ffExtWall = createWall({
    floorId: ff.id,
    startPoint: { x: 8510, y: 9420 },
    endPoint: { x: 14000, y: 9420 },
    thickness: 230,
    type: WallType.External,
    loadBearing: true,
    roomIds: [masterBed.id, balcony.id],
  });
  const balconyDoor = createDoor({
    floorId: ff.id,
    wallId: ffExtWall.id,
    position: { x: 10500, y: 9420 },
    width: 1500,
    height: 2100,
    type: DoorType.Sliding,
    swingDirection: SwingDirection.Outward,
    hingeSide: 'right',
    connectsRooms: [masterBed.id, balcony.id],
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
    floors: [
      {
        ...gf,
        rooms: [living, dining, kitchen, parking, stairRoomGf],
        walls: [gfNorthExt, gfIntWall],
        doors: [mainDoor],
        windows: [livingWin],
        stairs: [gfStair],
        columns: [gfCol],
      },
      {
        ...ff,
        rooms: [masterBed, masterBath, balcony, stairRoomFf],
        walls: [ffExtWall],
        doors: [balconyDoor],
        windows: [],
        stairs: [ffStair],
        columns: [],
      },
    ],
  };

  return building;
}

describe('Phase 6 — Professional 3D Architectural Model & Live 2D-to-3D Synchronization', () => {
  it('projects multi-floor G+1 levels, irregular polygonal floor slabs, stairwell cutouts, and architectural details', () => {
    const building = createGPlusOneVillaFixture();
    const projection = projectBuildingTo3D(building);

    // 1. Levels & elevations
    expect(projection.levels).toHaveLength(2);
    expect(projection.levels[0]).toMatchObject({
      level: 0,
      floorName: 'Ground Floor',
      elevation: 0,
      floorToFloorHeight: 3000,
      datumLabel: '±0.000',
    });
    expect(projection.levels[1]).toMatchObject({
      level: 1,
      floorName: 'First Floor',
      elevation: 3000,
      floorToFloorHeight: 3000,
      datumLabel: '+3.000',
    });

    // 2. Irregular L-shaped Ground Floor slab and First Floor slab with stairwell cutout
    expect(projection.floorPlates).toHaveLength(2);
    expect(projection.floorPlates[0]!.boundary.points).toHaveLength(6);
    expect(projection.floorPlates[0]!.elevation).toBe(0);
    expect(projection.floorPlates[1]!.elevation).toBe(3000);
    expect(projection.floorPlates[1]!.cutouts).toContainEqual(
      rectToPolygon(4860, 7280, 1830, 3200),
    );

    // 3. Architectural details on walls, openings, rooms, stairs, columns
    const extWall = projection.walls.find(w => w.wallType === WallType.External)!;
    const intWall = projection.walls.find(w => w.wallType === WallType.Internal)!;
    expect(extWall.thickness).toBe(230);
    expect(extWall.loadBearing).toBe(true);
    expect(intWall.thickness).toBe(115);

    const door3D = projection.openings.find(o => o.sourceEntityType === 'door' && o.doorType === DoorType.Double)!;
    expect(door3D.swingDirection).toBe(SwingDirection.Inward);
    expect(door3D.hingeSide).toBe('left');

    const win3D = projection.openings.find(o => o.sourceEntityType === 'window')!;
    expect(win3D.windowType).toBe(WindowType.Sliding);
    expect(win3D.bottom).toBe(900);
    expect(win3D.height).toBe(1350);

    const balcony3D = projection.rooms.find(r => r.roomType === RoomType.Balcony)!;
    expect(balcony3D).toBeDefined();
    expect(balcony3D.elevation).toBe(3150);

    const parking3D = projection.rooms.find(r => r.roomType === RoomType.Parking)!;
    expect(parking3D).toBeDefined();
    expect(parking3D.elevation).toBe(150);

    expect(projection.stairs).toHaveLength(1);
    expect(projection.stairs[0]!.verticalExtent).toBe(3000);
    expect(projection.columns).toHaveLength(1);
    expect(projection.columns[0]!.width).toBe(300);
  });

  it('tightens oversized 4-point plot/envelope floor boundaries to the multi-room orthogonal footprint', () => {
    const building = createGPlusOneVillaFixture();
    // Simulate a legacy floor with a bloated 15m x 18m rectangular boundary around L-shaped rooms
    const bloatedGf = {
      ...building.floors[0]!,
      boundary: rectToPolygon(0, 0, 15240, 18290),
    };
    const modified = {
      ...building,
      floors: [bloatedGf, building.floors[1]!],
    };

    const projection = projectBuildingTo3D(modified);
    // The 3D slab boundary should be tightened to the rooms rather than spanning 15240 x 18290
    const xs = projection.floorPlates[0]!.boundary.points.map(p => p.x);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(1200);
  });

  it('synchronizes every 2D CAD edit (room move/resize/polygon, door/window add/move/delete, floor height) into 3D immediately', () => {
    const engine = new EditorEngine(createGPlusOneVillaFixture());
    const projector = new Building3DProjector();

    const gfId = engine.getBuilding().floors[0]!.id;
    const ffId = engine.getBuilding().floors[1]!.id;
    const living = engine.getBuilding().floors[0]!.rooms.find(r => r.name === 'Living Room')!;
    const gfNorthWall = engine.getBuilding().floors[0]!.walls[0]!;
    const mainDoor = engine.getBuilding().floors[0]!.doors[0]!;
    const livingWin = engine.getBuilding().floors[0]!.windows[0]!;

    // 1. Move & resize room -> 3D room surface updates immediately
    engine.execute(
      new UpdateRoomGeometryCommand(living.id, { x: 6690, y: 1900, width: 5800, height: 5380 }, 'Living Room'),
    );
    let proj = projector.project(engine.getBuilding());
    const living3D = proj.rooms.find(r => r.sourceEntityId === living.id)!;
    expect(Math.max(...living3D.boundary.points.map(p => p.x)) - Math.min(...living3D.boundary.points.map(p => p.x))).toBe(5800);

    // 2. Edit room polygon vertices -> 3D room surface updates to exact polygon
    const customPoly: Polygon = {
      points: [
        { x: 6690, y: 1900 },
        { x: 12490, y: 1900 },
        { x: 12490, y: 6000 },
        { x: 11200, y: 6000 },
        { x: 11200, y: 7280 },
        { x: 6690, y: 7280 },
      ],
    };
    engine.execute(new UpdateRoomBoundaryCommand(living.id, customPoly, 'Living Room'));
    proj = projector.project(engine.getBuilding());
    expect(proj.rooms.find(r => r.sourceEntityId === living.id)!.boundary.points).toHaveLength(6);

    // 3. Move door & window, add door & window, delete opening -> 3D wall solidSegments & openings update
    const initialOpeningsCount = proj.openings.length;
    engine.execute(new MoveDoorCommand(mainDoor.id, { x: 7800, y: 2100 }));
    engine.execute(new MoveWindowCommand(livingWin.id, { x: 10800, y: 2100 }));
    proj = projector.project(engine.getBuilding());
    expect(proj.openings.find(o => o.sourceEntityId === mainDoor.id)!.position.x).toBe(7800);
    expect(proj.openings.find(o => o.sourceEntityId === livingWin.id)!.position.x).toBe(10800);

    const gfIntWall = engine.getBuilding().floors[0]!.walls[1]!;
    engine.execute(
      new AddDoorCommand(gfId, {
        floorId: gfId,
        wallId: gfIntWall.id,
        position: { x: 8500, y: 7280 },
        width: 900,
        height: 2100,
        type: DoorType.Single,
        swingDirection: SwingDirection.Inward,
        connectsRooms: [living.id, engine.getBuilding().floors[0]!.rooms[1]!.id],
      }),
    );
    engine.execute(
      new AddWindowCommand(gfId, {
        floorId: gfId,
        wallId: gfNorthWall.id,
        position: { x: 9400, y: 2100 },
        width: 900,
        height: 1200,
        sillHeight: 900,
        type: WindowType.Casement,
        roomId: living.id,
      }),
    );
    proj = projector.project(engine.getBuilding());
    expect(proj.openings).toHaveLength(initialOpeningsCount + 2);

    const addedWindow = engine.getBuilding().floors[0]!.windows.find(w => w.id !== livingWin.id)!;
    engine.execute(new DeleteEntityCommand('window', addedWindow.id));
    proj = projector.project(engine.getBuilding());
    expect(proj.openings).toHaveLength(initialOpeningsCount + 1);

    // 4. Edit Ground Floor height -> First Floor slab & rooms elevate immediately in 3D
    engine.execute(new UpdateFloorPropertiesCommand(gfId, { floorHeight: 3450 }));
    proj = projector.project(engine.getBuilding());
    expect(proj.levels.find(l => l.floorId === ffId)!.elevation).toBe(3450);
    expect(proj.floorPlates.find(p => p.floorId === ffId)!.elevation).toBe(3450);
  });
});
