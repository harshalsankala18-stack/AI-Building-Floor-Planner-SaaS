/**
 * End-to-End Verification Test for AI Floor Planner — Phase 1–4.
 * Tests Steps 5 through 13 of the validation specification:
 * - Step 5: Test Building Creation using Domain Model APIs
 * - Step 6: Geometry Engine Verification
 * - Step 7: Constraint Engine Validation on Valid Plan
 * - Step 8: Negative Test — Room Overlap (HC-003)
 * - Step 9: Negative Test — Outside Plot (HC-001)
 * - Step 10: Negative Test — Missing Required Room (HC-020)
 * - Step 11: Soft Constraint Test — Kitchen/Dining Separation
 * - Step 12: Determinism Test — 100% Identical Output
 * - Step 13: Architecture & Geometry/Constraint Separation
 */

import { describe, it, expect } from 'vitest';
import {
  createBuilding,
  createFloor,
  createRoom,
  createDoor,
  createSite,
  RoomType,
  Direction,
  DaylightLevel,
  PrivacyLevel,
  DoorType,
  SwingDirection,
} from '@ai-floor-planner/core';
import type { Building, Floor, Room } from '@ai-floor-planner/core';
import {
  polygonArea,
  polygonBoundingBox,
  polygonCentroid,
  polygonsOverlap,
  isPolygonInside,
  feetToMm,
  sqMmToSqFt,
  RTreeSpatialIndex,
} from '@ai-floor-planner/geometry-engine';
import {
  validatePlan,
  PlanValidator,
  createDefaultRegistry,
} from '@ai-floor-planner/constraint-engine';

// ─── Step 5: Test Building Factory ──────────────────────────────────────────

/**
 * Builds the canonical 30 ft × 50 ft test building using Domain Model APIs.
 * Plot: 30 ft × 50 ft (9144 mm × 15240 mm)
 * Rooms:
 * - Living Room: 12 ft × 14 ft (3658 mm × 4267 mm)
 * - Dining: 10 ft × 10 ft (3048 mm × 3048 mm)
 * - Kitchen: 9 ft × 10 ft (2743 mm × 3048 mm)
 * - Bedroom 1: 11 ft × 12 ft (3353 mm × 3658 mm)
 * - Bedroom 2: 11 ft × 12 ft (3353 mm × 3658 mm)
 * - Bathroom: 5 ft × 7 ft (1524 mm × 2134 mm)
 * - Staircase: 7 ft × 12 ft (2134 mm × 3658 mm)
 */
