import type { Building, Polygon, Setbacks, Site, SiteDevelopmentControls } from '../types';
import { BUILDING_CAPABILITIES } from '../capabilities';
import { Direction, PlotShape } from '../types';

export type SiteValidationStatus = 'VALID' | 'WARNING' | 'INVALID' | 'NOT_CONFIGURED';

export interface SiteValidationFinding {
  readonly status: SiteValidationStatus;
  readonly field: string;
  readonly message: string;
}

export interface SiteMetrics {
  readonly plotArea: number;
  readonly buildableEnvelopeArea: number;
  readonly buildableWidth: number;
  readonly buildableDepth: number;
  readonly permissibleFloorArea?: number;
  readonly usedFloorArea?: number;
  readonly usedFsi?: number;
  readonly groundCoveragePercent?: number;
}

export interface CardinalSetbacks {
  readonly north: number;
  readonly south: number;
  readonly east: number;
  readonly west: number;
}

export const EMPTY_DEVELOPMENT_CONTROLS: SiteDevelopmentControls = {
  permissibleFsi: { provenance: 'NOT_CONFIGURED' },
  maxCoveragePercent: { provenance: 'NOT_CONFIGURED' },
  maxHeight: { provenance: 'NOT_CONFIGURED' },
};

export function polygonArea(polygon: Polygon): number {
  const points = polygon.points;
  if (points.length < 3) return 0;
  let sum = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]!;
    const next = points[(index + 1) % points.length]!;
    sum += current.x * next.y - next.x * current.y;
  }
  return Math.abs(sum) / 2;
}

export function calculateSiteMetrics(building: Building): SiteMetrics {
  const { site } = building;
  const plotArea = site.plotShape === PlotShape.Rectangular
    ? site.plotWidth * site.plotDepth
    : polygonArea(site.plotBoundary);
  const cardinal = resolveCardinalSetbacks(site.setbacks, site.roadFacing);
  const buildableWidth = Math.max(0, site.plotWidth - cardinal.west - cardinal.east);
  const buildableDepth = Math.max(0, site.plotDepth - cardinal.north - cardinal.south);
  const buildableEnvelopeArea = site.plotShape === PlotShape.Rectangular ? buildableWidth * buildableDepth : 0;
  const fsi = site.developmentControls?.permissibleFsi.value;
  const actualFloorAreas = building.floors
    .filter(floor => floor.boundary.points.length >= 3)
    .map(floor => polygonArea(floor.boundary));
  const usedFloorArea = actualFloorAreas.length
    ? actualFloorAreas.reduce((total, area) => total + area, 0)
    : undefined;
  const ground = building.floors.find(floor => floor.level === 0 && floor.boundary.points.length >= 3);
  const groundArea = ground ? polygonArea(ground.boundary) : undefined;
  return {
    plotArea,
    buildableEnvelopeArea,
    buildableWidth,
    buildableDepth,
    permissibleFloorArea: Number.isFinite(fsi) && (fsi as number) > 0 ? plotArea * (fsi as number) : undefined,
    usedFloorArea,
    usedFsi: usedFloorArea !== undefined && plotArea > 0 ? usedFloorArea / plotArea : undefined,
    groundCoveragePercent: groundArea !== undefined && plotArea > 0 ? (groundArea / plotArea) * 100 : undefined,
  };
}

export function oppositeDirection(direction: Direction): Direction {
  return ({ north: Direction.South, south: Direction.North, east: Direction.West, west: Direction.East })[direction];
}

/** Map access-relative setback names onto fixed cardinal plot edges. */
export function resolveCardinalSetbacks(setbacks: Setbacks, roadFacing: Direction): CardinalSetbacks {
  if (roadFacing === Direction.North) return { north: setbacks.front, south: setbacks.rear, west: setbacks.left, east: setbacks.right };
  if (roadFacing === Direction.South) return { north: setbacks.rear, south: setbacks.front, west: setbacks.right, east: setbacks.left };
  if (roadFacing === Direction.East) return { north: setbacks.left, south: setbacks.right, west: setbacks.rear, east: setbacks.front };
  return { north: setbacks.right, south: setbacks.left, west: setbacks.front, east: setbacks.rear };
}

