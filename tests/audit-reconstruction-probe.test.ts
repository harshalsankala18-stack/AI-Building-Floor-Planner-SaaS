/** Phase 2.7 probe: does reconstructBuildingFromVision run, and why is its output rejected? */
import fs from 'node:fs';
import { describe, it, expect } from 'vitest';
import { normalizeDesignRequirementSpecification } from '@ai-floor-planner/core';
import {
  parseExtractionPayload,
  createExtractionMetadata,
  normalizeExtractedPlan,
  inspectExtractionStructure,
  validateExtractedPlan,
  extractPlanToBuilding,
  attachExtractedOpenings,
} from '@ai-floor-planner/planning-engine';
import { reconstructBuildingFromVision } from '../packages/backend/src/services/image-to-cad-reconstruction';
import { siteContext } from '../packages/backend/src/services/extraction-pipeline';

const ART = process.env.AUDIT_ARTIFACT ?? 'gen_31777_mwclbld5_c4e1341d';

describe('AUDIT: reconstruction probe', () => {
  it('reports why image-derived geometry is or is not used', () => {
    const payload = JSON.parse(fs.readFileSync(`.audit/vision-${ART}.json`, 'utf8'));
    const spec = normalizeDesignRequirementSpecification({
      hard: {
        plotWidthMm: 12192, plotDepthMm: 18288, roadFacing: 'east',
        bedroomCount: 3, bathroomCount: 2, floorsCount: 2, parkingRequired: true,
      },
      orientationDegrees: 0,
      setbacksMm: { front: 3048, rear: 1829, left: 1524, right: 1524 },
    });
    const site = siteContext(spec);
    const out: string[] = [];
    const log = (s: string) => { out.push(s); console.log(s); };

    const metadata = createExtractionMetadata({
      imageWidePixels: 832, imageTallPixels: 1280,
      plotWidth: site.plotWidth, plotDepth: site.plotDepth,
      orientation: site.orientation, roadFacing: site.roadFacing,
      extractionSource: 'gemini_vision', confidence: 'likely',
    });
    const parsed = parseExtractionPayload(payload, metadata, 'probe');
    log(`parse: plan=${!!parsed.plan} diags=${parsed.diagnostics.length}`);
    for (const d of parsed.diagnostics) log(`  [${d.severity}] ${d.code}: ${d.message}`);
    expect(parsed.plan).toBeTruthy();

    const structural = inspectExtractionStructure(parsed.plan!);
    log(`structure: ${structural.length} issues (errors=${structural.filter(i => i.severity === 'error').length})`);
    for (const d of structural) log(`  [${d.severity}] ${d.code}: ${d.message}`);

    const normalized = normalizeExtractedPlan(parsed.plan!, {
      plotWidth: site.plotWidth, plotDepth: site.plotDepth,
      orientation: site.orientation, roadFacing: site.roadFacing,
    });
    log(`normalize: ok=${!!normalized.normalized} diags=${normalized.diagnostics.length}`);
    for (const d of normalized.diagnostics) log(`  [${d.severity}] ${d.code}: ${d.message}`);
    const plan = normalized.normalized!;
    log(`plan rooms=${plan.rooms.length} doors=${plan.doors.length} windows=${plan.windows.length} stairs=${plan.stairs.length} parking=${plan.parking.length}`);
    for (const r of plan.rooms) log(`  NROOM ${r.name}/${r.type} x=${Math.round(r.x)} y=${Math.round(r.y)} w=${Math.round(r.width)} h=${Math.round(r.height)}`);

    // Path A: the plain extractPlanToBuilding route
    const conv = extractPlanToBuilding(plan, site, 'probe', 'Probe');
    log(`extractPlanToBuilding: building=${!!conv.building} diags=${conv.diagnostics.length}`);
    for (const d of conv.diagnostics) log(`  [${d.severity}] ${d.code}: ${d.message}`);
    if (conv.building) {
      const wo = attachExtractedOpenings(conv.building, plan, { plotWidth: site.plotWidth, plotDepth: site.plotDepth });
      const v = validateExtractedPlan(wo.building, plan, spec);
      log(`  pathA validation isValid=${v.isValid} score=${v.overallScore} healthy=${v.geometryHealthy}`);
      for (const i of v.verificationIssues) log(`    [${i.severity}] ${i.code}: ${i.message}`);
      log(`  pathA floors=${wo.building.floors.length} f0 rooms=${wo.building.floors[0]?.rooms.length} walls=${wo.building.floors[0]?.walls.length}`);
    }

    // Path B: the true image-to-CAD reconstruction
    const recon = reconstructBuildingFromVision({
      plan, rawVisionPayload: payload, requirements: spec, site,
      projectId: 'probe', projectName: 'Probe', qualityScore: 85,
    });
    log(`reconstructBuildingFromVision: floors=${recon.floors.length}`);
    for (const f of recon.floors) {
      log(`  RFLOOR ${f.name} rooms=${f.rooms.length} walls=${f.walls.length} doors=${f.doors.length} windows=${f.windows.length}`);
      for (const r of f.rooms) log(`    RROOM ${r.name}/${r.type} x=${r.x} y=${r.y} w=${r.width} h=${r.height}`);
    }
    const rv = validateExtractedPlan(recon, plan, spec);
    log(`  reconstruction validation isValid=${rv.isValid} score=${rv.overallScore} healthy=${rv.geometryHealthy} recommended=${rv.recommendedForEditing}`);
    for (const i of rv.verificationIssues) log(`    [${i.severity}] ${i.code}: ${i.message}`);

    fs.writeFileSync('.audit/probe-reconstruction.txt', out.join('\n'));
  }, 120_000);
});
