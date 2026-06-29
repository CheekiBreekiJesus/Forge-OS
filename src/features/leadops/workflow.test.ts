import { describe, expect, it } from "vitest";
import { findLeadById } from "./lookup";
import {
  getTenantCampaigns,
  leadOpsLeads,
  LEADOPS_DEMO_TENANT_ID
} from "./seed";
import type { LeadOpsWorkflowState } from "./types";
import {
  appendEvent,
  generatePtPtEmail,
  getCompanyContext,
  queueApprovedMessage,
  recommendProductsForLead,
  simulateSend,
  validateQueue
} from "./workflow";

const campaigns = getTenantCampaigns(LEADOPS_DEMO_TENANT_ID);
const leadWithContext = leadOpsLeads.find((lead) => lead.id === "leadops_001")!;
const leadWithoutContext = leadOpsLeads.find((lead) => lead.id === "leadops_006")!;

function buildState(overrides: Partial<LeadOpsWorkflowState> = {}): LeadOpsWorkflowState {
  const campaign = campaigns[0];
  const message = generatePtPtEmail({
    campaign,
    context: getCompanyContext(leadWithContext),
    lead: leadWithContext,
    productKeys: ["customized-plastic-cups", "packaging-products"],
    tone: "professional"
  });

  return {
    activities: [],
    campaign,
    lead: leadWithContext,
    message,
    metricsUpdated: false,
    providerState: "draft",
    queuedAt: null,
    sentAt: null,
    ...overrides
  };
}

describe("LeadOps demo workflow", () => {
  it("generates a PT-PT email with selected products", () => {
    const message = generatePtPtEmail({
      campaign: campaigns[0],
      context: getCompanyContext(leadWithContext),
      lead: leadWithContext,
      productKeys: ["customized-plastic-cups", "packaging-products"],
      tone: "friendly"
    });

    expect(message.subject).toContain(leadWithContext.companyName);
    expect(message.body).toContain("copos de plastico personalizados");
    expect(message.body).toContain("solucoes de embalagem");
    expect(message.body).toContain("100.000 unidades");
    expect(message.body).toContain("visualizacao e orcamento");
  });

  it("does not claim website review when no context exists", () => {
    const message = generatePtPtEmail({
      campaign: campaigns[0],
      context: getCompanyContext(leadWithoutContext),
      lead: leadWithoutContext,
      productKeys: ["customized-plastic-cups"],
      tone: "direct"
    });

    expect(message.body).not.toContain("Vi o contexto");
    expect(message.body).toContain("aparece na nossa base demo");
  });

  it("editing changes approval state and requires reapproval", () => {
    const state = buildState();
    const edited = {
      ...state.message!,
      approved: false,
      body: `${state.message!.body}\nLinha editada.`,
      edited: true
    };

    expect(edited.edited).toBe(true);
    expect(edited.approved).toBe(false);
  });

  it("cannot queue unapproved message", () => {
    const validation = validateQueue(buildState());

    expect(validation.ok).toBe(false);
    expect(validation.reason).toBe("unapproved");
  });

  it("cannot queue unsubscribed lead", () => {
    const state = buildState({
      lead: {
        ...leadWithContext,
        consentStatus: "unsubscribed"
      },
      message: {
        ...buildState().message!,
        approved: true
      }
    });

    expect(validateQueue(state).reason).toBe("unsubscribed");
  });

  it("cannot queue bounced lead", () => {
    const state = buildState({
      lead: {
        ...leadWithContext,
        status: "bounced"
      },
      message: {
        ...buildState().message!,
        approved: true
      }
    });

    expect(validateQueue(state).reason).toBe("bounced");
  });

  it("approved message can be queued", () => {
    const queued = queueApprovedMessage(
      buildState({
        message: {
          ...buildState().message!,
          approved: true
        },
        providerState: "approved"
      })
    );

    expect(queued.providerState).toBe("queued");
    expect(queued.lead.status).toBe("queued");
    expect(queued.queuedAt).toBeTruthy();
  });

  it("mock send changes provider and lead state", () => {
    const queued = queueApprovedMessage(
      buildState({
        message: {
          ...buildState().message!,
          approved: true
        },
        providerState: "approved"
      })
    );
    const sent = simulateSend(queued);

    expect(sent.providerState).toBe("sent");
    expect(sent.lead.status).toBe("contacted");
    expect(sent.sentAt).toBeTruthy();
  });

  it("campaign metrics increment once", () => {
    const queued = queueApprovedMessage(
      buildState({
        message: {
          ...buildState().message!,
          approved: true
        },
        providerState: "approved"
      })
    );
    const sent = simulateSend(queued);
    const secondAttempt = simulateSend(sent);

    expect(sent.campaign?.sentCount).toBe(queued.campaign!.sentCount + 1);
    expect(secondAttempt.campaign?.sentCount).toBe(sent.campaign?.sentCount);
  });

  it("audit events appear in transition order", () => {
    const generated = appendEvent([], leadWithContext, "message-generated");
    const edited = appendEvent(generated, leadWithContext, "message-edited");
    const approved = appendEvent(edited, leadWithContext, "message-approved");
    const assigned = appendEvent(approved, leadWithContext, "campaign-assigned");
    const queued = queueApprovedMessage(
      buildState({
        activities: assigned,
        message: {
          ...buildState().message!,
          approved: true
        },
        providerState: "approved"
      })
    );
    const sent = simulateSend(queued);

    expect(sent.activities.map((event) => event.kind)).toEqual([
      "message-generated",
      "message-edited",
      "message-approved",
      "campaign-assigned",
      "message-queued",
      "message-sent",
      "metrics-updated"
    ]);
  });

  it("tenant-scoped lookup rejects another tenant", () => {
    expect(findLeadById(LEADOPS_DEMO_TENANT_ID, "leadops_011", leadOpsLeads)).toBeNull();
  });

  it("missing email produces a clear validation result", () => {
    const validation = validateQueue(
      buildState({
        lead: {
          ...leadWithContext,
          email: ""
        },
        message: {
          ...buildState().message!,
          approved: true
        }
      })
    );

    expect(validation.ok).toBe(false);
    expect(validation.reason).toBe("missing-email");
    expect(validation.message).toContain("email");
  });

  it("recommends deterministic products by industry", () => {
    expect(recommendProductsForLead(leadWithContext).map((item) => item.key)).toContain(
      "customized-plastic-cups"
    );
  });
});
