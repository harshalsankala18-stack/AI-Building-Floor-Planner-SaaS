/**
 * Phase 2 — apartment FLUX generation quality.
 *
 * The FLUX request must communicate the deterministic layout without relying on
 * long generated text: compact manifest-derived prompt, the deterministic layout
 * as input image 1, a short fixed label vocabulary, self-explanatory core symbols,
 * exact requirement counts and plot-derived (non-square) output.
 */
import { describe, expect, it } from 'vitest';
import { createBuilding, Direction, type Site } from '@ai-floor-planner/core';
import { buildApartmentGenerationManifest } from '../apartment/manifest';
import { generateDeterministicApartmentSchematic } from '../apartment/schematic';
import { getApartmentRulesProfile } from '../apartment/jurisdiction';
import { APARTMENT_CONCEPT_STRATEGIES } from '../apartment/layout-planner';
import {
  FLUX_CONCEPT_CORE_LABELS,
  FLUX_CONCEPT_ROOM_LABELS,
  FLUX_CONCEPT_SHORT_FALLBACKS,
  fluxConceptRoomLabel,
  renderSchematicPng512,
  type DrawnSchematicLabel,
} from '../apartment/schematic-renderer';
import {
  APARTMENT_CONCEPT_CORE_WORDS,
  APARTMENT_CONCEPT_ROOM_WORDS,
  apartmentConceptLabelVocabulary,
  compileApartmentFloorPlanImagePrompt,
  FLOOR_PLAN_PROMPT_VERSION,
  type ReferenceImageInput,
} from '../orchestration/image-prompt-compiler';
import type { ApartmentBriefConfig } from '../types/apartment';

type Mix = ApartmentBriefConfig['unitMix'];
const MIX_2F: Mix = [{ unitType: '2BHK', count: 1, carpetAreaSqFt: 700 }, { unitType: '3BHK', count: 1, carpetAreaSqFt: 1000 }];

function brief(flats: number, unitMix: Mix, lifts = 2, stairs = 2): ApartmentBriefConfig {
  return {
    projectType: 'apartment',
    jurisdiction: 'pune_pmc',
    floorCount: 4,
    flatsPerFloor: flats,
    unitMix,
    commonCore: { passengerLifts: lifts, serviceLifts: 0, staircaseCount: stairs, fireStaircaseRequired: true, commonLobby: true },
    parking: { residentParkingCount: flats, visitorParkingCount: 1 },
    amenities: { groundSiteAmenities: [], buildingAmenities: [] },
    floorStrategy: 'typical',
  } as ApartmentBriefConfig;
}

function site(widthM: number, depthM: number): Site {
  return createBuilding({
    projectId: 'phase2',
    name: 'Phase 2',
    site: { plotWidth: widthM * 1000, plotDepth: depthM * 1000, plannedFloorCount: 4, roadFacing: Direction.North, setbacks: { front: 3000, rear: 2000, left: 2000, right: 2000 }, orientation: 0 },
    floors: [{ buildingId: 'phase2', level: 0 }],
  }).site;
}

function manifestFor(s: Site, b: ApartmentBriefConfig) {
  return buildApartmentGenerationManifest({
    site: { plotWidthMm: s.plotWidth, plotDepthMm: s.plotDepth, setbacksMm: s.setbacks, roadFacing: 'north' },
    apartmentConfig: b,
  });
}

const rules = getApartmentRulesProfile('pune_pmc', { floorCount: 4, buildingHeightM: 12.4, tenementsPerFloor: 2 });
function schematicFor(flats: number, unitMix: Mix, strategy: (typeof APARTMENT_CONCEPT_STRATEGIES)[number]['id'] = 'balanced') {
  return generateDeterministicApartmentSchematic({
    siteWidthM: 45, siteDepthM: 50, setbacksM: { front: 3, rear: 2, left: 2, right: 2 },
    flatsPerFloor: flats, unitMix: unitMix.map(u => ({ ...u })),
    commonCoreConfig: { passengerLifts: 2, staircaseCount: 2, commonLobby: true },
    rulesProfile: rules, strategy,
  });
}

function fluxLabels(schematic: ReturnType<typeof schematicFor>): DrawnSchematicLabel[] {
  const labels: DrawnSchematicLabel[] = [];
  renderSchematicPng512(schematic, { mode: 'flux_concept', onLabel: l => labels.push(l) });
  return labels;
}

