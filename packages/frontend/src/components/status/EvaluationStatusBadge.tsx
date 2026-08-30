import { AlertTriangle, Ban, Check, CircleHelp, Minus, ShieldX } from 'lucide-react';
import { EvaluationStatus } from '@ai-floor-planner/constraint-engine';

const LABELS: Record<EvaluationStatus, string> = {
  [EvaluationStatus.PASS]: 'Pass',
  [EvaluationStatus.FAIL]: 'Fail',
  [EvaluationStatus.WARNING]: 'Warning',
  [EvaluationStatus.NOT_APPLICABLE]: 'Not applicable',
  [EvaluationStatus.NOT_ANALYZED]: 'Not analyzed',
  [EvaluationStatus.NOT_CHECKED]: 'Not checked',
  [EvaluationStatus.INSUFFICIENT_INPUT]: 'Insufficient input',
  [EvaluationStatus.NOT_IMPLEMENTED]: 'Not implemented',
};

function StatusIcon({ status }: { status: EvaluationStatus }) {
  if (status === EvaluationStatus.PASS) return <Check size={11} />;
  if (status === EvaluationStatus.FAIL) return <ShieldX size={11} />;
  if (status === EvaluationStatus.WARNING || status === EvaluationStatus.INSUFFICIENT_INPUT) {
    return <AlertTriangle size={11} />;
  }
  if (status === EvaluationStatus.NOT_IMPLEMENTED) return <Ban size={11} />;
  if (status === EvaluationStatus.NOT_APPLICABLE) return <Minus size={11} />;
  return <CircleHelp size={11} />;
}

export function EvaluationStatusBadge({
  status,
  explanation,
}: {
  status: EvaluationStatus;
  explanation?: string;
}) {
  return (
    <span
      className={`evaluation-status evaluation-status-${status.toLowerCase().replace(/_/g, '-')}`}
      title={explanation}
      aria-label={explanation ? `${LABELS[status]}: ${explanation}` : LABELS[status]}
    >
      <StatusIcon status={status} />
      {LABELS[status]}
    </span>
  );
}
