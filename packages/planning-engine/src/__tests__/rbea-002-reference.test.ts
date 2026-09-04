import { describe, expect, it } from 'vitest';
import { FunctionalZone, RoomType } from '@ai-floor-planner/core';
import { rbea002 as reference } from './fixtures/rbea-002';

const spaces = reference.floors.flatMap(floor => floor.spaces);
const find = (id: string) => spaces.find(space => space.id === id)!;
const has = (from: string, to: string, relation: string, strength = 'STRONG') =>
  reference.relationships.some(item => item.from === from && item.to === to && item.relation === relation && item.strength === strength);

describe('RBEA-002 redacted reference contract (not generator acceptance)', () => {
  it('preserves redacted identity and honest source provenance', () => {
    expect(reference).toMatchObject({ id: 'RBEA-002', projectId: 'RBEA-002', displayName: 'Professional Reference 002' });
    expect(reference.source).toMatchObject({ redacted: true, evidenceBasis: 'SOURCE_AUDITED_WITH_BRIEF_INTERPRETATIONS', drawingInspected: true, sheetsInspected: [1, 2, 3],
      softwareProfessionallyValidated: false, professionalStatus: 'REFERENCE_ACCEPTED_BY_PRACTICE', statusProvenance: 'USER_REPORTED' });
  });
  it('records two source-verified 9 m frontages without inventing compass orientation', () => {
    expect(reference.projectContext.roads.map(road => road.widthMetres)).toEqual([9, 9]);
    expect(reference.projectContext.roads.map(road => road.pageSide)).toEqual(['bottom_front', 'left_side']);
    expect(reference.projectContext.cardinalOrientation).toBe('NOT_ESTABLISHED');
    expect(reference.projectContext.remainingPlot.continuesBeyondDevelopedZone).toBe(true);
    expect(reference.projectContext.roads.every(r => r.provenance === 'VERIFIED_FROM_SOURCE' && r.sourceSheet === 1)).toBe(true);
  });
  it('keeps commercial ground context outside active residential generation', () => {
    expect(reference.floors.map(f => [f.level, f.activeResidentialBenchmark])).toEqual([[0, false], [1, true], [2, true]]);
    expect(reference.floors[0].spaces.filter(s => s.kind === 'commercial_context')).toHaveLength(4);
    expect(reference.projectContext.productionGeneratorScope).toBe('residential_only');
  });
  it('resolves every relationship and path against unique semantic IDs', () => {
    const ids = [...spaces.map(space => space.id), ...reference.projectContext.roads.map(road => road.id)];
    expect(new Set(ids).size).toBe(ids.length);
    for (const relation of reference.relationships) {
      expect(ids).toContain(relation.from); expect(ids).toContain(relation.to);
      expect(relation.confidence).toBe('ASSERTED');
      expect(relation.provenance).toBe(relation.relation === 'vertical_alignment' ? 'VERIFIED_FROM_SOURCE' : 'ASSERTED_FROM_BRIEF');
    }
    for (const path of reference.accessPaths) for (const id of path.nodes) expect(ids).toContain(id);
  });
  it('separates shop frontage access from private residential arrival', () => {
    for (let n = 1; n <= 4; n++) {
      expect(has(`ground_shop_${n}`, 'frontage_secondary', 'access')).toBe(true);
      expect(has(`ground_shop_${n}`, 'ground_entrance_lobby', 'avoid_private_transit', 'AVOID')).toBe(true);
    }
    expect(reference.projectContext.independentAccessFlows.legalSeparationClaim).toBe(false);
  });
  it('records usable arrival chains rather than just parking rectangles', () => {
    expect(reference.accessPaths.find(p => p.id === 'vehicle_arrival')!.nodes)
      .toEqual(['frontage_primary', 'ground_main_gate', 'ground_open_paving', 'ground_parking']);
    expect(reference.accessPaths.find(p => p.id === 'pedestrian_arrival')!.nodes)
      .toEqual(['frontage_primary', 'ground_wicket', 'ground_entrance_lobby']);
    expect(reference.projectContext.parkingObservation).toMatchObject({ carsShown: 2, twoWheelersShown: 2, regulatoryCapacityClaim: false });
  });
  it('records kitchen/service and master-suite clusters without inventing direct ownership', () => {
    for (const [a, b] of [['first_kitchen', 'first_dining_family'], ['first_kitchen', 'first_utility'],
      ['first_master_bedroom', 'first_master_dressing'], ['first_master_dressing', 'first_master_bath'],
      ['first_master_bedroom', 'first_master_bath']]) expect(has(a!, b!, 'cluster')).toBe(true);
    expect(find('first_master_bath').ownership).toBe('VERIFIED_SUITE_ASSOCIATION');
    expect(find('first_common_attach_bath').ownership).toBe('AMBIGUOUS');
    expect(reference.relationships.filter(r => r.strength === 'REQUIRED')).toHaveLength(0);
  });
  it('retains common, outdoor and bedroom distribution expectations', () => {
    expect(has('first_living', 'first_dining_family', 'cluster')).toBe(true);
    expect(has('first_living', 'first_garden_terrace', 'cluster')).toBe(true);
    expect(has('first_dining_family', 'first_pooja', 'cluster', 'PREFERRED')).toBe(true);
    expect(has('first_entrance_lobby', 'first_living', 'access')).toBe(true);
    for (const id of ['first_master_bedroom', 'first_childrens_bedroom', 'first_other_bedroom']) {
      expect(find(id).zone).toBe(FunctionalZone.Private); expect(has('first_circulation', id, 'access')).toBe(true);
    }
    expect(reference.expectedCharacteristics.find(c => c.id === 'COMMON_DISTRIBUTION_HUB')!.note).toContain('unrelated bedroom transit');
  });
  it('preserves stair and lift continuity across all three floors', () => {
    for (const core of ['stair', 'lift']) {
      expect(has(`ground_${core}`, `first_${core}`, 'vertical_alignment')).toBe(true);
      expect(has(`first_${core}`, `second_${core}`, 'vertical_alignment')).toBe(true);
      for (const f of ['ground', 'first', 'second']) expect(has(`${f}_${core}`, `${f}_entrance_lobby`, 'access')).toBe(true);
    }
  });
  it('replaces unresolved upper suite clusters with source-verified spaces', () => {
    expect(reference.expectedCharacteristics.find(c => c.id === 'REDUCED_UPPER_PLATE')!.strength).toBe('OBSERVED');
    expect(find('second_terrace').kind).toBe('outdoor');
    for (const id of ['second_master_bedroom', 'second_master_dressing', 'second_master_bath', 'second_childrens_bath', 'second_balcony']) {
      expect(find(id)).toMatchObject({ provenance: 'VERIFIED_FROM_SOURCE', sourceSheet: 3 });
    }
    expect(spaces.some(s => s.id === 'second_master_suite' || s.id === 'second_private_cluster')).toBe(false);
    expect(reference.sourceAudit.reducedPlate.provenance).toBe('VERIFIED_FROM_SOURCE');
    expect(reference.expectedCharacteristics.find(c => c.id === 'WET_SERVICE_COORDINATION')!.strength).toBe('PREFERRED');
  });
  it('does not classify intentional non-room areas as ordinary rooms or waste', () => {
    expect(find('ground_borewell')).toMatchObject({ kind: 'infrastructure_reservation', canonicalType: null });
    for (const id of ['first_garden_terrace', 'first_balcony', 'second_terrace']) expect(find(id).kind).toBe('outdoor');
    expect(find('ground_open_paving').kind).toBe('access');
    expect(find('first_entrance_lobby').kind).toBe('transition');
    expect(find('first_balcony').canonicalType).toBe(RoomType.Balcony);
  });
  it('verifies opening presence and furniture without expanding ambiguous FD', () => {
    expect(reference.openings.map(o => o.code)).toEqual(['W', 'V', 'D', 'FD']);
    expect(reference.openings.find(o => o.code === 'FD')).toMatchObject({ meaning: 'unknown_specific_opening_type', confidence: 'AMBIGUOUS' });
    expect(reference.furnishability).toHaveLength(5);
    for (const item of reference.furnishability) expect(item).toMatchObject({ status: 'VERIFIED_FROM_SOURCE', solverImplemented: false });
    expect(reference.openings.every(o => o.presenceProvenance === 'VERIFIED_FROM_SOURCE')).toBe(true);
  });
  it('separates project-specific observations from generalized reference relationships', () => {
    expect(reference.projectSpecificObservations).toHaveLength(3);
    expect(reference.relationships.every(r => r.generalizable)).toBe(true);
    expect(reference.unresolvedObservations.map(o => o.id)).toEqual([
      'UNSTORED_DIMENSIONS', 'COMMON_ATTACH_OWNER', 'CARDINAL_ORIENTATION', 'EXACT_RISERS', 'FD',
    ]);
    expect(reference.unresolvedObservations.every(o => o.confidence === 'AMBIGUOUS')).toBe(true);
  });
  it('records the dressing-mediated master route and direct children’s bath openings', () => {
    for (const [index, floor] of ['first', 'second'].entries()) {
      const evidence = reference.sourceAudit.suiteAccess[index]!;
      expect(evidence.provenance).toBe('VERIFIED_FROM_SOURCE');
      expect(evidence.masterRoute).toEqual([`${floor}_master_bedroom`, `${floor}_master_dressing`, `${floor}_master_bath`]);
      expect(evidence.directBedroomToMasterBath).toBe(false);
      expect(evidence.childrensRoute).toEqual([`${floor}_childrens_bedroom`, `${floor}_childrens_bath`]);
      expect(evidence.directChildrensBathAccess).toBe(true);
      for (const id of [...evidence.masterRoute, ...evidence.childrensRoute]) expect(find(id)).toBeDefined();
    }
    expect(reference.sourceAudit.commonAttach).toMatchObject({ visibleAccessFrom: 'first_circulation',
      accessProvenance: 'VERIFIED_FROM_SOURCE', ownershipProvenance: 'AMBIGUOUS' });
  });
  it('keeps legible dimensions as reference-only evidence, never coordinates or universal minima', () => {
    expect(reference.referenceDimensions).toHaveLength(19);
    for (const item of reference.referenceDimensions) {
      expect(find(item.spaceId).sourceSheet).toBe(item.sourceSheet);
      expect(item).toMatchObject({ use: 'REFERENCE_EVIDENCE_ONLY', provenance: 'VERIFIED_FROM_SOURCE', units: 'feet_and_inches' });
      expect(item.sideA).toMatch(/^\d+'-\d+(\.\d+)?"$/);
      expect(item.sideB).toMatch(/^\d+'-\d+(\.\d+)?"$/);
    }
    expect(reference.referenceDimensions.find(d => d.spaceId === 'first_childrens_bedroom')!.sideB).toBe("14'-0\"");
    expect(reference.referenceDimensions.find(d => d.spaceId === 'second_childrens_bedroom')!.sideB).toBe("13'-7.5\"");
  });
  it('documents the Pooja classification limitation without changing canonical zoning', () => {
    expect(find('first_pooja').zone).toBe(FunctionalZone.Private);
    expect(reference.sourceAudit.pooja).toMatchObject({ canonicalZone: FunctionalZone.Private,
      relationshipTo: 'first_dining_family', relationshipProvenance: 'VERIFIED_FROM_SOURCE',
      limitation: 'CANONICAL_ZONE_CLASSIFICATION_LIMITATION' });
  });
  it('contains no copied geometry, private contact fields or raw source attachments', () => {
    const forbiddenKeys = /^(x|y|coordinates|boundary|polygon|roomDimensions|clientName|address|phone|email|signature|titleBlock|sourcePdf)$/i;
    const visit = (value: unknown): void => {
      if (!value || typeof value !== 'object') return;
      for (const [key, child] of Object.entries(value)) { expect(key).not.toMatch(forbiddenKeys); visit(child); }
    };
    visit(reference);
    const serialized = JSON.stringify(reference);
    expect(serialized).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(serialized).not.toMatch(/\b\d{10,}\b/);
    expect(serialized).not.toMatch(/\.pdf\b|data:image|data:application/i);
    // Heuristics complement manual content review; they do not prove absence of arbitrary PII.
  });
});
