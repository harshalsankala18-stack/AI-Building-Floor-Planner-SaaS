import React, { useEffect, useState } from 'react';
import { RotateCcw, RotateCw, Trash2, Scissors, Plus } from 'lucide-react';
import type { EditorContextValue } from '../../stores/editor-store';
import {
  UpdateRoomPropertiesCommand,
  UpdateRoomGeometryCommand,
  UpdateRoomBoundaryCommand,
  UpdateDoorPropertiesCommand,
  UpdateWindowPropertiesCommand,
  UpdateWallPropertiesCommand,
  UpdateWallGeometryCommand,
  SplitWallCommand,
  UpdateFloorPropertiesCommand,
  AddDoorCommand,
  AddWindowCommand,
  DeleteEntityCommand,
  RoomType,
  DoorType,
  SwingDirection,
  WindowType,
  WallType,
  Direction,
} from '@ai-floor-planner/core';
import { clampOpeningPositionOnWall, containsPolygon, mmToFeet, polygonIntersectionArea, sqMmToSqFt } from '@ai-floor-planner/geometry-engine';
import { RefinementPanel } from '../refinement/RefinementPanel';

interface PropertyInspectorProps {
  editor: EditorContextValue;
  embedded?: boolean;
}

function ExactDimensionInput({ label, value, onCommit }: { label: string; value: number; onCommit: (value: number) => boolean }) {
  const [draft, setDraft] = useState(String(Math.round(value)));
  useEffect(() => setDraft(String(Math.round(value))), [value]);
  const commit = () => {
    const parsed = Number(draft);
    if (Number.isFinite(parsed) && parsed >= 500 && parsed !== value) {
      if (!onCommit(parsed)) setDraft(String(Math.round(value)));
    }
    else setDraft(String(Math.round(value)));
  };
  return <div className="form-group"><label className="form-label">{label}</label><input type="number" step="100" min="500" aria-label={label} value={draft} onChange={event => setDraft(event.target.value)} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') setDraft(String(Math.round(value))); }} /></div>;
}

/**
 * Absolute position entry. Unlike a dimension, a coordinate may legitimately be
 * zero or negative relative to the plot origin, so this does not impose a floor.
 */
