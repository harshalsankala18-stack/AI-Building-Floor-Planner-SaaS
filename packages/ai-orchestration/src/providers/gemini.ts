import type { AIChunk, AIRequest, AIResponse, ModelInfo } from '@ai-floor-planner/core';
import { AITaskType } from '@ai-floor-planner/core';
import { BaseAIProvider, AISafetyError, AIRequestValidationError } from './base';
import { REQUIREMENT_RESPONSE_SCHEMA } from '../requirements/schema';
import {
  asRecord,
  parseJsonContent,
  postJson,
  response,
  usage,
  HttpProviderError,
  type ProviderFetch,
} from './http';

export interface GeminiRetryPolicy {
  readonly maxRetries: number;
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
  readonly backoffFactor: number;
  readonly jitterRatio: number;
}

export const DEFAULT_GEMINI_RETRY_POLICY: GeminiRetryPolicy = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
  backoffFactor: 2,
  jitterRatio: 0.2, // +/- 20% random jitter
};

export interface GeminiProviderOptions {
  readonly apiKey: string;
  readonly model?: string;
  readonly fallbackModel?: string;
  readonly endpointBase?: string;
  readonly timeoutMs?: number;
  readonly fetchImplementation?: ProviderFetch;
  readonly retryPolicy?: Partial<GeminiRetryPolicy>;
  readonly sleepFn?: (ms: number) => Promise<void>;
}

export function extractHttpStatus(error: unknown): number | null {
  if (error instanceof HttpProviderError) return error.status;
  if (error instanceof Error) {
    const match = error.message.match(/HTTP (\d{3})/i);
    if (match && match[1]) {
      const code = parseInt(match[1], 10);
      if (!isNaN(code)) return code;
    }
  }
  return null;
}

export function isTransientHttpError(status: number | null): boolean {
  if (status === null) return false;
  return status === 503 || status === 429 || status === 408 || (status >= 500 && status < 600);
}

export function isAuthHttpError(status: number | null): boolean {
  if (status === null) return false;
  return status === 401 || status === 403;
}

export function isNetworkTransientError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof Error) {
    const name = error.name;
    const msg = error.message.toLowerCase();
    const cause = (error as { cause?: { code?: string; message?: string } }).cause;
    const causeCode = cause?.code?.toUpperCase();
    const errCode = (error as { code?: string }).code?.toUpperCase();

    if (name === 'AbortError' || msg.includes('timed out') || msg.includes('timeout')) {
      return true;
    }
    const networkCodes = new Set([
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'ENOTFOUND',
      'EAI_AGAIN',
      'EPIPE',
      'UND_ERR_CONNECT_TIMEOUT',
      'UND_ERR_SOCKET',
      'UND_ERR_HEADERS_TIMEOUT',
      'UND_ERR_BODY_TIMEOUT',
    ]);
    if (causeCode && networkCodes.has(causeCode)) return true;
    if (errCode && networkCodes.has(errCode)) return true;
    if (
      msg.includes('econnreset') ||
      msg.includes('etimedout') ||
      msg.includes('connection reset') ||
      msg.includes('socket hang up') ||
      msg.includes('fetch failed') ||
      msg.includes('network error')
    ) {
      return true;
    }
  }
  return false;
}

export function isModelNotFoundError(error: unknown, status: number | null): boolean {
  if (status === 404) return true;
  if (error instanceof HttpProviderError) {
    if (error.status === 404) return true;
    if (error.detail && /not_found|models\/.*is not found|does not exist/i.test(error.detail)) return true;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes('not found') ||
      msg.includes('not_found') ||
      msg.includes('is not supported for generatecontent') ||
      msg.includes('no longer available') ||
      msg.includes('does not exist')
    ) {
      return true;
    }
  }
  return false;
}

export function calculateDelayWithJitter(attempt: number, policy: GeminiRetryPolicy, retryAfterMs?: number): number {
  if (typeof retryAfterMs === 'number' && retryAfterMs > 0) {
    return Math.min(policy.maxDelayMs, Math.max(50, Math.round(retryAfterMs)));
  }
  // attempt 1 => initialDelayMs; attempt 2 => initialDelayMs * backoffFactor; etc.
  const exponential = policy.initialDelayMs * Math.pow(policy.backoffFactor, Math.max(0, attempt - 1));
  const bounded = Math.min(policy.maxDelayMs, exponential);
  const jitter = bounded * policy.jitterRatio * (Math.random() * 2 - 1);
  return Math.max(50, Math.round(bounded + jitter));
}

