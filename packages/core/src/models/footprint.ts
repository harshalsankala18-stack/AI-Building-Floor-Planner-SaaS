import type {
  Building, Floor, FootprintEnvelope, FootprintIntent, FootprintMetrics, FootprintParameters,
  FootprintShapeDefinition, FootprintShapeType, FootprintValidationIssue,
  FootprintValidationResult, Point, Polygon, SpaceProgram,
} from '../types';
import { createFloor } from './factory';
import { calculateSiteMetrics, polygonArea, resolveCardinalSetbacks } from './site-intelligence';

const CIRCULATION_RATIO = 0.12;
const CORE_RATIO = 0.04;
const WALL_SERVICE_RATIO = 0.06;
const USABLE_RATIO = 1 - CIRCULATION_RATIO - CORE_RATIO - WALL_SERVICE_RATIO;

export const FOOTPRINT_SHAPES: readonly FootprintShapeDefinition[] = Object.freeze([
  { id: 'rectangle', name: 'Rectangle', description: 'Efficient universal floor plate', recommendedCategories: ['residential', 'commercial', 'mixed_use'] },
  { id: 'l_shape', name: 'L Shape', description: 'Two wings around an open edge', recommendedCategories: ['residential', 'commercial', 'educational', 'mixed_use'] },
  { id: 'u_shape', name: 'U Shape', description: 'Three-sided court or arrival space', recommendedCategories: ['educational', 'commercial'] },
  { id: 't_shape', name: 'T Shape', description: 'Primary bar with a central wing', recommendedCategories: ['educational', 'commercial'] },
  { id: 'courtyard', name: 'Courtyard', description: 'Limited perimeter plate with an access slot; not polygon-hole topology', recommendedCategories: ['residential', 'commercial', 'educational'], customSupport: 'limited' },
  { id: 'linear', name: 'Linear', description: 'Shallow elongated building plate', recommendedCategories: ['commercial', 'educational'] },
  { id: 'custom', name: 'Custom', description: 'Preserved existing or imported polygon', recommendedCategories: [], customSupport: 'limited' },
]);

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function getFootprintEnvelope(building: Building): FootprintEnvelope {
  const site = building.site;
  const cardinal = resolveCardinalSetbacks(site.setbacks, site.roadFacing);
  const x = cardinal.west;
  const y = cardinal.north;
  const width = Math.max(0, site.plotWidth - cardinal.west - cardinal.east);
  const depth = Math.max(0, site.plotDepth - cardinal.north - cardinal.south);
  return { x, y, width, depth, polygon: { points: [{ x, y }, { x: x + width, y }, { x: x + width, y: y + depth }, { x, y: y + depth }] } };
}

function defaultParameters(envelope: FootprintEnvelope): FootprintParameters {
  const width = Math.max(2_000, envelope.width * 0.76);
  const depth = Math.max(2_000, envelope.depth * 0.72);
  return {
    width, depth,
    wingWidth: width * 0.4,
    wingDepth: depth * 0.4,
    stemWidth: width * 0.38,
    barDepth: depth * 0.35,
    courtyardWidth: width * 0.38,
    courtyardDepth: depth * 0.42,
  };
}

export function createDefaultFootprintIntent(building: Building): FootprintIntent {
  const envelope = getFootprintEnvelope(building);
  const parameters = defaultParameters(envelope);
  return {
    schemaVersion: 1,
    shape: 'rectangle',
    parameters,
    transform: {
      x: envelope.x + (envelope.width - parameters.width) / 2,
      y: envelope.y + (envelope.depth - parameters.depth) / 2,
      rotation: 0,
      mirrored: false,
    },
    strategy: 'same_all_levels',
    floorOverrides: [],
    provenance: 'DEFAULT',
    updatedAt: new Date().toISOString(),
  };
}

