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
