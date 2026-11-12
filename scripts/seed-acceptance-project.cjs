/**
 * Phase 2.7 acceptance: build the browser seed from the REAL backend.
 *
 * Calls /api/v1/generation/resume with the actual accepted master artifact, so
 * the project installed into the browser carries genuinely image-derived
 * geometry (with provenance) rather than anything fabricated here.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ARTIFACT = process.argv[2] || 'gen_31777_mwclbld5_c4e1341d';
const PROJECT_ID = 'proj_q7fuhen';
const BACKEND = 'http://localhost:4200';

const dir = 'data/image-artifacts';
const meta = JSON.parse(fs.readFileSync(path.join(dir, ARTIFACT + '.json'), 'utf8'));
const imgPath = ['jpg', 'png'].map(e => path.join(dir, ARTIFACT + '.' + e)).find(p => fs.existsSync(p));
const bytes = fs.readFileSync(imgPath);
const sha = crypto.createHash('sha256').update(bytes).digest('hex');

// The project's real site, taken from the artifact's own generation prompt.
const site = {
  plotWidth: 12192,
  plotDepth: 18288,
  plannedFloorCount: 2,
  roadFacing: 'east',
  setbacks: { front: 3048, rear: 1829, left: 1524, right: 1524 },
  orientation: 0,
};

(async () => {
  const res = await fetch(`${BACKEND}/api/v1/generation/resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      artifactId: ARTIFACT,
      projectId: PROJECT_ID,
      projectName: 'Ahmedabad L-Shaped Villa',
      projectType: 'single_family',
      site,
      requirements: {
        hard: {
          plotWidthMm: site.plotWidth,
          plotDepthMm: site.plotDepth,
          roadFacing: 'east',
          bedroomCount: 3,
          bathroomCount: 2,
          floorsCount: 2,
          parkingRequired: true,
          parkingSpacesCount: 1,
        },
        soft: {
          vastuCompliance: true,
          naturalLightPreference: 'high',
          privacyPreference: 'high',
          circulationEfficiency: 'high',
          gardenPreference: false,
          servantQuarter: false,
          poojaRoom: false,
          studyRoom: false,
          balconyPreferred: true,
          openKitchen: false,
          attachedBathroomsCount: 1,
        },
        plotShape: 'rectangular',
        orientationDegrees: 0,
        setbacksMm: site.setbacks,
        rawUserPrompt:
          '3 bedrooms, 2 bathrooms, living room, dining room, kitchen, balcony, parking, vastu compliant orientation. Footprint shape: l shape. Plot size 40x60 ft, road facing east.',
      },
    }),
  });

  const raw = await res.text();
  if (res.status !== 200) { console.log('RAW ERROR BODY:', raw.slice(0,1200)); process.exitCode=1; return; }
  const body = JSON.parse(raw);
  const candidate = (body.candidates || [])[0];
  const accepted = (body.candidates || []).find(c => c.status === 'ACCEPTED' && c.building);

  console.log('HTTP', res.status, '| success', body.success);
  console.log('geometrySource:', candidate && candidate.geometrySource);
  if (candidate && candidate.cadFidelity) {
    const f = candidate.cadFidelity;
    console.log(`cadFidelity: ${f.overallScore}/100 threshold=${f.threshold} passed=${f.passed} vs ${f.comparedArtifactId}`);
    for (const d of f.dimensions) console.log(`   ${d.label}: ${Math.round(d.score)} — ${d.detail}`);
    for (const m of f.missingMandatory) console.log('   MISSING:', m);
    for (const m of f.materialAdjustments) console.log('   ADJUSTED:', m);
  }
  if (candidate && candidate.conversionError) {
    console.log('conversionError:', candidate.conversionError.code, '|', candidate.conversionError.message);
  }
  if (!accepted) {
    console.log('NOT ACCEPTED — no seed written.');
    for (const d of (candidate && candidate.diagnostics) || []) console.log(`   [${d.severity}] ${d.code}: ${d.message}`);
    process.exitCode = 1;
    return;
  }

  const building = accepted.building;
  for (const f of building.floors) {
    console.log(`floor ${f.name}: rooms=${f.rooms.length} walls=${f.walls.length} doors=${f.doors.length} windows=${f.windows.length} stairs=${(f.stairs||[]).length} cols=${(f.columns||[]).length}`);
  }

  const now = new Date().toISOString();
  const session = {
    schemaVersion: 1,
    generationId: ARTIFACT,
    seed: meta.seed,
    attempt: 4,
    generatedAt: meta.generatedAt,
    promptVersion: 1,
    model: meta.model,
    provider: meta.provider,
    mimeType: meta.mimeType,
    imageBase64: bytes.toString('base64'),
    request: {
      schemaVersion: 1,
      promptVersion: 1,
      prompt: meta.originalPrompt,
      negativePrompt: meta.negativePrompt || 'perspective, isometric, blurry',
      seed: meta.seed,
      width: meta.width,
      height: meta.height,
      metadata: {
        projectName: 'Ahmedabad L-Shaped Villa',
        plotWidthMm: site.plotWidth,
        plotDepthMm: site.plotDepth,
        floorsCount: 2,
        roadFacing: 'east',
      },
    },
    contextSignature: `${building.id}:${building.version}:${site.plotWidth}x${site.plotDepth}`,
    evaluation: body.masterEvaluation || accepted.masterEvaluation || null,
  };

  const envelope = {
    schemaVersion: 6,
    projectId: PROJECT_ID,
    name: 'Ahmedabad L-Shaped Villa',
    createdAt: now,
    updatedAt: now,
    building,
    requiredRoomCounts: { living: 1, dining: 1, kitchen: 1, bedroom: 3, bathroom: 2 },
    category: 'residential',
    status: 'CONCEPT',
    floorPlanImage: session,
    imageRevisions: [{ ...session, revisionNumber: 1, buildingSnapshot: building }],
    pendingAiGeneration: false,
  };

  fs.mkdirSync('.audit', { recursive: true });
  fs.writeFileSync('.audit/seed-envelope.json', JSON.stringify(envelope));
  fs.writeFileSync('.audit/seed-candidate.json', JSON.stringify({
    geometrySource: candidate.geometrySource,
    cadFidelity: candidate.cadFidelity,
    diagnostics: candidate.diagnostics,
    imageHash: sha,
  }, null, 2));
  console.log('seed written: .audit/seed-envelope.json', fs.statSync('.audit/seed-envelope.json').size, 'bytes');
})().catch(e => { console.error('FAILED:', e.message); process.exitCode = 1; });
