import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createBuilding,
  addRoom,
  addDoor,
  addColumn,
  addStair,
  setIdSeed,
  resetIdGenerator,
  RoomType,
  DoorType,
  WindowType,
  ColumnShape,
  StairType,
  Direction,
  EditorEngine,
  AddDoorCommand,
  MoveDoorCommand,
  UpdateDoorPropertiesCommand,
  RemoveDoorCommand,
  AddWindowCommand,
  MoveWindowCommand,
  UpdateWindowPropertiesCommand,
  RemoveWindowCommand,
  DeleteEntityCommand,
} from '../index';

function makeTestBuilding() {
  const building = createBuilding({
    projectId: 'cmd-test',
    name: 'Command Test Building',
    site: { plotWidth: 9144, plotDepth: 15240 },
    floors: [{ buildingId: '', level: 0, name: 'Ground Floor' }],
  });

  const floor0Id = building.floors[0]!.id;
  const withRoom = addRoom(building, floor0Id, {
    floorId: floor0Id,
    type: RoomType.Living,
    name: 'Living Room',
    x: 1000,
    y: 1000,
    width: 4000,
    height: 5000,
  });

  return withRoom;
}

describe('Phase 6: Extended Domain CRUD & Reversible Commands', () => {
  beforeEach(() => setIdSeed(100));
  afterEach(() => resetIdGenerator());

  describe('Door CRUD & Commands', () => {
    it('adds, moves, updates, and removes a door reversibly', () => {
      const building = makeTestBuilding();
      const editor = new EditorEngine(building);
      const floorId = building.floors[0]!.id;

      // 1. Add Door
      editor.execute(new AddDoorCommand(floorId, {
        floorId,
        wallId: 'wall-1',
        position: { x: 2000, y: 1000 },
        width: 900,
        height: 2100,
        type: DoorType.Single,
        connectsRooms: ['room-1', ''],
      }));

      const floorWithDoor = editor.getBuilding().floors[0]!;
      expect(floorWithDoor.doors.length).toBe(1);
      const doorId = floorWithDoor.doors[0]!.id;
      expect(floorWithDoor.doors[0]!.position).toEqual({ x: 2000, y: 1000 });

      // 2. Move Door
      editor.execute(new MoveDoorCommand(doorId, { x: 2500, y: 1000 }));
      expect(editor.getBuilding().floors[0]!.doors[0]!.position).toEqual({ x: 2500, y: 1000 });

      editor.undo();
      expect(editor.getBuilding().floors[0]!.doors[0]!.position).toEqual({ x: 2000, y: 1000 });

      editor.redo();
      expect(editor.getBuilding().floors[0]!.doors[0]!.position).toEqual({ x: 2500, y: 1000 });

      // 3. Update Door Properties
      editor.execute(new UpdateDoorPropertiesCommand(doorId, { width: 1000, type: DoorType.Double }));
      expect(editor.getBuilding().floors[0]!.doors[0]!.width).toBe(1000);
      expect(editor.getBuilding().floors[0]!.doors[0]!.type).toBe(DoorType.Double);

      editor.undo();
      expect(editor.getBuilding().floors[0]!.doors[0]!.width).toBe(900);

      // 4. Remove Door
      editor.execute(new RemoveDoorCommand(doorId));
      expect(editor.getBuilding().floors[0]!.doors.length).toBe(0);

      editor.undo();
      expect(editor.getBuilding().floors[0]!.doors.length).toBe(1);
    });
  });

  describe('Window CRUD & Commands', () => {
    it('adds, moves, updates, and removes a window reversibly', () => {
      const building = makeTestBuilding();
      const editor = new EditorEngine(building);
      const floorId = building.floors[0]!.id;

      // 1. Add Window
      editor.execute(new AddWindowCommand(floorId, {
        floorId,
        wallId: 'wall-ext',
        position: { x: 3000, y: 1000 },
        width: 1200,
        height: 1200,
        sillHeight: 900,
        type: WindowType.Sliding,
        roomId: building.floors[0]!.rooms[0]!.id,
      }));

      const floorWithWin = editor.getBuilding().floors[0]!;
      expect(floorWithWin.windows.length).toBe(1);
      const windowId = floorWithWin.windows[0]!.id;

      // 2. Move Window
      editor.execute(new MoveWindowCommand(windowId, { x: 3500, y: 1000 }));
      expect(editor.getBuilding().floors[0]!.windows[0]!.position).toEqual({ x: 3500, y: 1000 });

      editor.undo();
      expect(editor.getBuilding().floors[0]!.windows[0]!.position).toEqual({ x: 3000, y: 1000 });

      // 3. Update Window Properties
      editor.execute(new UpdateWindowPropertiesCommand(windowId, { width: 1500, sillHeight: 1000 }));
      expect(editor.getBuilding().floors[0]!.windows[0]!.width).toBe(1500);
      expect(editor.getBuilding().floors[0]!.windows[0]!.sillHeight).toBe(1000);

      editor.undo();
      expect(editor.getBuilding().floors[0]!.windows[0]!.width).toBe(1200);

      // 4. Remove Window
      editor.execute(new RemoveWindowCommand(windowId));
      expect(editor.getBuilding().floors[0]!.windows.length).toBe(0);

      editor.undo();
      expect(editor.getBuilding().floors[0]!.windows.length).toBe(1);
    });
  });

  describe('Polymorphic DeleteEntityCommand', () => {
    it('deletes a room reversibly', () => {
      const building = makeTestBuilding();
      const editor = new EditorEngine(building);
      const roomId = building.floors[0]!.rooms[0]!.id;

      editor.execute(new DeleteEntityCommand('room', roomId));
      expect(editor.getBuilding().floors[0]!.rooms.length).toBe(0);

      editor.undo();
      expect(editor.getBuilding().floors[0]!.rooms.length).toBe(1);
      expect(editor.getBuilding().floors[0]!.rooms[0]!.name).toBe('Living Room');
    });

    it('deletes a door reversibly', () => {
      let building = makeTestBuilding();
      const floorId = building.floors[0]!.id;
      building = addDoor(building, floorId, {
        floorId,
        wallId: 'w1',
        position: { x: 2000, y: 1000 },
        width: 900,
        height: 2100,
        type: DoorType.Single,
        connectsRooms: ['', ''],
      });

      const editor = new EditorEngine(building);
      const doorId = building.floors[0]!.doors[0]!.id;

      editor.execute(new DeleteEntityCommand('door', doorId));
      expect(editor.getBuilding().floors[0]!.doors.length).toBe(0);

      editor.undo();
      expect(editor.getBuilding().floors[0]!.doors.length).toBe(1);
    });

    it('deletes a column reversibly', () => {
      let building = makeTestBuilding();
      const floorId = building.floors[0]!.id;
      building = addColumn(building, floorId, {
        floorId,
        position: { x: 1000, y: 1000 },
        width: 230,
        depth: 230,
        shape: ColumnShape.Rectangular,
        isStructural: true,
      });

      const editor = new EditorEngine(building);
      const columnId = building.floors[0]!.columns[0]!.id;

      editor.execute(new DeleteEntityCommand('column', columnId));
      expect(editor.getBuilding().floors[0]!.columns.length).toBe(0);

      editor.undo();
      expect(editor.getBuilding().floors[0]!.columns.length).toBe(1);
    });

    it('deletes a stair reversibly', () => {
      let building = makeTestBuilding();
      const floorId = building.floors[0]!.id;
      building = addStair(building, floorId, {
        floorId,
        type: StairType.Straight,
        x: 5000,
        y: 1000,
        width: 1000,
        length: 3000,
        direction: Direction.North,
        riserCount: 15,
        riserHeight: 180,
        treadDepth: 250,
        connectsFloors: [0, 1],
      });

      const editor = new EditorEngine(building);
      const stairId = building.floors[0]!.stairs[0]!.id;

      editor.execute(new DeleteEntityCommand('stair', stairId));
      expect(editor.getBuilding().floors[0]!.stairs.length).toBe(0);

      editor.undo();
      expect(editor.getBuilding().floors[0]!.stairs.length).toBe(1);
    });
  });
});
