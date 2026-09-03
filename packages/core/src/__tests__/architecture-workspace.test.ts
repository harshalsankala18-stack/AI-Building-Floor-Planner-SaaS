import { describe, expect, it } from 'vitest';
import {
  EditorEngine,
  SelectEntityCommand,
  SetSelectionsCommand,
  ClearSelectionCommand,
  UpdateRoomGeometryCommand,
  RoomType,
  addRoom,
  createBuilding,
} from '../index';

function fixture() {
  let building = createBuilding({ projectId: 'workspace', name: 'Workspace', site: { plotWidth: 12000, plotDepth: 16000 }, floors: [{ buildingId: '', level: 0 }] });
  const floorId = building.floors[0]!.id;
  building = addRoom(building, floorId, { floorId, type: RoomType.Living, name: 'Living', x: 1000, y: 1000, width: 4000, height: 4000 });
  return building;
}

describe('professional architecture workspace commands', () => {
  it.each(['room', 'wall', 'door', 'window', 'stair'] as const)('selects %s metadata without mutating the Building', entityType => {
    const building = fixture();
    const editor = new EditorEngine(building);
    editor.execute(new SelectEntityCommand({ entityType, entityId: `${entityType}-id`, floorId: building.floors[0]!.id }));
    expect(editor.getState().selection).toMatchObject({ entityType, entityId: `${entityType}-id` });
    expect(editor.getBuilding()).toBe(building);
  });

  it('supports deterministic multi-selection and clear selection', () => {
    const editor = new EditorEngine(fixture());
    const floorId = editor.getBuilding().floors[0]!.id;
    editor.execute(new SetSelectionsCommand([
      { entityType: 'room', entityId: 'room-a', floorId },
      { entityType: 'door', entityId: 'door-b', floorId },
    ]));
    expect(editor.getState().selections).toHaveLength(2);
    expect(editor.getState().selection?.entityId).toBe('door-b');
    editor.execute(new ClearSelectionCommand());
    expect(editor.getState().selection).toBeNull();
    expect(editor.getState().selections).toEqual([]);
  });

  it('commits move and resize as one exact undo/redo transaction', () => {
    const editor = new EditorEngine(fixture());
    const room = editor.getBuilding().floors[0]!.rooms[0]!;
    editor.execute(new UpdateRoomGeometryCommand(room.id, { x: 1800, y: 2200, width: 3600, height: 4200 }, room.name));
    expect(editor.getState().historySummary.undoCount).toBe(1);
    expect(editor.getBuilding().floors[0]!.rooms[0]).toMatchObject({ x: 1800, y: 2200, width: 3600, height: 4200, area: 15_120_000 });
    editor.undo();
    expect(editor.getBuilding().floors[0]!.rooms[0]).toMatchObject({ x: 1000, y: 1000, width: 4000, height: 4000 });
    editor.redo();
    expect(editor.getBuilding().floors[0]!.rooms[0]).toMatchObject({ x: 1800, y: 2200, width: 3600, height: 4200 });
  });
});
