import {
  DEFAULT_PROJECTION_SETTINGS,
  resolveProjectionSettings,
  type Building3DProjectionSettings,
  type ProjectionSource,
} from '@ai-floor-planner/projection-3d';
import type { EditorSelection } from '@ai-floor-planner/core';

export type ModelViewMode = 'solid' | 'xray' | 'rooms';
export type ModelCameraPreset = 'isometric' | 'front' | 'back' | 'left' | 'right' | 'top';
export type ModelFloorMode = 'all' | 'active' | 'isolate';

export interface ModelLayerVisibility {
  readonly site: boolean;
  readonly floorPlates: boolean;
  readonly walls: boolean;
  readonly openings: boolean;
  readonly stairs: boolean;
  readonly rooms: boolean;
  readonly labels: boolean;
}

export interface ModelViewPreferences {
  readonly viewMode: ModelViewMode;
  readonly cameraPreset: ModelCameraPreset;
  readonly floorMode: ModelFloorMode;
  readonly exploded: boolean;
  readonly layers: ModelLayerVisibility;
  readonly heightSettings: Building3DProjectionSettings;
}

export const DEFAULT_MODEL_VIEW_PREFERENCES: ModelViewPreferences = {
  viewMode: 'solid',
  cameraPreset: 'isometric',
  floorMode: 'all',
  exploded: false,
  layers: { site: true, floorPlates: true, walls: true, openings: true, stairs: true, rooms: false, labels: true },
  heightSettings: DEFAULT_PROJECTION_SETTINGS,
};

function storageKey(projectId: string): string {
  return `ai-building:model-view:${projectId}`;
}

export function loadModelViewPreferences(projectId: string, storage: Pick<Storage, 'getItem'> = localStorage): ModelViewPreferences {
  try {
    const raw = storage.getItem(storageKey(projectId));
    if (!raw) return DEFAULT_MODEL_VIEW_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<ModelViewPreferences>;
    return {
      viewMode: parsed.viewMode === 'xray' || parsed.viewMode === 'rooms' ? parsed.viewMode : 'solid',
      cameraPreset: ['isometric', 'front', 'back', 'left', 'right', 'top'].includes(parsed.cameraPreset ?? '') ? parsed.cameraPreset! : 'isometric',
      floorMode: parsed.floorMode === 'active' || parsed.floorMode === 'isolate' ? parsed.floorMode : 'all',
      exploded: parsed.exploded === true,
      layers: { ...DEFAULT_MODEL_VIEW_PREFERENCES.layers, ...parsed.layers },
      heightSettings: resolveProjectionSettings(parsed.heightSettings),
    };
  } catch {
    return DEFAULT_MODEL_VIEW_PREFERENCES;
  }
}

export function saveModelViewPreferences(projectId: string, preferences: ModelViewPreferences, storage: Pick<Storage, 'setItem'> = localStorage): void {
  storage.setItem(storageKey(projectId), JSON.stringify(preferences));
}

export function projectionSourceToSelection(source: ProjectionSource): (EditorSelection & { readonly floorId: string }) | null {
  if (!source.floorId || source.sourceEntityType === 'floor' || source.sourceEntityType === 'site') return null;
  return { entityType: source.sourceEntityType, entityId: source.sourceEntityId, floorId: source.floorId } as EditorSelection & { readonly floorId: string };
}

export function isProjectionSourceSelected(source: ProjectionSource, selection: EditorSelection | null): boolean {
  return Boolean(selection && source.sourceEntityId === selection.entityId && source.floorId === selection.floorId);
}
