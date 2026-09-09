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
      return endpoint && endpoint.floorId === floor.id && polygonEdges(endpoint.boundary).some(edge =>
        pointOnSegment(door.position, edge, TOLERANCES.ADJACENCY));
    });
  });
}

type Access = NonNullable<ArchitecturalEvidence['suites'][number]['access']>;
const ACCESS_TYPES = new Set([RoomType.Storage, RoomType.Custom, RoomType.Corridor, RoomType.Foyer]);
const COMMON_TYPES = new Set([RoomType.Living, RoomType.FamilyLiving, RoomType.Drawing, RoomType.Dining,
  RoomType.Kitchen, RoomType.Corridor, RoomType.Foyer, RoomType.Staircase, RoomType.Lift]);

/** Walk only the bath-side private component. The owner is its entrance boundary:
 * normal common access to that bedroom does not make its ensuite shared. */
function suiteAccess(building: Building, program: RoomProgram, ownerProgramId: string,
  floor: Floor | undefined, owner: Room | undefined, bath: Room | undefined): Access {
  const result = (status: Access['status'], reason: string, pathRoomIds: string[] = [],
    pathDoorIds: string[] = [], viaRoles: Access['viaRoles'] = [], sharedEntryRoomIds: string[] = []): Access =>
    ({ status, reason, pathRoomIds, pathDoorIds, viaRoles, sharedEntryRoomIds });
  if (!floor || !owner || !bath || owner.floorId !== floor.id || bath.floorId !== floor.id
    || program.items.filter(item => item.id === ownerProgramId && item.type === RoomType.Bedroom).length !== 1
    || !floor.rooms.some(room => room.id === owner.id)) {
    return result('UNRESOLVED', 'Owner and bath must map uniquely to actual rooms on the same floor.');
  }
  const entries = program.reviewedAccessSpaces ?? [];
  const permitted = new Map<string, 'dressing' | 'private_access'>();
  let incomplete = false;
  for (const entry of entries.filter(item => item.ownerProgramItemId === ownerProgramId)) {
    const rooms = mappedRooms(building, entry.programItemId);
    const room = rooms.length === 1 ? rooms[0] : undefined;
    if (entries.filter(item => item.programItemId === entry.programItemId).length !== 1
      || !['dressing', 'private_access'].includes(entry.role) || !room || !ACCESS_TYPES.has(room.type)
      || room.floorId !== floor.id || !floor.rooms.some(item => item.id === room.id)
      || permitted.has(room.id) || room.id === owner.id || room.id === bath.id) {
      incomplete = true;
    } else permitted.set(room.id, entry.role);
  }
  const physical = floor.doors.filter(door => {
    const room = floor.rooms.find(item => door.connectsRooms.includes(item.id));
    return room && validRoomDoors(floor, room).includes(door);
  }).sort((a, b) => a.id.localeCompare(b.id));
  const queue = [{ id: bath.id, rooms: [bath.id], doors: [] as string[] }];
  const visited = new Set([bath.id]);
  const shared = new Set<string>();
  let unknownBoundary = false;
  let path: { rooms: string[]; doors: string[] } | undefined;
  // At most one visit per physical room; no recursive or unbounded path enumeration.
  for (let index = 0; index < queue.length && index < floor.rooms.length; index++) {
    const current = queue[index]!;
    for (const door of physical.filter(item => item.connectsRooms.includes(current.id))) {
      const next = door.connectsRooms.find(id => id !== current.id)!;
      if (next === owner.id) {
        if (!path) path = { rooms: [...current.rooms, next].reverse(), doors: [...current.doors, door.id].reverse() };
        continue;
      }
      if (next === bath.id || permitted.has(next)) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push({ id: next, rooms: [...current.rooms, next], doors: [...current.doors, door.id] });
        }
      } else {
        const room = floor.rooms.find(item => item.id === next);
        if (room?.type === RoomType.Bathroom) {
          const bathItems = program.items.filter(item => item.type === RoomType.Bathroom
            && mappedRooms(building, item.id).some(mapped => mapped.id === next));
          if (bathItems.length === 1 && (bathItems[0]!.bathroomUse === 'common'
            || (bathItems[0]!.attachedToRoomId !== undefined && bathItems[0]!.attachedToRoomId !== ownerProgramId))) shared.add(next);
          else unknownBoundary = true;
        } else if (!room || !ACCESS_TYPES.has(room.type)) shared.add(next);
        else if (COMMON_TYPES.has(room.type)) shared.add(next);
        else unknownBoundary = true;
      }
    }
  }
  const rooms = path?.rooms ?? [];
  const doors = path?.doors ?? [];
  const roles = rooms.slice(1, -1).map(id => permitted.get(id)!);
  if (shared.size) return result('SHARED', 'Bath-side access reaches a non-suite space or another owner without crossing the owner bedroom.',
    rooms, doors, roles, [...shared].sort());
  if (incomplete || unknownBoundary) return result('NOT_EVALUATED', 'Private intermediate identity, role or exclusivity is incomplete.', rooms, doors, roles);
  if (!path) return result('UNRESOLVED', 'No validated owner-to-bath path through explicit private access spaces.');
  return result(doors.length === 1 ? 'PRIVATE_DIRECT' : 'PRIVATE_INDIRECT',
    'Validated same-floor door path; no other entry to its bath-side private component.', rooms, doors, roles);
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
      access: suiteAccess(building, program, item.attachedToRoomId!, floor, owner, bathroom),
      status: directDoorIds.length === 0 ? 'REVIEW_REQUIRED'
        : otherAccessRoomIds.length > 0 ? 'SHARED_ACCESS' : 'PRIVATE_DIRECT_ACCESS' };
  });

  const unownedBathrooms: NonNullable<ArchitecturalEvidence['unownedBathrooms']> = program.items
    .filter(item => item.type === RoomType.Bathroom && item.attachedToRoomId === undefined).map(item => {
      const rooms = mappedRooms(building, item.id);
      const bathroom = rooms.length === 1 && rooms[0]!.type === RoomType.Bathroom ? rooms[0] : undefined;
      const floor = floors.find(candidate => candidate.id === bathroom?.floorId);
      const doors = floor && bathroom ? validRoomDoors(floor, bathroom) : [];
      const commonDoor = doors.some(door => door.connectsRooms.some(id =>
        floor?.rooms.some(room => room.id === id && COMMON_TYPES.has(room.type))));
      return { programItemId: item.id, name: item.name, bathroomId: bathroom?.id ?? null,
        ownership: item.bathroomUse === 'common' && commonDoor ? 'COMMON_ACCESS' : 'AMBIGUOUS_OWNERSHIP',
        physicalDoorIds: doors.map(door => door.id) };
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
    schemaVersion: 1, accessEvidenceVersion: 1, buildingId: building.id, buildingVersion: building.version,
    status: requiredFloors.some(item => !item.passed) || suites.some(suite =>
      suite.access?.status !== 'PRIVATE_DIRECT' && suite.access?.status !== 'PRIVATE_INDIRECT') || unknownSuites
      ? 'REVIEW_REQUIRED' : 'CHECKED_REQUIREMENTS_MET',
    requiredFloors, suites, unownedBathrooms, wetStacking, openSpace,
    limitations: [
      'Checks cover explicit required floors and owned bathroom door paths only; this is not architectural approval.',
      'Private paths require explicit reviewed access-space identities and actual validated same-floor doors. Missing semantics are not evaluated.',
      'Door-only evidence does not evaluate open thresholds, door operation, plumbing or professional compliance.',
      'Wet coverage is a geometric observation, not plumbing feasibility or a minimum compliance score.',
      'Outdoor area includes only typed balcony, terrace and garden rooms; residual area is unclassified, not wasted space.',
      ...(unknownSuites ? ['A legacy attached-bath name has no explicit owner; ownership was not inferred.'] : []),
    ],
  };
}
