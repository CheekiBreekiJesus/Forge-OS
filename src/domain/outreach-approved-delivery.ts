/**
 * Provider-neutral contract for delivering the exact approved ForgeOS message.
 * Internal naming only — no provider-specific fields.
 */

export type OutreachApprovedDeliveryRequest = {
  tenantId: string;
  messageId: string;
  leadId: string;
  campaignId: string;
  recipientEmail: string;
  recipientName: string;
  companyName: string;
  approvedSubject: string;
  approvedPlainText: string;
  approvedHtml?: string;
  messageVersion: string;
  idempotencyKey: string;
};

export type OutreachApprovedDeliveryResult = {
  mode: "simulation" | "smartlead" | "brevo" | "configuration-missing" | "unsupported-exact-content" | "provider-error";
  providerStatus: "queued" | "sent" | "blocked" | "failed";
  providerMessageId?: string;
  error?: string;
  /** Exact content accepted by the provider adapter (simulation only). */
  deliveredSubject?: string;
  deliveredPlainText?: string;
  deliveredHtml?: string;
};

export function buildOutreachDeliveryIdempotencyKey(input: {
  tenantId: string;
  messageId: string;
  messageVersion: string;
}): string {
  return ["outreach-send", input.tenantId, input.messageId, input.messageVersion].join(":");
}

export function mapWorkflowStateToApprovedDelivery(
  state: {
    lead: {
      id: string;
      tenantId: string;
      email: string;
      contactName: string;
      companyName: string;
      sentAt?: string | null;
    };
    campaign: { id: string; tenantId: string } | null;
    message: {
      subject: string;
      body: string;
      approved: boolean;
      composition?: { html?: string } | null;
    } | null;
    sentAt?: string | null;
    providerState?: string;
  },
  messageId: string,
  messageVersion: string
): OutreachApprovedDeliveryRequest | null {
  if (!state.campaign || !state.message) return null;
  if (state.campaign.tenantId !== state.lead.tenantId) return null;

  return {
    tenantId: state.lead.tenantId,
    messageId,
    leadId: state.lead.id,
    campaignId: state.campaign.id,
    recipientEmail: state.lead.email,
    recipientName: state.lead.contactName,
    companyName: state.lead.companyName,
    approvedSubject: state.message.subject,
    approvedPlainText: state.message.body,
    approvedHtml: state.message.composition?.html,
    messageVersion,
    idempotencyKey: buildOutreachDeliveryIdempotencyKey({
      tenantId: state.lead.tenantId,
      messageId,
      messageVersion
    })
  };
}
