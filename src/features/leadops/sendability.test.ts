import { describe, expect, it } from "vitest";
import type { LeadContact } from "@/domain/import-types";
import type { Lead } from "@/domain/types";
import {
  buildDuplicateEmailIndex,
  evaluateSendability
} from "@/features/leadops/sendability";

const tenantId = "tenant_test";

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "lead_1",
    tenantId,
    companyName: "Acme",
    normalizedCompanyName: "acme",
    contactName: "Alex",
    email: "alex@example.invalid",
    phone: "",
    normalizedPhone: "",
    website: null,
    websiteDomain: null,
    facebookUrl: null,
    location: "Lisbon",
    country: "Portugal",
    industry: "Events",
    crmStatus: "new",
    outreachStatus: "ready",
    quality: "high",
    source: "Import",
    sourceDatabase: "TEST",
    sourceImportId: null,
    contactSource: "TEST",
    language: "pt-PT",
    campaignId: null,
    consentStatus: "subscribed",
    providerState: "not_ready",
    requestedProductId: null,
    quantity: 1,
    notes: "",
    active: true,
    archivedAt: null,
    archivedBy: null,
    archiveReason: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

function makeContact(overrides: Partial<LeadContact> = {}): LeadContact {
  return {
    id: "contact_1",
    tenantId,
    leadId: "lead_1",
    name: "Alex",
    normalizedEmail: "alex@example.invalid",
    email: "alex@example.invalid",
    phone: "",
    role: "",
    isPrimary: true,
    emailStatus: "valid_syntax",
    lastContactedAt: null,
    active: true,
    archivedAt: null,
    archivedBy: null,
    archiveReason: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

describe("sendability evaluation", () => {
  it("marks a valid active contact as sendable", () => {
    const result = evaluateSendability({
      tenantId,
      lead: makeLead(),
      contact: makeContact()
    });
    expect(result.sendable).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("returns missing_email when no email exists", () => {
    const result = evaluateSendability({
      tenantId,
      lead: makeLead({ email: "" }),
      contact: makeContact({ email: "" })
    });
    expect(result.sendable).toBe(false);
    expect(result.reasons).toContain("missing_email");
  });

  it("returns invalid_email for malformed addresses", () => {
    const result = evaluateSendability({
      tenantId,
      lead: makeLead({ email: "not-an-email" }),
      contact: makeContact({ email: "not-an-email" })
    });
    expect(result.reasons).toContain("invalid_email");
  });

  it("returns suppressed for unsubscribed or bounced leads", () => {
    expect(
      evaluateSendability({
        tenantId,
        lead: makeLead({ consentStatus: "unsubscribed" }),
        contact: makeContact()
      }).reasons
    ).toContain("suppressed");

    expect(
      evaluateSendability({
        tenantId,
        lead: makeLead({ outreachStatus: "bounced" }),
        contact: makeContact()
      }).reasons
    ).toContain("suppressed");
  });

  it("returns inactive for archived leads", () => {
    const result = evaluateSendability({
      tenantId,
      lead: makeLead({ active: false }),
      contact: makeContact()
    });
    expect(result.reasons).toContain("inactive");
  });

  it("returns duplicate_contact when email appears more than once", () => {
    const duplicates = buildDuplicateEmailIndex(
      [makeLead(), makeLead({ id: "lead_2", companyName: "Other Co" })],
      [makeContact(), makeContact({ id: "contact_2", leadId: "lead_2" })],
      tenantId
    );
    const result = evaluateSendability({
      tenantId,
      lead: makeLead(),
      contact: makeContact(),
      duplicateEmails: duplicates
    });
    expect(result.reasons).toContain("duplicate_contact");
  });

  it("does not treat primary contact email duplicated on lead as duplicate_contact", () => {
    const duplicates = buildDuplicateEmailIndex(
      [makeLead()],
      [makeContact()],
      tenantId
    );
    const result = evaluateSendability({
      tenantId,
      lead: makeLead(),
      contact: makeContact(),
      duplicateEmails: duplicates
    });
    expect(result.sendable).toBe(true);
    expect(duplicates.has("alex@example.invalid")).toBe(false);
  });
});
