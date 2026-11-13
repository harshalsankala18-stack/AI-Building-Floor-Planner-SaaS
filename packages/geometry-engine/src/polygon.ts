/**
 * Polygon operations.
 * All measurements in millimeters. All functions are pure — no side effects.
 *
 * Polygons are defined by ordered vertices in a closed ring.
 * The last point connects implicitly to the first.
 */

import type { Point, Polygon, BoundingBox, LineSegment } from '@ai-floor-planner/core';
import { TOLERANCES } from '@ai-floor-planner/core';
import { pointInPolygon, pointsEqual } from './point';
import { segmentIntersection } from './segment';
import { DegenerateGeometryError, SelfIntersectionError } from './errors';

/** Create a Polygon with validation. */
export function createPolygon(points: Point[]): Polygon {
  if (points.length < 3) {
    throw new DegenerateGeometryError('Polygon', `Polygon must have at least 3 vertices (received ${points.length})`);
  }
  return { points: Object.freeze([...points]) };
}

/** Compute signed area of a polygon using the shoelace formula. */
export function polygonSignedArea(polygon: Polygon): number {
  const pts = polygon.points;
  const n = pts.length;
  if (n < 3) return 0;

  let area = 0;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    area += (pts[j]!.x * pts[i]!.y) - (pts[i]!.x * pts[j]!.y);
  }
  return area / 2;
}

/** Compute absolute area of a polygon using the shoelace formula. Always returns a non-negative number. */
export function polygonArea(polygon: Polygon): number {
  return Math.abs(polygonSignedArea(polygon));
}

/** Compute perimeter of a polygon. */
export function polygonPerimeter(polygon: Polygon): number {
  const pts = polygon.points;
  const n = pts.length;
  if (n < 2) return 0;

  let perimeter = 0;
  for (let i = 0; i < n; i++) {
    const curr = pts[i]!;
    const next = pts[(i + 1) % n]!;
    const dx = next.x - curr.x;
    const dy = next.y - curr.y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }
  return perimeter;
}

/** Compute centroid of a polygon. */
export function polygonCentroid(polygon: Polygon): Point {
  const pts = polygon.points;
  const n = pts.length;
  if (n === 0) return { x: 0, y: 0 };

  let cx = 0;
  let cy = 0;
  let signedArea = 0;

  for (let i = 0; i < n; i++) {
    const curr = pts[i]!;
    const next = pts[(i + 1) % n]!;
    const cross = curr.x * next.y - next.x * curr.y;
    signedArea += cross;
    cx += (curr.x + next.x) * cross;
    cy += (curr.y + next.y) * cross;
  }

  signedArea /= 2;
  if (Math.abs(signedArea) < 1e-10) {
    const sumX = pts.reduce((s, p) => s + p.x, 0);
    const sumY = pts.reduce((s, p) => s + p.y, 0);
    return { x: sumX / n, y: sumY / n };
  }

  cx /= (6 * signedArea);
  cy /= (6 * signedArea);
  return { x: cx, y: cy };
}

