import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAICompatibleProvider } from "./openai-compatible-provider";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("OpenAI-compatible provider", () => {
  it("uses provider base URL without dropping /v1", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        choices: [{ message: { content: "hello" } }],
        id: "req_1",
        model: "test-model"
      }),
      ok: true
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAICompatibleProvider({
      config: {
        apiKey: "test-key",
        baseUrl: "https://provider.example/v1",
        model: "test-model"
      },
      id: "openai"
    });

    const result = await provider.generateText({ prompt: "Hello" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://provider.example/v1/chat/completions",
      expect.any(Object)
    );
    expect(result.content).toBe("hello");
  });
});
