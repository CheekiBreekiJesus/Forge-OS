import type { AIErrorCode, AIProviderId } from "./types";

export class AIProviderError extends Error {
  readonly code: AIErrorCode;
  readonly provider: AIProviderId;
  readonly retryable: boolean;

  constructor({
    code,
    message,
    provider,
    retryable = false
  }: {
    code: AIErrorCode;
    message: string;
    provider: AIProviderId;
    retryable?: boolean;
  }) {
    super(message);
    this.name = "AIProviderError";
    this.code = code;
    this.provider = provider;
    this.retryable = retryable;
  }
}

export function sanitizeProviderError(error: unknown): string {
  if (error instanceof AIProviderError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message
      .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
      .replace(/api[_-]?key=([^&\s]+)/gi, "api_key=[redacted]");
  }

  return "Provider request failed.";
}

export function normalizeHttpError(provider: AIProviderId, status: number): AIProviderError {
  if (status === 401) {
    return new AIProviderError({
      code: "authentication_error",
      message: "Provider authentication failed.",
      provider
    });
  }

  if (status === 403) {
    return new AIProviderError({
      code: "authorization_error",
      message: "Provider authorization failed.",
      provider
    });
  }

  if (status === 404) {
    return new AIProviderError({
      code: "model_not_found",
      message: "Configured model or endpoint was not found.",
      provider
    });
  }

  if (status === 429) {
    return new AIProviderError({
      code: "rate_limit",
      message: "Provider rate limit reached.",
      provider,
      retryable: true
    });
  }

  if (status >= 500) {
    return new AIProviderError({
      code: "provider_unavailable",
      message: "Provider is temporarily unavailable.",
      provider,
      retryable: true
    });
  }

  return new AIProviderError({
    code: "unknown_provider_error",
    message: "Provider request failed.",
    provider
  });
}
