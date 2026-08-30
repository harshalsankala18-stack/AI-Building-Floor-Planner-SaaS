# AI Floor Planner — Constraint Engine Documentation (Phase 4)

## 1. Purpose & Core Principles

The Constraint Engine provides deterministic, rule-based validation and multi-criteria scoring for architectural building models generated in the AI Floor Planner platform.

### Core Principles
- **100% Determinism:** Given the same building model and configuration, validation and scoring yield the exact same results every time. No external AI, LLM APIs, non-deterministic heuristics, or browser-only APIs are involved.
- **Strict Hard / Soft Separation:**
  - **Hard Constraints ($HC$):** Binary physical/structural laws. Any violation causes `valid = false` (`isValid = false`).
  - **Soft Constraints ($SC$):** Evaluated independently for diagnostic quality scoring ($0-100$). Even if hard violations exist, soft scores provide continuous optimization gradients.
- **Explainability:** Every violation and warning produces human-readable explanations answering **What** failed, **Why** it is problematic, and **Which entity** is affected, accompanied by actionable repair suggestions.
- **Extensible Architecture:** Rules and constraints are pluggable via `IConstraintRegistry` and `RuleProvider` interfaces (such as `VastuRuleProvider` and `RegulatoryRuleProvider`).

---

## 2. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                      Building Model                      │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                 EvaluationContext                       │
│  - Spatial Index (R-tree)                              │
│  - Buildable Envelope (Plot - Setbacks)                │
│  - Engine Configuration & Tolerances                   │
│  - Required Room Types & Preferences                   │
└────────────────────────────┬────────────────────────────┘
                             │
               ┌─────────────┴─────────────┐
               ▼                           ▼
┌─────────────────────────────┐ ┌─────────────────────────┐
│    Hard Constraint Suite    │ │  Soft Constraint Suite  │
│    (Binary Validity)        │ │  (Weighted Scoring)     │
│  - Plot & Setback bounds    │ │  - Adjacency            │
│  - Room overlap             │ │  - Circulation          │
│  - Geometry & enclosure     │ │  - Daylight access      │
│  - Door & stair validity    │ │  - Privacy & zoning     │
│  - Accessibility graph      │ │  - Proportions & grids  │
│  - Minimum room dimensions  │ │  - Vastu (Extension)    │
└──────────────┬──────────────┘ └────────────┬────────────┘
               │                             │
               └──────────────┬──────────────┘
                              ▼
┌─────────────────────────────────────────────────────────┐
│                  PlanValidator                          │
│  - Aggregates Hard Failures & Warnings                 │
│  - Computes Normalized Category & Overall Scores        │
│  - Assembles Actionable Repair Suggestions              │
└─────────────────────────────┬───────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   PlanValidationResult                  │
│  { valid, hardFailures, warnings, softScore, ... }       │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Constraint System & Hierarchy

All constraints implement the common `Constraint` interface:

```typescript
export interface Constraint {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: ConstraintCategory;
  readonly severity: ConstraintSeverity;
  readonly enabled: boolean;
  evaluate(context: EvaluationContext): ConstraintResult[];
}
```

### Constraint Severity
- `HARD`: Violation invalidates the plan (`valid = false`).
- `SOFT`: Scored preference contribution ($0-100$).
- `WARNING`: Architectural caution or advisory without invalidating.
- `INFO`: Informational feedback.

---

## 4. Hard Constraints Catalog

