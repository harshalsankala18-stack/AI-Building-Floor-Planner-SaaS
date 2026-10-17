/**
 * Vastu Rule Provider — 16-Zone Angular Centroid MahaVastu Classification.
 *
 * Produces Vastu-specific constraints using the 16-zone (22.5° wedge) angular
 * centroid classification from the MahaVastu system. Each room's centroid is
 * classified against the floor boundary's Shoelace polygon centroid (Brahmasthana).
 *
 * Vastu is NOT hard-coded into the core evaluator — it's a pluggable provider.
 */

import type { Constraint, ConstraintResult, EvaluationContext, ResolvedConstraintConfig, RuleProvider } from '../types';
import { ConstraintSeverity, ConstraintCategory } from '../types';
import { RoomType } from '@ai-floor-planner/core';
import { getRoomVastuZone16, type VastuZone16 } from '../helpers/direction';
import { getMasterBedroom, getRoomsByType } from '../helpers/room-queries';

// ── 16-Zone Scoring Tables (per PRD §4.1 Weighted 0–100 Scorecard) ──────────

/** Kitchen (25 pts): SE/SSE = IDEAL, NW/E/ENE/ESE = ACCEPTABLE, NE/SW = DEFECT */
const KITCHEN_IDEAL: ReadonlySet<VastuZone16> = new Set(['SE', 'SSE']);
const KITCHEN_ACCEPTABLE: ReadonlySet<VastuZone16> = new Set(['NW', 'E', 'ENE', 'ESE']);
const KITCHEN_DEFECT: ReadonlySet<VastuZone16> = new Set(['NE', 'SW']);

/** Master Bedroom (25 pts): SW = IDEAL, S/W/SSW/WSW/SSE = ACCEPTABLE, NE/SE = DEFECT */
const MASTER_IDEAL: ReadonlySet<VastuZone16> = new Set(['SW']);
const MASTER_ACCEPTABLE: ReadonlySet<VastuZone16> = new Set(['S', 'W', 'SSW', 'WSW', 'SSE']);

/** Toilets/OTS (15 pts): WNW/NW/SSE/W/S/SSW/NNW = IDEAL, NE/NNE/ENE/SW = DEFECT */
const TOILET_IDEAL: ReadonlySet<VastuZone16> = new Set(['WNW', 'NW', 'SSE', 'W', 'S', 'SSW', 'NNW']);
const TOILET_DEFECT: ReadonlySet<VastuZone16> = new Set(['NE', 'NNE', 'ENE', 'SW']);

/** Puja / Mandir (10 pts): NE/NNE/E/ENE/N = IDEAL */
const PUJA_IDEAL: ReadonlySet<VastuZone16> = new Set(['NE', 'NNE', 'E', 'ENE', 'N']);

/** Living Room & Balcony (15 pts): N/NNE/NE/ENE/E = IDEAL, NW/WNW/SE/ESE = ACCEPTABLE */
const LIVING_IDEAL: ReadonlySet<VastuZone16> = new Set(['N', 'NNE', 'NE', 'ENE', 'E']);
const LIVING_ACCEPTABLE: ReadonlySet<VastuZone16> = new Set(['NW', 'WNW', 'SE', 'ESE']);

/**
 * Vastu Rule Provider — produces constraints when Vastu is enabled.
 *
 * Uses 16-zone angular centroid classification (22.5° MahaVastu wedges)
 * rather than coarse 4-quadrant (NE/SE/SW/NW) classification.
 */
export class VastuRuleProvider implements RuleProvider {
  readonly name = 'vastu';

  getConstraints(config: ResolvedConstraintConfig): Constraint[] {
    if (!config.enableVastu) {
      return [];
    }

    return [
      this.kitchenSE16(),
      this.masterSW16(),
      this.poojaNE16(),
      this.livingNorth16(),
      this.bathroomWNW16(),
      this.entranceFacing16(),
      this.staircaseSW16(),
      this.toiletNotNE16(),
      this.toiletNotSW16(),
      this.kitchenNotNEOrSW16(),
    ];
  }