function ExactPositionInput({ label, value, onCommit }: { label: string; value: number; onCommit: (value: number) => boolean }) {
  const [draft, setDraft] = useState(String(Math.round(value)));
  useEffect(() => setDraft(String(Math.round(value))), [value]);
  const commit = () => {
    const parsed = Number(draft);
    if (Number.isFinite(parsed) && parsed !== value) {
      if (!onCommit(parsed)) setDraft(String(Math.round(value)));
    } else {
      setDraft(String(Math.round(value)));
    }
  };
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        type="number"
        step="50"
        aria-label={label}
        value={draft}
        onChange={event => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={event => {
          if (event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') setDraft(String(Math.round(value)));
        }}
      />
    </div>
  );
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({ editor, embedded = false }) => {
  const { selection, activeFloor, building, executeCommand } = editor;
  const isMulti = editor.selections.length > 1;

  // Selected Room
  const selectedRoom = !isMulti && selection?.entityType === 'room'
    ? activeFloor.rooms.find(r => r.id === selection.entityId)
    : null;

  // Selected Door
  const selectedDoor = selection?.entityType === 'door'
    ? activeFloor.doors.find(d => d.id === selection.entityId)
    : null;

  // Selected Window
  const selectedWindow = selection?.entityType === 'window'
    ? activeFloor.windows.find(w => w.id === selection.entityId)
    : null;

  const selectedWall = !isMulti && selection?.entityType === 'wall'
    ? activeFloor.walls.find(wall => wall.id === selection.entityId) : null;
  const selectedStair = !isMulti && selection?.entityType === 'stair'
    ? activeFloor.stairs.find(stair => stair.id === selection.entityId) : null;
  const [geometryMessage, setGeometryMessage] = useState<string | null>(null);

  /**
   * Validate a proposed room rectangle against the floor plate and its
   * neighbours, and say WHY it was refused rather than snapping the field back
   * with no explanation.
   */
  const checkRoomRect = (rect: { x: number; y: number; width: number; height: number }): string | null => {
    if (!selectedRoom) return 'No room is selected.';
    const boundary = { points: [
      { x: rect.x, y: rect.y }, { x: rect.x + rect.width, y: rect.y },
      { x: rect.x + rect.width, y: rect.y + rect.height }, { x: rect.x, y: rect.y + rect.height },
    ] };
    if (!containsPolygon(activeFloor.boundary, boundary)) {
      return `That would put "${selectedRoom.name}" outside the ${activeFloor.name} outline. Keep it inside the building footprint.`;
    }
    if (selectedRoom.minArea && rect.width * rect.height < selectedRoom.minArea) {
      return `${(rect.width * rect.height / 1_000_000).toFixed(1)} m² is below this room's ${(selectedRoom.minArea / 1_000_000).toFixed(1)} m² minimum.`;
    }
    const clash = activeFloor.rooms.find(
      room => room.id !== selectedRoom.id && polygonIntersectionArea(boundary, room.boundary) > 2,
    );
    if (clash) {
      return `That would overlap "${clash.name}". Move or resize that room first.`;
    }
    return null;
  };

  const commitRoomGeometry = (width: number, height: number): boolean => {
    if (!selectedRoom) return false;
    const problem = checkRoomRect({ x: selectedRoom.x, y: selectedRoom.y, width, height });
    if (problem) {
      setGeometryMessage(problem);
      return false;
    }
    setGeometryMessage(null);
    executeCommand(new UpdateRoomGeometryCommand(selectedRoom.id, { x: selectedRoom.x, y: selectedRoom.y, width, height }, selectedRoom.name));
    return true;
  };

  const commitRoomPosition = (x: number, y: number): boolean => {
    if (!selectedRoom) return false;
    const problem = checkRoomRect({ x, y, width: selectedRoom.width, height: selectedRoom.height });
    if (problem) {
      setGeometryMessage(problem);
      return false;
    }
    setGeometryMessage(null);
    executeCommand(
      new UpdateRoomGeometryCommand(
        selectedRoom.id,
        { x, y, width: selectedRoom.width, height: selectedRoom.height },
        selectedRoom.name,
      ),
    );
    return true;
  };

  return (
    <div className={`property-inspector ${embedded ? 'embedded' : ''}`}>
      <div className="inspector-header">
        <span className="inspector-title">
          {isMulti ? `${editor.selections.length} selected` : selection ? `${selection.entityType} Properties` : 'Plot & Floor Info'}
        </span>
        {selection && <span className="property-badge">{selection.entityId.slice(0, 8)}</span>}
      </div>

      <div className="inspector-body">
        <RefinementPanel editor={editor} />
        {isMulti && <div className="inspector-section multi-selection-summary">
          <span className="inspector-section-title">Aggregate selection</span>
          <strong>{editor.selections.length} entities</strong>
          <p>{Object.entries(editor.selections.reduce<Record<string, number>>((counts, item) => ({ ...counts, [item.entityType]: (counts[item.entityType] ?? 0) + 1 }), {})).map(([type, count]) => `${count} ${type}`).join(' · ')}</p>
          <small>Bulk geometry editing is intentionally unavailable. Locking and targeted regeneration remain available for selected rooms.</small>
        </div>}
        {/* ROOM PROPERTIES */}
        {selectedRoom && (
          <>
            <div className="inspector-section">
              <span className="inspector-section-title">Identity</span>
              <div className="form-group">
                <label className="form-label">Room Name</label>
                <input
                  type="text"
                  value={selectedRoom.name}
                  onChange={(e) =>
                    executeCommand(
                      new UpdateRoomPropertiesCommand(selectedRoom.id, { name: e.target.value })
                    )
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Room Type</label>
                <select
                  value={selectedRoom.type}
                  onChange={(e) =>
                    executeCommand(
                      new UpdateRoomPropertiesCommand(selectedRoom.id, {
                        type: e.target.value as RoomType,
                      })
                    )
                  }
                >
                  {Object.values(RoomType).map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/([A-Z])/g, ' $1').trim()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="inspector-section">
              <span className="inspector-section-title">Dimensions (mm & ft)</span>
              <div className="form-group-row">
                <ExactDimensionInput label="Width (mm)" value={selectedRoom.width} onCommit={width => commitRoomGeometry(width, selectedRoom.height)} />
                <ExactDimensionInput label="Depth (mm)" value={selectedRoom.height} onCommit={height => commitRoomGeometry(selectedRoom.width, height)} />
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                Size:{' '}
                <strong>
                  {mmToFeet(selectedRoom.width).toFixed(1)}′ ×{' '}
                  {mmToFeet(selectedRoom.height).toFixed(1)}′
                </strong>{' '}
                ({sqMmToSqFt(selectedRoom.area).toFixed(0)} sq.ft)
              </div>
            </div>
            <div className="inspector-section">
              <span className="inspector-section-title">Position (mm from plot origin)</span>
              <div className="form-group-row">
                <ExactPositionInput
                  label="X (mm)"
                  value={selectedRoom.x}
                  onCommit={x => commitRoomPosition(x, selectedRoom.y)}
                />
                <ExactPositionInput
                  label="Y (mm)"
                  value={selectedRoom.y}
                  onCommit={y => commitRoomPosition(selectedRoom.x, y)}
                />
              </div>
              {geometryMessage && <p className="inspector-truth-note" role="status" data-testid="room-geometry-message">{geometryMessage}</p>}
            </div>

            <div className="inspector-section" data-testid="room-polygon-vertices">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="inspector-section-title" style={{ margin: 0 }}>
                  Polygon Vertices ({selectedRoom.boundary.points.length} pts)
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    className="drafted-preset-btn"
                    data-testid="room-vertex-add"
                    title="Subdivide longest polygon edge to create an L-step or angled corner"
                    onClick={() => {
                      const pts = selectedRoom.boundary.points;
                      if (pts.length < 3) return;
                      let longestIdx = 0;
                      let longestLen = -1;
                      for (let i = 0; i < pts.length; i++) {
                        const p1 = pts[i]!;
                        const p2 = pts[(i + 1) % pts.length]!;
                        const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                        if (len > longestLen) {
                          longestLen = len;
                          longestIdx = i;
                        }
                      }
                      const a = pts[longestIdx]!;
                      const b = pts[(longestIdx + 1) % pts.length]!;
                      const mid = { x: Math.round((a.x + b.x) / 2), y: Math.round((a.y + b.y) / 2) };
                      const nextPts = [
                        ...pts.slice(0, longestIdx + 1),
                        mid,
                        ...pts.slice(longestIdx + 1),
                      ];
                      executeCommand(new UpdateRoomBoundaryCommand(selectedRoom.id, { points: nextPts }, selectedRoom.name));
                    }}
                  >
                    + Vertex
                  </button>
                  {selectedRoom.boundary.points.length > 4 && (
                    <button
                      type="button"
                      className="drafted-preset-btn"
                      data-testid="room-vertex-reset"
                      title="Reset polygon boundary to 4-point rectangle"
                      onClick={() => {
                        const rectPts = [
                          { x: selectedRoom.x, y: selectedRoom.y },
                          { x: selectedRoom.x + selectedRoom.width, y: selectedRoom.y },
                          { x: selectedRoom.x + selectedRoom.width, y: selectedRoom.y + selectedRoom.height },
                          { x: selectedRoom.x, y: selectedRoom.y + selectedRoom.height },
                        ];
                        executeCommand(new UpdateRoomBoundaryCommand(selectedRoom.id, { points: rectPts }, selectedRoom.name));
                      }}
                    >
                      Reset Rect
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 150, overflowY: 'auto' }}>
                {selectedRoom.boundary.points.map((pt, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr', gap: 6, alignItems: 'center', fontSize: 11 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>V{idx + 1}</span>
                    <input
                      type="number"
                      step="50"
                      data-testid={`room-vertex-x-${idx}`}
                      aria-label={`Vertex ${idx + 1} X`}
                      value={Math.round(pt.x)}
                      onChange={e => {
                        const nextX = Number(e.target.value);
                        if (!Number.isFinite(nextX)) return;
                        const nextPts = selectedRoom.boundary.points.map((p, i) => (i === idx ? { x: nextX, y: p.y } : p));
                        executeCommand(new UpdateRoomBoundaryCommand(selectedRoom.id, { points: nextPts }, selectedRoom.name));
                      }}
                    />
                    <input
                      type="number"
                      step="50"
                      data-testid={`room-vertex-y-${idx}`}
                      aria-label={`Vertex ${idx + 1} Y`}
                      value={Math.round(pt.y)}
                      onChange={e => {
                        const nextY = Number(e.target.value);
                        if (!Number.isFinite(nextY)) return;
                        const nextPts = selectedRoom.boundary.points.map((p, i) => (i === idx ? { x: p.x, y: nextY } : p));
                        executeCommand(new UpdateRoomBoundaryCommand(selectedRoom.id, { points: nextPts }, selectedRoom.name));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="inspector-section">
              <span className="inspector-section-title">Program traceability</span>
              <dl className="property-definition-list"><div><dt>Floor</dt><dd>{activeFloor.name}</dd></div><div><dt>Priority</dt><dd>{selectedRoom.priority >= 8 ? 'Required' : 'Preferred'}</dd></div><div><dt>Preferred area</dt><dd>{selectedRoom.minArea ? `${(selectedRoom.minArea / 1_000_000).toFixed(1)} m² minimum` : 'Not configured'}</dd></div><div><dt>Current area</dt><dd data-testid="room-area">{(selectedRoom.area / 1_000_000).toFixed(1)} m²</dd></div><div><dt>Generation lock</dt><dd>{editor.generationControl.lockedEntityIds.includes(selectedRoom.id) ? 'Locked' : 'Variable'}</dd></div></dl>
              {selectedRoom.imageProvenance && (
                <dl className="property-definition-list">
                  <div><dt>Source image</dt><dd title={selectedRoom.imageProvenance.sourceImageArtifactId}>{selectedRoom.imageProvenance.sourceImageArtifactId.slice(0, 24)}</dd></div>
                  <div><dt>Read confidence</dt><dd>{Math.round(selectedRoom.imageProvenance.extractionConfidence * 100)}%</dd></div>
                  <div><dt>Geometry revision</dt><dd title={selectedRoom.imageProvenance.geometryRevisionId}>{selectedRoom.imageProvenance.geometryRevisionId.slice(-12)}</dd></div>
                </dl>
              )}
            </div>

            <div className="inspector-section">
              <span className="inspector-section-title">Actions</span>
              <div className="drafted-quick-actions-row">
                <button
                  type="button"
                  className="drafted-flip-btn"
                  data-testid="room-lock-toggle"
                  onClick={() =>
                    editor.setRoomLocks(
                      [selectedRoom.id],
                      !editor.generationControl.lockedEntityIds.includes(selectedRoom.id),
                    )
                  }
                >
                  {editor.generationControl.lockedEntityIds.includes(selectedRoom.id) ? 'Unlock room' : 'Lock room'}
                </button>
                <button
                  type="button"
                  className="drafted-flip-btn danger"
                  data-testid="room-delete"
                  onClick={() => executeCommand(new DeleteEntityCommand('room', selectedRoom.id, `Delete ${selectedRoom.name}`))}
                  title="Delete this room and the walls and openings that only served it"
                >
                  <Trash2 size={13} />
                  <span>Delete room</span>
                </button>
              </div>
            </div>
          </>
        )}

        {selectedWall && (() => {
          const wallLength = Math.hypot(selectedWall.endPoint.x - selectedWall.startPoint.x, selectedWall.endPoint.y - selectedWall.startPoint.y);
          const angleDeg = Math.round((Math.atan2(selectedWall.endPoint.y - selectedWall.startPoint.y, selectedWall.endPoint.x - selectedWall.startPoint.x) * 180 / Math.PI + 360) % 180);
          const hostedDoors = activeFloor.doors.filter(d => d.wallId === selectedWall.id);
          const hostedWindows = activeFloor.windows.filter(w => w.wallId === selectedWall.id);

          return (
            <div className="inspector-section">
              <span className="inspector-section-title">Wall Geometry & Assembly</span>

              {/* Wall Assembly: thickness + classification (real domain edits) */}
              <div className="form-group">
                <label className="form-label">Wall Thickness & Structure</label>
                <div className="drafted-wall-thickness-toggle">
                  {([
                    { thickness: 115, type: WallType.Partition, label: '115 mm (4.5″ Partition)', bearing: false },
                    { thickness: 230, type: WallType.External, label: '230 mm (9″ Structural)', bearing: true },
                  ] as const).map(option => (
                    <button
                      key={option.thickness}
                      type="button"
                      data-testid={`wall-thickness-${option.thickness}`}
                      className={`drafted-thickness-option ${selectedWall.thickness === option.thickness ? 'active' : ''}`}
                      aria-pressed={selectedWall.thickness === option.thickness}
                      onClick={() =>
                        executeCommand(
                          new UpdateWallPropertiesCommand(selectedWall.id, {
                            thickness: option.thickness,
                            type: option.type,
                            loadBearing: option.bearing,
                          }),
                        )
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Custom Thickness (mm)</label>
                <input
                  type="number"
                  step="5"
                  min="50"
                  max="600"
                  data-testid="wall-thickness-input"
                  value={selectedWall.thickness}
                  onChange={event => {
                    const next = Number(event.target.value);
                    if (Number.isFinite(next) && next >= 50 && next <= 600) {
                      executeCommand(new UpdateWallPropertiesCommand(selectedWall.id, { thickness: next }));
                    }
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Classification</label>
                <select
                  data-testid="wall-type-select"
                  value={selectedWall.type}
                  onChange={event =>
                    executeCommand(
                      new UpdateWallPropertiesCommand(selectedWall.id, {
                        type: event.target.value as WallType,
                        loadBearing: event.target.value === WallType.External,
                      }),
                    )
                  }
                >
                  {Object.values(WallType).map(type => (
                    <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <dl className="property-definition-list" style={{ marginTop: 12 }}>
                <div>
                  <dt>Length</dt>
                  <dd>{(wallLength / 1000).toFixed(2)} m ({mmToFeet(wallLength).toFixed(1)}′)</dd>
                </div>
                <div>
                  <dt>Angle</dt>
                  <dd>{angleDeg}° ({angleDeg === 0 || angleDeg === 180 ? 'Horizontal' : angleDeg === 90 ? 'Vertical' : 'Angled'})</dd>
                </div>
                <div>
                  <dt>Classification</dt>
                  <dd>{selectedWall.type === WallType.External ? 'Exterior Envelope' : 'Interior Partition'}</dd>
                </div>
                <div>
                  <dt>Hosted Openings</dt>
                  <dd>{hostedDoors.length} Door(s) · {hostedWindows.length} Window(s)</dd>
                </div>
              </dl>

              <div className="form-group" style={{ marginTop: 10 }}>
                <label className="form-label">Wall Endpoints (mm)</label>
                <div className="form-group-row">
                  <input
                    type="number"
                    step="50"
                    data-testid="wall-start-x"
                    aria-label="Wall Start X (mm)"
                    value={Math.round(selectedWall.startPoint.x)}
                    onChange={e => {
                      const val = Number(e.target.value);
                      if (Number.isFinite(val)) {
                        executeCommand(new UpdateWallGeometryCommand(selectedWall.id, { x: val, y: selectedWall.startPoint.y }, selectedWall.endPoint));
                      }
                    }}
                  />
                  <input
                    type="number"
                    step="50"
                    data-testid="wall-start-y"
                    aria-label="Wall Start Y (mm)"
                    value={Math.round(selectedWall.startPoint.y)}
                    onChange={e => {
                      const val = Number(e.target.value);
                      if (Number.isFinite(val)) {
                        executeCommand(new UpdateWallGeometryCommand(selectedWall.id, { x: selectedWall.startPoint.x, y: val }, selectedWall.endPoint));
                      }
                    }}
                  />
                </div>
                <div className="form-group-row" style={{ marginTop: 4 }}>
                  <input
                    type="number"
                    step="50"
                    data-testid="wall-end-x"
                    aria-label="Wall End X (mm)"
                    value={Math.round(selectedWall.endPoint.x)}
                    onChange={e => {
                      const val = Number(e.target.value);
                      if (Number.isFinite(val)) {
                        executeCommand(new UpdateWallGeometryCommand(selectedWall.id, selectedWall.startPoint, { x: val, y: selectedWall.endPoint.y }));
                      }
                    }}
                  />
                  <input
                    type="number"
                    step="50"
                    data-testid="wall-end-y"
                    aria-label="Wall End Y (mm)"
                    value={Math.round(selectedWall.endPoint.y)}
                    onChange={e => {
                      const val = Number(e.target.value);
                      if (Number.isFinite(val)) {
                        executeCommand(new UpdateWallGeometryCommand(selectedWall.id, selectedWall.startPoint, { x: selectedWall.endPoint.x, y: val }));
                      }
                    }}
                  />
                </div>
              </div>

              <div className="drafted-quick-actions-row" style={{ marginTop: 8, marginBottom: 8 }}>
                <button
                  type="button"
                  className="drafted-flip-btn"
                  data-testid="wall-split"
                  title="Split this wall into two collinear wall segments at its midpoint"
                  onClick={() => executeCommand(new SplitWallCommand(selectedWall.id))}
                >
                  <Scissors size={13} />
                  <span>Split Wall</span>
                </button>
                <button
                  type="button"
                  className="drafted-flip-btn"
                  data-testid="wall-add-door"
                  title="Place a 900 mm door at the midpoint of this wall"
                  onClick={() => {
                    const mid = {
                      x: Math.round((selectedWall.startPoint.x + selectedWall.endPoint.x) / 2),
                      y: Math.round((selectedWall.startPoint.y + selectedWall.endPoint.y) / 2),
                    };
                    const clamped = clampOpeningPositionOnWall(mid, selectedWall, 900);
                    if (clamped.valid) {
                      executeCommand(
                        new AddDoorCommand(activeFloor.id, {
                          floorId: activeFloor.id,
                          wallId: selectedWall.id,
                          position: clamped.position,
                          width: 900,
                          height: 2100,
                          type: DoorType.Single,
                          connectsRooms: [selectedWall.roomIds[0] ?? '__outside__', selectedWall.roomIds[1] ?? '__outside__'],
                        }),
                      );
                    }
                  }}
                >
                  <Plus size={13} />
                  <span>+ Door</span>
                </button>
                <button
                  type="button"
                  className="drafted-flip-btn"
                  data-testid="wall-add-window"
                  title="Place a 1200 mm window at the midpoint of this wall"
                  onClick={() => {
                    const mid = {
                      x: Math.round((selectedWall.startPoint.x + selectedWall.endPoint.x) / 2),
                      y: Math.round((selectedWall.startPoint.y + selectedWall.endPoint.y) / 2),
                    };
                    const clamped = clampOpeningPositionOnWall(mid, selectedWall, 1200);
                    if (clamped.valid) {
                      executeCommand(
                        new AddWindowCommand(activeFloor.id, {
                          floorId: activeFloor.id,
                          wallId: selectedWall.id,
                          position: clamped.position,
                          width: 1200,
                          height: 1200,
                          sillHeight: 900,
                          type: WindowType.Sliding,
                          roomId: selectedWall.roomIds.find(id => id !== '__outside__') ?? '',
                        }),
                      );
                    }
                  }}
                >
                  <Plus size={13} />
                  <span>+ Window</span>
                </button>
              </div>

              <p className="inspector-truth-note">Walls are derived from canonical room boundaries. Reshaping room corners automatically articulates wall angles in 2D and 3D.</p>
              <button
                type="button"
                className="drafted-flip-btn danger"
                data-testid="wall-delete"
                onClick={() => executeCommand(new DeleteEntityCommand('wall', selectedWall.id, 'Delete wall'))}
                title={
                  hostedDoors.length + hostedWindows.length > 0
                    ? `Deleting this wall also removes the ${hostedDoors.length} door(s) and ${hostedWindows.length} window(s) it hosts`
                    : 'Delete this wall'
                }
              >
                <Trash2 size={13} />
                <span>
                  Delete wall
                  {hostedDoors.length + hostedWindows.length > 0
                    ? ` (+${hostedDoors.length + hostedWindows.length} opening${hostedDoors.length + hostedWindows.length === 1 ? '' : 's'})`
                    : ''}
                </span>
              </button>
            </div>
          );
        })()}

        {selectedStair && <div className="inspector-section"><span className="inspector-section-title">Stair / vertical core</span><dl className="property-definition-list"><div><dt>Connection</dt><dd>{selectedStair.connectsFloors.join(' → ')}</dd></div><div><dt>Core identity</dt><dd>{selectedStair.verticalCoreId?.slice(0, 8) ?? 'Not assigned'}</dd></div><div><dt>Orientation</dt><dd>{selectedStair.direction}</dd></div><div><dt>Width</dt><dd>{(selectedStair.width / 1000).toFixed(2)} m</dd></div><div><dt>Footprint</dt><dd>{(selectedStair.width * selectedStair.length / 1_000_000).toFixed(1)} m²</dd></div><div><dt>Generation protection</dt><dd>{selectedStair.verticalCoreId && editor.generationControl.protectedCoreIds.includes(selectedStair.verticalCoreId) ? 'Protected' : 'Variable'}</dd></div></dl><p className="inspector-truth-note">Direct stair movement is unavailable because every connected floor must preserve vertical continuity.</p></div>}

        {/* DOOR PROPERTIES */}
        {selectedDoor && (() => {
          const hostWall = activeFloor.walls.find(w => w.id === selectedDoor.wallId);
          const distToStart = hostWall ? Math.round(Math.hypot(selectedDoor.position.x - hostWall.startPoint.x, selectedDoor.position.y - hostWall.startPoint.y)) : 0;
          const distToEnd = hostWall ? Math.round(Math.hypot(selectedDoor.position.x - hostWall.endPoint.x, selectedDoor.position.y - hostWall.endPoint.y)) : 0;

          return (
            <div className="inspector-section">
              <span className="inspector-section-title">Door Geometry & Placement</span>

              {/* Drafted.ai Quick Actions: Flip Swing & Flip Hinge */}
              <div className="drafted-quick-actions-row">
                <button
                  type="button"
                  className="drafted-flip-btn"
                  data-testid="door-flip-swing"
                  onClick={() => {
                    const nextSwing = selectedDoor.swingDirection === SwingDirection.Inward
                      ? SwingDirection.Outward
                      : SwingDirection.Inward;
                    executeCommand(new UpdateDoorPropertiesCommand(selectedDoor.id, { swingDirection: nextSwing }));
                  }}
                  title="Flip door swing inward / outward"
                >
                  <RotateCcw size={13} />
                  <span>Flip Swing ({selectedDoor.swingDirection === SwingDirection.Inward ? 'Inward' : 'Outward'})</span>
                </button>

                <button
                  type="button"
                  className="drafted-flip-btn"
                  data-testid="door-flip-hinge"
                  onClick={() => {
                    const nextHingeSide = selectedDoor.hingeSide === 'right' ? 'left' : 'right';
                    const nextSwing = selectedDoor.swingDirection === SwingDirection.Left
                      ? SwingDirection.Right
                      : selectedDoor.swingDirection === SwingDirection.Right
                      ? SwingDirection.Left
                      : selectedDoor.swingDirection;
                    executeCommand(
                      new UpdateDoorPropertiesCommand(selectedDoor.id, {
                        hingeSide: nextHingeSide,
                        swingDirection: nextSwing,
                      }),
                    );
                  }}
                  title="Flip door hinge side left / right"
                >
                  <RotateCw size={13} />
                  <span>Flip Hinge ({selectedDoor.hingeSide ?? 'left'})</span>
                </button>
              </div>

              {/* Door Type Selector */}
              <div className="form-group">
                <label className="form-label">Door Type</label>
                <div className="drafted-btn-group">
                  {[
                    { type: DoorType.Single, label: 'Single' },
                    { type: DoorType.Double, label: 'Double French' },
                    { type: DoorType.Sliding, label: 'Sliding Pocket' },
                    { type: DoorType.Folding, label: 'Bi-Fold' },
                    { type: DoorType.OpenPassage, label: 'Cased Opening' },
                  ].map(item => (
                    <button
                      key={item.type}
                      type="button"
                      className={`drafted-preset-btn ${selectedDoor.type === item.type ? 'active' : ''}`}
                      onClick={() => executeCommand(new UpdateDoorPropertiesCommand(selectedDoor.id, { type: item.type }))}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Width Presets */}
              <div className="form-group">
                <label className="form-label">Clear Width Presets</label>
                <div className="drafted-btn-group">
                  {[
                    { val: 750, label: '750 mm (WC)' },
                    { val: 900, label: '900 mm (Std)' },
                    { val: 1000, label: '1000 mm (Bed)' },
                    { val: 1200, label: '1200 mm (Grand)' },
                  ].map(p => (
                    <button
                      key={p.val}
                      type="button"
                      className={`drafted-preset-btn ${selectedDoor.width === p.val ? 'active' : ''}`}
                      onClick={() => executeCommand(new UpdateDoorPropertiesCommand(selectedDoor.id, { width: p.val }))}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Custom Clear Width (mm)</label>
                <input
                  type="number"
                  step="50"
                  min="600"
                  max="2400"
                  value={selectedDoor.width}
                  onChange={(e) =>
                    executeCommand(
                      new UpdateDoorPropertiesCommand(selectedDoor.id, {
                        width: Number(e.target.value),
                      })
                    )
                  }
                />
              </div>

              {/* Real-time Distance to Wall Corners HUD */}
              {hostWall && (
                <div className="drafted-corner-distance-box">
                  <div className="drafted-corner-distance-row">
                    <span>Hinge corner clearance:</span>
                    <strong>{distToStart} mm ({mmToFeet(distToStart).toFixed(1)}′)</strong>
                  </div>
                  <div className="drafted-corner-distance-row">
                    <span>Strike corner clearance:</span>
                    <strong>{distToEnd} mm ({mmToFeet(distToEnd).toFixed(1)}′)</strong>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="drafted-flip-btn danger"
                data-testid="door-delete"
                onClick={() => executeCommand(new DeleteEntityCommand('door', selectedDoor.id, 'Delete door'))}
              >
                <Trash2 size={13} />
                <span>Delete door</span>
              </button>
            </div>
          );
        })()}

        {/* WINDOW PROPERTIES */}
        {selectedWindow && (() => {
          const hostWall = activeFloor.walls.find(w => w.id === selectedWindow.wallId);
          const distToStart = hostWall ? Math.round(Math.hypot(selectedWindow.position.x - hostWall.startPoint.x, selectedWindow.position.y - hostWall.startPoint.y)) : 0;
          const distToEnd = hostWall ? Math.round(Math.hypot(selectedWindow.position.x - hostWall.endPoint.x, selectedWindow.position.y - hostWall.endPoint.y)) : 0;

          return (
            <div className="inspector-section">
              <span className="inspector-section-title">Window Attributes & Glazing</span>

              {/* Window Type Selector */}
              <div className="form-group">
                <label className="form-label">Window Type</label>
                <div className="drafted-btn-group">
                  {[
                    { type: WindowType.Sliding, label: 'Sliding 2-Track' },
                    { type: WindowType.Casement, label: 'Casement' },
                    { type: WindowType.Fixed, label: 'Fixed Picture' },
                    { type: WindowType.Ventilator, label: 'High Louver' },
                  ].map(item => (
                    <button
                      key={item.type}
                      type="button"
                      className={`drafted-preset-btn ${selectedWindow.type === item.type ? 'active' : ''}`}
                      onClick={() => executeCommand(new UpdateWindowPropertiesCommand(selectedWindow.id, { type: item.type }))}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Width Presets */}
              <div className="form-group">
                <label className="form-label">Width Presets</label>
                <div className="drafted-btn-group">
                  {[600, 900, 1200, 1500, 1800, 2400].map(w => (
                    <button
                      key={w}
                      type="button"
                      className={`drafted-preset-btn ${selectedWindow.width === w ? 'active' : ''}`}
                      onClick={() => executeCommand(new UpdateWindowPropertiesCommand(selectedWindow.id, { width: w }))}
                    >
                      {w} mm
                    </button>
                  ))}
                </div>
              </div>

              {/* Sill Height Presets */}
              <div className="form-group">
                <label className="form-label">Sill Height Presets</label>
                <div className="drafted-btn-group">
                  {[
                    { val: 450, label: '450 mm (Low)' },
                    { val: 900, label: '900 mm (Std)' },
                    { val: 1200, label: '1200 mm (Counter)' },
                    { val: 1800, label: '1800 mm (Vent)' },
                  ].map(s => (
                    <button
                      key={s.val}
                      type="button"
                      className={`drafted-preset-btn ${selectedWindow.sillHeight === s.val ? 'active' : ''}`}
                      onClick={() => executeCommand(new UpdateWindowPropertiesCommand(selectedWindow.id, { sillHeight: s.val }))}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">Width (mm)</label>
                  <input
                    type="number"
                    step="100"
                    min="500"
                    max="4000"
                    value={selectedWindow.width}
                    onChange={(e) =>
                      executeCommand(
                        new UpdateWindowPropertiesCommand(selectedWindow.id, {
                          width: Number(e.target.value),
                        })
                      )
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sill Height (mm)</label>
                  <input
                    type="number"
                    step="50"
                    min="0"
                    max="2400"
                    value={selectedWindow.sillHeight}
                    onChange={(e) =>
                      executeCommand(
                        new UpdateWindowPropertiesCommand(selectedWindow.id, {
                          sillHeight: Number(e.target.value),
                        })
                      )
                    }
                  />
                </div>
              </div>

              {/* Corner Clearance HUD */}
              {hostWall && (
                <div className="drafted-corner-distance-box">
                  <div className="drafted-corner-distance-row">
                    <span>Left jamb clearance:</span>
                    <strong>{distToStart} mm ({mmToFeet(distToStart).toFixed(1)}′)</strong>
                  </div>
                  <div className="drafted-corner-distance-row">
                    <span>Right jamb clearance:</span>
                    <strong>{distToEnd} mm ({mmToFeet(distToEnd).toFixed(1)}′)</strong>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="drafted-flip-btn danger"
                data-testid="window-delete"
                onClick={() => executeCommand(new DeleteEntityCommand('window', selectedWindow.id, 'Delete window'))}
              >
                <Trash2 size={13} />
                <span>Delete window</span>
              </button>
            </div>
          );
        })()}

        {/* DEFAULT: SITE & FLOOR SUMMARY */}
        {!selection && !isMulti && (
          <>
            <div className="inspector-section">
              <span className="inspector-section-title">Site & Plot</span>
              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">Plot Width</label>
                  <input
                    type="text"
                    disabled
                    value={`${Math.round(building.site.plotWidth)} mm (${(building.site.plotWidth / 1000).toFixed(1)} m · ${mmToFeet(building.site.plotWidth).toFixed(1)}′)`}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Plot Depth</label>
                  <input
                    type="text"
                    disabled
                    value={`${Math.round(building.site.plotDepth)} mm (${(building.site.plotDepth / 1000).toFixed(1)} m · ${mmToFeet(building.site.plotDepth).toFixed(1)}′)`}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Road Facing Direction</label>
                <input type="text" disabled value={String(building.site.roadFacing ?? Direction.North).toUpperCase()} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Total Plot Area:{' '}
                <strong>{sqMmToSqFt(building.site.plotArea).toFixed(0)} sq.ft</strong> (
                {(building.site.plotArea / 1_000_000).toFixed(1)} m²)
              </div>
            </div>

            <div className="inspector-section">
              <span className="inspector-section-title">Active Floor Info</span>
              <div className="form-group">
                <label className="form-label">Level Name</label>
                <input
                  type="text"
                  data-testid="floor-name-input"
                  aria-label="Level Name"
                  value={activeFloor.name}
                  onChange={e => executeCommand(new UpdateFloorPropertiesCommand(activeFloor.id, { name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Clear Floor Height (mm)</label>
                <input
                  type="number"
                  step="100"
                  min="2100"
                  max="6000"
                  data-testid="floor-height-input"
                  aria-label="Clear Floor Height (mm)"
                  value={activeFloor.floorHeight}
                  onChange={e => {
                    const next = Number(e.target.value);
                    if (Number.isFinite(next) && next >= 2100 && next <= 6000) {
                      executeCommand(new UpdateFloorPropertiesCommand(activeFloor.id, { floorHeight: next }));
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Total Rooms</label>
                <input type="text" disabled value={activeFloor.rooms.length} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
