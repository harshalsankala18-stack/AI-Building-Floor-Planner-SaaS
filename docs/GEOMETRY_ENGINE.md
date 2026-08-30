# AI Floor Planner — Geometry Engine Specification & Documentation

## 1. Purpose & Core Principles

The Geometry Engine is a deterministic computational subsystem responsible for all geometric calculations in the AI Floor Planner platform.

It is strictly decoupled from:
- AI models (Gemini, GPT, Claude)
- Image generation pipelines
- Browser rendering engines (DOM, Canvas, WebGL, SVG rendering state)
- UI state and reactive frameworks

**Core Invariant:** Same input $\to$ Same output. All functions are pure, immutable, and free of side effects.

---

## 2. Coordinate System & Spatial Conventions

### 2.1 Canonical World Coordinate System
- **Origin $(0, 0)$**: Positioned at the North-West (top-left) corner of the plot.
- **X-Axis**: Increases to the East (right).
- **Y-Axis**: Increases to the South (downward).
- **Rotation Convention**: Angles are measured clockwise in degrees from North:
  - $0^\circ$: North
  - $90^\circ$: East
  - $180^\circ$: South
  - $270^\circ$: West
- **Standard Internal Unit**: Millimeters ($\text{mm}$) for all linear measurements; Square Millimeters ($\text{mm}^2$) for all area calculations.

### 2.2 Screen Coordinates Separation
Screen space coordinates (pixels) and viewport zoom/pan transforms (`ViewTransform`) are completely segregated from world geometry. The engine provides deterministic projection functions:
- `worldToScreen(worldPoint, transform): ScreenPoint`
- `screenToWorld(screenPoint, transform): Point`
- `worldRectToScreen(worldBounds, transform): { x, y, width, height }`
- `screenRectToWorld(screenRect, transform): BoundingBox`
- `fitBoundsToViewport(worldBounds, viewportWidth, viewportHeight, padding): ViewTransform`

---

## 3. Numerical Tolerances & Precision

To avoid floating-point rounding artifacts and indeterminate equality checks, all spatial operations adhere to explicit tolerances defined in `@ai-floor-planner/core`:

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Linear Tolerance** | $1\text{ mm}$ | Distance threshold for point coincidence, collinearity, and snapping |
| **Angular Tolerance** | $0.01^\circ$ | Angle threshold for parallelism and perpendicularity |
| **Area Tolerance** | $1\text{ mm}^2$ | Minimum threshold for non-degenerate polygons |
| **Adjacency Tolerance** | $5\text{ mm}$ | Maximum gap distance for walls/rooms to be considered adjacent/touching |
| **Overlap Tolerance** | $100\text{ mm}^2$ | Minimum area for an overlap to be classified as an architectural collision |
| **Epsilon** | $10^{-7}$ | Numerical determinant tolerance for division by zero guards |

---

## 4. Geometric Primitives & Core Math

### 4.1 Primitives
- **`Point`**: `{ x: number, y: number }`
- **`Vector2D`**: `{ dx: number, dy: number }`
- **`Line`**: Standard form $Ax + By + C = 0$ with normalized coefficients ($A^2 + B^2 = 1$).
- **`LineSegment`**: `{ start: Point, end: Point }`
- **`BoundingBox`**: `{ x: number, y: number, width: number, height: number }`
- **`Polygon`**: `{ points: readonly Point[] }` (Ordered vertex loop; last connects to first).
- **`Circle`**: `{ center: Point, radius: number }`
- **`Arc`**: `{ center: Point, radius: number, startAngle: number, endAngle: number }`

### 4.2 Vector Operations (`vector.ts`)
- `createVector`, `vectorFromPoints`
- `vectorAdd`, `vectorSubtract`, `vectorScale`, `vectorNegate`
- `vectorMagnitude`, `vectorMagnitudeSquared`, `vectorNormalize`
- `vectorDot`, `vectorCross` (2D scalar cross product / determinant)
- `vectorAngle`, `vectorAngleBetween`
- `vectorPerpendicular(v, orientation)` ('cw' or 'ccw')
- `vectorProject(u, v)`, `vectorsEqual`, `vectorsParallel`