  // ── Kitchen in SE/SSE (Agni Zone) — 25 pts ─────────────────────────────────

  private kitchenSE16(): Constraint {
    return {
      id: 'SC-VASTU-001',
      name: 'Vastu: Kitchen in SE (Agni)',
      description: 'Kitchen should be in the Southeast (SE/SSE — Agni) zone per 16-zone MahaVastu',
      category: ConstraintCategory.VASTU,
      severity: ConstraintSeverity.SOFT,
      enabled: true,
      evaluate(ctx: EvaluationContext): ConstraintResult[] {
        const kitchens = getRoomsByType(ctx.building, RoomType.Kitchen);
        if (kitchens.length === 0) {
          return [{ constraintId: 'SC-VASTU-001', passed: true, severity: ConstraintSeverity.SOFT, score: 15, maxScore: 15, message: 'Vastu kitchen: not applicable', affectedEntities: [], explanation: 'No kitchen present.' }];
        }
        const floorBoundary = ctx.building.floors[0]?.boundary;
        if (!floorBoundary || floorBoundary.points.length < 3) {
          return [{ constraintId: 'SC-VASTU-001', passed: true, severity: ConstraintSeverity.SOFT, score: 15, maxScore: 15, message: 'Vastu kitchen: no floor boundary', affectedEntities: [], explanation: 'Cannot evaluate.' }];
        }
        const room = kitchens[0]!;
        const zone = getRoomVastuZone16(room.boundary, floorBoundary, ctx.config.orientation);
        const isIdeal = KITCHEN_IDEAL.has(zone);
        const isAccept = KITCHEN_ACCEPTABLE.has(zone);
        const score = isIdeal ? 15 : isAccept ? 11 : 0;
        return [{
          constraintId: 'SC-VASTU-001',
          passed: isIdeal,
          severity: ConstraintSeverity.SOFT,
          score, maxScore: 15,
          message: isIdeal
            ? `Kitchen in ${zone} (Agni zone — Vastu ideal)`
            : isAccept
              ? `Kitchen in ${zone} (acceptable secondary zone)`
              : `Kitchen in ${zone} (Vastu recommends SE/SSE)`,
          affectedEntities: isIdeal ? [] : [room.id],
          explanation: isIdeal
            ? `Kitchen correctly placed in ${zone} — perfect fire element (Agni) alignment per 16-zone MahaVastu.`
            : `Kitchen is in the ${zone} zone. MahaVastu recommends the Southeast (Agni) sector for kitchens.`,
        }];
      },
    };
  }

  // ── Master Bedroom in SW (Nairutya) — 25 pts ──────────────────────────────

  private masterSW16(): Constraint {
    return {
      id: 'SC-VASTU-002',
      name: 'Vastu: Master Bedroom in SW',
      description: 'Master bedroom should be in the Southwest (Nairutya) zone per 16-zone MahaVastu',
      category: ConstraintCategory.VASTU,
      severity: ConstraintSeverity.SOFT,
      enabled: true,
      evaluate(ctx: EvaluationContext): ConstraintResult[] {
        const master = getMasterBedroom(ctx.building);
        if (!master) {
          return [{ constraintId: 'SC-VASTU-002', passed: true, severity: ConstraintSeverity.SOFT, score: 15, maxScore: 15, message: 'Vastu master bedroom: no master identified', affectedEntities: [], explanation: 'No master bedroom to evaluate.' }];
        }
        const floorBoundary = ctx.building.floors[0]?.boundary;
        if (!floorBoundary || floorBoundary.points.length < 3) {
          return [{ constraintId: 'SC-VASTU-002', passed: true, severity: ConstraintSeverity.SOFT, score: 15, maxScore: 15, message: 'Vastu master bedroom: no floor boundary', affectedEntities: [], explanation: 'Cannot evaluate.' }];
        }
        const zone = getRoomVastuZone16(master.boundary, floorBoundary, ctx.config.orientation);
        const isIdeal = MASTER_IDEAL.has(zone);
        const isAccept = MASTER_ACCEPTABLE.has(zone);
        const score = isIdeal ? 15 : isAccept ? 10 : 0;
        return [{
          constraintId: 'SC-VASTU-002',
          passed: isIdeal,
          severity: ConstraintSeverity.SOFT,
          score, maxScore: 15,
          message: isIdeal
            ? 'Master bedroom is in SW (Vastu ideal — Nairutya stability)'
            : isAccept
              ? `Master bedroom is in ${zone} (acceptable SW-adjacent zone)`
              : `Master bedroom is in ${zone} (Vastu recommends SW)`,
          affectedEntities: isIdeal ? [] : [master.id],
          explanation: isIdeal
            ? 'Master bedroom correctly placed in Southwest (Nairutya) — stability, authority, and restful sleep per 16-zone MahaVastu.'
            : `Master bedroom is in ${zone}. MahaVastu recommends the Southwest sector for the master bedroom.`,
        }];
      },
    };
  }

