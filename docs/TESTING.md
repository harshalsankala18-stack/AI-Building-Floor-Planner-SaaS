# AI Floor Planner — Testing Strategy

## 1. Overview

Testing covers all deterministic subsystems with automated tests. The goal is high confidence that geometric calculations, constraint validation, and plan generation produce correct results.

---

## 2. Testing Stack

| Tool | Purpose |
|------|---------|
| Vitest | Unit and integration test runner |
| @testing-library/react | Frontend component testing |
| Playwright | E2E browser testing (future) |
| Supertest | API integration tests |

---

## 3. Test Categories

### 3.1 Unit Tests

Each package has its own unit tests:

```
packages/geometry-engine/src/__tests__/
packages/constraint-engine/src/__tests__/
packages/planning-engine/src/__tests__/
packages/core/src/__tests__/
packages/renderer/src/__tests__/
packages/ai-orchestration/src/__tests__/
```

### 3.2 Integration Tests

Cross-package tests that verify subsystem collaboration:

```
tests/integration/
├── generation-pipeline.test.ts
├── edit-pipeline.test.ts
├── validation-pipeline.test.ts
├── export-pipeline.test.ts
└── api-endpoints.test.ts
```

### 3.3 Fixture Plans

Pre-defined plan configurations for repeatable testing:

```
tests/fixtures/
├── 30x50-2bhk.json
├── 30x50-3bhk.json
├── 40x60-4bhk.json
├── irregular-plot.json
├── g-plus-1.json
├── g-plus-2.json
├── minimal-1room.json
├── maximum-rooms.json
├── vastu-compliant.json
└── constraint-violations.json
```

---

## 4. Geometry Engine Tests

### Required Test Coverage

| Module | Test Cases |
|--------|-----------|
| Point operations | distance, midpoint, rotation, translation |
| Segment operations | length, angle, intersection, offset |
| Polygon operations | area, perimeter, centroid, containment, overlap |
| Rectangle operations | overlap, containment, adjacency, snapping |
| Wall generation | from rooms, merging, splitting |
| Collision detection | room-room, room-boundary, door-swing |
| Snapping | grid snap, wall snap, alignment |
| Area calculations | carpet area, built-up area, coverage ratio |

### Example Test Cases

```typescript
describe('Geometry Engine - Polygon Area', () => {
  it('computes area of a rectangle', () => {
    const rect = createRect(0, 0, 3000, 4000);
    expect(polygonArea(rect)).toBe(12_000_000); // 12 sq m in sq mm
  });

  it('computes area of an L-shaped polygon', () => {
    const L = polygon([
      { x: 0, y: 0 },
      { x: 6000, y: 0 },
      { x: 6000, y: 3000 },
      { x: 3000, y: 3000 },
      { x: 3000, y: 6000 },
      { x: 0, y: 6000 },
    ]);
    expect(polygonArea(L)).toBe(27_000_000); // 27 sq m
  });

  it('returns positive area regardless of winding direction', () => {
    const cw = polygon([...pointsCW]);
    const ccw = polygon([...pointsCCW]);
    expect(polygonArea(cw)).toBe(polygonArea(ccw));
    expect(polygonArea(cw)).toBeGreaterThan(0);
  });
});

describe('Geometry Engine - Collision Detection', () => {
  it('detects overlapping rooms', () => {
    const roomA = makeRoom(0, 0, 3000, 4000);
    const roomB = makeRoom(2000, 2000, 3000, 4000);
    const result = detectRoomCollisions(roomA, [roomB]);
    expect(result).toHaveLength(1);
    expect(result[0].overlapArea).toBeGreaterThan(0);
  });

  it('does not flag adjacent non-overlapping rooms', () => {
    const roomA = makeRoom(0, 0, 3000, 4000);
    const roomB = makeRoom(3000, 0, 3000, 4000);
    const result = detectRoomCollisions(roomA, [roomB]);
    expect(result).toHaveLength(0);
  });

  it('detects room outside floor boundary', () => {
    const room = makeRoom(8000, 8000, 3000, 4000);
    const floor = createRect(0, 0, 9000, 15000);
    expect(detectBoundaryViolation(room, floor)).toBe(true);
  });
});
```

---

## 5. Constraint Engine Tests

### Hard Constraint Tests

```typescript
describe('Hard Constraints', () => {
  it('HC-001: fails when room extends outside floor', () => {
    const plan = fixtures.load('constraint-violations');
    const report = constraintEngine.validate(plan);
    expect(report.isValid).toBe(false);
    expect(report.hardViolations).toContainEqual(
      expect.objectContaining({ constraintId: 'HC-001' })
    );
  });

  it('HC-003: fails when rooms overlap', () => { ... });
  it('HC-010: fails when room is unreachable', () => { ... });
  it('HC-020: fails when required rooms missing', () => { ... });
  
  it('passes for valid fixture plan', () => {
    const plan = fixtures.load('30x50-3bhk');
    const report = constraintEngine.validate(plan);
    expect(report.isValid).toBe(true);
    expect(report.hardViolations).toHaveLength(0);
  });
});
```

