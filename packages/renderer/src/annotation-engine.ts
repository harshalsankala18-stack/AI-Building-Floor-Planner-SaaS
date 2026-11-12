/**
 * Professional Intelligent Annotation Engine — Phase 2.4.
 *
 * Implements architectural-standard annotation placement:
 * - Dynamic priority hierarchy: Room Name > Dimensions > Room Area > Vastu / Metadata
 * - Standard abbreviations for compact spaces (BATH, OTS, UTIL, MBR, BALC, POOJA, etc.)
 * - Automatic leader line callouts for narrow or tight spaces (< 45px)
 * - Bounding box collision sweep preventing text collisions
 * - Exterior building dimension strings with metric and imperial units
 * - Structural grid lines (A, B, C... / 1, 2, 3...) and column bubble annotations
 */

import {
  type Building,
  type Floor,
  type Point,
  RoomType,
  type ViewTransform,
} from '@ai-floor-planner/core';
import { worldToScreen, scaleToScreen } from './coordinate-transform';

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface RoomLabelPlacement {
  roomId: string;
  roomName: string;
  displayName: string;
  abbreviation: string;
  dimensionsText: string;
  areaText: string;
  vastuText?: string;
  anchor: Point;
  box: BoundingBox;
  fontSize: number;
  isCompact: boolean;
  useLeaderLine: boolean;
  leaderPath?: {
    start: Point;
    elbow: Point;
    end: Point;
  };
  visibleLines: {
    name: boolean;
    dimensions: boolean;
    area: boolean;
    vastu: boolean;
  };
}

export const ROOM_ABBREVIATIONS: Record<string, string> = {
  'master bedroom': 'MBR',
  'bedroom': 'BED',
  'guest bedroom': 'GUEST',
  'kids bedroom': 'KIDS',
  'living room': 'LIV',
  'living': 'LIV',
  'formal living': 'LIV',
  'dining room': 'DIN',
  'dining': 'DIN',
  'dining hall': 'DIN',
  'kitchen': 'KIT',
  'modular kitchen': 'KIT',
  'wet kitchen': 'WET KIT',
  'bathroom': 'BATH',
  'attached bathroom': 'BATH',
  'common bathroom': 'BATH',
  'toilet': 'TOILET',
  'powder room': 'POWDER',
  'open to sky': 'OTS',
  'ots shaft': 'OTS',
  'service shaft': 'SHAFT',
  'utility': 'UTIL',
  'utility & wet kitchen': 'UTIL',
  'pooja': 'POOJA',
  'pooja room': 'POOJA',
  'puja': 'POOJA',
  'front verandah': 'PORCH',
  'verandah': 'PORCH',
  'porch': 'PORCH',
  'balcony': 'BALC',
  'terrace': 'TERR',
  'corridor': 'CORR',
  'passage': 'PASS',
  'foyer': 'FOYER',
  'staircase': 'STAIR',
  'stairs': 'STAIR',
  'domestic staff': 'STAFF',
  'servant room': 'STAFF',
  'car parking': 'PARK',
  'parking': 'PARK',
};

export function getAbbreviation(name: string, type?: RoomType): string {
  const lower = name.trim().toLowerCase();
  if (ROOM_ABBREVIATIONS[lower]) return ROOM_ABBREVIATIONS[lower]!;
  for (const [key, abbr] of Object.entries(ROOM_ABBREVIATIONS)) {
    if (lower.includes(key)) return abbr;
  }
  if (type) {
    switch (type) {
      case RoomType.Bedroom: return lower.includes('master') ? 'MBR' : 'BED';
      case RoomType.Living: return 'LIV';
      case RoomType.Dining: return 'DIN';
      case RoomType.Kitchen: return 'KIT';
      case RoomType.Bathroom: return 'BATH';
      case RoomType.ServiceShaft:
      case RoomType.OTS: return 'OTS';
      case RoomType.Utility: return 'UTIL';
      case RoomType.Pooja: return 'POOJA';
      case RoomType.Balcony:
      case RoomType.Terrace: return 'BALC';
      case RoomType.Porch: return 'PORCH';
      case RoomType.Corridor: return 'CORR';
      case RoomType.Staircase: return 'STAIR';
      case RoomType.Parking: return 'PARK';
    }
  }
  return name.length > 8 ? name.slice(0, 6).toUpperCase() + '.' : name.toUpperCase();
}

