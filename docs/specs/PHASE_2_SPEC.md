# Phase 2 — Building Domain Model: Implementation Specification

## Status: IMPLEMENTATION-READY

This specification defines the implementation of the canonical Building Model — the single source of truth for all floor plan data. The model is immutable, serializable, and versionable.

---

## 1. Objectives

| ID | Objective | Priority |
|----|-----------|----------|
| P2-OBJ-1 | Implement factory functions to create every domain entity with stable UUIDs | MUST |
| P2-OBJ-2 | Implement immutable update helpers (produce new objects, never mutate) | MUST |
| P2-OBJ-3 | Implement JSON serialization/deserialization with zero data loss | MUST |
| P2-OBJ-4 | Implement schema validation for deserialized data | MUST |
| P2-OBJ-5 | Implement plan versioning (snapshot creation, version comparison) | MUST |
| P2-OBJ-6 | Implement area/perimeter computation hooks on entity creation | SHOULD |
| P2-OBJ-7 | Create fixture plan files (JSON) for test use across all phases | MUST |
| P2-OBJ-8 | UUID generation must be deterministic in tests (seedable) | SHOULD |

---

## 2. Files and Modules

```
packages/core/src/
├── types/              (already exists — DO NOT MODIFY)
├── models/
│   ├── index.ts        — barrel export
│   ├── factory.ts      — entity creation functions
│   ├── updaters.ts     — immutable update helpers
│   ├── serialization.ts — JSON serialize/deserialize
│   ├── validation.ts   — schema validation
│   ├── versioning.ts   — plan version management
│   └── id.ts           — UUID generation (seedable for tests)
├── constants.ts        — default values, min sizes, tolerances
├── __tests__/
│   ├── factory.test.ts
│   ├── updaters.test.ts
│   ├── serialization.test.ts
│   ├── validation.test.ts
│   ├── versioning.test.ts
│   └── fixtures.test.ts
└── index.ts            — updated barrel export

tests/fixtures/
├── 30x50-2bhk.json
├── 30x50-3bhk.json
├── 40x60-4bhk.json
├── irregular-plot.json
├── g-plus-1.json
├── g-plus-2.json
├── minimal-1room.json
├── maximum-rooms.json
└── invalid-overlap.json
```

---

## 3. Interfaces

### 3.1 Factory Functions

```typescript
// packages/core/src/models/factory.ts

/** Create a new Building with all required fields. */
function createBuilding(params: CreateBuildingParams): Building;

/** Create a new Floor within a building. */
function createFloor(params: CreateFloorParams): Floor;

/** Create a new Room within a floor. */
function createRoom(params: CreateRoomParams): Room;

/** Create a new Wall. */
function createWall(params: CreateWallParams): Wall;

/** Create a new Door. */
function createDoor(params: CreateDoorParams): Door;

/** Create a new Window. */
function createWindow(params: CreateWindowParams): Window;

/** Create a new Stair. */
function createStair(params: CreateStairParams): Stair;

/** Create a new Column. */
function createColumn(params: CreateColumnParams): Column;

/** Create a Site from plot dimensions. */
function createSite(params: CreateSiteParams): Site;
```

### 3.2 Create Param Types

Each `Create*Params` type MUST:
- Omit `id` (auto-generated)
- Omit `createdAt`/`updatedAt` (auto-set)
- Omit computed fields (area computed from width/height or boundary)
- Require all fields that have no sensible default
- Use `Partial<>` for fields with defaults

