import { describe, expect, it } from "vitest";
import { parseLeadCsv } from "./import";

describe("LeadOps CSV import", () => {
  it("maps common Portuguese and English headers into the standard import schema", () => {
    const result = parseLeadCsv(
      [
        "Empresa,Contacto,Email,Telefone,Site,Facebook,Regiao,Categoria,Origem,Notas",
        "Atlântico Eventos,Ana Silva,ana@atlantico.example,210000000,https://atlantico.example,https://facebook.example/atlantico,Porto,Events,PT-Events,Lead frio"
      ].join("\n")
    );

    expect(result.validRows).toHaveLength(1);
    expect(result.validRows[0]).toMatchObject({
      companyName: "Atlântico Eventos",
      contactName: "Ana Silva",
      email: "ana@atlantico.example",
      industry: "Events",
      region: "Porto",
      sourceDatabase: "PT-Events"
    });
  });

  it("keeps invalid rows in the exception output", () => {
    const result = parseLeadCsv("company,email\nMissing Email,\nNo Company,bad-email");

    expect(result.invalidRows).toHaveLength(2);
    expect(result.invalidRows[0]?.validationMessages).toContain("Valid email is required.");
  });

  it("moves duplicate emails to manual review", () => {
    const result = parseLeadCsv(
      [
        "company,email,region,industry",
        "One,lead@example.test,Lisbon,Hospitality",
        "Two,lead@example.test,Porto,Events"
      ].join("\n")
    );

    expect(result.duplicateEmails).toEqual(["lead@example.test"]);
    expect(result.reviewRows).toHaveLength(2);
    expect(result.validRows).toHaveLength(0);
  });

  it("parses quoted commas without splitting a field", () => {
    const result = parseLeadCsv(
      "company,email,notes,region,industry\n\"Company, Lda\",hello@company.example,\"cups, events\",Lisbon,Hospitality"
    );

    expect(result.validRows[0]?.companyName).toBe("Company, Lda");
    expect(result.validRows[0]?.notes).toBe("cups, events");
  });
});
