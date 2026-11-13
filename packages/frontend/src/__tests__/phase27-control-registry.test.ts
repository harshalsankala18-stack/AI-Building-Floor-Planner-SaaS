/**
 * Phase 2.7 — Editable-workspace control registry and dead-control guard.
 *
 * Two jobs:
 *
 * 1. A declared inventory of every interactive control in the 2D editable
 *    workspace, with the domain command it dispatches. This is the audit
 *    record the brief asks for — and because each entry names a real exported
 *    command, a control whose command is deleted or renamed breaks this test
 *    rather than silently becoming a no-op button.
 *
 * 2. A static guard against misleading controls: any `onClick` (or other
 *    handler) whose body is empty or contains only a comment. That is exactly
 *    the shape the two broken wall-thickness buttons had.
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import * as core from '@ai-floor-planner/core';

const FRONTEND_SRC = path.resolve(__dirname, '..');

/** One interactive control in the Editable workspace. */
interface ControlSpec {
  /** Unique control id used in this registry. */
  readonly id: string;
  /** What the user sees / the accessible label. */
  readonly label: string;
  readonly surface:
    | 'left-toolbar'
    | 'canvas-toolbar'
    | 'floor-bar'
    | 'inspector-room'
    | 'inspector-wall'
    | 'inspector-door'
    | 'inspector-window'
    | 'canvas-direct';
  readonly expectedAction: string;
  readonly precondition: string;
  /** Canonical command dispatched, or a named view-state change. */
  readonly dispatches: string;
  /** What the user should see afterwards. */
  readonly visibleResult: string;
  /** Test id in the DOM, where one exists. */
  readonly testId?: string;
}

/**
 * The registry. `dispatches` values ending in `Command` must exist as real
 * exports of @ai-floor-planner/core.
 */
