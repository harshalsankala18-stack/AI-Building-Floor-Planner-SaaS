import { describe, it, expect } from 'vitest';
import {
  RoomType,
  WallType,
  StairType,
  createBuilding,
  createFloor,
  createRoom,
  createWall,
  createDoor,
  createWindow,
  createStair,
  type Building,
  type Floor,
} from '@ai-floor-planner/core';
import {
  apartmentStructureToBuilding,
  attachOpeningsToHostWalls,
  generateWallsFromRooms,
  validateCanonicalApartmentBuilding,
  pointInPolygonWithTolerance,
  containsPolygonWithTolerance,
  segmentCrossesOutsidePolygon,
  type ApartmentPlanExpectation,
  type ApartmentPlanStructure,
  type ApartmentPlanFlat,
  type ApartmentPlanRoom,
  type ExtractionSite,
} from '../index';

const standardSite: ExtractionSite = {
  plotWidth: 50000,
  plotDepth: 50000,
  orientation: 0,
  roadFacing: 'N',
  frontSetback: 3000,
  rearSetback: 2000,
  leftSetback: 2000,
  rightSetback: 2000,
};

const buildingSiteParams = {
  plotWidth: 50000,
  plotDepth: 50000,
  setbacks: { front: 3000, rear: 2000, left: 2000, right: 2000 },
};

function createRectRoom(
  id: string,
  name: string,
  type: string,
  x: number,
  y: number,
  width: number,
  height: number
): ApartmentPlanRoom {
  return {
    id,
    name,
    type,
    rect: { x, y, width, height },
  };
}

