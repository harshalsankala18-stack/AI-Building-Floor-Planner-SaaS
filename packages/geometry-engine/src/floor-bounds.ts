import type { BoundingBox, Floor, Point } from '@ai-floor-planner/core';

function addRect(points: Point[], x: number, y: number, width: number, height: number): void {
  if (![x, y, width, height].every(Number.isFinite)) return;
  points.push({ x, y }, { x: x + width, y: y + height });
}

/**
 * Bounds of one floor only. This is the camera/export authority for a
 * floor-specific view and never inspects geometry from another floor.
 */
export function getFloorContentBounds(floor: Floor): BoundingBox {
  const points: Point[] = [...floor.boundary.points];

  for (const room of floor.rooms) points.push(...room.boundary.points);
  for (const wall of floor.walls) points.push(wall.startPoint, wall.endPoint);
  for (const door of floor.doors) {
    addRect(points, door.position.x - door.width / 2, door.position.y - door.width / 2, door.width, door.width);
  }
  for (const window of floor.windows) {
    addRect(points, window.position.x - window.width / 2, window.position.y, window.width, 1);
  }
  for (const stair of floor.stairs) points.push(...stair.boundary.points);
  for (const column of floor.columns) {
    addRect(
      points,
      column.position.x - column.width / 2,
      column.position.y - column.depth / 2,
      column.width,
      column.depth,
    );
  }

  const finite = points.filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (finite.length === 0) return { x: 0, y: 0, width: 1, height: 1 };

  const minX = Math.min(...finite.map(point => point.x));
  const minY = Math.min(...finite.map(point => point.y));
  const maxX = Math.max(...finite.map(point => point.x));
  const maxY = Math.max(...finite.map(point => point.y));
  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}
