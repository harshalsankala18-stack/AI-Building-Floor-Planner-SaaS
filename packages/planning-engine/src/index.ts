/**
 * @ai-floor-planner/planning-engine
 *
 * Requirements Validation, Room Program Generation, Topological Design Graph,
 * and Deterministic Multi-Candidate Generation Engine.
 */

export { RequirementValidator } from './requirements/validator';
export { RoomProgramGenerator } from './program/generator';
export { DesignGraphBuilder } from './graph/builder';
export { evaluateInstanceGraph, relationshipUtility } from './graph/scorer';
export type { InstanceGraphEvaluation } from './graph/scorer';
export { PlanRepairEngine, swapProgramAssignments } from './repair/engine';
export type { PlanRepairOptions, PlanRepairResult } from './repair/engine';
export {
  FloorProgramPlanner,
  FloorProgramAllocationError,
  evaluateMultiFloorPlanning,
} from './multi-floor/planner';
export type {
  FloorAreaBudget,
  FloorProgramAllocationOptions,
  FloorProgramAllocationResult,
} from './multi-floor/planner';
export { VastuOptimizer } from './vastu/optimizer';
export type { VastuOptimizationOptions, VastuOptimizationResult } from './vastu/optimizer';
export { CandidateGenerator } from './generator/candidate-generator';
export type { GenerationGeometryContext } from './generator/candidate-generator';
export {
  decomposeOrthogonalIntersection,
  decomposeOrthogonalPolygon,
  sharedRegionEdge,
  subtractRegion,
  subtractRegions,
} from './regions/orthogonal-decomposition';
export type { PlanningRegion, SharedRegionEdge } from './regions/orthogonal-decomposition';
export {
  GENERATION_STAGES,
  assessGenerationReadiness,
  runGenerationWorkflow,
} from './generation/workflow';
export type {
  GenerationStageId,
  GenerationStage,
  GenerationWorkflowIssue,
  GenerationReadinessReport,
  GenerationWorkflowInput,
  GenerationWorkflowResult,
} from './generation/workflow';
export {
  RefinementError,
  buildingRefinementRevision,
  isRefinementCandidateStale,
  generateTargetedRefinements,
} from './refinement/targeted-regeneration';
export type {
  RefinementFailureCode,
  RefinementChange,
  RefinementCandidate,
  TargetedRegenerationInput,
} from './refinement/targeted-regeneration';
