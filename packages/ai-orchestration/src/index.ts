/**
 * @ai-floor-planner/ai-orchestration
 *
 * AI Provider Abstraction, Untrusted Output Safety, and Natural Language
 * Requirement Parsing Layer.
 */

export { BaseAIProvider, AISafetyError, AIRequestValidationError } from './providers/base';
export { OpenAIProvider, type OpenAIProviderOptions } from './providers/openai';
export {
  GeminiProvider,
  type GeminiProviderOptions,
  type GeminiRetryPolicy,
  DEFAULT_GEMINI_RETRY_POLICY,
  extractHttpStatus,
  isTransientHttpError,
  isAuthHttpError,
  isNetworkTransientError,
  isModelNotFoundError,
  calculateDelayWithJitter,
} from './providers/gemini';
export { HttpProviderError } from './providers/http';
export { RuleBasedRequirementParser } from './providers/rule-based';
export {
  AIOrchestrationService,
  type AIOrchestrationOptions,
  type RequirementParseDiagnostic,
  type RequirementParseResult,
  type RequirementParseSource,
} from './orchestration/service';
export { REQUIREMENT_EXTRACTION_PROMPT, REQUIREMENT_RESPONSE_SCHEMA } from './requirements/schema';
export { validateRequirementPayload, type RequirementPayloadValidation } from './requirements/validation';
export { extractAIEditContext } from './editing/context';
export { RuleBasedEditParser, type LocalEditParseOptions, type LocalEditParseResult } from './editing/parser';
export { AI_EDIT_RESPONSE_SCHEMA, AI_EDIT_SYSTEM_PROMPT } from './editing/schema';
export { validateAIEditPayload } from './editing/validation';
export { resolveRoomTarget, type RoomTargetResolution } from './editing/target-resolver';
export { AIEditCommand } from './editing/command';
export { AIEditPlanner } from './editing/planner';
export type {
  AIEditAction,
  AIEditDirection,
  AIEditDiagnostic,
  AIEditIntent,
  AIEditModelContext,
  AIEditParseResult,
  AIEditParseSource,
  AIEditPlannerOptions,
  AIEditPreview,
  AIEditRoomSummary,
} from './editing/types';
export {
  ArchitecturalResearchAgent,
  type ArchitecturalResearchInput,
  type ArchitecturalResearchReport,
  type RoomSizingRecommendation,
} from './research/architectural-research-agent';
export {
  compileFloorPlanImagePrompt,
  compileApartmentFloorPlanImagePrompt,
  APARTMENT_NEGATIVE_PROMPT,
  FLOOR_PLAN_PROMPT_VERSION,
  APARTMENT_CONCEPT_ROOM_WORDS,
  APARTMENT_CONCEPT_CORE_WORDS,
  apartmentConceptLabelVocabulary,
  type FloorPlanImagePromptInput,
  type ApartmentFloorPlanImagePromptInput,
  type FloorPlanImagePromptRequest,
  type ReferenceImageInput,
} from './orchestration/image-prompt-compiler';
export {
  CloudflareImageProvider,
  DEFAULT_FLUX_MODEL,
  ImageProviderError,
  buildCloudflareImageRequestBody,
  buildCloudflareFormData,
  type CloudflareImageProviderOptions,
  type GeneratedPlanImage,
  type GeneratedPlanImageRequestProvenance,
  type ImageGenerationProvider,
  type ImageProviderErrorCode,
} from './providers/image-generation';
export {
  PollinationsImageProvider,
  POLLINATIONS_PROVIDER_NAME,
  POLLINATIONS_BASE_URL,
  DEFAULT_POLLINATIONS_IMAGE_MODEL,
  POLLINATIONS_EDITS_PATH,
  POLLINATIONS_GENERATIONS_PATH,
  STRUCTURAL_REFERENCE_ID,
  buildPollinationsImageRequest,
  parsePollinationsModelCapabilities,
  type PollinationsImageProviderOptions,
  type PollinationsModelCapabilities,
  type PollinationsImageRequest,
  type PollinationsAccessCheck,
} from './providers/pollinations-image';
export {
  GeminiImageProvider,
  DEFAULT_GEMINI_IMAGE_MODEL,
  DEFAULT_GEMINI_IMAGE_SIZE,
  GEMINI_IMAGE_PROVIDER_NAME,
  GEMINI_API_BASE_URL,
  mapDimensionsToGeminiAspectRatio,
  buildGeminiImagePrompt,
  separateGeminiReferenceImages,
  buildGeminiImageRequestBody,
  extractGeminiImageBytes,
  type GeminiImageAspectRatio,
  type GeminiImageSize,
  type GeminiImageProviderOptions,
  type GeminiImageRequestProvenance,
  type GeminiAccessStatus,
  type GeminiAccessCheck,
} from './providers/gemini-image';

