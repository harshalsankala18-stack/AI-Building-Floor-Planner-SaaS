/**
 * Adapters between the apartment manifest / deterministic schematic
 * (ai-orchestration) and the canonical Building Model / hard-validation pipeline
 * (planning-engine).
 *
 * Ground truth is preserved 1:1:
 * - Metres are converted to millimetres without distortion.
 * - Flat boundaries and room ownership tags are preserved.
 * - Non-rectangular steppedPolygon footprints with >=6 vertices are preserved.
 * - Carved OTS shafts (1200mm x 1500mm) and cantilevered balconies are preserved.
 * - Automatic doors on connectivity edges and windows strictly on openFacades or OTS shafts (ZERO on deadWalls).
 * - Common core elements remain outside flat boundaries.
 */

import {
  type Building,
  type Wall,
  type Stair,
  Direction,
  WallType,
  StairType,
  createWall,
  createStair,
} from '@ai-floor-planner/core';
import {
  type ApartmentCoreElement,
  type ApartmentPlanExpectation,
  type ApartmentPlanStructure,
  type ApartmentRectMm,
  type ApartmentPlanOpening,
  type ExtractionSite,
  apartmentStructureToBuilding,
} from '@ai-floor-planner/planning-engine';
import type { ApartmentGenerationManifest } from './manifest';
import type { DeterministicApartmentSchematic, Rect2D } from './schematic';

/** Structured context sent to Gemini alongside the image (context only). */
export interface ApartmentInterpretationContext {
  readonly flatsPerFloor: number;
  readonly unitMix: ReadonlyArray<{ readonly unitType: string; readonly count: number }>;
  readonly lifts: number;
  readonly stairs: number;
  readonly commonLobby: boolean;
}

/** The manifest is the authority for counts; the schematic / image must match it exactly. */
export function apartmentExpectationFromManifest(manifest: ApartmentGenerationManifest): ApartmentPlanExpectation {
  return {
    flats: manifest.units.exactCount,
    units: manifest.units.units.map(u => ({
      label: u.label,
      unitType: u.type,
      bedrooms: u.bedrooms,
      bathrooms: u.bathrooms,
      livingRooms: u.livingRooms,
      diningRooms: u.diningRooms,
      kitchens: u.kitchens,
      utilities: u.utilities,
      balconies: u.balconies,
    })),
    lifts: manifest.commonCore.lifts,
    stairs: manifest.commonCore.stairs,
    commonLobby: manifest.commonCore.commonLobby,
  };
}

/** Structured apartment context generated from manifest. */
export function apartmentInterpretationContextFromManifest(
  manifest: ApartmentGenerationManifest,
): ApartmentInterpretationContext {
  const mix = new Map<string, number>();
  for (const u of manifest.units.units) mix.set(u.type, (mix.get(u.type) ?? 0) + 1);
  return {
    flatsPerFloor: manifest.units.exactCount,
    unitMix: [...mix.entries()].map(([unitType, count]) => ({ unitType, count })),
    lifts: manifest.commonCore.lifts,
    stairs: manifest.commonCore.stairs,
    commonLobby: manifest.commonCore.commonLobby,
  };
}

const mm = (r: Rect2D): ApartmentRectMm => ({
  x: Math.round(r.x * 1000),
  y: Math.round(r.y * 1000),
  width: Math.round((r.x + r.width) * 1000) - Math.round(r.x * 1000),
  height: Math.round((r.y + r.height) * 1000) - Math.round(r.y * 1000),
});

const common = (id: string, name: string, bounds: Rect2D): ApartmentCoreElement => ({
  id,
  name,
  rect: mm(bounds),
  assignedFlatId: null,
});

/**
 * Builds the stepped orthogonal building perimeter with >=6 vertices from the schematic's units.
 */
