export const AI_EDIT_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    action: { type: 'string', enum: ['resize_room', 'move_room', 'rename_room'] },
    targetQuery: { type: 'string' },
    direction: { type: 'string', enum: ['north', 'south', 'east', 'west', 'auto'] },
    distanceMm: { type: 'number', minimum: 0, maximum: 50000 },
    widthMm: { type: 'number', minimum: 0, maximum: 100000 },
    heightMm: { type: 'number', minimum: 0, maximum: 100000 },
    scalePercent: { type: 'number', minimum: -80, maximum: 200 },
    dimensionDeltaMm: { type: 'number', minimum: -10000, maximum: 10000 },
    newName: { type: 'string' },
    reasoning: { type: 'string' },
  },
  required: [
    'action', 'targetQuery', 'direction', 'distanceMm', 'widthMm',
    'heightMm', 'scalePercent', 'dimensionDeltaMm', 'newName', 'reasoning',
  ],
} as const;

export const AI_EDIT_SYSTEM_PROMPT = `Convert one floor-plan editing instruction into one safe structured intent.
Use room names or room types from the supplied model context as targetQuery.
Supported actions are resize_room, move_room, and rename_room only.
Use millimetres. Use zero or an empty string for unused fields.
For an unspecified move destination, use direction "auto".
Never claim that the edit is valid; deterministic geometry and constraint engines decide that.`;
