import { describe, expect, it } from 'vitest';
import {
  planDeterministicApartment,
  renderStructuralPlan,
  validateStructuralPlanRepresentation,
  STRUCTURAL_RENDERER_VERSION,
  InvalidStructuralPlanError,
  type StructuralPlanRepresentation,
  type ApartmentLayoutStrategy,
} from '../index';

describe('High-Resolution Structural Plan Renderer — Visual Elements & Invariants', () => {
  const baseSite = {
    plotWidthMm: 45000,
    plotDepthMm: 50000,
    setbacksMm: { front: 4000, rear: 3000, left: 3000, right: 3000 },
  };

  it('renders valid high-resolution PNG and SVG with zero authoritative text in production mode', () => {
    const planned = planDeterministicApartment({
      site: baseSite,
      flatsPerFloor: 2,
      unitMix: [
        { unitType: '2BHK', count: 1 },
        { unitType: '3BHK', count: 1 },
      ],
      commonCore: { passengerLifts: 2, staircaseCount: 2, commonLobby: true },
      strategy: 'balanced',
      seed: 42,
    });

    expect(planned.success).toBe(true);
    const result = renderStructuralPlan(planned.structuralRepresentation);

    // Resolution: long side ~2048px, short side >= 1536px
    expect(Math.max(result.width, result.height)).toBe(2048);
    expect(Math.min(result.width, result.height)).toBeGreaterThanOrEqual(1536);
    expect(result.rendererVersion).toBe(STRUCTURAL_RENDERER_VERSION);
    expect(result.hash).toMatch(/^[a-f0-9]{64}$/);

    // PNG verification
    expect(Buffer.isBuffer(result.png)).toBe(true);
    expect(result.png.length).toBeGreaterThan(5000);
    // PNG magic bytes
    expect(result.png[0]).toBe(0x89);
    expect(result.png[1]).toBe(0x50); // P
    expect(result.png[2]).toBe(0x4e); // N
    expect(result.png[3]).toBe(0x47); // G
    expect(result.png[4]).toBe(0x0d);
    expect(result.png[5]).toBe(0x0a);
    expect(result.png[6]).toBe(0x1a);
    expect(result.png[7]).toBe(0x0a);

    // SVG verification
    expect(result.svg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(result.svg).toContain(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${result.width} ${result.height}"`);
    expect(result.svg).toContain('</svg>');

    // Structural elements rendered
    expect(result.svg).toContain('class="outer-building-boundary"');
    expect(result.svg).toContain('class="common-lobby"');
    expect(result.svg).toContain('class="flat-boundary"');
    expect(result.svg).toContain('class="room-partition"');
    expect(result.svg).toContain('class="lift-shaft"');
    expect(result.svg).toContain('class="lift-cross"');
    expect(result.svg).toContain('class="stair-well"');
    expect(result.svg).toContain('class="stair-tread"');
    expect(result.svg).toContain('class="stair-divider"');
    expect(result.svg).toContain('class="door-leaf"');
    expect(result.svg).toContain('class="door-arc"');

    // ZERO authoritative text in production mode
    expect(result.svg).not.toContain('<text');
    expect(result.svg).not.toContain('BEDROOM');
    expect(result.svg).not.toContain('KITCHEN');
    expect(result.svg).not.toContain('LIVING');
    expect(result.svg).not.toContain('DINING');
    expect(result.svg).not.toContain('BATH');
    expect(result.svg).not.toContain('FLAT 01');
    expect(result.svg).not.toContain('FLAT 02');
  });

  it('renders debug overlays only when debug mode is explicitly enabled', () => {
    const planned = planDeterministicApartment({
      site: baseSite,
      flatsPerFloor: 2,
      unitMix: [
        { unitType: '2BHK', count: 1 },
        { unitType: '3BHK', count: 1 },
      ],
      strategy: 'balanced',
    });

    const prodResult = renderStructuralPlan(planned.structuralRepresentation, { debug: false });
    expect(prodResult.svg).not.toContain('<text');
    expect(prodResult.svg).not.toContain('debug-overlay');

    const debugResult = renderStructuralPlan(planned.structuralRepresentation, { debug: true });
    expect(debugResult.svg).toContain('<text');
    expect(debugResult.svg).toContain('id="debug-overlay"');
  });
});

describe('High-Resolution Structural Plan Renderer — Matrix (1 to 6 Flats)', () => {
  const configs = [
    {
      flats: 1,
      mix: [{ unitType: '3BHK', count: 1, carpetAreaSqFt: 1100 }],
      site: { plotWidthMm: 35000, plotDepthMm: 35000 },
      lifts: 1,
      stairs: 1,
    },
    {
      flats: 2,
      mix: [
        { unitType: '2BHK', count: 1, carpetAreaSqFt: 750 },
        { unitType: '3BHK', count: 1, carpetAreaSqFt: 1100 },
      ],
      site: { plotWidthMm: 45000, plotDepthMm: 45000 },
      lifts: 2,
      stairs: 2,
    },
    {
      flats: 3,
      mix: [
        { unitType: '2BHK', count: 2, carpetAreaSqFt: 750 },
        { unitType: '3BHK', count: 1, carpetAreaSqFt: 1100 },
      ],
      site: { plotWidthMm: 45000, plotDepthMm: 50000 },
      lifts: 1,
      stairs: 1,
    },
    {
      flats: 4,
      mix: [
        { unitType: '2BHK', count: 2, carpetAreaSqFt: 750 },
        { unitType: '3BHK', count: 2, carpetAreaSqFt: 1100 },
      ],
      site: { plotWidthMm: 45000, plotDepthMm: 50000 },
      lifts: 2,
      stairs: 2,
    },
    {
      flats: 5,
      mix: [
        { unitType: '2BHK', count: 3, carpetAreaSqFt: 750 },
        { unitType: '3BHK', count: 2, carpetAreaSqFt: 1050 },
      ],
      site: { plotWidthMm: 50000, plotDepthMm: 60000 },
      lifts: 2,
      stairs: 2,
    },
    {
      flats: 6,
      mix: [
        { unitType: '2BHK', count: 4, carpetAreaSqFt: 750 },
        { unitType: '3BHK', count: 2, carpetAreaSqFt: 1050 },
      ],
      site: { plotWidthMm: 50000, plotDepthMm: 65000 },
      lifts: 2,
      stairs: 2,
    },
  ];

  it.each(configs)(
    'renders $flats flat(s) preserving exact core elements, flat boundaries, and doors',
    ({ flats, mix, site, lifts, stairs }) => {
      const planned = planDeterministicApartment({
        site: {
          plotWidthMm: site.plotWidthMm,
          plotDepthMm: site.plotDepthMm,
          setbacksMm: { front: 3500, rear: 2500, left: 2500, right: 2500 },
        },
        flatsPerFloor: flats,
        unitMix: mix,
        commonCore: {
          passengerLifts: lifts,
          staircaseCount: stairs,
          commonLobby: true,
        },
        strategy: 'balanced',
        seed: 42,
      });

      expect(planned.success).toBe(true);
      const res = renderStructuralPlan(planned.structuralRepresentation);

      // Verify flat boundaries count
      const flatMatches = res.svg.match(/class="flat-boundary"/g);
      expect(flatMatches).toHaveLength(flats);

      // Verify exact lift shafts rendered
      const liftMatches = res.svg.match(/class="lift-shaft"/g);
      expect(liftMatches).toHaveLength(lifts);

      // Verify exact stair wells rendered
      const stairMatches = res.svg.match(/class="stair-well"/g);
      expect(stairMatches).toHaveLength(stairs);

      // Doors rendered
      const doorMatches = res.svg.match(/class="door-leaf"/g);
      expect(doorMatches?.length).toBeGreaterThanOrEqual(flats * 5); // Each flat has entrance + rooms + baths
    },
  );
});

describe('High-Resolution Structural Plan Renderer — Strategies & Determinism', () => {
  const strategies: ApartmentLayoutStrategy[] = ['balanced', 'daylight', 'privacy', 'circulation'];

  it.each(strategies)('successfully renders strategy "%s" with exact structural fidelity', strategy => {
    const planned = planDeterministicApartment({
      site: {
        plotWidthMm: 45000,
        plotDepthMm: 50000,
        setbacksMm: { front: 4000, rear: 3000, left: 2500, right: 2500 },
      },
      flatsPerFloor: 2,
      unitMix: [
        { unitType: '2BHK', count: 1 },
        { unitType: '3BHK', count: 1 },
      ],
      strategy,
      seed: 42,
    });

    expect(planned.success).toBe(true);
    const res = renderStructuralPlan(planned.structuralRepresentation);

    expect(res.png.length).toBeGreaterThan(10000);
    expect(res.svg).toContain('class="outer-building-boundary"');
    expect(res.svg).toContain('class="common-lobby"');
  });

  it('guarantees byte-for-byte deterministic reproducibility for identical representation and options', () => {
    const planned = planDeterministicApartment({
      site: {
        plotWidthMm: 45000,
        plotDepthMm: 50000,
        setbacksMm: { front: 4000, rear: 3000, left: 2500, right: 2500 },
      },
      flatsPerFloor: 2,
      unitMix: [
        { unitType: '2BHK', count: 1 },
        { unitType: '3BHK', count: 1 },
      ],
      strategy: 'balanced',
      seed: 12345,
    });

    const render1 = renderStructuralPlan(planned.structuralRepresentation);
    const render2 = renderStructuralPlan(planned.structuralRepresentation);

    expect(render1.hash).toBe(render2.hash);
    expect(render1.width).toBe(render2.width);
    expect(render1.height).toBe(render2.height);
    expect(render1.png.equals(render2.png)).toBe(true);
    expect(render1.svg).toBe(render2.svg);
  });
});

describe('High-Resolution Structural Plan Renderer — Aspect Ratio & Framing', () => {
  it('correctly adapts canvas dimensions to landscape vs portrait building aspect ratio', () => {
    // Landscape building (60m wide x 30m deep)
    const landscapePlan = planDeterministicApartment({
      site: {
        plotWidthMm: 60000,
        plotDepthMm: 30000,
        setbacksMm: { front: 3000, rear: 3000, left: 3000, right: 3000 },
      },
      flatsPerFloor: 2,
      unitMix: [
        { unitType: '2BHK', count: 1 },
        { unitType: '3BHK', count: 1 },
      ],
      strategy: 'balanced',
    });

    const landscapeRes = renderStructuralPlan(landscapePlan.structuralRepresentation);
    expect(landscapeRes.width).toBeGreaterThan(landscapeRes.height);
    expect(landscapeRes.width).toBe(2048);

    // Portrait building (16m wide x 32m deep, aspect = 0.5)
    const portraitRep: StructuralPlanRepresentation = {
      ...landscapePlan.structuralRepresentation,
      buildingFootprint: { x: 3, y: 3, width: 16, height: 32 },
      outerBuildingWalls: [
        { id: 'w1', start: { x: 3, y: 3 }, end: { x: 19, y: 3 }, classification: 'outer_wall', thicknessM: 0.23 },
        { id: 'w2', start: { x: 19, y: 3 }, end: { x: 19, y: 35 }, classification: 'outer_wall', thicknessM: 0.23 },
        { id: 'w3', start: { x: 19, y: 35 }, end: { x: 3, y: 35 }, classification: 'outer_wall', thicknessM: 0.23 },
        { id: 'w4', start: { x: 3, y: 35 }, end: { x: 3, y: 3 }, classification: 'outer_wall', thicknessM: 0.23 },
      ],
      flatBoundaries: landscapePlan.structuralRepresentation.flatBoundaries.map((f, i) => ({
        ...f,
        bounds: { x: 3, y: 3 + i * 16, width: 16, height: 16 },
      })),
      balconies: [],
    };

    const portraitRes = renderStructuralPlan(portraitRep);
    expect(portraitRes.height).toBeGreaterThan(portraitRes.width);
    expect(portraitRes.height).toBe(2048);
  });

  it('REGRESSION: changing render resolution modifies raster size without changing architectural proportions', () => {
    const planned = planDeterministicApartment({
      site: {
        plotWidthMm: 45000,
        plotDepthMm: 45000,
        setbacksMm: { front: 3000, rear: 3000, left: 3000, right: 3000 },
      },
      flatsPerFloor: 2,
      unitMix: [
        { unitType: '2BHK', count: 1 },
        { unitType: '3BHK', count: 1 },
      ],
      strategy: 'balanced',
    });

    const res2048 = renderStructuralPlan(planned.structuralRepresentation, { targetLongSidePx: 2048, minShortSidePx: 512 });
    const res1024 = renderStructuralPlan(planned.structuralRepresentation, { targetLongSidePx: 1024, minShortSidePx: 256 });

    expect(res2048.width).toBe(2048);
    expect(res1024.width).toBe(1024);

    // Aspect ratio of the canvas is identical
    const ratio2048 = res2048.width / res2048.height;
    const ratio1024 = res1024.width / res1024.height;
    expect(Math.abs(ratio2048 - ratio1024)).toBeLessThan(0.02);

    // The bounding box of the underlying architectural geometry is completely unchanged
    expect(res2048.boundingBox).toEqual(res1024.boundingBox);
  });
});

describe('High-Resolution Structural Plan Renderer — Pre-render Validation', () => {
  it('rejects structurally invalid or empty representations with explicit error reasons', () => {
    const emptyRep = {} as unknown as StructuralPlanRepresentation;
    const val = validateStructuralPlanRepresentation(emptyRep);
    expect(val.valid).toBe(false);
    expect(val.errors.length).toBeGreaterThan(0);

    expect(() => renderStructuralPlan(emptyRep)).toThrow(InvalidStructuralPlanError);
  });
});
