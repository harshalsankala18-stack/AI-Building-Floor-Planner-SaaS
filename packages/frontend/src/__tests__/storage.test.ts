import { describe, it, expect, beforeEach } from 'vitest';
import {
  LocalStorageProjectStorage,
  createCanonical30x50_2BHK,
  createEmptyPlot,
  parseAndValidateProjectJson,
} from '../services/storage';
import { serializeBuilding } from '@ai-floor-planner/core';
import { PlanValidator } from '@ai-floor-planner/constraint-engine';

describe('Frontend Persistence & Storage Service', () => {
  let storage: LocalStorageProjectStorage;

  // Simple in-memory mock for localStorage in testing environment
  const mockStore: Record<string, string> = {};
  beforeEach(() => {
    storage = new LocalStorageProjectStorage();
    for (const key of Object.keys(mockStore)) delete mockStore[key];

    globalThis.localStorage = {
      getItem: (key: string) => mockStore[key] ?? null,
      setItem: (key: string, val: string) => { mockStore[key] = val; },
      removeItem: (key: string) => { delete mockStore[key]; },
      clear: () => { for (const key of Object.keys(mockStore)) delete mockStore[key]; },
      key: (i: number) => Object.keys(mockStore)[i] ?? null,
      length: 0,
    } as any;
    Object.defineProperty(globalThis.localStorage, 'length', {
      get: () => Object.keys(mockStore).length,
    });
  });

  it('creates and saves canonical 30x50 2BHK plan', () => {
    const building = createCanonical30x50_2BHK();
    expect(building.floors[0]!.rooms.length).toBe(6);
    expect(building.site.plotWidth).toBe(9144);
    expect(building.site.plotDepth).toBe(15240);
    const validation = new PlanValidator().validate(building, {
      requiredRoomCounts: {
        living: 1,
        dining: 1,
        kitchen: 1,
        bedroom: 2,
        bathroom: 1,
      },
    });
    expect(validation.isValid).toBe(true);
    expect(validation.failed).toBe(0);

    storage.save({
      schemaVersion: 1,
      projectId: building.projectId,
      name: building.name,
      createdAt: building.createdAt,
      updatedAt: building.updatedAt,
      building,
    });

    const loaded = storage.load(building.projectId);
    expect(loaded).not.toBeNull();
    expect(loaded?.name).toBe('Canonical 30×50 2BHK');
    expect(loaded?.building.floors[0]!.rooms.length).toBe(6);
    expect(loaded?.category).toBe('residential');
    expect(loaded?.status).toBe('CONCEPT');
  });

  it('lists honest project-shell metadata and activates only stored projects', () => {
    const building = createCanonical30x50_2BHK('Project Shell Test', 'project-shell-test');
    storage.save({
      schemaVersion: 3,
      projectId: building.projectId,
      name: building.name,
      createdAt: building.createdAt,
      updatedAt: '2026-08-30T00:00:00.000Z',
      building,
      category: 'educational',
      status: 'CONCEPT',
    });

    expect(storage.list()).toEqual([expect.objectContaining({
      id: 'project-shell-test',
      category: 'educational',
      status: 'CONCEPT',
      floorCount: 1,
      roomCount: 6,
      plotWidth: 9144,
      plotDepth: 15240,
    })]);
    expect(storage.setActiveProjectId('project-shell-test')).toBe(true);
    expect(storage.setActiveProjectId('missing-project')).toBe(false);
  });

  it('creates unique canonical projects unless an explicit id is supplied', () => {
    const first = createCanonical30x50_2BHK('First', 'first-project');
    const second = createCanonical30x50_2BHK('Second', 'second-project');
    expect(first.projectId).toBe('first-project');
    expect(second.projectId).toBe('second-project');
    expect(first.projectId).not.toBe(second.projectId);
  });

  it('creates empty plot building', () => {
    const custom = createEmptyPlot(12000, 18000, 'Custom Villa');
    expect(custom.site.plotWidth).toBe(12000);
    expect(custom.site.plotDepth).toBe(18000);
    expect(custom.floors[0]!.rooms.length).toBe(0);
  });

  it('validates and parses valid project JSON', () => {
    const building = createCanonical30x50_2BHK();
    const jsonStr = JSON.stringify({
      schemaVersion: 1,
      projectId: 'p123',
      name: 'Import Test',
      building: JSON.parse(serializeBuilding(building)),
    });

    const envelope = parseAndValidateProjectJson(jsonStr);
    expect(envelope.name).toBe('Import Test');
    expect(envelope.building.floors[0]!.rooms.length).toBe(6);
  });

  it('rejects malformed or invalid JSON safely', () => {
    expect(() => parseAndValidateProjectJson('invalid json string')).toThrow('Invalid JSON file format.');
    expect(() => parseAndValidateProjectJson('{}')).toThrow();
  });
});
