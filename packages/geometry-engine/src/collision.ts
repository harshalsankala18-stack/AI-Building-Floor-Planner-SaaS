/**
 * Collision Detection Subsystem.
 * Deterministic spatial overlap, boundary containment, and clearance collision checks.
 * All measurements in millimeters.
 */

import type { Room, Floor, Polygon, CollisionResult, Door, Wall, Stair } from '@ai-floor-planner/core';
import { TOLERANCES } from '@ai-floor-planner/core';
import { containsPolygon, polygonIntersectionArea, sutherlandHodgmanClip } from './polygon';
import { computeDoorSwingPolygon } from './doors';
import { computeStairClearanceEnvelope } from './stairs';

/** Detect collision between two arbitrary named polygons. */
export function detectEntityCollision(
  polyA: Polygon,
  idA: string,
  polyB: Polygon,
  idB: string,
): CollisionResult | null {
  const overlapArea = polygonIntersectionArea(polyA, polyB);
  if (overlapArea > TOLERANCES.OVERLAP) {
    const clippedPoints = sutherlandHodgmanClip(polyA.points.slice(), polyB.points.slice());
    return {
      entityA: idA,
      entityB: idB,
      overlapArea,
      overlapRegion: { points: clippedPoints },
    };
  }
  return null;
}

/** Check if a room collides with any other room on the floor. */
export function detectRoomCollisions(
  room: Room,
  otherRooms: Room[],
): CollisionResult[] {
  const results: CollisionResult[] = [];

  for (const other of otherRooms) {
    if (other.id === room.id) continue;

    const collision = detectEntityCollision(room.boundary, room.id, other.boundary, other.id);
    if (collision) {
      results.push(collision);
    }
  }

  return results;
}

/** Check if any rooms on a floor overlap with each other. */
export function detectFloorCollisions(floor: Floor): CollisionResult[] {
  const results: CollisionResult[] = [];
  const rooms = floor.rooms;

  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const roomA = rooms[i]!;
      const roomB = rooms[j]!;

      const collision = detectEntityCollision(roomA.boundary, roomA.id, roomB.boundary, roomB.id);
      if (collision) {
        results.push(collision);
      }
    }
  }

  return results;
}

/** Check if a room extends outside the floor boundary polygon. */
export function detectBoundaryViolation(room: Room, floorBoundary: Polygon): boolean {
  return !containsPolygon(floorBoundary, room.boundary);
}

/** Check door swing collision against obstacles (e.g. other room walls or stairs). */
export function detectDoorSwingCollisions(
  door: Door,
  hostWall: Wall,
  obstacles: { id: string; boundary: Polygon }[],
): CollisionResult[] {
  const results: CollisionResult[] = [];
  const swingPoly = computeDoorSwingPolygon(door, hostWall);

  for (const obs of obstacles) {
    const collision = detectEntityCollision(swingPoly, `door-swing:${door.id}`, obs.boundary, obs.id);
    if (collision) {
      results.push(collision);
    }
  }

  return results;
}

/** Check staircase envelope collision against rooms or non-supporting walls. */
export function detectStairCollisions(
  stair: Stair,
  rooms: Room[],
): CollisionResult[] {
  const results: CollisionResult[] = [];
  const stairEnvelope = computeStairClearanceEnvelope(stair);

  for (const room of rooms) {
    const collision = detectEntityCollision(stairEnvelope, `stair:${stair.id}`, room.boundary, room.id);
    if (collision) {
      results.push(collision);
    }
  }

  return results;
}
