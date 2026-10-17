# MASTER PRD v2.0: VASTUGRID AI — INDIAN APARTMENT CAD & 3D BIM ENGINE
**Architecture:** Deterministic TypeScript Monorepo (`@ai-floor-planner/*`) + ArchLang Compiler Integration  
**Target Domain:** Multi-Unit & Individual Indian Residential Apartments (`1BHK`, `2BHK`, `3BHK`, `4BHK`)  
**Compliance Standards:** National Building Code of India (NBC 2016), RERA Carpet Area Norms, 16-Zone Angular Centroid MahaVastu  
**Current Benchmark:** 4 Distinct Multi-Unit Stepped CAD Candidates Generated in `~63ms` (`$0` API Cost, Zero Raster Image Dependency)

---

## 1. EXECUTIVE SUMMARY & ARCHITECTURAL SHIFT

### 1.1 Product Vision
VastuGrid AI is a deterministic, code-first 2D CAD and 3D BIM floor planner engineered specifically for Indian apartments. Instead of relying on slow, hallucination-prone diffusion image models (FLUX / Pollinations / Midjourney) that draw unusable square boxes, VastuGrid AI uses a **Deterministic Geometric Constraint Solver + ArchLang Compiler + Parametric 3D Extrusion Engine** to generate structurally sound, NBC 2016-legal, and Vastu-optimized apartment layouts in under 100 milliseconds.

### 1.2 Monorepo Package Map (`@ai-floor-planner/*`)
1. `@ai-floor-planner/core`: Canonical `Building`, `Floor`, `Room`, `Wall`, `Door`, `Window`, `Site`, and editor command models.
2. `@ai-floor-planner/geometry-engine`: Polygon math, Shoelace area/centroid calculations, segments, snapping, and collision detection.
3. `@ai-floor-planner/constraint-engine`: Hard & soft validators (`nbc2016.ts`, `regulatory-provider.ts`, `vastu-provider.ts`).
4. `@ai-floor-planner/planning-engine`: Spatial graph builders, orthogonal decomposition, and the 16-zone Vastu optimizer (`vastu/optimizer.ts`).
5. `@ai-floor-planner/ai-orchestration`: Apartment typology allocators (`typologies.ts`), stepped polygon solver (`polygon-layout.ts`, `layout-planner.ts`), schematic generator (`schematic.ts`), domain adapter (`adapter.ts`), and ArchLang compiler (`archlang-compiler.ts`).
6. `@ai-floor-planner/renderer`: 2D SVG CAD renderer (`svg-renderer.ts`), double-line wall Poché, Vastu Chakra overlay, and Indian CAD furniture blocks (`reference-furniture.ts`).
7. `@ai-floor-planner/projection-3d`: Parametric 2D-to-3D BIM extrusion (`project-building.ts`) for walls, slabs, OTS shafts, openings, and balconies.
8. `@ai-floor-planner/backend`: HTTP API server (`server.ts`) and `GenerationOrchestrator` running in `DETERMINISTIC_CAD_FIRST` mode.
9. `@ai-floor-planner/frontend`: React + Vite + Three.js Studio UI (`StudioShell.tsx`), interactive 2D CAD canvas, 3D Dollhouse/Walkthrough viewer, and CAD exporters (`advanced-export.ts`).

---

## 2. CURRENT PROGRESS AUDIT (WHAT IS DONE vs. WHAT REMAINS)

### 2.1 COMPLETED & VERIFIED (Phases 1 & 2 — DONE)
* **[DONE] Phase 1: Non-Square Stepped Orthogonal Polygon Engine & NBC 2016 Rules**
  * `packages/ai-orchestration/src/apartment/polygon-layout.ts`: Generates $\ge 6$-vertex CCW stepped orthogonal polygons (`steppedPolygon`), carves `1200mm x 1500mm` Open-to-Sky plumbing/ventilation shafts (`otsShafts`) excluded from RERA carpet area, and projects `1200mm–1500mm` cantilevered sit-out balconies (`balconies`) strictly on `openFacades`.
  * `typologies.ts` & `layout-planner.ts`: Enforces the 3-tier Indian apartment privacy hierarchy (`PUBLIC`: Entrance Foyer $\rightarrow$ Living $\rightarrow$ Sit-Out Balcony + Puja Alcove; `SEMI_PRIVATE`: Central Brahmasthana Dining Spine $\rightarrow$ Kitchen $\rightarrow$ Attached Dry Utility Balcony; `PRIVATE`: `1000mm` Common Passage $\rightarrow$ Master Suite in SW + Secondary Bedrooms + Back-to-Back Clustered Toilets on OTS shafts).
  * `packages/constraint-engine/src/constraints/hard/nbc2016.ts` & `regulatory-provider.ts`: Enforces NBC 2016 minimum room widths, areas, max `1:1.8` aspect ratios, habitable facade window access, and bathroom OTS shaft ventilation.
