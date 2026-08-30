import { describe, it, expect } from 'vitest';
import { renderBuilding } from '../index';
import { deserializeBuilding } from '@ai-floor-planner/core';
import * as fs from 'fs';
import * as path from 'path';

describe('SVG Renderer', () => {
  function loadFixture(name: string) {
    const cwdPath = path.resolve(process.cwd(), 'tests/fixtures', name);
    const fixturePath = fs.existsSync(cwdPath) ? cwdPath : path.resolve(__dirname, '../../../../tests/fixtures', name);
    const json = fs.readFileSync(fixturePath, 'utf-8');
    return deserializeBuilding(json);
  }

  describe('renderBuilding', () => {
    it('renders all rooms on floor', () => {
      const building = loadFixture('30x50-2bhk.json');
      const svg = renderBuilding(building, 0);

      // Count room elements
      const roomMatches = svg.match(/data-entity-type="room"/g);
      expect(roomMatches).not.toBeNull();
      expect(roomMatches!.length).toBe(building.floors[0]!.rooms.length);
    });

    it('produces valid SVG with xmlns', () => {
      const building = loadFixture('minimal-1room.json');
      const svg = renderBuilding(building, 0);
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    });

    it('includes room labels', () => {
      const building = loadFixture('30x50-2bhk.json');
      const svg = renderBuilding(building, 0);
      expect(svg).toContain('Living Room');
      expect(svg).toContain('Kitchen');
      expect(svg).toContain('Master Bedroom');
    });

    it('includes area text', () => {
      const building = loadFixture('minimal-1room.json');
      const svg = renderBuilding(building, 0);
      expect(svg).toContain('sq m');
    });

    it('includes north arrow', () => {
      const building = loadFixture('minimal-1room.json');
      const svg = renderBuilding(building, 0);
      expect(svg).toContain('north-arrow');
      expect(svg).toContain('>N<');
    });

    it('includes dimension annotations', () => {
      const building = loadFixture('30x50-2bhk.json');
      const svg = renderBuilding(building, 0);
      expect(svg).toContain('layer-annotations');
    });

    it('includes plot boundary', () => {
      const building = loadFixture('30x50-2bhk.json');
      const svg = renderBuilding(building, 0);
      expect(svg).toContain('layer-plot');
    });

    it('renders rooms with correct data attributes', () => {
      const building = loadFixture('30x50-2bhk.json');
      const svg = renderBuilding(building, 0);
      const roomId = building.floors[0]!.rooms[0]!.id;
      expect(svg).toContain(`data-entity-id="${roomId}"`);
    });

    it('returns empty svg for missing floor level', () => {
      const building = loadFixture('minimal-1room.json');
      const svg = renderBuilding(building, 99);
      expect(svg).toContain('<svg');
    });
  });
});
