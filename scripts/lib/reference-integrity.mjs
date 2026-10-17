/**
 * Reference-asset integrity checks for the live concept acceptance scripts.
 *
 * Validates the normalized concept references BEFORE any FLUX call:
 *   1. files exist            → REFERENCE_MISSING      (fewer files than required)
 *   2. files are readable     → REFERENCE_UNREADABLE
 *   3. files are valid PNGs   → REFERENCE_INVALID_IMAGE (signature, IHDR, IEND)
 *   4. normalized size        → REFERENCE_SIZE_EXCEEDED (> maxDim on either side)
 *   5. SHA-256 per file
 *   6. duplicate content      → REFERENCE_DUPLICATE     (same SHA-256 under two ids)
 *
 * Only DISTINCT valid files count toward `distinctCount`; duplicates never
 * fill a slot. Pure except for reading the given directory.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const REFERENCE_CODES = Object.freeze({
  MISSING: 'REFERENCE_MISSING',
  UNREADABLE: 'REFERENCE_UNREADABLE',
  INVALID_IMAGE: 'REFERENCE_INVALID_IMAGE',
  SIZE_EXCEEDED: 'REFERENCE_SIZE_EXCEEDED',
  DUPLICATE: 'REFERENCE_DUPLICATE',
});

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/** Structural PNG check on raw bytes (no decoding): signature, leading IHDR, trailing IEND, dimensions. */
export function inspectPngBuffer(buf, maxDim = 512) {
  const hash = sha256(buf);
  const isPng =
    buf.length >= 8 + 25 + 12 &&
    buf.subarray(0, 8).equals(PNG_SIGNATURE) &&
    buf.readUInt32BE(8) === 13 &&
    buf.toString('latin1', 12, 16) === 'IHDR' &&
    buf.toString('latin1', buf.length - 8, buf.length - 4) === 'IEND';
  if (!isPng) return { ok: false, code: REFERENCE_CODES.INVALID_IMAGE, width: 0, height: 0, sha256: hash };
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (width === 0 || height === 0) return { ok: false, code: REFERENCE_CODES.INVALID_IMAGE, width, height, sha256: hash };
  if (width > maxDim || height > maxDim) return { ok: false, code: REFERENCE_CODES.SIZE_EXCEEDED, width, height, sha256: hash };
  return { ok: true, code: null, width, height, sha256: hash };
}

/**
 * Validates every `*.png` in `dir` (name order).
 * @returns {{ dir: string, required: number, rows: object[], issues: object[], distinctCount: number,
 *             duplicateGroups: { sha256: string, ids: string[] }[], hasDuplicates: boolean,
 *             hasInvalid: boolean, missingCount: number, complete: boolean }}
 */
