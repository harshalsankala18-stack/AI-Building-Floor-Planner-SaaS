import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  GraduationCap,
  Home,
  LayoutGrid,
  Sparkles,
  Store,
  X,
} from 'lucide-react';
import type { Building } from '@ai-floor-planner/core';
import {
  createCanonical30x50_2BHK,
  createEmptyPlot,
  type BuildingCategory,
} from '../../services/storage';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBuilding: (building: Building, name: string, category: BuildingCategory) => void;
}

const CATEGORY_OPTIONS: Array<{
  id: BuildingCategory;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  { id: 'residential', label: 'Residential', description: 'Homes, villas, apartments and multi-floor residences.', icon: <Home size={20} /> },
  { id: 'commercial', label: 'Commercial', description: 'Offices, retail and professional workplace projects.', icon: <Building2 size={20} /> },
  { id: 'mixed_use', label: 'Mixed use', description: 'Residential and commercial uses within one project.', icon: <Store size={20} /> },
  { id: 'educational', label: 'Educational', description: 'Schools, learning spaces and academic facilities.', icon: <GraduationCap size={20} /> },
];

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onSelectBuilding,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [category, setCategory] = useState<BuildingCategory>('residential');
  const [name, setName] = useState('My Building Project');
  const [plotWidthFt, setPlotWidthFt] = useState(30);
  const [plotDepthFt, setPlotDepthFt] = useState(50);

  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen]);

  if (!isOpen) return null;

  const safeName = name.trim() || 'Untitled Building Project';
  const dimensionsValid = plotWidthFt >= 10 && plotDepthFt >= 10;

  const createCanonical = () => {
    const building = createCanonical30x50_2BHK(safeName);
    onSelectBuilding(building, safeName, category);
    onClose();
  };

  const createBlank = () => {
    if (!dimensionsValid) return;
    const building = createEmptyPlot(
      Math.round(plotWidthFt * 304.8),
      Math.round(plotDepthFt * 304.8),
      safeName,
    );
    onSelectBuilding(building, safeName, category);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="modal-card project-setup-modal" role="dialog" aria-modal="true" aria-labelledby="new-project-title" onClick={event => event.stopPropagation()}>
        <header className="modal-header">
          <div>
            <span className="eyebrow">Project setup · Step {step} of 2</span>
            <h2 id="new-project-title">{step === 1 ? 'Choose a building category' : 'Define the project baseline'}</h2>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close project setup"><X size={16} /></button>
        </header>

        <div className="modal-body project-setup-body">
          {step === 1 ? (
            <>
              <p className="project-setup-intro">The category is stored with the project and will drive space programs and rule sets as those modules are enabled.</p>
              <div className="project-category-grid">
                {CATEGORY_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    className={`project-category-card ${category === option.id ? 'selected' : ''}`}
                    onClick={() => setCategory(option.id)}
                    aria-pressed={category === option.id}
                  >
                    <span className="project-category-icon">{option.icon}</span>
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="project-baseline-grid">
                <div className="form-group project-name-field">
                  <label className="form-label" htmlFor="project-name">Project name</label>
                  <input id="project-name" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. East Avenue Residence" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="plot-width">Plot frontage (ft)</label>
                  <input id="plot-width" type="number" min="10" value={plotWidthFt} onChange={event => setPlotWidthFt(Number(event.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="plot-depth">Plot depth (ft)</label>
                  <input id="plot-depth" type="number" min="10" value={plotDepthFt} onChange={event => setPlotDepthFt(Number(event.target.value))} />
                </div>
              </div>

              {!dimensionsValid && <p className="field-warning" role="alert">Plot dimensions must be at least 10 ft.</p>}

              <div className="project-template-grid">
                {category === 'residential' && (
                  <button className="project-template-card featured" onClick={createCanonical}>
                    <span className="project-template-icon"><Sparkles size={19} /></span>
                    <span><strong>30×50 residential starter</strong><small>Existing deterministic 2BHK model with rooms, walls, doors and windows.</small></span>
                    <ArrowRight size={16} />
                  </button>
                )}
                <button className="project-template-card" onClick={createBlank} disabled={!dimensionsValid}>
                  <span className="project-template-icon"><LayoutGrid size={19} /></span>
                  <span><strong>Blank plot</strong><small>Canonical site boundary ready for professional drafting.</small></span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {category !== 'residential' && (
                <p className="project-scope-note"><strong>Category recorded.</strong> Category-specific space programs and planning rules are not configured yet, so this milestone starts these projects from an honest blank plot.</p>
              )}
            </>
          )}
        </div>

        <footer className="modal-footer project-setup-footer">
          {step === 1 ? (
            <>
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn-primary" onClick={() => setStep(2)}>Continue <ArrowRight size={15} /></button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => setStep(1)}><ArrowLeft size={15} /> Back</button>
              <span className="project-setup-selection">{CATEGORY_OPTIONS.find(option => option.id === category)?.label}</span>
            </>
          )}
        </footer>
      </section>
    </div>
  );
};
