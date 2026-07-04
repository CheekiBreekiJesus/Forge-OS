"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CupPreview } from "@cup-customizer";
import {
  buildMockupAssetBlob,
  buildMockupFileName,
  buildPricingSnapshot,
  CUSTOMIZER_ARTWORK_POSITIONS,
  CUSTOMIZER_MATERIALS,
  CUSTOMIZER_PRINT_AREAS,
  DEFAULT_ARTWORK_OFFSET,
  DEFAULT_ARTWORK_ROTATION,
  DEFAULT_ARTWORK_SCALE,
  DEFAULT_QUANTITY,
  defaultConfiguration,
  filterCupProducts,
  normalizeConfiguration,
  resolveProductPreviewUrl,
  validateCustomizerArtwork,
  validateQuantity
} from "@/features/cup-customizer";
import {
  buildConfigurationFingerprint,
  generateDeterministicPhotorealisticMockup,
  buildPhotorealisticMockupFileName,
  resolveMockupGenerationStatus,
  type MockupGenerationMeta
} from "@/features/cup-customizer";
import {
  getNextStep,
  getPreviousStep,
  isStepComplete,
  validatePrintConfiguration,
  type CustomizerWorkflowStep
} from "@/features/cup-customizer";
import { deriveWorkflowStatus } from "@/features/cup-customizer";
import { AppFrame, panelClass } from "@/components/app-frame";
import {
  CupCustomizerWorkflowNav,
  shouldShowWorkflowSection
} from "@/components/cup-customizer-workflow-nav";
import {
  ArchiveConfirmationDialog,
  FormField,
  FormFieldError,
  LoadingState,
  PageHeader,
  PrimaryActionButton,
  RowActionMenu,
  inputClassName,
  selectClassName,
  textareaClassName
} from "@/components/crud";
import { QuotationsSubnav } from "@/components/quotations-subnav";
import type { Product } from "@/domain/product-types";
import type {
  CustomizerConfiguration,
  CustomizerSimulation
} from "@/domain/customizer-types";
import { blobToDataUrl } from "@/features/email-composition/local-asset";
import { isArchivedRecord, useHashAction } from "@/features/crud/ui-utils";
import { convertSimulationToQuote } from "@/persistence/indexeddb/customizer-repositories";
import {
  useCustomizerSimulations,
  useCustomers,
  useProducts,
  useTenantLeads
} from "@/persistence/hooks";
import { useCompanyProfile } from "@/persistence/profile-hooks";
import { usePersistence, usePersistenceLoading } from "@/persistence/provider";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getLocalizedModuleHref } from "@/modules/config";

type CupCustomizerShellProps = {
  dictionary: Dictionary;
  entryRoute?: string;
  locale: Locale;
};

