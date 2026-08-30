import {
  GeminiProvider,
  type GeminiProviderOptions,
} from '@ai-floor-planner/ai-orchestration';

type FrontendAIEnvironment = Pick<ImportMetaEnv, 'VITE_GEMINI_API_KEY'>;
type GeminiProviderOverrides = Omit<GeminiProviderOptions, 'apiKey'>;

/**
 * Resolves the frontend's optional AI provider from Vite's build-time environment.
 * Passing explicit values keeps provider and fallback behavior deterministic in tests.
 */
export function getConfiguredProvider(
  environment: FrontendAIEnvironment = import.meta.env,
  overrides: GeminiProviderOverrides = {},
): GeminiProvider | undefined {
  const apiKey = environment.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey) return undefined;

  return new GeminiProvider({
    ...overrides,
    apiKey,
  });
}
