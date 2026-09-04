import { FunctionalZone as Zone, RoomType } from '@ai-floor-planner/core';

/** Test-only reference abstraction. Never passed to candidate generation. */
type Confidence = 'ASSERTED' | 'AMBIGUOUS';
type Provenance = 'VERIFIED_FROM_SOURCE' | 'ASSERTED_FROM_BRIEF' | 'AMBIGUOUS';
type Kind = 'interior' | 'commercial_context' | 'transition' | 'core' | 'outdoor'
  | 'infrastructure_reservation' | 'access' | 'functional_cluster';
type Strength = 'REQUIRED' | 'STRONG' | 'PREFERRED' | 'AVOID' | 'OBSERVED';
interface ReferenceSpace {
  readonly id: string;
  readonly label: string;
  readonly kind: Kind;
  readonly canonicalType: RoomType | null;
  readonly zone: Zone;
  readonly confidence: Confidence;
  readonly provenance: Provenance;
  readonly sourceSheet: number;
  readonly ownership: 'NOT_ASSERTED' | 'AMBIGUOUS' | 'VERIFIED_SUITE_ASSOCIATION';
}
interface ReferenceRelationship {
  readonly from: string;
  readonly to: string;
  readonly relation: 'cluster' | 'access' | 'avoid_private_transit' | 'vertical_alignment';
  readonly strength: Strength;
  readonly confidence: Confidence;
  readonly generalizable: true;
  readonly provenance: Provenance;
}
const space = (id: string, label: string, kind: Kind, canonicalType: RoomType | null,
  zone: Zone, ownership: ReferenceSpace['ownership'] = 'NOT_ASSERTED'): ReferenceSpace => ({
  id, label, kind, canonicalType, zone, ownership,
  confidence: 'ASSERTED', provenance: 'VERIFIED_FROM_SOURCE',
  sourceSheet: id.startsWith('ground_') ? 1 : id.startsWith('first_') ? 2 : 3,
});
const relationship = (from: string, to: string, relation: ReferenceRelationship['relation'],
  strength: Strength = 'STRONG'): ReferenceRelationship => ({
  from, to, relation, strength, confidence: 'ASSERTED', generalizable: true,
  // A generalized strength is still an interpretation, not a drawing annotation.
  provenance: relation === 'vertical_alignment' ? 'VERIFIED_FROM_SOURCE' : 'ASSERTED_FROM_BRIEF',
});

const dimension = (spaceId: string, sourceSheet: number, sideA: string, sideB: string) => ({
  spaceId, sourceSheet, sideA, sideB, units: 'feet_and_inches',
  provenance: 'VERIFIED_FROM_SOURCE', use: 'REFERENCE_EVIDENCE_ONLY',
} as const);

