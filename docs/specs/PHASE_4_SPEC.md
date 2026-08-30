# Phase 4 — Constraint Engine: Definitive Implementation Specification

## Status: IMPLEMENTATION-READY (FOR ANTIGRAVITY)

---

## Preamble

The Geometry Engine answers: **"Is this geometry mathematically valid?"**

The Constraint Engine answers: **"Does this building arrangement satisfy architectural rules?"**

These systems are separate. The Constraint Engine CONSUMES geometry-engine functions but MUST NOT reimplement geometry. The Constraint Engine MUST NOT call any LLM or AI service.

This specification supersedes `docs/specs/PHASE_4_SPEC.md` from the earlier planning phase. It reflects the actual codebase state after Phase 3 completion and defines the full formal architecture that Antigravity must implement.

---

## 1. Constraint Abstraction

Every constraint in the system is a first-class object conforming to a formal interface.

### 1.1 Constraint Definition

```typescript
/**
 * A constraint is a named, self-describing rule that can evaluate a Building.
 */
export interface Constraint {
  /** Unique stable identifier. Format: "HC-001", "SC-ADJ-001", etc. */
  readonly id: string;

  /** Human-readable name. */
  readonly name: string;

  /** Full description of what this constraint checks. */
  readonly description: string;

  /** Category this constraint belongs to. */
  readonly category: ConstraintCategory;

  /** Severity level. */
  readonly severity: ConstraintSeverity;

  /** Whether this constraint is currently enabled. */
  readonly enabled: boolean;

  /** Evaluate the constraint against a building. */
  evaluate(context: EvaluationContext): ConstraintResult;
}
```

### 1.2 Severity Levels

```typescript
export enum ConstraintSeverity {
  /** Plan is INVALID if violated. Cannot be overridden by score. */
  HARD = 'hard',

  /** Reduces plan quality score. Plan remains valid. */
  SOFT = 'soft',

  /** Informational flag. Small score impact. */
  WARNING = 'warning',

  /** Pure information. No score impact. */
  INFORMATIONAL = 'informational',
}
```

**Rule:** A plan with ANY `HARD` violation is invalid. No amount of SOFT compliance overrides this.

### 1.3 Constraint Categories

```typescript
export enum ConstraintCategory {
  GEOMETRY = 'geometry',
  PROGRAM = 'program',
  ACCESSIBILITY = 'accessibility',
  CIRCULATION = 'circulation',
  DAYLIGHT = 'daylight',
  PRIVACY = 'privacy',
  FUNCTIONAL_ZONING = 'functional_zoning',
  STRUCTURAL = 'structural',
  VASTU = 'vastu',
  REGULATORY = 'regulatory',
  USER_PREFERENCE = 'user_preference',
}
```

MUST implement: GEOMETRY, PROGRAM, ACCESSIBILITY, DAYLIGHT, PRIVACY.

SHOULD implement: CIRCULATION, VASTU.

MAY defer: FUNCTIONAL_ZONING, STRUCTURAL, REGULATORY, USER_PREFERENCE.

The architecture MUST support all categories even if some have no providers yet.

### 1.4 Evaluation Context

```typescript
/**
 * Context passed to every constraint evaluator.
 * Contains the building plus precomputed data to avoid redundant geometry.
 */
export interface EvaluationContext {
  /** The building being evaluated. MUST NOT be mutated. */
  readonly building: Building;

  /** Precomputed building envelope (plot minus setbacks). */
  readonly buildableEnvelope: Polygon;

  /** Precomputed spatial index for rooms (for O(1) adjacency lookup). */
  readonly spatialIndex: ISpatialIndex;

  /** User preferences / configuration. */
  readonly config: ResolvedConstraintConfig;

  /** Optional: required room types from user requirements. */
  readonly requiredRoomTypes?: RoomType[];

  /** Optional: user adjacency preferences. */
  readonly userPreferences?: UserConstraintPreference[];
}
```

### 1.5 Constraint Result

```typescript
/**
 * The result of evaluating a single constraint.
 */
export interface ConstraintResult {
  /** The constraint ID that produced this result. */
  readonly constraintId: string;

  /** Did the constraint pass? */
  readonly passed: boolean;

  /** Severity of this constraint. */
  readonly severity: ConstraintSeverity;

  /** Normalized score contribution (0-100). Only relevant for SOFT/WARNING. */
  readonly score: number;

  /** Maximum possible score for this constraint. */
  readonly maxScore: number;

  /** Human-readable explanation of the result. */
  readonly message: string;

  /** Entity IDs affected by this result. */
  readonly affectedEntities: readonly string[];

  /** Detailed explanation suitable for user display. */
  readonly explanation: string;

  /** Optional repair suggestions. */
  readonly suggestedFixes?: readonly SuggestedFix[];
}
```

