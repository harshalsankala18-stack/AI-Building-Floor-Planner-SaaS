/**
 * @ai-floor-planner/ai-orchestration
 *
 * AI Provider Abstraction, Untrusted Output Safety, and Natural Language
 * Requirement Parsing Layer.
 */

export { BaseAIProvider, AISafetyError } from './providers/base';
export { OpenAIProvider, type OpenAIProviderOptions } from './providers/openai';
export { GeminiProvider, type GeminiProviderOptions } from './providers/gemini';
export { RuleBasedRequirementParser } from './providers/rule-based';
export {
  AIOrchestrationService,
  type AIOrchestrationOptions,
  type RequirementParseDiagnostic,
  type RequirementParseResult,
  type RequirementParseSource,
} from './orchestration/service';
export { REQUIREMENT_EXTRACTION_PROMPT, REQUIREMENT_RESPONSE_SCHEMA } from './requirements/schema';
export { validateRequirementPayload, type RequirementPayloadValidation } from './requirements/validation';
export { extractAIEditContext } from './editing/context';
export { RuleBasedEditParser, type LocalEditParseOptions, type LocalEditParseResult } from './editing/parser';
export { AI_EDIT_RESPONSE_SCHEMA, AI_EDIT_SYSTEM_PROMPT } from './editing/schema';
export { validateAIEditPayload } from './editing/validation';
export { resolveRoomTarget, type RoomTargetResolution } from './editing/target-resolver';
export { AIEditCommand } from './editing/command';
export { AIEditPlanner } from './editing/planner';
export type {
  AIEditAction,
  AIEditDirection,
  AIEditDiagnostic,
  AIEditIntent,
  AIEditModelContext,
  AIEditParseResult,
  AIEditParseSource,
  AIEditPlannerOptions,
  AIEditPreview,
  AIEditRoomSummary,
} from './editing/types';
