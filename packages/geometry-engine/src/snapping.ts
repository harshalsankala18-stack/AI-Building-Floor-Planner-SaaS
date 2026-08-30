/**
 * Snapping and alignment operations.
 */

import type { Point, Room, Wall, AlignmentGuide } from '@ai-floor-planner/core';

/** Snap a point to the nearest grid intersection. */
export function snapToGrid(point: Point, gridSize: number): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

/** Snap to the nearest wall endpoint within threshold. */
export function snapToWallEndpoint(
  point: Point,
  walls: Wall[],
  threshold: number,
): Point | null {
  let closest: Point | null = null;
  let minDist = threshold;

  for (const wall of walls) {
    for (const wp of [wall.startPoint, wall.endPoint]) {
      const dist = Math.sqrt(
        (point.x - wp.x) ** 2 + (point.y - wp.y) ** 2,
      );
      if (dist < minDist) {
        minDist = dist;
        closest = wp;
      }
    }
  }

  return closest;
}

/** Align a room to the nearest room edge within threshold. Returns the best offset. */
export function alignToNearest(
  room: Room,
  otherRooms: Room[],
  threshold: number,
): Point {
  let bestDx = 0;
  let bestDy = 0;
  let bestDistX = threshold;
  let bestDistY = threshold;

  const roomLeft = room.x;
  const roomRight = room.x + room.width;
  const roomTop = room.y;
  const roomBottom = room.y + room.height;

  for (const other of otherRooms) {
    if (other.id === room.id) continue;

    const otherLeft = other.x;
    const otherRight = other.x + other.width;
    const otherTop = other.y;
    const otherBottom = other.y + other.height;

    // X alignment candidates
    const xCandidates = [
      { diff: otherLeft - roomLeft, dist: Math.abs(otherLeft - roomLeft) },
      { diff: otherRight - roomRight, dist: Math.abs(otherRight - roomRight) },
      { diff: otherLeft - roomRight, dist: Math.abs(otherLeft - roomRight) },
      { diff: otherRight - roomLeft, dist: Math.abs(otherRight - roomLeft) },
    ];

    for (const c of xCandidates) {
      if (c.dist < bestDistX) {
        bestDistX = c.dist;
        bestDx = c.diff;
      }
    }

    // Y alignment candidates
    const yCandidates = [
      { diff: otherTop - roomTop, dist: Math.abs(otherTop - roomTop) },
      { diff: otherBottom - roomBottom, dist: Math.abs(otherBottom - roomBottom) },
      { diff: otherTop - roomBottom, dist: Math.abs(otherTop - roomBottom) },
      { diff: otherBottom - roomTop, dist: Math.abs(otherBottom - roomTop) },
    ];

    for (const c of yCandidates) {
      if (c.dist < bestDistY) {
        bestDistY = c.dist;
        bestDy = c.diff;
      }
    }
  }

  return { x: room.x + bestDx, y: room.y + bestDy };
}

/** Find alignment guides for a room being moved. */
export function findAlignmentGuides(
  room: Room,
  otherRooms: Room[],
  threshold: number = 50,
): AlignmentGuide[] {
  const guides: AlignmentGuide[] = [];
  const roomEdges = {
    left: room.x,
    right: room.x + room.width,
    top: room.y,
    bottom: room.y + room.height,
    centerX: room.x + room.width / 2,
    centerY: room.y + room.height / 2,
  };

  for (const other of otherRooms) {
    if (other.id === room.id) continue;

    const otherEdges = {
      left: other.x,
      right: other.x + other.width,
      top: other.y,
      bottom: other.y + other.height,
      centerX: other.x + other.width / 2,
      centerY: other.y + other.height / 2,
    };

    // Vertical guides (X alignment)
    for (const rx of [roomEdges.left, roomEdges.right, roomEdges.centerX]) {
      for (const ox of [otherEdges.left, otherEdges.right, otherEdges.centerX]) {
        if (Math.abs(rx - ox) < threshold) {
          guides.push({
            type: 'vertical',
            position: ox,
            sourceId: other.id,
          });
        }
      }
    }

    // Horizontal guides (Y alignment)
    for (const ry of [roomEdges.top, roomEdges.bottom, roomEdges.centerY]) {
      for (const oy of [otherEdges.top, otherEdges.bottom, otherEdges.centerY]) {
        if (Math.abs(ry - oy) < threshold) {
          guides.push({
            type: 'horizontal',
            position: oy,
            sourceId: other.id,
          });
        }
      }
    }
  }

  return guides;
}
