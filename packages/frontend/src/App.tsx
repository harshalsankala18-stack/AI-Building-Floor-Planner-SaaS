import React, { useState } from 'react';
import { StudioShell } from './components/studio/StudioShell';
import { ProjectDashboard } from './components/projects/ProjectDashboard';
import './styles/editor.css';
import './styles/studio.css';

export const App: React.FC = () => {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    // If there is an existing project in storage, load it by default or show dashboard
    return localStorage.getItem('ai_floor_planner_active_project') ?? 'proj-canonical-30x50';
  });

  if (!activeProjectId) {
    return (
      <ProjectDashboard
        onOpenProject={(id) => {
          localStorage.setItem('ai_floor_planner_active_project', id);
          setActiveProjectId(id);
        }}
      />
    );
  }

  return (
    <StudioShell
      key={activeProjectId}
      onBackToProjects={() => {
        localStorage.removeItem('ai_floor_planner_active_project');
        setActiveProjectId(null);
      }}
    />
  );
};

export default App;
