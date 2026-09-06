import { describe, expect, it } from 'vitest';
import { FunctionalZone, RoomType } from '@ai-floor-planner/core';
import { rbea003 as reference } from './fixtures/rbea-003';

const spaces = reference.floors.flatMap(floor => floor.spaces);
const find = (id: string) => spaces.find(space => space.id === id)!;
const has = (from: string, to: string, relation = 'access') =>
  reference.relationships.some(item => item.from === from && item.to === to && item.relation === relation);

describe('RBEA-003 redacted reference contract (not generator acceptance)', () => {
  it('preserves honest one-sheet source provenance and scope', () => {
    expect(reference).toMatchObject({ id: 'RBEA-003', projectId: 'RBEA-003', displayName: 'Professional Reference 003',
      referenceType: 'compact_irregular_frontage_residential_reference' });
    expect(reference.source).toMatchObject({ redacted: true, drawingInspected: true, sheetsInspected: [1], sheetCount: 1,
      evidenceBasis: 'SOURCE_AUDITED_WITH_BRIEF_INTERPRETATIONS', softwareProfessionallyValidated: false,
      professionalStatus: 'REFERENCE_ACCEPTED_BY_PRACTICE', statusProvenance: 'USER_REPORTED' });
    expect(reference.projectContext.productionGeneratorScope).toBe('residential_only');
  });

  it('records three bedrooms and three distinct bathroom labels', () => {
    expect(spaces.filter(space => space.canonicalType === RoomType.Bedroom)).toHaveLength(3);
    expect(spaces.filter(space => space.canonicalType === RoomType.Bathroom).map(space => space.label))
      .toEqual(['Master Bath', 'Common Attach', 'Attach']);
    expect(find('first_master_bath').ownership).toBe('VERIFIED_SUITE_ASSOCIATION');
    expect(find('first_other_attach_bath').ownership).toBe('LABELLED_ATTACH_ASSOCIATION');
    expect(find('first_common_attach_bath').ownership).toBe('AMBIGUOUS');
  });

  it('resolves all relationship and access-path IDs against unique semantic spaces', () => {
    const ids = [...spaces.map(space => space.id), ...reference.projectContext.roads.map(road => road.id), 'building_perimeter'];
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of reference.relationships) {
      expect(ids).toContain(item.from); expect(ids).toContain(item.to);
      expect(item.confidence).toBe('ASSERTED'); expect(item.generalizable).toBe(true);
    }
    for (const path of reference.accessPaths) for (const id of path.nodes) expect(ids).toContain(id);
  });

  it('preserves the dressing-mediated master suite instead of inventing a direct bath door', () => {
    const topology = reference.sourceAudit.bathroomTopology.find(item => item.bathSpaceId === 'first_master_bath')!;
    expect(topology.route).toEqual(['first_master_bedroom', 'first_master_dressing', 'first_master_bath']);
    expect(topology).toMatchObject({ directAccessFrom: 'first_master_dressing', directBedroomToBath: false,
      commonAreaAccessVisible: false, ownership: 'VERIFIED_SUITE_ASSOCIATION', provenance: 'VERIFIED_FROM_SOURCE' });
    expect(has('first_master_bedroom', 'first_master_dressing')).toBe(true);
    expect(has('first_master_dressing', 'first_master_bath')).toBe(true);
  });

  it('keeps the labelled Attach association separate from direct or exclusive access', () => {
    const topology = reference.sourceAudit.bathroomTopology.find(item => item.bathSpaceId === 'first_other_attach_bath')!;
    expect(topology.route).toEqual(['first_upper_bedroom', 'first_other_attach_vestibule', 'first_other_attach_bath']);
    expect(topology).toMatchObject({ directBedroomToBath: false, commonAreaAccessVisible: true,
      ownership: 'LABELLED_ATTACH_ASSOCIATION', confidence: 'AMBIGUOUS' });
    expect(has('first_other_attach_vestibule', 'first_upper_bedroom')).toBe(true);
    expect(has('first_other_attach_vestibule', 'first_other_attach_bath')).toBe(true);
  });

  it('keeps Common Attach on a common access route with ambiguous ownership', () => {
    const topology = reference.sourceAudit.bathroomTopology.find(item => item.bathSpaceId === 'first_common_attach_bath')!;
    expect(topology.route).toEqual(['first_family_sitout', 'first_common_attach_bath']);
    expect(topology).toMatchObject({ directBedroomToBath: false, commonAreaAccessVisible: true,
      ownership: 'AMBIGUOUS', confidence: 'AMBIGUOUS' });
    expect(has('first_family_sitout', 'first_common_attach_bath')).toBe(true);
  });

  it('records the arrival and compact common/service hierarchy', () => {
    expect(reference.accessPaths.find(path => path.id === 'arrival_to_common_space')!.nodes)
      .toEqual(['first_staircase', 'first_entry', 'first_entrance_lobby', 'first_living']);
    for (const [from, to, relation] of [
      ['first_living', 'first_family_sitout', 'cluster'],
      ['first_family_sitout', 'first_kitchen_dining', 'cluster'],
      ['first_family_sitout', 'first_utility', 'access'],
      ['first_kitchen_dining', 'first_pooja', 'access'],
    ]) expect(has(from!, to!, relation!)).toBe(true);
    expect(find('first_family_sitout')).toMatchObject({ kind: 'interior', zone: FunctionalZone.SemiPublic });
    expect(reference.sourceAudit.pooja).toMatchObject({ canonicalZone: FunctionalZone.Private,
      relationshipTo: 'first_kitchen_dining', limitation: 'CANONICAL_ZONE_CLASSIFICATION_LIMITATION' });
  });

  it('treats balcony and covered terrace as intentional outdoor program', () => {
    expect(find('first_balcony')).toMatchObject({ kind: 'outdoor', canonicalType: RoomType.Balcony, zone: FunctionalZone.Outdoor });
    expect(find('first_covered_terrace')).toMatchObject({ kind: 'outdoor', canonicalType: RoomType.Terrace, zone: FunctionalZone.Outdoor });
    expect(has('first_living', 'first_covered_terrace')).toBe(true);
    expect(reference.unresolvedObservations.find(item => item.id === 'BALCONY_ACCESS')!.confidence).toBe('AMBIGUOUS');
  });

  it('records dual irregular frontage without coordinates, road widths or invented cardinal direction', () => {
    expect(reference.projectContext.siteForm).toMatchObject({ classification: 'dual_frontage_irregular',
      interiorPlanning: 'mostly_orthogonal', coordinatesStored: false });
    expect(reference.projectContext.roads.map(road => [road.pageSide, road.alignment, road.width]))
      .toEqual([['left', 'orthogonal_edge', 'NOT_STATED'], ['lower', 'angled_edge', 'NOT_STATED']]);
    expect(reference.projectContext.cardinalOrientation).toBe('NOT_ESTABLISHED');
  });

  it('preserves the complete source-verified opening schedule', () => {
    expect(reference.openingSchedule.map(item => item.code))
      .toEqual(['F.D', 'D', 'D1', 'D2', 'D3', 'W', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'V', 'V1']);
    expect(reference.openingSchedule.map(item => item.quantity))
      .toEqual([1, 1, 4, 1, 4, 1, 3, 2, 1, 1, 1, 2, 1, 2]);
    expect(reference.openingSchedule.find(item => item.code === 'F.D')).toMatchObject({
      width: "5'-2.5\"", height: "8'-0\"", quantity: 1, description: 'FOLDING DOOR', provenance: 'VERIFIED_FROM_SOURCE',
    });
    expect(reference.openingSchedule.find(item => item.code === 'W6')).toMatchObject({ height: 'FULL HT.', quantity: 2 });
    expect(reference.openingSchedule.every(item => item.use === 'REFERENCE_EVIDENCE_ONLY')).toBe(true);
  });

  it('retains perimeter-opening observations without claiming performance', () => {
    const ids = reference.sourceAudit.perimeterOpenings.map(item => item.spaceId);
    for (const id of ['first_master_bedroom', 'first_upper_bedroom', 'first_lower_bedroom',
      'first_living', 'first_kitchen_dining', 'first_master_bath', 'first_staircase']) expect(ids).toContain(id);
    expect(reference.expectedCharacteristics.find(item => item.id === 'PERIMETER_DEPENDENT_OPENINGS')!.strength).toBe('OBSERVED');
  });

  it('stores source wall annotations as reference evidence only', () => {
    expect(reference.wallSystemObservations.map(item => item.label))
      .toEqual(['4.5" AAC WALL', '9" AAC WALL', '3\'-6" HT. AAC BLOCK MASONARY']);
    expect(reference.wallSystemObservations.every(item => item.provenance === 'VERIFIED_FROM_SOURCE'
      && item.use === 'REFERENCE_EVIDENCE_ONLY')).toBe(true);
  });

  it('stores only clear paired dimensions as non-normative reference evidence', () => {
    expect(reference.referenceDimensions).toHaveLength(10);
    for (const item of reference.referenceDimensions) {
      expect(find(item.spaceId)).toBeDefined();
      expect(item).toMatchObject({ sourceSheet: 1, units: 'feet_and_inches',
        provenance: 'VERIFIED_FROM_SOURCE', use: 'REFERENCE_EVIDENCE_ONLY' });
      expect(item.sideA).toMatch(/^\d+'-\d+(\.\d+)?"$/);
      expect(item.sideB).toMatch(/^\d+'-\d+(\.\d+)?"$/);
    }
    expect(reference.referenceDimensions.find(item => item.spaceId === 'first_master_bedroom'))
      .toMatchObject({ sideA: "11'-10.5\"", sideB: "10'-9\"" });
    expect(reference.referenceDimensions.find(item => item.spaceId === 'first_covered_terrace'))
      .toMatchObject({ sideA: "9'-2.5\"", sideB: "13'-10.5\"" });
  });

  it('separates source observations, brief interpretations and unresolved facts', () => {
    expect(reference.expectedCharacteristics.find(item => item.id === 'COMPACT_COMMON_HIERARCHY')!.provenance)
      .toBe('ASSERTED_FROM_BRIEF');
    expect(reference.expectedCharacteristics.find(item => item.id === 'DISTINCT_BATH_ACCESS_SEMANTICS')!.provenance)
      .toBe('VERIFIED_FROM_SOURCE');
    expect(reference.contextDependentEvidence).toHaveLength(3);
    expect(reference.furnishabilityEvidence).toMatchObject({
      visibleFurnitureOrEquipment: [], status: 'NOT_ESTABLISHED_FROM_SOURCE', solverImplemented: false,
    });
    expect(reference.unresolvedObservations.map(item => item.id)).toEqual([
      'OTHER_ATTACH_EXCLUSIVITY', 'COMMON_ATTACH_OWNERSHIP', 'BALCONY_ACCESS',
      'ROAD_WIDTHS_AND_CARDINALITY', 'UNSTORED_DIMENSION_CHAINS',
    ]);
    expect(reference.unresolvedObservations.every(item => item.confidence === 'AMBIGUOUS')).toBe(true);
  });

  it('contains no copied geometry, private contact fields or raw source attachments', () => {
    const forbiddenKeys = /^(x|y|coordinates|boundary|polygon|roomDimensions|clientName|personName|address|phone|email|signature|titleBlock|sourcePdf|sourcePath)$/i;
    const visit = (value: unknown): void => {
      if (!value || typeof value !== 'object') return;
      for (const [key, child] of Object.entries(value)) { expect(key).not.toMatch(forbiddenKeys); visit(child); }
    };
    visit(reference);
    const serialized = JSON.stringify(reference);
    expect(serialized).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(serialized).not.toMatch(/\b\d{10,}\b/);
    expect(serialized).not.toMatch(/\.pdf\b|data:image|data:application|[A-Z]:\\/i);
  });
});