### 4.3 Line & Segment Operations (`line.ts`, `segment.ts`)
- `lineFromPoints`, `lineFromSegment`, `signedDistanceToLine`, `distanceToLine`, `projectPointOntoLine`, `lineIntersection`, `areLinesParallel`
- `segmentLength`, `segmentAngle`, `segmentMidpoint`, `segmentBoundingBox`
- `segmentIntersection(a, b)`: Exact intersection handling crossing, T-junctions, endpoint touching, and collinear overlaps.
- `pointToSegmentDistance(p, seg)`: Exact perpendicular/clamped Euclidean distance.
- `segmentToSegmentDistance(a, b)`: Minimum distance between two finite segments.
- `offsetSegment(seg, dist, side)`: Parallel offset along left or right normal vectors.
- `splitSegmentAtPoint(seg, pt)`: Splits segment into two collinear sub-segments.

### 4.4 Rectangle & Bounding Box Operations (`rectangle.ts`)
- `createRect`, `createBoundingBox`, `rectToBoundingBox`
- `rectArea`, `rectPerimeter`, `rectCenter`
- `rectContains(outer, inner)`, `rectContainsPoint(rect, pt)`
- `rectsOverlap(a, b)`, `rectIntersection(a, b)`, `rectUnion(a, b)`
- `translateRect`, `scaleRect`, `rotateRect(rect, angle, origin)` (returns `Polygon`)
- `rectsAdjacent(a, b, tolerance)`
- `snapRectToGrid`, `snapPointToGrid`

### 4.5 Polygon Operations (`polygon.ts`)
- `polygonArea(poly)`: Shoelace formula returning non-negative area regardless of vertex winding.
- `polygonSignedArea(poly)`: Returns signed area (positive for CW in Y-down, negative for CCW).
- `polygonPerimeter(poly)`, `polygonCentroid(poly)`, `polygonBoundingBox(poly)`
- `isConvex(poly)`: Validates convexity via cross-product sign consistency.
- `isValidPolygon(poly)`: Validates $\ge 3$ vertices, non-self-intersection, non-zero area.
- `assertValidPolygon(poly)`: Throws `SelfIntersectionError` or `DegenerateGeometryError` on invalid geometry.
- `offsetPolygon(poly, dist)`: Inward/outward polygon buffer offsetting with miter bisector handling.
- `containsPolygon(outer, inner)`: Point-in-polygon containment check for all vertices.
- `polygonIntersectionArea(a, b)`: Sutherland-Hodgman convex polygon clipping.
- `polygonsOverlap(a, b)`, `polygonsAdjacent(a, b)`, `sharedEdge(a, b)`

---

## 5. Building Domain Model Geometry

### 5.1 Room Geometry (`room.ts`)
- `computeRoomGeometry(room: Room): RoomGeometryInfo`
  - Derives area, perimeter, centroid, bounding box, width, height from boundary polygon.
- `computeCarpetArea(room: Room, wallThickness: number): number`
  - Calculates net usable area factoring in interior wall boundaries.
- `computeInteriorPolygon(room: Room, wallThickness: number): Polygon`
- `validateRoomGeometry(room: Room)`: Ensures positive dimensions, valid boundary, and satisfaction of min/max area requirements.

### 5.2 Plot & Site Geometry (`plot.ts`)
- `createPlotBoundary(width, depth, origin): Polygon`
- `computeBuildingEnvelope(plotWidth, plotDepth, setbacks, origin, roadFacing): Polygon`
  - Computes usable buildable envelope by insetting plot boundaries according to `roadFacing` (North, South, East, West) and front/rear/left/right setbacks.
- `computePlotGeometry(site: Site): PlotGeometryInfo`
- `isRoomWithinPlot(room, plotBoundary)`, `isFloorWithinEnvelope(floor, envelope)`
- `validateSiteGeometry(site: Site)`

### 5.3 Wall Geometry (`walls.ts`)
- `wallToPolygon(wall: Wall): Polygon`
  - Produces real 2D thick polygon geometry from centerline segment + thickness.
- `wallLength(wall)`, `wallAngle(wall)`, `wallBoundingBox(wall)`
- `generateWalls(rooms, floorId, floorBoundary, config)`: Generates internal walls from adjacent room shared edges and external walls from floor boundaries.
- `generateExternalWalls(floorBoundary, floorId, thickness, rooms)`
- `mergeWalls(walls)`: Combines contiguous collinear wall segments and merges room associations.
- `splitWall(wall, position)`: Splits a wall segment at a given point (for inserting openings).
- `findWallIntersections(walls)`: Detects L-junctions, T-junctions, and X-junctions.
- `validateWall(wall)`

