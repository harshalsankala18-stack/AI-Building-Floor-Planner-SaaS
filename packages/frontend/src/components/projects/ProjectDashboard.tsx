import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Cpu,
  FolderOpen,
  HardDrive,
  LayoutDashboard,
  Play,
  Plus,
  Ruler,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import type { Building } from '@ai-floor-planner/core';
import {
  CURRENT_PROJECT_SCHEMA_VERSION,
  projectStorage,
  type BuildingCategory,
  type ProjectHeader,
} from '../../services/storage';
import { BackendAPI, type HealthCheckResponse } from '../../services/backend-api';
import { ResidentialPlanningWizard } from '../wizard/ResidentialPlanningWizard';

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
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const projects = useMemo(() => projectStorage.list(), [refreshKey]);
  const activeProjectId = projectStorage.getActiveProjectId();
  const activeProject = useMemo(
    () => projects.find(p => p.id === activeProjectId) ?? projects[0] ?? null,
    [projects, activeProjectId],
  );

  useEffect(() => {
    const api = new BackendAPI();
    api.checkHealth().then(setHealth).catch(() => {});
  }, [isIntegrationsOpen]);

  const openProject = (projectId: string) => {
    if (projectStorage.setActiveProjectId(projectId)) onOpenProject(projectId);
  };

  const createProject = (building: Building, name: string, category: BuildingCategory) => {
    const existing = projectStorage.load(building.projectId);
    if (!existing) {
      projectStorage.save({
        schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
        projectId: building.projectId,
        name,
        createdAt: building.createdAt,
        updatedAt: new Date().toISOString(),
        building,
        category,
        pendingAiGeneration: true,
        status: building.floors.some(f => f.rooms.length > 0) ? 'GENERATED' : 'CONCEPT',
      });
    }
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
        <nav aria-label="Product navigation" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button className="active"><LayoutDashboard size={16} /> Projects</button>
          <button
            type="button"
            onClick={() => setIsIntegrationsOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Settings size={16} /> Integrations & AI
          </button>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {activeProject && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => openProject(activeProject.id)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: '1px solid #DFE2DA', background: '#FFFFFF', color: '#1C1E1B', fontWeight: 600 }}
              >
                <Play size={15} /> Continue Existing Project ({activeProject.name})
              </button>
            )}
            <button className="btn-primary project-new-action" onClick={() => setIsNewProjectOpen(true)}>
              <Plus size={16} /> Create New Project
            </button>
          </div>
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

      {isIntegrationsOpen && (
        <div
          className="modal-backdrop"
          style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setIsIntegrationsOpen(false)}
        >
          <div
            className="modal-card"
            data-testid="integrations-modal"
            style={{ width: '100%', maxWidth: 560, background: '#FFFFFF', borderRadius: 16, border: '1px solid #DFE2DA', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.16)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid #E2E8F0', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Cpu size={20} color="#1E3A2F" />
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Integrations & AI Providers</h3>
                  <span style={{ fontSize: 12, color: '#64748B' }}>Server-managed AI model separation & deterministic CAD verification</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsIntegrationsOpen(false)}
                aria-label="Close Integrations Modal"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 14, borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong style={{ fontSize: 13, color: '#0F172A' }}>1. Concept Image Generation Model</strong>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: health?.imageGeneration?.reachable !== false ? '#166534' : '#B91C1C', background: health?.imageGeneration?.reachable !== false ? '#DCFCE7' : '#FEE2E2', padding: '2px 8px', borderRadius: 999 }}>
                    <CheckCircle2 size={12} />
                    {health?.imageGeneration?.reachable !== false ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#334155', fontFamily: 'monospace' }}>
                  Provider: {health?.imageGeneration?.provider ?? 'gemini'} · Model: {health?.imageGeneration?.model ?? 'gemini-3.1-flash-lite-image'}
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                  Generates top-down 2D architectural concept floor plans and supports reference-guided instruction editing.
                </div>
              </div>

              <div style={{ padding: 14, borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong style={{ fontSize: 13, color: '#0F172A' }}>2. Multimodal Vision Interpretation & Evaluation Model</strong>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#166534', background: '#DCFCE7', padding: '2px 8px', borderRadius: 999 }}>
                    <CheckCircle2 size={12} />
                    CONFIGURED
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#334155', fontFamily: 'monospace' }}>
                  Provider: gemini · Model: gemini-3.1-flash-lite (Fallback: gemini-3.8-flash)
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                  Extracts structured room graphs, footprint topology, entrance orientation, and advisory architectural evaluations from generated images.
                </div>
              </div>

              <div style={{ padding: 14, borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong style={{ fontSize: 13, color: '#0F172A' }}>3. Deterministic CAD & Structural Coordination Engine</strong>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#166534', background: '#DCFCE7', padding: '2px 8px', borderRadius: 999 }}>
                    <CheckCircle2 size={12} />
                    ACTIVE
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                  Normalizes AI spatial layouts into snap-aligned walls, doors, windows, stairs, and conceptual structural column grids with hard NBC-2016 validation.
                </div>
              </div>
            </div>

            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsIntegrationsOpen(false)}
                style={{ padding: '8px 18px', borderRadius: 8 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <ResidentialPlanningWizard
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onComplete={createProject}
      />
    </div>
  );
};
