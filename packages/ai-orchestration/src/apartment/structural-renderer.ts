/**
 * High-Resolution, Provider-Independent Structural Plan Renderer.
 *
 * Consumes StructuralPlanRepresentation directly as the sole geometry source.
 * Produces aspect-ratio-aware high-resolution architectural drafting images
 * (PNG ~2048x1536 and clean SVG) suitable as the primary structural reference
 * for downstream diffusion and multimodal models.
 *
 * ZERO AUTHORITATIVE TEXT in production mode:
 * - No room names (BEDROOM, KITCHEN, LIVING, DINING, BATH)
 * - No flat labels (FLAT 01, FLAT 02)
 * - No dimensions or areas
 *
 * Deterministic, byte-reproducible rasterization and vector drafting.
 */

import crypto from 'node:crypto';
import zlib from 'node:zlib';
import type { StructuralPlanRepresentation } from './structural-representation.js';

export const STRUCTURAL_RENDERER_VERSION = '1.0.0';

// ─── Options & Result Types ───────────────────────────────────────────────────

export interface RenderStructuralPlanOptions {
  /** Target resolution for the long side in pixels (default: 2048). */
  readonly targetLongSidePx?: number;
  /** Minimum resolution for the short side in pixels (default: 1536). */
  readonly minShortSidePx?: number;
  /** Margin fraction around the building envelope (default: 0.06 = 6%). */
  readonly marginFraction?: number;
  /** Debug mode: renders IDs and bounding boxes (default: false, zero text in production). */
  readonly debug?: boolean;
}

export interface RenderStructuralPlanResult {
  readonly png: Buffer;
  readonly svg: string;
  readonly width: number;
  readonly height: number;
  readonly boundingBox: {
    readonly minX: number;
    readonly minY: number;
    readonly maxX: number;
    readonly maxY: number;
    readonly width: number;
    readonly height: number;
  };
  readonly rendererVersion: string;
  readonly hash: string;
  readonly sourceRepresentationId: string;
}

export class InvalidStructuralPlanError extends Error {
  readonly code = 'INVALID_STRUCTURAL_PLAN';
  readonly errors: readonly string[];

  constructor(errors: readonly string[]) {
    super(`Invalid StructuralPlanRepresentation: ${errors.join('; ')}`);
    this.name = 'InvalidStructuralPlanError';
    this.errors = errors;
  }
}

// ─── Pre-render Validation ────────────────────────────────────────────────────

export function validateStructuralPlanRepresentation(rep: StructuralPlanRepresentation): {
  readonly valid: boolean;
  readonly errors: readonly string[];
} {
  const errors: string[] = [];
  if (!rep) {
    errors.push('StructuralPlanRepresentation is null or undefined.');
    return { valid: false, errors };
  }
  if (rep.version !== 1) {
    errors.push(`Unsupported representation version: ${rep.version}`);
  }
  if (!rep.buildingFootprint || rep.buildingFootprint.width <= 0 || rep.buildingFootprint.height <= 0) {
    errors.push('Invalid or empty buildingFootprint.');
  }
  if (!rep.outerBuildingWalls || rep.outerBuildingWalls.length < 4) {
    errors.push('Outer building walls missing or incomplete (expected at least 4 segments).');
  }
  if (!rep.flatBoundaries || rep.flatBoundaries.length === 0) {
    errors.push('No flat boundaries defined.');
  }
  if (!rep.commonCore || !rep.commonCore.lobby) {
    errors.push('Common core lobby missing.');
  }
  if (!rep.doors || rep.doors.length === 0) {
    errors.push('No doors or openings defined in structural representation.');
  }
  return { valid: errors.length === 0, errors };
}

// ─── Bounding Box & Viewport Calculation ──────────────────────────────────────

interface BoundingBox2D {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
  readonly width: number;
  readonly height: number;
}

function computeStructuralBoundingBox(rep: StructuralPlanRepresentation): BoundingBox2D {
  let minX = rep.buildingFootprint.x;
  let minY = rep.buildingFootprint.y;
  let maxX = rep.buildingFootprint.x + rep.buildingFootprint.width;
  let maxY = rep.buildingFootprint.y + rep.buildingFootprint.height;

  for (const b of rep.balconies) {
    minX = Math.min(minX, b.bounds.x);
    minY = Math.min(minY, b.bounds.y);
    maxX = Math.max(maxX, b.bounds.x + b.bounds.width);
    maxY = Math.max(maxY, b.bounds.y + b.bounds.height);
  }
  for (const wall of rep.outerBuildingWalls) {
    minX = Math.min(minX, wall.start.x, wall.end.x);
    minY = Math.min(minY, wall.start.y, wall.end.y);
    maxX = Math.max(maxX, wall.start.x, wall.end.x);
    maxY = Math.max(maxY, wall.start.y, wall.end.y);
  }
  for (const u of rep.flatBoundaries) {
    minX = Math.min(minX, u.bounds.x);
    minY = Math.min(minY, u.bounds.y);
    maxX = Math.max(maxX, u.bounds.x + u.bounds.width);
    maxY = Math.max(maxY, u.bounds.y + u.bounds.height);
  }

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  return { minX, minY, maxX, maxY, width, height };
}