```typescript
interface CreateBuildingParams {
  projectId: string;
  name: string;
  site: CreateSiteParams;
  floors?: CreateFloorParams[];
  metadata?: Partial<BuildingMetadata>;
}

interface CreateSiteParams {
  plotWidth: number;       // mm
  plotDepth: number;       // mm
  orientation?: number;    // degrees, default: 0
  plotShape?: PlotShape;   // default: Rectangular
  setbacks?: Partial<Setbacks>; // default: all zeros
  roadFacing?: Direction;  // default: North
  accessPoints?: Omit<AccessPoint, 'id'>[];
}

interface CreateFloorParams {
  buildingId: string;
  level: number;
  name?: string;          // default: "Floor {level}"
  floorHeight?: number;   // default: 3000mm
  boundary?: Polygon;     // default: computed from site minus setbacks
}

interface CreateRoomParams {
  floorId: string;
  type: RoomType;
  name?: string;          // default: derived from type
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;      // default: 0
  priority?: number;      // default: 5
  tags?: string[];
  adjacencyRequirements?: AdjacencyRequirement[];
  daylightRequirement?: DaylightLevel;    // default: Medium
  privacyRequirement?: PrivacyLevel;      // default: None
  ventilationRequired?: boolean;          // default: false
  isFixed?: boolean;                      // default: false
}

interface CreateWallParams {
  floorId: string;
  startPoint: Point;
  endPoint: Point;
  thickness?: number;     // default: 150 (internal), 230 (external)
  type?: WallType;        // default: Internal
  material?: string;
  roomIds?: string[];
  loadBearing?: boolean;  // default: false
}

interface CreateDoorParams {
  floorId: string;
  wallId: string;
  position: Point;
  width?: number;         // default: 900mm
  height?: number;        // default: 2100mm
  type?: DoorType;        // default: Single
  swingDirection?: SwingDirection;  // default: Inward
  connectsRooms: [string, string];
}

interface CreateWindowParams {
  floorId: string;
  wallId: string;
  position: Point;
  width?: number;         // default: 1200mm
  height?: number;        // default: 1200mm
  sillHeight?: number;    // default: 900mm
  type?: WindowType;      // default: Sliding
  roomId: string;
}

interface CreateStairParams {
  floorId: string;
  type?: StairType;       // default: Straight
  x: number;
  y: number;
  width: number;
  length: number;
  direction?: Direction;  // default: North
  riserCount?: number;
  riserHeight?: number;   // default: 175mm
  treadDepth?: number;    // default: 250mm
  connectsFloors: [number, number];
}

interface CreateColumnParams {
  floorId: string;
  position: Point;
  width?: number;         // default: 300mm
  depth?: number;         // default: 300mm
  shape?: ColumnShape;    // default: Rectangular
  isStructural?: boolean; // default: true
  gridReference?: string;
}
```

### 3.3 Immutable Update Helpers

```typescript
// packages/core/src/models/updaters.ts

/** Update a room's position. Returns new Building with updated room. */
function moveRoom(building: Building, roomId: string, newX: number, newY: number): Building;

/** Update a room's dimensions. Returns new Building. Area recomputed. */
function resizeRoom(building: Building, roomId: string, newWidth: number, newHeight: number): Building;

/** Add a room to a floor. Returns new Building. */
function addRoom(building: Building, floorId: string, params: CreateRoomParams): Building;

/** Remove a room from a floor. Returns new Building. */
function removeRoom(building: Building, roomId: string): Building;

/** Move a door along its wall. Returns new Building. */
function moveDoor(building: Building, doorId: string, newPosition: Point): Building;

/** Move a window along its wall. Returns new Building. */
function moveWindow(building: Building, windowId: string, newPosition: Point): Building;

/** Generic entity updater — update any entity field by ID. */
function updateEntity<T extends keyof EntityMap>(
  building: Building,
  entityType: T,
  entityId: string,
  updates: Partial<EntityMap[T]>
): Building;
```

**Invariant**: Every updater MUST return a new object. The original MUST NOT be mutated. Use structural sharing where practical.

### 3.4 Serialization

```typescript
// packages/core/src/models/serialization.ts

/** Serialize a Building to a JSON string. */
function serializeBuilding(building: Building): string;

/** Deserialize a JSON string to a Building. Throws on invalid data. */
function deserializeBuilding(json: string): Building;

/** Deep clone a Building (via serialize/deserialize or structuredClone). */
function cloneBuilding(building: Building): Building;
```

### 3.5 Validation

