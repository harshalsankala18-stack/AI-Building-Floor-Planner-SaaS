import { describe, it, expect } from 'vitest';
import {
  // Error classes
  InvalidCoordinateError,
  DegenerateGeometryError,
  SelfIntersectionError,

  // Vector
  createVector,
  vectorAdd,
  vectorSubtract,
  vectorScale,
  vectorNegate,
  vectorMagnitude,
  vectorMagnitudeSquared,
  vectorNormalize,
  vectorDot,
  vectorCross,
  vectorAngle,
  vectorAngleBetween,
  vectorPerpendicular,
  vectorProject,
  vectorsEqual,
  vectorsParallel,

  // Line
  lineFromPoints,
  distanceToLine,
  projectPointOntoLine,
  lineIntersection,
  areLinesParallel,

  // Point
  createPoint,
  distance,
  manhattanDistance,
  midpoint,
  lerpPoint,
  rotatePoint,
  translatePoint,
  scalePoint,
  pointOnSegment,
  closestPointOnSegment,

  // Segment
  createSegment,
  segmentLength,
  segmentAngle,
  segmentMidpoint,
  segmentBoundingBox,
  segmentIntersection,
  pointToSegmentDistance,
  segmentToSegmentDistance,
  offsetSegment,

  // Rectangle
  createRect,
  createBoundingBox,
  rectArea,
  rectPerimeter,
  rectCenter,
  rectContains,
  rectsOverlap,
  rectIntersection,
  rectUnion,
  translateRect,
  scaleRect,
  rotateRect,
  snapRectToGrid,
  snapPointToGrid,

  // Polygon
  polygonArea,
  polygonPerimeter,
  polygonCentroid,
  polygonBoundingBox,
  isConvex,
  isValidPolygon,
  assertValidPolygon,
  polygonIntersectionArea,
  sutherlandHodgmanClip,
  polygonsOverlap,
  polygonsAdjacent,
  sharedEdge,

  // Curves
  createCircle,
  createArc,
  circleArea,
  circlePerimeter,
  pointInCircle,
  circleBoundingBox,
  arcLength,
  arcEndpoints,
  arcToPolygon,

  // Room
  computeRoomGeometry,
  computeCarpetArea,
  validateRoomGeometry,

  // Plot
  createPlotBoundary,
  computeBuildingEnvelope,
  isRoomWithinPlot,

  // Wall
  wallToPolygon,
  wallLength,
  generateWalls,
  mergeWalls,
  splitWall,
  findWallIntersections,

  // Door
  validateDoorPlacement,
  computeDoorOpeningSegment,
  computeDoorSwingPolygon,

  // Window
  validateWindowPlacement,
  computeWindowOpeningSegment,
  computeWindowGlazingPolygon,

  // Stair
  computeStairGeometry,
  validateStairDimensions,

  // Collision
  detectRoomCollisions,
  detectBoundaryViolation,

  // Spatial Index
  SimpleSpatialIndex,
  GridSpatialIndex,

  // Coordinates
  worldToScreen,
  screenToWorld,
  fitBoundsToViewport,

  // Units
  mmToFeet,
  feetToMm,
  mmToMeters,
  metersToMm,
  mmToInches,
  inchesToMm,
  mmToCm,
  cmToMm,
  sqMmToSqFt,
  sqFtToSqMm,
  sqMmToSqM,
  sqMToSqMm,
  sqMmToAcres,
  acresToSqMm,
  sqMmToCents,
  centsToSqMm,
  formatFeet,
  formatFeetInches,
  formatMeters,
  formatSqFt,
  formatSqM,
  parseLength,
  parseArea,

  // Debug
  GeometryDebugCollector,
} from '../index';

import type { Room, Wall, Door, Window, Stair, Polygon } from '@ai-floor-planner/core';
import {
  RoomType,
  WallType,
  DoorType,
  WindowType,
  StairType,
  SwingDirection,
  Direction,
  DaylightLevel,
  PrivacyLevel,
} from '@ai-floor-planner/core';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeRoom(id: string, x: number, y: number, w: number, h: number, name = 'Test Room'): Room {
  return {
    id,
    floorId: 'floor-1',
    type: RoomType.Bedroom,
    name,
    boundary: createRect(x, y, w, h),
    x,
    y,
    width: w,
    height: h,
    rotation: 0,
    area: w * h,
    priority: 5,
    tags: [],
    adjacencyRequirements: [],
    daylightRequirement: DaylightLevel.Medium,
    privacyRequirement: PrivacyLevel.None,
    ventilationRequired: false,
    isFixed: false,
  };
}

function makeWall(id: string, start: { x: number; y: number }, end: { x: number; y: number }, thickness = 200, type = WallType.External): Wall {
  return {
    id,
    floorId: 'floor-1',
    startPoint: start,
    endPoint: end,
    thickness,
    type,
    roomIds: [],
    hasOpening: false,
    loadBearing: true,
  };
}

// ─── 1. Point Operations ─────────────────────────────────────────────────────