### 1.6 Suggested Fix

```typescript
/**
 * A repair suggestion attached to a constraint result.
 * Describes WHAT to do, not HOW to execute it.
 */
export interface SuggestedFix {
  /** Human-readable description of the fix. */
  readonly description: string;

  /** Structured action type (for future automatic repair). */
  readonly actionType: 'move' | 'resize' | 'add' | 'remove' | 'reorient';

  /** Target entity ID (if applicable). */
  readonly targetEntity?: string;

  /** Estimated parameters for the fix (e.g., { dx: 500, dy: 0 }). */
  readonly parameters?: Record<string, unknown>;

  /** Priority: 1 = most impactful. */
  readonly priority: number;
}
```

---

## 2. Constraint Registry

### 2.1 Interface

```typescript
/**
 * Central registry that holds all constraints.
 * Allows runtime registration, filtering, and iteration.
 */
export interface ConstraintRegistry {
  /** Register a constraint. Throws if ID already exists. */
  register(constraint: Constraint): void;

  /** Register multiple constraints at once. */
  registerAll(constraints: Constraint[]): void;

  /** Get a constraint by ID. Returns undefined if not found. */
  get(id: string): Constraint | undefined;

  /** Get all constraints. */
  getAll(): readonly Constraint[];

  /** Get constraints filtered by category. */
  getByCategory(category: ConstraintCategory): readonly Constraint[];

  /** Get constraints filtered by severity. */
  getBySeverity(severity: ConstraintSeverity): readonly Constraint[];

  /** Enable/disable a constraint by ID. */
  setEnabled(id: string, enabled: boolean): void;

  /** Remove a constraint by ID. */
  unregister(id: string): void;

  /** Check if a constraint is registered. */
  has(id: string): boolean;

  /** Total number of registered constraints. */
  readonly size: number;
}
```

### 2.2 Default Registry Population

The default registry MUST contain all built-in constraints. New constraints can be registered without modifying the core evaluator.

```typescript
/**
 * Create a registry pre-populated with all built-in constraints.
 */
export function createDefaultRegistry(): ConstraintRegistry;
```

---

## 3. Plan Validation (Evaluation Orchestration)

### 3.1 Validator Interface

```typescript
/**
 * The Plan Validator orchestrates constraint evaluation.
 * It runs all registered constraints and produces a ValidationSummary.
 */
export interface PlanValidator {
  /** Full validation: all enabled constraints. */
  validate(building: Building, config?: Partial<ConstraintConfig>): ValidationSummary;

  /** Validate a single constraint by ID. */
  validateOne(building: Building, constraintId: string): ConstraintResult;

  /** Quick validity check: only HARD constraints. */
  isValid(building: Building): boolean;

  /** Score only: only SOFT/WARNING constraints. */
  score(building: Building, config?: Partial<ConstraintConfig>): PlanScore;

  /** Get the constraint registry. */
  readonly registry: ConstraintRegistry;
}
```

### 3.2 Validation Summary

```typescript
/**
 * Complete result of plan-level evaluation.
 */
export interface ValidationSummary {
  /** Is the plan valid? (all HARD constraints pass) */
  readonly isValid: boolean;

  /** Overall quality score (0-100). */
  readonly overallScore: number;

  /** Score breakdown by category. */
  readonly categoryScores: Record<ConstraintCategory, CategoryScore>;

  /** Total number of constraints evaluated. */
  readonly totalConstraints: number;

  /** Number that passed. */
  readonly passed: number;

  /** Number that failed (HARD). */
  readonly failed: number;

  /** Number of warnings. */
  readonly warnings: number;

  /** All individual results. */
  readonly results: readonly ConstraintResult[];

  /** Only the violations (failed results). */
  readonly violations: readonly ConstraintResult[];

  /** Aggregated repair suggestions, sorted by priority. */
  readonly suggestions: readonly SuggestedFix[];

  /** Timestamp of evaluation. */
  readonly timestamp: string;

  /** Evaluation duration in milliseconds. */
  readonly durationMs: number;
}
```

### 3.3 Evaluation Pipeline

