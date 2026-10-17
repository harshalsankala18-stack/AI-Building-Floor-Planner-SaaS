# Prune Legacy Raster Image-Generation Bloat — Task 2

**Ensure Clean Additive Pipeline for Indian Apartments (`adapter.ts` & `layout-planner.ts`) & Finalize Backend Orchestration**

**Files:**
- Modify: `packages/backend/src/services/generation-orchestrator.ts`
- Modify: `packages/backend/src/services/extraction-pipeline.ts`
- Modify: `packages/backend/src/index.ts`
- Fix any remaining exports in `ai-orchestration/src/index.ts` to provide proper types/stubs for barrel compatibility.

**Constraint:** Keep exported type signatures and lightweight wrappers in barrel files so monorepo packages compile successfully and pass `pnpm run typecheck && pnpm run test:unit`.
