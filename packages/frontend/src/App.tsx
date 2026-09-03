import React, { Suspense, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { ProjectDashboard } from './components/projects/ProjectDashboard';
import { SiteWorkspace } from './components/site/SiteWorkspace';
import { ProgramWorkspace } from './components/program/ProgramWorkspace';
import './styles/editor.css';

const FootprintWorkspace = React.lazy(() => import('./components/footprint/FootprintWorkspace').then(module => ({ default: module.FootprintWorkspace })));
const GenerationWorkspace = React.lazy(() => import('./components/generation/GenerationWorkspace').then(module => ({ default: module.GenerationWorkspace })));

export const App: React.FC = () => {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<'site' | 'program' | 'footprint' | 'generation' | 'editor'>('site');

  if (!activeProjectId) {
    return <ProjectDashboard onOpenProject={(id) => { setActiveProjectId(id); setWorkspace('site'); }} />;
  }

  if (workspace === 'site') {
    return <SiteWorkspace projectId={activeProjectId} onBack={() => setActiveProjectId(null)} onOpenEditor={() => setWorkspace('editor')} onOpenProgram={() => setWorkspace('program')} />;
  }
  if (workspace === 'program') {
    return <ProgramWorkspace projectId={activeProjectId} onBackToSite={() => setWorkspace('site')} onBackToProjects={() => setActiveProjectId(null)} onOpenFootprint={() => setWorkspace('footprint')} />;
  }
  if (workspace === 'footprint') {
    return <Suspense fallback={<main className="footprint-loading">Loading Footprint workspace…</main>}><FootprintWorkspace projectId={activeProjectId} onBackToProgram={() => setWorkspace('program')} onBackToSite={() => setWorkspace('site')} onBackToProjects={() => setActiveProjectId(null)} onOpenGenerate={() => setWorkspace('generation')} /></Suspense>;
  }
  if (workspace === 'generation') {
    return <Suspense fallback={<main className="footprint-loading">Loading Generation workspace…</main>}><GenerationWorkspace projectId={activeProjectId} onBackToFootprint={() => setWorkspace('footprint')} onBackToProgram={() => setWorkspace('program')} onBackToSite={() => setWorkspace('site')} onBackToProjects={() => setActiveProjectId(null)} onOpenEditor={() => setWorkspace('editor')} /></Suspense>;
  }

  return <AppShell key={activeProjectId} onBackToProjects={() => setActiveProjectId(null)} onOpenSite={() => setWorkspace('site')} />;
};

export default App;
