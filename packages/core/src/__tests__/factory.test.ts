import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createBuilding,
  createRoom,
  createWall,
  createDoor,
  createSite,
  setIdSeed,
  resetIdGenerator,
  RoomType,
  WallType,
  DoorType,
  SwingDirection,
  DaylightLevel,
  PrivacyLevel,
  InvalidDimensionError,
  InvalidCoordinateError,
  DEFAULTS,
} from '../index';

describe('Factory Functions', () => {
  beforeEach(() => setIdSeed(1));
  afterEach(() => resetIdGenerator());

  // ─── createSite ─────────────────────────────────────────────────────────

  describe('createSite', () => {
    it('computes plotArea from width × depth', () => {
      const site = createSite({ plotWidth: 9144, plotDepth: 15240 });
      expect(site.plotArea).toBe(9144 * 15240);
    });

    it('generates rectangular plotBoundary from dimensions', () => {
      const site = createSite({ plotWidth: 9144, plotDepth: 15240 });
      expect(site.plotBoundary.points).toHaveLength(4);
      expect(site.plotBoundary.points[0]).toEqual({ x: 0, y: 0 });
      expect(site.plotBoundary.points[1]).toEqual({ x: 9144, y: 0 });
      expect(site.plotBoundary.points[2]).toEqual({ x: 9144, y: 15240 });
      expect(site.plotBoundary.points[3]).toEqual({ x: 0, y: 15240 });
    });

    it('has a non-empty id', () => {
      const site = createSite({ plotWidth: 5000, plotDepth: 5000 });
      expect(site.id).toBeTruthy();
      expect(site.id.length).toBeGreaterThan(0);
    });

    it('applies default setbacks of zero', () => {
      const site = createSite({ plotWidth: 5000, plotDepth: 5000 });
      expect(site.setbacks).toEqual({ front: 0, rear: 0, left: 0, right: 0 });
    });
  });

  // ─── createBuilding ─────────────────────────────────────────────────────

  describe('createBuilding', () => {
    it('produces valid Building with UUID id', () => {
      const b = createBuilding({
        projectId: 'proj-1',
        name: 'Test',
        site: { plotWidth: 9144, plotDepth: 15240 },
      });
      expect(b.id).toBeTruthy();
      expect(b.projectId).toBe('proj-1');
      expect(b.name).toBe('Test');
      expect(b.version).toBe(1);
      expect(b.floors).toHaveLength(0);
    });

    it('generates unique ids for sequential calls', () => {
      const a = createBuilding({ projectId: 'p1', name: 'A', site: { plotWidth: 1000, plotDepth: 1000 } });
      const b = createBuilding({ projectId: 'p2', name: 'B', site: { plotWidth: 1000, plotDepth: 1000 } });
      expect(a.id).not.toBe(b.id);
    });
  });

  // ─── createRoom ─────────────────────────────────────────────────────────

  describe('createRoom', () => {
    it('computes area from width × height', () => {
      const room = createRoom({
        floorId: 'f1',
        type: RoomType.Bedroom,
        x: 0, y: 0,
        width: 3000, height: 4000,
      });
      expect(room.area).toBe(12_000_000);
    });

    it('generates boundary polygon from x/y/width/height', () => {
      const room = createRoom({
        floorId: 'f1',
        type: RoomType.Kitchen,
        x: 100, y: 200,
        width: 3000, height: 2000,
      });
      expect(room.boundary.points).toHaveLength(4);
      expect(room.boundary.points[0]).toEqual({ x: 100, y: 200 });
      expect(room.boundary.points[1]).toEqual({ x: 3100, y: 200 });
      expect(room.boundary.points[2]).toEqual({ x: 3100, y: 2200 });
      expect(room.boundary.points[3]).toEqual({ x: 100, y: 2200 });
    });

    it('applies defaults for optional fields', () => {
      const room = createRoom({
        floorId: 'f1',
        type: RoomType.Bedroom,
        x: 0, y: 0,
        width: 3000, height: 4000,
      });
      expect(room.name).toBe('Bedroom');
      expect(room.rotation).toBe(0);
      expect(room.priority).toBe(5);
      expect(room.daylightRequirement).toBe(DaylightLevel.Medium);
      expect(room.privacyRequirement).toBe(PrivacyLevel.None);
      expect(room.isFixed).toBe(false);
    });

    it('throws InvalidDimensionError for negative width', () => {
      expect(() => createRoom({
        floorId: 'f1', type: RoomType.Bedroom,
        x: 0, y: 0, width: -1000, height: 3000,
      })).toThrow(InvalidDimensionError);
    });

    it('throws InvalidDimensionError for zero height', () => {
      expect(() => createRoom({
        floorId: 'f1', type: RoomType.Bedroom,
        x: 0, y: 0, width: 3000, height: 0,
      })).toThrow(InvalidDimensionError);
    });

    it('throws InvalidCoordinateError for NaN x', () => {
      expect(() => createRoom({
        floorId: 'f1', type: RoomType.Bedroom,
        x: NaN, y: 0, width: 3000, height: 4000,
      })).toThrow(InvalidCoordinateError);
    });

    it('throws InvalidCoordinateError for Infinity y', () => {
      expect(() => createRoom({
        floorId: 'f1', type: RoomType.Bedroom,
        x: 0, y: Infinity, width: 3000, height: 4000,
      })).toThrow(InvalidCoordinateError);
    });

    it('generates unique id per call', () => {
      const a = createRoom({ floorId: 'f1', type: RoomType.Bedroom, x: 0, y: 0, width: 3000, height: 3000 });
      const b = createRoom({ floorId: 'f1', type: RoomType.Bedroom, x: 0, y: 0, width: 3000, height: 3000 });
      expect(a.id).not.toBe(b.id);
    });
  });

  // ─── createWall ─────────────────────────────────────────────────────────

  describe('createWall', () => {
    it('defaults to Internal type with 150mm thickness', () => {
      const wall = createWall({
        floorId: 'f1',
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 3000, y: 0 },
      });
      expect(wall.type).toBe(WallType.Internal);
      expect(wall.thickness).toBe(DEFAULTS.WALL_THICKNESS_INTERNAL);
    });

    it('uses 230mm for external walls', () => {
      const wall = createWall({
        floorId: 'f1',
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 3000, y: 0 },
        type: WallType.External,
      });
      expect(wall.thickness).toBe(DEFAULTS.WALL_THICKNESS_EXTERNAL);
    });
  });

  // ─── createDoor ─────────────────────────────────────────────────────────

  describe('createDoor', () => {
    it('defaults to Single, Inward, 900mm width', () => {
      const door = createDoor({
        floorId: 'f1',
        wallId: 'w1',
        position: { x: 1500, y: 0 },
        connectsRooms: ['r1', 'r2'],
      });
      expect(door.type).toBe(DoorType.Single);
      expect(door.swingDirection).toBe(SwingDirection.Inward);
      expect(door.width).toBe(DEFAULTS.DOOR_WIDTH);
    });
  });

  // ─── Seeded IDs ─────────────────────────────────────────────────────────

  describe('Seeded ID generation', () => {
    it('produces deterministic ids with seed set', () => {
      setIdSeed(42);
      const id1 = createRoom({ floorId: 'f1', type: RoomType.Bedroom, x: 0, y: 0, width: 3000, height: 3000 }).id;
      resetIdGenerator();
      setIdSeed(42);
      const id2 = createRoom({ floorId: 'f1', type: RoomType.Bedroom, x: 0, y: 0, width: 3000, height: 3000 }).id;
      expect(id1).toBe(id2);
    });
  });
});
