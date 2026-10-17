/**
 * TWO-PHASE upgrade — live concept run against the REAL providers
 * (Cloudflare FLUX + Gemini), through the real HTTP route and orchestrator.
 *
 * Scenario (acceptance target): 2 flats (1 × 2BHK + 1 × 3BHK), 2 lifts,
 * 2 stairs, 1 common lobby → EXACTLY four controlled FLUX concepts.
 * Every FLUX image, its schematic and the per-candidate outcome are saved.
 * Results are labelled LIVE (real provider responses in this run). Never prints secrets.
 *
 * Usage: node scripts/test-two-phase-concepts-live.mjs [seed] [flats]
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';

import { validateReferenceSet, decideReferenceGate } from './lib/reference-integrity.mjs';

const require = createRequire(import.meta.url);
const { startBackendServer } = require('../packages/backend/dist-server/server.cjs');

const seed = Number(process.argv[2] ?? 42);
const flats = Number(process.argv[3] ?? 2);
const outDir = path.resolve('scripts/two_phase_live_output');

const unitMix = flats === 2
  ? [{ unitType: '2BHK', count: 1, carpetAreaSqFt: 700 }, { unitType: '3BHK', count: 1, carpetAreaSqFt: 1000 }]
  : flats === 3
  ? [{ unitType: '2BHK', count: 2, carpetAreaSqFt: 700 }, { unitType: '3BHK', count: 1, carpetAreaSqFt: 1000 }]
  : [{ unitType: '2BHK', count: Math.ceil(flats / 2), carpetAreaSqFt: 700 }, { unitType: '3BHK', count: Math.floor(flats / 2), carpetAreaSqFt: 1000 }];

const payload = {
  projectId: `proj_two_phase_${flats}f_${seed}`,
  projectName: `Two-phase concepts (${flats} flats)`,
  projectType: 'apartment',
  site: { plotWidth: 45, plotDepth: 50, plannedFloorCount: 4, roadFacing: 'north', setbacks: { front: 3, rear: 2, left: 2, right: 2 } },
  apartmentConfig: {
    projectType: 'apartment',
    jurisdiction: 'pune_pmc',
    floorCount: 4,
    flatsPerFloor: flats,
    unitMix,
    commonCore: { passengerLifts: 2, serviceLifts: 0, staircaseCount: 2, fireStaircaseRequired: true, commonLobby: true },
    parking: { residentParkingCount: flats * 4, visitorParkingCount: 2, twoWheelerParkingCount: flats * 4, fourWheelerParkingCount: flats * 4 },
    amenities: { groundSiteAmenities: ['visitor_parking'], buildingAmenities: ['society_office'] },
    floorStrategy: 'typical',
  },
  candidateCount: 4,
  seed,
};

const scoreLabel = c =>
  c.status !== 'REJECTED' && c.evaluation && typeof c.evaluation.overallScore === 'number'
    ? `Gemini (advisory) ${c.evaluation.overallScore}/100`
    : c.rejectionStage === 'VISUAL_PREFLIGHT' ? 'NOT SCORED (rejected at visual preflight)'
    : c.status === 'REJECTED' ? 'NOT SCORED (rejected at hard validation)' : `NOT SCORED (${c.evaluationStatus})`;

const CONCEPT_REF_DIR = path.resolve('packages/backend/data/reference-images/concept-references/normalized_512');
const REQUIRED_REFERENCES = 4;
const REDUCED = process.argv.includes('--reduced-references');
/** Optional output-name prefix (e.g. --tag phase2) so earlier evidence is never overwritten. */
const TAG_ARG = process.argv.indexOf('--tag');
const RUN_TAG = TAG_ARG > 0 && process.argv[TAG_ARG + 1] ? String(process.argv[TAG_ARG + 1]).replace(/[^a-z0-9_-]/gi, '') : '';
const ALLOW_MISSING = process.argv.includes('--allow-missing-references');

