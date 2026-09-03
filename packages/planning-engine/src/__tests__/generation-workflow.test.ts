import { describe, expect, it } from 'vitest';
import {
  Direction, RoomType, applyFootprintToBuilding, applySpaceProgramPreset, autoFitFootprint, createBuilding, createDefaultFootprintIntent,
  getSpaceProgramPresets,
} from '@ai-floor-planner/core';
import { containsPolygon, polygonArea, polygonsAdjacent } from '@ai-floor-planner/geometry-engine';
import { assessGenerationReadiness, runGenerationWorkflow } from '../generation/workflow';

function input() {
  const building = createBuilding({
    projectId: 'generation-workflow', name: 'Generation workflow',
    site: {
      plotWidth: 12_000, plotDepth: 18_000, roadFacing: Direction.North,
      plannedFloorCount: 3,
      setbacks: { front: 1_500, rear: 1_000, left: 1_000, right: 1_000 },
    },
    floors: [{ buildingId: '', level: 0 }],
  });
  const preset = getSpaceProgramPresets('residential').find(candidate => candidate.id === 'residential_2bhk')!;
  const program = applySpaceProgramPreset(preset);
  const base = createDefaultFootprintIntent(building);
  const footprint = {
    ...base,
    parameters: { ...base.parameters, width: 10_000, depth: 15_500 },
    transform: { ...base.transform, x: 1_000, y: 1_500 },
  };
  return { building, category: 'residential' as const, program, footprint };
}

function coverageInput(floors = 2) {
  const value = input();
  const building = createBuilding({
    projectId: 'generation-coverage', name: 'Generation coverage',
    site: {
      plotWidth: 18_000, plotDepth: 24_000, roadFacing: Direction.North,
      plannedFloorCount: floors,
      setbacks: { front: 1_500, rear: 1_000, left: 1_000, right: 1_000 },
    },
    floors: [{ buildingId: '', level: 0 }],
  });
  const base = createDefaultFootprintIntent(building);
  return {
    ...value,
    building,
    footprint: {
      ...base,
      parameters: { ...base.parameters, width: 16_000, depth: 21_500 },
      transform: { ...base.transform, x: 1_000, y: 1_500 },
    },
  };
}

