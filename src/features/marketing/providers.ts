import type {
  AdvertisingProviderId,
  ImageGenerationRequest,
  ImageGenerationResult,
  ProviderDiagnostic
} from "@/domain/marketing-types";

export interface ImageGenerationProvider {
  id: string;
  validateConfiguration(): Promise<ProviderDiagnostic>;
  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
  transformImage(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
}

export interface AdvertisingProvider {
  id: AdvertisingProviderId;
  validateConfiguration(): Promise<ProviderDiagnostic>;
  listAccounts(): Promise<Array<{ id: string; displayName: string }>>;
  createCampaignDraft(request: Record<string, unknown>): Promise<{
    provider: AdvertisingProviderId;
    enabled: false;
    reason: string;
    payload: Record<string, unknown>;
  }>;
  uploadAsset(request: Record<string, unknown>): Promise<{
    provider: AdvertisingProviderId;
    enabled: false;
    reason: string;
    payload: Record<string, unknown>;
  }>;
  fetchMetrics(): Promise<{ provider: AdvertisingProviderId; metricsConnected: false }>;
}

export class MockImageGenerationProvider implements ImageGenerationProvider {
  readonly id = "mock-image";

  async validateConfiguration(): Promise<ProviderDiagnostic> {
    return {
      capabilities: ["mock_generation", "mock_transformation", "background_removal_preview"],
      configured: true,
      message: "Local deterministic preview provider is active. No paid image generation will run.",
      providerId: this.id,
      status: "ok"
    };
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    return this.createResult(request);
  }

  async transformImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    return this.createResult(request);
  }

  private createResult(request: ImageGenerationRequest): ImageGenerationResult {
    const { width, height } = resolvePresetDimensions(request.aspectRatio);
    const safePrompt = escapeSvg(request.prompt || "ForgeOS Marketing Studio mock image");
    const safeTransform = escapeSvg(request.transformationType.replaceAll("_", " "));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="ForgeOS mock marketing image">
  <rect width="${width}" height="${height}" fill="#0f172a"/>
  <rect x="32" y="32" width="${width - 64}" height="${height - 64}" rx="24" fill="#111827" stroke="#334155"/>
  <circle cx="${Math.round(width * 0.78)}" cy="${Math.round(height * 0.24)}" r="${Math.round(Math.min(width, height) * 0.11)}" fill="#f97316" opacity="0.88"/>
  <rect x="${Math.round(width * 0.16)}" y="${Math.round(height * 0.28)}" width="${Math.round(width * 0.42)}" height="${Math.round(height * 0.32)}" rx="18" fill="#e2e8f0"/>
  <text x="56" y="${height - 116}" fill="#f8fafc" font-family="Arial, sans-serif" font-size="28" font-weight="700">ForgeOS Marketing Studio</text>
  <text x="56" y="${height - 78}" fill="#fdba74" font-family="Arial, sans-serif" font-size="18">${safeTransform}</text>
  <text x="56" y="${height - 46}" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="14">${safePrompt.slice(0, 110)}</text>
</svg>`;
    return {
      blob: new Blob([svg], { type: "image/svg+xml" }),
      mimeType: "image/svg+xml",
      model: "deterministic-svg-v1",
      outputAssetType: "product-image",
      prompt: request.prompt,
      providerId: this.id,
      height,
      warnings: [
        "Mock image generated locally.",
        request.transformationType === "background_removal"
          ? "Background removal is represented as a preview only until a live provider is configured."
          : "No paid provider was called."
      ],
      width
    };
  }
}

export class MockAdvertisingProvider implements AdvertisingProvider {
  constructor(readonly id: AdvertisingProviderId) {}

  async validateConfiguration(): Promise<ProviderDiagnostic> {
    return {
      capabilities: ["payload_preview", "account_status", "disabled_publishing"],
      configured: false,
      message:
        this.id === "google_ads"
          ? "Google Ads is not connected. Draft payload preview is available locally."
          : "Meta Ads is not connected. Draft payload preview is available locally.",
      providerId: this.id,
      status: "not_configured"
    };
  }

  async listAccounts(): Promise<Array<{ id: string; displayName: string }>> {
    return [];
  }

  async createCampaignDraft(request: Record<string, unknown>) {
    return {
      enabled: false as const,
      payload: request,
      provider: this.id,
      reason: "Live publishing is disabled until OAuth, permissions, billing safeguards, and test accounts are configured."
    };
  }

  async uploadAsset(request: Record<string, unknown>) {
    return {
      enabled: false as const,
      payload: request,
      provider: this.id,
      reason: "Asset upload is preview-only in the local Marketing Studio foundation."
    };
  }

  async fetchMetrics() {
    return { metricsConnected: false as const, provider: this.id };
  }
}

export function createImageProviderRegistry() {
  const mock = new MockImageGenerationProvider();
  return {
    get(id = mock.id): ImageGenerationProvider {
      void id;
      return mock;
    },
    ids(): string[] {
      return [mock.id];
    }
  };
}

export function createAdvertisingProviderRegistry() {
  const providers = {
    google_ads: new MockAdvertisingProvider("google_ads"),
    meta_ads: new MockAdvertisingProvider("meta_ads")
  };
  return {
    get(id: AdvertisingProviderId): AdvertisingProvider {
      return providers[id];
    },
    ids(): AdvertisingProviderId[] {
      return ["google_ads", "meta_ads"];
    }
  };
}

export function resolvePresetDimensions(aspectRatio: ImageGenerationRequest["aspectRatio"]) {
  const dimensions: Record<ImageGenerationRequest["aspectRatio"], { width: number; height: number }> = {
    "1:1": { height: 1080, width: 1080 },
    "1.91:1": { height: 628, width: 1200 },
    "16:9": { height: 900, width: 1600 },
    "4:5": { height: 1350, width: 1080 },
    "9:16": { height: 1920, width: 1080 },
    email_banner: { height: 600, width: 1200 },
    transparent_product: { height: 1200, width: 1200 },
    website_hero: { height: 900, width: 1600 }
  };
  return dimensions[aspectRatio];
}

function escapeSvg(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