```typescript
// packages/core/src/models/validation.ts

interface ValidationError {
  path: string;       // e.g., "floors[0].rooms[2].width"
  message: string;
  value: unknown;
}

/** Validate a complete Building model structure (not geometric validity). */
function validateBuildingSchema(building: unknown): ValidationError[];

/** Validate a single room's fields. */
function validateRoomSchema(room: unknown): ValidationError[];

/** Check if a value is a valid Building. Type guard. */
function isValidBuilding(value: unknown): value is Building;
```

Validation rules:
- All `id` fields MUST be non-empty strings
- All dimensions MUST be positive numbers
- All coordinates MUST be finite numbers
- `floorId` references MUST point to existing floors
- `wallId` references MUST point to existing walls
- `roomIds` references MUST point to existing rooms
- Room `type` MUST be a valid RoomType enum value
- `boundary.points` MUST have at least 3 points
- `area` MUST equal `width * height` for rectangular rooms (tolerance: 1 sq mm)

### 3.6 Versioning

```typescript
// packages/core/src/models/versioning.ts

/** Create a version snapshot from the current building state. */
function createVersion(
  building: Building,
  changeDescription: string,
  changeSource: ChangeSource,
  createdBy: string
): PlanVersion;

/** Apply a version snapshot (restore). */
function restoreVersion(version: PlanVersion): Building;

/** Compare two buildings and return a summary of differences. */
function diffBuildings(before: Building, after: Building): BuildingDiff;

interface BuildingDiff {
  addedRooms: string[];       // IDs
  removedRooms: string[];     // IDs
  movedRooms: string[];       // IDs
  resizedRooms: string[];     // IDs
  addedWalls: string[];
  removedWalls: string[];
  addedDoors: string[];
  removedDoors: string[];
  addedWindows: string[];
  removedWindows: string[];
  hasChanges: boolean;
}
```

### 3.7 ID Generation

```typescript
// packages/core/src/models/id.ts

/** Generate a UUID v4. */
function generateId(): string;

/** Set a seed for deterministic ID generation (testing only). */
function setIdSeed(seed: number): void;

/** Reset to random ID generation. */
function resetIdGenerator(): void;
```

MUST: Use `crypto.randomUUID()` in production.
SHOULD: Support a seeded PRNG for test determinism (e.g., a simple counter-based generator when seed is set).

---

## 4. Data Structures

### 4.1 Constants

```typescript
// packages/core/src/constants.ts

export const DEFAULTS = {
  WALL_THICKNESS_EXTERNAL: 230,    // mm
  WALL_THICKNESS_INTERNAL: 150,    // mm
  WALL_THICKNESS_PARTITION: 100,   // mm
  FLOOR_HEIGHT: 3000,              // mm
  DOOR_WIDTH: 900,                 // mm
  DOOR_HEIGHT: 2100,               // mm
  WINDOW_WIDTH: 1200,              // mm
  WINDOW_HEIGHT: 1200,             // mm
  WINDOW_SILL_HEIGHT: 900,         // mm
  COLUMN_WIDTH: 300,               // mm
  COLUMN_DEPTH: 300,               // mm
  RISER_HEIGHT: 175,               // mm
  TREAD_DEPTH: 250,                // mm
  STAIR_WIDTH: 1000,               // mm
} as const;

export const TOLERANCES = {
  LINEAR: 1,           // mm — minimum meaningful distance
  AREA: 1,             // sq mm — minimum meaningful area
  ANGULAR: 0.01,       // degrees
  ADJACENCY: 5,        // mm — gap below this = adjacent
  OVERLAP: 100,        // sq mm — overlap below this = rounding artifact
} as const;

export const MINIMUM_ROOM_AREAS: Record<string, number> = {
  bedroom: 9_500_000,       // 9.5 sq m in sq mm
  bedroom_master: 12_000_000, // 12 sq m
  kitchen: 5_000_000,        // 5 sq m
  bathroom: 2_500_000,       // 2.5 sq m
  living: 12_000_000,        // 12 sq m
  dining: 9_000_000,         // 9 sq m
} as const;

export const MINIMUM_DIMENSIONS: Record<string, number> = {
  bedroom: 2700,        // mm
  bedroom_master: 3000, // mm
  kitchen: 2100,        // mm
  bathroom: 1200,       // mm
  living: 3000,         // mm
  dining: 2700,         // mm
  corridor: 900,        // mm
  staircase: 900,       // mm
} as const;
```

