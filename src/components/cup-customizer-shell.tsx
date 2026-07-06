"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  createPreviewUrlFromAssetBlob,
  processArtworkUpload,
  type ArtworkMetadata,
  type ArtworkUploadStatus
} from "@/features/cup-customizer/artwork-pipeline";
import { lookupStoredCustomerLogo } from "@/features/cup-customizer/customer-logos";
import {
  resolveLogoGenerationProvider,
  resolveLogoSearchProvider
} from "@/features/cup-customizer/logo-providers";
import { saveMarketingVisualization } from "@/features/cup-customizer/marketing-assets";
import { revokeObjectUrlIfBlob } from "@/features/cup-customizer/use-managed-object-url";
import { AppFrame, panelClass } from "@/components/app-frame";
import { CupCustomizerPreviewPanel } from "@/components/cup-customizer-preview-panel";
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
  const [artworkMetadata, setArtworkMetadata] = useState<ArtworkMetadata | null>(null);
  const [artworkUploadStatus, setArtworkUploadStatus] = useState<ArtworkUploadStatus>("idle");
  const [mockupPreviewUrl, setMockupPreviewUrl] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"design" | "mockup">("design");
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [showSimulations, setShowSimulations] = useState(false);
  const [customerLogoPreviewUrl, setCustomerLogoPreviewUrl] = useState<string | null>(null);
  const [customerLogoStatus, setCustomerLogoStatus] = useState<
    "idle" | "searching" | "found" | "not_found" | "loaded" | "failed"
  >("idle");
  const [saveStatus, setSaveStatus] = useState<"unsaved" | "saving" | "saved" | "failed">("saved");
  const [manualUnitPriceOverride, setManualUnitPriceOverride] = useState<number | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<CustomizerSimulation | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const logoSearchProvider = useMemo(() => resolveLogoSearchProvider(), []);
  const logoGenerationProvider = useMemo(() => resolveLogoGenerationProvider(), []);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === customerId) ?? null,
    [customers, customerId]
  );
  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === leadId) ?? null,
    [leadId, leads]
  );

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
      setArtworkMetadata(null);
      setArtworkUploadStatus("idle");
      setMockupPreviewUrl(null);
      setPreviewMode("design");
      setCustomerLogoPreviewUrl(null);
      setCustomerLogoStatus("idle");
      setSaveStatus("saved");
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
      setIsDirty(false);
      setSaveStatus("saved");
      if (simulation.artworkAssetId && state.status === "ready") {
        const asset = await state.repos.localAssets.getById(tenantId, simulation.artworkAssetId);
        if (asset) {
          revokeObjectUrlIfBlob(artworkPreviewUrl);
          const previewUrl = await createPreviewUrlFromAssetBlob(asset.blob, asset.mimeType);
          setArtworkPreviewUrl(previewUrl);
          setArtworkMetadata({
            fileName: asset.fileName,
            height: 0,
            mimeType: asset.mimeType,
            size: asset.size,
            width: 0
          });
          setArtworkUploadStatus("loaded");
        }
      } else {
        revokeObjectUrlIfBlob(artworkPreviewUrl);
        setArtworkPreviewUrl(null);
        setArtworkMetadata(null);
        setArtworkUploadStatus("idle");
      }
      if (simulation.mockupGeneration?.realisticMockupAssetId && state.status === "ready") {
        const mockupAsset = await state.repos.localAssets.getById(
          tenantId,
          simulation.mockupGeneration.realisticMockupAssetId
        );
        if (mockupAsset) {
          revokeObjectUrlIfBlob(mockupPreviewUrl);
          const url = await createPreviewUrlFromAssetBlob(mockupAsset.blob, mockupAsset.mimeType);
          setMockupPreviewUrl(url);
        }
      } else {
        revokeObjectUrlIfBlob(mockupPreviewUrl);
        setMockupPreviewUrl(null);
      }
    },
    [artworkPreviewUrl, cupProducts, mockupPreviewUrl, state, tenantId]
  );

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
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
      revokeObjectUrlIfBlob(artworkPreviewUrl);
      revokeObjectUrlIfBlob(mockupPreviewUrl);
      revokeObjectUrlIfBlob(customerLogoPreviewUrl);
    };
  }, [artworkPreviewUrl, customerLogoPreviewUrl, mockupPreviewUrl]);

  function artworkErrorMessage(errorKey: string): string {
    const map: Record<string, string> = {
      decodeFailed: copy.artwork.decodeFailed,
      fileTooLarge: copy.artwork.fileTooLarge,
      missingDimensions: copy.artwork.missingDimensions,
      persistenceFailed: copy.artwork.persistenceFailed,
      unsafeFile: copy.artwork.unsafeFile,
      unsafeSvg: copy.artwork.unsafeSvg,
      unsupportedType: copy.artwork.unsupportedType
    };
    return map[errorKey] ?? copy.artwork.failed;
  }

  async function uploadArtwork(file: File) {
    if (state.status !== "ready") {
      setFormError(copy.loading);
      return;
    }
    setArtworkUploadStatus("validating");
    setFormError(null);
    const processed = await processArtworkUpload(file);
    if (!processed.ok) {
      setArtworkUploadStatus("invalid");
      setFormError(artworkErrorMessage(processed.errorKey));
      return;
    }
    try {
      if (artworkAssetId && artworkAssetIsOwned) {
        await state.repos.localAssets.delete(tenantId, artworkAssetId).catch(() => {});
      }
      const asset = await state.repos.localAssets.create(tenantId, {
        assetType: "other",
        blob: processed.blob,
        fileName: processed.metadata.fileName,
        mimeType: processed.mimeType,
        size: processed.metadata.size
      });
      revokeObjectUrlIfBlob(artworkPreviewUrl);
      setArtworkAssetId(asset.id);
      setArtworkAssetIsOwned(true);
      setArtworkPreviewUrl(processed.previewUrl);
      setArtworkMetadata(processed.metadata);
      setArtworkUploadStatus(artworkPreviewUrl ? "replaced" : "loaded");
      setIsDirty(true);
      setSaveStatus("unsaved");
      notifyDataChanged();
      setFeedback(copy.artwork.loaded);
    } catch {
      revokeObjectUrlIfBlob(processed.previewUrl);
      setArtworkUploadStatus("failed");
      setFormError(copy.artwork.persistenceFailed);
    }
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
    revokeObjectUrlIfBlob(artworkPreviewUrl);
    const previewUrl = await createPreviewUrlFromAssetBlob(asset.blob, asset.mimeType);
    setArtworkAssetId(asset.id);
    setArtworkAssetIsOwned(false);
    setArtworkPreviewUrl(previewUrl);
    setArtworkMetadata({
      fileName: asset.fileName,
      height: 0,
      mimeType: asset.mimeType,
      size: asset.size,
      width: 0
    });
    setArtworkUploadStatus("loaded");
    setIsDirty(true);
    setSaveStatus("unsaved");
    setFeedback(copy.artwork.logoApplied);
  }

  async function lookupCustomerLogo() {
    if (state.status !== "ready" || (!customerId && !leadId)) {
      setCustomerLogoStatus("not_found");
      return;
    }
    setCustomerLogoStatus("searching");
    const result = await lookupStoredCustomerLogo({
      customer: selectedCustomer,
      customerId: customerId || null,
      lead: selectedLead,
      leadId: leadId || null,
      localAssets: state.repos.localAssets,
      metaGet: (key) => state.repos.meta.get(key),
      tenantId
    });
    if (result.status === "found") {
      const asset = await state.repos.localAssets.getById(tenantId, result.assetId);
      if (asset) {
        revokeObjectUrlIfBlob(customerLogoPreviewUrl);
        const url = await createPreviewUrlFromAssetBlob(asset.blob, asset.mimeType);
        setCustomerLogoPreviewUrl(url);
        setCustomerLogoStatus("found");
        setFeedback(copy.artwork.customerLogoFound);
        return;
      }
    }
    if (result.status === "failed") {
      setCustomerLogoStatus("failed");
      setFormError(copy.artwork.customerLogoFailed);
      return;
    }
    setCustomerLogoStatus("not_found");
    setFeedback(copy.artwork.customerLogoNotFound);
  }

  async function applyStoredCustomerLogo() {
    if (state.status !== "ready" || (!customerId && !leadId)) {
      setFormError(copy.artwork.customerLogoNotFound);
      return;
    }
    const result = await lookupStoredCustomerLogo({
      customer: selectedCustomer,
      customerId: customerId || null,
      lead: selectedLead,
      leadId: leadId || null,
      localAssets: state.repos.localAssets,
      metaGet: (key) => state.repos.meta.get(key),
      tenantId
    });
    if (result.status !== "found") {
      setFormError(copy.artwork.customerLogoNotFound);
      return;
    }
    const asset = await state.repos.localAssets.getById(tenantId, result.assetId);
    if (!asset) {
      setFormError(copy.artwork.customerLogoFailed);
      return;
    }
    revokeObjectUrlIfBlob(artworkPreviewUrl);
    const previewUrl = await createPreviewUrlFromAssetBlob(asset.blob, asset.mimeType);
    setArtworkAssetId(asset.id);
    setArtworkAssetIsOwned(false);
    setArtworkPreviewUrl(previewUrl);
    setArtworkMetadata({
      fileName: asset.fileName,
      height: 0,
      mimeType: asset.mimeType,
      size: asset.size,
      width: 0
    });
    setArtworkUploadStatus("loaded");
    setCustomerLogoStatus("loaded");
    setIsDirty(true);
    setSaveStatus("unsaved");
    setFeedback(copy.artwork.customerLogoApplied);
  }

  async function handleSearchLogoOnline() {
    if (!logoSearchProvider.isAvailable()) {
      setFormError(copy.artwork.providerNotConfigured);
      return;
    }
    const result = await logoSearchProvider.search({
      customerId: customerId || undefined,
      leadId: leadId || undefined,
      query: selectedCustomer?.companyName ?? selectedLead?.companyName
    });
    if (!result.ok) {
      setFormError(copy.artwork.providerNotConfigured);
      return;
    }
    setFeedback(`${copy.artwork.searchOnline}: ${result.candidates.length}`);
  }

  async function handleGenerateLogo() {
    if (!logoGenerationProvider.isAvailable()) {
      setFormError(copy.artwork.providerNotConfigured);
      return;
    }
    const result = await logoGenerationProvider.generate({
      brief: selectedCustomer?.companyName ?? selectedLead?.companyName ?? "Logo"
    });
    if (!result.ok || state.status !== "ready") {
      setFormError(copy.artwork.providerNotConfigured);
      return;
    }
    const asset = await state.repos.localAssets.create(tenantId, {
      assetType: "logo",
      blob: result.assetBlob,
      fileName: result.fileName,
      mimeType: result.mimeType,
      size: result.assetBlob.size
    });
    revokeObjectUrlIfBlob(artworkPreviewUrl);
    const previewUrl = await createPreviewUrlFromAssetBlob(result.assetBlob, result.mimeType);
    setArtworkAssetId(asset.id);
    setArtworkAssetIsOwned(true);
    setArtworkPreviewUrl(previewUrl);
    setArtworkUploadStatus("loaded");
    setIsDirty(true);
    setSaveStatus("unsaved");
    setFeedback(copy.artwork.loaded);
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
        artworkDataUrl: artworkPreviewUrl,
        configuration,
        existingMeta: mockupGeneration,
        pricing,
        product: selectedProduct,
        quantity
      });
      if (mockupGeneration?.realisticMockupAssetId) {
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
      revokeObjectUrlIfBlob(mockupPreviewUrl);
      const nextMockupUrl = await createPreviewUrlFromAssetBlob(blob, "image/svg+xml");
      setMockupPreviewUrl(nextMockupUrl);
      setPreviewMode("mockup");
      setIsDirty(true);
      setSaveStatus("unsaved");
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

  async function handleSaveVisualization() {
    if (state.status !== "ready" || !selectedProduct || !pricing) {
      setFormError(copy.form.required);
      return;
    }
    const sourceBlob =
      previewMode === "mockup" && mockupPreviewUrl
        ? await (await fetch(mockupPreviewUrl)).blob()
        : buildMockupAssetBlob(selectedProduct, configuration, quantity, pricing);
    try {
      await saveMarketingVisualization(state.repos.localAssets, state.repos.meta.set, {
        blob: sourceBlob,
        configurationFingerprint,
        customerId: customerId || null,
        fileName: buildMockupFileName(selectedProduct.sku),
        leadId: leadId || null,
        mimeType: "image/svg+xml",
        simulationId: activeSimulationId,
        source: previewMode === "mockup" ? "realistic-mockup" : "deterministic-preview",
        tenantId
      });
      setFeedback(copy.actions.visualizationSaved);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : copy.artwork.persistenceFailed);
    }
  }

  async function handleSave() {
    if (state.status !== "ready" || !selectedProduct || !pricing) {
      setFormError(copy.form.required);
      return;
    }
    setSubmitting(true);
    setSaveStatus("saving");
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
      setSaveStatus("saved");
      notifyDataChanged();
      await reloadSimulations();
    } catch (error) {
      setSaveStatus("failed");
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
        backHref={getLocalizedModuleHref(locale, "orders")}
        backLabel={dictionary.modulePage.backToDashboard}
        description={copy.description}
        title={copy.title}
      />

      <QuotationsSubnav dictionary={dictionary} locale={locale} />

      {isDirty || saveStatus === "unsaved" ? (
        <p className="mb-2 text-xs font-semibold text-amber-200">{copy.unsavedChanges}</p>
      ) : null}
      {artworkUploadStatus === "validating" ? (
        <p aria-live="polite" className="mb-2 text-xs text-slate-400">
          {copy.artwork.validating}
        </p>
      ) : null}
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
        <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,56%)_minmax(0,44%)] lg:items-start">
          <div className="min-h-0 space-y-3 overflow-y-auto lg:max-h-[calc(100vh-6rem)] lg:pr-1">
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
            <section className={`${panelClass} p-4`}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">{copy.sections.artwork}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadArtwork(file);
                  }}
                  ref={uploadRef}
                  type="file"
                />
                <button
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-800"
                  onClick={() => uploadRef.current?.click()}
                  type="button"
                >
                  {copy.artwork.uploadTitle}
                </button>
                <button
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-800"
                  onClick={() => void applyStoredCustomerLogo()}
                  type="button"
                >
                  {copy.artwork.useCustomerLogo}
                </button>
                <button
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-800"
                  onClick={() => void applyCompanyLogoArtwork()}
                  type="button"
                >
                  {copy.artwork.useLogo}
                </button>
                <button
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-800"
                  onClick={() => void handleSearchLogoOnline()}
                  type="button"
                >
                  {copy.artwork.searchOnline}
                </button>
                <button
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-800"
                  onClick={() => void handleGenerateLogo()}
                  type="button"
                >
                  {copy.artwork.generateLogo}
                </button>
                <button
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-800"
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
              {customerId || leadId ? (
                <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="rounded border border-slate-700 px-2 py-1 text-[11px] font-semibold"
                      onClick={() => void lookupCustomerLogo()}
                      type="button"
                    >
                      {copy.artwork.useCustomerLogo}
                    </button>
                    {customerLogoStatus === "searching" ? (
                      <span className="text-slate-400">{copy.artwork.customerLogoSearching}</span>
                    ) : null}
                    {customerLogoStatus === "not_found" ? (
                      <span className="text-slate-500">{copy.artwork.customerLogoNotFound}</span>
                    ) : null}
                    {customerLogoPreviewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" className="size-8 rounded border border-slate-700 object-contain" src={customerLogoPreviewUrl} />
                    ) : null}
                  </div>
                  {!profile?.logoLocalAssetId ? (
                    <p className="mt-2 text-slate-500">
                      <Link className="text-orange-300 underline" href={`/${locale}/settings`}>
                        {copy.artwork.noCompanyLogoLink}
                      </Link>
                    </p>
                  ) : null}
                </div>
              ) : null}
              {artworkMetadata ? (
                <p className="mt-2 text-xs text-slate-500" data-testid="artwork-metadata-line">
                  {artworkMetadata.fileName}
                  {artworkMetadata.width > 0
                    ? ` · ${artworkMetadata.width}×${artworkMetadata.height}`
                    : ""}
                </p>
              ) : null}
            </section>
            ) : null}

            {isDesktop ? (
            <section className={`${panelClass} p-4`}>
              <button
                className="flex w-full items-center justify-between gap-2 text-left"
                onClick={() => setShowSimulations((current) => !current)}
                type="button"
              >
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                  {copy.sections.simulations}
                </h2>
                <span className="text-xs text-slate-500">{showSimulations ? "−" : "+"}</span>
              </button>
              {showSimulations ? (
              <>
              <div className="mt-3 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    checked={showArchived}
                    onChange={(event) => setShowArchived(event.target.checked)}
                    type="checkbox"
                  />
                  {shared.showArchived}
                </label>
                <PrimaryActionButton onClick={openCreate}>{copy.actions.newSimulation}</PrimaryActionButton>
              </div>
              <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
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
              </>
              ) : null}
            </section>
            ) : null}
          </div>

          <div className="min-h-0">
            {shouldShowWorkflowSection("preview", activeStep, isDesktop) ||
            shouldShowWorkflowSection("quotation", activeStep, isDesktop) ? (
              <CupCustomizerPreviewPanel
                artworkMetadata={artworkMetadata}
                artworkPreviewUrl={artworkPreviewUrl}
                capacity={configuration.cupSize}
                configuration={configuration}
                copy={copy}
                cupColor={selectedProduct?.color ?? "White"}
                generatingMockup={generatingMockup}
                locale={locale}
                manualUnitPriceOverride={manualUnitPriceOverride}
                material={configuration.material}
                mockupPreviewUrl={mockupPreviewUrl}
                mockupStatus={mockupStatus}
                onConvert={() => void handleConvertToQuote()}
                onGenerateMockup={() => void handleGeneratePhotorealisticMockup()}
                onManualPriceChange={setManualUnitPriceOverride}
                onOverrideReasonChange={setOverrideReason}
                onPreviewModeChange={setPreviewMode}
                onSave={() => void handleSave()}
                onSaveVisualization={() => void handleSaveVisualization()}
                onToggleAssumptions={() => setShowAssumptions((current) => !current)}
                onUploadFile={(file) => void uploadArtwork(file)}
                onUploadRequest={() => uploadRef.current?.click()}
                overrideReason={overrideReason}
                previewMode={previewMode}
                pricing={pricing}
                printArea={configuration.printArea}
                saveStatus={saveStatus}
                saving={submitting}
                showAssumptions={showAssumptions}
              />
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
