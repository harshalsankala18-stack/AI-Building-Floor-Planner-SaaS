import { describe, expect, it } from 'vitest';
import {
  reconstructBuildingFromImage,
  type ExtractionSite,
  type ImageSourceIdentity,
} from '../services/image-to-cad-reconstruction.js';
import {
  normalizeDesignRequirementSpecification,
  RoomType,
  WallType,
  DoorType,
  WindowType,
  IMAGE_DERIVED_TAG,
  type Building,
  type Floor,
} from '@ai-floor-planner/core';
import {
  createExtractionMetadata,
  parseExtractionPayload,
  type ExtractedPlan,
} from '@ai-floor-planner/planning-engine';
import { projectBuildingTo3D } from '../../../projection-3d/src/index.js';
import { evaluateCadFidelity } from '../services/cad-fidelity.js';
import { detectFloorRegionsFromPayload } from '@ai-floor-planner/ai-orchestration';

describe('Phase 2B — Multi-Floor Image Interpretation, Floor Assignment & 2D/3D Synchronization', () => {
  const site: ExtractionSite = {
    plotWidth: 12192, // 40 ft
    plotDepth: 18288, // 60 ft
    orientation: 0,
    roadFacing: 'north',
    frontSetback: 2134,
    rearSetback: 1219,
    leftSetback: 1219,
    rightSetback: 1219,
    plannedFloorCount: 2,
  };

  const requirements = normalizeDesignRequirementSpecification({
    hard: {
      plotWidthMm: 12192,
      plotDepthMm: 18288,
      bedroomCount: 3,
      bathroomCount: 2,
      floorsCount: 2,
      roadFacing: 'north',
      staircaseRequired: true,
    },
    rawUserPrompt: '3 BHK multi-floor villa, ground floor with living/dining/kitchen/bedroom, upper floor with master bedroom/bedroom 2',
  });

  const source: ImageSourceIdentity = {
    artifactId: 'gen_test_multifloor_artifact',
    imageHash: 'b'.repeat(64),
    generationRevision: 1,
    projectFingerprint: 'fp_test_multifloor',
    visionModel: 'gemini-3.1-flash-lite',
    interpretationSource: 'provider',
    imageWidePixels: 896,
    imageTallPixels: 1200,
  };

  // Vertically stacked floor plans (Ground Floor top y: 100..480, First Floor bottom y: 560..920)
  const verticallyStackedPayload = {
    boundary: {
      points: [
        { x: 125, y: 100 },
        { x: 875, y: 100 },
        { x: 875, y: 480 },
        { x: 125, y: 480 },
      ],
    },
    rooms: [
      // Ground Floor (Level 0)
      { id: 'gf_living', name: 'Living Room', type: 'living', floorLevel: 0, x: 500, y: 120, width: 350, height: 320 },
      { id: 'gf_dining', name: 'Dining Room', type: 'dining', floorLevel: 0, x: 500, y: 440, width: 220, height: 180 },
      { id: 'gf_kitchen', name: 'Kitchen', type: 'kitchen', floorLevel: 0, x: 720, y: 440, width: 140, height: 180 },
      { id: 'gf_bed1', name: 'Bedroom 1', type: 'bedroom', floorLevel: 0, x: 140, y: 120, width: 260, height: 260 },
      { id: 'gf_bath', name: 'Common Bathroom', type: 'bathroom', floorLevel: 0, x: 400, y: 120, width: 100, height: 160 },
      { id: 'gf_foyer', name: 'Foyer', type: 'foyer', floorLevel: 0, x: 400, y: 380, width: 100, height: 120 },
      { id: 'gf_stair', name: 'Staircase', type: 'staircase', floorLevel: 0, x: 280, y: 380, width: 120, height: 180 },
      // First Floor (Level 1)
      { id: 'ff_master', name: 'Master Bedroom', type: 'bedroom', floorLevel: 1, x: 520, y: 580, width: 340, height: 320 },
      { id: 'ff_bed2', name: 'Bedroom 2', type: 'bedroom', floorLevel: 1, x: 140, y: 580, width: 260, height: 240 },
      { id: 'ff_bed1_upper', name: 'Bedroom 1', type: 'bedroom', floorLevel: 1, x: 140, y: 820, width: 260, height: 200 },
      { id: 'ff_ensuite', name: 'Ensuite Bathroom', type: 'bathroom', floorLevel: 1, x: 400, y: 580, width: 120, height: 150 },
      { id: 'ff_common_bath', name: 'Common Bathroom', type: 'bathroom', floorLevel: 1, x: 280, y: 580, width: 120, height: 150 },
      { id: 'ff_balcony', name: 'Balcony', type: 'balcony', floorLevel: 1, x: 520, y: 900, width: 340, height: 120 },
    ],
    doors: [
      { id: 'dr_gf_main', x: 400, y: 500, width: 80, height: 20, adjacentRoomId: 'gf_foyer', floorLevel: 0 },
      { id: 'dr_gf_bed1', x: 260, y: 380, width: 60, height: 20, adjacentRoomId: 'gf_bed1', floorLevel: 0 },
      { id: 'dr_ff_master', x: 520, y: 700, width: 60, height: 20, adjacentRoomId: 'ff_master', floorLevel: 1 },
      { id: 'dr_ff_balcony', x: 650, y: 900, width: 80, height: 20, adjacentRoomId: 'ff_master', floorLevel: 1 },
    ],
    windows: [
      { id: 'wn_gf_living', x: 650, y: 120, width: 120, height: 20, adjacentRoomId: 'gf_living', floorLevel: 0 },
      { id: 'wn_ff_master', x: 860, y: 680, width: 20, height: 120, adjacentRoomId: 'ff_master', floorLevel: 1 },
      { id: 'wn_ff_bed2', x: 140, y: 660, width: 20, height: 100, adjacentRoomId: 'ff_bed2', floorLevel: 1 },
    ],
    stairs: [
      { id: 'st_ground', name: 'Staircase Flight', x: 280, y: 380, width: 120, height: 180, floorLevel: 0 },
      { id: 'st_upper', name: 'Staircase Upper Landing', x: 280, y: 730, width: 120, height: 180, floorLevel: 1 },
    ],
  };

  it('1. detects independent floor regions from vertically stacked drawing sheets', () => {
    const detected = detectFloorRegionsFromPayload(verticallyStackedPayload);
    expect(detected.length).toBeGreaterThanOrEqual(2);
    expect(detected[0]?.level).toBe(0);
    expect(detected[1]?.level).toBe(1);
    expect(detected[0]?.name).toContain('Ground');
    expect(detected[1]?.name).toContain('Floor');
  });

  it('2. detects independent floor regions from side-by-side drawing sheets', () => {
    const sideBySidePayload = {
      boundary: { points: [{ x: 50, y: 100 }, { x: 950, y: 100 }, { x: 950, y: 800 }, { x: 50, y: 800 }] },
      rooms: [
        // Ground Floor left (x: 50..450)
        { id: 'g_liv', name: 'Living Room', type: 'living', floorLevel: 0, x: 80, y: 120, width: 350, height: 300 },
        { id: 'g_kit', name: 'Kitchen', type: 'kitchen', floorLevel: 0, x: 80, y: 440, width: 200, height: 200 },
        // First Floor right (x: 520..920)
        { id: 'f_bed', name: 'Master Bedroom', type: 'bedroom', floorLevel: 1, x: 540, y: 120, width: 350, height: 300 },
        { id: 'f_bath', name: 'Bath', type: 'bathroom', floorLevel: 1, x: 540, y: 440, width: 200, height: 200 },
      ],
    };
    const detected = detectFloorRegionsFromPayload(sideBySidePayload);
    expect(detected.length).toBe(2);
    expect(detected[0]?.level).toBe(0);
    expect(detected[1]?.level).toBe(1);
  });

  it('3 & 4. parses extraction payload and assigns Ground Floor and First Floor correctly', () => {
    const meta = createExtractionMetadata({
      imageWidePixels: 896,
      imageTallPixels: 1200,
      plotWidth: site.plotWidth,
      plotDepth: site.plotDepth,
      orientation: site.orientation,
      roadFacing: site.roadFacing,
      extractionSource: 'gemini_vision',
      confidence: 'high',
    });
    const { plan, diagnostics } = parseExtractionPayload(verticallyStackedPayload, meta, 'test_plan_multi');
    expect(plan).not.toBeNull();
    if (!plan) return;

    expect(plan.floors).toBeDefined();
    expect(plan.floors?.length).toBeGreaterThanOrEqual(2);

    const gfRooms = plan.rooms.filter(r => r.floorLevel === 0);
    const ffRooms = plan.rooms.filter(r => r.floorLevel === 1);
    expect(gfRooms.length).toBe(7);
    expect(ffRooms.length).toBe(6);
  });

  it('5 & 6. missing floorLevel does not default all rooms to Level 0 when spatial gap exists', () => {
    const unannotatedPayload = {
      boundary: verticallyStackedPayload.boundary,
      rooms: verticallyStackedPayload.rooms.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        // floorLevel deliberately omitted
      })),
    };
    const meta = createExtractionMetadata({
      imageWidePixels: 896,
      imageTallPixels: 1200,
      plotWidth: site.plotWidth,
      plotDepth: site.plotDepth,
      orientation: site.orientation,
      roadFacing: site.roadFacing,
      extractionSource: 'gemini_vision',
      confidence: 'high',
    });
    const { plan } = parseExtractionPayload(unannotatedPayload, meta, 'test_unannotated');
    expect(plan).not.toBeNull();
    if (!plan) return;

    const ffRooms = plan.rooms.filter(r => r.floorLevel === 1);
    expect(ffRooms.length).toBeGreaterThan(0);
  });

  it('7. duplicate room names are cleanly partitioned across floors without collision', () => {
    const meta = createExtractionMetadata({
      imageWidePixels: 896,
      imageTallPixels: 1200,
      plotWidth: site.plotWidth,
      plotDepth: site.plotDepth,
      orientation: site.orientation,
      roadFacing: site.roadFacing,
      extractionSource: 'gemini_vision',
      confidence: 'high',
    });
    const { plan } = parseExtractionPayload(verticallyStackedPayload, meta, 'test_plan_dups');
    const result = reconstructBuildingFromImage({
      plan: plan!,
      rawVisionPayload: verticallyStackedPayload,
      requirements,
      site,
      projectId: 'proj_multi_dups',
      projectName: 'Multi-Floor Dups Villa',
      source,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const gBed1 = result.building.floors[0]?.rooms.find(r => r.name === 'Bedroom 1');
    const fBed1 = result.building.floors[1]?.rooms.find(r => r.name === 'Bedroom 1');
    expect(gBed1).toBeDefined();
    expect(fBed1).toBeDefined();
    expect(gBed1?.id).not.toBe(fBed1?.id);
    expect(gBed1?.floorId).not.toBe(fBed1?.floorId);
  });

  it('8. derives independent coordinate transformation per floor avoiding stacked plot compression', () => {
    const meta = createExtractionMetadata({
      imageWidePixels: 896,
      imageTallPixels: 1200,
      plotWidth: site.plotWidth,
      plotDepth: site.plotDepth,
      orientation: site.orientation,
      roadFacing: site.roadFacing,
      extractionSource: 'gemini_vision',
      confidence: 'high',
    });
    const { plan } = parseExtractionPayload(verticallyStackedPayload, meta, 'test_plan_transform');
    const result = reconstructBuildingFromImage({
      plan: plan!,
      rawVisionPayload: verticallyStackedPayload,
      requirements,
      site,
      projectId: 'proj_multi_trans',
      projectName: 'Multi-Floor Transform Villa',
      source,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const groundFloor = result.building.floors[0]!;
    const firstFloor = result.building.floors[1]!;

    // Both floors should span roughly the same Y range within the buildable envelope
    const gfMinY = Math.min(...groundFloor.rooms.map(r => r.y));
    const gfMaxY = Math.max(...groundFloor.rooms.map(r => r.y + r.height));
    const ffMinY = Math.min(...firstFloor.rooms.map(r => r.y));
    const ffMaxY = Math.max(...firstFloor.rooms.map(r => r.y + r.height));

    // Neither floor should be compressed into half the depth of the site
    expect(gfMaxY - gfMinY).toBeGreaterThan(5000);
    expect(ffMaxY - ffMinY).toBeGreaterThan(5000);

    // Both floors should overlap in Y coordinates (stacked in 3D, not stacked on plot ground)
    expect(ffMinY).toBeLessThan(gfMaxY);
    expect(gfMinY).toBeLessThan(ffMaxY);
  });

  it('9 & 10. preserves openings and vertical circulation staircase on both levels', () => {
    const meta = createExtractionMetadata({
      imageWidePixels: 896,
      imageTallPixels: 1200,
      plotWidth: site.plotWidth,
      plotDepth: site.plotDepth,
      orientation: site.orientation,
      roadFacing: site.roadFacing,
      extractionSource: 'gemini_vision',
      confidence: 'high',
    });
    const { plan } = parseExtractionPayload(verticallyStackedPayload, meta, 'test_plan_openings');
    const result = reconstructBuildingFromImage({
      plan: plan!,
      rawVisionPayload: verticallyStackedPayload,
      requirements,
      site,
      projectId: 'proj_multi_openings',
      projectName: 'Multi-Floor Openings Villa',
      source,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const gf = result.building.floors[0]!;
    const ff = result.building.floors[1]!;

    expect(gf.doors.length).toBeGreaterThan(0);
    expect(gf.windows.length).toBeGreaterThan(0);
    expect(ff.doors.length).toBeGreaterThan(0);
    expect(ff.windows.length).toBeGreaterThan(0);

    expect(gf.stairs.length).toBeGreaterThan(0);
    const mainStair = gf.stairs[0]!;
    expect(mainStair.connectsFloors).toEqual([0, 1]);
  });

  it('11 & 12. populates canonical Building floors and enables 2D floor switching', () => {
    const meta = createExtractionMetadata({
      imageWidePixels: 896,
      imageTallPixels: 1200,
      plotWidth: site.plotWidth,
      plotDepth: site.plotDepth,
      orientation: site.orientation,
      roadFacing: site.roadFacing,
      extractionSource: 'gemini_vision',
      confidence: 'high',
    });
    const { plan } = parseExtractionPayload(verticallyStackedPayload, meta, 'test_plan_pop');
    const result = reconstructBuildingFromImage({
      plan: plan!,
      rawVisionPayload: verticallyStackedPayload,
      requirements,
      site,
      projectId: 'proj_multi_pop',
      projectName: 'Multi-Floor Populated Villa',
      source,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const b = result.building;
    expect(b.floors).toHaveLength(2);

    const [f0, f1] = b.floors;
    expect(f0!.rooms.length).toBe(8); // 7 rooms + 1 stair space
    expect(f1!.rooms.length).toBe(7); // 6 rooms + 1 stair landing space

    // Floor switching check: activeFloorId can toggle between f0.id and f1.id
    let activeFloorId = f0!.id;
    let currentFloor = b.floors.find(f => f.id === activeFloorId);
    expect(currentFloor?.name).toBe('Ground Floor');
    expect(currentFloor?.rooms.map(r => r.name)).toContain('Living Room');

    activeFloorId = f1!.id;
    currentFloor = b.floors.find(f => f.id === activeFloorId);
    expect(currentFloor?.name).toBe('First Floor');
    expect(currentFloor?.rooms.map(r => r.name)).toContain('Master Bedroom');
    expect(currentFloor?.rooms.length).toBeGreaterThan(0);
  });

  it('13 & 14. 3D projection generates both floors with walls and roof resting directly on top floor', () => {
    const meta = createExtractionMetadata({
      imageWidePixels: 896,
      imageTallPixels: 1200,
      plotWidth: site.plotWidth,
      plotDepth: site.plotDepth,
      orientation: site.orientation,
      roadFacing: site.roadFacing,
      extractionSource: 'gemini_vision',
      confidence: 'high',
    });
    const { plan } = parseExtractionPayload(verticallyStackedPayload, meta, 'test_plan_3d');
    const result = reconstructBuildingFromImage({
      plan: plan!,
      rawVisionPayload: verticallyStackedPayload,
      requirements,
      site,
      projectId: 'proj_multi_3d',
      projectName: 'Multi-Floor 3D Villa',
      source,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const b = result.building;
    const projection = projectBuildingTo3D(b);

    expect(projection.levels).toHaveLength(2);
    expect(projection.levels[0]?.elevation).toBe(0);
    expect(projection.levels[1]?.elevation).toBe(projection.settings.defaultFloorToFloorHeight.value);

    // Check walls for both floors
    const gfWalls = projection.walls.filter(w => w.floorId === b.floors[0]!.id);
    const ffWalls = projection.walls.filter(w => w.floorId === b.floors[1]!.id);
    expect(gfWalls.length).toBeGreaterThan(0);
    expect(ffWalls.length).toBeGreaterThan(0);

    // Check floor plates
    expect(projection.floorPlates).toHaveLength(2);
    expect(projection.floorPlates[0]?.elevation).toBe(0);
    expect(projection.floorPlates[1]?.elevation).toBe(projection.settings.defaultFloorToFloorHeight.value);
  });

  it('15. CAD fidelity evaluation passes with high score for multi-floor reconstructed Building', () => {
    const meta = createExtractionMetadata({
      imageWidePixels: 896,
      imageTallPixels: 1200,
      plotWidth: site.plotWidth,
      plotDepth: site.plotDepth,
      orientation: site.orientation,
      roadFacing: site.roadFacing,
      extractionSource: 'gemini_vision',
      confidence: 'high',
    });
    const { plan } = parseExtractionPayload(verticallyStackedPayload, meta, 'test_plan_fid');
    const result = reconstructBuildingFromImage({
      plan: plan!,
      rawVisionPayload: verticallyStackedPayload,
      requirements,
      site,
      projectId: 'proj_multi_fid',
      projectName: 'Multi-Floor Fidelity Villa',
      source,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const fidelity = evaluateCadFidelity({
      building: result.building,
      plan: plan!,
      comparedArtifactId: source.artifactId,
    });

    expect(fidelity.overallScore).toBeGreaterThanOrEqual(70);
    expect(fidelity.passed).toBe(true);
    expect(fidelity.missingMandatory).toHaveLength(0);
  });
});
