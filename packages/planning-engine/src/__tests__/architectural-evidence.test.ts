import { describe, expect, it } from 'vitest';
import {
  createBuilding, createRoom, createWall, createDoor, createProgramItem, getSpaceDefinition,
  createEmptySpaceProgram, adaptSpaceProgramToPlannerProgram, rectToPolygon, RoomType,
  type Building, type Floor,
} from '@ai-floor-planner/core';
import { evaluateArchitecturalEvidence } from '../evidence/architectural-evidence';
import { evaluateMultiFloorPlanning } from '../multi-floor/planner';

function fixture() {
  const program = adaptSpaceProgramToPlannerProgram({ ...createEmptySpaceProgram('residential'), items: [
    createProgramItem(getSpaceDefinition('bedroom')!, 'owner', { quantity: 1, floorPreference: { kind: 'ground_required' } }),
    createProgramItem(getSpaceDefinition('attached_bathroom')!, 'bath', { quantity: 1, attachedToRoomId: 'owner' }),
  ] }, 2);
  const base = createBuilding({ projectId: 'evidence', name: 'Evidence', site: { plotWidth: 12000, plotDepth: 12000 },
    floors: [0, 1].map(level => ({ buildingId: '', level, boundary: rectToPolygon(0, 0, 12000, 12000) })) });
  const floorId = base.floors[0]!.id;
  const owner = createRoom({ floorId, type: RoomType.Bedroom, x: 0, y: 0, width: 4000, height: 4000, tags: ['program:owner_1_floor_0'] });
  const bath = createRoom({ floorId, type: RoomType.Bathroom, x: 4000, y: 0, width: 2000, height: 4000, tags: ['program:bath_1_floor_0'] });
  const wall = createWall({ floorId, startPoint: { x: 4000, y: 0 }, endPoint: { x: 4000, y: 4000 }, roomIds: [owner.id, bath.id] });
  const door = createDoor({ floorId, wallId: wall.id, position: { x: 4000, y: 1500 }, connectsRooms: [owner.id, bath.id] });
  const building = { ...base, floors: [{ ...base.floors[0]!, rooms: [owner, bath], walls: [wall], doors: [door] }, base.floors[1]!] };
  return { building, program, owner, bath, wall, door };
}

function ground(building: Building, patch: Partial<Floor>): Building {
  return { ...building, floors: [{ ...building.floors[0]!, ...patch }, ...building.floors.slice(1)] };
}

function indirectFixture(type: RoomType = RoomType.Custom, reviewed = true) {
  const value = fixture();
  const { owner, bath, program, building } = value;
  const intermediate = createRoom({ floorId: owner.floorId, type, name: 'Dressing',
    x: 4000, y: 0, width: 2000, height: 4000, tags: ['program:dress_1_floor_0'] });
  const movedBath = { ...bath, x: 6000, boundary: rectToPolygon(6000, 0, 2000, 4000) };
  const firstWall = createWall({ floorId: owner.floorId, startPoint: { x: 4000, y: 0 }, endPoint: { x: 4000, y: 4000 }, roomIds: [owner.id, intermediate.id] });
  const secondWall = createWall({ floorId: owner.floorId, startPoint: { x: 6000, y: 0 }, endPoint: { x: 6000, y: 4000 }, roomIds: [intermediate.id, movedBath.id] });
  const doors = [createDoor({ floorId: owner.floorId, wallId: firstWall.id, position: { x: 4000, y: 1500 }, connectsRooms: [owner.id, intermediate.id] }),
    createDoor({ floorId: owner.floorId, wallId: secondWall.id, position: { x: 6000, y: 1500 }, connectsRooms: [intermediate.id, movedBath.id] })];
  return { ...value, intermediate, bath: movedBath, doors,
    building: ground(building, { rooms: [owner, intermediate, movedBath], walls: [firstWall, secondWall], doors }),
    program: { ...program, reviewedAccessSpaces: reviewed
      ? [{ programItemId: 'dress_1', ownerProgramItemId: 'owner_1', role: 'dressing' as const }] : [] },
  };
}