```
Building + Config
       │
       ▼
┌─────────────────────────┐
│  Build EvaluationContext │  (compute envelope, spatial index, etc.)
└─────────────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Registry.getAll()      │  (enabled constraints only)
└─────────────────────────┘
       │
       ├──── HARD constraints first (fail-fast if desired)
       │
       ├──── SOFT constraints
       │
       ├──── WARNING constraints
       │
       └──── INFORMATIONAL constraints
       │
       ▼
┌─────────────────────────┐
│  Aggregate Results       │  (compute scores, validity, suggestions)
└─────────────────────────┘
       │
       ▼
  ValidationSummary
```

MUST: HARD constraints run first.
MUST: All SOFT constraints run regardless of HARD results (for diagnostic scoring).
MUST: A single HARD failure makes `isValid = false`.
MUST: The building is NEVER mutated.
MUST: Evaluation is deterministic (same input → same output).
SHOULD: Support an option to short-circuit after first HARD failure (for performance during candidate generation).

---

## 4. Hard Constraints — Full Catalog

### 4.1 Plot Containment

| ID | Name | Description |
|----|------|-------------|
| HC-001 | RoomContainment | Every room boundary MUST be fully inside its floor boundary |
| HC-002 | FloorContainment | Every floor boundary MUST be inside plot minus setbacks |

### 4.2 Room Overlap

| ID | Name | Description |
|----|------|-------------|
| HC-003 | NoIllegalOverlap | No two rooms on the same floor may overlap beyond tolerance (100 sq mm) |

### 4.3 Valid Geometry

| ID | Name | Description |
|----|------|-------------|
| HC-004 | ValidPolygons | All room/floor/site boundaries MUST be valid closed polygons |
| HC-005 | PositiveArea | All rooms MUST have area > 0 |
| HC-006 | WallIntegrity | All walls MUST have length > 0 and thickness > 0 |

### 4.4 Required Rooms

| ID | Name | Description |
|----|------|-------------|
| HC-020 | RequiredRoomsPresent | All user-required room types MUST exist in the building |

### 4.5 Accessibility

| ID | Name | Description |
|----|------|-------------|
| HC-010 | RoomAccessibility | Every room MUST be reachable from the entrance via doors (when doors exist) |
| HC-013 | CorridorWidth | Every corridor MUST have minimum dimension ≥ configured `minimumCorridorWidth` |

### 4.6 Door Validity

| ID | Name | Description |
|----|------|-------------|
| HC-011 | DoorOnWall | Every door MUST reference an existing wall ID |
| HC-012 | DoorClearance | Door swing arc MUST NOT intersect other walls (SHOULD — may be WARNING) |

### 4.7 Window Validity

| ID | Name | Description |
|----|------|-------------|
| HC-015 | WindowOnWall | Every window MUST reference an existing wall ID |

### 4.8 Stair Validity

| ID | Name | Description |
|----|------|-------------|
| HC-014 | StairConnectivity | Stair `connectsFloors` MUST reference two existing consecutive floor levels |
| HC-016 | StairDimensions | Stair width MUST meet minimum (900mm), risers MUST be ≤ 200mm height |

### 4.9 Floor Consistency

| ID | Name | Description |
|----|------|-------------|
| HC-030 | FloorRoomConsistency | Every room's `floorId` MUST match the floor it's listed in |

### 4.10 Minimum Room Size

| ID | Name | Description |
|----|------|-------------|
| HC-023 | MinimumRoomSize | Every room MUST meet minimum area AND minimum dimension for its type |

---

## 5. Soft Constraints — Full Catalog

### 5.1 Adjacency (Category: ACCESSIBILITY)

| ID | Name | Points | Condition |
|----|------|--------|-----------|
| SC-ADJ-001 | KitchenDining | 20 | Kitchen adjacent to dining |
| SC-ADJ-002 | DiningLiving | 15 | Dining adjacent to living |
| SC-ADJ-003 | MasterBathroom | 20 | Master bedroom adjacent to a bathroom |
| SC-ADJ-004 | UtilityKitchen | 10 | Utility adjacent to kitchen |
| SC-ADJ-005 | ParkingEntrance | 10 | Parking adjacent to entrance zone |
| SC-ADJ-006 | PoojaAccess | 5 | Pooja room accessible from living |

### 5.2 Circulation (Category: CIRCULATION)

| ID | Name | Points | Condition |
|----|------|--------|-----------|
| SC-CIR-001 | CorridorRatio | 30 | Corridor area ≤ 15% of total floor area |
| SC-CIR-002 | NoDeadEnds | 15 | No dead-end corridors |
| SC-CIR-003 | DirectAccess | 15 | Direct access where appropriate (kitchen↔dining) |
| SC-CIR-004 | PathLength | 20 | Entrance to all rooms in ≤ 3 transitions |

