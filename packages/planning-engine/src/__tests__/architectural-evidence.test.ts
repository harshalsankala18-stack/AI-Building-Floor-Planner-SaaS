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

describe('architectural evidence independent of candidate ranking', () => {
  it('does not confuse same-floor availability with an owned direct door', () => {
    const { building, program } = fixture();
    const disconnected = ground(building, { doors: [] });
    expect(evaluateMultiFloorPlanning(disconnected).bedroomBathroomPairingScore).toBe(100);
    const evidence = evaluateArchitecturalEvidence(disconnected, program);
    expect(evidence.suites[0]!.sameFloor).toBe(true);
    expect(evidence.suites[0]!.directDoorIds).toEqual([]);
    expect(evidence.status).toBe('REVIEW_REQUIRED');
  });
  it('records a physical private direct door without mutating its inputs', () => {
    const { building, program, door } = fixture();
    const before = JSON.stringify({ building, program });
    const evidence = evaluateArchitecturalEvidence(building, program);
    expect(evidence.suites[0]!.directDoorIds).toEqual([door.id]);
    expect(evidence.suites[0]!.status).toBe('PRIVATE_DIRECT_ACCESS');
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
  });
  it('does not assign an owner from an attached-bath name', () => {
    const { building, program } = fixture();
    const unknown = { ...program, items: program.items.map(item => item.type === RoomType.Bathroom
      ? { ...item, name: 'Attached Bath', attachedToRoomId: undefined } : item) };
    const evidence = evaluateArchitecturalEvidence(building, unknown);
    expect(evidence.suites).toEqual([]);
    expect(evidence.status).toBe('REVIEW_REQUIRED');
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
