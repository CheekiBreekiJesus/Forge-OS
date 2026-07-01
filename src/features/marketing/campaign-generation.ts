import type {
  BrandKit,
  CampaignContentVariant,
  MarketingCampaign,
  MarketingCampaignGenerationResult,
  MarketingChannel,
  MarketingAudience
} from "@/domain/marketing-types";
import type { Product } from "@/domain/product-types";

export function generateMarketingCampaignContent(input: {
  brandKit: BrandKit | null;
  campaign: MarketingCampaign;
  products: Product[];
  audiences: MarketingAudience[];
  language: "pt-PT" | "en";
}): MarketingCampaignGenerationResult {
  const productNames = input.products.map((product) => product.name).join(", ") || "selected products";
  const audienceNames = input.audiences.map((audience) => audience.name).join(", ") || "industrial buyers";
  const tone = input.brandKit?.toneOfVoice || "clear, practical and trustworthy";
  const cta = input.campaign.callToAction || (input.language === "pt-PT" ? "Pedir orçamento" : "Request quotation");
  const concept =
    input.language === "pt-PT"
      ? `Campanha prática para apresentar ${productNames} a ${audienceNames}, com tom ${tone}.`
      : `Practical campaign presenting ${productNames} to ${audienceNames}, using a ${tone} tone.`;
  const channelRecommendations = input.campaign.channels.length
    ? input.campaign.channels
    : (["email", "cold_outreach", "website_banner"] satisfies MarketingChannel[]);

  return {
    assumptions: [
      "Uses only selected products, selected audiences, Brand Kit claims, and campaign fields.",
      "No prices, discounts, delivery guarantees, certifications, or customer names were invented."
    ],
    campaignAngle:
      input.language === "pt-PT"
        ? "Reduzir fricção no pedido de orçamento e mostrar aplicação prática do produto."
        : "Reduce quotation friction and show the product in a practical use case.",
    campaignConcept: concept,
    callToActionVariants: [cta, input.language === "pt-PT" ? "Falar com a equipa" : "Talk to the team"],
    channelRecommendations,
    descriptionVariants:
      input.language === "pt-PT"
        ? [
            `Mostre a sua marca com ${productNames}.`,
            "Campanha local preparada para revisão antes de qualquer publicação."
          ]
        : [
            `Show your brand with ${productNames}.`,
            "Local campaign prepared for review before any publishing."
          ],
    fallbackUsed: true,
    headlineVariants:
      input.language === "pt-PT"
        ? [`${productNames} para a sua próxima campanha`, "Produtos personalizados, sem publicação automática"]
        : [`${productNames} for your next campaign`, "Personalized products, no automatic publishing"],
    imageBrief:
      input.language === "pt-PT"
        ? `Imagem de produto limpa para ${productNames}, com fundo neutro e espaço para CTA.`
        : `Clean product image for ${productNames}, neutral background, space for CTA.`,
    model: "deterministic-marketing-template",
    provider: "deterministic",
    targetAudienceSummary: audienceNames,
    warnings: ["Deterministic local generation used. No paid AI provider was called."]
  };
}

export function variantsFromGeneration(input: {
  campaign: MarketingCampaign;
  result: MarketingCampaignGenerationResult;
  language: "pt-PT" | "en";
}): Array<Omit<CampaignContentVariant, "id" | "tenantId" | "createdAt" | "updatedAt">> {
  return input.campaign.channels.slice(0, 3).map((channel, index) => ({
    approvalStatus: "pending_review",
    assetIds: [],
    body: input.result.descriptionVariants[index % input.result.descriptionVariants.length],
    callToAction: input.result.callToActionVariants[0] ?? input.campaign.callToAction,
    campaignId: input.campaign.id,
    channel,
    description: input.result.campaignAngle,
    generatedAt: new Date().toISOString(),
    headline: input.result.headlineVariants[index % input.result.headlineVariants.length],
    language: input.language,
    model: input.result.model,
    provider: input.result.provider,
    secondaryHeadline: input.result.targetAudienceSummary,
    selected: index === 0,
    userEdited: false
  }));
}
