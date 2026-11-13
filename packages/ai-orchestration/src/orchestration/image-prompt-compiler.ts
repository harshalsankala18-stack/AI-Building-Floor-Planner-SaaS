/**
 * Image Prompt Compiler — Master PRD Phase 1C foundation.
 *
 * A DETERMINISTIC service that converts the canonical requirement spec, the
 * canonical Site, the reviewed Space Program and the user's free-text brief into
 * a single, reproducible image-generation request. This is the ONLY place a
 * floor-plan image prompt is assembled (Master PRD §14 forbids building prompt
 * strings ad hoc in multiple UI components).
 *
 * Boundary discipline:
 *  - This compiler produces the REQUEST only. It performs no network call.
 *  - The FLUX image model (Phase 2) generates the visual concept; it is NOT the
 *    CAD engine, geometry validator or source of truth (Master PRD §5 / §7).
 *  - The deterministic system remains responsible for feasibility, geometry and
 *    validation; Gemini (AI #2) is responsible for understanding/evaluation.
 *
 * Determinism contract (Master PRD §17):
 *      same input + same seed   => byte-identical request
 *      same input + new seed    => different candidate possibility
 */

import type {
  DesignRequirementSpecification,
  Site,
  SpaceProgram,
} from '@ai-floor-planner/core';
import type { ApartmentBriefConfig } from '../types/apartment.js';
import {
  type ApartmentGenerationManifest,
  type ApartmentUnitManifestItem,
  buildApartmentGenerationManifest,
} from '../apartment/manifest.js';
import { computeAspectAdaptedDimensions } from './aspect-ratio.js';
import type { ReferenceSelectionDiagnostics } from '../apartment/reference-library.js';

/** Bump when the prompt template changes so persisted artifacts stay reproducible. */
export const FLOOR_PLAN_PROMPT_VERSION = 3 as const;

function computeDeterministicHashHex(input: string): string {
  // Deterministic 64-char hex digest (compatible across Node and browser runtimes)
  const seeds = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35, 0x27d4eb2f, 0x165667b1, 0xd3a2646c, 0xfd7046c5];
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    for (let s = 0; s < seeds.length; s++) {
      seeds[s] = Math.imul(seeds[s]! ^ (code + s * 31), 0x01000193) >>> 0;
    }
  }
  return seeds.map(v => v.toString(16).padStart(8, '0')).join('');
}

export interface FloorPlanImagePromptInput {
  /** Canonical requirement spec (the PRD's "AiDesignSpec"). */
  readonly requirements: DesignRequirementSpecification;
  /** Canonical site; authoritative for plot size, setbacks and orientation. */
  readonly site: Site;
  /** Reviewed Space Program; supplies the room schedule when available. */
  readonly program?: SpaceProgram;
  /** Additional natural-language requirements (defaults to spec.rawUserPrompt). */
  readonly additionalPrompt?: string;
  /** Deterministic candidate seed. */
  readonly seed: number;
  /** Output image width in px (defaults to plot-derived aspect dimension). */
  readonly width?: number;
  /** Output image height in px (defaults to plot-derived aspect dimension). */
  readonly height?: number;
  /** Multi-reference image inputs (§3). */
  readonly referenceImages?: readonly ReferenceImageInput[];
  /** Structured reference selection and drop diagnostics (Phase 2 recovery). */
  readonly referenceDiagnostics?: ReferenceSelectionDiagnostics;
  /** Desired building footprint shape (e.g., Rectangular, L-shaped, U-shaped, Courtyard, Stepped). */
  readonly footprintShape?: string;
  /** Desired main entrance location / orientation. */
  readonly entranceLocation?: string;
  /** Desired architectural style. */
  readonly architecturalStyle?: string;
  /** Deterministic fingerprint of the project requirements. */
  readonly projectRequirementsFingerprint?: string;
  /** Configured image model name for provenance tracking. */
  readonly imageModel?: string;
  /** 1-based generation attempt index within the bounded retry loop. */
  readonly generationAttempt?: number;
  /** Structured correction feedback from the preceding attempt's evaluation. */
  readonly correctionFeedback?: string;
}

