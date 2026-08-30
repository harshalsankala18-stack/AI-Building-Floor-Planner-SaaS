import { describe, expect, it } from 'vitest';
import { RoomType, addRoom, createBuilding } from '@ai-floor-planner/core';
import { getFloorContentBounds } from '@ai-floor-planner/geometry-engine';
import { exportSVG, fitToView, renderBuilding, worldToScreen } from '../index';

function makeBuilding() {
  let building = createBuilding({
    projectId: 'renderer-multi',
    name: 'Renderer Multi-floor',
    site: { plotWidth: 80000, plotDepth: 50000 },
    floors: [
      {
        buildingId: '', level: 0, name: 'Ground Floor',
        boundary: { points: [{ x: 1000, y: 1000 }, { x: 13000, y: 1000 }, { x: 13000, y: 17000 }, { x: 1000, y: 17000 }] },
      },
      {
        buildingId: '', level: 1, name: 'First Floor',
        boundary: { points: [{ x: 50000, y: 22000 }, { x: 62000, y: 22000 }, { x: 62000, y: 31000 }, { x: 50000, y: 31000 }] },
      },
    ],
  });
  building = addRoom(building, building.floors[0]!.id, {
    floorId: building.floors[0]!.id, type: RoomType.Living, name: 'Ground Only Room',
    x: 1000, y: 1000, width: 6000, height: 5000,
  });
  building = addRoom(building, building.floors[1]!.id, {
    floorId: building.floors[1]!.id, type: RoomType.Bedroom, name: 'Upper Only Room',
    x: 50000, y: 22000, width: 5000, height: 4500,
  });
  return building;
}

describe('multi-floor rendering and bounds', () => {
  it('renders each floor independently without leaking other-floor rooms', () => {
    const building = makeBuilding();
    const groundSvg = renderBuilding(building, 0, 900, 600);
    const upperSvg = renderBuilding(building, 1, 900, 600);
    expect(groundSvg).toContain('Ground Only Room');
    expect(groundSvg).not.toContain('Upper Only Room');
    expect(upperSvg).toContain('Upper Only Room');
    expect(upperSvg).not.toContain('Ground Only Room');
  });

  it('fits distant floor-local bounds completely inside the viewport', () => {
    const floor = makeBuilding().floors[1]!;
    const bounds = getFloorContentBounds(floor);
    expect(bounds.x).toBe(50000);
    expect(bounds.y).toBe(22000);
    const transform = fitToView(bounds, 900, 600, 50);
    const topLeft = worldToScreen({ x: bounds.x, y: bounds.y }, transform);
    const bottomRight = worldToScreen({ x: bounds.x + bounds.width, y: bounds.y + bounds.height }, transform);
    expect(topLeft.x).toBeGreaterThanOrEqual(49);
    expect(topLeft.y).toBeGreaterThanOrEqual(49);
    expect(bottomRight.x).toBeLessThanOrEqual(851);
    expect(bottomRight.y).toBeLessThanOrEqual(551);
  });

  it('exports the selected floor rather than silently exporting Ground Floor', () => {
    const building = makeBuilding();
    const svg = exportSVG(building, {
      floorId: building.floors[1]!.id,
      paperSize: 'A3',
      orientation: 'landscape',
      scale: '1:100',
      includeGrid: false,
      includeDimensions: true,
      includeRoomLabels: true,
      includeNorthArrow: true,
      includeScaleBar: true,
      includeTitleBlock: true,
    });
    expect(svg).toContain('Upper Only Room');
    expect(svg).not.toContain('Ground Only Room');
  });
});
