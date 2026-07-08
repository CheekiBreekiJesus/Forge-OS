"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { AppFrame, panelClass, panelMutedClass } from "@/components/app-frame";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  buildStockBalances,
  createLabelPrintJob,
  mockPrintTransport,
  postInventoryTransaction,
  renderHtmlLabel,
  renderZplLabel,
  resolveBarcode,
  reverseInventoryTransaction,
  type PostTransactionInput
} from "@/features/inventory-product/ledger";
import { getInventoryProductCopy } from "@/features/inventory-product/copy";
import { createInventoryProductDemoState } from "@/features/inventory-product/demo";
import { usePersistence } from "@/persistence/provider";
import type { InventoryProductSnapshot } from "@/persistence/interfaces";

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
  "barcodes",
  "labels",
  "imports"
];

export function InventoryProductWorkspaceShell({ dictionary, locale, mode, section }: Props) {
  const copy = getInventoryProductCopy(locale);
  const { notifyDataChanged, state: persistenceState, tenantId } = usePersistence();
  const [state, setState] = useState<InventoryProductSnapshot>(() => createInventoryProductDemoState());
  const [barcodeInput, setBarcodeInput] = useState("05601234001005");
  const [message, setMessage] = useState(copy.messages.noPrivateData);
  const [zplContent, setZplContent] = useState("");

  useEffect(() => {
    if (persistenceState.status !== "ready") return;

    let cancelled = false;
    async function loadSnapshot() {
      if (persistenceState.status !== "ready") return;
      let snapshot = await persistenceState.repos.inventoryProduct.getSnapshot(tenantId);
      if (snapshot.items.length === 0) {
        await persistenceState.repos.inventoryProduct.seedDemoFoundation(tenantId);
        snapshot = await persistenceState.repos.inventoryProduct.getSnapshot(tenantId);
      }
      if (cancelled) return;
      setState(snapshot);
    }

    void loadSnapshot().catch((error) => {
      if (!cancelled) {
        setMessage(error instanceof Error ? error.message : copy.messages.noPrivateData);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [copy.messages.noPrivateData, persistenceState, tenantId]);

  const activeSections = mode === "products" ? productSections : inventorySections;
  const balances = useMemo(
    () => buildStockBalances(state.entries, state.reservations),
    [state.entries, state.reservations]
  );
  const physical = balances.reduce((sum, row) => sum + row.physicalStock, 0);
  const available = balances.reduce((sum, row) => sum + row.availableStock, 0);
  const reserved = balances.reduce((sum, row) => sum + row.reservedStock, 0);
  const quarantine = balances.reduce((sum, row) => sum + row.quarantinedStock, 0);
  const template = state.labelTemplates[0]!;
  const labelData = {
    barcode: state.barcodes[0]?.value ?? "05601234001005",
    lot: state.lots[0]?.internalLotNumber,
    quantity: "1000 un",
    subtitle: state.items[0]?.internalReference ?? "",
    title: state.items[0]?.name ?? ""
  };
  const htmlLabel = renderHtmlLabel(template, labelData);

  async function postReceipt() {
    const input: PostTransactionInput = {
      entries: [
        {
          baseQuantityDelta: 1000,
          costBasis: 0.042,
          itemId: "item_clear_cup_330",
          itemReferenceSnapshot: "FG-CUP-330-CLR",
          locationId: "loc_a_r1_s1",
          lotId: "lot_cup_330_001",
          productVariantId: "variant_clear_cup_330_box",
          productVariantSnapshot: "PROD-CUP-330 / 1000-unit box",
          quantityDelta: 1000,
          stockCondition: "available",
          unitOfMeasureId: "uom_unit",
          warehouseId: "wh_main"
        }
      ],
      idempotencyKey: `ui:receipt:${state.transactions.length}`,
      occurredAt: new Date().toISOString(),
      operatorId: "operator_preview",
      reasonCode: "receipt",
      sourceDocumentId: "receipt_preview",
      sourceDocumentType: "receipt",
      tenantId,
      transactionType: "receipt"
    };

    if (persistenceState.status === "ready") {
      await persistenceState.repos.inventoryProduct.postTransaction(tenantId, input);
      setState(await persistenceState.repos.inventoryProduct.getSnapshot(tenantId));
      notifyDataChanged();
    } else {
      const next = postInventoryTransaction(
        state,
        input,
        (prefix) =>
          `${prefix}_ui_${state.entries.length}_${prefix === "ile" ? "entry" : "receipt"}`
      );
      setState((current) => ({ ...current, entries: next.entries, transactions: next.transactions }));
    }
    setMessage(copy.messages.receiptPosted);
  }

  async function postTransfer() {
    const input: PostTransactionInput = {
      entries: [
        {
          baseQuantityDelta: -500,
          costBasis: 0.041,
          itemId: "item_clear_cup_330",
          itemReferenceSnapshot: "FG-CUP-330-CLR",
          locationId: "loc_a_r1_s1",
          lotId: "lot_cup_330_001",
          productVariantId: "variant_clear_cup_330_box",
          productVariantSnapshot: "PROD-CUP-330 / 1000-unit box",
          quantityDelta: -500,
          stockCondition: "available",
          unitOfMeasureId: "uom_unit",
          warehouseId: "wh_main"
        },
        {
          baseQuantityDelta: 500,
          costBasis: 0.041,
          itemId: "item_clear_cup_330",
          itemReferenceSnapshot: "FG-CUP-330-CLR",
          locationId: "loc_quarantine",
          lotId: "lot_cup_330_001",
          productVariantId: "variant_clear_cup_330_box",
          productVariantSnapshot: "PROD-CUP-330 / 1000-unit box",
          quantityDelta: 500,
          stockCondition: "quarantine",
          unitOfMeasureId: "uom_unit",
          warehouseId: "wh_main"
        }
      ],
      idempotencyKey: `ui:transfer:${state.transactions.length}`,
      occurredAt: new Date().toISOString(),
      operatorId: "operator_preview",
      reasonCode: "quality_hold",
      tenantId,
      transactionType: "location_transfer"
    };

    if (persistenceState.status === "ready") {
      await persistenceState.repos.inventoryProduct.postTransaction(tenantId, input);
      setState(await persistenceState.repos.inventoryProduct.getSnapshot(tenantId));
      notifyDataChanged();
    } else {
      const next = postInventoryTransaction(
        state,
        input,
        (prefix) =>
          `${prefix}_ui_${state.entries.length}_${prefix === "ile" ? "entry" : "transfer"}`
      );
      setState((current) => ({ ...current, entries: next.entries, transactions: next.transactions }));
    }
    setMessage(copy.messages.transferPosted);
  }

  async function reverseLast() {
    const last = [...state.transactions].reverse().find((row) => row.transactionType !== "reversal");
    if (!last) return;
    if (persistenceState.status === "ready") {
      await persistenceState.repos.inventoryProduct.reverseTransaction(
        tenantId,
        last.id,
        "operator_preview",
        "preview_reversal"
      );
      setState(await persistenceState.repos.inventoryProduct.getSnapshot(tenantId));
      notifyDataChanged();
    } else {
      const next = reverseInventoryTransaction(
        state,
        last.id,
        tenantId,
        "operator_preview",
        "preview_reversal",
        (prefix) => `${prefix}_ui_${state.entries.length}_reverse`
      );
      setState((current) => ({ ...current, entries: next.entries, transactions: next.transactions }));
    }
    setMessage(copy.actions.reverseLast);
  }

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
    if (persistenceState.status === "ready") {
      await persistenceState.repos.inventoryProduct.recordLabelPrintJob(tenantId, job);
      setState(await persistenceState.repos.inventoryProduct.getSnapshot(tenantId));
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
          <div className="rounded-lg border border-[var(--forge-warning)]/40 bg-[var(--forge-warning-soft)] px-3 py-2 text-xs font-semibold text-[var(--forge-warning)]">
            {copy.messages.previewAuthorization}
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
          <p className="text-sm font-semibold text-[var(--forge-text-primary)]">{message}</p>
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

        {section === "stock" ? (
          <Panel title={copy.table.movements}>
            <LedgerTable entries={state.entries} locale={locale} />
          </Panel>
        ) : null}

        {section === "receipts" ? (
          <Panel title={copy.cards.receipt}>
            <WorkflowButton onClick={() => void postReceipt()}>{copy.actions.postReceipt}</WorkflowButton>
          </Panel>
        ) : null}

        {section === "transfers" ? (
          <Panel title={copy.cards.transfer}>
            <div className="flex flex-wrap gap-2">
              <WorkflowButton onClick={() => void postTransfer()}>{copy.actions.postTransfer}</WorkflowButton>
              <WorkflowButton onClick={() => void reverseLast()}>{copy.actions.reverseLast}</WorkflowButton>
            </div>
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

function LedgerTable({
  entries,
  locale
}: {
  entries: InventoryProductSnapshot["entries"];
  locale: Locale;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="text-xs uppercase text-[var(--forge-text-muted)]">
          <tr>
            <th className="py-2">Item</th>
            <th>Location</th>
            <th>Lot</th>
            <th>Condition</th>
            <th>Delta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--forge-border)]">
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="py-3 font-mono text-xs">{entry.itemReferenceSnapshot}</td>
              <td>{entry.locationId}</td>
              <td>{entry.lotId ?? "-"}</td>
              <td>{entry.stockCondition}</td>
              <td>{entry.baseQuantityDelta.toLocaleString(locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
