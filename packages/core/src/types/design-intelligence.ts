/**
 * Design Intelligence & Requirements-to-Plan Domain Types (Phase 7).
 *
 * Provides typed specifications for:
 * 1. DesignRequirementSpecification (User natural language & structured intent)
 * 2. RequirementValidation (Deterministic feasibility and constraint checking)
 * 3. DesignSpecification (Intermediate design blueprint)
 * 4. RoomProgram (Space accounting & environmental requirements)
 * 5. FunctionalZoning & DesignGraph (Adjacency & topology relations)
 * 6. Candidate Generation & Ranking (Multi-candidate evaluation)
 * 7. Historical Data Ingestion Architecture (Future 25-year dataset moat)
 */

import type { RoomType, Direction, PlotShape, PreferenceLevel, DaylightLevel, PrivacyLevel } from './enums';
import type { Building } from './building';
import type { ValidationSummary } from './constraints';
import type { SpaceFloorPreference } from './space-program';

// ─── 1. Functional Zoning ───────────────────────────────────────────────────

export enum FunctionalZone {
  Public = 'public',           // Living room, foyer, drawing room
  SemiPublic = 'semi_public',   // Dining hall, family lounge
  Private = 'private',         // Bedrooms, study, pooja
  Service = 'service',         // Kitchen, bathrooms, utility, storage
  Circulation = 'circulation', // Staircase, corridors, passages
  Outdoor = 'outdoor',         // Balcony, terrace, parking, garden
}

// ─── 2. Design Graph & Topological Relationships ────────────────────────────

export enum AdjacencyRelationType {
  RequiredAdjacency = 'required_adjacency', // e.g. Kitchen <-> Dining
  PreferredAdjacency = 'preferred_adjacency', // e.g. Living <-> Dining
  RequiredSeparation = 'required_separation', // e.g. Bedroom <-> Kitchen (smell/noise)
  PrivacyBoundary = 'privacy_boundary',       // e.g. Public Living separated from Private Bath/Bed
  AccessRequired = 'access_required',         // e.g. Foyer -> Living, Bedroom -> Attached Bath
}

export interface DesignGraphEdge {
  readonly sourceRoomType: RoomType;
  readonly targetRoomType: RoomType;
  readonly relation: AdjacencyRelationType;
  readonly weight: number; // 0 (low) to 1.0 (strict)
  readonly reason?: string;
}

export interface DesignGraph {
  readonly nodes: readonly RoomType[];
  readonly edges: readonly DesignGraphEdge[];
}

/** A concrete room-program instance used for spatial planning. */
export interface SpatialGraphNode {
  readonly id: string;
  readonly programItemId: string;
  readonly type: RoomType;
  readonly name: string;
  readonly zone: FunctionalZone;
  readonly preferredFloorLevel: number;
}

/** A relationship between two concrete room instances, never just room types. */
export interface SpatialGraphEdge {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly relation: AdjacencyRelationType;
  readonly weight: number;
  readonly reason: string;
}

export interface InstanceDesignGraph {
  readonly nodes: readonly SpatialGraphNode[];
  readonly edges: readonly SpatialGraphEdge[];
}

// ─── 3. Room Program Specification ──────────────────────────────────────────

export interface RoomProgramItem {
  readonly id: string;
  readonly type: RoomType;
  readonly name: string;
  readonly zone: FunctionalZone;
  readonly floorLevel: number;
  /** Distinguishes required Ground (zero) from an unspecified legacy floor. */
  readonly floorPreference?: SpaceFloorPreference;
  readonly targetAreaMm2: number;
  readonly minAreaMm2: number;
  readonly maxAreaMm2: number;
  readonly minWidthMm: number;
  readonly minHeightMm: number;
  readonly daylight: DaylightLevel;
  readonly privacy: PrivacyLevel;
  readonly ventilationRequired: boolean;
  readonly attachedToRoomId?: string; // e.g. attached bath to master bed
  /** Explicit catalog common-bath use; absent metadata remains ambiguous. */
  readonly bathroomUse?: 'common';
  readonly isFixed?: boolean;
}

