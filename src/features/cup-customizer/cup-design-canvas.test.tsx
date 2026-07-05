import React from "react";
import { describe, expect, it } from "vitest";
import { CupDesignCanvas } from "@cup-customizer";
import { renderToStaticMarkup } from "react-dom/server";

describe("CupDesignCanvas", () => {
  const labels = {
    capacityLabel: "Capacity",
    dragDropHint: "Drag and drop",
    overflowWarning: "Overflow",
    printAreaLabel: "Print area",
    replaceArtwork: "Replace",
    safetyBoundaryLabel: "Safety",
    uploadHint: "PNG or JPEG",
    uploadTitle: "Upload artwork"
  };

  it("renders blank cup with upload overlay", () => {
    const html = renderToStaticMarkup(
      <CupDesignCanvas labels={labels} onFileDrop={() => {}} showUploadOverlay />
    );
    expect(html).toContain('data-testid="cup-design-canvas"');
    expect(html).toContain('data-testid="cup-upload-overlay"');
    expect(html).toContain("Upload artwork");
  });

  it("renders artwork image when data URL provided", () => {
    const html = renderToStaticMarkup(
      <CupDesignCanvas
        artworkDataUrl="data:image/png;base64,abc"
        labels={labels}
        showUploadOverlay={false}
      />
    );
    expect(html).toContain('data-testid="cup-preview-artwork"');
    expect(html).not.toContain('data-testid="cup-upload-overlay"');
  });
});
