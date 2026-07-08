import { describe, expect, it } from "vitest";
import { detectFieldMapping } from "./import-mapping";
import { parseCsvText } from "./import-file-parser";

describe("import header mapping", () => {
  it("detects Portuguese CSV headers", () => {
    const mapping = detectFieldMapping([
      "Empresa",
      "Pessoa de Contacto",
      "Email",
      "Telefone",
      "Website",
      "Região",
      "Categoria",
      "Origem",
      "Notas"
    ]);
    expect(mapping.companyName).toBe("Empresa");
    expect(mapping.contactName).toBe("Pessoa de Contacto");
    expect(mapping.email).toBe("Email");
    expect(mapping.region).toBe("Região");
  });

  it("detects English CSV headers", () => {
    const mapping = detectFieldMapping([
      "Company",
      "Contact Person",
      "E-mail",
      "Phone",
      "URL",
      "District",
      "Category",
      "Source",
      "Notes"
    ]);
    expect(mapping.companyName).toBe("Company");
    expect(mapping.contactName).toBe("Contact Person");
    expect(mapping.website).toBe("URL");
  });

  it("parses CSV rows for mapping pipeline", () => {
    const { headers, rows } = parseCsvText("company,email\nAcme,hello@acme.test\n");
    expect(headers).toEqual(["company", "email"]);
    expect(rows).toHaveLength(1);
  });
});
