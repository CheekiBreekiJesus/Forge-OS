"use client";

import React, { FormEvent, useCallback, useMemo, useState } from "react";
import { convertDemoLead } from "@/application/demo-workflow-service";
import { LeadOpsImportWizard } from "@/components/leadops-import-wizard";
import { LeadOpsLeadManagementPanel } from "@/components/leadops-lead-management-panel";
import { LeadOpsOperationalSummary } from "@/components/leadops-operational-summary";
import { LeadOpsSuppressionPanel } from "@/components/leadops-suppression-panel";
import { AppFrame, panelClass } from "@/components/app-frame";
import {
  ArchiveConfirmationDialog,
  EntityFormDrawer,
  FormField,
  FormFieldError,
  PrimaryActionButton,
  RowActionMenu,
  inputClassName
} from "@/components/crud";
import { toLeadOpsLead } from "@/domain/mappers";
import { isValidEmail } from "@/features/crud/validation";
import { isArchivedRecord, useHashAction } from "@/features/crud/ui-utils";
import { calculateLeadOpsKpis, getCampaignProgress } from "@/features/leadops/kpis";
import { getLocalizedLeadDetailHref } from "@/features/leadops/lookup";
import { useActivities, useTenantLeads } from "@/persistence/hooks";
import { usePersistence, usePersistenceLoading } from "@/persistence/provider";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { toLeadOpsCampaign } from "@/domain/mappers";
import { useEffect } from "react";
import type { LeadOpsActivityKind, LeadOpsCampaign } from "@/features/leadops/types";
import type { ActivityAction } from "@/domain/types";

type LeadOpsDashboardShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

const kpiKeys = [
  "totalLeads",
  "ready",
  "queued",
  "contactedSent",
  "replies",
  "positiveReplies",
  "bounceRate",
  "activeCampaigns"
] as const;

