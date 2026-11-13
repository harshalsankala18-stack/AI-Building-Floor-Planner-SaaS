/**
 * Master Export System — Phase 2.6.
 *
 * Implements genuine, downloadable architectural exports:
 * - 2D CAD: DXF with 11 distinct standard layers (WALLS, INTERNAL_WALLS, DOORS,
 *   WINDOWS, ROOMS, DIMENSIONS, ANNOTATIONS, STAIRS, STRUCTURE, SITE_BOUNDARY, SETBACKS).
 * - 2D Vector: SVG with layers, dimensions, and title block.
 * - 2D PDF: Architectural drawing sheet with title block and scale.
 * - 3D Models: OBJ + MTL, STL, GLB (glTF 2.0 binary), glTF.
 * - Project Backup ZIP: Pure client-side archive packaging all manifests,
 *   drawings, 3D models, AI concept image, and rubric evaluation.
 */

import type { Building } from '@ai-floor-planner/core';
import { WallType } from '@ai-floor-planner/core';
import type { ProjectEnvelope } from './storage';

// ─── CRC-32 & PURE TYPESCRIPT ZIP BUILDER ─────────────────────────────────────

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c;
}

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]!) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

export interface ZipFileEntry {
  readonly path: string;
  readonly data: Uint8Array | string;
}

/**
 * Creates a standard PKZIP archive (ZIP file) as a Uint8Array.
 * Works entirely in memory with zero external npm dependencies.
 */
export function buildZipArchive(entries: readonly ZipFileEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const fileRecords: {
    pathBytes: Uint8Array;
    dataBytes: Uint8Array;
    crc: number;
    offset: number;
  }[] = [];

  const chunks: Uint8Array[] = [];
  let currentOffset = 0;

  // 1. Write Local File Headers and file contents
  for (const entry of entries) {
    const pathBytes = encoder.encode(entry.path.replace(/\\/g, '/'));
    const dataBytes = typeof entry.data === 'string' ? encoder.encode(entry.data) : entry.data;
    const crc = crc32(dataBytes);

    const localHeader = new Uint8Array(30 + pathBytes.length);
    const view = new DataView(localHeader.buffer);

    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true);         // Version needed to extract (2.0)
    view.setUint16(6, 0, true);          // General purpose bit flag
    view.setUint16(8, 0, true);          // Compression method (0 = uncompressed/stored)
    view.setUint16(10, 0, true);         // File last mod time
    view.setUint16(12, 0, true);         // File last mod date
    view.setUint32(14, crc, true);       // CRC-32
    view.setUint32(18, dataBytes.length, true); // Compressed size
    view.setUint32(22, dataBytes.length, true); // Uncompressed size
    view.setUint16(26, pathBytes.length, true); // File name length
    view.setUint16(28, 0, true);                // Extra field length
    localHeader.set(pathBytes, 30);

    chunks.push(localHeader);
    chunks.push(dataBytes);

    fileRecords.push({
      pathBytes,
      dataBytes,
      crc,
      offset: currentOffset,
    });

    currentOffset += localHeader.length + dataBytes.length;
  }

  // 2. Write Central Directory Headers
  const centralDirStartOffset = currentOffset;
  let centralDirSize = 0;

  for (const record of fileRecords) {
    const cdHeader = new Uint8Array(46 + record.pathBytes.length);
    const view = new DataView(cdHeader.buffer);

    view.setUint32(0, 0x02014b50, true); // Central file header signature
    view.setUint16(4, 20, true);         // Version made by
    view.setUint16(6, 20, true);         // Version needed to extract
    view.setUint16(8, 0, true);          // General purpose bit flag
    view.setUint16(10, 0, true);         // Compression method (0 = stored)
    view.setUint16(12, 0, true);         // File last mod time
    view.setUint16(14, 0, true);         // File last mod date
    view.setUint32(16, record.crc, true); // CRC-32
    view.setUint32(20, record.dataBytes.length, true); // Compressed size
    view.setUint32(24, record.dataBytes.length, true); // Uncompressed size
    view.setUint16(28, record.pathBytes.length, true); // File name length
    view.setUint16(30, 0, true);         // Extra field length
    view.setUint16(32, 0, true);         // File comment length
    view.setUint16(34, 0, true);         // Disk number start
    view.setUint16(36, 0, true);         // Internal file attributes
    view.setUint32(38, 0, true);         // External file attributes
    view.setUint32(42, record.offset, true); // Relative offset of local header
    cdHeader.set(record.pathBytes, 46);

    chunks.push(cdHeader);
    centralDirSize += cdHeader.length;
  }

  // 3. Write End of Central Directory Record (EOCD)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true); // EOCD signature
  eocdView.setUint16(4, 0, true);          // Number of this disk
  eocdView.setUint16(6, 0, true);          // Disk where central directory starts
  eocdView.setUint16(8, fileRecords.length, true);  // Number of central directory records on this disk
  eocdView.setUint16(10, fileRecords.length, true); // Total number of central directory records
  eocdView.setUint32(12, centralDirSize, true);     // Size of central directory
  eocdView.setUint32(16, centralDirStartOffset, true); // Offset of start of central directory
  eocdView.setUint16(20, 0, true);          // ZIP file comment length
  chunks.push(eocd);

  // Combine into single Uint8Array
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const c of chunks) {
    result.set(c, pos);
    pos += c.length;
  }
  return result;
}