/** Compute axis-aligned bounding box of a polygon. */
export function polygonBoundingBox(polygon: Polygon): BoundingBox {
  const pts = polygon.points;
  if (pts.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/** Check if a polygon is convex. */
export function isConvex(polygon: Polygon): boolean {
  const pts = polygon.points;
  const n = pts.length;
  if (n < 3) return false;

  let sign = 0;
  for (let i = 0; i < n; i++) {
    const p1 = pts[i]!;
    const p2 = pts[(i + 1) % n]!;
    const p3 = pts[(i + 2) % n]!;
    const cross = (p2.x - p1.x) * (p3.y - p2.y) - (p2.y - p1.y) * (p3.x - p2.x);

    if (Math.abs(cross) > 1e-10) {
      if (sign === 0) {
        sign = cross > 0 ? 1 : -1;
      } else if ((cross > 0 ? 1 : -1) !== sign) {
        return false;
      }
    }
  }
  return true;
}

/** Check if a polygon is valid (≥3 points, non-self-intersecting, no consecutive duplicate vertices, positive area). */
export function isValidPolygon(polygon: Polygon): boolean {
  const pts = polygon.points;
  if (pts.length < 3) return false;

  const n = pts.length;
  for (let i = 0; i < n; i++) {
    if (pointsEqual(pts[i]!, pts[(i + 1) % n]!, TOLERANCES.LINEAR)) {
      return false;
    }
    const a: LineSegment = { start: pts[i]!, end: pts[(i + 1) % n]! };
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      const b: LineSegment = { start: pts[j]!, end: pts[(j + 1) % n]! };
      if (segmentIntersection(a, b) !== null) {
        return false;
      }
    }
  }

  return polygonArea(polygon) > TOLERANCES.AREA;
}

/** Validate polygon and throw explicit error if invalid. */
export function assertValidPolygon(polygon: Polygon, entityName: string = 'Polygon'): void {
  if (polygon.points.length < 3) {
    throw new DegenerateGeometryError(entityName, `Has only ${polygon.points.length} vertices (minimum 3 required)`);
  }
  const n = polygon.points.length;
  for (let i = 0; i < n; i++) {
    const a: LineSegment = { start: polygon.points[i]!, end: polygon.points[(i + 1) % n]! };
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      const b: LineSegment = { start: polygon.points[j]!, end: polygon.points[(j + 1) % n]! };
      if (segmentIntersection(a, b) !== null) {
        throw new SelfIntersectionError(entityName, `Edges (${i}, ${i+1}) and (${j}, ${(j+1)%n}) intersect`);
      }
    }
  }
  if (polygonArea(polygon) <= TOLERANCES.AREA) {
    throw new DegenerateGeometryError(entityName, 'Polygon has zero or sub-tolerance area');
  }
}

/**
 * Offset a polygon inward (negative distance) or outward (positive distance).
 * Uses miter bisector calculation for convex and simple polygons.
 */
export function offsetPolygon(polygon: Polygon, dist: number): Polygon {
  const pts = polygon.points;
  const n = pts.length;
  if (n < 3) return polygon;

  const newPoints: Point[] = [];
  const signed = polygonSignedArea(polygon);
  const isCW = signed >= 0;

  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n]!;
    const curr = pts[i]!;
    const next = pts[(i + 1) % n]!;

    const e1x = curr.x - prev.x;
    const e1y = curr.y - prev.y;
    const e2x = next.x - curr.x;
    const e2y = next.y - curr.y;

    const len1 = Math.sqrt(e1x * e1x + e1y * e1y);
    const len2 = Math.sqrt(e2x * e2x + e2y * e2y);
    if (len1 < 1e-10 || len2 < 1e-10) {
      newPoints.push(curr);
      continue;
    }

    const n1x = isCW ? -e1y / len1 : e1y / len1;
    const n1y = isCW ? e1x / len1 : -e1x / len1;
    const n2x = isCW ? -e2y / len2 : e2y / len2;
    const n2y = isCW ? e2x / len2 : -e2x / len2;

    let bx = n1x + n2x;
    let by = n1y + n2y;
    const blen = Math.sqrt(bx * bx + by * by);
    if (blen < 1e-10) {
      newPoints.push(curr);
      continue;
    }
    bx /= blen;
    by /= blen;

    const dot = n1x * bx + n1y * by;
    const scale = dot > 0.1 ? dist / dot : dist;

    newPoints.push({
      x: curr.x - bx * scale,
      y: curr.y - by * scale,
    });
  }

  return { points: newPoints };
}

/** Check if polygon A entirely contains polygon B. */
export function containsPolygon(outer: Polygon, inner: Polygon): boolean {
  for (const p of inner.points) {
    if (!pointInPolygon(p, outer)) {
      return false;
    }
  }
  return true;
}

/**
 * Check if polygon A entirely contains polygon B, accounting for concave boundaries.
 * This is stricter than simple vertex containment - it also checks that inner polygon edges
 * do not cross outside the outer polygon.
 */
export function containsPolygonConcave(
  outer: Polygon,
  inner: Polygon,
  toleranceMm: number = TOLERANCES.LINEAR,
): boolean {
  return containsPolygonWithTolerance(outer.points, inner.points, toleranceMm);
}

