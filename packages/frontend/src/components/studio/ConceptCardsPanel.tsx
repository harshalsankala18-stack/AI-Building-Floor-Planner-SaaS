/**
 * Two-phase upgrade — the four controlled apartment concepts, side by side.
 *
 * Every card shows its strategy, deterministic seed, the schematic that was sent
 * to FLUX, the FLUX image, the preflight result and the score state. Rejected
 * cards show their reasons and "Not scored" (never 0/100). Nothing is applied
 * automatically: the user chooses a valid plan.
 */
import React from 'react';
import { ADVISORY_EVALUATION_NOTICE, type ConceptCardView } from '../../services/two-ai-candidates';

const STATUS_STYLE: Record<ConceptCardView['status'], { border: string; badgeBg: string; badgeFg: string; label: string }> = {
  VALID: { border: '#86EFAC', badgeBg: '#DCFCE7', badgeFg: '#166534', label: 'Hard-valid plan' },
  REJECTED: { border: '#FCA5A5', badgeBg: '#FEE2E2', badgeFg: '#991B1B', label: 'Rejected' },
  GENERATION_FAILED: { border: '#CBD5E1', badgeBg: '#F1F5F9', badgeFg: '#475569', label: 'No image' },
};

export const ConceptCardsPanel: React.FC<{
  readonly cards: readonly ConceptCardView[];
  readonly onApply: (candidateId: string) => void;
}> = ({ cards, onApply }) => {
  if (cards.length === 0) return null;
  const anyScored = cards.some(c => c.score.kind === 'SCORED');
  return (
    <section aria-labelledby="concept-cards-heading" style={{ margin: '0 0 16px' }}>
      <h3 id="concept-cards-heading" style={{ margin: '0 0 4px', fontSize: 14, color: '#0F172A' }}>
        {cards.length} controlled apartment concepts
      </h3>
      <p style={{ margin: '0 0 10px', fontSize: 12, color: '#475569' }}>
        Same flats, unit mix, bedrooms, lifts, stairs and areas in every concept; only the organisation strategy differs.
        You choose which valid plan to apply.
      </p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {cards.map(card => {
          const st = STATUS_STYLE[card.status];
          const scoreColor = card.score.kind === 'SCORED' ? '#166534' : card.score.kind === 'REJECTED' ? '#991B1B' : '#475569';
          return (
            <li
              key={card.candidateNumber}
              style={{ border: `1px solid ${st.border}`, borderRadius: 8, padding: 10, background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 6 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <strong style={{ fontSize: 13, color: '#0F172A' }}>{card.title}</strong>
                <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 10, background: st.badgeBg, color: st.badgeFg, whiteSpace: 'nowrap' }}>
                  {st.label}
                </span>
              </div>
              {card.intent && <span style={{ fontSize: 11, color: '#475569' }}>{card.intent}</span>}
              <span style={{ fontSize: 11, color: '#64748B' }}>
                Seed {card.seed}
                {card.referenceIds.length > 0 ? ` · references: ${card.referenceIds.join(', ')}` : ''}
                {card.distinctReferencesAvailable !== null ? ` (${card.distinctReferencesAvailable} distinct available)` : ''}
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <figure style={{ margin: 0 }}>
                  {card.schematicDataUrl ? (
                    <img src={card.schematicDataUrl} alt={`${card.title}: deterministic schematic sent to FLUX`} style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 4 }} />
                  ) : (
                    <div style={{ height: 110, border: '1px dashed #CBD5E1', borderRadius: 4 }} />
                  )}
                  <figcaption style={{ fontSize: 10, color: '#64748B' }}>Deterministic layout (input image 1)</figcaption>
                </figure>
                <figure style={{ margin: 0 }}>
                  {card.imageDataUrl ? (
                    <img src={card.imageDataUrl} alt={`${card.title}: ${card.imageModelLabel ?? 'AI'} concept image`} style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 4 }} />
                  ) : (
                    <div role="img" aria-label="No AI concept image" style={{ height: 110, border: '1px dashed #CBD5E1', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#94A3B8' }}>
                      No image
                    </div>
                  )}
                  <figcaption style={{ fontSize: 10, color: '#64748B' }}>{card.imageModelLabel ? `${card.imageModelLabel} concept` : 'AI concept'}</figcaption>
                </figure>
              </div>
              <span style={{ fontSize: 12, color: '#334155' }}>{card.preflightLabel}</span>
              {card.layoutChecksLabel && <span style={{ fontSize: 11, color: '#64748B' }}>{card.layoutChecksLabel}</span>}
              <strong style={{ fontSize: 12, color: scoreColor }}>{card.score.label}</strong>
              {card.reasons.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#7F1D1D' }}>
                  {card.reasons.slice(0, 4).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                  {card.reasons.length > 4 && <li>{card.reasons.length - 4} more reason(s)</li>}
                </ul>
              )}
              {card.canApply && card.candidateId && (
                <button
                  type="button"
                  className="studio-btn-action primary"
                  onClick={() => onApply(card.candidateId!)}
                  aria-label={`Apply ${card.title} to the project`}
                >
                  Apply this plan
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {anyScored && <p style={{ margin: '8px 0 0', fontSize: 11, color: '#64748B' }}>{ADVISORY_EVALUATION_NOTICE}</p>}
    </section>
  );
};
