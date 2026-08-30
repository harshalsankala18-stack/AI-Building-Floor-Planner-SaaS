/**
 * SVG Renderer — generates architectural floor plan SVG from Building Model.
 *
 * This is a pure projection: model in → SVG string out.
 * Implements the Renderer interface from core.
 */

import type {
  Building,
  Floor,
  ViewTransform,
  ExportOptions,
  Polygon,
} from '@ai-floor-planner/core';
import { RoomType, WallType, RenderLayer } from '@ai-floor-planner/core';
import { getFloorContentBounds } from '@ai-floor-planner/geometry-engine';
import { worldToScreen, fitToView, scaleToScreen } from './coordinate-transform';
import { resolveConfig } from './render-config';
import type { DeepPartial, RenderConfig } from './render-config';

// ─── Room Colors ────────────────────────────────────────────────────────────

const ROOM_COLORS: Record<string, string> = {
  [RoomType.Bedroom]: '#E3F2FD',
  [RoomType.Bathroom]: '#E8F5E9',
  [RoomType.Kitchen]: '#FFF3E0',
  [RoomType.Living]: '#F3E5F5',
  [RoomType.Dining]: '#FFFDE7',
  [RoomType.Corridor]: '#ECEFF1',
  [RoomType.Staircase]: '#EFEBE9',
  [RoomType.Lift]: '#E1F5FE',
  [RoomType.Balcony]: '#E0F7FA',
  [RoomType.Parking]: '#F5F5F5',
  [RoomType.Pooja]: '#FCE4EC',
  [RoomType.Utility]: '#FAFAFA',
  [RoomType.Foyer]: '#E8EAF6',
  [RoomType.Study]: '#E0F2F1',
  [RoomType.Storage]: '#F5F5F5',
  [RoomType.ServantQuarter]: '#FBE9E7',
  [RoomType.Drawing]: '#EDE7F6',
  [RoomType.FamilyLiving]: '#F3E5F5',
  [RoomType.Terrace]: '#E0F7FA',
  [RoomType.Garden]: '#E8F5E9',
  [RoomType.Custom]: '#F5F5F5',
};

// ─── Wall Styles ────────────────────────────────────────────────────────────