export interface ReferenceImageInput {
  readonly id: string;
  readonly name: string;
  readonly base64Data: string;
  readonly mimeType?: string;
}

export interface FloorPlanImagePromptRequest {
  readonly schemaVersion: 1;
  readonly promptVersion: number;
  readonly prompt: string;
  readonly negativePrompt: string;
  readonly seed: number;
  readonly width: number;
  readonly height: number;
  /** Multi-reference image inputs (§3). */
  readonly referenceImages?: readonly ReferenceImageInput[];
  /** Structured reference selection and drop diagnostics (Phase 2 recovery). */
  readonly referenceDiagnostics?: ReferenceSelectionDiagnostics;
  /** Reproducibility + persistence metadata (PRD §17 / §18 & Phase 2C.3). */
  readonly metadata: {
    readonly projectId?: string;
    readonly projectName: string;
    readonly plotWidthMm: number;
    readonly plotDepthMm: number;
    readonly floorsCount: number;
    readonly roadFacing: string;
    readonly projectType?: 'apartment' | 'residential_independent';
    readonly apartmentConfig?: unknown;
    readonly manifest?: unknown;
    readonly referenceDiagnostics?: ReferenceSelectionDiagnostics;
    readonly structuralRepresentationHash?: string;
    readonly promptVersion?: number;
    readonly promptHash?: string;
    readonly projectRequirementsFingerprint?: string;
    readonly selectedReferenceImageIds?: readonly string[];
    readonly imageModel?: string;
    readonly generationAttempt?: number;
    readonly correctionFeedback?: string;
    readonly promptPreview?: string;
  };
}

/** Negative prompt guards against non-plan imagery and multi-unit apartment contamination. */
const NEGATIVE_PROMPT =
  'perspective, 3d render, photorealistic, isometric, furniture, landscaping, people, ' +
  'cars, textures, shadows, artistic, watercolor, decorative, blurry, colored photo, ' +
  'multi-unit apartment block, elevator core lobby, commercial office';

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Build the comma-separated room schedule from the reviewed program, else the brief. */
function buildRoomSchedule(input: FloorPlanImagePromptInput): string {
  const { requirements, program } = input;
  const hard = requirements.hard;
  const soft = requirements.soft;

  if (program && program.items.length > 0) {
    const parts = program.items
      .filter(item => item.quantity > 0)
      .map(item => {
        const m2 = (item.preferredAreaMm2 / 1e6).toFixed(1);
        return item.quantity > 1
          ? `${item.quantity} x ${item.name} (~${m2} m2 each)`
          : `${item.name} (~${m2} m2)`;
      });
    if (parts.length > 0) return parts.join(', ');
  }

  // Derive a deterministic schedule from the hard/soft brief.
  const parts: string[] = [];
  if (hard.bedroomCount > 0) parts.push(`${hard.bedroomCount} bedroom(s)`);
  if (hard.bathroomCount > 0) {
    const attached = soft.attachedBathroomsCount > 0 ? ` (${soft.attachedBathroomsCount} attached en-suite)` : '';
    parts.push(`${hard.bathroomCount} bathroom(s)${attached}`);
  }
  if (hard.livingRoomRequired) parts.push('living room');
  if (hard.kitchenRequired) parts.push(soft.openKitchen ? 'open kitchen' : 'kitchen');
  if (hard.diningRoomRequired) parts.push('dining room');
  if (hard.serviceYardRequired) parts.push('utility / wash area');
  if (hard.staircaseRequired || hard.floorsCount > 1) parts.push('internal staircase');
  if (hard.liftRequired) parts.push('residential lift');
  if (soft.poojaRoom) parts.push('pooja room');
  if (soft.studyRoom) parts.push('study room');
  if (soft.servantQuarter) parts.push('servant quarter');
  if (soft.balconyPreferred) parts.push('balcony / verandah');
  for (const custom of hard.customRooms ?? []) {
    parts.push(`${custom.count} x ${custom.name ?? String(custom.type)}`);
  }
  return parts.join(', ');
}

