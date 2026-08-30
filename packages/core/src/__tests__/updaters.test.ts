import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createBuilding,
  moveRoom,
  resizeRoom,
  addRoom,
  removeRoom,
  setIdSeed,
  resetIdGenerator,
  RoomType,
  EntityNotFoundError,
  InvalidDimensionError,
} from '../index';

function makeTestBuilding() {
  return createBuilding({
    projectId: 'test',
    name: 'Test Building',
    site: { plotWidth: 9144, plotDepth: 15240 },
    floors: [{ buildingId: '', level: 0, name: 'Ground Floor' }],
  });
}

describe('Immutable Updaters', () => {
  beforeEach(() => setIdSeed(100));
  afterEach(() => resetIdGenerator());

  describe('moveRoom', () => {
    it('returns new Building, original unchanged', () => {
      let building = makeTestBuilding();
      const floorId = building.floors[0]!.id;
      building = addRoom(building, floorId, {
        floorId, type: RoomType.Bedroom, x: 0, y: 0, width: 3000, height: 4000,
      });
      const roomId = building.floors[0]!.rooms[0]!.id;
      const original = building;

      const moved = moveRoom(building, roomId, 500, 500);

      // Original unchanged
      expect(original.floors[0]!.rooms[0]!.x).toBe(0);
      expect(original.floors[0]!.rooms[0]!.y).toBe(0);

      // New building has updated room
      expect(moved.floors[0]!.rooms[0]!.x).toBe(500);
      expect(moved.floors[0]!.rooms[0]!.y).toBe(500);
    });

    it('updates boundary polygon to match new x/y', () => {
      let building = makeTestBuilding();
      const floorId = building.floors[0]!.id;
      building = addRoom(building, floorId, {
        floorId, type: RoomType.Bedroom, x: 0, y: 0, width: 3000, height: 4000,
      });
      const roomId = building.floors[0]!.rooms[0]!.id;

      const moved = moveRoom(building, roomId, 100, 200);
      const boundary = moved.floors[0]!.rooms[0]!.boundary;
      expect(boundary.points[0]).toEqual({ x: 100, y: 200 });
      expect(boundary.points[2]).toEqual({ x: 3100, y: 4200 });
    });

    it('preserves room id', () => {
      let building = makeTestBuilding();
      const floorId = building.floors[0]!.id;
      building = addRoom(building, floorId, {
        floorId, type: RoomType.Bedroom, x: 0, y: 0, width: 3000, height: 4000,
      });
      const roomId = building.floors[0]!.rooms[0]!.id;

      const moved = moveRoom(building, roomId, 500, 500);
      expect(moved.floors[0]!.rooms[0]!.id).toBe(roomId);
    });

    it('throws EntityNotFoundError for non-existent id', () => {
      const building = makeTestBuilding();
      expect(() => moveRoom(building, 'nonexistent', 0, 0)).toThrow(EntityNotFoundError);
    });
  });

  describe('resizeRoom', () => {
    it('updates width, height, area, and boundary', () => {
      let building = makeTestBuilding();
      const floorId = building.floors[0]!.id;
      building = addRoom(building, floorId, {
        floorId, type: RoomType.Bedroom, x: 100, y: 100, width: 3000, height: 4000,
      });
      const roomId = building.floors[0]!.rooms[0]!.id;

      const resized = resizeRoom(building, roomId, 5000, 6000);
      const room = resized.floors[0]!.rooms[0]!;
      expect(room.width).toBe(5000);
      expect(room.height).toBe(6000);
      expect(room.area).toBe(30_000_000);
      expect(room.boundary.points[2]).toEqual({ x: 5100, y: 6100 });
    });

    it('throws for negative dimension', () => {
      let building = makeTestBuilding();
      const floorId = building.floors[0]!.id;
      building = addRoom(building, floorId, {
        floorId, type: RoomType.Bedroom, x: 0, y: 0, width: 3000, height: 4000,
      });
      const roomId = building.floors[0]!.rooms[0]!.id;

      expect(() => resizeRoom(building, roomId, -100, 4000)).toThrow(InvalidDimensionError);
    });
  });

  describe('addRoom', () => {
    it('increases room count by 1', () => {
      let building = makeTestBuilding();
      const floorId = building.floors[0]!.id;
      expect(building.floors[0]!.rooms).toHaveLength(0);

      building = addRoom(building, floorId, {
        floorId, type: RoomType.Kitchen, x: 0, y: 0, width: 3000, height: 2000,
      });
      expect(building.floors[0]!.rooms).toHaveLength(1);
    });

    it('preserves existing rooms unchanged', () => {
      let building = makeTestBuilding();
      const floorId = building.floors[0]!.id;
      building = addRoom(building, floorId, {
        floorId, type: RoomType.Bedroom, x: 0, y: 0, width: 3000, height: 4000,
      });
      const firstRoom = building.floors[0]!.rooms[0]!;

      building = addRoom(building, floorId, {
        floorId, type: RoomType.Kitchen, x: 3000, y: 0, width: 2000, height: 2000,
      });
      expect(building.floors[0]!.rooms[0]!.id).toBe(firstRoom.id);
      expect(building.floors[0]!.rooms[0]!.type).toBe(RoomType.Bedroom);
    });

    it('throws for non-existent floorId', () => {
      const building = makeTestBuilding();
      expect(() => addRoom(building, 'nonexistent', {
        floorId: 'nonexistent', type: RoomType.Bedroom, x: 0, y: 0, width: 3000, height: 4000,
      })).toThrow(EntityNotFoundError);
    });
  });

  describe('removeRoom', () => {
    it('decreases room count by 1', () => {
      let building = makeTestBuilding();
      const floorId = building.floors[0]!.id;
      building = addRoom(building, floorId, {
        floorId, type: RoomType.Bedroom, x: 0, y: 0, width: 3000, height: 4000,
      });
      const roomId = building.floors[0]!.rooms[0]!.id;

      building = removeRoom(building, roomId);
      expect(building.floors[0]!.rooms).toHaveLength(0);
    });

    it('does not affect other rooms', () => {
      let building = makeTestBuilding();
      const floorId = building.floors[0]!.id;
      building = addRoom(building, floorId, {
        floorId, type: RoomType.Bedroom, x: 0, y: 0, width: 3000, height: 4000,
      });
      building = addRoom(building, floorId, {
        floorId, type: RoomType.Kitchen, x: 3000, y: 0, width: 2000, height: 2000,
      });
      const bedroomId = building.floors[0]!.rooms[0]!.id;

      building = removeRoom(building, bedroomId);
      expect(building.floors[0]!.rooms).toHaveLength(1);
      expect(building.floors[0]!.rooms[0]!.type).toBe(RoomType.Kitchen);
    });
  });
});
