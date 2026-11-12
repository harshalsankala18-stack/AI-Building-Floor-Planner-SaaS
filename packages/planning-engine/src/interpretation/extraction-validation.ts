/**
 * Phase 3 - HARD VALIDATION of the extracted-to-built plan (PRD 23).
 *
 * The deterministic system answers "Is this plan valid?" - Gemini evaluation
 * (a separate module) answers "How good is this valid plan?". A plan that
 * fails any hard check here is REJECTED with actionable reasons; it is never
 * silently repaired or re-imagined.
 */

import type { Building } from '@ai-floor-planner/core';
import type { DesignRequirementSpecification } from '@ai-floor-planner/core';
import { containsPolygon } from '@ai-floor-planner/geometry-engine';
import { evaluateDesign } from '../diagnostics/design-evaluator';
import { detectRoomCollisions } from '@ai-floor-planner/geometry-engine';
import type { DiagnosticFragment, ExtractedPlan } from './extraction';
import { extractedRoomType } from './extraction-analysis';

export interface ExtractedPlanValidation {
  readonly isValid: boolean;
  readonly recommendedForEditing: boolean;
  readonly geometryHealthy: boolean;
  readonly overallScore: number;
  readonly verificationIssues: readonly DiagnosticFragment[];
}

export function validateExtractedPlan(
  building: Building,
  extracted: ExtractedPlan,
  requirements: DesignRequirementSpecification,
): ExtractedPlanValidation {
  const diagnostics = evaluateDesign(building, { requiredRoomTypes: ['living', 'bedroom'] as never });
  const issues: DiagnosticFragment[] = [];

  if (!diagnostics.geometryHealthy) {
    issues.push({
      code: 'EXTRACTION_GEOMETRY_UNHEALTHY',
      severity: 'error',
      message: 'The extracted plan fails the deterministic geometry health check. It cannot be installed as a canonical 2D plan.',
    });
  }
  for (const warning of diagnostics.warnings) {
    if (warning.severity === 'error') {
      issues.push({ code: 'EXTRACTION_GEOMETRY_ERROR', severity: 'error', message: warning.message });
    }
  }

  const allRooms = building.floors.flatMap(floor => floor.rooms);
  const collisions = building.floors.flatMap(floor =>
    floor.rooms.flatMap(room => detectRoomCollisions(room, floor.rooms)),
  );
  if (collisions.length > 0) {
    const sample = collisions.slice(0, 5).map(collision => [collision.entityA, collision.entityB].join(', ')).join('; ');
    issues.push({
      code: 'EXTRACTION_ROOM_COLLISIONS',
      severity: 'error',
      message: `Detected ${collisions.length} room collision(s): ${sample}${collisions.length > 5 ? ' ...' : ''}.`,
    });
  }

  // Extracted rooms must satisfy the requested program counts (PRD 23).
  const extractedCounts: Record<string, number> = {};
  for (const room of extracted.rooms) {
    const type = extractedRoomType(room.type || room.name);
    extractedCounts[type] = (extractedCounts[type] ?? 0) + 1;
    const rawCombined = `${room.type} ${room.name}`.toLowerCase();
    if (type === 'living' && rawCombined.includes('dining')) {
      extractedCounts['dining'] = (extractedCounts['dining'] ?? 0) + 1;
    }
  }
  if (extracted.parking.length > 0) {
    extractedCounts['parking'] = (extractedCounts['parking'] ?? 0) + extracted.parking.length;
  }
  if (extracted.stairs.length > 0) {
    extractedCounts['staircase'] = (extractedCounts['staircase'] ?? 0) + extracted.stairs.length;
  }
  const buildingCounts: Record<string, number> = {};
  for (const room of allRooms) {
    buildingCounts[room.type] = (buildingCounts[room.type] ?? 0) + 1;
  }
  const siteParkingZones = (building.site?.siteZones ?? []).filter(
    z => String((z as unknown as Record<string, unknown>).category ?? (z as unknown as Record<string, unknown>).type ?? z.name ?? '').toLowerCase().includes('parking'),
  ).length;
  if (siteParkingZones > 0) {
    buildingCounts['parking'] = Math.max(
      buildingCounts['parking'] ?? 0,
      requirements.hard.parkingSpacesCount || siteParkingZones,
    );
  }
  const requiredFields: ReadonlyArray<readonly [string, number]> = [
    ['bedroom', requirements.hard.bedroomCount],
    ['bathroom', requirements.hard.bathroomCount],
    ['living', requirements.hard.livingRoomRequired ? 1 : 0],
    ['kitchen', requirements.hard.kitchenRequired ? 1 : 0],
    ['dining', requirements.hard.diningRoomRequired ? 1 : 0],
    ['parking', requirements.hard.parkingSpacesCount],
  ];
  for (const [type, required] of requiredFields) {
    const extractedCount = Math.max(extractedCounts[type] ?? 0, buildingCounts[type] ?? 0);
    if (required > 0 && extractedCount < required) {
      issues.push({
        code: 'EXTRACTION_MISSING_REQUIRED_ROOMS',
        severity: 'error',
        message: `The extracted plan has ${extractedCount} ${type} room(s) but the requirements requested ${required}. The request was not relaxed.`,
      });
    }
  }

  const outOfBounds = building.floors.flatMap(currentFloor => currentFloor.rooms)
    .filter(room => !building.floors.some(floor => floor.rooms.includes(room) && containsPolygon(floor.boundary, room.boundary)));
  if (outOfBounds.length > 0) {
    issues.push({
      code: 'EXTRACTION_ROOMS_OUT_OF_BOUNDS',
      severity: 'error',
      message: `${outOfBounds.length} room(s) fall outside their floor boundary.`,
    });
  }

  const isValid = issues.length === 0 && diagnostics.geometryHealthy && outOfBounds.length === 0;
  const recommendedForEditing = isValid && allRooms.some(room => room.type === 'bedroom');

  return {
    isValid,
    recommendedForEditing,
    geometryHealthy: diagnostics.geometryHealthy,
    overallScore: diagnostics.overallScore,
    verificationIssues: issues,
  };
}