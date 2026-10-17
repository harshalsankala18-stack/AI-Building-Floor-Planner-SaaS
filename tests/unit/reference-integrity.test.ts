/**
 * Reference-asset integrity gate used by scripts/test-two-phase-concepts-live.mjs:
 * existence, readability, PNG validity, ≤ 512² size, SHA-256 duplicate rejection.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  REFERENCE_CODES,
  decideReferenceGate,
  inspectPngBuffer,
  validateReferenceSet,
} from '../../scripts/lib/reference-integrity.mjs';

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

/** Minimal valid greyscale PNG; `shade` changes the pixel bytes → different SHA-256. */
function makePng(width: number, height: number, shade = 255): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // greyscale
  const raw = Buffer.alloc((width + 1) * height, shade);
  for (let y = 0; y < height; y++) raw[y * (width + 1)] = 0; // filter byte
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

let dir: string;
const write = (name: string, buf: Buffer) => fs.writeFileSync(path.join(dir, name), buf);

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ref-integrity-'));
});
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('inspectPngBuffer', () => {
  it('accepts a valid PNG within 512x512 and reports its SHA-256', () => {
    const r = inspectPngBuffer(makePng(64, 32));
    expect(r.ok).toBe(true);
    expect(r.width).toBe(64);
    expect(r.height).toBe(32);
    expect(r.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('rejects non-PNG bytes and truncated PNGs', () => {
    expect(inspectPngBuffer(Buffer.from('not an image at all, just text padding padding padding')).code).toBe(REFERENCE_CODES.INVALID_IMAGE);
    const png = makePng(16, 16);
    expect(inspectPngBuffer(png.subarray(0, png.length - 12)).code).toBe(REFERENCE_CODES.INVALID_IMAGE);
  });

  it('rejects images larger than the normalized size', () => {
    expect(inspectPngBuffer(makePng(513, 10)).code).toBe(REFERENCE_CODES.SIZE_EXCEEDED);
  });
});

describe('validateReferenceSet + decideReferenceGate', () => {
  it('passes the full gate with four distinct valid references', () => {
    [10, 20, 30, 40].forEach((s, i) => write(`ref_concept_0${i + 1}.png`, makePng(32, 32, s)));
    const result = validateReferenceSet(dir, { required: 4 });
    expect(result.distinctCount).toBe(4);
    expect(result.complete).toBe(true);
    const gate = decideReferenceGate(result);
    expect(gate).toMatchObject({ proceed: true, exitCode: 0, fullAcceptance: 'TESTED' });
  });

  it('rejects duplicate content as REFERENCE_DUPLICATE with exit code 2 and never counts it as distinct', () => {
    const a = makePng(32, 32, 10);
    const b = makePng(32, 32, 200);
    write('ref_concept_01.png', a);
    write('ref_concept_02.png', a);
    write('ref_concept_03.png', b);
    write('ref_concept_04.png', b);
    const result = validateReferenceSet(dir, { required: 4 });
    expect(result.distinctCount).toBe(2);
    expect(result.hasDuplicates).toBe(true);
    expect(result.complete).toBe(false);
    expect(result.duplicateGroups.map(g => g.ids)).toEqual([
      ['ref_concept_01', 'ref_concept_02'],
      ['ref_concept_03', 'ref_concept_04'],
    ]);
    expect(result.rows.map(r => r.status)).toEqual(['VALID', 'REFERENCE_DUPLICATE', 'VALID', 'REFERENCE_DUPLICATE']);
    const gate = decideReferenceGate(result);
    expect(gate).toMatchObject({ proceed: false, exitCode: 2, code: 'REFERENCE_DUPLICATE', fullAcceptance: 'NOT_TESTED' });
  });

  it('keeps rejecting duplicates in reduced mode and with --allow-missing-references', () => {
    const a = makePng(32, 32, 10);
    write('ref_concept_01.png', a);
    write('ref_concept_02.png', a);
    const result = validateReferenceSet(dir, { required: 4 });
    expect(decideReferenceGate(result, { reduced: true })).toMatchObject({ proceed: false, exitCode: 2, code: 'REFERENCE_DUPLICATE' });
    expect(decideReferenceGate(result, { allowMissing: true })).toMatchObject({ proceed: false, exitCode: 2, code: 'REFERENCE_DUPLICATE' });
  });

  it('detects duplicates even when the file names differ in extension case and name', () => {
    const a = makePng(32, 32, 10);
    write('building_b.png', a);
    write('fi_side.PNG', a);
    const result = validateReferenceSet(dir, { required: 2 });
    expect(result.distinctCount).toBe(1);
    expect(decideReferenceGate(result).code).toBe('REFERENCE_DUPLICATE');
  });

  it('fails the full gate with REFERENCE_MISSING when fewer than four distinct references exist', () => {
    write('ref_concept_01.png', makePng(32, 32, 10));
    write('ref_concept_02.png', makePng(32, 32, 200));
    const result = validateReferenceSet(dir, { required: 4 });
    expect(result.distinctCount).toBe(2);
    expect(result.missingCount).toBe(2);
    expect(decideReferenceGate(result)).toMatchObject({ proceed: false, exitCode: 2, code: 'REFERENCE_MISSING' });
  });

  it('allows a clearly labelled reduced-reference smoke run that never reports full acceptance', () => {
    write('ref_concept_01.png', makePng(32, 32, 10));
    write('ref_concept_02.png', makePng(32, 32, 200));
    const gate = decideReferenceGate(validateReferenceSet(dir, { required: 4 }), { reduced: true });
    expect(gate).toMatchObject({ proceed: true, mode: 'REDUCED_REFERENCE_SMOKE', fullAcceptance: 'NOT_TESTED' });
  });

  it('reduced mode is NOT_TESTED for full acceptance even with four distinct references', () => {
    [10, 20, 30, 40].forEach((s, i) => write(`ref_concept_0${i + 1}.png`, makePng(32, 32, s)));
    expect(decideReferenceGate(validateReferenceSet(dir), { reduced: true }).fullAcceptance).toBe('NOT_TESTED');
  });

  it('rejects invalid or oversized files with exit code 2', () => {
    write('ref_concept_01.png', makePng(32, 32, 10));
    write('ref_concept_02.png', Buffer.from('JPEG-or-garbage bytes pretending to be a png file.........'));
    write('ref_concept_03.png', makePng(600, 20, 30));
    write('ref_concept_04.png', makePng(32, 32, 40));
    const result = validateReferenceSet(dir, { required: 4 });
    expect(result.rows.map(r => r.status)).toEqual(['VALID', 'REFERENCE_INVALID_IMAGE', 'REFERENCE_SIZE_EXCEEDED', 'VALID']);
    expect(result.distinctCount).toBe(2);
    const gate = decideReferenceGate(result, { reduced: true });
    expect(gate).toMatchObject({ proceed: false, exitCode: 2, code: 'REFERENCE_INVALID_IMAGE' });
  });

  it('rejects an unreadable reference entry as REFERENCE_UNREADABLE', () => {
    write('ref_concept_01.png', makePng(32, 32, 10));
    fs.mkdirSync(path.join(dir, 'ref_concept_02.png')); // a directory cannot be read as a file
    const result = validateReferenceSet(dir, { required: 2 });
    expect(result.rows[1]!.status).toBe('REFERENCE_UNREADABLE');
    expect(decideReferenceGate(result, { reduced: true })).toMatchObject({ proceed: false, exitCode: 2, code: 'REFERENCE_UNREADABLE' });
  });

  it('reports REFERENCE_MISSING for an absent directory', () => {
    const result = validateReferenceSet(path.join(dir, 'does-not-exist'), { required: 4 });
    expect(result.distinctCount).toBe(0);
    expect(result.issues.filter(i => i.code === 'REFERENCE_MISSING')).toHaveLength(4);
    expect(decideReferenceGate(result, { reduced: true })).toMatchObject({ proceed: false, code: 'REFERENCE_MISSING' });
  });
});
