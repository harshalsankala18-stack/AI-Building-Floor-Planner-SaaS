import zlib from 'node:zlib';
import type { DeterministicApartmentSchematic } from '../types/apartment.js';

function crc32(buf: Buffer): number {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i] ?? 0;
    const lookup = table[(crc ^ byte) & 0xff] ?? 0;
    crc = (crc >>> 8) ^ lookup;
  }
  return (crc ^ -1) >>> 0;
}

const table = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  table[i] = c;
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

/**
 * Clean 5x7 ASCII bitmap font for crisp, high-contrast orthographic architectural text labels.
 * Each character is represented by 5 columns of 7 bits (bit 0 = top row, bit 6 = bottom row).
 */
const FONT_5X7: Record<string, number[]> = {
  ' ': [0x00, 0x00, 0x00, 0x00, 0x00],
  '!': [0x00, 0x00, 0x5F, 0x00, 0x00],
  '(': [0x00, 0x1C, 0x22, 0x41, 0x00],
  ')': [0x00, 0x41, 0x22, 0x1C, 0x00],
  '+': [0x08, 0x08, 0x3E, 0x08, 0x08],
  ',': [0x00, 0x50, 0x30, 0x00, 0x00],
  '-': [0x08, 0x08, 0x08, 0x08, 0x08],
  '.': [0x00, 0x60, 0x60, 0x00, 0x00],
  '/': [0x20, 0x10, 0x08, 0x04, 0x02],
  '0': [0x3E, 0x51, 0x49, 0x45, 0x3E],
  '1': [0x00, 0x42, 0x7F, 0x40, 0x00],
  '2': [0x42, 0x61, 0x51, 0x49, 0x46],
  '3': [0x21, 0x41, 0x45, 0x4B, 0x31],
  '4': [0x18, 0x14, 0x12, 0x7F, 0x10],
  '5': [0x27, 0x45, 0x45, 0x45, 0x39],
  '6': [0x3C, 0x4A, 0x49, 0x49, 0x30],
  '7': [0x01, 0x71, 0x09, 0x05, 0x03],
  '8': [0x36, 0x49, 0x49, 0x49, 0x36],
  '9': [0x06, 0x49, 0x49, 0x29, 0x1E],
  ':': [0x00, 0x36, 0x36, 0x00, 0x00],
  '[': [0x00, 0x7F, 0x41, 0x41, 0x00],
  ']': [0x00, 0x41, 0x41, 0x7F, 0x00],
  'A': [0x7E, 0x11, 0x11, 0x11, 0x7E],
  'B': [0x7F, 0x49, 0x49, 0x49, 0x36],
  'C': [0x3E, 0x41, 0x41, 0x41, 0x22],
  'D': [0x7F, 0x41, 0x41, 0x22, 0x1C],
  'E': [0x7F, 0x49, 0x49, 0x49, 0x41],
  'F': [0x7F, 0x09, 0x09, 0x09, 0x01],
  'G': [0x3E, 0x41, 0x49, 0x49, 0x7A],
  'H': [0x7F, 0x08, 0x08, 0x08, 0x7F],
  'I': [0x00, 0x41, 0x7F, 0x41, 0x00],
  'J': [0x20, 0x40, 0x41, 0x3F, 0x01],
  'K': [0x7F, 0x08, 0x14, 0x22, 0x41],
  'L': [0x7F, 0x40, 0x40, 0x40, 0x40],
  'M': [0x7F, 0x02, 0x0C, 0x02, 0x7F],
  'N': [0x7F, 0x04, 0x08, 0x10, 0x7F],
  'O': [0x3E, 0x41, 0x41, 0x41, 0x3E],
  'P': [0x7F, 0x09, 0x09, 0x09, 0x06],
  'Q': [0x3E, 0x41, 0x51, 0x21, 0x5E],
  'R': [0x7F, 0x09, 0x19, 0x29, 0x46],
  'S': [0x46, 0x49, 0x49, 0x49, 0x31],
  'T': [0x01, 0x01, 0x7F, 0x01, 0x01],
  'U': [0x3F, 0x40, 0x40, 0x40, 0x3F],
  'V': [0x1F, 0x20, 0x40, 0x20, 0x1F],
  'W': [0x7F, 0x20, 0x18, 0x20, 0x7F],
  'X': [0x63, 0x14, 0x08, 0x14, 0x63],
  'Y': [0x07, 0x08, 0x70, 0x08, 0x07],
  'Z': [0x61, 0x51, 0x49, 0x45, 0x43],
};

