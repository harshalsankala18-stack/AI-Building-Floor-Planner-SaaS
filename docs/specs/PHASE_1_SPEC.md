# Phase 1 — Repository Architecture: Implementation Specification

## Status: IMPLEMENTATION-READY

This specification defines the complete repository scaffold. An implementation agent MUST produce all listed files with exact contents conforming to the contracts below.

---

## 1. Objectives

| ID | Objective | Priority |
|----|-----------|----------|
| P1-OBJ-1 | Establish pnpm monorepo with Turborepo orchestration | MUST |
| P1-OBJ-2 | Configure strict TypeScript compilation for all packages | MUST |
| P1-OBJ-3 | Define package dependency graph with workspace references | MUST |
| P1-OBJ-4 | Configure Vitest as the test runner across all packages | MUST |
| P1-OBJ-5 | Establish ESLint + Prettier for code consistency | SHOULD |
| P1-OBJ-6 | Create .gitignore and editor configuration | MUST |
| P1-OBJ-7 | Initialize git repository | SHOULD |

---

## 2. Files and Modules

### 2.1 Root Configuration Files

| File | Purpose | Priority |
|------|---------|----------|
| `package.json` | Workspace root, scripts, devDependencies | MUST |
| `pnpm-workspace.yaml` | Declares workspace packages | MUST |
| `turbo.json` | Build pipeline configuration | MUST |
| `tsconfig.base.json` | Shared TypeScript compiler options | MUST |
| `.gitignore` | VCS exclusions | MUST |
| `.prettierrc` | Code formatting rules | SHOULD |
| `.eslintrc.cjs` | Linting rules | SHOULD |
| `vitest.workspace.ts` | Vitest workspace config | MUST |

### 2.2 Package Directory Structure

```
packages/
├── core/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── src/
│       ├── index.ts
│       ├── types/
│       │   ├── index.ts
│       │   ├── geometry.ts
│       │   ├── enums.ts
│       │   ├── building.ts
│       │   ├── requirements.ts
│       │   ├── constraints.ts
│       │   ├── ai.ts
│       │   └── rendering.ts
│       └── models/
│           └── (Phase 2)
├── geometry-engine/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── src/
│       └── index.ts
├── constraint-engine/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── src/
│       └── index.ts
├── planning-engine/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── src/
│       └── index.ts
├── ai-orchestration/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── src/
│       └── index.ts
├── renderer/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── src/
│       └── index.ts
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── src/
│       ├── index.ts
│       ├── api/
│       ├── services/
│       └── db/
└── frontend/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── components/
        ├── stores/
        └── views/
```

### 2.3 Test Directory

```
tests/
├── fixtures/
│   └── (Phase 2 — JSON fixture files)
├── unit/
│   └── (empty, per-package tests preferred)
└── integration/
    └── (Phase 4+)
```

---

## 3. Dependency Graph (Packages)

```
core (zero dependencies)
  ↑
  ├── geometry-engine (depends: core)
  │     ↑
  │     ├── constraint-engine (depends: core, geometry-engine)
  │     │     ↑
  │     │     └── planning-engine (depends: core, geometry-engine, constraint-engine)
  │     │
  │     └── renderer (depends: core, geometry-engine)
  │
  └── ai-orchestration (depends: core)
        ↑
        └── backend (depends: core, geometry-engine, constraint-engine,
                     planning-engine, ai-orchestration, renderer)
```

---

## 4. Configuration Contracts

### 4.1 Root package.json

```jsonc
{
  "name": "ai-floor-planner",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@9.7.0",
  "engines": { "node": ">=20.0.0" },
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "test:unit": "turbo run test:unit",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "clean": "turbo run clean",
    "format": "prettier --write \"packages/*/src/**/*.ts\""
  },
  "devDependencies": {
    "turbo": "^2.0.14",
    "typescript": "^5.5.4",
    "vitest": "^2.0.5",
    "eslint": "^9.9.0",
    "prettier": "^3.3.3",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0"
  }
}
```

### 4.2 tsconfig.base.json