### 5.3 Natural Light (Category: DAYLIGHT)

| ID | Name | Points | Condition |
|----|------|--------|-----------|
| SC-DAY-001 | BedroomExternal | 20 per bedroom | Bedroom has external wall |
| SC-DAY-002 | LivingExternal | 25 | Living room has external wall |
| SC-DAY-003 | KitchenExternal | 15 | Kitchen has external wall |
| SC-DAY-004 | WindowOrientation | 5 per window | Window faces E or S |
| SC-DAY-005 | AllHabitableLight | 10 bonus | Every habitable room has daylight |

### 5.4 Privacy (Category: PRIVACY)

| ID | Name | Points | Condition |
|----|------|--------|-----------|
| SC-PRI-001 | BedroomSeparation | 15 per bedroom | Bedrooms not adjacent to foyer/entrance |
| SC-PRI-002 | MasterIsolation | 20 | Master bedroom isolated from public zone |
| SC-PRI-003 | BathroomVisibility | 15 | Bathroom doors not facing living areas |
| SC-PRI-004 | GuestSeparation | 10 | Guest bedroom separated from family bedrooms |

### 5.5 Functional Zoning (Category: FUNCTIONAL_ZONING)

| ID | Name | Points | Condition |
|----|------|--------|-----------|
| SC-ZON-001 | PublicPrivateSep | 25 | Public zone (living, dining, foyer) separated from private zone (bedrooms) |
| SC-ZON-002 | ServiceZone | 15 | Service rooms (kitchen, utility) grouped together |
| SC-ZON-003 | NightDaySep | 15 | Night-use rooms (bedrooms) separated from day-use rooms |

### 5.6 Geometry / Proportion (Category: GEOMETRY)

| ID | Name | Points | Condition |
|----|------|--------|-----------|
| SC-GEO-001 | AspectRatio | 10 per room | Aspect ratio ≤ 2:1 (full), ≤3:1 (partial), >3:1 (zero) |
| SC-GEO-002 | RoomSizeRange | 10 per room | Area within configured min/max for type |
| SC-GEO-003 | DimensionBalance | 15 | Bedroom sizes within 20% stdev of mean |

### 5.7 Structural (Category: STRUCTURAL — warning only)

| ID | Name | Severity | Condition |
|----|------|----------|-----------|
| SC-STR-001 | WallAlignment | WARNING | Walls on different floors align vertically |
| SC-STR-002 | ColumnGrid | INFORMATIONAL | Columns form a regular grid pattern |

---

## 6. Scoring Architecture

### 6.1 Score Computation

Each SOFT constraint produces a `score` (0 to `maxScore`). Scores are aggregated per category:

```typescript
function computeCategoryScore(
  results: ConstraintResult[],
  category: ConstraintCategory,
  weight: number,
): CategoryScore {
  const categoryResults = results.filter(r =>
    r.severity !== 'hard' && /* get category from constraint */
  );

  const totalEarned = sum(categoryResults.map(r => r.score));
  const totalPossible = sum(categoryResults.map(r => r.maxScore));

  const normalized = totalPossible > 0
    ? Math.round((totalEarned / totalPossible) * 100)
    : 100;

  return {
    category: category,
    score: clamp(normalized, 0, 100),
    maxScore: 100,
    weight,
    details: categoryResults.map(toScoreDetail),
  };
}
```

### 6.2 Overall Score

```typescript
overallScore = round(
  sum(categoryScore[i] * weight[i]) / sum(weight[i])
)
```

MUST: Range [0, 100].
MUST: Integer (rounded).
MUST: If Vastu is disabled, its weight is 0 and excluded from denominator.

### 6.3 Score ≠ Approval

The score represents computational design quality. It does NOT represent:
- Structural engineering approval
- Building code compliance
- Construction feasibility
- Legal regulatory conformance

This MUST be stated in the ValidationSummary or any user-facing display.

---

## 7. Human-Readable Explanations

### 7.1 Message Format Requirements

Bad:
```
"Constraint HC-003 failed."
```

Good:
```
"Bedroom 2 overlaps the Dining Room by approximately 1.2 sq ft (overlap area: 111,484 sq mm)."
```

MUST include:
- Affected entity name (not just ID)
- Specific reason (not generic)
- Quantified violation where applicable (how much overlap, how far outside, etc.)

### 7.2 Explanation Field

The `explanation` field in ConstraintResult provides a longer, user-friendly description:

