import { describe, expect, it } from "vitest";
import { getInventoryMobileCopy } from "@/features/inventory-mobile/copy";

describe("inventory mobile copy", () => {
  it("renders Portuguese copy with correct diacritics", () => {
    const copy = getInventoryMobileCopy("pt-PT");
    expect(copy.scanner.title).toMatch(/código de barras/i);
    expect(copy.scanner.scanStatus.insecureContext).toMatch(/câmara/i);
    expect(copy.unknown.registrationNote).toMatch(/autorizada/i);
  });

  it("renders English copy", () => {
    const copy = getInventoryMobileCopy("en");
    expect(copy.scanner.title).toBe("Scan barcode");
    expect(copy.transaction.typeReceipt).toBe("Receipt");
  });
});
