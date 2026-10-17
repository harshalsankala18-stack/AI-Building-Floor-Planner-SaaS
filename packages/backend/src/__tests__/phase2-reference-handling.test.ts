/**
 * Phase 2 — available-reference handling for the FLUX concept requests.
 *
 * Uses temporary directories only: no test pretends the missing references exist.
 * With N distinct references, each concept attaches min(3, N) of them next to the
 * schematic, never the same content twice, and records distinctReferencesAvailable.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { APARTMENT_CONCEPT_STRATEGIES, renderSchematicPng512 } from '@ai-floor-planner/ai-orchestration';
import { FLUX_MAX_INPUT_IMAGES, loadApartmentReferenceImages } from '../services/generation-orchestrator.js';
import { schematicForInput } from './fixtures/apartment-interpretation.js';
import { Direction } from '@ai-floor-planner/core';
import type { GenerationOrchestratorInput } from '../services/generation-orchestrator.js';

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}
function png(w: number, h: number, shade: number): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  const raw = Buffer.alloc((w + 1) * h, shade);
  for (let y = 0; y < h; y++) raw[y * (w + 1)] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const input: GenerationOrchestratorInput = {
  projectId: 'phase2-refs',
  projectType: 'apartment',
  site: { plotWidth: 45000, plotDepth: 50000, roadFacing: Direction.North, setbacks: { front: 3000, rear: 2000, left: 2000, right: 2000 } },
  apartmentConfig: {
    projectType: 'apartment',
    jurisdiction: 'pune_pmc',
    floorCount: 4,
    flatsPerFloor: 2,
    unitMix: [{ unitType: '2BHK', count: 1, carpetAreaSqFt: 700 }, { unitType: '3BHK', count: 1, carpetAreaSqFt: 1000 }],
    commonCore: { passengerLifts: 2, serviceLifts: 0, staircaseCount: 2, fireStaircaseRequired: true, commonLobby: true },
    parking: { residentParkingCount: 2, visitorParkingCount: 1 },
    amenities: { groundSiteAmenities: [], buildingAmenities: [] },
  },
  seed: 42,
  candidateCount: 4,
};

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'afp-phase2-refs-'));
});
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

async function loadSlot(slot: number) {
  const { schematic } = schematicForInput(input, APARTMENT_CONCEPT_STRATEGIES[slot]!.id);
  return loadApartmentReferenceImages({
    projectType: 'apartment',
    flatsPerFloor: 2,
    schematic,
    conceptSlot: slot,
    styleCapWithSchematic: FLUX_MAX_INPUT_IMAGES - 1,
    conceptReferenceDirs: [dir],
  });
}

describe('Phase 2 — available-reference handling', () => {
  it('2 distinct references: every concept gets schematic + both, rotated, never duplicated', async () => {
    fs.writeFileSync(path.join(dir, 'ref_concept_01.png'), png(40, 30, 10));
    fs.writeFileSync(path.join(dir, 'ref_concept_02.png'), png(30, 40, 200));
    const orders: string[] = [];
    for (let slot = 0; slot < 4; slot++) {
      const r = await loadSlot(slot);
      const ids = r.referenceImages.map(i => i.id);
      expect(ids[0]).toBe('schematic_scaffold');
      expect(ids.slice(1).sort()).toEqual(['ref_concept_01', 'ref_concept_02']);
      expect(new Set(ids).size).toBe(ids.length);
      expect(r.diagnostics.distinctReferencesAvailable).toBe(2);
      expect(r.diagnostics.attachedReferenceIds).toHaveLength(2);
      expect(r.diagnostics.status).toBe('AVAILABLE');
      orders.push(ids.slice(1).join(','));
    }
    expect(orders).toEqual(['ref_concept_01,ref_concept_02', 'ref_concept_02,ref_concept_01', 'ref_concept_01,ref_concept_02', 'ref_concept_02,ref_concept_01']);
  });

  it('duplicate content is dropped as REFERENCE_DUPLICATE and never fills a slot', async () => {
    const a = png(40, 30, 10);
    fs.writeFileSync(path.join(dir, 'ref_concept_01.png'), a);
    fs.writeFileSync(path.join(dir, 'ref_concept_02.png'), a);
    fs.writeFileSync(path.join(dir, 'ref_concept_03.png'), png(30, 40, 200));
    fs.writeFileSync(path.join(dir, 'ref_concept_04.png'), png(30, 40, 200));
    const r = await loadSlot(0);
    const styleIds = r.referenceImages.map(i => i.id).filter(id => id !== 'schematic_scaffold');
    expect(styleIds.sort()).toEqual(['ref_concept_01', 'ref_concept_03']);
    expect(r.diagnostics.distinctReferencesAvailable).toBe(2);
    expect(r.diagnostics.requestedReferenceIds).toEqual(['ref_concept_01', 'ref_concept_03']);
    expect(r.diagnostics.drops.map(d => d.id).sort()).toEqual(['ref_concept_02', 'ref_concept_04']);
    expect(r.diagnostics.drops.every(d => d.reason.startsWith('REFERENCE_DUPLICATE'))).toBe(true);
  });

  it('4 distinct references: 3 per concept (FLUX 4-image cap), all four used across the batch', async () => {
    [10, 60, 120, 200].forEach((s, i) => fs.writeFileSync(path.join(dir, `ref_concept_0${i + 1}.png`), png(32, 32, s)));
    const used = new Set<string>();
    for (let slot = 0; slot < 4; slot++) {
      const r = await loadSlot(slot);
      expect(r.referenceImages).toHaveLength(FLUX_MAX_INPUT_IMAGES);
      expect(r.diagnostics.distinctReferencesAvailable).toBe(4);
      r.referenceImages.slice(1).forEach(i => used.add(i.id));
    }
    expect(used.size).toBe(4);
  });

  it('input image 1 is always the flux_concept scaffold of the slot schematic', async () => {
    fs.writeFileSync(path.join(dir, 'ref_concept_01.png'), png(40, 30, 10));
    for (let slot = 0; slot < 4; slot++) {
      const r = await loadSlot(slot);
      const { schematic } = schematicForInput(input, APARTMENT_CONCEPT_STRATEGIES[slot]!.id);
      expect(r.referenceImages[0]!.base64Data).toBe(renderSchematicPng512(schematic, { mode: 'flux_concept' }).toString('base64'));
    }
  });
});
