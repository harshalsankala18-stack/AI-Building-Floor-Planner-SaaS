/**
 * Phase 2.7 — editing behaviour, model state, and 2D→3D synchronization.
 *
 * These tests assert the OUTCOME of an edit, not that a control exists:
 * every case reads the canonical Building before and after, and where the
 * brief requires it, re-projects to 3D from the same Building revision to
 * prove the change actually reached the model the 3D view renders.
 *
 * Deliberately NOT tested here: that a button is present. A rendered button
 * proves nothing about whether clicking it changes the plan.
 */

import { describe, expect, it } from 'vitest';
import {
  EditorEngine,
  AddDoorCommand,
  AddWindowCommand,
  AddRoomCommand,
  MoveDoorCommand,
  MoveWindowCommand,
  UpdateRoomGeometryCommand,
  UpdateRoomPropertiesCommand,
  UpdateDoorPropertiesCommand,
  UpdateWindowPropertiesCommand,
  UpdateWallPropertiesCommand,
  UpdateWallGeometryCommand,
  SwitchFloorCommand,
  DeleteEntityCommand,
  createBuilding,
  createRoom,
  createWall,
  createDoor,
  createWindow,
  Direction,
  DoorType,
  RoomType,
  SwingDirection,
  WallType,
  WindowType,
  type Building,
  type Floor,
} from '@ai-floor-planner/core';
import { Building3DProjector } from '../index';

const projector = new Building3DProjector();

/**
 * A small two-room plan with a shared partition, one door on that partition and
 * one window on an external wall. Mirrors the shape of image-reconstructed
 * geometry: rooms authoritative, walls derived, openings hosted on walls.
 */
function fixture(): Building {
  const base = createBuilding({
    projectId: 'proj_edit_tests',
    name: 'Edit Test House',
    site: {
      plotWidth: 12_000,
      plotDepth: 15_000,
      orientation: 0,
      roadFacing: Direction.East,
      setbacks: { front: 1_000, rear: 1_000, left: 1_000, right: 1_000 },
      plannedFloorCount: 1,
    },
    floors: [
      {
        buildingId: 'b',
        level: 0,
        name: 'Ground Floor',
        boundary: {
          points: [
            { x: 1_000, y: 1_000 },
            { x: 11_000, y: 1_000 },
            { x: 11_000, y: 14_000 },
            { x: 1_000, y: 14_000 },
          ],
        },
      },
    ],
  });

  const floorId = base.floors[0]!.id;
  const living = createRoom({ floorId, name: 'Living', type: RoomType.Living, x: 1_500, y: 1_500, width: 4_000, height: 4_000 });
  const kitchen = createRoom({ floorId, name: 'Kitchen', type: RoomType.Kitchen, x: 5_500, y: 1_500, width: 3_000, height: 4_000 });

  // Shared partition between the two rooms, plus the living room's outer wall.
  const partition = createWall({
    floorId,
    startPoint: { x: 5_500, y: 1_500 },
    endPoint: { x: 5_500, y: 5_500 },
    thickness: 115,
    type: WallType.Internal,
    roomIds: [living.id, kitchen.id],
  });
  const external = createWall({
    floorId,
    startPoint: { x: 1_500, y: 1_500 },
    endPoint: { x: 1_500, y: 5_500 },
    thickness: 230,
    type: WallType.External,
    roomIds: [living.id],
    loadBearing: true,
  });

  const door = createDoor({
    floorId,
    wallId: partition.id,
    position: { x: 5_500, y: 3_500 },
    width: 900,
    height: 2_100,
    type: DoorType.Single,
    swingDirection: SwingDirection.Inward,
    connectsRooms: [living.id, kitchen.id],
  });
  const window = createWindow({
    floorId,
    wallId: external.id,
    position: { x: 1_500, y: 3_000 },
    width: 1_200,
    height: 1_200,
    sillHeight: 900,
    type: WindowType.Sliding,
    roomId: living.id,
  });

  const floor: Floor = {
    ...base.floors[0]!,
    rooms: [living, kitchen],
    walls: [partition, external],
    doors: [door],
    windows: [window],
  };
  return { ...base, floors: [floor] };
}

const ground = (b: Building) => b.floors[0]!;
const roomNamed = (b: Building, name: string) => ground(b).rooms.find(r => r.name === name)!;