/** normalized id → original filename (provenance written by scripts/normalize-concept-references.ps1). */
function readReferenceProvenance() {
  try {
    const raw = fs.readFileSync(path.join(CONCEPT_REF_DIR, 'manifest.json'), 'utf8').replace(/^\uFEFF/, '');
    const parsed = JSON.parse(raw);
    return Object.fromEntries((Array.isArray(parsed) ? parsed : [parsed]).map(m => [m.id, m.original]));
  } catch {
    return {};
  }
}

/**
 * Acceptance precondition: normalized references exist, are readable valid PNGs ≤ 512², and are
 * DISTINCT by SHA-256 (no silent substitution, no duplicate filling a slot).
 */
function verifyReferenceAssets() {
  const result = validateReferenceSet(CONCEPT_REF_DIR, { required: REQUIRED_REFERENCES });
  const gate = decideReferenceGate(result, { reduced: REDUCED, allowMissing: ALLOW_MISSING });
  const provenance = readReferenceProvenance();
  const slots = Math.max(REQUIRED_REFERENCES, result.rows.length);
  for (let i = 0; i < slots; i++) {
    const r = result.rows[i];
    const label = !r
      ? 'MISSING'
      : r.status === 'VALID'
      ? `distinct (${r.id}, ${r.size}, sha256 ${r.sha256.slice(0, 16)}…${provenance[r.id] ? `, original ${provenance[r.id]}` : ''})`
      : r.status === 'REFERENCE_DUPLICATE'
      ? `REFERENCE_DUPLICATE (${r.id} = ${r.duplicateOf})`
      : `${r.status} (${r.id}${r.size ? `, ${r.size}` : ''})`;
    console.log(`reference ${String(i + 1).padStart(2, '0')} → ${label}`);
  }
  console.log(`Distinct references available: ${result.distinctCount}/${REQUIRED_REFERENCES}`);
  console.log(`Run mode: ${gate.mode}`);
  console.log(`Full ${REQUIRED_REFERENCES}-reference acceptance: ${gate.fullAcceptance === 'TESTED' ? 'TESTED IN THIS RUN' : 'NOT TESTED'}`);
  return { ...result, provenance, gate, pass: gate.proceed };
}

/** Bundle ai-orchestration source for Node (same esbuild route as scripts/bundle-backend.mjs). */
async function loadAiOrchestration() {
  const esbuildDir = path.resolve('node_modules/.pnpm/esbuild@0.21.5/node_modules/esbuild');
  const esbuild = createRequire(path.join(esbuildDir, 'package.json'))('./lib/main.js');
  const outfile = path.resolve('scripts/.cache/ai-orchestration.cjs');
  await esbuild.build({
    entryPoints: [path.resolve('packages/ai-orchestration/src/index.ts')],
    bundle: true, platform: 'node', format: 'cjs', target: 'node22', outfile, logLevel: 'error',
  });
  return require(outfile);
}

/** Pre-FLUX: recompute every concept's deterministic layout exactly as the orchestrator does and report it. */
async function verifyPreFluxLayouts() {
  const ai = await loadAiOrchestration();
  const cfg = payload.apartmentConfig;
  const rules = ai.getApartmentRulesProfile(cfg.jurisdiction, { floorCount: cfg.floorCount, buildingHeightM: cfg.floorCount * 3.1, tenementsPerFloor: cfg.flatsPerFloor });
  const manifest = ai.buildApartmentGenerationManifest({
    site: { plotWidthMm: payload.site.plotWidth * 1000, plotDepthMm: payload.site.plotDepth * 1000, setbacksMm: { front: 3000, rear: 2000, left: 2000, right: 2000 }, roadFacing: payload.site.roadFacing },
    apartmentConfig: cfg,
    rulesProfile: rules,
  });
  return ai.APARTMENT_CONCEPT_STRATEGIES.map(st => {
    const s = ai.generateDeterministicApartmentSchematic({
      siteWidthM: payload.site.plotWidth, siteDepthM: payload.site.plotDepth, setbacksM: payload.site.setbacks,
      flatsPerFloor: cfg.flatsPerFloor, unitMix: cfg.unitMix, commonCoreConfig: cfg.commonCore, floorType: cfg.floorStrategy,
      rulesProfile: rules, strategy: st.id,
    });
    const check = ai.validateSchematicMatchesManifest(s, manifest);
    const fails = s.spatialChecks.filter(c => c.status === 'FAIL');
    const row = {
      concept: `Concept 0${st.candidateNumber} (${st.id})`,
      flats: s.units.length,
      unitMix: s.units.map(u => u.unitType).join(' + '),
      lifts: s.core.lifts.length,
      stairs: s.core.stairs.length,
      commonLobby: s.core.lobby ? 1 : 0,
      spatialChecks: `${s.spatialChecks.length - fails.length}/${s.spatialChecks.length}`,
      areaStatus: s.areaReport.units.map(u => `${u.flatLabel} ${u.deviationPct}% ${u.status}`).join('; '),
      fits: s.layoutFits,
      manifestMatch: check.matches,
      discrepancies: check.discrepancies,
    };
    console.log(`PRE-FLUX ${row.concept}: flats=${row.flats} mix=${row.unitMix} lifts=${row.lifts} stairs=${row.stairs} lobby=${row.commonLobby} checks=${row.spatialChecks} fits=${row.fits} manifest=${row.manifestMatch ? 'PASS' : 'FAIL'} | ${row.areaStatus}`);
    return row;
  });
}

