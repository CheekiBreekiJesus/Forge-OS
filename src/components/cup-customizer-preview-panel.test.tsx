import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CupCustomizerPreviewPanel } from "./cup-customizer-preview-panel";
import type { Dictionary } from "@/i18n/dictionaries";

const copy = {
  actions: {
    convertToQuote: "Create quotation",
    resetDesign: "Reset design",
    resetMockup: "Reset mockup",
    save: "Save",
    saved: "Saved",
    saveVisualization: "Save visualization",
    saving: "Saving…"
  },
  artwork: {
    replace: "Replace",
    uploadTitle: "Upload artwork"
  },
  form: {
    cupSize: "Cup size",
    quantity: "Quantity"
  },
  mockup: {
    failed: "Mockup failed",
    generateRealistic: "Generate mockup",
    generatedDisclaimer: "Generated",
    generating: "Generating…",
    retry: "Retry",
    stale: "Stale mockup"
  },
  preview: {
    capacityLabel: "Capacity",
    cupColorLabel: "Colour",
    designTab: "Design",
    dragDropHint: "Drop",
    logoLoaded: "Loaded",
    logoMissing: "No logo",
    logoStatusLabel: "Logo",
    mockupPending: "Pending mockup",
    mockupTab: "Mockup",
    overflowWarning: "Overflow",
    printAreaLabel: "Print area",
    safetyBoundaryLabel: "Safety",
    statusTitle: "Summary",
    uploadHint: "PNG"
  },
  pricing: {
    estimateBadge: "Estimate",
    manualOverride: "Override",
    overrideReason: "Reason",
    total: "Total",
    unitPrice: "Unit",
    viewAssumptions: "Assumptions"
  },
  sections: {
    pricing: "Pricing"
  },
  unsavedChanges: "Unsaved"
} as Dictionary["customizerModule"];

const baseProps = {
  artworkMetadata: null,
  artworkPreviewUrl: "data:image/png;base64,abc",
  capacity: "330 ml",
  configuration: {
    artworkOffsetX: 0,
    artworkOffsetY: 0,
    artworkPosition: "center",
    artworkRotation: 0,
    artworkScale: 1
  },
  copy,
  cupColor: "White",
  generatingMockup: false,
  locale: "en" as const,
  manualUnitPriceOverride: null,
  material: "PP",
  mockupPreviewUrl: null,
  mockupStatus: "none" as const,
  onConvert: () => {},
  onGenerateMockup: () => {},
  onManualPriceChange: () => {},
  onOverrideReasonChange: () => {},
  onPreviewModeChange: () => {},
  onResetDesign: () => {},
  onResetMockup: () => {},
  onSave: () => {},
  onSaveVisualization: () => {},
  onToggleAssumptions: () => {},
  onUploadFile: () => {},
  onUploadRequest: () => {},
  overrideReason: "",
  previewMode: "design" as const,
  pricing: {
    assumptions: ["Test assumption"],
    isEstimate: true,
    manualUnitPriceOverride: null,
    overrideReason: null,
    ruleId: "rule",
    setupCost: 50,
    subtotal: 500,
    total: 615,
    unitPrice: 0.45,
    vat: 115
  },
  printArea: "wrap",
  productName: "PP Cup 330 ml",
  quantity: 1000,
  saveStatus: "saved" as const,
  saving: false,
  showAssumptions: false
};

describe("CupCustomizerPreviewPanel", () => {
  it("renders preview container with usable min-height", () => {
    const html = renderToStaticMarkup(<CupCustomizerPreviewPanel {...baseProps} />);
    expect(html).toContain('data-testid="cup-preview-container"');
    expect(html).toContain("min-h-[min(42vh,280px)]");
    expect(html).toContain("lg:min-h-[min(52vh,480px)]");
  });

  it("keeps logo status loaded when artwork preview url is set", () => {
    const html = renderToStaticMarkup(<CupCustomizerPreviewPanel {...baseProps} />);
    expect(html).toContain('data-testid="cup-preview-logo-status"');
    expect(html).toContain("Loaded");
    expect(html).toContain('data-testid="cup-preview-artwork"');
  });

  it("renders mockup loading state", () => {
    const html = renderToStaticMarkup(
      <CupCustomizerPreviewPanel
        {...baseProps}
        generatingMockup
        mockupStatus="generating"
        previewMode="mockup"
      />
    );
    expect(html).toContain('data-testid="cup-mockup-status-generating"');
    expect(html).toContain('data-testid="cup-mockup-loading"');
    expect(html).toContain("Generating…");
    expect(html).toContain('data-testid="cup-preview-artwork"');
  });

  it("renders mockup error state without removing artwork", () => {
    const html = renderToStaticMarkup(
      <CupCustomizerPreviewPanel
        {...baseProps}
        mockupStatus="failed"
        previewMode="mockup"
      />
    );
    expect(html).toContain('data-testid="cup-mockup-status-failed"');
    expect(html).toContain("Mockup failed");
    expect(html).toContain('data-testid="cup-preview-artwork"');
  });

  it("keeps artwork visible after quote recalculation props change", () => {
    const html = renderToStaticMarkup(
      <CupCustomizerPreviewPanel
        {...baseProps}
        manualUnitPriceOverride={0.55}
        pricing={{
          ...baseProps.pricing!,
          total: 700,
          unitPrice: 0.55
        }}
        quantity={2000}
      />
    );
    expect(html).toContain('data-testid="cup-preview-artwork"');
    expect(html).toContain("2,000");
    expect(html).toContain('data-testid="cup-manual-price-override"');
  });

  it("exposes reset design and reset mockup actions", () => {
    const html = renderToStaticMarkup(<CupCustomizerPreviewPanel {...baseProps} mockupPreviewUrl="data:image/svg+xml,abc" mockupStatus="complete" />);
    expect(html).toContain('data-testid="cup-reset-design-button"');
    expect(html).toContain('data-testid="cup-reset-mockup-button"');
  });
});
