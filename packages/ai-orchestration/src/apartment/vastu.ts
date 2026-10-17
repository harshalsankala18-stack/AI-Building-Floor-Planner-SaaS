/**
 * The 16-Zone Angular Centroid "Flat Vastu" Engine & MahaVastu Chakra Overlay.
 *
 * Implements:
 * 1. Deterministic Shoelace Polygon Centroid (Brahmasthana) for non-square stepped orthogonal polygons.
 * 2. 16 MahaVastu Angular Zones (22.5° wedges) rotated by site's northAngleDeg.
 * 3. 0–100 Weighted Vastu Scorecard per unit with hard defect enforcement.
 * 4. 2D SVG Vastu Chakra Compass Overlay with colored compliance indicators.
 */

export interface Point {
  readonly x: number;
  readonly y: number;
}

export type VastuZoneCode =
  | 'N'
  | 'NNE'
  | 'NE'
  | 'ENE'
  | 'E'
  | 'ESE'
  | 'SE'
  | 'SSE'
  | 'S'
  | 'SSW'
  | 'SW'
  | 'WSW'
  | 'W'
  | 'WNW'
  | 'NW'
  | 'NNW';

export interface VastuZoneMeta {
  readonly code: VastuZoneCode;
  readonly traditionalName: string;
  readonly label: string;
  /** Center bearing in degrees (0 = North, 90 = East, 180 = South, 270 = West) */
  readonly centerDeg: number;
  readonly startDeg: number;
  readonly endDeg: number;
}

export const VASTU_16_ZONES: readonly VastuZoneMeta[] = [
  { code: 'N', traditionalName: 'Kuber', label: 'N', centerDeg: 0, startDeg: 348.75, endDeg: 11.25 },
  { code: 'NNE', traditionalName: 'Aushadhi', label: 'NNE', centerDeg: 22.5, startDeg: 11.25, endDeg: 33.75 },
  { code: 'NE', traditionalName: 'Ishan', label: 'NE (Ishan)', centerDeg: 45, startDeg: 33.75, endDeg: 56.25 },
  { code: 'ENE', traditionalName: 'Jayant', label: 'ENE', centerDeg: 67.5, startDeg: 56.25, endDeg: 78.75 },
  { code: 'E', traditionalName: 'Indra', label: 'E', centerDeg: 90, startDeg: 78.75, endDeg: 101.25 },
  { code: 'ESE', traditionalName: 'Satya', label: 'ESE', centerDeg: 112.5, startDeg: 101.25, endDeg: 123.75 },
  { code: 'SE', traditionalName: 'Agni', label: 'SE (Agni)', centerDeg: 135, startDeg: 123.75, endDeg: 146.25 },
  { code: 'SSE', traditionalName: 'Aryama', label: 'SSE', centerDeg: 157.5, startDeg: 146.25, endDeg: 168.75 },
  { code: 'S', traditionalName: 'Yama', label: 'S', centerDeg: 180, startDeg: 168.75, endDeg: 191.25 },
  { code: 'SSW', traditionalName: 'Gandharva', label: 'SSW', centerDeg: 202.5, startDeg: 191.25, endDeg: 213.75 },
  { code: 'SW', traditionalName: 'Nairutya', label: 'SW (Nairutya)', centerDeg: 225, startDeg: 213.75, endDeg: 236.25 },
  { code: 'WSW', traditionalName: 'Sugreev', label: 'WSW', centerDeg: 247.5, startDeg: 236.25, endDeg: 258.75 },
  { code: 'W', traditionalName: 'Varun', label: 'W', centerDeg: 270, startDeg: 258.75, endDeg: 281.25 },
  { code: 'WNW', traditionalName: 'Asur', label: 'WNW', centerDeg: 292.5, startDeg: 281.25, endDeg: 303.75 },
  { code: 'NW', traditionalName: 'Vayu', label: 'NW (Vayu)', centerDeg: 315, startDeg: 303.75, endDeg: 326.25 },
  { code: 'NNW', traditionalName: 'Roga', label: 'NNW', centerDeg: 337.5, startDeg: 326.25, endDeg: 348.75 },
];

