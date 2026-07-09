"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { AppFrame, panelClass, panelMutedClass } from "@/components/app-frame";
import { InventoryWorkflowPanels } from "@/components/inventory-workflow-panels";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  buildStockBalances,
  createLabelPrintJob,
  mockPrintTransport,
  renderHtmlLabel,
  renderZplLabel,
  resolveBarcode
} from "@/features/inventory-product/ledger";
import { getInventoryProductCopy } from "@/features/inventory-product/copy";
import { getInventoryMobileCopy } from "@/features/inventory-mobile/copy";
import { useInventoryWorkspaceData } from "@/lib/inventory/use-inventory-workspace-data";
import { usePersistence } from "@/persistence/provider";

export type InventoryProductSection =
  | "overview"
  | "products"
  | "items"
  | "variants"
  | "references"
  | "packaging"
  | "stock"
  | "receipts"
  | "transfers"
  | "adjustments"
  | "reservations"
  | "barcodes"
  | "labels"
  | "imports";

type Props = {
  dictionary: Dictionary;
  locale: Locale;
  mode: "products" | "inventory";
  section: InventoryProductSection;
};

const productSections: InventoryProductSection[] = [
  "overview",
  "products",
  "items",
  "variants",
  "references",
  "packaging",
  "barcodes",
  "labels",
  "imports"
];

const inventorySections: InventoryProductSection[] = [
  "overview",
  "stock",
  "receipts",
  "transfers",
  "adjustments",
  "reservations",
  "barcodes",
  "labels",
  "imports"
];