/** Check if a point is inside a polygon using ray casting with tolerance. */
export function pointInPolygonWithTolerance(
  pt: { x: number; y: number },
  poly: readonly { x: number; y: number }[],
  toleranceMm: number = 50,
): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i]!.x, yi = poly[i]!.y;
    const xj = poly[j]!.x, yj = poly[j]!.y;
    const intersect = ((yi > pt.y) !== (yj > pt.y)) && (pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  if (inside) return true;

  const tolSq = toleranceMm * toleranceMm;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    let distSq: number;
    if (lenSq === 0) {
      distSq = (pt.x - a.x) * (pt.x - a.x) + (pt.y - a.y) * (pt.y - a.y);
    } else {
      const t = Math.max(0, Math.min(1, ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / lenSq));
      const projX = a.x + t * dx;
      const projY = a.y + t * dy;
      distSq = (pt.x - projX) * (pt.x - projX) + (pt.y - projY) * (pt.y - projY);
    }
    if (distSq <= tolSq) return true;
  }
  return false;
}

/** Check if polygon A entirely contains polygon B (vertex + edge containment with tolerance). */
export function containsPolygonWithTolerance(
  outer: readonly { x: number; y: number }[],
  inner: readonly { x: number; y: number }[],
  toleranceMm: number = 50,
): boolean {
  if (outer.length < 3) return false;

  for (const p of inner) {
    if (!pointInPolygonWithTolerance(p, outer, toleranceMm)) {
      return false;
    }
  }

  const nInner = inner.length;
  if (nInner < 2) return true;

  for (let i = 0; i < nInner; i++) {
    const edgeStart = inner[i]!;
    const edgeEnd = inner[(i + 1) % nInner]!;
    const edge: LineSegment = { start: edgeStart, end: edgeEnd };
    if (segmentCrossesOutsidePolygon(edge, outer, toleranceMm)) {
      return false;
    }
  }

  return true;
}

/** Check if a line segment crosses outside a polygon boundary. */
export function segmentCrossesOutsidePolygon(
  segment: LineSegment,
  polygon: readonly { x: number; y: number }[],
  toleranceMm: number = 50,
): boolean {
  const { start: p1, end: p2 } = segment;

  const p1In = pointInPolygonWithTolerance(p1, polygon, toleranceMm);
  const p2In = pointInPolygonWithTolerance(p2, polygon, toleranceMm);
  if (!p1In || !p2In) return true;

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-10) return false;

  const tValues: number[] = [0, 1];
  const nPoly = polygon.length;

  for (let j = 0; j < nPoly; j++) {
    const e1 = polygon[j]!;
    const e2 = polygon[(j + 1) % nPoly]!;
    const edge: LineSegment = { start: e1, end: e2 };

    // Vertex projection near segment to capture exact boundary vertex transitions
    const tVertex = ((e1.x - p1.x) * dx + (e1.y - p1.y) * dy) / lenSq;
    if (tVertex > 0 && tVertex < 1) {
      const projX = p1.x + tVertex * dx;
      const projY = p1.y + tVertex * dy;
      const distSq = (e1.x - projX) * (e1.x - projX) + (e1.y - projY) * (e1.y - projY);
      if (distSq <= toleranceMm * toleranceMm) {
        tValues.push(tVertex);
      }
    }

    // Exact segment intersection with polygon edge
    const inter = segmentIntersection(segment, edge);
    if (inter !== null) {
      const t = ((inter.x - p1.x) * dx + (inter.y - p1.y) * dy) / lenSq;
      const clampedT = Math.max(0, Math.min(1, t));
      tValues.push(clampedT);
    }
  }

  tValues.sort((a, b) => a - b);
  const distinctT: number[] = [];
  for (const t of tValues) {
    if (distinctT.length === 0 || Math.abs(t - distinctT[distinctT.length - 1]!) > 1e-4) {
      distinctT.push(t);
    }
  }

  for (let i = 0; i < distinctT.length - 1; i++) {
    const tMid = (distinctT[i]! + distinctT[i + 1]!) / 2;
    const midPt = {
      x: p1.x + tMid * dx,
      y: p1.y + tMid * dy,
    };
    if (!pointInPolygonWithTolerance(midPt, polygon, toleranceMm)) {
      return true;
    }
  }

  return false;
}

