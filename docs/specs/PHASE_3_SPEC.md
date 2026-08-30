# Phase 3 — Geometry Engine: Implementation Specification

## Status: IMPLEMENTATION-READY

This specification defines the deterministic geometry engine. Every function is a pure computation with no side effects, no randomness, and no AI involvement. Identical inputs MUST produce identical outputs.

---

## 1. Objectives

| ID | Objective | Priority |
|----|-----------|----------|
| P3-OBJ-1 | Implement all point operations (distance, midpoint, rotation, translation, containment) | MUST |
| P3-OBJ-2 | Implement all line segment operations (length, angle, intersection, offset) | MUST |
| P3-OBJ-3 | Implement polygon operations (area, perimeter, centroid, bounding box, containment, overlap, adjacency) | MUST |
| P3-OBJ-4 | Implement rectangle fast-path operations | MUST |
| P3-OBJ-5 | Implement collision detection (room-room, room-boundary) | MUST |
| P3-OBJ-6 | Implement wall generation from room boundaries | MUST |
| P3-OBJ-7 | Implement door/window placement validation | MUST |
| P3-OBJ-8 | Implement snapping and alignment | SHOULD |
| P3-OBJ-9 | Implement area and dimension calculations (carpet area, built-up area) | MUST |
| P3-OBJ-10 | Implement staircase geometry computation | SHOULD |
| P3-OBJ-11 | All functions must meet performance targets | MUST |
| P3-OBJ-12 | Zero runtime dependencies (pure TypeScript) | MUST |

---

## 2. Files and Modules

```
packages/geometry-engine/src/
├── index.ts                    — barrel export
├── point.ts                    — point operations
├── segment.ts                  — line segment operations
├── polygon.ts                  — polygon operations
├── rectangle.ts                — rectangle fast-path operations
├── collision.ts                — collision detection
├── walls.ts                    — wall generation
├── openings.ts                 — door/window placement
├── staircase.ts                — staircase geometry
├── snapping.ts                 — snap & alignment
├── area.ts                     — area calculations
├── utils.ts                    — shared math utilities (clamp, approxEqual, etc.)
├── __tests__/
│   ├── point.test.ts
│   ├── segment.test.ts
│   ├── polygon.test.ts
│   ├── rectangle.test.ts
│   ├── collision.test.ts
│   ├── walls.test.ts
│   ├── openings.test.ts
│   ├── staircase.test.ts
│   ├── snapping.test.ts
│   ├── area.test.ts
│   └── edge-cases.test.ts
└── types.ts                    — engine-internal types (WallConfig, StairParams, etc.)
```

---

## 3. Coordinate System

| Property | Value | Priority |
|----------|-------|----------|
| Origin | Top-left corner of plot | MUST |
| X axis | Increases rightward (East) | MUST |
| Y axis | Increases downward (South) | MUST |
| Units | Millimeters (mm) | MUST |
| Precision | Integer mm where possible; floating-point tolerated | MUST |
| Angles | Degrees, clockwise from positive Y (North=0°, East=90°) | MUST |
| Winding | Counter-clockwise = positive area | MUST |

---

## 4. Tolerances and Precision

```typescript
// Reuse from @ai-floor-planner/core constants
const TOLERANCE = {
  LINEAR: 1,         // mm — two points within 1mm are considered coincident
  AREA: 1,           // sq mm — area differences below this are zero
  ANGULAR: 0.01,     // degrees
  ADJACENCY: 5,      // mm — gap below this means "sharing a wall"
  OVERLAP: 100,      // sq mm — overlap below this is a rounding artifact, not a collision
  COLLINEAR: 0.001,  // cross-product threshold for collinearity
} as const;
```

MUST: Every comparison function MUST accept an optional `tolerance` parameter that defaults to the values above.

---

## 5. Interfaces — Complete Function Signatures

### 5.1 Point Operations (`point.ts`)

