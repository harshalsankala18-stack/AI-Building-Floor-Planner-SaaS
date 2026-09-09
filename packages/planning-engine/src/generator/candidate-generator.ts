/**
 * Deterministic candidate generation, hard validation, and graph optimization.
 * Three geometry variants are attempted per strategy; only hard-valid variants
 * can be selected or returned to the UI.
 */
import type {
  Building, CandidateMetrics, CandidateOptimizationSummary, CandidatePlan,
  DesignRequirementSpecification, InstanceDesignGraph, RoomProgram, RoomType,
} from '@ai-floor-planner/core';
import { ConstraintCategory, PlanValidator } from '@ai-floor-planner/constraint-engine';
import { polygonArea } from '@ai-floor-planner/geometry-engine';
import { DesignGraphBuilder } from '../graph/builder';
import { evaluateInstanceGraph } from '../graph/scorer';
import type { InstanceGraphEvaluation } from '../graph/scorer';
import { PlanRepairEngine } from '../repair/engine';
import type { PlanRepairResult } from '../repair/engine';
import { LAYOUT_STRATEGIES, StructuredLayoutGenerator, roomProgramCounts } from './structured-layout';
import type { LayoutStrategyProfile } from './structured-layout';
import { PolygonLayoutGenerator } from './polygon-layout';
import { evaluateMultiFloorPlanning } from '../multi-floor/planner';
import { evaluateArchitecturalEvidence } from '../evidence/architectural-evidence';
import { VastuOptimizer } from '../vastu/optimizer';
import type { VastuOptimizationResult } from '../vastu/optimizer';

interface ValidAttempt {
  readonly variantId: string;
  readonly building: Building;
  readonly validation: ReturnType<PlanValidator['validate']>;
  readonly graphEvaluation: InstanceGraphEvaluation;
  readonly repair: PlanRepairResult;
  readonly vastu: VastuOptimizationResult;
  readonly multiFloor: ReturnType<typeof evaluateMultiFloorPlanning>;
  readonly selectionScore: number;
}

export interface GenerationGeometryContext {
  /** Building whose Floor.boundary values are the authoritative generation plates. */
  readonly sourceBuilding: Building;
}

// Keep strategy envelopes distinct while still exploring meaningful geometry.
const VARIANT_OFFSETS = [0, -0.005, 0.005] as const;

function clampColumnRatio(value: number): number {
  return Math.max(0.46, Math.min(0.54, value));
}

export class CandidateGenerator {
  private readonly validator = new PlanValidator();
  private readonly graphBuilder = new DesignGraphBuilder();
  private readonly layoutGenerator = new StructuredLayoutGenerator();
  private readonly polygonLayoutGenerator = new PolygonLayoutGenerator();
  private readonly repairEngine = new PlanRepairEngine(this.validator);
  private readonly vastuOptimizer = new VastuOptimizer(this.validator);