```
"The boundary of 'Bedroom 2' intersects with the boundary of 'Dining Room'. 
The overlapping region has an area of approximately 1.2 sq ft. 
To fix this, move one of the rooms so their boundaries do not overlap."
```

MUST: Use room names, not IDs.
MUST: Provide measurement context (sq ft or sq m based on user preference, with mm in details).
SHOULD: Suggest a direction of fix.

---

## 8. Repair Suggestions (Architecture Only)

### 8.1 Design

The repair system is an ABSTRACTION for future automatic repair. Phase 4 produces suggestions as data. Phase 7+ may implement automatic application.

```typescript
export interface SuggestedFix {
  description: string;                   // "Move Bedroom 2 east by 600mm"
  actionType: 'move' | 'resize' | 'add' | 'remove' | 'reorient';
  targetEntity?: string;                 // entity ID
  parameters?: Record<string, unknown>;  // { dx: 600, dy: 0 }
  priority: number;                      // 1 = most impactful
}
```

### 8.2 Phase 4 Scope

MUST: Generate `SuggestedFix` objects for hard constraint violations.
MUST: Include human-readable description.
SHOULD: Include `parameters` with estimated values where computable.
MAY: Include suggestions for soft constraint improvements.
MUST NOT: Implement automatic application of fixes.

---

## 9. Vastu Rule Provider

### 9.1 Architecture

Vastu is NOT hard-coded into the core evaluator. It is a **rule provider** that registers constraints into the registry.

```typescript
/**
 * Rule provider interface. Providers produce constraints.
 * Different providers can supply different rule sets.
 */
export interface RuleProvider {
  /** Unique provider name. */
  readonly name: string;

  /** Produce constraints to register. */
  getConstraints(config: ResolvedConstraintConfig): Constraint[];
}

/**
 * Vastu-specific rule provider.
 */
export interface VastuRuleProvider extends RuleProvider {
  readonly name: 'vastu';

  /** Get Vastu constraints based on strictness level. */
  getConstraints(config: ResolvedConstraintConfig): Constraint[];
}
```

### 9.2 Vastu Configuration

```typescript
interface VastuConfig {
  enabled: boolean;
  strictness: 'strict' | 'moderate' | 'flexible';
  // 'strict': full points only for exact quadrant match
  // 'moderate': partial credit for adjacent quadrant
  // 'flexible': partial credit for correct half
}
```

### 9.3 Vastu Rules (Soft)

| Rule | Preferred Position | Score |
|------|-------------------|-------|
| Kitchen | SE quadrant | 15 |
| Master Bedroom | SW quadrant | 15 |
| Pooja Room | NE quadrant | 15 |
| Living Room | N or NE | 10 |
| Bathroom | NW or W | 10 |
| Entrance | Facing N or E | 15 |
| Staircase | SW, S, or W | 10 |
| Toilet NOT in NE | Not NE | 10 |

### 9.4 Direction Computation

Quadrant determination MUST account for `building.site.orientation`:
- `orientation = 0` → North is up (negative Y)
- `orientation = 90` → North is left (negative X)

```typescript
function getQuadrant(
  roomCentroid: Point,
  floorBoundingBox: BoundingBox,
  orientation: number,
): 'NE' | 'NW' | 'SE' | 'SW';
```

The current implementation uses a simpler `roomInCorner` function. The new implementation SHOULD use proper centroid-based quadrant determination with orientation awareness.

---

## 10. Regulatory Rule Provider (Architecture Only)

### 10.1 Design

```typescript
export interface RegulatoryRuleProvider extends RuleProvider {
  readonly name: string;
  readonly jurisdiction: string;   // e.g., "India/Maharashtra/Pune"
  readonly version: string;        // rule set version

  getConstraints(config: ResolvedConstraintConfig): Constraint[];
}
```

### 10.2 Phase 4 Scope

MUST: Define the `RegulatoryRuleProvider` interface.
MUST NOT: Implement any specific jurisdiction rules.
MAY: Provide a stub/example provider with no rules.

---

## 11. User Preference Constraints

### 11.1 Structured Preference

```typescript
/**
 * A user preference expressed as a structured constraint input.
 * The AI layer converts natural language into these structures.
 * Raw natural language MUST NOT enter the constraint engine directly.
 */
export interface UserConstraintPreference {
  /** Preference type. */
  readonly type: 'adjacency' | 'separation' | 'orientation' | 'size' | 'position';

  /** Source room type or ID. */
  readonly subject: RoomType | string;

  /** Target room type or ID (for adjacency/separation). */
  readonly target?: RoomType | string;

  /** Preference strength. */
  readonly strength: 'required' | 'preferred' | 'avoid';

  /** Score weight for this preference. */
  readonly weight?: number;
}
```

