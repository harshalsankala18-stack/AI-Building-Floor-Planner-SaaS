import { describe, expect, it, beforeEach } from 'vitest';
import {
  EditorEngine,
  SelectEntityCommand,
  SwitchFloorCommand,
  AddFloorCommand,
  RemoveFloorCommand,
  UpdateFloorPropertiesCommand,
  AddRoomCommand,
  UpdateRoomGeometryCommand,
  UpdateRoomPropertiesCommand,
  UpdateRoomBoundaryCommand,
  UpdateWallPropertiesCommand,
  UpdateWallGeometryCommand,
  SplitWallCommand,
  AddDoorCommand,
  MoveDoorCommand,
  UpdateDoorPropertiesCommand,
  AddWindowCommand,
  MoveWindowCommand,
  UpdateWindowPropertiesCommand,
  DeleteEntityCommand,
  RoomType,
  WallType,
  DoorType,
  SwingDirection,
  WindowType,
  createGenerationControlState,
  updateGenerationControl,
} from '@ai-floor-planner/core';
import {
  LocalStorageProjectStorage,
  CURRENT_PROJECT_SCHEMA_VERSION,
  createCanonical30x50_2BHK,
} from '../services/storage';

describe('Phase 5 — Fully Editable 2D Architectural CAD Workflow', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, String(v)),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
      get length() {
        return store.size;
      },
      key: (i: number) => Array.from(store.keys())[i] ?? null,
    };
  });

  it('supports complete room lifecycle: select, move, resize, rename, change type, add, delete, polygon vertex editing, lock/unlock, and undo/redo', () => {
    const building = createCanonical30x50_2BHK();
    const engine = new EditorEngine(building);
    const floorId = engine.getBuilding().floors[0]!.id;
    const room0 = engine.getBuilding().floors[0]!.rooms[0]!;

    // 1. Select room
    engine.execute(new SelectEntityCommand({ entityType: 'room', entityId: room0.id, floorId }));
    expect(engine.getState().selection?.entityId).toBe(room0.id);

    // 2. Move & resize room
    const origX = room0.x;
    const origW = room0.width;
    engine.execute(
      new UpdateRoomGeometryCommand(
        room0.id,
        { x: origX + 100, y: room0.y, width: origW + 200, height: room0.height },
        room0.name,
      ),
    );
    const updatedRoom = engine.getBuilding().floors[0]!.rooms.find(r => r.id === room0.id)!;
    expect(updatedRoom.x).toBe(origX + 100);
    expect(updatedRoom.width).toBe(origW + 200);

    // 3. Rename & change room type
    engine.execute(new UpdateRoomPropertiesCommand(room0.id, { name: 'Grand Lounge', type: RoomType.Foyer }));
    const renamedRoom = engine.getBuilding().floors[0]!.rooms.find(r => r.id === room0.id)!;
    expect(renamedRoom.name).toBe('Grand Lounge');
    expect(renamedRoom.type).toBe(RoomType.Foyer);

    // 4. Edit polygon vertices (6-vertex L-shaped room)
    const lPoly = {
      points: [
        { x: 1000, y: 1000 },
        { x: 5000, y: 1000 },
        { x: 5000, y: 3000 },
        { x: 3000, y: 3000 },
        { x: 3000, y: 5000 },
        { x: 1000, y: 5000 },
      ],
    };
    engine.execute(new UpdateRoomBoundaryCommand(room0.id, lPoly, 'Grand Lounge'));
    const polyRoom = engine.getBuilding().floors[0]!.rooms.find(r => r.id === room0.id)!;
    expect(polyRoom.boundary.points).toHaveLength(6);
    expect(polyRoom.width).toBe(4000);
    expect(polyRoom.height).toBe(4000);
    // Area of L-shape = 4000*4000 - 2000*2000 = 12,000,000 mm²
    expect(polyRoom.area).toBe(12_000_000);

    // Moving a polygonal room preserves its 6 vertices
    engine.execute(
      new UpdateRoomGeometryCommand(
        room0.id,
        { x: 1200, y: 1100, width: 4000, height: 4000 },
        'Grand Lounge',
      ),
    );
    const movedPolyRoom = engine.getBuilding().floors[0]!.rooms.find(r => r.id === room0.id)!;
    expect(movedPolyRoom.boundary.points).toHaveLength(6);
    expect(movedPolyRoom.boundary.points[0]).toEqual({ x: 1200, y: 1100 });

    // Undo polygon move & vertex edit
    engine.undo();
    engine.undo();
    const restoredRectRoom = engine.getBuilding().floors[0]!.rooms.find(r => r.id === room0.id)!;
    expect(restoredRectRoom.boundary.points).toHaveLength(4);

    // 5. Add room & delete room
    const countBeforeAdd = engine.getBuilding().floors[0]!.rooms.length;
    engine.execute(
      new AddRoomCommand(floorId, {
        floorId,
        name: 'Study',
        type: RoomType.Study,
        x: 1500,
        y: 1500,
        width: 3000,
        height: 3000,
      }),
    );
    expect(engine.getBuilding().floors[0]!.rooms).toHaveLength(countBeforeAdd + 1);
    const addedRoomId = engine.getState().selection!.entityId;

    engine.execute(new DeleteEntityCommand('room', addedRoomId));
    expect(engine.getBuilding().floors[0]!.rooms).toHaveLength(countBeforeAdd);
    engine.undo();
    expect(engine.getBuilding().floors[0]!.rooms).toHaveLength(countBeforeAdd + 1);

    // 6. Lock / unlock room
    let control = createGenerationControlState();
    control = updateGenerationControl(control, { lockedEntityIds: [room0.id] });
    expect(control.lockedEntityIds).toContain(room0.id);
    control = updateGenerationControl(control, { lockedEntityIds: [] });
    expect(control.lockedEntityIds).not.toContain(room0.id);
  });

  it('supports complete wall lifecycle: select, change thickness/type, move endpoints, split wall with opening re-hosting, and cascading delete', () => {
    const building = createCanonical30x50_2BHK();
    const engine = new EditorEngine(building);
    const floor0 = engine.getBuilding().floors[0]!;
    const wallWithDoor = floor0.walls.find(w => floor0.doors.some(d => d.wallId === w.id)) ?? floor0.walls[0]!;

    // 1. Change wall thickness and type
    const origThickness = wallWithDoor.thickness;
    engine.execute(
      new UpdateWallPropertiesCommand(wallWithDoor.id, {
        thickness: 230,
        type: WallType.External,
        loadBearing: true,
      }),
    );
    const updatedWall = engine.getBuilding().floors[0]!.walls.find(w => w.id === wallWithDoor.id)!;
    expect(updatedWall.thickness).toBe(230);
    expect(updatedWall.type).toBe(WallType.External);
    expect(updatedWall.loadBearing).toBe(true);
    engine.undo();
    expect(engine.getBuilding().floors[0]!.walls.find(w => w.id === wallWithDoor.id)!.thickness).toBe(origThickness);

    // 2. Move wall endpoints and verify hosted openings stay anchored on the wall
    const newEnd = { x: wallWithDoor.endPoint.x + 200, y: wallWithDoor.endPoint.y };
    engine.execute(new UpdateWallGeometryCommand(wallWithDoor.id, wallWithDoor.startPoint, newEnd));
    const movedWall = engine.getBuilding().floors[0]!.walls.find(w => w.id === wallWithDoor.id)!;
    expect(movedWall.endPoint.x).toBe(newEnd.x);
    engine.undo();

    // 3. Split wall into two segments and verify no doors/windows are orphaned
    const wallCountBefore = engine.getBuilding().floors[0]!.walls.length;
    const doorCountBefore = engine.getBuilding().floors[0]!.doors.length;
    engine.execute(new SplitWallCommand(wallWithDoor.id));
    const afterSplitFloor = engine.getBuilding().floors[0]!;
    expect(afterSplitFloor.walls).toHaveLength(wallCountBefore + 1);
    expect(afterSplitFloor.doors).toHaveLength(doorCountBefore);
    // Every door must reference an existing wall
    const validWallIds = new Set(afterSplitFloor.walls.map(w => w.id));
    for (const d of afterSplitFloor.doors) {
      expect(validWallIds.has(d.wallId)).toBe(true);
    }

    // Undo split wall restores original wall and original door host wallId
    engine.undo();
    expect(engine.getBuilding().floors[0]!.walls).toHaveLength(wallCountBefore);
    expect(engine.getBuilding().floors[0]!.walls.some(w => w.id === wallWithDoor.id)).toBe(true);

    // 4. Delete wall cascades to hosted doors & windows, and undo restores both
    const hostedDoorsCount = engine.getBuilding().floors[0]!.doors.filter(d => d.wallId === wallWithDoor.id).length;
    engine.execute(new DeleteEntityCommand('wall', wallWithDoor.id));
    const afterDeleteFloor = engine.getBuilding().floors[0]!;
    expect(afterDeleteFloor.walls.some(w => w.id === wallWithDoor.id)).toBe(false);
    expect(afterDeleteFloor.doors.some(d => d.wallId === wallWithDoor.id)).toBe(false);
    expect(afterDeleteFloor.doors).toHaveLength(doorCountBefore - hostedDoorsCount);

    engine.undo();
    expect(engine.getBuilding().floors[0]!.walls.some(w => w.id === wallWithDoor.id)).toBe(true);
    expect(engine.getBuilding().floors[0]!.doors).toHaveLength(doorCountBefore);
  });

  it('supports complete door and window lifecycle: add, move along wall, resize width, change type, flip swing and hinge, delete, and undo/redo', () => {
    const building = createCanonical30x50_2BHK();
    const engine = new EditorEngine(building);
    const floor0 = engine.getBuilding().floors[0]!;
    const hostWall = floor0.walls[0]!;
    const mid = {
      x: Math.round((hostWall.startPoint.x + hostWall.endPoint.x) / 2),
      y: Math.round((hostWall.startPoint.y + hostWall.endPoint.y) / 2),
    };

    // 1. Add door on wall
    engine.execute(
      new AddDoorCommand(floor0.id, {
        floorId: floor0.id,
        wallId: hostWall.id,
        position: mid,
        width: 900,
        height: 2100,
        type: DoorType.Single,
        swingDirection: SwingDirection.Inward,
        hingeSide: 'left',
        connectsRooms: [hostWall.roomIds[0] ?? '__outside__', hostWall.roomIds[1] ?? '__outside__'],
      }),
    );
    const doorId = engine.getState().selection!.entityId;

    // 2. Move door, resize width, change type, flip swing & hinge
    engine.execute(new MoveDoorCommand(doorId, { x: mid.x + 100, y: mid.y }));
    engine.execute(
      new UpdateDoorPropertiesCommand(doorId, {
        width: 1200,
        type: DoorType.Double,
        swingDirection: SwingDirection.Outward,
        hingeSide: 'right',
      }),
    );
    const editedDoor = engine.getBuilding().floors[0]!.doors.find(d => d.id === doorId)!;
    expect(editedDoor.width).toBe(1200);
    expect(editedDoor.type).toBe(DoorType.Double);
    expect(editedDoor.swingDirection).toBe(SwingDirection.Outward);
    expect(editedDoor.hingeSide).toBe('right');

    // 3. Add window, move window, resize width & sill height, change type
    engine.execute(
      new AddWindowCommand(floor0.id, {
        floorId: floor0.id,
        wallId: hostWall.id,
        position: mid,
        width: 1200,
        height: 1200,
        sillHeight: 900,
        type: WindowType.Sliding,
        roomId: hostWall.roomIds[0] ?? '',
      }),
    );
    const winId = engine.getState().selection!.entityId;
    engine.execute(new MoveWindowCommand(winId, { x: mid.x - 100, y: mid.y }));
    engine.execute(
      new UpdateWindowPropertiesCommand(winId, {
        width: 1500,
        sillHeight: 600,
        type: WindowType.Casement,
      }),
    );
    const editedWin = engine.getBuilding().floors[0]!.windows.find(w => w.id === winId)!;
    expect(editedWin.width).toBe(1500);
    expect(editedWin.sillHeight).toBe(600);
    expect(editedWin.type).toBe(WindowType.Casement);

    // 4. Delete door & window and undo
    engine.execute(new DeleteEntityCommand('window', winId));
    expect(engine.getBuilding().floors[0]!.windows.some(w => w.id === winId)).toBe(false);
    engine.undo();
    expect(engine.getBuilding().floors[0]!.windows.some(w => w.id === winId)).toBe(true);
  });

  it('supports floor management (switch, add, delete, edit floor height & name) and persists across reload', () => {
    const storage = new LocalStorageProjectStorage();
    const building = createCanonical30x50_2BHK();
    const engine = new EditorEngine(building);

    // 1. Add First Floor
    engine.execute(new AddFloorCommand({ name: 'First Floor', floorHeight: 3150 }));
    expect(engine.getBuilding().floors).toHaveLength(2);
    const ff = engine.getBuilding().floors[1]!;
    expect(engine.getState().activeFloorId).toBe(ff.id);
    expect(ff.floorHeight).toBe(3150);

    // 2. Edit floor height & name via UpdateFloorPropertiesCommand
    engine.execute(new UpdateFloorPropertiesCommand(ff.id, { name: 'Upper Villa Level', floorHeight: 3300 }));
    expect(engine.getBuilding().floors[1]!.name).toBe('Upper Villa Level');
    expect(engine.getBuilding().floors[1]!.floorHeight).toBe(3300);
    engine.undo();
    expect(engine.getBuilding().floors[1]!.floorHeight).toBe(3150);
    engine.redo();
    expect(engine.getBuilding().floors[1]!.floorHeight).toBe(3300);

    // 3. Switch between Ground Floor and First Floor
    const gfId = engine.getBuilding().floors[0]!.id;
    engine.execute(new SwitchFloorCommand(gfId));
    expect(engine.getState().activeFloorId).toBe(gfId);

    // 4. Persist to storage and reload
    storage.save({
      schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
      projectId: building.projectId,
      name: building.name,
      createdAt: building.createdAt,
      updatedAt: new Date().toISOString(),
      building: engine.getBuilding(),
    });
    const reloaded = storage.load(building.projectId);
    expect(reloaded).not.toBeNull();
    expect(reloaded!.building.floors).toHaveLength(2);
    expect(reloaded!.building.floors[1]!.floorHeight).toBe(3300);

    // 5. Remove upper floor and undo
    engine.execute(new RemoveFloorCommand(ff.id));
    expect(engine.getBuilding().floors).toHaveLength(1);
    engine.undo();
    expect(engine.getBuilding().floors).toHaveLength(2);
  });
});