const CONTROL_REGISTRY: readonly ControlSpec[] = [
  // ── Left toolbar
  { id: 'tool.select', label: 'Select', surface: 'left-toolbar', expectedAction: 'Activate selection tool', precondition: 'None', dispatches: 'SetToolCommand', visibleResult: 'Clicking an entity selects it and fills the inspector' },
  { id: 'tool.pan', label: 'Pan', surface: 'left-toolbar', expectedAction: 'Activate viewport pan', precondition: 'None', dispatches: 'SetToolCommand', visibleResult: 'Dragging moves the viewport; no geometry changes' },
  { id: 'tool.room', label: 'Room', surface: 'left-toolbar', expectedAction: 'Place a new room', precondition: 'Active floor exists', dispatches: 'AddRoomCommand', visibleResult: 'A 3600×3600 room appears at the click point and is selected' },
  { id: 'tool.door', label: 'Door', surface: 'left-toolbar', expectedAction: 'Place a door on a wall', precondition: 'The click must land on a wall long enough for 900mm', dispatches: 'AddDoorCommand', visibleResult: 'A door symbol with swing appears on that wall; an unmet precondition shows an on-canvas instruction' },
  { id: 'tool.window', label: 'Window', surface: 'left-toolbar', expectedAction: 'Place a window on a wall', precondition: 'The click must land on a wall long enough for 1200mm', dispatches: 'AddWindowCommand', visibleResult: 'A window symbol appears on that wall; otherwise an instruction is shown' },
  { id: 'tool.measure', label: 'Measure', surface: 'left-toolbar', expectedAction: 'Measure a real model distance', precondition: 'Requires two clicks on the canvas', dispatches: 'view:measurement', visibleResult: 'A dimension line with the distance in m and mm' },
  { id: 'tool.wall', label: 'Wall', surface: 'left-toolbar', expectedAction: 'Disabled — walls derive from room boundaries', precondition: 'Not implemented; control is disabled with a stated reason', dispatches: 'none:disabled', visibleResult: 'Disabled button with an explanatory tooltip' },
  { id: 'tool.commands', label: 'Commands', surface: 'left-toolbar', expectedAction: 'Open the command palette', precondition: 'None', dispatches: 'view:commandPalette', visibleResult: 'Searchable palette of real actions' },
  { id: 'tool.delete', label: 'Delete', surface: 'left-toolbar', expectedAction: 'Delete the selected entity and its dependents', precondition: 'An entity must be selected (button disabled otherwise)', dispatches: 'DeleteEntityCommand', visibleResult: 'The entity and any orphaned openings disappear; undo restores them' },

  // ── Canvas toolbar
  { id: 'canvas.fit', label: 'Fit to view', surface: 'canvas-toolbar', expectedAction: 'Fit the plan in the viewport', precondition: 'None', dispatches: 'view:fitRequest', visibleResult: 'The whole floor becomes visible' },
  { id: 'canvas.snap', label: 'Snap', surface: 'canvas-toolbar', expectedAction: 'Toggle grid snapping', precondition: 'None', dispatches: 'view:snapEnabled', visibleResult: 'Drags snap to 100mm; the button shows its state', testId: 'canvas-snap' },
  { id: 'canvas.undo', label: 'Undo', surface: 'canvas-toolbar', expectedAction: 'Reverse the last committed edit', precondition: 'History must be non-empty (disabled otherwise)', dispatches: 'engine:undo', visibleResult: 'Previous geometry returns in 2D, inspector and 3D', testId: 'canvas-undo' },
  { id: 'canvas.redo', label: 'Redo', surface: 'canvas-toolbar', expectedAction: 'Restore an undone edit', precondition: 'An undo must have happened (disabled otherwise)', dispatches: 'engine:redo', visibleResult: 'The edit reappears everywhere', testId: 'canvas-redo' },
  { id: 'canvas.aiDesign', label: 'AI Design', surface: 'canvas-toolbar', expectedAction: 'Navigate to the AI Design workspace', precondition: 'None', dispatches: 'view:activeStage', visibleResult: 'The generation stage opens' },
  { id: 'canvas.aiConceptRef', label: 'AI Concept Ref', surface: 'canvas-toolbar', expectedAction: 'Show/hide the accepted reference image', precondition: 'An accepted image or traceability must exist', dispatches: 'view:showAiReferenceIn2D', visibleResult: 'The reference panel appears or disappears; the vector plan stays fully visible either way', testId: 'toggle-ai-reference' },
  { id: 'canvas.inspect3d', label: 'Inspect 3D', surface: 'canvas-toolbar', expectedAction: 'Open the synchronized 3D model', precondition: 'None', dispatches: 'view:activeStage', visibleResult: '3D opens showing the same Building revision', testId: 'open-3d' },

  // ── Floor bar
  { id: 'floor.select', label: 'Ground / First Floor', surface: 'floor-bar', expectedAction: 'Switch the active floor', precondition: 'The floor exists', dispatches: 'SwitchFloorCommand', visibleResult: 'That floor renders; geometry is unchanged', testId: 'floor-select' },
  { id: 'floor.add', label: 'Add Floor', surface: 'floor-bar', expectedAction: 'Add a new level', precondition: 'None', dispatches: 'AddFloorCommand', visibleResult: 'A new floor button appears and becomes selectable', testId: 'floor-add' },
  { id: 'floor.delete', label: 'Delete floor', surface: 'floor-bar', expectedAction: 'Remove the active upper floor', precondition: 'More than one floor and not the ground floor', dispatches: 'RemoveFloorCommand', visibleResult: 'The floor disappears; undo restores it', testId: 'floor-delete' },

  // ── Inspector: room
  { id: 'inspector.room.name', label: 'Room Name', surface: 'inspector-room', expectedAction: 'Rename the room', precondition: 'A room is selected', dispatches: 'UpdateRoomPropertiesCommand', visibleResult: 'The label changes on the drawing' },
  { id: 'inspector.room.type', label: 'Room Type', surface: 'inspector-room', expectedAction: 'Change the room type', precondition: 'A room is selected', dispatches: 'UpdateRoomPropertiesCommand', visibleResult: 'Type-driven styling and checks update' },
  { id: 'inspector.room.width', label: 'Width (mm)', surface: 'inspector-room', expectedAction: 'Set exact width', precondition: 'Must stay in bounds and not overlap', dispatches: 'UpdateRoomGeometryCommand', visibleResult: 'Geometry, dimensions, area and 3D update; a refusal states the reason' },
  { id: 'inspector.room.depth', label: 'Depth (mm)', surface: 'inspector-room', expectedAction: 'Set exact depth', precondition: 'Must stay in bounds and not overlap', dispatches: 'UpdateRoomGeometryCommand', visibleResult: 'Room depth, area and the 3D surface update; a refusal states the reason' },
  { id: 'inspector.room.x', label: 'X (mm)', surface: 'inspector-room', expectedAction: 'Move the room along X', precondition: 'Must stay in bounds and not overlap', dispatches: 'UpdateRoomGeometryCommand', visibleResult: 'The room moves; a refusal states the reason' },
  { id: 'inspector.room.y', label: 'Y (mm)', surface: 'inspector-room', expectedAction: 'Move the room along Y', precondition: 'Must stay in bounds and not overlap', dispatches: 'UpdateRoomGeometryCommand', visibleResult: 'The room moves along Y; a refusal states the reason' },
  { id: 'inspector.room.lock', label: 'Lock room', surface: 'inspector-room', expectedAction: 'Lock the room against regeneration', precondition: 'A room is selected', dispatches: 'generationControl:lockedEntityIds', visibleResult: 'A LOCKED overlay appears on the drawing' },
  { id: 'inspector.room.vertexAdd', label: '+ Vertex', surface: 'inspector-room', expectedAction: 'Subdivide the longest polygon edge to add a vertex', precondition: 'A room is selected', dispatches: 'UpdateRoomBoundaryCommand', visibleResult: 'A new polygon vertex is inserted and vertex inputs update', testId: 'room-vertex-add' },
  { id: 'inspector.room.vertexReset', label: 'Reset Rect', surface: 'inspector-room', expectedAction: 'Reset room polygon to 4-point rectangle', precondition: 'A non-rectangular room (>4 vertices) is selected', dispatches: 'UpdateRoomBoundaryCommand', visibleResult: 'Room boundary returns to 4-point orthogonal rectangle', testId: 'room-vertex-reset' },
  { id: 'inspector.room.delete', label: 'Delete room', surface: 'inspector-room', expectedAction: 'Delete the room and its sole-use walls/openings', precondition: 'A room is selected', dispatches: 'DeleteEntityCommand', visibleResult: 'The room and its dependents disappear; no orphans remain', testId: 'room-delete' },

  // ── Inspector: wall
  { id: 'inspector.wall.thin', label: '115 mm (4.5″ Partition)', surface: 'inspector-wall', expectedAction: 'Set a 115mm partition', precondition: 'A wall is selected', dispatches: 'UpdateWallPropertiesCommand', visibleResult: '2D linework and 3D thickness change; undo restores', testId: 'wall-thickness-115' },
  { id: 'inspector.wall.thick', label: '230 mm (9″ Structural)', surface: 'inspector-wall', expectedAction: 'Set a 230mm structural wall', precondition: 'A wall is selected', dispatches: 'UpdateWallPropertiesCommand', visibleResult: 'Wall draws thicker in 2D and extrudes thicker in 3D; undo restores 115mm', testId: 'wall-thickness-230' },
  { id: 'inspector.wall.custom', label: 'Custom Thickness (mm)', surface: 'inspector-wall', expectedAction: 'Set an exact thickness', precondition: '50–600mm', dispatches: 'UpdateWallPropertiesCommand', visibleResult: 'Thickness updates; out-of-range values are clamped', testId: 'wall-thickness-input' },
  { id: 'inspector.wall.type', label: 'Classification', surface: 'inspector-wall', expectedAction: 'Change wall classification', precondition: 'A wall is selected', dispatches: 'UpdateWallPropertiesCommand', visibleResult: 'Classification and load-bearing flag update; hosted openings are preserved', testId: 'wall-type-select' },
  { id: 'inspector.wall.endpoints', label: 'Wall Endpoints (mm)', surface: 'inspector-wall', expectedAction: 'Move wall start or end point coordinates', precondition: 'Wall length must stay sufficient for hosted openings', dispatches: 'UpdateWallGeometryCommand', visibleResult: 'Wall centreline and hosted openings update; undo restores', testId: 'wall-start-x' },
  { id: 'inspector.wall.split', label: 'Split Wall', surface: 'inspector-wall', expectedAction: 'Split the wall into two collinear segments at its midpoint', precondition: 'Wall must be at least 600mm long', dispatches: 'SplitWallCommand', visibleResult: 'Wall splits into two segments and re-hosts openings; undo restores single wall', testId: 'wall-split' },
  { id: 'inspector.wall.addDoor', label: '+ Door', surface: 'inspector-wall', expectedAction: 'Place a 900mm door on the selected wall', precondition: 'Selected wall must fit a 900mm door', dispatches: 'AddDoorCommand', visibleResult: 'A door is added to the wall and selected', testId: 'wall-add-door' },
  { id: 'inspector.wall.addWindow', label: '+ Window', surface: 'inspector-wall', expectedAction: 'Place a 1200mm window on the selected wall', precondition: 'Selected wall must fit a 1200mm window', dispatches: 'AddWindowCommand', visibleResult: 'A window is added to the wall and selected', testId: 'wall-add-window' },
  { id: 'inspector.wall.delete', label: 'Delete wall', surface: 'inspector-wall', expectedAction: 'Delete the wall and its openings', precondition: 'A wall is selected', dispatches: 'DeleteEntityCommand', visibleResult: 'Wall and hosted openings disappear; undo restores both', testId: 'wall-delete' },

  // ── Inspector: door
  { id: 'inspector.door.flipSwing', label: 'Flip Swing', surface: 'inspector-door', expectedAction: 'Flip swing inward/outward', precondition: 'A door is selected', dispatches: 'UpdateDoorPropertiesCommand', visibleResult: 'The swing arc mirrors in 2D' },
  { id: 'inspector.door.flipHinge', label: 'Flip Hinge', surface: 'inspector-door', expectedAction: 'Flip hinge side', precondition: 'A door is selected', dispatches: 'UpdateDoorPropertiesCommand', visibleResult: 'The hinge side changes' },
  { id: 'inspector.door.type', label: 'Door Type', surface: 'inspector-door', expectedAction: 'Change door type', precondition: 'A door is selected', dispatches: 'UpdateDoorPropertiesCommand', visibleResult: 'The symbol changes to the chosen type' },
  { id: 'inspector.door.width', label: 'Clear Width', surface: 'inspector-door', expectedAction: 'Change door width', precondition: '600–2400mm', dispatches: 'UpdateDoorPropertiesCommand', visibleResult: 'Opening width changes in 2D and the 3D void follows' },
  { id: 'inspector.door.delete', label: 'Delete door', surface: 'inspector-door', expectedAction: 'Delete the door', precondition: 'A door is selected', dispatches: 'DeleteEntityCommand', visibleResult: 'The door and its 3D void disappear', testId: 'door-delete' },
  { id: 'canvas.door.move', label: 'Drag door', surface: 'canvas-direct', expectedAction: 'Move the door along its wall', precondition: 'The new position must fit on the wall', dispatches: 'MoveDoorCommand', visibleResult: 'The door slides; clearance callouts update' },

  // ── Inspector: window
  { id: 'inspector.window.type', label: 'Window Type', surface: 'inspector-window', expectedAction: 'Change window type', precondition: 'A window is selected', dispatches: 'UpdateWindowPropertiesCommand', visibleResult: 'The symbol changes' },
  { id: 'inspector.window.width', label: 'Width', surface: 'inspector-window', expectedAction: 'Change window width', precondition: '500–4000mm', dispatches: 'UpdateWindowPropertiesCommand', visibleResult: 'Opening width changes in 2D and 3D' },
  { id: 'inspector.window.sill', label: 'Sill Height', surface: 'inspector-window', expectedAction: 'Change sill height', precondition: '0–2400mm', dispatches: 'UpdateWindowPropertiesCommand', visibleResult: 'The 3D void starts at the new sill height' },
  { id: 'inspector.window.delete', label: 'Delete window', surface: 'inspector-window', expectedAction: 'Delete the window', precondition: 'A window is selected', dispatches: 'DeleteEntityCommand', visibleResult: 'The window and its 3D void disappear', testId: 'window-delete' },
  { id: 'canvas.window.move', label: 'Drag window', surface: 'canvas-direct', expectedAction: 'Move the window along its wall', precondition: 'The new position must fit on the wall', dispatches: 'MoveWindowCommand', visibleResult: 'The window slides; jamb callouts update' },

  // ── Canvas direct manipulation
  { id: 'canvas.room.move', label: 'Drag room', surface: 'canvas-direct', expectedAction: 'Move a room', precondition: 'Must stay in bounds and not overlap', dispatches: 'UpdateRoomGeometryCommand', visibleResult: 'The room moves; an invalid drop is refused with a stated reason' },
  { id: 'canvas.room.resize', label: 'Resize handle', surface: 'canvas-direct', expectedAction: 'Resize a room from a corner or edge', precondition: 'Must stay in bounds and not overlap', dispatches: 'UpdateRoomGeometryCommand', visibleResult: 'Dimensions and area update live; the commit is validated' },
  { id: 'canvas.room.vertexMove', label: 'Polygon vertex handle', surface: 'canvas-direct', expectedAction: 'Drag a vertex of a non-rectangular room polygon', precondition: 'A room with >4 vertices is selected', dispatches: 'UpdateRoomBoundaryCommand', visibleResult: 'The room polygon reshapes and area recomputes; undo restores', testId: 'room-vertex-grip-0' },
  { id: 'canvas.wall.endpointMove', label: 'Wall endpoint handle', surface: 'canvas-direct', expectedAction: 'Drag a wall start or end point on the canvas', precondition: 'A wall is selected and remains long enough for openings', dispatches: 'UpdateWallGeometryCommand', visibleResult: 'The wall endpoint moves and hosted openings re-project onto the wall', testId: 'wall-endpoint-start' },
  { id: 'inspector.floor.name', label: 'Level Name', surface: 'floor-bar', expectedAction: 'Rename the active floor level', precondition: 'No entity is selected', dispatches: 'UpdateFloorPropertiesCommand', visibleResult: 'Floor button and inspector title update; undo restores', testId: 'floor-name-input' },
  { id: 'inspector.floor.height', label: 'Clear Floor Height (mm)', surface: 'floor-bar', expectedAction: 'Change active floor clear height (2100–6000mm)', precondition: 'No entity is selected', dispatches: 'UpdateFloorPropertiesCommand', visibleResult: 'Floor height and 3D wall/slab elevations update; undo restores', testId: 'floor-height-input' },
  { id: 'canvas.multiSelect', label: 'Ctrl/Shift click', surface: 'canvas-direct', expectedAction: 'Add a room to the selection', precondition: 'Rooms only', dispatches: 'SetSelectionsCommand', visibleResult: 'Multiple rooms highlight; the inspector reports the aggregate and states that bulk geometry editing is unavailable' },
];