export {
  verifyImageQuality,
  type ImageQualityCheckResult,
} from './orchestration/image-quality-gate';
export {
  checkApartmentCompleteness,
  validateApartmentFeasibility,
  validateIndianApartmentFeasibility,
  getApartmentRulesProfile,
  REGULATORY_SOURCE_REGISTRY,
  allocateApartmentUnitSpaces,
  checkCarpetAreaFeasibility,
  type CarpetAreaFeasibilityReport,
  SUPPORTED_APARTMENT_UNIT_TYPES,
  normalizeUnitType,
  isSupportedUnitType,
  UnsupportedUnitTypeError,
  InvalidCarpetAreaError,
  InsufficientCarpetAreaError,
  getExpectedRoomProgramme,
  CANONICAL_ROOM_PROGRAMMES,
  resolveAndValidateUnitMix,
  TYPOLOGY_STUDIO_TEMPLATE,
  TYPOLOGY_1BHK_TEMPLATE,
  TYPOLOGY_2BHK_TEMPLATE,
  TYPOLOGY_3BHK_TEMPLATE,
  TYPOLOGY_4BHK_TEMPLATE,
  TYPOLOGY_TEMPLATES,
  getFloorConfigurationProgram,
  FLOOR_PROGRAMS,
  generateDeterministicApartmentSchematic,
  type ApartmentJurisdiction,
  type ApartmentRulesProfile,
  type ApartmentUnitType,
  type RoomAllocation,
  type UnitTypologyAllocationResult,
  type TypologyTemplate,
  type ExpectedRoomProgramme,
  type ValidatedUnitMixItem,
  type UnitMixResolutionResult,
  type ApartmentFloorType,
  type FloorConfigurationProgram,
  type DeterministicApartmentSchematic,
  type SchematicApartmentUnit,
  type SchematicCommonCore,
  type SchematicLiftItem,
  type SchematicStairItem,
  type SchematicRoomItem,
  type Rect2D,
  type ApartmentUnitMixItem,
  type ApartmentCommonCore,
  type ApartmentParkingRequirement,
  type ApartmentAmenities,
  type ApartmentBriefConfig,
  type DynamicApartmentQuestion,
  type ApartmentCompletenessResult,
  type ApartmentFeasibilityResult,
  type DetailedApartmentFeasibilityResult,
  type ApartmentFeasibilityConflict,
} from './types/apartment';
export {
  interpretPlanImageWithGemini,
  validateVisionInterpretationPayload,
  detectFloorRegionsFromPayload,
  IMAGE_INTERPRETATION_SCHEMA,
  APARTMENT_IMAGE_INTERPRETATION_SCHEMA,
  APARTMENT_INTERPRETATION_FRAME,
  COMMON_AREA_FLAT_ID,
  type FloorDrawingRegion,
  type ApartmentInterpretationContext,
  type InterpretPlanImageOptions,
  type InterpretationCoordinateFrame,
  type PlanInterpretationResponse,
} from './orchestration/vision-interpretation';
export { buildGeminiParts, GEMINI_SUPPORTED_IMAGE_MIME_TYPES } from './providers/gemini';
export {
  evaluatePlanArchitecturally,
  ARCHITECTURAL_EVALUATION_SCHEMA,
  type ArchitecturalEvaluationOptions,
  type ArchitecturalEvaluationResult,
  MASTER_IMAGE_EVALUATION_SCHEMA,
  MASTER_QUALITY_GATE_THRESHOLD,
  evaluateMasterImageWithGemini,
  type MasterImageEvaluationOptions,
  type MasterImageEvaluationResult,
} from './orchestration/architectural-evaluation';
export {
  runGeminiApartmentPreflight,
  evaluateApartmentPreflight,
  APARTMENT_PREFLIGHT_SCHEMA,
  APARTMENT_PREFLIGHT_PROMPT,
  type ExpectedApartmentBrief,
  type DetectedApartmentFeatures,
  type ApartmentVisualPreflightResult,
} from './orchestration/apartment-preflight';
export {
  buildApartmentGenerationManifest,
  renderApartmentManifestText,
  validateSchematicMatchesManifest,
  classifySchematicUnitRooms,
  type ClassifiedUnitRooms,
  type ApartmentGenerationManifest,
  type ApartmentUnitManifestItem,
  type ApartmentRoomTotals,
  type ApartmentAreaAllocations,
  type BuildApartmentManifestInput,
} from './apartment/manifest';
export {
  renderSchematicPng512,
  fluxConceptRoomLabel,
  FLUX_CONCEPT_ROOM_LABELS,
  FLUX_CONCEPT_SHORT_FALLBACKS,
  FLUX_CONCEPT_CORE_LABELS,
  type SchematicRenderMode,
  type RenderSchematicOptions,
  type DrawnSchematicLabel,
} from './apartment/schematic-renderer';
export type { SchematicDoor, SchematicSpatialCheck, GenerateSchematicOptions } from './apartment/schematic';
export {
  APARTMENT_CONCEPT_STRATEGIES,
  COMMON_LOBBY_ID,
  getApartmentConceptStrategy,
  planApartmentLayout,
  type ApartmentConceptStrategy,
  type ApartmentLayoutPlan,
  type ApartmentLayoutStrategy,
  type AreaLine,
  type FloorAreaBalance,
  type LayoutBand,
  type LayoutZone,
  type PlannedDoor,
  type SpatialCheck,
  type SpatialGraphEdge,
  type SpatialGraphNode,
  type UnitAreaReport,
} from './apartment/layout-planner';
export {
  computeAspectAdaptedDimensions,
  MIN_OUTPUT_DIMENSION_PX,
  MAX_OUTPUT_DIMENSION_PX,
  OUTPUT_DIMENSION_STEP_PX,
  TARGET_PIXEL_BUDGET,
  type AspectAdaptedDimensions,
} from './orchestration/aspect-ratio';
export {
  resolveApartmentReferenceBucket,
  selectReferenceCandidates,
  finalizeReferenceSelection,
  isApartmentReferencePlateName,
  ALL_APARTMENT_REFERENCE_BUCKETS,
  type ApartmentReferenceBucket,
  type ReferenceStatus,
  type ReferenceDropRecord,
  type ReferenceSelectionDiagnostics,
  type AvailableReferenceFile,
} from './apartment/reference-library';
export {
  schematicToApartmentStructure,
  apartmentExpectationFromManifest,
  apartmentInterpretationContextFromManifest,
  buildExtractionSite,
  adaptSchematicToBuilding,
  buildSteppedBuildingBoundary,
  generateWindowsForApartmentSchematic,
} from './apartment/adapter';
export {
  createStructuralPlanRepresentation,
  type StructuralPlanRepresentation,
  type StructuralSegment2D,
  type StructuralPoint2D,
  type StructuralSpaceBoundary,
  type StructuralDoorOpening,
  type WallClassification,
  type RecommendedRenderResolutions,
} from './apartment/structural-representation';
export {
  planDeterministicApartment,
  formatPlannerDiagnostics,
  type DeterministicPlannerInput,
  type DeterministicPlannerOutput,
  type PlannerDiagnostics,
  type DeterministicPlannerSiteInput,
  type DeterministicPlannerUnitMixItem,
  type DeterministicPlannerCoreInput,
} from './apartment/deterministic-planner';
export {
  renderStructuralPlan,
  validateStructuralPlanRepresentation,
  STRUCTURAL_RENDERER_VERSION,
  InvalidStructuralPlanError,
  type RenderStructuralPlanOptions,
  type RenderStructuralPlanResult,
} from './apartment/structural-renderer';
export {
  buildingModelToArchLangSource,
  escapeArchLangString,
  toArchLangId,
  mapRoomTypeToArchLangUse,
  deriveWallsFromFloorRooms,
  ARCHLANG_ADAPTER_VERSION,
  ARCHLANG_PACKAGE_VERSION,
  type ArchLangAdapterOptions,
  type ArchLangDiagnostic,
  type ArchLangSerializationResult,
} from './apartment/archlang-adapter';
export {
  validateGeometryParity,
  type GeometryParityItem,
  type GeometryParityReport,
} from './apartment/archlang-parity-validator';
export {
  compileBuildingWithArchLang,
  compileBuildingToArchLang,
  compileBuildingToDxf,
  lintApartmentCadGeometry,
  type ArchLangExportResult,
  type ArchLangCompileOptions,
  type ArchLangPage,
  type ArchLangProvenance,
} from './apartment/archlang-compiler';


