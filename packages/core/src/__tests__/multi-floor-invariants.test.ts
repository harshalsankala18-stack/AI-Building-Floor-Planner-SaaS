import { describe, expect, it } from 'vitest';
import {
  EditorEngine,
  RoomType,
  SwitchFloorCommand,
  addRoom,
  createBuilding,
  deserializeBuilding,
  serializeBuilding,
  validateBuildingSchema,
} from '../index';

function makeBuilding() {
  let building = createBuilding({
    projectId: 'multi-floor-invariants',
    name: 'Multi-floor invariant model',
    site: { plotWidth: 12000, plotDepth: 18000 },
    floors: Array.from({ length: 4 }, (_, level) => ({
      buildingId: '', level, name: level === 0 ? 'Ground Floor' : `Floor ${level}`,
    })),
  });
  for (const floor of building.floors) {
    building = addRoom(building, floor.id, {
      floorId: floor.id,
      type: RoomType.Bedroom,
      name: `Bedroom ${floor.level}`,
      x: 1000,
      y: 1000,
      width: 3600,
      height: 3600,
    });
  }
  return building;
}

describe('multi-floor model invariants', () => {
  it('rejects duplicate floor IDs, duplicate levels, and mismatched ownership', () => {
    const building = makeBuilding();
    const invalid = {
      ...building,
      floors: [
        building.floors[0]!,
        {
          ...building.floors[1]!,
          id: building.floors[0]!.id,
          level: building.floors[0]!.level,
          buildingId: 'wrong-building',
          rooms: [{ ...building.floors[1]!.rooms[0]!, floorId: 'wrong-floor' }],
        },
      ],
    };
    const errors = validateBuildingSchema(invalid);
    expect(errors.some(error => /Duplicate floor id/.test(error.message))).toBe(true);
    expect(errors.some(error => /Duplicate floor level/.test(error.message))).toBe(true);
    expect(errors.some(error => /does not match building id/.test(error.message))).toBe(true);
    expect(errors.some(error => /does not match parent floor id/.test(error.message))).toBe(true);
  });

  it('rapid floor switching changes only editor state and rejects unknown floor IDs', () => {
    const building = makeBuilding();
    const serializedBefore = serializeBuilding(building);
    const editor = new EditorEngine(building);
    const sequence = [3, 1, 2, 0, 3, 2, 1];
    for (const index of sequence) editor.execute(new SwitchFloorCommand(building.floors[index]!.id));
    expect(editor.getState().activeFloorId).toBe(building.floors[1]!.id);
    expect(serializeBuilding(editor.getBuilding())).toBe(serializedBefore);

    editor.execute(new SwitchFloorCommand('missing-floor'));
    expect(editor.getState().activeFloorId).toBe(building.floors[1]!.id);
    expect(serializeBuilding(editor.getBuilding())).toBe(serializedBefore);
  });

  it('preserves every floor and entity through serialization', () => {
    const building = makeBuilding();
    const restored = deserializeBuilding(serializeBuilding(building));
    expect(restored).toEqual(building);
    expect(restored.floors.map(floor => floor.id)).toEqual(building.floors.map(floor => floor.id));
    expect(restored.floors.map(floor => floor.rooms[0]!.id)).toEqual(building.floors.map(floor => floor.rooms[0]!.id));
  });
});