function boxesOverlap(b1: BoundingBox, b2: BoundingBox, padding: number = 4): boolean {
  return !(
    b1.maxX + padding < b2.minX ||
    b1.minX - padding > b2.maxX ||
    b1.maxY + padding < b2.minY ||
    b1.minY - padding > b2.maxY
  );
}

function formatFeetInches(mm: number): string {
  const inchesTotal = mm / 25.4;
  const feet = Math.floor(inchesTotal / 12);
  const inches = Math.round(inchesTotal % 12);
  return `${feet}'-${inches}"`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export class AnnotationEngine {
  /**
   * Compute intelligent non-overlapping placements for all room labels in a floor.
   */
  public static computeRoomLabels(
    floor: Floor,
    transform: ViewTransform,
    building?: Building,
    options: { showLabels?: boolean; showAreas?: boolean } = {},
  ): RoomLabelPlacement[] {
    const showLabels = options.showLabels !== false;
    const showAreas = options.showAreas !== false;

    const vastuReport =
      (building?.metadata as any)?.vastuReport ??
      (building?.metadata as any)?.apartmentSchematic?.vastuReport;
    const vastuCompliance = Array.isArray(vastuReport?.roomCompliance)
      ? vastuReport.roomCompliance
      : [];

    const placements: RoomLabelPlacement[] = [];
    const placedBoxes: BoundingBox[] = [];

    // Sort rooms: larger rooms first to anchor main spaces, small rooms adapt around them
    const sortedRooms = [...floor.rooms].sort((a, b) => b.area - a.area);

    for (const room of sortedRooms) {
      const isOTS =
        room.type === RoomType.ServiceShaft ||
        room.type === RoomType.OTS ||
        /ots|shaft/i.test(room.name);

      const screenWidth = scaleToScreen(room.width, transform);
      const screenHeight = scaleToScreen(room.height, transform);
      const minDimensionPx = Math.min(screenWidth, screenHeight);

      const abbr = getAbbreviation(room.name, room.type);
      const baseName = isOTS ? 'OTS' : room.name;

      // Formatting text
      const dimFtIn = `${formatFeetInches(room.width)} × ${formatFeetInches(room.height)}`;
      const sqFt = Math.round((room.area / 1_000_000) * 10.7639);
      const sqMText = `${(room.area / 1_000_000).toFixed(1)} sq m`;
      const areaText = `${sqFt} sq.ft (${sqMText})`;

      const audit = vastuCompliance.find(
        (c: any) =>
          (c.roomName && c.roomName.toLowerCase() === room.name.toLowerCase()) ||
          (c.roomType && c.roomType.toLowerCase() === room.type.toLowerCase()),
      );
      const vastuText = audit?.zone
        ? `${audit.zone} • ${(audit.status ?? 'IDEAL').toUpperCase()}`
        : (room as any).metadata?.vastuZone
        ? `${(room as any).metadata.vastuZone}`
        : undefined;

      const fontSize = Math.max(8, Math.min(13, scaleToScreen(350, transform)));
      const centerWorld = { x: room.x + room.width / 2, y: room.y + room.height / 2 };
      const centerScreen = worldToScreen(centerWorld, transform);
      let labelAnchor = centerScreen;

      // Condition for compact spaces or leader lines:
      const needsLeader = minDimensionPx < 45 || screenWidth < 50 || screenHeight < 35;
      const isCompact = minDimensionPx < 85;

      let displayName = isCompact ? abbr : baseName;
      const visibleLines = {
        name: showLabels,
        dimensions: showLabels && !needsLeader,
        area: showAreas && !isCompact && !needsLeader,
        vastu: Boolean(vastuText) && !isCompact && !needsLeader && screenWidth > 120,
      };

      if (needsLeader) {
        // Place leader line pointing out from room center to adjacent open area
        const offsetDirX = centerScreen.x < 400 ? -35 : 35;
        const offsetDirY = centerScreen.y < 300 ? -25 : 25;
        const elbow = { x: centerScreen.x + offsetDirX, y: centerScreen.y + offsetDirY };
        const end = { x: elbow.x + (offsetDirX > 0 ? 25 : -25), y: elbow.y };

        const textLen = abbr.length * fontSize * 0.6;
        const box: BoundingBox = {
          minX: Math.min(elbow.x, end.x) - (offsetDirX < 0 ? textLen : 0),
          minY: end.y - 10,
          maxX: Math.max(elbow.x, end.x) + (offsetDirX > 0 ? textLen : 0),
          maxY: end.y + 10,
        };

        placements.push({
          roomId: room.id,
          roomName: room.name,
          displayName: abbr,
          abbreviation: abbr,
          dimensionsText: dimFtIn,
          areaText,
          vastuText,
          anchor: centerScreen,
          box,
          fontSize: Math.max(8, fontSize - 1),
          isCompact: true,
          useLeaderLine: true,
          leaderPath: {
            start: centerScreen,
            elbow,
            end,
          },
          visibleLines: {
            name: true,
            dimensions: true,
            area: false,
            vastu: false,
          },
        });
        placedBoxes.push(box);
        continue;
      }

      // Normal room label inside room boundary
      // Compute estimated bounding box
      let activeLinesCount = (visibleLines.name ? 1 : 0) +
        (visibleLines.dimensions ? 1 : 0) +
        (visibleLines.area ? 1 : 0) +
        (visibleLines.vastu ? 1 : 0);

      const approxTextWidth = Math.max(
        displayName.length * fontSize * 0.65,
        visibleLines.dimensions ? dimFtIn.length * fontSize * 0.5 : 0,
      );
      const approxHeight = activeLinesCount * fontSize * 1.3;

      let box: BoundingBox = {
        minX: centerScreen.x - approxTextWidth / 2,
        minY: centerScreen.y - approxHeight / 2,
        maxX: centerScreen.x + approxTextWidth / 2,
        maxY: centerScreen.y + approxHeight / 2,
      };

      // Collision Sweep against previously placed labels
      let hasCollision = placedBoxes.some(placed => boxesOverlap(box, placed));
      labelAnchor = centerScreen;
      if (hasCollision) {
        // Step 1: Drop vastu and area
        visibleLines.vastu = false;
        visibleLines.area = false;
        displayName = abbr; // abbreviate
        activeLinesCount = 2;

        box = {
          minX: centerScreen.x - (displayName.length * fontSize * 0.6) / 2,
          minY: centerScreen.y - (activeLinesCount * fontSize * 1.3) / 2,
          maxX: centerScreen.x + (displayName.length * fontSize * 0.6) / 2,
          maxY: centerScreen.y + (activeLinesCount * fontSize * 1.3) / 2,
        };

        hasCollision = placedBoxes.some(placed => boxesOverlap(box, placed));
      }

      if (hasCollision) {
        // Step 2: Try vertical offset sufficient to clear adjacent box
        const offsetShift = approxHeight + 6;
        const boxUp = { ...box, minY: box.minY - offsetShift, maxY: box.maxY - offsetShift };
        const boxDown = { ...box, minY: box.minY + offsetShift, maxY: box.maxY + offsetShift };

        let labelAnchor = centerScreen;
        if (!placedBoxes.some(placed => boxesOverlap(boxUp, placed))) {
          box = boxUp;
          labelAnchor = { x: centerScreen.x, y: centerScreen.y - offsetShift };
          hasCollision = false;
        } else if (!placedBoxes.some(placed => boxesOverlap(boxDown, placed))) {
          box = boxDown;
          labelAnchor = { x: centerScreen.x, y: centerScreen.y + offsetShift };
          hasCollision = false;
        } else {
          // Step 3: If still colliding, convert to leader line callout
          const offsetDirX = centerScreen.x < 400 ? -35 : 35;
          const offsetDirY = centerScreen.y < 300 ? -25 : 25;
          const elbow = { x: centerScreen.x + offsetDirX, y: centerScreen.y + offsetDirY };
          const end = { x: elbow.x + (offsetDirX > 0 ? 25 : -25), y: elbow.y };

          const textLen = abbr.length * fontSize * 0.6;
          box = {
            minX: Math.min(elbow.x, end.x) - (offsetDirX < 0 ? textLen : 0),
            minY: end.y - 10,
            maxX: Math.max(elbow.x, end.x) + (offsetDirX > 0 ? textLen : 0),
            maxY: end.y + 10,
          };

          placements.push({
            roomId: room.id,
            roomName: room.name,
            displayName: abbr,
            abbreviation: abbr,
            dimensionsText: dimFtIn,
            areaText,
            vastuText,
            anchor: labelAnchor,
            box,
            fontSize: Math.max(8, fontSize - 1),
            isCompact: true,
            useLeaderLine: true,
            leaderPath: {
              start: centerScreen,
              elbow,
              end,
            },
            visibleLines: {
              name: true,
              dimensions: true,
              area: false,
              vastu: false,
            },
          });
          placedBoxes.push(box);
          continue;
        }
      }

      placements.push({
        roomId: room.id,
        roomName: room.name,
        displayName,
        abbreviation: abbr,
        dimensionsText: dimFtIn,
        areaText,
        vastuText,
        anchor: labelAnchor,
        box,
        fontSize,
        isCompact,
        useLeaderLine: false,
        visibleLines,
      });

      placedBoxes.push(box);
    }

    return placements;
  }

  /**
   * Render SVG markup for room labels with professional halo, leader lines, and hierarchy
   */
  public static renderLabelsSvg(placements: RoomLabelPlacement[]): string {
    const elements: string[] = [];

    for (const p of placements) {
      if (p.useLeaderLine && p.leaderPath) {
        // Render leader line callout
        const { start, elbow, end } = p.leaderPath;
        const isRight = end.x >= elbow.x;
        const textX = isRight ? end.x + 4 : end.x - 4;
        const textAnchor = isRight ? 'start' : 'end';

        elements.push(
          `<g class="room-annotation-leader" data-room-id="${p.roomId}" pointer-events="none">`,
          `  <circle cx="${start.x.toFixed(1)}" cy="${start.y.toFixed(1)}" r="2" fill="#0F172A"/>`,
          `  <polyline points="${start.x.toFixed(1)},${start.y.toFixed(1)} ${elbow.x.toFixed(1)},${elbow.y.toFixed(1)} ${end.x.toFixed(1)},${end.y.toFixed(1)}" fill="none" stroke="#475569" stroke-width="0.8"/>`,
          `  <text x="${textX.toFixed(1)}" y="${(end.y - 2).toFixed(1)}" text-anchor="${textAnchor}" font-family="Inter, Arial, sans-serif" font-size="${p.fontSize.toFixed(1)}" fill="#0F172A" font-weight="700">${escapeXml(p.displayName)}</text>`,
          `  <text x="${textX.toFixed(1)}" y="${(end.y + p.fontSize).toFixed(1)}" text-anchor="${textAnchor}" font-family="Inter, Arial, sans-serif" font-size="${(p.fontSize - 1.5).toFixed(1)}" fill="#475569" font-weight="500">${escapeXml(p.dimensionsText)}</text>`,
          `</g>`,
        );
        continue;
      }

      // Standard multi-tier centered room label with SVG halo
      const cx = p.anchor.x;
      const cy = p.anchor.y;
      const fs = p.fontSize;
      const subFs = Math.max(7, fs - 2.5);

      const lines: string[] = [];
      const lineY = cy;

      if (p.visibleLines.name) {
        lines.push(
          `<text x="${cx.toFixed(1)}" y="${(lineY - fs * 0.5).toFixed(1)}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${fs.toFixed(1)}" fill="#0F172A" font-weight="700" style="text-transform:uppercase">${escapeXml(p.displayName)}</text>`,
        );
      }
      if (p.visibleLines.dimensions) {
        lines.push(
          `<text x="${cx.toFixed(1)}" y="${(lineY + fs * 0.45).toFixed(1)}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${subFs.toFixed(1)}" fill="#334155" font-weight="500">${escapeXml(p.dimensionsText)}</text>`,
        );
      }
      if (p.visibleLines.area) {
        lines.push(
          `<text x="${cx.toFixed(1)}" y="${(lineY + fs * 1.35).toFixed(1)}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${subFs.toFixed(1)}" fill="#64748B">${escapeXml(p.areaText)}</text>`,
        );
      }
      if (p.visibleLines.vastu && p.vastuText) {
        lines.push(
          `<text x="${cx.toFixed(1)}" y="${(lineY + fs * 2.2).toFixed(1)}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${(subFs - 1).toFixed(1)}" fill="#0284C7" font-weight="600">${escapeXml(p.vastuText)}</text>`,
        );
      }

      elements.push(
        `<g class="room-annotation-label" data-room-id="${p.roomId}" style="paint-order:stroke;stroke:#ffffff;stroke-width:3px;stroke-linejoin:round" pointer-events="none">\n${lines.join('\n')}\n</g>`,
      );
    }

    return elements.join('\n');
  }

  /**
   * Render professional exterior building dimensions outside perimeter walls
   */
  public static renderExteriorBuildingDimensions(
    floor: Floor,
    transform: ViewTransform,
  ): string {
    if (!floor.rooms || floor.rooms.length === 0) return '';

    // Calculate exterior building bounding box
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    floor.rooms.forEach(r => {
      minX = Math.min(minX, r.x);
      minY = Math.min(minY, r.y);
      maxX = Math.max(maxX, r.x + r.width);
      maxY = Math.max(maxY, r.y + r.height);
    });

    if (!Number.isFinite(minX)) return '';

    const widthMm = maxX - minX;
    const depthMm = maxY - minY;

    const offsetMm = 1200; // 1.2m offset outside exterior walls
    const pTopLeft = worldToScreen({ x: minX, y: minY - offsetMm }, transform);
    const pTopRight = worldToScreen({ x: maxX, y: minY - offsetMm }, transform);
    const pLeftTop = worldToScreen({ x: minX - offsetMm, y: minY }, transform);
    const pLeftBottom = worldToScreen({ x: minX - offsetMm, y: maxY }, transform);

    const lines: string[] = [];
    const tickLen = 6;

    // Top Width Dimension Line
    lines.push(
      `<g class="building-ext-dim-width" pointer-events="none">`,
      `  <line x1="${pTopLeft.x.toFixed(1)}" y1="${pTopLeft.y.toFixed(1)}" x2="${pTopRight.x.toFixed(1)}" y2="${pTopRight.y.toFixed(1)}" stroke="#2563EB" stroke-width="0.75"/>`,
      `  <line x1="${pTopLeft.x.toFixed(1)}" y1="${(pTopLeft.y - tickLen).toFixed(1)}" x2="${pTopLeft.x.toFixed(1)}" y2="${(pTopLeft.y + tickLen).toFixed(1)}" stroke="#2563EB" stroke-width="0.75"/>`,
      `  <line x1="${pTopRight.x.toFixed(1)}" y1="${(pTopRight.y - tickLen).toFixed(1)}" x2="${pTopRight.x.toFixed(1)}" y2="${(pTopRight.y + tickLen).toFixed(1)}" stroke="#2563EB" stroke-width="0.75"/>`,
      `  <text x="${((pTopLeft.x + pTopRight.x) / 2).toFixed(1)}" y="${(pTopLeft.y - 4).toFixed(1)}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" font-weight="600" fill="#1E40AF">${formatFeetInches(widthMm)} (${(widthMm / 1000).toFixed(2)}m)</text>`,
      `</g>`,
    );

    // Left Depth Dimension Line
    lines.push(
      `<g class="building-ext-dim-depth" pointer-events="none">`,
      `  <line x1="${pLeftTop.x.toFixed(1)}" y1="${pLeftTop.y.toFixed(1)}" x2="${pLeftBottom.x.toFixed(1)}" y2="${pLeftBottom.y.toFixed(1)}" stroke="#2563EB" stroke-width="0.75"/>`,
      `  <line x1="${(pLeftTop.x - tickLen).toFixed(1)}" y1="${pLeftTop.y.toFixed(1)}" x2="${(pLeftTop.x + tickLen).toFixed(1)}" y2="${pLeftTop.y.toFixed(1)}" stroke="#2563EB" stroke-width="0.75"/>`,
      `  <line x1="${(pLeftBottom.x - tickLen).toFixed(1)}" y1="${pLeftBottom.y.toFixed(1)}" x2="${(pLeftBottom.x + tickLen).toFixed(1)}" y2="${pLeftBottom.y.toFixed(1)}" stroke="#2563EB" stroke-width="0.75"/>`,
      `  <text x="${(pLeftTop.x - 6).toFixed(1)}" y="${((pLeftTop.y + pLeftBottom.y) / 2).toFixed(1)}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" font-weight="600" fill="#1E40AF" transform="rotate(-90 ${(pLeftTop.x - 6).toFixed(1)} ${((pLeftTop.y + pLeftBottom.y) / 2).toFixed(1)})">${formatFeetInches(depthMm)} (${(depthMm / 1000).toFixed(2)}m)</text>`,
      `</g>`,
    );

    return lines.join('\n');
  }

  /**
   * Render structural grid lines (A, B, C... / 1, 2, 3...) and reference bubbles
   */
  public static renderStructuralGrid(
    floor: Floor,
    transform: ViewTransform,
  ): string {
    const columns = floor.columns ?? [];
    if (columns.length === 0) return '';

    // Collect unique X and Y coordinates from columns
    const xCoords = Array.from(new Set(columns.map(c => Math.round(c.position.x)))).sort((a, b) => a - b);
    const yCoords = Array.from(new Set(columns.map(c => Math.round(c.position.y)))).sort((a, b) => a - b);

    if (xCoords.length === 0 || yCoords.length === 0) return '';

    const elements: string[] = [];
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

    const minX = xCoords[0]!;
    const maxX = xCoords[xCoords.length - 1]!;
    const minY = yCoords[0]!;
    const maxY = yCoords[yCoords.length - 1]!;

    const extMm = 800; // extend grid lines 800mm beyond exterior columns

    // Vertical grid lines (labeled 1, 2, 3...)
    xCoords.forEach((x, idx) => {
      const topScreen = worldToScreen({ x, y: minY - extMm }, transform);
      const bottomScreen = worldToScreen({ x, y: maxY + extMm }, transform);
      const label = String(idx + 1);

      elements.push(
        `<g class="structural-grid-line-x" data-grid-axis="X" data-grid-index="${idx + 1}" pointer-events="none">`,
        `  <line x1="${topScreen.x.toFixed(1)}" y1="${topScreen.y.toFixed(1)}" x2="${bottomScreen.x.toFixed(1)}" y2="${bottomScreen.y.toFixed(1)}" stroke="#94A3B8" stroke-width="0.75" stroke-dasharray="6,4"/>`,
        `  <circle cx="${topScreen.x.toFixed(1)}" cy="${topScreen.y.toFixed(1)}" r="8" fill="#FFFFFF" stroke="#475569" stroke-width="0.75"/>`,
        `  <text x="${topScreen.x.toFixed(1)}" y="${(topScreen.y + 3).toFixed(1)}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8" font-weight="700" fill="#0F172A">${label}</text>`,
        `</g>`,
      );
    });

    // Horizontal grid lines (labeled A, B, C...)
    yCoords.forEach((y, idx) => {
      const leftScreen = worldToScreen({ x: minX - extMm, y }, transform);
      const rightScreen = worldToScreen({ x: maxX + extMm, y }, transform);
      const label = idx < letters.length ? letters[idx]! : `A${letters[idx % letters.length]}`;

      elements.push(
        `<g class="structural-grid-line-y" data-grid-axis="Y" data-grid-index="${label}" pointer-events="none">`,
        `  <line x1="${leftScreen.x.toFixed(1)}" y1="${leftScreen.y.toFixed(1)}" x2="${rightScreen.x.toFixed(1)}" y2="${rightScreen.y.toFixed(1)}" stroke="#94A3B8" stroke-width="0.75" stroke-dasharray="6,4"/>`,
        `  <circle cx="${leftScreen.x.toFixed(1)}" cy="${leftScreen.y.toFixed(1)}" r="8" fill="#FFFFFF" stroke="#475569" stroke-width="0.75"/>`,
        `  <text x="${leftScreen.x.toFixed(1)}" y="${(leftScreen.y + 3).toFixed(1)}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8" font-weight="700" fill="#0F172A">${label}</text>`,
        `</g>`,
      );
    });

    return elements.join('\n');
  }
}
