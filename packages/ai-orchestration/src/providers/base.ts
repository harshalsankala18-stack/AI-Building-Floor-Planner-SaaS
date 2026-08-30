/**
 * Base AI Provider Contracts & Untrusted Output Safety.
 */

import type { AIProvider, AIRequest, AIResponse, AIChunk, ModelInfo } from '@ai-floor-planner/core';

export abstract class BaseAIProvider implements AIProvider {
  abstract readonly name: string;
  abstract complete(request: AIRequest): Promise<AIResponse>;
  abstract stream(request: AIRequest): AsyncIterable<AIChunk>;
  abstract isAvailable(): Promise<boolean>;
  abstract getModelInfo(): ModelInfo;
}

export class AISafetyError extends Error {
  constructor(message: string, public readonly rawOutput?: string) {
    super(`[AISafetyError] ${message}`);
    this.name = 'AISafetyError';
  }
}
