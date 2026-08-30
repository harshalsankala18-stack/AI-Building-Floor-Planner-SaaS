import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Focus, ShieldCheck } from 'lucide-react';
import type { EditorContextValue } from '../../stores/editor-store';
import {
  renderFloor,
  worldToScreen,
  screenToWorld,
  scaleToScreen,
} from '@ai-floor-planner/renderer';
import {
  MoveRoomCommand,
  ResizeRoomCommand,
  AddRoomCommand,
  AddDoorCommand,
  AddWindowCommand,
  RoomType,
  DoorType,
  WindowType,
} from '@ai-floor-planner/core';
import type { AlignmentGuide, ViewTransform } from '@ai-floor-planner/core';
import {
  snapToGrid,
  findAlignmentGuides,
  clampOpeningPositionOnWall,
} from '@ai-floor-planner/geometry-engine';
import { fitFloorToViewport, rememberFloorCamera, restoreOrFitFloorCamera } from '../../services/floor-camera';

interface ArchitecturalCanvasProps {
  editor: EditorContextValue;
  onCursorMove: (worldPos: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
}

type DragMode = 'none' | 'pan' | 'move_room' | 'resize_room';

export const ArchitecturalCanvas: React.FC<ArchitecturalCanvasProps> = ({
  editor,
  onCursorMove,
  onZoomChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 800 });

  // Viewport Camera State in Authoritative ViewTransform (scale, offsetX, offsetY)
  const [transform, setTransform] = useState<ViewTransform>({
    scale: 0.045,
    offsetX: 100,
    offsetY: 60,
  });
  const transformRef = useRef(transform);
  const cameraByFloorRef = useRef(new Map<string, ViewTransform>());
  const previousFloorIdRef = useRef(editor.activeFloor.id);

  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  // Transient manipulation state
  const [transientRoom, setTransientRoom] = useState<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const [activeGuides, setActiveGuides] = useState<AlignmentGuide[]>([]);
  const [doorPreview, setDoorPreview] = useState<{ position: { x: number; y: number }; wallId: string } | null>(null);