describe('Phase 2.7 — Editable workspace control registry', () => {
  it('declares a unique id for every control', () => {
    const ids = CONTROL_REGISTRY.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(40);
  });

  it('every control names a real domain command, a named view change, or an honest disabled state', () => {
    const missing: string[] = [];
    for (const control of CONTROL_REGISTRY) {
      if (control.dispatches.endsWith('Command')) {
        // A command that does not exist means the control cannot work.
        if (typeof (core as Record<string, unknown>)[control.dispatches] !== 'function') {
          missing.push(`${control.id} → ${control.dispatches}`);
        }
      } else {
        // Everything else must be an explicitly namespaced non-domain effect,
        // so a control can never claim a vague "it does something".
        expect(control.dispatches).toMatch(/^(view|engine|generationControl|none):/);
      }
    }
    expect(missing).toEqual([]);
  });

  it('every control states a precondition and a visible result', () => {
    for (const control of CONTROL_REGISTRY) {
      expect(control.precondition.length).toBeGreaterThan(3);
      expect(control.visibleResult.length).toBeGreaterThan(10);
      expect(control.label.length).toBeGreaterThan(0);
    }
  });

  it('the only control declared unimplemented is the disabled Wall tool', () => {
    const unimplemented = CONTROL_REGISTRY.filter(c => c.dispatches.startsWith('none:'));
    expect(unimplemented.map(c => c.id)).toEqual(['tool.wall']);
    // And it must say so in its own precondition, not look available.
    expect(unimplemented[0]!.precondition).toMatch(/disabled/i);
  });
});