### 4.2 Fixture Plan Format

Every fixture JSON MUST conform to the `Building` interface exactly.

Example skeleton (30x50-2bhk.json):

```jsonc
{
  "id": "fixture-30x50-2bhk",
  "projectId": "project-fixture-001",
  "name": "30x50 2BHK Fixture",
  "site": {
    "id": "site-fixture-001",
    "plotBoundary": {
      "points": [
        { "x": 0, "y": 0 },
        { "x": 9144, "y": 0 },
        { "x": 9144, "y": 15240 },
        { "x": 0, "y": 15240 }
      ]
    },
    "plotWidth": 9144,
    "plotDepth": 15240,
    "plotArea": 139354560,
    "plotShape": "rectangular",
    "orientation": 0,
    "setbacks": { "front": 1500, "rear": 1000, "left": 900, "right": 900 },
    "accessPoints": [],
    "roadFacing": "north"
  },
  "floors": [
    {
      "id": "floor-gf-001",
      "buildingId": "fixture-30x50-2bhk",
      "level": 0,
      "name": "Ground Floor",
      "floorHeight": 3000,
      "boundary": {
        "points": [
          { "x": 900, "y": 1500 },
          { "x": 8244, "y": 1500 },
          { "x": 8244, "y": 14240 },
          { "x": 900, "y": 14240 }
        ]
      },
      "rooms": [ /* ... see full spec below ... */ ],
      "walls": [],
      "doors": [],
      "windows": [],
      "stairs": [],
      "columns": []
    }
  ],
  "metadata": {
    "projectId": "project-fixture-001",
    "clientName": "Test Fixture"
  },
  "version": 1,
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

---

## 5. Inputs and Outputs

### Factory Functions

| Function | Inputs | Outputs |
|----------|--------|---------|
| `createBuilding` | `CreateBuildingParams` | `Building` |
| `createRoom` | `CreateRoomParams` | `Room` |
| `createWall` | `CreateWallParams` | `Wall` |

### Updaters

| Function | Inputs | Outputs |
|----------|--------|---------|
| `moveRoom` | `Building`, `roomId`, `x`, `y` | new `Building` |
| `resizeRoom` | `Building`, `roomId`, `width`, `height` | new `Building` |
| `addRoom` | `Building`, `floorId`, `CreateRoomParams` | new `Building` |
| `removeRoom` | `Building`, `roomId` | new `Building` |

### Serialization

| Function | Input | Output |
|----------|-------|--------|
| `serializeBuilding` | `Building` | JSON `string` |
| `deserializeBuilding` | JSON `string` | `Building` (throws on invalid) |

### Validation

| Function | Input | Output |
|----------|-------|--------|
| `validateBuildingSchema` | `unknown` | `ValidationError[]` (empty = valid) |
| `isValidBuilding` | `unknown` | `boolean` (type guard) |

---

## 6. Invariants

| ID | Invariant | Priority |
|----|-----------|----------|
| P2-INV-1 | Every entity created by a factory MUST have a unique non-empty `id` | MUST |
| P2-INV-2 | Updaters MUST NOT mutate the input Building | MUST |
| P2-INV-3 | `serializeBuilding(deserializeBuilding(json))` MUST equal `json` (round-trip) | MUST |
| P2-INV-4 | Room `area` MUST equal `width * height` after creation/resize | MUST |
| P2-INV-5 | Room `boundary` MUST be a rectangle matching x/y/width/height for rectangular rooms | MUST |
| P2-INV-6 | `createVersion` MUST produce an independent snapshot (deep copy) | MUST |
| P2-INV-7 | Entity IDs MUST be preserved across updates (same room keeps same ID) | MUST |
| P2-INV-8 | All coordinates MUST be finite numbers (no NaN, no Infinity) | MUST |
| P2-INV-9 | All dimensions MUST be > 0 | MUST |
| P2-INV-10 | Version numbers MUST be monotonically increasing | MUST |

---

## 7. Error Handling

| Scenario | Behavior | Priority |
|----------|----------|----------|
| `deserializeBuilding` with invalid JSON | Throw `DeserializationError` with details | MUST |
| `validateBuildingSchema` with invalid data | Return array of `ValidationError` (never throw) | MUST |
| `moveRoom` with non-existent roomId | Throw `EntityNotFoundError` | MUST |
| `removeRoom` with non-existent roomId | Throw `EntityNotFoundError` | MUST |
| `createRoom` with negative dimensions | Throw `InvalidDimensionError` | MUST |
| `createRoom` with NaN/Infinity coordinates | Throw `InvalidCoordinateError` | MUST |

Error classes:

```typescript
class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'DomainError';
  }
}

