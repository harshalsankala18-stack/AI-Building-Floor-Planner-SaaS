/**
 * Requirement Feasibility & Validation Authority.
 *
 * This is a deterministic early feasibility screen, not a regulatory approval.
 * It preserves impossible requests and explains why they cannot proceed.
 */

import type {
  DesignRequirementSpecification,
  RequirementValidationResult,
  RequirementValidationIssue,
} from '@ai-floor-planner/core';
import { PlotShape, RoomType } from '@ai-floor-planner/core';
import { BUILDING_CAPABILITIES } from '@ai-floor-planner/core';

const MIN_ROOM_AREAS_MM2: Partial<Record<RoomType, number>> = {
  [RoomType.Living]: 12_000_000,
  [RoomType.Dining]: 8_000_000,
  [RoomType.Kitchen]: 5_500_000,
  [RoomType.Bedroom]: 9_500_000,
  [RoomType.Bathroom]: 2_500_000,
  [RoomType.Staircase]: 6_000_000,
  [RoomType.Lift]: 4_500_000,
  [RoomType.Parking]: 14_000_000,
  [RoomType.Pooja]: 2_000_000,
  [RoomType.Study]: 6_000_000,
  [RoomType.Balcony]: 3_000_000,
  [RoomType.Utility]: 3_000_000,
  [RoomType.ServantQuarter]: 9_500_000,
  [RoomType.Garden]: 8_000_000,
  [RoomType.Custom]: 6_000_000,
};

const CIRCULATION_AND_WALL_RATIO = 0.18;

