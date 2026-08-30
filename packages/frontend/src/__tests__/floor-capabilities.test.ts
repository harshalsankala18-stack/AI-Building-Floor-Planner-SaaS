import { describe, expect, it } from 'vitest';
import {
  BUILDING_CAPABILITIES,
  SUPPORTED_FLOOR_COUNTS,
  formatBuildingFloorCount,
} from '@ai-floor-planner/core';

describe('shared floor capability source', () => {
  it('drives the complete Ground through G+9 presentation range', () => {
    expect(SUPPORTED_FLOOR_COUNTS).toHaveLength(BUILDING_CAPABILITIES.maximumFloorCount);
    expect(SUPPORTED_FLOOR_COUNTS[0]).toBe(BUILDING_CAPABILITIES.minimumFloorCount);
    expect(SUPPORTED_FLOOR_COUNTS.at(-1)).toBe(BUILDING_CAPABILITIES.maximumFloorCount);
    expect(formatBuildingFloorCount(1)).toBe('Ground only');
    expect(formatBuildingFloorCount(2)).toBe('G+1');
    expect(formatBuildingFloorCount(5)).toBe('G+4');
    expect(formatBuildingFloorCount(10)).toBe('G+9');
  });
});