  // ── Puja / Mandir in NE (Ishan) — 10 pts ──────────────────────────────────

  private poojaNE16(): Constraint {
    return {
      id: 'SC-VASTU-003',
      name: 'Vastu: Pooja Room in NE (Ishan)',
      description: 'Pooja/prayer room should be in the Northeast (Ishan) zone per 16-zone MahaVastu',
      category: ConstraintCategory.VASTU,
      severity: ConstraintSeverity.SOFT,
      enabled: true,
      evaluate(ctx: EvaluationContext): ConstraintResult[] {
        const rooms = getRoomsByType(ctx.building, RoomType.Pooja);
        if (rooms.length === 0) {
          return [{ constraintId: 'SC-VASTU-003', passed: true, severity: ConstraintSeverity.SOFT, score: 15, maxScore: 15, message: 'Vastu pooja room: not applicable', affectedEntities: [], explanation: 'No pooja room present.' }];
        }
        const floorBoundary = ctx.building.floors[0]?.boundary;
        if (!floorBoundary || floorBoundary.points.length < 3) {
          return [{ constraintId: 'SC-VASTU-003', passed: true, severity: ConstraintSeverity.SOFT, score: 15, maxScore: 15, message: 'Vastu pooja room: no floor boundary', affectedEntities: [], explanation: 'Cannot evaluate.' }];
        }
        const room = rooms[0]!;
        const zone = getRoomVastuZone16(room.boundary, floorBoundary, ctx.config.orientation);
        const isIdeal = PUJA_IDEAL.has(zone);
        const score = isIdeal ? 15 : 8;
        return [{
          constraintId: 'SC-VASTU-003',
          passed: isIdeal,
          severity: ConstraintSeverity.SOFT,
          score, maxScore: 15,
          message: isIdeal
            ? `Pooja room in ${zone} (sacred Ishan sector — Vastu ideal)`
            : `Pooja room in ${zone} (NE/N/E recommended)`,
          affectedEntities: isIdeal ? [] : [room.id],
          explanation: isIdeal
            ? `Pooja room correctly placed in the sacred ${zone} sector — positive spiritual energy per 16-zone MahaVastu.`
            : `Pooja room is in ${zone}. MahaVastu recommends the Northeast (Ishan) sector for prayer rooms.`,
        }];
      },
    };
  }

  // ── Living Room in N/NE/E — 15 pts ─────────────────────────────────────────

