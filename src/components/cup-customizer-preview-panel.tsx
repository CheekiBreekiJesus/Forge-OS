"use client";

import { CupDesignCanvas } from "@cup-customizer";
import type { MockupGenerationStatus } from "@/features/cup-customizer";
import type { CustomizerPricingSnapshot } from "@/domain/customizer-types";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { FormField, inputClassName } from "@/components/crud";

type PreviewPanelProps = {
  copy: Dictionary["customizerModule"];
  locale: Locale;
  quantity: number;
  productName: string | null;
  capacity: string;
  material: string;
  cupColor: string;
  printArea: string;
  configuration: {
    artworkPosition: string;
    artworkScale: number;
    artworkOffsetX: number;
    artworkOffsetY: number;
    artworkRotation: number;
  };
  artworkPreviewUrl: string | null;
  artworkMetadata: { fileName: string; width: number; height: number; mimeType: string } | null;
  mockupPreviewUrl: string | null;
  previewMode: "design" | "mockup";
  onPreviewModeChange: (mode: "design" | "mockup") => void;
  mockupStatus: MockupGenerationStatus;
  generatingMockup: boolean;
  onGenerateMockup: () => void;
  onResetDesign: () => void;
  onResetMockup: () => void;
  onUploadFile: (file: File) => void;
  onUploadRequest: () => void;
  pricing: CustomizerPricingSnapshot | null;
  manualUnitPriceOverride: number | null;
  overrideReason: string;
  onManualPriceChange: (value: number | null) => void;
  onOverrideReasonChange: (value: string) => void;
  showAssumptions: boolean;
  onToggleAssumptions: () => void;
  onSave: () => void;
  onConvert: () => void;
  onSaveVisualization: () => void;
  saving: boolean;
  saveStatus: "unsaved" | "saving" | "saved" | "failed";
};