export interface VastuZoneWedge {
  readonly code: VastuZoneCode;
  readonly zone: VastuZoneCode;
  readonly label: string;
  readonly startDeg: number;
  readonly endDeg: number;
  readonly centerDeg: number;
  readonly polygon?: readonly Point[];
}

export type RoomVastuStatus = 'IDEAL' | 'ACCEPTABLE' | 'DEFECT';

export interface RoomVastuAudit {
  readonly roomId: string;
  readonly roomName: string;
  readonly roomType: string;
  readonly zone: VastuZoneCode;
  readonly status: RoomVastuStatus;
  readonly score: number;
  readonly maxScore: number;
  readonly note: string;
}

export interface VastuReport {
  readonly overallScore: number;
  readonly grade: 'A+' | 'A' | 'B' | 'C';
  readonly centroid: Point;
  readonly zones: readonly VastuZoneWedge[];
  readonly roomCompliance: readonly RoomVastuAudit[];
  readonly defects: readonly string[];
}

// ── 1. True Stepped-Polygon Centroid (Shoelace Formula) ──────────────────────

/**
 * Computes the exact geometric centroid (Cx, Cy) of a stepped orthogonal polygon
 * using the deterministic Shoelace Centroid formula.
 *
 * A = 1/2 * sum(x_i * y_{i+1} - x_{i+1} * y_i)
 * Cx = 1/(6A) * sum((x_i + x_{i+1}) * (x_i * y_{i+1} - x_{i+1} * y_i))
 * Cy = 1/(6A) * sum((y_i + y_{i+1}) * (x_i * y_{i+1} - x_{i+1} * y_i))
 */
export function computePolygonCentroid(vertices: readonly Point[]): Point {
  const n = vertices.length;
  if (n === 0) return { x: 0, y: 0 };
  if (n === 1) return { x: vertices[0]!.x, y: vertices[0]!.y };
  if (n === 2) {
    return {
      x: (vertices[0]!.x + vertices[1]!.x) / 2,
      y: (vertices[0]!.y + vertices[1]!.y) / 2,
    };
  }

  let signedArea2 = 0; // 2 * A
  let cxSum = 0;
  let cySum = 0;

  for (let i = 0; i < n; i++) {
    const curr = vertices[i]!;
    const next = vertices[(i + 1) % n]!;
    const cross = curr.x * next.y - next.x * curr.y;
    signedArea2 += cross;
    cxSum += (curr.x + next.x) * cross;
    cySum += (curr.y + next.y) * cross;
  }

  const area = signedArea2 / 2;

  if (Math.abs(area) < 1e-9) {
    // Degenerate polygon fallback
    const sumX = vertices.reduce((acc, p) => acc + p.x, 0);
    const sumY = vertices.reduce((acc, p) => acc + p.y, 0);
    return { x: sumX / n, y: sumY / n };
  }

  return {
    x: cxSum / (3 * signedArea2),
    y: cySum / (3 * signedArea2),
  };
}

// ── 2. 16 MahaVastu Angular Zones Classification ────────────────────────────

/**
 * Normalizes an angle into [0, 360).
 */
export function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Calculates the clockwise compass bearing (0° = North, 90° = East, 180° = South, 270° = West)
 * from a centroid to a target point, accounting for site's `northAngleDeg`.
 *
 * In 2D plan coordinates (Y increases downwards):
 * - Vector pointing Up has dx = 0, dy < 0 -> 0° (North)
 * - Vector pointing Right has dx > 0, dy = 0 -> 90° (East)
 * - Vector pointing Down has dx = 0, dy > 0 -> 180° (South)
 * - Vector pointing Left has dx < 0, dy = 0 -> 270° (West)
 */
export function computeBearingDeg(
  from: Point,
  to: Point,
  northAngleDeg: number = 0,
): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  // Bearing from Up (North when northAngleDeg = 0)
  const angleFromUp = normalizeDeg((Math.atan2(dx, -dy) * 180) / Math.PI);
  // Rotated by site northAngleDeg
  return normalizeDeg(angleFromUp - northAngleDeg);
}

/**
 * Classifies a point into one of the 16 MahaVastu 22.5° angular zones.
 */