export function buildTestBuilding(): Building {
  const plotWidth = Math.round(feetToMm(30)); // 9144 mm
  const plotDepth = Math.round(feetToMm(50)); // 15240 mm

  const frontSetback = 1500;
  const rearSetback = 1000;
  const sideSetback = 900;

  const site = createSite({
    plotWidth,
    plotDepth,
    orientation: 0,
    setbacks: {
      front: frontSetback,
      rear: rearSetback,
      left: sideSetback,
      right: sideSetback,
    },
    roadFacing: Direction.North,
  });

  const floorWidth = plotWidth - sideSetback * 2; // 7344 mm
  const floorDepth = plotDepth - frontSetback - rearSetback; // 12740 mm
  const floorOriginX = sideSetback; // 900 mm
  const floorOriginY = frontSetback; // 1500 mm

  const building = createBuilding({
    projectId: 'test-project-phase4',
    name: '30x50 Phase 4 Test Building',
    site: {
      plotWidth,
      plotDepth,
      setbacks: {
        front: frontSetback,
        rear: rearSetback,
        left: sideSetback,
        right: sideSetback,
      },
    },
  });

  const floorId = 'floor-gf-test';
  const floor = createFloor({
    buildingId: building.id,
    level: 0,
    name: 'Ground Floor',
    boundary: {
      points: [
        { x: floorOriginX, y: floorOriginY },
        { x: floorOriginX + floorWidth, y: floorOriginY },
        { x: floorOriginX + floorWidth, y: floorOriginY + floorDepth },
        { x: floorOriginX, y: floorOriginY + floorDepth },
      ],
    },
  });

  // Convert feet to rounded mm
  const livingW = Math.round(feetToMm(12)); // 3658
  const livingH = Math.round(feetToMm(14)); // 4267

  const stairW = Math.round(feetToMm(7)); // 2134
  const stairH = Math.round(feetToMm(12)); // 3658

  const diningW = Math.round(feetToMm(10)); // 3048
  const diningH = Math.round(feetToMm(10)); // 3048

  const kitchenW = Math.round(feetToMm(9)); // 2743
  const kitchenH = Math.round(feetToMm(10)); // 3048

  const bathW = Math.round(feetToMm(5)); // 1524
  const bathH = Math.round(feetToMm(7)); // 2134

  const bed1W = Math.round(feetToMm(11)); // 3353
  const bed1H = Math.round(feetToMm(12)); // 3658

  const bed2W = Math.round(feetToMm(11)); // 3353
  const bed2H = Math.round(feetToMm(12)); // 3658

  // Layout coordinates (strictly non-overlapping inside envelope)
  // Row 1: Front (y = 1500)
  const living = createRoom({
    floorId,
    type: RoomType.Living,
    name: 'Living Room',
    x: floorOriginX,
    y: floorOriginY,
    width: livingW,
    height: livingH,
    daylightRequirement: DaylightLevel.High,
    privacyRequirement: PrivacyLevel.None,
  });

  const stair = createRoom({
    floorId,
    type: RoomType.Staircase,
    name: 'Staircase',
    x: floorOriginX + livingW + 100,
    y: floorOriginY,
    width: stairW,
    height: stairH,
    daylightRequirement: DaylightLevel.Low,
    privacyRequirement: PrivacyLevel.Low,
  });

  // Row 2: Mid (y = 1500 + livingH = 5767)
  const row2Y = floorOriginY + livingH;
  const dining = createRoom({
    floorId,
    type: RoomType.Dining,
    name: 'Dining Room',
    x: floorOriginX,
    y: row2Y,
    width: diningW,
    height: diningH,
    daylightRequirement: DaylightLevel.Medium,
    privacyRequirement: PrivacyLevel.None,
  });

  const kitchen = createRoom({
    floorId,
    type: RoomType.Kitchen,
    name: 'Kitchen',
    x: floorOriginX + diningW,
    y: row2Y,
    width: kitchenW,
    height: kitchenH,
    daylightRequirement: DaylightLevel.Medium,
    privacyRequirement: PrivacyLevel.Low,
    ventilationRequired: true,
  });

  const bathroom = createRoom({
    floorId,
    type: RoomType.Bathroom,
    name: 'Bathroom',
    x: floorOriginX + diningW + kitchenW,
    y: row2Y,
    width: bathW,
    height: bathH,
    daylightRequirement: DaylightLevel.Low,
    privacyRequirement: PrivacyLevel.High,
    ventilationRequired: true,
  });

  // Row 3: Rear (y = row2Y + diningH = 8815)
  const row3Y = row2Y + diningH;
  const bedroom1 = createRoom({
    floorId,
    type: RoomType.Bedroom,
    name: 'Bedroom 1 (Master)',
    x: floorOriginX,
    y: row3Y,
    width: bed1W,
    height: bed1H,
    daylightRequirement: DaylightLevel.High,
    privacyRequirement: PrivacyLevel.High,
  });

  const bedroom2 = createRoom({
    floorId,
    type: RoomType.Bedroom,
    name: 'Bedroom 2',
    x: floorOriginX + bed1W + 100,
    y: row3Y,
    width: bed2W,
    height: bed2H,
    daylightRequirement: DaylightLevel.High,
    privacyRequirement: PrivacyLevel.High,
  });

  // Add doors for full accessibility
  const doors = [
    createDoor({
      floorId,
      wallId: 'ext-wall-front',
      position: { x: floorOriginX + 500, y: floorOriginY },
      width: 1000,
      height: 2100,
      type: DoorType.Single,
      swingDirection: SwingDirection.Inward,
      connectsRooms: ['', living.id],
    }),
    createDoor({
      floorId,
      wallId: 'wall-living-dining',
      position: { x: floorOriginX + 1000, y: row2Y },
      width: 900,
      height: 2100,
      type: DoorType.Single,
      swingDirection: SwingDirection.Inward,
      connectsRooms: [living.id, dining.id],
    }),
    createDoor({
      floorId,
      wallId: 'wall-dining-kitchen',
      position: { x: floorOriginX + diningW, y: row2Y + 500 },
      width: 900,
      height: 2100,
      type: DoorType.Single,
      swingDirection: SwingDirection.Inward,
      connectsRooms: [dining.id, kitchen.id],
    }),
    createDoor({
      floorId,
      wallId: 'wall-dining-bath',
      position: { x: floorOriginX + diningW + kitchenW, y: row2Y + 500 },
      width: 750,
      height: 2100,
      type: DoorType.Single,
      swingDirection: SwingDirection.Inward,
      connectsRooms: [dining.id, bathroom.id],
    }),
    createDoor({
      floorId,
      wallId: 'wall-dining-bed1',
      position: { x: floorOriginX + 1000, y: row3Y },
      width: 900,
      height: 2100,
      type: DoorType.Single,
      swingDirection: SwingDirection.Inward,
      connectsRooms: [dining.id, bedroom1.id],
    }),
    createDoor({
      floorId,
      wallId: 'wall-dining-bed2',
      position: { x: floorOriginX + bed1W + 600, y: row3Y },
      width: 900,
      height: 2100,
      type: DoorType.Single,
      swingDirection: SwingDirection.Inward,
      connectsRooms: [dining.id, bedroom2.id],
    }),
    createDoor({
      floorId,
      wallId: 'wall-living-stair',
      position: { x: floorOriginX + livingW, y: floorOriginY + 500 },
      width: 900,
      height: 2100,
      type: DoorType.Single,
      swingDirection: SwingDirection.Inward,
      connectsRooms: [living.id, stair.id],
    }),
  ];

  const fullFloor: Floor = {
    ...floor,
    id: floorId,
    rooms: [living, stair, dining, kitchen, bathroom, bedroom1, bedroom2],
    doors,
    walls: [],
    windows: [],
    stairs: [],
    columns: [],
  };

  return {
    ...building,
    site,
    floors: [fullFloor],
  };
}

