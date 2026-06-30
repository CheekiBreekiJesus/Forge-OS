import type { AIJsonSchema } from "../types";

export type OutreachEmailStructuredOutput = {
  body: string;
  contextUsed: string[];
  subject: string;
};

export const outreachEmailSchema: AIJsonSchema = {
  additionalProperties: false,
  properties: {
    body: { type: "string" },
    contextUsed: {
      items: { type: "string" },
      type: "array"
    },
    subject: { type: "string" }
  },
  required: ["subject", "body", "contextUsed"],
  type: "object"
};

export function validateOutreachEmailOutput(
  value: unknown
): OutreachEmailStructuredOutput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (
    typeof record.subject !== "string" ||
    record.subject.trim().length < 4 ||
    typeof record.body !== "string" ||
    record.body.trim().length < 20 ||
    !Array.isArray(record.contextUsed) ||
    !record.contextUsed.every((item) => typeof item === "string")
  ) {
    return null;
  }

  return {
    body: record.body.trim(),
    contextUsed: record.contextUsed.map((item) => item.trim()).filter(Boolean),
    subject: record.subject.trim()
  };
}