export function classifyPointToVastuZone(
  point: Point,
  centroid: Point,
  northAngleDeg: number = 0,
): VastuZoneCode {
  const bearing = computeBearingDeg(centroid, point, northAngleDeg);
  // Each zone is 22.5° wide. North is centered at 0° (348.75° to 11.25°).
  const shifted = normalizeDeg(bearing + 11.25);
  const zoneIndex = Math.floor(shifted / 22.5);
  return VASTU_16_ZONES[zoneIndex % 16]!.code;
}

/**
 * Generates the 16 Vastu zone wedges projected from a centroid out to a given radius.
 */
export function compute16VastuZones(
  centroid: Point,
  radiusM: number,
  northAngleDeg: number = 0,
): VastuZoneWedge[] {
  return VASTU_16_ZONES.map(meta => {
    // start and end angles in plan coordinate space
    const startPlanDeg = normalizeDeg(meta.startDeg + northAngleDeg);
    const endPlanDeg = normalizeDeg(meta.endDeg + northAngleDeg);

    // Convert compass to dx, dy (0° = Up / -Y, 90° = Right / +X)
    const toPoint = (compassDeg: number): Point => {
      const rad = (compassDeg * Math.PI) / 180;
      return {
        x: centroid.x + radiusM * Math.sin(rad),
        y: centroid.y - radiusM * Math.cos(rad),
      };
    };

    const pStart = toPoint(startPlanDeg);
    const pEnd = toPoint(endPlanDeg);

    return {
      code: meta.code,
      zone: meta.code,
      label: meta.label,
      startDeg: meta.startDeg,
      endDeg: meta.endDeg,
      centerDeg: meta.centerDeg,
      polygon: [centroid, pStart, pEnd],
    };
  });
}

// ── 3. 0–100 Weighted Vastu Scorecard per Unit ──────────────────────────────

export interface UnitVastuEvaluationInput {
  readonly unitId: string;
  readonly unitLabel?: string;
  readonly vertices?: readonly Point[];
  readonly centroid?: Point;
  readonly unitCentroid?: Point;
  readonly rooms: ReadonlyArray<{
    readonly id?: string;
    readonly name?: string;
    readonly type?: string;
    readonly roomType?: string;
    readonly bounds?: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
    readonly center?: Point;
    readonly areaSqM?: number;
    readonly onFacade?: boolean;
  }>;
  readonly entrancePoint?: Point;
  readonly northAngleDeg?: number;
}

function getRoomCenter(r: { bounds?: { x: number; y: number; width: number; height: number }; center?: Point }): Point {
  if (r.center) return r.center;
  if (r.bounds) return { x: r.bounds.x + r.bounds.width / 2, y: r.bounds.y + r.bounds.height / 2 };
  return { x: 0, y: 0 };
}

