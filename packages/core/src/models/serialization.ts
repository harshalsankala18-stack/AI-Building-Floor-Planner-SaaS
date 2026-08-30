/**
 * JSON serialization and deserialization for the Building Model.
 * Guarantees round-trip fidelity: serialize → deserialize produces identical data.
 */

import type { Building } from '../types';
import { validateBuildingSchema } from './validation';
import { DeserializationError } from './errors';

/** Serialize a Building to a JSON string. */
export function serializeBuilding(building: Building): string {
  return JSON.stringify(building, null, 2);
}

/** Deserialize a JSON string to a Building. Throws DeserializationError on invalid data. */
export function deserializeBuilding(json: string): Building {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new DeserializationError([
      { path: '', message: 'Invalid JSON', value: json.slice(0, 100) },
    ]);
  }

  const errors = validateBuildingSchema(parsed);
  if (errors.length > 0) {
    throw new DeserializationError(errors);
  }

  return parsed as Building;
}

/** Deep clone a Building via structuredClone. */
export function cloneBuilding(building: Building): Building {
  return structuredClone(building);
}
