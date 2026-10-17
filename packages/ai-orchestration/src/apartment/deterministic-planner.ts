/**
 * Deterministic Architectural Apartment Planner (Authoritative Ground Truth Engine).
 *
 * Implements the authoritative architectural pipeline:
 *
 * AiDesignSpec / Structured Input
 *     ↓
 * Planning Program (Typology Allocation + Manifest)
 *     ↓
 * Deterministic Apartment Layout (Zoned Geometry: Core → Lobby → Flats → Rooms → Balconies → Doors)
 *     ↓
 * Canonical Building Model (via core factories)
 *     ↓
 * Hard Geometry Validation (Stages 1–5 + Recount on Canonical Model)
 *     ↓
 * Structural Rendering Input (Provider-independent, 1536–2048px resolution ready)
 *
 * CORE PRINCIPLE:
 * AI reasoning decides WHAT the building contains.
 * The deterministic planner decides WHERE everything goes.
 * The deterministic model is authoritative; generated images are never authoritative.
 * Pure geometry, no randomness: same input + strategy + seed ⇒ byte-identical result.
 */

import {
  type Building,
  type DesignRequirementSpecification,
  Direction,
} from '@ai-floor-planner/core';
import {
  type ApartmentPlanValidationResult,
  runApartmentPlanValidation,
} from '@ai-floor-planner/planning-engine';
import {
  type ApartmentLayoutStrategy,
} from './layout-planner';
import {
  type DeterministicApartmentSchematic,
  generateDeterministicApartmentSchematic,
} from './schematic';
import {
  type ApartmentGenerationManifest,
  buildApartmentGenerationManifest,
  validateSchematicMatchesManifest,
} from './manifest';
import {
  type ApartmentJurisdiction,
  type ApartmentRulesProfile,
  getApartmentRulesProfile,
} from './jurisdiction';
import {
  apartmentExpectationFromManifest,
  buildExtractionSite,
  schematicToApartmentStructure,
} from './adapter';
import {
  type StructuralPlanRepresentation,
  createStructuralPlanRepresentation,
} from './structural-representation';
import { DEFAULT_APARTMENT_SETBACKS_MM } from './site-defaults';
import type { ApartmentFloorType } from './floor-configuration';

// ─── Input & Output Contracts ────────────────────────────────────────────────

export interface DeterministicPlannerSiteInput {
  readonly plotWidthMm: number;
  readonly plotDepthMm: number;
  readonly setbacksMm?: {
    readonly front: number;
    readonly rear: number;
    readonly left: number;
    readonly right: number;
  };
  readonly roadFacing?: string | Direction;
  readonly orientationDegrees?: number;
}

export interface DeterministicPlannerUnitMixItem {
  readonly unitType: string;
  readonly count: number;
  readonly carpetAreaSqFt?: number;
  readonly carpetAreaSqM?: number;
}

export interface DeterministicPlannerCoreInput {
  readonly passengerLifts?: number;
  readonly serviceLifts?: number;
  readonly staircaseCount?: number;
  readonly commonLobby?: boolean;
}

export interface DeterministicPlannerInput {
  readonly site: DeterministicPlannerSiteInput;
  readonly flatsPerFloor: number;
  readonly unitMix: readonly DeterministicPlannerUnitMixItem[];
  readonly commonCore?: DeterministicPlannerCoreInput;
  readonly strategy?: ApartmentLayoutStrategy;
  readonly seed?: number;
  readonly rulesProfile?: ApartmentRulesProfile;
  readonly jurisdiction?: string;
  readonly floorType?: ApartmentFloorType;
  readonly floorCount?: number;
  readonly projectId?: string;
  readonly projectName?: string;
  /** Optional AiDesignSpec when driving planning directly from parsed user intent */
  readonly designSpec?: DesignRequirementSpecification;
}

