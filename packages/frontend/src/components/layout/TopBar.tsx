import React from 'react';
import {
  Undo2,
  Redo2,
  FolderPlus,
  Save,
  Download,
  Upload,
  Layers,
  Sparkles,
  MessageSquareText,
  HardDrive,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react';
import type { EditorContextValue } from '../../stores/editor-store';
import {
  CURRENT_PROJECT_SCHEMA_VERSION,
  exportProjectAsJsonFile,
  parseAndValidateProjectJson,
} from '../../services/storage';

interface TopBarProps {
  editor: EditorContextValue;
  onOpenNewModal: () => void;
  onOpenExportModal: () => void;
  onOpenAIDesignModal: () => void;
  onOpenAIEditPanel: () => void;
  onBackToProjects: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  editor,
  onOpenNewModal,
  onOpenExportModal,
  onOpenAIDesignModal,
  onOpenAIEditPanel,
  onBackToProjects,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const envelope = parseAndValidateProjectJson(text);
        editor.setBuilding(envelope.building, envelope.name, envelope.requiredRoomCounts, envelope.category);
        alert(`Successfully imported: ${envelope.name}`);
      } catch (err: any) {
        alert(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportJson = () => {
    exportProjectAsJsonFile({
      schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
      projectId: editor.projectId,
      name: editor.projectName,
      createdAt: editor.building.createdAt,
      updatedAt: new Date().toISOString(),
      building: editor.building,
      requiredRoomCounts: editor.requiredRoomCounts,
      category: editor.projectCategory,
      status: editor.projectStatus,
    });
  };

  return (
    <header className="topbar">
      {/* Hidden File Input for JSON Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div className="topbar-left">
        <button className="btn-icon" onClick={onBackToProjects} title="Back to projects" aria-label="Back to projects">
          <ArrowLeft size={15} />
        </button>
        <div className="app-brand">
          <span className="app-brand-mark"><Sparkles size={17} /></span>
          <span className="app-brand-copy">
            <strong>FORMA</strong>
            <small>AI PLANNER</small>
          </span>
        </div>
        <div className="topbar-divider" />
        <div className="project-identity" title={editor.projectName}>
          <span>{editor.projectName}</span>
          <small><HardDrive size={11} /> Saved locally</small>
        </div>
      </div>

      {/* Center: Floor Navigation Switcher */}
      <div className="topbar-center">
        <div className="floor-switcher">
          {editor.building.floors.map((floor) => (
            <button
              key={floor.id}
              className={`floor-tab ${editor.activeFloor.id === floor.id ? 'active' : ''}`}
              onClick={() => editor.switchFloor(floor.id)}
            >
              <Layers size={13} />
              {floor.name}
            </button>
          ))}
          <button className="floor-menu-button" title="Floor options" aria-label="Floor options">
            <ChevronDown size={13} />
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="topbar-right">
        {/* AI design requirements and candidate-generation trigger */}
        <div className="ai-action-group">
        <button
          className="btn-secondary ai-action"
          onClick={onOpenAIDesignModal}
          title="Open AI Building Design Intelligence"
        >
          <Sparkles size={14} />
          <span>AI Design</span>
        </button>

        <button
          className="btn-secondary ai-action"
          onClick={onOpenAIEditPanel}
          title="Edit the current plan with natural language"
        >
          <MessageSquareText size={14} />
          <span>AI Edit</span>
        </button>
        </div>

        <div className="topbar-divider compact" />

        <button
          className="btn-icon"
          title="Undo (Ctrl+Z)"
          disabled={!editor.canUndo}
          onClick={editor.undo}
        >
          <Undo2 size={16} />
        </button>
        <button
          className="btn-icon"
          title="Redo (Ctrl+Y)"
          disabled={!editor.canRedo}
          onClick={editor.redo}
        >
          <Redo2 size={16} />
        </button>

        <div className="topbar-divider compact" />

        <button className="btn-secondary" onClick={onOpenNewModal} title="Create New Project">
          <FolderPlus size={14} />
          <span>New</span>
        </button>

        <button className="btn-icon topbar-compact-action" onClick={handleImportClick} title="Import Floor Plan JSON" aria-label="Import plan">
          <Upload size={14} />
        </button>

        <button className="btn-icon topbar-compact-action" onClick={handleExportJson} title="Export Project JSON" aria-label="Export project JSON">
          <Download size={14} />
        </button>

        <button className="btn-secondary save-action" onClick={editor.saveProject} title="Save to Local Storage">
          <Save size={14} />
          <span>Save</span>
        </button>

        <button className="btn-primary" onClick={onOpenExportModal} title="Open Advanced Export Studio">
          <Download size={14} />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
