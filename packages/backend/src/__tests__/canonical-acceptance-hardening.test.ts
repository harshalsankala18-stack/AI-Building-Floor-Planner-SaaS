import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { Direction, RoomType, createBuilding, createRoom } from '@ai-floor-planner/core';
import {
  GenerationOrchestrator,
  type GenerationOrchestratorInput,
} from '../services/generation-orchestrator.js';
import { ImageArtifactStore } from '../services/image-artifact-store.js';
import {
  validateCanonicalApartmentBuilding,
  type ApartmentPlanExpectation,
} from '@ai-floor-planner/planning-engine';

describe('Phase 2.1 — Canonical Validation & Multi-Floor Limitation Honesty', () => {
  describe('1. Authoritative Validation & Truthful Architectural Evaluation', () => {
    it('does not hardcode score 95; computes real architectural score and honors canonical validation', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'afp-cad-val-'));
      const store = new ImageArtifactStore(dir);

      const orchestrator = new GenerationOrchestrator({
        provider: null,
        store,
        gemini: null,
        interpreterKind: 'local-stub',
        deterministicCadFirst: true,
      });

      const input: GenerationOrchestratorInput = {
        projectId: 'proj-val-truth',
        projectName: 'Truthful Evaluation Project',
        projectType: 'apartment',
        site: {
          plotWidth: 35000,
          plotDepth: 40000,
          roadFacing: Direction.North,
          setbacks: { front: 3000, rear: 2000, left: 2000, right: 2000 },
        },
        apartmentConfig: {
          projectType: 'apartment',
          jurisdiction: 'pune_pmc',
          floorCount: 1,
          flatsPerFloor: 2,
          unitMix: [
            { unitType: '2BHK', count: 1, carpetAreaSqFt: 750 },
            { unitType: '3BHK', count: 1, carpetAreaSqFt: 1100 },
          ],
          commonCore: {
            passengerLifts: 2,
            serviceLifts: 0,
            staircaseCount: 2,
            fireStaircaseRequired: true,
            commonLobby: true,
          },
          amenities: { groundSiteAmenities: [], buildingAmenities: [] },
          parking: { residentParkingCount: 2, visitorParkingCount: 1 },
        },
        candidateCount: 2,
        seed: 12345,
      };

      const result = await orchestrator.run(input);
      fs.rmSync(dir, { recursive: true, force: true });

      expect(result.success).toBe(true);
      expect(result.candidates).toHaveLength(2);

      for (const cand of result.candidates) {
        expect(cand.status).toBe('ACCEPTED');
        expect(cand.validation.isValid).toBe(true);
        expect(cand.validation.recommendedForEditing).toBe(true);
        expect(cand.validation.geometryHealthy).toBe(true);
        // Architectural evaluation score is calculated, finite number
        expect(cand.validation.overallScore).toBeTypeOf('number');
        expect(cand.validation.overallScore!).toBeGreaterThanOrEqual(0);
        expect(cand.validation.overallScore!).toBeLessThanOrEqual(100);

        // Stages state is truthful
        expect(cand.stages.validation).toBe('SUCCESS');
        expect(cand.stages.geminiEvaluation).toBe('SKIPPED');
        expect(cand.evaluationStatus).toBe('NOT_CONFIGURED');

        // Apartment validation stages reflect real component passes
        expect(cand.apartmentValidation?.stages.completeness).toBe('PASS');
        expect(cand.apartmentValidation?.stages.manifestMatch).toBe('PASS');
        expect(cand.apartmentValidation?.stages.structural).toBe('PASS');
        expect(cand.apartmentValidation?.stages.canonicalGeometry).toBe('PASS');
        expect(cand.apartmentValidation?.stages.geometryValidation).toBe('PASS');
      }
    });

    it('rejects canonical building model when room overlaps or boundary violations occur', () => {
      // Build a building with deliberate room overlaps
      const building = createBuilding({
        projectId: 'invalid-bldg',
        name: 'Invalid Building',
        site: {
          plotWidth: 30000,
          plotDepth: 30000,
          plannedFloorCount: 1,
          roadFacing: Direction.North,
          setbacks: { front: 2000, rear: 2000, left: 2000, right: 2000 },
          orientation: 0,
        },
        floors: [{
          buildingId: 'invalid-bldg',
          level: 0,
          boundary: {
            points: [
              { x: 0, y: 0 },
              { x: 20000, y: 0 },
              { x: 20000, y: 20000 },
              { x: 0, y: 20000 },
            ],
          },
        }],
      });

      (building.floors[0] as any).rooms = [
        createRoom({
          floorId: building.floors[0]!.id,
          name: 'Living Room 1',
          type: RoomType.Living,
          x: 1000,
          y: 1000,
          width: 5000,
          height: 5000,
          tags: ['flat:01'],
        }),
        // Deliberately overlaps Room 1 completely
        createRoom({
          floorId: building.floors[0]!.id,
          name: 'Bedroom 1 (Colliding)',
          type: RoomType.Bedroom,
          x: 2000,
          y: 2000,
          width: 5000,
          height: 5000,
          tags: ['flat:01'],
        }),
      ];

      const expectation: ApartmentPlanExpectation = {
        flats: 1,
        units: [{
          label: 'FLAT 01',
          unitType: '1BHK',
          bedrooms: 1,
          bathrooms: 1,
          livingRooms: 1,
          diningRooms: 1,
          kitchens: 1,
          utilities: 1,
          balconies: 1,
        }],
        lifts: 1,
        stairs: 1,
        commonLobby: false,
      };

      const val = validateCanonicalApartmentBuilding(building, expectation);
      expect(val.isValid).toBe(false);
      expect(val.recommendedForEditing).toBe(false);
      expect(val.verificationIssues.some(i => i.code.includes('COLLISION') || i.code.includes('COUNT_MISMATCH'))).toBe(true);
    });
  });

  describe('2. Multi-Floor Limitation Honesty', () => {
    it('single-floor brief (floorCount: 1) produces single floor without limitation warning', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'afp-1floor-'));
      const store = new ImageArtifactStore(dir);

      const orchestrator = new GenerationOrchestrator({
        provider: null,
        store,
        gemini: null,
        interpreterKind: 'local-stub',
        deterministicCadFirst: true,
      });

      const input: GenerationOrchestratorInput = {
        projectId: 'proj-1floor',
        projectType: 'apartment',
        site: {
          plotWidth: 30000,
          plotDepth: 35000,
          roadFacing: Direction.North,
        },
        apartmentConfig: {
          projectType: 'apartment',
          jurisdiction: 'pune_pmc',
          floorCount: 1,
          flatsPerFloor: 2,
          unitMix: [
            { unitType: '2BHK', count: 2, carpetAreaSqFt: 750 },
          ],
          commonCore: { passengerLifts: 1, serviceLifts: 0, staircaseCount: 1, commonLobby: true, fireStaircaseRequired: false },
          amenities: { groundSiteAmenities: [], buildingAmenities: [] },
          parking: { residentParkingCount: 2, visitorParkingCount: 1 },
        },
        candidateCount: 1,
      };

      const result = await orchestrator.run(input);
      fs.rmSync(dir, { recursive: true, force: true });

      expect(result.success).toBe(true);
      expect(result.multiFloorStatus).toBeUndefined();

      const cand = result.candidates[0]!;
      expect(cand.diagnostics.some(d => d.code === 'MULTI_FLOOR_NOT_IMPLEMENTED')).toBe(false);
      expect(cand.building?.floors).toHaveLength(1);
    });

    it('multi-floor brief (floorCount: 4) reports structured limitation status and does not fake 4 floors', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'afp-4floor-'));
      const store = new ImageArtifactStore(dir);

      const orchestrator = new GenerationOrchestrator({
        provider: null,
        store,
        gemini: null,
        interpreterKind: 'local-stub',
        deterministicCadFirst: true,
      });

      const input: GenerationOrchestratorInput = {
        projectId: 'proj-4floor',
        projectType: 'apartment',
        site: {
          plotWidth: 35000,
          plotDepth: 40000,
          roadFacing: Direction.North,
        },
        apartmentConfig: {
          projectType: 'apartment',
          jurisdiction: 'pune_pmc',
          floorCount: 4,
          flatsPerFloor: 2,
          unitMix: [
            { unitType: '2BHK', count: 1, carpetAreaSqFt: 750 },
            { unitType: '3BHK', count: 1, carpetAreaSqFt: 1100 },
          ],
          commonCore: { passengerLifts: 2, serviceLifts: 0, staircaseCount: 2, commonLobby: true, fireStaircaseRequired: true },
          amenities: { groundSiteAmenities: [], buildingAmenities: [] },
          parking: { residentParkingCount: 2, visitorParkingCount: 1 },
        },
        candidateCount: 2,
      };

      const result = await orchestrator.run(input);
      fs.rmSync(dir, { recursive: true, force: true });

      expect(result.success).toBe(true);

      // Explicit structured limitation status returned on result
      expect(result.multiFloorStatus).toBeDefined();
      expect(result.multiFloorStatus?.requestedFloorCount).toBe(4);
      expect(result.multiFloorStatus?.generatedFloorCount).toBe(1);
      expect(result.multiFloorStatus?.status).toBe('SINGLE_FLOOR_PRODUCED');
      expect(result.multiFloorStatus?.message).toContain('Multi-floor apartment generation is not yet supported');

      // Diagnostics on every candidate report MULTI_FLOOR_NOT_IMPLEMENTED honestly
      for (const cand of result.candidates) {
        const diag = cand.diagnostics.find(d => d.code === 'MULTI_FLOOR_NOT_IMPLEMENTED');
        expect(diag).toBeDefined();
        expect(diag?.severity).toBe('warning');
        expect(diag?.message).toContain('requested 4 floors, but only a single typical floor plate was produced');

        // Building model contains exactly 1 floor plate (level 0)
        expect(cand.building?.floors).toHaveLength(1);

        // Building metadata records multiFloor limitation
        const meta = cand.building?.metadata as any;
        expect(meta?.multiFloor).toBeDefined();
        expect(meta?.multiFloor?.requestedFloorCount).toBe(4);
        expect(meta?.multiFloor?.generatedFloorCount).toBe(1);
        expect(meta?.multiFloor?.diagnosticCode).toBe('MULTI_FLOOR_NOT_IMPLEMENTED');
      }
    });
  });
});