  private livingNorth16(): Constraint {
    return {
      id: 'SC-VASTU-004',
      name: 'Vastu: Living Room in N/NE/E',
      description: 'Living room should be in the North, Northeast, or East zone per 16-zone MahaVastu',
      category: ConstraintCategory.VASTU,
      severity: ConstraintSeverity.SOFT,
      enabled: true,
      evaluate(ctx: EvaluationContext): ConstraintResult[] {
        const livings = getRoomsByType(ctx.building, RoomType.Living);
        if (livings.length === 0) {
          return [{ constraintId: 'SC-VASTU-004', passed: true, severity: ConstraintSeverity.SOFT, score: 10, maxScore: 10, message: 'Vastu living room: not applicable', affectedEntities: [], explanation: 'No living room present.' }];
        }
        const floorBoundary = ctx.building.floors[0]?.boundary;
        if (!floorBoundary || floorBoundary.points.length < 3) {
          return [{ constraintId: 'SC-VASTU-004', passed: true, severity: ConstraintSeverity.SOFT, score: 10, maxScore: 10, message: 'Vastu living room: no floor boundary', affectedEntities: [], explanation: 'Cannot evaluate.' }];
        }
        const room = livings[0]!;
        const zone = getRoomVastuZone16(room.boundary, floorBoundary, ctx.config.orientation);
        const isIdeal = LIVING_IDEAL.has(zone);
        const isAccept = LIVING_ACCEPTABLE.has(zone);
        const score = isIdeal ? 10 : isAccept ? 7 : 0;
        return [{
          constraintId: 'SC-VASTU-004',
          passed: isIdeal,
          severity: ConstraintSeverity.SOFT,
          score, maxScore: 10,
          message: isIdeal
            ? `Living room in ${zone} (ideal light & prana sector)`
            : isAccept
              ? `Living room in ${zone} (acceptable zone)`
              : `Living room in ${zone} (N/NE/E recommended)`,
          affectedEntities: isIdeal ? [] : [room.id],
          explanation: isIdeal
            ? `Living room in ${zone} — ample daylight, positive prana, and open outlook per 16-zone MahaVastu.`
            : `Living room is in ${zone}. MahaVastu recommends N, NE, or E zones for social energy.`,
        }];
      },
    };
  }

  // ── Bathroom in WNW/NW/W — 15 pts ─────────────────────────────────────────

  private bathroomWNW16(): Constraint {
    return {
      id: 'SC-VASTU-005',
      name: 'Vastu: Bathroom in WNW/NW/W/S',
      description: 'Bathrooms should be in the WNW, NW, SSE, W, or S zone per 16-zone MahaVastu',
      category: ConstraintCategory.VASTU,
      severity: ConstraintSeverity.SOFT,
      enabled: true,
      evaluate(ctx: EvaluationContext): ConstraintResult[] {
        const bathrooms = getRoomsByType(ctx.building, RoomType.Bathroom);
        if (bathrooms.length === 0) {
          return [{ constraintId: 'SC-VASTU-005', passed: true, severity: ConstraintSeverity.SOFT, score: 10, maxScore: 10, message: 'Vastu bathroom: not applicable', affectedEntities: [], explanation: 'No bathrooms present.' }];
        }
        const floorBoundary = ctx.building.floors[0]?.boundary;
        if (!floorBoundary || floorBoundary.points.length < 3) {
          return [{ constraintId: 'SC-VASTU-005', passed: true, severity: ConstraintSeverity.SOFT, score: 10, maxScore: 10, message: 'Vastu bathroom: no floor boundary', affectedEntities: [], explanation: 'Cannot evaluate.' }];
        }
        const room = bathrooms[0]!;
        const zone = getRoomVastuZone16(room.boundary, floorBoundary, ctx.config.orientation);
        const isIdeal = TOILET_IDEAL.has(zone);
        const isDefect = TOILET_DEFECT.has(zone);
        const score = isIdeal ? 10 : isDefect ? 0 : 6;
        return [{
          constraintId: 'SC-VASTU-005',
          passed: isIdeal,
          severity: ConstraintSeverity.SOFT,
          score, maxScore: 10,
          message: isIdeal
            ? `Bathroom in ${zone} (ideal disposal/ventilation zone)`
            : isDefect
              ? `Bathroom in ${zone} — Vastu defect (contaminates sacred/stability zone)`
              : `Bathroom in ${zone} (non-ideal but tolerable)`,
          affectedEntities: isIdeal ? [] : [room.id],
          explanation: isIdeal
            ? `Bathroom placement in ${zone} aligns with MahaVastu drainage and ventilation principles.`
            : isDefect
              ? `Bathroom in ${zone} is a severe MahaVastu defect. Wet rooms are forbidden in NE (Ishan) and SW (Nairutya). Relocate to WNW, NW, or S.`
              : `Bathroom in ${zone}. MahaVastu recommends WNW, NW, SSE, W, or S for water element alignment.`,
        }];
      },
    };
  }

