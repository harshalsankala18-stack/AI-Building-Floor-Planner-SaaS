/**
 * Plot & Site Geometry Operations.
 * Manages plot boundaries, setbacks, usable building envelopes, and site constraints.
 * All measurements in millimeters.
 */

import type { Site, Setbacks, Polygon, Point, BoundingBox, Floor, Room } from '@ai-floor-planner/core';
import { Direction } from '@ai-floor-planner/core';
import { createRect } from './rectangle';
import { polygonArea, containsPolygon, polygonBoundingBox, isValidPolygon } from './polygon';
import { DegenerateGeometryError } from './errors';

export interface PlotGeometryInfo {
  readonly boundary: Polygon;
  readonly boundingBox: BoundingBox;
  readonly plotArea: number;
  readonly buildingEnvelope: Polygon;
  readonly envelopeArea: number;
}

/** Create a rectangular plot boundary polygon. */
export function createPlotBoundary(
  width: number,
  depth: number,
  origin: Point = { x: 0, y: 0 },
): Polygon {
  if (width <= 0 || depth <= 0) {
    throw new DegenerateGeometryError('Plot', `Width (${width}) and depth (${depth}) must be positive`);
  }
  return createRect(origin.x, origin.y, width, depth);
}

/**
 * Compute the usable building envelope polygon from plot boundary and setbacks.
 * For rectangular plots with front/rear/left/right setbacks:
 * Insets the plot boundary according to roadFacing direction.
 */
export function computeBuildingEnvelope(
  plotWidth: number,
  plotDepth: number,
  setbacks: Setbacks,
  origin: Point = { x: 0, y: 0 },
  roadFacing: Direction = Direction.North,
): Polygon {
  let setbackTop = setbacks.rear;
  let setbackBottom = setbacks.front;
  let setbackLeft = setbacks.left;
  let setbackRight = setbacks.right;

  // Road facing dictates which boundary is 'front'
  switch (roadFacing) {
    case Direction.North:
      setbackTop = setbacks.front;
      setbackBottom = setbacks.rear;
      setbackLeft = setbacks.left;
      setbackRight = setbacks.right;
      break;
    case Direction.South:
      setbackTop = setbacks.rear;
      setbackBottom = setbacks.front;
      setbackLeft = setbacks.right;
      setbackRight = setbacks.left;
      break;
    case Direction.East:
      setbackTop = setbacks.left;
      setbackBottom = setbacks.right;
      setbackLeft = setbacks.rear;
      setbackRight = setbacks.front;
      break;
    case Direction.West:
      setbackTop = setbacks.right;
      setbackBottom = setbacks.left;
      setbackLeft = setbacks.front;
      setbackRight = setbacks.rear;
      break;
    default:
      setbackTop = setbacks.front;
      setbackBottom = setbacks.rear;
      setbackLeft = setbacks.left;
      setbackRight = setbacks.right;
  }

  const envelopeX = origin.x + setbackLeft;
  const envelopeY = origin.y + setbackTop;
  const envelopeWidth = plotWidth - setbackLeft - setbackRight;
  const envelopeHeight = plotDepth - setbackTop - setbackBottom;

  if (envelopeWidth <= 0 || envelopeHeight <= 0) {
    throw new DegenerateGeometryError(
      'BuildingEnvelope',
      `Setbacks exceed plot dimensions (usable width: ${envelopeWidth}, usable height: ${envelopeHeight})`,
    );
  }

  return createRect(envelopeX, envelopeY, envelopeWidth, envelopeHeight);
}

/** Compute derived geometric information for a Site. */
export function computePlotGeometry(site: Site): PlotGeometryInfo {
  const boundary = site.plotBoundary;
  const bbox = polygonBoundingBox(boundary);
  const plotArea = site.plotArea || polygonArea(boundary);
  const buildingEnvelope = computeBuildingEnvelope(
    site.plotWidth,
    site.plotDepth,
    site.setbacks,
    { x: bbox.x, y: bbox.y },
    site.roadFacing,
  );
  const envelopeArea = polygonArea(buildingEnvelope);

  return {
    boundary,
    boundingBox: bbox,
    plotArea,
    buildingEnvelope,
    envelopeArea,
  };
}

/** Check if a room is completely within the plot boundary. */
export function isRoomWithinPlot(room: Room, plotBoundary: Polygon): boolean {
  return containsPolygon(plotBoundary, room.boundary);
}

/** Check if a floor is completely within the usable building envelope. */
export function isFloorWithinEnvelope(floor: Floor, envelope: Polygon): boolean {
  return containsPolygon(envelope, floor.boundary);
}

/** Validate site geometry properties. */
export function validateSiteGeometry(site: Site): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (site.plotWidth <= 0) errors.push(`Plot width (${site.plotWidth}) must be positive`);
  if (site.plotDepth <= 0) errors.push(`Plot depth (${site.plotDepth}) must be positive`);
  if (!isValidPolygon(site.plotBoundary)) errors.push('Plot boundary is not a valid closed polygon');

  if (site.setbacks.front < 0 || site.setbacks.rear < 0 || site.setbacks.left < 0 || site.setbacks.right < 0) {
    errors.push('Setback distances cannot be negative');
  }

  const minSetbackWidth = site.plotWidth - site.setbacks.left - site.setbacks.right;
  const minSetbackDepth = site.plotDepth - site.setbacks.front - site.setbacks.rear;
  if (minSetbackWidth <= 0 || minSetbackDepth <= 0) {
    errors.push('Setbacks exceed plot boundaries, leaving zero buildable area');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
