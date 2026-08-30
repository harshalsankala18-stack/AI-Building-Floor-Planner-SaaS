/**
 * Connectivity graph — determines room reachability via doors.
 *
 * Builds a graph where:
 * - Nodes = room IDs + "__outside__" (representing exterior)
 * - Edges = doors connecting two rooms
 *
 * A room is "reachable" if there's a path from __outside__ to it.
 */

import type { Floor } from '@ai-floor-planner/core';

const OUTSIDE_NODE = '__outside__';

export interface ConnectivityGraph {
  nodes: Set<string>;
  edges: Map<string, Set<string>>;
}

/**
 * Build a connectivity graph from a floor's doors.
 */
export function buildConnectivityGraph(floor: Floor): ConnectivityGraph {
  const nodes = new Set<string>();
  const edges = new Map<string, Set<string>>();

  // Add all rooms as nodes
  for (const room of floor.rooms) {
    nodes.add(room.id);
    edges.set(room.id, new Set());
  }

  // Add outside node
  nodes.add(OUTSIDE_NODE);
  edges.set(OUTSIDE_NODE, new Set());

  // Add edges from doors
  for (const door of floor.doors) {
    const [roomA, roomB] = door.connectsRooms;
    const isOutsideA = !roomA || roomA === '' || roomA === 'outside' || roomA === OUTSIDE_NODE;
    const isOutsideB = !roomB || roomB === '' || roomB === 'outside' || roomB === OUTSIDE_NODE;

    if (isOutsideA && !isOutsideB && roomB) {
      if (edges.has(roomB)) {
        edges.get(OUTSIDE_NODE)!.add(roomB);
        edges.get(roomB)!.add(OUTSIDE_NODE);
      }
    } else if (isOutsideB && !isOutsideA && roomA) {
      if (edges.has(roomA)) {
        edges.get(OUTSIDE_NODE)!.add(roomA);
        edges.get(roomA)!.add(OUTSIDE_NODE);
      }
    } else if (roomA && roomB) {
      if (edges.has(roomA) && edges.has(roomB)) {
        edges.get(roomA)!.add(roomB);
        edges.get(roomB)!.add(roomA);
      }
    }
  }

  return { nodes, edges };
}

/**
 * Find all rooms that are unreachable from the outside.
 * Uses BFS from the __outside__ node.
 */
export function findUnreachableRooms(floor: Floor): string[] {
  // Rooms without doors are unreachable. Draft-mode handling belongs to the
  // constraint orchestrator, not this graph helper.
  if (floor.doors.length === 0) {
    return floor.rooms.map(room => room.id);
  }

  const graph = buildConnectivityGraph(floor);
  const visited = new Set<string>();
  const queue: string[] = [OUTSIDE_NODE];
  visited.add(OUTSIDE_NODE);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = graph.edges.get(current) ?? new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  // Any room node not visited is unreachable
  const unreachable: string[] = [];
  for (const room of floor.rooms) {
    if (!visited.has(room.id)) {
      unreachable.push(room.id);
    }
  }

  return unreachable;
}

/**
 * Count the minimum number of door transitions from outside to a room.
 * Returns Infinity if unreachable.
 */
export function doorTransitionsToRoom(floor: Floor, roomId: string): number {
  if (floor.doors.length === 0) return Infinity;

  const graph = buildConnectivityGraph(floor);
  const distances = new Map<string, number>();
  const queue: string[] = [OUTSIDE_NODE];
  distances.set(OUTSIDE_NODE, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDist = distances.get(current)!;
    const neighbors = graph.edges.get(current) ?? new Set();

    for (const neighbor of neighbors) {
      if (!distances.has(neighbor)) {
        distances.set(neighbor, currentDist + 1);
        queue.push(neighbor);
      }
    }
  }

  return distances.get(roomId) ?? Infinity;
}