export interface PlannerDiagnostics {
  readonly status: 'SUCCESS' | 'FEASIBILITY_FAIL' | 'VALIDATION_FAIL';
  readonly strategy: ApartmentLayoutStrategy;
  readonly seed: number;
  readonly buildingEnvelope: {
    readonly widthM: number;
    readonly heightM: number;
    readonly areaSqM: number;
  };
  readonly flatCount: {
    readonly requested: number;
    readonly planned: number;
  };
  readonly unitMix: {
    readonly requested: readonly string[];
    readonly planned: readonly string[];
    readonly matches: boolean;
  };
  readonly coreCount: {
    readonly liftsRequested: number;
    readonly liftsPlanned: number;
    readonly stairsRequested: number;
    readonly stairsPlanned: number;
    readonly lobbyPlanned: boolean;
  };
  readonly roomCountsPerFlat: readonly {
    readonly flatId: string;
    readonly flatLabel: string;
    readonly unitType: string;
    readonly bedrooms: number;
    readonly bathrooms: number;
    readonly livingDining: number;
    readonly kitchens: number;
    readonly utilities: number;
    readonly balconies: number;
  }[];
  readonly areaPerFlat: readonly {
    readonly flatId: string;
    readonly flatLabel: string;
    readonly targetCarpetSqM: number;
    readonly actualCarpetSqM: number;
    readonly deviationPct: number;
    readonly status: 'OK' | 'WARN' | 'FAIL';
  }[];
  readonly violations: {
    readonly adjacencyViolations: readonly string[];
    readonly containmentViolations: readonly string[];
    readonly overlapViolations: readonly string[];
    readonly entryCirculationViolations: readonly string[];
  };
  readonly issues: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly summaryText: string;
}

export interface DeterministicPlannerOutput {
  readonly success: boolean;
  readonly status: 'SUCCESS' | 'FEASIBILITY_FAIL' | 'VALIDATION_FAIL';
  readonly strategy: ApartmentLayoutStrategy;
  readonly seed: number;
  readonly schematic: DeterministicApartmentSchematic;
  readonly manifest: ApartmentGenerationManifest;
  readonly canonicalBuilding: Building | null;
  readonly validationResult: ApartmentPlanValidationResult;
  readonly structuralRepresentation: StructuralPlanRepresentation;
  readonly diagnostics: PlannerDiagnostics;
  readonly reasonCodes: readonly string[];
}

// ─── Diagnostics Formatter ───────────────────────────────────────────────────

export function formatPlannerDiagnostics(diagnostics: PlannerDiagnostics): string {
  const lines: string[] = [
    '================ DETERMINISTIC ARCHITECTURAL PLANNER DIAGNOSTICS ================',
    `STATUS: ${diagnostics.status} | STRATEGY: ${diagnostics.strategy.toUpperCase()} | SEED: ${diagnostics.seed}`,
    `ENVELOPE: ${diagnostics.buildingEnvelope.widthM}m x ${diagnostics.buildingEnvelope.heightM}m (${diagnostics.buildingEnvelope.areaSqM} m²)`,
    `FLATS: Requested ${diagnostics.flatCount.requested}, Planned ${diagnostics.flatCount.planned} (${diagnostics.unitMix.matches ? 'MATCH' : 'MISMATCH'})`,
    `CORE: Lifts ${diagnostics.coreCount.liftsPlanned}/${diagnostics.coreCount.liftsRequested}, Stairs ${diagnostics.coreCount.stairsPlanned}/${diagnostics.coreCount.stairsRequested}, Common Lobby: ${diagnostics.coreCount.lobbyPlanned ? 'YES' : 'NO'}`,
    '',
    'UNIT BREAKDOWN:',
  ];

  for (const u of diagnostics.roomCountsPerFlat) {
    const area = diagnostics.areaPerFlat.find(a => a.flatId === u.flatId);
    lines.push(
      `  - ${u.flatLabel} (${u.unitType}): ${u.bedrooms} Bed, ${u.bathrooms} Bath, ${u.livingDining} Living/Dining, ${u.kitchens} Kitchen, ${u.utilities} Utility, ${u.balconies} Balcony | ` +
      `Area: ${area?.actualCarpetSqM ?? 0}m² (Target: ${area?.targetCarpetSqM ?? 0}m², Dev: ${area?.deviationPct ?? 0}%, Status: ${area?.status ?? 'UNKNOWN'})`,
    );
  }

  const v = diagnostics.violations;
  const totalViolations =
    v.adjacencyViolations.length +
    v.containmentViolations.length +
    v.overlapViolations.length +
    v.entryCirculationViolations.length;

  lines.push('', `VIOLATIONS (Total: ${totalViolations}):`);
  if (v.entryCirculationViolations.length > 0) {
    lines.push(`  * Entry/Circulation (${v.entryCirculationViolations.length}):`);
    v.entryCirculationViolations.forEach(m => lines.push(`      - ${m}`));
  }
  if (v.adjacencyViolations.length > 0) {
    lines.push(`  * Adjacency (${v.adjacencyViolations.length}):`);
    v.adjacencyViolations.forEach(m => lines.push(`      - ${m}`));
  }
  if (v.containmentViolations.length > 0) {
    lines.push(`  * Containment (${v.containmentViolations.length}):`);
    v.containmentViolations.forEach(m => lines.push(`      - ${m}`));
  }
  if (v.overlapViolations.length > 0) {
    lines.push(`  * Overlap (${v.overlapViolations.length}):`);
    v.overlapViolations.forEach(m => lines.push(`      - ${m}`));
  }

  if (diagnostics.reasonCodes.length > 0) {
    lines.push('', `REASON CODES: ${diagnostics.reasonCodes.join(', ')}`);
  }

  lines.push('================================================================================');
  return lines.join('\n');
}

