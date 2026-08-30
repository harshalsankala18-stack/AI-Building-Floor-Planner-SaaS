import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  RotateCw,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import { ConstraintSeverity, EvaluationStatus } from '@ai-floor-planner/constraint-engine';
import type { EditorContextValue } from '../../stores/editor-store';
import {
  filterValidationIssues,
  getQualityLabel,
  getValidationCategories,
  type ValidationFilter,
} from './validation-view-model';
import { EvaluationStatusBadge } from '../status/EvaluationStatusBadge';

interface ValidationPanelProps {
  editor: EditorContextValue;
}

function ScoreRing({ score }: { score: number }) {
  const normalized = Math.max(0, Math.min(100, score));
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - normalized / 100);

  return (
    <div className="quality-score-ring" aria-label={`Plan quality score ${score} out of 100`}>
      <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="quality-ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent-cyan)" />
            <stop offset="100%" stopColor="var(--accent-violet)" />
          </linearGradient>
        </defs>
        <circle className="quality-score-track" cx="60" cy="60" r={radius} />
        <circle
          className="quality-score-progress"
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="quality-score-value">
        <strong>{Math.round(score)}</strong>
        <span>/ 100</span>
      </div>
    </div>
  );
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ editor }) => {
  const [filter, setFilter] = useState<ValidationFilter>('all');
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const { validationSummary } = editor;
  const hasPlanEvidence = editor.building.floors.some(floor => floor.rooms.length > 0);
  const categories = useMemo(
    () => getValidationCategories(validationSummary),
    [validationSummary],
  );
  const visibleIssues = useMemo(
    () => filterValidationIssues(validationSummary.violations, filter),
    [filter, validationSummary.violations],
  );

  const focusAffectedEntity = (entityIds: readonly string[]) => {
    for (const id of entityIds) {
      if (editor.activeFloor.rooms.some(room => room.id === id)) {
        editor.selectEntity('room', id, editor.activeFloor.id);
        return;
      }
      if (editor.activeFloor.doors.some(door => door.id === id)) {
        editor.selectEntity('door', id, editor.activeFloor.id);
        return;
      }
      if (editor.activeFloor.windows.some(window => window.id === id)) {
        editor.selectEntity('window', id, editor.activeFloor.id);
        return;
      }
    }
  };

  return (
    <div className="quality-panel">
      <section className="quality-hero">
        <div className="quality-hero-copy">
          <span className="eyebrow"><Sparkles size={12} /> Live plan intelligence</span>
          <h2>{hasPlanEvidence ? getQualityLabel(validationSummary.overallScore) : 'Insufficient input'}</h2>
          <p>
            {!hasPlanEvidence
              ? 'Add rooms to the draft before interpreting plan-level quality.'
              : validationSummary.isValid
              ? 'Every mandatory planning rule passes. Refine the softer signals to elevate the plan.'
              : `${validationSummary.failed} mandatory ${validationSummary.failed === 1 ? 'rule needs' : 'rules need'} attention before export.`}
          </p>
          <button className="revalidate-button" onClick={editor.revalidate}>
            <RotateCw size={13} /> Re-run checks
          </button>
        </div>
        {hasPlanEvidence
          ? <ScoreRing score={validationSummary.overallScore} />
          : (
            <div className="quality-score-unavailable">
              <EvaluationStatusBadge
                status={EvaluationStatus.INSUFFICIENT_INPUT}
                explanation="No rooms are available for plan-level quality evaluation."
              />
            </div>
          )}
      </section>

      <section className="quality-stat-grid" aria-label="Validation summary">
        <div className="quality-stat">
          <span className="quality-stat-icon success"><ShieldCheck size={15} /></span>
          <strong>{hasPlanEvidence ? validationSummary.passed : '—'}</strong>
          <small>{hasPlanEvidence ? 'Checks passed' : 'Plan checks'}</small>
        </div>
        <div className="quality-stat">
          <span className={`quality-stat-icon ${validationSummary.failed ? 'danger' : 'success'}`}>
            {validationSummary.failed ? <AlertTriangle size={15} /> : <Check size={15} />}
          </span>
          <strong>{validationSummary.failed}</strong>
          <small>Hard issues</small>
        </div>
        <div className="quality-stat">
          <span className="quality-stat-icon neutral"><WandSparkles size={15} /></span>
          <strong>{validationSummary.suggestions.length}</strong>
          <small>Repairs ready</small>
        </div>
      </section>

      <section className="quality-section">
        <div className="quality-section-heading">
          <div>
            <span className="eyebrow">Performance map</span>
            <h3>Applicable quality evidence</h3>
          </div>
          <span className="live-indicator"><span /> Live</span>
        </div>

        <div className="category-score-list">
          {categories.map(category => (
            <div className="category-score" key={category.id}>
              <div className="category-score-meta">
                <span>
                  {category.label}
                  <small>{category.classification.replace(/_/g, ' ')}</small>
                </span>
                {category.score === null
                  ? <EvaluationStatusBadge status={category.status} explanation={category.explanation} />
                  : <strong>{Math.round(category.score)}</strong>}
              </div>
              {category.score !== null && (
                <div
                  className="category-score-track"
                  role="progressbar"
                  aria-label={`${category.label} score`}
                  aria-valuenow={category.score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span
                    className={category.score < 60 ? 'needs-work' : ''}
                    style={{ width: `${category.score}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="quality-section issue-section">
        <div className="quality-section-heading">
          <div>
            <span className="eyebrow">Constraint navigator</span>
            <h3>Issues & guidance</h3>
          </div>
          <span className="issue-count">{validationSummary.violations.length}</span>
        </div>

        <div className="issue-filters" role="group" aria-label="Filter validation issues">
          {(['all', 'critical', 'advisory'] as const).map(item => (
            <button
              key={item}
              className={filter === item ? 'active' : ''}
              aria-pressed={filter === item}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="validation-issue-list">
          {visibleIssues.length === 0 && (
            <div className="quality-empty-state">
              <span><CheckCircle2 size={20} /></span>
              <strong>No issues in this view</strong>
              <p>The plan is clear for the selected validation level.</p>
            </div>
          )}

          {visibleIssues.map((issue, index) => {
            const issueKey = `${issue.constraintId}-${index}`;
            const isHard = issue.severity === ConstraintSeverity.HARD;
            const isExpanded = expandedIssueId === issueKey;
            return (
              <article
                key={issueKey}
                className={`validation-issue-card ${isHard ? 'critical' : 'advisory'} ${isExpanded ? 'expanded' : ''}`}
              >
                <button
                  className="validation-issue-summary"
                  onClick={() => setExpandedIssueId(isExpanded ? null : issueKey)}
                  aria-expanded={isExpanded}
                >
                  <span className="issue-severity-icon">
                    {isHard ? <AlertTriangle size={15} /> : <Sparkles size={15} />}
                  </span>
                  <span className="issue-summary-copy">
                    <small>{issue.constraintId} • {issue.severity}</small>
                    <strong>{issue.message}</strong>
                  </span>
                  <ChevronRight size={15} className="issue-chevron" />
                </button>

                {isExpanded && (
                  <div className="validation-issue-detail">
                    <p>{issue.explanation}</p>
                    {issue.affectedEntities.length > 0 && (
                      <button onClick={() => focusAffectedEntity(issue.affectedEntities)}>
                        Show affected element <ArrowUpRight size={13} />
                      </button>
                    )}
                    {issue.suggestedFixes?.map((fix, fixIndex) => (
                      <div className="repair-callout" key={`${fix.description}-${fixIndex}`}>
                        <WandSparkles size={14} />
                        <span><strong>Recommended repair</strong>{fix.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <footer className="quality-panel-footer">
        <span>Validated {new Date(validationSummary.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <span>{validationSummary.durationMs.toFixed(1)} ms</span>
      </footer>
    </div>
  );
};
