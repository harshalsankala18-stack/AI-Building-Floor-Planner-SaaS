/**
 * AI Concept Image service — Master PRD Phase 2 (§17/§18).
 *
 * Pure, deterministic helpers connecting the canonical project state to the
 * server-side FLUX image boundary. No credentials ever exist in this file.
 *
 * Determinism (PRD §17): seeds advance by a fixed step per attempt, never
 * Math.random — the same attempt always produces the same seed, and a new
 * attempt produces a different candidate possibility.
 */

import { adaptSpaceProgramToResidentialRequirements, type Building, type DesignRequirementSpecification } from '@ai-floor-planner/core';
import { compileFloorPlanImagePrompt, type FloorPlanImagePromptRequest } from '@ai-floor-planner/ai-orchestration';
import type { ProjectEnvelope } from './storage';

/** Fixed, non-random seed step between candidate attempts (PRD §17). */
export const IMAGE_SEED_STEP = 7919;

export function nextImageSeed(baseSeed: number, attempt: number): number {
  const safeAttempt = Math.max(0, Math.trunc(attempt));
  const seed = (Math.trunc(baseSeed) + safeAttempt * IMAGE_SEED_STEP) % 2_147_483_647;
  return seed < 0 ? seed + 2_147_483_647 : seed;
}

/** The reviewed base seed for image attempts, derived from the project state. */
export function imageBaseSeed(project: ProjectEnvelope, fallback = 20260904): number {
  const candidateSeed = project.generationSession?.requestSeed;
  return Number.isFinite(candidateSeed) && (candidateSeed as number) > 0 ? candidateSeed as number : fallback;
}

/**
 * Derive the canonical requirement spec for image generation from the reviewed
 * Space Program. Returns undefined when the project has no reviewable program —
 * the UI must then say so instead of fabricating a brief.
 */
export function resolveImageRequirements(project: ProjectEnvelope): DesignRequirementSpecification | undefined {
  const program = project.spaceProgram;
  if (!program || program.items.length === 0) return undefined;
  try {
    const adapted = adaptSpaceProgramToResidentialRequirements(program, project.building);
    const base = adapted?.requirements;
    if (!base) return undefined;
    const wizardFloors = Number((project.wizardBrief as Record<string, unknown> | undefined)?.floorsCount) || 0;
    const targetFloors = Math.max(
      base.hard.floorsCount || 1,
      wizardFloors,
      project.building.site.plannedFloorCount || 1,
      project.building.floors.length || 1,
    );
    return {
      ...base,
      schemaVersion: 1,
      hard: {
        ...base.hard,
        floorsCount: targetFloors,
        staircaseRequired: targetFloors > 1 || Boolean(base.hard.staircaseRequired),
      },
    };
  } catch {
    return undefined;
  }
}

/** Compile the deterministic prompt request for one attempt, optionally with a reference concept image for instruction-based editing. */
export function compileImageRequest(
  project: ProjectEnvelope,
  attempt: number,
  optionsOrPrompt?:
    | string
    | {
        readonly editInstruction?: string;
        readonly additionalPrompt?: string;
        readonly referenceImage?: { readonly mimeType: string; readonly imageBase64: string };
      },
  referenceImageArg?: { readonly mimeType: string; readonly imageBase64: string },
): FloorPlanImagePromptRequest | undefined {
  const requirements = resolveImageRequirements(project);
  if (!requirements) return undefined;
  const additionalPrompt =
    typeof optionsOrPrompt === 'string'
      ? optionsOrPrompt
      : optionsOrPrompt?.editInstruction ?? optionsOrPrompt?.additionalPrompt;
  const referenceImage =
    typeof optionsOrPrompt === 'object' && optionsOrPrompt !== null
      ? optionsOrPrompt.referenceImage ?? referenceImageArg
      : referenceImageArg;
  const compiled = compileFloorPlanImagePrompt({
    requirements,
    site: project.building.site,
    ...(project.spaceProgram ? { program: project.spaceProgram } : {}),
    ...(additionalPrompt !== undefined ? { additionalPrompt } : {}),
    seed: nextImageSeed(imageBaseSeed(project), attempt),
  });
  if (referenceImage && referenceImage.imageBase64) {
    return {
      ...compiled,
      prompt: `${compiled.prompt}\n\nEDITING INSTRUCTIONS ON ATTACHED REFERENCE PLAN: ${additionalPrompt || 'Refine architectural proportions and room layout.'}\nPreserve the overall plot orientation and architectural drafting style while applying the requested spatial modification.`,
      referenceImages: [
        ...(compiled.referenceImages ?? []),
        {
          id: 'concept_edit_reference',
          name: 'concept_edit_reference.jpg',
          mimeType: referenceImage.mimeType as 'image/png' | 'image/jpeg',
          base64Data: referenceImage.imageBase64,
        },
      ],
    };
  }
  return compiled;
}

/** Data URL for displaying the stored original image. */
export function imageDataUrl(mimeType: string, imageBase64: string): string {
  return `data:${mimeType};base64,${imageBase64}`;
}

/** Canonical building that the image was generated from (freshness check). */
export function imageContextSignature(building: Building): string {
  return `${building.id}:${building.version}:${building.site.plotWidth}x${building.site.plotDepth}`;
}

/** Deterministic hash of requirements to detect stale/outdated image revisions (PRD Phase 2.6). */
export function computeRequirementsFingerprint(project: ProjectEnvelope): string {
  const req = resolveImageRequirements(project);
  const site = project.building.site;
  const fp = (project.wizardBrief as Record<string, unknown> | undefined)?.footprintShape || '';
  const parts = [
    site.plotWidth,
    site.plotDepth,
    site.roadFacing,
    site.plannedFloorCount ?? 1,
    site.setbacks?.front ?? 0,
    site.setbacks?.rear ?? 0,
    site.setbacks?.left ?? 0,
    site.setbacks?.right ?? 0,
    req?.hard.bedroomCount ?? 0,
    req?.hard.bathroomCount ?? 0,
    req?.hard.kitchenRequired ? 1 : 0,
    req?.hard.livingRoomRequired ? 1 : 0,
    req?.hard.parkingRequired ? 1 : 0,
    fp,
  ];
  return parts.join('|');
}