* **[DONE] Phase 2: Instant `DETERMINISTIC_CAD_FIRST` Pipeline (63ms Benchmark)**
  * `packages/backend/src/services/generation-orchestrator.ts` & `env.ts`: Bypasses external raster image APIs (`deterministicCadFirst = true`). Generates 4 distinct architectural candidates (`SYMMETRIC_CORE`, `STEPPED_L_COURT`, `VASTU_OPTIMIZED`, `CORRIDOR_HUGGING`) in `~63ms`.
  * `packages/ai-orchestration/src/apartment/adapter.ts`: Translates `DeterministicApartmentSchematic` into full `@ai-floor-planner/core` `Building` entities (30 rooms, 104 walls with `200mm` exterior / `100mm` interior thicknesses, 28 doors, and 6 windows restricted strictly to `openFacades` and `otsShafts`).
  * `packages/frontend/src/components/StudioShell.tsx`: Auto-applies the primary deterministic candidate into the live editor store upon generation.

---

### 2.2 WHAT REMAINS TO BE BUILT (Phases 3, 4, and 5 — NEXT)
* **[TODO] Phase 3: 16-Zone Angular Centroid "Flat Vastu" Engine & Live Chakra Overlay**
  * Replace basic cardinal tags (`NE`, `SE`, `SW`, `NW`) with true Shoelace polygon centroid math $(C_x, C_y)$, 16 angular MahaVastu wedges (`22.5°` each), a `0–100` weighted Vastu scorecard per flat, hard NE/SW wet-room blocks, and an interactive 16-Zone Vastu Chakra SVG overlay + UI score badges.
* **[TODO] Phase 4: ArchLang Compiler Integration (`.arch` / `.dxf` / `.pdf`) & Double-Line 2D CAD Post-Processor**
  * Integrate **ArchLang** (`compileApartmentToArchLang` + AutoCAD `.DXF` layered export + `.PDF`/`.SVG` sheets).
  * Upgrade the 2D CAD renderer (`svg-renderer.ts` & `structural-representation.ts`) to draw true double-line hatched walls (`200mm` outer, `100mm` inner), flush `230mm x 450mm` RCC structural columns at grid intersections, corner-snapped doors with 90° swing arcs, glazed window symbols on open facades, `Feet-Inches` labels (`12'-0" x 14'-6"`), and scaled Indian 2D CAD furniture blocks.
* **[TODO] Phase 5: Parametric 3D Stepped BIM Extrusion & Indian Sun-Path Daylight Simulator**
  * Upgrade `packages/projection-3d/src/project-building.ts` and the Frontend 3D viewer to extrude non-rectangular `steppedPolygon` slabs/walls (`2900mm` height), cut vertical OTS shafts through slabs, boolean-cut doors (`0–2100mm`) and windows (`900–2100mm`), add cantilevered glass balcony railings, render procedural 3D furniture, and add an interactive **Indian Sun-Path Slider (6:00 AM – 6:30 PM)**.

---

## 3. ARCHITECTURAL & GEOMETRIC SPECIFICATIONS (REFERENCE FOR AI AGENT)

