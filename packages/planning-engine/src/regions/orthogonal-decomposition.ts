import type { Point, Polygon } from '@ai-floor-planner/core';
import { pointInPolygon, polygonArea } from '@ai-floor-planner/geometry-engine';

export interface PlanningRegion {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly area: number;
}

export interface SharedRegionEdge {
  readonly orientation: 'horizontal' | 'vertical';
  readonly start: Point;
  readonly end: Point;
  readonly length: number;
}

const EPSILON = 0.01;

function uniqueSorted(values: readonly number[]): number[] {
  return [...new Set(values.map(value => Number(value.toFixed(6))))].sort((a, b) => a - b);
}

function isOrthogonal(polygon: Polygon): boolean {
  return polygon.points.every((point, index) => {
    const next = polygon.points[(index + 1) % polygon.points.length]!;
    return Math.abs(point.x - next.x) <= EPSILON || Math.abs(point.y - next.y) <= EPSILON;
  });
}

function horizontalBands(polygons: readonly Polygon[], inside: (point: Point) => boolean): PlanningRegion[] {
  const xs = uniqueSorted(polygons.flatMap(polygon => polygon.points.map(point => point.x)));
  const ys = uniqueSorted(polygons.flatMap(polygon => polygon.points.map(point => point.y)));
  const regions: PlanningRegion[] = [];

  for (let yi = 0; yi < ys.length - 1; yi += 1) {
    const y = ys[yi]!;
    const height = ys[yi + 1]! - y;
    if (height <= EPSILON) continue;
    let runStart: number | undefined;
    for (let xi = 0; xi < xs.length - 1; xi += 1) {
      const x = xs[xi]!;
      const width = xs[xi + 1]! - x;
      const occupied = width > EPSILON && inside({ x: x + width / 2, y: y + height / 2 });
      if (occupied && runStart === undefined) runStart = x;
      const closes = runStart !== undefined && (!occupied || xi === xs.length - 2);
      if (!closes) continue;
      const endX = occupied && xi === xs.length - 2 ? xs[xi + 1]! : x;
      const regionWidth = endX - runStart!;
      regions.push({
        id: `region_${regions.length + 1}`,
        x: runStart!, y, width: regionWidth, height, area: regionWidth * height,
      });
      runStart = undefined;
    }
  }
  return regions;
}

/**
 * Decomposes a simple orthogonal floor plate into non-overlapping rectangular
 * planning bands. The bands are generated from the polygon's own vertices, so
 * their union is the real polygon rather than its bounding box.
 */
export function decomposeOrthogonalPolygon(polygon: Polygon): PlanningRegion[] {
  if (polygon.points.length < 4 || !isOrthogonal(polygon)) {
    throw new Error('POLYGON_DECOMPOSITION_FAILURE: Residential generation requires a simple orthogonal floor boundary.');
  }
  const regions = horizontalBands([polygon], point => pointInPolygon(point, polygon));
  const coveredArea = regions.reduce((sum, region) => sum + region.area, 0);
  const expectedArea = polygonArea(polygon);
  if (expectedArea <= EPSILON || Math.abs(coveredArea - expectedArea) > Math.max(1, expectedArea * 1e-8)) {
    throw new Error('POLYGON_DECOMPOSITION_FAILURE: Planning regions do not exactly cover the approved floor boundary.');
  }
  return regions;
}

/** Returns rectangular bands contained by every supplied floor plate. */
export function decomposeOrthogonalIntersection(polygons: readonly Polygon[]): PlanningRegion[] {
  if (!polygons.length || polygons.some(polygon => polygon.points.length < 4 || !isOrthogonal(polygon))) {
    throw new Error('POLYGON_DECOMPOSITION_FAILURE: A common core requires valid orthogonal floor boundaries.');
  }
  return horizontalBands(polygons, point => polygons.every(polygon => pointInPolygon(point, polygon)));
}

export function sharedRegionEdge(a: PlanningRegion, b: PlanningRegion): SharedRegionEdge | undefined {
  const overlapXStart = Math.max(a.x, b.x);
  const overlapXEnd = Math.min(a.x + a.width, b.x + b.width);
  const overlapYStart = Math.max(a.y, b.y);
  const overlapYEnd = Math.min(a.y + a.height, b.y + b.height);
  if (Math.abs(a.y + a.height - b.y) <= EPSILON || Math.abs(b.y + b.height - a.y) <= EPSILON) {
    const y = Math.abs(a.y + a.height - b.y) <= EPSILON ? b.y : a.y;
    if (overlapXEnd - overlapXStart > EPSILON) return {
      orientation: 'horizontal', start: { x: overlapXStart, y }, end: { x: overlapXEnd, y },
      length: overlapXEnd - overlapXStart,
    };
  }
  if (Math.abs(a.x + a.width - b.x) <= EPSILON || Math.abs(b.x + b.width - a.x) <= EPSILON) {
    const x = Math.abs(a.x + a.width - b.x) <= EPSILON ? b.x : a.x;
    if (overlapYEnd - overlapYStart > EPSILON) return {
      orientation: 'vertical', start: { x, y: overlapYStart }, end: { x, y: overlapYEnd },
      length: overlapYEnd - overlapYStart,
    };
  }
  return undefined;
}

export function subtractRegion(
  region: PlanningRegion,
  cut: Pick<PlanningRegion, 'x' | 'y' | 'width' | 'height'>,
): PlanningRegion[] {
  const left = Math.max(region.x, cut.x);
  const right = Math.min(region.x + region.width, cut.x + cut.width);
  const top = Math.max(region.y, cut.y);
  const bottom = Math.min(region.y + region.height, cut.y + cut.height);
  if (right - left <= EPSILON || bottom - top <= EPSILON) return [region];
  const pieces = [
    { x: region.x, y: region.y, width: region.width, height: top - region.y },
    { x: region.x, y: bottom, width: region.width, height: region.y + region.height - bottom },
    { x: region.x, y: top, width: left - region.x, height: bottom - top },
    { x: right, y: top, width: region.x + region.width - right, height: bottom - top },
  ].filter(piece => piece.width > EPSILON && piece.height > EPSILON);
  return pieces.map((piece, index) => ({ ...piece, id: `${region.id}_part_${index + 1}`, area: piece.width * piece.height }));
}

export function subtractRegions(
  regions: readonly PlanningRegion[],
  cuts: readonly Pick<PlanningRegion, 'x' | 'y' | 'width' | 'height'>[],
): PlanningRegion[] {
  return cuts.reduce<PlanningRegion[]>((current, cut) => current.flatMap(region => subtractRegion(region, cut)), [...regions]);
}