function inferFootprintShape(input: FloorPlanImagePromptInput, brief: string): string {
  const explicit = input.footprintShape ?? (input.requirements as any).footprintShape;
  if (typeof explicit === 'string' && explicit.trim().length > 0) {
    return explicit.trim();
  }
  const lower = brief.toLowerCase();
  if (/\bl[-\s]?shape/i.test(lower)) return 'L-shaped';
  if (/\bu[-\s]?shape/i.test(lower)) return 'U-shaped';
  if (/\bcourtyard\b/i.test(lower)) return 'Courtyard-centered';
  if (/\bstepped\b/i.test(lower)) return 'Stepped / articulated';
  if (/\bt[-\s]?shape/i.test(lower)) return 'T-shaped';
  if (/\bh[-\s]?shape/i.test(lower)) return 'H-shaped';
  return String(input.site.plotShape || input.requirements.plotShape || 'rectangular');
}

/**
 * Compile the deterministic villa / independent residence floor-plan image-generation request.
 * Incorporates complete structured project data (Phase 2C.1), professional drafting presentation
 * rules (Phase 2C.2), and full prompt versioning & provenance metadata (Phase 2C.3).
 */
export function compileFloorPlanImagePrompt(
  input: FloorPlanImagePromptInput,
): FloorPlanImagePromptRequest {
  const { requirements, site } = input;
  const { hard, soft } = requirements;
  const { setbacks } = site;

  // Derive width/height from plot aspect ratio (Phase 2 recovery, P3/P9)
  const aspect = computeAspectAdaptedDimensions(site.plotWidth / 1000, site.plotDepth / 1000);
  const width = input.width ?? aspect.width;
  const height = input.height ?? aspect.height;
  const seed = input.seed;

  const plotWidthM = (site.plotWidth / 1000).toFixed(2);
  const plotDepthM = (site.plotDepth / 1000).toFixed(2);
  const floors = Math.max(1, hard.floorsCount);
  const floorLabel =
    floors === 1
      ? 'single-storey ground floor'
      : floors === 2
        ? '2-storey (G+1: Ground Floor + First Floor)'
        : `${floors}-storey`;

  const brief = (input.additionalPrompt ?? requirements.rawUserPrompt ?? '').trim();
  const roomSchedule = buildRoomSchedule(input);
  const footprintShape = inferFootprintShape(input, brief);
  const siteShape = String(site.plotShape || requirements.plotShape || 'rectangular');
  const northDeg = site.orientation ?? requirements.orientationDegrees ?? 0;
  const entranceSpec =
    input.entranceLocation?.trim() ||
    `${titleCase(site.roadFacing)}-facing main arrival foyer${soft.vastuCompliance ? ' (Vastu auspicious entry)' : ''}`;

  const relationshipDirectives: string[] = [
    'Public arrival sequence: Road -> Entrance Porch/Foyer -> Living Room -> Dining Room -> Kitchen.',
    'Private zone: Bedrooms grouped with direct access to en-suite/common bathrooms, buffered from main public entry.',
  ];
  if (hard.kitchenRequired && hard.diningRoomRequired) {
    relationshipDirectives.push('Kitchen directly adjacent to Dining Room' + (hard.serviceYardRequired ? ' with attached Utility/Wash area.' : '.'));
  }
  if (floors > 1 || hard.staircaseRequired) {
    relationshipDirectives.push('Staircase accessible from Foyer/Living circulation lobby with aligned vertical core across Ground Floor and First Floor.');
  }

  const environmentalAndZoningLines: string[] = [];
  if (soft.vastuCompliance) {
    environmentalAndZoningLines.push(
      'VASTU PREFERENCES: Vastu Shastra compliant zoning (Kitchen in SE/NW, Master Bedroom in SW, Living/Entrance in N/NE/E, Pooja in NE, Staircase in S/SW/W).',
    );
  }
  if (soft.naturalLightPreference) {
    environmentalAndZoningLines.push(
      `DAYLIGHT & VENTILATION: ${titleCase(String(soft.naturalLightPreference))} natural daylighting and cross-ventilation via exterior windows${/\bots\b|courtyard/i.test(brief) ? ' and OTS ventilation shaft' : ''}.`,
    );
  }
  if (input.architecturalStyle?.trim()) {
    environmentalAndZoningLines.push(`ARCHITECTURAL STYLE: ${input.architecturalStyle.trim()}.`);
  }

  // Filter out any multi-unit apartment reference images if inadvertently passed to villa compiler
  const validVillaRefs = (input.referenceImages ?? []).filter(
    r => !/apartment|multi_unit|flats_\d/i.test(r.id) && !/apartment|multi_unit|flats_\d/i.test(r.name),
  );

  const directiveLines = [
    'Generate ONE professional top-down 2D residential floor plan (single-family villa / independent residence).',
    '',
    `PROJECT: ${requirements.projectName}, ${floorLabel}.`,
    `BUILDING TYPE: Single-family independent residential villa (${hard.bedroomCount} BHK, ${hard.bathroomCount} Bath, ${floors} floor(s)).`,
    `PLOT PROPORTIONS: ${plotWidthM}m (width) x ${plotDepthM}m (depth), site shape ${siteShape}, road facing ${titleCase(site.roadFacing)}, North direction ${northDeg} deg.`,
    `SETBACKS: front ${setbacks.front}mm, rear ${setbacks.rear}mm, left ${setbacks.left}mm, right ${setbacks.right}mm.`,
    `FOOTPRINT SHAPE: ${footprintShape} building footprint within the buildable setback envelope.`,
    `ENTRANCE LOCATION: ${entranceSpec}.`,
    `ROOM PROGRAM: ${roomSchedule || 'standard residential layout'}.`,
    ...(hard.parkingRequired && hard.parkingSpacesCount > 0
      ? [`PARKING: dedicated parking for ${hard.parkingSpacesCount} car(s) at front/roadside setback bay.`]
      : []),
    `ROOM RELATIONSHIPS: ${relationshipDirectives.join(' ')}`,
    ...environmentalAndZoningLines,
    ...(brief.length > 0 ? [`ADDITIONAL BRIEF: ${brief}`] : []),
    ...(input.correctionFeedback?.trim()
      ? [`RETRY CORRECTION FEEDBACK (Attempt #${input.generationAttempt ?? 2}): ${input.correctionFeedback.trim()}`]
      : []),
    '',
    'MANDATORY DIRECTIVES:',
    '- Top-down orthographic 2D architectural drafting, crisp black linework on pure white background.',
    '- Consistent wall thickness representation (thicker external walls, thinner internal partitions) and distinct room boundaries.',
    '- Recognizable doors with clear door swing arcs, and clear window positions on exterior walls.',
    '- Proper staircase representation with tread lines and UP/DN directional arrows.',
    '- Logical circulation, appropriate space proportions, and distinct outdoor/semi-open spaces (parking, balcony, verandah, OTS).',
    ...(floors > 1
      ? [
          `- MULTI-FLOOR PRESENTATION: Render ONE master architectural sheet containing independently identifiable, clearly separated GROUND FLOOR PLAN and FIRST FLOOR PLAN drawings (${floors} levels total). Never omit the upper floor.`,
        ]
      : []),
    '- English architectural labels only (LIVING, DINING, KITCHEN, BEDROOM, BATH, FOYER, PARKING, BALCONY, STAIR, UTILITY, POOJA).',
    '- Do not invent exact technical dimensions, certifications, or building-code approvals; exact dimensions are generated from validated CAD geometry.',
    ...(validVillaRefs.length > 0
      ? ['- Use the supplied reference images for visual drafting style only. Current project requirements always override references.']
      : []),
    '',
    'STRICT PROHIBITIONS:',
    'Do not use 3D, perspective, shadows, photorealism, furniture clutter, artistic textures, multi-unit apartment layouts, or non-Latin text.',
  ];

  const prompt = directiveLines.join('\n');
  const promptHash = computeDeterministicHashHex(prompt);
  const projectRequirementsFingerprint =
    input.projectRequirementsFingerprint ??
    `fp_${computeDeterministicHashHex(
      JSON.stringify({
        hard: requirements.hard,
        soft: requirements.soft,
        plotWidth: site.plotWidth,
        plotDepth: site.plotDepth,
        roadFacing: site.roadFacing,
        setbacks: site.setbacks,
        footprintShape,
        brief,
      }),
    ).slice(0, 16)}`;
  const selectedReferenceImageIds = validVillaRefs.map(r => r.id);

  return {
    schemaVersion: 1,
    promptVersion: FLOOR_PLAN_PROMPT_VERSION,
    prompt,
    negativePrompt: NEGATIVE_PROMPT,
    seed,
    width,
    height,
    referenceImages: validVillaRefs.length > 0 ? validVillaRefs : undefined,
    referenceDiagnostics: input.referenceDiagnostics,
    metadata: {
      ...(requirements.projectId ? { projectId: requirements.projectId } : {}),
      projectName: requirements.projectName,
      plotWidthMm: site.plotWidth,
      plotDepthMm: site.plotDepth,
      floorsCount: floors,
      roadFacing: site.roadFacing,
      projectType: 'residential_independent',
      referenceDiagnostics: input.referenceDiagnostics,
      promptVersion: FLOOR_PLAN_PROMPT_VERSION,
      promptHash,
      projectRequirementsFingerprint,
      selectedReferenceImageIds,
      ...(input.imageModel ? { imageModel: input.imageModel } : {}),
      generationAttempt: input.generationAttempt ?? 1,
      ...(input.correctionFeedback ? { correctionFeedback: input.correctionFeedback } : {}),
      promptPreview: prompt,
    },
  };
}

