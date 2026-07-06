import React from "react";
import { describe, expect, it } from "vitest";
import { CupDesignCanvas, CUP_PREVIEW_FRAME_CLASS } from "@cup-customizer";
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

  it("uses expanded preview frame sizing", () => {
    const html = renderToStaticMarkup(<CupDesignCanvas labels={labels} />);
    expect(html).toContain(CUP_PREVIEW_FRAME_CLASS);
    expect(html).toContain("min-h-[min(42vh,280px)]");
  });

  it("shows loading overlay while generating mockup without hiding artwork", () => {
    const html = renderToStaticMarkup(
      <CupDesignCanvas
        artworkDataUrl="data:image/png;base64,abc"
        generatingMockup
        labels={labels}
        mockupLoadingLabel="Generating mockup"
        previewMode="mockup"
        showUploadOverlay={false}
      />
    );
    expect(html).toContain('data-testid="cup-mockup-loading"');
    expect(html).toContain("Generating mockup");
    expect(html).toContain('data-testid="cup-preview-artwork"');
  });

  it("renders mockup image in mockup mode when url is available", () => {
    const html = renderToStaticMarkup(
      <CupDesignCanvas
        artworkDataUrl="data:image/png;base64,abc"
        labels={labels}
        mockupDataUrl="data:image/svg+xml,mock"
        previewMode="mockup"
        showUploadOverlay={false}
      />
    );
    expect(html).toContain('data-testid="cup-mockup-image"');
    expect(html).not.toContain('data-testid="cup-preview-artwork"');
  });
});
