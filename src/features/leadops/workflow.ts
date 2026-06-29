import type {
  LeadOpsActivity,
  LeadOpsCampaign,
  LeadOpsCompanyContext,
  LeadOpsGeneratedMessage,
  LeadOpsLead,
  LeadOpsProductKey,
  LeadOpsProductRecommendation,
  LeadOpsQueueValidation,
  LeadOpsSequenceStep,
  LeadOpsTone,
  LeadOpsWorkflowState
} from "./types";

export const leadOpsProductCatalog: Record<LeadOpsProductKey, { label: string; ptLabel: string }> = {
  "customized-plastic-cups": {
    label: "Customized plastic cups",
    ptLabel: "copos de plástico personalizados"
  },
  "customized-paper-cups": {
    label: "Customized paper cups",
    ptLabel: "copos de papel personalizados"
  },
  "paper-cups": {
    label: "Paper cups",
    ptLabel: "copos de papel"
  },
  "biodegradable-cutlery": {
    label: "Biodegradable cutlery",
    ptLabel: "talheres biodegradáveis"
  },
  "disposable-food-service": {
    label: "Disposable food-service products",
    ptLabel: "descartáveis para food-service"
  },
  "packaging-products": {
    label: "Packaging-related products",
    ptLabel: "soluções de embalagem"
  }
};

const fixedNow = "2026-06-29T10:00:00.000Z";

export function getCompanyContext(lead: LeadOpsLead): LeadOpsCompanyContext {
  if (!lead.website) {
    return {
      hasWebsiteContext: false,
      personalizationNotes: [
        "Nao existe website disponivel no lead demo; a mensagem evita alegar revisao do site."
      ],
      summary:
        "Contexto limitado aos campos importados: setor, localizacao, origem e historico de campanha."
    };
  }

  return {
    hasWebsiteContext: true,
    personalizationNotes: [
      `Contexto demo baseado no website registado: ${lead.website}.`,
      `Localização útil para personalizar abertura: ${lead.location}.`
    ],
    summary: buildContextSummary(lead)
  };
}

export function recommendProductsForLead(lead: LeadOpsLead): LeadOpsProductRecommendation[] {
  const industry = lead.industry.toLowerCase();
  const keys: LeadOpsProductKey[] = industry.includes("hospitality")
    ? ["customized-plastic-cups", "customized-paper-cups", "packaging-products"]
    : industry.includes("event")
      ? ["customized-plastic-cups", "paper-cups", "disposable-food-service"]
      : industry.includes("food")
        ? ["customized-paper-cups", "paper-cups", "biodegradable-cutlery", "disposable-food-service"]
        : industry.includes("packaging")
          ? ["packaging-products", "biodegradable-cutlery", "disposable-food-service"]
          : ["paper-cups", "disposable-food-service", "packaging-products"];

  return keys.map((key) => ({
    key,
    label: leadOpsProductCatalog[key].label,
    reason: recommendationReason(key, lead.industry)
  }));
}

export function generatePtPtEmail({
  campaign,
  context,
  lead,
  productKeys,
  tone
}: {
  campaign: LeadOpsCampaign;
  context: LeadOpsCompanyContext;
  lead: LeadOpsLead;
  productKeys: LeadOpsProductKey[];
  tone: LeadOpsTone;
}): LeadOpsGeneratedMessage {
  const products = productKeys.length
    ? productKeys.map((key) => leadOpsProductCatalog[key].ptLabel)
    : recommendProductsForLead(lead).map((item) => leadOpsProductCatalog[item.key].ptLabel);
  const hasCupProduct = productKeys.some((key) => key.includes("cups"));
  const greeting = tone === "direct" ? "Bom dia" : `Bom dia ${lead.contactName.split(" ")[0]}`;
  const contextSentence = context.hasWebsiteContext
    ? `Vi o contexto da ${lead.companyName} associado a ${lead.industry.toLowerCase()} em ${lead.location}, e pareceu-me haver potencial para consumíveis personalizados.`
    : `Estou a contactar porque a ${lead.companyName} aparece na nossa base demo como potencial cliente em ${lead.industry.toLowerCase()} na zona de ${lead.location}.`;
  const toneSentence =
    tone === "friendly"
      ? "A ideia seria perceber, sem compromisso, se há espaço para apoiar próximas encomendas."
      : tone === "direct"
        ? "O objetivo é perceber rapidamente se faz sentido preparar uma proposta simples."
        : "Gostaria de perceber se podemos ser úteis em próximas necessidades de compra.";
  const cupSentence = hasCupProduct
    ? "Para copos personalizados, a JH Gomes é competitiva em séries abaixo de cerca de 100.000 unidades, e estamos a preparar uma experiência futura de visualização e orçamento mais rápida."
    : "Também podemos apoiar a preparação de embalagens e descartáveis ajustados ao tipo de utilização.";

  const bodyLines = [
    `${greeting},`,
    "",
    contextSentence,
    `Na JH Gomes podemos ajudar com ${formatPortugueseList(products)}.`,
    cupSentence,
    toneSentence,
    ...(campaign.status !== "active"
      ? ["Como a campanha está em modo demo, esta mensagem fica apenas em simulação."]
      : []),
    "Faria sentido enviar-lhe algumas opções e uma estimativa para as quantidades que costumam utilizar?",
    "",
    "Obrigado,"
  ];

  return {
    approved: false,
    body: bodyLines.join("\n"),
    edited: false,
    generationMethod: "deterministic-template",
    subject: `Opções JH Gomes para ${lead.companyName}`
  };
}