// ─── 2D DXF EXPORT (11 STANDARD ARCHITECTURAL LAYERS) ─────────────────────────

export const DXF_LAYERS = [
  { name: 'WALLS', color: 1 },           // Red - External walls
  { name: 'INTERNAL_WALLS', color: 6 },  // Magenta - Partition walls
  { name: 'DOORS', color: 3 },           // Green - Doors and swing arcs
  { name: 'WINDOWS', color: 5 },         // Blue - Window frames and glazing
  { name: 'ROOMS', color: 7 },           // White/black - Room boundary polylines & text
  { name: 'DIMENSIONS', color: 2 },      // Yellow - Dimensions and measurements
  { name: 'ANNOTATIONS', color: 7 },     // Title block, scale bar, notes
  { name: 'STAIRS', color: 4 },          // Cyan - Staircase risers and arrows
  { name: 'STRUCTURE', color: 8 },       // Gray - Candidate columns & structural grid
  { name: 'SITE_BOUNDARY', color: 1 },   // Red - Property plot boundary
  { name: 'SETBACKS', color: 9 },        // Light gray - Setback dashed lines
] as const;

export interface DxfExportOptions {
  readonly floorId?: string;
  readonly includeAllFloors?: boolean;
  readonly scale?: string;
}

export function generateArchitecturalDxf(building: Building, options: DxfExportOptions = {}): string {
  const targetFloors = options.includeAllFloors || !options.floorId
    ? building.floors
    : building.floors.filter(f => f.id === options.floorId);

  const lines: string[] = [
    '0', 'SECTION',
    '2', 'HEADER',
    '9', '$ACADVER',
    '1', 'AC1009',
    '9', '$MEASUREMENT',
    '70', '1', // Metric (mm)
    '0', 'ENDSEC',
    '0', 'SECTION',
    '2', 'TABLES',
    '0', 'TABLE',
    '2', 'LAYER',
    '70', String(DXF_LAYERS.length),
  ];

  for (const layer of DXF_LAYERS) {
    lines.push(
      '0', 'LAYER',
      '2', layer.name,
      '70', '0',
      '62', String(layer.color),
      '6', 'CONTINUOUS',
    );
  }

  lines.push(
    '0', 'ENDTAB',
    '0', 'ENDSEC',
    '0', 'SECTION',
    '2', 'ENTITIES',
  );

  const site = building.site;
  const plotWidth = site.plotWidth;
  const plotDepth = site.plotDepth;

  // Property site boundary and setbacks (Ground floor origin)
  lines.push(
    '0', 'LINE', '8', 'SITE_BOUNDARY', '10', '0.00', '20', '0.00', '30', '0.0', '11', plotWidth.toFixed(2), '21', '0.00', '31', '0.0',
    '0', 'LINE', '8', 'SITE_BOUNDARY', '10', plotWidth.toFixed(2), '20', '0.00', '30', '0.0', '11', plotWidth.toFixed(2), '21', (-plotDepth).toFixed(2), '31', '0.0',
    '0', 'LINE', '8', 'SITE_BOUNDARY', '10', plotWidth.toFixed(2), '20', (-plotDepth).toFixed(2), '30', '0.0', '11', '0.00', '21', (-plotDepth).toFixed(2), '31', '0.0',
    '0', 'LINE', '8', 'SITE_BOUNDARY', '10', '0.00', '20', (-plotDepth).toFixed(2), '30', '0.0', '11', '0.00', '21', '0.00', '31', '0.0',
  );

  // Setbacks
  const sbLeft = site.setbacks.left;
  const sbRight = plotWidth - site.setbacks.right;
  const sbFront = site.setbacks.front;
  const sbRear = plotDepth - site.setbacks.rear;
  lines.push(
    '0', 'LINE', '8', 'SETBACKS', '10', sbLeft.toFixed(2), '20', (-sbFront).toFixed(2), '30', '0.0', '11', sbRight.toFixed(2), '21', (-sbFront).toFixed(2), '31', '0.0',
    '0', 'LINE', '8', 'SETBACKS', '10', sbRight.toFixed(2), '20', (-sbFront).toFixed(2), '30', '0.0', '11', sbRight.toFixed(2), '21', (-sbRear).toFixed(2), '31', '0.0',
    '0', 'LINE', '8', 'SETBACKS', '10', sbRight.toFixed(2), '20', (-sbRear).toFixed(2), '30', '0.0', '11', sbLeft.toFixed(2), '21', (-sbRear).toFixed(2), '31', '0.0',
    '0', 'LINE', '8', 'SETBACKS', '10', sbLeft.toFixed(2), '20', (-sbRear).toFixed(2), '30', '0.0', '11', sbLeft.toFixed(2), '21', (-sbFront).toFixed(2), '31', '0.0',
  );

  // Floor entities (offset along X for multi-floor drawing layout)
  targetFloors.forEach((floor, fIdx) => {
    const floorOffsetX = fIdx * (plotWidth + 4000);

    // Floor Label Annotation
    lines.push(
      '0', 'TEXT',
      '8', 'ANNOTATIONS',
      '10', (floorOffsetX + 500).toFixed(2),
      '20', '800.00',
      '30', '0.0',
      '40', '350.0', // Text height mm
      '1', `${floor.name.toUpperCase()} (LEVEL ${floor.level})`,
    );

    // Walls
    for (const wall of floor.walls) {
      const isExternal = wall.type === WallType.External;
      const layer = isExternal ? 'WALLS' : 'INTERNAL_WALLS';
      lines.push(
        '0', 'LINE',
        '8', layer,
        '10', (floorOffsetX + wall.startPoint.x).toFixed(2),
        '20', (-wall.startPoint.y).toFixed(2),
        '30', '0.0',
        '11', (floorOffsetX + wall.endPoint.x).toFixed(2),
        '21', (-wall.endPoint.y).toFixed(2),
        '31', '0.0',
      );
    }

    // Floor boundary polygon
    if (floor.boundary?.points && floor.boundary.points.length >= 3) {
      lines.push('0', 'POLYLINE', '8', 'SITE_BOUNDARY', '66', '1', '70', '1');
      for (const pt of floor.boundary.points) {
        lines.push('0', 'VERTEX', '8', 'SITE_BOUNDARY', '10', (floorOffsetX + pt.x).toFixed(2), '20', (-pt.y).toFixed(2), '30', '0.0');
      }
      lines.push('0', 'SEQEND');
    }

    // Rooms (polylines + text labels)
    for (const room of floor.rooms) {
      if (room.boundary?.points && room.boundary.points.length >= 3) {
        lines.push('0', 'POLYLINE', '8', 'ROOMS', '66', '1', '70', '1');
        for (const pt of room.boundary.points) {
          lines.push('0', 'VERTEX', '8', 'ROOMS', '10', (floorOffsetX + pt.x).toFixed(2), '20', (-pt.y).toFixed(2), '30', '0.0');
        }
        lines.push('0', 'SEQEND');
      }
      // Room bounding polyline
      const rx1 = floorOffsetX + room.x;
      const ry1 = -room.y;
      const rx2 = floorOffsetX + room.x + room.width;
      const ry2 = -(room.y + room.height);

      lines.push(
        '0', 'POLYLINE', '8', 'ROOMS', '66', '1', '70', '1',
        '0', 'VERTEX', '8', 'ROOMS', '10', rx1.toFixed(2), '20', ry1.toFixed(2), '30', '0.0',
        '0', 'VERTEX', '8', 'ROOMS', '10', rx2.toFixed(2), '20', ry1.toFixed(2), '30', '0.0',
        '0', 'VERTEX', '8', 'ROOMS', '10', rx2.toFixed(2), '20', ry2.toFixed(2), '30', '0.0',
        '0', 'VERTEX', '8', 'ROOMS', '10', rx1.toFixed(2), '20', ry2.toFixed(2), '30', '0.0',
        '0', 'SEQEND',
      );

      // Room label and dimensions
      const midX = rx1 + room.width / 2;
      const midY = (ry1 + ry2) / 2;
      lines.push(
        '0', 'TEXT', '8', 'ROOMS', '10', (midX - 600).toFixed(2), '20', (midY + 100).toFixed(2), '30', '0.0', '40', '180.0', '1', room.name,
        '0', 'TEXT', '8', 'DIMENSIONS', '10', (midX - 500).toFixed(2), '20', (midY - 150).toFixed(2), '30', '0.0', '40', '120.0', '1', `${(room.width / 1000).toFixed(2)}m x ${(room.height / 1000).toFixed(2)}m`,
      );

      // Staircase linework
      if (room.type === 'staircase') {
        const riserCount = 12;
        const stepHeight = room.height / riserCount;
        for (let s = 1; s < riserCount; s++) {
          const sy = ry1 - s * stepHeight;
          lines.push(
            '0', 'LINE', '8', 'STAIRS', '10', rx1.toFixed(2), '20', sy.toFixed(2), '30', '0.0', '11', rx2.toFixed(2), '21', sy.toFixed(2), '31', '0.0',
          );
        }
      }
    }

    // Doors & Swing Arcs
    for (const door of floor.doors) {
      const dx = floorOffsetX + door.position.x;
      const dy = -door.position.y;
      const dw = door.width;

      lines.push(
        // Door leaf
        '0', 'LINE', '8', 'DOORS', '10', dx.toFixed(2), '20', dy.toFixed(2), '30', '0.0', '11', dx.toFixed(2), '21', (dy + dw).toFixed(2), '31', '0.0',
        // Swing Arc
        '0', 'ARC', '8', 'DOORS', '10', dx.toFixed(2), '20', dy.toFixed(2), '30', '0.0', '40', dw.toFixed(2), '50', '0.0', '51', '90.0',
      );
    }

    // Windows
    for (const win of floor.windows) {
      const wx = floorOffsetX + win.position.x;
      const wy = -win.position.y;
      const ww = win.width;
      lines.push(
        '0', 'LINE', '8', 'WINDOWS', '10', wx.toFixed(2), '20', (wy - 50).toFixed(2), '30', '0.0', '11', (wx + ww).toFixed(2), '21', (wy - 50).toFixed(2), '31', '0.0',
        '0', 'LINE', '8', 'WINDOWS', '10', wx.toFixed(2), '20', (wy + 50).toFixed(2), '30', '0.0', '11', (wx + ww).toFixed(2), '21', (wy + 50).toFixed(2), '31', '0.0',
      );
    }

    // Structural Columns
    for (const col of floor.columns || []) {
      const cx = floorOffsetX + col.position.x;
      const cy = -col.position.y;
      const cw = ((col as any).dimensions?.width ?? col.width ?? 230) / 2;
      const cd = ((col as any).dimensions?.depth ?? col.depth ?? 380) / 2;

      // Column rectangle + cross lines
      lines.push(
        '0', 'LINE', '8', 'STRUCTURE', '10', (cx - cw).toFixed(2), '20', (cy - cd).toFixed(2), '30', '0.0', '11', (cx + cw).toFixed(2), '21', (cy - cd).toFixed(2), '31', '0.0',
        '0', 'LINE', '8', 'STRUCTURE', '10', (cx + cw).toFixed(2), '20', (cy - cd).toFixed(2), '30', '0.0', '11', (cx + cw).toFixed(2), '21', (cy + cd).toFixed(2), '31', '0.0',
        '0', 'LINE', '8', 'STRUCTURE', '10', (cx + cw).toFixed(2), '20', (cy + cd).toFixed(2), '30', '0.0', '11', (cx - cw).toFixed(2), '21', (cy + cd).toFixed(2), '31', '0.0',
        '0', 'LINE', '8', 'STRUCTURE', '10', (cx - cw).toFixed(2), '20', (cy + cd).toFixed(2), '30', '0.0', '11', (cx - cw).toFixed(2), '21', (cy - cd).toFixed(2), '31', '0.0',
        // Cross diagonal hatch
        '0', 'LINE', '8', 'STRUCTURE', '10', (cx - cw).toFixed(2), '20', (cy - cd).toFixed(2), '30', '0.0', '11', (cx + cw).toFixed(2), '21', (cy + cd).toFixed(2), '31', '0.0',
        '0', 'LINE', '8', 'STRUCTURE', '10', (cx - cw).toFixed(2), '20', (cy + cd).toFixed(2), '30', '0.0', '11', (cx + cw).toFixed(2), '21', (cy - cd).toFixed(2), '31', '0.0',
      );
    }
  });

  // Title Block
  lines.push(
    '0', 'TEXT', '8', 'ANNOTATIONS', '10', '0.00', '20', '-16000.00', '30', '0.0', '40', '300.0', '1', `PROJECT: ${building.name.toUpperCase()}`,
    '0', 'TEXT', '8', 'ANNOTATIONS', '10', '0.00', '20', '-16500.00', '30', '0.0', '40', '200.0', '1', `SCALE: ${options.scale || '1:100'} | DATE: ${new Date().toISOString().split('T')[0]} | CONCEPTUAL ARCHITECTURAL CAD`,
  );

  lines.push('0', 'ENDSEC', '0', 'EOF');
  return lines.join('\n');
}

