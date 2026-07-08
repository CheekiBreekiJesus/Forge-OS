import type {
  AIProvider,
  GenerateStructuredRequest,
  GenerateStructuredResult,
  GenerateTextRequest,
  GenerateTextResult
} from "../types";
import { elapsed, nowMs, toStructuredResult } from "./provider-utils";

export class DeterministicProvider implements AIProvider {
  readonly id = "deterministic" as const;

  async generateText(request: GenerateTextRequest): Promise<GenerateTextResult> {
    const start = nowMs();

    return {
      content: request.prompt,
      fallbackUsed: true,
      latencyMs: elapsed(start),
      model: "deterministic-template",
      provider: this.id,
      retryCount: 0,
      warnings: ["Deterministic fallback used."]
    };
  }

  async generateStructured<T>(
    request: GenerateStructuredRequest<T>
  ): Promise<GenerateStructuredResult<T>> {
    return toStructuredResult(request, await this.generateText(request));
  }
}
