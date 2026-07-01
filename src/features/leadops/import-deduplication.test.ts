import { describe, expect, it } from "vitest";
import type { Lead } from "@/domain/types";
import type { LeadContact } from "@/domain/import-types";
import {
  analyzeImportRow,
  computeFileFingerprint,
  findFileDuplicateEmails
} from "./import-deduplication";

const baseLead = (overrides: Partial<Lead>): Lead => ({
  id: "lead_1",
  tenantId: "tenant_test",
  companyName: "Existing Co",
  normalizedCompanyName: "existing co",
  contactName: "Existing",
  email: "existing@example.test",
  phone: "",
  normalizedPhone: "",
  website: "https://existing.example",
  websiteDomain: "existing.example",
  facebookUrl: null,
  location: "Lisbon",
  country: "Portugal",
  industry: "Events",
  crmStatus: "new",
  outreachStatus: "ready",
  quality: "medium",
  source: "manual",
  sourceDatabase: "Manual",
  sourceImportId: null,
  contactSource: "Manual",
  language: "pt-PT",
  campaignId: null,
  consentStatus: "subscribed",
  providerState: "not_ready",
  requestedProductId: null,
  quantity: 0,
  notes: "",
  active: true,
  archivedAt: null,
  archivedBy: null,
  archiveReason: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides
});

describe("import deduplication", () => {
  it("flags exact contact duplicates", () => {
    const analysis = analyzeImportRow(
      {
        companyName: "New Co",
        contactName: "Person",
        email: "existing@example.test",
        phone: "",
        website: "",
        region: "",
        country: "Portugal",
        industry: "",
        notes: "",
        sourceDatabase: "",
        status: "",
        language: "pt-PT"
      },
      { leads: [baseLead({})], contacts: [] },
      new Set()
    );
    expect(analysis.status).toBe("duplicate");
    expect(analysis.proposedAction).toBe("skip_duplicate");
  });

  it("flags strong organization duplicates by domain", () => {
    const analysis = analyzeImportRow(
      {
        companyName: "Existing Co",
        contactName: "Other",
        email: "other@example.test",
        phone: "",
        website: "https://existing.example",
        region: "",
        country: "Portugal",
        industry: "",
        notes: "",
        sourceDatabase: "",
        status: "",
        language: "pt-PT"
      },
      { leads: [baseLead({ email: "" })], contacts: [] },
      new Set()
    );
    expect(analysis.status).toBe("duplicate");
    expect(analysis.proposedAction).toBe("attach_to_existing");
  });

  it("requires review for possible duplicates", () => {
    const analysis = analyzeImportRow(
      {
        companyName: "Existing Company Group",
        contactName: "Person",
        email: "new@example.test",
        phone: "",
        website: "",
        region: "",
        country: "Portugal",
        industry: "",
        notes: "",
        sourceDatabase: "",
        status: "",
        language: "pt-PT"
      },
      { leads: [baseLead({ companyName: "Existing Co" })], contacts: [] },
      new Set()
    );
    expect(analysis.status).toBe("possible_duplicate");
    expect(analysis.proposedAction).toBe("review");
  });

  it("allows missing-email organizations", () => {
    const analysis = analyzeImportRow(
      {
        companyName: "No Email Org",
        contactName: "",
        email: "",
        phone: "",
        website: "",
        region: "Porto",
        country: "Portugal",
        industry: "Events",
        notes: "",
        sourceDatabase: "",
        status: "",
        language: "pt-PT"
      },
      { leads: [], contacts: [] },
      new Set()
    );
    expect(analysis.status).toBe("missing_email");
    expect(analysis.proposedAction).toBe("create_organization");
  });

  it("computes deterministic file fingerprints", async () => {
    const first = await computeFileFingerprint("same-content");
    const second = await computeFileFingerprint("same-content");
    const different = await computeFileFingerprint("other-content");
    expect(first).toBe(second);
    expect(first).not.toBe(different);
  });

  it("finds duplicate emails within a file", () => {
    const duplicates = findFileDuplicateEmails([
      {
        companyName: "A",
        contactName: "",
        email: "dup@example.test",
        phone: "",
        website: "",
        region: "",
        country: "",
        industry: "",
        notes: "",
        sourceDatabase: "",
        status: "",
        language: "pt-PT"
      },
      {
        companyName: "B",
        contactName: "",
        email: "dup@example.test",
        phone: "",
        website: "",
        region: "",
        country: "",
        industry: "",
        notes: "",
        sourceDatabase: "",
        status: "",
        language: "pt-PT"
      }
    ]);
    expect(duplicates.has("dup@example.test")).toBe(true);
  });
});

describe("lead contact deduplication", () => {
  it("detects duplicate via lead contact repository email", () => {
    const contact: LeadContact = {
      id: "lct_1",
      tenantId: "tenant_test",
      leadId: "lead_1",
      name: "Existing",
      normalizedEmail: "existing@example.test",
      email: "existing@example.test",
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
      updatedAt: "2026-01-01T00:00:00.000Z"
    };
    const analysis = analyzeImportRow(
      {
        companyName: "Another Co",
        contactName: "Person",
        email: "existing@example.test",
        phone: "",
        website: "",
        region: "",
        country: "Portugal",
        industry: "",
        notes: "",
        sourceDatabase: "",
        status: "",
        language: "pt-PT"
      },
      { leads: [], contacts: [contact] },
      new Set()
    );
    expect(analysis.status).toBe("duplicate");
  });
});
