# HISTORICAL FOUNDATION IMPLEMENTATION SEQUENCE

This document preserves the original Phase 1–4 foundation build sequence and useful technical dependencies. Those phases describe currently implemented foundations, not the active V1 delivery roadmap. The original status, prohibitions, estimates, commands and acceptance targets below are historical, not current instructions or verified maturity claims. Day counts are not current delivery commitments.

Current delivery planning lives in [docs/ROADMAP.md](../ROADMAP.md). V1 includes coordinated multi-floor editable architectural 2D, professional exports, canonical-model-driven Blender architecture and elevations. Structural analysis/design, foundations/reinforcement, structural 3D and BOQ/costing are deferred post-V1. Canonical Building authority remains unchanged; internal tests do not establish professional approval.

---

# Implementation Order & Dependency Graph

## Status: IMPLEMENTATION-READY

This document defines the exact order in which Antigravity must implement Phases 1-4. Dependencies are strict — no phase or step may begin until its predecessors are complete and passing all acceptance criteria.

---

## 1. Dependency Graph

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  PHASE 1: Repository Architecture                                    │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ 1A. Root config (package.json, tsconfig, turbo, pnpm-workspace)│  │
│  │ 1B. Package scaffolds (core, geometry, constraint, etc.)       │  │
│  │ 1C. Vitest configuration                                      │  │
│  │ 1D. Verify: pnpm install, typecheck, test                     │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│                              ▼                                       │
│  PHASE 2: Building Domain Model                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ 2A. Constants & defaults                                       │  │
│  │ 2B. ID generation (seedable)                                   │  │
│  │ 2C. Factory functions (createBuilding, createRoom, etc.)       │  │
│  │ 2D. Immutable updaters (moveRoom, resizeRoom, etc.)            │  │
│  │ 2E. Serialization / deserialization                            │  │
│  │ 2F. Schema validation                                         │  │
│  │ 2G. Versioning (createVersion, restoreVersion, diffBuildings)  │  │
│  │ 2H. Fixture plans (JSON files)                                 │  │
│  │ 2I. All Phase 2 unit tests passing                             │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│                              ▼                                       │
│  PHASE 3: Geometry Engine                                            │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ 3A. Utilities (approxEqual, degToRad, cross2D, etc.)           │  │
│  │ 3B. Point operations                                          │  │
│  │ 3C. Segment operations                                        │  │
│  │ 3D. Polygon operations                                        │  │
│  │ 3E. Rectangle fast-path operations                            │  │
│  │ 3F. Collision detection                                       │  │
│  │ 3G. Wall generation                                           │  │
│  │ 3H. Door/window placement                                    │  │
│  │ 3I. Staircase geometry                                        │  │
│  │ 3J. Snapping & alignment                                      │  │
│  │ 3K. Area calculations & unit conversions                       │  │
│  │ 3L. All Phase 3 unit tests + integration tests passing         │  │
│  │ 3M. Performance tests passing                                 │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│                              ▼                                       │
│  PHASE 4: Constraint Engine                                          │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ 4A. Helper modules (room-queries, connectivity-graph, direction)│  │
│  │ 4B. Configuration & defaults                                  │  │
│  │ 4C. Hard constraint validators (geometry-validity)             │  │
│  │ 4D. Hard constraint validators (connectivity)                  │  │
│  │ 4E. Hard constraint validators (completeness)                  │  │
│  │ 4F. Soft scorer: proportion (geometry category)                │  │
│  │ 4G. Soft scorer: circulation (accessibility category)          │  │
│  │ 4H. Soft scorer: daylight                                     │  │
│  │ 4I. Soft scorer: privacy                                      │  │
│  │ 4J. Soft scorer: vastu                                        │  │
│  │ 4K. Soft scorer: adjacency                                    │  │
│  │ 4L. Score aggregation                                         │  │
│  │ 4M. Repair suggestion generator                               │  │
│  │ 4N. Report assembly (ConstraintEngine facade)                  │  │
│  │ 4O. All Phase 4 unit tests + integration tests passing         │  │
│  │ 4P. Performance tests passing                                 │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Step-by-Step Implementation Order

### Phase 1 (Days 1-2)

| Step | Task | Depends On | Deliverable |
|------|------|-----------|-------------|
| 1A | Create root config files | — | package.json, turbo.json, tsconfig.base.json, pnpm-workspace.yaml, .gitignore |
| 1B | Create all package scaffolds | 1A | Per-package package.json, tsconfig.json, src/index.ts |
| 1C | Configure Vitest | 1B | vitest.workspace.ts, per-package vitest.config.ts |
| 1D | Verify build pipeline | 1C | `pnpm install`, `pnpm typecheck`, `pnpm test` all pass |