class EntityNotFoundError extends DomainError {
  constructor(entityType: string, entityId: string) {
    super(`${entityType} with id "${entityId}" not found`, 'ENTITY_NOT_FOUND');
  }
}

class InvalidDimensionError extends DomainError {
  constructor(field: string, value: number) {
    super(`Invalid dimension for "${field}": ${value}. Must be > 0.`, 'INVALID_DIMENSION');
  }
}

class InvalidCoordinateError extends DomainError {
  constructor(field: string, value: number) {
    super(`Invalid coordinate for "${field}": ${value}. Must be finite.`, 'INVALID_COORDINATE');
  }
}

class DeserializationError extends DomainError {
  constructor(errors: ValidationError[]) {
    super(`Deserialization failed: ${errors.length} validation error(s)`, 'DESERIALIZATION_FAILED');
  }
}
```

---

## 8. Unit Tests

### 8.1 Factory Tests (`factory.test.ts`)

| Test | Priority |
|------|----------|
| `createBuilding` produces valid Building with UUID id | MUST |
| `createRoom` computes area from width × height | MUST |
| `createRoom` generates boundary polygon from x/y/width/height | MUST |
| `createRoom` applies defaults for optional fields | MUST |
| `createRoom` with negative width throws InvalidDimensionError | MUST |
| `createRoom` with NaN x throws InvalidCoordinateError | MUST |
| `createWall` defaults to Internal type with 150mm thickness | MUST |
| `createDoor` defaults to Single, Inward, 900mm width | MUST |
| `createSite` computes plotArea from width × depth | MUST |
| `createSite` generates rectangular plotBoundary from dimensions | MUST |
| Each factory call generates a unique id | MUST |
| Two sequential calls produce different ids | MUST |
| With seed set, ids are deterministic | SHOULD |

### 8.2 Updater Tests (`updaters.test.ts`)

| Test | Priority |
|------|----------|
| `moveRoom` returns new Building, original unchanged | MUST |
| `moveRoom` updates x and y of target room | MUST |
| `moveRoom` updates boundary polygon to match new x/y | MUST |
| `moveRoom` preserves room id | MUST |
| `moveRoom` with non-existent id throws EntityNotFoundError | MUST |
| `resizeRoom` updates width, height, area, and boundary | MUST |
| `resizeRoom` with negative dimension throws | MUST |
| `addRoom` increases room count by 1 | MUST |
| `addRoom` preserves existing rooms unchanged | MUST |
| `removeRoom` decreases room count by 1 | MUST |
| `removeRoom` does not affect other rooms | MUST |
| Updaters preserve structural sharing where possible | SHOULD |

### 8.3 Serialization Tests (`serialization.test.ts`)

| Test | Priority |
|------|----------|
| Round-trip: serialize then deserialize produces equal Building | MUST |
| All entity types survive serialization (rooms, walls, doors, windows, stairs, columns) | MUST |
| UUIDs preserved across serialization | MUST |
| Enums serialized as string values | MUST |
| Points serialized as { x, y } objects | MUST |
| Polygon serialized with points array | MUST |
| Deserialization of invalid JSON throws DeserializationError | MUST |
| Deserialization of structurally invalid data throws with details | MUST |
| Fixture files deserialize without error | MUST |

### 8.4 Validation Tests (`validation.test.ts`)

| Test | Priority |
|------|----------|
| Valid Building returns empty error array | MUST |
| Missing `id` field returns error | MUST |
| Negative room width returns error | MUST |
| NaN coordinate returns error | MUST |
| Invalid RoomType returns error | MUST |
| Invalid floorId reference returns error | MUST |
| Room area mismatch returns error | MUST |
| Boundary with < 3 points returns error | MUST |

### 8.5 Versioning Tests (`versioning.test.ts`)

| Test | Priority |
|------|----------|
| `createVersion` produces snapshot independent of source | MUST |
| Mutating source after version does not affect snapshot | MUST |
| `restoreVersion` returns building matching snapshot | MUST |
| Version numbers increment | MUST |
| `diffBuildings` detects added room | MUST |
| `diffBuildings` detects removed room | MUST |
| `diffBuildings` detects moved room (x/y changed) | MUST |
| `diffBuildings` detects resized room | MUST |
| `diffBuildings` of identical buildings returns hasChanges=false | MUST |

---

## 9. Integration Tests

```typescript
// tests/integration/domain-model.test.ts