function ensurePositiveOrientation(polygon: Polygon): Polygon {
  const signed = polygonSignedArea(polygon);
  if (signed >= 0) {
    return polygon;
  }
  return { points: [...polygon.points].reverse() };
}

function cross2D(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function pointStrictlyOrOnInteriorOfTriangle(p: Point, a: Point, b: Point, c: Point): boolean {
  const c1 = cross2D(a, b, p);
  const c2 = cross2D(b, c, p);
  const c3 = cross2D(c, a, p);
  return c1 >= -1e-6 && c2 >= -1e-6 && c3 >= -1e-6;
}

/**
 * Decompose a simple (convex or concave) polygon into triangles via ear clipping.
 * Each returned triangle is positively oriented (`polygonSignedArea > 0`).
 */
export function triangulateSimplePolygon(polygon: Polygon): Polygon[] {
  const cleaned: Point[] = [];
  for (const pt of polygon.points) {
    if (cleaned.length === 0 || !pointsEqual(cleaned[cleaned.length - 1]!, pt, TOLERANCES.LINEAR)) {
      cleaned.push(pt);
    }
  }
  if (cleaned.length > 1 && pointsEqual(cleaned[0]!, cleaned[cleaned.length - 1]!, TOLERANCES.LINEAR)) {
    cleaned.pop();
  }
  if (cleaned.length < 3) return [];

  const oriented = ensurePositiveOrientation({ points: cleaned }).points.slice();
  // Remove collinear vertices
  const verts: Point[] = [];
  for (let i = 0; i < oriented.length; i++) {
    const prev = oriented[(i - 1 + oriented.length) % oriented.length]!;
    const curr = oriented[i]!;
    const next = oriented[(i + 1) % oriented.length]!;
    if (Math.abs(cross2D(prev, curr, next)) > 1e-6) {
      verts.push(curr);
    }
  }
  if (verts.length < 3) return [];

  const triangles: Polygon[] = [];
  let maxGuards = verts.length * verts.length + 16;

  while (verts.length > 3 && maxGuards-- > 0) {
    let earFound = false;
    const n = verts.length;

    for (let i = 0; i < n; i++) {
      const prev = verts[(i - 1 + n) % n]!;
      const curr = verts[i]!;
      const next = verts[(i + 1) % n]!;

      if (cross2D(prev, curr, next) <= 1e-6) {
        continue;
      }

      let hasPointInside = false;
      for (let j = 0; j < n; j++) {
        if (j === (i - 1 + n) % n || j === i || j === (i + 1) % n) continue;
        const candidate = verts[j]!;
        if (
          pointsEqual(candidate, prev, TOLERANCES.LINEAR) ||
          pointsEqual(candidate, curr, TOLERANCES.LINEAR) ||
          pointsEqual(candidate, next, TOLERANCES.LINEAR)
        ) {
          continue;
        }
        if (pointStrictlyOrOnInteriorOfTriangle(candidate, prev, curr, next)) {
          hasPointInside = true;
          break;
        }
      }

      if (!hasPointInside) {
        const tri: Polygon = { points: [prev, curr, next] };
        if (polygonArea(tri) > TOLERANCES.AREA) {
          triangles.push(tri);
        }
        verts.splice(i, 1);
        earFound = true;
        break;
      }
    }

    if (!earFound) {
      // Fallback for near-degenerate geometry: clip sharpest convex corner
      let bestIdx = -1;
      let bestCross = -Infinity;
      for (let i = 0; i < verts.length; i++) {
        const prev = verts[(i - 1 + verts.length) % verts.length]!;
        const curr = verts[i]!;
        const next = verts[(i + 1) % verts.length]!;
        const c = cross2D(prev, curr, next);
        if (c > bestCross) {
          bestCross = c;
          bestIdx = i;
        }
      }
      if (bestIdx >= 0 && bestCross > 0) {
        const n2 = verts.length;
        const tri: Polygon = {
          points: [
            verts[(bestIdx - 1 + n2) % n2]!,
            verts[bestIdx]!,
            verts[(bestIdx + 1) % n2]!,
          ],
        };
        if (polygonArea(tri) > TOLERANCES.AREA) {
          triangles.push(tri);
        }
        verts.splice(bestIdx, 1);
      } else {
        break;
      }
    }
  }

  if (verts.length === 3) {
    const finalTri = ensurePositiveOrientation({ points: [verts[0]!, verts[1]!, verts[2]!] });
    if (polygonArea(finalTri) > TOLERANCES.AREA) {
      triangles.push(finalTri);
    }
  }

  return triangles;
}

/**
 * Compute intersection area of two polygons using Sutherland-Hodgman clipping.
 * Works for convex polygons (and concave subjects against convex clips).
 */
export function polygonIntersectionArea(a: Polygon, b: Polygon): number {
  if (a.points.length < 3 || b.points.length < 3) return 0;

  const clipped = sutherlandHodgmanClip(a.points.slice(), b.points.slice());
  if (clipped.length < 3) return 0;

  return polygonArea({ points: clipped });
}

/**
 * Compute exact intersection area of two simple polygons (convex or concave)
 * via ear-clipping triangulation and Sutherland-Hodgman triangle clipping.
 */
export function polygonIntersectionAreaConcave(a: Polygon, b: Polygon): number {
  if (a.points.length < 3 || b.points.length < 3) return 0;

  const boxA = polygonBoundingBox(a);
  const boxB = polygonBoundingBox(b);
  if (
    boxA.x + boxA.width <= boxB.x ||
    boxB.x + boxB.width <= boxA.x ||
    boxA.y + boxA.height <= boxB.y ||
    boxB.y + boxB.height <= boxA.y
  ) {
    return 0;
  }

  const convexA = isConvex(a);
  const convexB = isConvex(b);

  if (convexA && convexB) {
    const normA = ensurePositiveOrientation(a);
    const normB = ensurePositiveOrientation(b);
    const clipped = sutherlandHodgmanClip(normA.points.slice(), normB.points.slice());
    if (clipped.length < 3) return 0;
    return polygonArea({ points: clipped });
  }

  const partsA = convexA ? [ensurePositiveOrientation(a)] : triangulateSimplePolygon(a);
  const partsB = convexB ? [ensurePositiveOrientation(b)] : triangulateSimplePolygon(b);

  let totalArea = 0;
  for (const partA of partsA) {
    for (const partB of partsB) {
      const clipped = sutherlandHodgmanClip(partA.points.slice(), partB.points.slice());
      if (clipped.length >= 3) {
        totalArea += polygonArea({ points: clipped });
      }
    }
  }
  return totalArea;
}

/** Sutherland-Hodgman polygon clipping algorithm. */
export function sutherlandHodgmanClip(subject: Point[], clip: Point[]): Point[] {
  let output = subject;

  for (let i = 0; i < clip.length; i++) {
    if (output.length === 0) return [];
    const input = output;
    output = [];
    const edgeStart = clip[i]!;
    const edgeEnd = clip[(i + 1) % clip.length]!;

    for (let j = 0; j < input.length; j++) {
      const current = input[j]!;
      const previous = input[(j - 1 + input.length) % input.length]!;

      const currInside = isInsideEdge(current, edgeStart, edgeEnd);
      const prevInside = isInsideEdge(previous, edgeStart, edgeEnd);

      if (currInside) {
        if (!prevInside) {
          const inter = lineIntersection(previous, current, edgeStart, edgeEnd);
          if (inter) output.push(inter);
        }
        output.push(current);
      } else if (prevInside) {
        const inter = lineIntersection(previous, current, edgeStart, edgeEnd);
        if (inter) output.push(inter);
      }
    }
  }

  return output;
}

/** Check if point is on the "inside" (left) side of directed edge. */
function isInsideEdge(point: Point, edgeStart: Point, edgeEnd: Point): boolean {
  return (edgeEnd.x - edgeStart.x) * (point.y - edgeStart.y) -
    (edgeEnd.y - edgeStart.y) * (point.x - edgeStart.x) >= -1e-7;
}

/** Line-line intersection (infinite lines). */
function lineIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
  const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(denom) < 1e-10) return null;

  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
  return {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y),
  };
}

