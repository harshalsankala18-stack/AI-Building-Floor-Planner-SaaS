import { describe, expect, it } from 'vitest';
import { createBuilding, createRoom, createWall, createDoor, createProgramItem, getSpaceDefinition,
  createEmptySpaceProgram, adaptSpaceProgramToPlannerProgram, rectToPolygon, RoomType, architecturalReviewState,
  createDefaultFootprintIntent, type RoomProgram } from '@ai-floor-planner/core';
import { evaluateArchitecturalEvidence } from '../evidence/architectural-evidence';
import { runGenerationWorkflow } from '../generation/workflow';

function fixture(types = ['living', 'kitchen', 'utility']) {
  const adapted = adaptSpaceProgramToPlannerProgram({ ...createEmptySpaceProgram('residential'), items: types.map((type, i) =>
    createProgramItem(getSpaceDefinition(type === 'foyer' ? 'living' : type)!, `item${i}`, { quantity: 1 })) }, 1);
  // Explicit existing-model transition fixture, not enabling program-only generation.
  const program = { ...adapted, items: adapted.items.map((item, i) => types[i] === 'foyer' ? { ...item, type: RoomType.Foyer } : item) };
  const base = createBuilding({ projectId: 'closeout', name: 'Topology, not reference coordinates',
    site: { plotWidth: 9000, plotDepth: 4000 }, floors: [{ buildingId: '', level: 0, boundary: rectToPolygon(0, 0, 9000, 4000) }] });
  const floor = base.floors[0]!;
  const rooms = program.items.map((item, i) => createRoom({ floorId: floor.id, type: item.type,
    x: i * 3000, y: 0, width: 3000, height: 4000, tags: [`program:${item.id}_floor_0`] }));
  const walls = rooms.map((room, i) => createWall({ floorId: floor.id, startPoint: { x: i * 3000, y: 0 },
    endPoint: { x: i * 3000, y: 4000 }, roomIds: i ? [rooms[i - 1]!.id, room.id] : [room.id] }));
  const doors = rooms.map((room, i) => createDoor({ floorId: floor.id, wallId: walls[i]!.id,
    position: { x: i * 3000, y: 1500 }, connectsRooms: [i ? rooms[i - 1]!.id : '__outside__', room.id] }));
  return { building: { ...base, floors: [{ ...floor, rooms, walls, doors }] }, program };
}
describe('bounded architectural acceptance closeout', () => {
  it('binds evidence to the final workflow candidate after approved-site metadata is applied', async () => {
    const program = { ...createEmptySpaceProgram('residential'), items: ['living', 'kitchen', 'bedroom', 'common_bathroom'].map((type, i) =>
      createProgramItem(getSpaceDefinition(type)!, `p${i}`, { quantity: 1 })) };
    const building = createBuilding({ projectId: 'final-evidence', name: 'Final workflow identity',
      site: { plotWidth: 16000, plotDepth: 18000, plannedFloorCount: 1 }, floors: [{ buildingId: '', level: 0 }] });
    const result = await runGenerationWorkflow({ building, program, footprint: createDefaultFootprintIntent(building), category: 'residential' });
    const intent = adaptSpaceProgramToPlannerProgram(program, 1);
    expect(result.candidates.length).toBeGreaterThan(0);
    for (const candidate of result.candidates) {
      expect(architecturalReviewState(candidate.architecturalEvidence, candidate.building, intent)).not.toBe('NOT_EVALUATED');
      expect(architecturalReviewState(candidate.architecturalEvidence, candidate.building, { ...intent,
        items: intent.items.map(item => ({ ...item, targetAreaMm2: item.targetAreaMm2 + 1 })) })).toBe('NOT_EVALUATED');
    }
  });
  it('accepts a small fully connected example without optional Store or Balcony', () => {
    const { building, program } = fixture();
    const before = JSON.stringify({ building, program });
    const evidence = evaluateArchitecturalEvidence(building, program);
    expect(evidence.closeout!.review).toBe('ARCHITECTURALLY_ACCEPTABLE');
    expect(evidence.closeout!.kitchenService.find(item => item.relationship === 'KITCHEN_STORE')!.status).toBe('NOT_APPLICABLE');
    expect(evidence.closeout!.exposure.every(item => item.status === 'EXTERIOR_OPPORTUNITY')).toBe(true);
    expect(JSON.stringify({ building, program })).toBe(before);
  });
  it('does not require an optional Utility', () => {
    const { building, program } = fixture(['living', 'dining', 'kitchen']);
    const result = evaluateArchitecturalEvidence(building, program).closeout!;
    expect(result.review).toBe('ARCHITECTURALLY_ACCEPTABLE');
    expect(result.kitchenService.find(item => item.relationship === 'KITCHEN_UTILITY')!.status).toBe('NOT_APPLICABLE');
    expect(result.kitchenService.find(item => item.relationship === 'KITCHEN_DINING')!.status).toBe('DIRECT_CONNECTION');
  });
  it('supports the RBEA-003 common-mediated service topology without requiring a direct door', () => {
    const { building, program } = fixture(['kitchen', 'living', 'utility']);
    const result = evaluateArchitecturalEvidence(building, program).closeout!;
    expect(result.kitchenService.find(item => item.relationship === 'KITCHEN_UTILITY')).toMatchObject({ status: 'SHORT_FUNCTIONAL_PATH', pathDoorIds: expect.any(Array) });
    expect(result.kitchenService.find(item => item.relationship === 'KITCHEN_UTILITY')!.pathDoorIds).toHaveLength(2);
  });
  it('blocks compulsory unrelated-bedroom transit, not merely a low score', () => {
    const { building, program } = fixture(['living', 'bedroom', 'kitchen']);
    const result = evaluateArchitecturalEvidence(building, program).closeout!;
    expect(result.review).toBe('REVIEW_REQUIRED');
    expect(result.circulation.find(item => item.roomId === building.floors[0]!.rooms[2]!.id)!.status).toBe('PRIVATE_TRANSIT_REQUIRED');
  });
  it('cannot accept an explicitly owned inaccessible bath', () => {
    const { building, program } = fixture(['living', 'bedroom', 'attached_bathroom']);
    const owned: RoomProgram = { ...program, items: program.items.map((item, i) => i === 2 ? { ...item, attachedToRoomId: program.items[1]!.id } : item) };
    const disconnected = { ...building, floors: [{ ...building.floors[0]!, doors: building.floors[0]!.doors.slice(0, 2) }] };
    const result = evaluateArchitecturalEvidence(disconnected, owned).closeout!;
    expect(result.review).toBe('REVIEW_REQUIRED');
    expect(result.blockers.join(' ')).toContain('Owned bathroom');
  });
  it('does not call bedroom transit compulsory when a valid arrival alternative exists', () => {
    const { building, program } = fixture(['living', 'bedroom', 'kitchen']);
    const floor = building.floors[0]!;
    const kitchen = floor.rooms[2]!;
    const wall = createWall({ floorId: floor.id, startPoint: { x: 9000, y: 0 }, endPoint: { x: 9000, y: 4000 }, roomIds: [kitchen.id] });
    const door = createDoor({ floorId: floor.id, wallId: wall.id, position: { x: 9000, y: 1500 }, connectsRooms: ['__outside__', kitchen.id] });
    const changed = { ...building, floors: [{ ...floor, walls: [...floor.walls, wall], doors: [...floor.doors, door] }] };
    expect(evaluateArchitecturalEvidence(changed, program).closeout!.circulation.find(item => item.roomId === kitchen.id)!.status).toBe('NO_PRIVATE_TRANSIT_REQUIRED');
  });
  it('does not treat an outside label on an internal wall as a verified arrival', () => {
    const { building, program } = fixture();
    const floor = building.floors[0]!;
    const fake = { ...floor.doors[1]!, connectsRooms: ['__outside__', floor.rooms[1]!.id] as const };
    const changed = { ...building, floors: [{ ...floor, doors: [fake, floor.doors[2]!] }] };
    expect(evaluateArchitecturalEvidence(changed, program).closeout!.circulation.every(item => item.status === 'NOT_EVALUATED')).toBe(true);
  });
  it('cannot accept stale evidence after a door or reviewed floor intent changes', () => {
    const { building, program } = fixture();
    const evidence = evaluateArchitecturalEvidence(building, program);
    expect(architecturalReviewState(evidence, { ...building, floors: [{ ...building.floors[0]!, doors: [] }] }, program)).toBe('NOT_EVALUATED');
    expect(architecturalReviewState(evidence, building, { ...program, items: program.items.map(item => ({ ...item, floorPreference: { kind: 'ground_required' } })) })).toBe('NOT_EVALUATED');
  });
  it('keeps disconnected topology unknown and does not infer a door from proximity', () => {
    const { building, program } = fixture();
    const disconnected = { ...building, floors: [{ ...building.floors[0]!, doors: [] }] };
    const result = evaluateArchitecturalEvidence(disconnected, program).closeout!;
    expect(result.review).toBe('REVIEW_REQUIRED');
    expect(result.circulation.every(item => item.status === 'NOT_EVALUATED')).toBe(true);
    expect(result.kitchenService.find(item => item.relationship === 'KITCHEN_UTILITY')!.status).toBe('UNRESOLVED');
  });
  it('preserves typed transitions and unclassified residual without assigning waste', () => {
    const { building, program } = fixture(['living', 'foyer', 'kitchen']);
    const result = evaluateArchitecturalEvidence(building, program);
    expect(result.closeout!.transitionRoomIds).toEqual([building.floors[0]!.rooms.find(room => room.type === RoomType.Foyer)!.id]);
    expect(result.openSpace[0]!.residualUnclassifiedAreaMm2).toBe(0);
    expect(result.openSpace[0]!.explicitOutdoorRoomIds).toEqual([]);
  });
});