```typescript
import { Point } from '@ai-floor-planner/core';

/** Euclidean distance between two points. */
export function distance(a: Point, b: Point): number;

/** Midpoint between two points. */
export function midpoint(a: Point, b: Point): Point;

/** Rotate point around an origin by angle (degrees, clockwise). */
export function rotatePoint(point: Point, angleDeg: number, origin?: Point): Point;

/** Translate point by dx, dy. */
export function translatePoint(point: Point, dx: number, dy: number): Point;

/** Check if point lies on a line segment (within tolerance). */
export function pointOnSegment(point: Point, segment: LineSegment, tolerance?: number): boolean;

/** Check if point is inside a polygon (ray-casting algorithm). */
export function pointInPolygon(point: Point, polygon: Polygon): boolean;

/** Check if two points are approximately equal (within tolerance). */
export function pointsEqual(a: Point, b: Point, tolerance?: number): boolean;

/** Compute angle from point A to point B (degrees, clockwise from north/positive-Y). */
export function angleBetweenPoints(from: Point, to: Point): number;
```

### 5.2 Line Segment Operations (`segment.ts`)

```typescript
import { Point, LineSegment } from '@ai-floor-planner/core';

/** Length of a segment. */
export function segmentLength(segment: LineSegment): number;

/** Angle of segment relative to positive X axis (degrees). */
export function segmentAngle(segment: LineSegment): number;

/** Intersection point of two segments. Returns null if no intersection or parallel. */
export function segmentIntersection(a: LineSegment, b: LineSegment): Point | null;

/** Perpendicular distance from a point to a line segment. */
export function pointToSegmentDistance(point: Point, segment: LineSegment): number;

/** Offset a segment by distance perpendicular to its direction.
 *  'left' = counterclockwise side when walking start→end. */
export function offsetSegment(
  segment: LineSegment,
  distance: number,
  side: 'left' | 'right'
): LineSegment;

/** Check if two segments are parallel (within angular tolerance). */
export function segmentsParallel(a: LineSegment, b: LineSegment, tolerance?: number): boolean;

/** Check if two segments are collinear (parallel and on same line). */
export function segmentsCollinear(a: LineSegment, b: LineSegment, tolerance?: number): boolean;

/** Get the overlap segment of two collinear segments (null if no overlap). */
export function collinearOverlap(a: LineSegment, b: LineSegment): LineSegment | null;
```

### 5.3 Polygon Operations (`polygon.ts`)

```typescript
import { Point, Polygon, BoundingBox, LineSegment } from '@ai-floor-planner/core';

/** Signed area of polygon (positive if CCW winding). */
export function signedPolygonArea(polygon: Polygon): number;

/** Absolute area of polygon (always positive). */
export function polygonArea(polygon: Polygon): number;

/** Perimeter of polygon. */
export function polygonPerimeter(polygon: Polygon): number;

/** Centroid (center of mass) of polygon. */
export function polygonCentroid(polygon: Polygon): Point;

/** Axis-aligned bounding box of polygon. */
export function polygonBoundingBox(polygon: Polygon): BoundingBox;

/** Check if polygon is convex. */
export function isConvex(polygon: Polygon): boolean;

/** Check if polygon is valid (≥3 points, non-self-intersecting, non-zero area). */
export function isValidPolygon(polygon: Polygon): boolean;

/** Offset polygon inward (negative distance) or outward (positive distance).
 *  Uses Minkowski-style offset for simple polygons. */
export function offsetPolygon(polygon: Polygon, distance: number): Polygon;

/** Check if polygon A fully contains polygon B. */
export function containsPolygon(outer: Polygon, inner: Polygon): boolean;

/** Check if two polygons overlap (share interior area beyond tolerance). */
export function polygonsOverlap(a: Polygon, b: Polygon, tolerance?: number): boolean;

/** Compute intersection area of two convex polygons.
 *  For non-convex, decompose first or use a simpler check. */
export function polygonIntersectionArea(a: Polygon, b: Polygon): number;

/** Check if two polygons are adjacent (share a wall/edge or partial edge). */
export function polygonsAdjacent(a: Polygon, b: Polygon, tolerance?: number): boolean;

/** Return the shared edge between two adjacent polygons (null if not adjacent). */
export function sharedEdge(a: Polygon, b: Polygon, tolerance?: number): LineSegment | null;

/** Get edges of a polygon as an array of LineSegments. */
export function polygonEdges(polygon: Polygon): LineSegment[];

/** Check if a polygon is self-intersecting. */
export function isSelfIntersecting(polygon: Polygon): boolean;
```

