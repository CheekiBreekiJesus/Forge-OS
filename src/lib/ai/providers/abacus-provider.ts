import { spawn } from "node:child_process";
import path from "node:path";
import { AIProviderError } from "../errors";
import { resolvePythonBin } from "../python";
import type {
  AIProvider,
  AIJsonSchema,
  GenerateStructuredRequest,
  GenerateStructuredResult,
  GenerateTextRequest,
  GenerateTextResult,
  ProviderRuntimeConfig
} from "../types";
import { elapsed, nowMs } from "./provider-utils";

export class AbacusProvider implements AIProvider {
  readonly id = "abacus" as const;
  private readonly config: ProviderRuntimeConfig;

  constructor(config: ProviderRuntimeConfig) {
    this.config = config;
  }

  async generateText(request: GenerateTextRequest): Promise<GenerateTextResult> {
    const structured = await this.callBridge<string>({
      ...request,
      schema: undefined,
      validate: (value) => (typeof value === "string" ? value : null)
    });

    return {
      ...structured,
      content: structured.content
    };
  }

  async generateStructured<T>(
    request: GenerateStructuredRequest<T>
  ): Promise<GenerateStructuredResult<T>> {
    return this.callBridge(request);
  }

  private async callBridge<T>(
    request: GenerateTextRequest & {
      schema?: AIJsonSchema;
      validate: (value: unknown) => T | null;
    }
  ): Promise<GenerateStructuredResult<T>> {
    const start = nowMs();

    if (!this.config.apiKey) {
      throw new AIProviderError({
        code: "configuration_error",
        message: "Abacus API key is missing.",
        provider: this.id
      });
    }

    if (!this.config.model) {
      throw new AIProviderError({
        code: "configuration_error",
        message: "Abacus model is missing.",
        provider: this.id
      });
    }

    const bridgePath = path.join(process.cwd(), "scripts", "ai", "abacus_bridge.py");
    const childInput = JSON.stringify({
      api_key: this.config.apiKey,
      json_response_schema: request.schema,
      llm_name: request.model ?? this.config.model,
      max_tokens: request.maxOutputTokens,
      messages: request.messages,
      prompt: request.prompt,
      response_type: request.schema ? "json" : "text",
      stop_sequences: request.stopSequences,
      system_message: request.system,
      temperature: request.temperature,
      top_p: request.topP
    });

    try {
      const stdout = await runBridge(
        resolvePythonBin(this.config.pythonBin),
        bridgePath,
        childInput,
        this.config.timeoutMs ?? request.timeoutMs ?? 45000
      );
      const payload = JSON.parse(stdout) as {
        content?: string;
        error?: { code?: string; message?: string };
        model?: string;
        parsed?: unknown;
        request_id?: string;
        usage?: {
          input_tokens?: number;
          output_tokens?: number;
          total_tokens?: number;
        };
      };

      if (payload.error) {
        throw new AIProviderError({
          code: normalizeBridgeCode(payload.error.code),
          message: payload.error.message || "Abacus provider failed.",
          provider: this.id
        });
      }

      const raw = payload.parsed ?? payload.content;
      const parsed = request.schema ? request.validate(raw) : request.validate(payload.content);

      if (!parsed || !payload.content) {
        throw new AIProviderError({
          code: "invalid_response",
          message: "Abacus returned malformed structured output.",
          provider: this.id
        });
      }

      return {
        content: payload.content,
        fallbackUsed: false,
        latencyMs: elapsed(start),
        model: payload.model ?? request.model ?? this.config.model,
        parsed,
        provider: this.id,
        requestId: payload.request_id,
        retryCount: 0,
        usage: payload.usage
          ? {
              inputTokens: payload.usage.input_tokens,
              outputTokens: payload.usage.output_tokens,
              totalTokens: payload.usage.total_tokens
            }
          : undefined,
        warnings: []
      };
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : "Abacus bridge failed.";
      throw new AIProviderError({
        code: message.includes("timed out") ? "timeout" : "runtime_dependency_missing",
        message: "Abacus Python bridge failed.",
        provider: this.id
      });
    }
  }
}

function runBridge(
  pythonBin: string,
  bridgePath: string,
  childInput: string,
  timeoutMs: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(pythonBin, [bridgePath], {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true
    });
    const chunks: Buffer[] = [];
    const errorChunks: Buffer[] = [];
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("Abacus bridge timed out."));
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => errorChunks.push(chunk));
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(Buffer.concat(chunks).toString("utf8"));
        return;
      }

      const stderr = Buffer.concat(errorChunks).toString("utf8").trim();
      reject(new Error(stderr || `Abacus bridge exited with code ${code ?? "unknown"}.`));
    });

    child.stdin.end(childInput);
  });
}

function normalizeBridgeCode(code: string | undefined): AIProviderError["code"] {
  if (
    code === "authentication_error" ||
    code === "model_not_found" ||
    code === "invalid_response" ||
    code === "runtime_dependency_missing" ||
    code === "timeout" ||
    code === "insufficient_credits"
  ) {
    return code;
  }

  return "unknown_provider_error";
}
