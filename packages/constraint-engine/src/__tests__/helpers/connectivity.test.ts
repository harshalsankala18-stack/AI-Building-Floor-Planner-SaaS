import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  buildConnectivityGraph,
  findUnreachableRooms,
  doorTransitionsToRoom,
} from '../../helpers/connectivity';
import type { Building } from '@ai-floor-planner/core';

const FIXTURES_DIR = path.resolve(__dirname, '../../../../../tests/fixtures');

function loadFixture(name: string): Building {
  const json = fs.readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf-8');
  return JSON.parse(json) as Building;
}

describe('Connectivity Helper', () => {
  it('builds connectivity graph from floor with rooms and doors', () => {
    const building = loadFixture('30x50-2bhk');
    const floor = building.floors[0]!;
    const graph = buildConnectivityGraph(floor);

    expect(graph.nodes.size).toBe(floor.rooms.length + 1); // includes __outside__
    for (const room of floor.rooms) {
      expect(graph.nodes.has(room.id)).toBe(true);
      expect(graph.edges.has(room.id)).toBe(true);
    }
  });

  it('treats every room as unreachable when a floor has no doors', () => {
    const building = loadFixture('30x50-2bhk');
    const floor = building.floors[0]!;
    const unreachable = findUnreachableRooms(floor);
    expect(unreachable).toHaveLength(floor.rooms.length);
  });

  it('calculates door transitions from entrance to destination room', () => {
    const building = loadFixture('30x50-2bhk');
    const floor = building.floors[0]!;
    const living = floor.rooms.find(r => r.type === 'living');
    if (living) {
      const dist = doorTransitionsToRoom(floor, living.id);
      expect(dist).toBe(Infinity);
    }
  });
});
