import React from 'react';
import type { CandidatePlan } from '@ai-floor-planner/core';

/** Shared by both candidate entry points; old saved results never imply a pass. */
export function ArchitecturalEvidencePanel({ candidate }: { candidate: CandidatePlan }): React.ReactElement {
  const evidence = candidate.architecturalEvidence;
  if (!evidence || evidence.schemaVersion !== 1 || evidence.accessEvidenceVersion !== 1 || evidence.buildingId !== candidate.building.id
    || evidence.buildingVersion !== candidate.building.version) {
    return <p role="status">Architectural checks not evaluated for this revision. Regenerate to obtain current evidence.</p>;
  }
  const direct = evidence.suites.filter(suite => suite.directDoorIds.length > 0).length;
  const privateDirect = evidence.suites.filter(suite => suite.access?.status === 'PRIVATE_DIRECT').length;
  const privateIndirect = evidence.suites.filter(suite => suite.access?.status === 'PRIVATE_INDIRECT').length;
  const accessLabel = (suite: typeof evidence.suites[number]) => {
    switch (suite.access?.status) {
      case 'PRIVATE_DIRECT': return 'Private direct';
      case 'PRIVATE_INDIRECT': return suite.access.viaRoles.every(role => role === 'dressing')
        ? 'Private via dressing' : 'Private via reviewed access space';
      case 'SHARED': return 'Shared access';
      case 'UNRESOLVED': return 'Access unresolved';
      default: return 'Not evaluated';
    }
  };
  const required = evidence.requiredFloors.filter(item => item.passed).length;
  return <section aria-label="Architectural acceptance evidence">
    <p role="status"><strong>{evidence.status === 'REVIEW_REQUIRED'
      ? 'Architectural review required' : 'Checked requirements met — limited scope'}</strong></p>
    <dl>
      <div><dt>Required floor placements</dt><dd>{evidence.requiredFloors.length ? `${required}/${evidence.requiredFloors.length}` : 'None specified'}</dd></div>
      <div><dt>Owned baths with direct doors</dt><dd>{evidence.suites.length ? `${direct}/${evidence.suites.length}` : 'None explicitly specified'}</dd></div>
      <div><dt>Owned baths with private direct access</dt><dd>{evidence.suites.length ? `${privateDirect}/${evidence.suites.length}` : 'Not applicable'}</dd></div>
      <div><dt>Owned baths with private indirect access</dt><dd>{evidence.suites.length ? `${privateIndirect}/${evidence.suites.length}` : 'Not applicable'}</dd></div>
      <div><dt>Upper wet-room footprint coverage</dt><dd>{evidence.wetStacking.coveragePercent === null
        ? evidence.wetStacking.status.replaceAll('_', ' ') : `${evidence.wetStacking.coveragePercent}% across ${evidence.wetStacking.rooms.length} rooms`}</dd></div>
    </dl>
    <details><summary>Inspect checks and limits</summary>
      <ul>
        {evidence.requiredFloors.map(item => <li key={item.programItemId}>{item.name}: required level {item.requiredLevel}; observed {item.actualLevels.join(', ') || 'missing'} — {item.passed ? 'met' : 'review required'}.</li>)}
        {evidence.suites.map(suite => <li key={suite.bathroomProgramItemId}>{suite.name}: {accessLabel(suite)}; {suite.sameFloor ? 'same floor as owner' : 'owner/bath missing, ambiguous or on different floors'}. {suite.access?.reason}</li>)}
        {evidence.unownedBathrooms?.map(bath => <li key={bath.programItemId}>{bath.name}: {bath.ownership === 'COMMON_ACCESS'
          ? 'Common access — no private owner required' : 'Ownership ambiguous — no owner inferred'}.</li>)}
        {evidence.openSpace.map(space => <li key={space.floorId}>{candidate.building.floors.find(floor => floor.id === space.floorId)?.name ?? space.floorId}: {(space.explicitOutdoorAreaMm2 / 1e6).toFixed(1)} m² explicit outdoor space; {space.residualUnclassifiedAreaMm2 === null ? 'unmeasured' : `${(space.residualUnclassifiedAreaMm2 / 1e6).toFixed(1)} m²`} residual unclassified area.</li>)}
        {evidence.limitations.map(limit => <li key={limit}>{limit}</li>)}
      </ul>
    </details>
    <p>Concept review only. These observations do not change candidate ranking or certify the design.</p>
  </section>;
}
