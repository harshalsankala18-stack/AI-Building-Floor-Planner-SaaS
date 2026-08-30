import type {
  Building,
  InstanceDesignGraph,
  Room,
  RoomProgramItem,
} from '@ai-floor-planner/core';
import { AdjacencyRelationType } from '@ai-floor-planner/core';
import { polygonsAdjacent } from '@ai-floor-planner/geometry-engine';

export interface InstanceGraphEvaluation {
  readonly score: number;
  readonly satisfiedEdgeIds: readonly string[];
  readonly unsatisfiedEdgeIds: readonly string[];
}

export function sourceProgramItemId(itemId: string): string {
  return itemId.replace(/_floor_\d+$/, '');
}

export function relationshipUtility(
  graph: InstanceDesignGraph,
  source: RoomProgramItem,
  target: RoomProgramItem,
): number {
  const sourceNode = graph.nodes.find(node => node.programItemId === sourceProgramItemId(source.id));
  const targetNode = graph.nodes.find(node => node.programItemId === sourceProgramItemId(target.id));
  if (!sourceNode || !targetNode) return 0;

  return graph.edges.reduce((utility, edge) => {
    const matches = (edge.sourceNodeId === sourceNode.id && edge.targetNodeId === targetNode.id)
      || (edge.sourceNodeId === targetNode.id && edge.targetNodeId === sourceNode.id);
    if (!matches) return utility;
    const direction = edge.relation === AdjacencyRelationType.RequiredSeparation
      || edge.relation === AdjacencyRelationType.PrivacyBoundary
      ? -1
      : 1;
    return utility + direction * edge.weight;
  }, 0);
}

function roomProgramTag(room: Room): string | undefined {
  const tag = room.tags.find(value => value.startsWith('program:'));
  return tag ? sourceProgramItemId(tag.slice('program:'.length)) : undefined;
}

function centroidDistance(a: Room, b: Room): number {
  const ax = a.x + a.width / 2;
  const ay = a.y + a.height / 2;
  const bx = b.x + b.width / 2;
  const by = b.y + b.height / 2;
  return Math.hypot(ax - bx, ay - by);
}

function directlyConnected(building: Building, a: Room, b: Room): boolean {
  return building.floors.some(floor => floor.doors.some(door => {
    const [from, to] = door.connectsRooms;
    return (from === a.id && to === b.id) || (from === b.id && to === a.id);
  }));
}

function positiveRelationshipScore(building: Building, a: Room, b: Room): number {
  if (a.floorId !== b.floorId) return 0;
  if (directlyConnected(building, a, b)) return 1;
  if (polygonsAdjacent(a.boundary, b.boundary)) return 0.9;
  return Math.max(0, 1 - centroidDistance(a, b) / 10_000) * 0.5;
}

function separationScore(a: Room, b: Room): number {
  if (a.floorId !== b.floorId) return 1;
  if (polygonsAdjacent(a.boundary, b.boundary)) return 0;
  return Math.min(1, centroidDistance(a, b) / 6_000);
}

export function evaluateInstanceGraph(
  building: Building,
  graph: InstanceDesignGraph,
): InstanceGraphEvaluation {
  if (graph.edges.length === 0) {
    return { score: 100, satisfiedEdgeIds: [], unsatisfiedEdgeIds: [] };
  }

  const roomsByProgramId = new Map<string, Room[]>();
  for (const room of building.floors.flatMap(floor => floor.rooms)) {
    const programId = roomProgramTag(room);
    if (!programId) continue;
    const rooms = roomsByProgramId.get(programId) ?? [];
    rooms.push(room);
    roomsByProgramId.set(programId, rooms);
  }

  const nodeById = new Map(graph.nodes.map(node => [node.id, node]));
  let earned = 0;
  let possible = 0;
  const satisfiedEdgeIds: string[] = [];
  const unsatisfiedEdgeIds: string[] = [];

  for (const edge of graph.edges) {
    const sourceNode = nodeById.get(edge.sourceNodeId);
    const targetNode = nodeById.get(edge.targetNodeId);
    const sources = sourceNode ? roomsByProgramId.get(sourceNode.programItemId) ?? [] : [];
    const targets = targetNode ? roomsByProgramId.get(targetNode.programItemId) ?? [] : [];
    possible += edge.weight;

    let satisfaction = 0;
    for (const source of sources) {
      for (const target of targets) {
        const pairScore = edge.relation === AdjacencyRelationType.RequiredSeparation
          || edge.relation === AdjacencyRelationType.PrivacyBoundary
          ? separationScore(source, target)
          : positiveRelationshipScore(building, source, target);
        satisfaction = Math.max(satisfaction, pairScore);
      }
    }

    earned += satisfaction * edge.weight;
    if (satisfaction >= 0.75) satisfiedEdgeIds.push(edge.id);
    else unsatisfiedEdgeIds.push(edge.id);
  }

  return {
    score: possible > 0 ? Math.round((earned / possible) * 100) : 100,
    satisfiedEdgeIds,
    unsatisfiedEdgeIds,
  };
}
