import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Building2, CheckCircle2, ChevronRight, Crosshair, FlipHorizontal2,
  Layers3, Map, Maximize2, Move, Redo2, RefreshCw, RotateCw, Ruler, Save,
  TriangleAlert, Undo2,
} from 'lucide-react';
import {
  FOOTPRINT_SHAPES, applyFootprintToBuilding, autoFitFootprint, buildingHasDesignedGeometry,
  calculateFootprintMetrics, createDefaultFootprintIntent, generateFootprintPolygon,
  getFootprintEnvelope, recenterFootprint, snapFootprintToEnvelope, validateFootprint,
  type FootprintIntent, type FootprintShapeType, type Polygon,
} from '@ai-floor-planner/core';
import { CURRENT_PROJECT_SCHEMA_VERSION, projectStorage, type ProjectEnvelope } from '../../services/storage';

interface FootprintWorkspaceProps {
  projectId: string;
  onBackToProgram: () => void;
  onBackToSite: () => void;
  onBackToProjects: () => void;
  onOpenGenerate: () => void;
}

const THUMBNAILS: Record<FootprintShapeType, string> = {
  rectangle: 'M5 7H35V29H5Z',
  l_shape: 'M5 6H35V15H17V30H5Z',
  u_shape: 'M5 6H13V23H27V6H35V31H5Z',
  t_shape: 'M4 6H36V15H25V31H15V15H4Z',
  courtyard: 'M4 5H36V31H24V24H29V12H11V24H17V31H4Z',
  linear: 'M3 12H37V24H3Z',
  custom: 'M5 19L12 6L34 10L37 25L23 32L8 28Z',
};

function unitDivisor(unit: 'metric' | 'imperial'): number { return unit === 'imperial' ? 304.8 : 1_000; }
function areaDivisor(unit: 'metric' | 'imperial'): number { return unit === 'imperial' ? 304.8 * 304.8 : 1_000_000; }
function displayLength(value: number, unit: 'metric' | 'imperial'): number { return Number((value / unitDivisor(unit)).toFixed(2)); }
function parseLength(value: string, unit: 'metric' | 'imperial'): number { return Number(value) * unitDivisor(unit); }
function areaText(value: number, unit: 'metric' | 'imperial'): string { return (value / areaDivisor(unit)).toLocaleString(undefined, { maximumFractionDigits: 1 }) + (unit === 'imperial' ? ' ft²' : ' m²'); }
function lengthText(value: number, unit: 'metric' | 'imperial'): string { return displayLength(value, unit).toLocaleString() + (unit === 'imperial' ? ' ft' : ' m'); }
function floorName(level: number): string { return level === 0 ? 'Ground' : level === 1 ? 'First' : level === 2 ? 'Second' : `Floor ${level}`; }
function titleCase(value: string): string { return value.replaceAll('_', ' ').replace(/\b\w/g, character => character.toUpperCase()); }

