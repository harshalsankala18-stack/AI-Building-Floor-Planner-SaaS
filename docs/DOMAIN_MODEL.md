# AI Floor Planner — Domain Model

## 1. Overview

The Building Model is the canonical source of truth for all floor plan data. Every component has a stable unique ID. The rendered SVG is a projection of this model — never the other way around.

---

## 2. Entity Hierarchy

```
Building
├── Site
│   ├── plotBoundary (polygon)
│   ├── orientation (north direction)
│   ├── setbacks
│   └── accessPoints
├── Metadata
│   ├── projectId
│   ├── clientInfo
│   ├── createdAt
│   └── modifiedAt
└── Floors[]
    ├── Rooms[]
    ├── Walls[]
    ├── Doors[]
    ├── Windows[]
    ├── Stairs[]
    ├── Columns[]
    └── Annotations[]
```

---

## 3. Core Entities

### 3.1 Building

The root entity containing all plan data.

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Stable unique identifier |
| projectId | string | Reference to parent project |
| name | string | Building name |
| site | Site | Plot and site information |
| floors | Floor[] | Ordered list of floors |
| metadata | BuildingMetadata | Project metadata |
| version | number | Current version number |
| createdAt | ISO datetime | Creation timestamp |
| updatedAt | ISO datetime | Last modification |

### 3.2 Site

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Stable unique identifier |
| plotBoundary | Polygon | Outer boundary of the plot |
| plotWidth | number (mm) | Plot width in millimeters |
| plotDepth | number (mm) | Plot depth in millimeters |
| plotArea | number (sq mm) | Computed plot area |
| orientation | number (degrees) | North direction (0-360) |
| setbacks | Setbacks | Required setbacks from boundaries |
| accessPoints | AccessPoint[] | Entry/exit points from road |
| roadFacing | Direction | Which side faces the road |

### 3.3 Setbacks

| Field | Type | Description |
|-------|------|-------------|
| front | number (mm) | Front setback |
| rear | number (mm) | Rear setback |
| left | number (mm) | Left setback |
| right | number (mm) | Right setback |

### 3.4 Floor

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Stable unique identifier |
| buildingId | string | Parent building reference |
| level | number | Floor level (0 = ground) |
| name | string | Display name (e.g., "Ground Floor") |
| floorHeight | number (mm) | Floor-to-floor height |
| boundary | Polygon | Outer boundary of this floor |
| rooms | Room[] | Rooms on this floor |
| walls | Wall[] | Walls on this floor |
| doors | Door[] | Doors on this floor |
| windows | Window[] | Windows on this floor |
| stairs | Stair[] | Staircases on this floor |
| columns | Column[] | Structural columns |

### 3.5 Room

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Stable unique identifier |
| floorId | string | Parent floor reference |
| type | RoomType | Enum: bedroom, bathroom, kitchen, etc. |
| name | string | Display label |
| boundary | Polygon | Room boundary polygon |
| x | number (mm) | Position X (top-left corner for rect) |
| y | number (mm) | Position Y (top-left corner for rect) |
| width | number (mm) | Room width |
| height | number (mm) | Room depth |
| rotation | number (degrees) | Rotation angle |
| area | number (sq mm) | Computed area |
| minArea | number (sq mm) | Minimum acceptable area |
| maxArea | number (sq mm) | Maximum acceptable area |
| priority | number (1-10) | Room priority for placement |
| tags | string[] | Flexible categorization |
| adjacencyRequirements | AdjacencyReq[] | Which rooms should be adjacent |
| daylightRequirement | DaylightLevel | none, low, medium, high |
| privacyRequirement | PrivacyLevel | none, low, medium, high |
| ventilationRequired | boolean | Requires external wall access |
| isFixed | boolean | Cannot be moved by optimizer |

### 3.6 RoomType (Enum)

```
bedroom
bathroom
kitchen
living
dining
utility
balcony
staircase
parking
pooja
storage
corridor
foyer
study
servant_quarter
drawing
family_living
terrace
garden
custom
```

### 3.7 Wall

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Stable unique identifier |
| floorId | string | Parent floor reference |
| startPoint | Point | Wall start coordinate |
| endPoint | Point | Wall end coordinate |
| thickness | number (mm) | Wall thickness (default: 150mm/230mm) |
| type | WallType | external, internal, partition |
| material | string | Brick, RCC, etc. |
| roomIds | string[] | Rooms this wall bounds |
| hasOpening | boolean | Contains door/window |
| loadBearing | boolean | Is load-bearing |

### 3.8 Door

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Stable unique identifier |
| floorId | string | Parent floor reference |
| wallId | string | Wall this door is placed in |
| position | Point | Center position on wall |
| width | number (mm) | Door width |
| height | number (mm) | Door height |
| type | DoorType | single, double, sliding, folding |
| swingDirection | SwingDirection | inward, outward, left, right |
| connectsRooms | [string, string] | IDs of rooms this door connects |

### 3.9 Window

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Stable unique identifier |
| floorId | string | Parent floor reference |
| wallId | string | Wall this window is placed in |
| position | Point | Center position on wall |
| width | number (mm) | Window width |
| height | number (mm) | Window height |
| sillHeight | number (mm) | Height of sill from floor |
| type | WindowType | fixed, sliding, casement, ventilator |
| roomId | string | Room this window belongs to |