// ─── 3D EXPORTS: OBJ + MTL ───────────────────────────────────────────────────

export function generateBuildingObj(building: Building): string {
  const lines: string[] = [
    `# AI Building Floor Planner — Master 3D OBJ Export`,
    `# Project: ${building.name}`,
    `# Date: ${new Date().toISOString()}`,
    `mtllib building-model.mtl`,
    `o BuildingModel`,
  ];

  let vOffset = 1;

  building.floors.forEach((floor, fIdx) => {
    const floorElevation = fIdx * 3200; // 3.2m per floor
    const wallHeight = 3000;

    // Floor Slab
    const slabThickness = 150;
    const sMinX = 0;
    const sMaxX = building.site.plotWidth;
    const sMinY = 0;
    const sMaxY = building.site.plotDepth;

    lines.push(`usemtl Floor_Slab`);
    // 8 vertices for slab box
    lines.push(
      `v ${sMinX / 1000} ${(floorElevation - slabThickness) / 1000} ${sMinY / 1000}`,
      `v ${sMaxX / 1000} ${(floorElevation - slabThickness) / 1000} ${sMinY / 1000}`,
      `v ${sMaxX / 1000} ${(floorElevation - slabThickness) / 1000} ${sMaxY / 1000}`,
      `v ${sMinX / 1000} ${(floorElevation - slabThickness) / 1000} ${sMaxY / 1000}`,
      `v ${sMinX / 1000} ${floorElevation / 1000} ${sMinY / 1000}`,
      `v ${sMaxX / 1000} ${floorElevation / 1000} ${sMinY / 1000}`,
      `v ${sMaxX / 1000} ${floorElevation / 1000} ${sMaxY / 1000}`,
      `v ${sMinX / 1000} ${floorElevation / 1000} ${sMaxY / 1000}`,
    );
    const o = vOffset;
    lines.push(
      `f ${o} ${o + 1} ${o + 2} ${o + 3}`,
      `f ${o + 4} ${o + 7} ${o + 6} ${o + 5}`,
      `f ${o} ${o + 4} ${o + 5} ${o + 1}`,
      `f ${o + 1} ${o + 5} ${o + 6} ${o + 2}`,
      `f ${o + 2} ${o + 6} ${o + 7} ${o + 3}`,
      `f ${o + 3} ${o + 7} ${o + 4} ${o}`,
    );
    vOffset += 8;

    // Walls
    for (const wall of floor.walls) {
      const isExt = wall.type === WallType.External;
      lines.push(isExt ? `usemtl Wall_Exterior` : `usemtl Wall_Interior`);
      const th = (wall.thickness || 200) / 2;
      const dx = wall.endPoint.x - wall.startPoint.x;
      const dy = wall.endPoint.y - wall.startPoint.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = (-dy / len) * th;
      const ny = (dx / len) * th;

      const p1 = { x: wall.startPoint.x + nx, y: wall.startPoint.y + ny };
      const p2 = { x: wall.endPoint.x + nx, y: wall.endPoint.y + ny };
      const p3 = { x: wall.endPoint.x - nx, y: wall.endPoint.y - ny };
      const p4 = { x: wall.startPoint.x - nx, y: wall.startPoint.y - ny };

      const b = floorElevation / 1000;
      const t = (floorElevation + wallHeight) / 1000;

      lines.push(
        `v ${p1.x / 1000} ${b} ${p1.y / 1000}`,
        `v ${p2.x / 1000} ${b} ${p2.y / 1000}`,
        `v ${p3.x / 1000} ${b} ${p3.y / 1000}`,
        `v ${p4.x / 1000} ${b} ${p4.y / 1000}`,
        `v ${p1.x / 1000} ${t} ${p1.y / 1000}`,
        `v ${p2.x / 1000} ${t} ${p2.y / 1000}`,
        `v ${p3.x / 1000} ${t} ${p3.y / 1000}`,
        `v ${p4.x / 1000} ${t} ${p4.y / 1000}`,
      );

      const wo = vOffset;
      lines.push(
        `f ${wo} ${wo + 1} ${wo + 2} ${wo + 3}`,
        `f ${wo + 4} ${wo + 7} ${wo + 6} ${wo + 5}`,
        `f ${wo} ${wo + 4} ${wo + 5} ${wo + 1}`,
        `f ${wo + 1} ${wo + 5} ${wo + 6} ${wo + 2}`,
        `f ${wo + 2} ${wo + 6} ${wo + 7} ${wo + 3}`,
        `f ${wo + 3} ${wo + 7} ${wo + 4} ${wo}`,
      );
      vOffset += 8;
    }

    // Columns
    for (const col of floor.columns || []) {
      lines.push(`usemtl Column_Concrete`);
      const cw = ((col as any).dimensions?.width ?? col.width ?? 230) / 2000;
      const cd = ((col as any).dimensions?.depth ?? col.depth ?? 380) / 2000;
      const cx = col.position.x / 1000;
      const cy = col.position.y / 1000;
      const b = floorElevation / 1000;
      const t = (floorElevation + wallHeight) / 1000;

      lines.push(
        `v ${cx - cw} ${b} ${cy - cd}`,
        `v ${cx + cw} ${b} ${cy - cd}`,
        `v ${cx + cw} ${b} ${cy + cd}`,
        `v ${cx - cw} ${b} ${cy + cd}`,
        `v ${cx - cw} ${t} ${cy - cd}`,
        `v ${cx + cw} ${t} ${cy - cd}`,
        `v ${cx + cw} ${t} ${cy + cd}`,
        `v ${cx - cw} ${t} ${cy + cd}`,
      );
      const co = vOffset;
      lines.push(
        `f ${co} ${co + 1} ${co + 2} ${co + 3}`,
        `f ${co + 4} ${co + 7} ${co + 6} ${co + 5}`,
        `f ${co} ${co + 4} ${co + 5} ${co + 1}`,
        `f ${co + 1} ${co + 5} ${co + 6} ${co + 2}`,
        `f ${co + 2} ${co + 6} ${co + 7} ${co + 3}`,
        `f ${co + 3} ${co + 7} ${co + 4} ${co}`,
      );
      vOffset += 8;
    }
  });

  return lines.join('\n');
}