### 5.4 Rectangle Operations (`rectangle.ts`)

```typescript
import { Point, Polygon, BoundingBox } from '@ai-floor-planner/core';

/** Create a Polygon rectangle from position and dimensions. */
export function createRect(x: number, y: number, width: number, height: number): Polygon;

/** Create a BoundingBox from position and dimensions. */
export function createBoundingBox(x: number, y: number, width: number, height: number): BoundingBox;

/** Check if two bounding boxes overlap. */
export function rectsOverlap(a: BoundingBox, b: BoundingBox): boolean;

/** Check if outer bounding box fully contains inner. */
export function rectContains(outer: BoundingBox, inner: BoundingBox): boolean;

/** Check if two rectangles share an edge (adjacent). */
export function rectsAdjacent(a: BoundingBox, b: BoundingBox, tolerance?: number): boolean;

/** Snap a bounding box to the nearest grid position. */
export function snapRectToGrid(rect: BoundingBox, gridSize: number): BoundingBox;

/** Compute overlap area of two bounding boxes (0 if no overlap). */
export function rectOverlapArea(a: BoundingBox, b: BoundingBox): number;

/** Convert BoundingBox to Polygon. */
export function boundingBoxToPolygon(bbox: BoundingBox): Polygon;

/** Convert Polygon to BoundingBox (axis-aligned envelope). */
export function polygonToBoundingBox(polygon: Polygon): BoundingBox;
```

### 5.5 Collision Detection (`collision.ts`)

```typescript
import { Room, Floor, Polygon, CollisionResult } from '@ai-floor-planner/core';

/** Check if a room collides with any room in the list. */
export function detectRoomCollisions(room: Room, otherRooms: readonly Room[]): CollisionResult[];

/** Check all pairs of rooms on a floor for collisions. */
export function detectFloorCollisions(floor: Floor): CollisionResult[];

/** Check if a room extends outside the given boundary polygon. */
export function detectBoundaryViolation(room: Room, boundary: Polygon): boolean;

/** Get the area of a room that extends outside a boundary. */
export function boundaryViolationArea(room: Room, boundary: Polygon): number;

/** Broad-phase collision check using bounding boxes (fast filter). */
export function broadPhaseCollision(rooms: readonly Room[]): Array<[string, string]>;
```

### 5.6 Wall Generation (`walls.ts`)

```typescript
import { Room, Wall, Floor, Polygon, Point } from '@ai-floor-planner/core';

interface WallConfig {
  externalThickness: number;   // default: 230mm
  internalThickness: number;   // default: 150mm
  partitionThickness: number;  // default: 100mm
}

/** Generate walls from a set of rooms and floor boundary.
 *  - External walls along the floor boundary.
 *  - Internal walls between adjacent rooms.
 *  - Merges collinear wall segments. */
export function generateWalls(
  rooms: readonly Room[],
  floorBoundary: Polygon,
  config?: Partial<WallConfig>
): Wall[];

/** Merge co-linear adjacent wall segments into single walls. */
export function mergeCollinearWalls(walls: readonly Wall[]): Wall[];

/** Split a wall at a given point (for inserting a door/window). Returns two wall segments. */
export function splitWallAtPoint(wall: Wall, position: Point, gapWidth: number): [Wall, Wall];

/** Generate external walls from a floor boundary polygon. */
export function generateExternalWalls(
  floorBoundary: Polygon,
  thickness: number,
  floorId: string
): Wall[];

/** Find the wall segment shared between two adjacent rooms. */
export function findSharedWall(roomA: Room, roomB: Room, tolerance?: number): Wall | null;
```

### 5.7 Door/Window Placement (`openings.ts`)

