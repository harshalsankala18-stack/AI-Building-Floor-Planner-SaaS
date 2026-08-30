/**
 * Design Graph Builder.
 *
 * Constructs the logical topological adjacency graph representing
 * architectural relationships between rooms (not geometry).
 */

import type {
  RoomProgram,
  DesignGraph,
  DesignGraphEdge,
  InstanceDesignGraph,
  RoomProgramItem,
  SpatialGraphEdge,
} from '@ai-floor-planner/core';
import {
  RoomType,
  AdjacencyRelationType,
} from '@ai-floor-planner/core';

export class DesignGraphBuilder {
  /** Build the production instance-level graph used by placement and ranking. */
  buildInstanceGraph(program: RoomProgram): InstanceDesignGraph {
    const nodes = program.items.map(item => ({
      id: `spatial_node_${item.id}`,
      programItemId: item.id,
      type: item.type,
      name: item.name,
      zone: item.zone,
      preferredFloorLevel: item.floorLevel,
    }));
    const nodeByProgramId = new Map(nodes.map(node => [node.programItemId, node]));
    const edges: SpatialGraphEdge[] = [];
    const edgeKeys = new Set<string>();
    const itemsOfType = (type: RoomType) => program.items.filter(item => item.type === type);
    const first = (type: RoomType) => itemsOfType(type)[0];

    const connect = (
      source: RoomProgramItem | undefined,
      target: RoomProgramItem | undefined,
      relation: AdjacencyRelationType,
      weight: number,
      reason: string,
    ) => {
      if (!source || !target || source.id === target.id) return;
      const sourceNode = nodeByProgramId.get(source.id);
      const targetNode = nodeByProgramId.get(target.id);
      if (!sourceNode || !targetNode) return;
      const pair = [sourceNode.id, targetNode.id].sort().join('|');
      const key = `${pair}|${relation}`;
      if (edgeKeys.has(key)) return;
      edgeKeys.add(key);
      edges.push({
        id: `spatial_edge_${edges.length + 1}`,
        sourceNodeId: sourceNode.id,
        targetNodeId: targetNode.id,
        relation,
        weight,
        reason,
      });
    };

    const living = first(RoomType.Living);
    const dining = first(RoomType.Dining);
    const kitchen = first(RoomType.Kitchen);
    const bedrooms = itemsOfType(RoomType.Bedroom);
    const bathrooms = itemsOfType(RoomType.Bathroom);
    const attachedBathrooms = bathrooms.filter(item => /^Attached Bath/i.test(item.name));

    connect(living, dining, AdjacencyRelationType.PreferredAdjacency, 0.9, 'Direct public social flow');
    connect(dining, kitchen, AdjacencyRelationType.RequiredAdjacency, 1, 'Direct food service path');

    attachedBathrooms.forEach((bathroom, index) => {
      connect(
        bedrooms.find(bedroom => bedroom.id === bathroom.attachedToRoomId) ?? bedrooms[index] ?? bedrooms[0],
        bathroom,
        AdjacencyRelationType.AccessRequired,
        1,
        'Requested attached bathroom access',
      );
    });
    bathrooms.filter(item => !attachedBathrooms.includes(item)).forEach((bathroom, index) => {
      connect(
        bedrooms[index % Math.max(1, bedrooms.length)],
        bathroom,
        AdjacencyRelationType.PreferredAdjacency,
        0.65,
        'Convenient bedroom-to-bathroom access',
      );
    });

    bedrooms.forEach(bedroom => {
      connect(living, bedroom, AdjacencyRelationType.PrivacyBoundary, 0.7, 'Protect private rooms from the public entrance zone');
      connect(kitchen, bedroom, AdjacencyRelationType.RequiredSeparation, 0.8, 'Reduce cooking noise and odor in sleeping rooms');
    });

    for (const vertical of [
      ...itemsOfType(RoomType.Staircase),
      ...itemsOfType(RoomType.Lift),
    ]) {
      connect(living, vertical, AdjacencyRelationType.AccessRequired, 0.85, 'Reach vertical circulation from the public zone');
    }

    connect(first(RoomType.Pooja), living, AdjacencyRelationType.PreferredAdjacency, 0.65, 'Quiet access from the family living area');
    connect(first(RoomType.Study), living, AdjacencyRelationType.PrivacyBoundary, 0.55, 'Separate focused work from the busiest public zone');
    connect(first(RoomType.Parking), living, AdjacencyRelationType.AccessRequired, 0.75, 'Short protected path from parking to entrance');
    connect(first(RoomType.Garden), living, AdjacencyRelationType.PreferredAdjacency, 0.65, 'Visual and physical connection to outdoor space');
    connect(first(RoomType.Balcony), bedrooms[0] ?? living, AdjacencyRelationType.PreferredAdjacency, 0.6, 'Private room access to balcony');
    connect(first(RoomType.ServantQuarter), kitchen, AdjacencyRelationType.PreferredAdjacency, 0.55, 'Service-zone proximity');

    const itemsByZone = new Map<string, RoomProgramItem[]>();
    for (const item of program.items) {
      const zoneItems = itemsByZone.get(item.zone) ?? [];
      zoneItems.push(item);
      itemsByZone.set(item.zone, zoneItems);
    }
    for (const zoneItems of itemsByZone.values()) {
      for (let index = 0; index < zoneItems.length - 1; index++) {
        connect(
          zoneItems[index],
          zoneItems[index + 1],
          AdjacencyRelationType.PreferredAdjacency,
          0.3,
          'Keep compatible functional-zone instances grouped',
        );
      }
    }

    return { nodes, edges };
  }