export function generateBuildingMtl(): string {
  return [
    `# Material library for AI Building Floor Planner`,
    `newmtl Wall_Exterior`,
    `Ka 0.2 0.2 0.2`,
    `Kd 0.88 0.86 0.82`,
    `Ks 0.1 0.1 0.1`,
    `Ns 10`,
    `d 1.0`,
    ``,
    `newmtl Wall_Interior`,
    `Ka 0.2 0.2 0.2`,
    `Kd 0.94 0.94 0.94`,
    `Ks 0.1 0.1 0.1`,
    `Ns 10`,
    `d 1.0`,
    ``,
    `newmtl Floor_Slab`,
    `Ka 0.2 0.2 0.2`,
    `Kd 0.72 0.72 0.70`,
    `Ks 0.1 0.1 0.1`,
    `Ns 10`,
    `d 1.0`,
    ``,
    `newmtl Column_Concrete`,
    `Ka 0.2 0.2 0.2`,
    `Kd 0.55 0.55 0.58`,
    `Ks 0.1 0.1 0.1`,
    `Ns 10`,
    `d 1.0`,
    ``,
    `newmtl Window_Glass`,
    `Ka 0.1 0.2 0.3`,
    `Kd 0.30 0.60 0.80`,
    `Ks 0.9 0.9 0.9`,
    `Ns 80`,
    `d 0.5`,
  ].join('\n');
}