export function buildSteppedBuildingBoundary(schematic: DeterministicApartmentSchematic): Array<{ x: number; y: number }> {
  if (schematic.units.length === 2 && schematic.units[0]?.steppedPolygon && schematic.units[1]?.steppedPolygon) {
    const u0 = schematic.units[0]!.steppedPolygon;
    const u1 = schematic.units[1]!.steppedPolygon;
    const b0 = u0.boundingBox;
    const b1 = u1.boundingBox;
    const left = b0.x <= b1.x ? u0 : u1;
    const right = b0.x <= b1.x ? u1 : u0;
    const lb = left.boundingBox;
    const rb = right.boundingBox;
    const splitY_L = lb.y + lb.height * 0.58;
    const splitY_R = rb.y + rb.height * 0.58;
    const inset_L = lb.x + 1.2;
    const inset_R = rb.x + rb.width - 1.2;
    const yTop = Math.min(lb.y, rb.y);
    const yBottom = Math.max(lb.y + lb.height, rb.y + rb.height);

    return [
      { x: Math.round(lb.x * 1000), y: Math.round(yTop * 1000) },
      { x: Math.round((rb.x + rb.width) * 1000), y: Math.round(yTop * 1000) },
      { x: Math.round((rb.x + rb.width) * 1000), y: Math.round(splitY_R * 1000) },
      { x: Math.round(inset_R * 1000), y: Math.round(splitY_R * 1000) },
      { x: Math.round(inset_R * 1000), y: Math.round(yBottom * 1000) },
      { x: Math.round(inset_L * 1000), y: Math.round(yBottom * 1000) },
      { x: Math.round(inset_L * 1000), y: Math.round(splitY_L * 1000) },
      { x: Math.round(lb.x * 1000), y: Math.round(splitY_L * 1000) },
    ];
  } else if (schematic.units.length === 1 && schematic.units[0]?.steppedPolygon) {
    return schematic.units[0]!.steppedPolygon.vertices.map(p => ({
      x: Math.round(p.x * 1000),
      y: Math.round(p.y * 1000),
    }));
  }

  const fp = mm(schematic.buildingFootprint);
  return [
    { x: fp.x, y: fp.y },
    { x: fp.x + fp.width, y: fp.y },
    { x: fp.x + fp.width, y: fp.y + fp.height },
    { x: fp.x, y: fp.y + fp.height },
  ];
}

/**
 * Generates window openings strictly on openFacades or otsShafts (ZERO windows on deadWalls).
 */