/** Check if two polygons overlap (intersection area > tolerance). */
export function polygonsOverlap(
  a: Polygon,
  b: Polygon,
  tolerance: number = TOLERANCES.OVERLAP,
): boolean {
  return polygonIntersectionArea(a, b) > tolerance;
}

/** Check if two polygons are adjacent (share an edge or partial edge). */
export function polygonsAdjacent(
  a: Polygon,
  b: Polygon,
  tolerance: number = TOLERANCES.ADJACENCY,
): boolean {
  return sharedEdge(a, b, tolerance) !== null;
}

/**
 * Find a shared edge between two polygons (within tolerance).
 * Returns the overlapping portion of the shared edge, or null.
 */
export function sharedEdge(
  a: Polygon,
  b: Polygon,
  tolerance: number = TOLERANCES.ADJACENCY,
): LineSegment | null {
  const aEdges = polygonEdges(a);
  const bEdges = polygonEdges(b);

  for (const ea of aEdges) {
    for (const eb of bEdges) {
      if (edgesOverlap(ea, eb, tolerance)) {
        return ea;
      }
    }
  }

  return null;
}

/** Get all edges of a polygon as line segments. */
export function polygonEdges(polygon: Polygon): LineSegment[] {
  const pts = polygon.points;
  const edges: LineSegment[] = [];
  for (let i = 0; i < pts.length; i++) {
    edges.push({ start: pts[i]!, end: pts[(i + 1) % pts.length]! });
  }
  return edges;
}

