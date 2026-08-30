import { describe, expect, it, vi } from 'vitest';
import type { AIProvider, AIRequest, AIResponse, ModelInfo } from '@ai-floor-planner/core';
import { AITaskType, Direction } from '@ai-floor-planner/core';
import {
  AIOrchestrationService,
  GeminiProvider,
  OpenAIProvider,
  RuleBasedRequirementParser,
  validateRequirementPayload,
} from '../index';

const ruleParser = new RuleBasedRequirementParser();

function providerPayload(prompt = '40x60 3BHK east facing with parking') {
  return ruleParser.parse(prompt);
}

function aiResponse(parsed: Record<string, unknown>): AIResponse {
  return {
    content: JSON.stringify(parsed),
    parsed,
    usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    model: 'mock-model',
    latencyMs: 4,
  };
}

class MockProvider implements AIProvider {
  readonly name = 'mock';

  constructor(
    private readonly outcome: AIResponse | Error,
    private readonly available = true,
    private readonly delayMs = 0,
  ) {}

  async complete(_request: AIRequest): Promise<AIResponse> {
    if (this.delayMs) await new Promise(resolve => setTimeout(resolve, this.delayMs));
    if (this.outcome instanceof Error) throw this.outcome;
    return this.outcome;
  }

  async *stream(request: AIRequest) {
    const result = await this.complete(request);
    yield { content: result.content, isComplete: true };
  }

  async isAvailable() { return this.available; }

  getModelInfo(): ModelInfo {
    return { provider: this.name, model: 'mock-model', contextWindow: 1000, supportsJson: true, supportsStreaming: false };
  }
}