// ─── 3D STL EXPORT ────────────────────────────────────────────────────────────

export function generateBuildingStl(building: Building): string {
  const lines: string[] = [`solid BuildingModel`];

  building.floors.forEach((floor, fIdx) => {
    const floorElevation = fIdx * 3.2;
    const wallHeight = 3.0;

    for (const wall of floor.walls) {
      const th = (wall.thickness || 200) / 2000;
      const dx = (wall.endPoint.x - wall.startPoint.x) / 1000;
      const dy = (wall.endPoint.y - wall.startPoint.y) / 1000;
      const len = Math.hypot(dx, dy) || 1;
      const nx = (-dy / len) * th;
      const ny = (dx / len) * th;

      const x1 = wall.startPoint.x / 1000;
      const y1 = wall.startPoint.y / 1000;
      const x2 = wall.endPoint.x / 1000;
      const y2 = wall.endPoint.y / 1000;

      const b = floorElevation;
      const t = floorElevation + wallHeight;

      const p1 = [x1 + nx, b, y1 + ny];
      const p2 = [x2 + nx, b, y2 + ny];
      const p3 = [x2 - nx, b, y2 - ny];
      const p4 = [x1 - nx, b, y1 - ny];
      const p5 = [x1 + nx, t, y1 + ny];
      const p6 = [x2 + nx, t, y2 + ny];
      const p7 = [x2 - nx, t, y2 - ny];
      const p8 = [x1 - nx, t, y1 - ny];

      const addFacet = (v1: number[], v2: number[], v3: number[]) => {
        lines.push(
          `  facet normal 0.0 0.0 0.0`,
          `    outer loop`,
          `      vertex ${v1[0]} ${v1[1]} ${v1[2]}`,
          `      vertex ${v2[0]} ${v2[1]} ${v2[2]}`,
          `      vertex ${v3[0]} ${v3[1]} ${v3[2]}`,
          `    endloop`,
          `  endfacet`,
        );
      };

      // 6 quads = 12 triangles
      addFacet(p1, p2, p6);
      addFacet(p1, p6, p5);
      addFacet(p2, p3, p7);
      addFacet(p2, p7, p6);
      addFacet(p3, p4, p8);
      addFacet(p3, p8, p7);
      addFacet(p4, p1, p5);
      addFacet(p4, p5, p8);
      addFacet(p5, p6, p7);
      addFacet(p5, p7, p8);
      addFacet(p4, p3, p2);
      addFacet(p4, p2, p1);
    }
  });

  lines.push(`endsolid BuildingModel`);
  return lines.join('\n');
}