// ─── Authoritative Planning Pipeline ─────────────────────────────────────────

/**
 * Plans a complete, architecturally coherent apartment floor plate deterministically.
 * This is the AUTHORITATIVE source of geometry and room schedule before any image model is involved.
 */
export function planDeterministicApartment(input: DeterministicPlannerInput): DeterministicPlannerOutput {
  const seed = input.seed ?? 42;
  const strategy = input.strategy ?? 'balanced';
  const projectId = input.projectId ?? 'proj_apt';
  const projectName = input.projectName ?? 'Architectural Apartment Project';
  const floorType = input.floorType ?? 'typical';
  const floorCount = input.floorCount ?? 4;

  const setbacks = input.site.setbacksMm ?? DEFAULT_APARTMENT_SETBACKS_MM;
  const siteWidthM = Number((input.site.plotWidthMm / 1000).toFixed(3));
  const siteDepthM = Number((input.site.plotDepthMm / 1000).toFixed(3));
  const setbacksM = {
    front: Number((setbacks.front / 1000).toFixed(3)),
    rear: Number((setbacks.rear / 1000).toFixed(3)),
    left: Number((setbacks.left / 1000).toFixed(3)),
    right: Number((setbacks.right / 1000).toFixed(3)),
  };

  // 1. Resolve Rules Profile
  const jurisdictionName = (input.jurisdiction ?? input.designSpec?.siteContext?.jurisdiction ?? 'pune_pmc') as ApartmentJurisdiction;
  const rulesProfile = input.rulesProfile ?? getApartmentRulesProfile(jurisdictionName, {
    floorCount,
    buildingHeightM: floorCount * 3.1,
    tenementsPerFloor: input.flatsPerFloor,
  });

  // 2. Build Authoritative Manifest
  const manifest = buildApartmentGenerationManifest({
    site: {
      plotWidthMm: input.site.plotWidthMm,
      plotDepthMm: input.site.plotDepthMm,
      setbacksMm: setbacks,
      roadFacing: input.site.roadFacing ? String(input.site.roadFacing).toLowerCase() : 'north',
      orientationDegrees: input.site.orientationDegrees ?? 0,
    },
    apartmentConfig: {
      projectType: 'apartment',
      jurisdiction: jurisdictionName,
      floorCount,
      flatsPerFloor: input.flatsPerFloor,
      unitMix: input.unitMix.map(u => ({
        unitType: u.unitType,
        count: u.count,
        carpetAreaSqFt: u.carpetAreaSqFt,
        carpetAreaSqM: u.carpetAreaSqM,
      })),
      commonCore: {
        passengerLifts: input.commonCore?.passengerLifts ?? rulesProfile.liftRequirements.minPassengerLifts,
        serviceLifts: input.commonCore?.serviceLifts ?? 0,
        staircaseCount: input.commonCore?.staircaseCount ?? (rulesProfile.stairRequirements.secondStaircaseRequired ? 2 : 1),
        fireStaircaseRequired: rulesProfile.stairRequirements.secondStaircaseRequired,
        commonLobby: input.commonCore?.commonLobby ?? true,
      },
      parking: {
        residentParkingCount: input.flatsPerFloor,
        visitorParkingCount: 1,
      },
      amenities: { groundSiteAmenities: [], buildingAmenities: [] },
      floorStrategy: floorType,
    },
    rulesProfile,
  });

  // 3. Generate Deterministic Schematic (authoritative geometric layout)
  const schematic = generateDeterministicApartmentSchematic({
    siteWidthM,
    siteDepthM,
    setbacksM,
    flatsPerFloor: input.flatsPerFloor,
    unitMix: input.unitMix,
    commonCoreConfig: {
      passengerLifts: manifest.commonCore.lifts,
      staircaseCount: manifest.commonCore.stairs,
      commonLobby: manifest.commonCore.commonLobby,
    },
    floorType,
    rulesProfile,
    strategy,
    seed,
  });

  // 4. Validate Schematic Matches Manifest (§8, §18)
  const manifestMatch = validateSchematicMatchesManifest(schematic, manifest);

  const isFeasibilityFail = !schematic.layoutFits || manifestMatch.feasibilityFail;

  let validationResult: ApartmentPlanValidationResult;

  if (isFeasibilityFail) {
    validationResult = {
      status: 'REJECTED',
      source: 'DETERMINISTIC_SCHEMATIC',
      building: null,
      stages: {
        completeness: 'FAIL',
        manifestMatch: 'FAIL',
        structural: 'SKIPPED',
        canonicalGeometry: 'SKIPPED',
        geometryValidation: 'SKIPPED',
      },
      counts: {
        flats: schematic.flatCount,
        unitTypes: schematic.units.map(u => u.unitType),
        lifts: schematic.core.lifts.length,
        stairs: schematic.core.stairs.length,
        lobbies: schematic.core.lobby ? 1 : 0,
        bedroomsByFlat: {},
      },
      validation: {
        isValid: false,
        recommendedForEditing: false,
        geometryHealthy: false,
        overallScore: 0,
        verificationIssues: [
          ...schematic.layoutIssues.map(msg => ({
            code: 'SITE_INSUFFICIENT_FOR_PROGRAM',
            message: msg,
            severity: 'error' as const,
          })),
          ...manifestMatch.discrepancies.map(msg => ({
            code: 'MANIFEST_DISCREPANCY',
            message: msg,
            severity: 'error' as const,
          })),
        ],
      },
      diagnostics: [
        ...schematic.layoutIssues.map(msg => ({
          code: 'SITE_INSUFFICIENT_FOR_PROGRAM',
          message: msg,
          severity: 'error' as const,
        })),
        ...manifestMatch.discrepancies.map(msg => ({
          code: 'MANIFEST_DISCREPANCY',
          message: msg,
          severity: 'error' as const,
        })),
      ],
    };
  } else {
    // 5. Convert to ApartmentPlanStructure and Build Canonical Building Model
    const structure = schematicToApartmentStructure(schematic);
    const expectation = apartmentExpectationFromManifest(manifest);
    const extractionSite = buildExtractionSite({
      plotWidthMm: input.site.plotWidthMm,
      plotDepthMm: input.site.plotDepthMm,
      setbacksMm: setbacks,
      roadFacing: input.site.roadFacing,
      orientationDegrees: input.site.orientationDegrees,
    });

    validationResult = runApartmentPlanValidation({
      structure,
      expectation,
      site: extractionSite,
      projectId,
      projectName,
    });
  }

  // 6. Generate Standardized Structural Representation for Future High-Res Renderer
  const structuralRepresentation = createStructuralPlanRepresentation(schematic);

  // 7. Extract Violations and Diagnostics
  const adjacencyViolations: string[] = [];
  const containmentViolations: string[] = [];
  const overlapViolations: string[] = [];
  const entryCirculationViolations: string[] = [];
  const reasonCodes = new Set<string>();

  for (const check of schematic.spatialChecks) {
    if (check.status === 'FAIL') {
      reasonCodes.add(check.code);
      if (['FLAT_ENTRANCE_SINGLE', 'ENTRANCE_TO_FOYER', 'LOBBY_NOT_INTO_PRIVATE', 'LOBBY_SERVES_ALL_FLATS', 'BEDROOM_ACCESS', 'ALL_ROOMS_REACHABLE'].includes(check.code)) {
        entryCirculationViolations.push(check.message);
      } else if (['FOYER_TO_LIVING', 'DINING_KITCHEN', 'KITCHEN_UTILITY', 'MASTER_ENSUITE', 'BEDROOM_ENSUITE'].includes(check.code)) {
        adjacencyViolations.push(check.message);
      } else if (['ROOMS_INSIDE_FLAT'].includes(check.code)) {
        containmentViolations.push(check.message);
      } else if (['NO_OVERLAPS', 'FLATS_SEPARATED'].includes(check.code)) {
        overlapViolations.push(check.message);
      }
    }
  }

  if (manifestMatch.discrepancies.length > 0) {
    reasonCodes.add('MANIFEST_DISCREPANCY');
  }

  for (const diag of validationResult.diagnostics) {
    if (diag.severity === 'error') {
      reasonCodes.add(diag.code);
      if (diag.code.includes('CONTAINMENT') || diag.code.includes('OUT_OF_BOUNDS') || diag.code.includes('OUTSIDE')) {
        containmentViolations.push(diag.message);
      } else if (diag.code.includes('COLLISION') || diag.code.includes('OVERLAP') || diag.code.includes('SEPARATED')) {
        overlapViolations.push(diag.message);
      } else if (diag.code.includes('LOBBY') || diag.code.includes('ENTRANCE') || diag.code.includes('CIRCULATION')) {
        entryCirculationViolations.push(diag.message);
      }
    }
  }

  const allIssues = [
    ...schematic.layoutIssues,
    ...manifestMatch.discrepancies,
    ...validationResult.diagnostics.filter(d => d.severity === 'error').map(d => d.message),
  ];

  // Determine overall status
  let status: 'SUCCESS' | 'FEASIBILITY_FAIL' | 'VALIDATION_FAIL' = 'SUCCESS';
  if (!schematic.layoutFits || manifestMatch.feasibilityFail) {
    status = 'FEASIBILITY_FAIL';
    reasonCodes.add('PLANNER_FEASIBILITY_FAIL');
  } else if (!manifestMatch.matches || validationResult.status === 'REJECTED' || reasonCodes.size > 0) {
    status = 'VALIDATION_FAIL';
    reasonCodes.add('PLANNER_VALIDATION_FAIL');
  }

  // Room counts and area breakdown per flat
  const roomCountsPerFlat = schematic.units.map(u => {
    const spaces = [...u.rooms, ...u.balconies];
    return {
      flatId: u.flatId,
      flatLabel: u.flatLabel,
      unitType: u.unitType,
      bedrooms: spaces.filter(r => r.type === 'bedroom' || r.type === 'master_bedroom').length,
      bathrooms: spaces.filter(r => r.type === 'master_toilet' || r.type === 'common_toilet' || r.type === 'powder_room').length,
      livingDining: spaces.filter(r => r.type === 'living_dining' || r.type === 'living').length,
      kitchens: spaces.filter(r => r.type === 'kitchen').length,
      utilities: spaces.filter(r => r.type === 'utility').length,
      balconies: spaces.filter(r => r.type === 'balcony').length,
    };
  });

  const areaPerFlat = schematic.areaReport.units.map(r => ({
    flatId: r.flatId,
    flatLabel: r.flatLabel,
    targetCarpetSqM: r.targetCarpetSqM,
    actualCarpetSqM: r.actualCarpetSqM,
    deviationPct: r.deviationPct,
    status: r.status,
  }));

  const requestedUnitTypes = manifest.units.units.map(u => u.type.toUpperCase());
  const plannedUnitTypes = schematic.units.map(u => u.unitType.toUpperCase());
  const unitMixMatches =
    requestedUnitTypes.length === plannedUnitTypes.length &&
    requestedUnitTypes.every((t, i) => t === plannedUnitTypes[i]);

  const diagnostics: PlannerDiagnostics = {
    status,
    strategy,
    seed,
    buildingEnvelope: {
      widthM: schematic.buildingFootprint.width,
      heightM: schematic.buildingFootprint.height,
      areaSqM: Number((schematic.buildingFootprint.width * schematic.buildingFootprint.height).toFixed(2)),
    },
    flatCount: {
      requested: manifest.units.exactCount,
      planned: schematic.flatCount,
    },
    unitMix: {
      requested: requestedUnitTypes,
      planned: plannedUnitTypes,
      matches: unitMixMatches,
    },
    coreCount: {
      liftsRequested: manifest.commonCore.lifts,
      liftsPlanned: schematic.core.lifts.length,
      stairsRequested: manifest.commonCore.stairs,
      stairsPlanned: schematic.core.stairs.length,
      lobbyPlanned: schematic.core.lobby !== undefined,
    },
    roomCountsPerFlat,
    areaPerFlat,
    violations: {
      adjacencyViolations,
      containmentViolations,
      overlapViolations,
      entryCirculationViolations,
    },
    issues: allIssues,
    reasonCodes: [...reasonCodes],
    summaryText: '',
  };

  const fullDiagnostics: PlannerDiagnostics = {
    ...diagnostics,
    summaryText: formatPlannerDiagnostics(diagnostics),
  };

  return {
    success: status === 'SUCCESS',
    status,
    strategy,
    seed,
    schematic,
    manifest,
    canonicalBuilding: validationResult.building,
    validationResult,
    structuralRepresentation,
    diagnostics: fullDiagnostics,
    reasonCodes: [...reasonCodes],
  };
}
