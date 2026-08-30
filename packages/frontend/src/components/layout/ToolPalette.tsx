import React from 'react';
import {
  MousePointer,
  Hand,
  PlusSquare,
  DoorOpen,
  Maximize2,
  Trash2,
} from 'lucide-react';
import type { EditorTool } from '@ai-floor-planner/core';
import type { EditorContextValue } from '../../stores/editor-store';

interface ToolPaletteProps {
  editor: EditorContextValue;
}

export const ToolPalette: React.FC<ToolPaletteProps> = ({ editor }) => {
  const tools: { id: EditorTool; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'select', label: 'Select', icon: <MousePointer size={18} />, shortcut: 'V' },
    { id: 'pan', label: 'Pan', icon: <Hand size={18} />, shortcut: 'H' },
    { id: 'add_room', label: 'Room', icon: <PlusSquare size={18} />, shortcut: 'R' },
    { id: 'add_door', label: 'Door', icon: <DoorOpen size={18} />, shortcut: 'D' },
    { id: 'add_window', label: 'Window', icon: <Maximize2 size={18} />, shortcut: 'W' },
  ];

  return (
    <aside className="tool-palette">
      {tools.map((t) => (
        <button
          key={t.id}
          className={`tool-button ${editor.activeTool === t.id ? 'active' : ''}`}
          title={`${t.label} Tool (${t.shortcut})`}
          onClick={() => editor.setTool(t.id)}
        >
          {t.icon}
          <span className="tool-label">{t.label}</span>
        </button>
      ))}

      <div className="palette-divider" />

      {/* Delete selected entity button */}
      <button
        className="tool-button"
        title="Delete Selected Entity (Del)"
        disabled={!editor.selection}
        onClick={editor.deleteSelected}
        style={{ color: editor.selection ? 'var(--status-danger)' : undefined }}
      >
        <Trash2 size={18} />
        <span className="tool-label">Delete</span>
      </button>
    </aside>
  );
};