export function validateReferenceSet(dir, { required = 4, maxDim = 512 } = {}) {
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.png')).sort() : [];
  const rows = [];
  const issues = [];
  const firstIdByHash = new Map();

  for (const file of files) {
    const id = path.basename(file, path.extname(file));
    let buf;
    try {
      buf = fs.readFileSync(path.join(dir, file));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      rows.push({ id, file, status: REFERENCE_CODES.UNREADABLE, sha256: null, size: null, bytes: null });
      issues.push({ code: REFERENCE_CODES.UNREADABLE, id, message });
      continue;
    }
    const png = inspectPngBuffer(buf, maxDim);
    const row = { id, file, bytes: buf.length, size: `${png.width}x${png.height}`, sha256: png.sha256, status: 'VALID', duplicateOf: null };
    if (!png.ok) {
      row.status = png.code;
      issues.push({ code: png.code, id, message: png.code === REFERENCE_CODES.SIZE_EXCEEDED ? `${row.size} exceeds ${maxDim}x${maxDim}` : 'not a structurally valid PNG' });
    } else if (firstIdByHash.has(png.sha256)) {
      row.status = REFERENCE_CODES.DUPLICATE;
      row.duplicateOf = firstIdByHash.get(png.sha256);
      issues.push({ code: REFERENCE_CODES.DUPLICATE, id, message: `identical content (sha256 ${png.sha256.slice(0, 16)}…) to ${row.duplicateOf}` });
    } else {
      firstIdByHash.set(png.sha256, id);
    }
    rows.push(row);
  }

  const distinctCount = rows.filter(r => r.status === 'VALID').length;
  const missingCount = Math.max(0, required - files.length);
  for (let i = 0; i < missingCount; i++) {
    issues.push({ code: REFERENCE_CODES.MISSING, id: `slot_${String(files.length + i + 1).padStart(2, '0')}`, message: `no reference file for slot ${files.length + i + 1}` });
  }
  const groups = new Map();
  for (const r of rows) {
    if (!r.sha256 || (r.status !== 'VALID' && r.status !== REFERENCE_CODES.DUPLICATE)) continue;
    groups.set(r.sha256, [...(groups.get(r.sha256) ?? []), r.id]);
  }
  const duplicateGroups = [...groups.entries()].filter(([, ids]) => ids.length > 1).map(([hash, ids]) => ({ sha256: hash, ids }));
  const hasInvalid = issues.some(i => i.code === REFERENCE_CODES.UNREADABLE || i.code === REFERENCE_CODES.INVALID_IMAGE || i.code === REFERENCE_CODES.SIZE_EXCEEDED);

  return {
    dir,
    required,
    rows,
    issues,
    distinctCount,
    duplicateGroups,
    hasDuplicates: duplicateGroups.length > 0,
    hasInvalid,
    missingCount,
    complete: distinctCount >= required && duplicateGroups.length === 0 && !hasInvalid,
  };
}

/**
 * Gate decision for the live script. Duplicates and invalid files always fail (exit 2).
 * Full mode needs `required` distinct references; reduced mode runs with ≥ 1 distinct
 * reference and is labelled as such (full acceptance NOT_TESTED).
 * @returns {{ proceed: boolean, exitCode: number, code: string | null, mode: string, fullAcceptance: string, message: string }}
 */
export function decideReferenceGate(result, { reduced = false, allowMissing = false } = {}) {
  const mode = reduced ? 'REDUCED_REFERENCE_SMOKE' : 'FULL_REFERENCE_ACCEPTANCE';
  const fullAcceptance = result.complete && !reduced ? 'TESTED' : 'NOT_TESTED';
  if (result.hasDuplicates) {
    const groups = result.duplicateGroups.map(g => `[${g.ids.join(' = ')}]`).join(', ');
    return { proceed: false, exitCode: 2, code: REFERENCE_CODES.DUPLICATE, mode, fullAcceptance: 'NOT_TESTED', message: `duplicate reference content ${groups}; only ${result.distinctCount} distinct` };
  }
  if (result.hasInvalid) {
    const bad = result.issues.filter(i => i.code !== REFERENCE_CODES.MISSING).map(i => `${i.id}: ${i.code}`).join(', ');
    return { proceed: false, exitCode: 2, code: result.issues.find(i => i.code !== REFERENCE_CODES.MISSING).code, mode, fullAcceptance: 'NOT_TESTED', message: bad };
  }
  if (result.distinctCount >= result.required) {
    return { proceed: true, exitCode: 0, code: null, mode, fullAcceptance, message: `${result.distinctCount} distinct references` };
  }
  if (reduced && result.distinctCount >= 1) {
    return { proceed: true, exitCode: 0, code: null, mode, fullAcceptance: 'NOT_TESTED', message: `reduced-reference smoke test with ${result.distinctCount} distinct reference(s); full ${result.required}-reference acceptance NOT TESTED` };
  }
  if (allowMissing) {
    return { proceed: true, exitCode: 0, code: null, mode, fullAcceptance: 'NOT_TESTED', message: `--allow-missing-references: ${result.distinctCount}/${result.required} distinct` };
  }
  return { proceed: false, exitCode: 2, code: REFERENCE_CODES.MISSING, mode, fullAcceptance: 'NOT_TESTED', message: `need ${result.required} distinct references, found ${result.distinctCount}` };
}
