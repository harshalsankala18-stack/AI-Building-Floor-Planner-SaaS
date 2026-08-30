/**
 * Geometry Debugger & Visual Inspector (Development-Only).
 *
 * Produces structured debug snapshots and standalone SVG strings for developer inspection
 * of points, lines, walls, centerlines, thick wall polygons, bounding boxes, intersections,
 * and collision regions without any browser, React, or UI framework dependencies.
 */

import type { Point, Polygon, LineSegment, BoundingBox, Room, Wall, Door } from '@ai-floor-planner/core';
import { wallToPolygon } from './walls';
import { computeDoorSwingPolygon } from './doors';
import { polygonBoundingBox } from './polygon';

export interface DebugItem {
  readonly id: string;
  readonly type: 'point' | 'segment' | 'polygon' | 'bbox' | 'intersection' | 'collision';
  readonly label?: string;
  readonly color?: string;
  readonly geometry: Point | LineSegment | Polygon | BoundingBox;
}

export interface DebugSnapshot {
  readonly timestamp: string;
  readonly bounds: BoundingBox;
  readonly items: readonly DebugItem[];
}

export class GeometryDebugCollector {
  private items: DebugItem[] = [];

  addPoint(p: Point, label?: string, color: string = '#e74c3c'): this {
    this.items.push({ id: `pt_${this.items.length}`, type: 'point', label, color, geometry: p });
    return this;
  }

  addSegment(seg: LineSegment, label?: string, color: string = '#3498db'): this {
    this.items.push({ id: `seg_${this.items.length}`, type: 'segment', label, color, geometry: seg });
    return this;
  }

  addPolygon(poly: Polygon, label?: string, color: string = '#2ecc71'): this {
    this.items.push({ id: `poly_${this.items.length}`, type: 'polygon', label, color, geometry: poly });
    return this;
  }

  addBoundingBox(bbox: BoundingBox, label?: string, color: string = '#f39c12'): this {
    this.items.push({ id: `bbox_${this.items.length}`, type: 'bbox', label, color, geometry: bbox });
    return this;
  }

  addIntersection(p: Point, label?: string): this {
    this.items.push({ id: `inter_${this.items.length}`, type: 'intersection', label: label ?? 'Intersection', color: '#e67e22', geometry: p });
    return this;
  }

  addCollision(poly: Polygon, label?: string): this {
    this.items.push({ id: `col_${this.items.length}`, type: 'collision', label: label ?? 'Collision', color: '#c0392b', geometry: poly });
    return this;
  }

  addRoom(room: Room): this {
    this.addPolygon(room.boundary, `${room.name} (${room.type})`, '#1abc9c');
    return this;
  }

  addWall(wall: Wall): this {
    // Add centerline
    this.addSegment({ start: wall.startPoint, end: wall.endPoint }, `Wall Centerline [${wall.id}]`, '#2980b9');
    // Add thick wall
    try {
      this.addPolygon(wallToPolygon(wall), `Wall [${wall.id}] (${wall.type})`, '#7f8c8d');
    } catch {
      // Ignore if degenerate
    }
    return this;
  }

  addDoor(door: Door, hostWall: Wall): this {
    try {
      const swing = computeDoorSwingPolygon(door, hostWall);
      this.addPolygon(swing, `Door Swing [${door.id}]`, '#9b59b6');
    } catch {
      // Ignore
    }
    return this;
  }

  getSnapshot(): DebugSnapshot {
    // Compute total bounds of all items
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const item of this.items) {
      if (item.type === 'point' || item.type === 'intersection') {
        const p = item.geometry as Point;
        minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
      } else if (item.type === 'segment') {
        const seg = item.geometry as LineSegment;
        minX = Math.min(minX, seg.start.x, seg.end.x); minY = Math.min(minY, seg.start.y, seg.end.y);
        maxX = Math.max(maxX, seg.start.x, seg.end.x); maxY = Math.max(maxY, seg.start.y, seg.end.y);
      } else if (item.type === 'polygon' || item.type === 'collision') {
        const poly = item.geometry as Polygon;
        const bbox = polygonBoundingBox(poly);
        minX = Math.min(minX, bbox.x); minY = Math.min(minY, bbox.y);
        maxX = Math.max(maxX, bbox.x + bbox.width); maxY = Math.max(maxY, bbox.y + bbox.height);
      } else if (item.type === 'bbox') {
        const bbox = item.geometry as BoundingBox;
        minX = Math.min(minX, bbox.x); minY = Math.min(minY, bbox.y);
        maxX = Math.max(maxX, bbox.x + bbox.width); maxY = Math.max(maxY, bbox.y + bbox.height);
      }
    }

    if (!Number.isFinite(minX)) {
      minX = 0; minY = 0; maxX = 1000; maxY = 1000;
    }

    return {
      timestamp: new Date().toISOString(),
      bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
      items: [...this.items],
    };
  }

  /** Render all debug items into an independent SVG markup string. */
  toSVG(padding: number = 200): string {
    const snap = this.getSnapshot();
    const { x, y, width, height } = snap.bounds;
    const viewBox = `${x - padding} ${y - padding} ${width + 2 * padding} ${height + 2 * padding}`;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="800" height="600" style="background:#1e1e2e; font-family:sans-serif;">\n`;

    for (const item of snap.items) {
      const color = item.color ?? '#ffffff';
      if (item.type === 'point' || item.type === 'intersection') {
        const p = item.geometry as Point;
        svg += `  <circle cx="${p.x}" cy="${p.y}" r="20" fill="${color}" stroke="#ffffff" stroke-width="2" />\n`;
      } else if (item.type === 'segment') {
        const seg = item.geometry as LineSegment;
        svg += `  <line x1="${seg.start.x}" y1="${seg.start.y}" x2="${seg.end.x}" y2="${seg.end.y}" stroke="${color}" stroke-width="6" stroke-linecap="round" />\n`;
      } else if (item.type === 'polygon' || item.type === 'collision') {
        const poly = item.geometry as Polygon;
        const ptsStr = poly.points.map(pt => `${pt.x},${pt.y}`).join(' ');
        const fill = item.type === 'collision' ? 'rgba(231, 76, 60, 0.4)' : 'rgba(52, 152, 219, 0.15)';
        svg += `  <polygon points="${ptsStr}" fill="${fill}" stroke="${color}" stroke-width="4" />\n`;
      } else if (item.type === 'bbox') {
        const bbox = item.geometry as BoundingBox;
        svg += `  <rect x="${bbox.x}" y="${bbox.y}" width="${bbox.width}" height="${bbox.height}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="10,5" />\n`;
      }
    }

    svg += `</svg>`;
    return svg;
  }

  clear(): void {
    this.items = [];
  }
}