describe('1. Point Operations', () => {
  it('creates point with validation', () => {
    const p = createPoint(100, 200);
    expect(p.x).toBe(100);
    expect(p.y).toBe(200);
    expect(() => createPoint(NaN, 200)).toThrow(InvalidCoordinateError);
    expect(() => createPoint(100, Infinity)).toThrow(InvalidCoordinateError);
  });

  it('computes euclidean and manhattan distance', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3000, y: 4000 })).toBe(5000);
    expect(distance({ x: 100, y: 200 }, { x: 100, y: 200 })).toBe(0);
    expect(manhattanDistance({ x: 0, y: 0 }, { x: 3000, y: 4000 })).toBe(7000);
  });

  it('computes midpoint and lerp', () => {
    const mid = midpoint({ x: 0, y: 0 }, { x: 1000, y: 2000 });
    expect(mid.x).toBe(500);
    expect(mid.y).toBe(1000);

    const lerp = lerpPoint({ x: 0, y: 0 }, { x: 1000, y: 2000 }, 0.25);
    expect(lerp.x).toBe(250);
    expect(lerp.y).toBe(500);
  });

  it('rotates point around origin', () => {
    const rotated = rotatePoint({ x: 1000, y: 0 }, 90);
    expect(Math.abs(rotated.x)).toBeLessThan(1e-5);
    expect(Math.abs(rotated.y - 1000)).toBeLessThan(1e-5);
  });

  it('translates and scales point', () => {
    const translated = translatePoint({ x: 100, y: 200 }, 50, -30);
    expect(translated.x).toBe(150);
    expect(translated.y).toBe(170);

    const scaled = scalePoint({ x: 100, y: 200 }, 2, 3, { x: 0, y: 0 });
    expect(scaled.x).toBe(200);
    expect(scaled.y).toBe(600);
  });

  it('point on segment and closest point', () => {
    const seg = { start: { x: 0, y: 0 }, end: { x: 1000, y: 0 } };
    expect(pointOnSegment({ x: 500, y: 0 }, seg)).toBe(true);
    expect(pointOnSegment({ x: 500, y: 100 }, seg)).toBe(false);

    const closest = closestPointOnSegment({ x: 500, y: 200 }, seg);
    expect(closest.x).toBe(500);
    expect(closest.y).toBe(0);
  });
});

// ─── 2. Vector Operations ────────────────────────────────────────────────────

describe('2. Vector Operations', () => {
  it('performs vector addition, subtraction, scale, and negation', () => {
    const u = createVector(300, 400);
    const v = createVector(100, 200);

    expect(vectorAdd(u, v)).toEqual({ dx: 400, dy: 600 });
    expect(vectorSubtract(u, v)).toEqual({ dx: 200, dy: 200 });
    expect(vectorScale(u, 2)).toEqual({ dx: 600, dy: 800 });
    expect(vectorNegate(u)).toEqual({ dx: -300, dy: -400 });
  });

  it('computes magnitude and normalizes vector', () => {
    const v = createVector(300, 400);
    expect(vectorMagnitude(v)).toBe(500);
    expect(vectorMagnitudeSquared(v)).toBe(250000);

    const norm = vectorNormalize(v);
    expect(norm.dx).toBeCloseTo(0.6);
    expect(norm.dy).toBeCloseTo(0.8);
    expect(() => vectorNormalize(createVector(0, 0))).toThrow(DegenerateGeometryError);
  });

  it('computes dot product and 2D cross product', () => {
    const u = createVector(1, 0);
    const v = createVector(0, 1);
    expect(vectorDot(u, v)).toBe(0);
    expect(vectorCross(u, v)).toBe(1);
    expect(vectorCross(v, u)).toBe(-1);
  });

  it('computes angle, angle between, perpendicular, and projection', () => {
    const u = createVector(10, 0);
    const v = createVector(0, 10);
    expect(vectorAngle(u)).toBe(0);
    expect(vectorAngle(v)).toBe(90);
    expect(vectorAngleBetween(u, v)).toBe(90);

    const perpCW = vectorPerpendicular(u, 'cw');
    expect(perpCW).toEqual({ dx: -0, dy: 10 });

    const w = createVector(5, 5);
    const proj = vectorProject(w, u);
    expect(proj.dx).toBe(5);
    expect(proj.dy).toBe(0);
  });

  it('checks vector equality and parallelism', () => {
    expect(vectorsEqual(createVector(100, 200), createVector(100, 200.5), 1)).toBe(true);
    expect(vectorsParallel(createVector(10, 20), createVector(20, 40))).toBe(true);
    expect(vectorsParallel(createVector(10, 20), createVector(-10, 20))).toBe(false);
  });
});

// ─── 3. Line Operations ──────────────────────────────────────────────────────

