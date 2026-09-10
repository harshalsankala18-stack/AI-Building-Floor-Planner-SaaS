import React from 'react';
import { architecturalReviewState, type CandidatePlan, type RoomProgram } from '@ai-floor-planner/core';

/** Shared by both candidate entry points; old saved results never imply a pass. */
export function ArchitecturalEvidencePanel({ candidate, program }: { candidate: CandidatePlan; program?: RoomProgram }): React.ReactElement {
  const evidence = candidate.architecturalEvidence;
  const review = architecturalReviewState(evidence, candidate.building, program);
  if (!evidence || review === 'NOT_EVALUATED') {
    return <div><p role="status">Architectural checks not evaluated for this Building and reviewed Program. Regenerate to obtain current evidence.</p>
      <p>Automated architectural acceptance is not professional approval.</p></div>;
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
    <p role="status"><strong>{review === 'DRAFT' ? 'Draft' : review === 'REVIEW_REQUIRED'
      ? 'Architectural review required' : 'Architecturally acceptable — current automated scope only'}</strong></p>
    <p>Automated architectural acceptance is not professional approval. No code compliance, construction readiness or structural safety is established.</p>
    <dl>
      <div><dt>Required floor placements</dt><dd>{evidence.requiredFloors.length ? `${required}/${evidence.requiredFloors.length}` : 'None specified'}</dd></div>
      <div><dt>Owned baths with direct doors</dt><dd>{evidence.suites.length ? `${direct}/${evidence.suites.length}` : 'None explicitly specified'}</dd></div>
      <div><dt>Owned baths with private direct access</dt><dd>{evidence.suites.length ? `${privateDirect}/${evidence.suites.length}` : 'Not applicable'}</dd></div>
      <div><dt>Owned baths with private indirect access</dt><dd>{evidence.suites.length ? `${privateIndirect}/${evidence.suites.length}` : 'Not applicable'}</dd></div>
      <div><dt>Upper wet-room footprint coverage</dt><dd>{evidence.wetStacking.coveragePercent === null
        ? evidence.wetStacking.status.replaceAll('_', ' ') : `${evidence.wetStacking.coveragePercent}% across ${evidence.wetStacking.rooms.length} rooms`}</dd></div>
    </dl>
    <details><summary>Kitchen/service, privacy/circulation and exposure</summary>
      <ul>
        {evidence.closeout?.blockers.map(reason => <li key={reason}>{reason}</li>)}
        {evidence.closeout?.kitchenService.map((item, index) => <li key={`service-${index}`}>{item.relationship}: {item.status.replaceAll('_', ' ')}; {item.pathDoorIds.length} door transitions.</li>)}
        {evidence.closeout?.circulation.map(item => <li key={`path-${item.roomId}`}>{candidate.building.floors.flatMap(floor => floor.rooms).find(room => room.id === item.roomId)?.name}: {item.status.replaceAll('_', ' ')}; {item.pathDoorIds.length} door transitions.</li>)}
        {evidence.closeout?.exposure.map(item => <li key={`exposure-${item.roomId}`}>{candidate.building.floors.flatMap(floor => floor.rooms).find(room => room.id === item.roomId)?.name}: {item.status.replaceAll('_', ' ')} — boundary contact only, not daylight/ventilation compliance.</li>)}
        <li>{evidence.closeout?.transitionRoomIds.length ?? 0} typed functional transition/core spaces; unclassified residual is not automatically waste. Unmodeled void, semi-open and site/service reservations remain unclassified.</li>
      </ul>
    </details>
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