export function CupCustomizerPreviewPanel({
  copy,
  locale,
  quantity,
  productName,
  capacity,
  material,
  cupColor,
  printArea,
  configuration,
  artworkPreviewUrl,
  artworkMetadata,
  mockupPreviewUrl,
  previewMode,
  onPreviewModeChange,
  mockupStatus,
  generatingMockup,
  onGenerateMockup,
  onResetDesign,
  onResetMockup,
  onUploadFile,
  onUploadRequest,
  pricing,
  manualUnitPriceOverride,
  overrideReason,
  onManualPriceChange,
  onOverrideReasonChange,
  showAssumptions,
  onToggleAssumptions,
  onSave,
  onConvert,
  onSaveVisualization,
  saving,
  saveStatus
}: PreviewPanelProps) {
  const hasArtwork = Boolean(artworkPreviewUrl);
  const logoStatusLabel = hasArtwork
    ? copy.preview.logoLoaded
    : copy.preview.logoMissing;

  const canvasLabels = {
    capacityLabel: copy.preview.capacityLabel,
    dragDropHint: copy.preview.dragDropHint,
    overflowWarning: copy.preview.overflowWarning,
    printAreaLabel: copy.preview.printAreaLabel,
    replaceArtwork: copy.artwork.replace,
    safetyBoundaryLabel: copy.preview.safetyBoundaryLabel,
    uploadHint: copy.preview.uploadHint,
    uploadTitle: copy.artwork.uploadTitle
  };

  return (
    <div className="flex flex-col gap-3 lg:sticky lg:top-3 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto">
      <div
        className="shrink-0 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs"
        data-testid="cup-preview-status"
      >
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          {copy.preview.statusTitle}
        </p>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
          <dt className="text-slate-500">{copy.form.cupSize}</dt>
          <dd className="text-right font-medium text-slate-200">{capacity}</dd>
          <dt className="text-slate-500">{copy.form.quantity}</dt>
          <dd className="text-right font-medium text-slate-200">{quantity.toLocaleString(locale)}</dd>
          <dt className="text-slate-500">{copy.preview.cupColorLabel}</dt>
          <dd className="text-right font-medium text-slate-200">{cupColor}</dd>
          <dt className="text-slate-500">{copy.preview.logoStatusLabel}</dt>
          <dd
            className={`text-right font-medium ${hasArtwork ? "text-emerald-300" : "text-slate-400"}`}
            data-testid="cup-preview-logo-status"
          >
            {logoStatusLabel}
          </dd>
        </dl>
        {productName ? (
          <p className="mt-2 truncate text-[10px] text-slate-500">{productName}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 gap-1 rounded-lg border border-slate-800 bg-slate-950/60 p-1" role="tablist">
        <button
          aria-selected={previewMode === "design"}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold ${
            previewMode === "design" ? "bg-orange-500 text-white" : "text-slate-400 hover:text-slate-200"
          }`}
          onClick={() => onPreviewModeChange("design")}
          role="tab"
          type="button"
        >
          {copy.preview.designTab}
        </button>
        <button
          aria-selected={previewMode === "mockup"}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold ${
            previewMode === "mockup" ? "bg-orange-500 text-white" : "text-slate-400 hover:text-slate-200"
          }`}
          onClick={() => onPreviewModeChange("mockup")}
          role="tab"
          type="button"
        >
          {copy.preview.mockupTab}
        </button>
      </div>

      <div
        className="min-h-[min(42vh,280px)] shrink-0 overflow-auto rounded-xl border border-slate-800 bg-slate-950/40 p-3 sm:min-h-[min(48vh,360px)] lg:min-h-[min(52vh,480px)]"
        data-testid="cup-preview-container"
      >
        <CupDesignCanvas
          artworkDataUrl={artworkPreviewUrl}
          artworkOffsetX={configuration.artworkOffsetX}
          artworkOffsetY={configuration.artworkOffsetY}
          artworkPosition={configuration.artworkPosition}
          artworkRotation={configuration.artworkRotation}
          artworkScale={configuration.artworkScale}
          artworkSelected={hasArtwork}
          capacity={capacity}
          className="mx-auto"
          cupColor={cupColor}
          generatingMockup={generatingMockup}
          labels={canvasLabels}
          material={material}
          mockupDataUrl={mockupPreviewUrl}
          mockupLoadingLabel={copy.mockup.generating}
          onFileDrop={onUploadFile}
          onUploadRequest={onUploadRequest}
          previewMode={previewMode}
          printArea={printArea}
          showUploadOverlay={previewMode === "design"}
        />
        {artworkMetadata ? (
          <p className="mt-2 text-center text-[10px] text-slate-500" data-testid="artwork-metadata">
            {artworkMetadata.fileName}
            {artworkMetadata.width > 0
              ? ` · ${artworkMetadata.width}×${artworkMetadata.height} · ${artworkMetadata.mimeType.split("/")[1]?.toUpperCase()}`
              : ""}
          </p>
        ) : null}
        {previewMode === "mockup" && !mockupPreviewUrl && !generatingMockup && mockupStatus !== "failed" ? (
          <p className="mt-2 text-center text-[11px] text-slate-500" data-testid="cup-mockup-pending">
            {copy.preview.mockupPending}
          </p>
        ) : null}
      </div>

      <div
        aria-live="polite"
        className="shrink-0 space-y-2 rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-xs"
        data-testid="cup-mockup-actions"
      >
        {mockupStatus === "generating" || generatingMockup ? (
          <p className="text-amber-200" data-testid="cup-mockup-status-generating">
            {copy.mockup.generating}
          </p>
        ) : null}
        {mockupStatus === "complete" && previewMode === "mockup" ? (
          <p className="text-emerald-300">{copy.mockup.generatedDisclaimer}</p>
        ) : null}
        {mockupStatus === "stale" ? (
          <p className="text-amber-200" data-testid="cup-mockup-status-stale">
            {copy.mockup.stale}
          </p>
        ) : null}
        {mockupStatus === "failed" ? (
          <p className="text-rose-300" data-testid="cup-mockup-status-failed">
            {copy.mockup.failed}
          </p>
        ) : null}
        <button
          aria-busy={generatingMockup}
          className="w-full rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-semibold text-orange-100 hover:bg-orange-500/20 disabled:opacity-50"
          data-testid="cup-generate-mockup-button"
          disabled={generatingMockup || !pricing}
          onClick={onGenerateMockup}
          type="button"
        >
          {generatingMockup ? copy.mockup.generating : copy.mockup.generateRealistic}
        </button>
        {mockupStatus === "failed" ? (
          <button
            className="w-full rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200"
            onClick={onGenerateMockup}
            type="button"
          >
            {copy.mockup.retry}
          </button>
        ) : null}
        <div className="flex gap-2">
          <button
            className="flex-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
            data-testid="cup-reset-mockup-button"
            disabled={generatingMockup || (!mockupPreviewUrl && mockupStatus === "none")}
            onClick={onResetMockup}
            type="button"
          >
            {copy.actions.resetMockup}
          </button>
          <button
            className="flex-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
            data-testid="cup-reset-design-button"
            disabled={generatingMockup || (!hasArtwork && mockupStatus === "none")}
            onClick={onResetDesign}
            type="button"
          >
            {copy.actions.resetDesign}
          </button>
        </div>
        <button
          className="w-full rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200"
          onClick={onSaveVisualization}
          type="button"
        >
          {copy.actions.saveVisualization}
        </button>
      </div>

      {pricing ? (
        <div className="shrink-0 rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm" data-testid="cup-preview-pricing">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase text-slate-500">{copy.sections.pricing}</span>
            {pricing.isEstimate ? (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                {copy.pricing.estimateBadge}
              </span>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <span className="text-slate-400">{copy.pricing.unitPrice}</span>
            <span className="text-right">
              {new Intl.NumberFormat(locale, { currency: "EUR", style: "currency" }).format(pricing.unitPrice)}
            </span>
            <span className="text-slate-400">{copy.pricing.total}</span>
            <span className="text-right font-bold">
              {new Intl.NumberFormat(locale, { currency: "EUR", style: "currency" }).format(pricing.total)}
            </span>
          </div>
          <button
            className="mt-2 text-[11px] font-semibold text-orange-300 hover:text-orange-200"
            onClick={onToggleAssumptions}
            type="button"
          >
            {copy.pricing.viewAssumptions}
          </button>
          {showAssumptions ? (
            <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[10px] text-slate-500">
              {pricing.assumptions.map((assumption) => (
                <li key={assumption}>{assumption}</li>
              ))}
            </ul>
          ) : null}
          <FormField label={copy.pricing.manualOverride}>
            <input
              className={inputClassName}
              data-testid="cup-manual-price-override"
              min={0}
              onChange={(event) =>
                onManualPriceChange(event.target.value ? Number(event.target.value) : null)
              }
              step="0.0001"
              type="number"
              value={manualUnitPriceOverride ?? ""}
            />
          </FormField>
          <FormField label={copy.pricing.overrideReason}>
            <input
              className={inputClassName}
              onChange={(event) => onOverrideReasonChange(event.target.value)}
              value={overrideReason}
            />
          </FormField>
        </div>
      ) : null}

      <div className="flex shrink-0 flex-wrap gap-2">
        <button
          aria-busy={saveStatus === "saving"}
          className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          disabled={saving}
          onClick={onSave}
          type="button"
        >
          {saveStatus === "saving" ? copy.actions.saving : copy.actions.save}
        </button>
        <button
          className="flex-1 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-400 disabled:opacity-50"
          disabled={saving || !pricing}
          onClick={onConvert}
          type="button"
        >
          {copy.actions.convertToQuote}
        </button>
      </div>
      {saveStatus === "saved" ? (
        <p aria-live="polite" className="text-center text-xs text-emerald-300">
          {copy.actions.saved}
        </p>
      ) : null}
      {saveStatus === "unsaved" ? (
        <p className="text-center text-xs text-amber-200">{copy.unsavedChanges}</p>
      ) : null}
    </div>
  );
}