function areaFor(type: RoomType): number {
  return MIN_ROOM_AREAS_MM2[type] ?? MIN_ROOM_AREAS_MM2[RoomType.Custom]!;
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

export class RequirementValidator {
  validate(spec: DesignRequirementSpecification): RequirementValidationResult {
    const issues: RequirementValidationIssue[] = [];
    const { hard, soft } = spec;

    if (!Number.isFinite(hard.plotWidthMm) || !Number.isFinite(hard.plotDepthMm) ||
        hard.plotWidthMm <= 0 || hard.plotDepthMm <= 0) {
      issues.push({
        code: 'INVALID_PLOT_DIMENSIONS',
        severity: 'error',
        message: `Plot dimensions must be finite and positive. Received ${hard.plotWidthMm} × ${hard.plotDepthMm} mm.`,
        field: 'hard.plotWidthMm',
        suggestion: 'Enter the measured plot width and depth as positive values.',
      });
    }

    if (hard.plotWidthMm > 0 && hard.plotDepthMm > 0 &&
        (hard.plotWidthMm < 3000 || hard.plotDepthMm < 3000)) {
      issues.push({
        code: 'PLOT_TOO_NARROW',
        severity: 'error',
        message: 'At least one plot dimension is below the 3,000 mm minimum supported by the current residential planner.',
        field: 'hard.plotWidthMm',
        suggestion: 'Use a wider plot or wait for the compact/irregular-site planning module.',
      });
    }

    if (!Number.isInteger(hard.floorsCount) || hard.floorsCount < 1) {
      issues.push({
        code: 'INVALID_FLOOR_COUNT',
        severity: 'error',
        message: `Floor count must be a positive integer. Received ${hard.floorsCount}.`,
        field: 'hard.floorsCount',
      });
    } else if (hard.floorsCount > BUILDING_CAPABILITIES.maximumFloorCount) {
      issues.push({
        code: 'UNSUPPORTED_FLOOR_COUNT',
        severity: 'error',
        message: `${hard.floorsCount} floors exceeds the current low-rise residential planning scope.`,
        field: 'hard.floorsCount',
        suggestion: `Limit the request to ${BUILDING_CAPABILITIES.maximumFloorCount} floors or use a future high-rise workflow.`,
      });
    }

    const countFields = [
      ['bedroomCount', hard.bedroomCount],
      ['bathroomCount', hard.bathroomCount],
      ['parkingSpacesCount', hard.parkingSpacesCount],
    ] as const;
    for (const [field, value] of countFields) {
      if (!isNonNegativeInteger(value)) {
        issues.push({
          code: 'INVALID_REQUIREMENT_COUNT',
          severity: 'error',
          message: `${field} must be a non-negative integer. Received ${value}.`,
          field: `hard.${field}`,
        });
      }
    }

    if (hard.bedroomCount > 8) {
      issues.push({
        code: 'EXCESSIVE_BEDROOM_COUNT',
        severity: 'error',
        message: `Requested ${hard.bedroomCount} bedrooms exceeds the current single-family residential scope.`,
        field: 'hard.bedroomCount',
        suggestion: 'Reduce the bedroom count or use a multi-unit building workflow.',
      });
    }

    if (hard.floorsCount > 1 && !hard.staircaseRequired) {
      issues.push({
        code: 'MISSING_VERTICAL_CIRCULATION',
        severity: 'error',
        message: `${hard.floorsCount} floors require a staircase.`,
        field: 'hard.staircaseRequired',
        suggestion: 'Enable a staircase for every multi-floor request.',
      });
    }

    if (hard.parkingRequired !== (hard.parkingSpacesCount > 0)) {
      issues.push({
        code: 'INCONSISTENT_PARKING_REQUIREMENT',
        severity: 'error',
        message: 'Parking requirement and parking-space count disagree.',
        field: 'hard.parkingSpacesCount',
        suggestion: 'Set parking spaces to zero when parking is not required, or at least one when it is required.',
      });
    }

    if (hard.bedroomCount > 0 && hard.bathroomCount === 0) {
      issues.push({
        code: 'MISSING_BATHROOM',
        severity: 'warning',
        message: 'The residence has bedrooms but no bathroom.',
        field: 'hard.bathroomCount',
        suggestion: 'Add at least one bathroom.',
      });
    }

    if (soft.attachedBathroomsCount > hard.bathroomCount) {
      issues.push({
        code: 'EXCESSIVE_ATTACHED_BATHROOMS',
        severity: 'error',
        message: `${soft.attachedBathroomsCount} attached bathrooms cannot be supplied from ${hard.bathroomCount} total bathrooms.`,
        field: 'soft.attachedBathroomsCount',
        suggestion: 'Increase the total bathroom count or reduce attached bathrooms.',
      });
    }

    if (hard.liftRequired && hard.floorsCount === 1) {
      issues.push({
        code: 'UNNECESSARY_LIFT',
        severity: 'warning',
        message: 'A lift was requested for a single-floor building.',
        field: 'hard.liftRequired',
        suggestion: 'Disable the lift unless it serves a basement, terrace, or accessibility requirement.',
      });
    }

    if (spec.plotShape !== PlotShape.Rectangular) {
      issues.push({
        code: 'HEURISTIC_NON_RECTANGULAR_FEASIBILITY',
        severity: 'warning',
        message: 'Area feasibility for non-rectangular plots is preliminary until a plot polygon is provided.',
        field: 'plotShape',
        suggestion: 'Provide the measured plot polygon before detailed generation.',
      });
    }

    const plotWidth = Number.isFinite(hard.plotWidthMm) ? Math.max(0, hard.plotWidthMm) : 0;
    const plotDepth = Number.isFinite(hard.plotDepthMm) ? Math.max(0, hard.plotDepthMm) : 0;
    const plotAreaMm2 = plotWidth * plotDepth;
    const setbacks = spec.setbacksMm ?? {
      front: Math.min(2000, Math.max(1000, plotDepth * 0.1)),
      rear: Math.min(1500, Math.max(1000, plotDepth * 0.08)),
      left: Math.min(1200, Math.max(900, plotWidth * 0.08)),
      right: Math.min(1200, Math.max(900, plotWidth * 0.08)),
    };

    for (const [side, value] of Object.entries(setbacks)) {
      if (!Number.isFinite(value) || value < 0) {
        issues.push({
          code: 'INVALID_SETBACK',
          severity: 'error',
          message: `${side} setback must be a finite, non-negative distance. Received ${value} mm.`,
          field: `setbacksMm.${side}`,
        });
      }
    }

    const safeSetback = (value: number): number => Number.isFinite(value) ? Math.max(0, value) : 0;
    const buildableWidthMm = Math.max(0, plotWidth - safeSetback(setbacks.left) - safeSetback(setbacks.right));
    const buildableDepthMm = Math.max(0, plotDepth - safeSetback(setbacks.front) - safeSetback(setbacks.rear));
    const buildableAreaMm2 = buildableWidthMm * buildableDepthMm;

    if (buildableWidthMm < 2000 || buildableDepthMm < 2000) {
      issues.push({
        code: 'UNBUILDABLE_SETBACKS',
        severity: 'error',
        message: `Setbacks leave only ${Math.round(buildableWidthMm)} × ${Math.round(buildableDepthMm)} mm of buildable footprint.`,
        field: 'setbacksMm',
        suggestion: 'Verify applicable setbacks or increase the plot dimensions.',
      });
    }

    let baseProgramAreaMm2 = 0;
    if (hard.livingRoomRequired) baseProgramAreaMm2 += areaFor(RoomType.Living);
    if (hard.diningRoomRequired) baseProgramAreaMm2 += areaFor(RoomType.Dining);
    if (hard.kitchenRequired) baseProgramAreaMm2 += areaFor(RoomType.Kitchen);
    if (hard.staircaseRequired) baseProgramAreaMm2 += areaFor(RoomType.Staircase) * hard.floorsCount;
    if (hard.liftRequired) baseProgramAreaMm2 += areaFor(RoomType.Lift) * hard.floorsCount;
    baseProgramAreaMm2 += hard.parkingSpacesCount * areaFor(RoomType.Parking);
    if (soft.poojaRoom) baseProgramAreaMm2 += areaFor(RoomType.Pooja);
    if (soft.studyRoom) baseProgramAreaMm2 += areaFor(RoomType.Study);
    if (soft.balconyPreferred) baseProgramAreaMm2 += areaFor(RoomType.Balcony);
    if (soft.servantQuarter) baseProgramAreaMm2 += areaFor(RoomType.ServantQuarter);
    if (soft.gardenPreference) baseProgramAreaMm2 += areaFor(RoomType.Garden);

    if (hard.bedroomCount > 0) {
      baseProgramAreaMm2 += 14_000_000;
      baseProgramAreaMm2 += Math.max(0, hard.bedroomCount - 1) * areaFor(RoomType.Bedroom);
    }
    baseProgramAreaMm2 += hard.bathroomCount * areaFor(RoomType.Bathroom);

    for (const custom of hard.customRooms ?? []) {
      if (!isNonNegativeInteger(custom.count)) {
        issues.push({
          code: 'INVALID_CUSTOM_ROOM_COUNT',
          severity: 'error',
          message: `Custom room "${custom.name ?? custom.type}" has invalid count ${custom.count}.`,
          field: 'hard.customRooms',
        });
      } else {
        baseProgramAreaMm2 += custom.count * areaFor(custom.type);
      }
    }

    const estimatedCirculationAreaMm2 = baseProgramAreaMm2 * CIRCULATION_AND_WALL_RATIO;
    const estimatedRequiredAreaMm2 = baseProgramAreaMm2 + estimatedCirculationAreaMm2;
    const totalAvailableFloorAreaMm2 = buildableAreaMm2 * Math.max(1, hard.floorsCount);
    const utilizationRatio = totalAvailableFloorAreaMm2 > 0
      ? estimatedRequiredAreaMm2 / totalAvailableFloorAreaMm2
      : 2;

    if (utilizationRatio > 1) {
      issues.push({
        code: 'INSUFFICIENT_PLOT_AREA',
        severity: 'error',
        message: `The requested program needs approximately ${(estimatedRequiredAreaMm2 / 1e6).toFixed(1)} m², but only ${(totalAvailableFloorAreaMm2 / 1e6).toFixed(1)} m² is available across ${hard.floorsCount} floor(s).`,
        suggestion: 'Increase the plot or floor count, or reduce the requested program.',
      });
    } else if (utilizationRatio > 0.8) {
      issues.push({
        code: 'HIGH_SPACE_DENSITY',
        severity: 'warning',
        message: `The estimated program uses ${(utilizationRatio * 100).toFixed(0)}% of available floor area. Packing and circulation will be tight.`,
        suggestion: 'Allow compact rooms or reduce optional spaces.',
      });
    } else {
      issues.push({
        code: 'FEASIBLE_FOOTPRINT',
        severity: 'info',
        message: `The estimated program uses ${(utilizationRatio * 100).toFixed(0)}% of available floor area.`,
      });
    }

    const hasErrors = issues.some(issue => issue.severity === 'error');
    const status: RequirementValidationResult['status'] = hasErrors
      ? 'infeasible'
      : utilizationRatio > 0.8
        ? 'tight'
        : 'feasible';

    const hardRequirementsCount =
      5 +
      Number(hard.kitchenRequired) +
      Number(hard.livingRoomRequired) +
      Number(hard.diningRoomRequired) +
      Number(hard.staircaseRequired) +
      Number(hard.liftRequired) +
      Number(hard.parkingRequired) +
      (hard.customRooms ?? []).reduce((sum, item) => sum + item.count, 0);
    const preferencesCount = Object.values(soft).filter(value =>
      typeof value === 'boolean' ? value : value !== 'none' && value !== 0,
    ).length;

    return {
      status,
      isFeasible: status !== 'infeasible',
      plotAreaMm2,
      buildableAreaMm2,
      buildableWidthMm,
      buildableDepthMm,
      totalAvailableFloorAreaMm2,
      estimatedRequiredAreaMm2,
      estimatedCirculationAreaMm2,
      groundCoverageRatio: Math.min(2, Math.max(0, utilizationRatio)),
      issues,
      hardRequirementsCount,
      preferencesCount,
    };
  }
}