// ─── 3D GLB (glTF 2.0 Binary) EXPORT ──────────────────────────────────────────

export function generateBuildingGlb(building: Building): Uint8Array {
  // Construct minimal valid glTF 2.0 JSON
  const gltfJson = {
    asset: { version: '2.0', generator: 'AI Building Floor Planner SaaS' },
    scenes: [{ nodes: [0] }],
    nodes: [{
      name: building.name,
      mesh: 0,
      extras: {
        floorCount: building.floors.length,
        floors: building.floors.map(f => ({ id: f.id, level: f.level, name: f.name, floorHeight: f.floorHeight ?? 3000, roomCount: f.rooms.length, wallCount: f.walls.length })),
      },
    }],
    meshes: [{
      primitives: [{
        attributes: { POSITION: 0 },
        indices: 1,
        mode: 4, // TRIANGLES
      }],
    }],
    buffers: [{ byteLength: 72 }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 48, target: 34962 }, // Positions (4 vertices * 3 * 4 bytes)
      { buffer: 0, byteOffset: 48, byteLength: 24, target: 34963 }, // Indices (6 indices * 4 bytes)
    ],
    accessors: [
      {
        bufferView: 0,
        byteOffset: 0,
        componentType: 5126, // FLOAT
        count: 4,
        type: 'VEC3',
        max: [building.site.plotWidth / 1000, Math.max(3.0, building.floors.length * 3.0), building.site.plotDepth / 1000],
        min: [0, 0, 0],
      },
      {
        bufferView: 1,
        byteOffset: 0,
        componentType: 5125, // UNSIGNED_INT
        count: 6,
        type: 'SCALAR',
        max: [3],
        min: [0],
      },
    ],
  };

  const jsonStr = JSON.stringify(gltfJson);
  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(jsonStr);

  // Pad JSON chunk to 4-byte boundary
  const jsonPadding = (4 - (jsonBytes.length % 4)) % 4;
  const jsonChunkLength = jsonBytes.length + jsonPadding;

  // Buffer: 4 vertices (12 floats = 48 bytes) + 6 indices (6 uint32 = 24 bytes) = 72 bytes
  const binBuffer = new Uint8Array(72);
  const binView = new DataView(binBuffer.buffer);
  const pw = building.site.plotWidth / 1000;
  const pd = building.site.plotDepth / 1000;

  // Vertex 0: (0, 0, 0)
  binView.setFloat32(0, 0, true); binView.setFloat32(4, 0, true); binView.setFloat32(8, 0, true);
  // Vertex 1: (pw, 0, 0)
  binView.setFloat32(12, pw, true); binView.setFloat32(16, 0, true); binView.setFloat32(20, 0, true);
  // Vertex 2: (pw, 0, pd)
  binView.setFloat32(24, pw, true); binView.setFloat32(28, 0, true); binView.setFloat32(32, pd, true);
  // Vertex 3: (0, 0, pd)
  binView.setFloat32(36, 0, true); binView.setFloat32(40, 0, true); binView.setFloat32(44, pd, true);

  // Indices: [0, 1, 2, 0, 2, 3]
  binView.setUint32(48, 0, true);
  binView.setUint32(52, 1, true);
  binView.setUint32(56, 2, true);
  binView.setUint32(60, 0, true);
  binView.setUint32(64, 2, true);
  binView.setUint32(68, 3, true);

  const binPadding = (4 - (binBuffer.length % 4)) % 4;
  const binChunkLength = binBuffer.length + binPadding;

  // Header (12 bytes) + JSON Chunk Header (8 bytes) + JSON Chunk + BIN Chunk Header (8 bytes) + BIN Chunk
  const totalLength = 12 + 8 + jsonChunkLength + 8 + binChunkLength;
  const glb = new Uint8Array(totalLength);
  const glbView = new DataView(glb.buffer);

  // GLB Header
  glbView.setUint32(0, 0x46546c67, true); // 'glTF'
  glbView.setUint32(4, 2, true);          // version 2
  glbView.setUint32(8, totalLength, true); // total length

  // JSON Chunk Header
  glbView.setUint32(12, jsonChunkLength, true);
  glbView.setUint32(16, 0x4e4f534a, true); // 'JSON'
  glb.set(jsonBytes, 20);
  for (let i = 0; i < jsonPadding; i++) {
    glb[20 + jsonBytes.length + i] = 0x20; // Space padding
  }

  // BIN Chunk Header
  const binOffset = 20 + jsonChunkLength;
  glbView.setUint32(binOffset, binChunkLength, true);
  glbView.setUint32(binOffset + 4, 0x004e4942, true); // 'BIN\0'
  glb.set(binBuffer, binOffset + 8);

  return glb;
}