/** Negative prompt guards specifically against non-plan imagery for apartment generation (§19, §36). */
export const APARTMENT_NEGATIVE_PROMPT =
  'NO VILLA, NO SINGLE FAMILY HOUSE, NO EXTRA FLATS, NO MISSING FLATS, NO MERGED FLATS, ' +
  'NO WRONG UNIT MIX, NO EXTRA BEDROOMS, NO MISSING BEDROOMS, NO EXTRA LIFTS, NO MISSING LIFTS, ' +
  'NO EXTRA STAIRS, NO MISSING STAIRS, NO RANDOM CORE, NO RANDOM AMENITIES, NO RANDOM ROOMS, ' +
  'NO CYRILLIC, NO RUSSIAN, NO NON-LATIN SCRIPT, NO GIBBERISH, NO PSEUDO-TEXT, NO RANDOM NUMBERS, ' +
  'NO WATERMARK, NO LOGO, NO 3D, NO PERSPECTIVE, NO PHOTOREALISTIC INTERIOR, NO HAND DRAWING, ' +
  'NO ARTISTIC RENDERING, NO DISTORTED WALLS, NO OVERLAPPING FLATS, NO FLOATING WALLS';

export interface ApartmentFloorPlanImagePromptInput {
  readonly projectId?: string;
  readonly projectName?: string;
  readonly site: Site;
  readonly apartmentConfig: ApartmentBriefConfig;
  readonly manifest?: ApartmentGenerationManifest;
  readonly additionalPrompt?: string;
  readonly seed: number;
  readonly width?: number;
  readonly height?: number;
  readonly referenceImages?: readonly ReferenceImageInput[];
  readonly referenceDiagnostics?: ReferenceSelectionDiagnostics;
  /**
   * Concept mode (two-phase upgrade): the first reference image is this
   * candidate's deterministic schematic; the strategy line explains its intent.
   */
  readonly concept?: {
    readonly candidateNumber: number;
    readonly candidateCount: number;
    readonly label: string;
    readonly intent: string;
  };
}