describe('Phase 2.7 — no misleading controls in the source', () => {
  function sourceFiles(): string[] {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== '__tests__' && entry.name !== 'node_modules') walk(full);
        } else if (/\.(tsx|ts)$/.test(entry.name)) {
          files.push(full);
        }
      }
    };
    walk(FRONTEND_SRC);
    return files;
  }

  it('has no handler whose body is empty or comment-only', () => {
    // This is the exact shape of the two wall-thickness buttons that rendered
    // as active and did nothing.
    const patterns: ReadonlyArray<readonly [RegExp, string]> = [
      [/on(?:Click|Change|Input|Submit|PointerDown|KeyDown)\s*=\s*\{\s*\(\s*[\w,\s]*\)\s*=>\s*\{\s*\}\s*\}/g, 'empty handler body'],
      [/on(?:Click|Change|Input|Submit|PointerDown|KeyDown)\s*=\s*\{\s*\(\s*[\w,\s]*\)\s*=>\s*\{\s*(?:\/\/[^\n]*\n\s*)+\}\s*\}/g, 'comment-only handler body'],
      [/on(?:Click|Change)\s*=\s*\{\s*(?:undefined|noop)\s*\}/g, 'placeholder handler'],
    ];

    const findings: string[] = [];
    for (const file of sourceFiles()) {
      const src = fs.readFileSync(file, 'utf8');
      for (const [pattern, label] of patterns) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(src))) {
          const line = src.slice(0, match.index).split('\n').length;
          findings.push(`${label} — ${path.relative(FRONTEND_SRC, file)}:${line}`);
        }
      }
    }
    expect(findings).toEqual([]);
  });

  it('every registry control with a test id appears in the source under that id', () => {
    const allSource = sourceFiles().map(f => fs.readFileSync(f, 'utf8')).join('\n');
    const missing = CONTROL_REGISTRY.filter(c => {
      if (!c.testId) return false;
      if (allSource.includes(`data-testid="${c.testId}"`)) return false;
      // Some controls are rendered from a list, so their id is built at
      // runtime (e.g. `wall-thickness-${option.thickness}`). Accept a
      // template whose literal prefix matches.
      const prefix = c.testId.replace(/[^a-z-]+$/i, '');
      return !allSource.includes(`data-testid={\`${prefix}`);
    }).map(c => `${c.id} (${c.testId})`);
    expect(missing).toEqual([]);
  });
});