export function validateSite(site: Site): SiteValidationFinding[] {
  const findings: SiteValidationFinding[] = [];
  ([['Plot width', site.plotWidth], ['Plot depth', site.plotDepth]] as Array<[string, number]>).forEach(([field, value]) => {
    if (!Number.isFinite(value) || value <= 0) findings.push({ status: 'INVALID', field, message: `${field} must be greater than zero.` });
  });
  (Object.entries(site.setbacks) as Array<[keyof Setbacks, number]>).forEach(([field, value]) => {
    if (!Number.isFinite(value) || value < 0) findings.push({ status: 'INVALID', field, message: 'Setbacks cannot be negative.' });
  });
  const cardinal = resolveCardinalSetbacks(site.setbacks, site.roadFacing);
  if (cardinal.west + cardinal.east >= site.plotWidth) findings.push({ status: 'INVALID', field: 'Horizontal setbacks', message: 'Setbacks leave no buildable width.' });
  if (cardinal.north + cardinal.south >= site.plotDepth) findings.push({ status: 'INVALID', field: 'Vertical setbacks', message: 'Setbacks leave no buildable depth.' });
  if (!site.plannedFloorCount) findings.push({ status: 'NOT_CONFIGURED', field: 'Floor count', message: 'Expected floor count is not configured.' });
  else if (site.plannedFloorCount < BUILDING_CAPABILITIES.minimumFloorCount || site.plannedFloorCount > BUILDING_CAPABILITIES.maximumFloorCount) {
    findings.push({ status: 'INVALID', field: 'Floor count', message: `Floor count must be between ${BUILDING_CAPABILITIES.minimumFloorCount} and ${BUILDING_CAPABILITIES.maximumFloorCount}.` });
  }
  if (site.roadWidth === undefined) findings.push({ status: 'NOT_CONFIGURED', field: 'Road width', message: 'Road width is not configured.' });
  else if (!Number.isFinite(site.roadWidth) || site.roadWidth <= 0) findings.push({ status: 'INVALID', field: 'Road width', message: 'Road width must be greater than zero.' });
  if (site.cornerPlot) {
    if (!site.secondaryRoadFacing) findings.push({ status: 'INVALID', field: 'Secondary road', message: 'A corner plot requires a second road side.' });
    else if (site.secondaryRoadFacing === site.roadFacing || oppositeDirection(site.roadFacing) === site.secondaryRoadFacing) {
      findings.push({ status: 'INVALID', field: 'Secondary road', message: 'The second road must be on an adjacent plot edge.' });
    }
  }
  const controls = site.developmentControls ?? EMPTY_DEVELOPMENT_CONTROLS;
  (Object.entries(controls) as Array<[keyof SiteDevelopmentControls, { value?: number; provenance: string }]>).forEach(([field, control]) => {
    if (control.provenance === 'USER_PROVIDED' && (!Number.isFinite(control.value) || (control.value as number) <= 0)) {
      findings.push({ status: 'INVALID', field, message: 'A user-provided control must be greater than zero.' });
    } else if (control.provenance === 'NOT_CONFIGURED') {
      findings.push({ status: 'NOT_CONFIGURED', field, message: 'Regulatory value has not been provided. No value was guessed.' });
    }
  });
  if (!findings.some(finding => finding.status === 'INVALID')) {
    findings.unshift({ status: 'VALID', field: 'Site geometry', message: 'The configured rectangular site and setback envelope are geometrically valid.' });
  }
  return findings;
}

export function updateBuildingSite(building: Building, site: Site): Building {
  return { ...building, site, version: building.version + 1, updatedAt: new Date().toISOString() };
}