| ID | Name | Category | Description & Rule |
|----|------|----------|-------------------|
| **HC-001** | RoomContainment | `geometry` | Every room polygon must be fully contained within its floor boundary. |
| **HC-002** | FloorContainment | `geometry` | Floor boundary must be contained within the plot boundary minus setbacks (buildable envelope). |
| **HC-003** | RoomOverlap | `geometry` | No two room polygons on the same floor may overlap (intersection area $\le 100\,\text{mm}^2$ tolerance). |
| **HC-004** | PolygonSelfIntersection | `geometry` | Room and floor boundary polygons must not self-intersect. |
| **HC-005** | RoomEnclosure | `geometry` | Polygons must be closed and contain at least 3 distinct vertices. |
| **HC-006** | WallIntegrity | `geometry` | Walls must have positive length ($> 0$) and positive thickness ($> 0$). |
| **HC-010** | RoomAccessibility | `circulation` | Every room must be reachable from the exterior/entrance via a door graph path. |
| **HC-011** | DoorPlacement | `circulation` | Doors must be hosted on an existing wall and connect valid spaces. |
| **HC-012** | DoorClearance | `circulation` | Doors must have unobstructed opening swing clearance ($\ge 900\,\text{mm}$). |
| **HC-013** | CorridorWidth | `circulation` | Corridors must meet the minimum width threshold ($\ge 900\,\text{mm}$). |
| **HC-014** | StairConnectivity | `circulation` | Stairs must connect existing, consecutive floor levels (e.g., Level $0 \to 1$). |
| **HC-015** | WindowPlacement | `daylight` | Windows must be hosted on an existing exterior/room wall. |
| **HC-016** | StairDimensions | `circulation` | Stairs must meet minimum width ($\ge 900\,\text{mm}$) and maximum riser ($\le 200\,\text{mm}$). |
| **HC-020** | RequiredRoomsPresent | `completeness` | All required room types specified in requirements must exist in the building. |
| **HC-023** | MinimumRoomSize | `completeness` | Room area and shortest dimension must satisfy national building norms. |
| **HC-030** | FloorLevelConsistency | `completeness` | Floor levels must start from 0 and be consecutive without gaps. |

### Minimum Room Dimensions (Indian Residential NBC Standards)
- **Master Bedroom:** Area $\ge 12.0\,\text{m}^2$, Shortest side $\ge 3.0\,\text{m}$
- **Standard Bedroom:** Area $\ge 9.5\,\text{m}^2$, Shortest side $\ge 2.7\,\text{m}$
- **Kitchen:** Area $\ge 5.0\,\text{m}^2$, Shortest side $\ge 2.1\,\text{m}$
- **Bathroom:** Area $\ge 2.5\,\text{m}^2$, Shortest side $\ge 1.2\,\text{m}$
- **Living Room:** Area $\ge 12.0\,\text{m}^2$, Shortest side $\ge 3.0\,\text{m}$
- **Dining Room:** Area $\ge 9.0\,\text{m}^2$, Shortest side $\ge 2.7\,\text{m}$
- **Pooja Room:** Area $\ge 1.5\,\text{m}^2$, Shortest side $\ge 1.0\,\text{m}$

---

## 5. Soft Constraints Catalog & Scoring

Each soft constraint contributes weighted points to its respective category:

### 5.1 Adjacency (`SC-ADJ`)
- **SC-ADJ-001 (KitchenDining):** Kitchen adjacent to dining room ($+20\text{ pts}$).
- **SC-ADJ-002 (DiningLiving):** Dining adjacent or connected to living area ($+15\text{ pts}$).
- **SC-ADJ-003 (MasterBathroom):** Master bedroom has dedicated en-suite bathroom ($+20\text{ pts}$).
- **SC-ADJ-004 (UtilityKitchen):** Utility room adjacent to kitchen ($+10\text{ pts}$).
- **SC-ADJ-005 (ParkingEntrance):** Parking area adjacent to main entrance ($+10\text{ pts}$).
- **SC-ADJ-006 (PoojaAccess):** Pooja room accessible from quiet/public areas ($+10\text{ pts}$).

### 5.2 Circulation (`SC-CIR`)
- **SC-CIR-001 (CorridorRatio):** Corridor area $\le 15\%$ of total floor area ($+25\text{ pts}$, penalized $>20\%$).
- **SC-CIR-002 (NoDeadEnds):** Elimination of long dead-end corridors ($+20\text{ pts}$).
- **SC-CIR-003 (DirectAccess):** Direct foyer/living connection from main entrance ($+20\text{ pts}$).
- **SC-CIR-004 (PathLength):** Efficient door transition count between key spaces ($+15\text{ pts}$).

### 5.3 Daylight & Ventilation (`SC-DAY`)
- **SC-DAY-001 (BedroomExternal):** Every bedroom touches at least one external wall ($+20\text{ pts}$ each).
- **SC-DAY-002 (LivingExternal):** Living room has exterior wall access ($+25\text{ pts}$).
- **SC-DAY-003 (KitchenExternal):** Kitchen positioned with exterior wall for ventilation ($+15\text{ pts}$).
- **SC-DAY-004 (WindowOrientation):** Windows oriented towards East or South ($+10\text{ pts}$).
- **SC-DAY-005 (AllHabitableLight):** Bonus when $100\%$ of habitable rooms touch an external wall ($+10\text{ pts}$).

