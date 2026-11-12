import { describe, expect, it } from 'vitest';
import {
  FOOTPRINT_SHAPES,
  autoFitFootprint,
  checkFootprintFeasibility,
  createBuilding,
  validateFootprint,
  type FootprintShapeType,
} from '../index';

describe('All 13 Architectural Footprint Shapes & Feasibility', () => {
  const ALL_13_SHAPES: FootprintShapeType[] = [
    'rectangle',
    'square',
    'l_shape',
    'u_shape',
    'courtyard',
    'h_shape',
    't_shape',
    'v_shape',
    'z_shape',
    'linear',
    'stepped',
    'custom',
    'flexible',
  ];

  it('contains exactly the 13 canonical architectural shapes', () => {
    expect(FOOTPRINT_SHAPES.map(s => s.id)).toEqual(ALL_13_SHAPES);
  });

  ALL_13_SHAPES.forEach(shape => {
    it(`generates a valid, non-self-intersecting polygon for shape: ${shape}`, () => {
      const building = createBuilding({
        projectId: `test_${shape}`,
        name: `Test ${shape}`,
        site: {
          plotWidth: 18_000,
          plotDepth: 24_000,
          setbacks: { front: 2_000, rear: 1_500, left: 1_200, right: 1_200 },
        },
      });

      const intent = autoFitFootprint(building, undefined, shape, {
        openingDirection: 'north',
      });
      const validation = validateFootprint(building, intent);
      expect(validation.status).toBe('VALID');
      expect(validation.polygon).toBeDefined();
      expect(validation.polygon!.points.length).toBeGreaterThanOrEqual(4);
    });
  });

  it('correctly reports feasibility for U-shape on a narrow plot', () => {
    const narrowBuilding = createBuilding({
      projectId: 'narrow_plot',
      name: 'Narrow Plot',
      site: {
        plotWidth: 6_000, // 6m total width
        plotDepth: 20_000,
        setbacks: { front: 1_500, rear: 1_000, left: 1_000, right: 1_000 }, // buildable width = 4m
      },
    });

    const result = checkFootprintFeasibility(narrowBuilding, 'u_shape');
    expect(result.feasible).toBe(false);
    expect(result.reason).toContain('8.5m');
    expect(result.suggestedAlternatives).toContain('linear');
    expect(result.suggestedAlternatives).toContain('rectangle');
  });

  it('correctly reports feasibility for U-shape on a generous plot', () => {
    const generousBuilding = createBuilding({
      projectId: 'generous_plot',
      name: 'Generous Plot',
      site: {
        plotWidth: 18_000, // 18m width
        plotDepth: 24_000,
        setbacks: { front: 2_000, rear: 1_500, left: 1_200, right: 1_200 }, // buildable width = 15.6m
      },
    });

    const result = checkFootprintFeasibility(generousBuilding, 'u_shape');
    expect(result.feasible).toBe(true);
  });

  it('rotates polygon correctly based on openingDirection', () => {
    const building = createBuilding({
      projectId: 'test_rotation',
      name: 'Rotation Test',
      site: { plotWidth: 20_000, plotDepth: 20_000 },
    });

    const northIntent = autoFitFootprint(building, undefined, 'u_shape', { openingDirection: 'north' });
    const eastIntent = autoFitFootprint(building, undefined, 'u_shape', { openingDirection: 'east' });

    expect(northIntent.transform.rotation).toBe(0);
    expect(eastIntent.transform.rotation).toBe(90);

    const northVal = validateFootprint(building, northIntent);
    const eastVal = validateFootprint(building, eastIntent);

    expect(northVal.status).toBe('VALID');
    expect(eastVal.status).toBe('VALID');
  });
});
