import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, Building2, CheckCircle2, ChevronRight, HardDrive, Map,
  ShieldAlert, TriangleAlert,
} from 'lucide-react';
import {
  BUILDING_CAPABILITIES, Direction, PlotShape, calculateSiteMetrics, formatBuildingFloorCount,
  rectToPolygon, resolveCardinalSetbacks, updateBuildingSite, validateSite,
  type Site, type SiteDevelopmentControls, type SiteUnitSystem,
} from '@ai-floor-planner/core';
import {
  BUILDING_CATEGORIES, CURRENT_PROJECT_SCHEMA_VERSION, projectStorage,
  type BuildingCategory, type ProjectEnvelope,
} from '../../services/storage';

interface SiteWorkspaceProps {
  projectId: string;
  onBack: () => void;
  onOpenEditor: () => void;
  onOpenProgram: () => void;
}

const CATEGORY_LABELS: Record<BuildingCategory, string> = {
  residential: 'Residential', commercial: 'Commercial', mixed_use: 'Mixed use', educational: 'Educational',
};
const DIRECTIONS = Object.values(Direction);
const MM_PER_FOOT = 304.8;
const MM_PER_METRE = 1000;
const CONTROL_LABELS: Array<[keyof SiteDevelopmentControls, string, string]> = [
  ['permissibleFsi', 'Permissible FSI', 'ratio'],
  ['maxCoveragePercent', 'Maximum coverage', '%'],
  ['maxHeight', 'Maximum height', 'm'],
];

function toDisplay(mm: number, unit: SiteUnitSystem): number {
  return Number((mm / (unit === 'imperial' ? MM_PER_FOOT : MM_PER_METRE)).toFixed(2));
}
function fromDisplay(value: number, unit: SiteUnitSystem): number {
  return value * (unit === 'imperial' ? MM_PER_FOOT : MM_PER_METRE);
}
function areaLabel(squareMm: number, unit: SiteUnitSystem): string {
  const divisor = unit === 'imperial' ? MM_PER_FOOT * MM_PER_FOOT : 1_000_000;
  return (squareMm / divisor).toLocaleString(undefined, { maximumFractionDigits: 1 }) + (unit === 'imperial' ? ' ft²' : ' m²');
}
function directionLabel(direction: Direction): string {
  return direction.charAt(0).toUpperCase() + direction.slice(1);
}

const SiteCanvas: React.FC<{ site: Site }> = ({ site }) => {
  const scale = Math.min(380 / site.plotWidth, 280 / site.plotDepth);
  const width = Math.max(80, site.plotWidth * scale);
  const depth = Math.max(80, site.plotDepth * scale);
  const x = 240 - width / 2;
  const y = 185 - depth / 2;
  const cardinal = resolveCardinalSetbacks(site.setbacks, site.roadFacing);
  const sx = x + cardinal.west * scale;
  const sy = y + cardinal.north * scale;
  const sw = Math.max(0, width - (cardinal.west + cardinal.east) * scale);
  const sh = Math.max(0, depth - (cardinal.north + cardinal.south) * scale);
  const roadSides = [site.roadFacing, ...(site.cornerPlot && site.secondaryRoadFacing ? [site.secondaryRoadFacing] : [])];
  const roadRect = (direction: Direction, key: string) => {
    if (direction === Direction.North) return <rect key={key} x={x} y={y - 30} width={width} height={22} className="site-road" />;
    if (direction === Direction.South) return <rect key={key} x={x} y={y + depth + 8} width={width} height={22} className="site-road" />;
    if (direction === Direction.East) return <rect key={key} x={x + width + 8} y={y} width={22} height={depth} className="site-road" />;
    return <rect key={key} x={x - 30} y={y} width={22} height={depth} className="site-road" />;
  };
  const frontPosition: Record<Direction, { x: number; y: number }> = {
    north: { x: x + width / 2, y: y - 5 }, south: { x: x + width / 2, y: y + depth + 5 },
    east: { x: x + width + 5, y: y + depth / 2 }, west: { x: x - 5, y: y + depth / 2 },
  };
  const front = frontPosition[site.roadFacing];
  const edgeLabels: Record<Direction, string> = site.roadFacing === Direction.North
    ? { north: 'FRONT', south: 'BACK', west: 'LEFT', east: 'RIGHT' }
    : site.roadFacing === Direction.South
      ? { north: 'BACK', south: 'FRONT', west: 'RIGHT', east: 'LEFT' }
      : site.roadFacing === Direction.East
        ? { north: 'LEFT', south: 'RIGHT', west: 'BACK', east: 'FRONT' }
        : { north: 'RIGHT', south: 'LEFT', west: 'FRONT', east: 'BACK' };
  return (
    <svg className="site-canvas-svg" viewBox="0 0 480 370" role="img" aria-label="Site geometry diagram">
      <defs><pattern id="site-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#263244" strokeWidth=".6" /></pattern></defs>
      <rect width="480" height="370" fill="url(#site-grid)" />
      {roadSides.map((side, index) => roadRect(side, String(index)))}
      <rect x={x} y={y} width={width} height={depth} className="site-plot" />
      <rect x={sx} y={sy} width={sw} height={sh} className="site-envelope" />
      <text x={front.x} y={front.y} className="site-front-label">FRONT / ACCESS</text>
      <text x={x + width / 2} y={y + 12} className="site-edge-label">{edgeLabels.north}</text>
      <text x={x + width / 2} y={y + depth - 7} className="site-edge-label">{edgeLabels.south}</text>
      <text x={x + 8} y={y + depth / 2} className="site-edge-label">{edgeLabels.west}</text>
      <text x={x + width - 8} y={y + depth / 2} className="site-edge-label">{edgeLabels.east}</text>
      <g transform={'translate(424 48) rotate(' + site.orientation + ')'}>
        <path d="M0 24 L0 -14 M0 -14 L-6 -3 M0 -14 L6 -3" className="north-arrow" />
        <text x="0" y="-20" className="north-label">N</text>
      </g>
      <text x={x + width / 2} y={y + depth + 48} className="site-dimension">{Math.round(site.plotWidth)} mm wide</text>
      <text x={18} y={185} className="site-dimension" transform="rotate(-90 18 185)">{Math.round(site.plotDepth)} mm deep</text>
      <g transform="translate(20 340)"><rect width="12" height="12" className="site-envelope" /><text x="18" y="10" className="site-legend">Buildable envelope</text><rect x="138" width="12" height="12" className="site-road" /><text x="156" y="10" className="site-legend">Road</text></g>
    </svg>
  );
};