export function buildSequencePreview(message: LeadOpsGeneratedMessage | null): LeadOpsSequenceStep[] {
  const initial = message?.body || "A mensagem inicial aparece aqui depois de ser gerada.";

  return [
    {
      delay: "Dia 0",
      id: "initial",
      preview: initial,
      title: "Email inicial"
    },
    {
      delay: "+3 dias",
      id: "follow-up-1",
      preview:
        "Seguimento curto a confirmar se faz sentido enviar opcoes de produto e estimativa de quantidades.",
      title: "Follow-up 1"
    },
    {
      delay: "+7 dias",
      id: "follow-up-2",
      preview:
        "Ultima nota de baixa pressao, oferecendo manter o contacto para futuras necessidades.",
      title: "Follow-up 2"
    }
  ];
}

export function validateQueue(state: LeadOpsWorkflowState): LeadOpsQueueValidation {
  if (!state.lead.email) {
    return { message: "O lead nao tem email valido para fila.", ok: false, reason: "missing-email" };
  }

  if (state.lead.consentStatus === "unsubscribed") {
    return { message: "Lead removido/subscricao cancelada; envio bloqueado.", ok: false, reason: "unsubscribed" };
  }

  if (state.lead.status === "bounced") {
    return { message: "Lead com bounce; requer limpeza manual antes de nova fila.", ok: false, reason: "bounced" };
  }

  if (!state.message?.subject || !state.message.body) {
    return { message: "Gere e preencha a mensagem antes de colocar em fila.", ok: false, reason: "missing-email" };
  }

  if (!state.message.approved) {
    return { message: "A mensagem precisa de aprovacao antes de entrar em fila.", ok: false, reason: "unapproved" };
  }

  return { message: "Mensagem pronta para fila demo.", ok: true, reason: "ok" };
}

export function queueApprovedMessage(state: LeadOpsWorkflowState): LeadOpsWorkflowState {
  const validation = validateQueue(state);

  if (!validation.ok) {
    return {
      ...state,
      providerState: "blocked"
    };
  }

  return {
    ...state,
    activities: appendEvent(state.activities, state.lead, "message-queued"),
    lead: {
      ...state.lead,
      status: "queued",
      providerState: "queued"
    },
    providerState: "queued",
    queuedAt: fixedNow
  };
}

export function simulateSend(state: LeadOpsWorkflowState): LeadOpsWorkflowState {
  if (state.providerState !== "queued" || !state.campaign) {
    return state;
  }

  const updatedCampaign = state.metricsUpdated
    ? state.campaign
    : {
        ...state.campaign,
        sentCount: state.campaign.sentCount + 1
      };
  const nextActivities = state.metricsUpdated
    ? appendEvent(state.activities, state.lead, "message-sent")
    : appendEvent(
        appendEvent(state.activities, state.lead, "message-sent"),
        state.lead,
        "metrics-updated"
      );

  return {
    ...state,
    activities: nextActivities,
    campaign: updatedCampaign,
    lead: {
      ...state.lead,
      status: "contacted",
      providerState: "sent"
    },
    metricsUpdated: true,
    providerState: "sent",
    sentAt: fixedNow
  };
}

export function appendEvent(
  activities: LeadOpsActivity[],
  lead: LeadOpsLead,
  kind: LeadOpsActivity["kind"]
): LeadOpsActivity[] {
  return [
    ...activities,
    {
      companyName: lead.companyName,
      id: `audit_${activities.length + 1}_${kind}`,
      kind,
      occurredAt: fixedNow,
      tenantId: lead.tenantId
    }
  ];
}

export function markMessageEdited(message: LeadOpsGeneratedMessage): LeadOpsGeneratedMessage {
  return {
    ...message,
    approved: false,
    edited: true
  };
}

function buildContextSummary(lead: LeadOpsLead): string {
  if (lead.industry === "Hospitality") {
    return "Empresa ligada a hotelaria/restauração, com potencial para copos personalizados e consumíveis de serviço.";
  }

  if (lead.industry === "Events") {
    return "Operação orientada a eventos, onde copos personalizados e descartáveis podem apoiar equipas e patrocinadores.";
  }

  if (lead.industry === "Food & Beverage") {
    return "Negócio alimentar com uso provável de copos, embalagens e consumíveis para serviço diário.";
  }

  return "Empresa com potencial de compra B2B para produtos descartáveis, embalagens ou personalização.";
}

function recommendationReason(key: LeadOpsProductKey, industry: string): string {
  if (key.includes("cups")) {
    return `Relevante para ${industry} quando há bebidas, eventos, take-away ou marca própria.`;
  }

  if (key === "biodegradable-cutlery") {
    return "Opção útil para serviço alimentar com preocupação ambiental.";
  }

  if (key === "packaging-products") {
    return "Complementa preparação de encomendas, take-away e kits de cliente.";
  }

  return "Adequado para operações com consumo regular de descartáveis.";
}

function formatPortugueseList(items: string[]): string {
  if (items.length <= 1) {
    return items[0] ?? "produtos selecionados";
  }

  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}
