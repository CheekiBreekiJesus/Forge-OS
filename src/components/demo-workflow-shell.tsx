"use client";

import { useState } from "react";
import { AppFrame, panelClass } from "@/components/app-frame";
import {
  getEmailTemplatesForLocale,
  getN8nWebhookQueue,
  getQuoteRequestFormModel
} from "@/demo/automation";
import {
  answerCopilotPrompt,
  copilotPrompts,
  type CopilotActionKey
} from "@/demo/copilot";
import {
  calculatePersonalizedCupQuote,
  createDemoJobCard,
  createDemoProductionOrder,
  findCompatibleMachine,
  reserveInventoryForProduction
} from "@/demo/workflow";
import {
  demoEvents,
  demoInventoryItems,
  demoProducts,
  jhGomesTenant
} from "@/demo/seed";
import type {
  DemoEvent,
  DemoInventoryItem,
  DemoLead,
  DemoProductionOrder
} from "@/demo/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type DemoWorkflowShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

const maxStep = 10;

export function DemoWorkflowShell({
  dictionary,
  locale
}: DemoWorkflowShellProps) {
  const cupProducts = demoProducts.filter(
    (product) => product.category === "personalized-cups"
  );
  const [step, setStep] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState(cupProducts[1]?.id);
  const [quantity, setQuantity] = useState(12000);
  const [printColorCount, setPrintColorCount] = useState(2);
  const [inventory, setInventory] = useState<DemoInventoryItem[]>(demoInventoryItems);
  const [copilotAction, setCopilotAction] =
    useState<CopilotActionKey>("summarize-dashboard");

  const product =
    demoProducts.find((item) => item.id === selectedProductId) ?? cupProducts[0];
  const lead: DemoLead = {
    id: "lead_demo_live",
    tenantId: jhGomesTenant.id,
    companyName: "Demo Hospitality Client",
    contactName: "Ana Martins",
    status: step >= 2 ? "converted" : step >= 1 ? "qualified" : "new",
    requestedProductId: product.id,
    quantity,
    notes: "Live demo lead for personalized event cups."
  };
  const quote = calculatePersonalizedCupQuote({
    printColorCount,
    product,
    quantity
  });
  const productionOrder: DemoProductionOrder = createDemoProductionOrder({
    customerName: lead.companyName,
    product,
    quantity,
    quoteId: "quote_demo_live"
  });
  const machine = findCompatibleMachine(product);
  const jobCard = createDemoJobCard({
    locale,
    order: {
      ...productionOrder,
      artworkStatus: step >= 8 ? "approved" : "pending",
      machineId: machine.id,
      progress: step >= 9 ? 35 : 0,
      screenStatus: step >= 8 ? "ready" : "pending",
      status: step >= 9 ? "in-progress" : "scheduled"
    },
    product
  });
  const events: DemoEvent[] = [
    ...demoEvents,
    ...(step >= 1
      ? [
          {
            id: "event_demo_lead_created",
            tenantId: jhGomesTenant.id,
            type: "lead_created" as const,
            title: "Demo lead created",
            createdAt: "2026-06-15T11:00:00.000Z"
          }
        ]
      : []),
    ...(step >= 3
      ? [
          {
            id: "event_demo_quote_created",
            tenantId: jhGomesTenant.id,
            type: "quote_created" as const,
            title: "Demo quote created",
            createdAt: "2026-06-15T11:05:00.000Z"
          }
        ]
      : []),
    ...(step >= 5
      ? [
          {
            id: "event_demo_quote_approved",
            tenantId: jhGomesTenant.id,
            type: "quote_approved" as const,
            title: "Demo quote approved",
            createdAt: "2026-06-15T11:12:00.000Z"
          }
        ]
      : [])
  ];
  const quoteRequest = getQuoteRequestFormModel();
  const emailTemplates = getEmailTemplatesForLocale(locale);
  const webhookQueue = getN8nWebhookQueue();
  const copilotAnswer = answerCopilotPrompt(copilotAction);

  function advance() {
    setStep((current) => {
      const next = Math.min(current + 1, maxStep);

      if (next === 10) {
        setInventory((currentInventory) =>
          reserveInventoryForProduction({
            inventory: currentInventory,
            product,
            quantity
          })
        );
      }

      return next;
    });
  }

  function runFullDemo() {
    setStep(maxStep);
    setInventory(
      reserveInventoryForProduction({
        inventory: demoInventoryItems,
        product,
        quantity
      })
    );
  }

  function resetDemo() {
    setStep(0);
    setInventory(demoInventoryItems);
  }

  return (
    <AppFrame activeModule="customers" dictionary={dictionary} locale={locale}>
      <section className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-300">
          {dictionary.demoWorkflow.eyebrow}
        </p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {dictionary.demoWorkflow.title}
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
              {dictionary.demoWorkflow.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white"
              onClick={runFullDemo}
              type="button"
            >
              {dictionary.demoWorkflow.startDemo}
            </button>
            <button
              className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-200"
              onClick={resetDemo}
              type="button"
            >
              {dictionary.demoWorkflow.reset}
            </button>
          </div>
        </div>
      </section>

      <section className={`${panelClass} p-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold">{dictionary.demoWorkflow.currentStep}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {dictionary.demoWorkflow.steps[Math.min(step, maxStep - 1)]}
            </p>
          </div>
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={step >= maxStep}
            onClick={advance}
            type="button"
          >
            {dictionary.demoWorkflow.steps[Math.min(step, maxStep - 1)]}
          </button>
        </div>
        <div className="mt-5 grid gap-2 md:grid-cols-5">
          {dictionary.demoWorkflow.steps.map((label, index) => (
            <div
              className={
                index < step
                  ? "rounded-md border border-emerald-400/20 bg-emerald-500/10 p-3 text-xs text-emerald-200"
                  : index === step
                    ? "rounded-md border border-blue-400/20 bg-blue-500/10 p-3 text-xs text-blue-200"
                    : "rounded-md border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-400"
              }
              key={label}
            >
              <div className="font-bold">{index + 1}</div>
              <div className="mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[0.8fr_1fr]">
        <article className={`${panelClass} p-5`}>
          <h2 className="text-lg font-bold">{dictionary.demoWorkflow.sections.lead}</h2>
          <div className="mt-4 grid gap-4">
            <Field label={dictionary.demoWorkflow.fields.company} value={lead.companyName} />
            <Field label={dictionary.demoWorkflow.fields.contact} value={lead.contactName} />
            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {dictionary.demoWorkflow.fields.product}
              </span>
              <select
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                onChange={(event) => setSelectedProductId(event.target.value)}
                value={selectedProductId}
              >
                {cupProducts.map((cupProduct) => (
                  <option key={cupProduct.id} value={cupProduct.id}>
                    {cupProduct.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {dictionary.demoWorkflow.fields.quantity}
              </span>
              <input
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                min={500}
                onChange={(event) => setQuantity(Number(event.target.value))}
                type="number"
                value={quantity}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {dictionary.demoWorkflow.fields.printColors}
              </span>
              <input
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                min={1}
                max={4}
                onChange={(event) => setPrintColorCount(Number(event.target.value))}
                type="number"
                value={printColorCount}
              />
            </label>
          </div>
        </article>

        <article className={`${panelClass} p-5`}>
          <h2 className="text-lg font-bold">{dictionary.demoWorkflow.sections.quote}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label={dictionary.productCatalog.fields.basePrice} value={formatCurrency(product.basePrice, locale)} />
            <Field label={dictionary.productCatalog.fields.setupCost} value={formatCurrency(quote.setupCost, locale)} />
            <Field label={dictionary.productCatalog.fields.screenCost} value={formatCurrency(quote.screenCost, locale)} />
            <Field label="Ink" value={formatCurrency(quote.inkCost, locale)} />
            <Field label="Personalization" value={formatCurrency(quote.personalizationCost, locale)} />
            <Field label={dictionary.demoWorkflow.fields.artwork} value={step >= 4 ? "demo-logo.svg" : "-"} />
            <Field label={dictionary.demoWorkflow.fields.subtotal} value={formatCurrency(quote.subtotal, locale)} />
            <Field label={dictionary.demoWorkflow.fields.vat} value={formatCurrency(quote.vat, locale)} />
            <Field label={dictionary.demoWorkflow.fields.total} value={formatCurrency(quote.total, locale)} />
          </div>
        </article>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <article className={`${panelClass} p-5`}>
          <h2 className="text-lg font-bold">{dictionary.demoWorkflow.sections.production}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label={dictionary.demoWorkflow.fields.machine} value={machine.name} />
            <Field label={dictionary.demoWorkflow.fields.progress} value={step >= 9 ? "35%" : "0%"} />
            <Field label={dictionary.productCatalog.fields.capacity} value={product.capacity} />
            <Field label={dictionary.productCatalog.fields.material} value={product.material} />
          </div>
        </article>

        <article className={`${panelClass} p-5`}>
          <h2 className="text-lg font-bold">{dictionary.demoWorkflow.sections.inventory}</h2>
          <div className="mt-4 space-y-3">
            {inventory.map((item) => (
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3" key={item.id}>
                <div className="font-semibold">{item.name}</div>
                <div className="mt-2 grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
                  <span>
                    {dictionary.demoWorkflow.fields.available}:{" "}
                    {item.quantityOnHand - item.reservedQuantity} {item.unit}
                  </span>
                  <span>
                    {dictionary.demoWorkflow.fields.reserved}: {item.reservedQuantity} {item.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className={`${panelClass} p-5`}>
          <h2 className="text-lg font-bold">{dictionary.demoWorkflow.sections.jobCard}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label={dictionary.demoWorkflow.jobCardLabels.orderId} value={jobCard.orderId} />
            <Field label={dictionary.demoWorkflow.jobCardLabels.customer} value={jobCard.customer} />
            <Field label={dictionary.demoWorkflow.jobCardLabels.cupCapacity} value={jobCard.cupCapacity} />
            <Field label={dictionary.demoWorkflow.jobCardLabels.material} value={jobCard.material} />
            <Field label={dictionary.demoWorkflow.jobCardLabels.artworkStatus} value={jobCard.artworkStatus} />
            <Field label={dictionary.demoWorkflow.jobCardLabels.screenStatus} value={jobCard.screenStatus} />
            <Field label={dictionary.demoWorkflow.jobCardLabels.predictedInk} value={`${jobCard.predictedInkKg} kg`} />
            <Field label={dictionary.demoWorkflow.jobCardLabels.loading} value={jobCard.stackLoadingInfo} />
            <Field label={dictionary.demoWorkflow.jobCardLabels.loadingBay} value={`${jobCard.loadingBayCapacity} un`} />
            <Field label={dictionary.demoWorkflow.jobCardLabels.assignedMachine} value={jobCard.assignedMachine} />
            <Field label={dictionary.demoWorkflow.jobCardLabels.logoPreview} value={jobCard.logoPreviewLabel} />
            <Field label={dictionary.demoWorkflow.jobCardLabels.label} value={jobCard.packageLabelPlaceholder} />
            <Field label={dictionary.demoWorkflow.jobCardLabels.qrUrl} value={jobCard.qrReadyJobUrl} />
            <Field label={dictionary.demoWorkflow.jobCardLabels.operatorNotes} value={jobCard.operatorNotes} />
          </div>
        </article>

        <article className={`${panelClass} p-5`}>
          <h2 className="text-lg font-bold">{dictionary.demoWorkflow.sections.events}</h2>
          <div className="mt-4 space-y-3">
            {events.map((event) => (
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3" key={event.id}>
                <div className="font-semibold">{event.title}</div>
                <div className="mt-1 text-xs text-slate-500">{event.type}</div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <article className={`${panelClass} p-5`}>
          <h2 className="text-lg font-bold">{dictionary.demoWorkflow.sections.automation}</h2>
          <div className="mt-4 grid gap-4">
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <div className="text-sm font-bold">
                {dictionary.demoWorkflow.automationLabels.quoteRequest}
              </div>
              <div className="mt-2 grid gap-2 text-sm text-slate-400 md:grid-cols-2">
                <span>{quoteRequest.companyName}</span>
                <span>{quoteRequest.email}</span>
                <span>{quoteRequest.quantity.toLocaleString("en-US")} un</span>
                <span>{quoteRequest.source}</span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <div className="text-sm font-bold">
                {dictionary.demoWorkflow.automationLabels.emailTemplates}
              </div>
              <div className="mt-2 space-y-2">
                {emailTemplates.map((template) => (
                  <div className="text-sm text-slate-400" key={template.id}>
                    <span className="font-semibold text-slate-200">{template.eventType}</span>{" "}
                    {template.subject}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <div className="text-sm font-bold">
                {dictionary.demoWorkflow.automationLabels.webhookQueue}
              </div>
              <div className="mt-2 space-y-2">
                {webhookQueue.map((webhook) => (
                  <div className="rounded border border-slate-800 p-2 text-xs text-slate-400" key={webhook.id}>
                    <div className="font-semibold text-slate-200">{webhook.eventType}</div>
                    <div>
                      {dictionary.demoWorkflow.automationLabels.destination}: {webhook.destination}
                    </div>
                    <div>
                      {dictionary.demoWorkflow.automationLabels.status}: {webhook.status}
                    </div>
                    <div className="break-all">
                      {dictionary.demoWorkflow.automationLabels.payload}:{" "}
                      {JSON.stringify(webhook.payload)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className={`${panelClass} p-5`}>
          <h2 className="text-lg font-bold">{dictionary.demoWorkflow.sections.copilot}</h2>
          <div className="mt-4">
            <div className="text-sm font-semibold text-slate-300">
              {dictionary.demoWorkflow.copilotLabels.suggestedPrompts}
            </div>
            <div className="mt-3 grid gap-2">
              {copilotPrompts.map((prompt) => (
                <button
                  className={
                    prompt.key === copilotAction
                      ? "rounded-lg border border-blue-400/30 bg-blue-500/10 p-3 text-left text-sm text-blue-100"
                      : "rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-left text-sm text-slate-300"
                  }
                  key={prompt.key}
                  onClick={() => setCopilotAction(prompt.key)}
                  type="button"
                >
                  {prompt.prompt}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-sm font-semibold text-slate-300">
              {dictionary.demoWorkflow.copilotLabels.answer}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">{copilotAnswer}</p>
          </div>
          <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-sm font-semibold text-slate-300">
              {dictionary.demoWorkflow.copilotLabels.actionRegistry}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {copilotPrompts.map((prompt) => (
                <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300" key={prompt.key}>
                  {prompt.key}
                </span>
              ))}
            </div>
          </div>
        </article>
      </section>
    </AppFrame>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-200">{value}</dd>
    </div>
  );
}

function formatCurrency(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale, {
    currency: "EUR",
    style: "currency"
  }).format(value);
}