describe('architectural evidence independent of candidate ranking', () => {
  it('recognizes the RBEA dressing-mediated topology from explicit identity and physical doors', () => {
    const { building, program, owner, intermediate, bath, doors } = indirectFixture();
    const before = JSON.stringify({ building, program });
    const evidence = evaluateArchitecturalEvidence(building, program);
    expect(evidence.accessEvidenceVersion).toBe(1);
    expect(evidence.suites[0]!.directDoorIds).toEqual([]);
    expect(evidence.suites[0]!.access).toMatchObject({ status: 'PRIVATE_INDIRECT',
      pathRoomIds: [owner.id, intermediate.id, bath.id], pathDoorIds: doors.map(door => door.id),
      viaRoles: ['dressing'], sharedEntryRoomIds: [] });
    expect(evidence.status).toBe('CHECKED_REQUIREMENTS_MET');
    expect(JSON.stringify({ building, program })).toBe(before);
  });
  it('does not infer private dressing from its name, zone or door chain', () => {
    const { building, program } = indirectFixture(RoomType.Custom, false);
    expect(evaluateArchitecturalEvidence(building, program).suites[0]!.access?.status).toBe('NOT_EVALUATED');
  });
  it.each([RoomType.Corridor, RoomType.Foyer, RoomType.Living, RoomType.Kitchen, RoomType.Bedroom, RoomType.Utility, RoomType.Parking, RoomType.Balcony])(
    'never grants private indirect access through an unreviewed %s', type => {
      const { building, program } = indirectFixture(type, false);
      const access = evaluateArchitecturalEvidence(building, program).suites[0]!.access!;
      expect(access.status).toBe('SHARED');
      expect(access.pathDoorIds).toEqual([]);
    });
  it('rejects a bedroom intermediate even with forged explicit permission', () => {
    const { building, program } = indirectFixture(RoomType.Bedroom);
    expect(evaluateArchitecturalEvidence(building, program).suites[0]!.access?.status).not.toBe('PRIVATE_INDIRECT');
  });
  it('recognizes access through another explicitly owned bath as shared, not an unknown private space', () => {
    const { building, program } = indirectFixture(RoomType.Bathroom, false);
    const otherBath = { ...program.items.find(item => item.type === RoomType.Bathroom)!, id: 'dress_1', attachedToRoomId: 'other_owner' };
    expect(evaluateArchitecturalEvidence(building, { ...program, items: [...program.items, otherBath] }).suites[0]!.access?.status).toBe('SHARED');
  });
  it('supports an explicitly reviewed owner-specific access bay, not generic circulation', () => {
    const { building, program } = indirectFixture(RoomType.Corridor);
    const reviewed = { ...program, reviewedAccessSpaces: program.reviewedAccessSpaces.map(item => ({ ...item, role: 'private_access' as const })) };
    expect(evaluateArchitecturalEvidence(building, reviewed).suites[0]!.access).toMatchObject({
      status: 'PRIVATE_INDIRECT', viaRoles: ['private_access'] });
  });
  it('detects a common entry into Dressing even when the bath itself has only one door', () => {
    const { building, program, intermediate, owner } = indirectFixture();
    const common = createRoom({ floorId: owner.floorId, type: RoomType.Corridor, x: 4000, y: 4000, width: 2000, height: 2000 });
    const wall = createWall({ floorId: owner.floorId, startPoint: { x: 4000, y: 4000 }, endPoint: { x: 6000, y: 4000 }, roomIds: [intermediate.id, common.id] });
    const door = createDoor({ floorId: owner.floorId, wallId: wall.id, position: { x: 5000, y: 4000 }, connectsRooms: [intermediate.id, common.id] });
    const floor = building.floors[0]!;
    const changed = ground(building, { rooms: [...floor.rooms, common], walls: [...floor.walls, wall], doors: [...floor.doors, door] });
    expect(evaluateArchitecturalEvidence(changed, program).suites[0]!.access).toMatchObject({ status: 'SHARED', sharedEntryRoomIds: [common.id] });
  });
  it('does not traverse the owner bedroom into its normal common entry', () => {
    const { building, program, owner } = indirectFixture();
    const common = createRoom({ floorId: owner.floorId, type: RoomType.Living, x: 0, y: 4000, width: 4000, height: 3000 });
    const wall = createWall({ floorId: owner.floorId, startPoint: { x: 0, y: 4000 }, endPoint: { x: 4000, y: 4000 }, roomIds: [owner.id, common.id] });
    const door = createDoor({ floorId: owner.floorId, wallId: wall.id, position: { x: 1500, y: 4000 }, connectsRooms: [owner.id, common.id] });
    const floor = building.floors[0]!;
    expect(evaluateArchitecturalEvidence(ground(building, { rooms: [...floor.rooms, common], walls: [...floor.walls, wall], doors: [...floor.doors, door] }), program).suites[0]!.access?.status).toBe('PRIVATE_INDIRECT');
  });
  it('handles disconnected, duplicated and wrong-owner intermediate metadata conservatively', () => {
    const { building, program } = indirectFixture();
    for (const entries of [
      [...program.reviewedAccessSpaces, ...program.reviewedAccessSpaces],
      [{ ...program.reviewedAccessSpaces[0]!, programItemId: 'missing' }],
      [{ ...program.reviewedAccessSpaces[0]!, ownerProgramItemId: 'other' }],
    ]) expect(evaluateArchitecturalEvidence(building, { ...program, reviewedAccessSpaces: entries }).suites[0]!.access?.status).toBe('NOT_EVALUATED');
  });
  it('never turns a missing physical door on a reviewed chain into a path', () => {
    const { building, program, doors } = indirectFixture();
    expect(evaluateArchitecturalEvidence(ground(building, { doors: [doors[1]!] }), program).suites[0]!.access?.status).toBe('UNRESOLVED');
  });
  it('rejects an invalid physical door in an otherwise reviewed indirect path', () => {
    const { building, program, doors } = indirectFixture();
    const invalid = { ...doors[0]!, position: { x: 9000, y: 9000 } };
    expect(evaluateArchitecturalEvidence(ground(building, { doors: [invalid, doors[1]!] }), program).suites[0]!.access?.status).toBe('UNRESOLVED');
  });
  it('does not traverse an intermediate whose floor metadata is wrong', () => {
    const { building, program, intermediate } = indirectFixture();
    const changed = ground(building, { rooms: building.floors[0]!.rooms.map(room => room.id === intermediate.id
      ? { ...room, floorId: building.floors[1]!.id } : room) });
    const evidence = evaluateArchitecturalEvidence(changed, program);
    expect(evidence.suites[0]!.access?.status).toBe('NOT_EVALUATED');
    expect(evidence.suites[0]!.access?.pathDoorIds).toEqual([]);
  });
  it('keeps an unmaterialized reviewed dressing space Not evaluated rather than inventing geometry', () => {
    const { building, program, intermediate } = indirectFixture();
    const changed = ground(building, { rooms: building.floors[0]!.rooms.filter(room => room.id !== intermediate.id), doors: [] });
    expect(evaluateArchitecturalEvidence(changed, program).suites[0]!.access?.status).toBe('NOT_EVALUATED');
  });
  it('traverses cyclic private components deterministically without looping', () => {
    const { building, program, bath, intermediate } = indirectFixture();
    const extra = createRoom({ floorId: bath.floorId, type: RoomType.Custom, x: 4000, y: 4000, width: 4000, height: 2000, tags: ['program:extra_1_floor_0'] });
    const walls = [intermediate, bath].map(room => createWall({ floorId: bath.floorId, startPoint: { x: room.x, y: 4000 }, endPoint: { x: room.x + room.width, y: 4000 }, roomIds: [room.id, extra.id] }));
    const doors = [intermediate, bath].map((room, i) => createDoor({ floorId: bath.floorId, wallId: walls[i]!.id, position: { x: room.x + 1000, y: 4000 }, connectsRooms: [room.id, extra.id] }));
    const floor = building.floors[0]!;
    const changed = ground(building, { rooms: [...floor.rooms, extra], walls: [...floor.walls, ...walls], doors: [...floor.doors, ...doors] });
    const reviewed = { ...program, reviewedAccessSpaces: [...program.reviewedAccessSpaces, { programItemId: 'extra_1', ownerProgramItemId: 'owner_1', role: 'private_access' as const }] };
    const access = evaluateArchitecturalEvidence(changed, reviewed).suites[0]!.access!;
    expect(access.status).toBe('PRIVATE_INDIRECT');
    expect(new Set(access.pathRoomIds).size).toBe(access.pathRoomIds.length);
    expect(evaluateArchitecturalEvidence(ground(changed, { doors: [...changed.floors[0]!.doors].reverse() }), reviewed).suites[0]!.access).toEqual(access);
  });
  it('allows common use without inventing an owner or treating it as a suite defect', () => {
    const { building, program, owner, bath } = fixture();
    const commonBuilding = ground(building, { rooms: [{ ...owner, type: RoomType.Corridor }, bath] });
    const commonProgram = { ...program, items: program.items.filter(item => item.type === RoomType.Bathroom)
      .map(item => ({ ...item, attachedToRoomId: undefined, bathroomUse: 'common' as const, name: 'Common washroom' })) };
    const evidence = evaluateArchitecturalEvidence(commonBuilding, commonProgram);
    expect(evidence.suites).toEqual([]);
    expect(evidence.unownedBathrooms?.[0]?.ownership).toBe('COMMON_ACCESS');
    expect(evidence.status).toBe('CHECKED_REQUIREMENTS_MET');
  });
  it('does not confuse same-floor availability with an owned direct door', () => {
    const { building, program } = fixture();
    const disconnected = ground(building, { doors: [] });
    expect(evaluateMultiFloorPlanning(disconnected).bedroomBathroomPairingScore).toBe(100);
    const evidence = evaluateArchitecturalEvidence(disconnected, program);
    expect(evidence.suites[0]!.sameFloor).toBe(true);
    expect(evidence.suites[0]!.directDoorIds).toEqual([]);
    expect(evidence.suites[0]!.access?.status).toBe('UNRESOLVED');
    expect(evidence.status).toBe('REVIEW_REQUIRED');
  });
  it('records a physical private direct door without mutating its inputs', () => {
    const { building, program, door } = fixture();
    const before = JSON.stringify({ building, program });
    const evidence = evaluateArchitecturalEvidence(building, program);
    expect(evidence.suites[0]!.directDoorIds).toEqual([door.id]);
    expect(evidence.suites[0]!.status).toBe('PRIVATE_DIRECT_ACCESS');
    expect(evidence.suites[0]!.access?.status).toBe('PRIVATE_DIRECT');
    expect(evidence.requiredFloors[0]!.passed).toBe(true);
    expect(JSON.stringify({ building, program })).toBe(before);
    expect(JSON.parse(JSON.stringify(evidence))).toEqual(evidence);
  });
  it.each(['missing-wall', 'off-wall', 'wrong-floor'])('rejects a door with %s even if topology claims a connection', defect => {
    const { building, program, door } = fixture();
    const changed = { ...door, ...(defect === 'missing-wall' ? { wallId: 'missing' }
      : defect === 'off-wall' ? { position: { x: 8000, y: 1500 } } : { floorId: 'missing' }) };
    expect(evaluateArchitecturalEvidence(ground(building, { doors: [changed] }), program).suites[0]!.directDoorIds).toEqual([]);
  });
  it('requires the claimed rooms to actually touch the doorway', () => {
    const { building, program, bath } = fixture();
    const changed = ground(building, { rooms: building.floors[0]!.rooms.map(room => room.id === bath.id
      ? { ...room, boundary: rectToPolygon(8000, 8000, 2000, 2000) } : room) });
    expect(evaluateArchitecturalEvidence(changed, program).suites[0]!.directDoorIds).toEqual([]);
  });
  it('distinguishes a shared bathroom from private direct access', () => {
    const { building, program, bath, wall, door } = fixture();
    const publicRoom = createRoom({ floorId: bath.floorId, type: RoomType.Living, x: 6000, y: 0, width: 4000, height: 4000 });
    const sharedWall = { ...wall, id: 'shared-wall', startPoint: { x: 6000, y: 0 }, endPoint: { x: 6000, y: 4000 } };
    const sharedDoor = { ...door, id: 'shared-door', wallId: sharedWall.id, position: { x: 6000, y: 1500 }, connectsRooms: [bath.id, publicRoom.id] as const };
    const changed = ground(building, { rooms: [...building.floors[0]!.rooms, publicRoom], walls: [wall, sharedWall], doors: [door, sharedDoor] });
    const evidence = evaluateArchitecturalEvidence(changed, program);
    expect(evidence.suites[0]!.directDoorIds).toEqual([door.id]);
    expect(evidence.suites[0]!.status).toBe('SHARED_ACCESS');
    expect(evidence.suites[0]!.access?.status).toBe('SHARED');
    expect(evidence.status).toBe('REVIEW_REQUIRED');
  });
  it('reports missing, duplicate and wrong-floor program identities', () => {
    const { building, program, owner, bath } = fixture();
    for (const rooms of [[bath], [owner, { ...owner, id: 'duplicate' }, bath]]) {
      const evidence = evaluateArchitecturalEvidence(ground(building, { rooms }), program);
      expect(evidence.requiredFloors[0]!.passed).toBe(false);
      expect(evidence.suites[0]!.ownerId).toBeNull();
    }
    const wrongFloor = { ...building, floors: [{ ...building.floors[0]!, rooms: [bath] },
      { ...building.floors[1]!, rooms: [{ ...owner, floorId: building.floors[1]!.id }] }] };
    expect(evaluateArchitecturalEvidence(wrongFloor, program).requiredFloors[0]!.actualLevels).toEqual([1]);
    expect(evaluateArchitecturalEvidence(wrongFloor, program).status).toBe('REVIEW_REQUIRED');
    expect(evaluateArchitecturalEvidence(wrongFloor, program).suites[0]!.access?.status).toBe('UNRESOLVED');
  });
  it('does not assign an owner from an attached-bath name', () => {
    const { building, program } = fixture();
    const unknown = { ...program, items: program.items.map(item => item.type === RoomType.Bathroom
      ? { ...item, name: 'Attached Bath', attachedToRoomId: undefined } : item) };
    const evidence = evaluateArchitecturalEvidence(building, unknown);
    expect(evidence.suites).toEqual([]);
    expect(evidence.status).toBe('REVIEW_REQUIRED');
    expect(evidence.unownedBathrooms?.[0]?.ownership).toBe('AMBIGUOUS_OWNERSHIP');
  });
  it('counts every upper wet room so one perfect pair cannot hide an unstacked room', () => {
    const { building, program } = fixture();
    const floorId = building.floors[1]!.id;
    const aligned = createRoom({ floorId, type: RoomType.Bathroom, x: 4000, y: 0, width: 2000, height: 4000 });
    const unstacked = createRoom({ floorId, type: RoomType.Utility, x: 8000, y: 0, width: 2000, height: 4000 });
    const changed = { ...building, floors: [building.floors[0]!, { ...building.floors[1]!, rooms: [aligned, unstacked] }] };
    expect(evaluateMultiFloorPlanning(changed).wetAreaStackScore).toBe(100);
    const evidence = evaluateArchitecturalEvidence(changed, program);
    expect(evidence.wetStacking.coveragePercent).toBe(50);
    expect(evidence.wetStacking.rooms.map(room => room.coveragePercent)).toEqual([100, 0]);
    expect(evidence.wetStacking.rooms[1]!.lowerRoomId).toBeNull();
  });
  it('counts upper wet rooms above a dry floor as zero coverage', () => {
    const { building, program, bath } = fixture();
    const changed = { ...building, floors: [{ ...building.floors[0]!, rooms: [] },
      { ...building.floors[1]!, rooms: [{ ...bath, floorId: building.floors[1]!.id }] }] };
    expect(evaluateArchitecturalEvidence(changed, program).wetStacking.coveragePercent).toBe(0);
  });
  it('returns not applicable when there are no upper wet rooms', () => {
    const { building, program } = fixture();
    expect(evaluateArchitecturalEvidence(building, program).wetStacking.status).toBe('NOT_APPLICABLE');
    expect(evaluateArchitecturalEvidence(building, program).wetStacking.coveragePercent).toBeNull();
  });
  it('does not claim coverage across absent floor levels', () => {
    const { building, program, bath } = fixture();
    const changed = { ...building, floors: [building.floors[0]!, { ...building.floors[1]!, level: 2,
      rooms: [{ ...bath, id: 'upper-bath', floorId: building.floors[1]!.id }] }] };
    expect(evaluateArchitecturalEvidence(changed, program).wetStacking.status).toBe('NOT_EVALUATED');
  });
  it('uses polygon area and winding rather than cached area for wet coverage', () => {
    const { building, program, bath } = fixture();
    const upper = { ...bath, id: 'upper', area: 1, floorId: building.floors[1]!.id,
      boundary: { points: [...bath.boundary.points].reverse() } };
    const changed = { ...building, floors: [building.floors[0]!, { ...building.floors[1]!, rooms: [upper] }] };
    expect(evaluateArchitecturalEvidence(changed, program).wetStacking.coveragePercent).toBe(100);
  });
  it('reports explicit terrace area without calling residual area waste', () => {
    const { building, program } = fixture();
    const terrace = createRoom({ floorId: building.floors[0]!.id, type: RoomType.Terrace, x: 8000, y: 0, width: 2000, height: 2000 });
    const evidence = evaluateArchitecturalEvidence(ground(building, { rooms: [...building.floors[0]!.rooms, terrace] }), program);
    expect(evidence.openSpace[0]!.explicitOutdoorAreaMm2).toBe(4000000);
    expect(evidence.openSpace[0]!.residualUnclassifiedAreaMm2).toBe(116000000);
    expect(evidence.limitations.join(' ')).toContain('not wasted space');
  });
});
