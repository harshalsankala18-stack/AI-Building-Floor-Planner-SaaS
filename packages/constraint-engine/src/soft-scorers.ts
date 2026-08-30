/**
 * Soft constraint scorers.
 *
 * Each scorer evaluates a quality dimension and returns a CategoryScore (0-100).
 * Higher scores indicate better quality. All scores are normalized.
 */

import type { Building, Floor, Room, CategoryScore, ScoreDetail } from '@ai-floor-planner/core';
import { RoomType } from '@ai-floor-planner/core';
import { polygonsAdjacent } from '@ai-floor-planner/geometry-engine';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getAllRooms(building: Building): Room[] {
  return building.floors.flatMap(f => [...f.rooms]);
}

function isExternalRoom(room: Room, floor: Floor): boolean {
  // A room is external if any edge of its boundary touches the floor boundary
  if (floor.boundary.points.length < 3) return false;
  return polygonsAdjacent(room.boundary, floor.boundary);
}

function roomInCorner(
  room: Room,
  building: Building,
  corner: 'NE' | 'NW' | 'SE' | 'SW',
): boolean {
  const site = building.site;
  const cx = room.x + room.width / 2;
  const cy = room.y + room.height / 2;
  const midX = site.plotWidth / 2;
  const midY = site.plotDepth / 2;

  switch (corner) {
    case 'NE': return cx > midX && cy < midY;
    case 'NW': return cx < midX && cy < midY;
    case 'SE': return cx > midX && cy > midY;
    case 'SW': return cx < midX && cy > midY;
  }
}

// ─── Daylight Score ─────────────────────────────────────────────────────────

export function scoreDaylight(building: Building, weight: number): CategoryScore {
  const details: ScoreDetail[] = [];
  let totalPoints = 0;
  let totalMax = 0;

  for (const floor of building.floors) {
    for (const room of floor.rooms) {
      const external = isExternalRoom(room, floor);

      if (room.type === RoomType.Bedroom) {
        totalMax += 20;
        if (external) {
          totalPoints += 20;
          details.push({ factor: `${room.name} has external wall`, points: 20, maxPoints: 20, description: 'Bedroom daylight access' });
        } else {
          details.push({ factor: `${room.name} lacks external wall`, points: 0, maxPoints: 20, description: 'Bedroom without daylight' });
        }
      }

      if (room.type === RoomType.Living) {
        totalMax += 25;
        if (external) {
          totalPoints += 25;
          details.push({ factor: `${room.name} has external wall`, points: 25, maxPoints: 25, description: 'Living room daylight' });
        } else {
          details.push({ factor: `${room.name} lacks external wall`, points: 0, maxPoints: 25, description: 'Living without daylight' });
        }
      }

      if (room.type === RoomType.Kitchen) {
        totalMax += 15;
        if (external) {
          totalPoints += 15;
          details.push({ factor: `${room.name} has external wall`, points: 15, maxPoints: 15, description: 'Kitchen daylight' });
        } else {
          details.push({ factor: `${room.name} lacks external wall`, points: 0, maxPoints: 15, description: 'Kitchen without daylight' });
        }
      }
    }
  }

  if (totalMax === 0) totalMax = 1; // Avoid divide by zero
  const score = Math.round(Math.min(100, (totalPoints / totalMax) * 100));

  return { category: 'daylight', score, maxScore: 100, weight, details };
}

// ─── Privacy Score ──────────────────────────────────────────────────────────

export function scorePrivacy(building: Building, weight: number): CategoryScore {
  const details: ScoreDetail[] = [];
  const rooms = getAllRooms(building);

  let totalPoints = 0;
  let totalMax = 0;

  const bedrooms = rooms.filter(r => r.type === RoomType.Bedroom);
  const foyers = rooms.filter(r => r.type === RoomType.Foyer || r.type === RoomType.Corridor);

  // Bedrooms not adjacent to entrance/foyer
  for (const bedroom of bedrooms) {
    totalMax += 15;
    let adjacentToEntrance = false;
    for (const foyer of foyers) {
      if (polygonsAdjacent(bedroom.boundary, foyer.boundary)) {
        adjacentToEntrance = true;
      }
    }
    if (!adjacentToEntrance) {
      totalPoints += 15;
      details.push({ factor: `${bedroom.name} separated from entrance`, points: 15, maxPoints: 15, description: 'Privacy maintained' });
    } else {
      details.push({ factor: `${bedroom.name} adjacent to entrance`, points: 0, maxPoints: 15, description: 'Privacy concern' });
    }
  }

  if (totalMax === 0) totalMax = 1;
  const score = Math.round(Math.min(100, (totalPoints / totalMax) * 100));

  return { category: 'privacy', score, maxScore: 100, weight, details };
}

