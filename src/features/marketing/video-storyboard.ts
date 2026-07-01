import type { MarketingCampaign, VideoProject } from "@/domain/marketing-types";

export function generateDeterministicStoryboard(input: {
  campaign: MarketingCampaign | null;
  durationSeconds: VideoProject["durationSeconds"];
  aspectRatio: VideoProject["aspectRatio"];
}): string[] {
  const name = input.campaign?.name ?? "Marketing campaign";
  const cta = input.campaign?.callToAction || "Request quotation";
  if (input.durationSeconds === 6) {
    return [
      `0-2s: Product close-up for ${name}.`,
      `2-4s: One clear benefit and brand colour frame.`,
      `4-6s: CTA frame: ${cta}.`
    ];
  }
  if (input.durationSeconds === 15) {
    return [
      `0-3s: Open with product/application context for ${name}.`,
      "3-7s: Show product detail and manufacturing credibility.",
      "7-11s: Add audience-specific problem/solution line.",
      `11-15s: End card with CTA: ${cta}.`
    ];
  }
  return [
    `0-5s: Establish audience and product context for ${name}.`,
    "5-12s: Show product variations, use cases, and brand styling.",
    "12-20s: Explain offer and landing page action without pricing claims.",
    "20-26s: Reinforce approved claim or company capability.",
    `26-30s: CTA end card: ${cta}.`
  ];
}