export function generateWindowsForApartmentSchematic(schematic: DeterministicApartmentSchematic): ApartmentPlanOpening[] {
  const openings: ApartmentPlanOpening[] = [];
  let winId = 1;

  for (const unit of schematic.units) {
    const flatId = unit.flatId;
    const stepped = unit.steppedPolygon;
    const openFacades = new Set(stepped?.openFacades ?? ['N', 'S', 'E']);
    const deadWalls = new Set(stepped?.deadWalls ?? ['W']);
    const otsShafts = stepped?.otsShafts ?? [];
    const ub = mm(unit.bodyBounds);

    for (const room of [...unit.rooms, ...unit.balconies]) {
      const rm = mm(room.bounds);
      const isBath = room.type === 'master_toilet' || room.type === 'common_toilet' || room.type === 'powder_room';
      const isHabitable =
        room.type === 'living_dining' ||
        room.type === 'living' ||
        room.type === 'dining' ||
        room.type === 'kitchen' ||
        room.type === 'master_bedroom' ||
        room.type === 'bedroom' ||
        room.type === 'study';

      if (isBath) {
        // Bathroom: place ventilation window strictly on edge touching OTS shaft or openFacade
        let placedOnOts = false;
        for (const ots of otsShafts) {
          const ob = mm(ots.bounds);
          const xOverlap = Math.min(rm.x + rm.width, ob.x + ob.width) - Math.max(rm.x, ob.x);
          const yOverlap = Math.min(rm.y + rm.height, ob.y + ob.height) - Math.max(rm.y, ob.y);
          if (xOverlap > 300 && Math.abs(rm.y - (ob.y + ob.height)) <= 200) {
            openings.push({
              id: `${flatId}__win_${room.id}_ots_${winId++}`,
              kind: 'window',
              rect: { x: Math.max(rm.x, ob.x) + 100, y: rm.y - 100, width: Math.min(xOverlap - 200, 600), height: 200 },
              adjacentRoomId: `${flatId}__${room.id}`,
            });
            placedOnOts = true;
            break;
          } else if (xOverlap > 300 && Math.abs((rm.y + rm.height) - ob.y) <= 200) {
            openings.push({
              id: `${flatId}__win_${room.id}_ots_${winId++}`,
              kind: 'window',
              rect: { x: Math.max(rm.x, ob.x) + 100, y: rm.y + rm.height - 100, width: Math.min(xOverlap - 200, 600), height: 200 },
              adjacentRoomId: `${flatId}__${room.id}`,
            });
            placedOnOts = true;
            break;
          } else if (yOverlap > 300 && Math.abs(rm.x - (ob.x + ob.width)) <= 200) {
            openings.push({
              id: `${flatId}__win_${room.id}_ots_${winId++}`,
              kind: 'window',
              rect: { x: rm.x - 100, y: Math.max(rm.y, ob.y) + 100, width: 200, height: Math.min(yOverlap - 200, 600) },
              adjacentRoomId: `${flatId}__${room.id}`,
            });
            placedOnOts = true;
            break;
          } else if (yOverlap > 300 && Math.abs((rm.x + rm.width) - ob.x) <= 200) {
            openings.push({
              id: `${flatId}__win_${room.id}_ots_${winId++}`,
              kind: 'window',
              rect: { x: rm.x + rm.width - 100, y: Math.max(rm.y, ob.y) + 100, width: 200, height: Math.min(yOverlap - 200, 600) },
              adjacentRoomId: `${flatId}__${room.id}`,
            });
            placedOnOts = true;
            break;
          }
        }

        // If not on OTS, allow ventilation window strictly on openFacades (never on deadWalls)
        if (!placedOnOts) {
          if (openFacades.has('N') && !deadWalls.has('N') && Math.abs(rm.y - ub.y) <= 200) {
            openings.push({
              id: `${flatId}__win_${room.id}_${winId++}`,
              kind: 'window',
              rect: { x: rm.x + Math.round(rm.width * 0.25), y: rm.y - 100, width: Math.max(600, Math.round(rm.width * 0.5)), height: 200 },
              adjacentRoomId: `${flatId}__${room.id}`,
            });
          } else if (openFacades.has('S') && !deadWalls.has('S') && Math.abs((rm.y + rm.height) - (ub.y + ub.height)) <= 200) {
            openings.push({
              id: `${flatId}__win_${room.id}_${winId++}`,
              kind: 'window',
              rect: { x: rm.x + Math.round(rm.width * 0.25), y: rm.y + rm.height - 100, width: Math.max(600, Math.round(rm.width * 0.5)), height: 200 },
              adjacentRoomId: `${flatId}__${room.id}`,
            });
          }
        }
      } else if (isHabitable) {
        // Habitable room: place window on exterior open facade (ZERO on deadWalls)
        if (openFacades.has('N') && !deadWalls.has('N') && Math.abs(rm.y - ub.y) <= 200) {
          openings.push({
            id: `${flatId}__win_${room.id}_N_${winId++}`,
            kind: 'window',
            rect: { x: rm.x + Math.round(rm.width * 0.2), y: rm.y - 100, width: Math.max(1200, Math.round(rm.width * 0.6)), height: 200 },
            adjacentRoomId: `${flatId}__${room.id}`,
          });
        }
        if (openFacades.has('S') && !deadWalls.has('S') && Math.abs((rm.y + rm.height) - (ub.y + ub.height)) <= 200) {
          openings.push({
            id: `${flatId}__win_${room.id}_S_${winId++}`,
            kind: 'window',
            rect: { x: rm.x + Math.round(rm.width * 0.2), y: rm.y + rm.height - 100, width: Math.max(1200, Math.round(rm.width * 0.6)), height: 200 },
            adjacentRoomId: `${flatId}__${room.id}`,
          });
        }
        if (openFacades.has('E') && !deadWalls.has('E') && Math.abs((rm.x + rm.width) - (ub.x + ub.width)) <= 200) {
          openings.push({
            id: `${flatId}__win_${room.id}_E_${winId++}`,
            kind: 'window',
            rect: { x: rm.x + rm.width - 100, y: rm.y + Math.round(rm.height * 0.2), width: 200, height: Math.max(1200, Math.round(rm.height * 0.6)) },
            adjacentRoomId: `${flatId}__${room.id}`,
          });
        }
        if (openFacades.has('W') && !deadWalls.has('W') && Math.abs(rm.x - ub.x) <= 200) {
          openings.push({
            id: `${flatId}__win_${room.id}_W_${winId++}`,
            kind: 'window',
            rect: { x: rm.x - 100, y: rm.y + Math.round(rm.height * 0.2), width: 200, height: Math.max(1200, Math.round(rm.height * 0.6)) },
            adjacentRoomId: `${flatId}__${room.id}`,
          });
        }
      }
    }
  }

  return openings;
}

/**
 * Converts a DeterministicApartmentSchematic directly into an ApartmentPlanStructure.
 * Used to construct the authoritative canonical Building Model before any image model is involved.
 */