MUST include:
- `"strict": true`
- `"target": "ES2022"`
- `"module": "ESNext"`
- `"moduleResolution": "bundler"`
- `"declaration": true`
- `"declarationMap": true`
- `"sourceMap": true`
- `"composite": true`
- `"noUncheckedIndexedAccess": true`
- `"isolatedModules": true`

MUST NOT include:
- `"exactOptionalPropertyTypes": true` (causes issues with JSONB deserialization)

### 4.3 Per-Package package.json Pattern

Every package MUST:
- Use `@ai-floor-planner/<name>` scoping
- Have `"private": true`
- Declare `"main": "./dist/index.js"` and `"types": "./dist/index.d.ts"`
- Use `"workspace:*"` for internal dependencies
- Include scripts: `build`, `dev`, `test`, `test:unit`, `typecheck`, `lint`, `clean`

### 4.4 Per-Package tsconfig.json Pattern

Every package MUST:
- Extend `../../tsconfig.base.json`
- Set `outDir` to `./dist`
- Set `rootDir` to `./src`
- Declare `references` to dependency packages

### 4.5 turbo.json

```jsonc
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "test": { "dependsOn": ["build"], "outputs": ["coverage/**"] },
    "test:unit": { "dependsOn": ["build"], "outputs": ["coverage/**"] },
    "lint": { "dependsOn": ["^build"] },
    "typecheck": { "dependsOn": ["^build"] },
    "clean": { "cache": false }
  }
}
```

### 4.6 vitest.workspace.ts

```typescript
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/*/vitest.config.ts',
]);
```

### 4.7 Per-Package vitest.config.ts Pattern

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

---

## 5. Invariants

| ID | Invariant | Priority |
|----|-----------|----------|
| P1-INV-1 | `pnpm install` MUST succeed with zero errors | MUST |
| P1-INV-2 | `pnpm run typecheck` MUST produce zero type errors | MUST |
| P1-INV-3 | `pnpm run build` MUST produce `dist/` in every package | MUST |
| P1-INV-4 | `pnpm run test` MUST execute (even if no tests exist yet) | MUST |
| P1-INV-5 | Circular package dependencies MUST NOT exist | MUST |
| P1-INV-6 | Every package `src/index.ts` MUST exist (may be empty placeholder) | MUST |

---

## 6. Error Handling

Phase 1 has no runtime error handling. The requirement is:
- TypeScript compilation errors MUST be resolved before phase completion.
- Any `pnpm install` resolution failure MUST be fixed.

---

## 7. Unit Tests

Phase 1 MUST include at minimum one smoke test in `packages/core`:

```typescript
// packages/core/src/__tests__/smoke.test.ts
import { describe, it, expect } from 'vitest';
import { RoomType, Direction } from '../types';

describe('Core package smoke test', () => {
  it('exports RoomType enum', () => {
    expect(RoomType.Bedroom).toBe('bedroom');
    expect(RoomType.Kitchen).toBe('kitchen');
  });

  it('exports Direction enum', () => {
    expect(Direction.North).toBe('north');
  });
});
```

---

## 8. Integration Tests

No integration tests in Phase 1.

---

## 9. Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|-------------|
| P1-AC-1 | `pnpm install` completes without error | Run command |
| P1-AC-2 | `pnpm run typecheck` reports 0 errors | Run command |
| P1-AC-3 | `pnpm run build` produces dist/ in all packages | Check filesystem |
| P1-AC-4 | `pnpm run test` passes all tests (including smoke test) | Run command |
| P1-AC-5 | Package imports resolve correctly (core imported by geometry-engine, etc.) | TypeScript compilation |
| P1-AC-6 | No circular dependencies between packages | Turborepo build order |

---

## 10. Implementation Notes for Antigravity

1. The `packages/core/src/types/` files already exist with complete type definitions. Do NOT recreate them. Verify they compile.
2. The `packages/frontend/` and `packages/backend/` packages are stubs in this phase. Create placeholder `index.ts` files with empty exports.
3. If PowerShell execution policy blocks `npx`/`pnpm`, run: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`
4. Use pnpm 9.x. Do NOT use npm or yarn.
5. The `.prettierrc` SHOULD use: `{ "singleQuote": true, "trailingComma": "all", "printWidth": 100, "semi": true }`