describe('Phase 8 AI requirement parser', () => {
  describe('RuleBasedRequirementParser', () => {
    it('parses dimensions, room counts, road direction, and parking', () => {
      const spec = ruleParser.parse('30x50 ft plot, 2BHK, 2 bathrooms with east road and parking');
      expect(spec.hard.plotWidthMm).toBe(9144);
      expect(spec.hard.plotDepthMm).toBe(15240);
      expect(spec.hard.bedroomCount).toBe(2);
      expect(spec.hard.bathroomCount).toBe(2);
      expect(spec.hard.roadFacing).toBe(Direction.East);
      expect(spec.hard.parkingRequired).toBe(true);
    });

    it('parses metric units and optional preferences', () => {
      const spec = ruleParser.parse('9m x 15m 2BHK with vastu, pooja, study and open kitchen');
      expect(spec.hard.plotWidthMm).toBe(9000);
      expect(spec.hard.plotDepthMm).toBe(15000);
      expect(spec.soft.vastuCompliance).toBe(true);
      expect(spec.soft.poojaRoom).toBe(true);
      expect(spec.soft.studyRoom).toBe(true);
      expect(spec.soft.openKitchen).toBe(true);
    });

    it('preserves multi-floor needs, amenities, and explicit negative preferences', () => {
      const spec = ruleParser.parse('40x60 G+1 4BHK, 3 bath, no parking, lift, garden, servant room, no balcony, closed kitchen');
      expect(spec.hard.floorsCount).toBe(2);
      expect(spec.hard.staircaseRequired).toBe(true);
      expect(spec.hard.parkingSpacesCount).toBe(0);
      expect(spec.hard.liftRequired).toBe(true);
      expect(spec.soft.gardenPreference).toBe(true);
      expect(spec.soft.servantQuarter).toBe(true);
      expect(spec.soft.balconyPreferred).toBe(false);
      expect(spec.soft.openKitchen).toBe(false);
    });
  });

  describe('untrusted output validation', () => {
    it('accepts a complete canonical provider payload and preserves the user prompt', () => {
      const result = validateRequirementPayload(providerPayload(), 'original user text');
      expect(result.valid).toBe(true);
      expect(result.requirements?.rawUserPrompt).toBe('original user text');
      expect(result.requirements?.hard.bedroomCount).toBe(3);
    });

    it('rejects empty objects instead of normalizing them into plausible defaults', () => {
      const result = validateRequirementPayload({}, 'anything');
      expect(result.valid).toBe(false);
      expect(result.requirements).toBeUndefined();
    });

    it('rejects impossible numeric and cross-field values', () => {
      const payload = structuredClone(providerPayload()) as unknown as {
        hard: Record<string, unknown>;
        soft: Record<string, unknown>;
      };
      payload.hard.plotWidthMm = -20;
      payload.soft.attachedBathroomsCount = 9;
      const result = validateRequirementPayload(payload, 'invalid');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('rejects contradictory parking and malformed custom-room data', () => {
      const payload = structuredClone(providerPayload()) as unknown as {
        hard: Record<string, unknown>;
      };
      payload.hard.parkingRequired = false;
      payload.hard.parkingSpacesCount = 2;
      payload.hard.customRooms = [{ type: 'invented_room', count: 1, name: 'Unsafe' }];
      const result = validateRequirementPayload(payload, 'invalid custom room');
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('parkingRequired'))).toBe(true);
      expect(result.errors.some(error => error.includes('custom room'))).toBe(true);
    });
  });

  describe('AIOrchestrationService', () => {
    it('keeps the original parseRequirements contract for earlier phases', async () => {
      const spec = await new AIOrchestrationService().parseRequirements('3BHK house on 30x50 plot');
      expect(spec.hard.bedroomCount).toBe(3);
      expect(spec.hard.plotWidthMm).toBe(9144);
    });

    it('returns provider provenance for a valid structured response', async () => {
      const provider = new MockProvider(aiResponse(providerPayload() as unknown as Record<string, unknown>));
      const result = await new AIOrchestrationService(provider).parseRequirementsDetailed('40x60 3BHK east facing with parking');
      expect(result.source).toBe('provider');
      expect(result.usedFallback).toBe(false);
      expect(result.providerName).toBe('mock');
      expect(result.requirements.hard.bedroomCount).toBe(3);
    });

    it('falls back when a provider is unavailable, throws, or returns unsafe output', async () => {
      const unavailable = await new AIOrchestrationService(new MockProvider(aiResponse({}), false)).parseRequirementsDetailed('30x50 2BHK');
      const failed = await new AIOrchestrationService(new MockProvider(new Error('secret internal failure'))).parseRequirementsDetailed('30x50 2BHK');
      const invalid = await new AIOrchestrationService(new MockProvider(aiResponse({}))).parseRequirementsDetailed('30x50 2BHK');
      expect(unavailable.diagnostics[0]?.code).toBe('PROVIDER_UNAVAILABLE');
      expect(failed.diagnostics[0]?.code).toBe('PROVIDER_ERROR');
      expect(invalid.diagnostics[0]?.code).toBe('INVALID_PROVIDER_OUTPUT');
      expect([unavailable, failed, invalid].every(result => result.usedFallback && result.requirements.hard.bedroomCount === 2)).toBe(true);
    });

    it('falls back within the configured deadline', async () => {
      const provider = new MockProvider(aiResponse(providerPayload() as unknown as Record<string, unknown>), true, 30);
      const result = await new AIOrchestrationService(provider, { providerTimeoutMs: 5 }).parseRequirementsDetailed('30x50 2BHK');
      expect(result.usedFallback).toBe(true);
      expect(result.diagnostics[0]?.code).toBe('PROVIDER_TIMEOUT');
    });

    it('bounds oversized prompts before either provider or local parsing', async () => {
      const result = await new AIOrchestrationService(undefined, { maxPromptLength: 20 }).parseRequirementsDetailed(`30x50 2BHK ${'x'.repeat(100)}`);
      expect(result.diagnostics[0]?.code).toBe('PROMPT_TRUNCATED');
      expect(result.requirements.rawUserPrompt?.length).toBe(20);
    });
  });

  describe('HTTP provider adapters', () => {
    it('sends an OpenAI Responses structured-output request and parses output_text', async () => {
      const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body));
        expect(body.text.format.type).toBe('json_schema');
        expect(body.text.format.strict).toBe(true);
        expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer test-key');
        return new Response(JSON.stringify({
          model: 'test-openai',
          output_text: JSON.stringify(providerPayload()),
          usage: { input_tokens: 7, output_tokens: 11, total_tokens: 18 },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      });
      const provider = new OpenAIProvider({ apiKey: 'test-key', model: 'test-openai', fetchImplementation: fetchMock as typeof fetch });
      const parsed = await provider.complete({
        taskType: AITaskType.RequirementExtraction,
        systemPrompt: 'system',
        userPrompt: 'prompt',
        responseFormat: 'json',
      });
      expect(parsed.parsed?.hard).toBeDefined();
      expect(parsed.usage.totalTokens).toBe(18);
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    it('sends Gemini schema configuration and parses candidate content', async () => {
      const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body));
        expect(body.generationConfig.responseMimeType).toBe('application/json');
        expect(body.generationConfig.responseSchema.type).toBe('object');
        expect((init?.headers as Record<string, string>)['x-goog-api-key']).toBe('gemini-key');
        return new Response(JSON.stringify({
          candidates: [{ content: { parts: [{ text: JSON.stringify(providerPayload()) }] } }],
          usageMetadata: { promptTokenCount: 6, candidatesTokenCount: 9, totalTokenCount: 15 },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      });
      const provider = new GeminiProvider({ apiKey: 'gemini-key', model: 'test-gemini', fetchImplementation: fetchMock as typeof fetch });
      const parsed = await provider.complete({
        taskType: AITaskType.RequirementExtraction,
        systemPrompt: 'system',
        userPrompt: 'prompt',
        responseFormat: 'json',
      });
      expect(parsed.parsed?.soft).toBeDefined();
      expect(parsed.usage.totalTokens).toBe(15);
    });
  });
});