/** Check if two edges overlap (are collinear and share a segment). */
function edgesOverlap(a: LineSegment, b: LineSegment, tolerance: number): boolean {
  const isHorizontalA = Math.abs(a.start.y - a.end.y) <= tolerance;
  const isHorizontalB = Math.abs(b.start.y - b.end.y) <= tolerance;
  const isVerticalA = Math.abs(a.start.x - a.end.x) <= tolerance;
  const isVerticalB = Math.abs(b.start.x - b.end.x) <= tolerance;

  if (isHorizontalA && isHorizontalB) {
    if (Math.abs(a.start.y - b.start.y) > tolerance) return false;
    const aMinX = Math.min(a.start.x, a.end.x);
    const aMaxX = Math.max(a.start.x, a.end.x);
    const bMinX = Math.min(b.start.x, b.end.x);
    const bMaxX = Math.max(b.start.x, b.end.x);
    return aMinX < bMaxX - tolerance && bMinX < aMaxX - tolerance;
  }

  if (isVerticalA && isVerticalB) {
    if (Math.abs(a.start.x - b.start.x) > tolerance) return false;
    const aMinY = Math.min(a.start.y, a.end.y);
    const aMaxY = Math.max(a.start.y, a.end.y);
    const bMinY = Math.min(b.start.y, b.end.y);
    const bMaxY = Math.max(b.start.y, b.end.y);
    return aMinY < bMaxY - tolerance && bMinY < aMaxY - tolerance;
  }

  return (
    (pointsEqual(a.start, b.start, tolerance) && pointsEqual(a.end, b.end, tolerance)) ||
    (pointsEqual(a.start, b.end, tolerance) && pointsEqual(a.end, b.start, tolerance))
  );
}

/** Translate all points of a polygon by dx, dy. */
export function translatePolygon(polygon: Polygon, dx: number, dy: number): Polygon {
  return {
    points: polygon.points.map(p => ({ x: p.x + dx, y: p.y + dy })),
  };
}

/** Rotate all points of a polygon around an origin by angle in degrees. */
export function rotatePolygon(polygon: Polygon, angleDeg: number, origin?: Point): Polygon {
  const rotOrigin = origin ?? polygonCentroid(polygon);
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return {
    points: polygon.points.map(p => {
      const dx = p.x - rotOrigin.x;
      const dy = p.y - rotOrigin.y;
      return {
        x: rotOrigin.x + dx * cos - dy * sin,
        y: rotOrigin.y + dx * sin + dy * cos,
      };
    }),
  };
}