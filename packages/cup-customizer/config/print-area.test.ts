import { describe, expect, it } from "vitest";
import { normalizePrintArea, PRINT_AREA_OPTIONS, printableWidthFraction } from "./print-area";

describe("print-area", () => {
  it("offers only 180 and 360 degree options", () => {
    expect(PRINT_AREA_OPTIONS).toEqual(["deg_180", "deg_360"]);
  });

  it("maps legacy front/back to 180 degrees", () => {
    expect(normalizePrintArea("front")).toBe("deg_180");
    expect(normalizePrintArea("back")).toBe("deg_180");
    expect(normalizePrintArea("frente")).toBe("deg_180");
    expect(normalizePrintArea("verso")).toBe("deg_180");
  });

  it("maps legacy wrap/full to 360 degrees", () => {
    expect(normalizePrintArea("wrap")).toBe("deg_360");
    expect(normalizePrintArea("full-wrap")).toBe("deg_360");
    expect(normalizePrintArea("volta-completa")).toBe("deg_360");
    expect(normalizePrintArea("full")).toBe("deg_360");
  });

  it("uses a wider printable band for 360 than 180", () => {
    expect(printableWidthFraction("deg_360")).toBeGreaterThan(printableWidthFraction("deg_180"));
  });
});