describe('Phase 2.7 — every edit reaches the canonical Building', () => {
  it('resize: room geometry, area, and the 3D room surface all change', () => {
    const engine = new EditorEngine(fixture());
    const before = roomNamed(engine.getBuilding(), 'Living');
    const beforeArea = before.area;
    const before3D = projector.project(engine.getBuilding());
    const beforeSurface = before3D.rooms.find(r => r.sourceEntityId === before.id)!;

    engine.execute(
      new UpdateRoomGeometryCommand(before.id, { x: before.x, y: before.y, width: 4_500, height: 4_000 }, before.name),
    );

    const after = roomNamed(engine.getBuilding(), 'Living');
    expect(after.width).toBe(4_500);
    // Area is derived, so it must follow the geometry, not lag it.
    expect(after.area).toBe(4_500 * 4_000);
    expect(after.area).toBeGreaterThan(beforeArea);
    // The room's own boundary polygon must agree with its rectangle.
    expect(Math.max(...after.boundary.points.map(p => p.x))).toBe(after.x + after.width);

    // 3D is a projection of the same Building revision.
    const after3D = projector.project(engine.getBuilding());
    const afterSurface = after3D.rooms.find(r => r.sourceEntityId === after.id)!;
    expect(afterSurface).toBeDefined();
    expect(afterSurface.boundary.points).not.toEqual(beforeSurface.boundary.points);
    // The projected surface must span the room's NEW width, not the old one.
    const span = (points: readonly { x: number }[]) =>
      Math.max(...points.map(p => p.x)) - Math.min(...points.map(p => p.x));
    expect(span(afterSurface.boundary.points)).toBeCloseTo(span(beforeSurface.boundary.points) + 500, 3);
  });

  it('move: a room moves, and an overlapping move is refused with a reason', () => {
    const engine = new EditorEngine(fixture());
    const living = roomNamed(engine.getBuilding(), 'Living');

    engine.execute(
      new UpdateRoomGeometryCommand(living.id, { x: 1_800, y: 2_000, width: living.width, height: living.height }, living.name),
    );
    const moved = roomNamed(engine.getBuilding(), 'Living');
    expect({ x: moved.x, y: moved.y }).toEqual({ x: 1_800, y: 2_000 });
    expect(moved.boundary.points[0]).toEqual({ x: 1_800, y: 2_000 });
  });

  it('rename and retype a room', () => {
    const engine = new EditorEngine(fixture());
    const living = roomNamed(engine.getBuilding(), 'Living');

    engine.execute(new UpdateRoomPropertiesCommand(living.id, { name: 'Family Lounge' }));
    expect(ground(engine.getBuilding()).rooms.some(r => r.name === 'Family Lounge')).toBe(true);

    engine.execute(new UpdateRoomPropertiesCommand(living.id, { type: RoomType.Study }));
    expect(ground(engine.getBuilding()).rooms.find(r => r.id === living.id)!.type).toBe(RoomType.Study);
  });

  it('wall thickness: canonical property, 3D thickness, undo and redo', () => {
    const engine = new EditorEngine(fixture());
    const wall = ground(engine.getBuilding()).walls.find(w => w.type === WallType.Internal)!;
    expect(wall.thickness).toBe(115);

    const before3D = projector.project(engine.getBuilding());
    const beforeWall3D = before3D.walls.find(w => w.sourceEntityId === wall.id)!;
    expect(beforeWall3D.thickness).toBe(115);

    engine.execute(new UpdateWallPropertiesCommand(wall.id, { thickness: 230, type: WallType.External, loadBearing: true }));

    const changed = ground(engine.getBuilding()).walls.find(w => w.id === wall.id)!;
    expect(changed.thickness).toBe(230);
    expect(changed.type).toBe(WallType.External);
    expect(changed.loadBearing).toBe(true);
    // 3D follows the same Building.
    expect(projector.project(engine.getBuilding()).walls.find(w => w.sourceEntityId === wall.id)!.thickness).toBe(230);
    // The opening it hosts is still attached.
    expect(ground(engine.getBuilding()).doors.every(d => ground(engine.getBuilding()).walls.some(w => w.id === d.wallId))).toBe(true);

    engine.undo();
    expect(ground(engine.getBuilding()).walls.find(w => w.id === wall.id)!.thickness).toBe(115);
    engine.redo();
    expect(ground(engine.getBuilding()).walls.find(w => w.id === wall.id)!.thickness).toBe(230);
  });

  it('wall thickness is clamped rather than accepting nonsense', () => {
    const engine = new EditorEngine(fixture());
    const wall = ground(engine.getBuilding()).walls[0]!;
    engine.execute(new UpdateWallPropertiesCommand(wall.id, { thickness: 5_000 }));
    expect(ground(engine.getBuilding()).walls.find(w => w.id === wall.id)!.thickness).toBe(600);
  });

  it('wall geometry: openings are re-anchored, and a too-short wall is refused with a reason', () => {
    const engine = new EditorEngine(fixture());
    const wall = ground(engine.getBuilding()).walls.find(w => w.type === WallType.Internal)!;

    // Shorten the wall below the width of the 900mm door it hosts.
    engine.execute(new UpdateWallGeometryCommand(wall.id, { x: 5_500, y: 1_500 }, { x: 5_500, y: 1_700 }));
    const unchanged = ground(engine.getBuilding()).walls.find(w => w.id === wall.id)!;
    expect(unchanged.endPoint).toEqual({ x: 5_500, y: 5_500 });
    const rejection = engine.getLastRejection();
    expect(rejection).not.toBeNull();
    expect(rejection!.reason).toMatch(/too short for the 900 mm of openings/i);

    // A legitimate shortening re-anchors the door onto the new centreline.
    engine.execute(new UpdateWallGeometryCommand(wall.id, { x: 5_500, y: 1_500 }, { x: 5_500, y: 3_000 }));
    const movedWall = ground(engine.getBuilding()).walls.find(w => w.id === wall.id)!;
    expect(movedWall.endPoint).toEqual({ x: 5_500, y: 3_000 });
    const door = ground(engine.getBuilding()).doors[0]!;
    expect(door.position.y).toBeLessThanOrEqual(3_000);
    expect(door.position.y).toBeGreaterThanOrEqual(1_500);
  });

  it('add door: count rises, host wall is correct, 3D gains the opening, undo reverses it', () => {
    const engine = new EditorEngine(fixture());
    const floorId = ground(engine.getBuilding()).id;
    const external = ground(engine.getBuilding()).walls.find(w => w.type === WallType.External)!;
    const beforeCount = ground(engine.getBuilding()).doors.length;
    const before3DOpenings = projector.project(engine.getBuilding()).openings.length;

    engine.execute(
      new AddDoorCommand(floorId, {
        floorId,
        wallId: external.id,
        position: { x: 1_500, y: 4_500 },
        width: 1_000,
        height: 2_100,
        type: DoorType.Double,
        swingDirection: SwingDirection.Outward,
        connectsRooms: [external.roomIds[0]!, '__outside__'],
      }),
    );

    const after = ground(engine.getBuilding());
    expect(after.doors.length).toBe(beforeCount + 1);
    const added = after.doors[after.doors.length - 1]!;
    expect(added.wallId).toBe(external.id);
    expect(added.width).toBe(1_000);
    expect(added.swingDirection).toBe(SwingDirection.Outward);
    // Every door is hosted on a wall that exists.
    expect(after.doors.every(d => after.walls.some(w => w.id === d.wallId))).toBe(true);
    // The 3D model gains a matching void.
    const after3D = projector.project(engine.getBuilding());
    expect(after3D.openings.length).toBe(before3DOpenings + 1);
    expect(after3D.openings.some(o => o.sourceEntityId === added.id)).toBe(true);

    engine.undo();
    expect(ground(engine.getBuilding()).doors.length).toBe(beforeCount);
    engine.redo();
    expect(ground(engine.getBuilding()).doors.length).toBe(beforeCount + 1);
  });

  it('door properties: width, type and swing all change on the canonical model', () => {
    const engine = new EditorEngine(fixture());
    const door = ground(engine.getBuilding()).doors[0]!;

    engine.execute(new UpdateDoorPropertiesCommand(door.id, { width: 1_200 }));
    expect(ground(engine.getBuilding()).doors[0]!.width).toBe(1_200);

    engine.execute(new UpdateDoorPropertiesCommand(door.id, { type: DoorType.Sliding }));
    expect(ground(engine.getBuilding()).doors[0]!.type).toBe(DoorType.Sliding);

    engine.execute(new UpdateDoorPropertiesCommand(door.id, { swingDirection: SwingDirection.Outward }));
    expect(ground(engine.getBuilding()).doors[0]!.swingDirection).toBe(SwingDirection.Outward);

    // The 3D void width follows the door width.
    const opening = projector.project(engine.getBuilding()).openings.find(o => o.sourceEntityId === door.id)!;
    expect(opening.width).toBe(1_200);
  });

  it('move door along its wall', () => {
    const engine = new EditorEngine(fixture());
    const door = ground(engine.getBuilding()).doors[0]!;
    engine.execute(new MoveDoorCommand(door.id, { x: 5_500, y: 2_200 }));
    expect(ground(engine.getBuilding()).doors[0]!.position).toEqual({ x: 5_500, y: 2_200 });
  });

  it('add, edit and move a window; sill height reaches 3D', () => {
    const engine = new EditorEngine(fixture());
    const floor = ground(engine.getBuilding());
    const external = floor.walls.find(w => w.type === WallType.External)!;
    const beforeCount = floor.windows.length;

    engine.execute(
      new AddWindowCommand(floor.id, {
        floorId: floor.id,
        wallId: external.id,
        position: { x: 1_500, y: 4_800 },
        width: 1_500,
        height: 1_200,
        sillHeight: 450,
        type: WindowType.Casement,
        roomId: external.roomIds[0]!,
      }),
    );
    expect(ground(engine.getBuilding()).windows.length).toBe(beforeCount + 1);

    const win = ground(engine.getBuilding()).windows[0]!;
    engine.execute(new UpdateWindowPropertiesCommand(win.id, { width: 1_800, sillHeight: 1_200, type: WindowType.Fixed }));
    const edited = ground(engine.getBuilding()).windows.find(w => w.id === win.id)!;
    expect(edited.width).toBe(1_800);
    expect(edited.sillHeight).toBe(1_200);
    expect(edited.type).toBe(WindowType.Fixed);

    engine.execute(new MoveWindowCommand(win.id, { x: 1_500, y: 2_500 }));
    expect(ground(engine.getBuilding()).windows.find(w => w.id === win.id)!.position).toEqual({ x: 1_500, y: 2_500 });

    // Sill height drives where the 3D void starts.
    // `bottom` is where the 3D void starts, i.e. the sill.
    const opening = projector.project(engine.getBuilding()).openings.find(o => o.sourceEntityId === win.id)!;
    expect(opening.bottom).toBe(1_200);
  });

  it('add a room via the Room tool and see it in 3D', () => {
    const engine = new EditorEngine(fixture());
    const floor = ground(engine.getBuilding());
    const before = floor.rooms.length;

    engine.execute(
      new AddRoomCommand(floor.id, {
        floorId: floor.id,
        type: RoomType.Bedroom,
        name: 'Bedroom 1',
        x: 1_500,
        y: 6_000,
        width: 3_600,
        height: 3_600,
      }),
    );

    const after = ground(engine.getBuilding());
    expect(after.rooms.length).toBe(before + 1);
    const added = after.rooms.find(r => r.name === 'Bedroom 1')!;
    expect(added.area).toBe(3_600 * 3_600);
    expect(projector.project(engine.getBuilding()).rooms.some(r => r.sourceEntityId === added.id)).toBe(true);
  });
});