### 11.2 Example

User says: "Keep kitchen close to dining."

AI layer converts to:
```json
{
  "type": "adjacency",
  "subject": "kitchen",
  "target": "dining",
  "strength": "preferred",
  "weight": 1.0
}
```

The constraint engine evaluates this as a SOFT constraint using `polygonsAdjacent`.

---

## 12. Performance Requirements

| Requirement | Target | Priority |
|-------------|--------|----------|
| Full validation (20 rooms, all constraints) | < 50ms | MUST |
| HARD-only validation (fast validity check) | < 10ms | MUST |
| Single constraint evaluation | < 2ms | MUST |
| No geometry recomputation | Use precomputed context | MUST |
| No LLM/AI calls | — | MUST |
| Deterministic output | Same input → same output | MUST |
| Allow selective evaluation | By category or constraint ID | SHOULD |
| Spatial index for adjacency | O(n) or better for lookups | SHOULD |

### 12.1 Performance Strategies

- Build `EvaluationContext` ONCE per validation call (spatial index, envelope, etc.)
- Constraints receive precomputed context, not raw building
- Use geometry-engine's `GridSpatialIndex` for room adjacency lookups
- HARD constraints short-circuit option for candidate generation

---

## 13. File Structure

```
packages/constraint-engine/src/
├── index.ts                          — barrel export
├── types.ts                          — all types defined in this spec
├── registry.ts                       — ConstraintRegistry implementation
├── validator.ts                      — PlanValidator implementation
├── context.ts                        — EvaluationContext builder
├── scoring.ts                        — score aggregation and normalization
├── config.ts                         — default config, weight tables, resolveConfig
├── constraints/
│   ├── index.ts                      — registers all built-in constraints
│   ├── hard/
│   │   ├── plot-containment.ts       — HC-001, HC-002
│   │   ├── room-overlap.ts           — HC-003
│   │   ├── geometry-validity.ts      — HC-004, HC-005, HC-006
│   │   ├── required-rooms.ts         — HC-020
│   │   ├── accessibility.ts          — HC-010, HC-013
│   │   ├── door-validity.ts          — HC-011, HC-012
│   │   ├── window-validity.ts        — HC-015
│   │   ├── stair-validity.ts         — HC-014, HC-016
│   │   ├── floor-consistency.ts      — HC-030
│   │   └── minimum-size.ts           — HC-023
│   └── soft/
│       ├── adjacency.ts              — SC-ADJ-*
│       ├── circulation.ts            — SC-CIR-*
│       ├── daylight.ts               — SC-DAY-*
│       ├── privacy.ts                — SC-PRI-*
│       ├── zoning.ts                 — SC-ZON-*
│       ├── geometry-proportion.ts    — SC-GEO-*
│       └── structural.ts            — SC-STR-* (warning/info only)
├── providers/
│   ├── index.ts                      — provider exports
│   ├── types.ts                      — RuleProvider interface
│   ├── vastu-provider.ts             — VastuRuleProvider
│   └── regulatory-provider.ts        — RegulatoryRuleProvider (stub)
├── helpers/
│   ├── room-queries.ts               — room lookup utilities
│   ├── zone-classification.ts        — public/private/service zone logic
│   ├── direction.ts                  — quadrant/compass computation
│   └── connectivity.ts               — door-based reachability graph
├── __tests__/
│   ├── registry.test.ts
│   ├── validator.test.ts
│   ├── context.test.ts
│   ├── scoring.test.ts
│   ├── hard/
│   │   ├── plot-containment.test.ts
│   │   ├── room-overlap.test.ts
│   │   ├── geometry-validity.test.ts
│   │   ├── required-rooms.test.ts
│   │   ├── accessibility.test.ts
│   │   ├── door-validity.test.ts
│   │   ├── window-validity.test.ts
│   │   ├── stair-validity.test.ts
│   │   └── minimum-size.test.ts
│   ├── soft/
│   │   ├── adjacency.test.ts
│   │   ├── circulation.test.ts
│   │   ├── daylight.test.ts
│   │   ├── privacy.test.ts
│   │   ├── zoning.test.ts
│   │   └── geometry-proportion.test.ts
│   ├── providers/
│   │   └── vastu-provider.test.ts
│   ├── helpers/
│   │   ├── zone-classification.test.ts
│   │   └── direction.test.ts
│   └── performance.test.ts
└── compat.ts                         — backward-compatible exports (existing API)
```

