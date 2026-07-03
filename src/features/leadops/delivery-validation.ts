import type { LeadOpsQueueValidation, LeadOpsWorkflowState } from "./types";

export type DeliveryBlockReason = LeadOpsQueueValidation["reason"];

export function validateOutreachDelivery(state: LeadOpsWorkflowState): LeadOpsQueueValidation {
  if (state.providerState === "sent" || state.sentAt) {
    return {
      message: "Mensagem já enviada; envio duplicado bloqueado.",
      ok: false,
      reason: "already-sent"
    };
  }

  if (!state.lead.email?.trim()) {
    return { message: "O lead não tem email válido para envio.", ok: false, reason: "missing-email" };
  }

  if (!state.campaign) {
    return {
      message: "Associe a mensagem a uma campanha antes de enviar.",
      ok: false,
      reason: "missing-campaign"
    };
  }

  if (state.campaign.tenantId !== state.lead.tenantId) {
    return {
      message: "Campanha e lead pertencem a tenants diferentes.",
      ok: false,
      reason: "missing-campaign"
    };
  }

  if (state.lead.consentStatus === "unsubscribed") {
    return { message: "Lead removido/subscrição cancelada; envio bloqueado.", ok: false, reason: "unsubscribed" };
  }

  if (state.lead.status === "bounced") {
    return {
      message: "Lead com bounce; requer limpeza manual antes de novo envio.",
      ok: false,
      reason: "bounced"
    };
  }

  if (!state.message?.subject?.trim() || !state.message.body?.trim()) {
    return {
      message: "Gere e preencha a mensagem antes de enviar.",
      ok: false,
      reason: "missing-message"
    };
  }

  if (!state.message.approved) {
    return {
      message: "A mensagem precisa de aprovação antes do envio.",
      ok: false,
      reason: "unapproved"
    };
  }

  return { message: "Mensagem pronta para envio.", ok: true, reason: "ok" };
}
