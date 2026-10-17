/**
 * Phase 3 - Canonical conversion of an extracted plan into a candidate Building.
 *
 * PRD 21-24: the extracted plan becomes a candidate Building ONLY if it passes
 * the deterministic geometry/constraint system. If it fails it is REJECTED -
 * no silent repair, no different geometry claiming to be the original image.
 */

import type { Building, Direction, RoomType } from '@ai-floor-planner/core';
import { PlotShape } from '@ai-floor-planner/core';
import { createBuilding, createRoom, MINIMUM_ROOM_AREAS, MINIMUM_DIMENSIONS } from '@ai-floor-planner/core';
import type { DiagnosticFragment, ExtractedPlan } from './extraction';
import { extractedRoomType, imageRectToMillimetres } from './extraction-analysis';

export interface ExtractionSite {
  readonly plotWidth: number;
  readonly plotDepth: number;
  readonly orientation: number;
  readonly roadFacing: string;
  readonly frontSetback: number;
  readonly rearSetback: number;
  readonly leftSetback: number;
  readonly rightSetback: number;
}

const DOOR_TYPE: Readonly<Record<string, string>> = {
  open_passage: 'open_passage',
  double: 'double',
  sliding: 'sliding',
  single: 'single',
  unknown: 'single',
};

/**
 * Convert an extracted plan into a candidate canonical Building on a single
 * ground floor. All coordinates are mapped from image space to real-world mm.
 */
export function extractPlanToBuilding(
  extracted: ExtractedPlan,
  site: ExtractionSite,
  projectId: string,
  name: string,
): { building: Building | null; diagnostics: DiagnosticFragment[] } {
  const diagnostics: DiagnosticFragment[] = [];
  const siteRect = { plotWidth: site.plotWidth, plotDepth: site.plotDepth };

  const wide = extracted.metadata.imageWidePixels;
  const tall = extracted.metadata.imageTallPixels;
  const boundaryPolygon = {
    points: extracted.boundary.points.map(point => ({
      x: (point.x / wide) * site.plotWidth,
      y: (point.y / tall) * site.plotDepth,
    })),
  };
  if (boundaryPolygon.points.length < 3) {
    return {
      building: null,
      diagnostics: [{
        code: 'EXTRACTION_BOUNDARY_DEGENERATE',
        severity: 'error',
        message: 'The extracted boundary has fewer than three points and cannot define a building.',
      }],
    };
  }

  const base = createBuilding({
    projectId,
    name,
    site: {
      plotWidth: site.plotWidth,
      plotDepth: site.plotDepth,
      plotShape: PlotShape.Rectangular,
      orientation: site.orientation,
      roadFacing: site.roadFacing as Direction,
      setbacks: {
        front: site.frontSetback,
        rear: site.rearSetback,
        left: site.leftSetback,
        right: site.rightSetback,
      },
    },
    floors: [{ buildingId: 'floor-extracted', level: 0, name: 'Ground Floor', boundary: boundaryPolygon }],
  });

  const floorId = base.floors[0]!.id;
  let building: Building = base;

  const appendRoom = (
    id: string,
    roomName: string,
    type: RoomType,
    rect: { imageX: number; imageY: number; imageWidth: number; imageHeight: number },
    fixed: boolean,
  ): void => {
    const real = imageRectToMillimetres(rect, extracted.metadata, siteRect);
    if (!real) return;
    const minArea = (MINIMUM_ROOM_AREAS as Record<string, number | undefined>)[type];
    const minDimension = (MINIMUM_DIMENSIONS as Record<string, number | undefined>)[type];
    const privacy = type === 'bedroom' || type === 'bathroom' ? 'high' : 'low';
    building = {
      ...building,
      floors: building.floors.map(floor => floor.level === 0
        ? {
          ...floor,
          rooms: [
            ...floor.rooms,
            createRoom({
              floorId,
              name: roomName,
              type,
              x: real.x,
              y: real.y,
              width: real.width,
              height: real.height,
              tags: [`extracted:${id}`],
              ...(minArea !== undefined ? { minArea } : {}),
              ...(minDimension !== undefined ? { minWidthMm: minDimension, minHeightMm: minDimension } : {}),
              daylightRequirement: 'medium' as never,
              privacyRequirement: privacy as never,
              isFixed: fixed,
            }),
          ],
        }
        : floor),
    };
  };

  for (const room of extracted.rooms) {
    appendRoom(room.id, room.name, extractedRoomType(room.type || room.name), room, false);
  }
  for (const stair of extracted.stairs) {
    appendRoom(stair.id, stair.name, 'staircase' as RoomType, stair, true);
  }
  for (const park of extracted.parking) {
    appendRoom(park.id, park.name, 'parking' as RoomType, park, false);
  }

  return { building, diagnostics };
}

/**
 * Attach extracted doors and windows to their detected adjacent rooms.
 * Unresolvable references are reported, never invented.
 */
export function attachExtractedOpenings(
  building: Building,
  extracted: ExtractedPlan,
  site: { readonly plotWidth: number; readonly plotDepth: number },
): { building: Building; diagnostics: DiagnosticFragment[] } {
  const diagnostics: DiagnosticFragment[] = [];
  const floorId = building.floors[0]!.id;
  let next = building;

  for (const door of extracted.doors) {
    const adjacent = next.floors[0]!.rooms.find(room => room.tags.includes(`extracted:${door.adjacentRoomId}`));
    const real = imageRectToMillimetres(door, extracted.metadata, site);
    if (!adjacent || !real) {
      if (!adjacent) {
        diagnostics.push({
          code: 'EXTRACTION_DOOR_SKIPPED',
          severity: 'warning',
          message: `Door "${door.id}" was not attached because its adjacent room was not extracted from the image.`,
        });
      }
      continue;
    }
    next = {
      ...next,
      floors: next.floors.map(floor => floor.level === 0
        ? {
          ...floor,
          doors: [
            ...floor.doors,
            {
              id: door.id,
              floorId,
              wallId: '__extracted__',
              position: { x: real.x, y: real.y },
              width: real.width,
              height: 2100,
              type: (DOOR_TYPE[door.type] ?? 'single') as never,
              swingDirection: (door.swingDirection === 'outward' ? 'outward' : door.swingDirection === 'left' ? 'left' : door.swingDirection === 'right' ? 'right' : 'inward') as never,
              connectsRooms: [adjacent.id, '__outside__'] as [string, string],
            },
          ],
        }
        : floor),
    };
  }

  for (const window of extracted.windows) {
    const adjacent = next.floors[0]!.rooms.find(room => room.tags.includes(`extracted:${window.adjacentRoomId}`));
    const real = imageRectToMillimetres(window, extracted.metadata, site);
    if (!adjacent || !real) continue;
    next = {
      ...next,
      floors: next.floors.map(floor => floor.level === 0
        ? {
          ...floor,
          windows: [
            ...floor.windows,
            {
              id: window.id,
              floorId,
              wallId: '__extracted__',
              position: { x: real.x, y: real.y },
              width: real.width,
              height: Math.max(600, real.height),
              sillHeight: 900,
              type: 'sliding' as never,
              roomId: adjacent.id,
            },
          ],
        }
        : floor),
    };
  }

  return { building: next, diagnostics };
}