export const SiteWorkspace: React.FC<SiteWorkspaceProps> = ({ projectId, onBack, onOpenEditor, onOpenProgram }) => {
  const initial = useMemo(() => projectStorage.load(projectId), [projectId]);
  const [envelope, setEnvelope] = useState<ProjectEnvelope | null>(initial);
  const baseSite = initial?.building.site;
  const [site, setSite] = useState<Site | null>(() => baseSite ? ({
    ...baseSite,
    plannedFloorCount: baseSite.plannedFloorCount ?? Math.max(1, initial?.building.floors.length ?? 1),
    roadWidth: baseSite.roadWidth ?? 9000,
    cornerPlot: baseSite.cornerPlot ?? false,
    unitSystem: baseSite.unitSystem ?? 'imperial',
    developmentControls: baseSite.developmentControls ?? {
      permissibleFsi: { provenance: 'NOT_CONFIGURED' },
      maxCoveragePercent: { provenance: 'NOT_CONFIGURED' },
      maxHeight: { provenance: 'NOT_CONFIGURED' },
    },
  }) : null);
  const [category, setCategory] = useState<BuildingCategory>(initial?.category ?? 'residential');
  const [saved, setSaved] = useState(true);
  const [pendingSave, setPendingSave] = useState(false);
  const [continueAfterSave, setContinueAfterSave] = useState(false);

  if (!envelope || !site) {
    return <main className="site-missing"><h1>Project unavailable</h1><button className="btn-primary" onClick={onBack}>Back to projects</button></main>;
  }

  const unit = site.unitSystem ?? 'metric';
  const lengthUnit = unit === 'imperial' ? 'ft' : 'm';
  const nextSite = (change: Partial<Site>) => { setSite(current => current ? { ...current, ...change } : current); setSaved(false); };
  const setLength = (field: 'plotWidth' | 'plotDepth' | 'roadWidth', raw: string) => {
    const value = fromDisplay(Number(raw), unit);
    nextSite({
      [field]: value,
      ...(field === 'plotWidth' || field === 'plotDepth' ? {
        plotArea: (field === 'plotWidth' ? value : site.plotWidth) * (field === 'plotDepth' ? value : site.plotDepth),
        plotBoundary: rectToPolygon(0, 0, field === 'plotWidth' ? value : site.plotWidth, field === 'plotDepth' ? value : site.plotDepth),
      } : {}),
    });
  };
  const setSetback = (field: keyof Site['setbacks'], raw: string) => nextSite({ setbacks: { ...site.setbacks, [field]: fromDisplay(Number(raw), unit) } });
  const metrics = calculateSiteMetrics({ ...envelope.building, site });
  const findings = validateSite(site);
  const hasInvalid = findings.some(finding => finding.status === 'INVALID');
  const hasGeometry = envelope.building.floors.some(floor => floor.rooms.length || floor.walls.length || floor.boundary.points.length >= 3);
  const geometryChanged = site.plotWidth !== envelope.building.site.plotWidth || site.plotDepth !== envelope.building.site.plotDepth
    || JSON.stringify(site.setbacks) !== JSON.stringify(envelope.building.site.setbacks);

  const commit = () => {
    const building = updateBuildingSite(envelope.building, site);
    const updated = { ...envelope, schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION, category, building, generationSession: null, updatedAt: building.updatedAt };
    projectStorage.save(updated);
    setEnvelope(updated);
    setSaved(true);
    setPendingSave(false);
    setContinueAfterSave(false);
  };
  const requestSave = () => {
    if (hasInvalid) return;
    setContinueAfterSave(false);
    if (hasGeometry && geometryChanged) setPendingSave(true);
    else commit();
  };
  const continueToProgram = () => {
    if (hasInvalid) return;
    if (saved) {
      onOpenProgram();
      return;
    }
    if (hasGeometry && geometryChanged) {
      setContinueAfterSave(true);
      setPendingSave(true);
      return;
    }
    commit();
    onOpenProgram();
  };
  const updateControl = (key: keyof SiteDevelopmentControls, raw: string) => {
    const controls = site.developmentControls!;
    if (raw === '') {
      nextSite({ developmentControls: { ...controls, [key]: { provenance: 'NOT_CONFIGURED' } } });
      return;
    }
    const numeric = Number(raw);
    nextSite({ developmentControls: { ...controls, [key]: { value: key === 'maxHeight' ? numeric * 1000 : numeric, provenance: 'USER_PROVIDED' } } });
  };

  return (
    <div className="site-workspace">
      <header className="site-header">
        <button className="btn-icon" onClick={onBack} aria-label="Back to projects"><ArrowLeft size={17} /></button>
        <div className="site-brand"><Map size={18} /><div><strong>FORMA</strong><small>SITE INTELLIGENCE</small></div></div>
        <nav className="site-stage-nav" aria-label="Project workflow">
          {['PROJECT', 'SITE', 'PROGRAM', 'FOOTPRINT', 'GENERATE'].map((stage, index) => <React.Fragment key={stage}><span className={stage === 'SITE' ? 'active' : index > 1 ? 'future' : ''}>{stage}</span>{index < 4 && <ChevronRight size={13} />}</React.Fragment>)}
        </nav>
        <span className="site-save-state"><HardDrive size={14} /> {saved ? 'Saved locally' : 'Unsaved changes'}</span>
      </header>

      <main className="site-main">
        <section className="site-title">
          <div><span className="eyebrow">Project / Site</span><h1>{envelope.name}</h1><p>Define the physical plot and record only the controls you actually know.</p></div>
          <div className="site-actions"><button className="btn-secondary" onClick={onOpenEditor}>Open design editor</button><button className="btn-primary" onClick={requestSave} disabled={hasInvalid || saved}>Save site</button></div>
        </section>

        <div className="site-layout">
          <aside className="site-form">
            <section><h2>Project baseline</h2><label>Building category<select value={category} onChange={e => { setCategory(e.target.value as BuildingCategory); setSaved(false); }}>{BUILDING_CATEGORIES.map(value => <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>)}</select></label>
              <div className="site-field-row"><label>Planned levels<select value={site.plannedFloorCount} onChange={e => nextSite({ plannedFloorCount: Number(e.target.value) })}>{Array.from({ length: BUILDING_CAPABILITIES.maximumFloorCount }, (_, i) => i + 1).map(value => <option key={value} value={value}>{formatBuildingFloorCount(value)}</option>)}</select></label><label>Units<select value={unit} onChange={e => nextSite({ unitSystem: e.target.value as SiteUnitSystem })}><option value="imperial">Imperial</option><option value="metric">Metric</option></select></label></div>
            </section>
            <section><h2>Plot geometry</h2><label>Plot shape<select value={site.plotShape} disabled><option value={PlotShape.Rectangular}>Rectangular</option></select><small>Custom polygons are preserved when imported, but editing them is not yet safely supported.</small></label>
              <div className="site-field-row"><label>Width ({lengthUnit})<input type="number" min="0" step=".1" value={toDisplay(site.plotWidth, unit)} onChange={e => setLength('plotWidth', e.target.value)} /></label><label>Depth ({lengthUnit})<input type="number" min="0" step=".1" value={toDisplay(site.plotDepth, unit)} onChange={e => setLength('plotDepth', e.target.value)} /></label></div>
            </section>
            <section><h2>Orientation & access</h2><div className="site-field-row"><label>North direction<select value={site.orientation} onChange={e => nextSite({ orientation: Number(e.target.value) })}><option value="0">North</option><option value="90">East</option><option value="180">South</option><option value="270">West</option></select></label><label>Primary road side<select value={site.roadFacing} onChange={e => nextSite({ roadFacing: e.target.value as Direction })}>{DIRECTIONS.map(value => <option key={value} value={value}>{directionLabel(value)}</option>)}</select></label></div>
              <label>Road width ({lengthUnit})<input type="number" min="0" step=".1" value={toDisplay(site.roadWidth ?? 0, unit)} onChange={e => setLength('roadWidth', e.target.value)} /></label>
              <label className="site-check"><input type="checkbox" checked={site.cornerPlot} onChange={e => nextSite({ cornerPlot: e.target.checked, secondaryRoadFacing: e.target.checked ? (site.roadFacing === Direction.North || site.roadFacing === Direction.South ? Direction.East : Direction.North) : undefined })} />Corner / two-road plot</label>
              {site.cornerPlot && <label>Secondary road side<select value={site.secondaryRoadFacing} onChange={e => nextSite({ secondaryRoadFacing: e.target.value as Direction })}>{DIRECTIONS.map(value => <option key={value} value={value}>{directionLabel(value)}</option>)}</select></label>}
            </section>
            <section><h2>Setbacks</h2><div className="site-setback-grid">{(['front', 'rear', 'left', 'right'] as const).map(key => <label key={key}>{key.charAt(0).toUpperCase() + key.slice(1)} ({lengthUnit})<input type="number" min="0" step=".1" value={toDisplay(site.setbacks[key], unit)} onChange={e => setSetback(key, e.target.value)} /></label>)}</div></section>
            <section><h2>Development controls</h2><p className="site-section-note">Optional and never inferred. Enter only values supplied by you or an authority.</p>{CONTROL_LABELS.map(([key, label, suffix]) => { const control = site.developmentControls![key]; return <label key={key}>{label} ({suffix})<input type="number" min="0" step=".1" placeholder="Not configured" value={control.value === undefined ? '' : key === 'maxHeight' ? control.value / 1000 : control.value} onChange={e => updateControl(key, e.target.value)} /><small className={control.provenance === 'USER_PROVIDED' ? 'provided' : ''}>{control.provenance.replace('_', ' ')}</small></label>; })}</section>
          </aside>

          <section className="site-canvas-panel"><div className="site-panel-heading"><div><span className="eyebrow">Live geometry</span><h2>Plot & buildable envelope</h2></div><span>Rectangular model</span></div><SiteCanvas site={site} /></section>

          <aside className="site-intelligence">
            <section><h2>Deterministic metrics</h2><div className="site-metrics"><article><span>Plot area</span><strong>{areaLabel(metrics.plotArea, unit)}</strong></article><article><span>Buildable envelope</span><strong>{areaLabel(metrics.buildableEnvelopeArea, unit)}</strong></article><article><span>Permissible floor area</span><strong>{metrics.permissibleFloorArea === undefined ? 'NOT CONFIGURED' : areaLabel(metrics.permissibleFloorArea, unit)}</strong></article><article><span>Used FSI</span><strong>{metrics.usedFsi === undefined ? 'NOT CHECKED' : metrics.usedFsi.toFixed(2)}</strong></article><article><span>Ground coverage</span><strong>{metrics.groundCoveragePercent === undefined ? 'NOT CHECKED' : metrics.groundCoveragePercent.toFixed(1) + '%'}</strong></article></div></section>
            <section><h2>Site checks</h2><div className="site-findings">{findings.map((finding, index) => <article key={finding.field + index} className={'finding-' + finding.status.toLowerCase()}>{finding.status === 'VALID' ? <CheckCircle2 size={15} /> : <TriangleAlert size={15} />}<div><strong>{finding.status} · {finding.field}</strong><p>{finding.message}</p></div></article>)}</div></section>
            <section className="site-trust-note"><ShieldAlert size={18} /><div><strong>Regulatory status: NOT CHECKED</strong><p>No jurisdiction or code database is configured. User entries are planning inputs, not compliance approval.</p></div></section>
            <button className="site-program-disabled program-ready" onClick={continueToProgram} disabled={hasInvalid}><Building2 size={16} /><span><strong>Continue to Program</strong><small>Build the structured design brief</small></span></button>
          </aside>
        </div>
      </main>

      {pendingSave && <div className="site-confirm-backdrop" role="presentation"><section className="site-confirm" role="dialog" aria-modal="true" aria-labelledby="site-confirm-title"><TriangleAlert size={24} /><h2 id="site-confirm-title">Existing design may need review</h2><p>Plot dimensions or setbacks changed while this project already contains design geometry. Saving preserves every room, wall and floor; it does not move or delete them. Existing geometry may now sit outside the new envelope.</p><div><button className="btn-secondary" onClick={() => { setPendingSave(false); setContinueAfterSave(false); }}>Cancel</button><button className="btn-primary" onClick={() => { const shouldContinue = continueAfterSave; commit(); if (shouldContinue) onOpenProgram(); }}>Save and preserve design</button></div></section></div>}
    </div>
  );
};
