"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CupPreview,
  createForgeOSCustomizerBridge,
  type CupCustomizerAdapterInput
} from "@cup-customizer";
import { AppFrame, panelClass } from "@/components/app-frame";
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
import type {
  CustomizerConfiguration,
  CustomizerPricingSnapshot,
  CustomizerSimulation
} from "@/domain/customizer-types";
import type { Product } from "@/domain/product-types";
import { blobToDataUrl } from "@/features/email-composition/local-asset";
import { validateLocalAsset } from "@/features/email-composition/local-asset";
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
  locale: Locale;
};

const MATERIALS = ["PP", "Paper", "Reusable"];
const PRINT_AREAS = ["wrap", "front", "back"];
const ARTWORK_POSITIONS = ["left", "center", "right"];

function isCupProduct(product: Product): boolean {
  return (
    product.personalizationAvailable ||
    product.category.includes("cup") ||
    product.sku.toUpperCase().includes("CUP")
  );
}

function defaultConfiguration(product: Product | null): CustomizerConfiguration {
  return {
    artworkPosition: "center",
    cupSize: product?.capacity ?? "330 ml",
    cupType: product?.category ?? "personalized-cups",
    desiredDeliveryDate: null,
    material: product?.material ?? "PP",
    printArea: product?.printArea ?? "wrap",
    printColorCount: 1
  };
}

function buildPricingSnapshot(
  product: Product,
  configuration: CustomizerConfiguration,
  quantity: number,
  notes: string,
  manualUnitPriceOverride: number | null,
  overrideReason: string
): CustomizerPricingSnapshot {
  const bridge = createForgeOSCustomizerBridge();
  const input: CupCustomizerAdapterInput = {
    configuration: {
      ...configuration,
      notes,
      quantity
    },
    manualUnitPriceOverride: manualUnitPriceOverride ?? undefined,
    overrideReason: overrideReason || undefined,
    productId: product.id,
    productName: product.name,
    productSku: product.sku
  };
  const { pricing, ruleId } = bridge.estimatePricing(input);
  return {
    assumptions: pricing.assumptions,
    isEstimate: pricing.isEstimate,
    manualUnitPriceOverride,
    overrideReason: overrideReason || null,
    ruleId,
    setupCost: pricing.setupCost,
    subtotal: pricing.subtotal,
    total: pricing.total,
    unitPrice: pricing.unitPrice,
    vat: pricing.vat
  };
}

export function CupCustomizerShell({ dictionary, locale }: CupCustomizerShellProps) {
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

  const cupProducts = useMemo(() => products.filter(isCupProduct), [products]);

  const [activeSimulationId, setActiveSimulationId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string>("");
  const [leadId, setLeadId] = useState<string>("");
  const [productId, setProductId] = useState<string>("");
  const [configuration, setConfiguration] = useState<CustomizerConfiguration>(defaultConfiguration(null));
  const [quantity, setQuantity] = useState(1000);
  const [notes, setNotes] = useState("");
  const [artworkAssetId, setArtworkAssetId] = useState<string | null>(null);
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

  const resetForm = useCallback(
    (product: Product | null) => {
      setActiveSimulationId(null);
      setCustomerId("");
      setLeadId("");
      setProductId(product?.id ?? "");
      setConfiguration(defaultConfiguration(product));
      setQuantity(1000);
      setNotes("");
      setArtworkAssetId(null);
      setArtworkPreviewUrl(null);
      setCupImageUrl(product?.imageUrl || product?.thumbnailUrl || null);
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
      setConfiguration(simulation.configuration);
      setQuantity(simulation.quantity);
      setNotes(simulation.notes);
      setArtworkAssetId(simulation.artworkAssetId);
      setManualUnitPriceOverride(simulation.pricing.manualUnitPriceOverride);
      setOverrideReason(simulation.pricing.overrideReason ?? "");
      const product = cupProducts.find((row) => row.id === simulation.productId);
      setCupImageUrl(product?.imageUrl || product?.thumbnailUrl || null);
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
    setCupImageUrl(selectedProduct.imageUrl || selectedProduct.thumbnailUrl || null);
    setConfiguration((current) => ({
      ...current,
      cupSize: selectedProduct.capacity,
      cupType: selectedProduct.category,
      material: selectedProduct.material,
      printArea: selectedProduct.printArea || current.printArea
    }));
  }, [selectedProduct]);

  async function uploadArtwork(file: File) {
    if (state.status !== "ready") return;
    const validation = validateLocalAsset(file);
    if (!validation.ok) {
      setFormError(validation.error);
      return;
    }
    if (artworkAssetId) {
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
    setArtworkPreviewUrl(URL.createObjectURL(asset.blob));
    setFeedback(copy.artwork.logoApplied);
  }

  async function applyProductImageArtwork() {
    if (!selectedProduct) return;
    const url = selectedProduct.imageUrl || selectedProduct.thumbnailUrl;
    if (!url) {
      setFormError(copy.artwork.noProductImage);
      return;
    }
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const dataUrl = await blobToDataUrl(blob);
      setArtworkPreviewUrl(dataUrl);
      setArtworkAssetId(null);
      setFeedback(copy.artwork.productImageApplied);
    } catch {
      setFormError(copy.artwork.noProductImage);
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
      const input = {
        artworkAssetId,
        configuration,
        customerId: customerId || null,
        leadId: leadId || null,
        notes,
        pricing,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity,
        status: "saved" as const
      };
      if (activeSimulationId) {
        await state.repos.customizerSimulations.update(tenantId, activeSimulationId, input);
        setFeedback(copy.actions.saved);
      } else {
        const created = await state.repos.customizerSimulations.create(tenantId, input);
        setActiveSimulationId(created.id);
        setFeedback(copy.actions.saved);
      }
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
      let simulationId = activeSimulationId;
      if (!simulationId) {
        const created = await state.repos.customizerSimulations.create(tenantId, {
          artworkAssetId,
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
      supplementalRoute="quotations/customizer"
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

      {feedback ? <p className="mb-4 text-sm text-emerald-300">{feedback}</p> : null}
      <FormFieldError message={formError} />

      {loading || productsLoading || simulationsLoading ? (
        <LoadingState message={copy.loading} />
      ) : cupProducts.length === 0 ? (
        <div className={`${panelClass} p-8 text-center text-slate-400`}>{copy.emptyProducts}</div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
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
                    onChange={(event) => setQuantity(Number(event.target.value))}
                    type="number"
                    value={quantity}
                  />
                </FormField>
              </div>
            </section>

            <section className={`${panelClass} p-5`}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">{copy.sections.configuration}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <FormField label={copy.form.material}>
                  <select
                    className={selectClassName}
                    onChange={(event) => setConfiguration({ ...configuration, material: event.target.value })}
                    value={configuration.material}
                  >
                    {MATERIALS.map((material) => (
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
                    {PRINT_AREAS.map((area) => (
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
                    {ARTWORK_POSITIONS.map((position) => (
                      <option key={position} value={position}>
                        {copy.artworkPositions[position as keyof typeof copy.artworkPositions] ?? position}
                      </option>
                    ))}
                  </select>
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
              </div>
            </section>

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
          </div>

          <div className="space-y-5">
            <section className={`${panelClass} p-5`}>
              <CupPreview
                artworkDataUrl={artworkPreviewUrl}
                artworkPosition={configuration.artworkPosition}
                cupImageUrl={cupImageUrl}
                label={copy.preview.label}
                printArea={configuration.printArea}
              />
            </section>

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
            </section>
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