### Soft Constraint Tests

```typescript
describe('Soft Constraints - Vastu', () => {
  it('scores higher when kitchen is in SE', () => {
    const planA = fixtures.load('vastu-compliant');
    const planB = fixtures.modify('vastu-compliant', { 
      kitchen: { x: 0, y: 0 } // NW corner
    });
    const scoreA = constraintEngine.score(planA);
    const scoreB = constraintEngine.score(planB);
    expect(scoreA.categories.vastu.score).toBeGreaterThan(
      scoreB.categories.vastu.score
    );
  });
});
```

---

## 6. Planning Engine Tests

```typescript
describe('Planning Engine', () => {
  it('generates requested number of candidates', () => {
    const requirements = fixtures.requirements('30x50-3bhk');
    const candidates = planningEngine.generateCandidates(requirements, 3);
    expect(candidates).toHaveLength(3);
  });

  it('all candidates pass hard constraints', () => {
    const requirements = fixtures.requirements('30x50-3bhk');
    const candidates = planningEngine.generateCandidates(requirements, 5);
    candidates.forEach(candidate => {
      const report = constraintEngine.validate(candidate);
      expect(report.isValid).toBe(true);
    });
  });

  it('all required rooms are present in candidates', () => {
    const requirements = fixtures.requirements('30x50-3bhk');
    const candidates = planningEngine.generateCandidates(requirements, 3);
    candidates.forEach(candidate => {
      const roomTypes = candidate.floors[0].rooms.map(r => r.type);
      expect(roomTypes).toContain('bedroom');
      expect(roomTypes).toContain('kitchen');
      expect(roomTypes).toContain('bathroom');
    });
  });
});
```

---

## 7. AI Orchestration Tests

```typescript
describe('AI Orchestration', () => {
  it('parses simple requirement to structured format', async () => {
    const result = await aiOrchestration.parseRequirements(
      '30x50 east-facing 3BHK with 2 bathrooms'
    );
    expect(result.plotWidth).toBe(9144);
    expect(result.plotDepth).toBe(15240);
    expect(result.rooms).toContainEqual(
      expect.objectContaining({ type: 'bedroom', count: 3 })
    );
  });

  it('parses edit command to structured operations', async () => {
    const building = fixtures.load('30x50-3bhk');
    const ops = await aiOrchestration.parseEditCommand(
      'Make the master bedroom larger',
      building
    );
    expect(ops).toHaveLength(1);
    expect(ops[0].type).toBe('resize');
    expect(ops[0].targetId).toBe(building.floors[0].rooms[0].id);
  });

  // Uses mock provider for deterministic tests
  it('falls back to alternate provider on failure', async () => { ... });
  it('rejects invalid AI response', async () => { ... });
});
```

---

## 8. Renderer Tests

```typescript
describe('SVG Renderer', () => {
  it('renders all rooms on floor', () => {
    const floor = fixtures.loadFloor('30x50-3bhk', 0);
    const svg = renderer.renderFloor(floor, defaultTransform);
    const roomElements = svg.querySelectorAll('[data-entity-type="room"]');
    expect(roomElements.length).toBe(floor.rooms.length);
  });

  it('renders walls with correct thickness', () => { ... });
  it('renders doors with swing arcs', () => { ... });
  it('renders dimensions correctly', () => { ... });
  it('export SVG is valid XML', () => { ... });
});
```

---

## 9. Serialization Tests

```typescript
describe('Building Model Serialization', () => {
  it('round-trips through JSON without data loss', () => {
    const original = fixtures.load('30x50-3bhk');
    const json = JSON.stringify(original);
    const restored = JSON.parse(json);
    expect(restored).toEqual(original);
  });

  it('handles all entity types', () => { ... });
  it('preserves UUIDs', () => { ... });
  it('validates against schema', () => { ... });
});
```

---

## 10. Coverage Requirements

| Package | Minimum Coverage |
|---------|-----------------|
| geometry-engine | 95% |
| constraint-engine | 90% |
| planning-engine | 85% |
| core (models) | 90% |
| renderer | 80% |
| ai-orchestration | 75% (mocked) |
| backend (API) | 80% |
| frontend | 70% |

---

## 11. CI Pipeline

```yaml
test:
  - install dependencies
  - lint (eslint + prettier)
  - type check (tsc --noEmit)
  - unit tests (all packages)
  - integration tests
  - coverage report
  - fail if coverage below thresholds
```

---

## 12. Fixture Plan Format

Each fixture is a complete Building Model JSON:

```json
{
  "id": "fixture-30x50-3bhk",
  "name": "30x50 3BHK Test Plan",
  "site": {
    "plotWidth": 9144,
    "plotDepth": 15240,
    "orientation": 90,
    "setbacks": { "front": 1500, "rear": 1000, "left": 900, "right": 900 }
  },
  "floors": [
    {
      "level": 0,
      "rooms": [ ... ],
      "walls": [ ... ],
      "doors": [ ... ],
      "windows": [ ... ]
    }
  ]
}
```

Fixtures are used by all test categories and must be kept in sync with the current domain model schema.
