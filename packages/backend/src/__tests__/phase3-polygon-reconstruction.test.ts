import { describe, expect, it } from 'vitest';
import {
  cleanPolygonPoints,
  computePolygonalFootprintForSpaces,
  reconstructBuildingFromImage,
  type ExtractionSite,
  type ImageSourceIdentity,
} from '../services/image-to-cad-reconstruction.js';
import { assessReconstruction } from '../services/reconstruction-acceptance.js';
import { evaluateCadFidelity } from '../services/cad-fidelity.js';
import { normalizeDesignRequirementSpecification } from '@ai-floor-planner/core';
import {
  containsPolygonWithTolerance,
  createExtractionMetadata,
  isValidPolygon,
  parseExtractionPayload,
  polygonIntersectionArea,
  polygonIntersectionAreaConcave,
  triangulateSimplePolygon,
} from '@ai-floor-planner/planning-engine';

describe('Phase 3 — Advanced Architectural Geometry & Polygon Reconstruction', () => {
  const site: ExtractionSite = {
    plotWidth: 15240,
    plotDepth: 18290,
    orientation: 0,
    roadFacing: 'north',
    frontSetback: 1500,
    rearSetback: 1500,
    leftSetback: 1200,
    rightSetback: 1200,
    plannedFloorCount: 1,
  };

  const requirements = normalizeDesignRequirementSpecification({
    hard: {
      plotWidthMm: 15240,
      plotDepthMm: 18290,
      bedroomCount: 2,
      bathroomCount: 2,
      floorsCount: 1,
      roadFacing: 'north',
      staircaseRequired: false,
    },
    rawUserPrompt: 'Non-rectangular custom architectural villa',
  });

  const source: ImageSourceIdentity = {
    artifactId: 'gen_phase3_poly_test',
    imageHash: 'b'.repeat(64),
    generationRevision: 1,
    projectFingerprint: 'fp_phase3_poly',
    visionModel: 'gemini-3.1-flash-lite',
    interpretationSource: 'provider',
    imageWidePixels: 1024,
    imageTallPixels: 1024,
  };

  const metadata = createExtractionMetadata({
    imageWidePixels: 1024,
    imageTallPixels: 1024,
    frameWidth: 1000,
    frameHeight: 1000,
    plotWidth: site.plotWidth,
    plotDepth: site.plotDepth,
    orientation: site.orientation,
    roadFacing: site.roadFacing,
    extractionSource: 'gemini_vision',
    confidence: 'confirmed',
  });

  it('synthesizes L-shaped, U-shaped, T-shaped, H-shaped, and stepped footprints from room geometry without collapsing to a 4-point box', () => {
    const envelope = { x: 1200, y: 1500, width: 12800, height: 15200 };

    // 1. L-shaped layout (North bar + West wing)
    const lSpaces = [
      { rect: { x: 2000, y: 2000, width: 8000, height: 4000 } },
      { rect: { x: 2000, y: 6000, width: 4000, height: 5000 } },
    ];
    const lPoly = computePolygonalFootprintForSpaces(lSpaces, envelope);
    expect(isValidPolygon(lPoly)).toBe(true);
    expect(lPoly.points.length).toBe(6);

    // 2. U-shaped layout (West wing + South base + East wing around a North courtyard >= 2000mm wide)
    const uSpaces = [
      { rect: { x: 2000, y: 2000, width: 3000, height: 8000 } },
      { rect: { x: 5000, y: 7000, width: 4000, height: 3000 } },
      { rect: { x: 9000, y: 2000, width: 3000, height: 8000 } },
    ];
    const uPoly = computePolygonalFootprintForSpaces(uSpaces, envelope);
    expect(isValidPolygon(uPoly)).toBe(true);
    expect(uPoly.points.length).toBe(8);

    // 3. T-shaped layout (North crossbar + central stem)
    const tSpaces = [
      { rect: { x: 2000, y: 2000, width: 10000, height: 3500 } },
      { rect: { x: 5000, y: 5500, width: 4000, height: 5500 } },
    ];
    const tPoly = computePolygonalFootprintForSpaces(tSpaces, envelope);
    expect(isValidPolygon(tPoly)).toBe(true);
    expect(tPoly.points.length).toBe(8);

    // 4. H-shaped layout (West bar + central bridge + East bar)
    const hSpaces = [
      { rect: { x: 2000, y: 2000, width: 3000, height: 10000 } },
      { rect: { x: 5000, y: 5500, width: 4000, height: 3000 } },
      { rect: { x: 9000, y: 2000, width: 3000, height: 10000 } },
    ];
    const hPoly = computePolygonalFootprintForSpaces(hSpaces, envelope);
    expect(isValidPolygon(hPoly)).toBe(true);
    expect(hPoly.points.length).toBe(12);

    // 5. Stepped diagonal cascade layout
    const steppedSpaces = [
      { rect: { x: 2000, y: 2000, width: 4500, height: 3500 } },
      { rect: { x: 4000, y: 5500, width: 4500, height: 3500 } },
      { rect: { x: 6000, y: 9000, width: 4500, height: 3500 } },
    ];
    const steppedPoly = computePolygonalFootprintForSpaces(steppedSpaces, envelope);
    expect(isValidPolygon(steppedPoly)).toBe(true);
    expect(steppedPoly.points.length).toBeGreaterThanOrEqual(8);
  });

  it('strips duplicate closing vertices from Gemini Vision boundary polygons and reconstructs a valid L-shaped building', () => {
    const payload = {
      footprintShape: 'l-shape',
      entranceSide: 'north',
      boundary: {
        // Real 7-point L-polygon pattern where point[6] duplicates point[0]
        points: [
          { x: 100, y: 100 },
          { x: 900, y: 100 },
          { x: 900, y: 500 },
          { x: 500, y: 500 },
          { x: 500, y: 900 },
          { x: 100, y: 900 },
          { x: 100, y: 100 },
        ],
      },
      rooms: [
        { id: 'r1', name: 'Living Room', type: 'living', x: 120, y: 120, width: 420, height: 360, compassZone: 'NE', connectedTo: ['r2', 'r3'] },
        { id: 'r2', name: 'Kitchen', type: 'kitchen', x: 540, y: 120, width: 340, height: 360, compassZone: 'NW', connectedTo: ['r1'] },
        { id: 'r3', name: 'Master Bedroom', type: 'bedroom', x: 120, y: 480, width: 360, height: 240, compassZone: 'SW', connectedTo: ['r1', 'r4'] },
        { id: 'r4', name: 'Attached Bath', type: 'bathroom', x: 120, y: 720, width: 360, height: 160, compassZone: 'SW', connectedTo: ['r3'] },
      ],
      doors: [],
      windows: [],
      stairs: [],
      parking: [],
    };

    const parsed = parseExtractionPayload(payload, metadata, 'plan_l_dup');
    expect(parsed.plan).not.toBeNull();
    // Duplicate closing vertex stripped at parse time
    expect(parsed.plan!.boundary.points).toHaveLength(6);

    const recon = reconstructBuildingFromImage({
      plan: parsed.plan!,
      rawVisionPayload: payload,
      requirements,
      site,
      projectId: 'proj_l_dup',
      projectName: 'L-Shape Villa',
      source,
    });
    expect(recon.ok).toBe(true);
    if (!recon.ok) return;

    const gf = recon.building.floors[0]!;
    expect(isValidPolygon(gf.boundary)).toBe(true);
    expect(gf.boundary.points.length).toBeGreaterThanOrEqual(6);

    // Every room has explicit adjacency and compassZone
    for (const room of gf.rooms) {
      expect(room.compassZone).toBeTruthy();
      expect(room.adjacentRoomIds).toBeDefined();
      expect(room.adjacentRoomIds!.length).toBeGreaterThan(0);
      expect(containsPolygonWithTolerance(gf.boundary.points, room.boundary.points, 50)).toBe(true);
    }

    const acceptance = assessReconstruction(recon.building, parsed.plan!, requirements);
    expect(acceptance.accepted).toBe(true);
    expect(acceptance.integrityIssues).toHaveLength(0);
  });

  it('preserves angled / V-shaped stated footprints and validates containment', () => {
    const vBoundary = [
      { x: 100, y: 100 },
      { x: 900, y: 100 },
      { x: 900, y: 600 },
      { x: 500, y: 900 },
      { x: 100, y: 600 },
    ];
    const payload = {
      footprintShape: 'custom',
      boundary: { points: vBoundary },
      rooms: [
        { id: 'r1', name: 'Living Hall', type: 'living', x: 150, y: 150, width: 350, height: 400 },
        { id: 'r2', name: 'Dining & Kitchen', type: 'kitchen', x: 500, y: 150, width: 350, height: 400 },
        { id: 'r3', name: 'Bedroom 1', type: 'bedroom', x: 320, y: 550, width: 220, height: 180 },
        { id: 'r4', name: 'Common Bath', type: 'bathroom', x: 540, y: 550, width: 140, height: 150 },
      ],
    };

    const parsed = parseExtractionPayload(payload, metadata, 'plan_v');
    expect(parsed.plan).not.toBeNull();
    const recon = reconstructBuildingFromImage({
      plan: parsed.plan!,
      rawVisionPayload: payload,
      requirements,
      site,
      projectId: 'proj_v',
      projectName: 'V-Shape Villa',
      source,
    });
    expect(recon.ok).toBe(true);
    if (!recon.ok) return;
    const gf = recon.building.floors[0]!;
    expect(isValidPolygon(gf.boundary)).toBe(true);
    expect(gf.boundary.points.length).toBe(5);
  });

  it('triangulates concave L-shaped rooms and does not falsely overlap a room inside the L-notch', () => {
    const lRoomPoly = {
      points: [
        { x: 100, y: 100 },
        { x: 700, y: 100 },
        { x: 700, y: 400 },
        { x: 400, y: 400 },
        { x: 400, y: 700 },
        { x: 100, y: 700 },
      ],
    };
    const notchRoomPoly = {
      points: [
        { x: 400, y: 400 },
        { x: 700, y: 400 },
        { x: 700, y: 700 },
        { x: 400, y: 700 },
      ],
    };

    const tris = triangulateSimplePolygon(lRoomPoly);
    expect(tris.length).toBe(4);
    // Exact concave intersection is 0 (they only touch along the inner L-corner edges)
    expect(polygonIntersectionArea(lRoomPoly, notchRoomPoly)).toBe(0);
    expect(polygonIntersectionAreaConcave(lRoomPoly, notchRoomPoly)).toBe(0);
    expect(polygonIntersectionAreaConcave(notchRoomPoly, lRoomPoly)).toBe(0);

    const payload = {
      footprintShape: 'rectangular',
      boundary: {
        points: [
          { x: 80, y: 80 },
          { x: 720, y: 80 },
          { x: 720, y: 920 },
          { x: 80, y: 920 },
        ],
      },
      rooms: [
        {
          id: 'r_l_living',
          name: 'L-Shaped Living & Dining',
          type: 'living',
          x: 100,
          y: 100,
          width: 600,
          height: 600,
          polygon: lRoomPoly.points,
        },
        {
          id: 'r_notch_kitchen',
          name: 'Kitchen',
          type: 'kitchen',
          x: 400,
          y: 400,
          width: 300,
          height: 300,
        },
        {
          id: 'r_bed',
          name: 'Bedroom',
          type: 'bedroom',
          x: 100,
          y: 700,
          width: 360,
          height: 200,
        },
        {
          id: 'r_bath',
          name: 'Bathroom',
          type: 'bathroom',
          x: 460,
          y: 700,
          width: 240,
          height: 200,
        },
      ],
    };

    const parsed = parseExtractionPayload(payload, metadata, 'plan_concave_room');
    const recon = reconstructBuildingFromImage({
      plan: parsed.plan!,
      rawVisionPayload: payload,
      requirements,
      site,
      projectId: 'proj_concave_room',
      projectName: 'Concave Room Villa',
      source,
    });
    expect(recon.ok).toBe(true);
    if (!recon.ok) return;

    const living = recon.building.floors[0]!.rooms.find(r => r.name === 'L-Shaped Living & Dining')!;
    expect(living.boundary.points.length).toBe(6);

    const acceptance = assessReconstruction(recon.building, parsed.plan!, requirements);
    expect(acceptance.accepted).toBe(true);
    expect(acceptance.integrityIssues).toHaveLength(0);
  });

  it('refuses to silently replace a declared irregular footprint with a 4-point rectangle when recovery fails', () => {
    // Stated boundary is a 6-vertex L-shape in the top-left corner, but the
    // rooms form a solid rectangle across the whole 100..900 frame (>600mm outside).
    const payload = {
      footprintShape: 'l-shape',
      boundary: {
        points: [
          { x: 100, y: 100 },
          { x: 300, y: 100 },
          { x: 300, y: 200 },
          { x: 200, y: 200 },
          { x: 200, y: 300 },
          { x: 100, y: 300 },
        ],
      },
      rooms: [
        { id: 'r1', name: 'Living Room', type: 'living', x: 100, y: 100, width: 400, height: 400 },
        { id: 'r2', name: 'Kitchen', type: 'kitchen', x: 500, y: 100, width: 400, height: 400 },
        { id: 'r3', name: 'Bedroom', type: 'bedroom', x: 100, y: 500, width: 400, height: 400 },
        { id: 'r4', name: 'Bathroom', type: 'bathroom', x: 500, y: 500, width: 400, height: 400 },
      ],
    };

    const parsed = parseExtractionPayload(payload, metadata, 'plan_unrecoverable');
    const recon = reconstructBuildingFromImage({
      plan: parsed.plan!,
      rawVisionPayload: payload,
      requirements,
      site,
      projectId: 'proj_unrecoverable',
      projectName: 'Unrecoverable Irregular Footprint',
      source,
    });

    expect(recon.ok).toBe(false);
    if (recon.ok) return;
    expect(recon.errorCode).toBe('IMAGE_CAD_FOOTPRINT_UNRECOVERABLE');
  });

  it('fails CAD fidelity when a multi-floor building has 0 rooms on the First Floor', () => {
    const payload = {
      footprintShape: 'rectangular',
      boundary: {
        points: [
          { x: 100, y: 100 },
          { x: 900, y: 100 },
          { x: 900, y: 900 },
          { x: 100, y: 900 },
        ],
      },
      rooms: [
        { id: 'r1', name: 'Living Room', type: 'living', floorLevel: 0, x: 100, y: 100, width: 400, height: 400 },
        { id: 'r2', name: 'Kitchen', type: 'kitchen', floorLevel: 0, x: 500, y: 100, width: 400, height: 400 },
        { id: 'r3', name: 'Bedroom 1', type: 'bedroom', floorLevel: 0, x: 100, y: 500, width: 400, height: 400 },
        { id: 'r4', name: 'Bathroom', type: 'bathroom', floorLevel: 0, x: 500, y: 500, width: 400, height: 400 },
      ],
    };

    const parsed = parseExtractionPayload(payload, metadata, 'plan_missing_ff');
    const twoFloorReqs = normalizeDesignRequirementSpecification({
      hard: {
        plotWidthMm: 15240,
        plotDepthMm: 18290,
        bedroomCount: 2,
        bathroomCount: 2,
        floorsCount: 2,
        roadFacing: 'north',
        staircaseRequired: true,
      },
      rawUserPrompt: 'G+1 villa',
    });

    const recon = reconstructBuildingFromImage({
      plan: parsed.plan!,
      rawVisionPayload: payload,
      requirements: twoFloorReqs,
      site: { ...site, plannedFloorCount: 2 },
      projectId: 'proj_missing_ff',
      projectName: 'Missing First Floor',
      source,
    });
    expect(recon.ok).toBe(true);
    if (!recon.ok) return;

    const fidelity = evaluateCadFidelity({
      building: recon.building,
      plan: parsed.plan!,
      comparedArtifactId: source.artifactId,
    });

    const floorsDim = fidelity.dimensions.find(d => d.id === 'floors')!;
    expect(floorsDim.score).toBe(50);
    expect(fidelity.missingMandatory.some(m => m.includes('First Floor'))).toBe(true);
    expect(fidelity.passed).toBe(false);
  });

  it('cleans consecutive duplicate and collinear points via cleanPolygonPoints', () => {
    const raw = [
      { x: 0, y: 0 },
      { x: 500, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: 1000 },
      { x: 0, y: 1000 },
      { x: 0, y: 0 },
    ];
    const cleaned = cleanPolygonPoints(raw);
    expect(cleaned).toEqual([
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: 1000 },
      { x: 0, y: 1000 },
    ]);
  });
});