### 3.1 Spatial Topology & 3-Tier Indian Apartment Privacy Hierarchy
```text
                        [OPEN FACADE: NORTH / EAST]
              +---------------------------------------------+
              |     Projecting Sit-Out Balcony (1.5m)       |
+-------------+------------------------------+--------------+-------------+
|             |                              |   Puja (NE)  |  Dry Util   |
|  Bedroom 2  |        Living Room           |   (3' x 4')  |  (4' x 6')  |
|  (NW Zone)  |        (Public Tier)         +--------------+-------------+
|  10' x 12'  |                              |                            |
+------+------+-------+----------------------+       Kitchen (SE)         |
|      |  Common Bath |                      |       (Agni Zone)          |
| OTS  |  (5' x 8')   |     Dining Spine     |        8' x 10'            |
|Shaft +--------------+    (Brahmasthana)    +--------------+-------------+
|4'x5' |  Attach Bath |   (Column-Free Zone)                |   Entrance  |
|      |  (5' x 8')   |                                     |    Foyer    |
+------+------+-------+----------------------+--------------+   (4' x 5') |
|             |   Wardrobe Niche (2' deep)   |              +------+------+
|             +------------------------------+                     ^
|               Master Bedroom (SW Zone)     |                [Main Door]
|                    12'-0" x 14'-6"         |              (Corridor Side)
+--------------------------------------------+
```

### 3.2 NBC 2016 Hard Dimension & Exposure Matrix
| Room Type | Min Area (NBC) | Min Width (NBC) | Standard Indian Size | Max Aspect Ratio | Mandatory Facade / Shaft Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Entrance Foyer** | 1.8 sq.m | 1.2 m | `1200mm x 1500mm (4'x5')` | 1 : 1.5 | Connects to `corridorSide`; prevents direct view into Living/Dining. |
| **Living + Dining** | 15.0 sq.m | 3.0 m | `3600mm x 6000mm (12'x20')`| 1 : 1.8 | Touches `openFacade` + connects to Sit-Out Balcony. |
| **Master Bedroom** | 9.5 sq.m | 2.75 m | `3600mm x 4200mm (12'x14')`| 1 : 1.8 | Touches `openFacade` + Attached Bath + `600mm` wardrobe niche. |
| **Secondary Bedroom**| 7.5 sq.m | 2.4 m | `3000mm x 3600mm (10'x12')`| 1 : 1.8 | Touches `openFacade` for external window. |
| **Kitchen** | 5.0 sq.m | 1.8 m | `2400mm x 3000mm (8'x10')` | 1 : 1.8 | Connects to Dining + Attached `Dry Utility Balcony (1200x1800mm)`. |
| **Bathroom / WC** | 2.8 sq.m | 1.2 m | `1500mm x 2400mm (5'x8')` | 1 : 1.8 | Must touch `openFacade` OR `otsShaft (1200x1500mm)`. Clustered wet walls. |
| **Puja Alcove** | 1.0 sq.m | 0.9 m | `900mm x 1200mm (3'x4')` | 1 : 1.5 | Placed in `NE / E / N`; ZERO shared walls with any Bathroom/WC. |

---

## 4. DETAILED ENGINEERING SPECS FOR REMAINING PHASES (PHASES 3, 4, & 5)

### PHASE 3 SPECIFICATION: 16-Zone Angular Centroid "Flat Vastu" Engine
**Target Files:**
* `packages/planning-engine/src/vastu/optimizer.ts`
* `packages/constraint-engine/src/providers/vastu-provider.ts`
* `packages/ai-orchestration/src/apartment/layout-planner.ts`
* `packages/ai-orchestration/src/apartment/schematic.ts`
* `packages/renderer/src/svg-renderer.ts`
* `packages/frontend/src/components/StudioShell.tsx`

#### 4.1 Mathematical Formulation
1. **True Polygon Centroid (`Brahmasthana`) via Shoelace Formula:**
   Given a unit's `steppedPolygon` vertices $(x_0, y_0), \dots, (x_{n-1}, y_{n-1})$ (excluding `otsShafts` and cantilevered `balconies`):
   $$A = \frac{1}{2} \sum_{i=0}^{n-1} (x_i y_{i+1} - x_{i+1} y_i)$$
   $$C_x = \frac{1}{6A} \sum_{i=0}^{n-1} (x_i + x_{i+1})(x_i y_{i+1} - x_{i+1} y_i), \quad C_y = \frac{1}{6A} \sum_{i=0}^{n-1} (y_i + y_{i+1})(x_i y_{i+1} - x_{i+1} y_i)$$
