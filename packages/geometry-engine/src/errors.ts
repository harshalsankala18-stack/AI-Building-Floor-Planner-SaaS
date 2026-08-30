/**
 * Strongly-typed error classes for the Geometry Engine.
 * Explicit errors are thrown or returned on invalid geometry inputs;
 * invalid data is never silently corrected or ignored.
 */

export class GeometryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeometryError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidCoordinateError extends GeometryError {
  constructor(coordinateName: string, value: unknown, reason?: string) {
    super(`Invalid coordinate for ${coordinateName}: ${String(value)}${reason ? ` (${reason})` : ''}`);
    this.name = 'InvalidCoordinateError';
  }
}

export class DegenerateGeometryError extends GeometryError {
  constructor(entityType: string, reason: string) {
    super(`Degenerate ${entityType}: ${reason}`);
    this.name = 'DegenerateGeometryError';
  }
}

export class OutOfBoundsError extends GeometryError {
  constructor(entityName: string, boundaryName: string, details?: string) {
    super(`${entityName} exceeds ${boundaryName}${details ? `: ${details}` : ''}`);
    this.name = 'OutOfBoundsError';
  }
}

export class WallPlacementError extends GeometryError {
  constructor(openingType: 'door' | 'window', reason: string) {
    super(`Cannot place ${openingType} on wall: ${reason}`);
    this.name = 'WallPlacementError';
  }
}

export class SelfIntersectionError extends GeometryError {
  constructor(entityType: string, details?: string) {
    super(`Self-intersecting ${entityType}${details ? `: ${details}` : ''}`);
    this.name = 'SelfIntersectionError';
  }
}