// ─── Vastu Score ────────────────────────────────────────────────────────────

export function scoreVastu(building: Building, weight: number): CategoryScore {
  const details: ScoreDetail[] = [];
  const rooms = getAllRooms(building);

  let totalPoints = 0;
  let totalMax = 0;

  // Kitchen in SE corner
  const kitchens = rooms.filter(r => r.type === RoomType.Kitchen);
  for (const kitchen of kitchens) {
    totalMax += 15;
    if (roomInCorner(kitchen, building, 'SE')) {
      totalPoints += 15;
      details.push({ factor: 'Kitchen in SE', points: 15, maxPoints: 15, description: 'Vastu compliant kitchen placement' });
    } else {
      details.push({ factor: 'Kitchen not in SE', points: 0, maxPoints: 15, description: 'Kitchen not in recommended SE corner' });
    }
  }

  // Master bedroom in SW
  const bedrooms = rooms.filter(r => r.type === RoomType.Bedroom);
  if (bedrooms.length > 0) {
    totalMax += 15;
    // Largest bedroom is master
    const master = bedrooms.reduce((a, b) => a.area > b.area ? a : b);
    if (roomInCorner(master, building, 'SW')) {
      totalPoints += 15;
      details.push({ factor: 'Master bedroom in SW', points: 15, maxPoints: 15, description: 'Vastu compliant master bedroom' });
    } else {
      details.push({ factor: 'Master bedroom not in SW', points: 0, maxPoints: 15, description: 'Master not in recommended SW' });
    }
  }

  // Pooja room in NE
  const pooja = rooms.filter(r => r.type === RoomType.Pooja);
  for (const p of pooja) {
    totalMax += 15;
    if (roomInCorner(p, building, 'NE')) {
      totalPoints += 15;
      details.push({ factor: 'Pooja in NE', points: 15, maxPoints: 15, description: 'Vastu compliant pooja room' });
    } else {
      details.push({ factor: 'Pooja not in NE', points: 0, maxPoints: 15, description: 'Pooja not in recommended NE' });
    }
  }

  if (totalMax === 0) totalMax = 1;
  const score = Math.round(Math.min(100, (totalPoints / totalMax) * 100));

  return { category: 'vastu', score, maxScore: 100, weight, details };
}

// ─── Adjacency Score ────────────────────────────────────────────────────────

