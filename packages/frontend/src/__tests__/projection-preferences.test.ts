import { DEFAULT_PROJECTION_SETTINGS } from '@ai-floor-planner/projection-3d';
import { describe, expect, it } from 'vitest';
import { isProjectionSourceSelected, loadModelViewPreferences, projectionSourceToSelection, saveModelViewPreferences } from '../services/projection-preferences';

describe('3D model view preferences and selection bridge', () => {
  it('falls back safely when no persisted view state exists', () => {
    const storage = { getItem: () => null };
    expect(loadModelViewPreferences('project', storage)).toMatchObject({ viewMode: 'solid', cameraPreset: 'isometric', floorMode: 'all', exploded: false });
  });

  it('round-trips project-scoped view state without putting camera data in Building', () => {
    let value = '';
    const storage = { getItem: () => value || null, setItem: (_key: string, next: string) => { value = next; } };
    const preferences = { viewMode: 'xray' as const, cameraPreset: 'top' as const, floorMode: 'isolate' as const, exploded: true, layers: { site: false, floorPlates: true, walls: true, openings: true, stairs: true, rooms: true, labels: false }, heightSettings: DEFAULT_PROJECTION_SETTINGS };
    saveModelViewPreferences('project', preferences, storage);
    expect(loadModelViewPreferences('project', storage)).toEqual(preferences);
  });

  it('maps a 3D wall source back to the canonical editor selection ID', () => {
    const source = { sourceEntityType: 'wall' as const, sourceEntityId: 'wall-1', floorId: 'floor-1' };
    const selection = projectionSourceToSelection(source)!;
    expect(selection).toEqual({ entityType: 'wall', entityId: 'wall-1', floorId: 'floor-1' });
    expect(isProjectionSourceSelected(source, selection)).toBe(true);
  });

  it('does not create disconnected selection records for site or floor view objects', () => {
    expect(projectionSourceToSelection({ sourceEntityType: 'site', sourceEntityId: 'site-1' })).toBeNull();
    expect(projectionSourceToSelection({ sourceEntityType: 'floor', sourceEntityId: 'floor-1', floorId: 'floor-1' })).toBeNull();
  });


});