export function evaluateUnitVastu(input: UnitVastuEvaluationInput): VastuReport {
  const northAngleDeg = input.northAngleDeg ?? 0;
  const centroid = input.centroid ?? input.unitCentroid ?? (input.vertices && input.vertices.length > 0 ? computePolygonCentroid(input.vertices) : { x: 0, y: 0 });
  const defects: string[] = [];
  const roomCompliance: RoomVastuAudit[] = [];

  // Group rooms by category
  let kitchenRoom: (typeof input.rooms)[number] | undefined;
  let masterBedRoom: (typeof input.rooms)[number] | undefined;
  let livingRoom: (typeof input.rooms)[number] | undefined;
  let foyerRoom: (typeof input.rooms)[number] | undefined;
  let pujaRoom: (typeof input.rooms)[number] | undefined;
  const toiletRooms: Array<(typeof input.rooms)[number]> = [];

  for (const r of input.rooms) {
    const t = `${r.type ?? ''} ${r.roomType ?? ''} ${r.name ?? ''}`.toLowerCase();
    if (t.includes('kitchen')) kitchenRoom = r;
    else if (t.includes('master') && (t.includes('bed') || t.includes('bedroom'))) masterBedRoom = r;
    else if (t.includes('living') || t.includes('hall')) livingRoom = r;
    else if (t.includes('foyer') || t.includes('entrance')) foyerRoom = r;
    else if (t.includes('pooja') || t.includes('puja') || t.includes('mandir')) pujaRoom = r;
    else if (t.includes('bath') || t.includes('toilet') || t.includes('wc') || t.includes('powder')) {
      toiletRooms.push(r);
    }
  }

  // 1. Kitchen (25 pts)
  // SE or SSE = 25 pts (IDEAL) | NW or E = 18 pts (ACCEPTABLE)
  // Hard defect: NE or SW = 0 pts + hard defect
  let kitchenScore = 0;
  if (kitchenRoom) {
    const kCenter: Point = getRoomCenter(kitchenRoom);
    const kZone = classifyPointToVastuZone(kCenter, centroid, northAngleDeg);

    if (kZone === 'NE' || kZone === 'SW') {
      kitchenScore = 0;
      defects.push(`Kitchen in ${kZone}: Strict MahaVastu defect. Kitchen forbidden in Northeast (water) and Southwest (earth).`);
      roomCompliance.push({
        roomId: kitchenRoom.id ?? 'kitchen',
        roomName: kitchenRoom.name ?? 'Kitchen',
        roomType: 'kitchen',
        zone: kZone,
        status: 'DEFECT',
        score: 0,
        maxScore: 25,
        note: `DEFECT: Kitchen in ${kZone}. Must be located in SE (Agni) or NW (Vayu).`,
      });
    } else if (kZone === 'SE' || kZone === 'SSE') {
      kitchenScore = 25;
      roomCompliance.push({
        roomId: kitchenRoom.id ?? 'kitchen',
        roomName: kitchenRoom.name ?? 'Kitchen',
        roomType: 'kitchen',
        zone: kZone,
        status: 'IDEAL',
        score: 25,
        maxScore: 25,
        note: `IDEAL: Kitchen located in ${kZone} (Agni zone). Auspicious fire element alignment.`,
      });
    } else if (kZone === 'NW' || kZone === 'E' || kZone === 'ENE' || kZone === 'ESE') {
      kitchenScore = 18;
      roomCompliance.push({
        roomId: kitchenRoom.id ?? 'kitchen',
        roomName: kitchenRoom.name ?? 'Kitchen',
        roomType: 'kitchen',
        zone: kZone,
        status: 'ACCEPTABLE',
        score: 18,
        maxScore: 25,
        note: `ACCEPTABLE: Kitchen located in ${kZone} (secondary suitable zone).`,
      });
    } else {
      kitchenScore = 12;
      roomCompliance.push({
        roomId: kitchenRoom.id ?? 'kitchen',
        roomName: kitchenRoom.name ?? 'Kitchen',
        roomType: 'kitchen',
        zone: kZone,
        status: 'ACCEPTABLE',
        score: 12,
        maxScore: 25,
        note: `Tolerable: Kitchen in ${kZone}. Recommend orienting cooking hob to face East.`,
      });
    }
  } else {
    kitchenScore = 20; // Default when no kitchen explicitly mapped
  }

  // 2. Master Bedroom (25 pts)
  // SW = 25 pts (IDEAL) | S or W = 20 pts (ACCEPTABLE)
  let masterScore = 0;
  if (masterBedRoom) {
    const mbCenter: Point = getRoomCenter(masterBedRoom);
    const mbZone = classifyPointToVastuZone(mbCenter, centroid, northAngleDeg);

    if (mbZone === 'SW') {
      masterScore = 25;
      roomCompliance.push({
        roomId: masterBedRoom.id ?? 'master_bedroom',
        roomName: masterBedRoom.name ?? 'Master Bedroom',
        roomType: 'master_bedroom',
        zone: mbZone,
        status: 'IDEAL',
        score: 25,
        maxScore: 25,
        note: 'IDEAL: Master Bedroom in Southwest (Nairutya). Stability, authority, and restful sleep.',
      });
    } else if (mbZone === 'S' || mbZone === 'W' || mbZone === 'SSW' || mbZone === 'WSW' || mbZone === 'SSE') {
      masterScore = 20;
      roomCompliance.push({
        roomId: masterBedRoom.id ?? 'master_bedroom',
        roomName: masterBedRoom.name ?? 'Master Bedroom',
        roomType: 'master_bedroom',
        zone: mbZone,
        status: 'ACCEPTABLE',
        score: 20,
        maxScore: 25,
        note: `ACCEPTABLE: Master Bedroom in ${mbZone}. Solid southern/western grounding.`,
      });
    } else if (mbZone === 'NW' || mbZone === 'WNW' || mbZone === 'NNW') {
      masterScore = 15;
      roomCompliance.push({
        roomId: masterBedRoom.id ?? 'master_bedroom',
        roomName: masterBedRoom.name ?? 'Master Bedroom',
        roomType: 'master_bedroom',
        zone: mbZone,
        status: 'ACCEPTABLE',
        score: 15,
        maxScore: 25,
        note: `Secondary: Master Bedroom in ${mbZone}. Suitable for secondary or guest suite.`,
      });
    } else {
      masterScore = 10;
      roomCompliance.push({
        roomId: masterBedRoom.id ?? 'master_bedroom',
        roomName: masterBedRoom.name ?? 'Master Bedroom',
        roomType: 'master_bedroom',
        zone: mbZone,
        status: 'ACCEPTABLE',
        score: 10,
        maxScore: 25,
        note: `Sub-optimal: Master Bedroom in ${mbZone}. Southwest is strongly preferred.`,
      });
    }
  } else {
    masterScore = 20;
  }

  // 3. Toilets & OTS Shafts (15 pts)
  // WNW, NW, SSE, W, or S = 15 pts (IDEAL)
  // Hard defect: NE, NNE, ENE, or SW -> DEFECT (0 pts + warning)
  let toiletScore = 15;
  const toiletZones: VastuZoneCode[] = [];
  let toiletHasDefect = false;

  for (const tb of toiletRooms) {
    const tCenter: Point = getRoomCenter(tb);
    const tZone = classifyPointToVastuZone(tCenter, centroid, northAngleDeg);
    toiletZones.push(tZone);

    if (tZone === 'NE' || tZone === 'NNE' || tZone === 'ENE' || tZone === 'SW') {
      toiletHasDefect = true;
      defects.push(`Toilet in ${tZone}: Severe MahaVastu defect. Wet rooms strictly forbidden in Ishan (NE) and Nairutya (SW).`);
      roomCompliance.push({
        roomId: tb.id ?? 'toilet',
        roomName: tb.name ?? 'Toilet',
        roomType: 'toilet',
        zone: tZone,
        status: 'DEFECT',
        score: 0,
        maxScore: 15,
        note: `DEFECT: Toilet in ${tZone}. Contaminates sacred/stability energy vortex. Relocate to WNW/NW/S.`,
      });
    } else if (['WNW', 'NW', 'SSE', 'W', 'S', 'SSW', 'NNW'].includes(tZone)) {
      roomCompliance.push({
        roomId: tb.id ?? 'toilet',
        roomName: tb.name ?? 'Toilet',
        roomType: 'toilet',
        zone: tZone,
        status: 'IDEAL',
        score: 15,
        maxScore: 15,
        note: `IDEAL: Toilet in ${tZone}. Favorable drainage and ventilation alignment.`,
      });
    } else {
      roomCompliance.push({
        roomId: tb.id ?? 'toilet',
        roomName: tb.name ?? 'Toilet',
        roomType: 'toilet',
        zone: tZone,
        status: 'ACCEPTABLE',
        score: 10,
        maxScore: 15,
        note: `ACCEPTABLE: Toilet in ${tZone}. Non-defective disposal zone.`,
      });
    }
  }

  if (toiletHasDefect) {
    toiletScore = 0;
  } else if (toiletRooms.length > 0) {
    const allIdeal = toiletZones.every(z => ['WNW', 'NW', 'SSE', 'W', 'S', 'SSW', 'NNW'].includes(z));
    toiletScore = allIdeal ? 15 : 12;
  }

  // 4. Puja / Mandir Space (10 pts)
  // NE, E, or N with zero shared toilet walls = 10 pts (IDEAL)
  let pujaScore = 0;
  if (pujaRoom) {
    const pCenter: Point = getRoomCenter(pujaRoom);
    const pZone = classifyPointToVastuZone(pCenter, centroid, northAngleDeg);
    if (['NE', 'NNE', 'E', 'ENE', 'N'].includes(pZone)) {
      pujaScore = 10;
      roomCompliance.push({
        roomId: pujaRoom.id ?? 'puja',
        roomName: pujaRoom.name ?? 'Puja Mandir',
        roomType: 'puja',
        zone: pZone,
        status: 'IDEAL',
        score: 10,
        maxScore: 10,
        note: `IDEAL: Puja room placed in sacred ${pZone} zone.`,
      });
    } else {
      pujaScore = 6;
      roomCompliance.push({
        roomId: pujaRoom.id ?? 'puja',
        roomName: pujaRoom.name ?? 'Puja Mandir',
        roomType: 'puja',
        zone: pZone,
        status: 'ACCEPTABLE',
        score: 6,
        maxScore: 10,
        note: `Puja room in ${pZone}. Northeast (Ishan) is recommended.`,
      });
    }
  } else {
    // If no explicit puja room in apartment typology, check if NE zone is pure (no toilets)
    const neIsPure = !toiletZones.some(z => ['NE', 'NNE', 'ENE'].includes(z));
    pujaScore = neIsPure ? 10 : 3;
    if (neIsPure) {
      roomCompliance.push({
        roomId: 'ishan_mandir_zone',
        roomName: 'Ishan (NE) Zone Purity',
        roomType: 'puja_zone',
        zone: 'NE',
        status: 'IDEAL',
        score: 10,
        maxScore: 10,
        note: 'IDEAL: Sacred Northeast (Ishan) sector is pure and free of toilets/wet stacks.',
      });
    }
  }

  // 5. Living Room & Sit-Out Balcony (15 pts)
  // Opening toward N, NE, or E = 15 pts (IDEAL) | NW or SE = 10 pts
  let livingScore = 0;
  if (livingRoom) {
    const lCenter: Point = getRoomCenter(livingRoom);
    const lZone = classifyPointToVastuZone(lCenter, centroid, northAngleDeg);
    if (['N', 'NNE', 'NE', 'ENE', 'E'].includes(lZone)) {
      livingScore = 15;
      roomCompliance.push({
        roomId: livingRoom.id ?? 'living',
        roomName: livingRoom.name ?? 'Living Room',
        roomType: 'living',
        zone: lZone,
        status: 'IDEAL',
        score: 15,
        maxScore: 15,
        note: `IDEAL: Living room in ${lZone}. Ample light, positive prana, and open outlook.`,
      });
    } else if (['NW', 'WNW', 'SE', 'ESE'].includes(lZone)) {
      livingScore = 12;
      roomCompliance.push({
        roomId: livingRoom.id ?? 'living',
        roomName: livingRoom.name ?? 'Living Room',
        roomType: 'living',
        zone: lZone,
        status: 'ACCEPTABLE',
        score: 12,
        maxScore: 15,
        note: `ACCEPTABLE: Living room in ${lZone} zone.`,
      });
    } else {
      livingScore = 10;
      roomCompliance.push({
        roomId: livingRoom.id ?? 'living',
        roomName: livingRoom.name ?? 'Living Room',
        roomType: 'living',
        zone: lZone,
        status: 'ACCEPTABLE',
        score: 10,
        maxScore: 15,
        note: `Tolerable: Living room in ${lZone}.`,
      });
    }
  } else {
    livingScore = 12;
  }

  // 6. Main Entrance / Foyer & Brahmasthana (10 pts)
  // Entrance Foyer in auspicious Padas + unit centroid falling inside open Living/Dining zone = 10 pts
  let entranceScore = 0;
  let entranceZone: VastuZoneCode = 'N';
  const entryPt = input.entrancePoint ?? (foyerRoom ? getRoomCenter(foyerRoom) : centroid);

  entranceZone = classifyPointToVastuZone(entryPt, centroid, northAngleDeg);

  // Foyer in auspicious direction (N, NE, E, NW)
  const isAuspiciousEntrance = ['N', 'NNE', 'NE', 'ENE', 'E', 'NW', 'NNW', 'W'].includes(entranceZone);
  const entrancePts = isAuspiciousEntrance ? 5 : 3;

  // Brahmasthana center check: does centroid fall inside open living/dining/circulation and not in a toilet?
  let centroidInToilet = false;
  for (const tb of toiletRooms) {
    if (tb.bounds) {
      if (
        centroid.x >= tb.bounds.x &&
        centroid.x <= tb.bounds.x + tb.bounds.width &&
        centroid.y >= tb.bounds.y &&
        centroid.y <= tb.bounds.y + tb.bounds.height
      ) {
        centroidInToilet = true;
        break;
      }
    }
  }

  const brahmaPts = !centroidInToilet ? 5 : 0;
  if (centroidInToilet) {
    defects.push('Brahmasthana (geometric centroid) compromised by wet room enclosure.');
  }

  entranceScore = entrancePts + brahmaPts;

  roomCompliance.push({
    roomId: foyerRoom?.id ?? 'main_entrance_foyer',
    roomName: 'Main Entrance & Brahmasthana',
    roomType: 'entrance',
    zone: entranceZone,
    status: isAuspiciousEntrance && !centroidInToilet ? 'IDEAL' : 'ACCEPTABLE',
    score: entranceScore,
    maxScore: 10,
    note: `Entrance in ${entranceZone} (${entrancePts}/5 pts) + Brahmasthana center unencumbered (${brahmaPts}/5 pts).`,
  });

  // Calculate overall score (0–100)
  const overallScore = Math.min(100, Math.max(0, kitchenScore + masterScore + toiletScore + pujaScore + livingScore + entranceScore));

  const grade: 'A+' | 'A' | 'B' | 'C' =
    overallScore >= 90 ? 'A+' : overallScore >= 80 ? 'A' : overallScore >= 65 ? 'B' : 'C';

  // Radius for 16-zone display based on footprint size
  let maxDist = 8;
  for (const p of (input.vertices ?? [])) {
    const d = Math.hypot(p.x - centroid.x, p.y - centroid.y);
    if (d > maxDist) maxDist = d;
  }
  const zones = compute16VastuZones(centroid, maxDist * 1.05, northAngleDeg);

  return {
    overallScore,
    grade,
    centroid,
    zones,
    roomCompliance,
    defects,
  };
}