```typescript
import { Wall, Door, Window, Point, Polygon } from '@ai-floor-planner/core';

/** Check if a door can be placed on a wall at the given position. */
export function canPlaceDoor(
  wall: Wall,
  position: Point,
  doorWidth: number,
  minEdgeDistance?: number   // default: 100mm from wall ends
): boolean;

/** Compute the swing arc polygon for a door. */
export function doorSwingArc(door: Door): Polygon;

/** Check if door swing is clear of obstacles. */
export function isDoorSwingClear(door: Door, obstacles: readonly Polygon[]): boolean;

/** Check if a window can be placed on a wall at the given position. */
export function canPlaceWindow(
  wall: Wall,
  position: Point,
  windowWidth: number,
  minEdgeDistance?: number   // default: 100mm
): boolean;

/** Find all valid positions for a door on a wall (center positions). */
export function validDoorPositions(
  wall: Wall,
  doorWidth: number,
  minEdgeDistance: number,
  stepSize?: number          // default: 50mm increments
): Point[];

/** Find all valid positions for a window on a wall. */
export function validWindowPositions(
  wall: Wall,
  windowWidth: number,
  minEdgeDistance: number,
  stepSize?: number
): Point[];
```

### 5.8 Staircase Geometry (`staircase.ts`)

```typescript
import { Stair, StairType, BoundingBox, Polygon } from '@ai-floor-planner/core';

interface StairParams {
  type: StairType;
  width: number;
  floorHeight: number;     // total height to climb
  riserHeight?: number;    // default: 175mm
  treadDepth?: number;     // default: 250mm
}

interface StairGeometry {
  riserCount: number;
  totalLength: number;
  landingRequired: boolean;
  landingSize: { width: number; depth: number };
  boundary: Polygon;
  boundingBox: BoundingBox;
}

/** Compute staircase geometry from parameters. */
export function computeStairGeometry(params: StairParams): StairGeometry;

/** Validate stair dimensions against residential building norms.
 *  Returns list of violations (empty = valid). */
export function validateStairDimensions(stair: Stair): string[];

/** Compute the number of risers needed for a given floor height. */
export function computeRiserCount(floorHeight: number, riserHeight: number): number;
```

### 5.9 Snapping and Alignment (`snapping.ts`)

```typescript
import { Point, Room, Wall, BoundingBox, AlignmentGuide } from '@ai-floor-planner/core';

/** Snap a point to the nearest grid intersection. */
export function snapToGrid(point: Point, gridSize: number): Point;

/** Snap a point to the nearest wall endpoint (within threshold). Returns null if none. */
export function snapToWallEndpoint(
  point: Point,
  walls: readonly Wall[],
  threshold: number
): Point | null;

/** Find alignment guides for a room being moved/resized. */
export function findAlignmentGuides(
  room: Room,
  otherRooms: readonly Room[],
  threshold?: number    // default: 10mm
): AlignmentGuide[];

/** Snap a room's position to align with nearby rooms. */
export function snapRoomToAlignment(
  room: Room,
  otherRooms: readonly Room[],
  threshold?: number
): Point;
```

### 5.10 Area Calculations (`area.ts`)

```typescript
import { Room, Floor, Building, Polygon } from '@ai-floor-planner/core';

/** Carpet area of a room (interior area minus wall thickness). */
export function carpetArea(room: Room, wallThickness: number): number;

/** Built-up area of a floor (total enclosed area including walls). */
export function builtUpArea(floor: Floor): number;

/** Total building area (sum of all floors). */
export function totalBuildingArea(building: Building): number;

/** Floor space index / coverage ratio. */
export function floorCoverageRatio(floor: Floor, plotArea: number): number;

/** Compute area from a polygon (convenience wrapper). */
export function computeArea(polygon: Polygon): number;

/** Convert square millimeters to square meters. */
export function sqMmToSqM(sqMm: number): number;

/** Convert square millimeters to square feet. */
export function sqMmToSqFt(sqMm: number): number;

/** Convert millimeters to feet. */
export function mmToFeet(mm: number): number;

/** Convert feet to millimeters. */
export function feetToMm(feet: number): number;
```

### 5.11 Utilities (`utils.ts`)