**Exit Gate:** `pnpm install && pnpm typecheck && pnpm test` succeeds.

---

### Phase 2 (Days 3-7)

| Step | Task | Depends On | Deliverable |
|------|------|-----------|-------------|
| 2A | Implement constants.ts | 1D | DEFAULTS, TOLERANCES, MINIMUM_ROOM_AREAS, MINIMUM_DIMENSIONS |
| 2B | Implement id.ts | 1D | generateId(), setIdSeed(), resetIdGenerator() |
| 2C | Implement factory.ts | 2A, 2B | createBuilding, createFloor, createRoom, createWall, createDoor, createWindow, createStair, createColumn, createSite |
| 2D | Implement updaters.ts | 2C | moveRoom, resizeRoom, addRoom, removeRoom, moveDoor, moveWindow, updateEntity |
| 2E | Implement serialization.ts | 2C | serializeBuilding, deserializeBuilding, cloneBuilding |
| 2F | Implement validation.ts | 2C | validateBuildingSchema, validateRoomSchema, isValidBuilding |
| 2G | Implement versioning.ts | 2E | createVersion, restoreVersion, diffBuildings |
| 2H | Create fixture plans | 2C, 2F | 9 JSON files in tests/fixtures/ |
| 2I | Write and pass all unit tests | 2C-2H | factory.test.ts, updaters.test.ts, serialization.test.ts, validation.test.ts, versioning.test.ts, fixtures.test.ts |

**Exit Gate:** `pnpm test --filter=@ai-floor-planner/core` passes. Coverage ≥ 90%.

---

### Phase 3 (Days 8-16)

| Step | Task | Depends On | Deliverable |
|------|------|-----------|-------------|
| 3A | Implement utils.ts | 2I | approxEqual, clamp, degToRad, radToDeg, cross2D, dot2D, normalizeAngle, lerp |
| 3B | Implement point.ts | 3A | distance, midpoint, rotatePoint, translatePoint, pointOnSegment, pointInPolygon, pointsEqual, angleBetweenPoints |
| 3C | Implement segment.ts | 3A, 3B | segmentLength, segmentAngle, segmentIntersection, pointToSegmentDistance, offsetSegment, segmentsParallel, segmentsCollinear, collinearOverlap |
| 3D | Implement polygon.ts | 3A, 3B, 3C | signedPolygonArea, polygonArea, polygonPerimeter, polygonCentroid, polygonBoundingBox, isConvex, isValidPolygon, offsetPolygon, containsPolygon, polygonsOverlap, polygonIntersectionArea, polygonsAdjacent, sharedEdge, polygonEdges, isSelfIntersecting |
| 3E | Implement rectangle.ts | 3D | createRect, createBoundingBox, rectsOverlap, rectContains, rectsAdjacent, snapRectToGrid, rectOverlapArea, boundingBoxToPolygon, polygonToBoundingBox |
| 3F | Implement collision.ts | 3D, 3E | detectRoomCollisions, detectFloorCollisions, detectBoundaryViolation, boundaryViolationArea, broadPhaseCollision |
| 3G | Implement walls.ts | 3C, 3D | generateWalls, mergeCollinearWalls, splitWallAtPoint, generateExternalWalls, findSharedWall |
| 3H | Implement openings.ts | 3B, 3C, 3D | canPlaceDoor, doorSwingArc, isDoorSwingClear, canPlaceWindow, validDoorPositions, validWindowPositions |
| 3I | Implement staircase.ts | 3E | computeStairGeometry, validateStairDimensions, computeRiserCount |
| 3J | Implement snapping.ts | 3B, 3E | snapToGrid, snapToWallEndpoint, findAlignmentGuides, snapRoomToAlignment |
| 3K | Implement area.ts | 3D | carpetArea, builtUpArea, totalBuildingArea, floorCoverageRatio, computeArea, sqMmToSqM, sqMmToSqFt, mmToFeet, feetToMm |
| 3L | Write and pass all unit tests | 3A-3K | point.test.ts through area.test.ts |
| 3M | Write and pass performance + integration tests | 3L | geometry-pipeline.test.ts, performance assertions |

**Exit Gate:** `pnpm test --filter=@ai-floor-planner/geometry-engine` passes. Coverage ≥ 95%. Performance targets met.

---

### Phase 4 (Days 17-24)