function basePolygon(shape: FootprintShapeType, p: FootprintParameters, custom?: Polygon): Polygon {
  if (shape === 'custom') return custom ?? { points: [] };
  const w = p.width;
  const d = p.depth;
  if (shape === 'rectangle' || shape === 'linear') return { points: [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: d }, { x: 0, y: d }] };
  const wingW = clamp(p.wingWidth ?? w * 0.4, 500, Math.max(500, w - 500));
  const wingD = clamp(p.wingDepth ?? d * 0.4, 500, Math.max(500, d - 500));
  if (shape === 'l_shape') return { points: [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: wingD }, { x: wingW, y: wingD }, { x: wingW, y: d }, { x: 0, y: d }] };
  if (shape === 'u_shape') return { points: [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: d }, { x: w - wingW, y: d }, { x: w - wingW, y: wingD }, { x: wingW, y: wingD }, { x: wingW, y: d }, { x: 0, y: d }] };
  if (shape === 't_shape') {
    const stem = clamp(p.stemWidth ?? w * 0.38, 500, Math.max(500, w - 500));
    const bar = clamp(p.barDepth ?? d * 0.35, 500, Math.max(500, d - 500));
    const left = (w - stem) / 2;
    return { points: [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: bar }, { x: left + stem, y: bar }, { x: left + stem, y: d }, { x: left, y: d }, { x: left, y: bar }, { x: 0, y: bar }] };
  }
  const courtW = clamp(p.courtyardWidth ?? w * 0.38, 800, Math.max(800, w - 1_600));
  const courtD = clamp(p.courtyardDepth ?? d * 0.42, 800, Math.max(800, d - 1_600));
  const left = (w - courtW) / 2;
  const top = (d - courtD) / 2;
  const slot = Math.min(1_200, courtW * 0.3);
  const center = w / 2;
  return { points: [
    { x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: d }, { x: center + slot / 2, y: d },
    { x: center + slot / 2, y: top + courtD }, { x: left + courtW, y: top + courtD },
    { x: left + courtW, y: top }, { x: left, y: top }, { x: left, y: top + courtD },
    { x: center - slot / 2, y: top + courtD }, { x: center - slot / 2, y: d }, { x: 0, y: d },
  ] };
}

function bounds(polygon: Polygon): { minX: number; minY: number; maxX: number; maxY: number; width: number; depth: number } {
  const xs = polygon.points.map(point => point.x);
  const ys = polygon.points.map(point => point.y);
  const minX = xs.length ? Math.min(...xs) : 0;
  const minY = ys.length ? Math.min(...ys) : 0;
  const maxX = xs.length ? Math.max(...xs) : 0;
  const maxY = ys.length ? Math.max(...ys) : 0;
  return { minX, minY, maxX, maxY, width: maxX - minX, depth: maxY - minY };
}

export function generateFootprintPolygon(intent: FootprintIntent): Polygon {
  const base = basePolygon(intent.shape, intent.parameters, intent.customPolygon);
  if (!base.points.length) return base;
  const width = intent.parameters.width;
  const points = base.points.map(point => ({ x: intent.transform.mirrored ? width - point.x : point.x, y: point.y }));
  const angle = intent.transform.rotation * Math.PI / 180;
  const rotated = points.map(point => ({ x: point.x * Math.cos(angle) - point.y * Math.sin(angle), y: point.x * Math.sin(angle) + point.y * Math.cos(angle) }));
  const box = bounds({ points: rotated });
  return { points: rotated.map(point => ({ x: point.x - box.minX + intent.transform.x, y: point.y - box.minY + intent.transform.y })) };
}

function orientation(a: Point, b: Point, c: Point): number {
  return (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
}

function properIntersection(a: Point, b: Point, c: Point, d: Point): boolean {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  return ((o1 > 0) !== (o2 > 0)) && ((o3 > 0) !== (o4 > 0));
}

function isSimple(polygon: Polygon): boolean {
  const points = polygon.points;
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 2; j < points.length; j += 1) {
      if (i === 0 && j === points.length - 1) continue;
      if (properIntersection(points[i]!, points[(i + 1) % points.length]!, points[j]!, points[(j + 1) % points.length]!)) return false;
    }
  }
  return true;
}