export function CupCustomizerShell({
  dictionary,
  entryRoute = "quotations/customizer",
  locale
}: CupCustomizerShellProps) {
  const copy = dictionary.customizerModule;
  const shared = dictionary.crudModule;
  const router = useRouter();
  const searchParams = useSearchParams();
  const loading = usePersistenceLoading();
  const { state, tenantId, notifyDataChanged } = usePersistence();
  const { products, loading: productsLoading } = useProducts();
  const { customers } = useCustomers();
  const { leads } = useTenantLeads();
  const { profile } = useCompanyProfile();
  const [showArchived, setShowArchived] = useState(false);
  const { simulations, loading: simulationsLoading, reload: reloadSimulations } =
    useCustomizerSimulations(showArchived);

  const cupProducts = useMemo(() => filterCupProducts(products), [products]);

  const [activeSimulationId, setActiveSimulationId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string>("");
  const [leadId, setLeadId] = useState<string>("");
  const [productId, setProductId] = useState<string>("");
  const [configuration, setConfiguration] = useState<CustomizerConfiguration>(defaultConfiguration(null));
  const [quantity, setQuantity] = useState(DEFAULT_QUANTITY);
  const [notes, setNotes] = useState("");
  const [artworkAssetId, setArtworkAssetId] = useState<string | null>(null);
  const [artworkAssetIsOwned, setArtworkAssetIsOwned] = useState(false);
  const [mockupAssetId, setMockupAssetId] = useState<string | null>(null);
  const [mockupGeneration, setMockupGeneration] = useState<MockupGenerationMeta | null>(null);
  const [generatingMockup, setGeneratingMockup] = useState(false);
  const [activeStep, setActiveStep] = useState<CustomizerWorkflowStep>("product");
  const [isDesktop, setIsDesktop] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [artworkPreviewUrl, setArtworkPreviewUrl] = useState<string | null>(null);
  const [cupImageUrl, setCupImageUrl] = useState<string | null>(null);
  const [manualUnitPriceOverride, setManualUnitPriceOverride] = useState<number | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<CustomizerSimulation | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const selectedProduct = useMemo(
    () => cupProducts.find((product) => product.id === productId) ?? null,
    [cupProducts, productId]
  );

  const pricing = useMemo(() => {
    if (!selectedProduct) return null;
    return buildPricingSnapshot(
      selectedProduct,
      configuration,
      quantity,
      notes,
      manualUnitPriceOverride,
      overrideReason
    );
  }, [configuration, manualUnitPriceOverride, notes, overrideReason, quantity, selectedProduct]);

  const printValidation = useMemo(() => validatePrintConfiguration(configuration), [configuration]);

  const configurationFingerprint = useMemo(() => {
    if (!selectedProduct) return "";
    return buildConfigurationFingerprint(selectedProduct.id, configuration, quantity, artworkAssetId);
  }, [artworkAssetId, configuration, quantity, selectedProduct]);

  const mockupStatus = useMemo(
    () => resolveMockupGenerationStatus(mockupGeneration, configurationFingerprint),
    [configurationFingerprint, mockupGeneration]
  );

  const workflowContext = useMemo(
    () => ({
      hasArtwork: Boolean(artworkAssetId || artworkPreviewUrl),
      hasPreview: Boolean(selectedProduct),
      hasPricing: Boolean(pricing && (pricing.ruleId || pricing.manualUnitPriceOverride)),
      hasProduct: Boolean(selectedProduct),
      hasValidPrinting: printValidation.ok
    }),
    [artworkAssetId, artworkPreviewUrl, pricing, printValidation.ok, selectedProduct]
  );

  const completedSteps = useMemo(() => {
    const completed = new Set<CustomizerWorkflowStep>();
    for (const step of ["product", "printing", "artwork", "preview", "quotation"] as const) {
      if (isStepComplete(step, workflowContext)) completed.add(step);
    }
    return completed;
  }, [workflowContext]);

  const resetForm = useCallback(
    (product: Product | null) => {
      setActiveSimulationId(null);
      setCustomerId("");
      setLeadId("");
      setProductId(product?.id ?? "");
      setConfiguration(defaultConfiguration(product));
      setQuantity(DEFAULT_QUANTITY);
      setNotes("");
      setArtworkAssetId(null);
      setArtworkAssetIsOwned(false);
      setMockupAssetId(null);
      setMockupGeneration(null);
      setGeneratingMockup(false);
      setIsDirty(false);
      setArtworkPreviewUrl(null);
      setCupImageUrl(resolveProductPreviewUrl(product));
      setManualUnitPriceOverride(null);
      setOverrideReason("");
      setFormError(null);
      setFeedback(null);
    },
    []
  );

  const openCreate = useCallback(() => {
    resetForm(cupProducts[0] ?? null);
  }, [cupProducts, resetForm]);

  useHashAction("create", openCreate);

  const loadSimulation = useCallback(
    async (simulation: CustomizerSimulation) => {
      setActiveSimulationId(simulation.id);
      setCustomerId(simulation.customerId ?? "");
      setLeadId(simulation.leadId ?? "");
      setProductId(simulation.productId);
      const product = cupProducts.find((row) => row.id === simulation.productId) ?? null;
      setConfiguration(normalizeConfiguration(simulation.configuration, product));
      setQuantity(simulation.quantity);
      setNotes(simulation.notes);
      setArtworkAssetId(simulation.artworkAssetId);
      setArtworkAssetIsOwned(false);
      setMockupAssetId(simulation.mockupAssetId);
      setMockupGeneration(simulation.mockupGeneration ?? null);
      setManualUnitPriceOverride(simulation.pricing.manualUnitPriceOverride);
      setOverrideReason(simulation.pricing.overrideReason ?? "");
      setCupImageUrl(resolveProductPreviewUrl(product));
      if (simulation.artworkAssetId && state.status === "ready") {
        const asset = await state.repos.localAssets.getById(tenantId, simulation.artworkAssetId);
        if (asset) {
          setArtworkPreviewUrl(URL.createObjectURL(asset.blob));
        }
      } else {
        setArtworkPreviewUrl(null);
      }
    },
    [cupProducts, state, tenantId]
  );

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const paramProductId = searchParams.get("productId");
    const paramCustomerId = searchParams.get("customerId");
    const paramLeadId = searchParams.get("leadId");
    const paramSimulationId = searchParams.get("simulationId");

    if (paramProductId && cupProducts.some((product) => product.id === paramProductId)) {
      const product = cupProducts.find((row) => row.id === paramProductId) ?? null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from URL query
      resetForm(product);
      setProductId(paramProductId);
    } else if (cupProducts.length > 0 && !productId) {
      resetForm(cupProducts[0]);
    }

    if (paramCustomerId) setCustomerId(paramCustomerId);
    if (paramLeadId) setLeadId(paramLeadId);

    if (paramSimulationId && state.status === "ready") {
      void state.repos.customizerSimulations.getById(tenantId, paramSimulationId).then((row) => {
        if (row) void loadSimulation(row);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed from URL once products load
  }, [cupProducts.length, searchParams, state.status]);

  useEffect(() => {
    if (!selectedProduct) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync product defaults into form
    setCupImageUrl(resolveProductPreviewUrl(selectedProduct));
    setConfiguration((current) => normalizeConfiguration({
      ...current,
      cupSize: selectedProduct.capacity,
      cupType: selectedProduct.category,
      material: selectedProduct.material,
      printArea: selectedProduct.printArea || current.printArea
    }, selectedProduct));
  }, [selectedProduct]);

  useEffect(() => {
    return () => {
      if (artworkPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(artworkPreviewUrl);
      }
    };
  }, [artworkPreviewUrl]);

  async function uploadArtwork(file: File) {
    if (state.status !== "ready") return;
    const validation = validateCustomizerArtwork(file);
    if (!validation.ok) {
      const errorMessage =
        validation.errorKey === "fileTooLarge"
          ? copy.artwork.fileTooLarge
          : validation.errorKey === "unsafeFile"
            ? copy.artwork.unsafeFile
            : copy.artwork.unsupportedType;
      setFormError(errorMessage);
      return;
    }
    if (artworkAssetId && artworkAssetIsOwned) {
      await state.repos.localAssets.delete(tenantId, artworkAssetId).catch(() => {});
    }
    const asset = await state.repos.localAssets.create(tenantId, {
      assetType: "other",
      blob: file,
      fileName: file.name,
      mimeType: validation.mimeType,
      size: validation.size
    });
    setArtworkAssetId(asset.id);
    setArtworkAssetIsOwned(true);
    setArtworkPreviewUrl(URL.createObjectURL(file));
    notifyDataChanged();
    setFeedback(copy.artwork.uploaded);
  }

  async function applyCompanyLogoArtwork() {
    if (state.status !== "ready" || !profile?.logoLocalAssetId) {
      setFormError(copy.artwork.noLogo);
      return;
    }
    const asset = await state.repos.localAssets.getById(tenantId, profile.logoLocalAssetId);
    if (!asset) {
      setFormError(copy.artwork.noLogo);
      return;
    }
    setArtworkAssetId(asset.id);
    setArtworkAssetIsOwned(false);
    setArtworkPreviewUrl(URL.createObjectURL(asset.blob));
    setFeedback(copy.artwork.logoApplied);
  }

  async function applyProductImageArtwork() {
    if (!selectedProduct) return;
    const url = resolveProductPreviewUrl(selectedProduct);
    if (!url) {
      setFormError(copy.artwork.noProductImage);
      return;
    }
    try {
      const response = await fetch(url);
      if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) {
        throw new Error("Product image unavailable.");
      }
      const blob = await response.blob();
      const dataUrl = await blobToDataUrl(blob);
      setArtworkPreviewUrl(dataUrl);
      setArtworkAssetId(null);
      setArtworkAssetIsOwned(false);
      setFeedback(copy.artwork.productImageApplied);
    } catch {
      setFormError(copy.artwork.noProductImage);
    }
  }

  async function ensureMockupAsset(): Promise<string | null> {
    if (state.status !== "ready" || !selectedProduct || !pricing) return mockupAssetId;
    const blob = buildMockupAssetBlob(selectedProduct, configuration, quantity, pricing);
    const asset = await state.repos.localAssets.create(tenantId, {
      assetType: "product-image",
      blob,
      fileName: buildMockupFileName(selectedProduct.sku),
      mimeType: "image/svg+xml",
      size: blob.size
    });
    setMockupAssetId(asset.id);
    return asset.id;
  }

  async function handleGeneratePhotorealisticMockup() {
    if (state.status !== "ready" || !selectedProduct || !pricing) {
      setFormError(copy.form.required);
      return;
    }
    setGeneratingMockup(true);
    setFormError(null);
    setMockupGeneration((current) => ({
      configurationFingerprint: configurationFingerprint,
      generatedAt: current?.generatedAt ?? null,
      promptVersion: current?.promptVersion ?? null,
      provider: current?.provider ?? null,
      realisticMockupAssetId: current?.realisticMockupAssetId ?? null,
      status: "generating"
    }));
    try {
      const { blob, meta } = await generateDeterministicPhotorealisticMockup({
        artworkAssetId,
        configuration,
        existingMeta: mockupGeneration,
        pricing,
        product: selectedProduct,
        quantity
      });
      if (mockupGeneration?.realisticMockupAssetId && artworkAssetIsOwned) {
        await state.repos.localAssets
          .delete(tenantId, mockupGeneration.realisticMockupAssetId)
          .catch(() => {});
      }
      const asset = await state.repos.localAssets.create(tenantId, {
        assetType: "product-image",
        blob,
        fileName: buildPhotorealisticMockupFileName(selectedProduct.sku),
        mimeType: "image/svg+xml",
        size: blob.size
      });
      const nextMeta: MockupGenerationMeta = { ...meta, realisticMockupAssetId: asset.id };
      setMockupGeneration(nextMeta);
      setFeedback(copy.mockup.generated);
      notifyDataChanged();
    } catch {
      setMockupGeneration((current) => ({
        configurationFingerprint: configurationFingerprint,
        generatedAt: current?.generatedAt ?? null,
        promptVersion: current?.promptVersion ?? null,
        provider: "deterministic",
        realisticMockupAssetId: current?.realisticMockupAssetId ?? null,
        status: "failed"
      }));
      setFormError(copy.mockup.failed);
    } finally {
      setGeneratingMockup(false);
    }
  }

  async function handleSave() {
    if (state.status !== "ready" || !selectedProduct || !pricing) {
      setFormError(copy.form.required);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const nextMockupAssetId = await ensureMockupAsset();
      const workflowStatus = deriveWorkflowStatus({
        artworkAssetId,
        pricing,
        quoteId: activeSimulationId ? simulations.find((row) => row.id === activeSimulationId)?.quoteId ?? null : null,
        status: "saved"
      });
      const input = {
        artworkAssetId,
        mockupAssetId: nextMockupAssetId,
        mockupGeneration,
        configuration,
        customerId: customerId || null,
        leadId: leadId || null,
        notes,
        pricing,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity,
        status: "saved" as const,
        workflowStatus
      };
      if (activeSimulationId) {
        await state.repos.customizerSimulations.update(tenantId, activeSimulationId, input);
        setFeedback(copy.actions.saved);
      } else {
        const created = await state.repos.customizerSimulations.create(tenantId, input);
        setActiveSimulationId(created.id);
        setFeedback(copy.actions.saved);
      }
      setIsDirty(false);
      notifyDataChanged();
      await reloadSimulations();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : shared.error.generic);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConvertToQuote() {
    if (state.status !== "ready" || !pricing || !selectedProduct) {
      setFormError(copy.form.required);
      return;
    }
    setSubmitting(true);
    try {
      const nextMockupAssetId = await ensureMockupAsset();
      let simulationId = activeSimulationId;
      if (!simulationId) {
        const created = await state.repos.customizerSimulations.create(tenantId, {
          artworkAssetId,
          mockupAssetId: nextMockupAssetId,
          configuration,
          customerId: customerId || null,
          leadId: leadId || null,
          notes,
          pricing,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          quantity,
          status: "saved"
        });
        simulationId = created.id;
        setActiveSimulationId(created.id);
      } else {
        await state.repos.customizerSimulations.update(tenantId, simulationId, {
          artworkAssetId,
          mockupAssetId: nextMockupAssetId,
          configuration,
          customerId: customerId || null,
          leadId: leadId || null,
          notes,
          pricing,
          quantity
        });
      }
      if (!simulationId) {
        setFormError(copy.form.required);
        return;
      }
      await convertSimulationToQuote(
        tenantId,
        simulationId,
        state.repos.customizerSimulations,
        state.repos.quotes,
        state.repos.activities
      );
      notifyDataChanged();
      setFeedback(copy.actions.converted);
      router.push(`/${locale}/quotations`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : shared.error.generic);
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmArchive() {
    if (!archiveTarget || state.status !== "ready") return;
    setSubmitting(true);
    try {
      if (isArchivedRecord(archiveTarget)) {
        await state.repos.customizerSimulations.restore(tenantId, archiveTarget.id);
      } else {
        await state.repos.customizerSimulations.archive(tenantId, archiveTarget.id);
      }
      if (activeSimulationId === archiveTarget.id) {
        resetForm(cupProducts[0] ?? null);
      }
      notifyDataChanged();
      await reloadSimulations();
      setArchiveTarget(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppFrame
      activeModule="orders"
      dictionary={dictionary}
      locale={locale}
      supplementalRoute={entryRoute}
    >
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
              onClick={() => void handleSave()}
              type="button"
            >
              {copy.actions.save}
            </button>
            <PrimaryActionButton disabled={submitting} onClick={() => void handleConvertToQuote()}>
              {copy.actions.convertToQuote}
            </PrimaryActionButton>
          </div>
        }
        backHref={getLocalizedModuleHref(locale, "orders")}
        backLabel={dictionary.modulePage.backToDashboard}
        description={copy.description}
        title={copy.title}
      />

      <QuotationsSubnav dictionary={dictionary} locale={locale} />

      {isDirty ? <p className="mb-2 text-xs font-semibold text-amber-200">{copy.unsavedChanges}</p> : null}
      {feedback ? (
        <p aria-live="polite" className="mb-4 text-sm text-emerald-300">
          {feedback}
        </p>
      ) : null}
      <FormFieldError message={formError} />

      <CupCustomizerWorkflowNav
        activeStep={activeStep}
        canGoNext={Boolean(getNextStep(activeStep))}
        canGoPrevious={Boolean(getPreviousStep(activeStep))}
        completedSteps={completedSteps}
        copy={copy.workflow}
        onNext={() => {
          const next = getNextStep(activeStep);
          if (next) setActiveStep(next);
        }}
        onPrevious={() => {
          const previous = getPreviousStep(activeStep);
          if (previous) setActiveStep(previous);
        }}
        onStepChange={setActiveStep}
      />

      {loading || productsLoading || simulationsLoading ? (
        <LoadingState message={copy.loading} />
      ) : cupProducts.length === 0 ? (
        <div className={`${panelClass} p-8 text-center text-slate-400`}>{copy.emptyProducts}</div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            {shouldShowWorkflowSection("product", activeStep, isDesktop) ? (
            <section className={`${panelClass} p-5`}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">{copy.sections.context}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <FormField label={copy.form.customer}>
                  <select
                    className={selectClassName}
                    onChange={(event) => setCustomerId(event.target.value)}
                    value={customerId}
                  >
                    <option value="">{copy.form.selectCustomer}</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.companyName}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label={copy.form.lead}>
                  <select
                    className={selectClassName}
                    onChange={(event) => setLeadId(event.target.value)}
                    value={leadId}
                  >
                    <option value="">{copy.form.selectLead}</option>
                    {leads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.companyName}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label={copy.form.product} required>
                  <select
                    className={selectClassName}
                    onChange={(event) => setProductId(event.target.value)}
                    value={productId}
                  >
                    {cupProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label={copy.form.quantity} required>
                  <input
                    className={inputClassName}
                    min={1}
                    onChange={(event) => setQuantity(validateQuantity(Number(event.target.value)))}
                    type="number"
                    value={quantity}
                  />
                </FormField>
              </div>
            </section>
            ) : null}

            {shouldShowWorkflowSection("printing", activeStep, isDesktop) ? (
            <section className={`${panelClass} p-5`}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">{copy.sections.configuration}</h2>
              {!printValidation.ok ? (
                <p className="mt-2 text-sm text-rose-300">
                  {printValidation.errorKey === "tooManyColors"
                    ? copy.commercialDataRequired
                    : copy.commercialDataRequired}
                </p>
              ) : null}
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <FormField label={copy.form.material}>
                  <select
                    className={selectClassName}
                    onChange={(event) => setConfiguration({ ...configuration, material: event.target.value })}
                    value={configuration.material}
                  >
                    {CUSTOMIZER_MATERIALS.map((material) => (
                      <option key={material} value={material}>
                        {material}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label={copy.form.cupSize}>
                  <input
                    className={inputClassName}
                    onChange={(event) => setConfiguration({ ...configuration, cupSize: event.target.value })}
                    value={configuration.cupSize}
                  />
                </FormField>
                <FormField label={copy.form.cupType}>
                  <input
                    className={inputClassName}
                    onChange={(event) => setConfiguration({ ...configuration, cupType: event.target.value })}
                    value={configuration.cupType}
                  />
                </FormField>
                <FormField label={copy.form.printColors}>
                  <input
                    className={inputClassName}
                    min={1}
                    onChange={(event) =>
                      setConfiguration({ ...configuration, printColorCount: Number(event.target.value) })
                    }
                    type="number"
                    value={configuration.printColorCount}
                  />
                </FormField>
                <FormField label={copy.form.printArea}>
                  <select
                    className={selectClassName}
                    onChange={(event) => setConfiguration({ ...configuration, printArea: event.target.value })}
                    value={configuration.printArea}
                  >
                    {CUSTOMIZER_PRINT_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {copy.printAreas[area as keyof typeof copy.printAreas] ?? area}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label={copy.form.artworkPosition}>
                  <select
                    className={selectClassName}
                    onChange={(event) =>
                      setConfiguration({ ...configuration, artworkPosition: event.target.value })
                    }
                    value={configuration.artworkPosition}
                  >
                    {CUSTOMIZER_ARTWORK_POSITIONS.map((position) => (
                      <option key={position} value={position}>
                        {copy.artworkPositions[position as keyof typeof copy.artworkPositions] ?? position}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label={copy.form.artworkScale}>
                  <div className="flex items-center gap-3">
                    <input
                      className="w-full accent-orange-500"
                      max={1.6}
                      min={0.5}
                      onChange={(event) =>
                        setConfiguration({ ...configuration, artworkScale: Number(event.target.value) })
                      }
                      step={0.05}
                      type="range"
                      value={configuration.artworkScale}
                    />
                    <span className="w-12 text-right text-xs text-slate-400">
                      {Math.round(configuration.artworkScale * 100)}%
                    </span>
                  </div>
                </FormField>
                <FormField label={copy.form.artworkOffsetX}>
                  <div className="flex items-center gap-3">
                    <input
                      className="w-full accent-orange-500"
                      max={20}
                      min={-20}
                      onChange={(event) =>
                        setConfiguration({ ...configuration, artworkOffsetX: Number(event.target.value) })
                      }
                      step={1}
                      type="range"
                      value={configuration.artworkOffsetX}
                    />
                    <span className="w-12 text-right text-xs text-slate-400">
                      {configuration.artworkOffsetX}%
                    </span>
                  </div>
                </FormField>
                <FormField label={copy.form.artworkOffsetY}>
                  <div className="flex items-center gap-3">
                    <input
                      className="w-full accent-orange-500"
                      max={20}
                      min={-20}
                      onChange={(event) =>
                        setConfiguration({ ...configuration, artworkOffsetY: Number(event.target.value) })
                      }
                      step={1}
                      type="range"
                      value={configuration.artworkOffsetY}
                    />
                    <span className="w-12 text-right text-xs text-slate-400">
                      {configuration.artworkOffsetY}%
                    </span>
                  </div>
                </FormField>
                <FormField label={copy.form.artworkRotation}>
                  <div className="flex items-center gap-3">
                    <input
                      className="w-full accent-orange-500"
                      max={30}
                      min={-30}
                      onChange={(event) =>
                        setConfiguration({ ...configuration, artworkRotation: Number(event.target.value) })
                      }
                      step={1}
                      type="range"
                      value={configuration.artworkRotation}
                    />
                    <span className="w-12 text-right text-xs text-slate-400">
                      {configuration.artworkRotation}deg
                    </span>
                  </div>
                </FormField>
                <FormField label={copy.form.deliveryDate}>
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      setConfiguration({
                        ...configuration,
                        desiredDeliveryDate: event.target.value || null
                      })
                    }
                    type="date"
                    value={configuration.desiredDeliveryDate ?? ""}
                  />
                </FormField>
                <FormField label={copy.form.notes}>
                  <textarea
                    className={`${textareaClassName} md:col-span-2`}
                    onChange={(event) => setNotes(event.target.value)}
                    value={notes}
                  />
                </FormField>
              </div>
            </section>
            ) : null}

            {shouldShowWorkflowSection("artwork", activeStep, isDesktop) ? (
            <section className={`${panelClass} p-5`}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">{copy.sections.artwork}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <input
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadArtwork(file);
                  }}
                  ref={uploadRef}
                  type="file"
                />
                <button
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
                  onClick={() => uploadRef.current?.click()}
                  type="button"
                >
                  {copy.artwork.upload}
                </button>
                <button
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
                  onClick={() => void applyCompanyLogoArtwork()}
                  type="button"
                >
                  {copy.artwork.useLogo}
                </button>
                <button
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
                  onClick={() => void applyProductImageArtwork()}
                  type="button"
                >
                  {copy.artwork.useProductImage}
                </button>
                <button
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
                  onClick={() =>
                    setConfiguration({
                      ...configuration,
                      artworkOffsetX: DEFAULT_ARTWORK_OFFSET,
                      artworkOffsetY: DEFAULT_ARTWORK_OFFSET,
                      artworkPosition: "center",
                      artworkRotation: DEFAULT_ARTWORK_ROTATION,
                      artworkScale: DEFAULT_ARTWORK_SCALE
                    })
                  }
                  type="button"
                >
                  {copy.actions.resetView}
                </button>
              </div>
            </section>
            ) : null}

            {isDesktop ? (
            <section className={`${panelClass} p-5`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">{copy.sections.simulations}</h2>
                <PrimaryActionButton onClick={openCreate}>{copy.actions.newSimulation}</PrimaryActionButton>
              </div>
              <label className="mb-3 flex items-center gap-2 text-sm text-slate-300">
                <input
                  checked={showArchived}
                  onChange={(event) => setShowArchived(event.target.checked)}
                  type="checkbox"
                />
                {shared.showArchived}
              </label>
              <ul className="mt-3 space-y-2">
                {simulations.length === 0 ? (
                  <li className="text-sm text-slate-500">{copy.emptySimulations}</li>
                ) : (
                  simulations.map((simulation) => (
                    <li
                      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
                        simulation.id === activeSimulationId
                          ? "border-orange-500/50 bg-orange-500/10"
                          : "border-slate-800 bg-slate-950/40"
                      }`}
                      key={simulation.id}
                    >
                      <button
                        className="min-w-0 flex-1 text-left"
                        onClick={() => void loadSimulation(simulation)}
                        type="button"
                      >
                        <div className="truncate text-sm font-semibold">{simulation.productName}</div>
                        <div className="text-xs text-slate-500">
                          {simulation.quantity.toLocaleString(locale)} ·{" "}
                          {copy.statuses[simulation.status as keyof typeof copy.statuses]}
                        </div>
                      </button>
                      <RowActionMenu
                        actions={[
                          {
                            key: "dup",
                            label: shared.actions.duplicate,
                            onClick: async () => {
                              if (state.status !== "ready") return;
                              await state.repos.customizerSimulations.duplicate(tenantId, simulation.id);
                              notifyDataChanged();
                              await reloadSimulations();
                            }
                          },
                          {
                            key: "archive",
                            label: isArchivedRecord(simulation)
                              ? shared.actions.restore
                              : shared.actions.archive,
                            destructive: !isArchivedRecord(simulation),
                            onClick: () => setArchiveTarget(simulation)
                          }
                        ]}
                        triggerLabel={shared.actions.menu}
                      />
                    </li>
                  ))
                )}
              </ul>
            </section>
            ) : null}
          </div>

          <div className="space-y-5">
            {shouldShowWorkflowSection("preview", activeStep, isDesktop) ? (
            <section className={`${panelClass} p-5`}>
              <CupPreview
                artworkDataUrl={artworkPreviewUrl}
                artworkOffsetX={configuration.artworkOffsetX}
                artworkOffsetY={configuration.artworkOffsetY}
                artworkPosition={configuration.artworkPosition}
                artworkRotation={configuration.artworkRotation}
                artworkScale={configuration.artworkScale}
                brokenImageLabel={copy.preview.brokenProductImage}
                cupImageUrl={cupImageUrl}
                label={copy.preview.label}
                printArea={configuration.printArea}
              />
              <div className="mt-4 space-y-2 border-t border-slate-800 pt-4">
                <p className="text-xs font-semibold uppercase text-slate-500">{copy.mockup.summaryTitle}</p>
                <p className="text-xs text-slate-400">
                  {selectedProduct?.name} · {quantity.toLocaleString(locale)} · {configuration.printColorCount}{" "}
                  {copy.form.printColors.toLowerCase()}
                </p>
                {mockupStatus === "stale" ? (
                  <p className="text-xs text-amber-200">{copy.mockup.stale}</p>
                ) : null}
                <p className="text-[11px] text-slate-500">{copy.mockup.disclaimer}</p>
                <p className="text-[11px] text-slate-500">{copy.mockup.providerDeterministic}</p>
                <button
                  aria-busy={generatingMockup}
                  className="w-full rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-semibold text-orange-100 hover:bg-orange-500/20 disabled:opacity-50"
                  disabled={generatingMockup || !selectedProduct || !pricing}
                  onClick={() => void handleGeneratePhotorealisticMockup()}
                  type="button"
                >
                  {generatingMockup ? copy.mockup.generating : copy.mockup.generateRealistic}
                </button>
              </div>
            </section>
            ) : null}

            {shouldShowWorkflowSection("quotation", activeStep, isDesktop) ? (
            <section className={`${panelClass} p-5`}>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">{copy.sections.pricing}</h2>
                {pricing?.isEstimate ? (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-200">
                    {copy.pricing.estimateBadge}
                  </span>
                ) : null}
              </div>
              {pricing ? (
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{copy.pricing.unitPrice}</span>
                    <span>
                      {new Intl.NumberFormat(locale, { currency: "EUR", style: "currency" }).format(pricing.unitPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{copy.pricing.setupCost}</span>
                    <span>
                      {new Intl.NumberFormat(locale, { currency: "EUR", style: "currency" }).format(pricing.setupCost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{copy.pricing.subtotal}</span>
                    <span>
                      {new Intl.NumberFormat(locale, { currency: "EUR", style: "currency" }).format(pricing.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{copy.pricing.vat}</span>
                    <span>
                      {new Intl.NumberFormat(locale, { currency: "EUR", style: "currency" }).format(pricing.vat)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2 font-bold">
                    <span>{copy.pricing.total}</span>
                    <span>
                      {new Intl.NumberFormat(locale, { currency: "EUR", style: "currency" }).format(pricing.total)}
                    </span>
                  </div>
                  <FormField label={copy.pricing.manualOverride}>
                    <input
                      className={inputClassName}
                      min={0}
                      onChange={(event) =>
                        setManualUnitPriceOverride(event.target.value ? Number(event.target.value) : null)
                      }
                      step="0.0001"
                      type="number"
                      value={manualUnitPriceOverride ?? ""}
                    />
                  </FormField>
                  <FormField label={copy.pricing.overrideReason}>
                    <input
                      className={inputClassName}
                      onChange={(event) => setOverrideReason(event.target.value)}
                      value={overrideReason}
                    />
                  </FormField>
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-500">{copy.pricing.assumptions}</div>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-400">
                      {pricing.assumptions.map((assumption) => (
                        <li key={assumption}>{assumption}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">{copy.pricing.selectProduct}</p>
              )}
              {!pricing?.ruleId && !pricing?.manualUnitPriceOverride ? (
                <p className="mt-3 text-sm text-amber-200">{copy.commercialDataRequired}</p>
              ) : null}
            </section>
            ) : null}
          </div>
        </div>
      )}

      <ArchiveConfirmationDialog
        cancelLabel={shared.archive.cancel}
        confirmLabel={shared.archive.confirm}
        confirming={submitting}
        message={shared.archive.message}
        onCancel={() => setArchiveTarget(null)}
        onConfirm={() => void confirmArchive()}
        open={Boolean(archiveTarget)}
        title={shared.archive.title}
      />
    </AppFrame>
  );
}