  // Measure container viewport on mount and resize
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setViewportSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
        }
      }
    };
    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Fit to View Calculation
  const fitPlanToView = useCallback(() => {
    const fit = fitFloorToViewport(editor.activeFloor, viewportSize.width, viewportSize.height, 50);
    transformRef.current = fit;
    rememberFloorCamera(cameraByFloorRef.current, editor.activeFloor.id, fit);
    setTransform(fit);
    onZoomChange(fit.scale);
  }, [editor.activeFloor, viewportSize.width, viewportSize.height, onZoomChange]);

  // Keep each floor's camera independent. First visit fits that floor; later visits restore it.
  useEffect(() => {
    if (viewportSize.width <= 100 || viewportSize.height <= 100) return;
    const previousFloorId = previousFloorIdRef.current;
    if (previousFloorId !== editor.activeFloor.id) {
      rememberFloorCamera(cameraByFloorRef.current, previousFloorId, transformRef.current);
    }
    const next = restoreOrFitFloorCamera(
      cameraByFloorRef.current,
      editor.activeFloor,
      viewportSize.width,
      viewportSize.height,
      50,
    );
    transformRef.current = next;
    rememberFloorCamera(cameraByFloorRef.current, editor.activeFloor.id, next);
    setTransform(next);
    onZoomChange(next.scale);
    previousFloorIdRef.current = editor.activeFloor.id;
  }, [editor.activeFloor.id, viewportSize.width, viewportSize.height, fitPlanToView, onZoomChange]);

  useEffect(() => {
    transformRef.current = transform;
    rememberFloorCamera(cameraByFloorRef.current, previousFloorIdRef.current, transform);
  }, [transform]);

  // Render Base SVG from Authoritative Renderer using current transform
  const svgContent = useMemo(() => {
    return renderFloor(
      editor.activeFloor,
      editor.building,
      transform,
      viewportSize.width,
      viewportSize.height
    );
  }, [editor.activeFloor, editor.building, transform, viewportSize.width, viewportSize.height]);

  // Screen to World Conversion using Authoritative transform
  const getScreenToWorld = useCallback((screenX: number, screenY: number) => {
    const rect = containerRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
    const localX = screenX - rect.left;
    const localY = screenY - rect.top;
    return screenToWorld({ x: localX, y: localY }, transform);
  }, [transform]);

  // Selected Room Object
  const selectedRoom = useMemo(() => {
    if (editor.selection?.entityType === 'room') {
      return editor.activeFloor.rooms.find(r => r.id === editor.selection?.entityId) ?? null;
    }
    return null;
  }, [editor.selection, editor.activeFloor.rooms]);

  // Handle Wheel Zoom (Cursor-Anchored)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newScale = Math.max(0.005, Math.min(0.5, transform.scale * zoomFactor));

    const rect = containerRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newOffsetX = mouseX - (mouseX - transform.offsetX) * (newScale / transform.scale);
    const newOffsetY = mouseY - (mouseY - transform.offsetY) * (newScale / transform.scale);

    const nextTransform = { scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY };
    setTransform(nextTransform);
    onZoomChange(newScale);
  };

  // Handle Pointer Down
  const handlePointerDown = (e: React.PointerEvent) => {
    const worldPos = getScreenToWorld(e.clientX, e.clientY);

    // Pan with Middle Mouse Button, Space, or Pan tool
    if (e.button === 1 || editor.activeTool === 'pan') {
      setDragMode('pan');
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Add Room Tool
    if (editor.activeTool === 'add_room') {
      const snapped = snapToGrid(worldPos, 100);
      editor.executeCommand(
        new AddRoomCommand(editor.activeFloor.id, {
          floorId: editor.activeFloor.id,
          type: RoomType.Bedroom,
          name: `Room ${editor.activeFloor.rooms.length + 1}`,
          x: snapped.x,
          y: snapped.y,
          width: 3600,
          height: 3600,
        })
      );
      editor.setTool('select');
      return;
    }

    // Add Door Tool
    if (editor.activeTool === 'add_door') {
      for (const wall of editor.activeFloor.walls) {
        const clamped = clampOpeningPositionOnWall(worldPos, wall, 900);
        if (clamped.valid) {
          editor.executeCommand(
            new AddDoorCommand(editor.activeFloor.id, {
              floorId: editor.activeFloor.id,
              wallId: wall.id,
              position: clamped.position,
              width: 900,
              height: 2100,
              type: DoorType.Single,
              connectsRooms: ['', ''],
            })
          );
          editor.setTool('select');
          return;
        }
      }
      return;
    }

    // Add Window Tool
    if (editor.activeTool === 'add_window') {
      for (const wall of editor.activeFloor.walls) {
        const clamped = clampOpeningPositionOnWall(worldPos, wall, 1200);
        if (clamped.valid) {
          editor.executeCommand(
            new AddWindowCommand(editor.activeFloor.id, {
              floorId: editor.activeFloor.id,
              wallId: wall.id,
              position: clamped.position,
              width: 1200,
              height: 1200,
              sillHeight: 900,
              type: WindowType.Sliding,
              roomId: editor.activeFloor.rooms[0]?.id ?? '',
            })
          );
          editor.setTool('select');
          return;
        }
      }
      return;
    }

    // Check if clicked an SVG Entity via DOM target
    const target = e.target as HTMLElement;
    const entityElement = target.closest('[data-entity-id]');
    if (entityElement) {
      const entityId = entityElement.getAttribute('data-entity-id')!;
      const entityType = entityElement.getAttribute('data-entity-type') || 'room';

      editor.selectEntity(entityType, entityId, editor.activeFloor.id);

      if (entityType === 'room') {
        const r = editor.activeFloor.rooms.find(room => room.id === entityId);
        if (r) {
          setDragMode('move_room');
          setDragStart({ x: worldPos.x - r.x, y: worldPos.y - r.y });
          setTransientRoom({ id: r.id, x: r.x, y: r.y, width: r.width, height: r.height });
        }
      }
      return;
    }

    // Hit-test rooms mathematically if SVG hit test missed
    const hitRoom = editor.activeFloor.rooms.find(
      r => worldPos.x >= r.x && worldPos.x <= r.x + r.width && worldPos.y >= r.y && worldPos.y <= r.y + r.height
    );

    if (hitRoom) {
      editor.selectEntity('room', hitRoom.id, editor.activeFloor.id);
      setDragMode('move_room');
      setDragStart({ x: worldPos.x - hitRoom.x, y: worldPos.y - hitRoom.y });
      setTransientRoom({ id: hitRoom.id, x: hitRoom.x, y: hitRoom.y, width: hitRoom.width, height: hitRoom.height });
    } else {
      editor.clearSelection();
    }
  };

  // Handle Resize Handle Pointer Down
  const handleResizeStart = (handle: string, e: React.PointerEvent) => {
    e.stopPropagation();
    if (!selectedRoom) return;

    setDragMode('resize_room');
    setResizeHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setTransientRoom({
      id: selectedRoom.id,
      x: selectedRoom.x,
      y: selectedRoom.y,
      width: selectedRoom.width,
      height: selectedRoom.height,
    });
  };

  // Handle Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    const worldPos = getScreenToWorld(e.clientX, e.clientY);
    onCursorMove(worldPos);

    // Pan Viewport
    if (dragMode === 'pan') {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setTransform(t => ({ ...t, offsetX: t.offsetX + dx, offsetY: t.offsetY + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Move Room Dragging
    if (dragMode === 'move_room' && transientRoom) {
      const rawX = worldPos.x - dragStart.x;
      const rawY = worldPos.y - dragStart.y;

      // Snapping to grid & alignment guides
      const snapped = snapToGrid({ x: rawX, y: rawY }, 100);
      const hostRoom = editor.activeFloor.rooms.find(r => r.id === transientRoom.id);
      const guides = hostRoom
        ? findAlignmentGuides(
            { ...hostRoom, x: snapped.x, y: snapped.y },
            editor.activeFloor.rooms.filter(r => r.id !== transientRoom.id),
            150
          )
        : [];

      setActiveGuides(guides);
      setTransientRoom(prev => prev ? { ...prev, x: snapped.x, y: snapped.y } : null);
      return;
    }

    // Resize Room Dragging
    if (dragMode === 'resize_room' && transientRoom && selectedRoom) {
      const initialWorld = getScreenToWorld(dragStart.x, dragStart.y);
      const deltaX = worldPos.x - initialWorld.x;
      const deltaY = worldPos.y - initialWorld.y;

      let newX = selectedRoom.x;
      let newY = selectedRoom.y;
      let newW = selectedRoom.width;
      let newH = selectedRoom.height;

      if (resizeHandle?.includes('e')) newW = Math.max(1000, selectedRoom.width + deltaX);
      if (resizeHandle?.includes('s')) newH = Math.max(1000, selectedRoom.height + deltaY);
      if (resizeHandle?.includes('w')) {
        const potentialW = selectedRoom.width - deltaX;
        if (potentialW >= 1000) {
          newX = selectedRoom.x + deltaX;
          newW = potentialW;
        }
      }
      if (resizeHandle?.includes('n')) {
        const potentialH = selectedRoom.height - deltaY;
        if (potentialH >= 1000) {
          newY = selectedRoom.y + deltaY;
          newH = potentialH;
        }
      }

      setTransientRoom({
        id: selectedRoom.id,
        x: Math.round(newX / 100) * 100,
        y: Math.round(newY / 100) * 100,
        width: Math.round(newW / 100) * 100,
        height: Math.round(newH / 100) * 100,
      });
      return;
    }

    // Door / Window Placement Tool Hover
    if (editor.activeTool === 'add_door' || editor.activeTool === 'add_window') {
      for (const wall of editor.activeFloor.walls) {
        const clamped = clampOpeningPositionOnWall(worldPos, wall, 900);
        if (clamped.valid) {
          setDoorPreview({ position: clamped.position, wallId: wall.id });
          return;
        }
      }
      setDoorPreview(null);
    }
  };

  // Handle Pointer Up (Commit Command)
  const handlePointerUp = () => {
    if (dragMode === 'move_room' && transientRoom && selectedRoom) {
      if (transientRoom.x !== selectedRoom.x || transientRoom.y !== selectedRoom.y) {
        editor.executeCommand(new MoveRoomCommand(transientRoom.id, transientRoom.x, transientRoom.y));
      }
    } else if (dragMode === 'resize_room' && transientRoom && selectedRoom) {
      if (
        transientRoom.x !== selectedRoom.x ||
        transientRoom.y !== selectedRoom.y ||
        transientRoom.width !== selectedRoom.width ||
        transientRoom.height !== selectedRoom.height
      ) {
        editor.executeCommand(
          new ResizeRoomCommand(
            transientRoom.id,
            transientRoom.width,
            transientRoom.height
          )
        );
      }
    }

    setDragMode('none');
    setTransientRoom(null);
    setActiveGuides([]);
    setResizeHandle(null);
  };

  // Keyboard Shortcuts (Delete, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        editor.clearSelection();
        editor.setTool('select');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeTag = (document.activeElement?.tagName || '').toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'select' && activeTag !== 'textarea') {
          editor.deleteSelected();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          editor.redo();
        } else {
          editor.undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        editor.redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  const displayRoom = transientRoom ?? selectedRoom;

  const violatingRooms = useMemo(() => {
    const affectedIds = new Set(
      editor.validationSummary.violations
        .filter(issue => issue.severity === 'hard')
        .flatMap(issue => issue.affectedEntities),
    );
    return editor.activeFloor.rooms.filter(room => affectedIds.has(room.id));
  }, [editor.activeFloor.rooms, editor.validationSummary.violations]);

  // Compute Screen Coordinates for Overlay Elements
  const overlayRoomBox = useMemo(() => {
    if (!displayRoom) return null;
    const screenTopLeft = worldToScreen({ x: displayRoom.x, y: displayRoom.y }, transform);
    const screenW = scaleToScreen(displayRoom.width, transform);
    const screenH = scaleToScreen(displayRoom.height, transform);
    return {
      x: screenTopLeft.x,
      y: screenTopLeft.y,
      width: screenW,
      height: screenH,
    };
  }, [displayRoom, transform]);

  return (
    <div
      ref={containerRef}
      className={`canvas-viewport ${dragMode === 'pan' ? 'panning' : ''}`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
    >
      <div className="canvas-context-card">
        <span className="canvas-context-eyebrow">Design workspace</span>
        <strong>{editor.activeFloor.name}</strong>
        <small>{editor.activeFloor.rooms.length} spaces · live constraint model</small>
      </div>

      <div className="canvas-floating-actions">
        <span className={`canvas-validation-chip ${editor.validationSummary.isValid ? 'valid' : 'invalid'}`}>
          <ShieldCheck size={14} />
          {editor.validationSummary.isValid ? 'Constraints clear' : `${editor.validationSummary.failed} hard issues`}
        </span>
        <button onClick={fitPlanToView} title="Fit plan to view" aria-label="Fit plan to view">
          <Focus size={15} />
        </button>
      </div>

      {/* Base Layer: Authoritative Vector SVG */}
      <div
        dangerouslySetInnerHTML={{ __html: svgContent }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: viewportSize.width,
          height: viewportSize.height,
          pointerEvents: 'all',
        }}
      />

      {/* Dynamic CAD Interaction Overlay */}
      <svg
        className="interaction-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: viewportSize.width,
          height: viewportSize.height,
          pointerEvents: 'none',
        }}
      >
        {/* Constraint-linked rooms remain visible in the drawing itself. */}
        {violatingRooms.map(room => {
          const topLeft = worldToScreen({ x: room.x, y: room.y }, transform);
          return (
            <rect
              key={`violation-${room.id}`}
              className="violation-room-overlay"
              x={topLeft.x}
              y={topLeft.y}
              width={scaleToScreen(room.width, transform)}
              height={scaleToScreen(room.height, transform)}
              rx={4}
              pointerEvents="none"
            />
          );
        })}

        {/* Alignment Guides */}
        {activeGuides.map((guide, idx) => {
          const sPos = guide.type === 'vertical'
            ? worldToScreen({ x: guide.position, y: 0 }, transform).x
            : worldToScreen({ x: 0, y: guide.position }, transform).y;
          return (
            <line
              key={idx}
              className="alignment-guide-line"
              x1={guide.type === 'vertical' ? sPos : 0}
              y1={guide.type === 'horizontal' ? sPos : 0}
              x2={guide.type === 'vertical' ? sPos : viewportSize.width}
              y2={guide.type === 'horizontal' ? sPos : viewportSize.height}
            />
          );
        })}

        {/* Door / Window Hover Placement Indicator */}
        {doorPreview && (() => {
          const sPos = worldToScreen(doorPreview.position, transform);
          return (
            <circle
              cx={sPos.x}
              cy={sPos.y}
              r={8}
              fill="var(--accent-cyan)"
              stroke="#ffffff"
              strokeWidth={2}
            />
          );
        })()}

        {/* Selected Room Bounding Box & 8-Point Resize Grips */}
        {overlayRoomBox && displayRoom && (
          <g>
            <rect
              className={transientRoom ? 'ghost-room-preview' : 'selection-box'}
              x={overlayRoomBox.x}
              y={overlayRoomBox.y}
              width={overlayRoomBox.width}
              height={overlayRoomBox.height}
              pointerEvents="none"
            />

            {/* 8 Resize Handles (nw, n, ne, e, se, s, sw, w) */}
            {[
              { id: 'nw', x: overlayRoomBox.x, y: overlayRoomBox.y },
              { id: 'n', x: overlayRoomBox.x + overlayRoomBox.width / 2, y: overlayRoomBox.y },
              { id: 'ne', x: overlayRoomBox.x + overlayRoomBox.width, y: overlayRoomBox.y },
              { id: 'e', x: overlayRoomBox.x + overlayRoomBox.width, y: overlayRoomBox.y + overlayRoomBox.height / 2 },
              { id: 'se', x: overlayRoomBox.x + overlayRoomBox.width, y: overlayRoomBox.y + overlayRoomBox.height },
              { id: 's', x: overlayRoomBox.x + overlayRoomBox.width / 2, y: overlayRoomBox.y + overlayRoomBox.height },
              { id: 'sw', x: overlayRoomBox.x, y: overlayRoomBox.y + overlayRoomBox.height },
              { id: 'w', x: overlayRoomBox.x, y: overlayRoomBox.y + overlayRoomBox.height / 2 },
            ].map(h => (
              <rect
                key={h.id}
                className={`resize-handle ${h.id}`}
                x={h.x - 5}
                y={h.y - 5}
                width={10}
                height={10}
                style={{ pointerEvents: 'all', cursor: `${h.id}-resize` }}
                onPointerDown={e => handleResizeStart(h.id, e)}
              />
            ))}

            {/* Live Dimensions HUD during Drag */}
            {transientRoom && (
              <text
                x={overlayRoomBox.x + overlayRoomBox.width / 2}
                y={overlayRoomBox.y - 10}
                fill="var(--accent-cyan)"
                fontSize={13}
                fontFamily="var(--font-mono)"
                fontWeight="bold"
                textAnchor="middle"
              >
                {Math.round(displayRoom.width)} × {Math.round(displayRoom.height)} mm
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};