export const rbea002 = {
  id: 'RBEA-002', projectId: 'RBEA-002', displayName: 'Professional Reference 002',
  referenceType: 'mixed-use corner/dual-frontage residential reference',
  source: {
    category: 'professional_internal_reference', redacted: true,
    professionalStatus: 'REFERENCE_ACCEPTED_BY_PRACTICE', statusProvenance: 'USER_REPORTED',
    evidenceBasis: 'SOURCE_AUDITED_WITH_BRIEF_INTERPRETATIONS', drawingInspected: true, sheetsInspected: [1, 2, 3],
    softwareProfessionallyValidated: false,
    limitation: 'Visible facts are source-verified; generalized strengths and professional acceptance remain interpretive/user-reported. No compliance claim.',
  },
  projectContext: {
    occupancy: 'mixed_use_reference', activeGeneratorScope: 'residential_upper_floors',
    productionGeneratorScope: 'residential_only', cardinalOrientation: 'NOT_ESTABLISHED',
    remainingPlot: { continuesBeyondDevelopedZone: true, confidence: 'ASSERTED', provenance: 'VERIFIED_FROM_SOURCE', sourceSheet: 1 },
    roads: [
      { id: 'frontage_primary', widthMetres: 9, pageSide: 'bottom_front', roles: ['vehicle_access', 'pedestrian_access', 'residential_arrival'], confidence: 'ASSERTED', provenance: 'VERIFIED_FROM_SOURCE', sourceSheet: 1 },
      { id: 'frontage_secondary', widthMetres: 9, pageSide: 'left_side', roles: ['commercial_frontage', 'shop_access'], confidence: 'ASSERTED', provenance: 'VERIFIED_FROM_SOURCE', sourceSheet: 1 },
    ],
    parkingObservation: { carsShown: 2, twoWheelersShown: 2, confidence: 'ASSERTED', provenance: 'VERIFIED_FROM_SOURCE', sourceSheet: 1, regulatoryCapacityClaim: false },
    independentAccessFlows: { commercialPublicAccess: 'separate_street_entries_and_residential_gate_lobby_route', confidence: 'ASSERTED', provenance: 'VERIFIED_FROM_SOURCE', sourceSheet: 1, legalSeparationClaim: false,
      limitation: 'Separate public arrival routes are visible; internal service/access connections exist. Complete physical isolation is not asserted.' },
  },
  floors: [
    { level: 0, usage: 'mixed_use_context', activeResidentialBenchmark: false, spaces: [
      ...[1, 2, 3, 4].map(n => space(`ground_shop_${n}`, `Shop ${n}`, 'commercial_context', null, Zone.Public)),
      space('ground_parking', 'Parking area', 'outdoor', RoomType.Parking, Zone.Outdoor),
      space('ground_entrance_lobby', 'Residential entrance lobby', 'transition', RoomType.Foyer, Zone.Circulation),
      space('ground_stair', 'Staircase', 'core', RoomType.Staircase, Zone.Circulation),
      space('ground_lift', 'Lift', 'core', RoomType.Lift, Zone.Circulation),
      space('ground_main_gate', 'Main vehicle gate', 'access', null, Zone.Outdoor),
      space('ground_wicket', 'Pedestrian wicket', 'access', null, Zone.Outdoor),
      space('ground_borewell', 'Borewell reservation', 'infrastructure_reservation', null, Zone.Service),
      space('ground_open_paving', 'Circulation and open paving', 'access', null, Zone.Outdoor),
    ] },
    { level: 1, usage: 'residential', activeResidentialBenchmark: true, spaces: [
      space('first_entrance_lobby', 'Entrance lobby', 'transition', RoomType.Foyer, Zone.Circulation),
      space('first_stair', 'Staircase', 'core', RoomType.Staircase, Zone.Circulation),
      space('first_lift', 'Lift', 'core', RoomType.Lift, Zone.Circulation),
      space('first_living', 'Living', 'interior', RoomType.Living, Zone.Public),
      space('first_dining_family', 'Dining cum family seating', 'interior', RoomType.Dining, Zone.SemiPublic),
      space('first_kitchen', 'Kitchen', 'interior', RoomType.Kitchen, Zone.Service),
      space('first_utility', 'Utility', 'interior', RoomType.Utility, Zone.Service),
      space('first_pooja', 'Pooja', 'interior', RoomType.Pooja, Zone.Private),
      space('first_garden_terrace', 'Garden terrace', 'outdoor', RoomType.Terrace, Zone.Outdoor),
      space('first_balcony', 'Balcony', 'outdoor', RoomType.Balcony, Zone.Outdoor),
      space('first_master_bedroom', 'Master bedroom', 'interior', RoomType.Bedroom, Zone.Private),
      space('first_master_dressing', 'Dressing', 'interior', null, Zone.Private),
      space('first_master_bath', 'Master bathroom', 'interior', RoomType.Bathroom, Zone.Service, 'VERIFIED_SUITE_ASSOCIATION'),
      space('first_other_bedroom', 'Other bedroom', 'interior', RoomType.Bedroom, Zone.Private),
      space('first_childrens_bedroom', 'Children’s bedroom', 'interior', RoomType.Bedroom, Zone.Private),
      space('first_childrens_bath', 'Attach bathroom opening to children’s bedroom', 'interior', RoomType.Bathroom, Zone.Service, 'VERIFIED_SUITE_ASSOCIATION'),
      space('first_common_attach_bath', 'Common/attach bathroom area', 'interior', RoomType.Bathroom, Zone.Service, 'AMBIGUOUS'),
      space('first_circulation', 'Common circulation', 'transition', RoomType.Corridor, Zone.Circulation),
    ] },
    { level: 2, usage: 'partial_residential_with_terrace', activeResidentialBenchmark: true, spaces: [
      space('second_entrance_lobby', 'Entrance lobby', 'transition', RoomType.Foyer, Zone.Circulation),
      space('second_stair', 'Staircase', 'core', RoomType.Staircase, Zone.Circulation),
      space('second_lift', 'Lift', 'core', RoomType.Lift, Zone.Circulation),
      space('second_master_bedroom', 'Master bedroom', 'interior', RoomType.Bedroom, Zone.Private),
      space('second_master_dressing', 'Dressing', 'interior', null, Zone.Private),
      space('second_master_bath', 'Master bathroom', 'interior', RoomType.Bathroom, Zone.Service, 'VERIFIED_SUITE_ASSOCIATION'),
      space('second_childrens_bedroom', 'Children’s bedroom', 'interior', RoomType.Bedroom, Zone.Private),
      space('second_childrens_bath', 'Attach bathroom opening to children’s bedroom', 'interior', RoomType.Bathroom, Zone.Service, 'VERIFIED_SUITE_ASSOCIATION'),
      space('second_circulation', 'Open arrival/distribution area', 'transition', null, Zone.Circulation),
      space('second_balcony', 'Balcony', 'outdoor', RoomType.Balcony, Zone.Outdoor),
      space('second_terrace', 'Large terrace', 'outdoor', RoomType.Terrace, Zone.Outdoor),
    ] },
  ],
  relationships: [
    ...[1, 2, 3, 4].flatMap(n => [
      relationship(`ground_shop_${n}`, 'frontage_secondary', 'access'),
      relationship(`ground_shop_${n}`, 'ground_entrance_lobby', 'avoid_private_transit', 'AVOID'),
    ]),
    relationship('frontage_primary', 'ground_main_gate', 'access'),
    relationship('ground_main_gate', 'ground_open_paving', 'access'),
    relationship('ground_open_paving', 'ground_parking', 'access'),
    relationship('frontage_primary', 'ground_wicket', 'access'),
    relationship('ground_wicket', 'ground_entrance_lobby', 'access'),
    relationship('ground_parking', 'ground_entrance_lobby', 'access', 'PREFERRED'),
    ...['ground', 'first', 'second'].flatMap(f => [
      relationship(`${f}_stair`, `${f}_entrance_lobby`, 'access'),
      relationship(`${f}_lift`, `${f}_entrance_lobby`, 'access'),
    ]),
    relationship('first_entrance_lobby', 'first_living', 'access'),
    relationship('first_living', 'first_dining_family', 'cluster'),
    relationship('first_kitchen', 'first_dining_family', 'cluster'),
    relationship('first_kitchen', 'first_utility', 'cluster'),
    relationship('first_master_bedroom', 'first_master_dressing', 'cluster'),
    relationship('first_master_dressing', 'first_master_bath', 'cluster'),
    relationship('first_master_bedroom', 'first_master_bath', 'cluster'),
    relationship('first_living', 'first_garden_terrace', 'cluster'),
    relationship('first_dining_family', 'first_pooja', 'cluster', 'PREFERRED'),
    ...['first_master_bedroom', 'first_other_bedroom', 'first_childrens_bedroom'].map(id => relationship('first_circulation', id, 'access')),
    ...['stair', 'lift'].flatMap(core => [
      relationship(`ground_${core}`, `first_${core}`, 'vertical_alignment'),
      relationship(`first_${core}`, `second_${core}`, 'vertical_alignment'),
    ]),
    relationship('second_entrance_lobby', 'second_circulation', 'access'),
    relationship('second_circulation', 'second_master_bedroom', 'access'),
    relationship('second_circulation', 'second_childrens_bedroom', 'access'),
    relationship('second_master_bedroom', 'second_master_dressing', 'cluster'),
    relationship('second_master_dressing', 'second_master_bath', 'cluster'),
    ...['first', 'second'].map(f => relationship(`${f}_childrens_bedroom`, `${f}_childrens_bath`, 'cluster')),
  ],
  accessPaths: [
    { id: 'vehicle_arrival', nodes: ['frontage_primary', 'ground_main_gate', 'ground_open_paving', 'ground_parking'], confidence: 'ASSERTED' },
    { id: 'pedestrian_arrival', nodes: ['frontage_primary', 'ground_wicket', 'ground_entrance_lobby'], confidence: 'ASSERTED' },
    { id: 'first_stair_arrival', nodes: ['first_stair', 'first_entrance_lobby', 'first_living'], confidence: 'ASSERTED' },
    { id: 'first_lift_arrival', nodes: ['first_lift', 'first_entrance_lobby', 'first_living'], confidence: 'ASSERTED' },
    { id: 'second_core_arrival', nodes: ['second_stair', 'second_entrance_lobby', 'second_circulation'], confidence: 'ASSERTED' },
  ],
  expectedCharacteristics: [
    { id: 'REDUCED_UPPER_PLATE', strength: 'OBSERVED', confidence: 'ASSERTED', generalizable: true, note: 'Second enclosed plate is smaller than first; remaining area is intentional terrace. No ratio asserted.' },
    { id: 'INTENTIONAL_NON_ROOM_AREAS', strength: 'OBSERVED', confidence: 'ASSERTED', generalizable: true, note: 'Outdoor, paving, infrastructure and transition spaces are not automatically dead space.' },
    { id: 'TRANSITION_SPACE', strength: 'STRONG', confidence: 'ASSERTED', generalizable: true, note: 'Lobby supports stair/lift arrival, dwelling threshold, distribution and privacy buffer.' },
    { id: 'COMMON_DISTRIBUTION_HUB', strength: 'STRONG', confidence: 'ASSERTED', generalizable: true, note: 'Common/family circulation distributes to bedrooms; avoid compulsory unrelated bedroom transit to bedrooms or living.' },
    { id: 'WET_SERVICE_COORDINATION', strength: 'PREFERRED', confidence: 'ASSERTED', generalizable: true, note: 'Upper-floor wet/service coordination reported; exact risers and plumbing alignment not asserted.' },
    { id: 'EXTERIOR_OPPORTUNITY', strength: 'PREFERRED', confidence: 'ASSERTED', generalizable: true, note: 'Habitable rooms, master suite, balcony, kitchen and utility seek perimeter/outdoor exposure; not a daylight or ventilation result.' },
  ],
  openings: [
    { code: 'W', meaning: 'window_or_opening_annotation', confidence: 'ASSERTED', presenceProvenance: 'VERIFIED_FROM_SOURCE', sourceSheets: [2, 3] },
    { code: 'V', meaning: 'ventilator_annotation', confidence: 'ASSERTED', presenceProvenance: 'VERIFIED_FROM_SOURCE', sourceSheets: [1, 2, 3] },
    { code: 'D', meaning: 'door_annotation', confidence: 'ASSERTED', presenceProvenance: 'VERIFIED_FROM_SOURCE', sourceSheets: [1, 2, 3] },
    { code: 'FD', meaning: 'unknown_specific_opening_type', confidence: 'AMBIGUOUS', presenceProvenance: 'VERIFIED_FROM_SOURCE', meaningProvenance: 'AMBIGUOUS', sourceSheets: [2] },
  ],
  furnishability: ['bed_storage', 'living_seating_tv', 'dining_table', 'kitchen_worktop_equipment', 'bathroom_sanitary_fixtures']
    .map(id => ({ id, status: 'VERIFIED_FROM_SOURCE', provenance: 'VERIFIED_FROM_SOURCE', sourceSheets: [2], confidence: 'ASSERTED', solverImplemented: false })),
  sourceAudit: {
    verticalCore: { provenance: 'VERIFIED_FROM_SOURCE', sourceSheets: [1, 2, 3], note: 'Stair and lift occupy the same recognizable core zone; architectural continuity, not surveyed/structural alignment.' },
    reducedPlate: { provenance: 'VERIFIED_FROM_SOURCE', sourceSheets: [2, 3], note: 'Second-floor residential enclosure is reduced; large area explicitly labelled terrace remains on sheet 3.' },
    wetServiceCoordination: { provenance: 'VERIFIED_FROM_SOURCE', sourceSheets: [2, 3], note: 'Master and children’s bath zones repeat between upper sheets; exact risers not asserted.' },
    suiteAccess: ['first', 'second'].map(f => ({
      sourceSheet: f === 'first' ? 2 : 3, provenance: 'VERIFIED_FROM_SOURCE',
      masterRoute: [`${f}_master_bedroom`, `${f}_master_dressing`, `${f}_master_bath`],
      note: 'Bedroom door enters the dressing/access bay; bath door opens from that bay. No direct bedroom-to-master-bath opening visible.',
      directBedroomToMasterBath: false,
      childrensRoute: [`${f}_childrens_bedroom`, `${f}_childrens_bath`],
      directChildrensBathAccess: true,
    })),
    commonAttach: { sourceSheet: 2, accessProvenance: 'VERIFIED_FROM_SOURCE', visibleAccessFrom: 'first_circulation',
      ownershipProvenance: 'AMBIGUOUS', note: 'Door opens toward common circulation; no direct opening through the neighboring bedroom wall is visible. Label does not establish exclusive ownership.' },
    pooja: { sourceSheet: 2, canonicalZone: Zone.Private, relationshipTo: 'first_dining_family',
      relationshipProvenance: 'VERIFIED_FROM_SOURCE', limitation: 'CANONICAL_ZONE_CLASSIFICATION_LIMITATION',
      note: 'Visible door associates Pooja with dining/family space. Canonical Private does not mean a bedroom-transit requirement.' },
  },
  referenceDimensions: [
    dimension('first_master_bedroom', 2, "14'-1.5\"", "12'-6\""),
    dimension('first_master_dressing', 2, "10'-6\"", "6'-0\""),
    dimension('first_master_bath', 2, "7'-4.5\"", "5'-6\""),
    dimension('first_childrens_bedroom', 2, "11'-0\"", "14'-0\""),
    dimension('first_childrens_bath', 2, "4'-0\"", "11'-10.5\""),
    dimension('first_other_bedroom', 2, "10'-0\"", "9'-0\""),
    dimension('first_common_attach_bath', 2, "7'-6\"", "4'-6\""),
    dimension('first_kitchen', 2, "11'-0\"", "12'-10.5\""),
    dimension('first_dining_family', 2, "12'-9\"", "11'-4.5\""),
    dimension('first_living', 2, "16'-3\"", "17'-9\""),
    dimension('first_pooja', 2, "5'-0\"", "8'-1.5\""),
    dimension('first_entrance_lobby', 2, "13'-9\"", "8'-5.5\""),
    dimension('first_garden_terrace', 2, "13'-9\"", "14'-7.5\""),
    dimension('second_master_bedroom', 3, "14'-1.5\"", "12'-6\""),
    dimension('second_master_dressing', 3, "10'-6\"", "6'-0\""),
    dimension('second_master_bath', 3, "7'-4.5\"", "5'-6\""),
    dimension('second_childrens_bedroom', 3, "11'-0\"", "13'-7.5\""),
    dimension('second_childrens_bath', 3, "4'-0\"", "11'-10.5\""),
    dimension('second_entrance_lobby', 3, "13'-9\"", "5'-10\""),
  ],
  projectSpecificObservations: [
    'Two roads reported at page bottom/front and left; page sides do not establish compass directions.',
    'Four shops, two cars and two two-wheelers are reference-specific counts, not global requirements.',
    'Reported left-side shops, right-side parking, top-right stair, top-left master, bottom-left kitchen and bottom-right garden terrace are not placement rules.',
  ],
  unresolvedObservations: [
    { id: 'UNSTORED_DIMENSIONS', confidence: 'AMBIGUOUS', note: 'No single paired room-label dimension stored for utility, circulation, stairs, balconies or irregular second terrace; ground context sizes are outside this residential dimension subset. No geometry inferred from chains.' },
    { id: 'COMMON_ATTACH_OWNER', confidence: 'AMBIGUOUS', note: 'No owner inferred for common/attach bathroom.' },
    { id: 'CARDINAL_ORIENTATION', confidence: 'AMBIGUOUS', note: 'No road-to-cardinal mapping encoded; page position alone is not used as orientation.' },
    { id: 'EXACT_RISERS', confidence: 'AMBIGUOUS', note: 'Repeated wet/core positions do not establish exact plumbing risers or structural alignment.' },
    { id: 'FD', confidence: 'AMBIGUOUS', note: 'Specific opening type unknown; expansion not guessed.' },
  ],
} as const;
