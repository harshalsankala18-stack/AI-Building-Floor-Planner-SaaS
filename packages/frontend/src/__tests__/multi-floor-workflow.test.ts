import { beforeEach, describe, expect, it } from 'vitest';
import { RoomType, addRoom, createBuilding } from '@ai-floor-planner/core';
import { createExportArtifact, DEFAULT_ADVANCED_EXPORT_SETTINGS } from '../services/advanced-export';
import { LocalStorageProjectStorage } from '../services/storage';

function makeBuilding() {
  let building = createBuilding({
    projectId: 'multi-workflow',
    name: 'Multi-floor Workflow',
    site: { plotWidth: 12000, plotDepth: 18000 },
    floors: Array.from({ length: 4 }, (_, level) => ({
      buildingId: '', level, name: level === 0 ? 'Ground Floor' : `Floor ${level}`,
      boundary: {
        points: [
          { x: 1000, y: 1500 },
          { x: 11000, y: 1500 },
          { x: 11000, y: 15000 - level * 1000 },
          { x: 1000, y: 15000 - level * 1000 },
        ],
      },
    })),
  });
  for (const floor of building.floors) {
    building = addRoom(building, floor.id, {
      floorId: floor.id,
      type: RoomType.Bedroom,
      name: `Unique Room Level ${floor.level}`,
      x: 1000,
      y: 1500,
      width: 4200,
      height: 4000,
    });
  }
  return building;
}

describe('multi-floor persistence and export workflow', () => {
  const memory: Record<string, string> = {};

  beforeEach(() => {
    for (const key of Object.keys(memory)) delete memory[key];
    globalThis.localStorage = {
      getItem: key => memory[key] ?? null,
      setItem: (key, value) => { memory[key] = value; },
      removeItem: key => { delete memory[key]; },
      clear: () => { for (const key of Object.keys(memory)) delete memory[key]; },
      key: index => Object.keys(memory)[index] ?? null,
      get length() { return Object.keys(memory).length; },
    } as Storage;
  });

  it('saves and reloads every floor and entity without loss', () => {
    const building = makeBuilding();
    const storage = new LocalStorageProjectStorage();
    storage.save({
      schemaVersion: 2,
      projectId: building.projectId,
      name: building.name,
      createdAt: building.createdAt,
      updatedAt: building.updatedAt,
      building,
    });
    const loaded = storage.load(building.projectId);
    expect(loaded?.building).toEqual(building);
    expect(loaded?.building.floors).toHaveLength(4);
    expect(loaded?.building.floors.map(floor => floor.rooms[0]!.name))
      .toEqual(building.floors.map(floor => floor.rooms[0]!.name));
  });

  it('exports each selected floor independently and exports all floors in JSON', () => {
    const building = makeBuilding();
    for (const floor of building.floors) {
      const artifact = createExportArtifact(building, {
        ...DEFAULT_ADVANCED_EXPORT_SETTINGS,
        format: 'svg',
        floorId: floor.id,
      });
      expect(artifact.content).toContain(`Unique Room Level ${floor.level}`);
      for (const other of building.floors.filter(candidate => candidate.id !== floor.id)) {
        expect(artifact.content).not.toContain(`Unique Room Level ${other.level}`);
      }
    }

    const json = createExportArtifact(building, {
      ...DEFAULT_ADVANCED_EXPORT_SETTINGS,
      format: 'json',
      floorId: building.floors[2]!.id,
    });
    expect(JSON.parse(json.content as string).building.floors).toHaveLength(4);

    const pdf = createExportArtifact(building, {
      ...DEFAULT_ADVANCED_EXPORT_SETTINGS,
      format: 'pdf',
      floorId: building.floors[3]!.id,
    });
    expect(pdf.content).toContain('Unique Room Level 3');
    expect(pdf.content).not.toContain('Unique Room Level 0');
  });
});
