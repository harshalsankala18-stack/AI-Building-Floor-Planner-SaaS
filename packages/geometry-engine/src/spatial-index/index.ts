/**
 * Spatial Index Abstraction for 2D Geometry Queries.
 * Provides fast sub-linear bounding-box intersection and collision queries.
 * Clean interface allows swapping spatial partitioning strategies (Grid, R-Tree, QuadTree)
 * without modifying domain code.
 */

import type { BoundingBox } from '@ai-floor-planner/core';
import { rectsOverlap } from '../rectangle';

export interface SpatialEntry<T> {
  readonly item: T;
  readonly bounds: BoundingBox;
}

export interface ISpatialIndex<T> {
  /** Insert an item with its axis-aligned bounding box. */
  insert(item: T, bounds: BoundingBox): void;

  /** Remove an item from the index. Returns true if removed. */
  remove(item: T): boolean;

  /** Query all items whose bounding boxes intersect the query bounds. */
  search(queryBounds: BoundingBox): T[];

  /** Remove all items from the index. */
  clear(): void;

  /** Total number of items stored in the index. */
  size(): number;

  /** Retrieve all entries with bounds. */
  allEntries(): SpatialEntry<T>[];
}

/**
 * Simple array-backed spatial index for small collections (N < 50).
 * Minimal overhead and 100% deterministic.
 */
export class SimpleSpatialIndex<T> implements ISpatialIndex<T> {
  private entries: SpatialEntry<T>[] = [];

  insert(item: T, bounds: BoundingBox): void {
    this.entries.push({ item, bounds });
  }

  remove(item: T): boolean {
    const idx = this.entries.findIndex(e => e.item === item);
    if (idx !== -1) {
      this.entries.splice(idx, 1);
      return true;
    }
    return false;
  }

  search(queryBounds: BoundingBox): T[] {
    const results: T[] = [];
    for (const entry of this.entries) {
      if (rectsOverlap(entry.bounds, queryBounds)) {
        results.push(entry.item);
      }
    }
    return results;
  }

  clear(): void {
    this.entries = [];
  }

  size(): number {
    return this.entries.length;
  }

  allEntries(): SpatialEntry<T>[] {
    return [...this.entries];
  }
}

/**
 * Uniform Grid Spatial Index for medium/large collections.
 * Partitions 2D space into discrete cells (default 1000mm cell size).
 */
export class GridSpatialIndex<T> implements ISpatialIndex<T> {
  private cellSize: number;
  private grid = new Map<string, Set<SpatialEntry<T>>>();
  private itemMap = new Map<T, SpatialEntry<T>>();

  constructor(cellSize: number = 2000) {
    this.cellSize = cellSize > 0 ? cellSize : 2000;
  }

  private cellKey(cellX: number, cellY: number): string {
    return `${cellX}:${cellY}`;
  }

  private getCellRange(bounds: BoundingBox): { minCX: number; maxCX: number; minCY: number; maxCY: number } {
    const minCX = Math.floor(bounds.x / this.cellSize);
    const maxCX = Math.floor((bounds.x + bounds.width) / this.cellSize);
    const minCY = Math.floor(bounds.y / this.cellSize);
    const maxCY = Math.floor((bounds.y + bounds.height) / this.cellSize);
    return { minCX, maxCX, minCY, maxCY };
  }

  insert(item: T, bounds: BoundingBox): void {
    if (this.itemMap.has(item)) {
      this.remove(item);
    }

    const entry: SpatialEntry<T> = { item, bounds };
    this.itemMap.set(item, entry);

    const { minCX, maxCX, minCY, maxCY } = this.getCellRange(bounds);
    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const key = this.cellKey(cx, cy);
        let cell = this.grid.get(key);
        if (!cell) {
          cell = new Set<SpatialEntry<T>>();
          this.grid.set(key, cell);
        }
        cell.add(entry);
      }
    }
  }

  remove(item: T): boolean {
    const entry = this.itemMap.get(item);
    if (!entry) return false;

    const { minCX, maxCX, minCY, maxCY } = this.getCellRange(entry.bounds);
    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const key = this.cellKey(cx, cy);
        const cell = this.grid.get(key);
        if (cell) {
          cell.delete(entry);
          if (cell.size === 0) {
            this.grid.delete(key);
          }
        }
      }
    }

    this.itemMap.delete(item);
    return true;
  }

  search(queryBounds: BoundingBox): T[] {
    const candidateEntries = new Set<SpatialEntry<T>>();
    const { minCX, maxCX, minCY, maxCY } = this.getCellRange(queryBounds);

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const cell = this.grid.get(this.cellKey(cx, cy));
        if (cell) {
          for (const entry of cell) {
            candidateEntries.add(entry);
          }
        }
      }
    }

    const results: T[] = [];
    for (const entry of candidateEntries) {
      if (rectsOverlap(entry.bounds, queryBounds)) {
        results.push(entry.item);
      }
    }

    return results;
  }

  clear(): void {
    this.grid.clear();
    this.itemMap.clear();
  }

  size(): number {
    return this.itemMap.size;
  }

  allEntries(): SpatialEntry<T>[] {
    return Array.from(this.itemMap.values());
  }
}
