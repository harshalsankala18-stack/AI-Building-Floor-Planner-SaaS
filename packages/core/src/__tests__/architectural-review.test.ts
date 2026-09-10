import { describe, expect, it } from 'vitest';
import { architecturalIdentity, architecturalReviewState, createBuilding,
  type ArchitecturalEvidence, type RoomProgram } from '../index';

const building = createBuilding({ projectId: 'freshness', name: 'Freshness', site: { plotWidth: 9000, plotDepth: 6000 } });
const program: RoomProgram = { items: [], totalTargetAreaMm2: 0, totalMinAreaMm2: 0, totalMaxAreaMm2: 0 };
const evidence: ArchitecturalEvidence = {
  schemaVersion: 1, accessEvidenceVersion: 1, buildingId: building.id, buildingVersion: building.version,
  status: 'CHECKED_REQUIREMENTS_MET', requiredFloors: [], suites: [], openSpace: [], limitations: [],
  wetStacking: { status: 'NOT_APPLICABLE', coveragePercent: null, rooms: [] },
  closeout: { version: 1, buildingIdentity: architecturalIdentity(building), programIdentity: architecturalIdentity(program),
    review: 'ARCHITECTURALLY_ACCEPTABLE', blockers: [], kitchenService: [], circulation: [], exposure: [], transitionRoomIds: [] },
};
describe('architectural evidence freshness', () => {
  it('is stable through JSON persistence and object key ordering', () => {
    expect(architecturalIdentity({ b: 2, a: 1 })).toBe(architecturalIdentity({ a: 1, b: 2 }));
    expect(architecturalReviewState(JSON.parse(JSON.stringify(evidence)), building, program)).toBe('ARCHITECTURALLY_ACCEPTABLE');
  });
  it('invalidates same-version Building edits', () => {
    expect(architecturalReviewState(evidence, { ...building, site: { ...building.site, plotWidth: 8000 } }, program)).toBe('NOT_EVALUATED');
  });
  it('invalidates reviewed access intent edits', () => {
    expect(architecturalReviewState(evidence, building, { ...program,
      reviewedAccessSpaces: [{ programItemId: 'd', ownerProgramItemId: 'owner', role: 'dressing' }] })).toBe('NOT_EVALUATED');
  });
  it('does not accept legacy or missing intent', () => {
    expect(architecturalReviewState({ ...evidence, closeout: undefined }, building, program)).toBe('NOT_EVALUATED');
    expect(architecturalReviewState(evidence, building, undefined)).toBe('NOT_EVALUATED');
  });
});
