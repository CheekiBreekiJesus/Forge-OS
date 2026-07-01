export type CopilotPromptKey =
  | "molds"
  | "delayedOrders"
  | "lowStock"
  | "quotations"
  | "campaigns";

export type CopilotResponse = {
  promptKey: CopilotPromptKey;
  answer: string;
  links: Array<{ label: string; href: string }>;
};

const PROMPT_KEYS: CopilotPromptKey[] = [
  "molds",
  "delayedOrders",
  "lowStock",
  "quotations",
  "campaigns"
];

export function getSuggestedPromptKey(index = 0): CopilotPromptKey {
  return PROMPT_KEYS[index % PROMPT_KEYS.length] ?? "molds";
}

export function buildCopilotResponse(
  promptKey: CopilotPromptKey,
  locale: string
): CopilotResponse {
  const prefix = `/${locale}`;
  const responses: Record<CopilotPromptKey, CopilotResponse> = {
    molds: {
      promptKey,
      answer:
        "Preview summary: molds JG-102, JG-118, and JG-204 are scheduled for maintenance within the next 30 days. This response uses demo planning data until live mold records are connected.",
      links: [
        { label: "Open molds preview", href: `${prefix}/molds` },
        { label: "Open maintenance", href: `${prefix}/maintenance` }
      ]
    },
    delayedOrders: {
      promptKey,
      answer:
        "Preview summary: blocked or delayed production orders are listed in Production. Copilot does not execute shop-floor actions yet.",
      links: [{ label: "Open production", href: `${prefix}/production` }]
    },
    lowStock: {
      promptKey,
      answer:
        "Preview summary: inventory items below reorder level appear in Inventory with warning states.",
      links: [{ label: "Open inventory", href: `${prefix}/inventory` }]
    },
    quotations: {
      promptKey,
      answer:
        "Preview summary: open quotations awaiting response can be reviewed in Quotations.",
      links: [{ label: "Open quotations", href: `${prefix}/quotations` }]
    },
    campaigns: {
      promptKey,
      answer:
        "Preview summary: outreach drafts awaiting review are managed in Outreach. Copilot cannot approve campaigns automatically.",
      links: [{ label: "Open outreach", href: `${prefix}/leadops` }]
    }
  };

  return responses[promptKey];
}

export function matchCopilotPrompt(input: string): CopilotPromptKey | null {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes("mold")) return "molds";
  if (normalized.includes("delay") || normalized.includes("atras")) return "delayedOrders";
  if (normalized.includes("stock") || normalized.includes("invent")) return "lowStock";
  if (normalized.includes("quot") || normalized.includes("orç")) return "quotations";
  if (normalized.includes("campaign") || normalized.includes("market")) return "campaigns";
  return null;
}
