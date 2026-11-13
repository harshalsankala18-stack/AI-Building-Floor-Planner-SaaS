import { describe, expect, it } from 'vitest';
import {
  reconstructBuildingFromImage,
  type ExtractionSite,
  type ImageSourceIdentity,
} from '../services/image-to-cad-reconstruction.js';
import {
  DoorType,
  normalizeDesignRequirementSpecification,
  RoomType,
  StairType,
  WallType,
  WindowType,
} from '@ai-floor-planner/core';
import {
  computeStairSolids,
  createExtractionMetadata,
  parseExtractionPayload,
  validateDoorPlacement,
  validateWindowPlacement,
} from '@ai-floor-planner/planning-engine';

describe('Phase 4 — Complete Architectural Entity & Opening Reconstruction', () => {
  const site: ExtractionSite = {
    plotWidth: 15240,
    plotDepth: 18290,
    orientation: 0,
    roadFacing: 'north',
    frontSetback: 1800,
    rearSetback: 1200,
    leftSetback: 1200,
    rightSetback: 1200,
    plannedFloorCount: 2,
  };

  const requirements = normalizeDesignRequirementSpecification({
    hard: {
      plotWidthMm: 15240,
      plotDepthMm: 18290,
      bedroomCount: 3,
      bathroomCount: 3,
      floorsCount: 2,
      roadFacing: 'north',
      staircaseRequired: true,
      parkingRequired: true,
      balconyRequired: true,
    },
    rawUserPrompt: 'G+1 3BHK villa with parking, foyer, U-shaped staircase, pooja, pantry, utility, and balcony',
  });

  const source: ImageSourceIdentity = {
    artifactId: 'gen_phase4_entities',
    imageHash: 'c'.repeat(64),
    generationRevision: 1,
    projectFingerprint: 'fp_phase4_entities',
    visionModel: 'gemini-3.1-flash-lite',
    interpretationSource: 'provider',
    imageWidePixels: 1024,
    imageTallPixels: 1280,
  };

  const metadata = createExtractionMetadata({
    imageWidePixels: 1024,
    imageTallPixels: 1280,
    frameWidth: 1000,
    frameHeight: 1000,
    plotWidth: site.plotWidth,
    plotDepth: site.plotDepth,
    orientation: site.orientation,
    roadFacing: site.roadFacing,
    extractionSource: 'gemini_vision',
    confidence: 'confirmed',
  });

  it('deduplicates duplicate stair and parking entries, closes <=300mm inter-room wall gaps, and reconstructs semantic rooms, walls, doors, windows, and U-shaped stairs', () => {
    const payload = {
      footprintShape: 'l-shape',
      entranceSide: 'north',
      boundary: {
        points: [
          { x: 180, y: 80 },
          { x: 900, y: 80 },
          { x: 900, y: 460 },
          { x: 100, y: 460 },
          { x: 100, y: 240 },
          { x: 180, y: 240 },
        ],
      },
      floors: [
        {
          level: 0,
          name: 'Ground Floor Plan',
          boundary: {
            points: [
              { x: 180, y: 80 },
              { x: 900, y: 80 },
              { x: 900, y: 460 },
              { x: 100, y: 460 },
              { x: 100, y: 240 },
              { x: 180, y: 240 },
            ],
          },
        },
        {
          level: 1,
          name: 'First Floor Plan',
          boundary: {
            points: [
              { x: 180, y: 540 },
              { x: 900, y: 540 },
              { x: 900, y: 920 },
              { x: 180, y: 920 },
            ],
          },
        },
      ],
      rooms: [
        // Ground Floor (Level 0) with realistic 10-unit (~150mm) vision wall-thickness gaps between rooms
        { id: 'gf_parking', name: 'Car Parking', type: 'parking', floorLevel: 0, x: 100, y: 240, width: 180, height: 220 },
        { id: 'gf_stair', name: 'U-Shaped Staircase', type: 'staircase', floorLevel: 0, x: 290, y: 240, width: 140, height: 220 },
        { id: 'gf_foyer', name: 'Entrance Foyer', type: 'foyer', floorLevel: 0, x: 440, y: 240, width: 120, height: 220 },
        { id: 'gf_bed1', name: 'Bedroom 1', type: 'bedroom', floorLevel: 0, x: 180, y: 80, width: 250, height: 150 },
        { id: 'gf_bath1', name: 'Common Bath', type: 'bathroom', floorLevel: 0, x: 440, y: 80, width: 110, height: 150 },
        {
          id: 'gf_living',
          name: 'Living Room',
          type: 'living',
          floorLevel: 0,
          x: 560,
          y: 80,
          width: 340,
          height: 180,
          boundary: {
            points: [
              { x: 560, y: 80 },
              { x: 900, y: 80 },
              { x: 900, y: 220 },
              { x: 840, y: 220 },
              { x: 840, y: 260 },
              { x: 560, y: 260 },
            ],
          },
        },
        { id: 'gf_dining', name: 'Dining Room', type: 'dining', floorLevel: 0, x: 570, y: 270, width: 170, height: 190 },
        { id: 'gf_kitchen', name: 'Kitchen', type: 'kitchen', floorLevel: 0, x: 750, y: 270, width: 150, height: 140 },
        { id: 'gf_pantry', name: 'Pantry', type: 'pantry', floorLevel: 0, x: 750, y: 415, width: 70, height: 45 },
        { id: 'gf_pooja', name: 'Pooja Mandir', type: 'pooja', floorLevel: 0, x: 825, y: 415, width: 75, height: 45 },

        // First Floor (Level 1)
        { id: 'ff_stair', name: 'U-Shaped Staircase', type: 'staircase', floorLevel: 1, x: 295, y: 700, width: 140, height: 220 },
        { id: 'ff_bed2', name: 'Bedroom 2', type: 'bedroom', floorLevel: 1, x: 180, y: 540, width: 250, height: 150 },
        { id: 'ff_bed3', name: 'Bedroom 3', type: 'bedroom', floorLevel: 1, x: 180, y: 700, width: 110, height: 220 },
        { id: 'ff_bath2', name: 'Common Bathroom', type: 'bathroom', floorLevel: 1, x: 440, y: 540, width: 110, height: 150 },
        { id: 'ff_ensuite', name: 'En-Suite Master Bath', type: 'bathroom', floorLevel: 1, x: 560, y: 540, width: 110, height: 150 },
        { id: 'ff_master', name: 'Master Bedroom', type: 'bedroom', floorLevel: 1, x: 680, y: 540, width: 220, height: 260 },
        { id: 'ff_store', name: 'Linen Store', type: 'store', floorLevel: 1, x: 440, y: 700, width: 110, height: 100 },
        { id: 'ff_balcony', name: 'Front Balcony', type: 'balcony', floorLevel: 1, x: 560, y: 810, width: 340, height: 110 },
      ],
      // Duplicate stairs and parking entries (as Gemini Vision frequently outputs)
      stairs: [
        { id: 'st_dup_gf', name: 'U-Shaped Staircase', x: 290, y: 240, width: 140, height: 220, floorLevel: 0 },
        { id: 'st_dup_ff', name: 'U-Shaped Staircase', x: 295, y: 700, width: 140, height: 220, floorLevel: 1 },
      ],
      parking: [
        { id: 'pk_dup_gf', name: 'Car Parking', x: 100, y: 240, width: 180, height: 220 },
      ],
      doors: [
        { id: 'd_main', x: 480, y: 455, width: 90, height: 15, type: 'double', swingDirection: 'inward', adjacentRoomId: 'gf_foyer', floorLevel: 0 },
        { id: 'd_bath1', x: 470, y: 225, width: 55, height: 15, type: 'single', swingDirection: 'right', adjacentRoomId: 'gf_bath1', floorLevel: 0 },
        { id: 'd_bed1', x: 320, y: 225, width: 65, height: 15, type: 'single', swingDirection: 'left', adjacentRoomId: 'gf_bed1', floorLevel: 0 },
        { id: 'd_master', x: 680, y: 680, width: 15, height: 65, type: 'single', swingDirection: 'inward', adjacentRoomId: 'ff_master', floorLevel: 1 },
      ],
      windows: [
        // Wide living room window
        { id: 'w_living', x: 660, y: 80, width: 180, height: 15, adjacentRoomId: 'gf_living', floorLevel: 0 },
        // Bathroom ventilator
        { id: 'w_bath1', x: 470, y: 80, width: 45, height: 15, adjacentRoomId: 'gf_bath1', floorLevel: 0 },
        // Kitchen casement window
        { id: 'w_kitchen', x: 895, y: 310, width: 15, height: 80, adjacentRoomId: 'gf_kitchen', floorLevel: 0 },
        // Master bedroom window on First Floor
        { id: 'w_master', x: 895, y: 620, width: 15, height: 100, adjacentRoomId: 'ff_master', floorLevel: 1 },
      ],
    };

    const parsed = parseExtractionPayload(payload, metadata, 'plan_phase4');
    expect(parsed.plan).not.toBeNull();

    const recon = reconstructBuildingFromImage({
      plan: parsed.plan!,
      rawVisionPayload: payload,
      requirements,
      site,
      projectId: 'proj_phase4',
      projectName: 'Vasant Vihar Phase 4',
      source,
    });
    expect(recon.ok).toBe(true);
    if (!recon.ok) return;

    const gf = recon.building.floors[0]!;
    const ff = recon.building.floors[1]!;

    // 1. No crushed 50mm (0'-2") rooms even when Vision emits duplicate stairs/parking entries
    const gfStairRooms = gf.rooms.filter(r => r.type === RoomType.Staircase);
    const ffStairRooms = ff.rooms.filter(r => r.type === RoomType.Staircase);
    const gfParkingRooms = gf.rooms.filter(r => r.type === RoomType.Parking);
    expect(gfStairRooms.length).toBeGreaterThanOrEqual(1);
    expect(ffStairRooms.length).toBeGreaterThanOrEqual(1);
    expect(gfParkingRooms.length).toBeGreaterThanOrEqual(1);
    for (const room of [...gf.rooms, ...ff.rooms]) {
      expect(room.width).toBeGreaterThanOrEqual(600);
      expect(room.height).toBeGreaterThanOrEqual(600);
    }

    // 2. Semantic room types preserved
    expect(gf.rooms.some(r => r.type === RoomType.Utility)).toBe(true);
    expect(gf.rooms.some(r => r.type === RoomType.Pooja)).toBe(true);
    expect(gf.rooms.some(r => r.type === RoomType.Foyer)).toBe(true);
    expect(ff.rooms.some(r => r.type === RoomType.Storage)).toBe(true);
    expect(ff.rooms.some(r => r.type === RoomType.Balcony)).toBe(true);

    // 3. Shared internal walls (115mm) and external walls (230mm) created
    expect(gf.walls.some(w => w.type === WallType.External && w.thickness === 230 && w.loadBearing)).toBe(true);
    expect(gf.walls.some(w => w.type === WallType.Internal && w.thickness === 115 && w.roomIds.length >= 2)).toBe(true);

    // 4. Doors have valid host walls, clamped positions, and hingeSide populated
    expect(gf.doors.length).toBeGreaterThanOrEqual(3);
    expect(ff.doors.length).toBeGreaterThanOrEqual(1);
    for (const door of [...gf.doors, ...ff.doors]) {
      const floor = door.floorId === gf.id ? gf : ff;
      const hostWall = floor.walls.find(w => w.id === door.wallId)!;
      expect(hostWall).toBeDefined();
      expect(hostWall.hasOpening).toBe(true);
      expect(door.hingeSide === 'left' || door.hingeSide === 'right').toBe(true);
      const placement = validateDoorPlacement(door, hostWall, 25);
      expect(placement.valid, placement.reason).toBe(true);
    }
    const mainDoor = gf.doors.find(d => d.type === DoorType.Double);
    expect(mainDoor).toBeDefined();

    // 5. Windows are classified semantically (Ventilator for bath, Casement for kitchen, Sliding for living/bedroom)
    const bathVentilator = gf.windows.find(w => w.type === WindowType.Ventilator);
    expect(bathVentilator).toBeDefined();
    expect(bathVentilator!.height).toBe(600);
    expect(bathVentilator!.sillHeight).toBe(1800);

    const kitchenCasement = gf.windows.find(w => w.type === WindowType.Casement);
    expect(kitchenCasement).toBeDefined();
    expect(kitchenCasement!.height).toBe(1050);
    expect(kitchenCasement!.sillHeight).toBe(1050);

    const livingWindow = gf.windows.find(w => w.type === WindowType.Sliding && w.height === 1500);
    expect(livingWindow).toBeDefined();
    expect(livingWindow!.sillHeight).toBe(600);

    for (const win of [...gf.windows, ...ff.windows]) {
      const floor = win.floorId === gf.id ? gf : ff;
      const hostWall = floor.walls.find(w => w.id === win.wallId)!;
      expect(hostWall).toBeDefined();
      expect(hostWall.hasOpening).toBe(true);
      const placement = validateWindowPlacement(win, hostWall, 25, true);
      expect(placement.valid, placement.reason).toBe(true);
    }

    // 6. Staircases on Ground Floor and First Floor share verticalCoreId, align vertically, and produce valid 3D solids
    expect(gf.stairs).toHaveLength(1);
    expect(ff.stairs).toHaveLength(1);
    const gfStair = gf.stairs[0]!;
    const ffStair = ff.stairs[0]!;
    expect(gfStair.type).toBe(StairType.UShaped);
    expect(ffStair.type).toBe(StairType.UShaped);
    expect(gfStair.verticalCoreId).toBe('stair-core-1');
    expect(ffStair.verticalCoreId).toBe('stair-core-1');
    expect(gfStair.connectsFloors).toEqual([0, 1]);
    expect(ffStair.connectsFloors).toEqual([0, 1]);
    // Aligned to the same vertical core coordinates
    expect(ffStair.x).toBe(gfStair.x);
    expect(ffStair.y).toBe(gfStair.y);

    const gfSolids = computeStairSolids(gfStair, gf.floorHeight);
    expect(gfSolids.issues).toEqual([]);
    expect(gfSolids.solids.length).toBeGreaterThan(10);
    expect(gfSolids.solids.some(s => s.kind === 'landing')).toBe(true);
    expect(gfSolids.solids.some(s => s.kind === 'tread')).toBe(true);
  });
});