  // ── Entrance Facing — 15 pts ───────────────────────────────────────────────

  private entranceFacing16(): Constraint {
    return {
      id: 'SC-VASTU-006',
      name: 'Vastu: Entrance Facing N/E',
      description: 'Main entrance should face North or East (auspicious entry)',
      category: ConstraintCategory.VASTU,
      severity: ConstraintSeverity.SOFT,
      enabled: true,
      evaluate(ctx: EvaluationContext): ConstraintResult[] {
        const roadFacing = ctx.building.site.roadFacing;
        const favorable = roadFacing === 'north' || roadFacing === 'east';
        return [{
          constraintId: 'SC-VASTU-006',
          passed: favorable,
          severity: ConstraintSeverity.SOFT,
          score: favorable ? 15 : 0,
          maxScore: 15,
          message: favorable
            ? `Entrance faces ${roadFacing} (Vastu auspicious)`
            : `Entrance faces ${roadFacing} (Vastu recommends North or East)`,
          affectedEntities: [],
          explanation: favorable
            ? `Main entrance facing ${roadFacing} is auspicious per MahaVastu — positive energy flow.`
            : `Entrance faces ${roadFacing}. MahaVastu recommends North or East-facing entrances for prosperity.`,
        }];
      },
    };
  }

  // ── Staircase in SW/S/W — 10 pts ──────────────────────────────────────────

  private staircaseSW16(): Constraint {
    return {
      id: 'SC-VASTU-007',
      name: 'Vastu: Staircase in SW/S/W',
      description: 'Staircase should be in Southwest, South, or West per 16-zone MahaVastu',
      category: ConstraintCategory.VASTU,
      severity: ConstraintSeverity.SOFT,
      enabled: true,
      evaluate(ctx: EvaluationContext): ConstraintResult[] {
        const stairs = getRoomsByType(ctx.building, RoomType.Staircase);
        if (stairs.length === 0) {
          return [{ constraintId: 'SC-VASTU-007', passed: true, severity: ConstraintSeverity.SOFT, score: 10, maxScore: 10, message: 'Vastu staircase: not applicable', affectedEntities: [], explanation: 'No staircase present.' }];
        }
        const floorBoundary = ctx.building.floors[0]?.boundary;
        if (!floorBoundary || floorBoundary.points.length < 3) {
          return [{ constraintId: 'SC-VASTU-007', passed: true, severity: ConstraintSeverity.SOFT, score: 10, maxScore: 10, message: 'Vastu staircase: no floor boundary', affectedEntities: [], explanation: 'Cannot evaluate.' }];
        }
        const room = stairs[0]!;
        const zone = getRoomVastuZone16(room.boundary, floorBoundary, ctx.config.orientation);
        const stairIdeal = new Set<VastuZone16>(['SW', 'SSW', 'WSW', 'S', 'W']);
        const isIdeal = stairIdeal.has(zone);
        const score = isIdeal ? 10 : 5;
        return [{
          constraintId: 'SC-VASTU-007',
          passed: isIdeal,
          severity: ConstraintSeverity.SOFT,
          score, maxScore: 10,
          message: isIdeal
            ? `Staircase in ${zone} (Vastu compliant — SW/S/W sector)`
            : `Staircase in ${zone} (SW/S/W recommended)`,
          affectedEntities: isIdeal ? [] : [room.id],
          explanation: isIdeal
            ? `Staircase correctly in the ${zone} sector per MahaVastu heavy-element placement rules.`
            : `Staircase in ${zone}. MahaVastu recommends SW, S, or W for vertical circulation.`,
        }];
      },
    };
  }