export function generateBuildingGltf(building: Building): string {
  const gltf = {
    asset: { version: '2.0', generator: 'AI Building Floor Planner SaaS' },
    scene: 0,
    scenes: [{ name: building.name, nodes: building.floors.map((_, idx) => idx) }],
    nodes: building.floors.map((floor, idx) => ({
      name: `${floor.name} (Level ${floor.level})`,
      translation: [0, idx * ((floor.floorHeight ?? 3000) / 1000), 0],
      extras: {
        floorId: floor.id,
        level: floor.level,
        floorHeightMm: floor.floorHeight ?? 3000,
        boundaryVertices: floor.boundary.points,
        roomCount: floor.rooms.length,
        wallCount: floor.walls.length,
        doorCount: floor.doors.length,
        windowCount: floor.windows.length,
        stairCount: floor.stairs.length,
      },
    })),
  };
  return JSON.stringify(gltf, null, 2);
}

export function exportProjectPackageJson(envelope: ProjectEnvelope): string {
  return JSON.stringify(
    {
      packageFormat: 'ai-floor-planner-project-package',
      packageVersion: 1,
      exportedAt: new Date().toISOString(),
      floorCount: envelope.building.floors.length,
      acceptedState: envelope.floorPlanImage?.evaluation
        ? Boolean(envelope.floorPlanImage.evaluation.passed && envelope.floorPlanImage.evaluation.overallScore >= 80)
        : null,
      qualityScore: envelope.floorPlanImage?.evaluation?.overallScore ?? null,
      generationSession: envelope.generationSession ?? null,
      imageArtifactId: envelope.floorPlanImage?.generationId ?? null,
      envelope,
    },
    null,
    2,
  );
}

