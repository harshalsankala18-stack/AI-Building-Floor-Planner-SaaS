import { describe, expect, it } from 'vitest';
import {
  Direction, FOOTPRINT_SHAPES, RoomType, addProgramItem, applyFootprintToBuilding,
  applySpaceProgramPreset, autoFitFootprint, buildingHasDesignedGeometry,
  calculateFootprintMetrics, createBuilding, createDefaultFootprintIntent, createProgramItem,
  createRoom, deriveFootprintIntent, generateFootprintPolygon, getFootprintEnvelope,
  getSpaceDefinition, getSpaceProgramPresets, polygonArea, recenterFootprint,
  snapFootprintToEnvelope, validateFootprint,
  type FootprintIntent, type FootprintShapeType,
} from '../index';

const M2 = 1_000_000;

function testBuilding(options: { width?: number; depth?: number; floors?: number; fsi?: number; maxCoverage?: number } = {}) {
  return createBuilding({
    projectId: 'footprint-test', name: 'Footprint test',
    site: {
      plotWidth: options.width ?? 12_000,
      plotDepth: options.depth ?? 18_000,
      roadFacing: Direction.East,
      roadWidth: 9_000,
      plannedFloorCount: options.floors ?? 3,
      setbacks: { front: 1_500, rear: 1_000, left: 1_000, right: 1_000 },
      developmentControls: {
        permissibleFsi: options.fsi === undefined ? { provenance: 'NOT_CONFIGURED' } : { value: options.fsi, provenance: 'USER_PROVIDED' },
        maxCoveragePercent: options.maxCoverage === undefined ? { provenance: 'NOT_CONFIGURED' } : { value: options.maxCoverage, provenance: 'USER_PROVIDED' },
        maxHeight: { provenance: 'NOT_CONFIGURED' },
      },
    },
    floors: [{ buildingId: '', level: 0 }],
  });
}

function fitted(shape: FootprintShapeType, building = testBuilding()): FootprintIntent {
  return autoFitFootprint(building, undefined, shape);
}

describe('parametric footprint geometry', () => {
  it('exposes the complete initial professional shape library', () => {
    expect(FOOTPRINT_SHAPES.map(shape => shape.id)).toEqual(['rectangle', 'l_shape', 'u_shape', 't_shape', 'courtyard', 'linear', 'custom']);
    expect(FOOTPRINT_SHAPES.find(shape => shape.id === 'courtyard')).toMatchObject({ customSupport: 'limited' });
  });

  it.each(['rectangle', 'l_shape', 'u_shape', 't_shape', 'courtyard', 'linear'] as FootprintShapeType[])('%s generates valid positive-area geometry', shape => {
    const building = testBuilding();
    const intent = fitted(shape, building);
    const validation = validateFootprint(building, intent);
    expect(validation.status).toBe('VALID');
    expect(polygonArea(generateFootprintPolygon(intent))).toBeGreaterThan(0);
  });

  it('computes exact rectangular area from canonical dimensions', () => {
    const base = createDefaultFootprintIntent(testBuilding());
    const intent = { ...base, parameters: { ...base.parameters, width: 8_000, depth: 10_000 }, transform: { ...base.transform, x: 1_000, y: 1_000 } };
    expect(polygonArea(generateFootprintPolygon(intent))).toBe(80 * M2);
  });

  it('preserves area under mirror and quarter-turn rotation', () => {
    const intent = fitted('l_shape');
    const original = polygonArea(generateFootprintPolygon(intent));
    expect(polygonArea(generateFootprintPolygon({ ...intent, transform: { ...intent.transform, mirrored: true } }))).toBeCloseTo(original);
    expect(polygonArea(generateFootprintPolygon({ ...intent, transform: { ...intent.transform, rotation: 90 } }))).toBeCloseTo(original);
  });

  it('rejects footprint geometry outside the buildable envelope', () => {
    const building = testBuilding();
    const intent = fitted('rectangle', building);
    const outside = { ...intent, transform: { ...intent.transform, x: -2_000 } };
    expect(validateFootprint(building, outside)).toEqual(expect.objectContaining({ status: 'INVALID' }));
    expect(validateFootprint(building, outside).issues).toContainEqual(expect.objectContaining({ field: 'containment' }));
  });

  it('rejects self-intersecting custom polygons', () => {
    const building = testBuilding();
    const base = createDefaultFootprintIntent(building);
    const custom: FootprintIntent = { ...base, shape: 'custom', customPolygon: { points: [{ x: 0, y: 0 }, { x: 4_000, y: 4_000 }, { x: 0, y: 4_000 }, { x: 4_000, y: 0 }] } };
    expect(validateFootprint(building, custom).status).toBe('INVALID');
  });

  it('recenters and snaps a footprint without changing Site geometry', () => {
    const building = testBuilding();
    const envelope = getFootprintEnvelope(building);
    const originalSite = building.site;
    const centered = recenterFootprint(building, fitted('rectangle', building));
    const box = generateFootprintPolygon(centered).points;
    expect((Math.min(...box.map(point => point.x)) + Math.max(...box.map(point => point.x))) / 2).toBeCloseTo(envelope.x + envelope.width / 2);
    const moved = { ...centered, transform: { ...centered.transform, x: envelope.x + 120 } };
    expect(snapFootprintToEnvelope(building, moved).transform.x).toBe(envelope.x);
    expect(building.site).toBe(originalSite);
  });
});