interface ViewTransform2D {
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly scale: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly toScreenX: (worldX: number) => number;
  readonly toScreenY: (worldY: number) => number;
}

function computeViewTransform(
  bbox: BoundingBox2D,
  options: RenderStructuralPlanOptions = {},
): ViewTransform2D {
  const targetLongSidePx = options.targetLongSidePx ?? 2048;
  const minShortSidePx = options.minShortSidePx ?? 512;
  const marginFraction = options.marginFraction ?? 0.06;

  const aspect = bbox.width / bbox.height;

  let canvasWidth: number;
  let canvasHeight: number;

  if (aspect >= 1.0) {
    // Landscape or square: long side is width
    canvasWidth = targetLongSidePx;
    canvasHeight = Math.round(targetLongSidePx / aspect);
  } else {
    // Portrait: long side is height
    canvasHeight = targetLongSidePx;
    canvasWidth = Math.round(targetLongSidePx * aspect);
  }

  // Block-align to 16px multiples for neural network tile grids
  canvasWidth = Math.max(minShortSidePx, Math.round(canvasWidth / 16) * 16);
  canvasHeight = Math.max(minShortSidePx, Math.round(canvasHeight / 16) * 16);

  const marginX = canvasWidth * marginFraction;
  const marginY = canvasHeight * marginFraction;
  const usableWidth = canvasWidth - 2 * marginX;
  const usableHeight = canvasHeight - 2 * marginY;

  const scale = Math.min(usableWidth / bbox.width, usableHeight / bbox.height);
  const renderedWidth = bbox.width * scale;
  const renderedHeight = bbox.height * scale;
  const offsetX = (canvasWidth - renderedWidth) / 2 - bbox.minX * scale;
  const offsetY = (canvasHeight - renderedHeight) / 2 - bbox.minY * scale;

  return {
    canvasWidth,
    canvasHeight,
    scale,
    offsetX,
    offsetY,
    toScreenX: (worldX: number) => worldX * scale + offsetX,
    toScreenY: (worldY: number) => worldY * scale + offsetY,
  };
}

// ─── PNG Encoding Helpers (CRC32, Chunk, Deflate) ─────────────────────────────

const CRC_TABLE = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c;
}

function crc32(buf: Buffer): number {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i] ?? 0;
    const lookup = CRC_TABLE[(crc ^ byte) & 0xff] ?? 0;
    crc = (crc >>> 8) ^ lookup;
  }
  return (crc ^ -1) >>> 0;
}

function makePngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  const crcPayload = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(crcPayload), 0);
  return Buffer.concat([lenBuf, crcPayload, crcBuf]);
}

// ─── High-Resolution Rasterizer (PNG Generation) ──────────────────────────────