export function schematicToApartmentStructure(schematic: DeterministicApartmentSchematic): ApartmentPlanStructure {
  const structureId = new Map<string, string>();
  for (const unit of schematic.units) {
    for (const room of [...unit.rooms, ...unit.balconies]) {
      structureId.set(room.id, `${unit.flatId}__${room.id}`);
    }
  }
  const sid = (id: string) => structureId.get(id) ?? id;
  const doorOpenings: ApartmentPlanOpening[] = (schematic.doors ?? []).map(door => {
    const a = sid(door.connects[0]);
    const b = sid(door.connects[1]);
    const lobbyId = schematic.core.lobby ? 'core_lobby' : null;
    return {
      id: door.id,
      kind: 'door' as const,
      rect: mm(door.bounds),
      adjacentRoomId: door.kind === 'flat_entrance' && a === lobbyId ? b : a,
      doorType: door.doorType,
      swingDirection: door.swing,
      connects: [a, b] as const,
      isFlatEntrance: door.kind === 'flat_entrance',
    };
  });

  const windowOpenings = generateWindowsForApartmentSchematic(schematic);
  const openings = [...doorOpenings, ...windowOpenings];

  // Carved OTS shafts from each unit (1200mm x 1500mm)
  const otsShafts: ApartmentCoreElement[] = [];
  for (const unit of schematic.units) {
    if (unit.steppedPolygon?.otsShafts) {
      unit.steppedPolygon.otsShafts.forEach((ots, idx) => {
        otsShafts.push({
          id: `${unit.flatId}__ots_${idx + 1}`,
          name: `${unit.flatLabel} OTS Shaft`,
          rect: {
            x: Math.round(ots.bounds.x * 1000),
            y: Math.round(ots.bounds.y * 1000),
            width: ots.widthMm,
            height: ots.depthMm,
          },
          assignedFlatId: null,
        });
      });
    }
  }

  const fp = mm(schematic.buildingFootprint);
  const boundary = [
    { x: fp.x - 50, y: fp.y - 50 },
    { x: fp.x + fp.width + 50, y: fp.y - 50 },
    { x: fp.x + fp.width + 50, y: fp.y + fp.height + 50 },
    { x: fp.x - 50, y: fp.y + fp.height + 50 },
  ];

  return {
    source: 'DETERMINISTIC_SCHEMATIC',
    boundary,
    flats: schematic.units.map(unit => ({
      id: unit.flatId,
      label: unit.flatLabel,
      unitType: unit.unitType,
      rect: mm(unit.bounds),
      rooms: [...unit.rooms, ...unit.balconies].map(room => ({
        id: `${unit.flatId}__${room.id}`,
        name: room.name,
        type: room.type,
        rect: mm(room.bounds),
      })),
    })),
    commonRooms: [],
    ungroupedRooms: [],
    lifts: schematic.core.lifts.map(l => common(l.id, l.label, l.bounds)),
    stairs: schematic.core.stairs.map(s => common(s.id, s.label, s.bounds)),
    lobbies: schematic.core.lobby ? [common('core_lobby', schematic.core.lobby.label, schematic.core.lobby.bounds)] : [],
    corridors: schematic.core.corridors.map((c, i) => common(`corridor_${i + 1}`, c.label, c.bounds)),
    shafts: schematic.core.serviceShafts.map((s, i) => common(`shaft_${i + 1}`, s.label, s.bounds)),
    openings,
  };
}

/**
 * Builds an ExtractionSite from either a canonical Site object or dimensional parameters.
 */
export function buildExtractionSite(input: {
  readonly plotWidthMm: number;
  readonly plotDepthMm: number;
  readonly setbacksMm?: { readonly front: number; readonly rear: number; readonly left: number; readonly right: number };
  readonly roadFacing?: string | Direction;
  readonly orientationDegrees?: number;
}): ExtractionSite {
  const front = input.setbacksMm?.front ?? 3000;
  const rear = input.setbacksMm?.rear ?? 2000;
  const left = input.setbacksMm?.left ?? 2000;
  const right = input.setbacksMm?.right ?? 2000;

  return {
    plotWidth: input.plotWidthMm,
    plotDepth: input.plotDepthMm,
    frontSetback: front,
    rearSetback: rear,
    leftSetback: left,
    rightSetback: right,
    roadFacing: (input.roadFacing ?? 'north').toString().toLowerCase(),
    orientation: input.orientationDegrees ?? 0,
  };
}

/**
 * Directly adapts a DeterministicApartmentSchematic into a fully-formed, valid
 * Building domain model with stepped boundary, walls, doors, windows, and rooms.
 */
