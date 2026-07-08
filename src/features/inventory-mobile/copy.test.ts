import { describe, expect, it } from "vitest";
import { getInventoryMobileCopy } from "@/features/inventory-mobile/copy";

describe("inventory mobile copy", () => {
  it("returns localized scanner strings", () => {
    expect(getInventoryMobileCopy("en").scanner.title).toBe("Scan barcode");
    expect(getInventoryMobileCopy("pt-PT").scanner.title).toBe("Ler código de barras");
    expect(getInventoryMobileCopy("pt-PT").desktop.openScanner).toBe("Leitor móvel");
  });

  it("includes offline and movement action labels", () => {
    const copy = getInventoryMobileCopy("en");
    expect(copy.transaction.typeIssue).toBe("Issue");
    expect(copy.transaction.typeTransfer).toBe("Transfer");
    expect(copy.offline.pendingTitle).toBe("Pending sync");
    expect(copy.unknown.linkBarcode).toContain("Link barcode");
  });
});
