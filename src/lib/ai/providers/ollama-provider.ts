import { AIProviderError } from "../errors";
import type {
  AIProvider,
  GenerateStructuredRequest,
  GenerateStructuredResult,
  GenerateTextRequest,
  GenerateTextResult,
  ModelCatalogEntry,
  ProviderRuntimeConfig
} from "../types";
import { elapsed, extractJsonObject, nowMs } from "./provider-utils";

export class OllamaProvider implements AIProvider {
  readonly id = "ollama" as const;
  private readonly config: ProviderRuntimeConfig;

  constructor(config: ProviderRuntimeConfig) {
    this.config = config;
  }

  async generateText(request: GenerateTextRequest): Promise<GenerateTextResult> {
    const start = nowMs();

    if (!this.config.baseUrl || !this.config.model) {
      throw new AIProviderError({
        code: "configuration_error",
        message: "Ollama base URL or model is missing.",
        provider: this.id
      });
    }

    const response = await fetch(new URL("/api/generate", this.config.baseUrl), {
      body: JSON.stringify({
        model: request.model ?? this.config.model,
        options: {
          num_predict: request.maxOutputTokens,
          temperature: request.temperature,
          top_p: request.topP
        },
        prompt: [request.system, request.prompt].filter(Boolean).join("\n\n"),
        stream: false
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST",
      signal: request.abortSignal
    });

    if (!response.ok) {
      throw new AIProviderError({
        code: "provider_unavailable",
        message: "Ollama server is unavailable.",
        provider: this.id,
        retryable: response.status >= 500
      });
    }

    const payload = (await response.json()) as { model?: string; response?: string };

    if (!payload.response) {
      throw new AIProviderError({
        code: "invalid_response",
        message: "Ollama returned an empty response.",
        provider: this.id
      });
    }

    return {
      content: payload.response,
      fallbackUsed: false,
      latencyMs: elapsed(start),
      model: payload.model ?? request.model ?? this.config.model,
      provider: this.id,
      retryCount: 0,
      warnings: []
    };
  }

  async generateStructured<T>(
    request: GenerateStructuredRequest<T>
  ): Promise<GenerateStructuredResult<T>> {
    const result = await this.generateText({
      ...request,
      prompt: `${request.prompt}\n\nReturn only JSON matching this schema: ${JSON.stringify(request.schema)}`
    });
    const parsed = request.validate(extractJsonObject(result.content));

    if (!parsed) {
      throw new AIProviderError({
        code: "invalid_response",
        message: "Ollama returned malformed structured output.",
        provider: this.id
      });
    }

    return {
      ...result,
      parsed
    };
  }

  async listModels(): Promise<ModelCatalogEntry[]> {
    if (!this.config.baseUrl) {
      return [];
    }

    try {
      const response = await fetch(new URL("/api/tags", this.config.baseUrl));

      if (!response.ok) {
        return [];
      }

      const payload = (await response.json()) as { models?: Array<{ name?: string }> };

      return (payload.models ?? [])
        .filter((model): model is { name: string } => typeof model.name === "string")
        .map((model) => ({
          deprecated: false,
          family: "local",
          id: model.name,
          provider: this.id
        }));
    } catch {
      return [];
    }
  }
}
