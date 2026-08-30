# AI Floor Planner — Rendering Specification

## 1. Purpose

The Renderer transforms the Building Model into visual output (SVG) for display, interaction, and export. The renderer is a pure projection — it reads from the model and produces visual elements. It never modifies the source model.

---

## 2. Design Principles

1. **Model-driven**: Every visual element maps to a model entity.
2. **Deterministic**: Same model state always produces same visual output.
3. **Layered**: Visual elements organized in render layers.
4. **Responsive**: Re-renders efficiently on model changes.
5. **Interactive**: Supports selection, hover, drag for editing.
6. **Exportable**: Output is valid SVG suitable for print/PDF.

---

## 3. Rendering Pipeline

```
Building Model
     │
     ▼
┌─────────────────────┐
│  Model Traversal    │  Extract renderable entities
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  Coordinate         │  Transform mm → screen pixels
│  Transform          │  Apply zoom/pan
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  Layer Composition  │  Organize by render layer
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  Element Rendering  │  Generate SVG elements
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  Annotation Layer   │  Dimensions, labels, markers
└─────────────────────┘
     │
     ▼
SVG Output
```

---

## 4. Render Layers (Bottom to Top)

| Layer | Z-Index | Contents |
|-------|---------|----------|
| Grid | 0 | Background grid |
| Plot | 1 | Plot boundary, setbacks |
| Floor | 2 | Floor boundary fill |
| Rooms | 3 | Room fills with color coding |
| Walls | 4 | Wall lines (thick strokes) |
| Openings | 5 | Doors and windows |
| Stairs | 6 | Staircase representation |
| Columns | 7 | Structural columns |
| Furniture | 8 | Future: furniture layout |
| Annotations | 9 | Dimensions, labels, arrows |
| Selection | 10 | Selection highlights, handles |
| Guides | 11 | Alignment guides, snap indicators |

---

## 5. Coordinate System

### World Space (mm)
- Origin: top-left of plot
- Units: millimeters
- X: right (East)
- Y: down (South)

### Screen Space (px)
- Origin: top-left of viewport
- Transformed by: zoom level + pan offset

### Transform

```typescript
interface ViewTransform {
  scale: number;      // mm-to-px ratio (zoom)
  offsetX: number;    // Pan X in pixels
  offsetY: number;    // Pan Y in pixels
}

// World to screen
function worldToScreen(point: Point, transform: ViewTransform): ScreenPoint {
  return {
    x: point.x * transform.scale + transform.offsetX,
    y: point.y * transform.scale + transform.offsetY,
  };
}

// Screen to world
function screenToWorld(screen: ScreenPoint, transform: ViewTransform): Point {
  return {
    x: (screen.x - transform.offsetX) / transform.scale,
    y: (screen.y - transform.offsetY) / transform.scale,
  };
}
```

---

## 6. Visual Representation

### 6.1 Walls

```svg
<!-- External wall: thick line -->
<line x1="..." y1="..." x2="..." y2="..." 
      stroke="#1a1a1a" stroke-width="4" stroke-linecap="square"/>

<!-- Internal wall: medium line -->
<line x1="..." y1="..." x2="..." y2="..." 
      stroke="#333333" stroke-width="2.5" stroke-linecap="square"/>

<!-- Partition: thin line -->
<line x1="..." y1="..." x2="..." y2="..." 
      stroke="#666666" stroke-width="1.5" stroke-linecap="square"/>
```

### 6.2 Doors

Standard architectural door symbol:
- Gap in wall at door position
- Arc showing swing direction
- Line from hinge to arc endpoint

### 6.3 Windows

Standard architectural window symbol:
- Gap in wall
- Three parallel lines (glass representation)

### 6.4 Rooms

```svg
<!-- Room fill with label -->
<rect x="..." y="..." width="..." height="..." 
      fill="[room-type-color]" fill-opacity="0.15" 
      stroke="none"/>
<text x="[center]" y="[center]" 
      text-anchor="middle" font-size="12" fill="#333">
  Master Bedroom
</text>
<text x="[center]" y="[center+16]" 
      text-anchor="middle" font-size="10" fill="#666">
  14.5 sq m
</text>
```