---

## 14. Dependency Graph

```
@ai-floor-planner/core (types, constants, enums)
       │
       ├────────────────────────────────┐
       │                                │
       ▼                                ▼
@ai-floor-planner/geometry-engine   constraint-engine/types.ts
  (polygon ops, collision,               │
   spatial index, adjacency)             │
       │                                │
       └────────────────┬───────────────┘
                        │
                        ▼
              constraint-engine/context.ts
                        │
                        ▼
              constraint-engine/constraints/* (individual evaluators)
                        │
                        ▼
              constraint-engine/registry.ts
                        │
                        ▼
              constraint-engine/scoring.ts
                        │
                        ▼
              constraint-engine/validator.ts
                        │
                        ▼
              constraint-engine/index.ts (public API)
```

---

## 15. Implementation Sequence

| Step | Module | Depends On | Priority |
|------|--------|-----------|----------|
| 1 | `types.ts` | core types | MUST |
| 2 | `config.ts` | types | MUST |
| 3 | `registry.ts` | types | MUST |
| 4 | `context.ts` | types, geometry-engine | MUST |
| 5 | `helpers/*` | core, geometry-engine | MUST |
| 6 | `constraints/hard/*` | types, context, helpers, geometry-engine | MUST |
| 7 | `constraints/soft/*` | types, context, helpers, geometry-engine | MUST |
| 8 | `providers/vastu-provider.ts` | types, constraints/soft | SHOULD |
| 9 | `providers/regulatory-provider.ts` | types (stub only) | MAY |
| 10 | `scoring.ts` | types, config | MUST |
| 11 | `validator.ts` | registry, context, scoring | MUST |
| 12 | `constraints/index.ts` | all constraints, providers | MUST |
| 13 | `compat.ts` | validator (wraps new API to old `validate()` signature) | MUST |
| 14 | `index.ts` | all | MUST |
| 15 | Tests | all | MUST |

---

## 16. Test Fixtures Required

### 16.1 Valid Plans (must pass all HARD constraints)

| Fixture | Purpose |
|---------|---------|
| `30x50-2bhk.json` | Standard 2BHK (exists) |
| `30x50-3bhk.json` | Multi-room adjacency testing |
| `minimal-1room.json` | Minimal edge case (exists) |

### 16.2 Invalid Plans (must FAIL hard constraints)

| Fixture | Violation | Hard Constraint |
|---------|-----------|-----------------|
| `invalid-overlap.json` | Two rooms overlap (exists) | HC-003 |
| `invalid-outside-boundary.json` | Room extends outside floor | HC-001 |
| `invalid-missing-room.json` | Required room type absent | HC-020 |
| `invalid-door-no-wall.json` | Door references non-existent wall | HC-011 |
| `invalid-window-no-wall.json` | Window references non-existent wall | HC-015 |
| `invalid-stair-no-floor.json` | Stair connects to non-existent floor | HC-014 |

### 16.3 Quality-Variant Plans (valid but varying quality)

| Fixture | Quality Issue | Affected Scorer |
|---------|-------------|-----------------|
| `quality-poor-circulation.json` | Corridor > 20% of floor area | SC-CIR-001 |
| `quality-poor-daylight.json` | Interior rooms with no external walls | SC-DAY-001 |
| `quality-poor-privacy.json` | Bedroom adjacent to entrance | SC-PRI-001 |
| `quality-vastu-good.json` | All Vastu rules satisfied | SC-VASTU-* |
| `quality-vastu-bad.json` | All Vastu rules violated | SC-VASTU-* |

---

## 17. Unit Tests

### 17.1 Registry Tests

| Test | Priority |
|------|----------|
| Register a constraint, retrieve by ID | MUST |
| Register duplicate ID throws | MUST |
| Filter by category returns correct subset | MUST |
| Filter by severity returns correct subset | MUST |
| Enable/disable toggles evaluation | MUST |
| Unregister removes from registry | MUST |
| Default registry has all built-in constraints | MUST |

### 17.2 Context Tests

| Test | Priority |
|------|----------|
| Context builds valid envelope from site setbacks | MUST |
| Context creates spatial index with all rooms | MUST |
| Context is immutable (building not mutated) | MUST |

### 17.3 Validator Tests

| Test | Priority |
|------|----------|
| Valid plan → isValid = true, score > 0 | MUST |
| Plan with overlap → isValid = false, HC-003 in violations | MUST |
| Same building twice → identical summary | MUST |
| Disabled constraint not evaluated | MUST |
| Score with Vastu disabled excludes Vastu category | MUST |
| Performance: 20-room plan < 50ms | MUST |
| Short-circuit mode stops after first HARD failure | SHOULD |

