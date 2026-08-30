/** Bounded, immutable, validation-gated plan repair. */
import type { Building, InstanceDesignGraph, PlanRepairStep, Room } from '@ai-floor-planner/core';
import { RoomType } from '@ai-floor-planner/core';
import { PlanValidator } from '@ai-floor-planner/constraint-engine';
import type { ValidateOptions, ValidationSummary } from '@ai-floor-planner/constraint-engine';
import { evaluateInstanceGraph } from '../graph/scorer';
import type { InstanceGraphEvaluation } from '../graph/scorer';

export interface PlanRepairOptions extends ValidateOptions {
  readonly maxIterations?: number;
}

export interface PlanRepairResult {
  readonly building: Building;
  readonly initialValidation: ValidationSummary;
  readonly finalValidation: ValidationSummary;
  readonly initialGraphEvaluation: InstanceGraphEvaluation;
  readonly finalGraphEvaluation: InstanceGraphEvaluation;
  readonly attempts: number;
  readonly acceptedSteps: readonly PlanRepairStep[];
}

const NON_REASSIGNABLE_TYPES = new Set<RoomType>([
  RoomType.Staircase, RoomType.Lift, RoomType.Parking, RoomType.Garden, RoomType.Balcony,
]);

function combinedQuality(validation: ValidationSummary, graph: InstanceGraphEvaluation): number {
  return validation.overallScore * 0.75 + graph.score * 0.25;
}

function programTag(room: Room): string | undefined {
  return room.tags.find(tag => tag.startsWith('program:'));
}

function canReassign(room: Room): boolean {
  return !room.isFixed && !NON_REASSIGNABLE_TYPES.has(room.type) && programTag(room) !== undefined;
}

function semanticAssignment(room: Room) {
  return {
    type: room.type,
    name: room.name,
    minArea: room.minArea,
    maxArea: room.maxArea,
    priority: room.priority,
    tags: room.tags,
    adjacencyRequirements: room.adjacencyRequirements,
    daylightRequirement: room.daylightRequirement,
    privacyRequirement: room.privacyRequirement,
    ventilationRequired: room.ventilationRequired,
    isFixed: room.isFixed,
  };
}

/** Swap semantic assignments while preserving geometry, walls, and door IDs. */
export function swapProgramAssignments(building: Building, sourceRoomId: string, targetRoomId: string): Building {
  const rooms = building.floors.flatMap(floor => floor.rooms);
  const source = rooms.find(room => room.id === sourceRoomId);
  const target = rooms.find(room => room.id === targetRoomId);
  if (!source || !target || source.floorId !== target.floorId) return building;
  const sourceAssignment = semanticAssignment(source);
  const targetAssignment = semanticAssignment(target);
  return {
    ...building,
    floors: building.floors.map(floor => floor.id !== source.floorId ? floor : {
      ...floor,
      rooms: floor.rooms.map(room => {
        if (room.id === source.id) return { ...room, ...targetAssignment };
        if (room.id === target.id) return { ...room, ...sourceAssignment };
        return room;
      }),
    }),
    version: building.version + 1,
    updatedAt: new Date().toISOString(),
  };
}

export class PlanRepairEngine {
  private readonly validator: PlanValidator;

  constructor(validator = new PlanValidator()) {
    this.validator = validator;
  }

  repair(building: Building, graph: InstanceDesignGraph, options: PlanRepairOptions = {}): PlanRepairResult {
    const { maxIterations = 2, ...validateOptions } = options;
    const initialValidation = this.validator.validate(building, validateOptions);
    const initialGraphEvaluation = evaluateInstanceGraph(building, graph);
    let currentBuilding = building;
    let currentValidation = initialValidation;
    let currentGraph = initialGraphEvaluation;
    let attempts = 0;
    const acceptedSteps: PlanRepairStep[] = [];

    for (let iteration = 1; iteration <= Math.max(0, maxIterations); iteration++) {
      const currentQuality = combinedQuality(currentValidation, currentGraph);
      let best: {
        building: Building; validation: ValidationSummary; graph: InstanceGraphEvaluation;
        source: Room; target: Room; quality: number;
      } | undefined;

      for (const floor of currentBuilding.floors) {
        const rooms = floor.rooms.filter(canReassign).sort((a, b) => a.id.localeCompare(b.id));
        for (let sourceIndex = 0; sourceIndex < rooms.length; sourceIndex++) {
          for (let targetIndex = sourceIndex + 1; targetIndex < rooms.length; targetIndex++) {
            const source = rooms[sourceIndex]!;
            const target = rooms[targetIndex]!;
            if (programTag(source) === programTag(target)) continue;
            attempts++;
            const proposal = swapProgramAssignments(currentBuilding, source.id, target.id);
            const validation = this.validator.validate(proposal, validateOptions);
            const graphEvaluation = evaluateInstanceGraph(proposal, graph);
            const quality = combinedQuality(validation, graphEvaluation);
            const improvesFailures = validation.failed < currentValidation.failed;
            const preservesValidity = !currentValidation.isValid || validation.isValid;
            const improvesQuality = validation.failed === currentValidation.failed
              && graphEvaluation.score >= currentGraph.score
              && quality > currentQuality + 0.001;
            if (!preservesValidity || (!improvesFailures && !improvesQuality)) continue;

            const isBetter = !best
              || validation.failed < best.validation.failed
              || (validation.failed === best.validation.failed && quality > best.quality)
              || (validation.failed === best.validation.failed && quality === best.quality
                && `${source.id}|${target.id}` < `${best.source.id}|${best.target.id}`);
            if (isBetter) best = { building: proposal, validation, graph: graphEvaluation, source, target, quality };
          }
        }
      }

      if (!best) break;
      acceptedSteps.push({
        iteration,
        action: 'swap_program_assignments',
        sourceRoomId: best.source.id,
        targetRoomId: best.target.id,
        description: `Reassigned ${best.source.name} and ${best.target.name} to better geometry slots.`,
        beforeHardFailures: currentValidation.failed,
        afterHardFailures: best.validation.failed,
        beforeGraphScore: currentGraph.score,
        afterGraphScore: best.graph.score,
        beforeQualityScore: Math.round(currentQuality),
        afterQualityScore: Math.round(best.quality),
      });
      currentBuilding = best.building;
      currentValidation = best.validation;
      currentGraph = best.graph;
    }

    return {
      building: currentBuilding,
      initialValidation,
      finalValidation: currentValidation,
      initialGraphEvaluation,
      finalGraphEvaluation: currentGraph,
      attempts,
      acceptedSteps,
    };
  }
}
