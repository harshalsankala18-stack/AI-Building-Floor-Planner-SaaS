import type { AIEditIntent } from './types';

type UnknownRecord = Record<string, unknown>;
const ACTIONS = new Set(['resize_room', 'move_room', 'rename_room']);
const DIRECTIONS = new Set(['north', 'south', 'east', 'west', 'auto']);

function record(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function optionalNumber(value: unknown, min: number, max: number): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max && value !== 0
    ? value
    : undefined;
}

export function validateAIEditPayload(payload: unknown): { intent: AIEditIntent | null; errors: readonly string[] } {
  const source = record(payload);
  if (!source) return { intent: null, errors: ['Edit response must be an object.'] };
  const errors: string[] = [];
  if (typeof source.action !== 'string' || !ACTIONS.has(source.action)) errors.push('action is unsupported.');
  if (typeof source.targetQuery !== 'string' || !source.targetQuery.trim()) errors.push('targetQuery is required.');
  if (typeof source.direction !== 'string' || !DIRECTIONS.has(source.direction)) errors.push('direction is invalid.');
  if (typeof source.reasoning !== 'string') errors.push('reasoning is required.');
  if (errors.length) return { intent: null, errors };

  const action = source.action as AIEditIntent['action'];
  const intent: AIEditIntent = {
    action,
    targetQuery: (source.targetQuery as string).trim(),
    direction: source.direction as AIEditIntent['direction'],
    ...(optionalNumber(source.distanceMm, 0, 50000) !== undefined ? { distanceMm: optionalNumber(source.distanceMm, 0, 50000) } : {}),
    ...(optionalNumber(source.widthMm, 0, 100000) !== undefined ? { widthMm: optionalNumber(source.widthMm, 0, 100000) } : {}),
    ...(optionalNumber(source.heightMm, 0, 100000) !== undefined ? { heightMm: optionalNumber(source.heightMm, 0, 100000) } : {}),
    ...(optionalNumber(source.scalePercent, -80, 200) !== undefined ? { scalePercent: optionalNumber(source.scalePercent, -80, 200) } : {}),
    ...(optionalNumber(source.dimensionDeltaMm, -10000, 10000) !== undefined ? { dimensionDeltaMm: optionalNumber(source.dimensionDeltaMm, -10000, 10000) } : {}),
    ...(typeof source.newName === 'string' && source.newName.trim() ? { newName: source.newName.trim().slice(0, 80) } : {}),
    reasoning: (source.reasoning as string).trim() || 'Parsed provider edit intent.',
  };

  if (action === 'resize_room' && intent.widthMm === undefined && intent.heightMm === undefined
    && intent.scalePercent === undefined && intent.dimensionDeltaMm === undefined) {
    errors.push('Resize intent requires dimensions, a percentage, or a dimension delta.');
  }
  if (action === 'rename_room' && !intent.newName) errors.push('Rename intent requires newName.');
  return { intent: errors.length ? null : intent, errors };
}
