import React, { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { ProjectDashboard } from './components/projects/ProjectDashboard';
import './styles/editor.css';

export const App: React.FC = () => {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  if (!activeProjectId) {
    return <ProjectDashboard onOpenProject={setActiveProjectId} />;
  }

  return <AppShell key={activeProjectId} onBackToProjects={() => setActiveProjectId(null)} />;
};

export default App;
