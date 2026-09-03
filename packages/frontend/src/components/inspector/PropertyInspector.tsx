import React, { useEffect, useState } from 'react';
import type { EditorContextValue } from '../../stores/editor-store';
import {
  UpdateRoomPropertiesCommand,
  UpdateRoomGeometryCommand,
  UpdateDoorPropertiesCommand,
  UpdateWindowPropertiesCommand,
  RoomType,
  DoorType,
  SwingDirection,
  WindowType,
  Direction,
} from '@ai-floor-planner/core';
import { containsPolygon, mmToFeet, polygonIntersectionArea, sqMmToSqFt } from '@ai-floor-planner/geometry-engine';
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
  return <div className="form-group"><label className="form-label">{label}</label><input type="number" step="100" min="500" value={draft} onChange={event => setDraft(event.target.value)} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') setDraft(String(Math.round(value))); }} /></div>;
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
  const commitRoomGeometry = (width: number, height: number): boolean => {
    if (!selectedRoom) return false;
    const boundary = { points: [
      { x: selectedRoom.x, y: selectedRoom.y }, { x: selectedRoom.x + width, y: selectedRoom.y },
      { x: selectedRoom.x + width, y: selectedRoom.y + height }, { x: selectedRoom.x, y: selectedRoom.y + height },
    ] };
    const valid = containsPolygon(activeFloor.boundary, boundary)
      && (!selectedRoom.minArea || width * height >= selectedRoom.minArea)
      && activeFloor.rooms.every(room => room.id === selectedRoom.id || polygonIntersectionArea(boundary, room.boundary) <= 2);
    if (valid) executeCommand(new UpdateRoomGeometryCommand(selectedRoom.id, { x: selectedRoom.x, y: selectedRoom.y, width, height }, selectedRoom.name));
    return valid;
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
              <span className="inspector-section-title">Program traceability</span>
              <dl className="property-definition-list"><div><dt>Floor</dt><dd>{activeFloor.name}</dd></div><div><dt>Priority</dt><dd>{selectedRoom.priority >= 8 ? 'Required' : 'Preferred'}</dd></div><div><dt>Preferred area</dt><dd>{selectedRoom.minArea ? `${(selectedRoom.minArea / 1_000_000).toFixed(1)} m² minimum` : 'Not configured'}</dd></div><div><dt>Current area</dt><dd>{(selectedRoom.area / 1_000_000).toFixed(1)} m²</dd></div><div><dt>Generation lock</dt><dd>{editor.generationControl.lockedEntityIds.includes(selectedRoom.id) ? 'Locked' : 'Variable'}</dd></div></dl>
            </div>
          </>
        )}

        {selectedWall && <div className="inspector-section"><span className="inspector-section-title">Wall geometry</span><dl className="property-definition-list"><div><dt>Length</dt><dd>{(Math.hypot(selectedWall.endPoint.x - selectedWall.startPoint.x, selectedWall.endPoint.y - selectedWall.startPoint.y) / 1000).toFixed(2)} m</dd></div><div><dt>Orientation</dt><dd>{Math.abs(selectedWall.endPoint.x - selectedWall.startPoint.x) >= Math.abs(selectedWall.endPoint.y - selectedWall.startPoint.y) ? 'Horizontal' : 'Vertical'}</dd></div><div><dt>Classification</dt><dd>{selectedWall.type}</dd></div><div><dt>Adjacent rooms</dt><dd>{selectedWall.roomIds.length || 'Exterior'}</dd></div><div><dt>Openings</dt><dd>{activeFloor.doors.filter(door => door.wallId === selectedWall.id).length + activeFloor.windows.filter(window => window.wallId === selectedWall.id).length}</dd></div></dl><p className="inspector-truth-note">Walls are derived from room topology. Free-standing wall editing is not exposed because it would create a competing geometry authority.</p></div>}

        {selectedStair && <div className="inspector-section"><span className="inspector-section-title">Stair / vertical core</span><dl className="property-definition-list"><div><dt>Connection</dt><dd>{selectedStair.connectsFloors.join(' → ')}</dd></div><div><dt>Core identity</dt><dd>{selectedStair.verticalCoreId?.slice(0, 8) ?? 'Not assigned'}</dd></div><div><dt>Orientation</dt><dd>{selectedStair.direction}</dd></div><div><dt>Width</dt><dd>{(selectedStair.width / 1000).toFixed(2)} m</dd></div><div><dt>Footprint</dt><dd>{(selectedStair.width * selectedStair.length / 1_000_000).toFixed(1)} m²</dd></div><div><dt>Generation protection</dt><dd>{selectedStair.verticalCoreId && editor.generationControl.protectedCoreIds.includes(selectedStair.verticalCoreId) ? 'Protected' : 'Variable'}</dd></div></dl><p className="inspector-truth-note">Direct stair movement is unavailable because every connected floor must preserve vertical continuity.</p></div>}

        {/* DOOR PROPERTIES */}
        {selectedDoor && (
          <div className="inspector-section">
            <span className="inspector-section-title">Door Geometry</span>
            <div className="form-group">
              <label className="form-label">Door Type</label>
              <select
                value={selectedDoor.type}
                onChange={(e) =>
                  executeCommand(
                    new UpdateDoorPropertiesCommand(selectedDoor.id, {
                      type: e.target.value as DoorType,
                    })
                  )
                }
              >
                {Object.values(DoorType).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Swing Direction</label>
              <select
                value={selectedDoor.swingDirection}
                onChange={(e) =>
                  executeCommand(
                    new UpdateDoorPropertiesCommand(selectedDoor.id, {
                      swingDirection: e.target.value as SwingDirection,
                    })
                  )
                }
              >
                {Object.values(SwingDirection).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Clear Width (mm)</label>
              <input
                type="number"
                step="50"
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
          </div>
        )}

        {/* WINDOW PROPERTIES */}
        {selectedWindow && (
          <div className="inspector-section">
            <span className="inspector-section-title">Window Attributes</span>
            <div className="form-group">
              <label className="form-label">Window Type</label>
              <select
                value={selectedWindow.type}
                onChange={(e) =>
                  executeCommand(
                    new UpdateWindowPropertiesCommand(selectedWindow.id, {
                      type: e.target.value as WindowType,
                    })
                  )
                }
              >
                {Object.values(WindowType).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group-row">
              <div className="form-group">
                <label className="form-label">Width (mm)</label>
                <input
                  type="number"
                  step="100"
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
          </div>
        )}

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
                    value={`${building.site.plotWidth}mm (${mmToFeet(building.site.plotWidth).toFixed(1)}′)`}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Plot Depth</label>
                  <input
                    type="text"
                    disabled
                    value={`${building.site.plotDepth}mm (${mmToFeet(building.site.plotDepth).toFixed(1)}′)`}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Road Facing Direction</label>
                <input type="text" disabled value={building.site.roadFacing ?? Direction.North} />
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
                <input type="text" disabled value={activeFloor.name} />
              </div>
              <div className="form-group">
                <label className="form-label">Clear Floor Height</label>
                <input type="text" disabled value={`${activeFloor.floorHeight} mm`} />
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
