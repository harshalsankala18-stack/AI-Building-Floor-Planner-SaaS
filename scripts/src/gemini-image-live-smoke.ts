/**
 * Gemini 3 Pro Image — Live Acceptance & Smoke Test Script (Milestone 3).
 *
 * Implements the full pipeline:
 * 1. Build deterministic 2-flat mixed 2BHK + 3BHK plan.
 * 2. Validate deterministic geometry & manifest.
 * 3. Render high-resolution structural reference PNG (2048px).
 * 4. Load genuine style references (no duplication).
 * 5. Call Google Gemini 3 Pro Image (gemini-3-pro-image @ 2K).
 * 6. Save returned image bytes.
 * 7. Run Gemini vision plan interpretation.
 * 8. Run deterministic hard validation.
 * 9. Report complete status & provenance.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  planDeterministicApartment,
  renderStructuralPlan,
  buildApartmentGenerationManifest,
  getApartmentRulesProfile,
  compileApartmentFloorPlanImagePrompt,
  interpretPlanImageWithGemini,
  GeminiImageProvider,
  GeminiProvider,
  DEFAULT_GEMINI_IMAGE_MODEL,
  DEFAULT_GEMINI_IMAGE_SIZE,
  type ReferenceImageInput,
  type FloorPlanImagePromptRequest,
} from '../../packages/ai-orchestration/src/index';
import { runExtractionPipeline } from '../../packages/backend/src/services/extraction-pipeline';
import { apartmentInterpretationContextFromManifest } from '../../packages/backend/src/services/apartment-structure';
import { createBuilding, normalizeDesignRequirementSpecification } from '../../packages/core/src/index';

// ─── 0. Environment Setup ──────────────────────────────────────────────────
function loadEnv() {
  const envCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'packages/backend/.env'),
  ];
  for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.substring(0, eqIdx).trim();
          const val = trimmed.substring(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

async function main() {
  console.log('================================================================');
  console.log('GEMINI 3 PRO IMAGE: LIVE ACCEPTANCE & SMOKE TEST');
  console.log('================================================================\n');

  const apiKey = (process.env.GEMINI_API_KEY ?? '').trim();
  const imageModel = (process.env.GEMINI_IMAGE_MODEL ?? '').trim() || DEFAULT_GEMINI_IMAGE_MODEL;
  const imageSize = ((process.env.GEMINI_IMAGE_SIZE ?? '').trim() || DEFAULT_GEMINI_IMAGE_SIZE) as '2K';
  const outDir = path.resolve(process.cwd(), 'scripts', 'gemini_live_output');
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`Configuration:`);
  console.log(`- API Key configured: ${Boolean(apiKey)}`);
  console.log(`- Model: ${imageModel}`);
  console.log(`- Output Resolution Target: ${imageSize}`);
  console.log(`- Output Directory: ${outDir}\n`);

  if (!apiKey) {
    console.error('ERROR: GEMINI_API_KEY is not configured in process.env or packages/backend/.env.');
    process.exit(1);
  }

  // ─── 1. Build Deterministic 2-Flat Mixed Plan ────────────────────────────
  console.log('[Step 1/8] Generating deterministic 2-flat mixed 2BHK + 3BHK layout...');
  const siteConfig = {
    plotWidthMm: 35000,
    plotDepthMm: 30000,
    setbacksMm: { front: 4000, rear: 3000, left: 3000, right: 3000 },
    roadFacing: 'north',
  };

  const planned = planDeterministicApartment({
    site: siteConfig,
    flatsPerFloor: 2,
    unitMix: [
      { unitType: '2BHK', count: 1, carpetAreaSqFt: 850 },
      { unitType: '3BHK', count: 1, carpetAreaSqFt: 1200 },
    ],
    commonCore: {
      passengerLifts: 2,
      staircaseCount: 2,
      commonLobby: true,
    },
    strategy: 'balanced',
    seed: 42,
  });

  if (!planned.success || !planned.structuralRepresentation) {
    console.error('FAILED: Deterministic planner failed to generate layout.');
    process.exit(1);
  }

  console.log(`✓ Deterministic layout generated successfully.`);
  console.log(`  Flats: ${planned.schematic.units.length}, Core bounds: ${JSON.stringify(planned.structuralRepresentation.commonCore.bounds)}`);

  // ─── 2. Build Authoritative Manifest ─────────────────────────────────────
  console.log('\n[Step 2/8] Constructing authoritative ApartmentGenerationManifest...');
  const rulesProfile = getApartmentRulesProfile('pune_pmc', {
    floorCount: 1,
    buildingHeightM: 3.1,
    tenementsPerFloor: 2,
  });

  const manifest = buildApartmentGenerationManifest({
    site: siteConfig,
    apartmentConfig: {
      projectType: 'apartment',
      jurisdiction: 'pune_pmc',
      floorCount: 1,
      flatsPerFloor: 2,
      unitMix: [
        { unitType: '2BHK', count: 1, carpetAreaSqFt: 850 },
        { unitType: '3BHK', count: 1, carpetAreaSqFt: 1200 },
      ],
      commonCore: {
        passengerLifts: 2,
        serviceLifts: 0,
        staircaseCount: 2,
        fireStaircaseRequired: true,
        commonLobby: true,
      },
      parking: {
        residentParkingCount: 4,
        visitorParkingCount: 2,
      },
      amenities: {
        groundSiteAmenities: [],
        buildingAmenities: [],
      },
    },
    rulesProfile,
    currentFloorIndex: 1,
  });

  console.log(`✓ Manifest built: exact unit count = ${manifest.units.exactCount}`);

  // ─── 3. Render High-Resolution Structural Reference PNG ──────────────────
  console.log('\n[Step 3/8] Rendering high-resolution structural reference PNG via renderStructuralPlan...');
  const structuralRender = renderStructuralPlan(planned.structuralRepresentation, {
    targetLongSidePx: 2048,
    minShortSidePx: 1536,
  });

  const structuralPngPath = path.join(outDir, 'structural_reference.png');
  const structuralSvgPath = path.join(outDir, 'structural_reference.svg');
  fs.writeFileSync(structuralPngPath, structuralRender.png);
  fs.writeFileSync(structuralSvgPath, structuralRender.svg, 'utf8');

  console.log(`✓ High-resolution structural reference rendered:`);
  console.log(`  Dimensions: ${structuralRender.width} x ${structuralRender.height}`);
  console.log(`  PNG Size: ${structuralRender.png.length} bytes`);
  console.log(`  SHA-256 Hash: ${structuralRender.hash}`);
  console.log(`  Saved to: ${structuralPngPath}`);

  // ─── 4. Load Genuine Style References ────────────────────────────────────
  console.log('\n[Step 4/8] Loading available genuine style references...');
  const refBucketDir = path.resolve(process.cwd(), 'packages/backend/data/reference-images/buckets/flats_2/normalized_512');
  const genuineRefs: ReferenceImageInput[] = [];

  if (fs.existsSync(refBucketDir)) {
    const files = fs.readdirSync(refBucketDir).filter(f => f.endsWith('.png')).sort();
    for (const f of files.slice(0, 2)) {
      const buf = fs.readFileSync(path.join(refBucketDir, f));
      genuineRefs.push({
        id: `ref_${f.replace(/\.[^/.]+$/, '')}`,
        name: f,
        base64Data: buf.toString('base64'),
        mimeType: 'image/png',
      });
    }
  }

  console.log(`✓ Loaded ${genuineRefs.length} genuine style references (no duplication).`);

  // Assemble references with structural PNG as primary Input 1
  const allReferences: ReferenceImageInput[] = [
    {
      id: 'structural_reference',
      name: 'structural_reference.png',
      base64Data: structuralRender.png.toString('base64'),
      mimeType: 'image/png',
    },
    ...genuineRefs,
  ];

  // ─── 5. Compile Gemini Image Generation Request ──────────────────────────
  console.log('\n[Step 5/8] Compiling Gemini FloorPlanImagePromptRequest...');
  const buildingSite = createBuilding({
    projectId: 'gemini_smoke_proj',
    name: 'Gemini Smoke Test',
    site: {
      plotWidth: siteConfig.plotWidthMm,
      plotDepth: siteConfig.plotDepthMm,
      plannedFloorCount: 1,
      roadFacing: 'north',
      setbacks: siteConfig.setbacksMm,
      orientation: 0,
    },
    floors: [{ buildingId: 'gemini_smoke_proj', level: 0 }],
  }).site;

  const promptRequest: FloorPlanImagePromptRequest = compileApartmentFloorPlanImagePrompt({
    projectId: 'gemini_smoke_proj',
    projectName: 'Gemini Smoke Project',
    site: buildingSite,
    apartmentConfig: {
      projectType: 'apartment',
      jurisdiction: 'pune_pmc',
      flatsPerFloor: 2,
      floorCount: 1,
      unitMix: [
        { unitType: '2BHK', count: 1, carpetAreaSqFt: 850 },
        { unitType: '3BHK', count: 1, carpetAreaSqFt: 1200 },
      ],
      commonCore: {
        passengerLifts: 2,
        serviceLifts: 0,
        staircaseCount: 2,
        fireStaircaseRequired: true,
        commonLobby: true,
      },
      parking: {
        residentParkingCount: 4,
        visitorParkingCount: 2,
      },
      amenities: {
        groundSiteAmenities: [],
        buildingAmenities: [],
      },
    },
    manifest,
    seed: 42,
    referenceImages: allReferences,
  });

  // ─── 6. Call Gemini 3 Pro Image Provider ─────────────────────────────────
  console.log('\n[Step 6/8] Executing Gemini 3 Pro Image generation...');
  const imageProvider = new GeminiImageProvider({
    apiKey,
    model: imageModel,
    imageSize,
    timeoutMs: 120_000,
  });

  let generatedImageBytes: Buffer | null = null;
  let generatedMimeType = 'image/png';
  let apiSuccess = false;
  let apiFailureReason: string | undefined;

  const t0 = Date.now();
  try {
    const result = await imageProvider.generateFloorPlan(promptRequest);
    const latency = ((Date.now() - t0) / 1000).toFixed(2);
    apiSuccess = true;
    generatedImageBytes = Buffer.from(result.imageBase64, 'base64');
    generatedMimeType = result.mimeType;

    const candidateImagePath = path.join(outDir, 'gemini_3_pro_image_candidate.png');
    fs.writeFileSync(candidateImagePath, generatedImageBytes);
    console.log(`✓ Gemini Image Generation SUCCEEDED in ${latency}s!`);
    console.log(`  Saved generated candidate to: ${candidateImagePath}`);
    console.log(`  Payload size: ${generatedImageBytes.length} bytes`);
  } catch (err: any) {
    const latency = ((Date.now() - t0) / 1000).toFixed(2);
    apiFailureReason = err.message || String(err);
    console.warn(`! Gemini Image API Call returned in ${latency}s:`);
    console.warn(`  Code: ${err.code ?? 'ERROR'}`);
    console.warn(`  Detail: ${apiFailureReason}`);
  }

  // ─── 7. Run Gemini Vision Plan Interpretation ────────────────────────────
  console.log('\n[Step 7/8] Running Gemini Vision Plan Interpretation...');
  const visionProvider = new GeminiProvider({
    apiKey,
    model: 'gemini-3.6-flash',
    timeoutMs: 30_000,
  });

  // Target image for interpretation: generated image if available, else high-res structural reference
  const imageToInterpret = generatedImageBytes ?? structuralRender.png;
  const imageSourceLabel = generatedImageBytes ? 'Gemini Generated Candidate' : 'Structural Reference Baseline';
  console.log(`Interpreting image (${imageSourceLabel}, ${imageToInterpret.length} bytes)...`);

  let visionResult: any = null;
  let interpretationSuccess = false;
  let interpretationError: string | undefined;

  try {
    visionResult = await interpretPlanImageWithGemini(visionProvider, {
      plotWidthMm: siteConfig.plotWidthMm,
      plotDepthMm: siteConfig.plotDepthMm,
      roadFacing: 'north',
      orientationDegrees: 0,
      userPrompt: '2-flat apartment floor plan',
      imageBase64: imageToInterpret.toString('base64'),
      imageMimeType: generatedMimeType as any,
      apartmentContext: apartmentInterpretationContextFromManifest(manifest),
      requirements: {
        plotWidthMm: siteConfig.plotWidthMm,
        plotDepthMm: siteConfig.plotDepthMm,
        roadFacing: 'north',
        unitMix: [
          { unitType: '2BHK', count: 1 },
          { unitType: '3BHK', count: 1 },
        ],
      },
    });

    interpretationSuccess = true;
    console.log(`✓ Gemini Vision Interpretation SUCCEEDED!`);
    console.log(`  Detected units: ${Array.isArray(visionResult.parsed?.units) ? visionResult.parsed.units.length : 'unknown'}`);
    console.log(`  Detected rooms: ${Array.isArray(visionResult.parsed?.rooms) ? visionResult.parsed.rooms.length : 'unknown'}`);
  } catch (err: any) {
    interpretationError = err.message || String(err);
    console.warn(`! Vision Interpretation error: ${interpretationError}`);
  }

  // ─── 8. Deterministic Hard Validation ────────────────────────────────────
  console.log('\n[Step 8/8] Executing Deterministic Hard Validation...');
  let hardValidationResult: any = null;
  let hardValidationPassed = false;

  if (visionResult?.parsed) {
    const spec = normalizeDesignRequirementSpecification({
      hard: {
        plotWidthMm: siteConfig.plotWidthMm,
        plotDepthMm: siteConfig.plotDepthMm,
        bedroomCount: 5, // 2BHK (2) + 3BHK (3) = 5 bedrooms
        bathroomCount: 4,
        roadFacing: 'north',
        floorsCount: 1,
      },
      soft: {},
      rawUserPrompt: '2-flat apartment layout',
    });

    hardValidationResult = await runExtractionPipeline({
      projectId: 'gemini_smoke_proj',
      projectName: 'Gemini Smoke Project',
      requirements: spec,
      imageWidePixels: structuralRender.width,
      imageTallPixels: structuralRender.height,
      payload: visionResult.parsed,
      extractionSource: 'gemini_vision',
      confidence: 'high',
      interpretationSource: 'provider',
      isApartment: true,
      apartmentManifest: manifest,
      coordinateFrame: visionResult.coordinateFrame.kind === 'normalized'
        ? { width: visionResult.coordinateFrame.width, height: visionResult.coordinateFrame.height }
        : undefined,
    });

    hardValidationPassed = hardValidationResult.status === 'ACCEPTED' && hardValidationResult.building !== null;
    console.log(`✓ Extraction pipeline status: ${hardValidationResult.status}`);
    if (hardValidationResult.validation) {
      console.log(`  Validation isValid: ${hardValidationResult.validation.isValid}`);
      console.log(`  Issues count: ${hardValidationResult.validation.verificationIssues.length}`);
    }
  } else {
    console.log(`- Hard validation skipped because vision interpretation was unavailable.`);
  }

  // ─── SUMMARY REPORT ──────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log('CRITICAL ACCEPTANCE REPORT SUMMARY');
  console.log('================================================================');
  console.log(`- API Success: ${apiSuccess ? 'PASS' : 'FAIL / QUOTA LIMIT'}`);
  if (apiFailureReason) console.log(`  API Error Detail: ${apiFailureReason}`);
  console.log(`- Image Decode Success: ${Boolean(generatedImageBytes)}`);
  console.log(`- Interpretation Success: ${interpretationSuccess ? 'PASS' : 'FAIL'}`);
  if (interpretationError) console.log(`  Interpretation Error: ${interpretationError}`);
  console.log(`- Hard Validation Result: ${hardValidationPassed ? 'ACCEPTED' : 'REJECTED'}`);
  console.log(`- Model Used: ${imageModel}`);
  console.log(`- Resolution: ${imageSize} (Structural Reference: ${structuralRender.width}x${structuralRender.height})`);
  console.log(`- Structural SHA-256 Hash: ${structuralRender.hash}`);
  console.log(`- References Attached: ${allReferences.length} (1 Structural + ${genuineRefs.length} Style)`);
  console.log(`- Structural Reference Path: ${structuralPngPath}`);
  console.log('================================================================\n');

  const summaryData = {
    timestamp: new Date().toISOString(),
    apiSuccess,
    apiFailureReason: apiFailureReason ?? null,
    imageDecodeSuccess: Boolean(generatedImageBytes),
    interpretationSuccess,
    interpretationError: interpretationError ?? null,
    hardValidationPassed,
    model: imageModel,
    resolution: imageSize,
    structuralHash: structuralRender.hash,
    referencesAttached: allReferences.map(r => r.id),
    structuralReferencePath: structuralPngPath,
  };

  fs.writeFileSync(
    path.join(outDir, 'gemini_smoke_summary.json'),
    JSON.stringify(summaryData, null, 2),
    'utf8'
  );
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