/** Single JSON POST with one overall timeout (no per-phase headers timeout). */
function postJson(url, body, timeoutMs) {
  return new Promise((resolve, reject) => {
    const payloadBuf = Buffer.from(JSON.stringify(body));
    const req = http.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': payloadBuf.length } }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(Buffer.concat(chunks).toString('utf8')) });
        } catch (err) {
          reject(err);
        }
      });
      res.on('error', reject);
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`client timeout after ${timeoutMs} ms`)));
    req.on('error', reject);
    req.end(payloadBuf);
  });
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const refs = verifyReferenceAssets();
  if (!refs.pass) {
    console.error(`${refs.gate.code}: ${refs.gate.message} (${CONCEPT_REF_DIR}). Not calling FLUX (no silent substitution).`);
    process.exit(refs.gate.exitCode);
  }
  const preFlux = await verifyPreFluxLayouts();
  if (preFlux.some(r => !r.manifestMatch || !r.fits)) {
    console.error('PRE-FLUX LAYOUT: FAIL — stopping before FLUX.');
    fs.writeFileSync(path.join(outDir, `pre_flux_f${flats}_s${seed}.json`), JSON.stringify(preFlux, null, 2));
    process.exit(3);
  }
  const port = 4207;
  const { server } = startBackendServer(port);
  await new Promise(r => setTimeout(r, 500));
  try {
    console.log(`TWO-PHASE LIVE CONCEPTS — ${flats} flats, seed ${seed}`);
    const t0 = Date.now();
    // node:http instead of global fetch: undici's fixed 300 s headersTimeout aborts
    // four-concept runs that legitimately take longer (server allows 15 min).
    const res = await postJson(`http://localhost:${port}/api/v1/generation/run`, payload, 20 * 60 * 1000);
    const data = res.json;
    const elapsedS = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`HTTP ${res.status} in ${elapsedS}s`);
    const tag = `${RUN_TAG ? `${RUN_TAG}_` : ''}${REDUCED ? `reduced${refs.distinctCount}ref_` : ''}f${flats}_s${seed}`;
    const withOriginal = ids => ids.map(id => ({ id, original: refs.provenance[id] ?? null }));
    const summary = {
      mode: 'LIVE',
      runMode: refs.gate.mode,
      note: 'Real Cloudflare FLUX and real Gemini responses in this run (no replay).',
      seed,
      flats,
      referenceIntegrity: {
        distinctReferencesAvailable: refs.distinctCount,
        requiredForFullAcceptance: REQUIRED_REFERENCES,
        fullFourReferenceAcceptance: refs.gate.fullAcceptance,
        duplicateGroups: refs.duplicateGroups,
        issues: refs.issues,
      },
      referencesSentPerConcept: (data.conceptSlots ?? []).map(s => ({
        candidateNumber: s.candidateNumber,
        strategy: s.strategy,
        seed: s.seed,
        slotStatus: s.status,
        slotError: s.error ?? null,
        distinctReferencesAvailable: s.distinctReferencesAvailable ?? null,
        inputImages: ['schematic_scaffold', ...s.referenceIds],
        styleReferences: withOriginal(s.referenceIds),
      })),
      referenceAssets: refs.rows,
      preFluxLayouts: preFlux,
      elapsedS: Number(elapsedS),
      success: data.success,
      conceptMode: data.conceptMode ?? false,
      conceptSlots: data.conceptSlots ?? [],
      candidateSource: data.candidateSource ?? null,
      fallback: data.fallback ? { used: data.fallback.used, reason: data.fallback.reason } : null,
      error: data.error ? { code: data.error.code, stage: data.error.stage, message: data.error.message, reasons: data.error.reasons } : null,
      candidates: (data.candidates ?? []).map(c => ({
        id: c.id,
        candidate: c.concept ? `Candidate ${String(c.concept.candidateNumber).padStart(2, '0')} — ${c.concept.label}` : c.source,
        strategy: c.concept?.strategy ?? null,
        seed: c.seed,
        source: c.source,
        model: c.artifact?.model,
        provider: c.artifact?.provider,
        artifactId: c.artifact?.generationId,
        httpStatus: c.source === 'FLUX' && c.artifact ? 200 : null,
        latencyMs: c.artifact?.latencyMs,
        width: c.artifact?.width,
        height: c.artifact?.height,
        promptVersion: c.artifact?.promptVersion,
        prompt: c.artifact?.originalPrompt ?? null,
        references: c.concept?.referenceIds ?? [],
        distinctReferencesAvailable: c.concept?.distinctReferencesAvailable ?? null,
        layoutChecks: c.concept ? `${c.concept.spatialChecksPassed}/${c.concept.spatialChecksTotal}` : null,
        status: c.status,
        rejectionStage: c.rejectionStage,
        preflight: c.preflight
          ? {
              pass: c.preflight.pass,
              summary: c.preflight.matchingSummary,
              reasons: c.preflight.failureReasons,
              detected: c.preflight.detected
                ? {
                    flatCount: c.preflight.detected.flatCount,
                    unitMix: c.preflight.detected.unitMix,
                    liftCount: c.preflight.detected.liftCount,
                    stairCount: c.preflight.detected.stairCount,
                    commonLobby: c.preflight.detected.commonCore,
                    unitSeparation: c.preflight.detected.unitSeparation,
                    majorRooms: c.preflight.detected.majorRooms,
                    labelLanguage: c.preflight.detected.labelLanguage,
                    visualQuality: c.preflight.detected.visualQuality,
                    observations: c.preflight.detected.observations,
                  }
                : null,
            }
          : null,
        stages: c.stages,
        apartmentValidation: c.apartmentValidation ?? null,
        score: scoreLabel(c),
        evaluation: c.evaluation ?? null,
        errors: (c.validation?.verificationIssues ?? []).filter(i => i.severity === 'error').map(i => i.message),
        rejectedReason: c.rejectedReason,
      })),
    };
    console.log(JSON.stringify({ ...summary, candidates: summary.candidates.map(c => ({ ...c, stages: undefined, evaluation: undefined })) }, null, 2));
    fs.writeFileSync(path.join(outDir, `two_phase_${tag}_summary.json`), JSON.stringify(summary, null, 2));
    for (const c of data.candidates ?? []) {
      const base = c.concept ? `c0${c.concept.candidateNumber}_${c.concept.strategy}` : c.source;
      if (c.artifact?.imageBase64) {
        const ext = (c.artifact.mimeType ?? 'image/png').includes('jpeg') ? 'jpg' : 'png';
        fs.writeFileSync(path.join(outDir, `two_phase_${tag}_${base}_${c.status}.${ext}`), Buffer.from(c.artifact.imageBase64, 'base64'));
      }
      if (c.concept?.schematicPngBase64) {
        fs.writeFileSync(path.join(outDir, `two_phase_${tag}_${base}_schematic.png`), Buffer.from(c.concept.schematicPngBase64, 'base64'));
      }
    }
  } finally {
    server.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
