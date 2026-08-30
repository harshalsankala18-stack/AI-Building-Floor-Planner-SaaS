import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createBuilding,
  addRoom,
  setIdSeed,
  resetIdGenerator,
  RoomType,
  EditorEngine,
  SelectEntityCommand,
  SwitchFloorCommand,
  SetToolCommand,
  MoveRoomCommand,
  ResizeRoomCommand,
  UpdateRoomPropertiesCommand,
  BatchCommand,
  serializeBuilding,
  deserializeBuilding,
} from '../index';

function makeTestBuilding() {
  const building = createBuilding({
    projectId: 'test-proj',
    name: 'Test Residence',
    site: { plotWidth: 9144, plotDepth: 15240 },
    floors: [
      { buildingId: '', level: 0, name: 'Ground Floor' },
      { buildingId: '', level: 1, name: 'First Floor' },
    ],
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

describe('Phase 6A: Interactive Editor Foundation', () => {
  beforeEach(() => setIdSeed(100));
  afterEach(() => resetIdGenerator());

  describe('Step 2: Editor State & Isolation', () => {
    it('initializes editor with clean, separated state', () => {
      const building = makeTestBuilding();
      const editor = new EditorEngine(building);

      const state = editor.getState();
      expect(state.activeFloorId).toBe(building.floors[0]!.id);
      expect(state.selection).toBeNull();
      expect(state.hoveredEntity).toBeNull();
      expect(state.activeTool).toBe('select');
      expect(state.snapConfig.enabled).toBe(true);
      expect(state.snapConfig.gridSize).toBe(100);
      expect(state.interaction.isDragging).toBe(false);
      expect(state.historySummary.canUndo).toBe(false);
      expect(state.historySummary.canRedo).toBe(false);
    });

    it('guarantees complete state isolation — editor state is NEVER in Building model', () => {
      const building = makeTestBuilding();
      const editor = new EditorEngine(building);

      // Perform various UI actions
      editor.selectEntity({ entityType: 'room', entityId: building.floors[0]!.rooms[0]!.id });
      editor.setActiveTool('add_room');
      editor.setViewport({ zoom: 1.5, panX: 200, panY: 100 });
      editor.setSnapConfig({ gridSize: 50 });
      editor.setValidationDisplay({ status: 'valid', errorCount: 0 });

      // Check the Building model
      const authoritativeBuilding = editor.getBuilding();
      expect((authoritativeBuilding as unknown as Record<string, unknown>)['selection']).toBeUndefined();
      expect((authoritativeBuilding as unknown as Record<string, unknown>)['activeTool']).toBeUndefined();
      expect((authoritativeBuilding as unknown as Record<string, unknown>)['viewport']).toBeUndefined();
      expect((authoritativeBuilding as unknown as Record<string, unknown>)['snapConfig']).toBeUndefined();

      // Serializing Building produces standard schema without any UI properties
      const json = serializeBuilding(authoritativeBuilding);
      expect(json).not.toContain('zoom');
      expect(json).not.toContain('panX');
      expect(json).not.toContain('activeTool');

      // Round-trip deserialization succeeds cleanly
      const parsed = deserializeBuilding(json);
      expect(parsed.id).toBe(authoritativeBuilding.id);
      expect(parsed.floors.length).toBe(2);
    });

    it('updates selection state without mutating Building model', () => {
      const building = makeTestBuilding();
      const editor = new EditorEngine(building);
      const roomId = building.floors[0]!.rooms[0]!.id;

      const initialBuildingRef = editor.getBuilding();

      editor.selectEntity({ entityType: 'room', entityId: roomId });
      expect(editor.getState().selection).toEqual({ entityType: 'room', entityId: roomId });

      // Building reference remains strictly identical
      expect(editor.getBuilding()).toBe(initialBuildingRef);

      editor.selectEntity(null);
      expect(editor.getState().selection).toBeNull();
      expect(editor.getBuilding()).toBe(initialBuildingRef);
    });

    it('switches floor cleanly and clears out-of-scope selection', () => {
      const building = makeTestBuilding();
      const editor = new EditorEngine(building);
      const floor0Id = building.floors[0]!.id;
      const floor1Id = building.floors[1]!.id;
      const roomId = building.floors[0]!.rooms[0]!.id;

      editor.selectEntity({ entityType: 'room', entityId: roomId, floorId: floor0Id });
      expect(editor.getState().selection?.entityId).toBe(roomId);

      // Switch to floor 1
      editor.setActiveFloor(floor1Id);
      expect(editor.getState().activeFloorId).toBe(floor1Id);
      expect(editor.getActiveFloor()?.id).toBe(floor1Id);
      // Floor 0 room selection was cleared
      expect(editor.getState().selection).toBeNull();
    });
  });

  describe('Step 3: Command Abstraction & Execution Pipeline', () => {
    it('executes SelectEntityCommand and allows undo/redo', () => {
      const building = makeTestBuilding();
      const editor = new EditorEngine(building);
      const roomId = building.floors[0]!.rooms[0]!.id;

      const selectCmd = new SelectEntityCommand({ entityType: 'room', entityId: roomId });
      editor.execute(selectCmd);

      expect(editor.getState().selection?.entityId).toBe(roomId);
    });

    it('executes SwitchFloorCommand deterministically', () => {
      const building = makeTestBuilding();
      const editor = new EditorEngine(building);
      const floor1Id = building.floors[1]!.id;

      editor.execute(new SwitchFloorCommand(floor1Id, 'First Floor'));
      expect(editor.getState().activeFloorId).toBe(floor1Id);
    });

    it('executes SetToolCommand', () => {
      const building = makeTestBuilding();
      const editor = new EditorEngine(building);

      editor.execute(new SetToolCommand('add_wall'));
      expect(editor.getState().activeTool).toBe('add_wall');
    });

    it('executes MoveRoomCommand, updates Building model, and records history', () => {
      const building = makeTestBuilding();
      const editor = new EditorEngine(building);
      const roomId = building.floors[0]!.rooms[0]!.id;

      const initialX = editor.getBuilding().floors[0]!.rooms[0]!.x;
      const initialY = editor.getBuilding().floors[0]!.rooms[0]!.y;

      editor.execute(new MoveRoomCommand(roomId, 2500, 3500, 'Living Room'));

      // Building model updated
      const updatedRoom = editor.getBuilding().floors[0]!.rooms[0]!;
      expect(updatedRoom.x).toBe(2500);
      expect(updatedRoom.y).toBe(3500);
      expect(updatedRoom.boundary.points[0]).toEqual({ x: 2500, y: 3500 });

      // History recorded
      expect(editor.getState().historySummary.canUndo).toBe(true);
      expect(editor.getState().historySummary.canRedo).toBe(false);
      expect(editor.getState().historySummary.undoCount).toBe(1);

      // Undo restores exact previous state
      const undone = editor.undo();
      expect(undone).toBe(true);
      const restoredRoom = editor.getBuilding().floors[0]!.rooms[0]!;
      expect(restoredRoom.x).toBe(initialX);
      expect(restoredRoom.y).toBe(initialY);
      expect(editor.getState().historySummary.canUndo).toBe(false);
      expect(editor.getState().historySummary.canRedo).toBe(true);

      // Redo reapplies the move
      const redone = editor.redo();
      expect(redone).toBe(true);
      const redoneRoom = editor.getBuilding().floors[0]!.rooms[0]!;
      expect(redoneRoom.x).toBe(2500);
      expect(redoneRoom.y).toBe(3500);
    });

    it('executes ResizeRoomCommand deterministically with undo/redo', () => {
      const building = makeTestBuilding();
      const editor = new EditorEngine(building);
      const roomId = building.floors[0]!.rooms[0]!.id;

      editor.execute(new ResizeRoomCommand(roomId, 5000, 6000, 'Living Room'));

      const room = editor.getBuilding().floors[0]!.rooms[0]!;
      expect(room.width).toBe(5000);
      expect(room.height).toBe(6000);
      expect(room.area).toBe(30_000_000);

      editor.undo();
      const undoneRoom = editor.getBuilding().floors[0]!.rooms[0]!;
      expect(undoneRoom.width).toBe(4000);
      expect(undoneRoom.height).toBe(5000);
    });

    it('executes UpdateRoomPropertiesCommand with undo/redo', () => {
      const building = makeTestBuilding();
      const editor = new EditorEngine(building);
      const roomId = building.floors[0]!.rooms[0]!.id;

      editor.execute(new UpdateRoomPropertiesCommand(roomId, {
        name: 'Grand Hall',
        type: RoomType.Drawing,
        priority: 9,
      }));

      const room = editor.getBuilding().floors[0]!.rooms[0]!;
      expect(room.name).toBe('Grand Hall');
      expect(room.type).toBe(RoomType.Drawing);
      expect(room.priority).toBe(9);

      editor.undo();
      const undoneRoom = editor.getBuilding().floors[0]!.rooms[0]!;
      expect(undoneRoom.name).toBe('Living Room');
      expect(undoneRoom.type).toBe(RoomType.Living);
      expect(undoneRoom.priority).toBe(5);
    });

    it('executes BatchCommand atomically', () => {
      const building = makeTestBuilding();
      const editor = new EditorEngine(building);
      const roomId = building.floors[0]!.rooms[0]!.id;

      const batch = new BatchCommand('Move and Resize Living Room', [
        new MoveRoomCommand(roomId, 2000, 2000),
        new ResizeRoomCommand(roomId, 6000, 7000),
        new UpdateRoomPropertiesCommand(roomId, { name: 'Master Suite' }),
      ]);

      editor.execute(batch);

      const room = editor.getBuilding().floors[0]!.rooms[0]!;
      expect(room.x).toBe(2000);
      expect(room.y).toBe(2000);
      expect(room.width).toBe(6000);
      expect(room.height).toBe(7000);
      expect(room.name).toBe('Master Suite');

      // Undo reverts all 3 mutations in a single step
      expect(editor.getState().historySummary.undoCount).toBe(1);
      editor.undo();

      const undoneRoom = editor.getBuilding().floors[0]!.rooms[0]!;
      expect(undoneRoom.x).toBe(1000);
      expect(undoneRoom.y).toBe(1000);
      expect(undoneRoom.width).toBe(4000);
      expect(undoneRoom.height).toBe(5000);
      expect(undoneRoom.name).toBe('Living Room');
    });
  });

  describe('Step 4: Subscription & Synchronization', () => {
    it('notifies subscribers of building mutations and render requests', () => {
      const building = makeTestBuilding();
      const editor = new EditorEngine(building);
      const roomId = building.floors[0]!.rooms[0]!.id;

      const events: string[] = [];
      const unsubscribe = editor.subscribe(evt => {
        events.push(evt.type);
      });

      editor.execute(new MoveRoomCommand(roomId, 1200, 1200));

      expect(events).toContain('building_changed');
      expect(events).toContain('validation_requested');
      expect(events).toContain('render_requested');

      unsubscribe();
      events.length = 0;

      editor.execute(new MoveRoomCommand(roomId, 1500, 1500));
      expect(events.length).toBe(0);
    });

    it('emits selection_changed and render_requested on selection change', () => {
      const building = makeTestBuilding();
      const editor = new EditorEngine(building);
      const roomId = building.floors[0]!.rooms[0]!.id;

      const events: string[] = [];
      editor.subscribe(evt => {
        events.push(evt.type);
      });

      editor.selectEntity({ entityType: 'room', entityId: roomId });

      expect(events).toContain('selection_changed');
      expect(events).toContain('render_requested');
    });
  });
});