### 17.4 Hard Constraint Tests (per constraint)

For EACH hard constraint, at minimum:

| Test | Priority |
|------|----------|
| Pass case: valid input → passed=true | MUST |
| Fail case: invalid input → passed=false with correct entities | MUST |
| Message is human-readable (contains room name, not just ID) | MUST |
| SuggestedFix is present in result | SHOULD |

### 17.5 Soft Constraint Tests (per scorer)

For EACH soft scorer, at minimum:

| Test | Priority |
|------|----------|
| Best case: maximum score awarded | MUST |
| Worst case: zero/minimum score | MUST |
| Score is in [0, 100] | MUST |
| Details list is non-empty | MUST |
| Explanation is human-readable | MUST |

### 17.6 Scoring Tests

| Test | Priority |
|------|----------|
| Overall score is weighted average of categories | MUST |
| Score is in [0, 100] | MUST |
| Vastu disabled → weight redistributed, overall recalculated | MUST |
| Custom weights produce correct proportions | MUST |
| Category with no applicable constraints → score 100 | SHOULD |

### 17.7 Provider Tests

| Test | Priority |
|------|----------|
| VastuProvider returns constraints when enabled | MUST |
| VastuProvider returns empty when disabled | MUST |
| Vastu strict vs flexible produces different scores | SHOULD |
| Orientation affects quadrant determination | MUST |

### 17.8 Performance Tests

| Test | Priority |
|------|----------|
| Full validation of 20-room plan < 50ms | MUST |
| HARD-only validation < 10ms | MUST |
| 100 sequential validations (simulate candidate gen) < 5 seconds | SHOULD |

---

## 18. Backward Compatibility

The existing `validate()` function signature MUST continue to work:

```typescript
// compat.ts — wraps new architecture into old API shape

export function validate(
  building: Building,
  config?: ConstraintConfig,
  requiredRoomTypes?: RoomType[],
): ValidationReport;
```

This wrapper creates a `PlanValidator` with default registry, runs validation, and converts `ValidationSummary` to the existing `ValidationReport` format.

The existing exports (`runAllHardConstraints`, `scoreDaylight`, etc.) SHOULD remain exported for packages that depend on them, but marked as `@deprecated` in favor of the new architecture.

---

## 19. What Antigravity MUST NOT Do

1. MUST NOT call any LLM/AI service from constraint code.
2. MUST NOT reimplement geometry operations — use `@ai-floor-planner/geometry-engine`.
3. MUST NOT mutate the input Building.
4. MUST NOT make scores depend on runtime randomness.
5. MUST NOT hard-code Vastu rules in the core validator — use the provider.
6. MUST NOT claim regulatory compliance in any output message.
7. MUST NOT remove existing test fixtures or break existing APIs.
8. MUST NOT add runtime dependencies beyond `@ai-floor-planner/core` and `@ai-floor-planner/geometry-engine`.

---

## 20. Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|-------------|
| P4-AC-1 | `ConstraintRegistry` implementation with register/get/filter/enable/disable | Unit tests |
| P4-AC-2 | `PlanValidator.validate()` produces `ValidationSummary` | Unit tests |
| P4-AC-3 | All HARD constraints from §4 implemented and tested | Per-constraint tests |
| P4-AC-4 | All SOFT constraints from §5 (MUST items) implemented and tested | Per-scorer tests |
| P4-AC-5 | Valid fixture plans → isValid=true, overallScore > 50 | Integration tests |
| P4-AC-6 | Invalid fixture plans → isValid=false with correct violation IDs | Integration tests |
| P4-AC-7 | Scoring is deterministic (same input → same output) | Repeated validation test |
| P4-AC-8 | Building is never mutated | Object.freeze test |
| P4-AC-9 | Full validation < 50ms for 20-room plan | Performance test |
| P4-AC-10 | VastuRuleProvider produces constraints respecting strictness config | Provider tests |
| P4-AC-11 | Backward-compatible `validate()` function works | Compat test |
| P4-AC-12 | Coverage ≥ 90% for constraint-engine package | Coverage report |
| P4-AC-13 | `pnpm run typecheck` passes with zero errors | Build verification |
| P4-AC-14 | Human-readable messages include room names and measurements | Message format tests |
| P4-AC-15 | RegulatoryRuleProvider interface defined (stub implementation) | Type compilation |

---

## End of Specification