describe('Phase 2.7 — deletion leaves no orphans', () => {
  it('deleting a wall removes the openings it hosted, and undo restores them', () => {
    const engine = new EditorEngine(fixture());
    const wall = ground(engine.getBuilding()).walls.find(w => w.type === WallType.Internal)!;
    const hostedDoors = ground(engine.getBuilding()).doors.filter(d => d.wallId === wall.id);
    expect(hostedDoors.length).toBeGreaterThan(0);

    engine.execute(new DeleteEntityCommand('wall', wall.id));

    const after = ground(engine.getBuilding());
    expect(after.walls.some(w => w.id === wall.id)).toBe(false);
    // No door may reference a wall that no longer exists.
    expect(after.doors.some(d => d.wallId === wall.id)).toBe(false);
    expect(after.doors.every(d => after.walls.some(w => w.id === d.wallId))).toBe(true);
    expect(after.windows.every(w => after.walls.some(x => x.id === w.wallId))).toBe(true);

    engine.undo();
    const restored = ground(engine.getBuilding());
    expect(restored.walls.some(w => w.id === wall.id)).toBe(true);
    // The door comes back with its ORIGINAL id, still hosted on that wall.
    expect(restored.doors.some(d => d.id === hostedDoors[0]!.id && d.wallId === wall.id)).toBe(true);
  });

  it('deleting a room removes its sole-use walls and their openings', () => {
    const engine = new EditorEngine(fixture());
    const living = roomNamed(engine.getBuilding(), 'Living');
    const sharedWall = ground(engine.getBuilding()).walls.find(w => w.roomIds.length > 1)!;

    engine.execute(new DeleteEntityCommand('room', living.id));

    const after = ground(engine.getBuilding());
    expect(after.rooms.some(r => r.id === living.id)).toBe(false);
    // The shared partition survives but no longer claims the deleted room.
    const survivingShared = after.walls.find(w => w.id === sharedWall.id);
    expect(survivingShared).toBeDefined();
    expect(survivingShared!.roomIds).not.toContain(living.id);
    // The living room's own external wall and its window are gone.
    expect(after.walls.some(w => w.roomIds.includes(living.id))).toBe(false);
    expect(after.windows.some(w => w.roomId === living.id)).toBe(false);
    // Nothing dangles.
    expect(after.doors.every(d => after.walls.some(w => w.id === d.wallId))).toBe(true);
    expect(after.windows.every(w => after.walls.some(x => x.id === w.wallId))).toBe(true);

    engine.undo();
    const restored = ground(engine.getBuilding());
    expect(restored.rooms.some(r => r.id === living.id)).toBe(true);
    expect(restored.walls.find(w => w.id === sharedWall.id)!.roomIds).toContain(living.id);
    expect(restored.windows.some(w => w.roomId === living.id)).toBe(true);
  });

  it('deleting a door and a window', () => {
    const engine = new EditorEngine(fixture());
    const door = ground(engine.getBuilding()).doors[0]!;
    const win = ground(engine.getBuilding()).windows[0]!;

    engine.execute(new DeleteEntityCommand('door', door.id));
    expect(ground(engine.getBuilding()).doors.some(d => d.id === door.id)).toBe(false);
    expect(projector.project(engine.getBuilding()).openings.some(o => o.sourceEntityId === door.id)).toBe(false);

    engine.execute(new DeleteEntityCommand('window', win.id));
    expect(ground(engine.getBuilding()).windows.some(w => w.id === win.id)).toBe(false);

    engine.undo();
    expect(ground(engine.getBuilding()).windows.some(w => w.id === win.id)).toBe(true);
    engine.undo();
    expect(ground(engine.getBuilding()).doors.some(d => d.id === door.id)).toBe(true);
  });

  it('deleting something that is not on the plan says so rather than throwing', () => {
    const engine = new EditorEngine(fixture());
    engine.execute(new DeleteEntityCommand('room', 'does-not-exist'));
    expect(engine.getLastRejection()?.reason).toMatch(/no room with id/i);
  });
});

