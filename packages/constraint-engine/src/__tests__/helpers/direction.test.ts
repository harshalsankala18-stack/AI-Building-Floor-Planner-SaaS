import { describe, it, expect } from 'vitest';
import {
  getQuadrant,
  getRoomQuadrant,
  quadrantMatches,
  isInHalf,
} from '../../helpers/direction';
import type { Polygon } from '@ai-floor-planner/core';

describe('Direction & Quadrant Helper', () => {
  const floorBox = {
    x: 0,
    y: 0,
    width: 10000,
    height: 10000,
  };

  it('computes correct quadrant for centroid with 0 orientation (North = up / -Y)', () => {
    // With orientation 0:
    // Top-right = NE (x > midX, y < midY)
    expect(getQuadrant({ x: 7500, y: 2500 }, floorBox, 0)).toBe('NE');
    // Top-left = NW (x < midX, y < midY)
    expect(getQuadrant({ x: 2500, y: 2500 }, floorBox, 0)).toBe('NW');
    // Bottom-right = SE (x > midX, y > midY)
    expect(getQuadrant({ x: 7500, y: 7500 }, floorBox, 0)).toBe('SE');
    // Bottom-left = SW (x < midX, y > midY)
    expect(getQuadrant({ x: 2500, y: 7500 }, floorBox, 0)).toBe('SW');
  });

  it('accounts for building orientation in quadrant determination', () => {
    // When orientation = 180 (North is down / +Y):
    // Top-right (x > midX, y < midY) which was NE at 0 is now SW at 180
    expect(getQuadrant({ x: 7500, y: 2500 }, floorBox, 180)).toBe('SW');
  });

  it('determines room quadrant from room boundary polygon', () => {
    const roomPoly: Polygon = {
      points: [
        { x: 6000, y: 6000 },
        { x: 9000, y: 6000 },
        { x: 9000, y: 9000 },
        { x: 6000, y: 9000 },
      ],
    };
    const floorPoly: Polygon = {
      points: [
        { x: 0, y: 0 },
        { x: 10000, y: 0 },
        { x: 10000, y: 10000 },
        { x: 0, y: 10000 },
      ],
    };
    expect(getRoomQuadrant(roomPoly, floorPoly, 0)).toBe('SE');
  });

  it('evaluates quadrant matching under strict, moderate, and flexible modes', () => {
    // Exact match
    expect(quadrantMatches('SE', 'SE', 'strict').matches).toBe(true);

    // Adjacent match under moderate
    const mod = quadrantMatches('NE', 'SE', 'moderate');
    expect(mod.matches).toBe(false);
    expect(mod.partial).toBe(true);

    // Opposite match under moderate
    const opp = quadrantMatches('NW', 'SE', 'moderate');
    expect(opp.matches).toBe(false);
    expect(opp.partial).toBe(false);

    // Flexible mode
    const flex = quadrantMatches('NE', 'SE', 'flexible');
    expect(flex.matches).toBe(false);
    expect(flex.partial).toBe(true);
  });

  it('checks if quadrant is in half (north, south, east, west)', () => {
    expect(isInHalf('NE', 'north')).toBe(true);
    expect(isInHalf('NW', 'north')).toBe(true);
    expect(isInHalf('SE', 'north')).toBe(false);

    expect(isInHalf('SE', 'east')).toBe(true);
    expect(isInHalf('SW', 'west')).toBe(true);
    expect(isInHalf('SW', 'south')).toBe(true);
  });
});
