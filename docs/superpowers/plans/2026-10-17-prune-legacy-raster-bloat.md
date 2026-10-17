# Prune Legacy Raster Image-Generation Bloat While Preserving Additive CAD Contracts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit and remove dead internal legacy raster generation bloat (Cloudflare FLUX, Pollinations, Gemini image generation, vision PNG-to-2D interpretation files and helpers) while preserving all public barrel exports, type signatures, and the deterministic stepped-polygon Indian apartment solver pipeline (`adapter.ts`, `layout-planner.ts`, `schematic.ts`, `polygon-layout.ts`, `generation-orchestrator.ts`).

**Architecture:** We will systematically remove unused raster generation files and internal execution paths from `packages/ai-orchestration` and `packages/backend`, keeping lightweight deprecated wrappers or exports in barrel files (`packages/ai-orchestration/src/index.ts` and `packages/backend/src/index.ts`) so external consumers and tests do not break. We will verify additive apartment CAD domain compliance (`steppedPolygon` $\ge 6$ vertices, `otsShafts` $1200\text{mm} \times 1500\text{mm}$, `balconies`, 3-tier Indian rooms) via test suites and typechecking.

**Tech Stack:** TypeScript, Node.js, Vitest, Turborepo, pnpm.

**Spec:** `docs/specs/PHASE_1_SPEC.md` and user instructions.

## Global Constraints

- **Zero Breaking Public API Changes:** Maintain all public barrel exports in `packages/ai-orchestration/src/index.ts` and `packages/backend/src/index.ts` (using deprecated/stub wrappers if needed).
- **Preserve Additive CAD Contracts:** `steppedPolygon` ($\ge 6$ CCW orthogonal vertices), `otsShafts` ($1200\text{mm} \times 1500\text{mm}$ cutouts excluded from RERA carpet), `balconies` ($1200\text{mm}\text{–}1500\text{mm}$ cantilevered sit-out decks on `openFacades`), `corridorSide`, `openFacades`, and `deadWalls`, and 3-Tier Indian rooms.
- **Verification Gate:** `pnpm run typecheck` and `pnpm run test:unit` must pass cleanly across all packages in the monorepo.

---

## Task 1: Audit & Safe Deprecation/Removal of Legacy Raster Modules in `ai-orchestration`

**Files:**
- Modify: `packages/ai-orchestration/src/index.ts`
- Remove / Refactor:
  - `packages/ai-orchestration/src/providers/pollinations-image.ts` (or keep export stub)
  - `packages/ai-orchestration/src/providers/gemini-image.ts` (or keep export stub)
  - `packages/ai-orchestration/src/orchestration/image-prompt-compiler.ts` (keep compileApartmentFloorPlanImagePrompt / compileFloorPlanImagePrompt for prompts if referenced by tests, but remove raster execution dependencies)
  - `packages/ai-orchestration/src/orchestration/vision-interpretation.ts` (keep export stub / types)

**Interfaces:**
- Consumes: Existing public type definitions.
- Produces: Cleaned internal modules without active runtime dependency on FLUX/Pollinations image generation execution loops, while keeping public exports intact.

- [ ] **Step 1: Check test suite before refactoring**
Run: `pnpm run test:unit`
Expected: All tests pass.

- [ ] **Step 2: Clean up dead internal raster generation execution code while preserving public exports**
Examine `packages/ai-orchestration/src/index.ts` and ensure all exported functions (`compileFloorPlanImagePrompt`, `compileApartmentFloorPlanImagePrompt`, `PollinationsImageProvider`, `GeminiImageProvider`, `interpretPlanImageWithGemini`, etc.) remain exported with safe stub implementations or pass-through types so external code and tests do not break.

- [ ] **Step 3: Run typecheck**
Run: `pnpm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add packages/ai-orchestration/
git commit -m "refactor(ai-orchestration): prune legacy raster image execution bloat while preserving public barrel exports"
```

---

## Task 2: Prune Backend Raster Execution & Streamline `generation-orchestrator.ts`

**Files:**
- Modify: `packages/backend/src/services/generation-orchestrator.ts`
- Modify: `packages/backend/src/services/extraction-pipeline.ts`
- Modify: `packages/backend/src/index.ts`

**Interfaces:**
- Consumes: `@ai-floor-planner/ai-orchestration` (CAD adapters, schematic planner).
- Produces: Cleaned `GenerationOrchestrator` service that executes the deterministic CAD-first workflow cleanly without dead Cloudflare FLUX execution paths.

- [ ] **Step 1: Update `generation-orchestrator.ts` to fully default and prioritize `deterministicCadFirst` for apartment generation**
Ensure `GenerationOrchestrator` relies on `generateDeterministicApartmentSchematic` -> `planApartmentLayout` -> `adaptSchematicToBuilding` as the primary canonical execution path for Indian apartments, removing dead raster fallback loops while retaining backward-compatible response types.

- [ ] **Step 2: Run typecheck**
Run: `pnpm run typecheck`
Expected: PASS

- [ ] **Step 3: Run unit tests**
Run: `pnpm run test:unit`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add packages/backend/
git commit -m "refactor(backend): streamline generation-orchestrator to run deterministic CAD pipeline cleanly"
```

---

## Task 3: Verify Additive Indian Apartment CAD Contracts & Final Verification Gate

**Files:**
- Verify: `packages/ai-orchestration/src/apartment/polygon-layout.ts`
- Verify: `packages/ai-orchestration/src/apartment/layout-planner.ts`
- Verify: `packages/ai-orchestration/src/apartment/schematic.ts`
- Verify: `packages/ai-orchestration/src/apartment/adapter.ts`
- Verify: `packages/backend/src/__tests__/cad-first-pipeline.test.ts`

**Interfaces:**
- Consumes: Additive domain functions (`steppedPolygon`, `otsShafts`, `balconies`, `corridorSide`, `openFacades`, `deadWalls`, 3-Tier rooms).
- Produces: Verified passing test suite across all packages.

- [ ] **Step 1: Run full monorepo typecheck and unit tests**
Run: `pnpm run typecheck && pnpm run test:unit`
Expected: 100% PASS across all 9 packages.

- [ ] **Step 2: Commit any final verification adjustments**
```bash
git add .
git commit -m "test(phase1): verify deterministic CAD-first apartment solver and additive domain contracts"
```