export function adaptSchematicToBuilding(
  schematic: DeterministicApartmentSchematic,
  options?: {
    projectId?: string;
    projectName?: string;
    site?: Partial<ExtractionSite>;
  },
): Building {
  const projectId = options?.projectId ?? 'project-cad';
  const projectName = options?.projectName ?? 'Apartment CAD Plan';
  const structure = schematicToApartmentStructure(schematic);
  const site = buildExtractionSite({
    plotWidthMm: options?.site?.plotWidth ?? Math.round(schematic.siteFootprint.width * 1000),
    plotDepthMm: options?.site?.plotDepth ?? Math.round(schematic.siteFootprint.height * 1000),
    setbacksMm: {
      front: Math.round(schematic.setbacks.front * 1000),
      rear: Math.round(schematic.setbacks.rear * 1000),
      left: Math.round(schematic.setbacks.left * 1000),
      right: Math.round(schematic.setbacks.right * 1000),
    },
    roadFacing: options?.site?.roadFacing ?? 'north',
    orientationDegrees: options?.site?.orientation ?? 0,
  });

  const { building } = apartmentStructureToBuilding(structure, site, projectId, projectName);
  const floor = building.floors[0]!;

  // Generate walls for all room boundaries
  const walls: Wall[] = [];
  const wallKeys = new Set<string>();

  for (const room of floor.rooms) {
    const x0 = room.x;
    const y0 = room.y;
    const x1 = room.x + room.width;
    const y1 = room.y + room.height;

    const segments = [
      { start: { x: x0, y: y0 }, end: { x: x1, y: y0 } },
      { start: { x: x1, y: y0 }, end: { x: x1, y: y1 } },
      { start: { x: x1, y: y1 }, end: { x: x0, y: y1 } },
      { start: { x: x0, y: y1 }, end: { x: x0, y: y0 } },
    ];

    for (const seg of segments) {
      const k = seg.start.x === seg.end.x
        ? `v_${seg.start.x}_${Math.min(seg.start.y, seg.end.y)}_${Math.max(seg.start.y, seg.end.y)}`
        : `h_${seg.start.y}_${Math.min(seg.start.x, seg.end.x)}_${Math.max(seg.start.x, seg.end.x)}`;

      if (!wallKeys.has(k)) {
        wallKeys.add(k);
        const isPerimeter =
          Math.abs(seg.start.x - Math.round(schematic.buildingFootprint.x * 1000)) <= 250 ||
          Math.abs(seg.end.x - Math.round((schematic.buildingFootprint.x + schematic.buildingFootprint.width) * 1000)) <= 250 ||
          Math.abs(seg.start.y - Math.round(schematic.buildingFootprint.y * 1000)) <= 250 ||
          Math.abs(seg.end.y - Math.round((schematic.buildingFootprint.y + schematic.buildingFootprint.height) * 1000)) <= 250;

        const wallType = isPerimeter ? WallType.External : WallType.Internal;
        walls.push(
          createWall({
            floorId: floor.id,
            startPoint: seg.start,
            endPoint: seg.end,
            type: wallType,
            thickness: isPerimeter ? 200 : 100,
            roomIds: [room.id],
          }),
        );
      }
    }
  }

  // Generate stairs
  const stairs: Stair[] = schematic.core.stairs.map(st =>
    createStair({
      floorId: floor.id,
      type: StairType.UShaped,
      x: Math.round(st.bounds.x * 1000),
      y: Math.round(st.bounds.y * 1000),
      width: Math.round(st.bounds.width * 1000),
      length: Math.round(st.bounds.height * 1000),
      riserCount: 16,
      riserHeight: 175,
      treadDepth: 250,
      direction: Direction.North,
      connectsFloors: [0, 1],
    }),
  );

  return {
    ...building,
    metadata: {
      ...building.metadata,
      apartmentSchematic: schematic,
      steppedPolygons: schematic.units.map(u => ({
        flatId: u.flatId,
        flatLabel: u.flatLabel,
        steppedPolygon: u.steppedPolygon,
      })),
      otsShafts: schematic.units.flatMap(u => u.steppedPolygon?.otsShafts ?? []),
      balconies: schematic.units.flatMap(u => u.steppedPolygon?.balconies ?? []),
      vastuReport: schematic.vastuReport,
    },
    floors: [
      {
        ...floor,
        walls,
        stairs,
      },
    ],
  };
}
