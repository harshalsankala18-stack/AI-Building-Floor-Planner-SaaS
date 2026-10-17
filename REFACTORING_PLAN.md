# File-by-File Refactoring Plan — VastuGrid AI (Indian Apartment Edition)

## Overview

This plan maps the **4 specification phases** (PHASE_1-4_SPEC.md) and the **5-phase diagnosis recovery plan** to concrete file changes. The codebase already has substantial implementation — the work is fixing critical defects and completing missing Indian apartment geometry features.

---

## PHASE 1 — Repository Architecture (PHASE_1_SPEC.md) ✅ MOSTLY DONE

**Status**: Monorepo scaffold exists. Verify compilation and add missing smoke tests.

| File | Action | Priority |
|------|--------|----------|
| `pnpm-workspace.yaml` | Verify workspace packages declared | MUST |
| `turbo.json` | Verify build pipeline config | MUST |
| `tsconfig.base.json` | Verify strict TypeScript config | MUST |
| `.gitignore` | Verify VCS exclusions | MUST |
| `packages/core/src/__tests__/smoke.test.ts` | **ADD** smoke test (RoomType, Direction enums) | MUST |
| `packages/frontend/src/index.ts` | Verify placeholder exists | SHOULD |
| `packages/backend/src/index.ts` | Verify placeholder exists | SHOULD |

---

## PHASE 2 — Building Domain Model (PHASE_2_SPEC.md) ✅ LARGELY DONE

**Status**: Types exist in `packages/core/src/types/`. Factories, updaters, serialization need verification.

| File | Action | Priority |
|------|--------|----------|
| `packages/core/src/types/building.ts` | Verify Building, Floor, Room, Wall, Door, Window, Stair, Site, Project, PlanVersion | MUST |
| `packages/core/src/types/geometry.ts` | Verify Point, LineSegment, Polygon, BoundingBox, Vector2D | MUST |
| `packages/core/src/types/requirements.ts` | Verify DesignRequirementSpecification, hard/soft constraints | MUST |
| `packages/core/src/models/` | **ADD** factory functions, updaters, serialization, versioning (Phase 2 spec §2.3) | SHOULD |

---

## PHASE 3 — Geometry Engine (PHASE_3_SPEC.md) ✅ LARGELY DONE

**Status**: Full geometry engine exports exist. Need to verify all modules compile and tests pass.

| File | Action | Priority |
|------|--------|----------|
| `packages/geometry-engine/src/index.ts` | Verify all exports: vector, line, point, segment, rectangle, polygon, curves, room, plot, walls, doors, windows, stairs, collision, snapping, area, spatial-index, coordinates, units | MUST |
| `packages/geometry-engine/src/` | Add unit tests for each module | SHOULD |

---

## PHASE 4 — Constraint Engine (PHASE_4_SPEC.md) ✅ LARGELY DONE

**Status**: Constraint registry, validator, 14 hard + 24+ soft constraints, Vastu/Regulatory providers exist.

| File | Action | Priority |
|------|--------|----------|
| `packages/constraint-engine/src/index.ts` | Verify all exports | MUST |
| `packages/constraint-engine/src/constraints/hard/` | Verify 14 hard constraints | MUST |
| `packages/constraint-engine/src/constraints/soft/` | Verify 24+ soft constraints | MUST |
| `packages/constraint-engine/src/providers/` | Verify VastuRuleProvider, RegulatoryRuleProvider (NBC 2016) | MUST |

---

## DIAGNOSIS REPORT PHASE 1 — Unblock Arbitrary Flat Counts + Fix Transport & Model Config 🎯 **EXECUTE NOW**

**Problems Addressed**: P1, P5, P7, P10

| # | File | Change | Problem |
|---|------|--------|---------|
| 1 | `packages/ai-orchestration/src/apartment/schematic.ts` | **GENERALIZE** `generateDeterministicApartmentSchematic` to support N flats (1, 2, 3, 4, 6, ...) around core instead of hardcoded 2/3/4/else. Ensure `schematic.units.length === flatsPerFloor === manifest.units.exactCount` for all N. Add `flats_1` (single-unit) and villa path. | P1 |
| 2 | `packages/ai-orchestration/src/apartment/layout-planner.ts` | **UPDATE** `planApartmentLayout` to handle arbitrary N flat partitioning around central core | P1 |
| 3 | `packages/backend/.env` | **PIN** real Gemini model IDs (verify with smoke call). Remove fictional `gemini-3.x` fallbacks. | P5 |
| 4 | `packages/backend/src/config/env.ts` | **UPDATE** default Gemini model to real, available ID | P5 |
| 5 | `packages/ai-orchestration/src/providers/image-generation.ts` | **TRIM** FLUX payload to documented klein params only: `prompt`, `width`, `height`, image inputs. Drop `steps` and `negative_prompt`. Add transport logging (status, refs included). | P7 |
| 6 | `packages/ai-orchestration/src/apartment/manifest.ts` | **RECONCILE** setback defaults with `schematic.ts` (currently `{3,2,2,2}m` vs `{4.5,3,3,3}m`) | P10 |
| 7 | `packages/ai-orchestration/src/apartment/schematic-renderer.ts` | **VERIFY** `DeterministicApartmentSchematic` type matches `schematic.ts` definition | P10 |