2. **16 MahaVastu Angular Wedges (`22.5°` per Zone):**
   For any room centroid $(R_x, R_y)$, compute the compass bearing $\theta \in [0^\circ, 360^\circ)$ clockwise from True North (adjusted by `northAngleDeg`):
   - `N`: $[348.75^\circ, 11.25^\circ)$ | `NNE`: $[11.25^\circ, 33.75^\circ)$ | `NE`: $[33.75^\circ, 56.25^\circ)$ | `ENE`: $[56.25^\circ, 78.75^\circ)$
   - `E`: $[78.75^\circ, 101.25^\circ)$ | `ESE`: $[101.25^\circ, 123.75^\circ)$ | `SE`: $[123.75^\circ, 146.25^\circ)$ | `SSE`: $[146.25^\circ, 168.75^\circ)$
   - `S`: $[168.75^\circ, 191.25^\circ)$ | `SSW`: $[191.25^\circ, 213.75^\circ)$ | `SW`: $[213.75^\circ, 236.25^\circ)$ | `WSW`: $[236.25^\circ, 258.75^\circ)$
   - `W`: $[258.75^\circ, 281.25^\circ)$ | `WNW`: $[281.25^\circ, 303.75^\circ)$ | `NW`: $[303.75^\circ, 326.25^\circ)$ | `NNW`: $[326.25^\circ, 348.75^\circ)$
3. **Weighted 0–100 Vastu Scorecard:**
   - **Kitchen (25 pts):** `SE / SSE` = 25 (`IDEAL`), `NW / E` = 18 (`ACCEPTABLE`), `NE / SW` = 0 (`DEFECT` — Hard Violation).
   - **Master Bedroom (25 pts):** `SW` = 25 (`IDEAL`), `S / W / SSW / WSW` = 20 (`ACCEPTABLE`), `NE / SE` = 0 (`DEFECT`).
   - **Bathrooms & OTS Shafts (15 pts):** `WNW / NW / SSE / W / S` = 15 (`IDEAL`), `NE / NNE / ENE / SW` = 0 (`DEFECT` — Hard Violation).
   - **Puja Alcove (10 pts):** `NE / N / E` + no shared wall with Bathroom = 10 (`IDEAL`).
   - **Living Room & Balcony (15 pts):** `N / NE / E` = 15 (`IDEAL`), `NW / SE` = 10 (`ACCEPTABLE`).
   - **Main Entrance Foyer & Brahmasthana (10 pts):** Foyer in auspicious entrance zone (5 pts) + Centroid $(C_x, C_y)$ inside open Living/Dining zone free of toilets/columns (5 pts).

---

### PHASE 4 SPECIFICATION: ArchLang Compiler + Double-Line 2D CAD Post-Processor
**Target Files:**
* `packages/ai-orchestration/src/apartment/archlang-compiler.ts` (New)
* `packages/ai-orchestration/src/apartment/structural-representation.ts`
* `packages/renderer/src/svg-renderer.ts`
* `packages/renderer/src/reference-furniture.ts`
* `packages/frontend/src/services/advanced-export.ts`

#### 4.2 ArchLang & CAD Blueprint Deliverables
1. **ArchLang DSL & Multi-Format CAD Compiler (`archlang-compiler.ts`):**
   - Compile `DeterministicApartmentSchematic` / `Building` into:
     - **`.arch` DSL script:** Declarative, human-readable text format defining grid, stepped polygon envelopes, rooms, walls, columns, openings, and Vastu annotations.
     - **AutoCAD `.DXF` (R2000 ASCII format):** Separated into standard architectural CAD layers (`A-WALL-EXT`, `A-WALL-INT`, `S-COLS`, `A-DOOR`, `A-GLAZ`, `A-FURN`, `A-SHFT-OTS`, `A-VASTU`, `A-ANNO-DIMS`).
     - **Vector `.SVG` & `.PDF` Presentation Sheet:** High-resolution blueprint with Title Block, RERA Carpet Area vs. Built-Up Area schedule, and Vastu Scorecard table.
   - Include a geometric linter (`lintApartmentGeometry()`) verifying zero wall self-intersections, zero unventilated rooms, and zero door-swing collisions.
