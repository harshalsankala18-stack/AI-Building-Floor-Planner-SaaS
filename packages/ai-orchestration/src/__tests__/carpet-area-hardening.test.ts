import { describe, expect, it } from 'vitest';
import {
  allocateApartmentUnitSpaces,
  checkCarpetAreaFeasibility,
  InvalidCarpetAreaError,
  InsufficientCarpetAreaError,
  resolveAndValidateUnitMix,
  TYPOLOGY_TEMPLATES,
} from '../apartment/typologies';
import { getApartmentRulesProfile } from '../apartment/jurisdiction';

describe('Phase 2.1 — Carpet-Area Input Validation & Mathematical Feasibility Hardening', () => {
  const rulesProfile = getApartmentRulesProfile('pune_pmc');

  describe('1. Rejection of Invalid Carpet Area Values', () => {
    const invalidValues = [0, -1, -50.5, NaN, Infinity, -Infinity];

    for (const val of invalidValues) {
      it(`rejects targetCarpetAreaSqM = ${String(val)} with InvalidCarpetAreaError`, () => {
        expect(() =>
          allocateApartmentUnitSpaces({
            unitType: '2BHK',
            targetCarpetAreaSqM: val,
            rulesProfile,
          }),
        ).toThrow(InvalidCarpetAreaError);
      });

      it(`rejects targetCarpetAreaSqFt = ${String(val)} with InvalidCarpetAreaError`, () => {
        expect(() =>
          allocateApartmentUnitSpaces({
            unitType: '2BHK',
            targetCarpetAreaSqFt: val,
            rulesProfile,
          }),
        ).toThrow(InvalidCarpetAreaError);
      });
    }

    it('rejects non-numeric carpet area values', () => {
      expect(() =>
        allocateApartmentUnitSpaces({
          unitType: '2BHK',
          targetCarpetAreaSqM: '80' as any,
          rulesProfile,
        }),
      ).toThrow(InvalidCarpetAreaError);
    });
  });

  describe('2. Distinguishing Omitted Area from Invalid Area', () => {
    it('uses template default carpet area when both sq m and sq ft are omitted', () => {
      const allocStudio = allocateApartmentUnitSpaces({ unitType: 'Studio', rulesProfile });
      expect(allocStudio.targetCarpetAreaSqM).toBe(TYPOLOGY_TEMPLATES['Studio']!.defaultCarpetAreaSqM);

      const alloc1BHK = allocateApartmentUnitSpaces({ unitType: '1BHK', rulesProfile });
      expect(alloc1BHK.targetCarpetAreaSqM).toBe(TYPOLOGY_TEMPLATES['1BHK']!.defaultCarpetAreaSqM);

      const alloc2BHK = allocateApartmentUnitSpaces({ unitType: '2BHK', rulesProfile });
      expect(alloc2BHK.targetCarpetAreaSqM).toBe(TYPOLOGY_TEMPLATES['2BHK']!.defaultCarpetAreaSqM);

      const alloc3BHK = allocateApartmentUnitSpaces({ unitType: '3BHK', rulesProfile });
      expect(alloc3BHK.targetCarpetAreaSqM).toBe(TYPOLOGY_TEMPLATES['3BHK']!.defaultCarpetAreaSqM);

      const alloc4BHK = allocateApartmentUnitSpaces({ unitType: '4BHK', rulesProfile });
      expect(alloc4BHK.targetCarpetAreaSqM).toBe(TYPOLOGY_TEMPLATES['4BHK']!.defaultCarpetAreaSqM);
    });
  });

  describe('3. Precedence When Both Sq M and Sq Ft Are Supplied', () => {
    it('enforces targetCarpetAreaSqM precedence over targetCarpetAreaSqFt', () => {
      // 80 m² (~861 sq ft) vs explicit 1500 sq ft (~139 m²)
      const alloc = allocateApartmentUnitSpaces({
        unitType: '2BHK',
        targetCarpetAreaSqM: 80,
        targetCarpetAreaSqFt: 1500,
        rulesProfile,
      });

      // Target carpet area must strictly follow Sq M (80), not 1500 sq ft
      expect(alloc.targetCarpetAreaSqM).toBe(80);
      expect(alloc.targetCarpetAreaSqFt).toBe(Math.round(80 / 0.092903));
    });

    it('rejects if targetCarpetAreaSqFt is invalid even if targetCarpetAreaSqM is supplied', () => {
      expect(() =>
        allocateApartmentUnitSpaces({
          unitType: '2BHK',
          targetCarpetAreaSqM: 80,
          targetCarpetAreaSqFt: -500,
          rulesProfile,
        }),
      ).toThrow(InvalidCarpetAreaError);
    });
  });

  describe('4. Feasibility Deficit Rejection (Cannot Fit Mandatory Rooms + Circ + Walls)', () => {
    it('rejects 2BHK with insufficient carpet area (e.g. 25 m², where mandatory minimum requires ~55.6 m²)', () => {
      expect(() =>
        allocateApartmentUnitSpaces({
          unitType: '2BHK',
          targetCarpetAreaSqM: 25,
          rulesProfile,
        }),
      ).toThrow(InsufficientCarpetAreaError);

      try {
        allocateApartmentUnitSpaces({
          unitType: '2BHK',
          targetCarpetAreaSqM: 25,
          rulesProfile,
        });
      } catch (err) {
        expect(err).toBeInstanceOf(InsufficientCarpetAreaError);
        const insErr = err as InsufficientCarpetAreaError;
        expect(insErr.unitType).toBe('2BHK');
        expect(insErr.targetCarpetAreaSqM).toBe(25);
        expect(insErr.requiredMinimumCarpetSqM).toBeGreaterThan(50);
        expect(insErr.deficitSqM).toBeGreaterThan(0);
        expect(insErr.message).toContain('insufficient');
      }
    });

    it('rejects 4BHK with insufficient carpet area (e.g. 50 m², where mandatory minimum requires >80 m²)', () => {
      expect(() =>
        allocateApartmentUnitSpaces({
          unitType: '4BHK',
          targetCarpetAreaSqM: 50,
          rulesProfile,
        }),
      ).toThrow(InsufficientCarpetAreaError);
    });

    it('checkCarpetAreaFeasibility returns structured feasibility report without throwing', () => {
      const infeasible = checkCarpetAreaFeasibility('2BHK', 20, rulesProfile);
      expect(infeasible.feasible).toBe(false);
      expect(infeasible.deficitSqM).toBeDefined();
      expect(infeasible.deficitSqM!).toBeGreaterThan(0);
      expect(infeasible.requiredMinimumCarpetSqM).toBeGreaterThan(50);

      const feasible = checkCarpetAreaFeasibility('2BHK', 75, rulesProfile);
      expect(feasible.feasible).toBe(true);
      expect(feasible.deficitSqM).toBeUndefined();
      expect(feasible.usablePlanningBalanceSqM).toBeGreaterThan(0);
    });
  });

  describe('5. Unit Mix Validation Hardening for Carpet Areas', () => {
    it('rejects negative or zero carpetAreaSqM in unit mix items', () => {
      expect(() =>
        resolveAndValidateUnitMix(
          [{ unitType: '2BHK', count: 2, carpetAreaSqM: -20 }],
          2,
        ),
      ).toThrow(InvalidCarpetAreaError);

      expect(() =>
        resolveAndValidateUnitMix(
          [{ unitType: '2BHK', count: 2, carpetAreaSqM: 0 }],
          2,
        ),
      ).toThrow(InvalidCarpetAreaError);
    });

    it('rejects NaN or infinite carpetAreaSqFt in unit mix items', () => {
      expect(() =>
        resolveAndValidateUnitMix(
          [{ unitType: '2BHK', count: 2, carpetAreaSqFt: NaN }],
          2,
        ),
      ).toThrow(InvalidCarpetAreaError);

      expect(() =>
        resolveAndValidateUnitMix(
          [{ unitType: '2BHK', count: 2, carpetAreaSqFt: Infinity }],
          2,
        ),
      ).toThrow(InvalidCarpetAreaError);
    });
  });
});