```typescript
/** Check if two numbers are approximately equal within tolerance. */
export function approxEqual(a: number, b: number, tolerance?: number): boolean;

/** Clamp a value between min and max. */
export function clamp(value: number, min: number, max: number): number;

/** Convert degrees to radians. */
export function degToRad(degrees: number): number;

/** Convert radians to degrees. */
export function radToDeg(radians: number): number;

/** Cross product of 2D vectors (OA × OB). */
export function cross2D(o: Point, a: Point, b: Point): number;

/** Dot product of 2D vectors. */
export function dot2D(a: Point, b: Point): number;

/** Normalize angle to [0, 360) range. */
export function normalizeAngle(degrees: number): number;

/** Lerp (linear interpolation) between two values. */
export function lerp(a: number, b: number, t: number): number;
```

---

## 6. Data Structures (Engine-Internal Types)

```typescript
// packages/geometry-engine/src/types.ts

export interface WallConfig {
  externalThickness: number;
  internalThickness: number;
  partitionThickness: number;
}

export interface StairParams {
  type: StairType;
  width: number;
  floorHeight: number;
  riserHeight?: number;
  treadDepth?: number;
}

export interface StairGeometry {
  riserCount: number;
  totalLength: number;
  landingRequired: boolean;
  landingSize: { width: number; depth: number };
  boundary: Polygon;
  boundingBox: BoundingBox;
}

export const DEFAULT_WALL_CONFIG: WallConfig = {
  externalThickness: 230,
  internalThickness: 150,
  partitionThickness: 100,
};
```

---

## 7. Inputs, Outputs, and Computational Behavior

### 7.1 Key Algorithm Choices

| Operation | Algorithm | Priority |
|-----------|-----------|----------|
| Point-in-polygon | Ray casting (horizontal ray) | MUST |
| Polygon area | Shoelace formula | MUST |
| Segment intersection | Parametric line intersection (t, u parameters) | MUST |
| Polygon overlap | Separating Axis Theorem (SAT) for convex; decompose for concave | MUST |
| Polygon containment | All vertices of inner inside outer + no edge intersections | MUST |
| Polygon adjacency | Check for shared edge segments (collinear overlapping edges) | MUST |
| Collision broad phase | AABB overlap check | MUST |
| Polygon offset | Parallel edge offset with corner handling | SHOULD |
| Snap to grid | Round to nearest multiple | MUST |

### 7.2 Edge Cases That MUST Be Handled

| Edge Case | Expected Behavior |
|-----------|-------------------|
| Zero-length segment | `segmentLength` returns 0; `segmentAngle` returns 0 |
| Degenerate polygon (< 3 points) | `isValidPolygon` returns false; `polygonArea` returns 0 |
| Collinear polygon points | `isValidPolygon` returns false (zero area) |
| Self-intersecting polygon | `isSelfIntersecting` returns true; `isValidPolygon` returns false |
| Point exactly on polygon edge | `pointInPolygon` returns true (boundary counts as inside) |
| Two polygons touching at a single point | `polygonsOverlap` returns false; `polygonsAdjacent` returns false |
| Two polygons sharing a full edge | `polygonsAdjacent` returns true; `polygonsOverlap` returns false |
| Polygon with duplicate consecutive points | Remove duplicates before processing |
| Very large coordinates (>10^8 mm) | Must not overflow (use standard double precision) |
| Negative coordinates | Valid — rooms can be at any position |

---

## 8. Performance Targets

| Operation | Target Time | Input Size |
|-----------|------------|-----------|
| `distance` | < 0.001ms | 2 points |
| `pointInPolygon` | < 0.01ms | 1 point, polygon with ≤20 vertices |
| `polygonArea` | < 0.01ms | polygon with ≤20 vertices |
| `polygonsOverlap` | < 0.1ms | 2 polygons with ≤8 vertices each |
| `detectFloorCollisions` | < 5ms | floor with 20 rooms |
| `generateWalls` | < 10ms | 20 rooms |
| `snapToGrid` | < 0.01ms | 1 point |
| `findAlignmentGuides` | < 1ms | 1 room among 20 |

MUST: Include a performance test file that asserts critical operations complete within 2× the target time (to allow CI variance).

---

## 9. Invariants