const WALL_STYLES: Record<string, { stroke: string; width: number }> = {
  [WallType.External]: { stroke: '#1a1a1a', width: 4 },
  [WallType.Internal]: { stroke: '#333333', width: 2.5 },
  [WallType.Partition]: { stroke: '#666666', width: 1.5 },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sqMmToSqM(sqMm: number): string {
  return (sqMm / 1_000_000).toFixed(1);
}

function mmToFtDisplay(mm: number): string {
  return (mm / 304.8).toFixed(1);
}

function polygonToSvgPoints(polygon: Polygon, transform: ViewTransform): string {
  return polygon.points
    .map(p => {
      const sp = worldToScreen(p, transform);
      return `${sp.x.toFixed(1)},${sp.y.toFixed(1)}`;
    })
    .join(' ');
}

// ─── Render Functions ───────────────────────────────────────────────────────

function renderGrid(
  viewportWidth: number,
  viewportHeight: number,
  transform: ViewTransform,
  gridSpacing: number = 1000,
): string {
  const lines: string[] = [];
  const scaledSpacing = gridSpacing * transform.scale;

  if (scaledSpacing < 5) return ''; // Don't render grid if too dense

  // Vertical lines
  const startX = transform.offsetX % scaledSpacing;
  for (let x = startX; x < viewportWidth; x += scaledSpacing) {
    lines.push(`<line x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${viewportHeight}" stroke="#f0f0f0" stroke-width="0.5"/>`);
  }

  // Horizontal lines
  const startY = transform.offsetY % scaledSpacing;
  for (let y = startY; y < viewportHeight; y += scaledSpacing) {
    lines.push(`<line x1="0" y1="${y.toFixed(1)}" x2="${viewportWidth}" y2="${y.toFixed(1)}" stroke="#f0f0f0" stroke-width="0.5"/>`);
  }

  return `<g class="layer-grid" data-layer="${RenderLayer.Grid}">\n${lines.join('\n')}\n</g>`;
}

function renderPlotBoundary(building: Building, transform: ViewTransform): string {
  const site = building.site;
  const points = polygonToSvgPoints(site.plotBoundary, transform);

  // Setback area
  const setbackPoly: Polygon = {
    points: [
      { x: site.setbacks.left, y: site.setbacks.front },
      { x: site.plotWidth - site.setbacks.right, y: site.setbacks.front },
      { x: site.plotWidth - site.setbacks.right, y: site.plotDepth - site.setbacks.rear },
      { x: site.setbacks.left, y: site.plotDepth - site.setbacks.rear },
    ],
  };
  const setbackPoints = polygonToSvgPoints(setbackPoly, transform);

  return `<g class="layer-plot" data-layer="${RenderLayer.Plot}">
  <polygon points="${points}" fill="none" stroke="#999" stroke-width="1" stroke-dasharray="8,4"/>
  <polygon points="${setbackPoints}" fill="none" stroke="#cc6600" stroke-width="0.5" stroke-dasharray="4,4"/>
</g>`;
}

function renderFloorBoundary(floor: Floor, transform: ViewTransform): string {
  if (floor.boundary.points.length < 3) return '';
  const points = polygonToSvgPoints(floor.boundary, transform);

  return `<g class="layer-floor" data-layer="${RenderLayer.Floor}">
  <polygon points="${points}" fill="#ffffff" stroke="#333" stroke-width="0.5"/>
</g>`;
}

function renderRooms(
  floor: Floor,
  transform: ViewTransform,
  showLabels: boolean = true,
  showAreas: boolean = true,
): string {
  const elements: string[] = [];

  for (const room of floor.rooms) {
    const color = ROOM_COLORS[room.type] ?? '#F5F5F5';
    const points = polygonToSvgPoints(room.boundary, transform);

    // Room fill
    elements.push(
      `<polygon points="${points}" fill="${color}" fill-opacity="0.6" stroke="none" data-entity-type="room" data-entity-id="${room.id}"/>`,
    );

    // Room label
    const cx = worldToScreen(
      { x: room.x + room.width / 2, y: room.y + room.height / 2 },
      transform,
    );
    const fontSize = Math.max(8, Math.min(14, scaleToScreen(400, transform)));
    const areaFontSize = Math.max(7, fontSize - 2);

    if (showLabels) {
      elements.push(
        `<text x="${cx.x.toFixed(1)}" y="${(cx.y - fontSize * 0.3).toFixed(1)}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${fontSize.toFixed(1)}" fill="#333" font-weight="600">${escapeXml(room.name)}</text>`,
      );
    }
    if (showAreas) {
      elements.push(
        `<text x="${cx.x.toFixed(1)}" y="${(cx.y + fontSize * 0.8).toFixed(1)}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${areaFontSize.toFixed(1)}" fill="#666">${sqMmToSqM(room.area)} sq m</text>`,
      );
    }
  }

  return `<g class="layer-rooms" data-layer="${RenderLayer.Rooms}">\n${elements.join('\n')}\n</g>`;
}

function renderWalls(floor: Floor, transform: ViewTransform): string {
  const elements: string[] = [];

  for (const wall of floor.walls) {
    const start = worldToScreen(wall.startPoint, transform);
    const end = worldToScreen(wall.endPoint, transform);
    const style = WALL_STYLES[wall.type] ?? WALL_STYLES[WallType.Internal]!;

    elements.push(
      `<line x1="${start.x.toFixed(1)}" y1="${start.y.toFixed(1)}" x2="${end.x.toFixed(1)}" y2="${end.y.toFixed(1)}" stroke="${style.stroke}" stroke-width="${style.width}" stroke-linecap="square" data-entity-type="wall" data-entity-id="${wall.id}"/>`,
    );
  }

  return `<g class="layer-walls" data-layer="${RenderLayer.Walls}">\n${elements.join('\n')}\n</g>`;
}

function renderDoors(floor: Floor, transform: ViewTransform): string {
  const elements: string[] = [];

  for (const door of floor.doors) {
    const pos = worldToScreen(door.position, transform);
    const scaledWidth = scaleToScreen(door.width, transform);
    const r = scaledWidth;

    // Door symbol: gap + swing arc + hinge line
    elements.push(`<g data-entity-type="door" data-entity-id="${door.id}">
  <path d="M ${(pos.x - scaledWidth / 2).toFixed(1)} ${pos.y.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(pos.x + scaledWidth / 2).toFixed(1)} ${pos.y.toFixed(1)}" fill="none" stroke="#0066cc" stroke-width="0.8"/>
  <line x1="${(pos.x - scaledWidth / 2).toFixed(1)}" y1="${pos.y.toFixed(1)}" x2="${(pos.x + scaledWidth / 2).toFixed(1)}" y2="${pos.y.toFixed(1)}" stroke="#0066cc" stroke-width="0.8"/>
</g>`);
  }

  return `<g class="layer-openings" data-layer="${RenderLayer.Openings}">\n${elements.join('\n')}\n</g>`;
}

function renderWindows(floor: Floor, transform: ViewTransform): string {
  const elements: string[] = [];

  for (const win of floor.windows) {
    const pos = worldToScreen(win.position, transform);
    const scaledWidth = scaleToScreen(win.width, transform);
    const halfW = scaledWidth / 2;
    const gap = 2;

    // Window symbol: 3 parallel lines
    elements.push(`<g data-entity-type="window" data-entity-id="${win.id}">
  <line x1="${(pos.x - halfW).toFixed(1)}" y1="${(pos.y - gap).toFixed(1)}" x2="${(pos.x + halfW).toFixed(1)}" y2="${(pos.y - gap).toFixed(1)}" stroke="#4488cc" stroke-width="1"/>
  <line x1="${(pos.x - halfW).toFixed(1)}" y1="${pos.y.toFixed(1)}" x2="${(pos.x + halfW).toFixed(1)}" y2="${pos.y.toFixed(1)}" stroke="#4488cc" stroke-width="1.5"/>
  <line x1="${(pos.x - halfW).toFixed(1)}" y1="${(pos.y + gap).toFixed(1)}" x2="${(pos.x + halfW).toFixed(1)}" y2="${(pos.y + gap).toFixed(1)}" stroke="#4488cc" stroke-width="1"/>
</g>`);
  }

  return elements.length > 0
    ? `<g class="layer-windows" data-layer="${RenderLayer.Openings}">\n${elements.join('\n')}\n</g>`
    : '';
}

function renderStairs(floor: Floor, transform: ViewTransform): string {
  const elements: string[] = [];

  for (const stair of floor.stairs) {
    const topLeft = worldToScreen({ x: stair.x, y: stair.y }, transform);
    const w = scaleToScreen(stair.width, transform);
    const h = scaleToScreen(stair.length, transform);

    // Staircase box
    elements.push(`<g data-entity-type="stair" data-entity-id="${stair.id}">`);
    elements.push(`  <rect x="${topLeft.x.toFixed(1)}" y="${topLeft.y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="#EFEBE9" fill-opacity="0.6" stroke="#666" stroke-width="1"/>`);

    // Tread lines
    const treadCount = Math.min(stair.riserCount, 20);
    const treadH = h / treadCount;
    for (let i = 1; i < treadCount; i++) {
      const y = topLeft.y + i * treadH;
      elements.push(`  <line x1="${topLeft.x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(topLeft.x + w).toFixed(1)}" y2="${y.toFixed(1)}" stroke="#999" stroke-width="0.5"/>`);
    }

    // Direction arrow
    const arrowX = topLeft.x + w / 2;
    const arrowY1 = topLeft.y + h * 0.8;
    const arrowY2 = topLeft.y + h * 0.2;
    elements.push(`  <line x1="${arrowX.toFixed(1)}" y1="${arrowY1.toFixed(1)}" x2="${arrowX.toFixed(1)}" y2="${arrowY2.toFixed(1)}" stroke="#666" stroke-width="1.5" marker-end="url(#arrow)"/>`);
    elements.push(`</g>`);
  }

  return `<g class="layer-stairs" data-layer="${RenderLayer.Stairs}">\n${elements.join('\n')}\n</g>`;
}

function renderDimensions(floor: Floor, building: Building, transform: ViewTransform): string {
  const elements: string[] = [];
  const dimOffset = 25; // px offset from the edge
  const site = building.site;

  // Plot width dimension (top)
  const topLeft = worldToScreen({ x: 0, y: 0 }, transform);
  const topRight = worldToScreen({ x: site.plotWidth, y: 0 }, transform);

  elements.push(renderDimensionLine(
    topLeft.x, topLeft.y - dimOffset,
    topRight.x, topRight.y - dimOffset,
    `${mmToFtDisplay(site.plotWidth)}' (${(site.plotWidth / 1000).toFixed(1)}m)`,
    'horizontal',
  ));

  // Plot depth dimension (left)
  const bottomLeft = worldToScreen({ x: 0, y: site.plotDepth }, transform);
  elements.push(renderDimensionLine(
    topLeft.x - dimOffset, topLeft.y,
    bottomLeft.x - dimOffset, bottomLeft.y,
    `${mmToFtDisplay(site.plotDepth)}' (${(site.plotDepth / 1000).toFixed(1)}m)`,
    'vertical',
  ));

  // Room dimensions
  for (const room of floor.rooms) {
    const roomTopLeft = worldToScreen({ x: room.x, y: room.y + room.height }, transform);
    const roomTopRight = worldToScreen({ x: room.x + room.width, y: room.y + room.height }, transform);

    const fontSize = Math.max(6, Math.min(9, scaleToScreen(250, transform)));
    const midX = (roomTopLeft.x + roomTopRight.x) / 2;
    const dimY = roomTopLeft.y + 12;

    elements.push(
      `<text x="${midX.toFixed(1)}" y="${dimY.toFixed(1)}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${fontSize.toFixed(1)}" fill="#0066cc">${mmToFtDisplay(room.width)}' × ${mmToFtDisplay(room.height)}'</text>`,
    );
  }

  return `<g class="layer-annotations" data-layer="${RenderLayer.Annotations}">\n${elements.join('\n')}\n</g>`;
}

function renderDimensionLine(
  x1: number, y1: number,
  x2: number, y2: number,
  label: string,
  orientation: 'horizontal' | 'vertical',
): string {
  const tickLen = 6;
  const lines: string[] = [];

  // Main line
  lines.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#0066cc" stroke-width="0.5"/>`);

  if (orientation === 'horizontal') {
    // Tick marks
    lines.push(`<line x1="${x1.toFixed(1)}" y1="${(y1 - tickLen / 2).toFixed(1)}" x2="${x1.toFixed(1)}" y2="${(y1 + tickLen / 2).toFixed(1)}" stroke="#0066cc" stroke-width="0.5"/>`);
    lines.push(`<line x1="${x2.toFixed(1)}" y1="${(y2 - tickLen / 2).toFixed(1)}" x2="${x2.toFixed(1)}" y2="${(y2 + tickLen / 2).toFixed(1)}" stroke="#0066cc" stroke-width="0.5"/>`);
    // Label
    const mx = (x1 + x2) / 2;
    lines.push(`<text x="${mx.toFixed(1)}" y="${(y1 - 4).toFixed(1)}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" fill="#0066cc">${escapeXml(label)}</text>`);
  } else {
    lines.push(`<line x1="${(x1 - tickLen / 2).toFixed(1)}" y1="${y1.toFixed(1)}" x2="${(x1 + tickLen / 2).toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#0066cc" stroke-width="0.5"/>`);
    lines.push(`<line x1="${(x2 - tickLen / 2).toFixed(1)}" y1="${y2.toFixed(1)}" x2="${(x2 + tickLen / 2).toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#0066cc" stroke-width="0.5"/>`);
    const my = (y1 + y2) / 2;
    lines.push(`<text x="${(x1 - 8).toFixed(1)}" y="${my.toFixed(1)}" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="9" fill="#0066cc" transform="rotate(-90 ${(x1 - 8).toFixed(1)} ${my.toFixed(1)})">${escapeXml(label)}</text>`);
  }

  return lines.join('\n');
}

function renderNorthArrow(building: Building, _transform: ViewTransform, viewportWidth: number): string {
  const x = viewportWidth - 50;
  const y = 50;
  const orientation = building.site.orientation;

  return `<g class="north-arrow" transform="translate(${x},${y}) rotate(${orientation})">
  <polygon points="0,-20 -8,8 0,2 8,8" fill="#333" stroke="#333" stroke-width="1"/>
  <text x="0" y="-24" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="12" fill="#333" font-weight="bold">N</text>
</g>`;
}

function renderScaleBar(viewportHeight: number, scaleLabel: string): string {
  const y = viewportHeight - 54;
  return `<g class="scale-bar" aria-label="Drawing scale ${escapeXml(scaleLabel)}">
  <line x1="32" y1="${y}" x2="132" y2="${y}" stroke="#222" stroke-width="2"/>
  <line x1="32" y1="${y - 4}" x2="32" y2="${y + 4}" stroke="#222"/>
  <line x1="82" y1="${y - 4}" x2="82" y2="${y + 4}" stroke="#222"/>
  <line x1="132" y1="${y - 4}" x2="132" y2="${y + 4}" stroke="#222"/>
  <text x="32" y="${y + 15}" font-family="Inter, Arial, sans-serif" font-size="9" fill="#333">0</text>
  <text x="82" y="${y + 15}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" fill="#333">${escapeXml(scaleLabel)}</text>
</g>`;
}

function renderTitleBlock(
  building: Building,
  floor: Floor,
  viewportWidth: number,
  viewportHeight: number,
  options?: ExportOptions,
): string {
  const width = Math.min(360, viewportWidth * 0.42);
  const height = 84;
  const x = viewportWidth - width - 18;
  const y = viewportHeight - height - 18;
  return `<g class="title-block">
  <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#fff" stroke="#222" stroke-width="1"/>
  <line x1="${x}" y1="${y + 50}" x2="${x + width}" y2="${y + 50}" stroke="#555" stroke-width="0.6"/>
  <line x1="${x + width * 0.62}" y1="${y + 50}" x2="${x + width * 0.62}" y2="${y + height}" stroke="#555" stroke-width="0.6"/>
  <text x="${x + 10}" y="${y + 17}" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="700" fill="#111">${escapeXml(building.name)}</text>
  <text x="${x + 10}" y="${y + 31}" font-family="Inter, Arial, sans-serif" font-size="9" fill="#555">${escapeXml(floor.name)} • Architectural floor plan</text>
  <text x="${x + 10}" y="${y + 44}" font-family="Inter, Arial, sans-serif" font-size="8" font-weight="700" fill="#b42318">CONCEPT / SCHEMATIC DESIGN • NOT FOR CONSTRUCTION</text>
  <text x="${x + 10}" y="${y + 65}" font-family="Inter, Arial, sans-serif" font-size="8" fill="#555">DRAWN BY</text>
  <text x="${x + 10}" y="${y + 78}" font-family="Inter, Arial, sans-serif" font-size="9" fill="#111">${escapeXml(options?.drawnBy ?? 'FORMA AI Planner')}</text>
  <text x="${x + width * 0.65}" y="${y + 65}" font-family="Inter, Arial, sans-serif" font-size="8" fill="#555">SCALE / REV</text>
  <text x="${x + width * 0.65}" y="${y + 78}" font-family="Inter, Arial, sans-serif" font-size="9" fill="#111">${escapeXml(options?.scale ?? 'NTS')} / ${escapeXml(options?.revision ?? '01')}</text>
</g>`;
}

// ─── Main Renderer ──────────────────────────────────────────────────────────

const DEFAULT_VIEWPORT_WIDTH = 1000;
const DEFAULT_VIEWPORT_HEIGHT = 800;

/**
 * Render a single floor as SVG.
 */
export function renderFloor(
  floor: Floor,
  building: Building,
  transform: ViewTransform,
  viewportWidth: number = DEFAULT_VIEWPORT_WIDTH,
  viewportHeight: number = DEFAULT_VIEWPORT_HEIGHT,
  config?: Readonly<RenderConfig> | DeepPartial<RenderConfig>,
  exportOptions?: ExportOptions,
): string {
  const resolved = resolveConfig(config);
  const layers = [
    resolved.layers[RenderLayer.Grid] && resolved.showGrid
      ? renderGrid(viewportWidth, viewportHeight, transform, resolved.gridSpacing) : '',
    resolved.layers[RenderLayer.Plot] ? renderPlotBoundary(building, transform) : '',
    resolved.layers[RenderLayer.Floor] ? renderFloorBoundary(floor, transform) : '',
    resolved.layers[RenderLayer.Rooms]
      ? renderRooms(floor, transform, resolved.showRoomLabels, resolved.showRoomAreas) : '',
    resolved.layers[RenderLayer.Walls] ? renderWalls(floor, transform) : '',
    resolved.layers[RenderLayer.Openings] ? renderDoors(floor, transform) : '',
    resolved.layers[RenderLayer.Openings] ? renderWindows(floor, transform) : '',
    resolved.layers[RenderLayer.Stairs] ? renderStairs(floor, transform) : '',
    resolved.layers[RenderLayer.Annotations] && resolved.showDimensions
      ? renderDimensions(floor, building, transform) : '',
    resolved.showNorthArrow ? renderNorthArrow(building, transform, viewportWidth) : '',
    resolved.showScaleBar ? renderScaleBar(viewportHeight, exportOptions?.scale ?? 'NTS') : '',
    resolved.showTitleBlock
      ? renderTitleBlock(building, floor, viewportWidth, viewportHeight, exportOptions) : '',
  ].filter(Boolean);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewportWidth} ${viewportHeight}" class="floor-plan" width="${viewportWidth}" height="${viewportHeight}">
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="7" refX="5" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#666"/>
    </marker>
  </defs>
  ${layers.join('\n  ')}
</svg>`;
}

/**
 * Render a building (specific floor level) as SVG.
 */
export function renderBuilding(
  building: Building,
  floorLevel: number = 0,
  viewportWidth: number = DEFAULT_VIEWPORT_WIDTH,
  viewportHeight: number = DEFAULT_VIEWPORT_HEIGHT,
  config?: Readonly<RenderConfig> | DeepPartial<RenderConfig>,
): string {
  const floor = building.floors.find(f => f.level === floorLevel);
  if (!floor) return '<svg xmlns="http://www.w3.org/2000/svg"></svg>';

  const bounds = getFloorContentBounds(floor);
  const transform = fitToView(bounds, viewportWidth, viewportHeight);

  return renderFloor(floor, building, transform, viewportWidth, viewportHeight, config);
}

/**
 * Export a building as clean SVG (no interactive elements).
 */
export function exportSVG(
  building: Building,
  options: ExportOptions,
): string {
  const floor = building.floors.find(candidate => candidate.id === options.floorId)
    ?? building.floors[0];
  if (!floor) return '<svg xmlns="http://www.w3.org/2000/svg"></svg>';

  const paperSizes: Record<string, { width: number; height: number }> = {
    A4: { width: 842, height: 595 },
    A3: { width: 1191, height: 842 },
    A2: { width: 1684, height: 1191 },
    A1: { width: 2384, height: 1684 },
    A0: { width: 3370, height: 2384 },
    letter: { width: 792, height: 612 },
    tabloid: { width: 1224, height: 792 },
  };

  const paper = paperSizes[options.paperSize] ?? paperSizes['A4']!;
  const w = options.orientation === 'landscape' ? paper.width : paper.height;
  const h = options.orientation === 'landscape' ? paper.height : paper.width;

  const bounds = getFloorContentBounds(floor);
  const transform = fitToView(bounds, w, h, options.includeTitleBlock ? 90 : 50);
  return renderFloor(
    floor,
    building,
    transform,
    w,
    h,
    {
      showGrid: options.includeGrid,
      showDimensions: options.includeDimensions,
      showRoomLabels: options.includeRoomLabels,
      showRoomAreas: options.includeRoomAreas ?? true,
      showNorthArrow: options.includeNorthArrow,
      showScaleBar: options.includeScaleBar,
      showTitleBlock: options.includeTitleBlock,
      layers: {
        [RenderLayer.Grid]: options.includeGrid,
        [RenderLayer.Annotations]: options.includeDimensions,
        [RenderLayer.Openings]: options.includeOpenings ?? true,
      },
    },
    options,
  );
}
