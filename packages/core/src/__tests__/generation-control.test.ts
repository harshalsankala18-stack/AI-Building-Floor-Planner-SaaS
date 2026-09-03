import { describe, expect, it } from 'vitest';
import {
  RoomType,
  addRoom,
  createBuilding,
  createGenerationControlState,
  updateGenerationControl,
  validateGenerationControl,
} from '../index';

function fixture() {
  const base = createBuilding({ projectId: 'locks', name: 'Locks', site: { plotWidth: 10_000, plotDepth: 12_000 }, floors: [{ buildingId: '', level: 0 }] });
  const floorId = base.floors[0]!.id;
  return addRoom(base, floorId, { floorId, type: RoomType.Living, name: 'Living', x: 0, y: 0, width: 4000, height: 4000 });
}

describe('generation control', () => {
  it('creates footprint-protected empty control state', () => {
    expect(createGenerationControlState('2026-01-01T00:00:00.000Z')).toMatchObject({ footprintLocked: true, lockedEntityIds: [], lockedFloorIds: [], protectedCoreIds: [] });
  });

  it('locks and unlocks rooms deterministically without changing Building geometry', () => {
    const building = fixture(); const room = building.floors[0]!.rooms[0]!; const before = JSON.stringify(building);
    const locked = updateGenerationControl(createGenerationControlState(), { lockedEntityIds: [room.id, room.id] }, '2026-01-01T00:00:00.000Z');
    expect(locked.lockedEntityIds).toEqual([room.id]);
    expect(updateGenerationControl(locked, { lockedEntityIds: [] }).lockedEntityIds).toEqual([]);
    expect(JSON.stringify(building)).toBe(before);
  });

  it('supports multiple entity and floor locks', () => {
    const building = fixture(); const floor = building.floors[0]!; const room = floor.rooms[0]!;
    const state = updateGenerationControl(createGenerationControlState(), { lockedEntityIds: [room.id], lockedFloorIds: [floor.id] });
    expect(validateGenerationControl(state, building).state).toMatchObject({ lockedEntityIds: [room.id], lockedFloorIds: [floor.id] });
  });

  it('removes orphan entity, floor and core lock references safely', () => {
    const building = fixture();
    const state = updateGenerationControl(createGenerationControlState(), { lockedEntityIds: ['missing-room'], lockedFloorIds: ['missing-floor'], protectedCoreIds: ['missing-core'] });
    const result = validateGenerationControl(state, building);
    expect(result.state).toMatchObject({ lockedEntityIds: [], lockedFloorIds: [], protectedCoreIds: [] });
    expect(result.removedEntityIds).toEqual(['missing-room']);
    expect(result.removedFloorIds).toEqual(['missing-floor']);
    expect(result.removedCoreIds).toEqual(['missing-core']);
  });

});
