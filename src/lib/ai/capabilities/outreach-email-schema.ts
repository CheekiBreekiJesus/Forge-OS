import type { AIJsonSchema } from "../types";

export type OutreachEmailStructuredOutput = {
  subject: string;
  preheader?: string;
  greeting: string;
  introduction: string;
  offerBody: string;
  callToAction: string;
  contextUsed: string[];
};

export const outreachEmailSchema: AIJsonSchema = {
  additionalProperties: false,
  properties: {
    callToAction: { type: "string" },
    contextUsed: {
      items: { type: "string" },
      type: "array"
    },
    greeting: { type: "string" },
    introduction: { type: "string" },
    offerBody: { type: "string" },
    preheader: { type: "string" },
    subject: { type: "string" }
  },
  required: ["subject", "greeting", "introduction", "offerBody", "callToAction", "contextUsed"],
  type: "object"
};

export function validateOutreachEmailOutput(
  value: unknown
): OutreachEmailStructuredOutput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  const requiredStrings = ["subject", "greeting", "introduction", "offerBody", "callToAction"] as const;
  for (const key of requiredStrings) {
    if (typeof record[key] !== "string" || (record[key] as string).trim().length < 2) {
      return null;
    }
  }

  if (
    typeof record.subject !== "string" ||
    record.subject.trim().length < 4 ||
    !Array.isArray(record.contextUsed) ||
    !record.contextUsed.every((item) => typeof item === "string")
  ) {
    return null;
  }

  return {
    callToAction: (record.callToAction as string).trim(),
    contextUsed: record.contextUsed.map((item) => (item as string).trim()).filter(Boolean),
    greeting: (record.greeting as string).trim(),
    introduction: (record.introduction as string).trim(),
    offerBody: (record.offerBody as string).trim(),
    preheader: typeof record.preheader === "string" ? record.preheader.trim() : undefined,
    subject: (record.subject as string).trim()
  };
}

/** Legacy body-only output for backward-compatible deterministic fallback parsing. */
export function parseLegacyBodyOutput(body: string, subject: string): OutreachEmailStructuredOutput {
  const paragraphs = body.split(/\n{2,}/).filter(Boolean);
  return {
    callToAction: paragraphs[paragraphs.length - 1] ?? "Podemos agendar uma breve conversa?",
    contextUsed: ["deterministic template"],
    greeting: paragraphs[0] ?? "Olá,",
    introduction: paragraphs[1] ?? "",
    offerBody: paragraphs.slice(2, -1).join("\n\n") || paragraphs[1] || "",
    subject
  };
}
