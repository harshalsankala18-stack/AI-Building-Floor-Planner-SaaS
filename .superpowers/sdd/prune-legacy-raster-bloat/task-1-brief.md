# Prune Legacy Raster Image-Generation Bloat — Task 1

**Audit & Safe Deprecation/Removal of Legacy Raster Modules in `ai-orchestration`**

**Files:**
- Modify: `packages/ai-orchestration/src/index.ts`
- Remove / Refactor:
  - `packages/ai-orchestration/src/providers/pollinations-image.ts`
  - `packages/ai-orchestration/src/providers/gemini-image.ts`
  - `packages/ai-orchestration/src/orchestration/image-prompt-compiler.ts` (prune raster execution)
  - `packages/ai-orchestration/src/orchestration/vision-interpretation.ts`

**Constraint:** Do NOT break public barrel exports in `packages/ai-orchestration/src/index.ts`. Keep exported type signatures and lightweight no-op/deprecated wrappers.