  /**
   * Build architectural adjacency and separation graph from a room program.
   */
  buildGraph(program: RoomProgram): DesignGraph {
    const nodes = Array.from(new Set(program.items.map(item => item.type)));
    const edges: DesignGraphEdge[] = [];

    const hasNode = (type: RoomType) => nodes.includes(type);

    const addEdge = (
      sourceRoomType: RoomType,
      targetRoomType: RoomType,
      relation: AdjacencyRelationType,
      weight: number,
      reason?: string,
    ) => {
      if (hasNode(sourceRoomType) && hasNode(targetRoomType)) {
        edges.push({
          sourceRoomType,
          targetRoomType,
          relation,
          weight,
          reason,
        });
      }
    };

    // 1. Core Public -> Semi-Public Flow
    addEdge(
      RoomType.Living,
      RoomType.Dining,
      AdjacencyRelationType.PreferredAdjacency,
      0.85,
      'Seamless social and family gathering flow',
    );

    // 2. Kitchen <-> Dining Functional Adjacency
    addEdge(
      RoomType.Dining,
      RoomType.Kitchen,
      AdjacencyRelationType.RequiredAdjacency,
      1.0,
      'Direct food service and dining connectivity',
    );

    // 3. Bedroom <-> Attached Bath Access
    addEdge(
      RoomType.Bedroom,
      RoomType.Bathroom,
      AdjacencyRelationType.AccessRequired,
      0.9,
      'Private bathroom access for master/secondary bedrooms',
    );

    // 4. Public Living <-> Private Bedrooms Privacy Separation
    addEdge(
      RoomType.Living,
      RoomType.Bedroom,
      AdjacencyRelationType.PrivacyBoundary,
      0.75,
      'Acoustic and visual privacy separation from public entertainment',
    );

    // 5. Kitchen <-> Bedroom Smell & Noise Separation
    addEdge(
      RoomType.Kitchen,
      RoomType.Bedroom,
      AdjacencyRelationType.RequiredSeparation,
      0.8,
      'Prevent cooking odors and kitchen noise from entering sleeping quarters',
    );

    // 6. Staircase <-> Living / Foyer Circulation
    addEdge(
      RoomType.Staircase,
      RoomType.Living,
      AdjacencyRelationType.AccessRequired,
      0.7,
      'Vertical circulation accessibility from main entrance/living',
    );

    // 7. Pooja Room <-> Quiet Zone
    addEdge(
      RoomType.Pooja,
      RoomType.Living,
      AdjacencyRelationType.PreferredAdjacency,
      0.6,
      'Spiritual sanctuary accessible from serene zone',
    );

    return {
      nodes,
      edges,
    };
  }
}
