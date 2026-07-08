import { describe, expect, it } from "vitest";
import {
  buildOutreachDeliveryIdempotencyKey,
  mapWorkflowStateToApprovedDelivery
} from "./outreach-approved-delivery";

describe("outreach-approved-delivery contract", () => {
  it("builds stable idempotency keys", () => {
    expect(
      buildOutreachDeliveryIdempotencyKey({
        tenantId: "tenant_a",
        messageId: "msg_1",
        messageVersion: "hash-v2"
      })
    ).toBe("outreach-send:tenant_a:msg_1:hash-v2");
  });

  it("maps workflow state to approved delivery request", () => {
    const mapped = mapWorkflowStateToApprovedDelivery(
      {
        lead: {
          id: "lead_1",
          tenantId: "tenant_a",
          email: "a@example.com",
          contactName: "Ana",
          companyName: "Acme"
        },
        campaign: { id: "camp_1", tenantId: "tenant_a" },
        message: {
          subject: "Subject",
          body: "Body text",
          approved: true,
          composition: { html: "<p>Body</p>" }
        }
      },
      "msg_1",
      "v3"
    );

    expect(mapped).toEqual({
      tenantId: "tenant_a",
      messageId: "msg_1",
      leadId: "lead_1",
      campaignId: "camp_1",
      recipientEmail: "a@example.com",
      recipientName: "Ana",
      companyName: "Acme",
      approvedSubject: "Subject",
      approvedPlainText: "Body text",
      approvedHtml: "<p>Body</p>",
      messageVersion: "v3",
      idempotencyKey: "outreach-send:tenant_a:msg_1:v3"
    });
  });

  it("rejects cross-tenant campaign mapping", () => {
    const mapped = mapWorkflowStateToApprovedDelivery(
      {
        lead: {
          id: "lead_1",
          tenantId: "tenant_a",
          email: "a@example.com",
          contactName: "Ana",
          companyName: "Acme"
        },
        campaign: { id: "camp_1", tenantId: "tenant_b" },
        message: { subject: "S", body: "B", approved: true }
      },
      "msg_1",
      "v1"
    );

    expect(mapped).toBeNull();
  });
});
