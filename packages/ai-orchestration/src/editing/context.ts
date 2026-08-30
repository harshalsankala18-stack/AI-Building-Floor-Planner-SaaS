import type { Building } from '@ai-floor-planner/core';
import type { AIEditModelContext } from './types';

/** Extracts only the geometry and identity data needed to parse an edit. */
export function extractAIEditContext(
  building: Building,
  activeFloorId?: string,
  selectedRoomId?: string,
): AIEditModelContext {
  const resolvedFloorId = activeFloorId && building.floors.some(floor => floor.id === activeFloorId)
    ? activeFloorId
    : building.floors[0]?.id ?? '';
  const rooms = building.floors.flatMap(floor => floor.rooms.map(room => ({
    id: room.id,
    floorId: floor.id,
    floorLevel: floor.level,
    name: room.name,
    type: room.type,
    x: Math.round(room.x),
    y: Math.round(room.y),
    width: Math.round(room.width),
    height: Math.round(room.height),
    isFixed: room.isFixed,
    selected: room.id === selectedRoomId,
  })));
  const compact = rooms.map(room =>
    `${room.id}|L${room.floorLevel}|${room.name}|${room.type}|${room.x},${room.y}|${room.width}x${room.height}${room.selected ? '|selected' : ''}${room.isFixed ? '|fixed' : ''}`,
  ).join('\n');

  return {
    buildingId: building.id,
    buildingVersion: building.version,
    plotWidthMm: building.site.plotWidth,
    plotDepthMm: building.site.plotDepth,
    activeFloorId: resolvedFloorId,
    selectedRoomId: selectedRoomId ?? null,
    rooms,
    promptSummary: `Building ${building.id} v${building.version}; plot ${building.site.plotWidth}x${building.site.plotDepth} mm; active floor ${resolvedFloorId}.\nRooms:\n${compact}`,
  };
}