export interface RoomProgram {
  readonly items: readonly RoomProgramItem[];
  /** Evidence-only reviewed identities, including program-only spaces. These
   * never become placement requests or physical doors merely by being listed. */
  readonly reviewedAccessSpaces?: readonly {
    readonly programItemId: string;
    readonly ownerProgramItemId: string;
    readonly role: 'dressing' | 'private_access';
  }[];
  readonly totalTargetAreaMm2: number;
  readonly totalMinAreaMm2: number;
  readonly totalMaxAreaMm2: number;
}

// ─── 4. Design Requirement Specification ────────────────────────────────────

export interface HardDesignRequirements {
  readonly plotWidthMm: number;
  readonly plotDepthMm: number;
  readonly roadFacing: Direction;
  readonly floorsCount: number;
  readonly bedroomCount: number;
  readonly bathroomCount: number;
  readonly kitchenRequired: boolean;
  readonly livingRoomRequired: boolean;
  readonly diningRoomRequired: boolean;
  readonly staircaseRequired: boolean;
  readonly parkingRequired: boolean;
  readonly parkingSpacesCount: number;
  readonly liftRequired: boolean;
  readonly customRooms?: readonly { type: RoomType; count: number; name?: string }[];
}

export interface SoftDesignPreferences {
  readonly vastuCompliance: boolean;
  readonly naturalLightPreference: PreferenceLevel;
  readonly privacyPreference: PreferenceLevel;
  readonly circulationEfficiency: PreferenceLevel;
  readonly gardenPreference: boolean;
  readonly servantQuarter: boolean;
  readonly poojaRoom: boolean;
  readonly studyRoom: boolean;
  readonly balconyPreferred: boolean;
  readonly openKitchen: boolean;
  readonly attachedBathroomsCount: number;
}

export interface DesignRequirementSpecification {
  readonly schemaVersion: 1;
  readonly projectId?: string;
  readonly projectName: string;
  readonly rawUserPrompt?: string;
  readonly hard: HardDesignRequirements;
  readonly soft: SoftDesignPreferences;
  readonly plotShape: PlotShape;
  readonly orientationDegrees: number; // 0 = North, 90 = East, 180 = South, 270 = West
  readonly setbacksMm?: {
    readonly front: number;
    readonly rear: number;
    readonly left: number;
    readonly right: number;
  };
  readonly siteContext?: {
    readonly location?: string;
    readonly jurisdiction?: string;
  };
}

// ─── 5. Requirement Feasibility & Validation ────────────────────────────────

export interface RequirementValidationIssue {
  readonly code: string;
  readonly severity: 'error' | 'warning' | 'info';
  readonly message: string;
  readonly field?: string;
  readonly suggestion?: string;
}

export interface RequirementValidationResult {
  readonly status: 'feasible' | 'tight' | 'infeasible';
  readonly isFeasible: boolean;
  readonly plotAreaMm2: number;
  readonly buildableAreaMm2: number;
  readonly buildableWidthMm: number;
  readonly buildableDepthMm: number;
  readonly totalAvailableFloorAreaMm2: number;
  readonly estimatedRequiredAreaMm2: number;
  readonly estimatedCirculationAreaMm2: number;
  readonly groundCoverageRatio: number; // required / buildable
  readonly issues: readonly RequirementValidationIssue[];
  readonly hardRequirementsCount: number;
  readonly preferencesCount: number;
}

// ─── 6. Intermediate Design Specification ───────────────────────────────────

export interface DesignSpecification {
  readonly requirements: DesignRequirementSpecification;
  readonly program: RoomProgram;
  readonly graph: DesignGraph;
  readonly zoningMap: Record<RoomType, FunctionalZone>;
  readonly buildableBounds: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
}

// ─── 7. Candidate Plans & Multi-Dimensional Ranking ─────────────────────────

export interface CandidateMetrics {
  readonly hardValidity: boolean;
  readonly overallQualityScore: number;     // 0 - 100
  readonly areaEfficiencyScore: number;     // 0 - 100
  readonly adjacencyScore: number;          // 0 - 100
  readonly circulationScore: number;        // 0 - 100
  readonly daylightScore: number;           // 0 - 100
  readonly privacyScore: number;            // 0 - 100
  readonly vastuProxyScore: number;         // 0 - 100
  readonly floorUtilizationScore: number;   // 0 - 100
  readonly unusedSpaceScore: number;        // 0 - 100
  readonly verticalContinuityScore: number; // 0 - 100
  readonly roomDistributionScore: number;   // 0 - 100
  readonly totalCarpetAreaMm2: number;
  readonly totalBuiltupAreaMm2: number;
  readonly roomCount: number;
}