### 6.5 Room Color Coding

| Room Type | Fill Color |
|-----------|-----------|
| Bedroom | #E3F2FD (light blue) |
| Bathroom | #E8F5E9 (light green) |
| Kitchen | #FFF3E0 (light orange) |
| Living | #F3E5F5 (light purple) |
| Dining | #FFFDE7 (light yellow) |
| Corridor | #ECEFF1 (light gray) |
| Staircase | #EFEBE9 (light brown) |
| Balcony | #E0F7FA (light cyan) |
| Parking | #F5F5F5 (gray) |
| Pooja | #FCE4EC (light pink) |
| Utility | #FAFAFA (near white) |

### 6.6 Dimensions

```svg
<!-- Dimension line with value -->
<g class="dimension">
  <line x1="..." y1="..." x2="..." y2="..." stroke="#0066cc" stroke-width="0.5"/>
  <line ... /> <!-- tick marks at ends -->
  <text ...>3600 mm</text>
</g>
```

### 6.7 North Arrow

An SVG symbol indicating north direction, rotated by Site.orientation degrees.

---

## 7. Interactive Features

### 7.1 Selection

- Click entity → select (highlight + show handles)
- Shift+click → add to selection
- Click empty → deselect
- Selected entities show resize handles and property panel

### 7.2 Drag

- Drag selected room → move (with snapping)
- Drag handle → resize
- Drag door/window → move along wall
- All drags update Building Model → re-render

### 7.3 Zoom & Pan

- Scroll wheel: zoom in/out (centered on cursor)
- Middle-click drag: pan
- Zoom range: 0.1x to 10x
- Fit-to-view: auto-calculate scale to show entire plan

### 7.4 Hover

- Hover over entity: highlight + show tooltip with entity info
- Hover near wall: show potential door/window placement indicator

---

## 8. Export Rendering

For export (PDF/print), the renderer produces clean SVG without interactive elements:

- No selection handles
- No hover states
- No grid (optional)
- Include title block
- Include dimension annotations
- Include room labels and areas
- Include north arrow
- Include scale bar
- Standard architectural line weights

---

## 9. Performance

### Optimization Strategies

1. **Dirty tracking**: Only re-render entities whose model data changed.
2. **Viewport culling**: Don't render entities outside visible viewport.
3. **Level-of-detail**: At low zoom, simplify annotations and small elements.
4. **Batched updates**: Collect multiple model changes, render once.

### Targets

| Metric | Target |
|--------|--------|
| Initial render | < 100ms |
| Incremental update | < 16ms (60fps) |
| Full re-render | < 50ms |
| Export render | < 500ms |

---

## 10. SVG Structure

```svg
<svg xmlns="http://www.w3.org/2000/svg" 
     viewBox="0 0 [width] [height]"
     class="floor-plan">
  
  <defs>
    <!-- Patterns, markers, symbols -->
    <pattern id="grid" .../>
    <marker id="dimension-arrow" .../>
    <symbol id="north-arrow" .../>
    <symbol id="door-swing" .../>
  </defs>
  
  <g class="layer-grid" .../>
  <g class="layer-plot" .../>
  <g class="layer-floor" .../>
  <g class="layer-rooms" .../>
  <g class="layer-walls" .../>
  <g class="layer-openings" .../>
  <g class="layer-stairs" .../>
  <g class="layer-columns" .../>
  <g class="layer-annotations" .../>
  <g class="layer-selection" .../>
  <g class="layer-guides" .../>
  
</svg>
```

---

## 11. Testing Strategy

- Snapshot tests: render fixture plans, compare SVG output.
- Visual regression: detect unintended changes in rendering.
- Interaction tests: simulate click/drag events, verify model updates.
- Export tests: validate exported SVG structure and completeness.
- Performance tests: render large plans within time targets.