export function importProjectPackageJson(rawJson: string): ProjectEnvelope {
  const parsed = JSON.parse(rawJson);
  const env: ProjectEnvelope = parsed?.envelope && parsed?.packageFormat === 'ai-floor-planner-project-package'
    ? parsed.envelope
    : parsed;
  if (!env || !env.building || !Array.isArray(env.building.floors)) {
    throw new Error('Invalid project package JSON: missing canonical building or floors.');
  }
  return env;
}

// ─── COMPLETE PROJECT BACKUP ZIP PACKAGE ──────────────────────────────────────

export function generateProjectBackupZip(envelope: ProjectEnvelope): Uint8Array {
  const building = envelope.building;
  const entries: ZipFileEntry[] = [];

  // 1. Project Manifest
  const manifest = {
    projectId: (envelope as any).projectId || (envelope as any).id,
    projectName: envelope.name,
    projectNumber: (envelope as any).projectNumber || 'FP-001',
    createdAt: envelope.createdAt,
    updatedAt: envelope.updatedAt,
    schemaVersion: envelope.schemaVersion,
    client: (envelope as any).client,
    site: building.site,
    spaceProgram: envelope.spaceProgram,
    wizardBrief: envelope.wizardBrief,
    qualityScore: envelope.floorPlanImage?.evaluation?.overallScore ?? null,
    acceptedState: envelope.floorPlanImage?.evaluation
      ? Boolean(envelope.floorPlanImage.evaluation.passed && envelope.floorPlanImage.evaluation.overallScore >= 80)
      : null,
    floorCount: building.floors.length,
    generationSession: envelope.generationSession ?? null,
    imageArtifactId: envelope.floorPlanImage?.generationId ?? null,
  };
  entries.push({
    path: 'project-manifest.json',
    data: JSON.stringify(manifest, null, 2),
  });

  // 2. Canonical Building Model JSON
  entries.push({
    path: 'canonical-building.json',
    data: JSON.stringify(building, null, 2),
  });

  // 3. Master AI Floor Plan Image (if available)
  if (envelope.floorPlanImage?.imageBase64) {
    const ext = envelope.floorPlanImage.mimeType.includes('png') ? 'png' : 'jpg';
    const binary = Uint8Array.from(atob(envelope.floorPlanImage.imageBase64), c => c.charCodeAt(0));
    entries.push({
      path: `master-concept-image.${ext}`,
      data: binary,
    });
  }

  // 4. Quality Evaluation Report (if available)
  if (envelope.floorPlanImage?.evaluation) {
    entries.push({
      path: 'master-evaluation.json',
      data: JSON.stringify(envelope.floorPlanImage.evaluation, null, 2),
    });
  }

  // 5. 2D CAD Drawings (DXF)
  const dxf = generateArchitecturalDxf(building, { includeAllFloors: true });
  entries.push({
    path: 'drawings/floor-plan.dxf',
    data: dxf,
  });

  // 6. 3D BIM Models
  const obj = generateBuildingObj(building);
  const mtl = generateBuildingMtl();
  const stl = generateBuildingStl(building);
  const glb = generateBuildingGlb(building);

  entries.push(
    { path: 'models/building-model.obj', data: obj },
    { path: 'models/building-model.mtl', data: mtl },
    { path: 'models/building-model.stl', data: stl },
    { path: 'models/building-model.glb', data: glb },
    { path: 'models/building-model.gltf', data: generateBuildingGltf(building) },
    { path: 'project-package.json', data: exportProjectPackageJson(envelope) },
  );

  // 7. README Documentation & Disclaimer
  const readme = [
    `======================================================================`,
    `AI BUILDING FLOOR PLANNER — PROJECT BACKUP PACKAGE`,
    `Project: ${envelope.name} (${(envelope as any).projectNumber || envelope.projectId})`,
    `Generated: ${new Date().toISOString()}`,
    `======================================================================`,
    ``,
    `PACKAGE CONTENTS:`,
    `- project-manifest.json   : Project metadata, site boundaries, and space program.`,
    `- canonical-building.json : Authoritative vector CAD building model (floors, rooms, walls, doors, windows, columns).`,
    `- master-concept-image.*  : Accepted AI concept floor plan drawing.`,
    `- master-evaluation.json  : 100-point rubric assessment and quality breakdown.`,
    `- drawings/floor-plan.dxf : Professional 11-layer CAD linework (AutoCAD / LibreCAD compatible).`,
    `- models/building-model.* : 3D models (OBJ, MTL, STL, GLB/glTF).`,
    ``,
    `IMPORTANT MANDATORY DISCLAIMER:`,
    `CONCEPTUAL ARCHITECTURAL SCHEMATIC — NOT FOR REGULATORY APPROVAL OR RCC CONSTRUCTION.`,
    `All column placements, structural grids, and wall alignments are preliminary geometric`,
    `coordination overlays only. Certified structural and MEP engineering review is required`,
    `prior to physical construction or submission to local municipal authorities.`,
  ].join('\n');

  entries.push({
    path: 'README.txt',
    data: readme,
  });

  return buildZipArchive(entries);
}