export function validateFootprint(building: Building, intent: FootprintIntent): FootprintValidationResult {
  const issues: FootprintValidationIssue[] = [];
  const p = intent.parameters;
  if (!Number.isFinite(p.width) || p.width <= 0) issues.push({ status: 'INVALID', field: 'width', message: 'Footprint width must be greater than zero.' });
  if (!Number.isFinite(p.depth) || p.depth <= 0) issues.push({ status: 'INVALID', field: 'depth', message: 'Footprint depth must be greater than zero.' });
  if (intent.shape === 'custom' && (!intent.customPolygon || intent.customPolygon.points.length < 3)) issues.push({ status: 'INVALID', field: 'customPolygon', message: 'Custom footprint editing is limited; import or preserve a valid existing polygon.' });
  const polygon = generateFootprintPolygon(intent);
  const unique = new Set(polygon.points.map(point => point.x.toFixed(4) + ':' + point.y.toFixed(4)));
  if (polygon.points.length < 3 || unique.size !== polygon.points.length || polygonArea(polygon) <= 1 || !isSimple(polygon)) issues.push({ status: 'INVALID', field: 'geometry', message: 'Footprint polygon must be simple, nonzero, and free of duplicate vertices.' });
  const envelope = getFootprintEnvelope(building);
  const outside = polygon.points.some(point => point.x < envelope.x - 0.01 || point.y < envelope.y - 0.01 || point.x > envelope.x + envelope.width + 0.01 || point.y > envelope.y + envelope.depth + 0.01);
  if (outside) issues.push({ status: 'INVALID', field: 'containment', message: 'Footprint must remain inside the Site buildable envelope.' });
  const floorCount = building.site.plannedFloorCount ?? Math.max(1, building.floors.length);
  for (const override of intent.floorOverrides) {
    if (!Number.isInteger(override.floorLevel) || override.floorLevel < 0 || override.floorLevel >= floorCount) issues.push({ status: 'INVALID', field: 'floorOverrides', message: 'Floor plate override references an unplanned level.' });
    if (!Number.isFinite(override.scalePercent) || override.scalePercent <= 0 || override.scalePercent > 100) issues.push({ status: 'INVALID', field: 'floorOverrides', message: 'Floor plate scale must be between 1% and 100%.' });
  }
  const status = issues.some(issue => issue.status === 'INVALID') ? 'INVALID' : issues.length ? 'WARNING' : 'VALID';
  return { status, issues, polygon };
}

function scaledPolygon(polygon: Polygon, percent: number): Polygon {
  const box = bounds(polygon);
  const cx = box.minX + box.width / 2;
  const cy = box.minY + box.depth / 2;
  const scale = percent / 100;
  return { points: polygon.points.map(point => ({ x: cx + (point.x - cx) * scale, y: cy + (point.y - cy) * scale })) };
}

export function applyFootprintToBuilding(building: Building, intent: FootprintIntent): Building {
  const validation = validateFootprint(building, intent);
  if (validation.status === 'INVALID' || !validation.polygon) throw new Error(validation.issues[0]?.message ?? 'Invalid footprint.');
  const levelCount = building.site.plannedFloorCount ?? Math.max(1, building.floors.length);
  const byLevel = new Map(building.floors.map(floor => [floor.level, floor]));
  const floors: Floor[] = Array.from({ length: levelCount }, (_, level) => {
    const existing = byLevel.get(level) ?? createFloor({ buildingId: building.id, level, name: level === 0 ? 'Ground Floor' : `Floor ${level}` });
    const scale = intent.strategy === 'custom_per_floor'
      ? intent.floorOverrides.find(item => item.floorLevel === level)?.scalePercent ?? 100
      : 100;
    return { ...existing, boundary: scaledPolygon(validation.polygon!, scale) };
  });
  return { ...building, floors, version: building.version + 1, updatedAt: new Date().toISOString() };
}