### 3.10 Stair

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Stable unique identifier |
| floorId | string | Parent floor reference |
| type | StairType | straight, L_shaped, U_shaped, spiral |
| boundary | Polygon | Stair boundary |
| x | number (mm) | Position X |
| y | number (mm) | Position Y |
| width | number (mm) | Stair width |
| length | number (mm) | Stair length |
| direction | Direction | Up direction |
| riserCount | number | Number of risers |
| riserHeight | number (mm) | Individual riser height |
| treadDepth | number (mm) | Tread depth |
| landingWidth | number (mm) | Landing dimensions |
| connectsFloors | [number, number] | Floor levels connected |

### 3.11 Column

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Stable unique identifier |
| floorId | string | Parent floor reference |
| position | Point | Center point |
| width | number (mm) | Column width |
| depth | number (mm) | Column depth |
| shape | ColumnShape | rectangular, circular |
| isStructural | boolean | Part of structural grid |
| gridReference | string | Optional grid reference (e.g., "A1") |

---

## 4. Geometric Primitives

### 4.1 Point

| Field | Type | Description |
|-------|------|-------------|
| x | number (mm) | X coordinate |
| y | number (mm) | Y coordinate |

### 4.2 Polygon

| Field | Type | Description |
|-------|------|-------------|
| points | Point[] | Ordered vertices (closed polygon) |

### 4.3 LineSegment

| Field | Type | Description |
|-------|------|-------------|
| start | Point | Start point |
| end | Point | End point |

### 4.4 BoundingBox

| Field | Type | Description |
|-------|------|-------------|
| x | number (mm) | Top-left X |
| y | number (mm) | Top-left Y |
| width | number (mm) | Width |
| height | number (mm) | Height |

---

## 5. Constraint & Preference Types

### 5.1 AdjacencyRequirement

| Field | Type | Description |
|-------|------|-------------|
| targetRoomType | RoomType | Must be adjacent to this type |
| strength | AdjacencyStrength | required, preferred, avoid |

### 5.2 Enums

```typescript
enum DaylightLevel { none, low, medium, high }
enum PrivacyLevel { none, low, medium, high }
enum AdjacencyStrength { required, preferred, avoid }
enum Direction { north, south, east, west }
enum WallType { external, internal, partition }
enum DoorType { single, double, sliding, folding }
enum WindowType { fixed, sliding, casement, ventilator }
enum StairType { straight, L_shaped, U_shaped, spiral }
enum ColumnShape { rectangular, circular }
enum SwingDirection { inward, outward, left, right }
```

---

## 6. Project & Versioning

### 6.1 Project

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Stable unique identifier |
| userId | string | Owner reference |
| organizationId | string | Optional org reference |
| name | string | Project name |
| description | string | Optional description |
| clientName | string | Client/owner name |
| status | ProjectStatus | draft, active, completed, archived |
| buildings | Building[] | Buildings in this project |
| createdAt | ISO datetime | Creation timestamp |
| updatedAt | ISO datetime | Last modification |

### 6.2 PlanVersion

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Version identifier |
| buildingId | string | Parent building reference |
| versionNumber | number | Sequential version number |
| snapshot | Building | Complete building state at this version |
| changeDescription | string | What changed |
| changeSource | ChangeSource | manual, ai_edit, generation |
| createdAt | ISO datetime | When version was created |
| createdBy | string | User or system reference |

---

## 7. AI Communication Types

### 7.1 UserRequirements

| Field | Type | Description |
|-------|------|-------------|
| plotWidth | number (mm) | Plot width |
| plotDepth | number (mm) | Plot depth |
| plotShape | PlotShape | rectangular, L_shaped, irregular |
| floors | number | Number of floors |
| rooms | RoomRequirement[] | Required rooms |
| preferences | DesignPreferences | User preferences |

### 7.2 RoomRequirement

| Field | Type | Description |
|-------|------|-------------|
| type | RoomType | Room type |
| count | number | How many |
| minArea | number (sq mm) | Optional minimum area |
| maxArea | number (sq mm) | Optional maximum area |
| floor | number | Preferred floor level |
| priority | number (1-10) | Importance |
| notes | string | Free-text notes |

### 7.3 DesignPreferences

| Field | Type | Description |
|-------|------|-------------|
| vastuCompliance | boolean | Vastu preference |
| naturalLight | PreferenceLevel | Light preference |
| privacy | PreferenceLevel | Privacy level |
| circulationEfficiency | PreferenceLevel | Corridor minimization |
| gardenPreference | boolean | Open space preference |
| parkingRequired | boolean | Parking needed |
| servantQuarter | boolean | Servant quarter needed |

---

## 8. Measurement Convention

All dimensions are stored in **millimeters (mm)** internally.

Display conversion:
- 1 foot = 304.8 mm
- 1 meter = 1000 mm
- 1 inch = 25.4 mm

Area stored in square millimeters. Display in sq ft or sq m based on user preference.

---

## 9. ID Generation

All entity IDs are UUID v4 strings. IDs are:
- Globally unique
- Stable across versions (same room keeps same ID even after edits)
- Never reused after deletion
- Generated at entity creation time

---

## 10. Invariants

1. Every room must be contained within its floor boundary.
2. Every floor boundary must be contained within (or equal to) the site plot boundary minus setbacks.
3. No two rooms on the same floor may overlap (except where explicitly allowed, e.g., balcony overhangs).
4. Every wall segment must bound at least one room.
5. Every door must be placed on a wall.
6. Every window must be placed on a wall.
7. Stair geometry must connect exactly two consecutive floors.
8. Room area must equal the computed area of its boundary polygon.
9. The Building Model must be serializable to JSON and deserializable without data loss.
