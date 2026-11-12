/**
 * Phase 2.7 acceptance evidence: the 3D model is a projection of the SAME
 * canonical Building the 2D editor persisted after a real edit.
 *
 * The browser's WebGL canvas is created imperatively, so the honest way to
 * prove the 3D content (rather than "a canvas exists") is to take the exact
 * Building the app autosaved after the live UI edit and project it with the
 * same projector the 3D view uses.
 */
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Building } from '@ai-floor-planner/core';
import { Building3DProjector } from '@ai-floor-planner/projection-3d';

const SNAPSHOT = '.audit/live-edited-building.json';

describe('AUDIT: 3D projection of the live-edited building', () => {
  it.runIf(fs.existsSync(SNAPSHOT))('renders the edited geometry, not a rectangular shell', () => {
    const building = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8')) as Building;
    const projection = new Building3DProjector().project(building);
    const out: string[] = [];
    const log = (s: string) => { out.push(s); console.log(s); };

    const ground = building.floors[0]!;
    log(`BUILDING ${building.id} floors=${building.floors.length} version=${building.version}`);
    log(`GROUND rooms=${ground.rooms.length} walls=${ground.walls.length} doors=${ground.doors.length} windows=${ground.windows.length}`);
    log(`PROJECTION plates=${projection.floorPlates.length} walls=${projection.walls.length} openings=${projection.openings.length} rooms=${projection.rooms.length} stairs=${projection.stairs.length} columns=${projection.columns.length}`);
    for (const level of projection.levels) log(`  LEVEL ${level.floorName} elevation=${level.elevation} datum=${level.datumLabel}`);

    // One projected surface per canonical room: interior partitions are present.
    expect(projection.rooms.length).toBe(building.floors.flatMap(f => f.rooms).length);
    expect(projection.walls.length).toBe(building.floors.flatMap(f => f.walls).length);
    expect(projection.walls.length).toBeGreaterThan(4); // not a 4-wall box

    const thicknesses = [...new Set(projection.walls.map(w => w.thickness))].sort((a, b) => a - b);
    log(`WALL THICKNESSES ${thicknesses.join(', ')}`);
    // Both envelope and partition walls exist, so this is a partitioned model.
    expect(thicknesses.length).toBeGreaterThan(1);

    // Every opening is a void in a wall that exists.
    for (const opening of projection.openings) {
      expect(projection.walls.some(w => w.sourceEntityId === opening.hostWallId)).toBe(true);
      log(`  OPENING ${opening.sourceEntityType} width=${opening.width} bottom=${opening.bottom} height=${opening.height}`);
    }

    // The room edited live in the browser must carry its edited width into 3D.
    const editedId = process.env.AUDIT_EDITED_ROOM_ID;
    if (editedId) {
      const room = building.floors.flatMap(f => f.rooms).find(r => r.id === editedId)!;
      const surface = projection.rooms.find(r => r.sourceEntityId === editedId)!;
      const span = Math.max(...surface.boundary.points.map(p => p.x)) - Math.min(...surface.boundary.points.map(p => p.x));
      log(`EDITED ROOM ${room.name} canonicalWidth=${room.width} projectedSpanX=${Math.round(span)}`);
      expect(Math.round(span)).toBe(room.width);
    }

    // Multi-floor stacking: upper levels sit above the ground.
    if (projection.levels.length > 1) {
      for (let i = 1; i < projection.levels.length; i++) {
        expect(projection.levels[i]!.elevation).toBeGreaterThan(projection.levels[i - 1]!.elevation);
      }
    }

    fs.writeFileSync('.audit/3d-projection-evidence.txt', out.join('\n'));
  });
});