describe('Phase 2.2.1 — Final Canonical Validation Closure & Architectural Integrity', () => {
  // =========================================================================
  // SUITE 1: Studio-Only and Mixed Typology Validation
  // =========================================================================
  describe('1. Studio-Only and Mixed Typology Canonical Validation', () => {
    it('passes canonical validation for an all-Studio building without requiring bedrooms', () => {
      const lobby = { id: 'lobby_1', name: 'Common Lobby', rect: { x: 3000, y: 5000, width: 2000, height: 4000 }, assignedFlatId: null };
      const lift = { id: 'lift_1', name: 'Passenger Lift', rect: { x: 3000, y: 9000, width: 2000, height: 2000 }, assignedFlatId: null };
      const stair = { id: 'stair_1', name: 'Main Staircase', rect: { x: 3000, y: 11000, width: 2000, height: 4000 }, assignedFlatId: null };

      // Living: 5000 x 4500 (22.5 sqm >= 11.0 sqm)
      const livingRoom = createRectRoom('flat1_living', 'Living Room', 'living_dining', 5000, 5000, 5000, 4500);
      // Kitchen: 2500 x 2500 (6.25 sqm >= 5.0 sqm, dim 2.5m >= 2.1m)
      const kitchenRoom = createRectRoom('flat1_kitchen', 'Kitchen', 'kitchen', 10000, 5000, 2500, 2500);
      // Bath: 2500 x 2000 (5.0 sqm >= 1.8 sqm, dim 2.0m >= 1.2m)
      const bathRoom = createRectRoom('flat1_bath', 'Bathroom', 'master_toilet', 10000, 7500, 2500, 2000);

      const flat: ApartmentPlanFlat = {
        id: 'flat_01',
        label: 'Flat 01',
        unitType: 'Studio',
        rect: { x: 5000, y: 5000, width: 7500, height: 4500 },
        rooms: [livingRoom, bathRoom, kitchenRoom],
      };

      const structure: ApartmentPlanStructure = {
        source: 'DETERMINISTIC_SCHEMATIC',
        boundary: [
          { x: 2000, y: 4000 },
          { x: 14000, y: 4000 },
          { x: 14000, y: 16000 },
          { x: 2000, y: 16000 },
        ],
        flats: [flat],
        commonRooms: [],
        ungroupedRooms: [],
        lifts: [lift],
        stairs: [stair],
        lobbies: [lobby],
        corridors: [],
        shafts: [],
        openings: [
          {
            id: 'door_flat1_main',
            kind: 'door',
            rect: { x: 5000, y: 6500, width: 100, height: 1000 },
            adjacentRoomId: livingRoom.id,
            connects: ['lobby_1', livingRoom.id],
            isFlatEntrance: true,
          },
          {
            id: 'door_flat1_kitchen',
            kind: 'door',
            rect: { x: 10000, y: 6000, width: 100, height: 900 },
            adjacentRoomId: kitchenRoom.id,
            connects: [livingRoom.id, kitchenRoom.id],
          },
          {
            id: 'door_flat1_bath',
            kind: 'door',
            rect: { x: 10000, y: 8000, width: 100, height: 900 },
            adjacentRoomId: bathRoom.id,
            connects: [livingRoom.id, bathRoom.id],
          },
          {
            id: 'win_flat1_living',
            kind: 'window',
            rect: { x: 7000, y: 5000, width: 1200, height: 100 },
            adjacentRoomId: livingRoom.id,
          },
          {
            id: 'win_flat1_kitchen',
            kind: 'window',
            rect: { x: 11000, y: 5000, width: 1200, height: 100 },
            adjacentRoomId: kitchenRoom.id,
          },
        ],
      };

      const { building } = apartmentStructureToBuilding(structure, standardSite, 'proj_studio', 'Studio Project');

      const expectation: ApartmentPlanExpectation = {
        flats: 1,
        units: [{
          label: 'Flat 01',
          unitType: 'Studio',
          bedrooms: 0,
          bathrooms: 1,
          livingRooms: 1,
          diningRooms: 0,
          kitchens: 1,
          utilities: 0,
          balconies: 0,
        }],
        lifts: 1,
        stairs: 1,
        commonLobby: true,
      };

      const result = validateCanonicalApartmentBuilding(building, expectation);
      expect(result.isValid).toBe(true);
      expect(result.verificationIssues.filter(i => i.severity === 'error')).toHaveLength(0);
      expect(result.verificationIssues.some(i => i.code === 'DESIGN_MISSING_BEDROOM')).toBe(false);
    });

    it('requires bedrooms for BHK typologies and fails when bedroom is missing', () => {
      const livingRoom = createRectRoom('flat1_living', 'Living Room', 'living_dining', 5000, 5000, 5000, 4000);
      const bathRoom = createRectRoom('flat1_bath', 'Bathroom', 'master_toilet', 10000, 5000, 2000, 2000);

      const flat: ApartmentPlanFlat = {
        id: 'flat_01',
        label: 'Flat 01',
        unitType: '1BHK',
        rect: { x: 5000, y: 5000, width: 7000, height: 4000 },
        rooms: [livingRoom, bathRoom],
      };

      const structure: ApartmentPlanStructure = {
        source: 'DETERMINISTIC_SCHEMATIC',
        boundary: [
          { x: 3000, y: 3000 },
          { x: 25000, y: 3000 },
          { x: 25000, y: 20000 },
          { x: 3000, y: 20000 },
        ],
        flats: [flat],
        commonRooms: [],
        ungroupedRooms: [],
        lifts: [],
        stairs: [],
        lobbies: [],
        corridors: [],
        shafts: [],
        openings: [],
      };

      const { building } = apartmentStructureToBuilding(structure, standardSite, 'proj_bhk', 'BHK Project');

      const expectation: ApartmentPlanExpectation = {
        flats: 1,
        units: [{
          label: 'Flat 01',
          unitType: '1BHK',
          bedrooms: 1,
          bathrooms: 1,
          livingRooms: 1,
          diningRooms: 0,
          kitchens: 0,
          utilities: 0,
          balconies: 0,
        }],
        lifts: 0,
        stairs: 0,
        commonLobby: false,
      };

      const result = validateCanonicalApartmentBuilding(building, expectation);
      expect(result.isValid).toBe(false);
      expect(result.verificationIssues.some(i => i.code.includes('BEDROOM') || i.code.includes('COUNT_MISMATCH'))).toBe(true);
    });

    it('correctly validates mixed Studio + 1BHK buildings', () => {
      const studioLiving = createRectRoom('s_living', 'Studio Living Room', 'living_dining', 5000, 5000, 5000, 4000);
      const studioBath = createRectRoom('s_bath', 'Studio Bathroom', 'master_toilet', 10000, 5000, 2000, 2000);

      const bhkLiving = createRectRoom('b_living', '1BHK Living Room', 'living_dining', 5000, 10000, 5000, 4000);
      const bhkBed = createRectRoom('b_bed', '1BHK Bedroom', 'bedroom', 10000, 10000, 4000, 4000);
      const bhkBath = createRectRoom('b_bath', '1BHK Bathroom', 'master_toilet', 10000, 14000, 2000, 2000);

      const flats: ApartmentPlanFlat[] = [
        {
          id: 'flat_studio',
          label: 'Flat Studio',
          unitType: 'Studio',
          rect: { x: 5000, y: 5000, width: 7000, height: 4000 },
          rooms: [studioLiving, studioBath],
        },
        {
          id: 'flat_1bhk',
          label: 'Flat 1BHK',
          unitType: '1BHK',
          rect: { x: 5000, y: 10000, width: 9000, height: 6000 },
          rooms: [bhkLiving, bhkBed, bhkBath],
        },
      ];

      const structure: ApartmentPlanStructure = {
        source: 'DETERMINISTIC_SCHEMATIC',
        boundary: [
          { x: 2000, y: 2000 },
          { x: 30000, y: 2000 },
          { x: 30000, y: 25000 },
          { x: 2000, y: 25000 },
        ],
        flats,
        commonRooms: [],
        ungroupedRooms: [],
        lifts: [],
        stairs: [],
        lobbies: [],
        corridors: [],
        shafts: [],
        openings: [],
      };

      const { building } = apartmentStructureToBuilding(structure, standardSite, 'proj_mixed', 'Mixed Studio+1BHK');
      const expectation: ApartmentPlanExpectation = {
        flats: 2,
        units: [
          {
            label: 'Flat Studio',
            unitType: 'Studio',
            bedrooms: 0,
            bathrooms: 1,
            livingRooms: 1,
            diningRooms: 1,
            kitchens: 0,
            utilities: 0,
            balconies: 0,
          },
          {
            label: 'Flat 1BHK',
            unitType: '1BHK',
            bedrooms: 1,
            bathrooms: 1,
            livingRooms: 1,
            diningRooms: 1,
            kitchens: 0,
            utilities: 0,
            balconies: 0,
          },
        ],
        lifts: 0,
        stairs: 0,
        commonLobby: false,
      };

      const result = validateCanonicalApartmentBuilding(building, expectation);
      expect(result.verificationIssues.some(i => i.code === 'DESIGN_MISSING_BEDROOM')).toBe(false);
    });

    it('correctly validates mixed Studio + 2BHK buildings', () => {
      const studioLiving = createRectRoom('s_living', 'Studio Living Room', 'living_dining', 5000, 5000, 5000, 4000);
      const studioBath = createRectRoom('s_bath', 'Studio Bathroom', 'master_toilet', 10000, 5000, 2000, 2000);

      const bhkLiving = createRectRoom('b_living', '2BHK Living Room', 'living_dining', 5000, 10000, 5000, 4000);
      const bhkBed1 = createRectRoom('b_bed1', '2BHK Bedroom 1', 'bedroom', 10000, 10000, 4000, 4000);
      const bhkBed2 = createRectRoom('b_bed2', '2BHK Bedroom 2', 'bedroom', 10000, 14000, 4000, 4000);
      const bhkBath = createRectRoom('b_bath', '2BHK Bathroom', 'master_toilet', 5000, 14000, 2000, 2000);

      const flats: ApartmentPlanFlat[] = [
        {
          id: 'flat_studio',
          label: 'Flat Studio',
          unitType: 'Studio',
          rect: { x: 5000, y: 5000, width: 7000, height: 4000 },
          rooms: [studioLiving, studioBath],
        },
        {
          id: 'flat_2bhk',
          label: 'Flat 2BHK',
          unitType: '2BHK',
          rect: { x: 5000, y: 10000, width: 9000, height: 8000 },
          rooms: [bhkLiving, bhkBed1, bhkBed2, bhkBath],
        },
      ];

      const structure: ApartmentPlanStructure = {
        source: 'DETERMINISTIC_SCHEMATIC',
        boundary: [
          { x: 2000, y: 2000 },
          { x: 30000, y: 2000 },
          { x: 30000, y: 25000 },
          { x: 2000, y: 25000 },
        ],
        flats,
        commonRooms: [],
        ungroupedRooms: [],
        lifts: [],
        stairs: [],
        lobbies: [],
        corridors: [],
        shafts: [],
        openings: [],
      };

      const { building } = apartmentStructureToBuilding(structure, standardSite, 'proj_mixed2', 'Mixed Studio+2BHK');
      const expectation: ApartmentPlanExpectation = {
        flats: 2,
        units: [
          {
            label: 'Flat Studio',
            unitType: 'Studio',
            bedrooms: 0,
            bathrooms: 1,
            livingRooms: 1,
            diningRooms: 1,
            kitchens: 0,
            utilities: 0,
            balconies: 0,
          },
          {
            label: 'Flat 2BHK',
            unitType: '2BHK',
            bedrooms: 2,
            bathrooms: 1,
            livingRooms: 1,
            diningRooms: 1,
            kitchens: 0,
            utilities: 0,
            balconies: 0,
          },
        ],
        lifts: 0,
        stairs: 0,
        commonLobby: false,
      };

      const result = validateCanonicalApartmentBuilding(building, expectation);
      expect(result.verificationIssues.some(i => i.code === 'DESIGN_MISSING_BEDROOM')).toBe(false);
    });
  });

  // =========================================================================
  // SUITE 2: Opening Topological Association and Diagnostics
  // =========================================================================
  describe('2. Opening Topology & Diagnostic Preservation', () => {
    it('requires interior doors to connect both adjacent rooms on the host wall', () => {
      const floorId = 'floor_0';
      const rLiving = createRoom({
        floorId,
        name: 'Living',
        type: RoomType.Living,
        x: 5000,
        y: 5000,
        width: 5000,
        height: 4000,
      });
      const rBed = createRoom({
        floorId,
        name: 'Bedroom',
        type: RoomType.Bedroom,
        x: 10000,
        y: 5000,
        width: 4000,
        height: 4000,
      });

      const walls = generateWallsFromRooms(floorId, [rLiving, rBed]);
      const sharedWall = walls.find(w => w.roomIds.includes(rLiving.id) && w.roomIds.includes(rBed.id));
      expect(sharedWall).toBeDefined();

      const door = createDoor({
        floorId,
        wallId: '__extracted__',
        position: { x: 10000, y: 6500 },
        width: 900,
        height: 2100,
        connectsRooms: [rLiving.id, rBed.id],
      });

      const floor: Floor = {
        ...createFloor({ buildingId: 'bldg_1', level: 0 }),
        id: floorId,
        rooms: [rLiving, rBed],
        walls,
        doors: [door],
        windows: [],
      };

      const attachResult = attachOpeningsToHostWalls(floor);
      expect(attachResult.doors).toHaveLength(1);
      expect(attachResult.doors[0]!.wallId).toBe(sharedWall!.id);
      expect(attachResult.issues.filter(i => i.severity === 'error')).toHaveLength(0);
    });

    it('rejects an interior door that does not share both rooms on the candidate wall', () => {
      const floorId = 'floor_0';
      const rLiving = createRoom({
        floorId,
        name: 'Living',
        type: RoomType.Living,
        x: 5000,
        y: 5000,
        width: 5000,
        height: 4000,
      });
      const rBed = createRoom({
        floorId,
        name: 'Bedroom',
        type: RoomType.Bedroom,
        x: 10000,
        y: 5000,
        width: 4000,
        height: 4000,
      });
      const rDetached = createRoom({
        floorId,
        name: 'Detached',
        type: RoomType.Storage,
        x: 20000,
        y: 20000,
        width: 2000,
        height: 2000,
      });

      const walls = generateWallsFromRooms(floorId, [rLiving, rBed, rDetached]);
      const door = createDoor({
        floorId,
        wallId: '__extracted__',
        position: { x: 5000, y: 6500 },
        width: 900,
        height: 2100,
        connectsRooms: [rLiving.id, rDetached.id],
      });

      const floor: Floor = {
        ...createFloor({ buildingId: 'bldg_1', level: 0 }),
        id: floorId,
        rooms: [rLiving, rBed, rDetached],
        walls,
        doors: [door],
        windows: [],
      };

      const attachResult = attachOpeningsToHostWalls(floor);
      expect(attachResult.doors).toHaveLength(0);
      expect(attachResult.issues.some(i => i.code === 'DOOR_HOST_WALL_NOT_FOUND')).toBe(true);
    });

    it('validates exterior doors requiring an external wall', () => {
      const floorId = 'floor_0';
      const rLiving = createRoom({
        floorId,
        name: 'Living',
        type: RoomType.Living,
        x: 5000,
        y: 5000,
        width: 5000,
        height: 4000,
      });

      const walls = generateWallsFromRooms(floorId, [rLiving]);
      const extDoor = createDoor({
        floorId,
        wallId: '__extracted__',
        position: { x: 5000, y: 6500 },
        width: 1000,
        height: 2100,
        connectsRooms: [rLiving.id, '__outside__'],
      });

      const floor: Floor = {
        ...createFloor({ buildingId: 'bldg_1', level: 0 }),
        id: floorId,
        rooms: [rLiving],
        walls,
        doors: [extDoor],
        windows: [],
      };

      const attachResult = attachOpeningsToHostWalls(floor);
      expect(attachResult.doors).toHaveLength(1);
      const hostWall = walls.find(w => w.id === attachResult.doors[0]!.wallId);
      expect(hostWall?.type).toBe(WallType.External);
    });

    it('rejects openings referencing missing adjacent rooms and propagates diagnostics', () => {
      const floorId = 'floor_0';
      const rLiving = createRoom({
        floorId,
        name: 'Living',
        type: RoomType.Living,
        x: 5000,
        y: 5000,
        width: 5000,
        height: 4000,
      });

      const walls = generateWallsFromRooms(floorId, [rLiving]);
      const orphanDoor = createDoor({
        floorId,
        wallId: '__extracted__',
        position: { x: 5000, y: 6500 },
        width: 900,
        height: 2100,
        connectsRooms: [rLiving.id, 'ghost_room_id_not_found'],
      });

      const floor: Floor = {
        ...createFloor({ buildingId: 'bldg_1', level: 0 }),
        id: floorId,
        rooms: [rLiving],
        walls,
        doors: [orphanDoor],
        windows: [],
      };

      const attachResult = attachOpeningsToHostWalls(floor);
      expect(attachResult.doors).toHaveLength(0);
      expect(attachResult.issues.some(i => i.code === 'DOOR_ROOM_NOT_FOUND')).toBe(true);
    });

    it('rejects ambiguous host walls where multiple walls are tied within tolerance', () => {
      const floorId = 'floor_0';
      const rA = createRoom({ floorId, name: 'Room A', type: RoomType.Living, x: 0, y: 1000, width: 1000, height: 2000 });
      const rB = createRoom({ floorId, name: 'Room B', type: RoomType.Bedroom, x: 1010, y: 1000, width: 1000, height: 2000 });

      const wall1 = createWall({
        floorId,
        startPoint: { x: 1000, y: 1000 },
        endPoint: { x: 1000, y: 3000 },
        type: WallType.Internal,
        thickness: 100,
        roomIds: [rA.id, rB.id],
      });
      const wall2 = createWall({
        floorId,
        startPoint: { x: 1010, y: 1000 },
        endPoint: { x: 1010, y: 3000 },
        type: WallType.Internal,
        thickness: 100,
        roomIds: [rA.id, rB.id],
      });

      const ambiguousDoor = createDoor({
        floorId,
        wallId: '__extracted__',
        position: { x: 1005, y: 1500 },
        width: 800,
        height: 2100,
        connectsRooms: [rA.id, rB.id],
      });

      const floor: Floor = {
        ...createFloor({ buildingId: 'bldg_1', level: 0 }),
        id: floorId,
        rooms: [rA, rB],
        walls: [wall1, wall2],
        doors: [ambiguousDoor],
        windows: [],
      };

      const attachResult = attachOpeningsToHostWalls(floor);
      expect(attachResult.doors).toHaveLength(0);
      expect(attachResult.issues.some(i => i.code === 'DOOR_HOST_WALL_AMBIGUOUS')).toBe(true);
    });

    it('rejects windows on shared internal partition walls', () => {
      const floorId = 'floor_0';
      const rLiving = createRoom({ floorId, name: 'Living', type: RoomType.Living, x: 5000, y: 5000, width: 5000, height: 4000 });
      const rBed = createRoom({ floorId, name: 'Bedroom', type: RoomType.Bedroom, x: 10000, y: 5000, width: 4000, height: 4000 });

      const walls = generateWallsFromRooms(floorId, [rLiving, rBed]);
      const internalWindow = createWindow({
        floorId,
        wallId: '__extracted__',
        position: { x: 10000, y: 6500 },
        width: 1200,
        height: 1200,
        roomId: rLiving.id,
      });

      const floor: Floor = {
        ...createFloor({ buildingId: 'bldg_1', level: 0 }),
        id: floorId,
        rooms: [rLiving, rBed],
        walls,
        doors: [],
        windows: [internalWindow],
      };

      const attachResult = attachOpeningsToHostWalls(floor);
      expect(attachResult.windows).toHaveLength(0);
      expect(attachResult.issues.some(i => i.code === 'WINDOW_HOST_WALL_NOT_FOUND')).toBe(true);
    });

    it('attaches exterior windows successfully to external facade walls', () => {
      const floorId = 'floor_0';
      const rLiving = createRoom({ floorId, name: 'Living', type: RoomType.Living, x: 5000, y: 5000, width: 5000, height: 4000 });
      const walls = generateWallsFromRooms(floorId, [rLiving]);

      const extWindow = createWindow({
        floorId,
        wallId: '__extracted__',
        position: { x: 7000, y: 5000 },
        width: 1200,
        height: 1200,
        roomId: rLiving.id,
      });

      const floor: Floor = {
        ...createFloor({ buildingId: 'bldg_1', level: 0 }),
        id: floorId,
        rooms: [rLiving],
        walls,
        doors: [],
        windows: [extWindow],
      };

      const attachResult = attachOpeningsToHostWalls(floor);
      expect(attachResult.windows).toHaveLength(1);
      const hostWall = walls.find(w => w.id === attachResult.windows[0]!.wallId);
      expect(hostWall?.type).toBe(WallType.External);
    });
  });

  // =========================================================================
  // SUITE 3: Flat Boundaries & Ownership
  // =========================================================================
  describe('3. Flat Boundary Geometry & Deterministic Ownership', () => {
    it('preserves actual stepped orthogonal boundaries with >= 6 vertices', () => {
      const steppedVertices = [
        { x: 5000, y: 5000 },
        { x: 12000, y: 5000 },
        { x: 12000, y: 8000 },
        { x: 10000, y: 8000 },
        { x: 10000, y: 11000 },
        { x: 5000, y: 11000 },
      ];

      const flat: ApartmentPlanFlat = {
        id: 'flat_01',
        label: 'Flat 01',
        unitType: '2BHK',
        rect: { x: 5000, y: 5000, width: 7000, height: 6000 },
        boundary: steppedVertices,
        rooms: [
          createRectRoom('r1', 'Living', 'living_dining', 5000, 5000, 7000, 3000),
          createRectRoom('r2', 'Master Bed', 'bedroom', 5000, 8000, 5000, 3000),
        ],
      };

      const structure: ApartmentPlanStructure = {
        source: 'DETERMINISTIC_SCHEMATIC',
        boundary: [
          { x: 0, y: 0 },
          { x: 20000, y: 0 },
          { x: 20000, y: 20000 },
          { x: 0, y: 20000 },
        ],
        flats: [flat],
        commonRooms: [],
        ungroupedRooms: [],
        lifts: [],
        stairs: [],
        lobbies: [],
        corridors: [],
        shafts: [],
        openings: [],
      };

      const { building } = apartmentStructureToBuilding(structure, standardSite, 'proj_stepped', 'Stepped Boundary Test');
      const storedBoundaries = (building.metadata as any)?.flatBoundaries;

      expect(storedBoundaries).toBeDefined();
      expect(storedBoundaries).toHaveLength(1);
      expect(storedBoundaries[0].boundary.points).toHaveLength(6);
      expect(storedBoundaries[0].boundary.points).toEqual(steppedVertices);
    });

    it('rejects a room falling inside a stepped cutaway', () => {
      const steppedVertices = [
        { x: 5000, y: 5000 },
        { x: 12000, y: 5000 },
        { x: 12000, y: 8000 },
        { x: 10000, y: 8000 },
        { x: 10000, y: 11000 },
        { x: 5000, y: 11000 },
      ];

      const cutawayRoom = createRectRoom('r_cutaway', 'Cutaway Bedroom', 'bedroom', 10500, 8500, 1400, 2000);

      const flat: ApartmentPlanFlat = {
        id: 'flat_01',
        label: 'Flat 01',
        unitType: '1BHK',
        rect: { x: 5000, y: 5000, width: 7000, height: 6000 },
        boundary: steppedVertices,
        rooms: [
          createRectRoom('r1', 'Living', 'living_dining', 5000, 5000, 5000, 3000),
          cutawayRoom,
        ],
      };

      const structure: ApartmentPlanStructure = {
        source: 'DETERMINISTIC_SCHEMATIC',
        boundary: [
          { x: 0, y: 0 },
          { x: 20000, y: 0 },
          { x: 20000, y: 20000 },
          { x: 0, y: 20000 },
        ],
        flats: [flat],
        commonRooms: [],
        ungroupedRooms: [],
        lifts: [],
        stairs: [],
        lobbies: [],
        corridors: [],
        shafts: [],
        openings: [],
      };

      const { building } = apartmentStructureToBuilding(structure, standardSite, 'proj_cutaway', 'Cutaway Rejection');
      const expectation: ApartmentPlanExpectation = {
        flats: 1,
        units: [{
          label: 'Flat 01',
          unitType: '1BHK',
          bedrooms: 1,
          bathrooms: 0,
          livingRooms: 1,
          diningRooms: 0,
          kitchens: 0,
          utilities: 0,
          balconies: 0,
        }],
        lifts: 0,
        stairs: 0,
        commonLobby: false,
      };

      const result = validateCanonicalApartmentBuilding(building, expectation);
      expect(result.isValid).toBe(false);
      expect(result.verificationIssues.some(i => i.code === 'CANONICAL_ROOM_OUTSIDE_FLAT_BOUNDARY')).toBe(true);
    });

    it('enforces outdoor attachment rule for balconies extending beyond flat boundary', () => {
      const flatRect = { x: 5000, y: 5000, width: 5000, height: 5000 };
      const living = createRectRoom('rm_living', 'Living', 'living_dining', 5000, 5000, 5000, 5000);
      const attachedBalcony = createRectRoom('rm_balcony', 'Balcony Deck', 'balcony', 10000, 6000, 1500, 2000);

      const flat: ApartmentPlanFlat = {
        id: 'flat_01',
        label: 'Flat 01',
        unitType: '1BHK',
        rect: flatRect,
        rooms: [living, attachedBalcony],
      };

      const structure: ApartmentPlanStructure = {
        source: 'DETERMINISTIC_SCHEMATIC',
        boundary: [
          { x: 0, y: 0 },
          { x: 20000, y: 0 },
          { x: 20000, y: 20000 },
          { x: 0, y: 20000 },
        ],
        flats: [flat],
        commonRooms: [],
        ungroupedRooms: [],
        lifts: [],
        stairs: [],
        lobbies: [],
        corridors: [],
        shafts: [],
        openings: [],
      };

      const { building } = apartmentStructureToBuilding(structure, standardSite, 'proj_balcony', 'Balcony Attachment');
      const expectation: ApartmentPlanExpectation = {
        flats: 1,
        units: [{
          label: 'Flat 01',
          unitType: '1BHK',
          bedrooms: 0,
          bathrooms: 0,
          livingRooms: 1,
          diningRooms: 0,
          kitchens: 0,
          utilities: 0,
          balconies: 1,
        }],
        lifts: 0,
        stairs: 0,
        commonLobby: false,
      };

      const result = validateCanonicalApartmentBuilding(building, expectation);
      expect(result.verificationIssues.some(i => i.code === 'CANONICAL_BALCONY_ATTACHMENT_INVALID')).toBe(false);
      expect(result.verificationIssues.some(i => i.code === 'CANONICAL_ROOM_OUTSIDE_FLAT_BOUNDARY')).toBe(false);
    });

    it('rejects an unattached balcony hovering detached outside the flat boundary', () => {
      const flatRect = { x: 5000, y: 5000, width: 5000, height: 5000 };
      const living = createRectRoom('rm_living', 'Living', 'living_dining', 5000, 5000, 5000, 5000);
      const detachedBalcony = createRectRoom('rm_balcony', 'Floating Balcony', 'balcony', 10500, 6000, 1500, 2000);

      const flat: ApartmentPlanFlat = {
        id: 'flat_01',
        label: 'Flat 01',
        unitType: '1BHK',
        rect: flatRect,
        rooms: [living, detachedBalcony],
      };

      const structure: ApartmentPlanStructure = {
        source: 'DETERMINISTIC_SCHEMATIC',
        boundary: [
          { x: 0, y: 0 },
          { x: 20000, y: 0 },
          { x: 20000, y: 20000 },
          { x: 0, y: 20000 },
        ],
        flats: [flat],
        commonRooms: [],
        ungroupedRooms: [],
        lifts: [],
        stairs: [],
        lobbies: [],
        corridors: [],
        shafts: [],
        openings: [],
      };

      const { building } = apartmentStructureToBuilding(structure, standardSite, 'proj_floating', 'Floating Balcony');
      const expectation: ApartmentPlanExpectation = {
        flats: 1,
        units: [{
          label: 'Flat 01',
          unitType: '1BHK',
          bedrooms: 0,
          bathrooms: 0,
          livingRooms: 1,
          diningRooms: 0,
          kitchens: 0,
          utilities: 0,
          balconies: 1,
        }],
        lifts: 0,
        stairs: 0,
        commonLobby: false,
      };

      const result = validateCanonicalApartmentBuilding(building, expectation);
      expect(result.isValid).toBe(false);
      expect(result.verificationIssues.some(i => i.code === 'CANONICAL_BALCONY_ATTACHMENT_INVALID')).toBe(true);
    });

    it('rejects duplicate or conflicting room ownership tags', () => {
      const floorId = 'floor_0';
      const r1 = createRoom({
        floorId,
        name: 'Conflicting Living',
        type: RoomType.Living,
        x: 1000,
        y: 1000,
        width: 4000,
        height: 4000,
        tags: ['flat:flat_01', 'flat:flat_02'],
      });

      const floor: Floor = {
        ...createFloor({ buildingId: 'bldg_1', level: 0 }),
        id: floorId,
        boundary: {
          points: [
            { x: 0, y: 0 },
            { x: 20000, y: 0 },
            { x: 20000, y: 20000 },
            { x: 0, y: 20000 },
          ],
        },
        rooms: [r1],
      };

      const building: Building = {
        ...createBuilding({
          projectId: 'proj_conflicting',
          name: 'Conflicting Tags',
          site: buildingSiteParams,
        }),
        floors: [floor],
      };

      const expectation: ApartmentPlanExpectation = {
        flats: 2,
        units: [
          { label: 'Flat 01', unitType: 'Studio', bedrooms: 0, bathrooms: 0, livingRooms: 1, diningRooms: 0, kitchens: 0, utilities: 0, balconies: 0 },
          { label: 'Flat 02', unitType: 'Studio', bedrooms: 0, bathrooms: 0, livingRooms: 0, diningRooms: 0, kitchens: 0, utilities: 0, balconies: 0 },
        ],
        lifts: 0,
        stairs: 0,
        commonLobby: false,
      };

      const result = validateCanonicalApartmentBuilding(building, expectation);
      expect(result.isValid).toBe(false);
      expect(result.verificationIssues.some(i => i.code === 'CANONICAL_CONFLICTING_FLAT_OWNERSHIP')).toBe(true);
    });

    it('prevents positional fallback and strictly requires exact matching flat identity', () => {
      const floorId = 'floor_0';
      const r1 = createRoom({
        floorId,
        name: 'Living 999',
        type: RoomType.Living,
        x: 1000,
        y: 1000,
        width: 4000,
        height: 4000,
        tags: ['flat:unknown_flat_id_999'],
      });

      const floor: Floor = {
        ...createFloor({ buildingId: 'bldg_1', level: 0 }),
        id: floorId,
        boundary: {
          points: [
            { x: 0, y: 0 },
            { x: 20000, y: 0 },
            { x: 20000, y: 20000 },
            { x: 0, y: 20000 },
          ],
        },
        rooms: [r1],
      };

      const building: Building = {
        ...createBuilding({
          projectId: 'proj_pos',
          name: 'No Positional Fallback',
          site: buildingSiteParams,
        }),
        floors: [floor],
      };

      const expectation: ApartmentPlanExpectation = {
        flats: 1,
        units: [
          { label: 'Expected Flat A', unitType: 'Studio', bedrooms: 0, bathrooms: 0, livingRooms: 1, diningRooms: 0, kitchens: 0, utilities: 0, balconies: 0 },
        ],
        lifts: 0,
        stairs: 0,
        commonLobby: false,
      };

      const result = validateCanonicalApartmentBuilding(building, expectation);
      expect(result.isValid).toBe(false);
      expect(result.verificationIssues.some(i => i.code === 'CANONICAL_UNKNOWN_FLAT_OWNERSHIP')).toBe(true);
    });
  });

  // =========================================================================
  // SUITE 4: Floor Entity Boundary and Multi-Level Integrity
  // =========================================================================
  describe('4. Floor Entity Boundary & Connector Integrity', () => {
    it('rejects an entity whose floorId does not match its parent floor', () => {
      const floorId = 'floor_level_0';
      const mismatchedRoom = createRoom({
        floorId: 'floor_level_DIFFERENT',
        name: 'Foreign Room',
        type: RoomType.Living,
        x: 1000,
        y: 1000,
        width: 3000,
        height: 3000,
        tags: ['flat:flat_01'],
      });

      const floor: Floor = {
        ...createFloor({ buildingId: 'bldg_1', level: 0 }),
        id: floorId,
        boundary: {
          points: [
            { x: 0, y: 0 },
            { x: 10000, y: 0 },
            { x: 10000, y: 10000 },
            { x: 0, y: 10000 },
          ],
        },
        rooms: [mismatchedRoom],
      };

      const building: Building = {
        ...createBuilding({
          projectId: 'proj_mismatch',
          name: 'Mismatched FloorId',
          site: buildingSiteParams,
        }),
        floors: [floor],
      };

      const expectation: ApartmentPlanExpectation = {
        flats: 1,
        units: [
          { label: 'Flat 01', unitType: 'Studio', bedrooms: 0, bathrooms: 0, livingRooms: 1, diningRooms: 0, kitchens: 0, utilities: 0, balconies: 0 },
        ],
        lifts: 0,
        stairs: 0,
        commonLobby: false,
      };

      const result = validateCanonicalApartmentBuilding(building, expectation);
      expect(result.isValid).toBe(false);
      expect(result.verificationIssues.some(i => i.code === 'CANONICAL_INVALID_FLOOR_OWNERSHIP')).toBe(true);
    });

    it('rejects rooms, walls, or stairs placed outside the floor boundary polygon', () => {
      const floorId = 'floor_0';
      const outsideRoom = createRoom({
        floorId,
        name: 'Outside Room',
        type: RoomType.Living,
        x: 12000,
        y: 12000,
        width: 3000,
        height: 3000,
        tags: ['flat:flat_01'],
      });

      const outsideStair = createStair({
        floorId,
        type: StairType.Straight,
        x: 12000,
        y: 2000,
        width: 1200,
        length: 3000,
        connectsFloors: [0, 1],
      });

      const floor: Floor = {
        ...createFloor({ buildingId: 'bldg_1', level: 0 }),
        id: floorId,
        boundary: {
          points: [
            { x: 0, y: 0 },
            { x: 10000, y: 0 },
            { x: 10000, y: 10000 },
            { x: 0, y: 10000 },
          ],
        },
        rooms: [outsideRoom],
        stairs: [outsideStair],
      };

      const building: Building = {
        ...createBuilding({
          projectId: 'proj_outside',
          name: 'Outside Entities',
          site: buildingSiteParams,
        }),
        floors: [floor],
      };

      const expectation: ApartmentPlanExpectation = {
        flats: 1,
        units: [
          { label: 'Flat 01', unitType: 'Studio', bedrooms: 0, bathrooms: 0, livingRooms: 1, diningRooms: 0, kitchens: 0, utilities: 0, balconies: 0 },
        ],
        lifts: 0,
        stairs: 1,
        commonLobby: false,
      };

      const result = validateCanonicalApartmentBuilding(building, expectation);
      expect(result.isValid).toBe(false);
      expect(result.verificationIssues.some(i => i.code.includes('OUT_OF_BOUNDS'))).toBe(true);
    });

    it('reports pending stair status on a single-floor building without claiming completed vertical connections', () => {
      const floorId = 'floor_0';
      const stair = createStair({
        floorId,
        type: StairType.UShaped,
        x: 1000,
        y: 1000,
        width: 1200,
        length: 3000,
        connectsFloors: [0, 1],
      });

      const living = createRoom({
        floorId,
        name: 'Living Room',
        type: RoomType.Living,
        x: 4000,
        y: 1000,
        width: 4000,
        height: 4000,
        tags: ['flat:flat_01'],
      });

      const walls = generateWallsFromRooms(floorId, [living]);

      const floor: Floor = {
        ...createFloor({ buildingId: 'bldg_1', level: 0 }),
        id: floorId,
        boundary: {
          points: [
            { x: 0, y: 0 },
            { x: 10000, y: 0 },
            { x: 10000, y: 10000 },
            { x: 0, y: 10000 },
          ],
        },
        rooms: [living],
        walls,
        stairs: [stair],
      };

      const building: Building = {
        ...createBuilding({
          projectId: 'proj_stair_pending',
          name: 'Stair Pending',
          site: buildingSiteParams,
        }),
        floors: [floor],
      };

      const expectation: ApartmentPlanExpectation = {
        flats: 1,
        units: [
          { label: 'Flat 01', unitType: 'Studio', bedrooms: 0, bathrooms: 0, livingRooms: 1, diningRooms: 0, kitchens: 0, utilities: 0, balconies: 0 },
        ],
        lifts: 0,
        stairs: 1,
        commonLobby: false,
      };

      const result = validateCanonicalApartmentBuilding(building, expectation);
      expect(result.isValid).toBe(true);
      const connectors = (building.metadata as any)?.stairConnectors;
      expect(connectors).toBeDefined();
      expect(connectors[0].status).toBe('PENDING_UPPER_FLOOR');
    });

    it('does not falsely detect collisions between same-coordinate rooms on different floors', () => {
      const roomX = 1000;
      const roomY = 1000;
      const roomW = 4000;
      const roomH = 4000;

      const floorBoundary = {
        points: [
          { x: 0, y: 0 },
          { x: 10000, y: 0 },
          { x: 10000, y: 10000 },
          { x: 0, y: 10000 },
        ],
      };

      const rFloor0 = createRoom({
        floorId: 'fl_0',
        name: 'Level 0 Room',
        type: RoomType.Living,
        x: roomX,
        y: roomY,
        width: roomW,
        height: roomH,
        tags: ['flat:flat_01'],
      });
      const walls0 = generateWallsFromRooms('fl_0', [rFloor0]);

      const rFloor1 = createRoom({
        floorId: 'fl_1',
        name: 'Level 1 Room',
        type: RoomType.Living,
        x: roomX,
        y: roomY,
        width: roomW,
        height: roomH,
        tags: ['flat:flat_02'],
      });
      const walls1 = generateWallsFromRooms('fl_1', [rFloor1]);

      const floor0: Floor = {
        ...createFloor({ buildingId: 'bldg_multi', level: 0 }),
        id: 'fl_0',
        boundary: floorBoundary,
        rooms: [rFloor0],
        walls: walls0,
      };

      const floor1: Floor = {
        ...createFloor({ buildingId: 'bldg_multi', level: 1 }),
        id: 'fl_1',
        boundary: floorBoundary,
        rooms: [rFloor1],
        walls: walls1,
      };

      const building: Building = {
        ...createBuilding({
          projectId: 'proj_multi_level',
          name: 'Multi Level Vertical Stacking',
          site: buildingSiteParams,
        }),
        floors: [floor0, floor1],
      };

      const expectation: ApartmentPlanExpectation = {
        flats: 2,
        units: [
          { label: 'Flat 01', unitType: 'Studio', bedrooms: 0, bathrooms: 0, livingRooms: 1, diningRooms: 0, kitchens: 0, utilities: 0, balconies: 0 },
          { label: 'Flat 02', unitType: 'Studio', bedrooms: 0, bathrooms: 0, livingRooms: 1, diningRooms: 0, kitchens: 0, utilities: 0, balconies: 0 },
        ],
        lifts: 0,
        stairs: 0,
        commonLobby: false,
      };

      const result = validateCanonicalApartmentBuilding(building, expectation);
      expect(result.verificationIssues.some(i => i.code.includes('COLLISION'))).toBe(false);
    });
  });

  // =========================================================================
  // SUITE 5: Phase 2.2.2 — Boundary Integrity Closure & Regression Hardening
  // =========================================================================
  describe('5. Boundary Integrity Closure & Regression Hardening (Phase 2.2.2)', () => {
    describe('5.1 Stepped Polygon Preservation', () => {
      it('preserves a supplied stepped polygon through the adapter even when a room occupies its cutaway', () => {
        // Create a stepped polygon (L-shaped with 6+ vertices)
        const steppedVertices = [
          { x: 5000, y: 5000 },
          { x: 12000, y: 5000 },
          { x: 12000, y: 8000 },
          { x: 10000, y: 8000 },
          { x: 10000, y: 11000 },
          { x: 5000, y: 11000 },
        ];

        const flat: ApartmentPlanFlat = {
          id: 'flat_01',
          label: 'Flat 01',
          unitType: '2BHK',
          rect: { x: 5000, y: 5000, width: 7000, height: 6000 },
          boundary: steppedVertices,
          rooms: [
            createRectRoom('r1', 'Living', 'living_dining', 5000, 5000, 5000, 3000),
            createRectRoom('r2', 'Bedroom', 'bedroom', 5000, 8000, 5000, 3000),
          ],
        };

        const structure: ApartmentPlanStructure = {
          source: 'DETERMINISTIC_SCHEMATIC',
          boundary: [
            { x: 0, y: 0 },
            { x: 20000, y: 0 },
            { x: 20000, y: 20000 },
            { x: 0, y: 20000 },
          ],
          flats: [flat],
          commonRooms: [],
          ungroupedRooms: [],
          lifts: [],
          stairs: [],
          lobbies: [],
          corridors: [],
          shafts: [],
          openings: [],
        };

        const { building } = apartmentStructureToBuilding(structure, standardSite, 'proj_stepped_preserve', 'Stepped Preserve Test');
        const storedBoundaries = (building.metadata as any)?.flatBoundaries;

        expect(storedBoundaries).toBeDefined();
        expect(storedBoundaries).toHaveLength(1);
        // The stepped boundary should be preserved, not replaced with rectangle
        expect(storedBoundaries[0].boundary.points).toHaveLength(6);
        expect(storedBoundaries[0].boundary.points).toEqual(steppedVertices);
      });
    });

    describe('5.2 Concave Boundary Edge Crossing Rejection', () => {
      it('rejects a room polygon with vertices inside a concave boundary but an edge crossing the cutaway', () => {
        // U-shaped flat boundary with concave cutaway notch in the middle
        const steppedVertices = [
          { x: 0, y: 0 },
          { x: 12000, y: 0 },
          { x: 12000, y: 10000 },
          { x: 8000, y: 10000 },
          { x: 8000, y: 4000 },
          { x: 4000, y: 4000 },
          { x: 4000, y: 10000 },
          { x: 0, y: 10000 },
        ];

        // Room spanning both wings:
        // Left wing: x in [0, 4000], y in [0, 10000]
        // Right wing: x in [8000, 12000], y in [0, 10000]
        // Bottom base: x in [0, 12000], y in [0, 4000]
        // Cutaway notch: x in (4000, 8000), y in (4000, 10000]
        const roomCorners = [
          { x: 1000, y: 2000 },
          { x: 11000, y: 2000 },
          { x: 11000, y: 8000 },
          { x: 1000, y: 8000 },
        ];

        // Assert preconditions: ALL four corners are strictly inside the boundary!
        for (const pt of roomCorners) {
          expect(pointInPolygonWithTolerance(pt, steppedVertices, 50)).toBe(true);
        }
        // Top edge from (1000, 8000) to (11000, 8000) crosses the outside notch
        expect(segmentCrossesOutsidePolygon({ start: { x: 1000, y: 8000 }, end: { x: 11000, y: 8000 } }, steppedVertices, 50)).toBe(true);
        expect(containsPolygonWithTolerance(steppedVertices, roomCorners, 50)).toBe(false);

        const cutawayRoom = createRectRoom('r_cutaway', 'Cutaway Bedroom', 'bedroom', 1000, 2000, 10000, 6000);

        const flat: ApartmentPlanFlat = {
          id: 'flat_01',
          label: 'Flat 01',
          unitType: '1BHK',
          rect: { x: 0, y: 0, width: 12000, height: 10000 },
          boundary: steppedVertices,
          rooms: [
            createRectRoom('r1', 'Living', 'living_dining', 500, 500, 3000, 3000),
            cutawayRoom,
          ],
        };

        const structure: ApartmentPlanStructure = {
          source: 'DETERMINISTIC_SCHEMATIC',
          boundary: [
            { x: 0, y: 0 },
            { x: 20000, y: 0 },
            { x: 20000, y: 20000 },
            { x: 0, y: 20000 },
          ],
          flats: [flat],
          commonRooms: [],
          ungroupedRooms: [],
          lifts: [],
          stairs: [],
          lobbies: [],
          corridors: [],
          shafts: [],
          openings: [],
        };

        const { building } = apartmentStructureToBuilding(structure, standardSite, 'proj_cutaway_edge', 'Cutaway Edge Crossing');
        const expectation: ApartmentPlanExpectation = {
          flats: 1,
          units: [{
            label: 'Flat 01',
            unitType: '1BHK',
            bedrooms: 1,
            bathrooms: 0,
            livingRooms: 1,
            diningRooms: 1,
            kitchens: 0,
            utilities: 0,
            balconies: 0,
          }],
          lifts: 0,
          stairs: 0,
          commonLobby: false,
        };

        const result = validateCanonicalApartmentBuilding(building, expectation);
        expect(result.isValid).toBe(false);
        expect(result.verificationIssues.some(i => i.code === 'CANONICAL_ROOM_OUTSIDE_FLAT_BOUNDARY')).toBe(true);
      });

      it('rejects a wall whose endpoints are inside but whose segment crosses a narrow concave notch', () => {
        const floorId = 'floor_0';
        // Floor boundary with a narrow 200mm notch between x=4900 and x=5100 extending down to y=2000
        const floorBoundary = {
          points: [
            { x: 0, y: 0 },
            { x: 10000, y: 0 },
            { x: 10000, y: 10000 },
            { x: 5100, y: 10000 },
            { x: 5100, y: 2000 },
            { x: 4900, y: 2000 },
            { x: 4900, y: 10000 },
            { x: 0, y: 10000 },
          ],
        };

        const living = createRoom({
          floorId,
          name: 'Living',
          type: RoomType.Living,
          x: 1000,
          y: 500,
          width: 3500,
          height: 1200,
          tags: ['flat:flat_01'],
        });
        const bedroom = createRoom({
          floorId,
          name: 'Bedroom',
          type: RoomType.Bedroom,
          x: 5500,
          y: 500,
          width: 3500,
          height: 1200,
          tags: ['flat:flat_01'],
        });

        const walls = generateWallsFromRooms(floorId, [living, bedroom]);

        // Wall with start and end points inside, crossing the narrow notch at non-trivial fraction y=6137
        const wallStart = { x: 1000, y: 6137 };
        const wallEnd = { x: 9000, y: 6137 };

        // Assert preconditions: both endpoints are strictly inside!
        expect(pointInPolygonWithTolerance(wallStart, floorBoundary.points, 50)).toBe(true);
        expect(pointInPolygonWithTolerance(wallEnd, floorBoundary.points, 50)).toBe(true);
        expect(segmentCrossesOutsidePolygon({ start: wallStart, end: wallEnd }, floorBoundary.points, 50)).toBe(true);

        const crossingWall = createWall({
          floorId,
          startPoint: wallStart,
          endPoint: wallEnd,
          type: WallType.Internal,
          thickness: 100,
          roomIds: [living.id, bedroom.id],
        });

        const floor: Floor = {
          ...createFloor({ buildingId: 'bldg_1', level: 0 }),
          id: floorId,
          boundary: floorBoundary,
          rooms: [living, bedroom],
          walls: [...walls, crossingWall],
        };

        const building: Building = {
          ...createBuilding({
            projectId: 'proj_wall_crossing',
            name: 'Wall Crossing Cutaway',
            site: buildingSiteParams,
          }),
          floors: [floor],
        };

        const expectation: ApartmentPlanExpectation = {
          flats: 1,
          units: [
            { label: 'Flat 01', unitType: '1BHK', bedrooms: 1, bathrooms: 0, livingRooms: 1, diningRooms: 0, kitchens: 0, utilities: 0, balconies: 0 },
          ],
          lifts: 0,
          stairs: 0,
          commonLobby: false,
        };

        const result = validateCanonicalApartmentBuilding(building, expectation);
        expect(result.isValid).toBe(false);
        expect(result.verificationIssues.some(i => i.code === 'CANONICAL_WALL_OUT_OF_BOUNDS')).toBe(true);
      });

      it('rejects a stair footprint whose corners are inside but whose edge crosses a cutaway', () => {
        const floorId = 'floor_0';
        const floorBoundary = {
          points: [
            { x: 0, y: 0 },
            { x: 12000, y: 0 },
            { x: 12000, y: 10000 },
            { x: 8000, y: 10000 },
            { x: 8000, y: 4000 },
            { x: 4000, y: 4000 },
            { x: 4000, y: 10000 },
            { x: 0, y: 10000 },
          ],
        };

        const living = createRoom({
          floorId,
          name: 'Living',
          type: RoomType.Living,
          x: 500,
          y: 500,
          width: 3000,
          height: 3000,
          tags: ['flat:flat_01'],
        });

        // Stair whose corners are inside the U-shaped boundary prongs/base but whose top edge crosses the notch
        const crossingStair = createStair({
          floorId,
          type: StairType.Straight,
          x: 1000,
          y: 2000,
          width: 10000,
          length: 6000,
          connectsFloors: [0, 1],
        });

        const stairCorners = [
          { x: 1000, y: 2000 },
          { x: 11000, y: 2000 },
          { x: 11000, y: 8000 },
          { x: 1000, y: 8000 },
        ];

        // Assert preconditions: ALL four corners are strictly inside the boundary!
        for (const pt of stairCorners) {
          expect(pointInPolygonWithTolerance(pt, floorBoundary.points, 50)).toBe(true);
        }
        // Top edge crosses the cutaway notch
        expect(segmentCrossesOutsidePolygon({ start: { x: 1000, y: 8000 }, end: { x: 11000, y: 8000 } }, floorBoundary.points, 50)).toBe(true);
        expect(containsPolygonWithTolerance(floorBoundary.points, stairCorners, 50)).toBe(false);

        const walls = generateWallsFromRooms(floorId, [living]);

        const floor: Floor = {
          ...createFloor({ buildingId: 'bldg_1', level: 0 }),
          id: floorId,
          boundary: floorBoundary,
          rooms: [living],
          walls,
          stairs: [crossingStair],
        };

        const building: Building = {
          ...createBuilding({
            projectId: 'proj_stair_crossing',
            name: 'Stair Crossing Cutaway',
            site: buildingSiteParams,
          }),
          floors: [floor],
        };

        const expectation: ApartmentPlanExpectation = {
          flats: 1,
          units: [
            { label: 'Flat 01', unitType: 'Studio', bedrooms: 0, bathrooms: 0, livingRooms: 1, diningRooms: 0, kitchens: 0, utilities: 0, balconies: 0 },
          ],
          lifts: 0,
          stairs: 1,
          commonLobby: false,
        };

        const result = validateCanonicalApartmentBuilding(building, expectation);
        expect(result.isValid).toBe(false);
        expect(result.verificationIssues.some(i => i.code === 'CANONICAL_STAIR_OUT_OF_BOUNDS')).toBe(true);
      });
    });

    describe('5.3 Column Validation', () => {
      it('rejects an outside column even when floorId is omitted (column footprint outside floor boundary)', () => {
        const floorId = 'floor_0';
        const floorBoundary = {
          points: [
            { x: 0, y: 0 },
            { x: 10000, y: 0 },
            { x: 10000, y: 10000 },
            { x: 0, y: 10000 },
          ],
        };

        const living = createRoom({
          floorId,
          name: 'Living',
          type: RoomType.Living,
          x: 1000,
          y: 1000,
          width: 4000,
          height: 4000,
          tags: ['flat:flat_01'],
        });

        const walls = generateWallsFromRooms(floorId, [living]);

        const floor: Floor = {
          ...createFloor({ buildingId: 'bldg_1', level: 0 }),
          id: floorId,
          boundary: floorBoundary,
          rooms: [living],
          walls,
        };

        // Add a column with floorId omitted (undefined) that is outside the floor boundary
        const colWithoutFloorId = {
          id: 'col_outside',
          floorId: undefined, // Explicitly omitted!
          x: 12000, // Outside!
          y: 5000,
          width: 300,
          depth: 300,
        };

        // Precondition: floorId is undefined
        expect(colWithoutFloorId.floorId).toBeUndefined();

        const building: Building = {
          ...createBuilding({
            projectId: 'proj_column_outside',
            name: 'Column Outside',
            site: buildingSiteParams,
          }),
          floors: [{
            ...floor,
            columns: [colWithoutFloorId] as any,
          }],
        };

        const expectation: ApartmentPlanExpectation = {
          flats: 1,
          units: [
            { label: 'Flat 01', unitType: 'Studio', bedrooms: 0, bathrooms: 0, livingRooms: 1, diningRooms: 0, kitchens: 0, utilities: 0, balconies: 0 },
          ],
          lifts: 0,
          stairs: 0,
          commonLobby: false,
        };

        const result = validateCanonicalApartmentBuilding(building, expectation);
        expect(result.isValid).toBe(false);
        expect(result.verificationIssues.some(i => i.code === 'CANONICAL_COLUMN_OUT_OF_BOUNDS')).toBe(true);
      });

      it('rejects mismatched column floor ownership', () => {
        const floorId = 'floor_0';
        const floorBoundary = {
          points: [
            { x: 0, y: 0 },
            { x: 10000, y: 0 },
            { x: 10000, y: 10000 },
            { x: 0, y: 10000 },
          ],
        };

        const living = createRoom({
          floorId,
          name: 'Living',
          type: RoomType.Living,
          x: 1000,
          y: 1000,
          width: 4000,
          height: 4000,
          tags: ['flat:flat_01'],
        });

        const walls = generateWallsFromRooms(floorId, [living]);

        const floor: Floor = {
          ...createFloor({ buildingId: 'bldg_1', level: 0 }),
          id: floorId,
          boundary: floorBoundary,
          rooms: [living],
          walls,
        };

        // Add a column with mismatched floorId
        const building: Building = {
          ...createBuilding({
            projectId: 'proj_column_mismatch',
            name: 'Column Floor Mismatch',
            site: buildingSiteParams,
          }),
          floors: [{
            ...floor,
            columns: [
              {
                id: 'col_mismatch',
                floorId: 'floor_different', // Wrong floorId!
                x: 5000,
                y: 5000,
                width: 300,
                depth: 300,
              }
            ] as any,
          }],
        };

        const expectation: ApartmentPlanExpectation = {
          flats: 1,
          units: [
            { label: 'Flat 01', unitType: 'Studio', bedrooms: 0, bathrooms: 0, livingRooms: 1, diningRooms: 0, kitchens: 0, utilities: 0, balconies: 0 },
          ],
          lifts: 0,
          stairs: 0,
          commonLobby: false,
        };

        const result = validateCanonicalApartmentBuilding(building, expectation);
        expect(result.isValid).toBe(false);
        expect(result.verificationIssues.some(i => i.code === 'CANONICAL_INVALID_FLOOR_OWNERSHIP')).toBe(true);
      });
    });

    describe('5.4 Multi-unit and Studio Room Programme', () => {
      it('passes for a multi-unit all-Studio plan without bedroom requirements', () => {
        const studioLiving = createRectRoom('s1_living', 'Living', 'living_dining', 5000, 5000, 5000, 4000);
        const studioBath = createRectRoom('s1_bath', 'Bathroom', 'master_toilet', 10000, 5000, 2000, 2000);
        const studioKitchen = createRectRoom('s1_kitchen', 'Kitchen', 'kitchen', 10000, 7000, 2500, 2500);

        const studioLiving2 = createRectRoom('s2_living', 'Living', 'living_dining', 5000, 10000, 5000, 4000);
        const studioBath2 = createRectRoom('s2_bath', 'Bathroom', 'master_toilet', 10000, 10000, 2000, 2000);
        const studioKitchen2 = createRectRoom('s2_kitchen', 'Kitchen', 'kitchen', 10000, 12000, 2500, 2500);

        const flats: ApartmentPlanFlat[] = [
          {
            id: 'flat_studio_1',
            label: 'Studio 1',
            unitType: 'Studio',
            rect: { x: 5000, y: 5000, width: 8000, height: 4500 },
            rooms: [studioLiving, studioBath, studioKitchen],
          },
          {
            id: 'flat_studio_2',
            label: 'Studio 2',
            unitType: 'Studio',
            rect: { x: 5000, y: 10000, width: 8000, height: 4500 },
            rooms: [studioLiving2, studioBath2, studioKitchen2],
          },
        ];

        const structure: ApartmentPlanStructure = {
          source: 'DETERMINISTIC_SCHEMATIC',
          boundary: [
            { x: 2000, y: 2000 },
            { x: 30000, y: 2000 },
            { x: 30000, y: 25000 },
            { x: 2000, y: 25000 },
          ],
          flats,
          commonRooms: [],
          ungroupedRooms: [],
          lifts: [],
          stairs: [],
          lobbies: [],
          corridors: [],
          shafts: [],
          openings: [],
        };

        const { building } = apartmentStructureToBuilding(structure, standardSite, 'proj_all_studio', 'All Studio Multi-unit');
        const expectation: ApartmentPlanExpectation = {
          flats: 2,
          units: [
            {
              label: 'flat_studio_1',
              unitType: 'Studio',
              bedrooms: 0,
              bathrooms: 1,
              livingRooms: 1,
              diningRooms: 0,
              kitchens: 1,
              utilities: 0,
              balconies: 0,
            },
            {
              label: 'flat_studio_2',
              unitType: 'Studio',
              bedrooms: 0,
              bathrooms: 1,
              livingRooms: 1,
              diningRooms: 0,
              kitchens: 1,
              utilities: 0,
              balconies: 0,
            },
          ],
          lifts: 0,
          stairs: 0,
          commonLobby: false,
        };

        const result = validateCanonicalApartmentBuilding(building, expectation);
        expect(result.isValid).toBe(true);
        expect(result.verificationIssues.filter(i => i.severity === 'error')).toHaveLength(0);
        expect(result.verificationIssues.some(i => i.code === 'DESIGN_MISSING_BEDROOM')).toBe(false);
      });

      it('fails for a Studio plan missing its required living space', () => {
        const studioBath = createRectRoom('s_bath', 'Bathroom', 'master_toilet', 10000, 5000, 2000, 2000);

        const flat: ApartmentPlanFlat = {
          id: 'flat_01',
          label: 'Flat 01',
          unitType: 'Studio',
          rect: { x: 5000, y: 5000, width: 7000, height: 4000 },
          rooms: [studioBath], // Missing living space
        };

        const structure: ApartmentPlanStructure = {
          source: 'DETERMINISTIC_SCHEMATIC',
          boundary: [
            { x: 2000, y: 2000 },
            { x: 30000, y: 2000 },
            { x: 30000, y: 25000 },
            { x: 2000, y: 25000 },
          ],
          flats: [flat],
          commonRooms: [],
          ungroupedRooms: [],
          lifts: [],
          stairs: [],
          lobbies: [],
          corridors: [],
          shafts: [],
          openings: [],
        };

        const { building } = apartmentStructureToBuilding(structure, standardSite, 'proj_studio_missing_living', 'Studio Missing Living');
        const expectation: ApartmentPlanExpectation = {
          flats: 1,
          units: [{
            label: 'Flat 01',
            unitType: 'Studio',
            bedrooms: 0,
            bathrooms: 1,
            livingRooms: 1,
            diningRooms: 1,
            kitchens: 0,
            utilities: 0,
            balconies: 0,
          }],
          lifts: 0,
          stairs: 0,
          commonLobby: false,
        };

        const result = validateCanonicalApartmentBuilding(building, expectation);
        expect(result.isValid).toBe(false);
        expect(result.verificationIssues.some(i => i.code.includes('LIVING') || i.code.includes('COUNT_MISMATCH'))).toBe(true);
      });
    });

    describe('5.5 Positive Regression Cases', () => {
      it('passes for a valid rectangular layout', () => {
        const living = createRectRoom('r1', 'Living', 'living_dining', 5000, 5000, 5000, 4000);
        const bedroom = createRectRoom('r2', 'Bedroom', 'bedroom', 5000, 9000, 5000, 4000);
        const kitchen = createRectRoom('r3', 'Kitchen', 'kitchen', 10000, 5000, 2500, 2500);
        const bath = createRectRoom('r4', 'Bathroom', 'master_toilet', 10000, 7500, 2000, 2000);

        const flat: ApartmentPlanFlat = {
          id: 'flat_01',
          label: 'Flat 01',
          unitType: '1BHK',
          rect: { x: 5000, y: 5000, width: 8000, height: 8000 },
          rooms: [living, bedroom, kitchen, bath],
        };

        const structure: ApartmentPlanStructure = {
          source: 'DETERMINISTIC_SCHEMATIC',
          boundary: [
            { x: 0, y: 0 },
            { x: 20000, y: 0 },
            { x: 20000, y: 20000 },
            { x: 0, y: 20000 },
          ],
          flats: [flat],
          commonRooms: [],
          ungroupedRooms: [],
          lifts: [],
          stairs: [],
          lobbies: [],
          corridors: [],
          shafts: [],
          openings: [],
        };

        const { building } = apartmentStructureToBuilding(structure, standardSite, 'proj_rectangular', 'Valid Rectangular');
        const expectation: ApartmentPlanExpectation = {
          flats: 1,
          units: [{
            label: 'Flat 01',
            unitType: '1BHK',
            bedrooms: 1,
            bathrooms: 1,
            livingRooms: 1,
            diningRooms: 1,
            kitchens: 1,
            utilities: 0,
            balconies: 0,
          }],
          lifts: 0,
          stairs: 0,
          commonLobby: false,
        };

        const result = validateCanonicalApartmentBuilding(building, expectation);
        expect(result.isValid).toBe(true);
      });

      it('passes for a valid stepped layout with all rooms inside', () => {
        const steppedVertices = [
          { x: 5000, y: 5000 },
          { x: 12500, y: 5000 },
          { x: 12500, y: 11000 },
          { x: 5000, y: 11000 },
        ];

        const living = createRectRoom('r1', 'Living', 'living_dining', 5000, 5000, 5000, 3000);
        const bedroom = createRectRoom('r2', 'Bedroom', 'bedroom', 5000, 8000, 5000, 3000);
        const kitchen = createRectRoom('r3', 'Kitchen', 'kitchen', 10000, 5000, 2500, 2500);
        const bath = createRectRoom('r4', 'Bathroom', 'master_toilet', 10000, 7500, 2000, 2000);

        const flat: ApartmentPlanFlat = {
          id: 'flat_01',
          label: 'Flat 01',
          unitType: '1BHK',
          rect: { x: 5000, y: 5000, width: 7500, height: 6000 },
          boundary: steppedVertices,
          rooms: [living, bedroom, kitchen, bath],
        };

        const structure: ApartmentPlanStructure = {
          source: 'DETERMINISTIC_SCHEMATIC',
          boundary: [
            { x: 0, y: 0 },
            { x: 20000, y: 0 },
            { x: 20000, y: 20000 },
            { x: 0, y: 20000 },
          ],
          flats: [flat],
          commonRooms: [],
          ungroupedRooms: [],
          lifts: [],
          stairs: [],
          lobbies: [],
          corridors: [],
          shafts: [],
          openings: [],
        };

        const { building } = apartmentStructureToBuilding(structure, standardSite, 'proj_stepped_valid', 'Valid Stepped');
        const expectation: ApartmentPlanExpectation = {
          flats: 1,
          units: [{
            label: 'Flat 01',
            unitType: '1BHK',
            bedrooms: 1,
            bathrooms: 1,
            livingRooms: 1,
            diningRooms: 1,
            kitchens: 1,
            utilities: 0,
            balconies: 0,
          }],
          lifts: 0,
          stairs: 0,
          commonLobby: false,
        };

        const result = validateCanonicalApartmentBuilding(building, expectation);
        expect(result.isValid).toBe(true);
      });

      it('passes for attached balconies on open facade', () => {
        const flatRect = { x: 5000, y: 5000, width: 5000, height: 5000 };
        const living = createRectRoom('rm_living', 'Living', 'living_dining', 5000, 5000, 5000, 5000);
        const attachedBalcony = createRectRoom('rm_balcony', 'Balcony Deck', 'balcony', 10000, 6000, 1500, 2000);

        const flat: ApartmentPlanFlat = {
          id: 'flat_01',
          label: 'Flat 01',
          unitType: '1BHK',
          rect: flatRect,
          rooms: [living, attachedBalcony],
        };

        const structure: ApartmentPlanStructure = {
          source: 'DETERMINISTIC_SCHEMATIC',
          boundary: [
            { x: 0, y: 0 },
            { x: 20000, y: 0 },
            { x: 20000, y: 20000 },
            { x: 0, y: 20000 },
          ],
          flats: [flat],
          commonRooms: [],
          ungroupedRooms: [],
          lifts: [],
          stairs: [],
          lobbies: [],
          corridors: [],
          shafts: [],
          openings: [],
        };

        const { building } = apartmentStructureToBuilding(structure, standardSite, 'proj_balcony_attached', 'Balcony Attached');
        const expectation: ApartmentPlanExpectation = {
          flats: 1,
          units: [{
            label: 'Flat 01',
            unitType: '1BHK',
            bedrooms: 0,
            bathrooms: 0,
            livingRooms: 1,
            diningRooms: 1,
            kitchens: 0,
            utilities: 0,
            balconies: 1,
          }],
          lifts: 0,
          stairs: 0,
          commonLobby: false,
        };

        const result = validateCanonicalApartmentBuilding(building, expectation);
        expect(result.isValid).toBe(true);
        expect(result.verificationIssues.some(i => i.code === 'CANONICAL_BALCONY_ATTACHMENT_INVALID')).toBe(false);
      });

      it('passes for vertically stacked rooms on different floors', () => {
        const floorBoundary = {
          points: [
            { x: 0, y: 0 },
            { x: 10000, y: 0 },
            { x: 10000, y: 10000 },
            { x: 0, y: 10000 },
          ],
        };

        const rFloor0 = createRoom({
          floorId: 'fl_0',
          name: 'Level 0 Living',
          type: RoomType.Living,
          x: 1000,
          y: 1000,
          width: 4000,
          height: 4000,
          tags: ['flat:flat_01'],
        });
        const walls0 = generateWallsFromRooms('fl_0', [rFloor0]);

        const rFloor1 = createRoom({
          floorId: 'fl_1',
          name: 'Level 1 Bedroom',
          type: RoomType.Bedroom,
          x: 1000,
          y: 1000,
          width: 4000,
          height: 4000,
          tags: ['flat:flat_01'],
        });
        const walls1 = generateWallsFromRooms('fl_1', [rFloor1]);

        const floor0: Floor = {
          ...createFloor({ buildingId: 'bldg_multi', level: 0 }),
          id: 'fl_0',
          boundary: floorBoundary,
          rooms: [rFloor0],
          walls: walls0,
        };

        const floor1: Floor = {
          ...createFloor({ buildingId: 'bldg_multi', level: 1 }),
          id: 'fl_1',
          boundary: floorBoundary,
          rooms: [rFloor1],
          walls: walls1,
        };

        const building: Building = {
          ...createBuilding({
            projectId: 'proj_vertical_stack',
            name: 'Vertical Stacking',
            site: buildingSiteParams,
          }),
          floors: [floor0, floor1],
        };

        const expectation: ApartmentPlanExpectation = {
          flats: 1,
          units: [
            { label: 'Flat 01', unitType: '1BHK', bedrooms: 1, bathrooms: 0, livingRooms: 1, diningRooms: 0, kitchens: 0, utilities: 0, balconies: 0 },
          ],
          lifts: 0,
          stairs: 0,
          commonLobby: false,
        };

        const result = validateCanonicalApartmentBuilding(building, expectation);
        expect(result.isValid).toBe(true);
        expect(result.verificationIssues.some(i => i.code.includes('COLLISION'))).toBe(false);
      });
    });
  });
});