class StructuralRasterizer {
  private readonly width: number;
  private readonly height: number;
  private readonly rowSize: number;
  private readonly raw: Buffer;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.rowSize = 1 + width * 4;
    // Pure white canvas
    this.raw = Buffer.alloc(height * this.rowSize, 255);
    for (let y = 0; y < height; y++) {
      this.raw[y * this.rowSize] = 0; // Filter type 0 (None)
    }
  }

  setPixel(x: number, y: number, r: number, g: number, b: number): void {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || px >= this.width || py < 0 || py >= this.height) return;
    const offset = py * this.rowSize + 1 + px * 4;
    this.raw[offset] = r;
    this.raw[offset + 1] = g;
    this.raw[offset + 2] = b;
    this.raw[offset + 3] = 255;
  }

  fillRect(rx: number, ry: number, rw: number, rh: number, r: number, g: number, b: number): void {
    const x0 = Math.max(0, Math.min(this.width - 1, Math.round(rx)));
    const y0 = Math.max(0, Math.min(this.height - 1, Math.round(ry)));
    const x1 = Math.max(0, Math.min(this.width - 1, Math.round(rx + rw)));
    const y1 = Math.max(0, Math.min(this.height - 1, Math.round(ry + rh)));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        this.setPixel(x, y, r, g, b);
      }
    }
  }

  drawRectOutline(rx: number, ry: number, rw: number, rh: number, thickness: number, r: number, g: number, b: number): void {
    const x0 = Math.round(rx);
    const y0 = Math.round(ry);
    const x1 = Math.round(rx + rw);
    const y1 = Math.round(ry + rh);

    this.drawLine(x0, y0, x1, y0, r, g, b, thickness);
    this.drawLine(x1, y0, x1, y1, r, g, b, thickness);
    this.drawLine(x1, y1, x0, y1, r, g, b, thickness);
    this.drawLine(x0, y1, x0, y0, r, g, b, thickness);
  }

  drawLine(x0: number, y0: number, x1: number, y1: number, r: number, g: number, b: number, thickness = 1): void {
    let px0 = Math.round(x0);
    let py0 = Math.round(y0);
    const px1 = Math.round(x1);
    const py1 = Math.round(y1);

    const dx = Math.abs(px1 - px0);
    const dy = Math.abs(py1 - py0);
    const sx = px0 < px1 ? 1 : -1;
    const sy = py0 < py1 ? 1 : -1;
    let err = dx - dy;

    const rad = Math.max(0, Math.floor(thickness / 2));

    while (true) {
      if (thickness <= 1) {
        this.setPixel(px0, py0, r, g, b);
      } else {
        for (let ty = -rad; ty <= rad; ty++) {
          for (let tx = -rad; tx <= rad; tx++) {
            this.setPixel(px0 + tx, py0 + ty, r, g, b);
          }
        }
      }

      if (px0 === px1 && py0 === py1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        px0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        py0 += sy;
      }
    }
  }

  drawCross(rx: number, ry: number, rw: number, rh: number, r: number, g: number, b: number, thickness = 1): void {
    const x0 = Math.round(rx);
    const y0 = Math.round(ry);
    const x1 = Math.round(rx + rw);
    const y1 = Math.round(ry + rh);
    this.drawLine(x0, y0, x1, y1, r, g, b, thickness);
    this.drawLine(x1, y0, x0, y1, r, g, b, thickness);
  }

  drawArc(
    cx: number,
    cy: number,
    radius: number,
    startAngleRad: number,
    endAngleRad: number,
    r: number,
    g: number,
    b: number,
    thickness = 1,
    dashed = false,
  ): void {
    const steps = Math.max(20, Math.round(radius * 1.5));
    const angleRange = endAngleRad - startAngleRad;
    for (let i = 0; i <= steps; i++) {
      if (dashed && Math.floor(i / 4) % 2 === 1) continue;
      const angle = startAngleRad + (angleRange * i) / steps;
      const px = cx + radius * Math.cos(angle);
      const py = cy + radius * Math.sin(angle);
      this.setPixel(px, py, r, g, b);
      if (thickness > 1) {
        const rad = Math.floor(thickness / 2);
        for (let ty = -rad; ty <= rad; ty++) {
          for (let tx = -rad; tx <= rad; tx++) {
            this.setPixel(px + tx, py + ty, r, g, b);
          }
        }
      }
    }
  }

  toPng(): Buffer {
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.width, 0);
    ihdr.writeUInt32BE(this.height, 4);
    ihdr[8] = 8; // 8 bits per channel
    ihdr[9] = 6; // Color type 6 (RGBA)
    ihdr[10] = 0; // Compression (deflate)
    ihdr[11] = 0; // Filter (standard)
    ihdr[12] = 0; // Interlace (none)

    const compressed = zlib.deflateSync(this.raw, { level: 1 });
    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      makePngChunk('IHDR', ihdr),
      makePngChunk('IDAT', compressed),
      makePngChunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

// ─── High-Resolution Structural Plan Renderer ─────────────────────────────────