describe('3. Line Operations', () => {
  it('creates normalized line from coefficients or two points', () => {
    const line = lineFromPoints({ x: 0, y: 0 }, { x: 1000, y: 0 });
    expect(Math.abs(line.b)).toBeGreaterThan(0);

    expect(() => lineFromPoints({ x: 100, y: 100 }, { x: 100, y: 100 })).toThrow(DegenerateGeometryError);
  });

  it('computes distance to line and projects point', () => {
    const line = lineFromPoints({ x: 0, y: 0 }, { x: 1000, y: 0 }); // Y = 0 (line: -0*x + 1000*y = 0 -> y = 0)
    expect(distanceToLine({ x: 500, y: 300 }, line)).toBeCloseTo(300);

    const proj = projectPointOntoLine({ x: 500, y: 300 }, line);
    expect(proj.x).toBeCloseTo(500);
    expect(proj.y).toBeCloseTo(0);
  });

  it('computes intersection of infinite lines', () => {
    const l1 = lineFromPoints({ x: 0, y: 0 }, { x: 1000, y: 1000 });
    const l2 = lineFromPoints({ x: 0, y: 1000 }, { x: 1000, y: 0 });
    const inter = lineIntersection(l1, l2);
    expect(inter).not.toBeNull();
    expect(inter!.x).toBeCloseTo(500);
    expect(inter!.y).toBeCloseTo(500);
  });

  it('returns null for parallel lines', () => {
    const l1 = lineFromPoints({ x: 0, y: 0 }, { x: 1000, y: 0 });
    const l2 = lineFromPoints({ x: 0, y: 500 }, { x: 1000, y: 500 });
    expect(areLinesParallel(l1, l2)).toBe(true);
    expect(lineIntersection(l1, l2)).toBeNull();
  });
});

// ─── 4. Segment Operations ───────────────────────────────────────────────────

describe('4. Segment Operations', () => {
  it('computes segment length, angle, midpoint, bounding box', () => {
    const seg = createSegment({ x: 0, y: 0 }, { x: 3000, y: 4000 });
    expect(segmentLength(seg)).toBe(5000);
    expect(segmentAngle(seg)).toBeCloseTo(53.13, 1);
    expect(segmentMidpoint(seg)).toEqual({ x: 1500, y: 2000 });

    const bbox = segmentBoundingBox(seg);
    expect(bbox).toEqual({ x: 0, y: 0, width: 3000, height: 4000 });
  });

  it('computes intersection of intersecting segments', () => {
    const a = createSegment({ x: 0, y: 500 }, { x: 1000, y: 500 });
    const b = createSegment({ x: 500, y: 0 }, { x: 500, y: 1000 });
    const inter = segmentIntersection(a, b);
    expect(inter).toEqual({ x: 500, y: 500 });
  });

  it('returns null for non-intersecting segments', () => {
    const a = createSegment({ x: 0, y: 500 }, { x: 400, y: 500 });
    const b = createSegment({ x: 500, y: 0 }, { x: 500, y: 1000 });
    expect(segmentIntersection(a, b)).toBeNull();
  });

  it('handles collinear touching segments', () => {
    const a = createSegment({ x: 0, y: 0 }, { x: 500, y: 0 });
    const b = createSegment({ x: 500, y: 0 }, { x: 1000, y: 0 });
    const inter = segmentIntersection(a, b);
    expect(inter).toEqual({ x: 500, y: 0 });
  });

  it('computes point to segment distance and segment-to-segment distance', () => {
    const seg = createSegment({ x: 0, y: 0 }, { x: 1000, y: 0 });
    expect(pointToSegmentDistance({ x: 500, y: 300 }, seg)).toBe(300);
    expect(pointToSegmentDistance({ x: 1500, y: 0 }, seg)).toBe(500);

    const parallelSeg = createSegment({ x: 0, y: 300 }, { x: 1000, y: 300 });
    expect(segmentToSegmentDistance(seg, parallelSeg)).toBe(300);
  });

  it('offsets segment left and right', () => {
    const seg = createSegment({ x: 0, y: 0 }, { x: 1000, y: 0 });
    const left = offsetSegment(seg, 100, 'left');
    expect(left.start.y).toBeCloseTo(-100);
    expect(left.end.y).toBeCloseTo(-100);

    const right = offsetSegment(seg, 100, 'right');
    expect(right.start.y).toBeCloseTo(100);
    expect(right.end.y).toBeCloseTo(100);
  });
});

// ─── 5. Rectangle Operations ─────────────────────────────────────────────────