export function InventoryProductWorkspaceShell({ dictionary, locale, mode, section }: Props) {
  const copy = getInventoryProductCopy(locale);
  const mobileCopy = getInventoryMobileCopy(locale);
  const {
    canPersistLabels,
    error: workspaceError,
    loading,
    refresh,
    setSnapshot,
    snapshot: state,
    tenantId,
    workflows
  } = useInventoryWorkspaceData();
  const { notifyDataChanged, state: persistenceState } = usePersistence();
  const [barcodeInput, setBarcodeInput] = useState("05601234001005");
  const [message, setMessage] = useState(copy.messages.noPrivateData);
  const [zplContent, setZplContent] = useState("");

  const activeSections = mode === "products" ? productSections : inventorySections;
  const balances = useMemo(
    () => buildStockBalances(state.entries, state.reservations),
    [state.entries, state.reservations]
  );
  const physical = balances.reduce((sum, row) => sum + row.physicalStock, 0);
  const available = balances.reduce((sum, row) => sum + row.availableStock, 0);
  const reserved = balances.reduce((sum, row) => sum + row.reservedStock, 0);
  const quarantine = balances.reduce((sum, row) => sum + row.quarantinedStock, 0);
  const template = state.labelTemplates[0] ?? {
    active: true,
    barcodeSymbology: "code128" as const,
    createdAt: "",
    customerId: null,
    dpi: 203,
    height: 35,
    id: "label_fallback",
    layout: { barcodeField: "barcode", subtitleField: "subtitle", titleField: "title" },
    measurementUnit: "mm" as const,
    name: "Label",
    orientation: "landscape" as const,
    purpose: "item" as const,
    supportedFields: ["title", "subtitle", "barcode", "lot"],
    tenantId,
    updatedAt: "",
    version: 1,
    width: 70
  };
  const labelData = {
    barcode: state.barcodes[0]?.value ?? "05601234001005",
    lot: state.lots[0]?.internalLotNumber,
    quantity: "1000 un",
    subtitle: state.items[0]?.internalReference ?? "",
    title: state.items[0]?.name ?? ""
  };
  const htmlLabel = renderHtmlLabel(template, labelData);

  function handleResolveBarcode() {
    const result = resolveBarcode(state.barcodes, barcodeInput);
    if (result.status === "resolved") setMessage(copy.messages.barcodeResolved);
    if (result.status === "unknown") setMessage(copy.messages.barcodeUnknown);
    if (result.status === "ambiguous") setMessage(copy.messages.barcodeAmbiguous);
  }

  async function handleRenderZpl() {
    const rendered = renderZplLabel(template, labelData);
    setZplContent(rendered.content || rendered.warnings.join("\n"));
    const job = createLabelPrintJob(
      tenantId,
      template,
      labelData,
      { dpi: 203, id: "mock", name: "Mock printer", transport: "mock" },
      "operator_preview"
    );
    await mockPrintTransport();
    if (canPersistLabels && persistenceState.status === "ready") {
      await persistenceState.repos.inventoryProduct.recordLabelPrintJob(tenantId, job);
      setSnapshot(await persistenceState.repos.inventoryProduct.getSnapshot(tenantId));
      notifyDataChanged();
    }
    setMessage(`${copy.cards.zplDownload}: ${job.status}`);
  }

  return (
    <AppFrame activeModule={mode} dictionary={dictionary} locale={locale}>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--forge-accent-orange)]">
              {mode === "products" ? copy.products.eyebrow : copy.inventory.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--forge-text-primary)]">
              {mode === "products" ? copy.products.title : copy.inventory.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--forge-text-secondary)]">
              {mode === "products" ? copy.products.description : copy.inventory.description}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2">
            <div className="rounded-lg border border-[var(--forge-warning)]/40 bg-[var(--forge-warning-soft)] px-3 py-2 text-xs font-semibold text-[var(--forge-warning)]">
              {copy.messages.previewAuthorization}
            </div>
            {mode === "inventory" ? (
              <Link
                className="inline-flex min-h-10 items-center rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-4 text-sm font-semibold"
                href={`/${locale}/inventory/scan`}
              >
                {mobileCopy.desktop.openScanner}
              </Link>
            ) : null}
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label={dictionary.quotationsModule.tabs.label}>
          {activeSections.map((key) => (
            <Link
              className={
                key === section
                  ? "shrink-0 rounded-lg bg-[var(--forge-accent-orange)] px-3 py-2 text-sm font-semibold text-white"
                  : "shrink-0 rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-3 py-2 text-sm font-semibold text-[var(--forge-text-secondary)] hover:bg-[var(--forge-hover-bg)]"
              }
              href={`/${locale}/${mode}/${key}`}
              key={key}
            >
              {copy.tabs[key]}
            </Link>
          ))}
        </nav>

        <div className={panelMutedClass}>
          <p className="text-sm font-semibold text-[var(--forge-text-primary)]">
            {workspaceError ?? message}
          </p>
          {loading ? (
            <p className="mt-1 text-xs text-[var(--forge-text-muted)]">{copy.messages.noPrivateData}</p>
          ) : null}
        </div>

        <section className="grid gap-3 md:grid-cols-4">
          <Metric label={copy.cards.physical} value={physical.toLocaleString(locale)} />
          <Metric label={copy.cards.available} value={available.toLocaleString(locale)} />
          <Metric label={copy.cards.reserved} value={reserved.toLocaleString(locale)} />
          <Metric label={copy.cards.quarantine} value={quarantine.toLocaleString(locale)} />
        </section>

        {section === "products" || section === "overview" ? (
          <Panel title={copy.table.products}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="text-xs uppercase text-[var(--forge-text-muted)]">
                  <tr>
                    <th className="py-2">{copy.labels.product}</th>
                    <th>{copy.labels.reference}</th>
                    <th>{copy.labels.variant}</th>
                    <th>{copy.labels.item}</th>
                    <th>{copy.labels.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--forge-border)]">
                  {state.products.map((product) => {
                    const variant = state.variants.find((row) => row.productId === product.id);
                    const item = state.items.find((row) => row.id === product.sellableItemId);
                    return (
                      <tr key={product.id}>
                        <td className="py-3 font-semibold">{product.name}</td>
                        <td>{product.productCode}</td>
                        <td>{variant?.variantType ?? "-"}</td>
                        <td>{item?.internalReference ?? "-"}</td>
                        <td>{copy.states.active}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        ) : null}

        {section === "items" ? (
          <Panel title={copy.table.items}>
            <div className="grid gap-3 md:grid-cols-2">
              {state.items.map((item) => (
                <div className={panelMutedClass} key={item.id}>
                  <div className="text-sm font-bold">{item.name}</div>
                  <div className="mt-1 text-xs text-[var(--forge-text-muted)]">{item.internalReference}</div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <span>{item.itemType}</span>
                    <span>{item.lotTrackingPolicy}</span>
                    <span>Min: {item.minimumStock.toLocaleString(locale)}</span>
                    <span>Preferred: {item.preferredStock.toLocaleString(locale)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        ) : null}

        {section === "stock" || section === "receipts" || section === "transfers" || section === "adjustments" || section === "reservations" ? (
          <Panel
            title={
              section === "adjustments"
                ? "Adjustments"
                : section === "reservations"
                  ? "Reservations"
                  : copy.tabs[section]
            }
          >
            <InventoryWorkflowPanels
              locale={locale}
              onSnapshotChange={refresh}
              section={section}
              snapshot={state}
              workflows={workflows}
            />
          </Panel>
        ) : null}

        {section === "barcodes" ? (
          <Panel title={copy.table.barcodes}>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                className="min-w-0 flex-1 rounded-lg border border-[var(--forge-border)] bg-[var(--forge-input-bg)] px-3 py-2 text-sm"
                onChange={(event) => setBarcodeInput(event.target.value)}
                value={barcodeInput}
              />
              <WorkflowButton onClick={handleResolveBarcode}>{copy.actions.resolveBarcode}</WorkflowButton>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {state.barcodes.map((barcode) => (
                <div className={panelMutedClass} key={barcode.id}>
                  <div className="font-mono text-sm">{barcode.value}</div>
                  <div className="mt-1 text-xs text-[var(--forge-text-muted)]">
                    {barcode.ownershipType} / {barcode.symbology} / {barcode.status}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        ) : null}

        {section === "labels" ? (
          <Panel title={copy.cards.labelPreview}>
            <div className="grid gap-4 lg:grid-cols-2">
              <div dangerouslySetInnerHTML={{ __html: htmlLabel.content }} />
              <div>
                <WorkflowButton onClick={() => void handleRenderZpl()}>
                  {copy.actions.downloadZpl}
                </WorkflowButton>
                <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-black p-3 text-xs text-green-300">
                  {zplContent || renderZplLabel(template, labelData).content}
                </pre>
              </div>
            </div>
          </Panel>
        ) : null}

        {section === "imports" ? (
          <Panel title={copy.table.imports}>
            <div className="mb-3 text-sm text-[var(--forge-text-secondary)]">
              {copy.labels.importState}: {state.importBatch?.state ?? "needs_review"}
            </div>
            <div className="space-y-2">
              {state.importRows.map((row) => (
                <div className={panelMutedClass} key={row.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{row.normalizedValues.internalReference}</span>
                    <span className="text-xs text-[var(--forge-text-muted)]">{row.proposedAction}</span>
                  </div>
                  {row.errors.length > 0 ? (
                    <div className="mt-2 text-xs text-[var(--forge-danger)]">
                      {row.errors.join(" ")}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Panel>
        ) : null}

        {section === "variants" || section === "references" || section === "packaging" ? (
          <Panel title={copy.tabs[section]}>
            <div className="grid gap-3 md:grid-cols-3">
              <Metric label={copy.tabs.variants} value={state.variants.length.toString()} />
              <Metric label={copy.tabs.packaging} value={state.packaging.length.toString()} />
              <Metric label={copy.tabs.barcodes} value={state.barcodes.length.toString()} />
            </div>
          </Panel>
        ) : null}
      </div>
    </AppFrame>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={panelClass}>
      <div className="text-xs font-semibold uppercase text-[var(--forge-text-muted)]">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

function Panel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className={panelClass}>
      <h2 className="text-lg font-bold text-[var(--forge-text-primary)]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function WorkflowButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      className="rounded-lg bg-[var(--forge-accent-orange)] px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
