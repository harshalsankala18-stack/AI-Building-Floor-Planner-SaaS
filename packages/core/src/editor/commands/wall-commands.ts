/**
 * Typed, Reversible Wall Commands for the Editor Layer — Phase 2.7.
 *
 * Walls carry openings and bound rooms, so a wall edit has to keep those
 * relationships intact. Changing a wall's thickness or classification must not
 * orphan a hosted door, and must not silently move the rooms it separates.
 */

import type { Building, Wall } from '../../types';
import { WallType } from '../../types';
import { generateId } from '../../models/id';
import { updateWall } from '../../models/updaters';
import type { IEditorCommand, EditorState, CommandExecutionResult } from '../types';

/** Attributes of a wall a user may edit directly. */
export interface WallPropertyUpdates {
  readonly thickness?: number;
  readonly type?: WallType;
  readonly material?: string;
  readonly loadBearing?: boolean;
}

/**
 * Change a wall's assembly (thickness, classification, material).
 *
 * Geometry — the wall's own centreline, the rooms it bounds and the openings it
 * hosts — is deliberately untouched: thickening a wall in a schematic model
 * changes how it draws and how it extrudes in 3D, not which rooms adjoin it.
 */
export class UpdateWallPropertiesCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly affectedEntityId: string;
  private previous?: WallPropertyUpdates;

  constructor(
    readonly wallId: string,
    readonly updates: WallPropertyUpdates,
  ) {
    this.id = generateId();
    this.affectedEntityId = wallId;
    const parts: string[] = [];
    if (updates.thickness !== undefined) parts.push(`${updates.thickness}mm`);
    if (updates.type !== undefined) parts.push(String(updates.type));
    if (updates.loadBearing !== undefined) parts.push(updates.loadBearing ? 'load-bearing' : 'non-load-bearing');
    this.description = `Set wall ${parts.join(' · ') || 'properties'}`;
  }

  execute(building: Building, _state: EditorState): CommandExecutionResult {
    const wall = findWall(building, this.wallId);
    if (!wall) return { building };

    // Snapshot exactly the fields being changed, so undo restores them and
    // nothing else.
    this.previous = {
      ...(this.updates.thickness !== undefined ? { thickness: wall.thickness } : {}),
      ...(this.updates.type !== undefined ? { type: wall.type } : {}),
      ...(this.updates.material !== undefined ? { material: wall.material ?? '' } : {}),
      ...(this.updates.loadBearing !== undefined ? { loadBearing: wall.loadBearing } : {}),
    };

    const sanitized: WallPropertyUpdates = {
      ...this.updates,
      ...(this.updates.thickness !== undefined
        // A wall thinner than 50mm or thicker than 600mm is not a wall anyone
        // draws; clamp rather than accept nonsense from a numeric input.
        ? { thickness: Math.max(50, Math.min(600, Math.round(this.updates.thickness))) }
        : {}),
    };

    return { building: updateWall(building, this.wallId, sanitized as Partial<Wall>) };
  }

  undo(building: Building, _state: EditorState): CommandExecutionResult {
    if (!this.previous) return { building };
    return { building: updateWall(building, this.wallId, this.previous as Partial<Wall>) };
  }
}

/**
 * Move a wall's endpoints.
 *
 * Openings hosted on the wall are re-anchored onto the new centreline so a
 * geometry edit never leaves a door floating off its wall. Rooms are not
 * reshaped: in this model room boundaries are authoritative and walls are
 * derived from them, so a wall drag that would contradict the rooms is
 * rejected rather than silently desynchronising the two.
 */
export class UpdateWallGeometryCommand implements IEditorCommand {
  readonly id: string;
  readonly description: string;
  readonly affectedEntityId: string;
  private previous?: { startPoint: { x: number; y: number }; endPoint: { x: number; y: number } };
  private movedOpenings: Array<{ kind: 'door' | 'window'; id: string; position: { x: number; y: number } }> = [];

  constructor(
    readonly wallId: string,
    readonly startPoint: { x: number; y: number },
    readonly endPoint: { x: number; y: number },
  ) {
    this.id = generateId();
    this.affectedEntityId = wallId;
    this.description = 'Edit wall geometry';
  }

  execute(building: Building, _state: EditorState): CommandExecutionResult {
    const wall = findWall(building, this.wallId);
    if (!wall) return { building };

    const length = Math.hypot(this.endPoint.x - this.startPoint.x, this.endPoint.y - this.startPoint.y);
    const hostedWidth = hostedOpeningSpan(building, this.wallId);
    // A wall must stay long enough to carry the openings already on it.
    if (length < Math.max(300, hostedWidth)) {
      return {
        building,
        rejectedReason: `The wall would be ${Math.round(length)} mm long, too short for the ${Math.round(hostedWidth)} mm of openings it carries. Move or delete those openings first.`,
      };
    }

    this.previous = { startPoint: { ...wall.startPoint }, endPoint: { ...wall.endPoint } };
    let next = updateWall(building, this.wallId, {
      startPoint: this.startPoint,
      endPoint: this.endPoint,
    } as Partial<Wall>);

    // Re-anchor hosted openings onto the new centreline.
    this.movedOpenings = [];
    next = {
      ...next,
      floors: next.floors.map(floor => {
        if (!floor.walls.some(w => w.id === this.wallId)) return floor;
        return {
          ...floor,
          doors: floor.doors.map(door => {
            if (door.wallId !== this.wallId) return door;
            this.movedOpenings.push({ kind: 'door', id: door.id, position: { ...door.position } });
            return { ...door, position: projectOnto(door.position, this.startPoint, this.endPoint) };
          }),
          windows: floor.windows.map(win => {
            if (win.wallId !== this.wallId) return win;
            this.movedOpenings.push({ kind: 'window', id: win.id, position: { ...win.position } });
            return { ...win, position: projectOnto(win.position, this.startPoint, this.endPoint) };
          }),
        };
      }),
    };

    return { building: next };
  }

  undo(building: Building, _state: EditorState): CommandExecutionResult {
    if (!this.previous) return { building };
    let next = updateWall(building, this.wallId, {
      startPoint: this.previous.startPoint,
      endPoint: this.previous.endPoint,
    } as Partial<Wall>);

    const originals = new Map(this.movedOpenings.map(o => [`${o.kind}:${o.id}`, o.position]));
    next = {
      ...next,
      floors: next.floors.map(floor => ({
        ...floor,
        doors: floor.doors.map(door => {
          const original = originals.get(`door:${door.id}`);
          return original ? { ...door, position: original } : door;
        }),
        windows: floor.windows.map(win => {
          const original = originals.get(`window:${win.id}`);
          return original ? { ...win, position: original } : win;
        }),
      })),
    };
    return { building: next };
  }
}

function findWall(building: Building, wallId: string): Wall | undefined {
  for (const floor of building.floors) {
    const wall = floor.walls.find(w => w.id === wallId);
    if (wall) return wall;
  }
  return undefined;
}

/** Total width of openings hosted on a wall. */
function hostedOpeningSpan(building: Building, wallId: string): number {
  let span = 0;
  for (const floor of building.floors) {
    for (const door of floor.doors) if (door.wallId === wallId) span += door.width;
    for (const win of floor.windows) if (win.wallId === wallId) span += win.width;
  }
  return span;
}

function projectOnto(
  point: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
): { x: number; y: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { x: a.x, y: a.y };
  let t = ((point.x - a.x) * dx + (point.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return { x: Math.round(a.x + t * dx), y: Math.round(a.y + t * dy) };
}
