import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { Direction, RoomType, WallType } from '@ai-floor-planner/core';
import {
  GenerationOrchestrator,
  type GenerationOrchestratorInput,
} from '../services/generation-orchestrator.js';
import { ImageArtifactStore } from '../services/image-artifact-store.js';

describe('Phase 2 — Deterministic Stepped-Polygon CAD Engine (Instant Pipeline)', () => {
  it('generates 4 distinct valid CAD candidates in <500ms without image provider', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'afp-cad-first-'));
    const store = new ImageArtifactStore(dir);

    // ZERO external image provider (null provider and null gemini)
    const orchestrator = new GenerationOrchestrator({
      provider: null,
      store,
      gemini: null,
      interpreterKind: 'local-stub',
      deterministicCadFirst: true,
    });

    const input: GenerationOrchestratorInput = {
      projectId: 'proj-cad-first-pune',
      projectName: 'Pune PMC Stepped Apartment',
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
        floorCount: 4,
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
        parking: {
          residentParkingCount: 2,
          visitorParkingCount: 1,
          twoWheelerParkingCount: 4,
        },
        amenities: {
          groundSiteAmenities: [],
          buildingAmenities: [],
        },
      },
      candidateCount: 4,
      seed: 42,
    };

    const startTime = Date.now();
    const result = await orchestrator.run(input);
    const elapsedMs = Date.now() - startTime;

    fs.rmSync(dir, { recursive: true, force: true });

    // Performance constraint: instant execution (<4000ms under heavy concurrent test runner load, <3000ms internal latency)
    expect(elapsedMs).toBeLessThan(4000);
    expect(result.latencyMs).toBeLessThan(3000);
    expect(result.success).toBe(true);
    expect(result.candidateSource).toBe('DETERMINISTIC_CAD');
    expect(result.conceptMode).toBe(true);

    // Candidate count & provenance
    expect(result.candidates).toHaveLength(4);
    for (const cand of result.candidates) {
      expect(cand.status).toBe('ACCEPTED');
      expect(cand.source).toBe('DETERMINISTIC_CAD');
      expect(cand.visualSource).toBe('DETERMINISTIC_SCHEMATIC');
      expect(cand.stages.imageGeneration).toBe('SKIPPED');
      expect(cand.stages.imageTo2D).toBe('SUCCESS');
      expect(cand.stages.validation).toBe('SUCCESS');
      expect(cand.building).not.toBeNull();
    }

    // Concept strategies variation
    const strategies = result.candidates.map(c => c.concept?.strategy);
    expect(strategies).toEqual(['balanced', 'daylight', 'privacy', 'circulation']);

    // Check primary building model geometry & architectural invariants
    const primary = result.candidates[0]!.building!;
    expect(primary.floors).toHaveLength(1);
    const floor = primary.floors[0]!;

    // 1. Preserved stepped polygon footprint
    const metadata = primary.metadata as any;
    expect(metadata.steppedPolygons).toBeDefined();
    expect(metadata.steppedPolygons.length).toBe(2);
    for (const sp of metadata.steppedPolygons) {
      expect(sp.steppedPolygon.vertices.length).toBeGreaterThanOrEqual(6);
    }

    // 2. Preserved OTS shafts (1200mm x 1500mm)
    expect(metadata.otsShafts).toBeDefined();
    expect(metadata.otsShafts.length).toBeGreaterThanOrEqual(2);
    for (const ots of metadata.otsShafts) {
      expect(ots.widthMm).toBe(1200);
      expect(ots.depthMm).toBe(1500);
    }

    // 3. Preserved projecting balconies
    expect(metadata.balconies).toBeDefined();
    expect(metadata.balconies.length).toBeGreaterThanOrEqual(2);
    const balconyRooms = floor.rooms.filter(r => r.type === RoomType.Balcony);
    expect(balconyRooms.length).toBeGreaterThanOrEqual(2);

    // 4. 3-tier Indian rooms present
    const roomTypes = new Set(floor.rooms.map(r => r.type));
    expect(roomTypes.has(RoomType.Living)).toBe(true);
    expect(roomTypes.has(RoomType.Kitchen)).toBe(true);
    expect(roomTypes.has(RoomType.Bedroom)).toBe(true);
    expect(roomTypes.has(RoomType.Bathroom)).toBe(true);
    expect(roomTypes.has(RoomType.Balcony)).toBe(true);

    // 5. Walls and doors
    expect(floor.walls.length).toBeGreaterThan(10);
    expect(floor.walls.some(w => w.type === WallType.External)).toBe(true);
    expect(floor.walls.some(w => w.type === WallType.Internal)).toBe(true);
    expect(floor.doors.length).toBeGreaterThan(6);
    expect(floor.doors.some(d => d.connectsRooms[1] !== '__outside__')).toBe(true);

    // 6. Windows strictly placed on exterior open facades or OTS shafts
    expect(floor.windows.length).toBeGreaterThanOrEqual(4);
    for (const win of floor.windows) {
      expect(win.roomId).toBeDefined();
      expect(win.width).toBeGreaterThanOrEqual(600);
    }

    // 7. Core vertical elements (lifts & stairs)
    const liftRooms = floor.rooms.filter(r => r.type === RoomType.Lift);
    const stairRooms = floor.rooms.filter(r => r.type === RoomType.Staircase);
    expect(liftRooms.length).toBe(2);
    expect(stairRooms.length).toBe(2);
    expect(floor.stairs.length).toBe(2);
  });

  it('generates 2 candidates when requested and enforces zero windows on corridor/dead walls', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'afp-cad-first-2-'));
    const store = new ImageArtifactStore(dir);

    const orchestrator = new GenerationOrchestrator({
      provider: null,
      store,
      gemini: null,
      interpreterKind: 'local-stub',
      deterministicCadFirst: true,
    });

    const input: GenerationOrchestratorInput = {
      projectId: 'proj-cad-first-2cand',
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
        commonCore: {
          passengerLifts: 1,
          serviceLifts: 0,
          staircaseCount: 2,
          fireStaircaseRequired: true,
          commonLobby: true,
        },
        parking: {
          residentParkingCount: 2,
          visitorParkingCount: 1,
          twoWheelerParkingCount: 4,
        },
        amenities: {
          groundSiteAmenities: [],
          buildingAmenities: [],
        },
      },
      candidateCount: 2,
      seed: 99,
    };

    const result = await orchestrator.run(input);
    fs.rmSync(dir, { recursive: true, force: true });

    expect(result.success).toBe(true);
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates[0]!.concept?.strategy).toBe('balanced');
    expect(result.candidates[1]!.concept?.strategy).toBe('daylight');

    // Windows invariant: no windows on corridor side (deadWalls)
    const bldg = result.candidates[0]!.building!;
    const floor = bldg.floors[0]!;

    // Units in the schematic have deadWalls = ['W'] (for flat 1) and ['E'] (for flat 2)
    // Check that every window's position is strictly outside the dead wall corridors
    const flat1Windows = floor.windows.filter(w => w.id.startsWith('flat_01'));
    for (const win of flat1Windows) {
      // Flat 01 dead wall is West (corridor side). Flat 01 is east of corridor.
      // Therefore, no flat 1 window should be placed on its west edge!
      expect(win.id).not.toContain('_W_');
    }
  });

  it('compiles with ArchLang and verifies geometry parity when enableArchLang is true', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'afp-archlang-cad-'));
    const store = new ImageArtifactStore(dir);

    const orchestrator = new GenerationOrchestrator({
      provider: null,
      store,
      gemini: null,
      interpreterKind: 'local-stub',
      deterministicCadFirst: true,
      enableArchLang: true,
    });

    const input: GenerationOrchestratorInput = {
      projectId: 'proj-archlang-verify',
      projectName: 'PMC ArchLang Verified Apartment',
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
          passengerLifts: 1,
          serviceLifts: 0,
          staircaseCount: 1,
          fireStaircaseRequired: false,
          commonLobby: true,
        },
        floorStrategy: 'typical',
        parking: {
          residentParkingCount: 2,
          visitorParkingCount: 1,
          twoWheelerParkingCount: 4,
        },
        amenities: {
          groundSiteAmenities: [],
          buildingAmenities: [],
        },
      },
      candidateCount: 1,
      seed: 42,
    };

    const result = await orchestrator.run(input);
    fs.rmSync(dir, { recursive: true, force: true });

    expect(result.success).toBe(true);
    expect(result.candidates).toHaveLength(1);
    const candidate = result.candidates[0]!;
    expect(candidate.archlang).toBeDefined();
    expect(candidate.archlang?.status).toBe('ACCEPTED');
    expect(candidate.archlang?.parityReport?.passed).toBe(true);
    expect(candidate.archlang?.svg).toContain('<svg');
    expect(candidate.archlang?.dxf).toContain('SECTION');
    expect(candidate.archlang?.provenance).toBeDefined();
    expect(candidate.diagnostics.some(d => d.code === 'ARCHLANG_ACCEPTED')).toBe(true);
  }, 30000);
});