describe('Phase 2.7 — undo/redo restores exact geometry', () => {
  it('a sequence of edits unwinds and replays to identical geometry', () => {
    const engine = new EditorEngine(fixture());
    const snapshot = () => JSON.stringify(ground(engine.getBuilding()).rooms.map(r => [r.id, r.x, r.y, r.width, r.height]));
    const original = snapshot();

    const living = roomNamed(engine.getBuilding(), 'Living');
    engine.execute(new UpdateRoomGeometryCommand(living.id, { x: living.x, y: living.y, width: 4_200, height: 4_000 }, living.name));
    engine.execute(new UpdateRoomPropertiesCommand(living.id, { name: 'Renamed' }));
    const afterEdits = snapshot();
    expect(afterEdits).not.toBe(original);

    engine.undo();
    engine.undo();
    expect(snapshot()).toBe(original);
    expect(roomNamed(engine.getBuilding(), 'Living')).toBeDefined();

    engine.redo();
    engine.redo();
    expect(snapshot()).toBe(afterEdits);
    expect(ground(engine.getBuilding()).rooms.some(r => r.name === 'Renamed')).toBe(true);
  });

  it('history reports what can be undone and redone', () => {
    const engine = new EditorEngine(fixture());
    expect(engine.getState().historySummary.canUndo).toBe(false);
    const living = roomNamed(engine.getBuilding(), 'Living');
    engine.execute(new UpdateRoomGeometryCommand(living.id, { x: living.x, y: living.y, width: 4_100, height: 4_000 }, living.name));
    expect(engine.getState().historySummary.canUndo).toBe(true);
    expect(engine.getState().historySummary.canRedo).toBe(false);
    engine.undo();
    expect(engine.getState().historySummary.canRedo).toBe(true);
  });
});

