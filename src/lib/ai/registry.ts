import { getAIConfig, getProviderConfig, type AIAppConfig } from "./config";
import { AbacusProvider } from "./providers/abacus-provider";
import { DeterministicProvider } from "./providers/deterministic-provider";
import { OllamaProvider } from "./providers/ollama-provider";
import { OpenAICompatibleProvider } from "./providers/openai-compatible-provider";
import type { AIProvider, AIProviderId } from "./types";

export function createAIProviderRegistry(config: AIAppConfig = getAIConfig()) {
  const deterministic = new DeterministicProvider();
  const registry: Record<AIProviderId, AIProvider> = {
    abacus: new AbacusProvider(getProviderConfig(config, "abacus")),
    anthropic: new OpenAICompatibleProvider({
      config: getProviderConfig(config, "anthropic"),
      id: "anthropic",
      supportsModelListing: false
    }),
    deepseek: new OpenAICompatibleProvider({
      config: getProviderConfig(config, "deepseek"),
      id: "deepseek"
    }),
    deterministic,
    google: new OpenAICompatibleProvider({
      config: getProviderConfig(config, "google"),
      id: "google",
      supportsModelListing: false
    }),
    groq: new OpenAICompatibleProvider({
      config: getProviderConfig(config, "groq"),
      id: "groq"
    }),
    lmstudio: new OpenAICompatibleProvider({
      config: getProviderConfig(config, "lmstudio"),
      id: "lmstudio"
    }),
    mistral: new OpenAICompatibleProvider({
      config: getProviderConfig(config, "mistral"),
      id: "mistral"
    }),
    ollama: new OllamaProvider(getProviderConfig(config, "ollama")),
    openai: new OpenAICompatibleProvider({
      config: getProviderConfig(config, "openai"),
      id: "openai"
    }),
    openrouter: new OpenAICompatibleProvider({
      config: getProviderConfig(config, "openrouter"),
      id: "openrouter"
    }),
    together: new OpenAICompatibleProvider({
      config: getProviderConfig(config, "together"),
      id: "together"
    }),
    vllm: new OpenAICompatibleProvider({
      config: getProviderConfig(config, "vllm"),
      id: "vllm"
    }),
    xai: new OpenAICompatibleProvider({
      config: getProviderConfig(config, "xai"),
      id: "xai"
    })
  };

  return {
    get(providerId: AIProviderId): AIProvider {
      return registry[providerId] ?? deterministic;
    },
    ids(): AIProviderId[] {
      return Object.keys(registry) as AIProviderId[];
    }
  };
}
