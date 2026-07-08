"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  approveDemoQuotation,
  assignDemoMachine,
  convertDemoLead,
  createDemoLead,
  createDemoProductionOrder,
  createDemoQuotation,
  logDemoProduction,
  qualifyDemoLead,
  reserveDemoInventory,
  type DemoActionResult
} from "@/application/demo-workflow-service";
import { AppFrame, panelClass } from "@/components/app-frame";
import {
  usePersistence,
  usePersistenceError,
  usePersistenceLoading
} from "@/persistence/provider";
import { demoProducts, demoInventoryItems } from "@/demo/seed";
import { findCompatibleMachine, reserveInventoryForProduction } from "@/demo/workflow";
import { getLocalizedLeadDetailHref } from "@/features/leadops/lookup";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getLocalizedModuleHref } from "@/modules/config";

type DemoWorkflowShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

type WorkflowContext = {
  leadId: string | null;
  customerId: string | null;
  opportunityId: string | null;
  quoteId: string | null;
  productionOrderId: string | null;
};

const DEMO_STEPS = [
  "createLead",
  "qualifyLead",
  "convertLead",
  "openOutreach",
  "createQuote",
  "approveQuote",
  "createProduction",
  "openJobCard",
  "assignMachine",
  "reserveInventory",
  "logProduction"
] as const;

type StepKey = (typeof DEMO_STEPS)[number];

const DEMO_CTX_STORAGE_KEY = "forgeos:demo:workflow-ctx";
const DEMO_STEP_STORAGE_KEY = "forgeos:demo:workflow-step";

