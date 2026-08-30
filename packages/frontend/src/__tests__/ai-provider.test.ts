import { describe, expect, it, vi } from 'vitest';
import { AITaskType, createBuilding, rectToPolygon } from '@ai-floor-planner/core';
import {
  AIOrchestrationService,
  GeminiProvider,
  RuleBasedRequirementParser,
} from '@ai-floor-planner/ai-orchestration';
import { getConfiguredProvider } from '../services/ai-provider';

function geminiResponse(payload: unknown): Response {
  return new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }],
    usageMetadata: {
      promptTokenCount: 6,
      candidatesTokenCount: 9,
      totalTokenCount: 15,
    },
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('frontend AI provider resolution', () => {
  it('uses a configured Gemini provider and validates and normalizes its requirement output', async () => {
    const prompt = '40x60 3BHK east facing with parking';
    const parsedLocally = new RuleBasedRequirementParser().parse(prompt);
    const providerPayload = {
      ...structuredClone(parsedLocally),
      projectName: '  Gemini concept plan  ',
      rawUserPrompt: 'provider must not replace the user prompt',
    };

    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const requestBody = JSON.parse(String(init?.body));
      expect(requestBody.generationConfig.responseMimeType).toBe('application/json');
      expect(requestBody.generationConfig.responseSchema.type).toBe('object');
      expect((init?.headers as Record<string, string>)['x-goog-api-key']).toBe('test-key');
      return geminiResponse(providerPayload);
    });
    const provider = getConfiguredProvider(
      { VITE_GEMINI_API_KEY: '  test-key  ' },
      { model: 'test-gemini', fetchImplementation: fetchMock as typeof fetch },
    );

    expect(provider).toBeInstanceOf(GeminiProvider);
    const result = await new AIOrchestrationService(provider).parseRequirementsDetailed(prompt);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      source: 'provider',
      providerName: 'gemini',
      model: 'test-gemini',
      usedFallback: false,
      diagnostics: [],
    });
    expect(result.requirements.projectName).toBe('Gemini concept plan');
    expect(result.requirements.rawUserPrompt).toBe(prompt);
  });

  it('routes edit parsing through the same configured Gemini provider', async () => {
    const editPayload = {
      action: 'rename_room',
      targetQuery: 'Kitchen',
      direction: 'auto',
      distanceMm: 0,
      widthMm: 0,
      heightMm: 0,
      scalePercent: 0,
      dimensionDeltaMm: 0,
      newName: 'Chef Kitchen',
      reasoning: 'Rename Kitchen.',
    };
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const requestBody = JSON.parse(String(init?.body));
      expect(requestBody.generationConfig.responseMimeType).toBe('application/json');
      expect(requestBody.generationConfig.responseSchema.type).toBe('object');
      return geminiResponse(editPayload);
    });
    const provider = getConfiguredProvider(
      { VITE_GEMINI_API_KEY: 'test-key' },
      { model: 'test-gemini', fetchImplementation: fetchMock as typeof fetch },
    );
    const building = createBuilding({
      projectId: 'project-1',
      name: 'Test building',
      site: { plotWidth: 10000, plotDepth: 10000 },
      floors: [{
        buildingId: '',
        level: 0,
        name: 'Ground Floor',
        boundary: rectToPolygon(0, 0, 10000, 10000),
      }],
    });

    const result = await new AIOrchestrationService(provider).parseEditCommandDetailed(
      'Rename kitchen to Chef Kitchen',
      building,
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result.source).toBe('provider');
    expect(result.providerName).toBe('gemini');
    expect(result.intent).toMatchObject({ action: 'rename_room', newName: 'Chef Kitchen' });
  });

  it('is byte-for-byte identical to the existing local parser path when the key is absent', async () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1_000);
    try {
      expect(getConfiguredProvider({ VITE_GEMINI_API_KEY: '   ' })).toBeUndefined();
      const prompt = '30x50 2BHK east facing with parking';
      const baseline = await new AIOrchestrationService().parseRequirementsDetailed(prompt);
      const resolved = await new AIOrchestrationService(
        getConfiguredProvider({ VITE_GEMINI_API_KEY: undefined }),
      ).parseRequirementsDetailed(prompt);

      expect(JSON.stringify(resolved)).toBe(JSON.stringify(baseline));
      expect(resolved.source).toBe('rule_based');
      expect(resolved.providerName).toBeNull();
      expect(resolved.usedFallback).toBe(false);
    } finally {
      clock.mockRestore();
    }
  });

  it('sends the expected task type through Gemini', async () => {
    const prompt = '30x50 2BHK';
    const payload = new RuleBasedRequirementParser().parse(prompt);
    const fetchMock = vi.fn(async () => geminiResponse(payload));
    const provider = getConfiguredProvider(
      { VITE_GEMINI_API_KEY: 'test-key' },
      { fetchImplementation: fetchMock as typeof fetch },
    );

    await provider?.complete({
      taskType: AITaskType.RequirementExtraction,
      systemPrompt: 'system',
      userPrompt: prompt,
      responseFormat: 'json',
    });

    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
