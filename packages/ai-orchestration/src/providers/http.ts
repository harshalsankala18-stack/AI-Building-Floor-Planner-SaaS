import type { AIResponse, TokenUsage } from '@ai-floor-planner/core';
import { AISafetyError } from './base';

export type ProviderFetch = typeof fetch;

export interface HttpProviderOptions {
  readonly apiKey: string;
  readonly model: string;
  readonly endpoint: string;
  readonly timeoutMs: number;
  readonly fetchImplementation: ProviderFetch;
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};
}

export function parseJsonContent(content: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(content);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Expected an object.');
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new AISafetyError('Provider returned invalid structured JSON.');
  }
}

export function usage(promptTokens: unknown, completionTokens: unknown, totalTokens: unknown): TokenUsage {
  const prompt = typeof promptTokens === 'number' ? promptTokens : 0;
  const completion = typeof completionTokens === 'number' ? completionTokens : 0;
  return {
    promptTokens: prompt,
    completionTokens: completion,
    totalTokens: typeof totalTokens === 'number' ? totalTokens : prompt + completion,
  };
}

export async function postJson(
  options: HttpProviderOptions,
  headers: Record<string, string>,
  body: unknown,
): Promise<{ body: Record<string, unknown>; latencyMs: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await options.fetchImplementation(options.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Provider request failed with HTTP ${response.status}.`);
    }
    const parsed: unknown = await response.json();
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new AISafetyError('Provider returned a non-object response envelope.');
    }
    return { body: parsed as Record<string, unknown>, latencyMs: Date.now() - startedAt };
  } catch (error) {
    if (error instanceof AISafetyError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new Error('Provider request timed out.');
    throw error instanceof Error ? error : new Error('Provider request failed.');
  } finally {
    clearTimeout(timeout);
  }
}

export function response(
  content: string,
  parsed: Record<string, unknown> | undefined,
  responseUsage: TokenUsage,
  model: string,
  latencyMs: number,
): AIResponse {
  return { content, ...(parsed ? { parsed } : {}), usage: responseUsage, model, latencyMs };
}
