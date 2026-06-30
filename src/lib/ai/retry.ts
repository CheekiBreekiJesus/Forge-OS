import { AIProviderError } from "./errors";

export async function withRetry<T>({
  maxRetries,
  operation
}: {
  maxRetries: number;
  operation: (attempt: number) => Promise<T>;
}): Promise<{ retryCount: number; value: T }> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return {
        retryCount: attempt,
        value: await operation(attempt)
      };
    } catch (error) {
      lastError = error;

      if (!(error instanceof AIProviderError) || !error.retryable || attempt === maxRetries) {
        throw error;
      }

      await delay(backoffMs(attempt));
    }
  }

  throw lastError;
}

export function isRetryableError(error: unknown): boolean {
  return error instanceof AIProviderError && error.retryable;
}

function backoffMs(attempt: number): number {
  const base = 100 * 2 ** attempt;
  const jitter = Math.floor(Math.random() * 50);
  return Math.min(base + jitter, 1000);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
