import { describe, expect, it } from 'vitest';
import {
  reconstructBuildingFromImage,
  type ExtractionSite,
  type ImageSourceIdentity,
} from '../services/image-to-cad-reconstruction.js';
import { normalizeDesignRequirementSpecification, RoomType, WallType, IMAGE_DERIVED_TAG } from '@ai-floor-planner/core';
import { createExtractionMetadata, type ExtractedPlan } from '@ai-floor-planner/planning-engine';
import { evaluateCadFidelity } from '../services/cad-fidelity.js';

/**
 * Phase 2.7: these tests assert that the reconstruction reproduces the IMAGE,
 * and that a failure is reported as a failure rather than quietly replaced by
 * a deterministic template.
 */
describe('Image-to-Editable CAD Vector Reconstruction (Phase 2.7)', () => {
  const site: ExtractionSite = {
    plotWidth: 9144,
    plotDepth: 15240,
    orientation: 90,
    roadFacing: 'east',
    frontSetback: 1500,
    rearSetback: 1500,
    leftSetback: 1000,
    rightSetback: 1000,
    plannedFloorCount: 2,
  };

  const requirements = normalizeDesignRequirementSpecification({
    hard: {
      plotWidthMm: 9144,
      plotDepthMm: 15240,
      bedroomCount: 3,
      bathroomCount: 3,
      floorsCount: 2,
      roadFacing: 'east',
      staircaseRequired: true,
    },
    rawUserPrompt: '3 BHK villa, verandah at entry, master bedroom upstairs',
  });

  const source: ImageSourceIdentity = {
    artifactId: 'gen_test_artifact',
    imageHash: 'a'.repeat(64),
    generationRevision: 3,
    projectFingerprint: 'fp_test_000001',
    visionModel: 'test-vision',
    interpretationSource: 'provider',
    imageWidePixels: 896,
    imageTallPixels: 1200,
  };

  /** Rooms laid out in a 1000x1000 frame, deliberately non-overlapping. */
  const visionRooms = [
    { id: 'rm_1', name: 'Foyer / Front Verandah', type: 'foyer', floorLevel: 0, x: 100, y: 80, width: 240, height: 160 },
    { id: 'rm_2', name: 'Living Room', type: 'living', floorLevel: 0, x: 100, y: 260, width: 380, height: 300 },
    { id: 'rm_3', name: 'Dining Room', type: 'dining', floorLevel: 0, x: 500, y: 260, width: 300, height: 220 },
    { id: 'rm_4', name: 'Kitchen', type: 'kitchen', floorLevel: 0, x: 500, y: 500, width: 300, height: 220 },
    { id: 'rm_5', name: 'Guest Bedroom', type: 'bedroom', floorLevel: 0, x: 100, y: 580, width: 380, height: 260 },
    { id: 'rm_6', name: 'Common Bath', type: 'bathroom', floorLevel: 0, x: 500, y: 740, width: 220, height: 140 },
    { id: 'rm_7', name: 'Staircase', type: 'staircase', floorLevel: 0, x: 100, y: 860, width: 200, height: 120 },
    { id: 'rm_8', name: 'Master Bedroom', type: 'bedroom', floorLevel: 1, x: 100, y: 260, width: 400, height: 320 },
    { id: 'rm_9', name: 'Master Bath', type: 'bathroom', floorLevel: 1, x: 520, y: 260, width: 240, height: 180 },
    { id: 'rm_10', name: 'Bedroom 2', type: 'bedroom', floorLevel: 1, x: 100, y: 600, width: 380, height: 280 },
    { id: 'rm_11', name: 'Family Lounge', type: 'living', floorLevel: 1, x: 520, y: 460, width: 280, height: 260 },
    { id: 'rm_12', name: 'Upper Balcony', type: 'balcony', floorLevel: 1, x: 100, y: 80, width: 240, height: 160 },
  ];

  const visionPayload = {
    footprintShape: 'l-shape',
    entranceSide: 'east',
    circulationNotes: 'Entry through east verandah into living, stair central-west.',
    rooms: visionRooms,
  };

  function planFrom(rooms: typeof visionRooms, extras?: Partial<ExtractedPlan>): ExtractedPlan {
    return {
      id: 'extracted_plan_test',
      metadata: createExtractionMetadata({
        imageWidePixels: 896,
        imageTallPixels: 1200,
        frameWidth: 1000,
        frameHeight: 1000,
        plotWidth: site.plotWidth,
        plotDepth: site.plotDepth,
        orientation: site.orientation,
        roadFacing: site.roadFacing,
        extractionSource: 'gemini_vision',
        confidence: 'likely',
      }),
      boundary: {
        points: [
          { x: 80, y: 60 },
          { x: 820, y: 60 },
          { x: 820, y: 1000 },
          { x: 80, y: 1000 },
        ],
      },
      rooms: rooms.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        imageX: r.x,
        imageY: r.y,
        imageWidth: r.width,
        imageHeight: r.height,
        imageArea: r.width * r.height,
        imageMinWidth: Math.min(r.width, r.height),
        imageMinHeight: Math.min(r.width, r.height),
      })),
      doors: [],
      windows: [],
      stairs: [],
      parking: [],
      ...extras,
    };
  }

  it('reconstructs both floors using the names and positions read from the image', () => {
    const result = reconstructBuildingFromImage({
      plan: planFrom(visionRooms),
      rawVisionPayload: visionPayload,
      requirements,
      site,
      projectId: 'proj_test_phase27',
      projectName: 'Test Reconstructed Villa',
      source,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const building = result.building;
    expect(building.floors).toHaveLength(2);

    const ground = building.floors[0]!;
    const first = building.floors[1]!;
    expect(ground.name).toBe('Ground Floor');
    expect(first.name).toBe('First Floor');

    const groundNames = ground.rooms.map(r => r.name);
    expect(groundNames).toContain('Living Room');
    expect(groundNames).toContain('Kitchen');
    expect(groundNames).toContain('Foyer / Front Verandah');
    expect(groundNames).toContain('Guest Bedroom');
    expect(groundNames).toContain('Staircase');

    const firstNames = first.rooms.map(r => r.name);
    expect(firstNames).toContain('Master Bedroom');
    expect(firstNames).toContain('Bedroom 2');
    expect(firstNames).toContain('Upper Balcony');

    // Rooms the deterministic template used to invent must never appear.
    for (const invented of ['Formal Drawing / Study', 'Powder Room', 'Central Lobby', 'Kitchen Dry Utility']) {
      expect(groundNames).not.toContain(invented);
      expect(firstNames).not.toContain(invented);
    }

    // Every ground-floor room read from the image is present, none added.
    const expectedGround = visionRooms.filter(r => r.floorLevel === 0).map(r => r.name).sort();
    expect([...groundNames].sort()).toEqual(expectedGround);
  });

  it('preserves the relative arrangement the image drew', () => {
    const result = reconstructBuildingFromImage({
      plan: planFrom(visionRooms),
      rawVisionPayload: visionPayload,
      requirements,
      site,
      projectId: 'proj_arrangement',
      projectName: 'Arrangement',
      source,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ground = result.building.floors[0]!;
    const byName = (name: string) => ground.rooms.find(r => r.name === name)!;

    // In the image the verandah is at the top, the stair at the bottom.
    expect(byName('Foyer / Front Verandah').y).toBeLessThan(byName('Living Room').y);
    expect(byName('Staircase').y).toBeGreaterThan(byName('Living Room').y);
    // Dining and kitchen sit to the right (east) of living.
    expect(byName('Dining Room').x).toBeGreaterThan(byName('Living Room').x);
    expect(byName('Kitchen').x).toBeGreaterThan(byName('Living Room').x);
    // Kitchen sits below dining, as drawn.
    expect(byName('Kitchen').y).toBeGreaterThan(byName('Dining Room').y);
  });

  it('builds external and internal walls, and columns, over the reconstructed shell', () => {
    const result = reconstructBuildingFromImage({
      plan: planFrom(visionRooms),
      rawVisionPayload: visionPayload,
      requirements,
      site,
      projectId: 'proj_walls',
      projectName: 'Walls',
      source,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ground = result.building.floors[0]!;
    expect(ground.walls.length).toBeGreaterThan(0);
    expect(ground.walls.filter(w => w.type === WallType.External).length).toBeGreaterThan(0);
    expect(ground.walls.filter(w => w.type === WallType.Internal).length).toBeGreaterThan(0);
    expect(ground.columns.length).toBeGreaterThan(0);
    // Every enclosed room is bounded by at least one wall.
    const enclosed = ground.rooms.filter(r => r.type !== RoomType.Balcony && r.type !== RoomType.Parking);
    for (const room of enclosed) {
      expect(ground.walls.some(w => w.roomIds.includes(room.id))).toBe(true);
    }
  });

  it('stamps image provenance on every reconstructed room and on the building', () => {
    const result = reconstructBuildingFromImage({
      plan: planFrom(visionRooms),
      rawVisionPayload: visionPayload,
      requirements,
      site,
      projectId: 'proj_prov',
      projectName: 'Provenance',
      source,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    for (const floor of result.building.floors) {
      for (const room of floor.rooms) {
        expect(room.tags).toContain(IMAGE_DERIVED_TAG);
        const prov = room.imageProvenance;
        expect(prov).toBeDefined();
        expect(prov!.sourceImageArtifactId).toBe(source.artifactId);
        expect(prov!.sourceImageHash).toBe(source.imageHash);
        expect(prov!.sourceGenerationRevision).toBe(source.generationRevision);
        expect(prov!.sourceProjectFingerprint).toBe(source.projectFingerprint);
        expect(prov!.conversionJobId).toBeTruthy();
        expect(prov!.geometryRevisionId).toBeTruthy();
        expect(prov!.extractionConfidence).toBeGreaterThan(0);
        expect(prov!.sourceImageRegion).toBeDefined();
        expect(prov!.sourceImageRegion!.frameWidth).toBe(1000);
      }
    }

    const custom = result.building.metadata.customData as Record<string, unknown>;
    expect(custom.geometrySource).toBe('IMAGE_RECONSTRUCTION');
    expect(result.provenance.sourceImageArtifactId).toBe(source.artifactId);
    expect(result.provenance.frameWidth).toBe(1000);
    expect(result.provenance.imageWidePixels).toBe(896);
  });

  it('keeps every room inside the buildable envelope', () => {
    const result = reconstructBuildingFromImage({
      plan: planFrom(visionRooms),
      rawVisionPayload: visionPayload,
      requirements,
      site,
      projectId: 'proj_envelope',
      projectName: 'Envelope',
      source,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const minX = site.leftSetback;
    const maxX = site.plotWidth - site.rightSetback;
    const minY = site.frontSetback;
    const maxY = site.plotDepth - site.rearSetback;
    for (const floor of result.building.floors) {
      for (const room of floor.rooms) {
        expect(room.x).toBeGreaterThanOrEqual(minX - 1);
        expect(room.y).toBeGreaterThanOrEqual(minY - 1);
        expect(room.x + room.width).toBeLessThanOrEqual(maxX + 1);
        expect(room.y + room.height).toBeLessThanOrEqual(maxY + 1);
      }
    }
  });

  it('reports overlaps it had to resolve instead of hiding them', () => {
    // Two rooms deliberately overlapping as read from the image.
    const overlapping = [
      ...visionRooms.filter(r => r.floorLevel === 0),
      { id: 'rm_x', name: 'Overlapping Store', type: 'storage', floorLevel: 0, x: 120, y: 280, width: 200, height: 200 },
    ];
    const result = reconstructBuildingFromImage({
      plan: planFrom(overlapping),
      rawVisionPayload: { ...visionPayload, rooms: overlapping },
      requirements,
      site,
      projectId: 'proj_overlap',
      projectName: 'Overlap',
      source,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const resolved = result.adjustments.filter(a => a.kind === 'resolve_overlap');
    expect(resolved.length).toBeGreaterThan(0);
    expect(resolved[0]!.description).toMatch(/overlapped/i);
  });

  it('returns a real error — never substitute geometry — when nothing can be read', () => {
    const empty = planFrom([]);
    const result = reconstructBuildingFromImage({
      plan: { ...empty, rooms: [] },
      rawVisionPayload: { rooms: [] },
      requirements,
      site,
      projectId: 'proj_empty',
      projectName: 'Empty',
      source,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorCode).toBe('IMAGE_CAD_NO_ROOMS_READ');
    expect(result.message).toMatch(/no substitute plan/i);
  });

  it('fails loudly when the buildable envelope cannot host a plan', () => {
    const result = reconstructBuildingFromImage({
      plan: planFrom(visionRooms),
      rawVisionPayload: visionPayload,
      requirements,
      site: { ...site, plotWidth: 3000, plotDepth: 3000, frontSetback: 1400, rearSetback: 1400, leftSetback: 1400, rightSetback: 1400 },
      projectId: 'proj_tiny',
      projectName: 'Tiny',
      source,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorCode).toBe('IMAGE_CAD_BUILDABLE_ENVELOPE_TOO_SMALL');
  });

  it('does not invent a staircase the image never showed', () => {
    const noStair = visionRooms.filter(r => r.type !== 'staircase');
    const result = reconstructBuildingFromImage({
      plan: planFrom(noStair),
      rawVisionPayload: { ...visionPayload, rooms: noStair },
      requirements,
      site,
      projectId: 'proj_nostair',
      projectName: 'No Stair',
      source,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const allRooms = result.building.floors.flatMap(f => f.rooms);
    expect(allRooms.some(r => r.type === RoomType.Staircase)).toBe(false);
    expect(result.unplacedFeatures.join(' ')).toMatch(/staircase/i);
  });

  it('scores high CAD fidelity for a faithful reconstruction', () => {
    const plan = planFrom(visionRooms);
    const result = reconstructBuildingFromImage({
      plan,
      rawVisionPayload: visionPayload,
      requirements,
      site,
      projectId: 'proj_fidelity',
      projectName: 'Fidelity',
      source,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const report = evaluateCadFidelity({
      building: result.building,
      plan,
      comparedArtifactId: source.artifactId,
    });
    expect(report.overallScore).toBeGreaterThanOrEqual(report.threshold);
    expect(report.dimensions.find(d => d.id === 'placement')!.score).toBeGreaterThan(70);
    expect(report.dimensions.find(d => d.id === 'inventory')!.score).toBeGreaterThan(70);
    // The fidelity score is its own number, not the image-quality score.
    expect(report.comparedArtifactId).toBe(source.artifactId);
  });

  it('snaps reconstructed geometry to the drafting grid', () => {
    const result = reconstructBuildingFromImage({
      plan: planFrom(visionRooms),
      rawVisionPayload: visionPayload,
      requirements,
      site,
      projectId: 'proj_grid',
      projectName: 'Grid',
      source,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const room of result.building.floors[0]!.rooms) {
      expect(room.x % 50).toBe(0);
      expect(room.y % 50).toBe(0);
      expect(room.width % 50).toBe(0);
      expect(room.height % 50).toBe(0);
    }
  });
});