  generateCandidates(
    spec: DesignRequirementSpecification,
    program: RoomProgram,
    _seed: number = 42,
    geometry?: GenerationGeometryContext,
  ): CandidatePlan[] {
    const requiredRoomCounts = roomProgramCounts(program);
    const requiredRoomTypes = Object.keys(requiredRoomCounts) as RoomType[];
    const designGraph = this.graphBuilder.buildInstanceGraph(program);
    const strategyFailures: string[] = [];

    const candidates = LAYOUT_STRATEGIES.map((profile, index): CandidatePlan | null => {
      const validAttempts: ValidAttempt[] = [];
      const failureMessages: string[] = [];
      let initialGraphScore = 0;

      VARIANT_OFFSETS.forEach((offset, variantIndex) => {
        const ratio = clampColumnRatio(profile.columnRatio + offset);
        const variantId = `${profile.strategy}_ratio_${Math.round(ratio * 1000)}`;
        const variantProfile: LayoutStrategyProfile = { ...profile, columnRatio: ratio };
        try {
          const generatedBuilding = geometry
            ? this.polygonLayoutGenerator.generate(spec, program, variantProfile, designGraph, geometry.sourceBuilding)
            : this.layoutGenerator.generate(spec, program, variantProfile, designGraph);
          const generatedGraphEvaluation = evaluateInstanceGraph(generatedBuilding, designGraph);
          if (variantIndex === 0) initialGraphScore = generatedGraphEvaluation.score;
          // Phase 5 repairs architectural function independently of optional Vastu guidance.
          this.validator.configure({ enableVastu: false });
          const repair = this.repairEngine.repair(generatedBuilding, designGraph, {
            requiredRoomTypes,
            requiredRoomCounts,
            maxIterations: 2,
          });
          // Phase 7 runs only after functional repair has stabilized the plan.
          this.validator.configure({
            enableVastu: spec.soft.vastuCompliance,
            vastuStrictness: 'moderate',
          });
          const vastu = this.vastuOptimizer.optimize(repair.building, designGraph, {
            enabled: spec.soft.vastuCompliance,
            requiredRoomTypes,
            requiredRoomCounts,
            maxIterations: 2,
          });
          const building = vastu.building;
          const validation = vastu.validation;
          const graphEvaluation = vastu.graphEvaluation;
          const multiFloor = evaluateMultiFloorPlanning(building);

          if (!validation.isValid) {
            failureMessages.push(...validation.violations
              .filter(result => result.severity === 'hard')
              .map(result => result.message)
              .slice(0, 2));
            return;
          }
          validAttempts.push({
            variantId,
            building,
            validation,
            graphEvaluation,
            repair,
            vastu,
            multiFloor,
            selectionScore: validation.overallScore * 0.55
              + graphEvaluation.score * 0.2
              + multiFloor.buildingLevelScore * 0.25,
          });
        } catch (error) {
          failureMessages.push(error instanceof Error ? error.message : 'A layout variant could not be generated.');
        }
      });

      const nonRegressingAttempts = validAttempts.filter(attempt =>
        initialGraphScore === 0 || attempt.graphEvaluation.score >= initialGraphScore,
      );
      const selectableAttempts = nonRegressingAttempts.length > 0 ? nonRegressingAttempts : validAttempts;
      selectableAttempts.sort((a, b) =>
        b.selectionScore - a.selectionScore
        || b.graphEvaluation.score - a.graphEvaluation.score
        || a.variantId.localeCompare(b.variantId),
      );
      const selected = selectableAttempts[0];
      if (!selected) {
        const detail = [...new Set(failureMessages)].slice(0, 3).join(' ');
        strategyFailures.push(`The ${profile.name} strategy could not produce a hard-valid plan. ${detail}`.trim());
        return null;
      }

      const optimization: CandidateOptimizationSummary = {
        attempts: VARIANT_OFFSETS.length,
        validAttempts: validAttempts.length,
        initialGraphScore,
        finalGraphScore: selected.graphEvaluation.score,
        selectedVariant: selected.variantId,
        repairAttempts: selected.repair.attempts,
        acceptedRepairs: selected.repair.acceptedSteps.length,
        repairTrace: selected.repair.acceptedSteps,
      };
      const candidate = this.createCandidate(
        `candidate_${profile.strategy}_${index + 1}`,
        `${profile.name} ${spec.hard.bedroomCount}BHK`,
        profile,
        selected,
        requiredRoomCounts,
        designGraph,
        optimization,
      );
      return { ...candidate, architecturalEvidence: evaluateArchitecturalEvidence(candidate.building, program) };
    }).filter((candidate): candidate is CandidatePlan => candidate !== null);

    if (!candidates.length) {
      throw new Error(`No strategy produced a hard-valid plan. ${strategyFailures.join(' ')}`.trim());
    }

    const unique = candidates.filter((candidate, index, values) => {
      const signature = layoutSignature(candidate.building);
      return values.findIndex(value => layoutSignature(value.building) === signature) === index;
    });
    if (!unique.length) throw new Error('No materially distinct hard-valid candidate remained after diversity checks.');
    unique.sort((a, b) =>
      b.metrics.overallQualityScore - a.metrics.overallQualityScore
      || b.metrics.adjacencyScore - a.metrics.adjacencyScore
      || a.id.localeCompare(b.id),
    );
    return unique.map((candidate, index) => ({ ...candidate, rank: index + 1 }));
  }

  private createCandidate(
    id: string,
    name: string,
    profile: LayoutStrategyProfile,
    attempt: ValidAttempt,
    requiredRoomCounts: CandidatePlan['requiredRoomCounts'],
    designGraph: InstanceDesignGraph,
    optimization: CandidateOptimizationSummary,
  ): CandidatePlan {
    const { building, validation, graphEvaluation, vastu, multiFloor } = attempt;
    const allRooms = building.floors.flatMap(floor => floor.rooms);
    const carpetArea = allRooms.reduce((sum, room) => sum + room.area, 0);
    const buildableArea = building.floors.reduce((sum, floor) => {
      return floor.boundary.points.length < 3 ? sum : sum + polygonArea(floor.boundary);
    }, 0);
    const category = (kind: ConstraintCategory): number => validation.categoryScores[kind]?.score ?? 0;

    const metrics: CandidateMetrics = {
      hardValidity: true,
      overallQualityScore: Math.round(attempt.selectionScore),
      areaEfficiencyScore: buildableArea > 0
        ? Math.max(0, Math.min(100, Math.round((carpetArea / buildableArea) * 100)))
        : 0,
      adjacencyScore: graphEvaluation.score,
      circulationScore: category(ConstraintCategory.CIRCULATION),
      daylightScore: category(ConstraintCategory.DAYLIGHT),
      privacyScore: category(ConstraintCategory.PRIVACY),
      vastuProxyScore: vastu.summary.finalScore ?? 0,
      floorUtilizationScore: multiFloor.floorUtilizationScore,
      unusedSpaceScore: multiFloor.unusedSpaceScore,
      verticalContinuityScore: multiFloor.verticalContinuityScore,
      roomDistributionScore: multiFloor.roomDistributionScore,
      totalCarpetAreaMm2: carpetArea,
      totalBuiltupAreaMm2: Math.round(carpetArea * 1.15),
      roomCount: allRooms.length,
    };

    return {
      id, name, strategy: profile.strategy, description: profile.description,
      building, metrics, validation, requiredRoomCounts, designGraph, optimization,
      multiFloorPlanning: multiFloor,
      vastuPlanning: vastu.summary,
      rank: 1,
    };
  }
}

function layoutSignature(building: Building): string {
  return building.floors.map(floor => floor.rooms
    .map(room => [room.type, Math.round(room.x), Math.round(room.y), Math.round(room.width), Math.round(room.height)].join(':'))
    .sort().join('|')).join('||');
}