describe('5. Rectangle Operations', () => {
  it('computes area, perimeter, center, bounds', () => {
    const bbox = createBoundingBox(100, 200, 3000, 4000);
    expect(rectArea(bbox)).toBe(12000000);
    expect(rectPerimeter(bbox)).toBe(14000);
    expect(rectCenter(bbox)).toEqual({ x: 1600, y: 2200 });
  });

  it('checks containment, overlap, and intersection', () => {
    const outer = createBoundingBox(0, 0, 10000, 10000);
    const inner = createBoundingBox(1000, 1000, 3000, 3000);
    expect(rectContains(outer, inner)).toBe(true);
    expect(rectContains(inner, outer)).toBe(false);

    const a = createBoundingBox(0, 0, 4000, 4000);
    const b = createBoundingBox(2000, 2000, 4000, 4000);
    expect(rectsOverlap(a, b)).toBe(true);

    const inter = rectIntersection(a, b);
    expect(inter).toEqual({ x: 2000, y: 2000, width: 2000, height: 2000 });

    const union = rectUnion(a, b);
    expect(union).toEqual({ x: 0, y: 0, width: 6000, height: 6000 });
  });

  it('translates, scales, and rotates rectangle into polygon', () => {
    const rect = createBoundingBox(0, 0, 1000, 2000);
    const translated = translateRect(rect, 50, 100);
    expect(translated.x).toBe(50);
    expect(translated.y).toBe(100);

    const scaled = scaleRect(rect, 2, 2);
    expect(scaled.width).toBe(2000);
    expect(scaled.height).toBe(4000);

    const poly = rotateRect(rect, 90);
    expect(poly.points.length).toBe(4);
    expect(polygonArea(poly)).toBeCloseTo(2000000);
  });

  it('snaps rect and point to grid', () => {
    const snappedPt = snapPointToGrid({ x: 104, y: 198 }, 100);
    expect(snappedPt).toEqual({ x: 100, y: 200 });

    const snappedRect = snapRectToGrid({ x: 12, y: 48, width: 980, height: 1020 }, 100);
    expect(snappedRect).toEqual({ x: 0, y: 0, width: 1000, height: 1000 });
  });
});

// ─── 6. Polygon Operations ───────────────────────────────────────────────────

describe('6. Polygon Operations', () => {
  it('computes shoelace area (signed and absolute) and perimeter', () => {
    const rect = createRect(0, 0, 3000, 4000);
    expect(polygonArea(rect)).toBe(12000000);
    expect(polygonPerimeter(rect)).toBe(14000);

    const L: Polygon = {
      points: [
        { x: 0, y: 0 },
        { x: 6000, y: 0 },
        { x: 6000, y: 3000 },
        { x: 3000, y: 3000 },
        { x: 3000, y: 6000 },
        { x: 0, y: 6000 },
      ],
    };
    expect(polygonArea(L)).toBe(27000000);
  });

  it('computes polygon centroid and bounding box', () => {
    const rect = createRect(0, 0, 2000, 4000);
    const centroid = polygonCentroid(rect);
    expect(centroid.x).toBeCloseTo(1000);
    expect(centroid.y).toBeCloseTo(2000);

    const bbox = polygonBoundingBox(rect);
    expect(bbox).toEqual({ x: 0, y: 0, width: 2000, height: 4000 });
  });

  it('validates convex and non-convex polygons', () => {
    expect(isConvex(createRect(0, 0, 1000, 1000))).toBe(true);

    const L: Polygon = {
      points: [
        { x: 0, y: 0 }, { x: 6000, y: 0 }, { x: 6000, y: 3000 },
        { x: 3000, y: 3000 }, { x: 3000, y: 6000 }, { x: 0, y: 6000 },
      ],
    };
    expect(isConvex(L)).toBe(false);
    expect(isValidPolygon(L)).toBe(true);
  });

  it('detects invalid polygon with self-intersections or < 3 points', () => {
    expect(isValidPolygon({ points: [{ x: 0, y: 0 }, { x: 100, y: 100 }] })).toBe(false);

    // Bowtie self-intersecting polygon
    const bowtie: Polygon = {
      points: [
        { x: 0, y: 0 },
        { x: 1000, y: 1000 },
        { x: 1000, y: 0 },
        { x: 0, y: 1000 },
      ],
    };
    expect(isValidPolygon(bowtie)).toBe(false);
    expect(() => assertValidPolygon(bowtie)).toThrow(SelfIntersectionError);
  });

  it('computes polygon clipping and intersection area using Sutherland-Hodgman', () => {
    const a = createRect(0, 0, 4000, 4000);
    const b = createRect(2000, 2000, 4000, 4000);
    const interArea = polygonIntersectionArea(a, b);
    expect(interArea).toBeCloseTo(4000000, -2);
    expect(polygonsOverlap(a, b)).toBe(true);
  });

  it('detects polygon adjacency and extracts shared edge', () => {
    const a = createRect(0, 0, 3000, 4000);
    const b = createRect(3000, 0, 3000, 4000);
    expect(polygonsAdjacent(a, b)).toBe(true);

    const edge = sharedEdge(a, b);
    expect(edge).not.toBeNull();
  });
});

// ─── 7. Curves (Circle, Arc) ─────────────────────────────────────────────────