| ID | Invariant | Priority |
|----|-----------|----------|
| P3-INV-1 | All functions are pure (no side effects, no mutations) | MUST |
| P3-INV-2 | Same inputs always produce same outputs (deterministic) | MUST |
| P3-INV-3 | `polygonArea(rect)` equals `width × height` for axis-aligned rectangles | MUST |
| P3-INV-4 | `containsPolygon(A, B) && containsPolygon(B, A)` implies A equals B | MUST |
| P3-INV-5 | `polygonsOverlap(A, A)` is true for any valid polygon with area > 0 | MUST |
| P3-INV-6 | `distance(a, b) == distance(b, a)` (symmetry) | MUST |
| P3-INV-7 | `polygonArea` is always ≥ 0 (absolute value) | MUST |
| P3-INV-8 | `segmentIntersection` returns null for parallel non-overlapping segments | MUST |
| P3-INV-9 | `detectRoomCollisions` returns empty array when rooms don't overlap | MUST |
| P3-INV-10 | Collision detection with tolerance < OVERLAP threshold ignores rounding artifacts | MUST |
| P3-INV-11 | Unit conversion is exact: `feetToMm(30) === 9144` | MUST |
| P3-INV-12 | `createRect(x,y,w,h)` produces a polygon with exactly 4 points | MUST |

---

## 10. Error Handling

| Scenario | Behavior | Priority |
|----------|----------|----------|
| Polygon with < 3 points passed to area/containment | Return 0 for area; return false for containment | MUST |
| NaN/Infinity in coordinates | Early return with 0/false/null (no throw) | SHOULD |
| `segmentIntersection` with zero-length segment | Return null | MUST |
| `offsetPolygon` produces self-intersection | Return best-effort result; caller validates | SHOULD |
| Division by zero (parallel segments) | Return null/0 as appropriate | MUST |

MUST NOT: Geometry functions MUST NOT throw exceptions in normal operation. They return sentinel values (null, 0, false, empty array) for degenerate inputs.

MUST: Geometry functions MUST NOT log to console.

---

## 11. Unit Tests

### 11.1 Point Tests (`point.test.ts`)

| Test | Priority |
|------|----------|
| `distance` between (0,0) and (3000,4000) equals 5000 | MUST |
| `distance` between same point equals 0 | MUST |
| `distance` is symmetric | MUST |
| `midpoint` of (0,0) and (6000,4000) is (3000,2000) | MUST |
| `rotatePoint` 90° clockwise: (1000,0) → (0,1000) around origin | MUST |
| `rotatePoint` 360° returns original point (within tolerance) | MUST |
| `translatePoint` by (100, -200) | MUST |
| `pointOnSegment` true for midpoint of segment | MUST |
| `pointOnSegment` false for point off segment | MUST |
| `pointOnSegment` true for segment endpoints | MUST |
| `pointInPolygon` true for point clearly inside a square | MUST |
| `pointInPolygon` false for point clearly outside | MUST |
| `pointInPolygon` true for point on edge (boundary is inside) | MUST |
| `pointInPolygon` true for point at vertex | SHOULD |
| `pointsEqual` true within tolerance, false outside | MUST |

### 11.2 Segment Tests (`segment.test.ts`)

| Test | Priority |
|------|----------|
| `segmentLength` of horizontal segment (0,0)→(5000,0) equals 5000 | MUST |
| `segmentLength` of zero-length segment equals 0 | MUST |
| `segmentAngle` of rightward segment is 0° | MUST |
| `segmentAngle` of downward segment is 90° | MUST |
| `segmentIntersection` of crossing segments returns intersection point | MUST |
| `segmentIntersection` of parallel segments returns null | MUST |
| `segmentIntersection` of non-intersecting segments returns null | MUST |
| `segmentIntersection` at endpoint returns that endpoint | MUST |
| `pointToSegmentDistance` from (0,1000) to segment (0,0)→(5000,0) equals 1000 | MUST |
| `offsetSegment` produces parallel segment at correct distance | MUST |
| `segmentsParallel` true for horizontal segments at different Y | MUST |
| `segmentsCollinear` true for overlapping horizontal segments at same Y | MUST |
| `collinearOverlap` returns overlap segment for partially overlapping | MUST |
| `collinearOverlap` returns null for non-overlapping collinear segments | MUST |

### 11.3 Polygon Tests (`polygon.test.ts`)

