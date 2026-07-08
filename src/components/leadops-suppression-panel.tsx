"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  createEmailSuppression,
  removeEmailSuppression,
  requiresElevatedRemoval
} from "@/application/suppression-service";
import { panelClass } from "@/components/app-frame";
import type { EmailSuppression, SuppressionReason } from "@/domain/suppression-types";
import type { Dictionary } from "@/i18n/dictionaries";
import { usePersistence } from "@/persistence/provider";

const REASONS: SuppressionReason[] = [
  "manual",
  "unsubscribe",
  "invalid_address",
  "duplicate",
  "legal_request",
  "other"
];

type LeadOpsSuppressionPanelProps = {
  dictionary: Dictionary;
};

export function LeadOpsSuppressionPanel({ dictionary }: LeadOpsSuppressionPanelProps) {
  const copy = dictionary.leadops.suppression;
  const { state, tenantId, notifyDataChanged } = usePersistence();
  const [rows, setRows] = useState<EmailSuppression[]>([]);
  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState<SuppressionReason>("manual");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [removeReason, setRemoveReason] = useState("");
  const [elevatedConfirmed, setElevatedConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function reload() {
    if (state.status !== "ready") return;
    const next = await state.repos.emailSuppressions.list(tenantId);
    setRows(next.filter((row) => row.active || row.removedAt));
  }

  useEffect(() => {
    if (state.status !== "ready") return;
    void state.repos.emailSuppressions.list(tenantId).then((next) => {
      setRows(next.filter((row) => row.active || row.removedAt));
    });
  }, [state, tenantId]);

  const filtered = useMemo(() => {
    return rows
      .filter((row) => row.active)
      .filter((row) => {
        if (reasonFilter && row.reason !== reasonFilter) return false;
        if (sourceFilter && row.source !== sourceFilter) return false;
        if (search && !row.normalizedEmail.includes(search.trim().toLowerCase())) return false;
        return true;
      });
  }, [rows, reasonFilter, search, sourceFilter]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (state.status !== "ready") return;
    setBusy(true);
    setFeedback(null);
    try {
      await createEmailSuppression(state.repos, tenantId, {
        email,
        reason,
        notes,
        source: "operator"
      });
      setEmail("");
      setNotes("");
      notifyDataChanged();
      await reload();
      setFeedback(copy.created);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : copy.error);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!removeId || state.status !== "ready") return;
    setBusy(true);
    try {
      await removeEmailSuppression(state.repos, tenantId, removeId, {
        removalReason: removeReason,
        elevatedConfirmed
      });
      setRemoveId(null);
      setRemoveReason("");
      setElevatedConfirmed(false);
      notifyDataChanged();
      await reload();
      setFeedback(copy.removed);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : copy.error);
    } finally {
      setBusy(false);
    }
  }

  const reasonLabel = (value: SuppressionReason) =>
    copy.reasons[value as keyof typeof copy.reasons] ?? value;

  const selected = rows.find((row) => row.id === removeId);

  return (
    <section className={`${panelClass} p-5`} data-testid="leadops-suppression-panel">
      <h2 className="text-lg font-bold text-slate-100">{copy.title}</h2>
      <p className="mt-1 text-sm text-slate-400">{copy.description}</p>

      <form className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr_1fr_auto]" onSubmit={(event) => void handleCreate(event)}>
        <input
          className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm"
          data-testid="suppression-email-input"
          onChange={(event) => setEmail(event.target.value)}
          placeholder={copy.emailPlaceholder}
          required
          type="email"
          value={email}
        />
        <select
          className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm"
          data-testid="suppression-reason-select"
          onChange={(event) => setReason(event.target.value as SuppressionReason)}
          value={reason}
        >
          {REASONS.map((value) => (
            <option key={value} value={value}>
              {copy.reasons[value as keyof typeof copy.reasons] ?? value}
            </option>
          ))}
        </select>
        <input
          className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm"
          onChange={(event) => setNotes(event.target.value)}
          placeholder={copy.notesPlaceholder}
          value={notes}
        />
        <button
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50"
          data-testid="suppression-add-button"
          disabled={busy}
          type="submit"
        >
          {copy.add}
        </button>
      </form>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <input
          className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm"
          data-testid="suppression-search-input"
          onChange={(event) => setSearch(event.target.value)}
          placeholder={copy.searchPlaceholder}
          type="search"
          value={search}
        />
        <select
          className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm"
          data-testid="suppression-reason-filter"
          onChange={(event) => setReasonFilter(event.target.value)}
          value={reasonFilter}
        >
          <option value="">{copy.allReasons}</option>
          {REASONS.map((value) => (
            <option key={value} value={value}>
              {copy.reasons[value as keyof typeof copy.reasons] ?? value}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm"
          data-testid="suppression-source-filter"
          onChange={(event) => setSourceFilter(event.target.value)}
          value={sourceFilter}
        >
          <option value="">{copy.allSources}</option>
          {(["operator", "import", "campaign", "lead_detail", "system"] as const).map((value) => (
            <option key={value} value={value}>
              {copy.sources[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="px-3 py-2">{copy.columns.email}</th>
              <th className="px-3 py-2">{copy.columns.reason}</th>
              <th className="px-3 py-2">{copy.columns.source}</th>
              <th className="px-3 py-2">{copy.columns.createdAt}</th>
              <th className="px-3 py-2">{copy.columns.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr className="border-t border-slate-800" data-testid={`suppression-row-${row.id}`} key={row.id}>
                <td className="px-3 py-2">{row.normalizedEmail}</td>
                <td className="px-3 py-2">{reasonLabel(row.reason)}</td>
                <td className="px-3 py-2">{copy.sources[row.source]}</td>
                <td className="px-3 py-2">{new Date(row.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    {row.leadId ? (
                      <a className="text-orange-300 hover:underline" href={`/pt-PT/leadops/${row.leadId}`}>
                        {copy.viewContact}
                      </a>
                    ) : null}
                    {row.campaignId ? (
                      <a
                        className="text-orange-300 hover:underline"
                        href={`/pt-PT/leadops/campaigns/${row.campaignId}`}
                      >
                        {copy.viewCampaign}
                      </a>
                    ) : null}
                    <button
                      className="text-amber-300 hover:underline"
                      data-testid={`suppression-remove-${row.id}`}
                      onClick={() => setRemoveId(row.id)}
                      type="button"
                    >
                      {copy.remove}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {removeId && selected ? (
        <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-500/10 p-4" data-testid="suppression-remove-dialog">
          <p className="text-sm text-amber-100">{copy.removeConfirm.replace("{email}", selected.normalizedEmail)}</p>
          {requiresElevatedRemoval(selected.reason) ? (
            <p className="mt-2 text-sm text-amber-200">{copy.elevatedRequired}</p>
          ) : null}
          <input
            className="mt-3 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            data-testid="suppression-remove-reason"
            onChange={(event) => setRemoveReason(event.target.value)}
            placeholder={copy.removalReasonPlaceholder}
            value={removeReason}
          />
          {requiresElevatedRemoval(selected.reason) ? (
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-300">
              <input
                checked={elevatedConfirmed}
                data-testid="suppression-elevated-confirm"
                onChange={(event) => setElevatedConfirmed(event.target.checked)}
                type="checkbox"
              />
              {copy.elevatedConfirmLabel}
            </label>
          ) : null}
          <div className="mt-3 flex gap-2">
            <button
              className="rounded bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950"
              data-testid="suppression-remove-confirm"
              disabled={busy || !removeReason.trim()}
              onClick={() => void handleRemove()}
              type="button"
            >
              {copy.confirmRemove}
            </button>
            <button className="rounded border border-slate-700 px-4 py-2 text-sm" onClick={() => setRemoveId(null)} type="button">
              {dictionary.leadops.import.cancel}
            </button>
          </div>
        </div>
      ) : null}

      {feedback ? (
        <p className="mt-3 text-sm text-green-400" data-testid="suppression-feedback">
          {feedback}
        </p>
      ) : null}
    </section>
  );
}