export function LeadOpsDashboardShell({ dictionary, locale }: LeadOpsDashboardShellProps) {
  const copy = dictionary.leadops;
  const shared = dictionary.crudModule;
  const [showArchived, setShowArchived] = useState(false);
  const persistenceLoading = usePersistenceLoading();
  const { leads: domainLeads, loading: leadsLoading, reload: reloadLeads } = useTenantLeads(showArchived);
  const { activities: domainActivities } = useActivities();
  const { state, tenantId, notifyDataChanged } = usePersistence();
  const [campaigns, setCampaigns] = useState<LeadOpsCampaign[]>([]);

  const tenantLeads = useMemo(
    () => domainLeads.map(toLeadOpsLead),
    [domainLeads]
  );

  const tenantActivities = useMemo(
    () =>
      domainActivities.map((a) => ({
        id: a.id,
        tenantId: a.tenantId,
        kind: mapActivityAction(a.action),
        companyName: String(a.metadata.companyName ?? a.title),
        occurredAt: a.occurredAt
      })),
    [domainActivities]
  );

  useEffect(() => {
    if (state.status !== "ready") return;
    void state.repos.campaigns.list(state.tenantId).then((rows) => {
      setCampaigns(rows.map(toLeadOpsCampaign));
    });
  }, [state]);

  const [leadDrawerOpen, setLeadDrawerOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({ companyName: "", contactName: "", email: "" });
  const [leadFormError, setLeadFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [archiveLeadId, setArchiveLeadId] = useState<string | null>(null);

  const openCreateLead = useCallback(() => {
    setLeadForm({ companyName: "", contactName: "", email: "" });
    setLeadFormError(null);
    setLeadDrawerOpen(true);
  }, []);

  useHashAction("create-lead", openCreateLead);

  const kpis = useMemo(
    () => calculateLeadOpsKpis(tenantLeads, campaigns),
    [campaigns, tenantLeads]
  );

  async function handleCreateLead(event: FormEvent) {
    event.preventDefault();
    if (state.status !== "ready") return;
    if (!leadForm.companyName.trim() || !leadForm.contactName.trim()) {
      setLeadFormError(copy.form.required);
      return;
    }
    if (!isValidEmail(leadForm.email)) {
      setLeadFormError(copy.form.invalidEmail);
      return;
    }
    setSubmitting(true);
    try {
      await state.repos.leads.create(tenantId, leadForm);
      notifyDataChanged();
      await reloadLeads();
      setLeadDrawerOpen(false);
    } catch (error) {
      setLeadFormError(error instanceof Error ? error.message : shared.error.generic);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLeadArchive(leadId: string, restore: boolean) {
    if (state.status !== "ready") return;
    setSubmitting(true);
    try {
      if (restore) {
        await state.repos.leads.restore(tenantId, leadId);
      } else {
        await state.repos.leads.archive(tenantId, leadId);
      }
      notifyDataChanged();
      await reloadLeads();
      setArchiveLeadId(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLeadDuplicate(leadId: string) {
    if (state.status !== "ready") return;
    await state.repos.leads.duplicate(tenantId, leadId);
    notifyDataChanged();
    await reloadLeads();
  }

  async function handleLeadConvert(leadId: string) {
    if (state.status !== "ready") return;
    await convertDemoLead(state.repos, tenantId, leadId);
    notifyDataChanged();
    await reloadLeads();
  }

  function leadRowActions(leadId: string, archived: boolean) {
    return (
      <RowActionMenu
        actions={[
          {
            key: "view",
            label: copy.table.viewLead,
            onClick: () => {
              window.location.href = getLocalizedLeadDetailHref(locale, leadId);
            }
          },
          {
            key: "dup",
            label: shared.actions.duplicate,
            onClick: () => void handleLeadDuplicate(leadId)
          },
          {
            key: "convert",
            label: copy.actions.convert,
            onClick: () => void handleLeadConvert(leadId)
          },
          {
            key: "archive",
            label: archived ? shared.actions.restore : shared.actions.archive,
            destructive: !archived,
            onClick: () => setArchiveLeadId(leadId)
          }
        ]}
        triggerLabel={shared.actions.menu}
      />
    );
  }

  function isArchived(lead: import("@/domain/types").Lead | undefined): boolean {
    return isArchivedRecord(lead ?? { active: true });
  }

  async function handleImportComplete() {
    await reloadLeads();
    notifyDataChanged();
  }

  if (persistenceLoading || (leadsLoading && domainLeads.length === 0)) {
    return (
      <AppFrame activeModule="marketing" dictionary={dictionary} locale={locale} supplementalRoute="leadops">
        <div className={`${panelClass} p-8 text-center text-slate-400`}>
          {dictionary.demoWorkflow.persistence.loading}
        </div>
      </AppFrame>
    );
  }

  function formatKpiValue(key: (typeof kpiKeys)[number]): string {
    if (key === "bounceRate") {
      return kpis.bounceRate === null
        ? copy.kpis.bounceRateUnavailable
        : `${kpis.bounceRate}%`;
    }

    return String(kpis[key]);
  }

  return (
    <AppFrame
      activeModule="marketing"
      dictionary={dictionary}
      locale={locale}
      supplementalRoute="leadops"
    >
      <section className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-300">{copy.eyebrow}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{copy.title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">{copy.description}</p>
      </section>

      <section className="mb-4">
        <PanelHeading title={copy.sections.kpis} />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpiKeys.map((key) => (
            <article className={`${panelClass} p-4`} key={key}>
              <p className="text-sm text-slate-400">{copy.kpis[key]}</p>
              <p className="mt-2 text-2xl font-bold">{formatKpiValue(key)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-4">
        <LeadOpsOperationalSummary dictionary={dictionary} />
      </section>

      <section className="mb-4">
        <LeadOpsSuppressionPanel dictionary={dictionary} locale={locale} />
      </section>

      <section className="mb-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className={`${panelClass} p-5`}>
          <div className="flex items-center justify-between gap-3">
            <PanelHeading title={copy.sections.campaigns} />
            <a className="text-sm text-orange-300 hover:underline" href={`/${locale}/leadops/campaigns`}>
              {copy.management.viewCampaigns}
            </a>
          </div>
          <div className="mt-4 space-y-4">
            {campaigns.map((campaign) => {
              const progress = getCampaignProgress(campaign);

              return (
                <a
                  className="block rounded-lg border border-slate-800 bg-slate-950/40 p-4 transition hover:border-orange-400/40 hover:bg-slate-950/70"
                  href={`/${locale}/leadops/campaigns/${campaign.id}`}
                  key={campaign.id}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold">{campaign.name}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {copy.campaignStatuses[campaign.status]}
                      </div>
                    </div>
                    <div className="text-sm text-slate-300">
                      {campaign.sentCount}/{campaign.totalCount}
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-800">
                    <div
                      className="campaign-progress-fill h-2 rounded-full bg-orange-400"
                      style={{ "--progress-width": `${progress}%` } as React.CSSProperties}
                    />
                  </div>
                  <div className="mt-2 text-xs text-slate-500">{progress}%</div>
                </a>
              );
            })}
          </div>
        </article>

        <article className={`${panelClass} p-5`}>
          <PanelHeading title={copy.sections.activity} />
          <div className="mt-4 space-y-3">
            {tenantActivities.map((activity) => (
              <div
                className="rounded-lg border border-slate-800 bg-slate-950/40 p-4"
                key={activity.id}
              >
                <div className="text-sm font-semibold">{copy.activities[activity.kind]}</div>
                <div className="mt-1 text-sm text-slate-300">{activity.companyName}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {new Date(activity.occurredAt).toLocaleString(locale)}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <LeadOpsImportWizard copy={copy} onImportComplete={handleImportComplete} />

      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            type="checkbox"
          />
          {shared.showArchived}
        </label>
        <PrimaryActionButton onClick={openCreateLead}>{copy.actions.createLead}</PrimaryActionButton>
      </div>

      <LeadOpsLeadManagementPanel
        copy={copy}
        isArchived={isArchived}
        leads={domainLeads}
        locale={locale}
        onReload={reloadLeads}
        rowActions={leadRowActions}
        shared={shared}
      />

      <EntityFormDrawer
        cancelLabel={shared.form.cancel}
        onClose={() => setLeadDrawerOpen(false)}
        onSubmit={handleCreateLead}
        open={leadDrawerOpen}
        submitLabel={shared.form.create}
        submitting={submitting}
        title={copy.form.createTitle}
      >
        <FormField label={copy.form.companyName} required>
          <input
            className={inputClassName}
            onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })}
            value={leadForm.companyName}
          />
        </FormField>
        <FormField label={copy.form.contactName} required>
          <input
            className={inputClassName}
            onChange={(e) => setLeadForm({ ...leadForm, contactName: e.target.value })}
            value={leadForm.contactName}
          />
        </FormField>
        <FormField label={copy.form.email} required>
          <input
            className={inputClassName}
            onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
            type="email"
            value={leadForm.email}
          />
        </FormField>
        <FormFieldError message={leadFormError} />
      </EntityFormDrawer>

      <ArchiveConfirmationDialog
        cancelLabel={shared.archive.cancel}
        confirmLabel={shared.archive.confirm}
        confirming={submitting}
        message={shared.archive.message}
        onCancel={() => setArchiveLeadId(null)}
        onConfirm={() => {
          const lead = domainLeads.find((l) => l.id === archiveLeadId);
          if (!lead || !archiveLeadId) return;
          void handleLeadArchive(archiveLeadId, isArchivedRecord(lead));
        }}
        open={Boolean(archiveLeadId)}
        title={shared.archive.title}
      />
    </AppFrame>
  );
}

function PanelHeading({ title }: { title: string }) {
  return <h2 className="text-lg font-bold text-slate-100">{title}</h2>;
}

function mapActivityAction(action: ActivityAction): LeadOpsActivityKind {
  const map: Partial<Record<ActivityAction, LeadOpsActivityKind>> = {
    lead_created: "lead-imported",
    lead_qualified: "lead-qualified",
    outreach_generated: "message-generated",
    outreach_approved: "message-approved",
    outreach_queued: "message-queued",
    outreach_sent_simulated: "message-sent"
  };
  return map[action] ?? "metrics-updated";
}
