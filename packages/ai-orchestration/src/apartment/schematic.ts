/**
 * Deterministic Apartment Schematic Engine — Phase 1.4 & 4 (Stepped Polygon & Double-Line Renderer)
 */

import { type ApartmentRulesProfile } from './jurisdiction';
import {
  type ApartmentUnitType,
  type UnitTypologyAllocationResult,
  allocateApartmentUnitSpaces,
} from './typologies';
import { type ApartmentFloorType } from './floor-configuration';
import { DEFAULT_APARTMENT_SETBACKS_M } from './site-defaults';
import {
  type ApartmentLayoutStrategy,
  type FloorAreaBalance,
  type LayoutBand,
  type LayoutZone,
  type PlannedDoor,
  type PlannedRoom,
  type SpatialCheck,
  type SpatialGraphEdge,
  type SpatialGraphNode,
  type UnitAreaReport,
  planApartmentLayout,
} from './layout-planner';
import { buildSteppedPolygon, type SteppedUnitPolygon } from './polygon-layout';
import {
  type Point,
  type VastuReport,
  evaluateUnitVastu,
  computePolygonCentroid,
  compute16VastuZones,
  renderVastuChakraSvgOverlay,
} from './vastu';
export type { VastuReport } from './vastu';

export interface Rect2D {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface SchematicRoomItem {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly bounds: Rect2D;
  readonly areaSqM: number;
  readonly targetAreaSqM?: number;
  readonly isEnsuite?: boolean;
  readonly hasBalcony?: boolean;
  readonly zone?: LayoutZone;
  readonly band?: LayoutBand;
  readonly onFacade?: boolean;
  readonly ensuiteOf?: string;
  readonly hostRoomId?: string;
}

export interface SchematicApartmentUnit {
  readonly flatId: string;
  readonly flatLabel: string;
  readonly unitType: ApartmentUnitType;
  readonly carpetAreaSqM: number;
  readonly actualCarpetAreaSqM: number;
  readonly builtUpAreaSqM: number;
  readonly bounds: Rect2D;
  readonly bodyBounds: Rect2D;
  /** Stepped orthogonal polygon with >=6 vertices */
  readonly steppedPolygon?: SteppedUnitPolygon;
  readonly entrancePoint: { readonly x: number; readonly y: number };
  readonly entranceDoorId: string | null;
  readonly rooms: readonly SchematicRoomItem[];
  readonly balconies: readonly SchematicRoomItem[];
  readonly allocationDetails: UnitTypologyAllocationResult;
  readonly vastuReport?: VastuReport;
}

export interface SchematicLiftItem {
  readonly id: string;
  readonly label: string;
  readonly type: 'passenger' | 'service';
  readonly bounds: Rect2D;
  readonly capacityPersons: number;
}

export interface SchematicStairItem {
  readonly id: string;
  readonly label: string;
  readonly bounds: Rect2D;
  readonly widthM: number;
  readonly type: 'main' | 'fire_escape';
}

export interface SchematicCommonCore {
  readonly bounds: Rect2D;
  readonly lobby: { readonly bounds: Rect2D; readonly label: string };
  readonly corridors: ReadonlyArray<{ readonly bounds: Rect2D; readonly label: string }>;
  readonly lifts: readonly SchematicLiftItem[];
  readonly stairs: readonly SchematicStairItem[];
  readonly serviceShafts: ReadonlyArray<{ readonly bounds: Rect2D; readonly label: string }>;
  readonly totalCoreAreaSqM: number;
}

export type SchematicDoor = PlannedDoor;
export type SchematicSpatialCheck = SpatialCheck;

export interface DeterministicApartmentSchematic {
  readonly siteFootprint: Rect2D;
  readonly buildingFootprint: Rect2D;
  readonly setbacks: {
    readonly front: number;
    readonly rear: number;
    readonly left: number;
    readonly right: number;
  };
  readonly floorType: ApartmentFloorType;
  readonly flatCount: number;
  readonly unitMixSummary: string;
  readonly core: SchematicCommonCore;
  readonly units: readonly SchematicApartmentUnit[];
  readonly totalFloorPlateSqM: number;
  readonly totalNetResidentialSqM: number;
  readonly svgScaffold: string;
  readonly strategy: ApartmentLayoutStrategy;
  readonly doors: readonly SchematicDoor[];
  readonly spatialGraph: { readonly nodes: readonly SpatialGraphNode[]; readonly edges: readonly SpatialGraphEdge[] };
  readonly spatialChecks: readonly SchematicSpatialCheck[];
  readonly areaReport: { readonly units: readonly UnitAreaReport[]; readonly floor: FloorAreaBalance };
  readonly layoutFits: boolean;
  readonly layoutIssues: readonly string[];
  readonly layoutAdaptations: readonly string[];
  readonly vastuReport?: VastuReport;
  readonly seed: number;
}

export interface GenerateSchematicOptions {
  readonly siteWidthM: number;
  readonly siteDepthM: number;
  readonly setbacksM?: { front: number; rear: number; left: number; right: number };
  readonly flatsPerFloor: number;
  readonly unitMix?: ReadonlyArray<{
    unitType: ApartmentUnitType | string;
    count: number;
    carpetAreaSqFt?: number;
    carpetAreaSqM?: number;
  }>;
  readonly commonCoreConfig?: {
    passengerLifts?: number;
    serviceLifts?: number;
    staircaseCount?: number;
    commonLobby?: boolean;
  };
  readonly floorType?: ApartmentFloorType;
  readonly rulesProfile: ApartmentRulesProfile;
  readonly strategy?: ApartmentLayoutStrategy;
  readonly northAngleDeg?: number;
  readonly seed?: number;
}

function selectBestVastuRoomPermutation(
  unitId: string,
  unitLabel: string,
  rooms: SchematicRoomItem[],
  vertices: readonly Point[],
  entrancePoint?: Point,
  northAngleDeg: number = 0,
): { rooms: SchematicRoomItem[]; report: VastuReport } {
  const evalVastu = (candRooms: SchematicRoomItem[]): VastuReport => {
    return evaluateUnitVastu({
      unitId,
      unitLabel,
      vertices,
      rooms: candRooms.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        bounds: r.bounds,
        onFacade: r.onFacade,
      })),
      entrancePoint,
      northAngleDeg,
    });
  };

  const centroid = computePolygonCentroid(vertices);
  const candidates: Array<{ rooms: SchematicRoomItem[]; report: VastuReport }> = [];
  const baseReport = evalVastu(rooms);
  candidates.push({ rooms, report: baseReport });

  // 1. Try standard pairwise permutations
  const kitchenIdx = rooms.findIndex(r => r.type === 'kitchen');
  const commonToiletIdx = rooms.findIndex(r => r.type === 'common_toilet' || (r.type === 'toilet' && !r.ensuiteOf));
  const masterToiletIdx = rooms.findIndex(r => r.type === 'master_toilet' || (r.type === 'toilet' && r.ensuiteOf));
  const masterBedIdx = rooms.findIndex(r => r.type === 'master_bedroom');
  const otherBedIdx = rooms.findIndex(r => r.type === 'bedroom');

  const swapBounds = (rList: SchematicRoomItem[], i: number, j: number): SchematicRoomItem[] => {
    if (i < 0 || j < 0 || i === j) return rList;
    const copy = [...rList];
    const bI = copy[i]!.bounds;
    const bJ = copy[j]!.bounds;
    copy[i] = { ...copy[i]!, bounds: bJ };
    copy[j] = { ...copy[j]!, bounds: bI };
    return copy;
  };

  const tryAdd = (candRooms: SchematicRoomItem[]) => {
    const r = evalVastu(candRooms);
    candidates.push({ rooms: candRooms, report: r });
  };

  if (kitchenIdx >= 0 && commonToiletIdx >= 0) tryAdd(swapBounds(rooms, kitchenIdx, commonToiletIdx));
  if (kitchenIdx >= 0 && masterToiletIdx >= 0) tryAdd(swapBounds(rooms, kitchenIdx, masterToiletIdx));
  if (commonToiletIdx >= 0 && masterToiletIdx >= 0) tryAdd(swapBounds(rooms, commonToiletIdx, masterToiletIdx));
  if (masterBedIdx >= 0 && otherBedIdx >= 0) tryAdd(swapBounds(rooms, masterBedIdx, otherBedIdx));

  // 2. Targeted Vastu Rectification Permutations:
  // If base or swapped candidate still has hard defects (e.g. toilet/kitchen in NE or SW),
  // actively reposition wet rooms to auspicious sectors (SE, NW, SSE, WNW)
  const isLeftFlat = rooms.some(r => (r.bounds.x + r.bounds.width / 2) > centroid.x && r.type === 'kitchen');
  if (isLeftFlat) {
    // Left flat: Core is East (x > centroid.x).
    // SE is x > centroid.x, y > centroid.y.
    // NE is x > centroid.x, y < centroid.y.
    // Move Kitchen to SE (y > centroid.y) and Toilets to SSE/S (y > centroid.y)
    const copy = rooms.map(r => ({ ...r, bounds: { ...r.bounds } }));
    const k = copy.find(r => r.type === 'kitchen');
    const ct = copy.find(r => r.type === 'common_toilet' || (r.type === 'toilet' && !r.ensuiteOf));

    if (k && (k.bounds.y + k.bounds.height / 2) < centroid.y && ct && (ct.bounds.y + ct.bounds.height / 2) > centroid.y) {
      const oldKb = { ...k.bounds };
      k.bounds = { ...ct.bounds };
      ct.bounds = {
        x: k.bounds.x,
        y: k.bounds.y + k.bounds.height + 0.1,
        width: ct.bounds.width,
        height: ct.bounds.height,
      };
      // Convert vacated NE space into pure Puja Mandir
      copy.push({
        id: `${unitId}_puja`,
        name: 'Puja Mandir',
        type: 'puja',
        bounds: oldKb,
        areaSqM: Number((oldKb.width * oldKb.height).toFixed(2)),
        onFacade: false,
      });
      tryAdd(copy);
    }
  } else {
    // Right flat: Core is West (x < centroid.x).
    // NW is x < centroid.x, y < centroid.y.
    // SW is x < centroid.x, y > centroid.y.
    // Toilets must NOT be in SW (y > centroid.y). Move Common Toilet to NW/WNW (y < centroid.y).
    const copy = rooms.map(r => ({ ...r, bounds: { ...r.bounds } }));
    const k = copy.find(r => r.type === 'kitchen');
    let modified = false;
    for (const t of copy.filter(r => r.type.includes('toilet') || r.type.includes('bath'))) {
      if ((t.bounds.y + t.bounds.height / 2) > centroid.y) {
        t.bounds = {
          x: k ? k.bounds.x : t.bounds.x,
          y: Math.max(0, centroid.y - t.bounds.height - 0.2),
          width: t.bounds.width,
          height: t.bounds.height,
        };
        modified = true;
      }
    }
    if (modified) tryAdd(copy);
  }

  // Sort candidates by overallScore descending, then defects count ascending
  candidates.sort((a, b) => {
    if (b.report.overallScore !== a.report.overallScore) {
      return b.report.overallScore - a.report.overallScore;
    }
    return a.report.defects.length - b.report.defects.length;
  });

  return candidates[0]!;
}

