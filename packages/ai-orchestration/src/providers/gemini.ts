import type { AIChunk, AIRequest, AIResponse, ModelInfo } from '@ai-floor-planner/core';
import { AITaskType } from '@ai-floor-planner/core';
import { BaseAIProvider, AISafetyError } from './base';
import { REQUIREMENT_RESPONSE_SCHEMA } from '../requirements/schema';
import { asRecord, parseJsonContent, postJson, response, usage, type ProviderFetch } from './http';

export interface GeminiProviderOptions {
  readonly apiKey: string;
  readonly model?: string;
  readonly endpointBase?: string;
  readonly timeoutMs?: number;
  readonly fetchImplementation?: ProviderFetch;
}

export class GeminiProvider extends BaseAIProvider {
  readonly name = 'gemini';
  private readonly options;

  constructor(options: GeminiProviderOptions) {
    super();
    const model = options.model ?? 'gemini-2.5-flash';
    const endpointBase = options.endpointBase ?? 'https://generativelanguage.googleapis.com/v1beta/models';
    this.options = {
      apiKey: options.apiKey,
      model,
      endpoint: `${endpointBase}/${encodeURIComponent(model)}:generateContent`,
      timeoutMs: options.timeoutMs ?? 15000,
      fetchImplementation: options.fetchImplementation ?? fetch,
    };
  }

  async complete(request: AIRequest): Promise<AIResponse> {
    if (!this.options.apiKey.trim()) throw new Error('Gemini API key is not configured.');
    const wantsJson = request.responseFormat === 'json';
    const extractsRequirements = request.taskType === AITaskType.RequirementExtraction;
    const responseSchema = request.responseSchema ?? (extractsRequirements ? REQUIREMENT_RESPONSE_SCHEMA : undefined);
    const payload = {
      systemInstruction: { parts: [{ text: request.systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: request.userPrompt }] }],
      generationConfig: {
        ...(request.maxTokens ? { maxOutputTokens: request.maxTokens } : {}),
        ...(wantsJson ? {
          responseMimeType: 'application/json',
          ...(responseSchema ? { responseSchema } : {}),
        } : {}),
      },
    };
    const result = await postJson(this.options, { 'x-goog-api-key': this.options.apiKey }, payload);
    const content = this.extractOutputText(result.body);
    const parsed = wantsJson ? parseJsonContent(content) : undefined;
    const rawUsage = asRecord(result.body.usageMetadata);
    return response(
      content,
      parsed,
      usage(rawUsage.promptTokenCount, rawUsage.candidatesTokenCount, rawUsage.totalTokenCount),
      this.options.model,
      result.latencyMs,
    );
  }

  async *stream(request: AIRequest): AsyncIterable<AIChunk> {
    const completed = await this.complete(request);
    yield { content: completed.content, isComplete: true };
  }

  async isAvailable(): Promise<boolean> {
    return this.options.apiKey.trim().length > 0;
  }

  getModelInfo(): ModelInfo {
    return { provider: this.name, model: this.options.model, contextWindow: 1000000, supportsJson: true, supportsStreaming: false };
  }

  private extractOutputText(envelope: Record<string, unknown>): string {
    const candidates = Array.isArray(envelope.candidates) ? envelope.candidates : [];
    for (const candidate of candidates) {
      const parts = asRecord(asRecord(candidate).content).parts;
      for (const part of Array.isArray(parts) ? parts : []) {
        const text = asRecord(part).text;
        if (typeof text === 'string' && text.trim()) return text;
      }
    }
    throw new AISafetyError('Gemini response contained no output text.');
  }
}