export interface CandidateOptimizationSummary {
  readonly attempts: number;
  readonly validAttempts: number;
  readonly initialGraphScore: number;
  readonly finalGraphScore: number;
  readonly selectedVariant: string;
  readonly repairAttempts: number;
  readonly acceptedRepairs: number;
  readonly repairTrace: readonly PlanRepairStep[];
}

/** One accepted, validation-gated change made by the deterministic repair loop. */
export interface PlanRepairStep {
  readonly iteration: number;
  readonly action: 'swap_program_assignments';
  readonly sourceRoomId: string;
  readonly targetRoomId: string;
  readonly description: string;
  readonly beforeHardFailures: number;
  readonly afterHardFailures: number;
  readonly beforeGraphScore: number;
  readonly afterGraphScore: number;
  readonly beforeQualityScore: number;
  readonly afterQualityScore: number;
}

export interface CandidatePlan {
  readonly id: string;
  readonly name: string;
  readonly strategy: 'compact_zoning' | 'open_circulation' | 'vastu_aligned' | 'linear_split' | 'perimeter_courtyard';
  readonly description: string;
  readonly building: Building;
  readonly metrics: CandidateMetrics;
  readonly validation: ValidationSummary;
  readonly requiredRoomCounts: Partial<Record<RoomType, number>>;
  readonly designGraph: InstanceDesignGraph;
  readonly optimization: CandidateOptimizationSummary;
  readonly multiFloorPlanning: MultiFloorPlanningSummary;
  readonly vastuPlanning: VastuPlanningSummary;
  readonly rank: number;
  /** Optional for old saved candidates; absence must never be presented as a pass. */
  readonly architecturalEvidence?: ArchitecturalEvidence;
}

/** Versioned observations, independent of legacy ranking and professional approval. */
export interface ArchitecturalEvidence {
  readonly schemaVersion: 1;
  /** Absent on Phase 1A saves: access-path evaluation must show Not evaluated. */
  readonly accessEvidenceVersion?: 1;
  readonly buildingId: string;
  readonly buildingVersion: number;
  readonly status: 'CHECKED_REQUIREMENTS_MET' | 'REVIEW_REQUIRED';
  readonly requiredFloors: readonly {
    readonly programItemId: string;
    readonly name: string;
    readonly requiredLevel: number;
    readonly roomIds: readonly string[];
    readonly actualLevels: readonly number[];
    readonly passed: boolean;
  }[];
  readonly suites: readonly {
    readonly bathroomProgramItemId: string;
    readonly ownerProgramItemId: string;
    readonly name: string;
    readonly bathroomId: string | null;
    readonly ownerId: string | null;
    readonly sameFloor: boolean;
    readonly directDoorIds: readonly string[];
    readonly otherAccessRoomIds: readonly string[];
    readonly status: 'PRIVATE_DIRECT_ACCESS' | 'SHARED_ACCESS' | 'REVIEW_REQUIRED';
    /** Legacy status above describes direct-door observations only. */
    readonly access?: {
      readonly status: 'PRIVATE_DIRECT' | 'PRIVATE_INDIRECT' | 'SHARED' | 'UNRESOLVED' | 'NOT_EVALUATED';
      readonly pathRoomIds: readonly string[];
      readonly pathDoorIds: readonly string[];
      readonly viaRoles: readonly ('dressing' | 'private_access')[];
      readonly sharedEntryRoomIds: readonly string[];
      readonly reason: string;
    };
  }[];
  readonly unownedBathrooms?: readonly {
    readonly programItemId: string;
    readonly name: string;
    readonly bathroomId: string | null;
    readonly ownership: 'COMMON_ACCESS' | 'AMBIGUOUS_OWNERSHIP';
    readonly physicalDoorIds: readonly string[];
  }[];
  readonly wetStacking: {
    /** Mean upper-room footprint coverage by its best lower wet room, not a plumbing check. */
    readonly coveragePercent: number | null;
    readonly status: 'MEASURED' | 'NOT_APPLICABLE' | 'NOT_EVALUATED';
    readonly rooms: readonly {
      readonly upperRoomId: string;
      readonly upperFloorId: string;
      readonly lowerRoomId: string | null;
      readonly lowerFloorId: string;
      readonly coveragePercent: number | null;
    }[];
  };
  readonly openSpace: readonly {
    readonly floorId: string;
    readonly explicitOutdoorRoomIds: readonly string[];
    readonly explicitOutdoorAreaMm2: number;
    readonly residualUnclassifiedAreaMm2: number | null;
  }[];
  readonly limitations: readonly string[];
}