  // ── Hard Defect: Toilet NOT in NE — 10 pts ────────────────────────────────

  private toiletNotNE16(): Constraint {
    return {
      id: 'SC-VASTU-008',
      name: 'Vastu: Toilet NOT in NE',
      description: 'Toilets/bathrooms must not be in the sacred NE/NNE/ENE zone (16-zone MahaVastu)',
      category: ConstraintCategory.VASTU,
      severity: ConstraintSeverity.SOFT,
      enabled: true,
      evaluate(ctx: EvaluationContext): ConstraintResult[] {
        const bathrooms = getRoomsByType(ctx.building, RoomType.Bathroom);
        if (bathrooms.length === 0) {
          return [{ constraintId: 'SC-VASTU-008', passed: true, severity: ConstraintSeverity.SOFT, score: 10, maxScore: 10, message: 'Vastu toilet NE check: no bathrooms', affectedEntities: [], explanation: 'No bathrooms present.' }];
        }
        const floorBoundary = ctx.building.floors[0]?.boundary;
        if (!floorBoundary || floorBoundary.points.length < 3) {
          return [{ constraintId: 'SC-VASTU-008', passed: true, severity: ConstraintSeverity.SOFT, score: 10, maxScore: 10, message: 'Vastu toilet NE check: no floor boundary', affectedEntities: [], explanation: 'Cannot evaluate.' }];
        }

        const neDefect = new Set<VastuZone16>(['NE', 'NNE', 'ENE']);
        let violating = false;
        const affectedIds: string[] = [];
        for (const bath of bathrooms) {
          const zone = getRoomVastuZone16(bath.boundary, floorBoundary, ctx.config.orientation);
          if (neDefect.has(zone)) {
            violating = true;
            affectedIds.push(bath.id);
          }
        }

        return [{
          constraintId: 'SC-VASTU-008',
          passed: !violating,
          severity: ConstraintSeverity.SOFT,
          score: violating ? 0 : 10,
          maxScore: 10,
          message: violating
            ? 'DEFECT: Bathroom in NE/NNE/ENE — contaminates sacred Ishan sector'
            : 'No bathroom in NE sector (Vastu compliant)',
          affectedEntities: affectedIds,
          explanation: violating
            ? 'A bathroom is placed in the sacred Northeast (Ishan) sector. This is a severe MahaVastu defect. Relocate to WNW, NW, or S.'
            : 'Northeast (Ishan) sector is free of wet rooms — good MahaVastu compliance.',
        }];
      },
    };
  }

  // ── Hard Defect: Toilet NOT in SW — 10 pts ────────────────────────────────