/** Room / core words shared by the FLUX scaffold (flux_concept render mode) and the concept prompt. */
export const APARTMENT_CONCEPT_ROOM_WORDS = ['LIVING', 'DINING', 'KITCHEN', 'BEDROOM', 'BATH', 'UTILITY', 'FOYER'] as const;
export const APARTMENT_CONCEPT_CORE_WORDS = ['LIFT', 'STAIR', 'LOBBY'] as const;

/**
 * Phase 2 short-label strategy: the ONLY words FLUX is asked to write, derived
 * from the manifest (flat labels + unit types) plus the fixed room/core words.
 * Everything else (dressing, passage, balcony, duct, dimensions) is geometry only.
 */
export function apartmentConceptLabelVocabulary(manifest: ApartmentGenerationManifest): string[] {
  const flats = manifest.units.units.map((u: ApartmentUnitManifestItem) => u.label.toUpperCase());
  const types = [...new Set(manifest.units.units.map((u: ApartmentUnitManifestItem) => u.type.toUpperCase()))];
  return [...flats, ...types, ...APARTMENT_CONCEPT_ROOM_WORDS, ...APARTMENT_CONCEPT_CORE_WORDS];
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * Compact concept prompt (Phase 2): the deterministic layout (input image 1) is the
 * primary structural reference, the user references are style/planning language only,
 * and FLUX is asked for a short fixed label vocabulary instead of long text.
 * Every value comes from the manifest; nothing is hard-coded to one scenario.
 */
function compileApartmentConceptPrompt(
  manifest: ApartmentGenerationManifest,
  concept: NonNullable<ApartmentFloorPlanImagePromptInput['concept']>,
  styleReferenceCount: number,
): string {
  const flats = manifest.units.units
    .map((u: ApartmentUnitManifestItem) => {
      const rooms = [
        plural(u.bedrooms, 'bedroom', 'bedrooms'),
        plural(u.bathrooms, 'bath', 'baths'),
        ...(u.livingRooms > 0 ? ['living'] : []),
        ...(u.diningRooms > 0 ? ['dining'] : []),
        ...(u.kitchens > 0 ? ['kitchen'] : []),
        ...(u.utilities > 0 ? ['utility'] : []),
      ];
      return `${u.label.toUpperCase()} ${u.type.toUpperCase()} = ${rooms.join(', ')}`;
    })
    .join('; ');
  const refLine =
    styleReferenceCount === 0
      ? []
      : [
          `${styleReferenceCount === 1 ? 'Input image 2 is a' : `Input images 2-${styleReferenceCount + 1} are`} visual style and planning-language reference${styleReferenceCount === 1 ? '' : 's'} only: never copy their flat count, geometry or text.`,
        ];
  return [
    'Generate ONE professional top-down Indian apartment floor plan: clean 2D orthographic drafting, black walls on white.',
    `CONCEPT ${String(concept.candidateNumber).padStart(2, '0')} of ${String(concept.candidateCount).padStart(2, '0')} - ${concept.label}: ${concept.intent}`,
    'Input image 1 is the deterministic layout and the primary structural reference: keep its flat boundaries, core, lifts, stairs, common lobby, room arrangement, doors and proportions.',
    ...refLine,
    'Priority: user requirements > deterministic layout > reference style.',
    `EXACTLY ${manifest.units.exactCount} flats: ${flats}.`,
    `Common core: EXACTLY ${manifest.commonCore.lifts} lifts (square shafts with X), EXACTLY ${manifest.commonCore.stairs} stairs (treads with a centre divider), ONE shaded common lobby touching every flat entrance.`,
    'Entry in every flat: common lobby > entrance door > foyer > living/dining > bedrooms. The lobby never opens into a bedroom or bath.',
    'Keep the architectural form natural: varied room proportions and articulated flat outlines; do not convert the layout into a rigid square grid.',
    `English labels only, short and clear, as in image 1: ${apartmentConceptLabelVocabulary(manifest).join(', ')}. No other text, no dimensions.`,
    'Do not add or remove flats, change the unit mix or the common core, or turn the project into a villa. No 3D, no perspective, no furniture, no watermark, no non-Latin text.',
  ].join('\n');
}

/**
 * Compile a specialized 2D Apartment Floor Plan Image Prompt based on the Structured Generation Manifest (§1, §17, §18).
 * Phase 2 recovery (P2, P3): Replaces long-form essay with a short, compact directive while preserving manifest metadata.
 * Adapts output canvas width and height to the plot aspect ratio.
 */
export function compileApartmentFloorPlanImagePrompt(
  input: ApartmentFloorPlanImagePromptInput,
): FloorPlanImagePromptRequest {
  const { site, apartmentConfig, seed } = input;

  // Derive width/height from plot aspect ratio (Phase 2 recovery, P3)
  const aspect = computeAspectAdaptedDimensions(site.plotWidth / 1000, site.plotDepth / 1000);
  const width = input.width ?? aspect.width;
  const height = input.height ?? aspect.height;

  // Build or use provided canonical manifest (§3)
  const manifest =
    input.manifest ??
    buildApartmentGenerationManifest({
      site: {
        plotWidthMm: site.plotWidth,
        plotDepthMm: site.plotDepth,
        setbacksMm: site.setbacks,
        roadFacing: site.roadFacing,
        orientationDegrees: site.orientation,
      },
      apartmentConfig,
    });

  const floorsCount = manifest.project.floors;
  const floorStrategy = manifest.project.floorType;

  // Unit mix representation
  const unitMixParts = apartmentConfig.unitMix.map(u => `${u.count} x ${u.unitType}`);
  const unitMixDescription = unitMixParts.join(', ');

  // Compact Directive (Phase 2 recovery, P2) — replaces ~120-line prose essay
  const promptLines = [
    'CREATE ONE PROFESSIONAL 2D INDIAN APARTMENT FLOOR PLAN.',
    '',
    `PROJECT: Multi-unit residential apartment (${floorsCount} floors).`,
    `CURRENT FLOOR: ${floorStrategy.toUpperCase()} RESIDENTIAL FLOOR.`,
    `JURISDICTION: ${manifest.jurisdiction.authority} (${manifest.jurisdiction.ruleProfile}).`,
    `PLOT PROPORTIONS: ${manifest.site.widthM}m width × ${manifest.site.depthM}m depth.`,
    '',
    'REFERENCE PRIORITY:',
    '1. USER/MANIFEST REQUIREMENTS (authoritative for counts & mix)',
    '2. DETERMINISTIC SCHEMATIC (primary structural reference for layout & core)',
    '3. REFERENCE IMAGE VISUAL STYLE (architectural drafting style only)',
    '',
    'HARD REQUIREMENTS:',
    `1. Generate EXACTLY ${manifest.units.exactCount} separate residential flats (${manifest.units.units.map((u: ApartmentUnitManifestItem) => `${u.label}: ${u.type}`).join(', ')}).`,
    `2. Exact unit mix: ${unitMixDescription}. Total bedrooms across floor: ${manifest.roomTotals.bedrooms}.`,
    `3. Common core: EXACTLY ${manifest.commonCore.lifts} separate elevator shaft(s) [X], EXACTLY ${manifest.commonCore.stairs} staircase(s), common lobby and corridor.`,
    '4. Clean 2D orthographic technical drafting, crisp black architectural linework on white background.',
    '5. English only: readable English architectural labels only (FLAT, LIVING, BEDROOM, KITCHEN, BATH, BALCONY, LIFT, STAIR, COMMON LOBBY).',
    '',
    'DO NOT GENERATE:',
    'No villa, no single-family house, no extra flats, no missing flats, no merged flats. No 3D, no perspective, no photorealism, no furniture clutter, no Cyrillic or non-Latin script.',
  ];

  // Concept mode: input image 1 is the deterministic schematic; the rest are style references.
  const styleReferenceCount = (input.referenceImages ?? []).filter(r => r.id !== 'schematic_scaffold').length;
  const prompt = input.concept
    ? compileApartmentConceptPrompt(manifest, input.concept, styleReferenceCount)
    : promptLines.join('\n');

  return {
    schemaVersion: 1,
    promptVersion: FLOOR_PLAN_PROMPT_VERSION,
    prompt,
    negativePrompt: APARTMENT_NEGATIVE_PROMPT,
    seed,
    width,
    height,
    referenceImages: input.referenceImages,
    referenceDiagnostics: input.referenceDiagnostics,
    metadata: {
      projectId: input.projectId,
      projectName: input.projectName ?? 'Apartment Building Project',
      plotWidthMm: site.plotWidth,
      plotDepthMm: site.plotDepth,
      floorsCount,
      roadFacing: site.roadFacing,
      projectType: 'apartment',
      apartmentConfig,
      manifest,
      referenceDiagnostics: input.referenceDiagnostics,
    },
  };
}

