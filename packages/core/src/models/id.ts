/**
 * UUID generation for entity IDs.
 *
 * Production: uses crypto.randomUUID() for true randomness.
 * Testing: supports a seedable counter for deterministic IDs.
 */

let seed: number | null = null;
let counter = 0;

/** Generate a UUID v4 string. Deterministic when seed is set. */
export function generateId(): string {
  if (seed !== null) {
    counter++;
    // Produce a deterministic UUID-like string from seed + counter
    const hex = (seed * 1000000 + counter).toString(16).padStart(12, '0');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4000-8000-${hex.padStart(12, '0').slice(0, 12)}`;
  }
  return crypto.randomUUID();
}

/** Set a seed for deterministic ID generation (testing only). */
export function setIdSeed(s: number): void {
  seed = s;
  counter = 0;
}

/** Reset to random ID generation. */
export function resetIdGenerator(): void {
  seed = null;
  counter = 0;
}
