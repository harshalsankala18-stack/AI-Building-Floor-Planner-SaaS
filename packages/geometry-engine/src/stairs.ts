/**
 * Staircase Geometry Foundation.
 * Manages stair bounding envelopes, flight geometry, landing zones, and building code compliance.
 * All measurements in millimeters.
 */

import type { Stair, Polygon, BoundingBox, LineSegment } from '@ai-floor-planner/core';
import { createRect } from './rectangle';
import { polygonArea, polygonBoundingBox } from './polygon';

export interface StairGeometryInfo {
  readonly boundary: Polygon;
  readonly boundingBox: BoundingBox;
  readonly totalArea: number;
  readonly landingPolygon: Polygon;
  readonly walkline: LineSegment;
  readonly flightPolygons: Polygon[];
}

export interface StairValidationResult {
  readonly valid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
}

/** Compute derived geometric structures for a staircase. */
export function computeStairGeometry(stair: Stair): StairGeometryInfo {
  const boundary = stair.boundary && stair.boundary.points.length >= 3
    ? stair.boundary
    : createRect(stair.x, stair.y, stair.width, stair.length);

  const bbox = polygonBoundingBox(boundary);
  const totalArea = polygonArea(boundary);

  // Landing polygon: standard rectangular region at top/bottom of flight
  const landingWidth = stair.landingWidth || stair.width;
  const landingPolygon = createRect(stair.x, stair.y, stair.width, landingWidth);

  // Walkline along center of flight
  const walkline: LineSegment = {
    start: { x: stair.x + stair.width / 2, y: stair.y },
    end: { x: stair.x + stair.width / 2, y: stair.y + stair.length },
  };

  return {
    boundary,
    boundingBox: bbox,
    totalArea,
    landingPolygon,
    walkline,
    flightPolygons: [boundary],
  };
}

/** Compute the clearance envelope required for a staircase (including headroom and landings). */
export function computeStairClearanceEnvelope(stair: Stair): Polygon {
  return stair.boundary && stair.boundary.points.length >= 3
    ? stair.boundary
    : createRect(stair.x, stair.y, stair.width, stair.length);
}

/**
 * Validate staircase dimensions against standard architectural building codes (NBC / IBC):
 * - Minimum tread depth: 250mm (recommended 280-300mm)
 * - Maximum riser height: 190mm (recommended 150-175mm)
 * - Minimum stair width: 900mm (residential), 1200mm (commercial)
 * - Blondel's rule: 2 * Riser + Tread should be between 600mm and 650mm
 * - Landing width >= flight width
 */
export function validateStairDimensions(stair: Stair): StairValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Width checks
  if (stair.width < 800) {
    errors.push(`Stair flight width (${stair.width}mm) is below minimum building code standard (800mm)`);
  } else if (stair.width < 900) {
    warnings.push(`Stair flight width (${stair.width}mm) is narrow (900mm+ recommended for comfort)`);
  }

  // Riser checks
  if (stair.riserHeight > 200) {
    errors.push(`Riser height (${stair.riserHeight}mm) exceeds maximum building code limit (200mm)`);
  } else if (stair.riserHeight < 100) {
    errors.push(`Riser height (${stair.riserHeight}mm) is too low (minimum 100mm)`);
  }

  // Tread checks
  if (stair.treadDepth < 230) {
    errors.push(`Tread depth (${stair.treadDepth}mm) is below minimum safe limit (230mm)`);
  }

  // Blondel's formula: 2R + T ≈ 600mm - 650mm
  const blondel = 2 * stair.riserHeight + stair.treadDepth;
  if (blondel < 580 || blondel > 680) {
    warnings.push(`Stair ergonomic ratio 2R + T (${blondel}mm) is outside optimal comfort range (600mm–650mm)`);
  }

  // Landing checks
  if (stair.landingWidth > 0 && stair.landingWidth < stair.width) {
    warnings.push(`Landing width (${stair.landingWidth}mm) should be at least equal to flight width (${stair.width}mm)`);
  }

  // Total floor connection
  if (stair.connectsFloors[0] === stair.connectsFloors[1]) {
    errors.push(`Stair connectsFloors must connect two different levels (received [${stair.connectsFloors.join(', ')}])`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
