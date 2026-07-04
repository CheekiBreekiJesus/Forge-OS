export type LogoSearchCandidate = {
  id: string;
  title: string;
  previewUrl: string;
  sourceName: string;
  sourceUrl: string;
};

export type LogoSearchProviderResult =
  | { ok: true; candidates: LogoSearchCandidate[] }
  | { ok: false; reason: "not_configured" | "failed"; message: string };

export type LogoGenerationProviderResult =
  | { ok: true; assetBlob: Blob; mimeType: string; fileName: string; providerLabel: string }
  | { ok: false; reason: "not_configured" | "failed" | "cancelled"; message: string };

export interface LogoSearchProvider {
  readonly id: string;
  isAvailable(): boolean;
  search(input: { customerId?: string; leadId?: string; query?: string }): Promise<LogoSearchProviderResult>;
}

export interface LogoGenerationProvider {
  readonly id: string;
  isAvailable(): boolean;
  generate(input: { brief: string }): Promise<LogoGenerationProviderResult>;
}

export class UnconfiguredLogoSearchProvider implements LogoSearchProvider {
  readonly id = "unconfigured";

  isAvailable(): boolean {
    return false;
  }

  async search(_input: {
    customerId?: string;
    leadId?: string;
    query?: string;
  }): Promise<LogoSearchProviderResult> {
    return { message: "not_configured", ok: false, reason: "not_configured" };
  }
}

export class UnconfiguredLogoGenerationProvider implements LogoGenerationProvider {
  readonly id = "unconfigured";

  isAvailable(): boolean {
    return false;
  }

  async generate(_input: { brief: string }): Promise<LogoGenerationProviderResult> {
    return { message: "not_configured", ok: false, reason: "not_configured" };
  }
}

export class DeterministicMockLogoGenerationProvider implements LogoGenerationProvider {
  readonly id = "deterministic-mock";

  isAvailable(): boolean {
    return process.env.NODE_ENV === "test" || process.env.VITEST === "true";
  }

  async generate(input: { brief: string }): Promise<LogoGenerationProviderResult> {
    const safeBrief = input.brief.slice(0, 40).replace(/[<>&]/g, "");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#ea580c"/>
      <text x="100" y="108" text-anchor="middle" fill="white" font-family="Arial" font-size="16">${safeBrief || "LOGO"}</text>
    </svg>`;
    return {
      assetBlob: new Blob([svg], { type: "image/svg+xml" }),
      fileName: "generated-logo.svg",
      mimeType: "image/svg+xml",
      ok: true,
      providerLabel: "deterministic-mock"
    };
  }
}

export function resolveLogoSearchProvider(): LogoSearchProvider {
  if (process.env.FORGEOS_LOGO_SEARCH_PROVIDER === "mock") {
    return new DeterministicMockLogoSearchProvider();
  }
  return new UnconfiguredLogoSearchProvider();
}

export function resolveLogoGenerationProvider(): LogoGenerationProvider {
  if (process.env.NODE_ENV === "test" || process.env.VITEST === "true") {
    return new DeterministicMockLogoGenerationProvider();
  }
  if (process.env.FORGEOS_LOGO_GENERATION_PROVIDER === "mock") {
    return new DeterministicMockLogoGenerationProvider();
  }
  return new UnconfiguredLogoGenerationProvider();
}

class DeterministicMockLogoSearchProvider implements LogoSearchProvider {
  readonly id = "deterministic-mock-search";

  isAvailable(): boolean {
    return true;
  }

  async search(input: {
    customerId?: string;
    leadId?: string;
    query?: string;
  }): Promise<LogoSearchProviderResult> {
    const label = input.query || input.customerId || "candidate";
    return {
      candidates: [
        {
          id: "mock-1",
          previewUrl: "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect fill="#334155" width="64" height="64"/><text x="32" y="36" text-anchor="middle" fill="#f8fafc" font-size="10">${label}</text></svg>`),
          sourceName: "mock-search",
          sourceUrl: "local://mock",
          title: `Mock result for ${label}`
        }
      ],
      ok: true
    };
  }
}
