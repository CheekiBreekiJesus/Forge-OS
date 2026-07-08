import type { AICapabilityProfile } from "../types";
import { outreachEmailSchema } from "./outreach-email-schema";

export type AIProfileId = "outreach-fast" | "outreach-balanced" | "outreach-quality" | "deterministic";

export const capabilityProfiles: Record<AIProfileId, AICapabilityProfile> = {
  deterministic: {
    language: "pt-PT",
    maxOutputTokens: 700,
    reasoningPreference: "none",
    schema: outreachEmailSchema,
    speedPreference: "fast",
    temperature: 0,
    tone: "professional",
    topP: 1
  },
  "outreach-fast": {
    language: "pt-PT",
    maxOutputTokens: 700,
    reasoningPreference: "low",
    schema: outreachEmailSchema,
    speedPreference: "fast",
    temperature: 0.25,
    tone: "professional",
    topP: 0.9
  },
  "outreach-balanced": {
    language: "pt-PT",
    maxOutputTokens: 900,
    reasoningPreference: "medium",
    schema: outreachEmailSchema,
    speedPreference: "balanced",
    temperature: 0.35,
    tone: "professional",
    topP: 0.9
  },
  "outreach-quality": {
    language: "pt-PT",
    maxOutputTokens: 1100,
    reasoningPreference: "high",
    schema: outreachEmailSchema,
    speedPreference: "quality",
    temperature: 0.4,
    tone: "professional",
    topP: 0.95
  }
};

export function getCapabilityProfile(profileId: string | undefined): AICapabilityProfile {
  return capabilityProfiles[(profileId as AIProfileId) || "outreach-fast"] ?? capabilityProfiles["outreach-fast"];
}