export function scoreAdjacency(building: Building, weight: number): CategoryScore {
  const details: ScoreDetail[] = [];
  const rooms = getAllRooms(building);

  let totalPoints = 0;
  let totalMax = 0;

  // Kitchen adjacent to dining
  const kitchens = rooms.filter(r => r.type === RoomType.Kitchen);
  const dinings = rooms.filter(r => r.type === RoomType.Dining);

  if (kitchens.length > 0 && dinings.length > 0) {
    totalMax += 20;
    let found = false;
    for (const k of kitchens) {
      for (const d of dinings) {
        if (polygonsAdjacent(k.boundary, d.boundary)) found = true;
      }
    }
    if (found) {
      totalPoints += 20;
      details.push({ factor: 'Kitchen adj. dining', points: 20, maxPoints: 20, description: 'Good workflow' });
    } else {
      details.push({ factor: 'Kitchen not adj. dining', points: 0, maxPoints: 20, description: 'Kitchen-dining disconnected' });
    }
  }

  // Dining adjacent to living
  const livings = rooms.filter(r => r.type === RoomType.Living);
  if (dinings.length > 0 && livings.length > 0) {
    totalMax += 15;
    let found = false;
    for (const d of dinings) {
      for (const l of livings) {
        if (polygonsAdjacent(d.boundary, l.boundary)) found = true;
      }
    }
    if (found) {
      totalPoints += 15;
      details.push({ factor: 'Dining adj. living', points: 15, maxPoints: 15, description: 'Good social flow' });
    } else {
      details.push({ factor: 'Dining not adj. living', points: 0, maxPoints: 15, description: 'Dining-living disconnected' });
    }
  }

  // Master bedroom with attached bathroom
  const bathrooms = rooms.filter(r => r.type === RoomType.Bathroom);
  const bedrooms = rooms.filter(r => r.type === RoomType.Bedroom);
  if (bedrooms.length > 0 && bathrooms.length > 0) {
    totalMax += 20;
    const master = bedrooms.reduce((a, b) => a.area > b.area ? a : b);
    let found = false;
    for (const bath of bathrooms) {
      if (polygonsAdjacent(master.boundary, bath.boundary)) found = true;
    }
    if (found) {
      totalPoints += 20;
      details.push({ factor: 'Master has attached bath', points: 20, maxPoints: 20, description: 'Attached bathroom' });
    } else {
      details.push({ factor: 'Master no attached bath', points: 0, maxPoints: 20, description: 'Master lacks attached bathroom' });
    }
  }

  if (totalMax === 0) totalMax = 1;
  const score = Math.round(Math.min(100, (totalPoints / totalMax) * 100));

  return { category: 'adjacency', score, maxScore: 100, weight, details };
}

// ─── Geometry / Proportion Score ────────────────────────────────────────────

export function scoreGeometry(building: Building, weight: number): CategoryScore {
  const details: ScoreDetail[] = [];
  const rooms = getAllRooms(building);

  let totalPoints = 0;
  let totalMax = 0;

  for (const room of rooms) {
    const aspect = room.width > room.height
      ? room.width / room.height
      : room.height / room.width;

    totalMax += 10;
    if (aspect <= 2) {
      totalPoints += 10;
      details.push({ factor: `${room.name} good proportion`, points: 10, maxPoints: 10, description: `Aspect ${aspect.toFixed(1)}:1` });
    } else if (aspect <= 3) {
      totalPoints += 5;
      details.push({ factor: `${room.name} stretched`, points: 5, maxPoints: 10, description: `Aspect ${aspect.toFixed(1)}:1 (>2:1)` });
    } else {
      details.push({ factor: `${room.name} very stretched`, points: 0, maxPoints: 10, description: `Aspect ${aspect.toFixed(1)}:1 (>3:1)` });
    }
  }

  if (totalMax === 0) totalMax = 1;
  const score = Math.round(Math.min(100, (totalPoints / totalMax) * 100));

  return { category: 'geometry', score, maxScore: 100, weight, details };
}

// ─── Accessibility / Circulation Score ──────────────────────────────────────

export function scoreAccessibility(building: Building, weight: number): CategoryScore {
  const details: ScoreDetail[] = [];
  const rooms = getAllRooms(building);

  let totalPoints = 0;
  let totalMax = 0;

  // Corridor area ratio penalty
  const corridors = rooms.filter(r => r.type === RoomType.Corridor);
  const totalArea = rooms.reduce((s, r) => s + r.area, 0);
  const corridorArea = corridors.reduce((s, r) => s + r.area, 0);

  if (totalArea > 0) {
    totalMax += 30;
    const ratio = corridorArea / totalArea;
    if (ratio <= 0.10) {
      totalPoints += 30;
      details.push({ factor: 'Efficient circulation', points: 30, maxPoints: 30, description: `Corridor ratio: ${(ratio * 100).toFixed(1)}%` });
    } else if (ratio <= 0.15) {
      totalPoints += 20;
      details.push({ factor: 'Acceptable circulation', points: 20, maxPoints: 30, description: `Corridor ratio: ${(ratio * 100).toFixed(1)}%` });
    } else {
      totalPoints += 5;
      details.push({ factor: 'High corridor area', points: 5, maxPoints: 30, description: `Corridor ratio: ${(ratio * 100).toFixed(1)}% (>15%)` });
    }
  }

  if (totalMax === 0) totalMax = 1;
  const score = Math.round(Math.min(100, (totalPoints / totalMax) * 100));

  return { category: 'accessibility', score, maxScore: 100, weight, details };
}