export function renderStructuralPlan(
  rep: StructuralPlanRepresentation,
  options: RenderStructuralPlanOptions = {},
): RenderStructuralPlanResult {
  // 1. Pre-render validation
  const validation = validateStructuralPlanRepresentation(rep);
  if (!validation.valid) {
    throw new InvalidStructuralPlanError(validation.errors);
  }

  // 2. Compute aspect-ratio aware dimensions & transform
  const bbox = computeStructuralBoundingBox(rep);
  const vt = computeViewTransform(bbox, options);
  const { canvasWidth, canvasHeight, scale, toScreenX, toScreenY } = vt;

  const baseStroke = Math.max(1, (canvasWidth + canvasHeight) / 1000);
  const outerWallStroke = Math.max(3, Math.round(baseStroke * 1.6));
  const flatBoundaryStroke = Math.max(2, Math.round(baseStroke * 1.2));
  const partyWallStroke = Math.max(2, Math.round(baseStroke * 1.0));
  const roomPartitionStroke = Math.max(1, Math.round(baseStroke * 0.7));
  const coreStroke = Math.max(2, Math.round(baseStroke * 0.9));
  const stairTreadStroke = Math.max(1, Math.round(baseStroke * 0.4));
  const doorStroke = Math.max(1, Math.round(baseStroke * 0.7));

  // 3. Initialize Rasterizer for PNG
  const rasterizer = new StructuralRasterizer(canvasWidth, canvasHeight);

  // Colors (RGB)
  const COL_CANVAS = { r: 255, g: 255, b: 255 }; // #FFFFFF
  const COL_LOBBY_FILL = { r: 243, g: 244, b: 246 }; // #F3F4F6
  const COL_BALCONY_FILL = { r: 250, g: 250, b: 250 }; // #FAFAFA
  const COL_WALL_OUTER = { r: 17, g: 24, b: 39 }; // #111827
  const COL_WALL_PARTY = { r: 31, g: 41, b: 55 }; // #1F2937
  const COL_WALL_INTERIOR = { r: 55, g: 65, b: 81 }; // #374151
  const COL_DOOR = { r: 31, g: 41, b: 55 }; // #1F2937
  const COL_DOOR_ARC = { r: 107, g: 114, b: 128 }; // #6B7280
  const COL_CORE_DETAIL = { r: 75, g: 85, b: 99 }; // #4B5563
  const COL_DUCT_HATCH = { r: 156, g: 163, b: 175 }; // #9CA3AF

  // SVG Elements Accumulator
  const svgElements: string[] = [];

  // ── Step A: Common Core Fills (Lobby & Corridors) ───────────────────────────
  const lobbyB = rep.commonCore.lobby.bounds;
  const lobbySx = toScreenX(lobbyB.x);
  const lobbySy = toScreenY(lobbyB.y);
  const lobbySw = lobbyB.width * scale;
  const lobbySh = lobbyB.height * scale;

  rasterizer.fillRect(lobbySx, lobbySy, lobbySw, lobbySh, COL_LOBBY_FILL.r, COL_LOBBY_FILL.g, COL_LOBBY_FILL.b);
  svgElements.push(
    `<rect class="common-lobby" x="${lobbySx.toFixed(1)}" y="${lobbySy.toFixed(1)}" width="${lobbySw.toFixed(1)}" height="${lobbySh.toFixed(1)}" fill="#F3F4F6" stroke="#1F2937" stroke-width="${coreStroke}" />`,
  );

  for (const c of rep.commonCore.circulationBoundaries) {
    const csx = toScreenX(c.bounds.x);
    const csy = toScreenY(c.bounds.y);
    const csw = c.bounds.width * scale;
    const csh = c.bounds.height * scale;
    rasterizer.fillRect(csx, csy, csw, csh, COL_LOBBY_FILL.r, COL_LOBBY_FILL.g, COL_LOBBY_FILL.b);
    svgElements.push(
      `<rect class="common-corridor" x="${csx.toFixed(1)}" y="${csy.toFixed(1)}" width="${csw.toFixed(1)}" height="${csh.toFixed(1)}" fill="#F3F4F6" stroke="#1F2937" stroke-width="${coreStroke}" />`,
    );
  }

  // ── Step B: Balconies ───────────────────────────────────────────────────────
  for (const bal of rep.balconies) {
    const bsx = toScreenX(bal.bounds.x);
    const bsy = toScreenY(bal.bounds.y);
    const bsw = bal.bounds.width * scale;
    const bsh = bal.bounds.height * scale;

    rasterizer.fillRect(bsx, bsy, bsw, bsh, COL_BALCONY_FILL.r, COL_BALCONY_FILL.g, COL_BALCONY_FILL.b);
    rasterizer.drawRectOutline(bsx, bsy, bsw, bsh, Math.max(1, Math.round(roomPartitionStroke * 0.8)), COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b);

    svgElements.push(
      `<rect class="balcony" x="${bsx.toFixed(1)}" y="${bsy.toFixed(1)}" width="${bsw.toFixed(1)}" height="${bsh.toFixed(1)}" fill="#FAFAFA" stroke="#4B5563" stroke-width="${Math.max(1, Math.round(roomPartitionStroke * 0.8))}" stroke-dasharray="4,2" />`,
    );
  }

  // ── Step C: Private Rooms (White Background & Partitions) ───────────────────
  for (const room of rep.roomBoundaries) {
    const rsx = toScreenX(room.bounds.x);
    const rsy = toScreenY(room.bounds.y);
    const rsw = room.bounds.width * scale;
    const rsh = room.bounds.height * scale;

    // Fill white
    rasterizer.fillRect(rsx, rsy, rsw, rsh, COL_CANVAS.r, COL_CANVAS.g, COL_CANVAS.b);
    rasterizer.drawRectOutline(rsx, rsy, rsw, rsh, roomPartitionStroke, COL_WALL_INTERIOR.r, COL_WALL_INTERIOR.g, COL_WALL_INTERIOR.b);

    svgElements.push(
      `<rect class="room-partition" x="${rsx.toFixed(1)}" y="${rsy.toFixed(1)}" width="${rsw.toFixed(1)}" height="${rsh.toFixed(1)}" fill="#FFFFFF" stroke="#374151" stroke-width="${roomPartitionStroke}" />`,
    );
  }

  // ── Step D: Flat Boundaries (Strong Unit Differentiation) ───────────────────
  for (const flat of rep.flatBoundaries) {
    const fsx = toScreenX(flat.bounds.x);
    const fsy = toScreenY(flat.bounds.y);
    const fsw = flat.bounds.width * scale;
    const fsh = flat.bounds.height * scale;

    rasterizer.drawRectOutline(fsx, fsy, fsw, fsh, flatBoundaryStroke, COL_WALL_PARTY.r, COL_WALL_PARTY.g, COL_WALL_PARTY.b);
    svgElements.push(
      `<rect class="flat-boundary" x="${fsx.toFixed(1)}" y="${fsy.toFixed(1)}" width="${fsw.toFixed(1)}" height="${fsh.toFixed(1)}" fill="none" stroke="#1F2937" stroke-width="${flatBoundaryStroke}" />`,
    );
  }

  // ── Step D2: Major Party Walls ──────────────────────────────────────────────
  for (const part of rep.majorPartitions) {
    if (part.classification === 'party_wall') {
      const x0 = toScreenX(part.start.x);
      const y0 = toScreenY(part.start.y);
      const x1 = toScreenX(part.end.x);
      const y1 = toScreenY(part.end.y);
      rasterizer.drawLine(x0, y0, x1, y1, COL_WALL_PARTY.r, COL_WALL_PARTY.g, COL_WALL_PARTY.b, partyWallStroke);
      svgElements.push(
        `<line class="party-wall" x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#1F2937" stroke-width="${partyWallStroke}" />`,
      );
    }
  }

  // ── Step E: Core Elements — Stairs ──────────────────────────────────────────
  for (const s of rep.commonCore.stairs) {
    const sx = toScreenX(s.bounds.x);
    const sy = toScreenY(s.bounds.y);
    const sw = s.bounds.width * scale;
    const sh = s.bounds.height * scale;

    // White stair well background with strong border
    rasterizer.fillRect(sx, sy, sw, sh, COL_CANVAS.r, COL_CANVAS.g, COL_CANVAS.b);
    rasterizer.drawRectOutline(sx, sy, sw, sh, coreStroke, COL_WALL_OUTER.r, COL_WALL_OUTER.g, COL_WALL_OUTER.b);

    svgElements.push(
      `<rect class="stair-well" x="${sx.toFixed(1)}" y="${sy.toFixed(1)}" width="${sw.toFixed(1)}" height="${sh.toFixed(1)}" fill="#FFFFFF" stroke="#111827" stroke-width="${coreStroke}" />`,
    );

    // Architectural stair drafting: central well divider + treads + landing
    if (sh >= sw) {
      // Vertical flight direction
      const midX = sx + sw / 2;
      const landingH = Math.min(sh * 0.22, 1.2 * scale);

      // Central dividing wall / well
      rasterizer.drawLine(midX, sy + landingH, midX, sy + sh, COL_WALL_PARTY.r, COL_WALL_PARTY.g, COL_WALL_PARTY.b, coreStroke);
      svgElements.push(
        `<line class="stair-divider" x1="${midX.toFixed(1)}" y1="${(sy + landingH).toFixed(1)}" x2="${midX.toFixed(1)}" y2="${(sy + sh).toFixed(1)}" stroke="#1F2937" stroke-width="${coreStroke}" />`,
      );

      // Landing boundary
      rasterizer.drawLine(sx, sy + landingH, sx + sw, sy + landingH, COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b, Math.max(1, Math.round(stairTreadStroke * 1.2)));
      svgElements.push(
        `<line class="stair-landing" x1="${sx.toFixed(1)}" y1="${(sy + landingH).toFixed(1)}" x2="${(sx + sw).toFixed(1)}" y2="${(sy + landingH).toFixed(1)}" stroke="#4B5563" stroke-width="${stairTreadStroke}" />`,
      );

      // Treads across flight 1 and flight 2
      const treadCount = 9;
      const treadStep = (sh - landingH) / (treadCount + 1);
      for (let t = 1; t <= treadCount; t++) {
        const ty = sy + landingH + t * treadStep;
        // Flight 1 treads (left)
        rasterizer.drawLine(sx, ty, midX - 2, ty, COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b, stairTreadStroke);
        // Flight 2 treads (right)
        rasterizer.drawLine(midX + 2, ty, sx + sw, ty, COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b, stairTreadStroke);
        svgElements.push(
          `<line class="stair-tread" x1="${sx.toFixed(1)}" y1="${ty.toFixed(1)}" x2="${(midX - 2).toFixed(1)}" y2="${ty.toFixed(1)}" stroke="#4B5563" stroke-width="${stairTreadStroke}" />`,
          `<line class="stair-tread" x1="${(midX + 2).toFixed(1)}" y1="${ty.toFixed(1)}" x2="${(sx + sw).toFixed(1)}" y2="${ty.toFixed(1)}" stroke="#4B5563" stroke-width="${stairTreadStroke}" />`,
        );
      }
    } else {
      // Horizontal flight direction
      const midY = sy + sh / 2;
      const landingW = Math.min(sw * 0.22, 1.2 * scale);

      rasterizer.drawLine(sx + landingW, midY, sx + sw, midY, COL_WALL_PARTY.r, COL_WALL_PARTY.g, COL_WALL_PARTY.b, coreStroke);
      svgElements.push(
        `<line class="stair-divider" x1="${(sx + landingW).toFixed(1)}" y1="${midY.toFixed(1)}" x2="${(sx + sw).toFixed(1)}" y2="${midY.toFixed(1)}" stroke="#1F2937" stroke-width="${coreStroke}" />`,
      );

      rasterizer.drawLine(sx + landingW, sy, sx + landingW, sy + sh, COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b, Math.max(1, Math.round(stairTreadStroke * 1.2)));
      svgElements.push(
        `<line class="stair-landing" x1="${(sx + landingW).toFixed(1)}" y1="${sy.toFixed(1)}" x2="${(sx + landingW).toFixed(1)}" y2="${(sy + sh).toFixed(1)}" stroke="#4B5563" stroke-width="${stairTreadStroke}" />`,
      );

      const treadCount = 9;
      const treadStep = (sw - landingW) / (treadCount + 1);
      for (let t = 1; t <= treadCount; t++) {
        const tx = sx + landingW + t * treadStep;
        rasterizer.drawLine(tx, sy, tx, midY - 2, COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b, stairTreadStroke);
        rasterizer.drawLine(tx, midY + 2, tx, sy + sh, COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b, stairTreadStroke);
        svgElements.push(
          `<line class="stair-tread" x1="${tx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${(midY - 2).toFixed(1)}" stroke="#4B5563" stroke-width="${stairTreadStroke}" />`,
          `<line class="stair-tread" x1="${tx.toFixed(1)}" y1="${(midY + 2).toFixed(1)}" x2="${tx.toFixed(1)}" y2="${(sy + sh).toFixed(1)}" stroke="#4B5563" stroke-width="${stairTreadStroke}" />`,
        );
      }
    }
  }

  // ── Step F: Core Elements — Lifts (Shaft + Diagonal Cross X) ────────────────
  for (const l of rep.commonCore.lifts) {
    const lx = toScreenX(l.bounds.x);
    const ly = toScreenY(l.bounds.y);
    const lw = l.bounds.width * scale;
    const lh = l.bounds.height * scale;

    // Lift shaft rectangle
    rasterizer.fillRect(lx, ly, lw, lh, COL_CANVAS.r, COL_CANVAS.g, COL_CANVAS.b);
    rasterizer.drawRectOutline(lx, ly, lw, lh, coreStroke, COL_WALL_OUTER.r, COL_WALL_OUTER.g, COL_WALL_OUTER.b);

    // Diagonal Cross X
    rasterizer.drawCross(lx, ly, lw, lh, COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b, Math.max(1, Math.round(coreStroke * 0.75)));

    svgElements.push(
      `<rect class="lift-shaft" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" width="${lw.toFixed(1)}" height="${lh.toFixed(1)}" fill="#FFFFFF" stroke="#111827" stroke-width="${coreStroke}" />`,
      `<line class="lift-cross" x1="${lx.toFixed(1)}" y1="${ly.toFixed(1)}" x2="${(lx + lw).toFixed(1)}" y2="${(ly + lh).toFixed(1)}" stroke="#4B5563" stroke-width="${Math.max(1, Math.round(coreStroke * 0.75))}" />`,
      `<line class="lift-cross" x1="${(lx + lw).toFixed(1)}" y1="${ly.toFixed(1)}" x2="${lx.toFixed(1)}" y2="${(ly + lh).toFixed(1)}" stroke="#4B5563" stroke-width="${Math.max(1, Math.round(coreStroke * 0.75))}" />`,
    );
  }

  // ── Step G: Core Elements — Ducts / Service Shafts ──────────────────────────
  for (const d of rep.commonCore.ducts) {
    const dx = toScreenX(d.bounds.x);
    const dy = toScreenY(d.bounds.y);
    const dw = d.bounds.width * scale;
    const dh = d.bounds.height * scale;

    rasterizer.fillRect(dx, dy, dw, dh, COL_LOBBY_FILL.r, COL_LOBBY_FILL.g, COL_LOBBY_FILL.b);
    rasterizer.drawRectOutline(dx, dy, dw, dh, Math.max(1, Math.round(coreStroke * 0.7)), COL_WALL_PARTY.r, COL_WALL_PARTY.g, COL_WALL_PARTY.b);
    // Single diagonal slash to distinguish from lift X
    rasterizer.drawLine(dx, dy, dx + dw, dy + dh, COL_DUCT_HATCH.r, COL_DUCT_HATCH.g, COL_DUCT_HATCH.b, 1);

    svgElements.push(
      `<rect class="service-duct" x="${dx.toFixed(1)}" y="${dy.toFixed(1)}" width="${dw.toFixed(1)}" height="${dh.toFixed(1)}" fill="#F3F4F6" stroke="#1F2937" stroke-width="${Math.max(1, Math.round(coreStroke * 0.7))}" />`,
      `<line class="duct-slash" x1="${dx.toFixed(1)}" y1="${dy.toFixed(1)}" x2="${(dx + dw).toFixed(1)}" y2="${(dy + dh).toFixed(1)}" stroke="#9CA3AF" stroke-width="1.5" />`,
    );
  }

  // ── Step H: Outer Building Boundary Walls (Strongest Line) ──────────────────
  const fp = rep.buildingFootprint;
  const fpx = toScreenX(fp.x);
  const fpy = toScreenY(fp.y);
  const fpw = fp.width * scale;
  const fph = fp.height * scale;

  rasterizer.drawRectOutline(fpx, fpy, fpw, fph, outerWallStroke, COL_WALL_OUTER.r, COL_WALL_OUTER.g, COL_WALL_OUTER.b);
  svgElements.push(
    `<rect class="outer-building-boundary" x="${fpx.toFixed(1)}" y="${fpy.toFixed(1)}" width="${fpw.toFixed(1)}" height="${fph.toFixed(1)}" fill="none" stroke="#111827" stroke-width="${outerWallStroke}" stroke-linejoin="miter" stroke-linecap="square" />`,
  );

  // ── Step I: Doors & Openings (Opening Clear, Leaf Line, Swing Arc) ───────────
  for (const door of rep.doors) {
    const cx = toScreenX(door.center.x);
    const cy = toScreenY(door.center.y);
    const dWidthPx = door.widthM * scale;
    const isEntrance = door.kind === 'flat_entrance';
    const dStroke = isEntrance ? Math.max(2, Math.round(doorStroke * 1.3)) : doorStroke;

    if (door.wallAxis === 'x') {
      // Wall runs along X; door leaf swings along Y
      const x0 = cx - dWidthPx / 2;
      const x1 = cx + dWidthPx / 2;

      // Clear wall opening with white
      rasterizer.drawLine(x0, cy, x1, cy, COL_CANVAS.r, COL_CANVAS.g, COL_CANVAS.b, outerWallStroke + 2);
      svgElements.push(
        `<line class="door-opening-cut" x1="${x0.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${cy.toFixed(1)}" stroke="#FFFFFF" stroke-width="${outerWallStroke + 2}" />`,
      );

      if (door.doorType === 'open_passage') {
        // Cased opening: jamb ticks
        rasterizer.drawLine(x0, cy - 4, x0, cy + 4, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        rasterizer.drawLine(x1, cy - 4, x1, cy + 4, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        svgElements.push(
          `<line class="jamb" x1="${x0.toFixed(1)}" y1="${(cy - 4).toFixed(1)}" x2="${x0.toFixed(1)}" y2="${(cy + 4).toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`,
          `<line class="jamb" x1="${x1.toFixed(1)}" y1="${(cy - 4).toFixed(1)}" x2="${x1.toFixed(1)}" y2="${(cy + 4).toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`,
        );
      } else if (door.doorType === 'sliding') {
        // Sliding door: two offset overlapping panels
        const half = dWidthPx * 0.55;
        rasterizer.drawLine(x0, cy - 2, x0 + half, cy - 2, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        rasterizer.drawLine(x1 - half, cy + 2, x1, cy + 2, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        svgElements.push(
          `<line class="sliding-panel" x1="${x0.toFixed(1)}" y1="${(cy - 2).toFixed(1)}" x2="${(x0 + half).toFixed(1)}" y2="${(cy - 2).toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`,
          `<line class="sliding-panel" x1="${(x1 - half).toFixed(1)}" y1="${(cy + 2).toFixed(1)}" x2="${x1.toFixed(1)}" y2="${(cy + 2).toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`,
        );
      } else {
        // Standard single swing door (hinged at x0, swing inward towards +Y or -Y)
        const signY = door.swing === 'outward' ? -1 : 1;
        const leafTipX = x0;
        const leafTipY = cy + signY * dWidthPx;

        // Leaf line
        rasterizer.drawLine(x0, cy, leafTipX, leafTipY, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);

        // 90-degree swing arc from (x1, cy) to (leafTipX, leafTipY)
        const startRad = 0;
        const endRad = signY > 0 ? Math.PI / 2 : -Math.PI / 2;
        rasterizer.drawArc(x0, cy, dWidthPx, Math.min(startRad, endRad), Math.max(startRad, endRad), COL_DOOR_ARC.r, COL_DOOR_ARC.g, COL_DOOR_ARC.b, 1, true);

        const sweepFlag = signY > 0 ? 1 : 0;
        svgElements.push(
          `<line class="door-leaf" x1="${x0.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${leafTipX.toFixed(1)}" y2="${leafTipY.toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`,
          `<path class="door-arc" d="M ${x1.toFixed(1)} ${cy.toFixed(1)} A ${dWidthPx.toFixed(1)} ${dWidthPx.toFixed(1)} 0 0 ${sweepFlag} ${leafTipX.toFixed(1)} ${leafTipY.toFixed(1)}" fill="none" stroke="#6B7280" stroke-width="1.5" stroke-dasharray="4,3" />`,
        );
      }
    } else {
      // Wall runs along Y; door leaf swings along X
      const y0 = cy - dWidthPx / 2;
      const y1 = cy + dWidthPx / 2;

      rasterizer.drawLine(cx, y0, cx, y1, COL_CANVAS.r, COL_CANVAS.g, COL_CANVAS.b, outerWallStroke + 2);
      svgElements.push(
        `<line class="door-opening-cut" x1="${cx.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#FFFFFF" stroke-width="${outerWallStroke + 2}" />`,
      );

      if (door.doorType === 'open_passage') {
        rasterizer.drawLine(cx - 4, y0, cx + 4, y0, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        rasterizer.drawLine(cx - 4, y1, cx + 4, y1, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        svgElements.push(
          `<line class="jamb" x1="${(cx - 4).toFixed(1)}" y1="${y0.toFixed(1)}" x2="${(cx + 4).toFixed(1)}" y2="${y0.toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`,
          `<line class="jamb" x1="${(cx - 4).toFixed(1)}" y1="${y1.toFixed(1)}" x2="${(cx + 4).toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`,
        );
      } else if (door.doorType === 'sliding') {
        const half = dWidthPx * 0.55;
        rasterizer.drawLine(cx - 2, y0, cx - 2, y0 + half, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        rasterizer.drawLine(cx + 2, y1 - half, cx + 2, y1, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        svgElements.push(
          `<line class="sliding-panel" x1="${(cx - 2).toFixed(1)}" y1="${y0.toFixed(1)}" x2="${(cx - 2).toFixed(1)}" y2="${(y0 + half).toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`,
          `<line class="sliding-panel" x1="${(cx + 2).toFixed(1)}" y1="${(y1 - half).toFixed(1)}" x2="${(cx + 2).toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`,
        );
      } else {
        const signX = door.swing === 'outward' ? -1 : 1;
        const leafTipX = cx + signX * dWidthPx;
        const leafTipY = y0;

        rasterizer.drawLine(cx, y0, leafTipX, leafTipY, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);

        const startRad = Math.PI / 2;
        const endRad = signX > 0 ? 0 : Math.PI;
        rasterizer.drawArc(cx, y0, dWidthPx, Math.min(startRad, endRad), Math.max(startRad, endRad), COL_DOOR_ARC.r, COL_DOOR_ARC.g, COL_DOOR_ARC.b, 1, true);

        const sweepFlag = signX > 0 ? 0 : 1;
        svgElements.push(
          `<line class="door-leaf" x1="${cx.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${leafTipX.toFixed(1)}" y2="${leafTipY.toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`,
          `<path class="door-arc" d="M ${cx.toFixed(1)} ${y1.toFixed(1)} A ${dWidthPx.toFixed(1)} ${dWidthPx.toFixed(1)} 0 0 ${sweepFlag} ${leafTipX.toFixed(1)} ${leafTipY.toFixed(1)}" fill="none" stroke="#6B7280" stroke-width="1.5" stroke-dasharray="4,3" />`,
        );
      }
    }
  }

  // ── Step J: Optional Debug Overlays (ONLY if explicitly requested) ──────────
  if (options.debug) {
    const debugSvg: string[] = [];
    for (const room of rep.roomBoundaries) {
      const rx = toScreenX(room.bounds.x + room.bounds.width / 2);
      const ry = toScreenY(room.bounds.y + room.bounds.height / 2);
      debugSvg.push(
        `<text x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" font-family="monospace" font-size="12" fill="#DC2626" text-anchor="middle" dominant-baseline="middle">${room.id}</text>`,
      );
    }
    for (const flat of rep.flatBoundaries) {
      const fx = toScreenX(flat.bounds.x + 1.0);
      const fy = toScreenY(flat.bounds.y + 1.0);
      debugSvg.push(
        `<text x="${fx.toFixed(1)}" y="${fy.toFixed(1)}" font-family="monospace" font-size="14" font-weight="bold" fill="#2563EB">${flat.id}</text>`,
      );
    }
    svgElements.push(`<g id="debug-overlay">${debugSvg.join('')}</g>`);
  }

  // ── Step K: Finalize SVG Document ──────────────────────────────────────────
  const svgContent = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasWidth} ${canvasHeight}" width="${canvasWidth}" height="${canvasHeight}">`,
    `  <rect width="100%" height="100%" fill="#FFFFFF" />`,
    `  <g id="structural-geometry">`,
    `    ${svgElements.join('\n    ')}`,
    `  </g>`,
    `</svg>`,
  ].join('\n');

  // ── Step L: Finalize PNG Buffer & Deterministic Hash ────────────────────────
  const pngBuffer = rasterizer.toPng();
  const hash = crypto.createHash('sha256').update(pngBuffer).digest('hex');

  return {
    png: pngBuffer,
    svg: svgContent,
    width: canvasWidth,
    height: canvasHeight,
    boundingBox: bbox,
    rendererVersion: STRUCTURAL_RENDERER_VERSION,
    hash,
    sourceRepresentationId: `structural_v${rep.version}`,
  };
}
