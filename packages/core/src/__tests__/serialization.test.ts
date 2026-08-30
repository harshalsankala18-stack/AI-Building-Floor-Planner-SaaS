import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createBuilding,
  addRoom,
  serializeBuilding,
  deserializeBuilding,
  cloneBuilding,
  setIdSeed,
  resetIdGenerator,
  RoomType,
  DeserializationError,
} from '../index';
import * as fs from 'fs';
import * as path from 'path';

describe('Serialization', () => {
  beforeEach(() => setIdSeed(200));
  afterEach(() => resetIdGenerator());

  function makePopulatedBuilding() {
    let building = createBuilding({
      projectId: 'test',
      name: 'Serialization Test',
      site: { plotWidth: 9144, plotDepth: 15240, setbacks: { front: 1500, rear: 1000, left: 900, right: 900 } },
      floors: [{ buildingId: '', level: 0, name: 'Ground Floor' }],
    });
    const floorId = building.floors[0]!.id;

    building = addRoom(building, floorId, {
      floorId, type: RoomType.Bedroom, x: 900, y: 1500, width: 4000, height: 4000,
    });
    building = addRoom(building, floorId, {
      floorId, type: RoomType.Kitchen, x: 4900, y: 1500, width: 3000, height: 3000,
    });

    return building;
  }

  it('round-trips through JSON without data loss', () => {
    const original = makePopulatedBuilding();
    const json = serializeBuilding(original);
    const restored = deserializeBuilding(json);

    expect(restored.id).toBe(original.id);
    expect(restored.name).toBe(original.name);
    expect(restored.floors).toHaveLength(original.floors.length);
    expect(restored.floors[0]!.rooms).toHaveLength(original.floors[0]!.rooms.length);
    expect(restored.floors[0]!.rooms[0]!.area).toBe(original.floors[0]!.rooms[0]!.area);
  });

  it('preserves UUIDs across serialization', () => {
    const original = makePopulatedBuilding();
    const json = serializeBuilding(original);
    const restored = deserializeBuilding(json);

    expect(restored.id).toBe(original.id);
    expect(restored.site.id).toBe(original.site.id);
    expect(restored.floors[0]!.id).toBe(original.floors[0]!.id);
    expect(restored.floors[0]!.rooms[0]!.id).toBe(original.floors[0]!.rooms[0]!.id);
  });

  it('enums serialized as string values', () => {
    const original = makePopulatedBuilding();
    const json = serializeBuilding(original);
    expect(json).toContain('"bedroom"');
    expect(json).toContain('"kitchen"');
  });

  it('points serialized as { x, y } objects', () => {
    const original = makePopulatedBuilding();
    const json = serializeBuilding(original);
    const parsed = JSON.parse(json);
    expect(parsed.site.plotBoundary.points[0]).toHaveProperty('x');
    expect(parsed.site.plotBoundary.points[0]).toHaveProperty('y');
  });

  it('throws DeserializationError for invalid JSON', () => {
    expect(() => deserializeBuilding('not json')).toThrow(DeserializationError);
  });

  it('throws DeserializationError for structurally invalid data', () => {
    expect(() => deserializeBuilding('{"invalid": true}')).toThrow(DeserializationError);
  });

  it('cloneBuilding produces independent copy', () => {
    const original = makePopulatedBuilding();
    const clone = cloneBuilding(original);
    expect(clone).toEqual(original);
    expect(clone).not.toBe(original);
  });

  it('fixture files deserialize without error', () => {
    const cwdFixtures = path.resolve(process.cwd(), 'tests/fixtures');
    const fixturesDir = fs.existsSync(cwdFixtures) ? cwdFixtures : path.resolve(__dirname, '../../../../tests/fixtures');
    const files = fs.readdirSync(fixturesDir).filter((f: string) => f.endsWith('.json'));
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const json = fs.readFileSync(path.join(fixturesDir, file), 'utf-8');
      try {
        const building = deserializeBuilding(json);
        expect(building.id).toBeTruthy();
      } catch (err) {
        console.error(`Failed deserializing fixture: ${file}`, err);
        throw err;
      }
    }
  });
});