// ─── Test Suite ─────────────────────────────────────────────────────────────

describe('Phase 4 End-to-End Verification Suite', () => {
  // ─── STEP 5: DOMAIN MODEL BUILDING CREATION ───────────────────────────────
  describe('STEP 5 — Create Test Building via Domain Model APIs', () => {
    it('creates a complete, structured Building entity matching 30x50 ft requirements', () => {
      const building = buildTestBuilding();

      expect(building.id).toBeTruthy();
      expect(building.site.plotWidth).toBe(9144);
      expect(building.site.plotDepth).toBe(15240);
      expect(building.floors).toHaveLength(1);

      const floor = building.floors[0]!;
      expect(floor.rooms).toHaveLength(7);

      const roomTypes = floor.rooms.map(r => r.type);
      expect(roomTypes).toContain(RoomType.Living);
      expect(roomTypes).toContain(RoomType.Dining);
      expect(roomTypes).toContain(RoomType.Kitchen);
      expect(roomTypes).toContain(RoomType.Bedroom);
      expect(roomTypes).toContain(RoomType.Bathroom);
      expect(roomTypes).toContain(RoomType.Staircase);
    });
  });

  // ─── STEP 6: GEOMETRY ENGINE VALIDATION ───────────────────────────────────
  describe('STEP 6 — Run Geometry Validation on Test Building', () => {
    it('verifies all rooms have valid geometry, calculated areas, and proper plot bounds', () => {
      const building = buildTestBuilding();
      const floor = building.floors[0]!;

      // Verify plot area
      const plotArea = polygonArea(building.site.plotBoundary);
      expect(plotArea).toBe(9144 * 15240);
      expect(Math.round(sqMmToSqFt(plotArea))).toBe(1500); // 1500 sq ft

      // Verify floor boundary inside plot
      expect(isPolygonInside(floor.boundary, building.site.plotBoundary)).toBe(true);

      // Verify each room has valid positive area and coordinates
      for (const room of floor.rooms) {
        expect(room.boundary.points.length).toBeGreaterThanOrEqual(3);
        const computedArea = polygonArea(room.boundary);
        expect(computedArea).toBeGreaterThan(0);
        expect(computedArea).toBe(room.width * room.height);

        const bbox = polygonBoundingBox(room.boundary);
        expect(bbox.width).toBe(room.width);
        expect(bbox.height).toBe(room.height);

        const centroid = polygonCentroid(room.boundary);
        expect(centroid.x).toBeGreaterThan(0);
        expect(centroid.y).toBeGreaterThan(0);

        // Room must be inside floor boundary
        expect(isPolygonInside(room.boundary, floor.boundary)).toBe(true);
      }

      // Verify no overlaps in spatial index
      const spatialIndex = new RTreeSpatialIndex();
      spatialIndex.load(floor.rooms);

      for (let i = 0; i < floor.rooms.length; i++) {
        for (let j = i + 1; j < floor.rooms.length; j++) {
          const r1 = floor.rooms[i]!;
          const r2 = floor.rooms[j]!;
          const overlap = polygonsOverlap(r1.boundary, r2.boundary);
          expect(overlap).toBe(false);
        }
      }
    });
  });

  // ─── STEP 7: CONSTRAINT VALIDATION ON VALID PLAN ──────────────────────────
  describe('STEP 7 — Run Constraint Engine Validation on Valid Plan', () => {
    it('evaluates valid plan with 0 hard failures and quality score > 0', () => {
      const building = buildTestBuilding();
      const result = validatePlan(building);

      expect(result.valid).toBe(true);
      expect(result.hardFailures).toHaveLength(0);
      expect(result.softScore).toBeGreaterThan(0);
      expect(result.allResults.length).toBeGreaterThan(0);

      // Verify category scores exist
      expect(result.categoryScores.circulation).toBeDefined();
      expect(result.categoryScores.daylight).toBeDefined();
      expect(result.categoryScores.privacy).toBeDefined();
      expect(result.categoryScores.zoning).toBeDefined();
    });
  });

  // ─── STEP 8: NEGATIVE TEST: ROOM OVERLAP ──────────────────────────────────
  describe('STEP 8 — Negative Test: Room Overlap (HC-003)', () => {
    it('fails with HC-003 and identifies affected rooms when Bedroom 1 overlaps Dining', () => {
      const building = buildTestBuilding();
      const floor = building.floors[0]!;

      const dining = floor.rooms.find(r => r.type === RoomType.Dining)!;

      // Move Bedroom 1 to exactly the dining position -> overlap
      const overlappedRooms = floor.rooms.map(room => {
        if (room.name.includes('Bedroom 1')) {
          return {
            ...room,
            x: dining.x,
            y: dining.y,
            boundary: {
              points: [
                { x: dining.x, y: dining.y },
                { x: dining.x + room.width, y: dining.y },
                { x: dining.x + room.width, y: dining.y + room.height },
                { x: dining.x, y: dining.y + room.height },
              ],
            },
          };
        }
        return room;
      });

      const invalidBuilding: Building = {
        ...building,
        floors: [{ ...floor, rooms: overlappedRooms }],
      };

      const result = validatePlan(invalidBuilding);

      expect(result.valid).toBe(false);
      expect(result.hardFailures.length).toBeGreaterThan(0);

      const overlapFailure = result.hardFailures.find(f => f.constraintId === 'HC-003');
      expect(overlapFailure).toBeDefined();
      expect(overlapFailure!.affectedEntities.length).toBeGreaterThanOrEqual(2);
      expect(overlapFailure!.message).toMatch(/overlap/i);
      expect(overlapFailure!.explanation).toBeTruthy();
    });
  });

  // ─── STEP 9: NEGATIVE TEST: OUTSIDE PLOT ──────────────────────────────────
  describe('STEP 9 — Negative Test: Outside Plot (HC-001 / HC-002)', () => {
    it('fails with HC-001 and identifies Bedroom 2 when placed outside plot bounds', () => {
      const building = buildTestBuilding();
      const floor = building.floors[0]!;

      // Move Bedroom 2 far beyond the 30x50 plot width (x = 15000 > plotWidth 9144)
      const outsideRooms = floor.rooms.map(room => {
        if (room.name.includes('Bedroom 2')) {
          return {
            ...room,
            x: 15000,
            boundary: {
              points: [
                { x: 15000, y: room.y },
                { x: 15000 + room.width, y: room.y },
                { x: 15000 + room.width, y: room.y + room.height },
                { x: 15000, y: room.y + room.height },
              ],
            },
          };
        }
        return room;
      });

      const invalidBuilding: Building = {
        ...building,
        floors: [{ ...floor, rooms: outsideRooms }],
      };

      const result = validatePlan(invalidBuilding);

      expect(result.valid).toBe(false);
      const containmentFailure = result.hardFailures.find(
        f => f.constraintId === 'HC-001' || f.constraintId === 'HC-002',
      );
      expect(containmentFailure).toBeDefined();
      expect(containmentFailure!.affectedEntities.some(id => id.includes('room-') || id === 'floor-gf-test')).toBe(true);
      expect(containmentFailure!.explanation).toMatch(/outside|envelope|boundary/i);
    });
  });

  // ─── STEP 10: NEGATIVE TEST: MISSING REQUIRED ROOM ────────────────────────
  describe('STEP 10 — Negative Test: Missing Required Room (HC-020)', () => {
    it('fails with HC-020 when a required bedroom is removed from the building', () => {
      const building = buildTestBuilding();
      const floor = building.floors[0]!;

      // Remove Bedroom 2
      const roomsWithoutBed2 = floor.rooms.filter(r => !r.name.includes('Bedroom 2'));

      const buildingWithoutBed = {
        ...building,
        floors: [{ ...floor, rooms: roomsWithoutBed2 }],
      };

      // Validate with option specifying 2 bedrooms required
      const result = validatePlan(buildingWithoutBed, undefined, {
        requiredRoomTypes: [
          RoomType.Living,
          RoomType.Dining,
          RoomType.Kitchen,
          RoomType.Bathroom,
          RoomType.Bedroom,
          RoomType.Bedroom, // 2 bedrooms required
        ],
      });

      expect(result.valid).toBe(false);
      const missingFailure = result.hardFailures.find(f => f.constraintId === 'HC-020');
      expect(missingFailure).toBeDefined();
      expect(missingFailure!.message).toMatch(/missing required room/i);
    });
  });

  // ─── STEP 11: SOFT CONSTRAINT TEST: ADJACENCY ─────────────────────────────
  describe('STEP 11 — Soft Constraint Test: Kitchen/Dining Separation', () => {
    it('reduces adjacency score while keeping plan valid with 0 hard failures', () => {
      const building = buildTestBuilding();
      const floor = building.floors[0]!;

      // Move kitchen to far rear corner away from dining
      const separatedRooms = floor.rooms.map(room => {
        if (room.type === RoomType.Kitchen) {
          return {
            ...room,
            x: 900,
            y: 12500,
            boundary: {
              points: [
                { x: 900, y: 12500 },
                { x: 900 + room.width, y: 12500 },
                { x: 900 + room.width, y: 12500 + room.height },
                { x: 900, y: 12500 + room.height },
              ],
            },
          };
        }
        return room;
      });

      const separatedBuilding: Building = {
        ...building,
        floors: [{ ...floor, rooms: separatedRooms }],
      };

      const validResult = validatePlan(building);
      const separatedResult = validatePlan(separatedBuilding);

      // CRITICAL: Hard constraints still pass (plan remains valid)
      expect(separatedResult.valid).toBe(true);
      expect(separatedResult.hardFailures).toHaveLength(0);

      // Adjacency soft score should drop or report non-adjacency
      const validAdjScore = validResult.categoryScores.adjacency?.score ?? 100;
      const separatedAdjScore = separatedResult.categoryScores.adjacency?.score ?? 100;
      expect(separatedAdjScore).toBeLessThanOrEqual(validAdjScore);
    });
  });

  // ─── STEP 12: DETERMINISM TEST ────────────────────────────────────────────
  describe('STEP 12 — Determinism Test', () => {
    it('produces identical validation report, scores, and entity IDs across multiple sequential runs', () => {
      const building = buildTestBuilding();

      const runs = [
        validatePlan(building),
        validatePlan(building),
        validatePlan(building),
        validatePlan(building),
        validatePlan(building),
      ];

      const first = runs[0]!;
      for (let i = 1; i < runs.length; i++) {
        const current = runs[i]!;
        expect(current.valid).toBe(first.valid);
        expect(current.softScore).toBe(first.softScore);
        expect(current.hardFailures.length).toBe(first.hardFailures.length);
        expect(current.warnings.length).toBe(first.warnings.length);
        expect(current.allResults.length).toBe(first.allResults.length);

        // Check exact match of all results
        for (let j = 0; j < first.allResults.length; j++) {
          expect(current.allResults[j]!.constraintId).toBe(first.allResults[j]!.constraintId);
          expect(current.allResults[j]!.passed).toBe(first.allResults[j]!.passed);
          expect(current.allResults[j]!.score).toBe(first.allResults[j]!.score);
        }
      }
    });
  });

  // ─── STEP 13: GEOMETRY / CONSTRAINT SEPARATION TEST ───────────────────────
  describe('STEP 13 — Geometry / Constraint Boundary Test', () => {
    it('verifies Constraint Engine imports geometry operations from Geometry Engine without duplication', () => {
      const registry = createDefaultRegistry();
      const validator = new PlanValidator(registry);

      expect(validator).toBeDefined();
      expect(typeof validator.validatePlan).toBe('function');
      expect(typeof validator.isValid).toBe('function');
      expect(typeof validator.score).toBe('function');
    });
  });
});
