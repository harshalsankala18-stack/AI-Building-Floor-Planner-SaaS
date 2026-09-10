import type { ArchitecturalEvidence, Building, RoomProgram } from './types/index';

/** Exact stable JSON identity avoids hash collisions and browser/Node differences.
 * Retain all model fields conservatively: even same-version edits invalidate evidence. */
export function architecturalIdentity(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(architecturalIdentity).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value)
    .filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${architecturalIdentity(item)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}

export function architecturalReviewState(evidence: ArchitecturalEvidence | undefined,
  building: Building, program: RoomProgram | undefined): NonNullable<ArchitecturalEvidence['closeout']>['review'] {
  const closeout = evidence?.closeout;
  if (!program || evidence?.schemaVersion !== 1 || evidence.accessEvidenceVersion !== 1
    || !closeout || closeout.version !== 1
    || !['DRAFT', 'REVIEW_REQUIRED', 'ARCHITECTURALLY_ACCEPTABLE', 'NOT_EVALUATED'].includes(closeout.review)
    || evidence.buildingId !== building.id
    || evidence.buildingVersion !== building.version
    || closeout.buildingIdentity !== architecturalIdentity(building)
    || closeout.programIdentity !== architecturalIdentity(program)) return 'NOT_EVALUATED';
  return closeout.review;
}