describe('7. Curves', () => {
  it('creates circle and computes area, perimeter, and point containment', () => {
    const circle = createCircle({ x: 1000, y: 1000 }, 500);
    expect(circleArea(circle)).toBeCloseTo(Math.PI * 250000);
    expect(circlePerimeter(circle)).toBeCloseTo(2 * Math.PI * 500);
    expect(pointInCircle({ x: 1200, y: 1000 }, circle)).toBe(true);
    expect(pointInCircle({ x: 2000, y: 1000 }, circle)).toBe(false);

    const bbox = circleBoundingBox(circle);
    expect(bbox).toEqual({ x: 500, y: 500, width: 1000, height: 1000 });
  });

  it('creates arc and computes length, endpoints, and polygon discretization', () => {
    const arc = createArc({ x: 0, y: 0 }, 1000, 0, 90);
    expect(arcLength(arc)).toBeCloseTo((90 / 360) * (2 * Math.PI * 1000));

    const { start, end } = arcEndpoints(arc);
    expect(start.x).toBeCloseTo(1000);
    expect(start.y).toBeCloseTo(0);
    expect(end.x).toBeCloseTo(0);
    expect(end.y).toBeCloseTo(1000);

    const poly = arcToPolygon(arc, 8);
    expect(poly.points.length).toBe(10);
  });
});

// ─── 8. Room Geometry ────────────────────────────────────────────────────────

describe('8. Room Geometry', () => {
  it('computes room geometry derived from boundary', () => {
    const room = makeRoom('r1', 1000, 2000, 4000, 5000, 'Master Bedroom');
    const info = computeRoomGeometry(room);
    expect(info.area).toBe(20000000);
    expect(info.perimeter).toBe(18000);
    expect(info.centroid.x).toBe(3000);
    expect(info.centroid.y).toBe(4500);
  });

  it('computes carpet area with wall thickness reduction', () => {
    const room = makeRoom('r1', 0, 0, 4000, 5000);
    const carpet = computeCarpetArea(room, 200);
    // (4000 - 200) * (5000 - 200) = 3800 * 4800 = 18,240,000
    expect(carpet).toBeCloseTo(18240000, -3);
  });

  it('validates room geometry', () => {
    const validRoom = makeRoom('r1', 0, 0, 3000, 4000);
    expect(validateRoomGeometry(validRoom).valid).toBe(true);

    const invalidRoom = { ...validRoom, width: -100 };
    expect(validateRoomGeometry(invalidRoom).valid).toBe(false);
  });
});

// ─── 9. Plot & Setbacks ──────────────────────────────────────────────────────

describe('9. Plot & Setbacks', () => {
  it('creates rectangular plot and computes building envelope from setbacks', () => {
    const plotBoundary = createPlotBoundary(9000, 15000);
    expect(polygonArea(plotBoundary)).toBe(135000000);

    const setbacks = { front: 3000, rear: 1500, left: 1200, right: 1200 };
    const envelope = computeBuildingEnvelope(9000, 15000, setbacks, { x: 0, y: 0 }, Direction.North);

    const bbox = polygonBoundingBox(envelope);
    expect(bbox.x).toBe(1200);
    expect(bbox.y).toBe(3000); // Front setback at North
    expect(bbox.width).toBe(9000 - 2400); // 6600
    expect(bbox.height).toBe(15000 - 4500); // 10500
  });

  it('checks room within plot and floor within envelope', () => {
    const plot = createPlotBoundary(10000, 15000);
    const roomInside = makeRoom('r1', 1000, 1000, 3000, 3000);
    const roomOutside = makeRoom('r2', 9000, 14000, 3000, 3000);

    expect(isRoomWithinPlot(roomInside, plot)).toBe(true);
    expect(isRoomWithinPlot(roomOutside, plot)).toBe(false);
  });
});

// ─── 10. Wall Geometry ───────────────────────────────────────────────────────

describe('10. Wall Geometry', () => {
  it('converts centerline wall to thick polygon', () => {
    const wall = makeWall('w1', { x: 0, y: 0 }, { x: 5000, y: 0 }, 200);
    const poly = wallToPolygon(wall);
    expect(poly.points.length).toBe(4);
    expect(polygonArea(poly)).toBeCloseTo(5000 * 200);
  });

  it('generates internal and external walls from rooms and floor boundary', () => {
    const roomA = makeRoom('r1', 0, 0, 4000, 4000);
    const roomB = makeRoom('r2', 4000, 0, 4000, 4000);
    const floorBoundary = createRect(0, 0, 8000, 4000);

    const walls = generateWalls([roomA, roomB], 'floor-1', floorBoundary);
    expect(walls.length).toBeGreaterThan(4);

    const internalWalls = walls.filter(w => w.type === WallType.Internal);
    expect(internalWalls.length).toBe(1);
    expect(internalWalls[0]!.roomIds).toContain('r1');
    expect(internalWalls[0]!.roomIds).toContain('r2');
  });

  it('merges collinear walls and splits wall at a point', () => {
    const w1 = makeWall('w1', { x: 0, y: 0 }, { x: 2000, y: 0 }, 200);
    const w2 = makeWall('w2', { x: 2000, y: 0 }, { x: 5000, y: 0 }, 200);
    const merged = mergeWalls([w1, w2]);
    expect(merged.length).toBe(1);
    expect(wallLength(merged[0]!)).toBe(5000);

    const [left, right] = splitWall(merged[0]!, { x: 2000, y: 0 });
    expect(wallLength(left)).toBe(2000);
    expect(wallLength(right)).toBe(3000);
  });

  it('finds L, T, and X junctions between walls', () => {
    const w1 = makeWall('w1', { x: 0, y: 0 }, { x: 5000, y: 0 });
    const w2 = makeWall('w2', { x: 5000, y: 0 }, { x: 5000, y: 5000 });
    const w3 = makeWall('w3', { x: 2500, y: 0 }, { x: 2500, y: 3000 });

    const junctions = findWallIntersections([w1, w2, w3]);
    expect(junctions.some(j => j.type === 'L-junction')).toBe(true);
    expect(junctions.some(j => j.type === 'T-junction')).toBe(true);
  });
});