function getRoomAbbreviation(name: string, type: string): { full: string; short: string } {
  const norm = `${name} ${type}`.toLowerCase();
  // Wet rooms first: "Master Toilet (En-suite)" must never be labelled as a bedroom (Phase 4 fix).
  if (norm.includes('bath') || norm.includes('toilet') || norm.includes('powder')) return { full: 'BATH', short: 'WC' };
  // "Dry Balcony / Utility" is the utility, not a balcony.
  if (type === 'utility' || norm.includes('utility')) return { full: 'UTILITY', short: 'UTIL' };
  if (type === 'passage' || norm.includes('passage')) return { full: 'PASSAGE', short: 'PASS' };
  if (type === 'dress' || norm.includes('dressing')) return { full: 'DRESS', short: 'DR' };
  if (type === 'store' || norm.includes('store')) return { full: 'STORE', short: 'ST' };
  if (type === 'study' || norm.includes('study')) return { full: 'STUDY', short: 'STDY' };
  if (norm.includes('master') && norm.includes('bed')) return { full: 'MASTER BED', short: 'M.BED' };
  if (norm.includes('bed')) return { full: 'BEDROOM', short: 'BED' };
  // A combined living & dining room is labelled as both, matching the manifest program.
  if (norm.includes('living') && norm.includes('dining')) return { full: 'LIVING/DINING', short: 'LIV/DIN' };
  if (norm.includes('living')) return { full: 'LIVING', short: 'LIV' };
  if (norm.includes('dining')) return { full: 'DINING', short: 'DIN' };
  if (norm.includes('kitchen')) return { full: 'KITCHEN', short: 'KIT' };
  if (norm.includes('balcony') || norm.includes('terrace') || norm.includes('sit-out')) return { full: 'BALCONY', short: 'BALC' };
  if (norm.includes('utility') || norm.includes('wash') || norm.includes('dry')) return { full: 'UTILITY', short: 'UTIL' };
  if (norm.includes('pooja') || norm.includes('puja')) return { full: 'POOJA', short: 'PUJA' };
  if (norm.includes('foyer') || norm.includes('entry')) return { full: 'FOYER', short: 'ENT' };
  if (norm.includes('duct') || norm.includes('shaft') || norm.includes('ots')) return { full: 'DUCT', short: 'DUCT' };
  const fallback = name.toUpperCase().slice(0, 8);
  return { full: fallback, short: fallback.slice(0, 4) };
}

/**
 * How the schematic PNG is drawn.
 * - `base_plan` (default, unchanged): the deterministic base plan read directly by Gemini (fallback path).
 * - `flux_concept`: the structural scaffold sent to FLUX as input image 1 (Phase 2). Self-explanatory
 *   symbols (tread-and-divider stairs, X lift shafts, filled ducts, tinted common lobby, heavy flat walls)
 *   and a short label vocabulary so the layout survives FLUX's weak text rendering.
 */
export type SchematicRenderMode = 'base_plan' | 'flux_concept';

export interface DrawnSchematicLabel {
  readonly text: string;
  readonly kind: 'flat' | 'unit_type' | 'room' | 'core';
  readonly flatId?: string;
  readonly spaceId?: string;
  /** Glyph scale actually used (1 = 5x7 px, 2 = 10x14 px). */
  readonly scale: number;
}

export interface RenderSchematicOptions {
  readonly mode?: SchematicRenderMode;
  /** Receives every text label actually drawn (tests / diagnostics). Does not affect pixels. */
  readonly onLabel?: (label: DrawnSchematicLabel) => void;
}

/** Room words the FLUX scaffold may draw (Phase 2 short-label strategy), plus their short fallbacks. */
export const FLUX_CONCEPT_ROOM_LABELS = ['LIVING', 'DINING', 'KITCHEN', 'BEDROOM', 'BATH', 'UTILITY', 'FOYER', 'POOJA', 'STUDY'] as const;
export const FLUX_CONCEPT_SHORT_FALLBACKS = ['BED', 'WC', 'KIT', 'UTIL'] as const;
export const FLUX_CONCEPT_CORE_LABELS = ['LIFT', 'STAIR', 'LOBBY'] as const;

/**
 * Short-label strategy for the FLUX scaffold. Returns the text lines for a room
 * (preferred, then a shorter fallback), or null when the space is drawn WITHOUT
 * text: dressing, passage, store, balconies and ducts are communicated by
 * geometry/pattern only, so FLUX is never asked to render words that are not
 * essential to reading the programme.
 */
export function fluxConceptRoomLabel(name: string, type: string): { readonly lines: readonly string[]; readonly fallback: readonly string[] | null } | null {
  const norm = `${name} ${type}`.toLowerCase();
  if (norm.includes('bath') || norm.includes('toilet') || norm.includes('powder')) return { lines: ['BATH'], fallback: ['WC'] };
  if (type === 'utility' || norm.includes('utility') || norm.includes('wash')) return { lines: ['UTILITY'], fallback: ['UTIL'] };
  if (type === 'passage' || norm.includes('passage') || type === 'dress' || norm.includes('dress')) return null;
  if (type === 'store' || norm.includes('store')) return null;
  if (norm.includes('balcony') || norm.includes('terrace') || norm.includes('sit-out')) return null;
  if (norm.includes('duct') || norm.includes('shaft') || norm.includes('ots')) return null;
  if (type === 'study' || norm.includes('study')) return { lines: ['STUDY'], fallback: null };
  if (norm.includes('pooja') || norm.includes('puja')) return { lines: ['POOJA'], fallback: null };
  if (norm.includes('bed')) return { lines: ['BEDROOM'], fallback: ['BED'] };
  if (norm.includes('living') && norm.includes('dining')) return { lines: ['LIVING', 'DINING'], fallback: null };
  if (norm.includes('living')) return { lines: ['LIVING'], fallback: null };
  if (norm.includes('dining')) return { lines: ['DINING'], fallback: null };
  if (norm.includes('kitchen')) return { lines: ['KITCHEN'], fallback: ['KIT'] };
  if (norm.includes('foyer') || norm.includes('entry')) return { lines: ['FOYER'], fallback: null };
  return null;
}