export class GeminiProvider extends BaseAIProvider {
  readonly name = 'gemini';
  private readonly options: {
    readonly apiKey: string;
    readonly model: string;
    readonly fallbackModel?: string;
    readonly timeoutMs: number;
    readonly fetchImplementation: ProviderFetch;
  };
  private readonly endpointBase: string;
  readonly retryPolicy: GeminiRetryPolicy;
  readonly sleepFn: (ms: number) => Promise<void>;

  constructor(options: GeminiProviderOptions) {
    super();
    const model = options.model ?? 'gemini-3.6-flash';
    const endpointBase = options.endpointBase ?? 'https://generativelanguage.googleapis.com/v1beta/models';
    this.endpointBase = endpointBase;
    this.options = {
      apiKey: options.apiKey,
      model,
      fallbackModel: options.fallbackModel,
      timeoutMs: options.timeoutMs ?? 45000,
      fetchImplementation: options.fetchImplementation ?? fetch,
    };
    this.retryPolicy = {
      ...DEFAULT_GEMINI_RETRY_POLICY,
      ...(options.retryPolicy ?? {}),
    };
    this.sleepFn = options.sleepFn ?? ((ms: number) => new Promise(resolve => setTimeout(resolve, ms)));
  }

  async complete(request: AIRequest): Promise<AIResponse> {
    if (!this.options.apiKey.trim()) throw new Error('Gemini API key is not configured.');
    const wantsJson = request.responseFormat === 'json';
    const extractsRequirements = request.taskType === AITaskType.RequirementExtraction;
    const rawSchema = request.responseSchema ?? (extractsRequirements ? REQUIREMENT_RESPONSE_SCHEMA : undefined);
    const responseSchema = wantsJson && rawSchema ? cleanGeminiSchema(rawSchema) : undefined;
    const parts = buildGeminiParts(request);
    const payload = {
      systemInstruction: { parts: [{ text: request.systemPrompt }] },
      contents: [{ role: 'user', parts }],
      generationConfig: {
        ...(request.maxTokens ? { maxOutputTokens: request.maxTokens } : {}),
        ...(wantsJson ? {
          responseMimeType: 'application/json',
          ...(responseSchema ? { responseSchema } : {}),
        } : {}),
      },
    };

    const primaryModel = this.options.model;
    const fallbackModel = this.options.fallbackModel && this.options.fallbackModel !== primaryModel
      ? this.options.fallbackModel
      : undefined;

    const modelsToExecute: string[] = [primaryModel];
    if (fallbackModel) {
      modelsToExecute.push(fallbackModel);
    }

    let lastError: unknown;

    for (let mIdx = 0; mIdx < modelsToExecute.length; mIdx++) {
      const currentModel = modelsToExecute[mIdx]!;
      const isFallback = mIdx > 0;
      let nextDelayMs: number | undefined;

      for (let attempt = 0; attempt <= this.retryPolicy.maxRetries; attempt++) {
        if (attempt > 0) {
          const delayMs = nextDelayMs ?? calculateDelayWithJitter(attempt, this.retryPolicy);
          console.warn(
            `[GeminiProvider] Transient error on model "${currentModel}" (attempt ${attempt}/${this.retryPolicy.maxRetries}). Retrying in ${delayMs}ms with exponential backoff & jitter...`,
          );
          await this.sleepFn(delayMs);
          nextDelayMs = undefined;
        }

        try {
          const endpoint = `${this.endpointBase}/${encodeURIComponent(currentModel)}:generateContent`;
          const result = await postJson(
            {
              apiKey: this.options.apiKey,
              model: currentModel,
              endpoint,
              timeoutMs: this.options.timeoutMs,
              fetchImplementation: this.options.fetchImplementation,
            },
            { 'x-goog-api-key': this.options.apiKey },
            payload,
          );
          const content = this.extractOutputText(result.body);
          const parsed = wantsJson ? parseJsonContent(content) : undefined;
          const rawUsage = asRecord(result.body.usageMetadata);
          return response(
            content,
            parsed,
            usage(rawUsage.promptTokenCount, rawUsage.candidatesTokenCount, rawUsage.totalTokenCount),
            currentModel,
            result.latencyMs,
          );
        } catch (err) {
          lastError = err;

          // 1. Client-side request validation errors (empty image, invalid base64, unsupported MIME):
          // Fail immediately - never retry identical payload, never fallback
          if (err instanceof AIRequestValidationError) {
            throw err;
          }

          const status = extractHttpStatus(err);

          // 2. Authentication error (401, 403):
          // Fail immediately - never retry identical credentials, never fallback
          if (isAuthHttpError(status)) {
            throw err;
          }

          // 3. Model not found (404 / NOT_FOUND / unsupported model):
          if (isModelNotFoundError(err, status)) {
            if (fallbackModel && !isFallback) {
              console.warn(
                `[GeminiProvider] Model "${currentModel}" not found or unsupported (status ${status ?? 404}). Falling forward to "${fallbackModel}"...`,
              );
              break; // Break inner retry loop to try fallback model
            }
            throw err; // No fallback available or fallback itself failed
          }

          // 4. Client error 400 (invalid schema / bad request):
          if (status === 400) {
            throw err;
          }

          // 5. Check if transient: HTTP transient (503, 429, 5xx) OR Network transient (ECONNRESET, ETIMEDOUT, timeout, etc.) OR unparseable output
          const isTransientHttp = isTransientHttpError(status);
          const isNetworkTransient = isNetworkTransientError(err);
          const isSafetyOrParse = err instanceof AISafetyError;

          if (!isTransientHttp && !isNetworkTransient && !isSafetyOrParse) {
            throw err; // Non-transient unrecoverable error
          }

          // Compute delay for next attempt respecting Retry-After where available
          const retryAfterMs = err instanceof HttpProviderError ? err.retryAfterMs : undefined;
          nextDelayMs = calculateDelayWithJitter(attempt + 1, this.retryPolicy, retryAfterMs);

          // If attempts remaining on current model, continue to next attempt
          if (attempt < this.retryPolicy.maxRetries) {
            continue;
          }

          console.warn(
            `[GeminiProvider] Retries exhausted for model "${currentModel}" on transient error (status ${status ?? 'network/timeout'}).`,
          );
          break; // Move to fallback model if available
        }
      }

      if (fallbackModel && !isFallback) {
        console.warn(
          `[GeminiProvider] Primary model "${primaryModel}" failed after retries. Falling back to "${fallbackModel}"...`,
        );
      }
    }

    throw lastError ?? new Error('Gemini completion failed across all models.');
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
      const arr = Array.isArray(parts) ? parts : [];
      // Prefer non-thought text parts (Gemini thinking models)
      const answerParts = arr
        .map(p => asRecord(p))
        .filter(p => !p.thought && typeof p.text === 'string' && (p.text as string).trim());
      if (answerParts.length > 0) {
        return answerParts.map(p => p.text as string).join('\n');
      }
      for (const part of arr) {
        const text = asRecord(part).text;
        if (typeof text === 'string' && text.trim()) return text;
      }
    }
    throw new AISafetyError('Gemini response contained no output text.');
  }
}