// ─── 11. Door Geometry & Validation ──────────────────────────────────────────

describe('11. Door Geometry', () => {
  it('validates door placement on host wall', () => {
    const hostWall = makeWall('w1', { x: 0, y: 0 }, { x: 4000, y: 0 }, 200);
    const door: Door = {
      id: 'd1',
      floorId: 'f1',
      wallId: 'w1',
      position: { x: 500, y: 0 },
      width: 900,
      height: 2100,
      type: DoorType.Single,
      swingDirection: SwingDirection.Right,
      connectsRooms: ['r1', 'r2'],
    };

    expect(validateDoorPlacement(door, hostWall).valid).toBe(true);

    const invalidPosDoor: Door = { ...door, position: { x: 500, y: 500 } };
    expect(validateDoorPlacement(invalidPosDoor, hostWall).valid).toBe(false);

    const tooWideDoor: Door = { ...door, width: 5000 };
    expect(validateDoorPlacement(tooWideDoor, hostWall).valid).toBe(false);
  });

  it('computes door opening segment and swing fan polygon', () => {
    const hostWall = makeWall('w1', { x: 0, y: 0 }, { x: 4000, y: 0 }, 200);
    const door: Door = {
      id: 'd1',
      floorId: 'f1',
      wallId: 'w1',
      position: { x: 1000, y: 0 },
      width: 900,
      height: 2100,
      type: DoorType.Single,
      swingDirection: SwingDirection.Right,
      connectsRooms: ['r1', 'r2'],
    };

    const opening = computeDoorOpeningSegment(door, hostWall);
    expect(opening.start.x).toBe(1000);
    expect(opening.end.x).toBe(1900);

    const swing = computeDoorSwingPolygon(door, hostWall);
    expect(swing.points.length).toBeGreaterThan(4);
    expect(polygonArea(swing)).toBeGreaterThan(0);
  });
});

// ─── 12. Window Geometry & Validation ────────────────────────────────────────

describe('12. Window Geometry', () => {
  it('validates window placement on external wall', () => {
    const externalWall = makeWall('w1', { x: 0, y: 0 }, { x: 4000, y: 0 }, 200, WallType.External);
    const internalWall = makeWall('w2', { x: 0, y: 0 }, { x: 4000, y: 0 }, 100, WallType.Internal);

    const window: Window = {
      id: 'win1',
      floorId: 'f1',
      wallId: 'w1',
      position: { x: 1000, y: 0 },
      width: 1200,
      height: 1200,
      sillHeight: 900,
      type: WindowType.Casement,
      roomId: 'r1',
    };

    expect(validateWindowPlacement(window, externalWall).valid).toBe(true);
    expect(validateWindowPlacement(window, internalWall).valid).toBe(false);
  });

  it('computes window opening segment and glazing polygon', () => {
    const wall = makeWall('w1', { x: 0, y: 0 }, { x: 4000, y: 0 }, 200, WallType.External);
    const window: Window = {
      id: 'win1',
      floorId: 'f1',
      wallId: 'w1',
      position: { x: 1000, y: 0 },
      width: 1200,
      height: 1200,
      sillHeight: 900,
      type: WindowType.Casement,
      roomId: 'r1',
    };

    const opening = computeWindowOpeningSegment(window, wall);
    expect(opening.start.x).toBe(1000);
    expect(opening.end.x).toBe(2200);

    const glazing = computeWindowGlazingPolygon(window, wall);
    expect(glazing.points.length).toBe(4);
    expect(polygonArea(glazing)).toBeCloseTo(1200 * 200);
  });
});

// ─── 13. Staircase Geometry ──────────────────────────────────────────────────

describe('13. Staircase Geometry', () => {
  it('computes stair geometry, walkline, and landing', () => {
    const stair: Stair = {
      id: 's1',
      floorId: 'f1',
      type: StairType.Straight,
      boundary: createRect(0, 0, 1000, 3000),
      x: 0,
      y: 0,
      width: 1000,
      length: 3000,
      direction: Direction.North,
      riserCount: 16,
      riserHeight: 175,
      treadDepth: 280,
      landingWidth: 1000,
      connectsFloors: [0, 1],
    };

    const info = computeStairGeometry(stair);
    expect(info.totalArea).toBe(3000000);
    expect(info.walkline.start.x).toBe(500);
    expect(info.walkline.end.x).toBe(500);
  });

  it('validates stair dimensions against building code standards', () => {
    const standardStair: Stair = {
      id: 's1',
      floorId: 'f1',
      type: StairType.Straight,
      boundary: createRect(0, 0, 1000, 3000),
      x: 0,
      y: 0,
      width: 1000,
      length: 3000,
      direction: Direction.North,
      riserCount: 16,
      riserHeight: 170,
      treadDepth: 280,
      landingWidth: 1000,
      connectsFloors: [0, 1],
    };
    expect(validateStairDimensions(standardStair).valid).toBe(true);

    const dangerousStair: Stair = {
      ...standardStair,
      riserHeight: 250, // > 200mm limit
      treadDepth: 180, // < 230mm limit
      width: 600, // < 800mm limit
    };
    const res = validateStairDimensions(dangerousStair);
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThanOrEqual(3);
  });
});