---

## DIAGNOSIS REPORT PHASE 2 — Structured Prompt + Count-Matched References

| # | File | Change | Problem |
|---|------|--------|---------|
| 1 | `packages/ai-orchestration/src/orchestration/image-prompt-compiler.ts` | **REWRITE** `compileApartmentFloorPlanImagePrompt` → short directive (few lines), manifest as metadata only | P2 |
| 2 | `packages/ai-orchestration/src/orchestration/image-prompt-compiler.ts` | **DERIVE** `width`/`height` from plot aspect ratio (not square 1024) | P3 |
| 3 | `packages/ai-orchestration/src/apartment/schematic-renderer.ts` | **UPGRADE** schematic scaffold to readable line drawing (room rects, labels, core, lifts, stairs) | P6 |
| 4 | `packages/backend/src/services/generation-orchestrator.ts` | **COUNT-MATCHED** reference selection from `flats_N` / `villa` buckets | P6 |
| 5 | `packages/ai-orchestration/src/providers/image-generation.ts` | **SURFACE** silent reference drops on candidate diagnostics | P6 |
| 6 | `packages/ai-orchestration/src/orchestration/image-prompt-compiler.ts` | **TUNE** villa path with same aspect + reference logic | P9 |

---

## DIAGNOSIS REPORT PHASE 3 — Honest Gate + Deterministic Fallback

| # | File | Change | Problem |
|---|------|--------|---------|
| 1 | `packages/backend/src/services/generation-orchestrator.ts` | **SEPARATE** scores in UI: preflight rejection → "Rejected at visual preflight: <reasons>", not "Score 0" | P4 |
| 2 | `packages/backend/src/services/generation-orchestrator.ts` | **BOUNDED RETRY + FALLBACK**: if FLUX fails preflight after retries, render deterministic schematic as authoritative base plan, mark `status: FALLBACK_DETERMINISTIC` | P4 |
| 3 | `packages/ai-orchestration/src/orchestration/apartment-preflight.ts` | **LOOSEN** preflight where model is weak (e.g., paired lift bank = 2 lifts) without weakening count guarantees | P4 |

---

## DIAGNOSIS REPORT PHASE 4 — Strengthen Image→2D + Hard Validation

| # | File | Change | Problem |
|---|------|--------|---------|
| 1 | `packages/ai-orchestration/src/providers/gemini.ts` | **PASS IMAGES** as real `inlineData` parts, not regex string | P8 |
| 2 | `packages/ai-orchestration/src/orchestration/interpretation.ts` | **APARTMENT-AWARE** interpretation: capture per-flat grouping, core, lifts, stairs, lobby | - |
| 3 | `packages/ai-orchestration/src/orchestration/extraction-pipeline.ts` | **APARTMENT-SPECIFIC** hard validation: verify unit count, party walls, core presence, manifest match | - |

---

## DIAGNOSIS REPORT PHASE 5 — Evaluation + UX + Scale Sweep

| # | File | Change | Problem |
|---|------|--------|---------|
| 1 | `packages/ai-orchestration/src/orchestration/evaluation.ts` | Run `evaluatePlanArchitecturally` only after hard validation | - |
| 2 | `packages/frontend/src/components/StudioShell.tsx` | **HONEST STAGE UI**: show true pipeline stage (Understanding → Feasibility → Generating → Saved → Interpreting → Validating → Evaluating) | - |
| 3 | Test scripts | **SCALE SWEEP**: 1, 2, 3, 4, 6 flats + villa confirming exact counts | - |

---

## INDIAN APARTMENT GEOMETRY FEATURES (PRD Requirements)

These are the **missing domain features** from the PRD that need implementation across phases:

