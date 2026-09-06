import { FunctionalZone as Zone, RoomType } from '@ai-floor-planner/core';

/** Test-only reference abstraction. Never passed to candidate generation. */
type Confidence = 'ASSERTED' | 'AMBIGUOUS';
type Provenance = 'VERIFIED_FROM_SOURCE' | 'ASSERTED_FROM_BRIEF' | 'AMBIGUOUS';
type Kind = 'interior' | 'transition' | 'core' | 'outdoor' | 'access';
type Ownership = 'NOT_ASSERTED' | 'VERIFIED_SUITE_ASSOCIATION' | 'LABELLED_ATTACH_ASSOCIATION' | 'AMBIGUOUS';
type Strength = 'STRONG' | 'PREFERRED' | 'OBSERVED';
interface ReferenceSpace {
  readonly id: string;
  readonly label: string;
  readonly kind: Kind;
  readonly canonicalType: RoomType | null;
  readonly zone: Zone;
  readonly confidence: Confidence;
  readonly provenance: Provenance;
  readonly sourceSheet: 1;
  readonly ownership: Ownership;
}
interface ReferenceRelationship {
  readonly from: string;
  readonly to: string;
  readonly relation: 'cluster' | 'access' | 'exterior_opportunity';
  readonly strength: Strength;
  readonly confidence: Confidence;
  readonly generalizable: true;
  readonly provenance: Provenance;
}
const space = (id: string, label: string, kind: Kind, canonicalType: RoomType | null,
  zone: Zone, ownership: Ownership = 'NOT_ASSERTED'): ReferenceSpace => ({
  id, label, kind, canonicalType, zone, ownership,
  confidence: 'ASSERTED', provenance: 'VERIFIED_FROM_SOURCE', sourceSheet: 1,
});
const relationship = (from: string, to: string, relation: ReferenceRelationship['relation'],
  strength: Strength = 'STRONG', provenance: Provenance = 'VERIFIED_FROM_SOURCE'): ReferenceRelationship => ({
  from, to, relation, strength, provenance, confidence: 'ASSERTED', generalizable: true,
});
const dimension = (spaceId: string, sideA: string, sideB: string) => ({
  spaceId, sourceSheet: 1, sideA, sideB, units: 'feet_and_inches',
  provenance: 'VERIFIED_FROM_SOURCE', use: 'REFERENCE_EVIDENCE_ONLY',
} as const);
const opening = (code: string, width: string, height: string, quantity: number, description: string) => ({
  code, width, height, quantity, description, sourceSheet: 1,
  provenance: 'VERIFIED_FROM_SOURCE', use: 'REFERENCE_EVIDENCE_ONLY',
} as const);