// ─── 14. Collision Detection ─────────────────────────────────────────────────

describe('14. Collision Detection', () => {
  it('detects room overlaps and reports collision result', () => {
    const r1 = makeRoom('r1', 0, 0, 3000, 3000);
    const r2 = makeRoom('r2', 2000, 2000, 3000, 3000);
    const collisions = detectRoomCollisions(r1, [r2]);
    expect(collisions.length).toBe(1);
    expect(collisions[0]!.overlapArea).toBeCloseTo(1000000, -3);
  });

  it('does not report collision for adjacent touching rooms', () => {
    const r1 = makeRoom('r1', 0, 0, 3000, 3000);
    const r2 = makeRoom('r2', 3000, 0, 3000, 3000);
    expect(detectRoomCollisions(r1, [r2])).toHaveLength(0);
  });

  it('detects boundary violations', () => {
    const floorBoundary = createRect(0, 0, 10000, 10000);
    const insideRoom = makeRoom('r1', 1000, 1000, 3000, 3000);
    const outsideRoom = makeRoom('r2', 9000, 9000, 3000, 3000);

    expect(detectBoundaryViolation(insideRoom, floorBoundary)).toBe(false);
    expect(detectBoundaryViolation(outsideRoom, floorBoundary)).toBe(true);
  });
});

// ─── 15. Spatial Indexing ────────────────────────────────────────────────────

describe('15. Spatial Indexing', () => {
  it('SimpleSpatialIndex inserts, queries, removes, and clears', () => {
    const index = new SimpleSpatialIndex<{ id: string }>();
    index.insert({ id: 'a' }, createBoundingBox(0, 0, 1000, 1000));
    index.insert({ id: 'b' }, createBoundingBox(2000, 2000, 1000, 1000));

    expect(index.size()).toBe(2);
    const hits = index.search(createBoundingBox(500, 500, 1000, 1000));
    expect(hits.length).toBe(1);
    expect(hits[0]!.id).toBe('a');

    index.remove(hits[0]!);
    expect(index.size()).toBe(1);
    index.clear();
    expect(index.size()).toBe(0);
  });

  it('GridSpatialIndex partitions and accurately finds intersecting items', () => {
    const index = new GridSpatialIndex<{ id: string }>(1000);
    index.insert({ id: 'item1' }, createBoundingBox(0, 0, 1500, 1500));
    index.insert({ id: 'item2' }, createBoundingBox(5000, 5000, 1000, 1000));

    const results = index.search(createBoundingBox(1000, 1000, 1000, 1000));
    expect(results.length).toBe(1);
    expect(results[0]!.id).toBe('item1');

    const emptyResults = index.search(createBoundingBox(3000, 3000, 500, 500));
    expect(emptyResults.length).toBe(0);
  });
});

// ─── 16. Coordinate Transforms (World vs Screen) ─────────────────────────────

describe('16. Coordinate Transforms', () => {
  it('transforms world point to screen point and inverts back', () => {
    const transform = { scale: 0.1, offsetX: 100, offsetY: 200 };
    const worldPt = { x: 5000, y: 3000 };

    const screenPt = worldToScreen(worldPt, transform);
    expect(screenPt).toEqual({ x: 600, y: 500 });

    const backToWorld = screenToWorld(screenPt, transform);
    expect(backToWorld.x).toBeCloseTo(5000);
    expect(backToWorld.y).toBeCloseTo(3000);
  });

  it('fits world bounds to viewport with aspect ratio preservation and padding', () => {
    const worldBounds = createBoundingBox(0, 0, 10000, 20000);
    const transform = fitBoundsToViewport(worldBounds, 800, 600, 50);

    expect(transform.scale).toBeGreaterThan(0);
    const screenCenter = worldToScreen({ x: 5000, y: 10000 }, transform);
    expect(screenCenter.x).toBeCloseTo(400);
    expect(screenCenter.y).toBeCloseTo(300);
  });
});

// ─── 17. Unit Conversions & String Parsing ────────────────────────────────────

