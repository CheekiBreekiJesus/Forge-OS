import { getAIConfig, type AIAppConfig } from "./config";
import { AIProviderError, sanitizeProviderError } from "./errors";
import { createAIProviderRegistry } from "./registry";
import { withRetry } from "./retry";
import type {
  AIProviderId,
  GenerateStructuredRequest,
  GenerateStructuredResult
} from "./types";

export async function generateStructuredWithGateway<T>({
  config = getAIConfig(),
  fallback,
  provider,
  request
}: {
  config?: AIAppConfig;
  fallback: () => GenerateStructuredResult<T>;
  provider: AIProviderId;
  request: GenerateStructuredRequest<T>;
}): Promise<GenerateStructuredResult<T>> {
  const registry = createAIProviderRegistry(config);
  const activeProvider = registry.get(provider);

  try {
    const { retryCount, value } = await withRetry({
      maxRetries: config.providers[provider].maxRetries ?? config.maxRetries,
      operation: async () => activeProvider.generateStructured(request)
    });

    return {
      ...value,
      retryCount
    };
  } catch (error) {
    if (config.fallbackProvider !== "deterministic") {
      throw error;
    }

    const fallbackResult = fallback();
    const warning =
      error instanceof AIProviderError
        ? `${error.code}: ${sanitizeProviderError(error)}`
        : sanitizeProviderError(error);

    return {
      ...fallbackResult,
      fallbackUsed: true,
      warnings: [...fallbackResult.warnings, warning]
    };
  }
}