export function deriveFootprintIntent(building: Building): FootprintIntent {
  const ground = building.floors.find(floor => floor.level === 0 && floor.boundary.points.length >= 3);
  if (!ground) return createDefaultFootprintIntent(building);
  const box = bounds(ground.boundary);
  const localPolygon = { points: ground.boundary.points.map(point => ({ x: point.x - box.minX, y: point.y - box.minY })) };
  return {
    schemaVersion: 1, shape: 'custom', parameters: { width: box.width, depth: box.depth },
    transform: { x: box.minX, y: box.minY, rotation: 0, mirrored: false },
    strategy: 'custom_per_floor',
    floorOverrides: building.floors.filter(floor => floor.boundary.points.length >= 3).map(floor => ({ floorLevel: floor.level, scalePercent: box.width && box.depth ? Math.round(Math.sqrt(polygonArea(floor.boundary) / polygonArea(ground.boundary)) * 100) : 100 })),
    customPolygon: localPolygon,
    provenance: 'DERIVED_FROM_EXISTING_FLOOR', updatedAt: new Date().toISOString(),
  };
}

export function recenterFootprint(building: Building, intent: FootprintIntent): FootprintIntent {
  const envelope = getFootprintEnvelope(building);
  const polygon = generateFootprintPolygon({ ...intent, transform: { ...intent.transform, x: 0, y: 0 } });
  const box = bounds(polygon);
  return { ...intent, transform: { ...intent.transform, x: envelope.x + (envelope.width - box.width) / 2, y: envelope.y + (envelope.depth - box.depth) / 2 }, provenance: 'USER_DEFINED', updatedAt: new Date().toISOString() };
}

export function snapFootprintToEnvelope(building: Building, intent: FootprintIntent, threshold = 250): FootprintIntent {
  const envelope = getFootprintEnvelope(building);
  const polygon = generateFootprintPolygon(intent);
  const box = bounds(polygon);
  let x = intent.transform.x;
  let y = intent.transform.y;
  if (Math.abs(box.minX - envelope.x) <= threshold) x += envelope.x - box.minX;
  if (Math.abs(box.maxX - (envelope.x + envelope.width)) <= threshold) x += envelope.x + envelope.width - box.maxX;
  if (Math.abs(box.minY - envelope.y) <= threshold) y += envelope.y - box.minY;
  if (Math.abs(box.maxY - (envelope.y + envelope.depth)) <= threshold) y += envelope.y + envelope.depth - box.maxY;
  const grid = 100;
  return { ...intent, transform: { ...intent.transform, x: Math.round(x / grid) * grid, y: Math.round(y / grid) * grid }, updatedAt: new Date().toISOString() };
}

export function autoFitFootprint(building: Building, program: SpaceProgram | undefined, shape: FootprintShapeType): FootprintIntent {
  const envelope = getFootprintEnvelope(building);
  const levels = building.site.plannedFloorCount ?? Math.max(1, building.floors.length);
  const preferred = program?.items.reduce((sum, item) => sum + item.preferredAreaMm2 * item.quantity, 0) ?? 0;
  // Keep a deterministic feasibility margin above the preliminary usable-area
  // estimate. Generation also reserves wall and circulation area per floor;
  // fitting to exactly 100% can otherwise undersize an apparently valid plate.
  const desiredGround = preferred > 0 ? preferred * 1.15 / (levels * USABLE_RATIO) : envelope.width * envelope.depth * 0.58;
  const ratio = shape === 'linear' ? 3 : envelope.width / Math.max(1, envelope.depth);
  let width = Math.sqrt(desiredGround * ratio);
  let depth = width / ratio;
  const shapeFactor = shape === 'rectangle' || shape === 'linear' ? 1 : shape === 'l_shape' ? 0.64 : shape === 't_shape' ? 0.57 : shape === 'u_shape' ? 0.58 : 0.72;
  width /= Math.sqrt(shapeFactor);
  depth /= Math.sqrt(shapeFactor);
  const fit = Math.min(1, envelope.width * 0.94 / width, envelope.depth * 0.94 / depth);
  width = Math.max(2_000, width * fit);
  depth = Math.max(2_000, depth * fit);
  const base = createDefaultFootprintIntent(building);
  const intent: FootprintIntent = { ...base, shape, parameters: { ...base.parameters, width, depth, wingWidth: width * 0.38, wingDepth: depth * 0.38, stemWidth: width * 0.36, barDepth: depth * 0.32, courtyardWidth: width * 0.36, courtyardDepth: depth * 0.4 }, provenance: 'AUTO_FIT', updatedAt: new Date().toISOString() };
  return recenterFootprint(building, intent);
}