export const rbea003 = {
  id: 'RBEA-003', projectId: 'RBEA-003', displayName: 'Professional Reference 003',
  referenceType: 'compact_irregular_frontage_residential_reference',
  source: {
    category: 'professional_internal_reference', redacted: true,
    professionalStatus: 'REFERENCE_ACCEPTED_BY_PRACTICE', statusProvenance: 'USER_REPORTED',
    evidenceBasis: 'SOURCE_AUDITED_WITH_BRIEF_INTERPRETATIONS', drawingInspected: true,
    sheetsInspected: [1], sheetCount: 1, softwareProfessionallyValidated: false,
    limitation: 'Visible plan facts are source-verified; generalized strengths and professional acceptance remain interpretive/user-reported. No compliance claim.',
  },
  projectContext: {
    occupancy: 'residential_reference', productionGeneratorScope: 'residential_only',
    floor: 'first_floor', cardinalOrientation: 'NOT_ESTABLISHED',
    siteForm: { classification: 'dual_frontage_irregular', interiorPlanning: 'mostly_orthogonal',
      coordinatesStored: false, provenance: 'VERIFIED_FROM_SOURCE' },
    roads: [
      { id: 'frontage_left', pageSide: 'left', alignment: 'orthogonal_edge', width: 'NOT_STATED', provenance: 'VERIFIED_FROM_SOURCE', sourceSheet: 1 },
      { id: 'frontage_lower', pageSide: 'lower', alignment: 'angled_edge', width: 'NOT_STATED', provenance: 'VERIFIED_FROM_SOURCE', sourceSheet: 1 },
    ],
  },
  floors: [{ level: 1, usage: 'residential', activeResidentialBenchmark: true, spaces: [
    space('first_master_bedroom', 'Master Bedroom', 'interior', RoomType.Bedroom, Zone.Private),
    space('first_master_bath', 'Master Bath', 'interior', RoomType.Bathroom, Zone.Service, 'VERIFIED_SUITE_ASSOCIATION'),
    space('first_master_dressing', 'Dressing', 'interior', null, Zone.Private, 'VERIFIED_SUITE_ASSOCIATION'),
    space('first_common_attach_bath', 'Common Attach', 'interior', RoomType.Bathroom, Zone.Service, 'AMBIGUOUS'),
    space('first_other_attach_bath', 'Attach', 'interior', RoomType.Bathroom, Zone.Service, 'LABELLED_ATTACH_ASSOCIATION'),
    space('first_other_attach_vestibule', 'Unlabelled bedroom/bath access bay', 'transition', null, Zone.Circulation, 'AMBIGUOUS'),
    space('first_upper_bedroom', 'Bedroom', 'interior', RoomType.Bedroom, Zone.Private),
    space('first_lower_bedroom', 'Bedroom', 'interior', RoomType.Bedroom, Zone.Private),
    space('first_utility', 'Utility', 'interior', RoomType.Utility, Zone.Service),
    space('first_family_sitout', 'Family Sitout', 'interior', RoomType.Living, Zone.SemiPublic),
    space('first_kitchen_dining', 'Kitchen Cum Dining', 'interior', RoomType.Kitchen, Zone.Service),
    space('first_living', 'Living', 'interior', RoomType.Living, Zone.Public),
    space('first_pooja', 'Pooja', 'interior', RoomType.Pooja, Zone.Private),
    space('first_balcony', 'Balcony', 'outdoor', RoomType.Balcony, Zone.Outdoor),
    space('first_entrance_lobby', 'Entrance Lobby', 'transition', RoomType.Foyer, Zone.Circulation),
    space('first_entry', 'Entry', 'access', null, Zone.Circulation),
    space('first_staircase', 'Staircase', 'core', RoomType.Staircase, Zone.Circulation),
    space('first_covered_terrace', 'Covered Terrace', 'outdoor', RoomType.Terrace, Zone.Outdoor),
  ] }],
  relationships: [
    relationship('first_entry', 'first_staircase', 'access'),
    relationship('first_entry', 'first_entrance_lobby', 'access'),
    relationship('first_entrance_lobby', 'first_living', 'access'),
    relationship('first_living', 'first_family_sitout', 'cluster'),
    relationship('first_family_sitout', 'first_kitchen_dining', 'cluster'),
    relationship('first_family_sitout', 'first_utility', 'access'),
    relationship('first_kitchen_dining', 'first_pooja', 'access'),
    relationship('first_living', 'first_lower_bedroom', 'access'),
    relationship('first_living', 'first_covered_terrace', 'access'),
    relationship('first_family_sitout', 'first_master_bedroom', 'access'),
    relationship('first_master_bedroom', 'first_master_dressing', 'access'),
    relationship('first_master_dressing', 'first_master_bath', 'access'),
    relationship('first_master_bedroom', 'first_master_bath', 'cluster'),
    relationship('first_family_sitout', 'first_common_attach_bath', 'access'),
    relationship('first_entrance_lobby', 'first_other_attach_vestibule', 'access'),
    relationship('first_other_attach_vestibule', 'first_upper_bedroom', 'access'),
    relationship('first_other_attach_vestibule', 'first_other_attach_bath', 'access'),
    ...['first_master_bedroom', 'first_upper_bedroom', 'first_lower_bedroom', 'first_living', 'first_kitchen_dining']
      .map(id => relationship(id, 'building_perimeter', 'exterior_opportunity', 'OBSERVED')),
  ],
  accessPaths: [
    { id: 'arrival_to_common_space', nodes: ['first_staircase', 'first_entry', 'first_entrance_lobby', 'first_living'], provenance: 'VERIFIED_FROM_SOURCE', confidence: 'ASSERTED' },
    { id: 'master_suite', nodes: ['first_master_bedroom', 'first_master_dressing', 'first_master_bath'], provenance: 'VERIFIED_FROM_SOURCE', confidence: 'ASSERTED' },
    { id: 'labelled_attach_via_access_bay', nodes: ['first_upper_bedroom', 'first_other_attach_vestibule', 'first_other_attach_bath'], provenance: 'VERIFIED_FROM_SOURCE', confidence: 'ASSERTED' },
    { id: 'common_bath_access', nodes: ['first_family_sitout', 'first_common_attach_bath'], provenance: 'VERIFIED_FROM_SOURCE', confidence: 'ASSERTED' },
  ],
  sourceAudit: {
    bathroomTopology: [
      { bathSpaceId: 'first_master_bath', labelledUse: 'MASTER BATH', directAccessFrom: 'first_master_dressing',
        route: ['first_master_bedroom', 'first_master_dressing', 'first_master_bath'], ownership: 'VERIFIED_SUITE_ASSOCIATION',
        directBedroomToBath: false, commonAreaAccessVisible: false, provenance: 'VERIFIED_FROM_SOURCE', confidence: 'ASSERTED' },
      { bathSpaceId: 'first_other_attach_bath', labelledUse: 'ATTACH', directAccessFrom: 'first_other_attach_vestibule',
        route: ['first_upper_bedroom', 'first_other_attach_vestibule', 'first_other_attach_bath'], ownership: 'LABELLED_ATTACH_ASSOCIATION',
        directBedroomToBath: false, commonAreaAccessVisible: true, provenance: 'VERIFIED_FROM_SOURCE', confidence: 'AMBIGUOUS',
        note: 'Bedroom and bathroom have separate doors to an unlabelled access bay connected to the entrance-lobby side; exclusive access is not asserted.' },
      { bathSpaceId: 'first_common_attach_bath', labelledUse: 'COMMON ATTACH', directAccessFrom: 'first_family_sitout',
        route: ['first_family_sitout', 'first_common_attach_bath'], ownership: 'AMBIGUOUS', directBedroomToBath: false,
        commonAreaAccessVisible: true, provenance: 'VERIFIED_FROM_SOURCE', confidence: 'AMBIGUOUS',
        note: 'A common-area door is visible; the compound label does not establish exclusive bedroom ownership.' },
    ],
    perimeterOpenings: [
      { spaceId: 'first_master_bedroom', codes: ['W1'] },
      { spaceId: 'first_master_bath', codes: ['V'] },
      { spaceId: 'first_common_attach_bath', codes: ['V1'] },
      { spaceId: 'first_other_attach_bath', codes: ['V1'] },
      { spaceId: 'first_upper_bedroom', codes: ['W1'] },
      { spaceId: 'first_utility', codes: ['W4'] },
      { spaceId: 'first_kitchen_dining', codes: ['W2'] },
      { spaceId: 'first_living', codes: ['W'] },
      { spaceId: 'first_pooja', codes: ['W3'] },
      { spaceId: 'first_lower_bedroom', codes: ['W1'] },
      { spaceId: 'first_staircase', codes: ['W6'] },
    ].map(item => ({ ...item, provenance: 'VERIFIED_FROM_SOURCE', sourceSheet: 1 })),
    pooja: { canonicalZone: Zone.Private, relationshipTo: 'first_kitchen_dining',
      relationshipProvenance: 'VERIFIED_FROM_SOURCE', limitation: 'CANONICAL_ZONE_CLASSIFICATION_LIMITATION',
      note: 'The visible door associates Pooja with Kitchen Cum Dining. Canonical Private does not imply bedroom transit.' },
  },
  wallSystemObservations: [
    { label: '4.5" AAC WALL', provenance: 'VERIFIED_FROM_SOURCE', sourceSheet: 1, use: 'REFERENCE_EVIDENCE_ONLY' },
    { label: '9" AAC WALL', provenance: 'VERIFIED_FROM_SOURCE', sourceSheet: 1, use: 'REFERENCE_EVIDENCE_ONLY' },
    { label: '3\'-6" HT. AAC BLOCK MASONARY', provenance: 'VERIFIED_FROM_SOURCE', sourceSheet: 1, use: 'REFERENCE_EVIDENCE_ONLY' },
  ],
  openingSchedule: [
    opening('F.D', "5'-2.5\"", "8'-0\"", 1, 'FOLDING DOOR'),
    opening('D', "4'-6\"", "8'-0\"", 1, 'DOUBLE LEAF FLUSH DOOR'),
    opening('D1', "3'-3\"", "8'-0\"", 4, 'SINGLE LEAF FLUSH DOOR'),
    opening('D2', "3'-0\"", "8'-0\"", 1, 'SINGLE LEAF FLUSH DOOR'),
    opening('D3', "2'-9\"", "8'-0\"", 4, 'SINGLE LEAF FLUSH DOOR'),
    opening('W', "7'-0\"", "5'-0\"", 1, "FULLY GLAZED WINDOW WITH LINTEL LVL. 8'-0\""),
    opening('W1', "6'-0\"", "5'-0\"", 3, "FULLY GLAZED WINDOW WITH LINTEL LVL. 8'-0\""),
    opening('W2', "6'-0\"", "4'-6\"", 2, "FULLY GLAZED WINDOW WITH LINTEL LVL. 8'-0\""),
    opening('W3', "4'-1.5\"", "4'-6\"", 1, "FULLY GLAZED WINDOW WITH LINTEL LVL. 8'-0\""),
    opening('W4', "3'-6\"", "5'-0\"", 1, "FULLY GLAZED WINDOW WITH LINTEL LVL. 8'-0\""),
    opening('W5', "3'-0\"", "2'-6\"", 1, "FULLY GLAZED WINDOW WITH LINTEL LVL. 9'-6\""),
    opening('W6', "(3'-0\"+3'-0\")", 'FULL HT.', 2, 'FULLY GLAZED WINDOW WITH FIX GLASS'),
    opening('V', "3'-0\"", "3'-0\"", 1, "ALUMINIUM LOUVERED WINDOW LENTEL LVL. +8'-0\""),
    opening('V1', "2'-9\"", "3'-0\"", 2, "ALUMINIUM LOUVERED WINDOW LENTEL LVL. +8'-0\""),
  ],
  referenceDimensions: [
    dimension('first_master_bedroom', "11'-10.5\"", "10'-9\""),
    dimension('first_common_attach_bath', "4'-0\"", "6'-9\""),
    dimension('first_other_attach_bath', "4'-0\"", "6'-9\""),
    dimension('first_upper_bedroom', "12'-7.5\"", "10'-9\""),
    dimension('first_master_bath', "4'-6\"", "8'-0\""),
    dimension('first_master_dressing', "6'-1.5\"", "8'-0\""),
    dimension('first_kitchen_dining', "15'-3\"", "19'-3\""),
    dimension('first_living', "20'-0\"", "11'-4.5\""),
    dimension('first_lower_bedroom', "9'-6\"", "11'-3\""),
    dimension('first_covered_terrace', "9'-2.5\"", "13'-10.5\""),
  ],
  expectedCharacteristics: [
    { id: 'COMPACT_COMMON_HIERARCHY', strength: 'STRONG', provenance: 'ASSERTED_FROM_BRIEF', note: 'Stair, entry, lobby, living and family space should form legible arrival and distribution rather than private-room transit.' },
    { id: 'COMBINED_SERVICE_COMMON_CORE', strength: 'STRONG', provenance: 'ASSERTED_FROM_BRIEF', note: 'Kitchen/dining and family sitout form a compact shared-use cluster with utility and pooja nearby.' },
    { id: 'DISTINCT_BATH_ACCESS_SEMANTICS', strength: 'STRONG', provenance: 'VERIFIED_FROM_SOURCE', note: 'Master, labelled attach and common-attach bathrooms are not interchangeable ownership edges.' },
    { id: 'PERIMETER_DEPENDENT_OPENINGS', strength: 'OBSERVED', provenance: 'VERIFIED_FROM_SOURCE', note: 'Habitable, wet, service and stair spaces use scheduled perimeter or ventilation openings.' },
    { id: 'IRREGULAR_SITE_ORTHOGONAL_INTERIOR', strength: 'OBSERVED', provenance: 'VERIFIED_FROM_SOURCE', note: 'Angled frontage is absorbed at the site/edge while most interior planning remains orthogonal.' },
    { id: 'CANONICAL_ZONE_CLASSIFICATION_LIMITATION', strength: 'OBSERVED', provenance: 'VERIFIED_FROM_SOURCE', note: 'Canonical Pooja is Private while its visible access belongs to the common kitchen/dining zone.' },
  ],
  contextDependentEvidence: [
    'Dual-road frontage and the lower angled edge shape outdoor/edge treatment in this reference.',
    'Covered Terrace beside Living and the separate Balcony are valid here but are not mandatory residential pairings.',
    'Family Sitout functions as an interior semi-public common/distribution area on this sheet.',
  ],
  furnishabilityEvidence: {
    visibleFurnitureOrEquipment: [], status: 'NOT_ESTABLISHED_FROM_SOURCE', solverImplemented: false,
    provenance: 'VERIFIED_FROM_SOURCE',
    note: 'No dependable furniture or equipment symbols are encoded from this working-plan sheet.',
  },
  projectSpecificObservations: [
    'The left and lower page edges are roads; the lower frontage is angled. Page position does not establish compass orientation.',
    'The exact three-bedroom inventory, covered terrace, balcony, wall notes and opening quantities belong to this reference, not universal requirements.',
    'Room positions and sheet geometry are not encoded as generator coordinates or placement rules.',
  ],
  unresolvedObservations: [
    { id: 'OTHER_ATTACH_EXCLUSIVITY', confidence: 'AMBIGUOUS', note: 'The ATTACH label suggests association, but bedroom and bathroom use separate doors to an access bay connected toward the entrance lobby.' },
    { id: 'COMMON_ATTACH_OWNERSHIP', confidence: 'AMBIGUOUS', note: 'COMMON ATTACH has visible common-area access; exclusive bedroom ownership is not inferred.' },
    { id: 'BALCONY_ACCESS', confidence: 'AMBIGUOUS', note: 'The balcony is explicit, but no access edge is encoded where the sheet does not show a confidently legible door route.' },
    { id: 'ROAD_WIDTHS_AND_CARDINALITY', confidence: 'AMBIGUOUS', note: 'Road widths and cardinal mapping are not stated/established on the audited sheet.' },
    { id: 'UNSTORED_DIMENSION_CHAINS', confidence: 'AMBIGUOUS', note: 'Only clear paired space-label dimensions are retained; dimension chains are not converted into inferred room sizes or geometry.' },
  ],
} as const;
