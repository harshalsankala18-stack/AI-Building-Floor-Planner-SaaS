import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CandidatePlan, ArchitecturalEvidence } from '@ai-floor-planner/core';
import { createBuilding, architecturalIdentity, type RoomProgram } from '@ai-floor-planner/core';
import { ArchitecturalEvidencePanel } from '../components/generation/ArchitecturalEvidencePanel';

const building = createBuilding({ projectId: 'panel', name: 'Panel', site: { plotWidth: 10000, plotDepth: 10000 } });
const program: RoomProgram = { items: [], totalTargetAreaMm2: 0, totalMinAreaMm2: 0, totalMaxAreaMm2: 0 };
function render(evidence?: ArchitecturalEvidence, intent = program) {
  return renderToStaticMarkup(createElement(ArchitecturalEvidencePanel, {
    candidate: { building, architecturalEvidence: evidence } as CandidatePlan,
    program: intent,
  }));
}
const evidence: ArchitecturalEvidence = {
  closeout: { version: 1, buildingIdentity: architecturalIdentity(building), programIdentity: architecturalIdentity(program),
    review: 'REVIEW_REQUIRED', blockers: [], kitchenService: [], circulation: [], exposure: [], transitionRoomIds: [] },
  schemaVersion: 1, accessEvidenceVersion: 1, buildingId: building.id, buildingVersion: building.version, status: 'REVIEW_REQUIRED',
  requiredFloors: [], suites: [], wetStacking: { coveragePercent: null, status: 'NOT_APPLICABLE', rooms: [] }, openSpace: [], limitations: [],
};
describe('architectural evidence display', () => {
  it('does not reinterpret Phase 1A or unknown-version saves as access-path evidence', () => {
    expect(render({ ...evidence, accessEvidenceVersion: undefined })).toContain('not evaluated');
    expect(render({ ...evidence, accessEvidenceVersion: 99 } as unknown as ArchitecturalEvidence)).toContain('not evaluated');
    expect(render({ ...evidence, schemaVersion: 99 } as unknown as ArchitecturalEvidence)).toContain('not evaluated');
  });
  it.each([
    ['PRIVATE_DIRECT', 'Private direct'], ['PRIVATE_INDIRECT', 'Private via dressing'],
    ['SHARED', 'Shared access'], ['UNRESOLVED', 'Access unresolved'], ['NOT_EVALUATED', 'Not evaluated'],
  ] as const)('displays %s honestly', (status, label) => {
    const html = render({ ...evidence, suites: [{ bathroomProgramItemId: 'bath', ownerProgramItemId: 'owner',
      name: 'Suite Bath', bathroomId: 'b', ownerId: 'o', sameFloor: true, directDoorIds: [], otherAccessRoomIds: [],
      status: 'REVIEW_REQUIRED', access: { status, pathRoomIds: [], pathDoorIds: [], viaRoles: ['dressing'], sharedEntryRoomIds: [], reason: 'Observed only.' } }] });
    expect(html).toContain(label);
    expect(html).toContain('Concept review only');
  });
  it('does not treat a common bathroom as a missing private suite', () => {
    expect(render({ ...evidence, unownedBathrooms: [{ programItemId: 'common', name: 'Common bath', bathroomId: 'c',
      ownership: 'COMMON_ACCESS', physicalDoorIds: ['d'] }] })).toContain('no private owner required');
  });
  it('does not imply approval for old persisted candidates', () => {
    expect(render()).toContain('not evaluated');
    expect(render()).not.toContain('requirements met');
  });
  it('rejects evidence from another revision or building', () => {
    expect(render({ ...evidence, buildingVersion: building.version + 1 })).toContain('not evaluated');
    expect(render({ ...evidence, buildingId: 'different' })).toContain('not evaluated');
  });
  it('shows review status and does not turn absent wet evidence into 100 percent', () => {
    const html = render(evidence);
    expect(html).toContain('Architectural review required');
    expect(html).toContain('NOT APPLICABLE');
    expect(html).not.toContain('100%');
  });
  it('scopes successful observations instead of claiming design approval', () => {
    const html = render({ ...evidence, closeout: { ...evidence.closeout!, review: 'ARCHITECTURALLY_ACCEPTABLE' } });
    expect(html).toContain('current automated scope only');
    expect(html).toContain('Automated architectural acceptance is not professional approval');
    expect(html).toContain('do not change candidate ranking or certify the design');
  });
  it('invalidates changed Program and legacy closeout identity', () => {
    expect(render(evidence, { ...program, totalTargetAreaMm2: 1 })).toContain('not evaluated');
    expect(render({ ...evidence, closeout: undefined })).toContain('not evaluated');
  });
});
