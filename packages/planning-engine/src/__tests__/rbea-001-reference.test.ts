import { describe, expect, it } from 'vitest';
import { RoomType } from '@ai-floor-planner/core';
import { rbea001 as reference } from './fixtures/rbea-001';

const spaces = reference.floors.flatMap(f => f.spaces);
const find = (id: string) => spaces.find(s => s.id === id)!;
const connects = (from: string, to: string, relation = 'access') =>
  reference.relationships.some(r => r.from === from && r.to === to && r.relation === relation);

describe('RBEA-001 source reference contract, not generator acceptance', () => {
  it('keeps redacted identity, two inspected sheets and professional provenance distinct', () => {
    expect(reference).toMatchObject({ id: 'RBEA-001', projectId: 'RBEA-001', displayName: 'Professional Reference 001' });
    expect(reference.source).toMatchObject({ redacted: true, drawingInspected: true, sheetsInspected: [1, 2],
      sheetCount: 2, category: 'professional_internal_reference', professionalStatus: 'REFERENCE_ACCEPTED_BY_PRACTICE',
      statusProvenance: 'USER_REPORTED', softwareProfessionallyValidated: false });
    expect(reference.projectContext.productionGeneratorScope).toBe('residential_only');
    expect(reference.floors.map(f => [f.level, f.activeResidentialBenchmark])).toEqual([[0, true], [1, true]]);
  });

  it('preserves the actual bedroom and bathroom inventories on their source floors', () => {
    expect(reference.floors.map(f => f.spaces.filter(s => s.canonicalType === RoomType.Bedroom).length)).toEqual([2, 3]);
    expect(reference.floors.map(f => f.spaces.filter(s => s.canonicalType === RoomType.Bathroom).length)).toEqual([3, 4]);
    for (const f of reference.floors) for (const s of f.spaces) {
      expect(s.sourceSheet).toBe(f.level + 1);
      expect(s.provenance).toBe('VERIFIED_FROM_SOURCE');
    }
  });

  it('resolves every relationship, suite, common bath, dimension and path to unique entities', () => {
    const ids = [...spaces.map(s => s.id), ...reference.projectContext.roads.map(r => r.id)];
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of reference.relationships) {
      expect(ids).toContain(r.from); expect(ids).toContain(r.to);
      expect(r.strength).toBe('OBSERVED');
    }
    for (const path of reference.accessPaths) for (const id of path.nodes) expect(ids).toContain(id);
    for (const suite of reference.sourceAudit.suiteAccess) for (const id of suite.route) expect(ids).toContain(id);
    for (const bath of reference.sourceAudit.commonBaths) {
      expect(ids).toContain(bath.bathroomId); expect(ids).toContain(bath.accessFrom);
    }
    for (const d of reference.referenceDimensions) expect(ids).toContain(d.spaceId);
  });

  it('records each private suite once and separates dressing-mediated access from direct doors', () => {
    const suites = reference.sourceAudit.suiteAccess;
    expect(new Set(suites.map(s => s.bathroomId)).size).toBe(5);
    expect(suites.filter(s => s.directDoor)).toHaveLength(4);
    const master = suites.find(s => s.bedroomId === 'ground_master_01')!;
    expect(master.route).toEqual(['ground_master_01', 'ground_dressing', 'ground_master_bath']);
    expect(master.directDoor).toBe(false);
    expect(connects('ground_master_01', 'ground_master_bath')).toBe(false);
    for (const s of suites) {
      expect(find(s.bedroomId).canonicalType).toBe(RoomType.Bedroom);
      expect(find(s.bathroomId)).toMatchObject({ canonicalType: RoomType.Bathroom, ownership: 'VERIFIED_SUITE_ASSOCIATION' });
      expect(s.commonAccess).toBe(false);
      for (let i = 1; i < s.route.length; i++) expect(connects(s.route[i - 1]!, s.route[i]!)).toBe(true);
    }
  });

  it('preserves both common-bath ownership uncertainties instead of assigning nearby bedrooms', () => {
    expect(reference.sourceAudit.commonBaths).toHaveLength(2);
    for (const bath of reference.sourceAudit.commonBaths) {
      expect(bath.ownerId).toBeNull();
      expect(bath.ownershipProvenance).toBe('AMBIGUOUS');
      expect(find(bath.bathroomId).ownership).toBe('AMBIGUOUS');
      expect(connects(bath.accessFrom, bath.bathroomId)).toBe(true);
      expect(reference.sourceAudit.suiteAccess.some(s => s.bathroomId === bath.bathroomId)).toBe(false);
    }
  });

  it('records Ground Parents intent as contextual source evidence without a universal rule', () => {
    expect(reference.sourceAudit.parentsFloor).toMatchObject({ spaceId: 'ground_parents', floorLevel: 0,
      provenance: 'VERIFIED_FROM_SOURCE', generalization: 'CONTEXT_DEPENDENT', universalRule: false });
    expect(connects('ground_parents', 'ground_parents_bath')).toBe(true);
  });

  it('keeps the combined hall, store and niche distinct from invented separate rooms', () => {
    expect(find('ground_kitchen_dining_family')).toMatchObject({ kind: 'functional_cluster', canonicalType: null });
    expect(find('ground_pooja').kind).toBe('functional_cluster');
    expect(reference.sourceAudit.pooja.limitation).toBe('CANONICAL_ZONE_CLASSIFICATION_LIMITATION');
    for (const to of ['ground_store', 'ground_utility']) expect(connects('ground_kitchen_dining_family', to)).toBe(true);
    expect(connects('ground_kitchen_dining_family', 'ground_pooja', 'cluster')).toBe(true);
  });

  it('encodes source-supported arrival paths whose every step has a physical access relation', () => {
    for (const path of reference.accessPaths) {
      for (let i = 1; i < path.nodes.length; i++) expect(connects(path.nodes[i - 1]!, path.nodes[i]!)).toBe(true);
      expect(path.nodes.some(id => find(id)?.canonicalType === RoomType.Bedroom)).toBe(false);
    }
    expect(reference.sourceAudit.privateBedroomTransitRequiredForCommonArrival).toBe(false);
    expect(reference.accessPaths.find(p => p.id === 'vehicle_arrival')!.nodes)
      .toEqual(['frontage_primary', 'ground_main_gate', 'ground_paving', 'ground_garage']);
    expect(connects('frontage_primary', 'ground_wicket')).toBe(false);
  });

  it('retains intentional outdoor, transition and infrastructure categories', () => {
    for (const id of ['ground_lawn', 'ground_gazebo', 'first_balcony', 'first_sitout', 'first_terrace']) expect(find(id).kind).toBe('outdoor');
    for (const id of ['ground_veranda', 'ground_porch']) expect(find(id).kind).toBe('transition');
    for (const id of ['ground_skylight', 'first_skylight', 'first_living_void']) expect(find(id)).toMatchObject({
      kind: 'infrastructure_reservation', canonicalType: null,
    });
    expect(connects('first_master_03', 'first_balcony')).toBe(true);
    expect(connects('first_family', 'first_sitout')).toBe(true);
    expect(connects('first_circulation', 'first_terrace')).toBe(true);
  });

  it('records architectural core continuity and the living void without engineering claims', () => {
    for (const [a, b] of [['ground_stair', 'first_stair'], ['ground_skylight', 'first_skylight'], ['ground_living', 'first_living_void']]) {
      expect(connects(a!, b!, 'vertical_alignment')).toBe(true);
    }
    expect(reference.sourceAudit.verticalCore.status).toBe('VERIFIED_ARCHITECTURAL_COORDINATION');
    expect(reference.sourceAudit.reducedPlate.note).toContain('Not a uniform scaled copy');
    expect(reference.sourceAudit.wetServiceCoordination.note).toContain('Exact risers and pipe routes are not established');
  });

  it('preserves only complete evidence-only room dimension pairs', () => {
    expect(reference.referenceDimensions).toHaveLength(18);
    expect(new Set(reference.referenceDimensions.map(d => d.spaceId)).size).toBe(reference.referenceDimensions.length);
    for (const d of reference.referenceDimensions) {
      expect(d.sourceSheet).toBe(find(d.spaceId).sourceSheet);
      expect(d).toMatchObject({ units: 'feet_and_inches', provenance: 'VERIFIED_FROM_SOURCE', use: 'REFERENCE_EVIDENCE_ONLY' });
      expect(d.sideA).toMatch(/^\d+'-\d+(\.\d+)?"$/);
      expect(d.sideB).toMatch(/^\d+'-\d+(\.\d+)?"$/);
    }
    expect(reference.referenceDimensions.some(d => d.spaceId === 'first_living_void')).toBe(false);
  });

  it('does not import an FD expansion or opening schedule from another reference', () => {
    expect(reference.openings.map(o => o.code)).toEqual(['D', 'W', 'V', 'FD', 'RS']);
    for (const code of ['FD', 'RS']) expect(reference.openings.find(o => o.code === code)).toMatchObject({
      presenceProvenance: 'VERIFIED_FROM_SOURCE', meaningProvenance: 'AMBIGUOUS', meaning: 'unknown_specific_opening_type',
    });
    const codes = reference.openings.map(o => o.code);
    for (const s of spaces) for (const code of s.openings) expect(codes).toContain(code);
    for (const s of spaces.filter(s => s.canonicalType === RoomType.Bedroom)) expect(s.openings).toContain('W');
    for (const s of spaces.filter(s => s.canonicalType === RoomType.Bathroom)) expect(s.openings).toContain('V');
  });

  it('records furniture and site observations without asserting solver or parking capacity validation', () => {
    expect(reference.projectContext.parkingObservation).toMatchObject({ carsShown: 2, twoWheelersShown: 1, regulatoryCapacityClaim: false });
    expect(reference.furnishability.map(f => f.id)).toContain('kitchen_counter_sink_hob');
    expect(reference.furnishability.every(f => f.solverImplemented === false && f.provenance === 'VERIFIED_FROM_SOURCE')).toBe(true);
    expect(reference.projectContext.cardinalOrientation).toBe('NOT_ESTABLISHED');
  });

  it('documents benchmark gaps and candidates without declaring invariants or changing legacy debt', () => {
    const comparison = (category: string) => reference.inlineBenchmarkComparison.find(c => c.category === category)!;
    expect(comparison('floor_intent').status).toBe('MATCHES_SOURCE');
    expect(comparison('dimensions').status).toBe('CONTRADICTS_SOURCE');
    expect(comparison('physical_bath_topology').note).toContain('Dressing');
    expect(comparison('room_inventory').note).toContain('seven source baths versus five');
    expect(comparison('openings_exposure').status).toBe('MISSING_FROM_INLINE_BENCHMARK');
    expect(reference.generalizableCandidates.every(c => c.invariantStrength === 'NOT_ASSIGNED' && c.provenance === 'ASSERTED_FROM_BRIEF')).toBe(true);
    expect(reference.deferredTechnicalDebt).toContain('LEGACY_BATH_OWNERSHIP_FALLBACK_DEBT');
    expect(reference.unresolvedObservations.every(o => o.provenance === 'AMBIGUOUS')).toBe(true);
  });

  it('excludes copied geometry, source paths and personal metadata', () => {
    const forbidden = /^(x|y|coordinates|boundary|polygon|clientName|personName|address|phone|email|signature|titleBlock|sourcePdf|sourcePath)$/i;
    const visit = (value: unknown): void => {
      if (!value || typeof value !== 'object') return;
      for (const [key, child] of Object.entries(value)) { expect(key).not.toMatch(forbidden); visit(child); }
    };
    visit(reference);
    const serialized = JSON.stringify(reference);
    expect(serialized).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(serialized).not.toMatch(/\b\d{10,}\b|\.pdf\b|data:image|data:application|[A-Z]:[\\/]/i);
    // Structural/format checks complement manual redaction review; they are not a universal PII detector.
  });
});