export function generateDeterministicApartmentSchematic(
  options: GenerateSchematicOptions,
): DeterministicApartmentSchematic {
  const {
    siteWidthM,
    siteDepthM,
    flatsPerFloor,
    unitMix = [],
    commonCoreConfig = {},
    floorType = 'typical',
    rulesProfile,
    strategy = 'balanced',
  } = options;

  const setbacks = options.setbacksM ?? DEFAULT_APARTMENT_SETBACKS_M;
  const buildableWidthM = Math.max(10, siteWidthM - setbacks.left - setbacks.right);
  const buildableDepthM = Math.max(10, siteDepthM - setbacks.front - setbacks.rear);
  const buildable: Rect2D = { x: setbacks.left, y: setbacks.rear, width: buildableWidthM, height: buildableDepthM };

  const flattenedFlats: Array<{
    flatLabel: string;
    unitType: ApartmentUnitType;
    targetCarpetAreaSqM?: number;
    targetCarpetAreaSqFt?: number;
  }> = [];
  let flatIndex = 1;
  for (const mixItem of unitMix) {
    const count = mixItem.count || 1;
    for (let c = 0; c < count; c++) {
      if (flattenedFlats.length < flatsPerFloor) {
        flattenedFlats.push({
          flatLabel: `Flat ${String(flatIndex).padStart(2, '0')}`,
          unitType: ((mixItem.unitType?.toUpperCase()) as ApartmentUnitType) || '2BHK',
          targetCarpetAreaSqM: mixItem.carpetAreaSqM,
          targetCarpetAreaSqFt: mixItem.carpetAreaSqFt,
        });
        flatIndex++;
      }
    }
  }
  while (flattenedFlats.length < flatsPerFloor) {
    flattenedFlats.push({ flatLabel: `Flat ${String(flatIndex).padStart(2, '0')}`, unitType: '2BHK' });
    flatIndex++;
  }
  const finalFlats = flattenedFlats.slice(0, flatsPerFloor);

  const passengerLifts = commonCoreConfig.passengerLifts ?? rulesProfile.liftRequirements.minPassengerLifts;
  const liftCount = Math.max(1, passengerLifts + (commonCoreConfig.serviceLifts ?? 0));
  const stairCount = Math.max(1, commonCoreConfig.staircaseCount ?? (rulesProfile.stairRequirements.secondStaircaseRequired ? 2 : 1));

  const plan = planApartmentLayout({
    buildable,
    flats: finalFlats.map(flat => ({
      flatId: flat.flatLabel.toLowerCase().replace(/\s+/g, '_'),
      flatLabel: flat.flatLabel,
      unitType: flat.unitType,
      allocation: allocateApartmentUnitSpaces({
        unitType: flat.unitType,
        flatLabel: flat.flatLabel,
        targetCarpetAreaSqM: flat.targetCarpetAreaSqM,
        targetCarpetAreaSqFt: flat.targetCarpetAreaSqFt,
        rulesProfile,
      }),
    })),
    liftCount,
    stairCount,
    strategy,
    rulesProfile,
    seed: options.seed,
  });

  const toRoomItem = (room: PlannedRoom): SchematicRoomItem => ({
    id: room.id,
    name: room.name,
    type: room.type,
    bounds: room.bounds,
    areaSqM: room.areaSqM,
    targetAreaSqM: room.targetAreaSqM,
    ...(room.isEnsuite !== undefined ? { isEnsuite: room.isEnsuite } : {}),
    ...(room.hasBalcony !== undefined ? { hasBalcony: room.hasBalcony } : {}),
    zone: room.zone,
    band: room.band,
    onFacade: room.onFacade,
    ...(room.ensuiteOf ? { ensuiteOf: room.ensuiteOf } : {}),
    ...(room.hostRoomId ? { hostRoomId: room.hostRoomId } : {}),
  });

  const units: SchematicApartmentUnit[] = plan.units.map((u, idx) => {
    const report = plan.areaReport.units.find(r => r.flatId === u.flatId);
    const corridorSide = idx % 2 === 0 ? 'W' : 'E';
    const steppedPolygon = buildSteppedPolygon({
      flatId: u.flatId,
      flatLabel: u.flatLabel,
      bbox: u.body,
      corridorSide: corridorSide as any,
      targetCarpetAreaSqM: u.allocation.targetCarpetAreaSqM,
    });

    let roomItems = u.rooms.map(toRoomItem);
    const balconyItems = u.balconies.map(toRoomItem);

    let vastuReport = evaluateUnitVastu({
      unitId: u.flatId,
      unitLabel: u.flatLabel,
      vertices: steppedPolygon.vertices,
      rooms: roomItems.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        bounds: r.bounds,
        onFacade: r.onFacade,
      })),
      entrancePoint: u.entrancePoint,
      northAngleDeg: options.northAngleDeg ?? 0,
    });

    // Actively select room permutation that maximizes overallScore for VASTU_OPTIMIZED strategy
    if (strategy === 'VASTU_OPTIMIZED') {
      const optimized = selectBestVastuRoomPermutation(
        u.flatId,
        u.flatLabel,
        roomItems,
        steppedPolygon.vertices,
        u.entrancePoint,
        options.northAngleDeg ?? 0,
      );
      roomItems = optimized.rooms;
      vastuReport = optimized.report;
    }

    return {
      flatId: u.flatId,
      flatLabel: u.flatLabel,
      unitType: u.unitType,
      carpetAreaSqM: u.allocation.targetCarpetAreaSqM,
      actualCarpetAreaSqM: report?.actualCarpetSqM ?? 0,
      builtUpAreaSqM: u.allocation.targetBuiltUpAreaSqM,
      bounds: u.bounds,
      bodyBounds: u.body,
      steppedPolygon,
      entrancePoint: u.entrancePoint,
      entranceDoorId: u.entranceDoorId,
      rooms: roomItems,
      balconies: balconyItems,
      allocationDetails: u.allocation,
      vastuReport,
    };
  });

  const allUnitScores = units.map(u => u.vastuReport?.overallScore ?? 75);
  const avgVastuScore = allUnitScores.length > 0
    ? Math.round(allUnitScores.reduce((a, b) => a + b, 0) / allUnitScores.length)
    : 75;
  const schematicGrade: 'A+' | 'A' | 'B' | 'C' =
    avgVastuScore >= 90 ? 'A+' : avgVastuScore >= 80 ? 'A' : avgVastuScore >= 65 ? 'B' : 'C';

  const fp = plan.footprint;
  const footprintVertices = (units.length === 2 && units[0]?.steppedPolygon && units[1]?.steppedPolygon)
    ? [
        { x: Math.min(units[0].steppedPolygon.boundingBox.x, units[1].steppedPolygon.boundingBox.x), y: fp.y },
        { x: Math.max(units[0].steppedPolygon.boundingBox.x + units[0].steppedPolygon.boundingBox.width, units[1].steppedPolygon.boundingBox.x + units[1].steppedPolygon.boundingBox.width), y: fp.y },
        { x: Math.max(units[0].steppedPolygon.boundingBox.x + units[0].steppedPolygon.boundingBox.width, units[1].steppedPolygon.boundingBox.x + units[1].steppedPolygon.boundingBox.width), y: fp.y + fp.height * 0.58 },
        { x: Math.max(units[0].steppedPolygon.boundingBox.x + units[0].steppedPolygon.boundingBox.width, units[1].steppedPolygon.boundingBox.x + units[1].steppedPolygon.boundingBox.width) - 1.2, y: fp.y + fp.height * 0.58 },
        { x: Math.max(units[0].steppedPolygon.boundingBox.x + units[0].steppedPolygon.boundingBox.width, units[1].steppedPolygon.boundingBox.x + units[1].steppedPolygon.boundingBox.width) - 1.2, y: fp.y + fp.height },
        { x: Math.min(units[0].steppedPolygon.boundingBox.x, units[1].steppedPolygon.boundingBox.x) + 1.2, y: fp.y + fp.height },
        { x: Math.min(units[0].steppedPolygon.boundingBox.x, units[1].steppedPolygon.boundingBox.x) + 1.2, y: fp.y + fp.height * 0.58 },
        { x: Math.min(units[0].steppedPolygon.boundingBox.x, units[1].steppedPolygon.boundingBox.x), y: fp.y + fp.height * 0.58 },
      ]
    : [
        { x: fp.x, y: fp.y },
        { x: fp.x + fp.width, y: fp.y },
        { x: fp.x + fp.width, y: fp.y + fp.height },
        { x: fp.x, y: fp.y + fp.height },
      ];
  const floorCentroid = computePolygonCentroid(footprintVertices);
  const floorZones = compute16VastuZones(floorCentroid, Math.max(fp.width, fp.height) * 0.7, options.northAngleDeg ?? 0);

  const schematicVastuReport: VastuReport = {
    overallScore: avgVastuScore,
    grade: schematicGrade,
    centroid: floorCentroid,
    zones: floorZones,
    roomCompliance: units.flatMap(u => u.vastuReport?.roomCompliance ?? []),
    defects: units.flatMap(u => u.vastuReport?.defects ?? []),
  };

  const lifts: SchematicLiftItem[] = plan.core.lifts.map((l, i) => ({
    id: l.id,
    label: l.label,
    type: i < passengerLifts ? 'passenger' : 'service',
    capacityPersons: 10,
    bounds: l.bounds,
  }));
  const stairs: SchematicStairItem[] = plan.core.stairs.map((s, i) => ({
    id: s.id,
    label: s.label,
    widthM: rulesProfile.stairRequirements.minWidthM,
    type: i === 0 ? 'main' : 'fire_escape',
    bounds: s.bounds,
  }));
  const serviceShafts = plan.core.shafts.map(s => ({ label: s.label, bounds: s.bounds }));
  const corridors: Array<{ bounds: Rect2D; label: string }> = [];
  const lobbyBounds = plan.core.lobby.bounds;
  const floor = plan.areaReport.floor;
  const totalCoreAreaSqM = Number((floor.coreSqM + floor.lobbySqM).toFixed(2));
  const totalNetResidentialSqM = Number(units.reduce((sum, u) => sum + u.carpetAreaSqM, 0).toFixed(2));
  const unitMixSummary = finalFlats.map(f => `${f.flatLabel} (${f.unitType})`).join(', ');

  const svgScaffold = generateSchematicSvg({
    siteWidthM,
    siteDepthM,
    buildingFootprint: plan.footprint,
    lifts,
    stairs,
    lobbyBounds,
    serviceShafts,
    units,
    doors: plan.doors,
    flatsPerFloor: finalFlats.length,
    unitMixSummary,
    strategy,
    vastuReport: schematicVastuReport,
  });

  return {
    siteFootprint: { x: 0, y: 0, width: siteWidthM, height: siteDepthM },
    buildingFootprint: plan.footprint,
    setbacks,
    floorType,
    flatCount: finalFlats.length,
    unitMixSummary,
    core: {
      bounds: plan.core.bounds,
      lobby: { bounds: lobbyBounds, label: 'COMMON LOBBY' },
      corridors,
      lifts,
      stairs,
      serviceShafts,
      totalCoreAreaSqM,
    },
    units,
    totalFloorPlateSqM: Number((floor.unitsSqM + floor.coreSqM + floor.lobbySqM).toFixed(2)),
    totalNetResidentialSqM,
    svgScaffold,
    strategy,
    doors: plan.doors,
    spatialGraph: plan.graph,
    spatialChecks: plan.checks,
    areaReport: plan.areaReport,
    layoutFits: plan.fits,
    layoutIssues: plan.issues,
    layoutAdaptations: plan.adaptations,
    vastuReport: schematicVastuReport,
    seed: plan.seed,
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function generateSchematicSvg(data: {
  siteWidthM: number;
  siteDepthM: number;
  buildingFootprint: Rect2D;
  lifts: readonly SchematicLiftItem[];
  stairs: readonly SchematicStairItem[];
  lobbyBounds: Rect2D;
  serviceShafts: ReadonlyArray<{ bounds: Rect2D; label: string }>;
  units: readonly SchematicApartmentUnit[];
  doors: readonly SchematicDoor[];
  flatsPerFloor: number;
  unitMixSummary: string;
  strategy: ApartmentLayoutStrategy;
  vastuReport?: VastuReport;
}): string {
  const scale = 22;
  const svgWidth = Math.ceil(data.siteWidthM * scale);
  const svgHeight = Math.ceil(data.siteDepthM * scale);
  const flatColors = ['#EBF5FB', '#FEF9E7', '#EAFAF1', '#F4ECF7', '#FDEBD0'];
  const R = (r: Rect2D) => `x="${(r.x * scale).toFixed(1)}" y="${(r.y * scale).toFixed(1)}" width="${(r.width * scale).toFixed(1)}" height="${(r.height * scale).toFixed(1)}"`;
  const centre = (r: Rect2D) => ({ x: (r.x + r.width / 2) * scale, y: (r.y + r.height / 2) * scale });

  const unitsSvg = data.units
    .map((unit, idx) => {
      const color = flatColors[idx % flatColors.length];
      const poly = unit.steppedPolygon;
      const ptsStr = poly ? poly.vertices.map(p => `${(p.x * scale).toFixed(1)},${(p.y * scale).toFixed(1)}`).join(' ') : '';
      const otsSvg = poly ? poly.otsShafts.map(ots => `
        <rect x="${(ots.bounds.x * scale).toFixed(1)}" y="${(ots.bounds.y * scale).toFixed(1)}" width="${(ots.bounds.width * scale).toFixed(1)}" height="${(ots.bounds.height * scale).toFixed(1)}" fill="#94A3B8" stroke="#334155" stroke-width="1" stroke-dasharray="2,2" />
        <text x="${((ots.bounds.x + ots.bounds.width / 2) * scale).toFixed(1)}" y="${((ots.bounds.y + ots.bounds.height / 2 + 3) * scale).toFixed(1)}" text-anchor="middle" font-size="7" fill="#F8FAFC" font-weight="700">OTS</text>
      `).join('') : '';

      const rooms = [...unit.rooms, ...unit.balconies]
        .map(room => {
          const c = centre(room.bounds);
          const dashed = room.type === 'balcony' ? ' stroke-dasharray="3,2"' : '';
          return `
        <rect ${R(room.bounds)} fill="none" stroke="#64748B" stroke-width="0.9"${dashed}/>
        <text x="${c.x.toFixed(1)}" y="${(c.y + 3).toFixed(1)}" text-anchor="middle" font-size="7.5" fill="#334155">${esc(room.name)}</text>`;
        })
        .join('');

      const chakraSvg = unit.vastuReport
        ? renderVastuChakraSvgOverlay(unit.vastuReport, { scale, showZoneLabels: true, opacity: 0.65 })
        : '';

      const vScore = unit.vastuReport?.overallScore;
      const vGrade = unit.vastuReport?.grade;
      const vastuUnitBadge = vScore !== undefined
        ? `<text x="${(unit.bodyBounds.x * scale + 6).toFixed(1)}" y="${(unit.bodyBounds.y * scale + 38).toFixed(1)}" font-size="9" font-weight="700" fill="${vScore >= 85 ? '#059669' : vScore >= 70 ? '#D97706' : '#DC2626'}">Vastu: ${vScore}/100 (${vGrade})</text>`
        : '';

      return `
    <g id="${unit.flatId}">
      ${ptsStr ? `<polygon points="${ptsStr}" fill="${color}" stroke="#0F172A" stroke-width="3" stroke-linejoin="round" />` : `<rect ${R(unit.bodyBounds)} fill="${color}" stroke="#0F172A" stroke-width="3" />`}
      ${otsSvg}
      ${rooms}
      ${chakraSvg}
      <text x="${(unit.bodyBounds.x * scale + 6).toFixed(1)}" y="${(unit.bodyBounds.y * scale + 14).toFixed(1)}" font-size="11" font-weight="700" fill="#1E293B">${esc(unit.flatLabel)} · ${unit.unitType}</text>
      <text x="${(unit.bodyBounds.x * scale + 6).toFixed(1)}" y="${(unit.bodyBounds.y * scale + 26).toFixed(1)}" font-size="9" fill="#64748B">Net Carpet: ${poly ? poly.netCarpetAreaSqM : unit.actualCarpetAreaSqM} m²</text>
      ${vastuUnitBadge}
    </g>`;
    })
    .join('');

  const doorsSvg = data.doors
    .map(d => `<rect ${R(d.bounds)} fill="#FFFFFF" stroke="${d.kind === 'flat_entrance' ? '#DC2626' : '#0EA5E9'}" stroke-width="1"/>`)
    .join('');

  const coreSvg = `
  <rect ${R(data.lobbyBounds)} fill="#F8FAFC" stroke="#334155" stroke-width="1.5" />
  <text x="${centre(data.lobbyBounds).x.toFixed(1)}" y="${(centre(data.lobbyBounds).y + 4).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="#334155">COMMON LOBBY</text>
  ${data.lifts
    .map(lift => {
      const b = lift.bounds;
      const x0 = b.x * scale;
      const y0 = b.y * scale;
      const x1 = (b.x + b.width) * scale;
      const y1 = (b.y + b.height) * scale;
      const c = centre(b);
      return `
    <rect ${R(b)} fill="#E0F2FE" stroke="#0284C7" stroke-width="1.5" />
    <line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#0284C7" stroke-width="0.8" />
    <line x1="${x1}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="#0284C7" stroke-width="0.8" />
    <text x="${c.x.toFixed(1)}" y="${(c.y + 3).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="#0369A1">${lift.label}</text>`;
    })
    .join('')}
  ${data.stairs
    .map(stair => {
      const c = centre(stair.bounds);
      return `
    <rect ${R(stair.bounds)} fill="url(#stairLines)" stroke="#D97706" stroke-width="1.5" />
    <text x="${c.x.toFixed(1)}" y="${(c.y + 3).toFixed(1)}" text-anchor="middle" font-size="8.5" font-weight="700" fill="#92400E">${stair.label}</text>`;
    })
    .join('')}
  ${data.serviceShafts.map(s => `<rect ${R(s.bounds)} fill="#F1F5F9" stroke="#475569" stroke-width="1" />`).join('')}`;

  const fp = data.buildingFootprint;
  const vastuBadge = data.vastuReport
    ? `<rect x="${svgWidth - 210}" y="${svgHeight - 34}" width="200" height="24" fill="${data.vastuReport.overallScore >= 85 ? '#065F46' : data.vastuReport.overallScore >= 70 ? '#92400E' : '#991B1B'}" rx="4" />
       <text x="${svgWidth - 110}" y="${svgHeight - 18}" text-anchor="middle" font-size="10" font-weight="700" fill="#FFFFFF">VASTU SCORE: ${data.vastuReport.overallScore}/100 (${data.vastuReport.grade})</text>`
    : '';

  const barWidth = data.vastuReport ? svgWidth - 225 : svgWidth - 20;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}" style="background:#F8F9FA; font-family: Inter, Roboto, sans-serif;">
  <defs>
    <pattern id="grid" width="${scale}" height="${scale}" patternUnits="userSpaceOnUse">
      <path d="M ${scale} 0 L 0 0 0 ${scale}" fill="none" stroke="#E2E8F0" stroke-width="0.5"/>
    </pattern>
    <pattern id="stairLines" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="6" stroke="#94A3B8" stroke-width="1.5" />
    </pattern>
  </defs>
  <rect width="${svgWidth}" height="${svgHeight}" fill="url(#grid)" />
  <rect x="2" y="2" width="${svgWidth - 4}" height="${svgHeight - 4}" fill="none" stroke="#64748B" stroke-width="2" stroke-dasharray="4,4" />
  <text x="10" y="20" font-size="11" font-weight="600" fill="#475569">SITE BOUNDARY (${data.siteWidthM}m × ${data.siteDepthM}m)</text>
  <rect ${R(fp)} fill="none" stroke="#94A3B8" stroke-width="1" stroke-dasharray="6,3" />
  ${unitsSvg}
  ${coreSvg}
  ${doorsSvg}
  <rect x="10" y="${svgHeight - 34}" width="${barWidth}" height="24" fill="#0F172A" rx="4" />
  <text x="20" y="${svgHeight - 18}" font-size="10" font-weight="600" fill="#F8FAFC">INDIAN APARTMENT EDITION · ${data.strategy.toUpperCase()} · ${data.flatsPerFloor} FLATS/FLOOR · ${esc(data.unitMixSummary)}</text>
  ${vastuBadge}
</svg>
`.trim();
}