### 5.4 Privacy & Acoustic Separation (`SC-PRI`)
- **SC-PRI-001 (BedroomSeparation):** Bedrooms isolated from main entrance foyer ($+25\text{ pts}$).
- **SC-PRI-002 (MasterIsolation):** Master bedroom placed away from noisy service zones ($+20\text{ pts}$).
- **SC-PRI-003 (BathroomVisibility):** Bathroom doors not directly visible from living room ($+20\text{ pts}$).
- **SC-PRI-004 (GuestSeparation):** Guest/powder bathroom separated from private bedroom zones ($+15\text{ pts}$).

### 5.5 Functional Zoning (`SC-ZON`)
- **SC-ZON-001 (PublicPrivateSeparation):** Clear functional buffer between public and private rooms ($+30\text{ pts}$).
- **SC-ZON-002 (ServiceZoneGrouping):** Kitchen, utility, and wet services clustered together ($+20\text{ pts}$).
- **SC-ZON-003 (NightDaySeparation):** Daytime living spaces separate from nighttime sleep zones ($+20\text{ pts}$).

### 5.6 Geometry & Structural (`SC-GEO`, `SC-STR`)
- **SC-GEO-001 (AspectRatio):** Room aspect ratio within $1:1$ to $1:1.8$ ($+20\text{ pts}$).
- **SC-GEO-002 (RoomSizeRange):** Room area within standard optimal bounds ($+20\text{ pts}$).
- **SC-STR-001 (WallAlignment):** Stacked vertical wall alignment across multi-floor plans ($+25\text{ pts}$).
- **SC-STR-002 (ColumnGrid):** Regular structural column grid placement ($+20\text{ pts}$).

---

## 6. Extension Points: Rule Providers

### VastuRuleProvider (`vastu`)
Implements traditional orientation rules without polluting core geometry constraints:
- **Kitchen Zone:** Optimal in South-East (SE) or North-West (NW).
- **Master Bedroom:** Optimal in South-West (SW).
- **Pooja Room:** Optimal in North-East (NE).
- **Main Entrance:** Optimal facing East or North.
- **Toilets:** Prohibited in North-East (NE).
- **Brahmasthan:** Center of building kept open / uncluttered.

```typescript
const vastuProvider = new VastuRuleProvider({ strictness: 'moderate' });
registry.registerAll(vastuProvider.getRules());
```

### RegulatoryRuleProvider (`regulatory`)
Provides advisory warnings and checks for local municipal regulations (e.g. FAR, maximum ground coverage, fire egress distance).
*Disclaimer: Advisory guidance only; does not claim certified municipal compliance.*

---

## 7. API Reference & Usage

### Basic Validation

```typescript
import { validatePlan } from '@ai-floor-planner/constraint-engine';

const result = validatePlan(building);

if (!result.valid) {
  console.error(`Validation failed with ${result.hardFailures.length} hard failures:`);
  for (const failure of result.hardFailures) {
    console.error(`- [${failure.constraintId}] ${failure.message}`);
    console.error(`  Explanation: ${failure.explanation}`);
  }
} else {
  console.log(`Plan is valid! Quality Score: ${result.softScore}/100`);
  console.log('Category Scores:', result.categoryScores);
}
```

### Custom Validation Configuration

```typescript
import { PlanValidator, ConstraintRegistry, createDefaultRegistry } from '@ai-floor-planner/constraint-engine';
import { RoomType } from '@ai-floor-planner/core';

const registry = createDefaultRegistry();
const validator = new PlanValidator(registry, {
  enableVastu: true,
  vastuStrictness: 'moderate',
  categoryWeights: {
    circulation: 25,
    daylight: 25,
    privacy: 20,
    zoning: 15,
    vastu: 15,
  },
});

const report = validator.validatePlan(building, {
  requiredRoomTypes: [RoomType.Living, RoomType.Kitchen, RoomType.Bedroom, RoomType.Bathroom],
});
```

---

## 8. Performance & Benchmarks

The constraint engine executes in pure memory using geometric indexing ($R$-trees) and deterministic graph traversal:

| Operation | Requirement | Typical Latency |
|-----------|-------------|-----------------|
| Fast Hard-Only Check (`isValid`) | $< 10\,\text{ms}$ | $\sim 1-3\,\text{ms}$ |
| Full Validation & Scoring (`validatePlan`) | $< 50\,\text{ms}$ | $\sim 5-12\,\text{ms}$ |
| Batch Stress (100 sequential passes) | $< 5000\,\text{ms}$ | $\sim 450\,\text{ms}$ |