describe('17. Unit Conversions & Parsing', () => {
  it('converts linear units', () => {
    expect(mmToFeet(304.8)).toBeCloseTo(1);
    expect(feetToMm(1)).toBeCloseTo(304.8);
    expect(mmToMeters(1000)).toBe(1);
    expect(metersToMm(1)).toBe(1000);
    expect(mmToInches(25.4)).toBeCloseTo(1);
    expect(inchesToMm(1)).toBeCloseTo(25.4);
    expect(mmToCm(100)).toBe(10);
    expect(cmToMm(10)).toBe(100);
  });

  it('converts area units including Indian real estate units', () => {
    expect(sqMmToSqM(1000000)).toBe(1);
    expect(sqMToSqMm(1)).toBe(1000000);
    expect(sqMmToSqFt(92903.04)).toBeCloseTo(1);

    // 1 Acre = 43,560 sq ft
    const oneAcreSqMm = acresToSqMm(1);
    expect(sqMmToAcres(oneAcreSqMm)).toBeCloseTo(1);

    // 1 Cent = 435.6 sq ft
    const oneCentSqMm = centsToSqMm(1);
    expect(sqMmToCents(oneCentSqMm)).toBeCloseTo(1);
  });

  it('parses length strings into millimeters', () => {
    expect(parseLength('10 ft')).toBeCloseTo(3048);
    expect(parseLength("10'-6\"")).toBeCloseTo(3200.4);
    expect(parseLength('3.5 m')).toBe(3500);
    expect(parseLength('120 in')).toBeCloseTo(3048);
    expect(parseLength('2500 mm')).toBe(2500);
  });

  it('parses area strings into square millimeters', () => {
    expect(parseArea('1000 sq ft')).toBeCloseTo(sqFtToSqMm(1000));
    expect(parseArea('100 sq m')).toBeCloseTo(sqMToSqMm(100));
    expect(parseArea('2 cents')).toBeCloseTo(centsToSqMm(2));
  });

  it('formats measurements cleanly', () => {
    expect(formatFeet(3048)).toBe('10.0 ft');
    expect(formatFeetInches(3200.4)).toBe('10\'-6"');
    expect(formatMeters(3500)).toBe('3.50 m');
    expect(formatSqFt(sqFtToSqMm(150))).toBe('150.0 sq ft');
    expect(formatSqM(sqMToSqMm(50))).toBe('50.0 sq m');
  });
});

// ─── 18. Visual Debugging Collector ──────────────────────────────────────────

describe('18. Visual Debugging', () => {
  it('collects points, walls, rooms, doors, and generates standalone SVG', () => {
    const collector = new GeometryDebugCollector();
    const room = makeRoom('r1', 0, 0, 4000, 4000);
    const wall = makeWall('w1', { x: 0, y: 0 }, { x: 4000, y: 0 }, 200);

    collector.addRoom(room);
    collector.addWall(wall);
    collector.addPoint({ x: 2000, y: 2000 }, 'Test Point');

    const snap = collector.getSnapshot();
    expect(snap.items.length).toBeGreaterThanOrEqual(3);

    const svg = collector.toSVG();
    expect(svg).toContain('<svg');
    expect(svg).toContain('<polygon');
    expect(svg).toContain('</svg>');
  });
});

// ─── 19. Geometric Regression Tests ──────────────────────────────────────────

describe('19. Regression Tests for Geometric Edge Cases', () => {
  it('REG-001: Shoelace formula returns positive area regardless of vertex ordering', () => {
    const cw = createRect(0, 0, 3000, 4000);
    const ccw: Polygon = { points: [...cw.points].reverse() };
    expect(polygonArea(cw)).toBe(polygonArea(ccw));
    expect(polygonArea(cw)).toBeGreaterThan(0);
  });

  it('REG-002: Sutherland-Hodgman clipping does not produce NaN or infinite coordinates on degenerate overlaps', () => {
    const a = createRect(0, 0, 1000, 1000);
    const b = createRect(1000, 1000, 1000, 1000); // Touching at single corner
    const clipped = sutherlandHodgmanClip(a.points.slice(), b.points.slice());
    for (const p of clipped) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });

  it('REG-003: Wall merging correctly accumulates connected room IDs', () => {
    const w1: Wall = {
      id: 'w1',
      floorId: 'f1',
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 2000, y: 0 },
      thickness: 200,
      type: WallType.Internal,
      roomIds: ['r1', 'r2'],
      hasOpening: false,
      loadBearing: false,
    };
    const w2: Wall = {
      id: 'w2',
      floorId: 'f1',
      startPoint: { x: 2000, y: 0 },
      endPoint: { x: 4000, y: 0 },
      thickness: 200,
      type: WallType.Internal,
      roomIds: ['r2', 'r3'],
      hasOpening: false,
      loadBearing: false,
    };

    const merged = mergeWalls([w1, w2]);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.roomIds).toEqual(expect.arrayContaining(['r1', 'r2', 'r3']));
  });

  it('REG-004: Point-on-segment works for vertical segments', () => {
    const vertSeg = createSegment({ x: 100, y: 0 }, { x: 100, y: 1000 });
    expect(pointOnSegment({ x: 100, y: 500 }, vertSeg)).toBe(true);
    expect(pointOnSegment({ x: 105, y: 500 }, vertSeg)).toBe(false);
  });
});