const schematicRef = (seedTag: string): ReferenceImageInput => ({ id: 'schematic_scaffold', name: 'schematic_scaffold.png', base64Data: seedTag, mimeType: 'image/png' });
const styleRef = (id: string): ReferenceImageInput => ({ id, name: `${id}.png`, base64Data: id, mimeType: 'image/png' });

function conceptPrompt(opts: { flats?: number; mix?: Mix; refs?: readonly ReferenceImageInput[]; lifts?: number; stairs?: number; plot?: [number, number]; n?: number } = {}) {
  const s = site(...(opts.plot ?? [45, 50]));
  const b = brief(opts.flats ?? 2, opts.mix ?? MIX_2F, opts.lifts, opts.stairs);
  const strategy = APARTMENT_CONCEPT_STRATEGIES[(opts.n ?? 1) - 1]!;
  return compileApartmentFloorPlanImagePrompt({
    site: s,
    apartmentConfig: b,
    manifest: manifestFor(s, b),
    seed: 42,
    referenceImages: opts.refs ?? [schematicRef('s'), styleRef('ref_concept_01'), styleRef('ref_concept_02')],
    concept: { candidateNumber: strategy.candidateNumber, candidateCount: 4, label: strategy.label, intent: strategy.intent },
  });
}

describe('Phase 2 — compact FLUX concept instruction', () => {
  it('is compact, schematic-first and carries the Phase 2 directives', () => {
    const { prompt, promptVersion } = conceptPrompt();
    expect(promptVersion).toBe(FLOOR_PLAN_PROMPT_VERSION);
    expect(FLOOR_PLAN_PROMPT_VERSION).toBe(3);
    expect(prompt.length).toBeLessThan(1700);
    expect(prompt.split('\n').length).toBeLessThanOrEqual(12);
    expect(prompt).toContain('Generate ONE professional top-down Indian apartment floor plan');
    expect(prompt).toContain('Input image 1 is the deterministic layout and the primary structural reference');
    expect(prompt).toContain('keep its flat boundaries, core, lifts, stairs, common lobby, room arrangement, doors and proportions');
    expect(prompt).toContain('Priority: user requirements > deterministic layout > reference style.');
    expect(prompt).toContain('do not convert the layout into a rigid square grid');
    expect(prompt).toContain('turn the project into a villa');
    expect(prompt).toContain('The lobby never opens into a bedroom or bath.');
  });

  it('uses the short label vocabulary only (no LIV/DIN, MASTER BED, BALCONY, COMMON LOBBY, DRESS)', () => {
    const { prompt } = conceptPrompt();
    const labelLine = prompt.split('\n').find(l => l.startsWith('English labels only'))!;
    expect(labelLine).toContain('FLAT 01, FLAT 02, 2BHK, 3BHK, LIVING, DINING, KITCHEN, BEDROOM, BATH, UTILITY, FOYER, LIFT, STAIR, LOBBY.');
    expect(labelLine).toContain('No other text, no dimensions.');
    for (const banned of ['LIV/DIN', 'LIVING/DINING', 'MASTER BED', 'BALCONY', 'COMMON LOBBY', 'DRESS', 'PASSAGE', 'DUCT']) {
      expect(labelLine).not.toContain(banned);
    }
  });

  it('describes the reference role truthfully for the references actually attached (never pretends four)', () => {
    expect(conceptPrompt().prompt).toContain('Input images 2-3 are visual style and planning-language references only: never copy their flat count, geometry or text.');
    expect(conceptPrompt({ refs: [schematicRef('s'), styleRef('ref_concept_01')] }).prompt).toContain('Input image 2 is a visual style and planning-language reference only');
    const none = conceptPrompt({ refs: [schematicRef('s')] }).prompt;
    expect(none).not.toMatch(/Input images? 2/);
    expect(none).toContain('Input image 1 is the deterministic layout');
  });

  it('preserves exact requirements from the manifest (not hard-coded to the 2-flat scenario)', () => {
    const p2 = conceptPrompt().prompt;
    expect(p2).toContain('EXACTLY 2 flats: FLAT 01 2BHK = 2 bedrooms, 2 baths, living, dining, kitchen, utility; FLAT 02 3BHK = 3 bedrooms, 3 baths, living, dining, kitchen, utility.');
    expect(p2).toContain('EXACTLY 2 lifts (square shafts with X), EXACTLY 2 stairs (treads with a centre divider), ONE shaded common lobby');

    const p4 = conceptPrompt({ flats: 4, mix: [{ unitType: '2BHK', count: 3, carpetAreaSqFt: 650 }, { unitType: '1BHK', count: 1, carpetAreaSqFt: 450 }], lifts: 1, stairs: 1, plot: [60, 45] }).prompt;
    expect(p4).toContain('EXACTLY 4 flats: FLAT 01 ');
    expect(p4).toContain('FLAT 04 ');
    expect(p4).toContain('EXACTLY 1 lifts');
    expect(p4).toContain('EXACTLY 1 stairs');
    expect(p4).not.toContain('3BHK');
    expect(p4.split('\n').find(l => l.startsWith('English labels only'))).toContain('FLAT 01, FLAT 02, FLAT 03, FLAT 04, 2BHK, 1BHK, LIVING');
  });

  it('keeps the strategy identity per concept while every hard requirement line is identical', () => {
    const prompts = [1, 2, 3, 4].map(n => conceptPrompt({ n }).prompt);
    APARTMENT_CONCEPT_STRATEGIES.forEach((st, i) => expect(prompts[i]).toContain(`CONCEPT 0${st.candidateNumber} of 04 - ${st.label}: ${st.intent}`));
    const hardLines = (p: string) => p.split('\n').filter(l => /^(EXACTLY|Common core|Entry in every flat|English labels only|Do not add)/.test(l));
    for (const p of prompts) expect(hardLines(p)).toEqual(hardLines(prompts[0]!));
  });

  it('vocabulary = manifest flat labels + unit types + fixed room/core words', () => {
    const s = site(45, 50);
    const vocab = apartmentConceptLabelVocabulary(manifestFor(s, brief(2, MIX_2F)));
    expect(vocab).toEqual(['FLAT 01', 'FLAT 02', '2BHK', '3BHK', ...APARTMENT_CONCEPT_ROOM_WORDS, ...APARTMENT_CONCEPT_CORE_WORDS]);
  });
});