function polygonPoints(polygon: Polygon): string { return polygon.points.map(point => `${point.x},${point.y}`).join(' '); }
function scaledForFloor(polygon: Polygon, percent: number): Polygon {
  const xs = polygon.points.map(point => point.x);
  const ys = polygon.points.map(point => point.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const scale = percent / 100;
  return { points: polygon.points.map(point => ({ x: cx + (point.x - cx) * scale, y: cy + (point.y - cy) * scale })) };
}

export const FootprintWorkspace: React.FC<FootprintWorkspaceProps> = ({ projectId, onBackToProgram, onBackToSite, onBackToProjects, onOpenGenerate }) => {
  const initial = useMemo(() => projectStorage.load(projectId), [projectId]);
  const initialIntent = initial?.footprintIntent ?? (initial ? createDefaultFootprintIntent(initial.building) : null);
  const [envelope, setEnvelope] = useState<ProjectEnvelope | null>(initial);
  const [intent, setIntent] = useState<FootprintIntent | null>(initialIntent);
  const [savedIntent, setSavedIntent] = useState<FootprintIntent | null>(initialIntent);
  const [undoStack, setUndoStack] = useState<FootprintIntent[]>([]);
  const [redoStack, setRedoStack] = useState<FootprintIntent[]>([]);
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const drag = useRef<{ startClientX: number; startClientY: number; original: FootprintIntent } | null>(null);

  if (!envelope || !intent) return <main className="footprint-missing"><h1>Project unavailable</h1><button className="btn-primary" onClick={onBackToProjects}>Back to projects</button></main>;

  const building = envelope.building;
  const category = envelope.category ?? 'residential';
  const program = envelope.spaceProgram;
  const unit = building.site.unitSystem ?? 'metric';
  const unitLabel = unit === 'imperial' ? 'ft' : 'm';
  const floorCount = building.site.plannedFloorCount ?? Math.max(1, building.floors.length);
  const buildable = getFootprintEnvelope(building);
  const validation = validateFootprint(building, intent);
  const metrics = calculateFootprintMetrics(building, intent, program);
  const basePolygon = validation.polygon ?? generateFootprintPolygon(intent);
  const activeScale = intent.strategy === 'custom_per_floor' ? intent.floorOverrides.find(item => item.floorLevel === selectedFloor)?.scalePercent ?? 100 : 100;
  const activePolygon = scaledForFloor(basePolygon, activeScale);
  const hasDesign = buildingHasDesignedGeometry(building);
  const isSaved = JSON.stringify(intent) === JSON.stringify(savedIntent);
  const shapeDefinition = FOOTPRINT_SHAPES.find(shape => shape.id === intent.shape)!;
  const recommended = new Set(FOOTPRINT_SHAPES.filter(shape => shape.recommendedCategories.includes(category)).map(shape => shape.id));
  const maxCoverageExceeded = metrics.coverageWithinUserLimit === false;

  const commitIntent = (next: FootprintIntent) => {
    setUndoStack(stack => [...stack, intent]);
    setRedoStack([]);
    setIntent({ ...next, provenance: next.provenance === 'AUTO_FIT' ? 'AUTO_FIT' : 'USER_DEFINED', updatedAt: new Date().toISOString() });
  };
  const updateParameters = (changes: Partial<FootprintIntent['parameters']>) => commitIntent({ ...intent, parameters: { ...intent.parameters, ...changes } });
  const selectShape = (shape: FootprintShapeType) => {
    if (shape === 'custom' && !intent.customPolygon) return;
    commitIntent(shape === 'custom' ? { ...intent, shape } : autoFitFootprint(building, program, shape));
  };
  const undo = () => {
    const previous = undoStack.at(-1);
    if (!previous) return;
    setUndoStack(stack => stack.slice(0, -1));
    setRedoStack(stack => [...stack, intent]);
    setIntent(previous);
  };
  const redo = () => {
    const next = redoStack.at(-1);
    if (!next) return;
    setRedoStack(stack => stack.slice(0, -1));
    setUndoStack(stack => [...stack, intent]);
    setIntent(next);
  };
  const persist = () => {
    if (validation.status === 'INVALID') return;
    if (hasDesign && JSON.stringify(intent) !== JSON.stringify(savedIntent)) {
      setConfirmOpen(true);
      return;
    }
    applyAndSave();
  };
  const applyAndSave = () => {
    const updatedBuilding = applyFootprintToBuilding(building, intent);
    const updated: ProjectEnvelope = { ...envelope, schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION, footprintIntent: intent, building: updatedBuilding, generationSession: null, updatedAt: updatedBuilding.updatedAt };
    projectStorage.save(updated);
    setEnvelope(updated);
    setSavedIntent(intent);
    setConfirmOpen(false);
  };
  const setFloorScale = (floorLevel: number, scalePercent: number) => {
    const floorOverrides = [...intent.floorOverrides.filter(item => item.floorLevel !== floorLevel), { floorLevel, scalePercent }].sort((a, b) => a.floorLevel - b.floorLevel);
    commitIntent({ ...intent, floorOverrides });
  };
  const pointerDown = (event: React.PointerEvent<SVGPolygonElement>) => {
    drag.current = { startClientX: event.clientX, startClientY: event.clientY, original: intent };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: React.PointerEvent<SVGPolygonElement>) => {
    if (!drag.current) return;
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const dx = (event.clientX - drag.current.startClientX) * building.site.plotWidth / rect.width;
    const dy = (event.clientY - drag.current.startClientY) * building.site.plotDepth / rect.height;
    setIntent({ ...drag.current.original, transform: { ...drag.current.original.transform, x: drag.current.original.transform.x + dx, y: drag.current.original.transform.y + dy }, updatedAt: new Date().toISOString() });
  };
  const pointerUp = () => {
    if (!drag.current) return;
    const original = drag.current.original;
    drag.current = null;
    const snapped = snapFootprintToEnvelope(building, intent);
    setUndoStack(stack => [...stack, original]);
    setRedoStack([]);
    setIntent({ ...snapped, provenance: 'USER_DEFINED' });
  };

  const roadWidth = Math.max(600, Math.min(1_600, (building.site.roadWidth ?? 6_000) * 0.12));
  const roadFor = (facing: string) => facing === 'north' ? { x: 0, y: -roadWidth, width: building.site.plotWidth, height: roadWidth }
    : facing === 'south' ? { x: 0, y: building.site.plotDepth, width: building.site.plotWidth, height: roadWidth }
      : facing === 'east' ? { x: building.site.plotWidth, y: 0, width: roadWidth, height: building.site.plotDepth }
        : { x: -roadWidth, y: 0, width: roadWidth, height: building.site.plotDepth };
  const road = roadFor(building.site.roadFacing);
  const secondaryRoad = building.site.cornerPlot && building.site.secondaryRoadFacing ? roadFor(building.site.secondaryRoadFacing) : undefined;
  const edgeLabels = building.site.roadFacing === 'north'
    ? { top: 'FRONT', bottom: 'BACK', left: 'LEFT', right: 'RIGHT' }
    : building.site.roadFacing === 'south'
      ? { top: 'BACK', bottom: 'FRONT', left: 'RIGHT', right: 'LEFT' }
      : building.site.roadFacing === 'east'
        ? { top: 'LEFT', bottom: 'RIGHT', left: 'BACK', right: 'FRONT' }
        : { top: 'RIGHT', bottom: 'LEFT', left: 'FRONT', right: 'BACK' };

  return <div className="footprint-workspace">
    <header className="footprint-header">
      <button className="btn-icon" aria-label="Back to projects" onClick={onBackToProjects}><ArrowLeft size={17} /></button>
      <div className="footprint-brand"><Building2 size={18} /><div><strong>FORMA</strong><small>BUILDING FOOTPRINT</small></div></div>
      <nav className="footprint-stage-nav" aria-label="Project workflow">{['PROJECT', 'SITE', 'PROGRAM', 'FOOTPRINT', 'GENERATE'].map((stage, index) => <React.Fragment key={stage}><button className={stage === 'FOOTPRINT' ? 'active' : index > 3 ? 'future' : ''} disabled={!['SITE', 'PROGRAM', 'FOOTPRINT'].includes(stage)} onClick={stage === 'SITE' ? onBackToSite : stage === 'PROGRAM' ? onBackToProgram : undefined}>{stage}</button>{index < 4 && <ChevronRight size={13} />}</React.Fragment>)}</nav>
      <span className="footprint-save-state">{isSaved ? 'Saved locally' : 'Unsaved footprint'}</span>
    </header>

    <main className="footprint-main">
      <section className="footprint-title"><div><span className="eyebrow">Project / Footprint</span><h1>{envelope.name}</h1><p>Define the physical floor plate inside the Site envelope. Rooms are not generated here.</p></div><div className="footprint-title-actions"><button className="btn-secondary" onClick={onBackToProgram}>Back to Program</button><button className="btn-primary" disabled={validation.status === 'INVALID' || isSaved} onClick={persist}><Save size={14} /> Save footprint</button></div></section>

      <div className="footprint-layout">
        <aside className="footprint-controls">
          <section><div className="footprint-section-heading"><div><span className="eyebrow">Parametric library</span><h2>Shape</h2></div><span>{titleCase(category)}</span></div><div className="footprint-shapes">{FOOTPRINT_SHAPES.map(shape => <button key={shape.id} aria-label={`Select ${shape.name}`} className={intent.shape === shape.id ? 'active' : ''} disabled={shape.id === 'custom' && !intent.customPolygon} onClick={() => selectShape(shape.id)}><svg viewBox="0 0 40 36" aria-hidden="true"><path d={THUMBNAILS[shape.id]} /></svg><span><strong>{shape.name}</strong><small>{shape.customSupport === 'limited' ? 'Limited' : recommended.has(shape.id) ? 'Recommended' : 'Available'}</small></span></button>)}</div></section>
          <section><div className="footprint-section-heading"><div><span className="eyebrow">Exact geometry</span><h2>Dimensions</h2></div><Ruler size={16} /></div><div className="footprint-fields"><label>Width ({unitLabel})<input aria-label={`Footprint width (${unitLabel})`} type="number" min="0" step=".1" value={displayLength(intent.parameters.width, unit)} disabled={intent.shape === 'custom'} onChange={event => updateParameters({ width: parseLength(event.target.value, unit) })} /></label><label>Depth ({unitLabel})<input aria-label={`Footprint depth (${unitLabel})`} type="number" min="0" step=".1" value={displayLength(intent.parameters.depth, unit)} disabled={intent.shape === 'custom'} onChange={event => updateParameters({ depth: parseLength(event.target.value, unit) })} /></label>{['l_shape', 'u_shape'].includes(intent.shape) && <><label>Wing width ({unitLabel})<input aria-label="Wing width" type="number" value={displayLength(intent.parameters.wingWidth ?? 0, unit)} onChange={event => updateParameters({ wingWidth: parseLength(event.target.value, unit) })} /></label><label>Wing depth ({unitLabel})<input aria-label="Wing depth" type="number" value={displayLength(intent.parameters.wingDepth ?? 0, unit)} onChange={event => updateParameters({ wingDepth: parseLength(event.target.value, unit) })} /></label></>}{intent.shape === 't_shape' && <><label>Stem width ({unitLabel})<input aria-label="Stem width" type="number" value={displayLength(intent.parameters.stemWidth ?? 0, unit)} onChange={event => updateParameters({ stemWidth: parseLength(event.target.value, unit) })} /></label><label>Bar depth ({unitLabel})<input aria-label="Bar depth" type="number" value={displayLength(intent.parameters.barDepth ?? 0, unit)} onChange={event => updateParameters({ barDepth: parseLength(event.target.value, unit) })} /></label></>}{intent.shape === 'courtyard' && <><label>Court width ({unitLabel})<input aria-label="Courtyard width" type="number" value={displayLength(intent.parameters.courtyardWidth ?? 0, unit)} onChange={event => updateParameters({ courtyardWidth: parseLength(event.target.value, unit) })} /></label><label>Court depth ({unitLabel})<input aria-label="Courtyard depth" type="number" value={displayLength(intent.parameters.courtyardDepth ?? 0, unit)} onChange={event => updateParameters({ courtyardDepth: parseLength(event.target.value, unit) })} /></label></>}</div><p className="footprint-help">Canonical storage remains millimetres. Complex shapes expose stable parameters rather than arbitrary vertex handles.</p></section>
          <section><div className="footprint-section-heading"><div><span className="eyebrow">Reversible actions</span><h2>Transform</h2></div><Move size={16} /></div><div className="footprint-tool-grid"><button onClick={undo} disabled={!undoStack.length}><Undo2 size={14} /> Undo</button><button onClick={redo} disabled={!redoStack.length}><Redo2 size={14} /> Redo</button><button onClick={() => commitIntent({ ...intent, transform: { ...intent.transform, mirrored: !intent.transform.mirrored } })}><FlipHorizontal2 size={14} /> Mirror</button><button onClick={() => commitIntent(recenterFootprint(building, { ...intent, transform: { ...intent.transform, rotation: ((intent.transform.rotation + 90) % 360) as 0 | 90 | 180 | 270 } }))}><RotateCw size={14} /> Rotate</button><button onClick={() => commitIntent(recenterFootprint(building, intent))}><Crosshair size={14} /> Recenter</button><button onClick={() => commitIntent(autoFitFootprint(building, program, intent.shape === 'custom' ? 'rectangle' : intent.shape))}><Maximize2 size={14} /> Auto Fit</button><button className="full" onClick={() => commitIntent(createDefaultFootprintIntent(building))}><RefreshCw size={14} /> Reset footprint</button></div></section>
          <section><div className="footprint-section-heading"><div><span className="eyebrow">Multi-floor</span><h2>Floor plate strategy</h2></div><Layers3 size={16} /></div><label className="footprint-select">Strategy<select aria-label="Floor plate strategy" value={intent.strategy} onChange={event => commitIntent({ ...intent, strategy: event.target.value as FootprintIntent['strategy'] })}><option value="same_all_levels">SAME FOOTPRINT ALL LEVELS</option><option value="custom_per_floor">CUSTOM PER FLOOR</option></select></label><label className="footprint-select">Core intent<select aria-label="Vertical core zone" value={intent.coreAnchor ?? ''} onChange={event => commitIntent({ ...intent, coreAnchor: (event.target.value || undefined) as FootprintIntent['coreAnchor'] })}><option value="">NOT CONFIGURED</option><option value="center">CENTER</option><option value="front">FRONT</option><option value="rear">REAR</option><option value="left">LEFT</option><option value="right">RIGHT</option></select></label>{intent.strategy === 'custom_per_floor' && <div className="floor-scales">{Array.from({ length: floorCount }, (_, level) => { const value = intent.floorOverrides.find(item => item.floorLevel === level)?.scalePercent ?? 100; return <label key={level}>{floorName(level)} <input className="plate-scale-number" aria-label={`${floorName(level)} floor plate percentage`} type="number" min="35" max="100" step="5" value={value} onChange={event => setFloorScale(level, Number(event.target.value))} /><input aria-label={`${floorName(level)} floor plate scale`} type="range" min="35" max="100" step="5" value={value} onChange={event => setFloorScale(level, Number(event.target.value))} /></label>; })}</div>}</section>
        </aside>

        <section className="footprint-canvas-panel">
          <div className="footprint-canvas-toolbar"><div><span className="eyebrow">Site + proposed plate</span><h2>{shapeDefinition.name}</h2></div><div><button aria-label="Undo footprint change" onClick={undo} disabled={!undoStack.length}><Undo2 size={15} /></button><button aria-label="Redo footprint change" onClick={redo} disabled={!redoStack.length}><Redo2 size={15} /></button><span>Drag footprint to move · 100 mm grid snap</span></div></div>
          <div className="footprint-canvas-wrap"><svg className="footprint-canvas" viewBox={`${-roadWidth - 800} ${-roadWidth - 800} ${building.site.plotWidth + roadWidth * 2 + 1600} ${building.site.plotDepth + roadWidth * 2 + 1600}`} role="img" aria-label="Interactive Site and building footprint"><defs><pattern id="fp-grid" width="1000" height="1000" patternUnits="userSpaceOnUse"><path d="M1000 0H0V1000" className="fp-grid-line" /></pattern></defs><rect x={-roadWidth - 800} y={-roadWidth - 800} width={building.site.plotWidth + roadWidth * 2 + 1600} height={building.site.plotDepth + roadWidth * 2 + 1600} fill="url(#fp-grid)" /><rect className="fp-road" {...road} /><text className="fp-road-label" x={road.x + road.width / 2} y={road.y + road.height / 2}>PRIMARY ROAD · {lengthText(building.site.roadWidth ?? 0, unit)}</text>{secondaryRoad && <><rect className="fp-road secondary" {...secondaryRoad} /><text className="fp-road-label" x={secondaryRoad.x + secondaryRoad.width / 2} y={secondaryRoad.y + secondaryRoad.height / 2}>SECONDARY ROAD</text></>}<polygon className="fp-plot" points={`0,0 ${building.site.plotWidth},0 ${building.site.plotWidth},${building.site.plotDepth} 0,${building.site.plotDepth}`} /><text className="fp-edge-label" x={building.site.plotWidth / 2} y={260}>{edgeLabels.top}</text><text className="fp-edge-label" x={building.site.plotWidth / 2} y={building.site.plotDepth - 160}>{edgeLabels.bottom}</text><text className="fp-edge-label" transform={`translate(260 ${building.site.plotDepth / 2}) rotate(-90)`}>{edgeLabels.left}</text><text className="fp-edge-label" transform={`translate(${building.site.plotWidth - 260} ${building.site.plotDepth / 2}) rotate(90)`}>{edgeLabels.right}</text><polygon className="fp-envelope" points={polygonPoints(buildable.polygon)} /><polygon className={`fp-building fp-${validation.status.toLowerCase()}`} points={polygonPoints(activePolygon)} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} /><text className="fp-shape-label" x={intent.transform.x + intent.parameters.width / 2} y={intent.transform.y + intent.parameters.depth / 2}>{shapeDefinition.name.toUpperCase()}</text><g className="fp-north" transform={`translate(${building.site.plotWidth - 700} 900) rotate(${building.site.orientation})`}><path d="M0 400V-300M0-300L-140 0M0-300L140 0" /><text y="-430">N</text></g><text className="fp-dimension" x={intent.transform.x + intent.parameters.width / 2} y={intent.transform.y - 260}>{lengthText(intent.parameters.width, unit)}</text><text className="fp-dimension" transform={`translate(${intent.transform.x - 260} ${intent.transform.y + intent.parameters.depth / 2}) rotate(-90)`}>{lengthText(intent.parameters.depth, unit)}</text></svg></div>
          <div className="footprint-floor-nav"><span>BUILDING FOOTPRINTS</span><div>{Array.from({ length: floorCount }, (_, index) => floorCount - 1 - index).map(level => <button key={level} className={selectedFloor === level ? 'active' : ''} onClick={() => setSelectedFloor(level)}><strong>{floorName(level)}</strong><small>{level === 0 ? 'BASE PLATE' : intent.strategy === 'same_all_levels' ? 'INHERITED FROM GROUND' : `${intent.floorOverrides.find(item => item.floorLevel === level)?.scalePercent ?? 100}% OF BASE`}</small></button>)}</div></div>
        </section>

        <aside className="footprint-summary">
          <section><span className="eyebrow">Footprint validity</span><div className={`footprint-state ${validation.status.toLowerCase()}`}>{validation.status === 'INVALID' ? <TriangleAlert size={18} /> : <CheckCircle2 size={18} />}<div><strong>{validation.status}</strong><small>{validation.issues[0]?.message ?? 'Simple polygon contained inside the Site envelope.'}</small></div></div></section>
          <section><h2>Footprint summary</h2><dl><div><dt>Shape</dt><dd>{shapeDefinition.name}</dd></div><div><dt>Active plate</dt><dd>{floorName(selectedFloor)}</dd></div><div><dt>Ground footprint</dt><dd>{areaText(metrics.footprintAreaMm2, unit)}</dd></div><div><dt>Buildable envelope</dt><dd>{areaText(metrics.buildableEnvelopeAreaMm2, unit)}</dd></div><div><dt>Levels</dt><dd>{floorCount === 1 ? 'Ground' : `G+${floorCount - 1}`}</dd></div><div><dt>Preliminary floor area</dt><dd>{areaText(metrics.preliminaryFloorAreaMm2, unit)}</dd></div></dl></section>
          <section><div className="footprint-metric-heading"><div><span className="eyebrow">Plot coverage</span><h2>{metrics.plotCoveragePercent.toFixed(1)}%</h2></div><Map size={17} /></div><div className="footprint-capacity-bar"><span style={{ width: `${Math.min(100, metrics.plotCoveragePercent)}%` }} /></div><dl><div><dt>Plot area</dt><dd>{areaText(metrics.plotAreaMm2, unit)}</dd></div>{metrics.maximumCoveragePercent !== undefined && <div><dt>User-provided maximum</dt><dd>{metrics.maximumCoveragePercent}%</dd></div>}</dl>{maxCoverageExceeded && <div className="footprint-warning"><TriangleAlert size={14} /><span>Exceeds the user-provided coverage input. This is not a regulatory compliance result.</span></div>}</section>
          <section><div className="footprint-metric-heading"><div><span className="eyebrow">Program fit</span><h2>{metrics.programFit.replace('_', ' ')}</h2></div><Building2 size={17} /></div><dl><div><dt>Program minimum</dt><dd>{areaText(metrics.programMinimumAreaMm2, unit)}</dd></div><div><dt>Program preferred</dt><dd>{areaText(metrics.programPreferredAreaMm2, unit)}</dd></div><div><dt>Estimated usable</dt><dd>{areaText(metrics.estimatedUsableAreaMm2, unit)}</dd></div><div><dt>Circulation reserve</dt><dd>{areaText(metrics.circulationReserveMm2, unit)}</dd></div><div><dt>Core reserve</dt><dd>{areaText(metrics.coreReserveMm2, unit)}</dd></div></dl>{metrics.programFit === 'TOO_SMALL' && <div className="footprint-danger"><strong>FOOTPRINT TOO SMALL</strong><p>Deficit {areaText(metrics.deficitMm2 ?? 0, unit)}. Enlarge the footprint, add levels, or review the Program. Requirements were not changed.</p></div>}{metrics.programFit === 'EXCESS' && <div className="footprint-info">Footprint significantly exceeds current Program demand. Extra area may be intentional.</div>}</section>
          <section><span className="eyebrow">Preliminary FSI view</span><dl><div><dt>Selected plates</dt><dd>{areaText(metrics.preliminaryFloorAreaMm2, unit)}</dd></div><div><dt>User-provided limit</dt><dd>{metrics.fsiLimitedFloorAreaMm2 === undefined ? 'NOT CONFIGURED' : areaText(metrics.fsiLimitedFloorAreaMm2, unit)}</dd></div><div><dt>Effective preliminary area</dt><dd>{areaText(metrics.effectivePreliminaryFloorAreaMm2, unit)}</dd></div></dl><p className="footprint-disclaimer">PLANNING COMPLIANCE · NOT CHECKED. User inputs are not verified regulations.</p></section>
          <button className="footprint-generate-action" disabled={validation.status === 'INVALID' || !isSaved} onClick={onOpenGenerate}><span><strong>Continue to Generate</strong><small>Generate verified concept alternatives</small></span><ChevronRight size={16} /></button>
        </aside>
      </div>
    </main>

    {confirmOpen && <div className="footprint-modal-backdrop"><section className="footprint-dialog" role="dialog" aria-modal="true" aria-labelledby="footprint-confirm-title"><TriangleAlert size={24} /><h2 id="footprint-confirm-title">Existing design requires revalidation</h2><p>Applying this footprint changes canonical Floor boundaries. Existing rooms, walls, doors, windows, stairs, and columns will be preserved, but some geometry may become invalid.</p><div><button className="btn-secondary" onClick={() => setConfirmOpen(false)}>Cancel</button><button className="btn-primary" onClick={applyAndSave}>Apply Footprint + Revalidate Existing Design</button></div></section></div>}
  </div>;
};
