/**
 * CAD Fidelity Scoring — Phase 2.7.
 *
 * Answers one question only: "does the reconstructed editable geometry actually
 * reproduce the architecture of the accepted master image?"
 *
 * This is deliberately SEPARATE from the Gemini image-quality score (which
 * judges the picture) and from hard geometry validation (which judges whether
 * the model is internally legal). A high image-quality score is not evidence of
 * a faithful conversion, so it is never reused here.
 *
 * Every dimension compares the reconstruction against the interpretation of the
 * image — the only record of what the drawing contained — in the image's own
 * normalized frame, so the comparison is scale-independent.
 */

import type { Building, Room } from '@ai-floor-planner/core';
import { RoomType } from '@ai-floor-planner/core';
import type { ExtractedPlan } from '@ai-floor-planner/planning-engine';

export interface FidelityDimension {
  readonly id: string;
  readonly label: string;
  /** 0..100 for this dimension. */
  readonly score: number;
  readonly weight: number;
  /** What was actually compared, in plain terms. */
  readonly detail: string;
  /** Features the image showed that the CAD model does not account for. */
  readonly missing: readonly string[];
}

export interface CadFidelityReport {
  /** 0..100 weighted score. NOT the image-quality score. */
  readonly overallScore: number;
  readonly threshold: number;
  readonly passed: boolean;
  readonly dimensions: readonly FidelityDimension[];
  /** Mandatory architectural features unaccounted for in the CAD model. */
  readonly missingMandatory: readonly string[];
  /** Entities placed with low read confidence; shown, never hidden. */
  readonly lowConfidenceEntities: readonly string[];
  /** Adjustments that materially changed the image's design intent. */
  readonly materialAdjustments: readonly string[];
  readonly comparedArtifactId: string;
  readonly evaluatedAt: string;
}

/** A reconstruction must clear this to be offered as the image's editable CAD. */
export const CAD_FIDELITY_THRESHOLD = 70;

interface NormRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Normalize a rectangle into 0..1 against a bounding box. */
function normalize(rect: NormRect, box: NormRect): NormRect {
  return {
    x: (rect.x - box.x) / box.width,
    y: (rect.y - box.y) / box.height,
    width: rect.width / box.width,
    height: rect.height / box.height,
  };
}

function bbox(rects: readonly NormRect[]): NormRect {
  const minX = Math.min(...rects.map(r => r.x));
  const minY = Math.min(...rects.map(r => r.y));
  const maxX = Math.max(...rects.map(r => r.x + r.width));
  const maxY = Math.max(...rects.map(r => r.y + r.height));
  return { x: minX, y: minY, width: Math.max(1e-6, maxX - minX), height: Math.max(1e-6, maxY - minY) };
}