describe('Domain Model Integration', () => {
  it('creates building, adds rooms, serializes, deserializes, validates', () => {
    // 1. Create building with site
    // 2. Add 3 rooms
    // 3. Serialize to JSON
    // 4. Deserialize from JSON
    // 5. Validate schema
    // 6. Assert equality
  });

  it('loads all fixture files without error', () => {
    // For each fixture JSON:
    // 1. Read file
    // 2. deserializeBuilding()
    // 3. validateBuildingSchema()
    // 4. Assert 0 errors
  });

  it('version workflow: create, edit, version, restore', () => {
    // 1. Create building
    // 2. Move a room
    // 3. Create version
    // 4. Move room again
    // 5. Restore version
    // 6. Assert room is at version position
  });
});
```

---

## 10. Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|-------------|
| P2-AC-1 | All factory functions produce valid entities | Unit tests pass |
| P2-AC-2 | Updaters never mutate input | Freeze tests pass |
| P2-AC-3 | Full round-trip serialization works | Serialization tests pass |
| P2-AC-4 | Validation catches all listed error cases | Validation tests pass |
| P2-AC-5 | All 9 fixture files load and validate | Fixture tests pass |
| P2-AC-6 | Version creation produces independent snapshots | Version tests pass |
| P2-AC-7 | `pnpm run test` passes in core package | Run command |
| P2-AC-8 | Coverage ≥ 90% for `packages/core/src/models/` | Coverage report |

---

## 11. Implementation Notes for Antigravity

1. Use `structuredClone()` (Node 17+) for deep copying in versioning. This avoids custom clone logic.
2. For immutable updaters, a helper pattern is recommended:

```typescript
function updateRoomInBuilding(building: Building, roomId: string, updater: (room: Room) => Room): Building {
  return {
    ...building,
    floors: building.floors.map(floor => ({
      ...floor,
      rooms: floor.rooms.map(room =>
        room.id === roomId ? updater(room) : room
      ),
    })),
    updatedAt: new Date().toISOString(),
  };
}
```

3. For boundary polygon generation from x/y/width/height:

```typescript
function rectToPolygon(x: number, y: number, width: number, height: number): Polygon {
  return {
    points: [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ],
  };
}
```

4. Fixture files MUST be hand-crafted to represent realistic Indian residential layouts at standard plot sizes (30ft × 50ft = 9144mm × 15240mm).

5. Do NOT add runtime dependencies. The core package should have ZERO production dependencies (only devDependencies for TypeScript and Vitest).
