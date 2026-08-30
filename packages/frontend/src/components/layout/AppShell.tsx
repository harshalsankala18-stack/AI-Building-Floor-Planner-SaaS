import React, { useState } from 'react';
import { useEditorStore } from '../../stores/editor-store';
import { TopBar } from './TopBar';
import { ToolPalette } from './ToolPalette';
import { ArchitecturalCanvas } from '../canvas/ArchitecturalCanvas';
import { PropertyInspector } from '../inspector/PropertyInspector';
import { StatusBar } from './StatusBar';
import { NewProjectModal } from '../modals/NewProjectModal';
import { ExportModal } from '../modals/ExportModal';
import { AIDesignModal } from '../ai-design/AIDesignModal';
import { AIEditPanel } from '../ai-edit/AIEditPanel';
import { ValidationPanel } from '../validation/ValidationPanel';
import { BarChart3, SlidersHorizontal } from 'lucide-react';

type InspectorView = 'properties' | 'quality';

interface AppShellProps {
  onBackToProjects: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({ onBackToProjects }) => {
  const editor = useEditorStore();
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAIDesignModalOpen, setIsAIDesignModalOpen] = useState(false);
  const [isAIEditPanelOpen, setIsAIEditPanelOpen] = useState(false);
  const [inspectorView, setInspectorView] = useState<InspectorView>('quality');
  const [cursorWorldPos, setCursorWorldPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.05);

  return (
    <div className="app-container">
      {/* 1. Header Navigation */}
      <TopBar
        editor={editor}
        onOpenNewModal={() => setIsNewModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenAIDesignModal={() => setIsAIDesignModalOpen(true)}
        onOpenAIEditPanel={() => setIsAIEditPanelOpen(true)}
        onBackToProjects={onBackToProjects}
      />

      {/* 2. Main CAD Workspace (5-zone layout) */}
      <main className="workspace-main">
        {/* Left Toolbar */}
        <ToolPalette editor={editor} />

        {/* Center Canvas Viewport */}
        <ArchitecturalCanvas
          editor={editor}
          onCursorMove={setCursorWorldPos}
          onZoomChange={setZoom}
        />

        {/* Right Intelligence Dock */}
        <aside className="inspector-dock" aria-label="Plan inspector">
          <div className="inspector-tabs" role="tablist" aria-label="Inspector views">
            <button
              role="tab"
              aria-selected={inspectorView === 'properties'}
              className={inspectorView === 'properties' ? 'active' : ''}
              onClick={() => setInspectorView('properties')}
            >
              <SlidersHorizontal size={14} /> Properties
            </button>
            <button
              role="tab"
              aria-selected={inspectorView === 'quality'}
              className={inspectorView === 'quality' ? 'active' : ''}
              onClick={() => setInspectorView('quality')}
            >
              <BarChart3 size={14} /> Quality
              {editor.validationSummary.violations.length > 0 && (
                <span className="tab-notification">{editor.validationSummary.violations.length}</span>
              )}
            </button>
          </div>
          <div className="inspector-dock-content">
            {inspectorView === 'properties'
              ? <PropertyInspector editor={editor} embedded />
              : <ValidationPanel editor={editor} />}
          </div>
        </aside>
      </main>

      {/* 3. Bottom Status Bar */}
      <StatusBar
        editor={editor}
        cursorWorldPos={cursorWorldPos}
        zoom={zoom}
        onOpenQuality={() => setInspectorView('quality')}
      />

      {/* Dialog Modals */}
      <NewProjectModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSelectBuilding={(building, name, category) => editor.setBuilding(building, name, {}, category)}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        building={editor.building}
        floor={editor.activeFloor}
        validationSummary={editor.validationSummary}
      />

      {/* AI design requirements and candidate-generation modal */}
      <AIDesignModal
        isOpen={isAIDesignModalOpen}
        onClose={() => setIsAIDesignModalOpen(false)}
        onSelectCandidate={(cand) => {
          editor.setBuilding(cand.building, cand.name, cand.requiredRoomCounts);
        }}
      />

      <AIEditPanel
        isOpen={isAIEditPanelOpen}
        onClose={() => setIsAIEditPanelOpen(false)}
        editor={editor}
      />
    </div>
  );
};
