/**
 * Phase 2.7 diagnostic reproduction (temporary, audit-only).
 * Runs the REAL accepted master image through Gemini Vision and the extraction
 * pipeline, and dumps what Building actually reaches the editor.
 * Skipped unless AUDIT_LIVE=1.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { normalizeDesignRequirementSpecification } from '@ai-floor-planner/core';
import { GeminiProvider, interpretPlanImageWithGemini } from '@ai-floor-planner/ai-orchestration';
import { runExtractionPipeline } from '../packages/backend/src/services/extraction-pipeline';
import { decodeImageDimensions } from '../packages/backend/src/services/image-artifact-store';

const LIVE = process.env.AUDIT_LIVE === '1';
const ART = process.env.AUDIT_ARTIFACT ?? 'gen_31777_mwclbld5_c4e1341d';

function loadEnv(): Record<string, string> {
  const vals: Record<string, string> = {};
  for (const rawLine of fs.readFileSync('packages/backend/.env', 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    vals[key] = value;
    process.env[key] = value;
  }
  console.log(`ENV keys=${Object.keys(vals).join(',')} apiKeyLen=${vals.GEMINI_API_KEY?.length ?? 0}`);
  return vals;
}

describe('AUDIT: real image -> CAD', () => {
  it.runIf(LIVE)('reproduces conversion for the accepted artifact', async () => {
    const env = loadEnv();
    const dir = 'data/image-artifacts';
    const meta = JSON.parse(fs.readFileSync(path.join(dir, ART + '.json'), 'utf8'));
    const imgPath = ['jpg', 'png'].map(e => path.join(dir, ART + '.' + e)).find(p => fs.existsSync(p))!;
    const buf = fs.readFileSync(imgPath);
    const sha = crypto.createHash('sha256').update(buf).digest('hex');
    const out: string[] = [];
    const log = (s: string) => { out.push(s); console.log(s); };

    log(`artifactId=${meta.generationId} projectId=${meta.projectId} dims=${meta.width}x${meta.height} sha256=${sha}`);

    const spec = normalizeDesignRequirementSpecification({
      hard: {
        plotWidthMm: 12192, plotDepthMm: 18288, roadFacing: 'east',
        bedroomCount: 3, bathroomCount: 2, floorsCount: 2, parkingRequired: true,
      },
      orientationDegrees: 0,
      setbacksMm: { front: 3048, rear: 1829, left: 1524, right: 1524 },
      rawUserPrompt: '3 bedrooms, 2 bathrooms, living, dining, kitchen, balcony, parking, vastu. L shape. 40x60 ft, road east.',
    });

    const provider = new GeminiProvider({
      apiKey: env.GEMINI_API_KEY!,
      model: env.GEMINI_MODEL!,
      fallbackModel: env.GEMINI_FALLBACK_MODEL!,
      timeoutMs: 120_000,
    });

    const cachePath = `.audit/vision-${ART}.json`;
    const useCache = process.env.AUDIT_USE_CACHE === '1' && fs.existsSync(cachePath);
    const vision = useCache
      ? { parsed: JSON.parse(fs.readFileSync(cachePath, 'utf8')), model: 'cached', coordinateFrame: { kind: 'normalized' as const, width: 1000, height: 1000 } }
      : await interpretPlanImageWithGemini(provider, {
      plotWidthMm: spec.hard.plotWidthMm,
      plotDepthMm: spec.hard.plotDepthMm,
      orientationDegrees: spec.orientationDegrees,
      roadFacing: spec.hard.roadFacing,
      userPrompt: spec.rawUserPrompt!,
      imageBase64: buf.toString('base64'),
      imageMimeType: meta.mimeType || 'image/jpeg',
    });
    if (!useCache) fs.writeFileSync(cachePath, JSON.stringify(vision.parsed, null, 2));
    const p: any = vision.parsed;
    log(`VISION model=${vision.model} frame=${JSON.stringify(vision.coordinateFrame)}`);
    log(`VISION footprint=${p.footprintShape} entrance=${p.entranceSide} boundaryPts=${(p.boundary?.points ?? []).length}`);
    log(`VISION rooms=${(p.rooms ?? []).length} doors=${(p.doors ?? []).length} windows=${(p.windows ?? []).length} stairs=${(p.stairs ?? []).length} parking=${(p.parking ?? []).length}`);
    for (const r of (p.rooms ?? [])) {
      log(`  VROOM L${r.floorLevel ?? 0} ${r.name} / ${r.type} x=${r.x} y=${r.y} w=${r.width} h=${r.height} zone=${r.compassZone ?? '-'}`);
    }

    const decoded = decodeImageDimensions(buf);
    log(`DECODED actual pixels=${decoded?.width}x${decoded?.height} (metadata claimed ${meta.width}x${meta.height})`);
    const frame = vision.coordinateFrame.kind === 'normalized'
      ? { width: vision.coordinateFrame.width, height: vision.coordinateFrame.height }
      : undefined;
    log(`FRAME ${JSON.stringify(frame)}`);

    const result = runExtractionPipeline({
      projectId: meta.projectId,
      projectName: 'Ahmedabad L-Shaped Villa',
      requirements: spec,
      imageWidePixels: decoded?.width ?? meta.width,
      imageTallPixels: decoded?.height ?? meta.height,
      payload: vision.parsed,
      extractionSource: 'gemini_vision',
      confidence: 'likely',
      interpretationSource: 'provider',
      ...(frame ? { coordinateFrame: frame } : {}),
      imageSource: {
        artifactId: meta.generationId,
        imageHash: sha,
        generationRevision: meta.promptVersion ?? 1,
        projectFingerprint: 'audit_fp',
        visionModel: vision.model,
        interpretationSource: 'provider',
        imageWidePixels: decoded?.width ?? meta.width,
        imageTallPixels: decoded?.height ?? meta.height,
      },
    });
    log(`GEOMETRY SOURCE: ${result.geometrySource}`);
    if (result.cadFidelity) {
      const f = result.cadFidelity;
      log(`CAD FIDELITY ${f.overallScore}/100 threshold=${f.threshold} passed=${f.passed}`);
      for (const d of f.dimensions) log(`  FID ${d.label}: ${d.score} (w${d.weight}) — ${d.detail}`);
      for (const m of f.missingMandatory) log(`  FID-MISSING ${m}`);
      for (const m of f.materialAdjustments) log(`  FID-ADJUST ${m}`);
    }
    if (result.conversionError) log(`CONVERSION ERROR ${result.conversionError.code}: ${result.conversionError.message}`);
    log(`PIPELINE status=${result.status} planId=${result.planId}`);
    log(`PIPELINE validation=${JSON.stringify({ isValid: result.validation?.isValid, score: result.validation?.overallScore, healthy: result.validation?.geometryHealthy })}`);
    for (const d of result.diagnostics) log(`  DIAG [${d.severity}] ${d.code}: ${d.message}`);

    const b = result.building;
    if (b) {
      fs.writeFileSync(`.audit/building-${ART}.json`, JSON.stringify(b, null, 2));
      const cd: any = b.metadata?.customData ?? {};
      log(`BUILDING id=${b.id} floors=${b.floors.length} customDataKeys=${Object.keys(cd).join(',')}`);
      log(`BUILDING reconstructionSource=${cd.reconstructionSource} matchedStrategy=${cd.aiTraceability?.matchedStrategyId}`);
      for (const f of b.floors) {
        log(` FLOOR ${f.name} rooms=${f.rooms.length} walls=${f.walls.length} doors=${f.doors.length} windows=${f.windows.length} stairs=${f.stairs?.length ?? 0} cols=${f.columns?.length ?? 0}`);
        for (const r of f.rooms) log(`   CROOM ${r.name} / ${r.type} x=${r.x} y=${r.y} w=${r.width} h=${r.height} tags=${(r.tags ?? []).join('|')}`);
      }
    } else {
      log('BUILDING = null (rejected)');
    }
    fs.writeFileSync(`.audit/repro-${ART}.txt`, out.join('\n'));
    expect(true).toBe(true);
  }, 300_000);
});