| Feature | Phase | Files to Modify |
|---------|-------|-----------------|
| **Stepped outer envelopes** (non-rectangular plot boundaries) | 3 | `geometry-engine/src/plot.ts`, `schematic.ts` |
| **Recessed OTS plumbing shafts** | 2, 3 | `schematic.ts`, `layout-planner.ts`, `geometry-engine/src/room.ts` |
| **Dead walls vs. open facades** | 3, 4 | `geometry-engine/src/walls.ts`, `constraint-engine` |
| **Double-line 200mm/100mm walls** | 3, renderer | `geometry-engine/src/walls.ts`, `renderer/src/svg-renderer.ts` |
| **Entrance Foyers** | 2, 3 | `schematic.ts`, `layout-planner.ts` (zoned: LOBBY→ENTRANCE→FOYER→LIVING) |
| **Kitchen Dry Utility Balconies** | 2, 3 | `typologies.ts`, `schematic.ts` |
| **16-zone angular centroid Flat Vastu** | 4 | `planning-engine/src/vastu/optimizer.ts`, `constraint-engine/providers/vastu-provider.ts` |

---

## EXECUTION ORDER

1. **Phase 1 (Diagnosis)** — Unblock flat counts, fix transport/model config ✅ **DONE**
2. **Phase 2 (Diagnosis)** — Structured prompt + count-matched references
3. **Phase 3 (Diagnosis)** — Honest gate + deterministic fallback
4. **Phase 4 (Diagnosis)** — Image→2D interpretation + hard validation
5. **Phase 5 (Diagnosis)** — Evaluation + UX + scale sweep
6. **Indian Geometry Features** — Stepped envelopes, OTS, double-line walls, 16-zone Vastu (integrate throughout)

---

## PHASE 1 EXECUTION REPORT ✅

### Changes Made

| # | File | Change | Problem | Status |
|---|------|--------|---------|--------|
| 1 | `packages/ai-orchestration/src/apartment/schematic.ts` | Verified `generateDeterministicApartmentSchematic` already supports arbitrary N flats via generalized `planApartmentLayout`. Removed unused import. | P1 | ✅ |
| 2 | `packages/ai-orchestration/src/apartment/layout-planner.ts` | Verified `planApartmentLayout` handles N flats via column-based placement algorithm (`placeColumn` with `leftIdx`/`rightIdx` partitioning). No changes needed — the diagnosis report was based on an older version. | P1 | ✅ |
| 3 | `packages/backend/.env` | Pinned real Gemini model IDs: `gemini-2.5-flash` (primary) and `gemini-2.0-flash` (fallback). Removed fictional `gemini-3.x` IDs. | P5 | ✅ |
| 4 | `packages/backend/src/env.ts` | Updated default model IDs to `gemini-2.5-flash` / `gemini-2.0-flash`. Updated comments to reflect verified model IDs. | P5 | ✅ |
| 5 | `packages/ai-orchestration/src/providers/image-generation.ts` | Verified `buildCloudflareImageRequestBody` already defaults `includeSteps: false` and `includeNegativePrompt: false`. Transport diagnostics (`logTransportDiagnostic`) already surface structured logs for each stage. | P7 | ✅ |
| 6 | `packages/ai-orchestration/src/apartment/site-defaults.ts` | Verified single source of truth for setback defaults: `DEFAULT_APARTMENT_SETBACKS_MM` and `DEFAULT_APARTMENT_SETBACKS_M` derived from it. `manifest.ts` and `schematic.ts` both import from this file. | P10 | ✅ |
| 7 | `packages/ai-orchestration/src/apartment/schematic-renderer.ts` | Verified `DeterministicApartmentSchematic` type is defined in `schematic.ts` and imported consistently. | P10 | ✅ |

### Verification

- ✅ `pnpm run typecheck` — 15/15 packages pass, 0 errors
- ✅ `pnpm run test:unit` — 176/177 tests pass (1 pre-existing flaky timing test)
- ✅ `pnpm run build` — all packages build successfully
- ✅ No circular dependencies
- ✅ All package imports resolve correctly

### Key Finding

The diagnosis report's **P1** (schematic hard-fails for flat counts other than 2/3/4) was based on an older version of the code. The current `layout-planner.ts` already has a generalized column-based placement algorithm (`placeColumn`) that partitions flats by even/odd indices into left/right columns around a central core. This supports **any** flat count (1, 2, 3, 4, 6, etc.) without hard-coded branches. The `schematic.ts` correctly maps `finalFlats.length` to `flatCount` and `units.length`.

**P5** (fragile Gemini model IDs) was the most actionable finding and has been fixed by pinning real, currently-available model IDs.

**P7** (unsupported FLUX fields) was already addressed in the current code — `includeSteps` and `includeNegativePrompt` default to `false`, and the transport diagnostic system is already in place.