import { describe, expect, it } from 'vitest';
import type { Polygon } from '@ai-floor-planner/core';
import { polygonArea } from '@ai-floor-planner/geometry-engine';
import { decomposeOrthogonalIntersection, decomposeOrthogonalPolygon, sharedRegionEdge } from '../regions/orthogonal-decomposition';

const shapes: Record<string, Polygon> = {
  rectangle: { points: [{ x: 0, y: 0 }, { x: 10_000, y: 0 }, { x: 10_000, y: 8_000 }, { x: 0, y: 8_000 }] },
  l: { points: [{ x: 0, y: 0 }, { x: 10_000, y: 0 }, { x: 10_000, y: 3_000 }, { x: 4_000, y: 3_000 }, { x: 4_000, y: 8_000 }, { x: 0, y: 8_000 }] },
  u: { points: [{ x: 0, y: 0 }, { x: 10_000, y: 0 }, { x: 10_000, y: 8_000 }, { x: 7_000, y: 8_000 }, { x: 7_000, y: 3_000 }, { x: 3_000, y: 3_000 }, { x: 3_000, y: 8_000 }, { x: 0, y: 8_000 }] },
  t: { points: [{ x: 0, y: 0 }, { x: 10_000, y: 0 }, { x: 10_000, y: 3_000 }, { x: 7_000, y: 3_000 }, { x: 7_000, y: 8_000 }, { x: 3_000, y: 8_000 }, { x: 3_000, y: 3_000 }, { x: 0, y: 3_000 }] },
  courtyard: { points: [{ x: 0, y: 0 }, { x: 10_000, y: 0 }, { x: 10_000, y: 8_000 }, { x: 6_000, y: 8_000 }, { x: 6_000, y: 6_000 }, { x: 7_000, y: 6_000 }, { x: 7_000, y: 2_000 }, { x: 3_000, y: 2_000 }, { x: 3_000, y: 6_000 }, { x: 4_000, y: 6_000 }, { x: 4_000, y: 8_000 }, { x: 0, y: 8_000 }] },
};

describe('orthogonal planning-region decomposition', () => {
  it.each(Object.entries(shapes))('covers %s exactly without overlapping regions', (_name, polygon) => {
    const regions = decomposeOrthogonalPolygon(polygon);
    expect(regions.reduce((sum, region) => sum + region.area, 0)).toBeCloseTo(polygonArea(polygon), 8);
    for (let first = 0; first < regions.length; first += 1) {
      for (let second = first + 1; second < regions.length; second += 1) {
        const a = regions[first]!;
        const b = regions[second]!;
        const overlap = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
          * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
        expect(overlap).toBe(0);
      }
    }
    if (regions.length > 1) expect(regions.some((region, index) => regions.slice(index + 1).some(other => sharedRegionEdge(region, other)))).toBe(true);
  });

  it('derives the real common core region across reduced plates', () => {
    const outer = shapes.rectangle!;
    const inner = { points: [{ x: 2_000, y: 1_000 }, { x: 8_000, y: 1_000 }, { x: 8_000, y: 7_000 }, { x: 2_000, y: 7_000 }] };
    const intersection = decomposeOrthogonalIntersection([outer, inner]);
    expect(intersection.reduce((sum, region) => sum + region.area, 0)).toBe(36_000_000);
  });
});
