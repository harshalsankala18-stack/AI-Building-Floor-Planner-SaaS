import React, { useEffect, useMemo, useState } from 'react';
import { Box, Building2, Eye, Focus, Layers3, PanelTop, Rotate3D, Ruler, Settings2 } from 'lucide-react';
import type { Building, EditorSelection } from '@ai-floor-planner/core';
import { Building3DProjector, type Building3DProjectionSettings, type ProjectionParameter, type ProjectionSource } from '@ai-floor-planner/projection-3d';
import { ThreeBuildingScene } from './ThreeBuildingScene';
import {
  loadModelViewPreferences,
  projectionSourceToSelection,
  saveModelViewPreferences,
  type ModelLayerVisibility,
  type ModelViewPreferences,
} from '../../services/projection-preferences';

interface ModelWorkspaceProps {
  readonly building: Building;
  readonly activeFloorId: string;
  readonly selection: EditorSelection | null;
  readonly onSelectEntity: (entityType: string, entityId: string, floorId: string) => void;
  readonly onClearSelection: () => void;
  readonly onSwitchFloor: (floorId: string) => void;
}

const projector = new Building3DProjector();

function updateParameter(settings: Building3DProjectionSettings, key: keyof Building3DProjectionSettings, rawValue: string): Building3DProjectionSettings {
  const value = Number(rawValue);
  if (!Number.isFinite(value) || value <= 0) return settings;
  return { ...settings, [key]: { value, provenance: 'USER_PROVIDED' } satisfies ProjectionParameter };
}

