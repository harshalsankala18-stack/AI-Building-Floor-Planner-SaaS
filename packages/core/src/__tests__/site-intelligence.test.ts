import { describe, expect, it } from 'vitest';
import {
  Direction, PlotShape, calculateSiteMetrics, createBuilding, rectToPolygon,
  updateBuildingSite, validateSite,
} from '../index';

function siteBuilding() {
  return createBuilding({
    projectId: 'site-project',
    name: 'Site project',
    site: {
      plotWidth: 9_144,
      plotDepth: 15_240,
      roadFacing: Direction.East,
      roadWidth: 9_000,
      plannedFloorCount: 3,
      setbacks: { front: 1_500, rear: 1_000, left: 1_000, right: 1_000 },
      developmentControls: {
        permissibleFsi: { value: 1.5, provenance: 'USER_PROVIDED' },
        maxCoveragePercent: { provenance: 'NOT_CONFIGURED' },
        maxHeight: { provenance: 'NOT_CONFIGURED' },
      },
    },
    floors: [{ buildingId: '', level: 0, boundary: rectToPolygon(1_000, 1_500, 7_144, 12_740) }],
  });
}

describe('site intelligence', () => {
  it('calculates rectangular plot and setback envelope areas', () => {
    const metrics = calculateSiteMetrics(siteBuilding());
    expect(metrics.plotArea).toBe(9_144 * 15_240);
    expect(metrics.buildableEnvelopeArea).toBe(6_644 * 13_240);
  });

  it('calculates potential floor area only from user-provided FSI', () => {
    const metrics = calculateSiteMetrics(siteBuilding());
    expect(metrics.permissibleFloorArea).toBe(metrics.plotArea * 1.5);
  });

  it('reports defensible used FSI and coverage from actual floor boundaries', () => {
    const metrics = calculateSiteMetrics(siteBuilding());
    const actualFootprintArea = 7_144 * 12_740;
    expect(metrics.usedFsi).toBeCloseTo(actualFootprintArea / metrics.plotArea);
    expect(metrics.groundCoveragePercent).toBeCloseTo((actualFootprintArea / metrics.plotArea) * 100);
  });

  it('leaves used metrics not checked when no footprint geometry exists', () => {
    const building = createBuilding({ projectId: 'blank', name: 'Blank', site: { plotWidth: 10_000, plotDepth: 20_000 }, floors: [] });
    expect(calculateSiteMetrics(building).usedFsi).toBeUndefined();
    expect(calculateSiteMetrics(building).groundCoveragePercent).toBeUndefined();
  });

  it('marks missing regulations as not configured instead of guessing', () => {
    const building = createBuilding({ projectId: 'blank', name: 'Blank', site: { plotWidth: 10_000, plotDepth: 20_000 }, floors: [] });
    const findings = validateSite(building.site);
    expect(findings.filter(finding => finding.status === 'NOT_CONFIGURED').map(finding => finding.field))
      .toEqual(expect.arrayContaining(['Floor count', 'Road width', 'permissibleFsi', 'maxCoveragePercent', 'maxHeight']));
  });

  it('rejects setbacks that consume the plot', () => {
    const building = siteBuilding();
    const site = { ...building.site, setbacks: { ...building.site.setbacks, left: 8_000, right: 8_000 } };
    expect(validateSite(site)).toContainEqual(expect.objectContaining({ status: 'INVALID', field: 'Vertical setbacks' }));
  });

  it('requires the second road of a corner plot to be adjacent', () => {
    const building = siteBuilding();
    const site = { ...building.site, cornerPlot: true, secondaryRoadFacing: Direction.West };
    expect(validateSite(site)).toContainEqual(expect.objectContaining({ status: 'INVALID', field: 'Secondary road' }));
  });

  it('updates site metadata without modifying floors or room geometry', () => {
    const building = siteBuilding();
    const nextSite = { ...building.site, plotShape: PlotShape.Rectangular, plotWidth: 10_000 };
    const updated = updateBuildingSite(building, nextSite);
    expect(updated.floors).toBe(building.floors);
    expect(updated.site.plotWidth).toBe(10_000);
    expect(updated.version).toBe(building.version + 1);
  });
});
