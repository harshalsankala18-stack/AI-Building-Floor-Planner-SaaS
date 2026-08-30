import React from 'react';
import type { EditorContextValue } from '../../stores/editor-store';
import {
  UpdateRoomPropertiesCommand,
  ResizeRoomCommand,
  UpdateDoorPropertiesCommand,
  UpdateWindowPropertiesCommand,
  RoomType,
  DoorType,
  SwingDirection,
  WindowType,
  Direction,
} from '@ai-floor-planner/core';
import { mmToFeet, sqMmToSqFt } from '@ai-floor-planner/geometry-engine';

interface PropertyInspectorProps {
  editor: EditorContextValue;
  embedded?: boolean;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({ editor, embedded = false }) => {
  const { selection, activeFloor, building, executeCommand } = editor;

  // Selected Room
  const selectedRoom = selection?.entityType === 'room'
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

  return (
    <div className={`property-inspector ${embedded ? 'embedded' : ''}`}>
      <div className="inspector-header">
        <span className="inspector-title">
          {selection ? `${selection.entityType} Properties` : 'Plot & Floor Info'}
        </span>
        {selection && <span className="property-badge">{selection.entityId.slice(0, 8)}</span>}
      </div>

      <div className="inspector-body">
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
                <div className="form-group">
                  <label className="form-label">Width (mm)</label>
                  <input
                    type="number"
                    step="100"
                    min="500"
                    value={Math.round(selectedRoom.width)}
                    onChange={(e) => {
                      const w = Number(e.target.value);
                      if (w > 0) {
                        executeCommand(
                          new ResizeRoomCommand(selectedRoom.id, w, selectedRoom.height)
                        );
                      }
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Height (mm)</label>
                  <input
                    type="number"
                    step="100"
                    min="500"
                    value={Math.round(selectedRoom.height)}
                    onChange={(e) => {
                      const h = Number(e.target.value);
                      if (h > 0) {
                        executeCommand(
                          new ResizeRoomCommand(selectedRoom.id, selectedRoom.width, h)
                        );
                      }
                    }}
                  />
                </div>
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
          </>
        )}

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
        {!selection && (
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
