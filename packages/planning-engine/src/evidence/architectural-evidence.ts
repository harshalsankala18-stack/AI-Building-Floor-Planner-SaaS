import type { ArchitecturalEvidence, Building, Floor, Room, RoomProgram } from '@ai-floor-planner/core';
import { RoomType, TOLERANCES } from '@ai-floor-planner/core';
import {
  isConvex, isValidPolygon, pointOnSegment, polygonArea, polygonEdges,
  polygonIntersectionArea, polygonSignedArea, validateDoorPlacement,
} from '@ai-floor-planner/geometry-engine';
import { sourceProgramItemId } from '../graph/scorer';

const WET_TYPES = new Set([RoomType.Bathroom, RoomType.Kitchen, RoomType.Utility]);
const OUTDOOR_TYPES = new Set([RoomType.Balcony, RoomType.Terrace, RoomType.Garden]);

function mappedRooms(building: Building, programId: string): Room[] {
  return building.floors.flatMap(floor => floor.rooms.filter(room => room.tags.some(tag =>
    tag.startsWith('program:') && sourceProgramItemId(tag.slice(8)) === programId,
  )));
}

/** Reuse geometry validation; a topology reference alone is not a physical doorway. */
function validRoomDoors(floor: Floor, room: Room) {
  return floor.doors.filter(door => {
    const wall = floor.walls.find(candidate => candidate.id === door.wallId);
    if (!wall || door.floorId !== floor.id || wall.floorId !== floor.id
      || !door.connectsRooms.includes(room.id) || door.connectsRooms[0] === door.connectsRooms[1]
      || !Number.isFinite(door.width) || !Number.isFinite(door.height) || door.height <= 0
      || !Number.isFinite(door.position.x) || !Number.isFinite(door.position.y)
      || !validateDoorPlacement(door, wall).valid) return false;
    return door.connectsRooms.every(id => {
      if (id === '__outside__' || id === 'outside' || id === '') return true;
      const endpoint = floor.rooms.find(candidate => candidate.id === id);
      return endpoint && polygonEdges(endpoint.boundary).some(edge =>
        pointOnSegment(door.position, edge, TOLERANCES.ADJACENCY));
    });
  });
}

function usablePolygon(room: Room): boolean {
  return room.boundary.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))
    && isValidPolygon(room.boundary) && isConvex(room.boundary);
}

function normalizedBoundary(room: Room) {
  return polygonSignedArea(room.boundary) < 0
    ? { points: [...room.boundary.points].reverse() } : room.boundary;
}