  private toiletNotSW16(): Constraint {
    return {
      id: 'SC-VASTU-009',
      name: 'Vastu: Toilet NOT in SW',
      description: 'Toilets/bathrooms must not be in the Southwest (Nairutya) stability zone',
      category: ConstraintCategory.VASTU,
      severity: ConstraintSeverity.SOFT,
      enabled: true,
      evaluate(ctx: EvaluationContext): ConstraintResult[] {
        const bathrooms = getRoomsByType(ctx.building, RoomType.Bathroom);
        if (bathrooms.length === 0) {
          return [{ constraintId: 'SC-VASTU-009', passed: true, severity: ConstraintSeverity.SOFT, score: 10, maxScore: 10, message: 'Vastu toilet SW check: no bathrooms', affectedEntities: [], explanation: 'No bathrooms present.' }];
        }
        const floorBoundary = ctx.building.floors[0]?.boundary;
        if (!floorBoundary || floorBoundary.points.length < 3) {
          return [{ constraintId: 'SC-VASTU-009', passed: true, severity: ConstraintSeverity.SOFT, score: 10, maxScore: 10, message: 'Vastu toilet SW check: no floor boundary', affectedEntities: [], explanation: 'Cannot evaluate.' }];
        }

        let violating = false;
        const affectedIds: string[] = [];
        for (const bath of bathrooms) {
          const zone = getRoomVastuZone16(bath.boundary, floorBoundary, ctx.config.orientation);
          if (zone === 'SW') {
            violating = true;
            affectedIds.push(bath.id);
          }
        }

        return [{
          constraintId: 'SC-VASTU-009',
          passed: !violating,
          severity: ConstraintSeverity.SOFT,
          score: violating ? 0 : 10,
          maxScore: 10,
          message: violating
            ? 'DEFECT: Bathroom in SW — destabilises Nairutya grounding zone'
            : 'No bathroom in SW corner (Vastu compliant)',
          affectedEntities: affectedIds,
          explanation: violating
            ? 'A bathroom is in the Southwest (Nairutya) zone — severe MahaVastu defect destabilising earth element. Move to NW, W, or S.'
            : 'Southwest stability sector is free of wet rooms — preserving grounded Nairutya energy.',
        }];
      },
    };
  }

  // ── Hard Defect: Kitchen NOT in NE or SW — 15 pts ─────────────────────────

  private kitchenNotNEOrSW16(): Constraint {
    return {
      id: 'SC-VASTU-010',
      name: 'Vastu: Kitchen NOT in NE or SW',
      description: 'Kitchen must not be placed in the sacred NE (Water) or SW (Earth) zones',
      category: ConstraintCategory.VASTU,
      severity: ConstraintSeverity.SOFT,
      enabled: true,
      evaluate(ctx: EvaluationContext): ConstraintResult[] {
        const kitchens = getRoomsByType(ctx.building, RoomType.Kitchen);
        if (kitchens.length === 0) {
          return [{ constraintId: 'SC-VASTU-010', passed: true, severity: ConstraintSeverity.SOFT, score: 15, maxScore: 15, message: 'Vastu kitchen forbidden zones check: no kitchen', affectedEntities: [], explanation: 'No kitchen present.' }];
        }
        const floorBoundary = ctx.building.floors[0]?.boundary;
        if (!floorBoundary || floorBoundary.points.length < 3) {
          return [{ constraintId: 'SC-VASTU-010', passed: true, severity: ConstraintSeverity.SOFT, score: 15, maxScore: 15, message: 'Vastu kitchen check: no floor boundary', affectedEntities: [], explanation: 'Cannot evaluate.' }];
        }

        let violating = false;
        const affectedIds: string[] = [];
        let badZone = '';
        for (const k of kitchens) {
          const zone = getRoomVastuZone16(k.boundary, floorBoundary, ctx.config.orientation);
          if (KITCHEN_DEFECT.has(zone)) {
            violating = true;
            badZone = zone;
            affectedIds.push(k.id);
          }
        }

        return [{
          constraintId: 'SC-VASTU-010',
          passed: !violating,
          severity: ConstraintSeverity.SOFT,
          score: violating ? 0 : 15,
          maxScore: 15,
          message: violating
            ? `DEFECT: Kitchen in forbidden ${badZone} zone (Fire vs ${badZone === 'NE' ? 'Water' : 'Earth'} conflict)`
            : 'Kitchen safely away from NE and SW forbidden zones',
          affectedEntities: affectedIds,
          explanation: violating
            ? `Kitchen in ${badZone} creates an elemental conflict (Fire vs ${badZone === 'NE' ? 'Water in Ishan' : 'Earth in Nairutya'}). Relocate to SE (Agni) or NW.`
            : 'Kitchen avoids forbidden NE and SW zones — preserving elemental harmony per 16-zone MahaVastu.',
        }];
      },
    };
  }
}