describe('footprint capacity and canonical floor plates', () => {
  it('calculates coverage and a user-provided maximum without claiming compliance', () => {
    const building = testBuilding({ maxCoverage: 25 });
    const metrics = calculateFootprintMetrics(building, fitted('rectangle', building));
    expect(metrics.plotCoveragePercent).toBeGreaterThan(0);
    expect(metrics.maximumCoveragePercent).toBe(25);
    expect(metrics.coverageWithinUserLimit).toBe(metrics.plotCoveragePercent <= 25);
  });

  it('limits effective preliminary floor area by user-provided FSI', () => {
    const building = testBuilding({ fsi: 0.5 });
    const metrics = calculateFootprintMetrics(building, fitted('rectangle', building));
    expect(metrics.effectivePreliminaryFloorAreaMm2).toBe(Math.min(metrics.preliminaryFloorAreaMm2, metrics.fsiLimitedFloorAreaMm2!));
  });

  it('reports a too-small footprint without changing Program requirements', () => {
    const building = testBuilding({ width: 8_000, depth: 10_000, floors: 1 });
    const room = getSpaceDefinition('living')!;
    const program = addProgramItem({ schemaVersion: 1, category: 'residential', items: [], provenance: 'USER_DEFINED', updatedAt: '' }, createProgramItem(room, 'large', { quantity: 4, minimumAreaMm2: 30 * M2, preferredAreaMm2: 40 * M2 }));
    const metrics = calculateFootprintMetrics(building, fitted('rectangle', building), program);
    expect(metrics.programFit).toBe('TOO_SMALL');
    expect(metrics.deficitMm2).toBeGreaterThan(0);
    expect(program.items[0]?.minimumAreaMm2).toBe(30 * M2);
  });

  it('auto-fits a residential preset inside the envelope deterministically', () => {
    const building = testBuilding();
    const preset = getSpaceProgramPresets('residential').find(item => item.name === '3BHK')!;
    const program = applySpaceProgramPreset(preset);
    const first = autoFitFootprint(building, program, 'l_shape');
    const second = autoFitFootprint(building, program, 'l_shape');
    expect(first.parameters).toEqual(second.parameters);
    expect(validateFootprint(building, first).status).toBe('VALID');
  });

  it('auto-fit keeps a feasibility reserve above preferred usable program area', () => {
    const building = testBuilding({ floors: 3 });
    const preset = getSpaceProgramPresets('residential').find(item => item.name === '3BHK')!;
    const program = applySpaceProgramPreset(preset);
    const metrics = calculateFootprintMetrics(building, autoFitFootprint(building, program, 'rectangle'), program);
    const preferred = program.items.reduce((sum, item) => sum + item.preferredAreaMm2 * item.quantity, 0);
    expect(metrics.estimatedUsableAreaMm2).toBeGreaterThan(preferred);
  });

  it('commits the validated polygon to canonical Floor boundaries for all planned levels', () => {
    const building = testBuilding({ floors: 3 });
    const intent = fitted('u_shape', building);
    const updated = applyFootprintToBuilding(building, intent);
    expect(updated.floors).toHaveLength(3);
    expect(updated.floors.every(floor => floor.boundary.points.length >= 3)).toBe(true);
    expect(updated.floors.map(floor => polygonArea(floor.boundary))).toEqual([polygonArea(updated.floors[0]!.boundary), polygonArea(updated.floors[0]!.boundary), polygonArea(updated.floors[0]!.boundary)]);
  });

  it('supports intentionally reduced upper floor plates', () => {
    const building = testBuilding({ floors: 3 });
    const base = fitted('rectangle', building);
    const intent: FootprintIntent = { ...base, strategy: 'custom_per_floor', floorOverrides: [{ floorLevel: 1, scalePercent: 90 }, { floorLevel: 2, scalePercent: 65 }] };
    const updated = applyFootprintToBuilding(building, intent);
    const areas = updated.floors.map(floor => polygonArea(floor.boundary));
    expect(areas[1]).toBeCloseTo(areas[0]! * 0.81);
    expect(areas[2]).toBeCloseTo(areas[0]! * 0.4225);
  });

  it('preserves existing rooms while changing the canonical floor boundary', () => {
    const base = testBuilding();
    const floor = base.floors[0]!;
    const room = createRoom({ floorId: floor.id, type: RoomType.Living, x: 2_000, y: 2_000, width: 3_000, height: 4_000 });
    const designed = { ...base, floors: [{ ...floor, rooms: [room] }] };
    expect(buildingHasDesignedGeometry(designed)).toBe(true);
    const updated = applyFootprintToBuilding(designed, fitted('l_shape', designed));
    expect(updated.floors[0]?.rooms[0]).toEqual(room);
  });

  it('derives a limited custom intent from an existing canonical ground boundary', () => {
    const base = testBuilding();
    const applied = applyFootprintToBuilding(base, fitted('t_shape', base));
    const derived = deriveFootprintIntent(applied);
    expect(derived.shape).toBe('custom');
    expect(derived.provenance).toBe('DERIVED_FROM_EXISTING_FLOOR');
    expect(validateFootprint(applied, derived).status).toBe('VALID');
  });

  it('rejects invalid floor override references', () => {
    const building = testBuilding({ floors: 2 });
    const intent = { ...fitted('rectangle', building), strategy: 'custom_per_floor' as const, floorOverrides: [{ floorLevel: 4, scalePercent: 80 }] };
    expect(validateFootprint(building, intent).issues).toContainEqual(expect.objectContaining({ field: 'floorOverrides' }));
  });
});