/**
 * Deterministically renders a 512x512 line-based architectural drawing PNG of the apartment schematic.
 * Phase 2 recovery (P6, §6, §7):
 * - Simple, high-contrast, line-based, orthographic, architecturally recognizable.
 * - Solid black walls, party-wall separation, room partitions.
 * - Elevator shafts marked with classic architectural [X] symbol and LIFT labels.
 * - Staircases marked with tread lines (hatching) and STAIR labels.
 * - Units clearly labelled FLAT 01, FLAT 02, etc., along with unit types.
 * - Internal rooms labelled LIVING, DINING, KITCHEN, MASTER BED, BEDROOM, BATH, etc.
 * - Pure white background, no colored blobs or decorative clutter.
 */
export function renderSchematicPng512(schematic: DeterministicApartmentSchematic, options: RenderSchematicOptions = {}): Buffer {
  const width = 512;
  const height = 512;
  const flux = options.mode === 'flux_concept';
  const emit = (label: DrawnSchematicLabel) => options.onLabel?.(label);

  // RGBA buffer: 4 bytes per pixel. Each row has 1 filter byte (0) + width * 4 bytes
  const rowSize = 1 + width * 4;
  const raw = Buffer.alloc(height * rowSize, 255); // Default background pure white

  for (let y = 0; y < height; y++) {
    raw[y * rowSize] = 0; // Filter type 0 (None)
  }

  function setPixel(x: number, y: number, r: number, g: number, b: number) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const offset = y * rowSize + 1 + x * 4;
    raw[offset] = r;
    raw[offset + 1] = g;
    raw[offset + 2] = b;
    raw[offset + 3] = 255;
  }

  function fillRect(rx: number, ry: number, rw: number, rh: number, r: number, g: number, b: number) {
    const x0 = Math.max(0, Math.min(width - 1, Math.round(rx)));
    const y0 = Math.max(0, Math.min(height - 1, Math.round(ry)));
    const x1 = Math.max(0, Math.min(width - 1, Math.round(rx + rw)));
    const y1 = Math.max(0, Math.min(height - 1, Math.round(ry + rh)));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        setPixel(x, y, r, g, b);
      }
    }
  }

  function drawLine(x0: number, y0: number, x1: number, y1: number, r: number, g: number, b: number, thickness = 1) {
    let px0 = Math.round(x0);
    let py0 = Math.round(y0);
    const px1 = Math.round(x1);
    const py1 = Math.round(y1);

    const dx = Math.abs(px1 - px0);
    const dy = Math.abs(py1 - py0);
    const sx = px0 < px1 ? 1 : -1;
    const sy = py0 < py1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      if (thickness <= 1) {
        setPixel(px0, py0, r, g, b);
      } else {
        const rad = Math.floor(thickness / 2);
        for (let ty = -rad; ty <= rad; ty++) {
          for (let tx = -rad; tx <= rad; tx++) {
            setPixel(px0 + tx, py0 + ty, r, g, b);
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

  function drawRectOutline(rx: number, ry: number, rw: number, rh: number, thickness = 1, r = 0, g = 0, b = 0) {
    const x0 = Math.round(rx);
    const y0 = Math.round(ry);
    const x1 = Math.round(rx + rw);
    const y1 = Math.round(ry + rh);

    for (let t = 0; t < thickness; t++) {
      drawLine(x0, y0 + t, x1, y0 + t, r, g, b, 1);
      drawLine(x0, y1 - t, x1, y1 - t, r, g, b, 1);
      drawLine(x0 + t, y0, x0 + t, y1, r, g, b, 1);
      drawLine(x1 - t, y0, x1 - t, y1, r, g, b, 1);
    }
  }

  function drawCross(rx: number, ry: number, rw: number, rh: number, r = 0, g = 0, b = 0, thickness = 1) {
    const x0 = Math.round(rx);
    const y0 = Math.round(ry);
    const x1 = Math.round(rx + rw);
    const y1 = Math.round(ry + rh);
    drawLine(x0, y0, x1, y1, r, g, b, thickness);
    drawLine(x1, y0, x0, y1, r, g, b, thickness);
  }

  function drawHatch(rx: number, ry: number, rw: number, rh: number, step = 5, horizontal = true, r = 0, g = 0, b = 0) {
    const x0 = Math.round(rx);
    const y0 = Math.round(ry);
    const x1 = Math.round(rx + rw);
    const y1 = Math.round(ry + rh);

    if (horizontal) {
      for (let y = y0 + step; y < y1; y += step) {
        drawLine(x0, y, x1, y, r, g, b, 1);
      }
    } else {
      for (let x = x0 + step; x < x1; x += step) {
        drawLine(x, y0, x, y1, r, g, b, 1);
      }
    }
  }

  function measureTextWidth(text: string, scale = 1): number {
    return text.length * 6 * scale;
  }

  function drawChar(ch: string, startX: number, startY: number, scale = 1, r = 0, g = 0, b = 0) {
    const glyph = FONT_5X7[ch.toUpperCase()] ?? FONT_5X7[' '];
    if (!glyph) return;
    for (let col = 0; col < 5; col++) {
      const colByte = glyph[col] ?? 0;
      for (let row = 0; row < 7; row++) {
        if ((colByte & (1 << row)) !== 0) {
          if (scale === 1) {
            setPixel(startX + col, startY + row, r, g, b);
          } else {
            for (let dy = 0; dy < scale; dy++) {
              for (let dx = 0; dx < scale; dx++) {
                setPixel(startX + col * scale + dx, startY + row * scale + dy, r, g, b);
              }
            }
          }
        }
      }
    }
  }

  function drawText(text: string, startX: number, startY: number, scale = 1, r = 0, g = 0, b = 0) {
    let curX = startX;
    for (let i = 0; i < text.length; i++) {
      drawChar(text[i]!, curX, startY, scale, r, g, b);
      curX += 6 * scale;
    }
  }

  function drawTextCentered(
    text: string,
    rx: number,
    ry: number,
    rw: number,
    rh: number,
    scale = 1,
    r = 0,
    g = 0,
    b = 0,
    withBackdrop = false,
  ) {
    const textW = measureTextWidth(text, scale);
    const textH = 7 * scale;
    const cx = Math.round(rx + (rw - textW) / 2);
    const cy = Math.round(ry + (rh - textH) / 2);
    if (withBackdrop) {
      fillRect(cx - 2, cy - 2, textW + 4, textH + 4, 255, 255, 255);
    }
    drawText(text, cx, cy, scale, r, g, b);
  }

  // ── FLUX scaffold text helpers (flux_concept mode only) ──
  /** Bold = the glyphs drawn twice, 1 px apart (thicker strokes survive FLUX re-drawing better). */
  const boldWidth = (text: string, s: number) => measureTextWidth(text, s) + 1;
  function drawBoldCentered(text: string, rx: number, ry: number, rw: number, rh: number, s: number, gray = 0) {
    const textW = boldWidth(text, s);
    const textH = 7 * s;
    const cx = Math.round(rx + (rw - textW) / 2);
    const cy = Math.round(ry + (rh - textH) / 2);
    fillRect(cx - 2, cy - 2, textW + 4, textH + 4, 255, 255, 255);
    drawText(text, cx, cy, s, gray, gray, gray);
    drawText(text, cx + 1, cy, s, gray, gray, gray);
  }
  const LINE_GAP = 3;
  const blockHeight = (lines: readonly string[], s: number) => lines.length * 7 * s + (lines.length - 1) * LINE_GAP;
  /** Largest glyph scale (2, then 1) at which every line fits the box with a margin; 0 when nothing fits. */
  function fitScale(lines: readonly string[], rw: number, rh: number, margin = 6, maxScale = 2): number {
    for (const s of [2, 1].filter(v => v <= maxScale)) {
      const w = Math.max(...lines.map(l => boldWidth(l, s)));
      if (w + margin <= rw && blockHeight(lines, s) + margin <= rh) return s;
    }
    return 0;
  }
  function drawBoldLines(lines: readonly string[], rx: number, top: number, rw: number, s: number) {
    let y = top;
    for (const line of lines) {
      drawBoldCentered(line, rx, y, rw, 7 * s, s);
      y += 7 * s + LINE_GAP;
    }
  }

  // Coordinate mapping
  const bf = schematic.buildingFootprint ?? { x: 0, y: 0, width: 24, height: 30 };
  const targetCanvasPx = flux ? 460 : 430;
  const scale = targetCanvasPx / Math.max(bf.width, bf.height);
  const offsetX = Math.round((width - bf.width * scale) / 2 - bf.x * scale);
  const offsetY = Math.round((height - bf.height * scale) / 2 - bf.y * scale);

  const toPx = (mX: number, mY: number, mW: number, mH: number) => ({
    x: offsetX + mX * scale,
    y: offsetY + mY * scale,
    w: mW * scale,
    h: mH * scale,
  });

  // Room lookup (door swing direction) — flat rooms, balconies and core spaces.
  const spaceRects = new Map<string, { x: number; y: number; width: number; height: number }>();
  if (schematic.core?.lobby) spaceRects.set('core_lobby', schematic.core.lobby.bounds);
  for (const lift of schematic.core?.lifts ?? []) spaceRects.set(lift.id, lift.bounds);
  for (const stair of schematic.core?.stairs ?? []) spaceRects.set(stair.id, stair.bounds);
  for (const u of schematic.units ?? []) for (const rm of [...(u.rooms ?? []), ...(u.balconies ?? [])]) spaceRects.set(rm.id, rm.bounds);

  if (flux) {
    renderFluxConceptBody();
  } else {
  // 1. Common core: lobby, lifts [X], stairs (treads), shafts.
  if (schematic.core) {
    if (schematic.core.lobby) {
      const lb = schematic.core.lobby.bounds;
      const lbp = toPx(lb.x, lb.y, lb.width, lb.height);
      drawRectOutline(lbp.x, lbp.y, lbp.w, lbp.h, 2, 0, 0, 0);
      const vertical = lbp.h > lbp.w * 1.6;
      const lobbyLabel = measureTextWidth('COMMON LOBBY', 1) + 4 <= lbp.w ? 'COMMON LOBBY' : 'LOBBY';
      if (vertical && lobbyLabel === 'LOBBY' && measureTextWidth('LOBBY', 1) + 4 > lbp.w) {
        drawTextCentered('LBY', lbp.x, lbp.y, lbp.w, lbp.h, 1, 0, 0, 0, true);
        emit({ text: 'LBY', kind: 'core', spaceId: 'core_lobby', scale: 1 });
      } else {
        drawTextCentered(lobbyLabel, lbp.x, lbp.y, lbp.w, lbp.h, 1, 0, 0, 0, true);
        emit({ text: lobbyLabel, kind: 'core', spaceId: 'core_lobby', scale: 1 });
      }
    }
    (schematic.core.lifts ?? []).forEach((lift, idx) => {
      const lp = toPx(lift.bounds.x, lift.bounds.y, lift.bounds.width, lift.bounds.height);
      fillRect(lp.x, lp.y, lp.w, lp.h, 255, 255, 255);
      drawRectOutline(lp.x, lp.y, lp.w, lp.h, 2, 0, 0, 0);
      drawCross(lp.x, lp.y, lp.w, lp.h, 0, 0, 0, 1);
      const label = lift.label || `LIFT 0${idx + 1}`;
      const liftText = measureTextWidth(label, 1) + 2 <= lp.w ? label : `L${idx + 1}`;
      drawTextCentered(liftText, lp.x, lp.y, lp.w, lp.h, 1, 0, 0, 0, true);
      emit({ text: liftText, kind: 'core', spaceId: lift.id, scale: 1 });
    });
    (schematic.core.stairs ?? []).forEach((stair, idx) => {
      const sp = toPx(stair.bounds.x, stair.bounds.y, stair.bounds.width, stair.bounds.height);
      fillRect(sp.x, sp.y, sp.w, sp.h, 255, 255, 255);
      drawRectOutline(sp.x, sp.y, sp.w, sp.h, 2, 0, 0, 0);
      drawHatch(sp.x, sp.y, sp.w, sp.h, 5, sp.w >= sp.h, 60, 60, 60);
      const label = `STAIR ${String(idx + 1).padStart(2, '0')}`;
      const stairText = measureTextWidth(label, 1) + 2 <= sp.w ? label : `ST${idx + 1}`;
      drawTextCentered(stairText, sp.x, sp.y, sp.w, sp.h, 1, 0, 0, 0, true);
      emit({ text: stairText, kind: 'core', spaceId: stair.id, scale: 1 });
    });
    (schematic.core.corridors ?? []).forEach(corr => {
      const crp = toPx(corr.bounds.x, corr.bounds.y, corr.bounds.width, corr.bounds.height);
      drawRectOutline(crp.x, crp.y, crp.w, crp.h, 1, 100, 100, 100);
    });
    (schematic.core.serviceShafts ?? []).forEach(shaft => {
      const shp = toPx(shaft.bounds.x, shaft.bounds.y, shaft.bounds.width, shaft.bounds.height);
      drawRectOutline(shp.x, shp.y, shp.w, shp.h, 1, 0, 0, 0);
      drawCross(shp.x, shp.y, shp.w, shp.h, 120, 120, 120, 1);
      if (measureTextWidth('DUCT', 1) + 4 <= shp.w && shp.h >= 10) {
        drawTextCentered('DUCT', shp.x, shp.y, shp.w, shp.h, 1, 0, 0, 0, true);
        emit({ text: 'DUCT', kind: 'core', scale: 1 });
      }
    });
  }

  // 2. Flats: room partitions, balconies, then the flat body as a thick party wall.
  (schematic.units ?? []).forEach(u => {
    for (const rm of u.rooms ?? []) {
      const rp = toPx(rm.bounds.x, rm.bounds.y, rm.bounds.width, rm.bounds.height);
      drawRectOutline(rp.x, rp.y, rp.w, rp.h, 1, 40, 40, 40);
    }
    for (const bal of u.balconies ?? []) {
      const bp = toPx(bal.bounds.x, bal.bounds.y, bal.bounds.width, bal.bounds.height);
      drawRectOutline(bp.x, bp.y, bp.w, bp.h, 1, 70, 70, 70);
      drawHatch(bp.x, bp.y, bp.w, bp.h, 6, bp.w < bp.h, 200, 200, 200);
      if (measureTextWidth('BALC', 1) + 4 <= bp.w && bp.h >= 10) {
        drawTextCentered('BALC', bp.x, bp.y, bp.w, bp.h, 1, 40, 40, 40, true);
        emit({ text: 'BALC', kind: 'room', flatId: u.flatId, spaceId: bal.id, scale: 1 });
      } else if (bp.h >= measureTextWidth('BALC', 1) + 4 && bp.w >= 9) {
        drawTextCentered('B', bp.x, bp.y, bp.w, bp.h, 1, 40, 40, 40, true);
        emit({ text: 'B', kind: 'room', flatId: u.flatId, spaceId: bal.id, scale: 1 });
      }
    }
    const body = u.bodyBounds ?? u.bounds;
    const bdp = toPx(body.x, body.y, body.width, body.height);
    drawRectOutline(bdp.x, bdp.y, bdp.w, bdp.h, 3, 0, 0, 0);
  });

  // 3. Doors: a clear opening in the wall plus a 90° leaf swinging into the second space.
  for (const door of schematic.doors ?? []) {
    const dp = toPx(door.bounds.x, door.bounds.y, door.bounds.width, door.bounds.height);
    const into = spaceRects.get(door.connects[1]);
    if (door.wallAxis === 'y') {
      const cx = dp.x + dp.w / 2;
      fillRect(cx - 2, dp.y + 1, 4, dp.h - 2, 255, 255, 255);
      if (door.doorType !== 'open_passage' && into) {
        const dir = (into.x + into.width / 2) * scale + offsetX > cx ? 1 : -1;
        const hingeY = dp.y + 1;
        drawLine(cx, hingeY, cx + dir * (dp.h - 2), hingeY, 0, 0, 0, 1);
        drawLine(cx + dir * (dp.h - 2), hingeY, cx, dp.y + dp.h - 1, 150, 150, 150, 1);
      }
    } else {
      const cy = dp.y + dp.h / 2;
      fillRect(dp.x + 1, cy - 2, dp.w - 2, 4, 255, 255, 255);
      if (door.doorType !== 'open_passage' && into) {
        const dir = (into.y + into.height / 2) * scale + offsetY > cy ? 1 : -1;
        const hingeX = dp.x + 1;
        drawLine(hingeX, cy, hingeX, cy + dir * (dp.w - 2), 0, 0, 0, 1);
        drawLine(hingeX, cy + dir * (dp.w - 2), dp.x + dp.w - 1, cy, 150, 150, 150, 1);
      }
    }
  }

  // 3b. Labels last so no wall or door leaf crosses them. The living/dining
  // room carries the flat label (FLAT 01 / unit type / room name).
  (schematic.units ?? []).forEach((u, i) => {
    const body = u.bodyBounds ?? u.bounds;
    const bdp = toPx(body.x, body.y, body.width, body.height);
    const flatLabel = `FLAT ${String(i + 1).padStart(2, '0')}`;
    const typeLabel = u.unitType ? u.unitType.toUpperCase() : '';
    let flatLabelPlaced = false;
    for (const rm of u.rooms ?? []) {
      const rp = toPx(rm.bounds.x, rm.bounds.y, rm.bounds.width, rm.bounds.height);
      const { full, short } = getRoomAbbreviation(rm.name, rm.type);
      if (rm.type === 'living_dining' && rp.h >= 34 && measureTextWidth(flatLabel, 1) + 6 <= rp.w) {
        const flatScale = measureTextWidth(flatLabel, 2) + 8 <= rp.w && rp.h >= 56 ? 2 : 1;
        const roomText = measureTextWidth(full, 1) + 6 <= rp.w ? full : short;
        const blockH = 7 * flatScale + 4 + 7 + 5 + 7;
        const top = rp.y + (rp.h - blockH) / 2;
        drawTextCentered(flatLabel, rp.x, top, rp.w, 7 * flatScale, flatScale, 0, 0, 0, true);
        drawTextCentered(typeLabel, rp.x, top + 7 * flatScale + 4, rp.w, 7, 1, 40, 40, 40, true);
        drawTextCentered(roomText, rp.x, top + 7 * flatScale + 16, rp.w, 7, 1, 20, 20, 20, true);
        emit({ text: flatLabel, kind: 'flat', flatId: u.flatId, scale: flatScale });
        emit({ text: typeLabel, kind: 'unit_type', flatId: u.flatId, scale: 1 });
        emit({ text: roomText, kind: 'room', flatId: u.flatId, spaceId: rm.id, scale: 1 });
        flatLabelPlaced = true;
        continue;
      }
      if (measureTextWidth(full, 1) + 6 <= rp.w && rp.h >= 12) {
        drawTextCentered(full, rp.x, rp.y, rp.w, rp.h, 1, 20, 20, 20, true);
        emit({ text: full, kind: 'room', flatId: u.flatId, spaceId: rm.id, scale: 1 });
      } else if (measureTextWidth(short, 1) + 4 <= rp.w && rp.h >= 10) {
        drawTextCentered(short, rp.x, rp.y, rp.w, rp.h, 1, 20, 20, 20, true);
        emit({ text: short, kind: 'room', flatId: u.flatId, spaceId: rm.id, scale: 1 });
      }
    }
    if (!flatLabelPlaced) {
      const text = `${flatLabel} ${typeLabel}`.trim();
      drawTextCentered(text, bdp.x, bdp.y + 4, bdp.w, 9, 1, 0, 0, 0, true);
      emit({ text, kind: 'flat', flatId: u.flatId, scale: 1 });
    }
  });
  }

  /**
   * Phase 2 FLUX scaffold. Same geometry as the base plan (every rectangle comes
   * from the deterministic schematic); only the graphic language differs so the
   * structure reads without relying on generated text.
   */
  function renderFluxConceptBody() {
    const core = schematic.core;
    // 1. Common lobby: tinted so common space never reads as part of a flat.
    if (core?.lobby) {
      const lb = core.lobby.bounds;
      const lbp = toPx(lb.x, lb.y, lb.width, lb.height);
      fillRect(lbp.x, lbp.y, lbp.w, lbp.h, 226, 226, 226);
      drawRectOutline(lbp.x, lbp.y, lbp.w, lbp.h, 3, 0, 0, 0);
    }
    for (const corr of core?.corridors ?? []) {
      const crp = toPx(corr.bounds.x, corr.bounds.y, corr.bounds.width, corr.bounds.height);
      fillRect(crp.x, crp.y, crp.w, crp.h, 226, 226, 226);
      drawRectOutline(crp.x, crp.y, crp.w, crp.h, 1, 100, 100, 100);
    }
    // Lifts: heavy shaft box with a bold X (the X is the lift symbol, the word is secondary).
    for (const lift of core?.lifts ?? []) {
      const lp = toPx(lift.bounds.x, lift.bounds.y, lift.bounds.width, lift.bounds.height);
      fillRect(lp.x, lp.y, lp.w, lp.h, 255, 255, 255);
      drawRectOutline(lp.x, lp.y, lp.w, lp.h, 3, 0, 0, 0);
      drawCross(lp.x + 2, lp.y + 2, lp.w - 4, lp.h - 4, 0, 0, 0, 2);
    }
    // Stairs: treads PERPENDICULAR to the run, a central divider (two flights) and a landing.
    for (const stair of core?.stairs ?? []) {
      const sp = toPx(stair.bounds.x, stair.bounds.y, stair.bounds.width, stair.bounds.height);
      fillRect(sp.x, sp.y, sp.w, sp.h, 255, 255, 255);
      drawRectOutline(sp.x, sp.y, sp.w, sp.h, 3, 0, 0, 0);
      const runVertical = sp.h >= sp.w;
      const run = runVertical ? sp.h : sp.w;
      const landing = Math.max(6, Math.round(run * 0.18));
      if (runVertical) {
        for (let y = sp.y + landing; y < sp.y + sp.h - 3; y += 5) drawLine(sp.x + 2, y, sp.x + sp.w - 2, y, 40, 40, 40, 1);
        drawLine(sp.x + sp.w / 2, sp.y + landing, sp.x + sp.w / 2, sp.y + sp.h - 2, 0, 0, 0, 2);
        drawLine(sp.x + 2, sp.y + landing, sp.x + sp.w - 2, sp.y + landing, 0, 0, 0, 1);
      } else {
        for (let x = sp.x + landing; x < sp.x + sp.w - 3; x += 5) drawLine(x, sp.y + 2, x, sp.y + sp.h - 2, 40, 40, 40, 1);
        drawLine(sp.x + landing, sp.y + sp.h / 2, sp.x + sp.w - 2, sp.y + sp.h / 2, 0, 0, 0, 2);
        drawLine(sp.x + landing, sp.y + 2, sp.x + landing, sp.y + sp.h - 2, 0, 0, 0, 1);
      }
    }
    // Service ducts: solid grey, no X (an X would read as an extra lift), no text.
    for (const shaft of core?.serviceShafts ?? []) {
      const shp = toPx(shaft.bounds.x, shaft.bounds.y, shaft.bounds.width, shaft.bounds.height);
      fillRect(shp.x, shp.y, shp.w, shp.h, 150, 150, 150);
      drawRectOutline(shp.x, shp.y, shp.w, shp.h, 1, 0, 0, 0);
    }

    // 2. Flats: black partitions, pattern-only balconies, heavy flat walls.
    for (const u of schematic.units ?? []) {
      for (const rm of u.rooms ?? []) {
        const rp = toPx(rm.bounds.x, rm.bounds.y, rm.bounds.width, rm.bounds.height);
        drawRectOutline(rp.x, rp.y, rp.w, rp.h, 1, 0, 0, 0);
      }
      for (const bal of u.balconies ?? []) {
        const bp = toPx(bal.bounds.x, bal.bounds.y, bal.bounds.width, bal.bounds.height);
        drawRectOutline(bp.x, bp.y, bp.w, bp.h, 1, 70, 70, 70);
        drawHatch(bp.x, bp.y, bp.w, bp.h, 4, bp.w < bp.h, 170, 170, 170);
      }
      const body = u.bodyBounds ?? u.bounds;
      const bdp = toPx(body.x, body.y, body.width, body.height);
      drawRectOutline(bdp.x, bdp.y, bdp.w, bdp.h, 4, 0, 0, 0);
    }

    // 3. Doors: opening + leaf; apartment entrances get a heavy leaf so the lobby → flat entry reads.
    for (const door of schematic.doors ?? []) {
      const dp = toPx(door.bounds.x, door.bounds.y, door.bounds.width, door.bounds.height);
      const into = spaceRects.get(door.connects[1]);
      const leaf = door.kind === 'flat_entrance' ? 3 : 1;
      if (door.wallAxis === 'y') {
        const cx = dp.x + dp.w / 2;
        fillRect(cx - 3, dp.y + 1, 6, dp.h - 2, 255, 255, 255);
        if (door.doorType !== 'open_passage' && into) {
          const dir = (into.x + into.width / 2) * scale + offsetX > cx ? 1 : -1;
          const hingeY = dp.y + 1;
          drawLine(cx, hingeY, cx + dir * (dp.h - 2), hingeY, 0, 0, 0, leaf);
          drawLine(cx + dir * (dp.h - 2), hingeY, cx, dp.y + dp.h - 1, 120, 120, 120, 1);
        }
      } else {
        const cy = dp.y + dp.h / 2;
        fillRect(dp.x + 1, cy - 3, dp.w - 2, 6, 255, 255, 255);
        if (door.doorType !== 'open_passage' && into) {
          const dir = (into.y + into.height / 2) * scale + offsetY > cy ? 1 : -1;
          const hingeX = dp.x + 1;
          drawLine(hingeX, cy, hingeX, cy + dir * (dp.w - 2), 0, 0, 0, leaf);
          drawLine(hingeX, cy + dir * (dp.w - 2), dp.x + dp.w - 1, cy, 120, 120, 120, 1);
        }
      }
    }

    // 4. Labels last (short vocabulary, bold, largest scale that fits).
    if (core?.lobby) {
      const lb = core.lobby.bounds;
      const lbp = toPx(lb.x, lb.y, lb.width, lb.height);
      const s = fitScale(['LOBBY'], lbp.w, lbp.h, 4);
      if (s > 0) {
        drawBoldLines(['LOBBY'], lbp.x, lbp.y + (lbp.h - 7 * s) / 2, lbp.w, s);
        emit({ text: 'LOBBY', kind: 'core', spaceId: 'core_lobby', scale: s });
      }
    }
    for (const lift of core?.lifts ?? []) {
      const lp = toPx(lift.bounds.x, lift.bounds.y, lift.bounds.width, lift.bounds.height);
      const s = fitScale(['LIFT'], lp.w, lp.h, 4);
      if (s > 0) {
        drawBoldLines(['LIFT'], lp.x, lp.y + (lp.h - 7 * s) / 2, lp.w, s);
        emit({ text: 'LIFT', kind: 'core', spaceId: lift.id, scale: s });
      }
    }
    for (const stair of core?.stairs ?? []) {
      const sp = toPx(stair.bounds.x, stair.bounds.y, stair.bounds.width, stair.bounds.height);
      const s = fitScale(['STAIR'], sp.w, sp.h, 4);
      if (s > 0) {
        drawBoldLines(['STAIR'], sp.x, sp.y + (sp.h - 7 * s) / 2, sp.w, s);
        emit({ text: 'STAIR', kind: 'core', spaceId: stair.id, scale: s });
      }
    }
    (schematic.units ?? []).forEach((u, i) => {
      const flatLabel = `FLAT ${String(i + 1).padStart(2, '0')}`;
      const typeLabel = u.unitType ? u.unitType.toUpperCase() : '';
      const tagLines = typeLabel ? [flatLabel, typeLabel] : [flatLabel];
      let tagPlaced = false;
      for (const rm of u.rooms ?? []) {
        const rp = toPx(rm.bounds.x, rm.bounds.y, rm.bounds.width, rm.bounds.height);
        const spec = fluxConceptRoomLabel(rm.name, rm.type);
        const isLiving = rm.type === 'living_dining' || rm.type === 'living';
        if (!tagPlaced && isLiving && spec) {
          // The living room carries the flat tag above its room words.
          const tagScale = fitScale(tagLines, rp.w, rp.h * 0.6);
          // Room words use ONE uniform size everywhere; the flat tag is the dominant text.
          const roomScale = fitScale(spec.lines, rp.w, rp.h * 0.4, 6, 1);
          if (tagScale > 0 && roomScale > 0) {
            const tagH = blockHeight(tagLines, tagScale);
            const roomH = blockHeight(spec.lines, roomScale);
            const top = rp.y + (rp.h - (tagH + 8 + roomH)) / 2;
            drawBoldLines(tagLines, rp.x, top, rp.w, tagScale);
            drawBoldLines(spec.lines, rp.x, top + tagH + 8, rp.w, roomScale);
            emit({ text: flatLabel, kind: 'flat', flatId: u.flatId, scale: tagScale });
            if (typeLabel) emit({ text: typeLabel, kind: 'unit_type', flatId: u.flatId, scale: tagScale });
            for (const line of spec.lines) emit({ text: line, kind: 'room', flatId: u.flatId, spaceId: rm.id, scale: roomScale });
            tagPlaced = true;
            continue;
          }
        }
        if (!spec) continue;
        let lines = spec.lines;
        let s = fitScale(lines, rp.w, rp.h, 6, 1);
        if (s === 0 && spec.fallback) {
          lines = spec.fallback;
          s = fitScale(lines, rp.w, rp.h, 4, 1);
        }
        if (s === 0) continue;
        drawBoldLines(lines, rp.x, rp.y + (rp.h - blockHeight(lines, s)) / 2, rp.w, s);
        for (const line of lines) emit({ text: line, kind: 'room', flatId: u.flatId, spaceId: rm.id, scale: s });
      }
      if (!tagPlaced) {
        const body = u.bodyBounds ?? u.bounds;
        const bdp = toPx(body.x, body.y, body.width, body.height);
        const text = `${flatLabel} ${typeLabel}`.trim();
        drawBoldCentered(text, bdp.x, bdp.y + 6, bdp.w, 7, 1);
        emit({ text: flatLabel, kind: 'flat', flatId: u.flatId, scale: 1 });
        if (typeLabel) emit({ text: typeLabel, kind: 'unit_type', flatId: u.flatId, scale: 1 });
      }
    });
  }

  // 4. North Arrow (top-right corner)
  const naX = width - 35;
  const naY = 15;
  drawText('N', naX, naY, 1, 0, 0, 0);
  drawLine(naX + 2, naY + 8, naX + 2, naY + 22, 0, 0, 0, 1);
  drawLine(naX + 2, naY + 8, naX - 1, naY + 12, 0, 0, 0, 1);
  drawLine(naX + 2, naY + 8, naX + 5, naY + 12, 0, 0, 0, 1);

  // Assemble PNG chunks
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdr = makePngChunk('IHDR', ihdrData);
  const idat = makePngChunk('IDAT', zlib.deflateSync(raw));
  const iend = makePngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}
