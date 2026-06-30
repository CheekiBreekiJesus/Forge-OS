import { AIProviderError, normalizeHttpError } from "../errors";
import type {
  AIJsonSchema,
  AIProviderId,
  GenerateStructuredRequest,
  GenerateStructuredResult,
  GenerateTextRequest,
  GenerateTextResult,
  ProviderRuntimeConfig
} from "../types";

export function nowMs(): number {
  return Date.now();
}

export function elapsed(start: number): number {
  return Date.now() - start;
}

export function extractJsonObject(content: string): unknown {
  const trimmed = content.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export function toStructuredResult<T>(
  request: GenerateStructuredRequest<T>,
  result: GenerateTextResult
): GenerateStructuredResult<T> {
  const parsed = request.validate(extractJsonObject(result.content));

  if (!parsed) {
    throw new AIProviderError({
      code: "invalid_response",
      message: "Provider returned malformed structured output.",
      provider: result.provider
    });
  }

  return {
    ...result,
    parsed
  };
}

export function buildOpenAICompatiblePayload(
  request: GenerateTextRequest | GenerateStructuredRequest<unknown>,
  schema?: AIJsonSchema
) {
  const messages = [
    ...(request.system ? [{ content: request.system, role: "system" }] : []),
    ...(request.messages?.map((message) => ({
      content: message.content,
      role: message.role
    })) ?? []),
    { content: request.prompt, role: "user" }
  ];

  return {
    max_tokens: request.maxOutputTokens,
    messages,
    model: request.model,
    response_format: schema
      ? {
          json_schema: {
            name: "forgeos_structured_output",
            schema
          },
          type: "json_schema"
        }
      : undefined,
    stop: request.stopSequences,
    temperature: request.temperature,
    top_p: request.topP
  };
}

export async function postOpenAICompatible({
  config,
  payload,
  provider,
  request
}: {
  config: ProviderRuntimeConfig;
  payload: unknown;
  provider: AIProviderId;
  request: GenerateTextRequest;
}): Promise<GenerateTextResult> {
  const start = nowMs();

  if (!config.baseUrl || !config.model) {
    throw new AIProviderError({
      code: "configuration_error",
      message: "Provider base URL or model is missing.",
      provider
    });
  }

  if (!config.apiKey && provider !== "lmstudio" && provider !== "vllm") {
    throw new AIProviderError({
      code: "configuration_error",
      message: "Provider API key is missing.",
      provider
    });
  }

  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    body: JSON.stringify({
      ...(payload as object),
      model: request.model ?? config.model
    }),
    headers: {
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      "Content-Type": "application/json"
    },
    method: "POST",
    signal: request.abortSignal
  });

  if (!response.ok) {
    throw normalizeHttpError(provider, response.status);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    id?: string;
    model?: string;
    usage?: {
      completion_tokens?: number;
      prompt_tokens?: number;
      total_tokens?: number;
    };
  };
  const content = json.choices?.[0]?.message?.content;

  if (!content) {
    throw new AIProviderError({
      code: "invalid_response",
      message: "Provider returned an empty response.",
      provider
    });
  }

  return {
    content,
    fallbackUsed: false,
    latencyMs: elapsed(start),
    model: json.model ?? request.model ?? config.model,
    provider,
    requestId: json.id,
    retryCount: 0,
    usage: json.usage
      ? {
          inputTokens: json.usage.prompt_tokens,
          outputTokens: json.usage.completion_tokens,
          totalTokens: json.usage.total_tokens
        }
      : undefined,
    warnings: []
  };
}
