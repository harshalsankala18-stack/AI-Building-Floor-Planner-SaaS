import React, { useState } from 'react';
import { StudioShell } from './components/studio/StudioShell';
import { ProjectDashboard } from './components/projects/ProjectDashboard';
import './styles/editor.css';
import './styles/studio.css';

export const App: React.FC = () => {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const stored = localStorage.getItem('ai_floor_planner_active_project');
    if (hash === '#oda-poc' && (!stored || stored === 'dashboard' || stored === 'none')) {
      return 'active-canonical-project';
    }
    if (!stored || stored === 'dashboard' || stored === 'none') {
      return null;
    }
    return stored;
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
        localStorage.setItem('ai_floor_planner_active_project', 'dashboard');
        setActiveProjectId(null);
      }}
    />
  );
};

export default App;