export interface VastuRuleEvidence {
  readonly ruleId: string;
  readonly points: number;
  readonly maxPoints: number;
  readonly description: string;
}

export interface VastuOptimizationStep {
  readonly iteration: number;
  readonly sourceRoomId: string;
  readonly targetRoomId: string;
  readonly description: string;
  readonly beforeScore: number;
  readonly afterScore: number;
  readonly graphScore: number;
}

/** Optional preference evidence; Vastu is guidance, never a hard approval claim. */
export interface VastuPlanningSummary {
  readonly enabled: boolean;
  readonly initialScore: number | null;
  readonly finalScore: number | null;
  readonly attempts: number;
  readonly acceptedChanges: readonly VastuOptimizationStep[];
  readonly graphScoreBefore: number;
  readonly graphScoreAfter: number;
  readonly functionalGraphPreserved: boolean;
  readonly rules: readonly VastuRuleEvidence[];
}

export interface FloorAllocationEvidence {
  readonly level: number;
  readonly roomCount: number;
  readonly bedroomCount: number;
  readonly bathroomCount: number;
  readonly programItemIds: readonly string[];
  readonly availableAreaMm2: number;
  readonly assignedRoomAreaMm2: number;
  readonly intentionalOpenSpaceAreaMm2: number;
  readonly unusedSpaceAreaMm2: number;
  readonly utilizationRatio: number;
  readonly unusedSpaceRatio: number;
  readonly nonCoreRoomCount: number;
}

/** Measured evidence from the final generated multi-floor building. */
export interface MultiFloorPlanningSummary {
  readonly floorCount: number;
  readonly allocations: readonly FloorAllocationEvidence[];
  readonly verticalCoreAligned: boolean;
  /** Legacy same-floor bathroom availability only; not suite ownership/access. */
  readonly bedroomBathroomPairingScore: number;
  /** Legacy best wet-pair overlap; use architecturalEvidence for all-upper-room coverage. */
  readonly wetAreaStackScore: number | null;
  readonly wetAreaStackPairs: number;
  readonly adjacentFloorPairsCovered: number;
  readonly requiredAdjacentFloorPairs: number;
  readonly averageFloorUtilization: number;
  readonly maximumUnusedSpaceRatio: number;
  readonly floorUtilizationScore: number;
  readonly unusedSpaceScore: number;
  readonly roomDistributionScore: number;
  readonly verticalContinuityScore: number;
  readonly buildingLevelScore: number;
}

// ─── 8. Proprietary Data Architecture (25-Year Historical Moat) ─────────────

export enum HumanVerificationStatus {
  Unverified = 'unverified',
  VerifiedArchitect = 'verified_architect',
  VerifiedStructural = 'verified_structural',
  ApprovedCanonical = 'approved_canonical',
  Rejected = 'rejected',
}

export interface DrawingAsset {
  readonly assetId: string;
  readonly fileName: string;
  readonly mimeType: 'image/svg+xml' | 'image/png' | 'application/pdf' | 'application/dxf';
  readonly urlOrPath: string;
  readonly resolutionDpi?: number;
}

export interface ProjectMetadata {
  readonly yearConstructed?: number;
  readonly locationCity?: string;
  readonly climateZone?: string;
  readonly buildingType: 'residential_independent' | 'villa' | 'apartment' | 'duplex' | 'commercial';
  readonly structuralSystem: 'rcc_framed' | 'load_bearing' | 'steel_frame' | 'hybrid';
  readonly vastuCompliant: boolean;
  readonly totalFloors: number;
  readonly estimatedCostInr?: number;
}

export interface HistoricalProject {
  readonly historicalId: string;
  readonly sourceArchiveRef: string;
  readonly metadata: ProjectMetadata;
  readonly rawAssets: readonly DrawingAsset[];
  readonly normalizedBuilding: Building;
  readonly verificationStatus: HumanVerificationStatus;
  readonly datasetVersion: string;
  readonly ingestedAt: string;
}
