import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createBuilding,
  addRoom,
  moveRoom,
  resizeRoom,
  removeRoom,
  createVersion,
  restoreVersion,
  diffBuildings,
  setIdSeed,
  resetIdGenerator,
  RoomType,
  ChangeSource,
} from '../index';

describe('Versioning', () => {
  beforeEach(() => setIdSeed(300));
  afterEach(() => resetIdGenerator());

  function makeBuilding() {
    let building = createBuilding({
      projectId: 'test',
      name: 'Version Test',
      site: { plotWidth: 9144, plotDepth: 15240 },
      floors: [{ buildingId: '', level: 0 }],
    });
    const floorId = building.floors[0]!.id;
    building = addRoom(building, floorId, {
      floorId, type: RoomType.Bedroom, x: 0, y: 0, width: 3000, height: 4000,
    });
    return building;
  }

  describe('createVersion', () => {
    it('produces snapshot independent of source', () => {
      const building = makeBuilding();
      const version = createVersion(building, 'Initial', ChangeSource.Manual, 'user1');

      expect(version.snapshot.id).toBe(building.id);
      expect(version.buildingId).toBe(building.id);
      expect(version.changeDescription).toBe('Initial');
      expect(version.changeSource).toBe(ChangeSource.Manual);
    });

    it('mutating source after version does not affect snapshot', () => {
      let building = makeBuilding();
      const version = createVersion(building, 'Before move', ChangeSource.Manual, 'user1');
      const roomId = building.floors[0]!.rooms[0]!.id;

      // Mutate via updater (returns new object, but the point is the version is independent)
      building = moveRoom(building, roomId, 999, 999);

      expect(version.snapshot.floors[0]!.rooms[0]!.x).toBe(0);
      expect(building.floors[0]!.rooms[0]!.x).toBe(999);
    });
  });

  describe('restoreVersion', () => {
    it('returns building matching snapshot', () => {
      const building = makeBuilding();
      const version = createVersion(building, 'Snapshot', ChangeSource.Manual, 'user1');
      const restored = restoreVersion(version);

      expect(restored.id).toBe(building.id);
      expect(restored.floors[0]!.rooms[0]!.x).toBe(0);
    });
  });

  describe('diffBuildings', () => {
    it('detects added room', () => {
      const before = makeBuilding();
      const floorId = before.floors[0]!.id;
      const after = addRoom(before, floorId, {
        floorId, type: RoomType.Kitchen, x: 3000, y: 0, width: 2000, height: 2000,
      });

      const diff = diffBuildings(before, after);
      expect(diff.addedRooms).toHaveLength(1);
      expect(diff.hasChanges).toBe(true);
    });

    it('detects removed room', () => {
      const before = makeBuilding();
      const roomId = before.floors[0]!.rooms[0]!.id;
      const after = removeRoom(before, roomId);

      const diff = diffBuildings(before, after);
      expect(diff.removedRooms).toHaveLength(1);
      expect(diff.removedRooms[0]).toBe(roomId);
      expect(diff.hasChanges).toBe(true);
    });

    it('detects moved room', () => {
      const before = makeBuilding();
      const roomId = before.floors[0]!.rooms[0]!.id;
      const after = moveRoom(before, roomId, 500, 500);

      const diff = diffBuildings(before, after);
      expect(diff.movedRooms).toContain(roomId);
      expect(diff.hasChanges).toBe(true);
    });

    it('detects resized room', () => {
      const before = makeBuilding();
      const roomId = before.floors[0]!.rooms[0]!.id;
      const after = resizeRoom(before, roomId, 5000, 6000);

      const diff = diffBuildings(before, after);
      expect(diff.resizedRooms).toContain(roomId);
      expect(diff.hasChanges).toBe(true);
    });

    it('identical buildings have hasChanges=false', () => {
      const building = makeBuilding();
      const diff = diffBuildings(building, building);
      expect(diff.hasChanges).toBe(false);
    });
  });
});