| Step | Task | Depends On | Deliverable |
|------|------|-----------|-------------|
| 4A | Implement helpers | 3M | room-queries.ts, connectivity-graph.ts, direction.ts |
| 4B | Implement config.ts | 2I | ResolvedConstraintConfig, resolveConfig, DEFAULT_WEIGHTS |
| 4C | Implement hard/geometry-validity.ts | 3M, 4A | HC-001, HC-002, HC-003, HC-004, HC-005, HC-006 |
| 4D | Implement hard/connectivity.ts | 3M, 4A | HC-010, HC-011, HC-012, HC-013, HC-014 |
| 4E | Implement hard/completeness.ts | 3M, 4A, 4B | HC-020, HC-021, HC-022, HC-023 |
| 4F | Implement soft/proportion.ts | 3M, 4B | Proportion scorer (geometry category) |
| 4G | Implement soft/circulation.ts | 3M, 4A, 4B | Circulation scorer (accessibility category) |
| 4H | Implement soft/daylight.ts | 3M, 4A, 4B | Daylight scorer |
| 4I | Implement soft/privacy.ts | 3M, 4A, 4B | Privacy scorer |
| 4J | Implement soft/vastu.ts | 3M, 4A, 4B | Vastu scorer |
| 4K | Implement soft/adjacency.ts | 3M, 4A, 4B | Adjacency scorer |
| 4L | Implement score aggregation | 4F-4K | computeCategoryScore, computeOverallScore |
| 4M | Implement repair suggestions | 4C-4E | generateRepairSuggestions |
| 4N | Implement ConstraintEngine facade | 4C-4M | engine.ts: validate(), score(), checkValidity() |
| 4O | Write and pass all unit tests | 4C-4N | All test files in __tests__/ |
| 4P | Write and pass performance + integration tests | 4O | constraint-pipeline.test.ts, performance test |

**Exit Gate:** `pnpm test --filter=@ai-floor-planner/constraint-engine` passes. Coverage ≥ 90%. Performance < 50ms. All fixture plans validate correctly.

---

## 3. Package Dependency Resolution Order

When building (`pnpm build`), packages compile in this order:

```
1. @ai-floor-planner/core              (zero deps)
2. @ai-floor-planner/geometry-engine   (deps: core)
3. @ai-floor-planner/constraint-engine (deps: core, geometry-engine)
4. @ai-floor-planner/ai-orchestration  (deps: core) — stub only in Phases 1-4
5. @ai-floor-planner/planning-engine   (deps: core, geometry, constraint) — stub only
6. @ai-floor-planner/renderer          (deps: core, geometry) — stub only
7. @ai-floor-planner/backend           (deps: all) — stub only
8. @ai-floor-planner/frontend          — stub only
```

---

## 4. Cross-Phase Dependencies

```
Phase 1 ──────► Phase 2 ──────► Phase 3 ──────► Phase 4
(scaffold)      (types+model)   (geometry)      (constraints)
                     │                │                │
                     │                │                │
                     └────────────────┼────────────────┘
                                      │
                              All use core types
                              from Phase 2
```

- Phase 2 establishes the Building type and fixtures.
- Phase 3 uses core types (Point, Polygon, Room, Floor) but NOT factory/updater functions.
- Phase 4 uses both geometry functions AND core types/fixtures.

---

## 5. Verification Protocol

After EACH phase completes, run:

```bash
pnpm install
pnpm run typecheck
pnpm run test
pnpm run build
```

ALL FOUR commands must succeed with zero errors before proceeding to the next phase.

---

## 6. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Geometry edge cases discovered late | Phase 3 has extensive edge-case tests; fix before Phase 4 |
| Fixture plans don't cover all constraint cases | Create targeted fixture plans during Phase 4 if needed |
| Performance regression in Phase 4 | Phase 4 has explicit 50ms performance test |
| Type incompatibilities between packages | Phase 1 establishes shared tsconfig; Phase 2 establishes shared types |
| Circular dependency accidentally introduced | Turborepo build would fail; dependency graph is strictly hierarchical |

---

## 7. What NOT to Build in Phases 1-4

The following MUST NOT be implemented:

- Frontend/UI components
- Backend HTTP API
- Database schema or migrations
- AI provider integrations
- SVG rendering
- Authentication or billing
- Planning/candidate generation algorithms
- WebSocket communication
- Export functionality

These packages MAY have placeholder `index.ts` files with empty exports, but NO implementation code.

---

## 8. Summary Timeline

```
Day  1-2:   Phase 1 — Repository scaffold
Day  3-7:   Phase 2 — Domain model + fixtures
Day  8-16:  Phase 3 — Geometry engine (largest phase)
Day  17-24: Phase 4 — Constraint engine

Total: ~24 working days for Phases 1-4
```

After Phase 4 completion, the system has:
- A complete, validated domain model
- A deterministic geometry computation layer
- A working validation and scoring pipeline
- Comprehensive test coverage
- 9+ fixture plans for integration testing

This forms the rock-solid foundation for Phases 5+ (rendering, editor, planning, AI).