export function calculateFootprintMetrics(building: Building, intent: FootprintIntent, program?: SpaceProgram): FootprintMetrics {
  const polygon = generateFootprintPolygon(intent);
  const groundArea = polygonArea(polygon);
  const siteMetrics = calculateSiteMetrics(building);
  const levels = building.site.plannedFloorCount ?? Math.max(1, building.floors.length);
  const floorPlateAreas = Array.from({ length: levels }, (_, level) => {
    const scale = intent.strategy === 'custom_per_floor' ? intent.floorOverrides.find(item => item.floorLevel === level)?.scalePercent ?? 100 : 100;
    return groundArea * Math.pow(scale / 100, 2);
  });
  const rawFloorArea = floorPlateAreas.reduce((sum, area) => sum + area, 0);
  const effective = siteMetrics.permissibleFloorArea === undefined ? rawFloorArea : Math.min(rawFloorArea, siteMetrics.permissibleFloorArea);
  const usable = effective * USABLE_RATIO;
  const minimum = program?.items.reduce((sum, item) => sum + item.minimumAreaMm2 * item.quantity, 0) ?? 0;
  const preferred = program?.items.reduce((sum, item) => sum + item.preferredAreaMm2 * item.quantity, 0) ?? 0;
  let programFit: FootprintMetrics['programFit'] = 'NOT_CONFIGURED';
  if (program?.items.length) {
    if (minimum > usable) programFit = 'TOO_SMALL';
    else if (preferred > usable * 0.85) programFit = 'TIGHT';
    else if (preferred > 0 && usable > preferred * 1.8) programFit = 'EXCESS';
    else programFit = 'COMFORTABLE';
  }
  const maxCoverage = building.site.developmentControls?.maxCoveragePercent.value;
  const coverage = siteMetrics.plotArea > 0 ? groundArea / siteMetrics.plotArea * 100 : 0;
  return {
    footprintAreaMm2: groundArea, buildableEnvelopeAreaMm2: siteMetrics.buildableEnvelopeArea,
    plotAreaMm2: siteMetrics.plotArea, plotCoveragePercent: coverage,
    maximumCoveragePercent: maxCoverage,
    coverageWithinUserLimit: maxCoverage === undefined ? undefined : coverage <= maxCoverage,
    plannedLevels: levels, preliminaryFloorAreaMm2: rawFloorArea,
    fsiLimitedFloorAreaMm2: siteMetrics.permissibleFloorArea,
    effectivePreliminaryFloorAreaMm2: effective,
    circulationReserveMm2: effective * CIRCULATION_RATIO,
    coreReserveMm2: effective * CORE_RATIO,
    wallServiceReserveMm2: effective * WALL_SERVICE_RATIO,
    estimatedUsableAreaMm2: usable,
    programMinimumAreaMm2: minimum, programPreferredAreaMm2: preferred, programFit,
    deficitMm2: minimum > usable ? minimum - usable : undefined,
    floorPlateAreasMm2: floorPlateAreas,
  };
}

export function buildingHasDesignedGeometry(building: Building): boolean {
  return building.floors.some(floor => floor.rooms.length > 0 || floor.walls.length > 0 || floor.doors.length > 0 || floor.windows.length > 0 || floor.stairs.length > 0 || floor.columns.length > 0);
}
