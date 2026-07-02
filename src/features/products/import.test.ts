import { describe, expect, it } from "vitest";
import { parseProductSpreadsheet } from "@/features/products/import";
import { parsePortugueseDate, parsePortugueseDecimal } from "@/features/products/locale";
import { parseDelimitedText } from "@/features/products/spreadsheet-parser";

const syntheticCsv = `Referência;Descrição;Nome curto 1;Família;Tipo de Artigo;Cód. Barras;Taxa;Preço de Compra s/Imposto;Preço de Compra c/Imposto;Preço s/Imposto;Preço c/Imposto;Unidade de Venda;Unidade de Capacidade;Descrição Extra;Stock Atual
SYN-001;COPO DEMO PP 330 ml (1000 UN);COPO DEMO PP;Plástico;Normal;;Normal;10,500 €;12,915 €;15,000 €;18,450 €;Unidade;Unidade;;0,00
SYN-001;COPO DEMO PP 330 ml (1000 UN);COPO DEMO PP;Plástico;Normal;;Normal;10,500 €;12,915 €;15,000 €;18,450 €;Unidade;Unidade;;0,00
SYN-003;PALHINHA DEMO (10 x 1000 UN);PALHINHA DEMO;Plástico;Normal;5601460000001;Normal;0,000 €;0,000 €;42,500 €;52,280 €;Unidade;Unidade;;0,00
SYN-004;ARTIGO SEM PREÇO;ARTIGO SEM PREÇO;Papel;Normal;;;Normal;0,000 €;0,000 €;0,000 €;0,000 €;Unidade;Unidade;;0,00`;

describe("product import locale", () => {
  it("parses Portuguese decimal and date formats", () => {
    expect(parsePortugueseDecimal("104,000 €")).toEqual({ normalized: "104", status: "valid" });
    expect(parsePortugueseDecimal("1.234,56")).toEqual({ normalized: "1234.56", status: "valid" });
    expect(parsePortugueseDate("02/07/2026")).toEqual({ normalized: "2026-07-02", status: "valid" });
  });
});

describe("parseProductSpreadsheet", () => {
  it("classifies synthetic rows and ignores inventory columns", () => {
    const matrix = parseDelimitedText(syntheticCsv, ";");
    const result = parseProductSpreadsheet(matrix, "synthetic_products.csv");

    expect(result.excludedInventoryFields).toContain("stock atual");
    expect(result.metrics.totalRows).toBe(4);
    expect(result.validRows).toHaveLength(0);
    expect(result.reviewRows.length).toBeGreaterThanOrEqual(3);
    expect(result.invalidRows).toHaveLength(1);
    expect(result.duplicateCodes).toEqual(["SYN-001"]);
    expect(result.metrics.packagingHintCount).toBeGreaterThanOrEqual(2);
    expect(result.metrics.missingBarcodeCount).toBeGreaterThanOrEqual(2);
  });
});
