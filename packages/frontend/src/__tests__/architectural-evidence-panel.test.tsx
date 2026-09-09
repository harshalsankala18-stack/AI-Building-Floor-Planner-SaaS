import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CandidatePlan, ArchitecturalEvidence } from '@ai-floor-planner/core';
import { createBuilding } from '@ai-floor-planner/core';
import { ArchitecturalEvidencePanel } from '../components/generation/ArchitecturalEvidencePanel';

const building = createBuilding({ projectId: 'panel', name: 'Panel', site: { plotWidth: 10000, plotDepth: 10000 } });
function render(evidence?: ArchitecturalEvidence) {
  return renderToStaticMarkup(createElement(ArchitecturalEvidencePanel, {
    candidate: { building, architecturalEvidence: evidence } as CandidatePlan,
  }));
}
const evidence: ArchitecturalEvidence = {
  schemaVersion: 1, buildingId: building.id, buildingVersion: building.version, status: 'REVIEW_REQUIRED',
  requiredFloors: [], suites: [], wetStacking: { coveragePercent: null, status: 'NOT_APPLICABLE', rooms: [] }, openSpace: [], limitations: [],
};
describe('architectural evidence display', () => {
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
    const html = render({ ...evidence, status: 'CHECKED_REQUIREMENTS_MET' });
    expect(html).toContain('limited scope');
    expect(html).toContain('do not change candidate ranking or certify the design');
  });
});