### 5.4 Door Geometry (`doors.ts`)
- `validateDoorPlacement(door, hostWall, minEdgeDistance)`: Validates that door position is on the host wall, door width fits wall length, and corner lintel clearances are maintained.
- `computeDoorOpeningSegment(door, hostWall)`: Computes opening line segment on wall centerline.
- `computeDoorSwingPolygon(door, hostWall, segments)`: Computes the 90-degree fan polygon clearance envelope for hinged doors or corridor rectangle for sliding/folding doors.
- `isDoorSwingClear(door, hostWall, obstacles)`: Validates that door swing arc does not collide with interior obstacles.
- `findValidDoorPositions(wall, doorWidth, minEdgeDistance, stepSize)`

### 5.5 Window Geometry (`windows.ts`)
- `validateWindowPlacement(window, hostWall, minEdgeDistance, allowInternal)`: Validates placement on external walls and checks edge clearances.
- `computeWindowOpeningSegment(window, hostWall)`: Computes window opening segment.
- `computeWindowGlazingPolygon(window, hostWall)`: Computes glazing and sill thickness polygon.
- `findValidWindowPositions(wall, windowWidth, minEdgeDistance, stepSize)`

### 5.6 Staircase Geometry (`stairs.ts`)
- `computeStairGeometry(stair: Stair): StairGeometryInfo`
  - Computes stair boundary, bounding box, landing region, and center walkline segment.
- `computeStairClearanceEnvelope(stair: Stair): Polygon`
- `validateStairDimensions(stair: Stair): StairValidationResult`
  - Validates stair dimensions against National Building Code (NBC / IBC):
    - Riser height ($100\text{ mm} \le R \le 200\text{ mm}$)
    - Tread depth ($T \ge 230\text{ mm}$)
    - Minimum flight width ($W \ge 800\text{ mm}$, $900\text{ mm}+$ recommended)
    - Blondel's ergonomic formula ($580\text{ mm} \le 2R + T \le 680\text{ mm}$)
    - Landing width $\ge$ flight width

---

## 6. Spatial Indexing (`spatial-index/`)

Provides a clean interface for spatial indexing and bounding-box queries:
- **`ISpatialIndex<T>`**:
  - `insert(item: T, bounds: BoundingBox): void`
  - `remove(item: T): boolean`
  - `search(queryBounds: BoundingBox): T[]`
  - `clear(): void`
  - `size(): number`
- **`SimpleSpatialIndex<T>`**: Lightweight, deterministic array-backed index for small item sets ($N < 50$).
- **`GridSpatialIndex<T>`**: Uniform 2D grid partition index for medium-to-large floor plans, achieving sub-linear query times.

---

## 7. Unit System & Conversions (`units.ts`)

Canonical internal unit is **millimeters ($\text{mm}$)** and **square millimeters ($\text{mm}^2$)**.

### Supported Conversions
- **Linear**: mm, cm, m, inches, feet, yards.
- **Area**: $\text{sq mm}$, $\text{sq m}$, $\text{sq ft}$, $\text{sq yd}$, acres, cents, gunthas ($1\text{ Cent} = 435.6\text{ sq ft}$, $1\text{ Guntha} = 1089\text{ sq ft}$, $1\text{ Acre} = 43560\text{ sq ft}$).
- **Parsers**: `parseLength("10'-6\"")`, `parseLength("3.5m")`, `parseArea("1500 sq ft")`, `parseArea("2 cents")`.
- **Formatters**: `formatFeet(mm)`, `formatFeetInches(mm)`, `formatMeters(mm)`, `formatSqFt(sqMm)`, `formatSqM(sqMm)`.

---

## 8. Error Handling (`errors.ts`)

Strongly-typed error hierarchy thrown upon encountering invalid or degenerate geometry:
- `GeometryError` (Base class)
- `InvalidCoordinateError` (Non-finite / NaN coordinates)
- `DegenerateGeometryError` (Zero-length vectors/segments, zero-area polygons)
- `OutOfBoundsError` (Elements exceeding boundaries)
- `WallPlacementError` (Invalid door/window placement)
- `SelfIntersectionError` (Self-intersecting polygons)

---

## 9. Visual Debugging Mode (`debug.ts`)

Development-only utility `GeometryDebugCollector` allows aggregating points, segments, polygons, bounding boxes, wall centerlines, thick walls, door swing arcs, and collision regions, with standalone SVG export (`collector.toSVG()`) for fast visual verification without frontend overhead.

---

## 10. Verification & Test Suite

The test suite in `packages/geometry-engine/src/__tests__/geometry.test.ts` provides comprehensive coverage:
- 65 unit and integration test cases across all modules
- 100% pass rate
- Verified against monorepo build and typecheck suites
