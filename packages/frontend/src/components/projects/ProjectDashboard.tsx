import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Clock3,
  FolderOpen,
  HardDrive,
  LayoutDashboard,
  Plus,
  Ruler,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { Building } from '@ai-floor-planner/core';
import {
  CURRENT_PROJECT_SCHEMA_VERSION,
  projectStorage,
  type BuildingCategory,
  type ProjectHeader,
} from '../../services/storage';
import { NewProjectModal } from '../modals/NewProjectModal';

interface ProjectDashboardProps {
  onOpenProject: (projectId: string) => void;
}

const CATEGORY_LABELS: Record<BuildingCategory, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  mixed_use: 'Mixed use',
  educational: 'Educational',
};

function formatRelativeDate(value: string): string {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'Date unavailable';
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (elapsedMinutes < 1) return 'Edited just now';
  if (elapsedMinutes < 60) return `Edited ${elapsedMinutes}m ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `Edited ${elapsedHours}h ago`;
  return `Edited ${new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

function millimetresToFeet(value: number): number {
  return Math.round(value / 304.8);
}

const ProjectCard: React.FC<{ project: ProjectHeader; onOpen: () => void }> = ({ project, onOpen }) => (
  <article className="project-card">
    <button className="project-card-preview" onClick={onOpen} aria-label={`Open ${project.name}`}>
      <span className="project-preview-grid" aria-hidden="true">
        <i /><i /><i /><i /><i />
      </span>
      <span className="project-preview-levels">{project.floorCount} {project.floorCount === 1 ? 'level' : 'levels'}</span>
    </button>
    <div className="project-card-body">
      <div className="project-card-heading">
        <div>
          <span className="project-category-label">{CATEGORY_LABELS[project.category]}</span>
          <h3>{project.name}</h3>
        </div>
        <span className={`project-lifecycle status-${project.status.toLowerCase()}`}>{project.status.replace(/_/g, ' ')}</span>
      </div>
      <div className="project-card-metrics">
        <span><Ruler size={13} /> {millimetresToFeet(project.plotWidth)} × {millimetresToFeet(project.plotDepth)} ft</span>
        <span><Building2 size={13} /> {project.roomCount} spaces</span>
      </div>
      <div className="project-card-footer">
        <span><Clock3 size={13} /> {formatRelativeDate(project.updatedAt)}</span>
        <button className="project-open-action" onClick={onOpen}>Open project <ArrowRight size={14} /></button>
      </div>
    </div>
  </article>
);

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ onOpenProject }) => {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const projects = useMemo(() => projectStorage.list(), [refreshKey]);
  const activeProjectId = projectStorage.getActiveProjectId();

  const openProject = (projectId: string) => {
    if (projectStorage.setActiveProjectId(projectId)) onOpenProject(projectId);
  };

  const createProject = (building: Building, name: string, category: BuildingCategory) => {
    projectStorage.save({
      schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
      projectId: building.projectId,
      name,
      createdAt: building.createdAt,
      updatedAt: new Date().toISOString(),
      building,
      category,
      status: 'CONCEPT',
    });
    setRefreshKey(key => key + 1);
    onOpenProject(building.projectId);
  };

  return (
    <div className="project-shell">
      <aside className="project-sidebar">
        <div className="project-shell-brand">
          <span className="app-brand-mark"><Sparkles size={17} /></span>
          <span><strong>FORMA</strong><small>BUILDING INTELLIGENCE</small></span>
        </div>
        <nav aria-label="Product navigation">
          <button className="active"><LayoutDashboard size={16} /> Projects</button>
        </nav>
        <div className="project-local-note">
          <HardDrive size={16} />
          <div><strong>Local workspace</strong><small>Projects remain in this browser. Cloud collaboration is not enabled.</small></div>
        </div>
      </aside>

      <main className="project-dashboard">
        <header className="project-dashboard-header">
          <div>
            <span className="eyebrow">Professional design workspace</span>
            <h1>Projects</h1>
            <p>Start, resume and review concept-stage building designs.</p>
          </div>
          <button className="btn-primary project-new-action" onClick={() => setIsNewProjectOpen(true)}><Plus size={16} /> New project</button>
        </header>

        <section className="project-trust-banner">
          <ShieldCheck size={18} />
          <div><strong>Professional review remains authoritative.</strong><span>AI proposes, deterministic engines calculate, and unsupported checks remain explicitly unavailable.</span></div>
        </section>

        <section className="project-list-section" aria-labelledby="recent-projects-title">
          <div className="project-section-heading">
            <div><span className="eyebrow">Local portfolio</span><h2 id="recent-projects-title">Recent projects</h2></div>
            <span>{projects.length} {projects.length === 1 ? 'project' : 'projects'}</span>
          </div>

          {projects.length > 0 ? (
            <div className="project-grid">
              {projects.map(project => (
                <div key={project.id} className={project.id === activeProjectId ? 'active-project-wrap' : ''}>
                  {project.id === activeProjectId && <span className="active-project-label">Last opened</span>}
                  <ProjectCard project={project} onOpen={() => openProject(project.id)} />
                </div>
              ))}
              <button className="project-create-card" onClick={() => setIsNewProjectOpen(true)}>
                <span><Plus size={22} /></span><strong>Create another project</strong><small>Choose a category and establish the site baseline.</small>
              </button>
            </div>
          ) : (
            <div className="project-empty-state">
              <span><FolderOpen size={25} /></span>
              <h2>No local projects yet</h2>
              <p>Create the first concept project. Nothing will be presented as construction-ready.</p>
              <button className="btn-primary" onClick={() => setIsNewProjectOpen(true)}><Plus size={15} /> Create first project</button>
            </div>
          )}
        </section>
      </main>

      <NewProjectModal isOpen={isNewProjectOpen} onClose={() => setIsNewProjectOpen(false)} onSelectBuilding={createProject} />
    </div>
  );
};