describe('Phase 2 — output aspect (plot-derived, never unconditionally square)', () => {
  it('portrait plot → portrait output, wide plot → landscape output', () => {
    const portrait = conceptPrompt({ plot: [45, 50] });
    expect(portrait.height).toBeGreaterThan(portrait.width);
    const landscape = conceptPrompt({ plot: [60, 30] });
    expect(landscape.width).toBeGreaterThan(landscape.height);
    for (const r of [portrait, landscape]) {
      expect(r.width % 64).toBe(0);
      expect(r.height % 64).toBe(0);
    }
  });
});

describe('Phase 2 — FLUX scaffold (deterministic layout as input image 1)', () => {
  const allowed = new Set<string>([...FLUX_CONCEPT_ROOM_LABELS, ...FLUX_CONCEPT_SHORT_FALLBACKS, ...FLUX_CONCEPT_CORE_LABELS]);

  it.each(APARTMENT_CONCEPT_STRATEGIES.map(s => s.id))('%s: draws only the short vocabulary and every programme element', strategy => {
    const sch = schematicFor(2, MIX_2F, strategy);
    const labels = fluxLabels(sch);
    for (const l of labels.filter(x => x.kind === 'room' || x.kind === 'core')) expect(allowed.has(l.text)).toBe(true);
    // Flat tags and unit types are drawn once per flat, from the schematic.
    expect(labels.filter(l => l.kind === 'flat').map(l => l.text)).toEqual(['FLAT 01', 'FLAT 02']);
    expect(labels.filter(l => l.kind === 'unit_type').map(l => l.text)).toEqual(['2BHK', '3BHK']);
    // Core: one word per element, counts equal the schematic.
    expect(labels.filter(l => l.text === 'LIFT')).toHaveLength(sch.core.lifts.length);
    expect(labels.filter(l => l.text === 'STAIR')).toHaveLength(sch.core.stairs.length);
    expect(labels.filter(l => l.text === 'LOBBY')).toHaveLength(1);
    // 2BHK / 3BHK differentiation is visible: one bedroom word per bedroom.
    for (const u of sch.units) {
      const beds = labels.filter(l => l.flatId === u.flatId && (l.text === 'BEDROOM' || l.text === 'BED'));
      const expected = u.rooms.filter(r => fluxConceptRoomLabel(r.name, r.type)?.lines[0] === 'BEDROOM').length;
      expect(beds).toHaveLength(expected);
      expect(expected).toBe(u.unitType === '3BHK' ? 3 : 2);
      const flatWords = new Set(labels.filter(l => l.flatId === u.flatId).map(l => l.text));
      expect(flatWords.has('LIVING')).toBe(true);
      expect(flatWords.has('DINING')).toBe(true);
      expect(flatWords.has('KITCHEN') || flatWords.has('KIT')).toBe(true);
      expect(flatWords.has('BATH') || flatWords.has('WC')).toBe(true);
      expect(flatWords.has('FOYER')).toBe(true);
    }
    // Combined labels / long words never reach FLUX.
    const texts = labels.map(l => l.text);
    for (const banned of ['LIV/DIN', 'LIVING/DINING', 'MASTER BED', 'M.BED', 'BALC', 'B', 'DUCT', 'DRESS', 'PASSAGE', 'COMMON LOBBY', 'STAIR 01', 'LIFT 01']) {
      expect(texts).not.toContain(banned);
    }
  });

  it('room words use one uniform size; only flat tags and the lobby may be larger', () => {
    const labels = fluxLabels(schematicFor(2, MIX_2F));
    expect(labels.filter(l => l.kind === 'room').every(l => l.scale === 1)).toBe(true);
    expect(labels.every(l => l.scale === 1 || l.scale === 2)).toBe(true);
  });

  it('is a valid deterministic 512x512 PNG that differs from the base plan and between strategies', () => {
    const sch = schematicFor(2, MIX_2F);
    const a = renderSchematicPng512(sch, { mode: 'flux_concept' });
    const b = renderSchematicPng512(sch, { mode: 'flux_concept' });
    expect(a.equals(b)).toBe(true);
    expect(a.readUInt32BE(16)).toBe(512);
    expect(a.readUInt32BE(20)).toBe(512);
    expect(a.equals(renderSchematicPng512(sch))).toBe(false);
    const perStrategy = APARTMENT_CONCEPT_STRATEGIES.map(st => renderSchematicPng512(schematicFor(2, MIX_2F, st.id), { mode: 'flux_concept' }).toString('base64'));
    expect(new Set(perStrategy).size).toBe(4);
  });

  it('base plan (fallback path) is unchanged: default mode === explicit base_plan and keeps its legacy labels', () => {
    const sch = schematicFor(2, MIX_2F);
    expect(renderSchematicPng512(sch).equals(renderSchematicPng512(sch, { mode: 'base_plan' }))).toBe(true);
    const labels: string[] = [];
    renderSchematicPng512(sch, { onLabel: l => labels.push(l.text) });
    expect(labels).toContain('MASTER BED');
    expect(labels).toContain('COMMON LOBBY');
  });

  it.each([1, 3, 4, 6])('generalised flat count: %i flats → one FLAT tag per flat and exact core words', flats => {
    const sch = schematicFor(flats, [{ unitType: '2BHK', count: flats, carpetAreaSqFt: 600 }]);
    const labels = fluxLabels(sch);
    expect(labels.filter(l => l.kind === 'flat').map(l => l.text)).toEqual(Array.from({ length: flats }, (_, i) => `FLAT ${String(i + 1).padStart(2, '0')}`));
    expect(labels.filter(l => l.text === 'LIFT').length).toBeLessThanOrEqual(sch.core.lifts.length);
    expect(labels.filter(l => l.text === 'STAIR').length).toBeLessThanOrEqual(sch.core.stairs.length);
  });
});

describe('Phase 2 — short-label strategy table', () => {
  it.each([
    ['Master Bedroom', 'master_bedroom', ['BEDROOM']],
    ['Bedroom 2', 'bedroom', ['BEDROOM']],
    ['Master Toilet (En-suite)', 'bathroom', ['BATH']],
    ['Living & Dining', 'living_dining', ['LIVING', 'DINING']],
    ['Kitchen', 'kitchen', ['KITCHEN']],
    ['Dry Balcony / Utility', 'utility', ['UTILITY']],
    ['Foyer', 'foyer', ['FOYER']],
  ])('%s → %j', (name, type, lines) => {
    expect(fluxConceptRoomLabel(name, type)?.lines).toEqual(lines);
  });

  it.each([
    ['Dressing', 'dress'],
    ['Passage', 'passage'],
    ['Balcony', 'balcony'],
    ['Store', 'store'],
  ])('%s is drawn without text', (name, type) => {
    expect(fluxConceptRoomLabel(name, type)).toBeNull();
  });
});