/** Pure observations of one immutable candidate and its original reviewed program. */
export function evaluateArchitecturalEvidence(building: Building, program: RoomProgram): ArchitecturalEvidence {
  const floors = [...building.floors].sort((a, b) => a.level - b.level || a.id.localeCompare(b.id));
  const requiredFloors: ArchitecturalEvidence['requiredFloors'] = program.items.flatMap(item => {
    const level = item.floorPreference?.kind === 'ground_required' ? 0
      : item.floorPreference?.kind === 'specific' ? item.floorPreference.specificFloor
        : !item.floorPreference && item.floorLevel > 0 ? item.floorLevel : undefined;
    if (level === undefined) return [];
    const rooms = mappedRooms(building, item.id);
    const actualLevels = rooms.flatMap(room => floors.filter(floor => floor.id === room.floorId).map(floor => floor.level));
    return [{ programItemId: item.id, name: item.name, requiredLevel: level,
      roomIds: rooms.map(room => room.id), actualLevels,
      passed: rooms.length === 1 && actualLevels.length === 1 && actualLevels[0] === level }];
  });

  const suites: ArchitecturalEvidence['suites'] = program.items.filter(item => item.attachedToRoomId !== undefined).map(item => {
    const bathrooms = mappedRooms(building, item.id);
    const owners = mappedRooms(building, item.attachedToRoomId!);
    const bathroom = bathrooms.length === 1 && bathrooms[0]!.type === RoomType.Bathroom ? bathrooms[0] : undefined;
    const owner = owners.length === 1 && owners[0]!.type === RoomType.Bedroom ? owners[0] : undefined;
    const floor = bathroom ? floors.find(candidate => candidate.id === bathroom.floorId) : undefined;
    const sameFloor = Boolean(bathroom && owner && bathroom.floorId === owner.floorId);
    const doors = floor && bathroom ? validRoomDoors(floor, bathroom) : [];
    const directDoorIds = sameFloor && owner ? doors.filter(door => door.connectsRooms.includes(owner.id)).map(door => door.id) : [];
    const otherAccessRoomIds = [...new Set(doors.flatMap(door => door.connectsRooms.filter(id =>
      id !== bathroom?.id && id !== owner?.id)))].sort();
    return { bathroomProgramItemId: item.id, ownerProgramItemId: item.attachedToRoomId!, name: item.name,
      bathroomId: bathroom?.id ?? null, ownerId: owner?.id ?? null, sameFloor,
      directDoorIds, otherAccessRoomIds,
      status: directDoorIds.length === 0 ? 'REVIEW_REQUIRED'
        : otherAccessRoomIds.length > 0 ? 'SHARED_ACCESS' : 'PRIVATE_DIRECT_ACCESS' };
  });

  const wetRooms: ArchitecturalEvidence['wetStacking']['rooms'][number][] = [];
  for (let index = 1; index < floors.length; index++) {
    const lower = floors[index - 1]!;
    const upper = floors[index]!;
    const lowerWet = lower.rooms.filter(room => WET_TYPES.has(room.type));
    const validLower = lowerWet.every(usablePolygon) && lowerWet.every((room, i) => lowerWet.slice(i + 1).every(other =>
      polygonIntersectionArea(normalizedBoundary(room), normalizedBoundary(other)) <= TOLERANCES.OVERLAP));
    for (const room of upper.rooms.filter(candidate => WET_TYPES.has(candidate.type))) {
      const valid = lower.level + 1 === upper.level && validLower && usablePolygon(room);
      const matches = valid ? lowerWet.map(candidate => ({ id: candidate.id,
        area: polygonIntersectionArea(normalizedBoundary(room), normalizedBoundary(candidate)),
      })).sort((a, b) => b.area - a.area || a.id.localeCompare(b.id)) : [];
      const best = matches[0];
      wetRooms.push({ upperRoomId: room.id, upperFloorId: upper.id, lowerFloorId: lower.id,
        lowerRoomId: best && best.area > TOLERANCES.AREA ? best.id : null,
        coveragePercent: valid ? Math.max(0, Math.min(100, (best?.area ?? 0) / polygonArea(room.boundary) * 100)) : null });
    }
  }
  const measured = wetRooms.length > 0 && wetRooms.every(room => room.coveragePercent !== null);
  const wetStacking: ArchitecturalEvidence['wetStacking'] = {
    status: wetRooms.length === 0 ? 'NOT_APPLICABLE' : measured ? 'MEASURED' : 'NOT_EVALUATED',
    coveragePercent: measured ? Math.round(wetRooms.reduce((sum, room) => sum + room.coveragePercent!, 0) / wetRooms.length) : null,
    rooms: wetRooms,
  };

  const openSpace = floors.map(floor => {
    const outdoor = floor.rooms.filter(room => OUTDOOR_TYPES.has(room.type));
    const areas = floor.rooms.map(room => polygonArea(room.boundary));
    const floorArea = polygonArea(floor.boundary);
    return { floorId: floor.id, explicitOutdoorRoomIds: outdoor.map(room => room.id),
      explicitOutdoorAreaMm2: outdoor.reduce((sum, room) => sum + polygonArea(room.boundary), 0),
      // Residual is not waste: it may include walls, circulation, services or unmodeled voids.
      residualUnclassifiedAreaMm2: Number.isFinite(floorArea) && areas.every(Number.isFinite)
        ? Math.max(0, floorArea - areas.reduce((sum, area) => sum + area, 0)) : null };
  });
  const unknownSuites = program.items.some(item => item.type === RoomType.Bathroom
    && item.attachedToRoomId === undefined && /^Attached Bath/i.test(item.name));
  return {
    schemaVersion: 1, buildingId: building.id, buildingVersion: building.version,
    status: requiredFloors.some(item => !item.passed) || suites.some(suite => suite.status !== 'PRIVATE_DIRECT_ACCESS') || unknownSuites
      ? 'REVIEW_REQUIRED' : 'CHECKED_REQUIREMENTS_MET',
    requiredFloors, suites, wetStacking, openSpace,
    limitations: [
      'Checks cover explicit required floors and directly owned bathroom access only; this is not architectural approval.',
      'Indirect private paths (including dressing rooms) require explicit reviewed relationships and are not certified here.',
      'Wet coverage is a geometric observation, not plumbing feasibility or a minimum compliance score.',
      'Outdoor area includes only typed balcony, terrace and garden rooms; residual area is unclassified, not wasted space.',
      ...(unknownSuites ? ['A legacy attached-bath name has no explicit owner; ownership was not inferred.'] : []),
    ],
  };
}
