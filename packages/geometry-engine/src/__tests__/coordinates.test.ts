/**
 * Mathematical Verification Suite for Coordinate System & World/Screen Transform.
 * Covers:
 * - worldToScreen / screenToWorld identity & inverse
 * - Round-trip precision (world -> screen -> world and screen -> world -> screen)
 * - Zoom scaling dynamics (extreme zoom levels)
 * - Pan offset translations (positive, negative, large offsets)
 * - Viewport dimensions & dynamic resizing
 * - Real-world plot sizes (Canonical 30x50, 40x60, large custom plots)
 * - Sub-millimeter floating point tolerance verification
 */

import { describe, it, expect } from 'vitest';
import type { Point, ScreenPoint, BoundingBox, ViewTransform } from '@ai-floor-planner/core';
import {
  worldToScreen,
  screenToWorld,
  worldRectToScreen,
  screenRectToWorld,
  fitBoundsToViewport,
} from '../coordinates';

const EPSILON = 1e-5;

function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

describe('Step 2 Coordinate System & Transform Audit', () => {
  describe('World / Screen Inverse Mapping', () => {
    const transform: ViewTransform = {
      scale: 0.045, // approx 1:22 scale (mm to px)
      offsetX: 150,
      offsetY: 80,
    };

    it('TEST 1: world -> screen -> world recovers the exact original point', () => {
      const testPoints: Point[] = [
        { x: 0, y: 0 }, // Origin (NW corner)
        { x: 9144, y: 0 }, // NE corner of 30x50 plot
        { x: 9144, y: 15240 }, // SE corner of 30x50 plot
        { x: 0, y: 15240 }, // SW corner of 30x50 plot
        { x: 4572, y: 7620 }, // Plot center
        { x: 1200, y: 1500 }, // Living room corner
        { x: -500, y: -800 }, // Negative offset point
        { x: 123456.789, y: 987654.321 }, // Large fractional coordinate
      ];

      for (const worldPt of testPoints) {
        const screenPt = worldToScreen(worldPt, transform);
        const recoveredWorldPt = screenToWorld(screenPt, transform);

        expect(distance(worldPt, recoveredWorldPt)).toBeLessThan(EPSILON);
      }
    });

    it('TEST 2: screen -> world -> screen recovers original screen point', () => {
      const testScreenPoints: ScreenPoint[] = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
        { x: 800, y: 600 },
        { x: 1920, y: 1080 },
        { x: 543.21, y: 987.65 },
      ];

      for (const screenPt of testScreenPoints) {
        const worldPt = screenToWorld(screenPt, transform);
        const recoveredScreenPt = worldToScreen(worldPt, transform);

        const screenDist = Math.sqrt((screenPt.x - recoveredScreenPt.x) ** 2 + (screenPt.y - recoveredScreenPt.y) ** 2);
        expect(screenDist).toBeLessThan(EPSILON);
      }
    });
  });

  describe('Zoom & Scaling Behavior', () => {
    it('TEST 3: handles extreme zoom levels deterministically', () => {
      const zoomLevels = [0.001, 0.01, 0.045, 0.1, 0.5, 1.0, 5.0, 10.0];
      const worldPoint: Point = { x: 4572, y: 7620 };

      for (const scale of zoomLevels) {
        const t: ViewTransform = { scale, offsetX: 200, offsetY: 150 };
        const s = worldToScreen(worldPoint, t);
        const w = screenToWorld(s, t);

        expect(distance(worldPoint, w)).toBeLessThan(EPSILON);
      }
    });

    it('throws DegenerateGeometryError on scale = 0 for screenToWorld', () => {
      const t: ViewTransform = { scale: 0, offsetX: 100, offsetY: 100 };
      expect(() => screenToWorld({ x: 100, y: 100 }, t)).toThrow();
    });
  });

  describe('Pan & Translation Behavior', () => {
    it('TEST 4: handles positive, negative, and large pan offsets', () => {
      const panOffsets = [
        { offsetX: 0, offsetY: 0 },
        { offsetX: 500, offsetY: 300 },
        { offsetX: -1200, offsetY: -850 },
        { offsetX: 100000, offsetY: 50000 },
      ];
      const worldPoint: Point = { x: 3000, y: 6000 };

      for (const { offsetX, offsetY } of panOffsets) {
        const t: ViewTransform = { scale: 0.05, offsetX, offsetY };
        const s = worldToScreen(worldPoint, t);
        const w = screenToWorld(s, t);

        expect(distance(worldPoint, w)).toBeLessThan(EPSILON);
      }
    });
  });

  describe('Viewport Dimensions & Bounding Box Fits', () => {
    it('TEST 5: fits Canonical 30x50 plot into standard CAD viewport', () => {
      const plot30x50: BoundingBox = { x: 0, y: 0, width: 9144, height: 15240 };
      const viewportWidth = 1200;
      const viewportHeight = 800;
      const padding = 50;

      const fit = fitBoundsToViewport(plot30x50, viewportWidth, viewportHeight, padding);

      expect(fit.scale).toBeGreaterThan(0);
      expect(fit.scale).toBeLessThan(1);

      // Verify plot fits inside viewport bounds with padding
      const nwScreen = worldToScreen({ x: 0, y: 0 }, fit);
      const seScreen = worldToScreen({ x: 9144, y: 15240 }, fit);

      expect(nwScreen.x).toBeGreaterThanOrEqual(padding - 0.1);
      expect(nwScreen.y).toBeGreaterThanOrEqual(padding - 0.1);
      expect(seScreen.x).toBeLessThanOrEqual(viewportWidth - padding + 0.1);
      expect(seScreen.y).toBeLessThanOrEqual(viewportHeight - padding + 0.1);

      // Verify centered position
      const plotCenterScreen = worldToScreen({ x: 4572, y: 7620 }, fit);
      expect(plotCenterScreen.x).toBeCloseTo(viewportWidth / 2, 0);
      expect(plotCenterScreen.y).toBeCloseTo(viewportHeight / 2, 0);
    });

    it('TEST 6: fits 40x60 plot (12192 x 18288 mm) correctly', () => {
      const plot40x60: BoundingBox = { x: 0, y: 0, width: 12192, height: 18288 };
      const fit = fitBoundsToViewport(plot40x60, 1600, 900, 60);

      const centerScreen = worldToScreen({ x: 6096, y: 9144 }, fit);
      expect(centerScreen.x).toBeCloseTo(800, 0);
      expect(centerScreen.y).toBeCloseTo(450, 0);
    });

    it('TEST 7: fits irregular/custom offset plots correctly', () => {
      const customBounds: BoundingBox = { x: 2000, y: 5000, width: 25000, height: 15000 };
      const fit = fitBoundsToViewport(customBounds, 1920, 1080, 40);

      const centerScreen = worldToScreen({ x: 2000 + 12500, y: 5000 + 7500 }, fit);
      expect(centerScreen.x).toBeCloseTo(1920 / 2, 0);
      expect(centerScreen.y).toBeCloseTo(1080 / 2, 0);
    });

    it('TEST 8: worldRectToScreen and screenRectToWorld round trip', () => {
      const transform: ViewTransform = { scale: 0.05, offsetX: 100, offsetY: 80 };
      const worldRect: BoundingBox = { x: 1200, y: 1500, width: 3800, height: 4800 };

      const screenRect = worldRectToScreen(worldRect, transform);
      const recoveredWorldRect = screenRectToWorld(screenRect, transform);

      expect(recoveredWorldRect.x).toBeCloseTo(worldRect.x, 3);
      expect(recoveredWorldRect.y).toBeCloseTo(worldRect.y, 3);
      expect(recoveredWorldRect.width).toBeCloseTo(worldRect.width, 3);
      expect(recoveredWorldRect.height).toBeCloseTo(worldRect.height, 3);
    });
  });
});