| Test | Priority |
|------|----------|
| `polygonArea` of 3000×4000 rectangle equals 12,000,000 | MUST |
| `polygonArea` of triangle with known area | MUST |
| `polygonArea` of L-shaped polygon | MUST |
| `polygonArea` returns same value regardless of winding direction | MUST |
| `polygonArea` of degenerate polygon (< 3 points) returns 0 | MUST |
| `polygonPerimeter` of 3000×4000 rectangle equals 14,000 | MUST |
| `polygonCentroid` of rectangle is center point | MUST |
| `polygonBoundingBox` of rectangle equals its dimensions | MUST |
| `isConvex` true for rectangle | MUST |
| `isConvex` false for L-shape | MUST |
| `isValidPolygon` true for simple rectangle | MUST |
| `isValidPolygon` false for < 3 points | MUST |
| `isValidPolygon` false for self-intersecting (bowtie) | MUST |
| `containsPolygon` true when inner is fully inside outer | MUST |
| `containsPolygon` false when inner extends outside | MUST |
| `polygonsOverlap` true for overlapping rectangles | MUST |
| `polygonsOverlap` false for adjacent non-overlapping rectangles | MUST |
| `polygonsOverlap` false for overlap below tolerance | MUST |
| `polygonsAdjacent` true for rooms sharing a wall | MUST |
| `polygonsAdjacent` false for rooms with gap > tolerance | MUST |
| `sharedEdge` returns correct segment for adjacent rooms | MUST |
| `sharedEdge` returns null for non-adjacent rooms | MUST |
| `polygonEdges` returns N edges for N-vertex polygon | MUST |
| `isSelfIntersecting` detects bowtie polygon | MUST |
| `isSelfIntersecting` false for simple polygon | MUST |
| `offsetPolygon` inward reduces area | SHOULD |
| `offsetPolygon` outward increases area | SHOULD |

### 11.4 Rectangle Tests (`rectangle.test.ts`)

| Test | Priority |
|------|----------|
| `createRect` produces 4-point polygon at correct positions | MUST |
| `rectsOverlap` true for overlapping boxes | MUST |
| `rectsOverlap` false for adjacent boxes (touching edge) | MUST |
| `rectsOverlap` false for separated boxes | MUST |
| `rectContains` true when inner is fully inside | MUST |
| `rectContains` false when inner extends outside | MUST |
| `rectsAdjacent` true for boxes sharing an edge | MUST |
| `rectsAdjacent` true for boxes within tolerance gap | MUST |
| `rectsAdjacent` false for boxes with gap > tolerance | MUST |
| `snapRectToGrid` rounds to nearest grid position | MUST |
| `rectOverlapArea` returns correct area | MUST |
| `rectOverlapArea` returns 0 for non-overlapping | MUST |

### 11.5 Collision Tests (`collision.test.ts`)

| Test | Priority |
|------|----------|
| Two overlapping rooms detected as collision | MUST |
| Two adjacent non-overlapping rooms: no collision | MUST |
| Room fully inside boundary: no violation | MUST |
| Room partially outside boundary: violation detected | MUST |
| Room fully outside boundary: violation detected | MUST |
| 20-room floor with no collisions: empty result | MUST |
| `broadPhaseCollision` filters correctly (no false negatives) | MUST |
| Overlap below tolerance threshold: no collision | MUST |

### 11.6 Wall Generation Tests (`walls.test.ts`)

| Test | Priority |
|------|----------|
| External walls generated for rectangular floor boundary | MUST |
| External walls have correct thickness (230mm) | MUST |
| Internal wall generated between two adjacent rooms | MUST |
| Internal walls have correct thickness (150mm) | MUST |
| Collinear walls merged into single segment | MUST |
| `splitWallAtPoint` produces two segments with gap | MUST |
| Wall roomIds populated correctly | MUST |
| No duplicate walls for shared room edges | MUST |

### 11.7 Opening Placement Tests (`openings.test.ts`)

| Test | Priority |
|------|----------|
| Door placement valid at wall center | MUST |
| Door placement invalid too close to wall end | MUST |
| Door placement invalid wider than wall | MUST |
| Door swing arc is quarter-circle polygon | MUST |
| Door swing clear with no obstacles | MUST |
| Door swing blocked by adjacent wall | MUST |
| Window placement valid at wall center | MUST |
| `validDoorPositions` returns all legal positions | MUST |

