/**
 * Recovery Phase 4 — adapters between the apartment manifest / deterministic
 * schematic (ai-orchestration) and the apartment hard-validation pipeline
 * (planning-engine).
 *
 * Ground truth is defined in @ai-floor-planner/ai-orchestration/apartment/adapter.
 * Re-exported here for backwards compatibility across backend services and tests.
 */

export {
  apartmentExpectationFromManifest,
  apartmentInterpretationContextFromManifest,
  schematicToApartmentStructure,
  adaptSchematicToBuilding,
  buildSteppedBuildingBoundary,
  generateWindowsForApartmentSchematic,
} from '@ai-floor-planner/ai-orchestration';