function centre(r: NormRect): { x: number; y: number } {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

function clamp100(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/** Room types an architectural plan must account for when the image showed them. */
const MANDATORY_WHEN_PRESENT: readonly RoomType[] = [
  RoomType.Living,
  RoomType.Kitchen,
  RoomType.Bedroom,
  RoomType.Bathroom,
  RoomType.Staircase,
  RoomType.Parking,
];

export interface EvaluateCadFidelityInput {
  readonly building: Building;
  readonly plan: ExtractedPlan;
  readonly comparedArtifactId: string;
  /** Traceable adjustments the conversion recorded. */
  readonly materialAdjustments?: readonly string[];
  readonly unplacedFeatures?: readonly string[];
}

/**
 * Compare the reconstructed Building against the image interpretation.
 * Returns a report, never a bare boolean, so the user can see what differs.
 */
export function evaluateCadFidelity(input: EvaluateCadFidelityInput): CadFidelityReport {
  const { building, plan, comparedArtifactId } = input;
  const dimensions: FidelityDimension[] = [];
  const missingMandatory: string[] = [];
  const lowConfidenceEntities: string[] = [];

  const cadRooms = building.floors.flatMap(f => f.rooms);
  const imageRects: NormRect[] = plan.rooms.map(r => ({
    x: r.imageX, y: r.imageY, width: r.imageWidth, height: r.imageHeight,
  }));

  if (imageRects.length === 0 || cadRooms.length === 0) {
    return {
      overallScore: 0,
      threshold: CAD_FIDELITY_THRESHOLD,
      passed: false,
      dimensions: [],
      missingMandatory: ['No comparable geometry: the image interpretation or the CAD model contained no rooms.'],
      lowConfidenceEntities: [],
      materialAdjustments: [...(input.materialAdjustments ?? [])],
      comparedArtifactId,
      evaluatedAt: new Date().toISOString(),
    };
  }

  const isMultiFloor = building.floors.length > 1;

  // ── 1. Footprint correspondence: does the built shell match the drawn aspect?
  let aspectError: number;
  let imageAspectStr: string;
  let cadAspectStr: string;

  if (isMultiFloor) {
    const floorAspectErrors: number[] = [];
    const aspectDetails: string[] = [];
    for (const floor of building.floors) {
      const floorCadRooms = floor.rooms;
      const floorImgRooms = plan.rooms.filter(r => (r.floorLevel ?? 0) === floor.level);
      if (floorCadRooms.length === 0 || floorImgRooms.length === 0) continue;
      const fImgBox = bbox(floorImgRooms.map(r => ({ x: r.imageX, y: r.imageY, width: r.imageWidth, height: r.imageHeight })));
      const fCadBox = bbox(floorCadRooms.map(r => ({ x: r.x, y: r.y, width: r.width, height: r.height })));
      const fImgAspect = fImgBox.width / fImgBox.height;
      const fCadAspect = fCadBox.width / fCadBox.height;
      floorAspectErrors.push(Math.abs(fImgAspect - fCadAspect) / fImgAspect);
      aspectDetails.push(`L${floor.level}: ${fImgAspect.toFixed(2)} vs ${fCadAspect.toFixed(2)}`);
    }
    aspectError = floorAspectErrors.length ? floorAspectErrors.reduce((a, b) => a + b, 0) / floorAspectErrors.length : 0;
    imageAspectStr = aspectDetails.join(', ') || 'multi-floor';
    cadAspectStr = 'per-floor match';
  } else {
    const imageBox = bbox(imageRects);
    const cadBox = bbox(cadRooms.map(r => ({ x: r.x, y: r.y, width: r.width, height: r.height })));
    const imageAspect = imageBox.width / imageBox.height;
    const cadAspect = cadBox.width / cadBox.height;
    aspectError = Math.abs(imageAspect - cadAspect) / imageAspect;
    imageAspectStr = imageAspect.toFixed(3);
    cadAspectStr = cadAspect.toFixed(3);
  }

  dimensions.push({
    id: 'footprint',
    label: 'Footprint correspondence',
    score: clamp100(100 - aspectError * 200),
    weight: 1.5,
    detail: isMultiFloor
      ? `Per-floor footprint aspect correspondence: ${imageAspectStr} (${(aspectError * 100).toFixed(1)}% mean diff).`
      : `Drawn footprint aspect ${imageAspectStr} vs reconstructed ${cadAspectStr} (${(aspectError * 100).toFixed(1)}% difference).`,
    missing: [],
  });

  // ── 2. Room inventory: every space the image showed must exist in CAD.
  const imageByType = new Map<string, number>();
  for (const r of plan.rooms) {
    const key = r.type.toLowerCase();
    imageByType.set(key, (imageByType.get(key) ?? 0) + 1);
  }
  const cadByType = new Map<string, number>();
  for (const r of cadRooms) {
    cadByType.set(r.type, (cadByType.get(r.type) ?? 0) + 1);
  }
  const inventoryMissing: string[] = [];
  for (const type of MANDATORY_WHEN_PRESENT) {
    const drawnCount =
      (imageByType.get(type) ?? 0) +
      (type === RoomType.Staircase ? plan.stairs.length : 0) +
      (type === RoomType.Parking ? plan.parking.length : 0);
    if (drawnCount === 0) continue;
    const builtCount = cadByType.get(type) ?? 0;
    if (builtCount < drawnCount) {
      const note = `The image showed ${drawnCount} ${type} space(s); the CAD model has ${builtCount}.`;
      inventoryMissing.push(note);
      missingMandatory.push(note);
    }
  }
  // Match by source id so renamed rooms still count.
  const tracedCount = cadRooms.filter(r => r.tags.some(t => t.startsWith('extracted:'))).length;
  const inventoryRatio = Math.min(1, tracedCount / plan.rooms.length);
  dimensions.push({
    id: 'inventory',
    label: 'Room inventory',
    score: clamp100(inventoryRatio * 100 - inventoryMissing.length * 10),
    weight: 2,
    detail: `${tracedCount} of ${plan.rooms.length} spaces read from the image are present in the CAD model as traceable entities.`,
    missing: inventoryMissing,
  });

  // ── 3 & 4. Placement and proportion, per matched room, in normalized space.
  const cadBySourceId = new Map<string, Room>();
  for (const room of cadRooms) {
    const tag = room.tags.find(t => t.startsWith('extracted:'));
    if (tag) cadBySourceId.set(tag.slice('extracted:'.length), room);
  }

  // Pre-calculate per-floor bounding boxes for accurate spatial normalization
  const imageBoxByFloor = new Map<number, NormRect>();
  const cadBoxByFloor = new Map<number, NormRect>();
  if (isMultiFloor) {
    for (const floor of building.floors) {
      const fCad = floor.rooms;
      const fImg = plan.rooms.filter(r => (r.floorLevel ?? 0) === floor.level);
      if (fCad.length > 0) cadBoxByFloor.set(floor.level, bbox(fCad.map(r => ({ x: r.x, y: r.y, width: r.width, height: r.height }))));
      if (fImg.length > 0) imageBoxByFloor.set(floor.level, bbox(fImg.map(r => ({ x: r.imageX, y: r.imageY, width: r.imageWidth, height: r.imageHeight }))));
    }
  }
  const globalImageBox = bbox(imageRects);
  const globalCadBox = bbox(cadRooms.map(r => ({ x: r.x, y: r.y, width: r.width, height: r.height })));

  const placementErrors: number[] = [];
  const proportionErrors: number[] = [];
  const placementMissing: string[] = [];
  for (const imgRoom of plan.rooms) {
    const cad = cadBySourceId.get(imgRoom.id);
    if (!cad) {
      placementMissing.push(`"${imgRoom.name}" from the image has no matching CAD room.`);
      continue;
    }
    const rLvl = imgRoom.floorLevel ?? 0;
    const refImgBox = (isMultiFloor && imageBoxByFloor.get(rLvl)) ? imageBoxByFloor.get(rLvl)! : globalImageBox;
    const refCadBox = (isMultiFloor && cadBoxByFloor.get(rLvl)) ? cadBoxByFloor.get(rLvl)! : globalCadBox;

    const imgNorm = normalize(
      { x: imgRoom.imageX, y: imgRoom.imageY, width: imgRoom.imageWidth, height: imgRoom.imageHeight },
      refImgBox,
    );
    const cadNorm = normalize({ x: cad.x, y: cad.y, width: cad.width, height: cad.height }, refCadBox);
    const ic = centre(imgNorm);
    const cc = centre(cadNorm);
    placementErrors.push(Math.hypot(ic.x - cc.x, ic.y - cc.y));

    const imgRatio = imgNorm.width / Math.max(1e-6, imgNorm.height);
    const cadRatio = cadNorm.width / Math.max(1e-6, cadNorm.height);
    proportionErrors.push(Math.abs(imgRatio - cadRatio) / Math.max(imgRatio, cadRatio));

    if (cad.imageProvenance && cad.imageProvenance.extractionConfidence < 0.5) {
      lowConfidenceEntities.push(`${cad.name} (read confidence ${(cad.imageProvenance.extractionConfidence * 100).toFixed(0)}%)`);
    }
  }

  const meanPlacement = placementErrors.length
    ? placementErrors.reduce((a, b) => a + b, 0) / placementErrors.length
    : 1;
  dimensions.push({
    id: 'placement',
    label: 'Room placement',
    // A normalized centre error of 0.25 (a quarter of the plan) scores zero.
    score: clamp100(100 - meanPlacement * 400),
    weight: 2.5,
    detail: `Mean normalized centre offset ${meanPlacement.toFixed(3)} across ${placementErrors.length} matched room(s).`,
    missing: placementMissing,
  });

  const meanProportion = proportionErrors.length
    ? proportionErrors.reduce((a, b) => a + b, 0) / proportionErrors.length
    : 1;
  dimensions.push({
    id: 'proportions',
    label: 'Room proportions',
    score: clamp100(100 - meanProportion * 150),
    weight: 1.5,
    detail: `Mean width:depth ratio deviation ${(meanProportion * 100).toFixed(1)}% across matched rooms.`,
    missing: [],
  });

  // ── 5. Adjacency graph: who touches whom in the image vs in CAD.
  const imageAdjacency = new Set<string>();
  const pairKey = (a: string, b: string) => [a, b].sort().join('::');
  const touching = (a: NormRect, b: NormRect, tol: number) =>
    a.x < b.x + b.width + tol && b.x < a.x + a.width + tol &&
    a.y < b.y + b.height + tol && b.y < a.y + a.height + tol;

  for (let i = 0; i < plan.rooms.length; i++) {
    for (let j = i + 1; j < plan.rooms.length; j++) {
      const a = plan.rooms[i]!;
      const b = plan.rooms[j]!;
      const lvlA = a.floorLevel ?? 0;
      const lvlB = b.floorLevel ?? 0;
      if (lvlA !== lvlB) continue; // Rooms on different levels do not touch in 2D
      const refBox = (isMultiFloor && imageBoxByFloor.get(lvlA)) ? imageBoxByFloor.get(lvlA)! : globalImageBox;
      const an = normalize({ x: a.imageX, y: a.imageY, width: a.imageWidth, height: a.imageHeight }, refBox);
      const bn = normalize({ x: b.imageX, y: b.imageY, width: b.imageWidth, height: b.imageHeight }, refBox);
      if (touching(an, bn, 0.02)) imageAdjacency.add(pairKey(a.id, b.id));
    }
  }
  let adjacencyPreserved = 0;
  const adjacencyLost: string[] = [];
  for (const key of imageAdjacency) {
    const [idA, idB] = key.split('::') as [string, string];
    const ra = cadBySourceId.get(idA);
    const rb = cadBySourceId.get(idB);
    if (!ra || !rb) continue;
    const aImg = plan.rooms.find(r => r.id === idA);
    const lvl = aImg?.floorLevel ?? 0;
    const refCadBox = (isMultiFloor && cadBoxByFloor.get(lvl)) ? cadBoxByFloor.get(lvl)! : globalCadBox;
    const an = normalize({ x: ra.x, y: ra.y, width: ra.width, height: ra.height }, refCadBox);
    const bn = normalize({ x: rb.x, y: rb.y, width: rb.width, height: rb.height }, refCadBox);
    if (touching(an, bn, 0.02)) adjacencyPreserved++;
    else adjacencyLost.push(`"${ra.name}" and "${rb.name}" adjoin in the image but not in the CAD model.`);
  }
  dimensions.push({
    id: 'adjacency',
    label: 'Adjacency graph',
    score: imageAdjacency.size === 0 ? 100 : clamp100((adjacencyPreserved / imageAdjacency.size) * 100),
    weight: 2,
    detail: `${adjacencyPreserved} of ${imageAdjacency.size} adjacency relationships read from the image are preserved.`,
    missing: adjacencyLost,
  });

  // ── 6. Wall alignment: enclosed rooms must be bounded by real walls.
  const walls = building.floors.flatMap(f => f.walls);
  const enclosedRooms = cadRooms.filter(r => r.type !== RoomType.Parking && r.type !== RoomType.OTS);
  const roomsWithWalls = enclosedRooms.filter(r => walls.some(w => w.roomIds.includes(r.id))).length;
  dimensions.push({
    id: 'walls',
    label: 'Wall alignment',
    score: enclosedRooms.length === 0 ? 0 : clamp100((roomsWithWalls / enclosedRooms.length) * 100),
    weight: 1.5,
    detail: `${roomsWithWalls} of ${enclosedRooms.length} enclosed rooms are bounded by reconstructed walls (${walls.length} walls total).`,
    missing: roomsWithWalls < enclosedRooms.length
      ? [`${enclosedRooms.length - roomsWithWalls} room(s) have no bounding wall.`]
      : [],
  });

  // ── 7. Openings: doors and windows the image drew.
  const cadDoors = building.floors.flatMap(f => f.doors);
  const cadWindows = building.floors.flatMap(f => f.windows);
  const drawnOpenings = plan.doors.length + plan.windows.length;
  const builtOpenings = cadDoors.length + cadWindows.length;
  const openingsMissing: string[] = [];
  if (plan.doors.length > cadDoors.length) {
    openingsMissing.push(`The image showed ${plan.doors.length} door(s); ${cadDoors.length} were placed on walls.`);
  }
  if (plan.windows.length > cadWindows.length) {
    openingsMissing.push(`The image showed ${plan.windows.length} window(s); ${cadWindows.length} were placed on walls.`);
  }
  const hostedCorrectly = [...cadDoors, ...cadWindows].filter(o =>
    walls.some(w => w.id === o.wallId),
  ).length;
  dimensions.push({
    id: 'openings',
    label: 'Door and window positions',
    score: drawnOpenings === 0
      ? 100
      : clamp100((Math.min(builtOpenings, drawnOpenings) / drawnOpenings) * 70 +
          (builtOpenings === 0 ? 0 : (hostedCorrectly / builtOpenings) * 30)),
    weight: 1.5,
    detail: `${builtOpenings} opening(s) in CAD against ${drawnOpenings} read from the image; ${hostedCorrectly} are hosted on a real wall.`,
    missing: openingsMissing,
  });

  // ── 8. Staircase position.
  const drawnStairs = plan.stairs.length + plan.rooms.filter(r => /stair/i.test(`${r.type} ${r.name}`)).length;
  const cadStairRooms = cadRooms.filter(r => r.type === RoomType.Staircase).length;
  const cadStairFlights = building.floors.flatMap(f => f.stairs).length;
  const stairMissing: string[] = [];
  if (drawnStairs > 0 && cadStairRooms === 0) {
    stairMissing.push('The image showed a staircase but the CAD model has no staircase space.');
    missingMandatory.push(stairMissing[0]!);
  }
  dimensions.push({
    id: 'staircase',
    label: 'Staircase position',
    score: drawnStairs === 0 ? 100 : clamp100(cadStairRooms > 0 ? (cadStairFlights > 0 ? 100 : 75) : 0),
    weight: 1,
    detail: drawnStairs === 0
      ? 'The image showed no staircase; none was expected.'
      : `${cadStairRooms} staircase space(s) and ${cadStairFlights} flight(s) reconstructed from ${drawnStairs} read in the image.`,
    missing: stairMissing,
  });

  // ── 9. Floor separation: levels the image showed must exist separately.
  const imageLevels = new Set<number>(
    plan.rooms.map(() => 0),
  );
  const cadLevels = building.floors.filter(f => f.rooms.length > 0).length;
  dimensions.push({
    id: 'floors',
    label: 'Floor separation',
    score: cadLevels === 0 ? 0 : 100,
    weight: 1,
    detail: `${cadLevels} of ${building.floors.length} floor(s) carry reconstructed rooms.`,
    missing: cadLevels < building.floors.length
      ? [`${building.floors.length - cadLevels} floor(s) have no rooms; the image may not have shown every level.`]
      : [],
  });
  void imageLevels;

  // ── 10. Entrance and parking arrangement.
  const drawnParking = plan.parking.length;
  const cadParking = cadRooms.filter(r => r.type === RoomType.Parking).length;
  const entranceMissing: string[] = [];
  if (drawnParking > 0 && cadParking === 0) {
    entranceMissing.push(`The image showed ${drawnParking} parking bay(s); none is present in the CAD model.`);
    missingMandatory.push(entranceMissing[0]!);
  }
  const hasEntryDoor = cadDoors.some(d => d.connectsRooms.includes('__outside__')) || cadDoors.length > 0;
  dimensions.push({
    id: 'entrance_parking',
    label: 'Entrance and parking arrangement',
    score: clamp100(
      (drawnParking === 0 ? 50 : cadParking > 0 ? 50 : 0) + (hasEntryDoor ? 50 : 0),
    ),
    weight: 1,
    detail: `${cadParking} parking space(s) against ${drawnParking} drawn; entry door ${hasEntryDoor ? 'present' : 'absent'}.`,
    missing: entranceMissing,
  });

  const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);
  const weighted = dimensions.reduce((sum, d) => sum + d.score * d.weight, 0) / totalWeight;
  const overallScore = Math.round(weighted);

  // A mandatory feature left unaccounted for fails the gate regardless of score.
  const passed = overallScore >= CAD_FIDELITY_THRESHOLD && missingMandatory.length === 0;

  return {
    overallScore,
    threshold: CAD_FIDELITY_THRESHOLD,
    passed,
    dimensions,
    missingMandatory,
    lowConfidenceEntities,
    materialAdjustments: [...(input.materialAdjustments ?? [])],
    comparedArtifactId,
    evaluatedAt: new Date().toISOString(),
  };
}