export function cleanGeminiSchema(schema: unknown): unknown {
  if (schema === null || typeof schema !== 'object') return schema;
  if (Array.isArray(schema)) return schema.map(cleanGeminiSchema);
  const out: Record<string, unknown> = {};
  const record = schema as Record<string, unknown>;
  const unsupportedKeys = new Set([
    'additionalProperties',
    'exclusiveMinimum',
    'exclusiveMaximum',
    'minimum',
    'maximum',
    'minItems',
    'maxItems',
    '$schema',
    '$id',
  ]);
  for (const [k, v] of Object.entries(record)) {
    if (unsupportedKeys.has(k)) continue;
    // Gemini response_schema requires enum values to be strings; strip non-string enums
    if (k === 'enum' && Array.isArray(v)) {
      if (record.type === 'integer' || record.type === 'number') {
        continue;
      }
      out[k] = v.map(item => String(item));
      continue;
    }
    out[k] = cleanGeminiSchema(v);
  }
  return out;
}

/** Image media types accepted as Gemini inline image parts. */
export const GEMINI_SUPPORTED_IMAGE_MIME_TYPES: ReadonlySet<string> = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/heic',
  'image/heif',
]);

/**
 * Build Gemini request parts from the typed request (recovery Phase 4, P8).
 * The text prompt is ONE text part; every image in `request.images` becomes
 * its own `inlineData` part. Prompt wording is never inspected, so changing a
 * prompt can no longer silently turn an image into a multi-MB text string.
 */
export function buildGeminiParts(request: Pick<AIRequest, 'userPrompt' | 'images'>): Array<Record<string, unknown>> {
  const parts: Array<Record<string, unknown>> = [{ text: request.userPrompt }];
  for (const [index, image] of (request.images ?? []).entries()) {
    const mimeType = image.mimeType.trim().toLowerCase();
    if (!GEMINI_SUPPORTED_IMAGE_MIME_TYPES.has(mimeType)) {
      throw new AIRequestValidationError(`Image part ${index} has unsupported media type "${image.mimeType}" for Gemini.`);
    }
    if (image.data.startsWith('data:')) {
      throw new AIRequestValidationError(`Image part ${index} must be raw base64, not a data URL.`);
    }
    const data = image.data.replace(/\s+/g, '');
    if (data.length === 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) {
      throw new AIRequestValidationError(`Image part ${index} is not valid base64 image data.`);
    }
    parts.push({ inlineData: { mimeType, data } });
  }
  return parts;
}
