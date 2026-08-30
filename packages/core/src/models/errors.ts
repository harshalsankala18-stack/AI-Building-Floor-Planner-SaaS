/**
 * Domain error classes for the Building Model.
 * Provide structured error codes for programmatic handling.
 */

/** Base class for all domain errors. */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

/** Thrown when an entity lookup fails. */
export class EntityNotFoundError extends DomainError {
  constructor(entityType: string, entityId: string) {
    super(
      `${entityType} with id "${entityId}" not found`,
      'ENTITY_NOT_FOUND',
    );
    this.name = 'EntityNotFoundError';
  }
}

/** Thrown when a dimension value is invalid (≤ 0, NaN, etc.). */
export class InvalidDimensionError extends DomainError {
  constructor(field: string, value: number) {
    super(
      `Invalid dimension for "${field}": ${value}. Must be > 0.`,
      'INVALID_DIMENSION',
    );
    this.name = 'InvalidDimensionError';
  }
}

/** Thrown when a coordinate value is not finite. */
export class InvalidCoordinateError extends DomainError {
  constructor(field: string, value: number) {
    super(
      `Invalid coordinate for "${field}": ${value}. Must be finite.`,
      'INVALID_COORDINATE',
    );
    this.name = 'InvalidCoordinateError';
  }
}

/** Thrown when deserialization from JSON fails schema validation. */
export class DeserializationError extends DomainError {
  public readonly errors: ReadonlyArray<{ path: string; message: string; value: unknown }>;

  constructor(errors: ReadonlyArray<{ path: string; message: string; value: unknown }>) {
    super(
      `Deserialization failed: ${errors.length} validation error(s)`,
      'DESERIALIZATION_FAILED',
    );
    this.name = 'DeserializationError';
    this.errors = errors;
  }
}
