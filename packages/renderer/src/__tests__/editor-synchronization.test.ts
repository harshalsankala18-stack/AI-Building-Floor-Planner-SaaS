import { describe, it, expect } from 'vitest';
import { renderBuilding } from '../index';
import {
  deserializeBuilding,
  EditorEngine,
  MoveRoomCommand,
  ResizeRoomCommand,
  UpdateRoomPropertiesCommand,
} from '@ai-floor-planner/core';
import * as fs from 'fs';
import * as path from 'path';

describe('Renderer & Editor Synchronization', () => {
  function loadFixture(name: string) {
    const cwdPath = path.resolve(process.cwd(), 'tests/fixtures', name);
    const fixturePath = fs.existsSync(cwdPath) ? cwdPath : path.resolve(__dirname, '../../../../tests/fixtures', name);
    const json = fs.readFileSync(fixturePath, 'utf-8');
    return deserializeBuilding(json);
  }

  it('updates rendered SVG when EditorEngine executes a MoveRoomCommand', () => {
    const building = loadFixture('30x50-2bhk.json');
    const editor = new EditorEngine(building);
    const roomId = building.floors[0]!.rooms[0]!.id;

    // Baseline SVG projection
    const initialSvg = renderBuilding(editor.getBuilding(), 0);
    expect(initialSvg).toContain(`data-entity-id="${roomId}"`);

    // Execute MoveRoomCommand via EditorEngine
    editor.execute(new MoveRoomCommand(roomId, 5000, 6000));

    // Re-render SVG derived purely from the Building model
    const updatedSvg = renderBuilding(editor.getBuilding(), 0);
    expect(updatedSvg).not.toBe(initialSvg);
    expect(updatedSvg).toContain(`data-entity-id="${roomId}"`);

    // Undo restores the exact initial SVG output
    editor.undo();
    const undoneSvg = renderBuilding(editor.getBuilding(), 0);
    expect(undoneSvg).toBe(initialSvg);
  });

  it('updates room labels in SVG upon UpdateRoomPropertiesCommand', () => {
    const building = loadFixture('30x50-2bhk.json');
    const editor = new EditorEngine(building);
    const room = building.floors[0]!.rooms[0]!;

    editor.execute(new UpdateRoomPropertiesCommand(room.id, {
      name: 'Custom Study Zone',
    }));

    const svg = renderBuilding(editor.getBuilding(), 0);
    expect(svg).toContain('Custom Study Zone');

    editor.undo();
    const restoredSvg = renderBuilding(editor.getBuilding(), 0);
    expect(restoredSvg).not.toContain('Custom Study Zone');
    expect(restoredSvg).toContain(room.name);
  });

  it('reflects dimension changes in SVG upon ResizeRoomCommand', () => {
    const building = loadFixture('minimal-1room.json');
    const editor = new EditorEngine(building);
    const room = building.floors[0]!.rooms[0]!;

    editor.execute(new ResizeRoomCommand(room.id, 8000, 8000));

    const svg = renderBuilding(editor.getBuilding(), 0);
    expect(svg).toContain('64.0 sq m'); // 8m x 8m = 64 sq m
  });
});