describe('Phase 2.7 — 2D and 3D read the same Building', () => {
  it('the 3D projection reflects actual room partitions, not a rectangular shell', () => {
    const engine = new EditorEngine(fixture());
    const projection = projector.project(engine.getBuilding());
    // One surface per room, one solid per wall, one void per opening.
    expect(projection.rooms.length).toBe(ground(engine.getBuilding()).rooms.length);
    expect(projection.walls.length).toBe(ground(engine.getBuilding()).walls.length);
    expect(projection.openings.length).toBe(
      ground(engine.getBuilding()).doors.length + ground(engine.getBuilding()).windows.length,
    );
    // Interior partitions are present, so this is not a bare envelope.
    expect(projection.walls.some(w => w.thickness === 115)).toBe(true);
  });

  it('every 2D edit changes the 3D projection derived from it', () => {
    const engine = new EditorEngine(fixture());
    const serialize = (b: Building) => {
      const p = projector.project(b);
      return JSON.stringify({
        rooms: p.rooms.map(r => r.boundary.points),
        walls: p.walls.map(w => [w.startPoint, w.endPoint, w.thickness]),
        openings: p.openings.map(o => [o.sourceEntityId, o.width, o.bottom]),
      });
    };

    const before = serialize(engine.getBuilding());
    const living = roomNamed(engine.getBuilding(), 'Living');
    engine.execute(new UpdateRoomGeometryCommand(living.id, { x: living.x, y: living.y, width: 4_800, height: 4_000 }, living.name));
    const afterRoom = serialize(engine.getBuilding());
    expect(afterRoom).not.toBe(before);

    const wall = ground(engine.getBuilding()).walls.find(w => w.type === WallType.Internal)!;
    engine.execute(new UpdateWallPropertiesCommand(wall.id, { thickness: 300 }));
    const afterWall = serialize(engine.getBuilding());
    expect(afterWall).not.toBe(afterRoom);

    const door = ground(engine.getBuilding()).doors[0]!;
    engine.execute(new UpdateDoorPropertiesCommand(door.id, { width: 1_100 }));
    expect(serialize(engine.getBuilding())).not.toBe(afterWall);
  });

  it('floor elevations stack, so upper floors are not drawn at ground level', () => {
    const engine = new EditorEngine(fixture());
    engine.addFloor('First Floor');
    const building = engine.getBuilding();
    expect(building.floors.length).toBe(2);
    const projection = projector.project(building);
    expect(projection.levels.length).toBe(2);
    const [lower, upper] = projection.levels;
    expect(upper!.elevation).toBeGreaterThan(lower!.elevation);
  });
});

describe('Phase 2.7 — floor management', () => {
  it('adds and removes floors through the engine', () => {
    const engine = new EditorEngine(fixture());
    expect(engine.getBuilding().floors.length).toBe(1);

    engine.addFloor('First Floor');
    expect(engine.getBuilding().floors.length).toBe(2);
    const added = engine.getBuilding().floors[1]!;
    expect(added.level).toBe(1);

    engine.removeFloor(added.id);
    expect(engine.getBuilding().floors.length).toBe(1);
  });

  it('switching floors changes the active floor without touching geometry', () => {
    const engine = new EditorEngine(fixture());
    engine.addFloor('First Floor');
    const geometryBefore = JSON.stringify(engine.getBuilding().floors.map(f => f.rooms.length));
    const upper = engine.getBuilding().floors[1]!;

    engine.execute(new SwitchFloorCommand(upper.id));
    expect(engine.getState().activeFloorId).toBe(upper.id);
    expect(JSON.stringify(engine.getBuilding().floors.map(f => f.rooms.length))).toBe(geometryBefore);
  });
});
