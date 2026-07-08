export type AIProviderId =
  | "deterministic"
  | "abacus"
  | "openai"
  | "anthropic"
  | "google"
  | "deepseek"
  | "xai"
  | "mistral"
  | "groq"
  | "openrouter"
  | "together"
  | "ollama"
  | "lmstudio"
  | "vllm";

export type AISpeedPreference = "economy" | "fast" | "balanced" | "quality";
export type AIReasoningPreference = "none" | "low" | "medium" | "high";

export type AIErrorCode =
  | "configuration_error"
  | "authentication_error"
  | "authorization_error"
  | "model_not_found"
  | "unsupported_parameter"
  | "rate_limit"
  | "insufficient_credits"
  | "timeout"
  | "invalid_response"
  | "provider_unavailable"
  | "runtime_dependency_missing"
  | "connection_error"
  | "cancelled"
  | "unknown_provider_error";

export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GenerateTextRequest = {
  abortSignal?: AbortSignal;
  maxOutputTokens?: number;
  messages?: AIMessage[];
  metadata?: Record<string, string>;
  model?: string;
  prompt: string;
  reasoningPreference?: AIReasoningPreference;
  speedPreference?: AISpeedPreference;
  stopSequences?: string[];
  system?: string;
  temperature?: number;
  timeoutMs?: number;
  topP?: number;
};

export type GenerateStructuredRequest<T> = GenerateTextRequest & {
  schema: AIJsonSchema;
  validate: (value: unknown) => T | null;
};

export type AIUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type GenerateTextResult = {
  content: string;
  fallbackUsed: boolean;
  latencyMs: number;
  model: string;
  provider: AIProviderId;
  requestId?: string;
  retryCount: number;
  usage?: AIUsage;
  warnings: string[];
};

export type GenerateStructuredResult<T> = GenerateTextResult & {
  parsed: T;
};

export type ModelCatalogEntry = {
  deprecated: boolean;
  family: string;
  id: string;
  provider: AIProviderId;
};

export type HealthCheckOptions = {
  live?: boolean;
};

export type ProviderHealth = {
  details: string[];
  ok: boolean;
  provider: AIProviderId;
};

export type AIJsonSchema = {
  additionalProperties?: boolean;
  properties: Record<string, unknown>;
  required?: string[];
  type: "object";
};

export type AIProvider = {
  readonly id: AIProviderId;
  generateText(request: GenerateTextRequest): Promise<GenerateTextResult>;
  generateStructured<T>(
    request: GenerateStructuredRequest<T>
  ): Promise<GenerateStructuredResult<T>>;
  healthCheck?(options?: HealthCheckOptions): Promise<ProviderHealth>;
  listModels?(): Promise<ModelCatalogEntry[]>;
};

export type ProviderRuntimeConfig = {
  apiKey?: string;
  baseUrl?: string;
  maxRetries?: number;
  maxOutputTokensOverride?: number;
  model?: string;
  pythonBin?: string;
  reasoningOverride?: AIReasoningPreference;
  speedOverride?: AISpeedPreference;
  temperatureOverride?: number;
  timeoutMs?: number;
  toneOverride?: string;
  topPOverride?: number;
  transport?: string;
};

export type AICapabilityProfile = {
  language: string;
  maxOutputTokens: number;
  reasoningPreference: AIReasoningPreference;
  schema?: AIJsonSchema;
  speedPreference: AISpeedPreference;
  temperature: number;
  tone: string;
  topP: number;
};