describe('controlled generation workflow', () => {
  it('reports a verified residential rectangle as ready', () => {
    expect(assessGenerationReadiness(input())).toEqual({ status: 'READY', issues: [] });
  });

  it('runs a G+2 3BHK from the product Auto Fit footprint without a capacity mismatch', async () => {
    const value = coverageInput(3);
    const preset = getSpaceProgramPresets('residential').find(candidate => candidate.id === 'residential_3bhk')!;
    const program = applySpaceProgramPreset(preset);
    const footprint = autoFitFootprint(value.building, program, 'rectangle');
    const result = await runGenerationWorkflow({ ...value, program, footprint });
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.candidates.every(candidate => candidate.validation.isValid)).toBe(true);
  }, 20_000);

  it('reports complex footprints as ready when their geometry is valid', () => {
    const value = input();
    const report = assessGenerationReadiness({ ...value, footprint: { ...value.footprint, shape: 'u_shape' } });
    expect(report).toEqual({ status: 'READY', issues: [] });
  });

  it('blocks categories that do not yet have a verified layout engine', () => {
    const value = input();
    const report = assessGenerationReadiness({
      ...value,
      category: 'commercial',
      program: { ...value.program, category: 'commercial' },
    });
    expect(report.issues).toContainEqual(expect.objectContaining({ code: 'CATEGORY_NOT_SUPPORTED' }));
  });

  it('reports valid reduced upper plates as ready', () => {
    const value = input();
    const report = assessGenerationReadiness({
      ...value,
      footprint: { ...value.footprint, strategy: 'custom_per_floor', floorOverrides: [{ floorLevel: 1, scalePercent: 70 }] },
    });
    expect(report).toEqual({ status: 'READY', issues: [] });
  });

  it('runs real stages, returns ranked hard-valid candidates, and preserves the approved plate', async () => {
    const value = input();
    const events: string[] = [];
    const result = await runGenerationWorkflow(value, (stage, state) => events.push(`${stage}:${state}`));
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.candidates.every(candidate => candidate.metrics.hardValidity && candidate.validation.isValid)).toBe(true);
    expect(result.candidates.map(candidate => candidate.rank)).toEqual(result.candidates.map((_, index) => index + 1));
    expect(result.candidates[0]!.building.floors[0]!.boundary).toEqual(result.candidates[0]!.building.floors[1]!.boundary);
    expect(events).toEqual([
      'validate_inputs:ACTIVE', 'validate_inputs:COMPLETE',
      'prepare_program:ACTIVE', 'prepare_program:COMPLETE',
      'generate_candidates:ACTIVE', 'generate_candidates:COMPLETE',
      'validate_candidates:ACTIVE', 'validate_candidates:COMPLETE',
      'rank_options:ACTIVE', 'rank_options:COMPLETE',
    ]);
  });

  it.each(['rectangle', 'linear', 'l_shape', 'u_shape', 't_shape', 'courtyard'] as const)(
    'generates hard-valid, connected candidates directly within a %s plate',
    async shape => {
      const value = coverageInput();
      const footprint = { ...value.footprint, shape };
      const approved = applyFootprintToBuilding(value.building, footprint);
      const result = await runGenerationWorkflow({ ...value, footprint });
      expect(result.candidates.length, result.candidates.map(candidate => candidate.strategy).join(',')).toBeGreaterThan(1);
      const signatures = new Set(result.candidates.map(candidate => JSON.stringify(candidate.building.floors.flatMap(floor =>
        floor.rooms.map(room => [room.type, Math.round(room.x), Math.round(room.y), Math.round(room.width), Math.round(room.height)]),
      ))));
      expect(signatures.size).toBe(result.candidates.length);
      for (const candidate of result.candidates) {
        expect(candidate.validation.isValid).toBe(true);
        candidate.building.floors.forEach((floor, index) => {
          expect(floor.boundary).toEqual(approved.floors[index]!.boundary);
          expect(floor.rooms.every(room => containsPolygon(floor.boundary, room.boundary))).toBe(true);
          expect(floor.doors.length).toBeGreaterThanOrEqual(floor.rooms.length);
        });
      }
    },
    20_000,
  );

  it('uses reduced per-floor capacity and preserves an aligned stair core', async () => {
    const value = coverageInput();
    const footprint = {
      ...value.footprint,
      strategy: 'custom_per_floor' as const,
      floorOverrides: [{ floorLevel: 1, scalePercent: 72 }],
    };
    const approved = applyFootprintToBuilding(value.building, footprint);
    const result = await runGenerationWorkflow({ ...value, footprint });
    for (const candidate of result.candidates) {
      expect(candidate.building.floors.map(floor => polygonArea(floor.boundary)))
        .toEqual(approved.floors.map(floor => polygonArea(floor.boundary)));
      const stairs = candidate.building.floors.map(floor => floor.rooms.find(room => room.type === RoomType.Staircase)!);
      expect(new Set(stairs.map(room => `${room.x}|${room.y}|${room.width}|${room.height}`)).size).toBe(1);
      expect(candidate.multiFloorPlanning.verticalCoreAligned).toBe(true);
    }
  }, 20_000);

  it('ranks a real residential program using same-floor adjacency, wet stacking, and privacy evidence', async () => {
    const result = await runGenerationWorkflow(coverageInput());
    const candidate = result.candidates[0]!;
    const rooms = candidate.building.floors.flatMap(floor => floor.rooms);
    const kitchen = rooms.find(room => room.type === RoomType.Kitchen)!;
    const dining = rooms.find(room => room.type === RoomType.Dining)!;
    const failedEvidence = candidate.validation.violations
      .filter(issue => !issue.passed)
      .map(issue => issue.constraintId);

    expect(kitchen.floorId).toBe(dining.floorId);
    expect(polygonsAdjacent(kitchen.boundary, dining.boundary)).toBe(true);
    expect(candidate.multiFloorPlanning.wetAreaStackPairs).toBeGreaterThan(0);
    expect(candidate.multiFloorPlanning.wetAreaStackScore).toBeGreaterThanOrEqual(80);
    expect(candidate.metrics.privacyScore).toBeGreaterThanOrEqual(80);
    expect(failedEvidence).not.toContain('SC-ZON-001');
    expect(failedEvidence).not.toContain('SC-ZON-003');
    expect(failedEvidence).not.toContain('SC-PRI-002');
    expect(failedEvidence).not.toContain('SC-PRI-003');
  }, 20_000);

  it('fails clearly when a reduced plate cannot carry its allocated minimum program', async () => {
    const value = input();
    const footprint = {
      ...value.footprint,
      strategy: 'custom_per_floor' as const,
      floorOverrides: [{ floorLevel: 1, scalePercent: 28 }, { floorLevel: 2, scalePercent: 28 }],
    };
    await expect(runGenerationWorkflow({ ...value, footprint })).rejects.toThrow(/INFEASIBLE_PROGRAM|CORE_CONTINUITY_FAILURE|POLYGON_PACKING_FAILURE/);
  });
});