2. **Double-Line CAD Walls, RCC Columns, Doors, Windows & Indian Furniture (`svg-renderer.ts`):**
   - **Walls:** `200mm` exterior/corridor double-line walls with diagonal Poché hatch; `100mm` interior partition walls (`150mm` plumbing walls).
   - **RCC Columns:** `230mm x 450mm` solid hatched structural columns placed at primary orthogonal intersections (`3.0m–4.5m` spans), rotated flush inside wall thicknesses.
   - **Doors:** Corner-snapped (`100mm` jamb offset) with 90° quarter-circle swing arcs (`1050mm` Main Door, `900mm` Bedroom, `750mm` Bath/Utility).
   - **Windows:** Multi-line glazed window symbols (`1500mm–1800mm`) strictly on `openFacades`, `600mm` ventilators on `otsShafts`, and 3-track sliding doors (`1800mm–2400mm`) to balconies.
   - **2D CAD Furniture Blocks (`reference-furniture.ts`):** Vector SVG blocks for King/Queen beds (headboard South/West), `600mm` hatched flush wardrobes, L-sofa + TV console, 6-seater dining table, common wash basin niche, L-shaped kitchen counter with NE sink + SE hob, washing machine in Dry Utility, and dry-to-wet bathroom fixtures (Basin $\rightarrow$ N-S WC $\rightarrow$ Glass Shower stall).

---

### PHASE 5 SPECIFICATION: Parametric 3D Stepped BIM Extrusion & Indian Sun-Path
**Target Files:**
* `packages/projection-3d/src/project-building.ts`
* `packages/frontend/src/components/model-3d/projection-shape.ts`
* `packages/frontend/src/components/StudioShell.tsx`

#### 4.3 3D BIM & Daylight Requirements
1. **Stepped Slab & Wall Extrusion (`project-building.ts`):**
   - Extrude floor slabs (`150mm` thick) following the exact non-rectangular `steppedPolygon` perimeter with boolean vertical cutouts for `otsShafts` (`1200mm x 1500mm`).
   - Extrude `200mm` exterior walls and `100mm` interior walls to `2900mm` height with accurate segmented cutouts for Doors (`0–2100mm`), Windows (`900–2100mm`), Ventilators (`1800–2100mm`), and Balcony Sliders (`0–2100mm`).
   - Render cantilevered Sit-Out and Dry Utility Balconies with `1050mm` glass/railing parapets.
2. **Floor Materials & 3D Furniture Volumes:**
   - Distinct materials: Vitrified marble tiles (Living/Dining/Kitchen/Passage), Oak wood planks (Master Bedroom), Anti-skid matte ceramic with `25mm` sunken drop (Bathrooms/Balconies).
   - Procedural 3D meshes for Beds, Wardrobes, Sofa, Dining Set, Kitchen Counter, and Sanitaryware aligned with 2D CAD coordinates.
3. **Dollhouse Cutaway & Indian Sun-Path Simulator:**
   - Interactive time-of-day slider (`06:00` to `18:30` IST) computed for Indian solar azimuth/altitude (~18.5°N–28°N) rotated by `northAngleDeg`, casting real directional shadows through East/North balconies in the morning and West facades in the afternoon.

---

## 5. MASTER EXECUTION ORDER FOR AI CODING AGENT
1. **Phase 1 (Stepped Polygons, OTS Shafts, 3-Tier Topology, NBC 2016):** ✅ COMPLETED
2. **Phase 2 (`DETERMINISTIC_CAD_FIRST` 63ms Pipeline & `Building` Adapter):** ✅ COMPLETED
3. **Phase 3 (16-Zone Angular Centroid "Flat Vastu" Engine & Chakra Overlay):** 🎯 **EXECUTE NEXT**
4. **Phase 4 (ArchLang `.arch`/`.dxf`/`.pdf` Compiler + Double-Line 2D CAD Details & Furniture):** ⏳ UPCOMING
5. **Phase 5 (Parametric 3D Stepped BIM Extrusion & Indian Sun-Path Slider):** ⏳ UPCOMING