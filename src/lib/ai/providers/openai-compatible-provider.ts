import type {
  AIProvider,
  AIProviderId,
  GenerateStructuredRequest,
  GenerateStructuredResult,
  GenerateTextRequest,
  GenerateTextResult,
  ModelCatalogEntry,
  ProviderRuntimeConfig
} from "../types";
import {
  buildOpenAICompatiblePayload,
  postOpenAICompatible,
  toStructuredResult
} from "./provider-utils";

export class OpenAICompatibleProvider implements AIProvider {
  readonly id: AIProviderId;
  private readonly config: ProviderRuntimeConfig;
  private readonly supportsModelListing: boolean;

  constructor({
    config,
    id,
    supportsModelListing = true
  }: {
    config: ProviderRuntimeConfig;
    id: AIProviderId;
    supportsModelListing?: boolean;
  }) {
    this.config = config;
    this.id = id;
    this.supportsModelListing = supportsModelListing;
  }

  async generateText(request: GenerateTextRequest): Promise<GenerateTextResult> {
    const payload = buildOpenAICompatiblePayload(request);
    return postOpenAICompatible({
      config: this.config,
      payload,
      provider: this.id,
      request
    });
  }

  async generateStructured<T>(
    request: GenerateStructuredRequest<T>
  ): Promise<GenerateStructuredResult<T>> {
    const payload = buildOpenAICompatiblePayload(request, request.schema);
    return toStructuredResult(
      request,
      await postOpenAICompatible({
        config: this.config,
        payload,
        provider: this.id,
        request
      })
    );
  }

  async listModels(): Promise<ModelCatalogEntry[]> {
    if (!this.supportsModelListing || !this.config.baseUrl) {
      return [];
    }

    const response = await fetch(`${this.config.baseUrl.replace(/\/$/, "")}/models`, {
      headers: {
        ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {})
      }
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as { data?: Array<{ id?: string }> };

    return (payload.data ?? [])
      .filter((model): model is { id: string } => typeof model.id === "string")
      .map((model) => ({
        deprecated: false,
        family: this.id,
        id: model.id,
        provider: this.id
      }));
  }
}