export const ModelWorkspace: React.FC<ModelWorkspaceProps> = ({ building, activeFloorId, selection, onSelectEntity, onClearSelection, onSwitchFloor }) => {
  const [preferences, setPreferences] = useState<ModelViewPreferences>(() => loadModelViewPreferences(building.projectId));
  const [fitRequest, setFitRequest] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const projection = useMemo(() => projector.project(building, preferences.heightSettings), [building, preferences.heightSettings]);

  useEffect(() => { setPreferences(loadModelViewPreferences(building.projectId)); }, [building.projectId]);
  useEffect(() => { saveModelViewPreferences(building.projectId, preferences); }, [building.projectId, preferences]);

  const update = <K extends keyof ModelViewPreferences,>(key: K, value: ModelViewPreferences[K]) => setPreferences(current => ({ ...current, [key]: value }));
  const toggleLayer = (key: keyof ModelLayerVisibility) => setPreferences(current => ({ ...current, layers: { ...current.layers, [key]: !current.layers[key] } }));
  const handleSelect = (source: ProjectionSource) => {
    const mapped = projectionSourceToSelection(source);
    if (!mapped) return;
    onSwitchFloor(mapped.floorId);
    onSelectEntity(mapped.entityType, mapped.entityId, mapped.floorId);
  };

  if (projection.floorPlates.every(plate => plate.boundary.points.length < 3)) {
    return <div className="model-empty-state"><Box size={38} /><strong>NO BUILDING GEOMETRY AVAILABLE</strong><p>Create or load valid floor geometry before opening the structured model.</p></div>;
  }

  const selectedLevel = projection.levels.find(level => level.floorId === activeFloorId);
  return <section className="model-workspace" aria-label="Canonical 3D building model workspace">
    <ThreeBuildingScene
      projection={projection}
      activeFloorId={activeFloorId}
      selection={selection}
      viewMode={preferences.viewMode}
      cameraPreset={preferences.cameraPreset}
      floorMode={preferences.floorMode}
      exploded={preferences.exploded}
      layers={preferences.layers}
      fitRequest={fitRequest}
      onSelect={handleSelect}
      onClearSelection={onClearSelection}
    />

    <div className="model-context-card">
      <span>SCHEMATIC / DESIGN MODEL</span>
      <strong>{building.name}</strong>
      <small>Canonical projection · not construction BIM</small>
    </div>

    <div className="model-toolbar" aria-label="3D model controls">
      <div className="model-control-group">
        <Rotate3D size={14} />
        {(['isometric', 'front', 'back', 'left', 'right', 'top'] as const).map(preset => <button key={preset} className={preferences.cameraPreset === preset ? 'active' : ''} onClick={() => update('cameraPreset', preset)}>{preset}</button>)}
      </div>
      <div className="model-control-group compact">
        <button onClick={() => setFitRequest(value => value + 1)} title="Fit building"><Focus size={15} /> Fit</button>
        <button className={preferences.exploded ? 'active' : ''} onClick={() => update('exploded', !preferences.exploded)}><Layers3 size={15} /> Explode</button>
        <button className={layersOpen ? 'active' : ''} onClick={() => setLayersOpen(open => !open)}><Eye size={15} /> Layers</button>
        <button className={settingsOpen ? 'active' : ''} onClick={() => setSettingsOpen(open => !open)}><Settings2 size={15} /> Heights</button>
      </div>
    </div>

    <div className="model-floor-controls">
      <div className="model-segmented-control">
        {(['all', 'active', 'isolate'] as const).map(mode => <button key={mode} className={preferences.floorMode === mode ? 'active' : ''} onClick={() => update('floorMode', mode)}>{mode === 'all' ? 'All floors' : mode === 'active' ? 'Active floor' : 'Isolate'}</button>)}
      </div>
      <div className="model-level-picker">
        {projection.levels.map(level => <button key={level.floorId} className={activeFloorId === level.floorId ? 'active' : ''} onClick={() => onSwitchFloor(level.floorId)}><span>{level.floorName}</span><small>{level.datumLabel}</small></button>)}
      </div>
      <div className="model-segmented-control">
        {(['solid', 'xray', 'rooms'] as const).map(mode => <button key={mode} className={preferences.viewMode === mode ? 'active' : ''} onClick={() => update('viewMode', mode)}>{mode}</button>)}
      </div>
    </div>

    {layersOpen && <aside className="model-popover model-layers-panel" aria-label="3D layer visibility">
      <header><PanelTop size={15} /><div><strong>Model layers</strong><small>View state only</small></div></header>
      {(Object.keys(preferences.layers) as (keyof ModelLayerVisibility)[]).map(key => <label key={key}><input type="checkbox" checked={preferences.layers[key]} onChange={() => toggleLayer(key)} /><span>{key.replace(/([A-Z])/g, ' $1')}</span></label>)}
    </aside>}

    {settingsOpen && <aside className="model-popover model-height-panel" aria-label="Building height settings">
      <header><Ruler size={15} /><div><strong>Building height settings</strong><small>Canonical mm · concept defaults</small></div></header>
      {([
        ['defaultFloorToFloorHeight', 'Floor-to-floor fallback'],
        ['defaultWallHeight', 'Wall height'],
        ['slabThickness', 'Slab thickness'],
        ['defaultDoorHeight', 'Door height fallback'],
        ['defaultWindowSillHeight', 'Window sill fallback'],
        ['defaultWindowHeight', 'Window height fallback'],
        ['parapetHeight', 'Parapet height'],
      ] as const).map(([key, label]) => <label key={key}><span>{label}<small>{preferences.heightSettings[key].provenance.replace('_', ' ')}</small></span><div><input type="number" min="1" step="50" value={preferences.heightSettings[key].value} onChange={event => update('heightSettings', updateParameter(preferences.heightSettings, key, event.target.value))} /><em>mm</em></div></label>)}
      <p>Defaults are architectural project values, not code requirements. Existing door and window entity dimensions remain authoritative.</p>
    </aside>}

    <div className="model-north-indicator" style={{ transform: `rotate(${projection.site.northDegrees}deg)` }}><span>N</span><i /></div>
    {preferences.layers.labels && <div className="model-datum"><Building2 size={14} /><span>{selectedLevel?.floorName ?? 'Building stack'}</span><strong>{selectedLevel?.datumLabel ?? '±0.000'}</strong></div>}
  </section>;
};

export default ModelWorkspace;