// ── 4. 2D SVG Vastu Chakra Compass Overlay ──────────────────────────────────

export interface RenderVastuChakraOptions {
  readonly scale?: number; // pixels per metre (e.g. 24 or 30)
  readonly showZoneLabels?: boolean;
  readonly showStatusPills?: boolean;
  readonly opacity?: number;
}

/**
 * Generates an architectural SVG overlay of the 16-Zone MahaVastu Chakra Compass
 * with Brahmasthana center marker, radial rays, degree rings, and colored room compliance badges.
 */
export function renderVastuChakraSvgOverlay(
  report: VastuReport,
  options: RenderVastuChakraOptions = {},
): string {
  const scale = options.scale ?? 24;
  const showLabels = options.showZoneLabels ?? true;
  const opacity = options.opacity ?? 0.85;

  const cx = report.centroid.x * scale;
  const cy = report.centroid.y * scale;

  // Maximum radius in screen pixels
  const outerRadiusM = 9;
  const rScreen = outerRadiusM * scale;
  const innerRing = rScreen * 0.35;
  const brahmaRadius = 1.2 * scale;

  const svgElements: string[] = [];

  // Group container
  svgElements.push(`<g id="vastu-chakra-compass-overlay" class="vastu-chakra-overlay" opacity="${opacity}" style="pointer-events:none;">`);

  // 1. Semi-transparent concentric guidance rings
  svgElements.push(`
    <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rScreen.toFixed(1)}" fill="none" stroke="#6366F1" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.6"/>
    <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${innerRing.toFixed(1)}" fill="none" stroke="#818CF8" stroke-width="0.8" opacity="0.4"/>
  `);

  // 2. Brahmasthana Center Marker (Sacred Nucleus)
  svgElements.push(`
    <g id="brahmasthana-nucleus" class="brahmasthana-core">
      <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${brahmaRadius.toFixed(1)}" fill="#FEF08A" fill-opacity="0.25" stroke="#EAB308" stroke-width="1.5"/>
      <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4" fill="#CA8A04"/>
      <line x1="${(cx - 10).toFixed(1)}" y1="${cy.toFixed(1)}" x2="${(cx + 10).toFixed(1)}" y2="${cy.toFixed(1)}" stroke="#CA8A04" stroke-width="1"/>
      <line x1="${cx.toFixed(1)}" y1="${(cy - 10).toFixed(1)}" x2="${cx.toFixed(1)}" y2="${(cy + 10).toFixed(1)}" stroke="#CA8A04" stroke-width="1"/>
      <text x="${cx.toFixed(1)}" y="${(cy + brahmaRadius + 10).toFixed(1)}" text-anchor="middle" font-family="Inter, Roboto, sans-serif" font-size="8" font-weight="700" fill="#854D0E">BRAHMASTHANA</text>
    </g>
  `);

  // 3. 16 Dashed Radial Rays & Zone Labels
  for (const zone of (report.zones ?? [])) {
    const rad = ((zone.centerDeg - 90) * Math.PI) / 180;
    // Ray endpoint
    const rayX = cx + rScreen * Math.cos(rad);
    const rayY = cy + rScreen * Math.sin(rad);

    // Label position slightly beyond outer ring
    const lblX = cx + (rScreen + 16) * Math.cos(rad);
    const lblY = cy + (rScreen + 16) * Math.sin(rad);

    // Color code major cardinal/intercardinal vs secondary
    const isMajor = ['NE', 'SE', 'SW', 'NW', 'N', 'E', 'S', 'W'].includes(zone.code);
    const rayStroke = isMajor ? '#4F46E5' : '#94A3B8';
    const rayWidth = isMajor ? '1.0' : '0.6';

    svgElements.push(`
      <line class="vastu-radial-ray" x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${rayX.toFixed(1)}" y2="${rayY.toFixed(1)}" stroke="${rayStroke}" stroke-width="${rayWidth}" stroke-dasharray="4,4" opacity="0.6"/>
    `);

    if (showLabels) {
      const isIshan = zone.code === 'NE';
      const isAgni = zone.code === 'SE';
      const isNairutya = zone.code === 'SW';
      const isVayu = zone.code === 'NW';
      const badgeFill = isIshan ? '#0284C7' : isAgni ? '#DC2626' : isNairutya ? '#7C3AED' : isVayu ? '#059669' : '#334155';

      svgElements.push(`
        <g transform="translate(${lblX.toFixed(1)}, ${lblY.toFixed(1)})">
          <rect x="-16" y="-8" width="32" height="16" rx="4" fill="${badgeFill}" fill-opacity="0.9"/>
          <text x="0" y="3.5" text-anchor="middle" font-family="Inter, Roboto, sans-serif" font-size="7.5" font-weight="700" fill="#FFFFFF">${zone.code}</text>
        </g>
      `);
    }
  }

  // 4. Room Compliance Status Indicators (IDEAL: Emerald, ACCEPTABLE: Amber, DEFECT: Crimson)
  if (options.showStatusPills !== false && report.roomCompliance) {
    for (const audit of report.roomCompliance) {
      // Find matching zone center to display badge near outer perimeter or room
      const zMeta = VASTU_16_ZONES.find(z => z.code === audit.zone);
      if (!zMeta) continue;
      const rad = ((zMeta.centerDeg - 90) * Math.PI) / 180;
      const pillDist = rScreen * 0.75;
      const px = cx + pillDist * Math.cos(rad);
      const py = cy + pillDist * Math.sin(rad);

      const color = audit.status === 'IDEAL' ? '#10B981' : audit.status === 'ACCEPTABLE' ? '#F59E0B' : '#EF4444';
      const statusIcon = audit.status === 'IDEAL' ? '✓' : audit.status === 'ACCEPTABLE' ? '○' : '⚠';

      svgElements.push(`
        <g transform="translate(${px.toFixed(1)}, ${py.toFixed(1)})" opacity="0.95">
          <circle cx="0" cy="0" r="7" fill="${color}"/>
          <text x="0" y="3" text-anchor="middle" font-family="Inter, Roboto, sans-serif" font-size="8" font-weight="800" fill="#FFFFFF">${statusIcon}</text>
        </g>
      `);
    }
  }

  // Close group
  svgElements.push('</g>');

  return svgElements.join('\n');
}