function readStoredDemoStep(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.sessionStorage.getItem(DEMO_STEP_STORAGE_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function readStoredDemoContext(): WorkflowContext | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(DEMO_CTX_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WorkflowContext;
  } catch {
    return null;
  }
}

export function DemoWorkflowShell({ dictionary, locale }: DemoWorkflowShellProps) {
  const copy = dictionary.demoWorkflow;
  const persistenceLoading = usePersistenceLoading();
  const persistenceError = usePersistenceError();
  const { state, resetDemoData, notifyDataChanged } = usePersistence();

  const router = useRouter();
  const cupProducts = demoProducts.filter((p) => p.category === "personalized-cups");
  const [stepIndex, setStepIndex] = useState(readStoredDemoStep);
  const [selectedProductId, setSelectedProductId] = useState(cupProducts[1]?.id ?? cupProducts[0]?.id);
  const [quantity, setQuantity] = useState(12000);
  const [companyName, setCompanyName] = useState("Demo Hospitality Client");
  const [contactName, setContactName] = useState("Ana Martins");
  const [email, setEmail] = useState(() => `demo.${Date.now()}@example.invalid`);
  const [inventory, setInventory] = useState(demoInventoryItems);
  const [ctx, setCtx] = useState<WorkflowContext>(() => readStoredDemoContext() ?? {
    leadId: null,
    customerId: null,
    opportunityId: null,
    quoteId: null,
    productionOrderId: null
  });
  const [lastResult, setLastResult] = useState<DemoActionResult | null>(null);
  const [running, setRunning] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const product = demoProducts.find((p) => p.id === selectedProductId) ?? cupProducts[0];
  const machine = findCompatibleMachine(product);
  const currentStep = DEMO_STEPS[Math.min(stepIndex, DEMO_STEPS.length - 1)];

  useEffect(() => {
    window.sessionStorage.setItem(DEMO_CTX_STORAGE_KEY, JSON.stringify(ctx));
    window.sessionStorage.setItem(DEMO_STEP_STORAGE_KEY, String(stepIndex));
  }, [ctx, stepIndex]);

  const advanceStep = useCallback(() => {
    setStepIndex((index) => Math.min(index + 1, DEMO_STEPS.length));
  }, []);

  const runAction = useCallback(
    async (action: () => Promise<DemoActionResult>) => {
      if (state.status !== "ready" || running) return;
      setRunning(true);
      setLastResult(null);
      try {
        const result = await action();
        setLastResult(result);
        if (result.ok) {
          notifyDataChanged();
          setStepIndex((i) => Math.min(i + 1, DEMO_STEPS.length));
        }
      } finally {
        setRunning(false);
      }
    },
    [state, running, notifyDataChanged]
  );

  async function handleStepAction() {
    if (state.status !== "ready") return;
    const repos = state.repos;
    const tenantId = state.tenantId;

    switch (currentStep) {
      case "createLead":
        await runAction(() =>
          createDemoLead(repos, tenantId, {
            companyName,
            contactName,
            email,
            productId: product.id,
            quantity,
            notes: copy.fields.demoNotesDefault
          }).then((r) => {
            if (r.ok) setCtx((c) => ({ ...c, leadId: String(r.data.leadId) }));
            return r;
          })
        );
        break;
      case "qualifyLead":
        if (!ctx.leadId) return;
        await runAction(() => qualifyDemoLead(repos, tenantId, ctx.leadId!));
        break;
      case "convertLead":
        if (!ctx.leadId) return;
        await runAction(() =>
          convertDemoLead(repos, tenantId, ctx.leadId!).then((r) => {
            if (r.ok) {
              setCtx((c) => ({
                ...c,
                customerId: String(r.data.customerId),
                opportunityId: String(r.data.opportunityId)
              }));
            }
            return r;
          })
        );
        break;
      case "openOutreach":
        if (ctx.leadId) {
          advanceStep();
          router.push(getLocalizedLeadDetailHref(locale, ctx.leadId));
        }
        break;
      case "createQuote":
        if (!ctx.leadId) return;
        await runAction(() =>
          createDemoQuotation(repos, tenantId, {
            leadId: ctx.leadId!,
            customerId: ctx.customerId,
            opportunityId: ctx.opportunityId,
            productId: product.id,
            quantity,
            printColorCount: 2
          }).then((r) => {
            if (r.ok) setCtx((c) => ({ ...c, quoteId: String(r.data.quoteId) }));
            return r;
          })
        );
        break;
      case "approveQuote":
        if (!ctx.quoteId) return;
        await runAction(() => approveDemoQuotation(repos, tenantId, ctx.quoteId!));
        break;
      case "createProduction":
        if (!ctx.quoteId) return;
        await runAction(() =>
          createDemoProductionOrder(repos, tenantId, ctx.quoteId!).then((r) => {
            if (r.ok) {
              setCtx((c) => ({
                ...c,
                productionOrderId: String(r.data.productionOrderId)
              }));
            }
            return r;
          })
        );
        break;
      case "openJobCard":
        if (ctx.productionOrderId) {
          advanceStep();
          router.push(`/${locale}/jobs/${ctx.productionOrderId}`);
        }
        break;
      case "assignMachine":
        if (!ctx.productionOrderId) return;
        await runAction(() =>
          assignDemoMachine(
            repos,
            tenantId,
            ctx.productionOrderId!,
            machine.id,
            machine.name
          )
        );
        break;
      case "reserveInventory":
        if (!ctx.productionOrderId) return;
        await runAction(() =>
          reserveDemoInventory(repos, tenantId, ctx.productionOrderId!).then((r) => {
            if (r.ok) {
              setInventory((inv) =>
                reserveInventoryForProduction({ inventory: inv, product, quantity })
              );
            }
            return r;
          })
        );
        break;
      case "logProduction":
        if (!ctx.productionOrderId) return;
        await runAction(() =>
          logDemoProduction(repos, tenantId, ctx.productionOrderId!, 35)
        );
        break;
    }
  }

  function getStepLabel(key: StepKey): string {
    const labels: Record<StepKey, string> = {
      createLead: copy.actions.createLead,
      qualifyLead: copy.actions.qualifyLead,
      convertLead: copy.actions.convertLead,
      openOutreach: copy.actions.openOutreach,
      createQuote: copy.actions.createQuote,
      approveQuote: copy.actions.approveQuote,
      createProduction: copy.actions.createProduction,
      openJobCard: copy.actions.openJobCard,
      assignMachine: copy.actions.assignMachine,
      reserveInventory: copy.actions.reserveInventory,
      logProduction: copy.actions.logProduction
    };
    return labels[key];
  }

  if (persistenceLoading || state.status === "loading") {
    return (
      <AppFrame activeModule="customers" dictionary={dictionary} locale={locale}>
        <div className={`${panelClass} p-8 text-center text-slate-400`}>
          {copy.persistence.loading}
        </div>
      </AppFrame>
    );
  }

  if (persistenceError) {
    return (
      <AppFrame activeModule="customers" dictionary={dictionary} locale={locale}>
        <div className={`${panelClass} border-red-400/30 p-8 text-center text-red-200`}>
          {copy.persistence.unavailable}: {persistenceError}
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame activeModule="customers" dictionary={dictionary} locale={locale}>
      <section className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-300">
          {copy.eyebrow}
        </p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{copy.title}</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">{copy.description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-200"
              onClick={() => setShowResetConfirm(true)}
              type="button"
            >
              {copy.resetData}
            </button>
          </div>
        </div>
      </section>

      {showResetConfirm ? (
        <div className={`${panelClass} mb-4 border-amber-400/30 p-5`}>
          <p className="text-sm text-amber-200">{copy.resetConfirm}</p>
          <div className="mt-4 flex gap-3">
            <button
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white"
              onClick={() => {
                void resetDemoData().then(() => {
                  setCtx({
                    leadId: null,
                    customerId: null,
                    opportunityId: null,
                    quoteId: null,
                    productionOrderId: null
                  });
                  setStepIndex(0);
                  window.sessionStorage.removeItem(DEMO_CTX_STORAGE_KEY);
                  window.sessionStorage.removeItem(DEMO_STEP_STORAGE_KEY);
                  setShowResetConfirm(false);
                });
              }}
              type="button"
            >
              {copy.resetData}
            </button>
            <button
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300"
              onClick={() => setShowResetConfirm(false)}
              type="button"
            >
              {copy.cancel}
            </button>
          </div>
        </div>
      ) : null}

      <section className={`${panelClass} p-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold">{copy.currentStep}</h2>
            <p className="mt-1 text-sm text-slate-400">{getStepLabel(currentStep)}</p>
          </div>
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={running || stepIndex >= DEMO_STEPS.length}
            onClick={() => void handleStepAction()}
            type="button"
          >
            {running ? copy.actionRunning : getStepLabel(currentStep)}
          </button>
        </div>
        <div className="mt-5 grid gap-2 md:grid-cols-4 lg:grid-cols-6">
          {DEMO_STEPS.map((key, index) => (
            <div
              className={
                index < stepIndex
                  ? "rounded-md border border-emerald-400/20 bg-emerald-500/10 p-3 text-xs text-emerald-200"
                  : index === stepIndex
                    ? "rounded-md border border-blue-400/20 bg-blue-500/10 p-3 text-xs text-blue-200"
                    : "rounded-md border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-400"
              }
              key={key}
            >
              <div className="font-bold">{index + 1}</div>
              <div className="mt-1">{getStepLabel(key)}</div>
            </div>
          ))}
        </div>
      </section>

      {lastResult ? (
        <section className={`${panelClass} mt-4 p-5`}>
          <h2 className="text-lg font-bold">
            {lastResult.ok ? copy.resultSuccess : copy.resultError}
          </h2>
          {lastResult.ok ? (
            <div className="mt-4 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
              {Object.entries(lastResult.data).map(([key, value]) => (
                <div key={key}>
                  <span className="text-slate-500">{key}: </span>
                  <span className="font-semibold">{String(value)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-red-300">{lastResult.message}</p>
          )}
          {lastResult.ok && ctx.leadId ? (
            <Link
              className="mt-4 inline-block rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white"
              href={getLocalizedLeadDetailHref(locale, ctx.leadId)}
            >
              {copy.openInLeadops}
            </Link>
          ) : null}
          {lastResult.ok && ctx.customerId ? (
            <Link
              className="mt-4 ml-3 inline-block rounded-lg border border-slate-600 px-4 py-2 text-sm font-bold text-slate-200"
              href={getLocalizedModuleHref(locale, "customers")}
            >
              {copy.openCustomer}
            </Link>
          ) : null}
          {lastResult.ok && ctx.quoteId ? (
            <Link
              className="mt-4 ml-3 inline-block rounded-lg border border-slate-600 px-4 py-2 text-sm font-bold text-slate-200"
              href={`/${locale}/quotations`}
            >
              {copy.openQuotation}
            </Link>
          ) : null}
          {lastResult.ok && ctx.productionOrderId ? (
            <Link
              className="mt-4 ml-3 inline-block rounded-lg border border-slate-600 px-4 py-2 text-sm font-bold text-slate-200"
              href={getLocalizedModuleHref(locale, "production")}
            >
              {copy.openProduction}
            </Link>
          ) : null}
        </section>
      ) : null}

      <section className="mt-4 grid gap-4 xl:grid-cols-[0.8fr_1fr]">
        <article className={`${panelClass} p-5`}>
          <h2 className="text-lg font-bold">{copy.sections.lead}</h2>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase text-slate-500">
                {copy.fields.company}
              </span>
              <input
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
                onChange={(e) => setCompanyName(e.target.value)}
                value={companyName}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase text-slate-500">
                {copy.fields.contact}
              </span>
              <input
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
                onChange={(e) => setContactName(e.target.value)}
                value={contactName}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase text-slate-500">Email</span>
              <input
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                value={email}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase text-slate-500">
                {copy.fields.product}
              </span>
              <select
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
                onChange={(e) => setSelectedProductId(e.target.value)}
                value={selectedProductId}
              >
                {cupProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase text-slate-500">
                {copy.fields.quantity}
              </span>
              <input
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
                min={500}
                onChange={(e) => setQuantity(Number(e.target.value))}
                type="number"
                value={quantity}
              />
            </label>
          </div>
        </article>

        <article className={`${panelClass} p-5`}>
          <h2 className="text-lg font-bold">{copy.sections.inventory}</h2>
          <div className="mt-4 space-y-3">
            {inventory.map((item) => (
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3" key={item.id}>
                <div className="font-semibold">{item.name}</div>
                <div className="mt-2 grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
                  <span>
                    {copy.fields.available}: {item.quantityOnHand - item.reservedQuantity}{" "}
                    {item.unit}
                  </span>
                  <span>
                    {copy.fields.reserved}: {item.reservedQuantity} {item.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AppFrame>
  );
}