---

## 12. Integration Tests

```typescript
// tests/integration/geometry-pipeline.test.ts

describe('Geometry Pipeline Integration', () => {
  it('generates walls for fixture 30x50-3bhk plan', () => {
    const building = loadFixture('30x50-3bhk');
    const floor = building.floors[0];
    const walls = generateWalls(floor.rooms, floor.boundary);
    expect(walls.length).toBeGreaterThan(0);
    // All walls inside floor boundary
    // No zero-length walls
    // External walls present
  });

  it('detects no collisions in valid fixture plans', () => {
    for (const fixture of ALL_VALID_FIXTURES) {
      const building = loadFixture(fixture);
      for (const floor of building.floors) {
        const collisions = detectFloorCollisions(floor);
        expect(collisions).toHaveLength(0);
      }
    }
  });

  it('detects collisions in invalid fixture plan', () => {
    const building = loadFixture('invalid-overlap');
    const collisions = detectFloorCollisions(building.floors[0]);
    expect(collisions.length).toBeGreaterThan(0);
  });

  it('all rooms contained within floor boundary in valid fixtures', () => {
    for (const fixture of ALL_VALID_FIXTURES) {
      const building = loadFixture(fixture);
      for (const floor of building.floors) {
        for (const room of floor.rooms) {
          expect(detectBoundaryViolation(room, floor.boundary)).toBe(false);
        }
      }
    }
  });
});
```

---

## 13. Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|-------------|
| P3-AC-1 | All point operation tests pass | `pnpm test` in geometry-engine |
| P3-AC-2 | All segment operation tests pass | Test runner |
| P3-AC-3 | All polygon operation tests pass | Test runner |
| P3-AC-4 | All collision detection tests pass | Test runner |
| P3-AC-5 | All wall generation tests pass | Test runner |
| P3-AC-6 | All opening placement tests pass | Test runner |
| P3-AC-7 | Integration tests pass with fixture plans | Test runner |
| P3-AC-8 | Performance test: `detectFloorCollisions` < 10ms for 20 rooms | Performance test |
| P3-AC-9 | Zero runtime dependencies | Verify package.json |
| P3-AC-10 | Coverage ≥ 95% for geometry-engine package | Coverage report |
| P3-AC-11 | `pnpm run typecheck` passes with zero errors | Run command |

---

## 14. Implementation Notes for Antigravity

1. **No external geometry libraries.** Implement all operations from scratch in TypeScript. This ensures zero dependencies, full control, and testability.

2. **Use the Shoelace formula for polygon area:**
   ```
   A = 0.5 * |Σ(x_i * y_(i+1) - x_(i+1) * y_i)|
   ```

3. **Use parametric intersection for segments:**
   ```
   t = ((x3-x1)(y3-y4) - (y3-y1)(x3-x4)) / ((x1-x2)(y3-y4) - (y1-y2)(x3-x4))
   u = ((x1-x2)(y3-y1) - (y1-y2)(x3-x1)) / ((x1-x2)(y3-y4) - (y1-y2)(x3-x4))
   Intersection exists when 0 ≤ t ≤ 1 and 0 ≤ u ≤ 1
   ```

4. **For `pointInPolygon`, use ray casting:**
   Cast a horizontal ray from the point to +∞. Count edge crossings. Odd count = inside.

5. **For `polygonsOverlap` with rectangles, use AABB fast-path first:**
   If bounding boxes don't overlap, polygons can't overlap. Then do SAT for exact check.

6. **For `containsPolygon`:**
   All points of inner must be in outer AND no edges of inner cross edges of outer.

7. **For `polygonsAdjacent`:**
   Find edges of A and edges of B that are collinear and have overlap length > tolerance.

8. **Import types from `@ai-floor-planner/core`.** The geometry engine MUST NOT redefine Point, Polygon, etc.

9. **Every function MUST be individually exported** (not just re-exported through a class).

10. **No classes.** Use plain functions. This enables tree-shaking and simpler testing.
