import type { DesignRequirementSpecification, FunctionalZone } from './design-intelligence';
import type { AdjacencyStrength, RoomType } from './enums';

export type SpaceBuildingCategory = 'residential' | 'commercial' | 'mixed_use' | 'educational';
export type SpaceFunctionalGroup =
  | 'private' | 'baths' | 'living' | 'service' | 'special'
  | 'circulation' | 'outdoor' | 'vehicle' | 'work' | 'learning' | 'technical';
export type SpacePriority = 'required' | 'preferred' | 'optional';
export type SpaceFloorPreferenceKind =
  | 'any' | 'ground_preferred' | 'upper_preferred' | 'top_preferred'
  | 'ground_required' | 'specific';
export type SpaceOccupancy = 'residential' | 'commercial' | 'educational' | 'shared';
export type SpaceGeneratorSupport = 'supported' | 'program_only';
export type ProgramProvenance = 'USER_DEFINED' | 'PRESET' | 'DERIVED_FROM_EXISTING_DESIGN' | 'NOT_YET_DEFINED';
export type GenerationReadiness = 'FULLY_SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'NOT_SUPPORTED';
export type ProgramCapacityState = 'COMFORTABLE' | 'TIGHT' | 'INFEASIBLE' | 'INSUFFICIENT_INPUT';

export interface SpaceRelationshipDefinition {
  readonly targetDefinitionId: string;
  readonly strength: AdjacencyStrength;
  readonly reason: string;
}

export interface SpaceDefinition {
  readonly id: string;
  readonly canonicalType?: RoomType;
  readonly displayName: string;
  readonly categories: readonly SpaceBuildingCategory[];
  readonly group: SpaceFunctionalGroup;
  readonly zone: FunctionalZone;
  readonly occupancy: SpaceOccupancy;
  readonly synonyms: readonly string[];
  readonly defaultQuantity: number;
  readonly minimumAreaMm2: number;
  readonly preferredAreaMm2: number;
  readonly maximumAreaMm2?: number;
  readonly defaultPriority: SpacePriority;
  readonly defaultFloorPreference: SpaceFloorPreferenceKind;
  readonly generatorSupport: SpaceGeneratorSupport;
  readonly tags: readonly string[];
  readonly relationships?: readonly SpaceRelationshipDefinition[];
}

export interface SpaceFloorPreference {
  readonly kind: SpaceFloorPreferenceKind;
  readonly specificFloor?: number;
}

export interface SpaceProgramItem {
  readonly id: string;
  readonly definitionId: string;
  readonly name: string;
  readonly quantity: number;
  readonly minimumAreaMm2: number;
  readonly preferredAreaMm2: number;
  readonly maximumAreaMm2?: number;
  readonly priority: SpacePriority;
  readonly floorPreference: SpaceFloorPreference;
  /** Owning bedroom's Program item ID. Equal quantities pair by instance index;
   * a single owner may own multiple baths. Omission preserves legacy inference. */
  readonly attachedToRoomId?: string;
  readonly group: SpaceFunctionalGroup;
  readonly zone: FunctionalZone;
  readonly occupancy: SpaceOccupancy;
  readonly canonicalType?: RoomType;
  readonly generatorSupport: SpaceGeneratorSupport;
  readonly isCustom: boolean;
  readonly notes?: string;
  readonly accessible?: boolean;
  readonly seniorFriendly?: boolean;
  readonly wheelchairClearanceRequired?: boolean;
}

export interface SpaceProgram {
  readonly schemaVersion: 1;
  readonly category: SpaceBuildingCategory;
  readonly items: readonly SpaceProgramItem[];
  readonly provenance: ProgramProvenance;
  readonly presetId?: string;
  readonly updatedAt: string;
}

export interface ProgramValidationIssue {
  readonly status: 'INVALID' | 'WARNING';
  readonly itemId?: string;
  readonly field: string;
  readonly message: string;
}

export interface ProgramValidationResult {
  readonly status: 'VALID' | 'INVALID';
  readonly issues: readonly ProgramValidationIssue[];
}

export interface FloorCapacityPressure {
  readonly floorLevel: number;
  readonly requiredDemandMm2: number;
  readonly preferredDemandMm2: number;
  readonly availableAreaMm2: number;
  readonly status: 'AVAILABLE' | 'TIGHT' | 'OVER_CAPACITY';
  readonly itemNames: readonly string[];
}

export interface ProgramCapacityResult {
  readonly state: ProgramCapacityState;
  readonly minimumProgramAreaMm2: number;
  readonly preferredProgramAreaMm2: number;
  readonly buildableEnvelopePerFloorMm2: number;
  readonly plannedFloorCount: number;
  readonly geometricCapacityMm2: number;
  readonly fsiLimitedCapacityMm2?: number;
  readonly preliminaryGrossCapacityMm2: number;
  readonly circulationReserveMm2: number;
  readonly verticalCoreReserveMm2: number;
  readonly wallServiceReserveMm2: number;
  readonly estimatedUsableCapacityMm2: number;
  readonly utilizationRatio?: number;
  readonly deficitMm2?: number;
  readonly floorPressures: readonly FloorCapacityPressure[];
  readonly assumptions: readonly string[];
}

export interface ResidentialProgramAdapterResult {
  readonly readiness: GenerationReadiness;
  readonly supportedRoomCounts: Readonly<Partial<Record<RoomType, number>>>;
  readonly unsupportedItemIds: readonly string[];
  readonly requirements?: DesignRequirementSpecification;
}

export interface SpaceProgramPreset {
  readonly id: string;
  readonly name: string;
  readonly category: SpaceBuildingCategory;
  readonly items: readonly { definitionId: string; quantity?: number; priority?: SpacePriority; floorPreference?: SpaceFloorPreference }[];
}
