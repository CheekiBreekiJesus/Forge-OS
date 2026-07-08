"use client";

import React, { FormEvent, useEffect, useMemo, useState } from "react";
import {
  buildLeadManagementContext,
  createCampaignWithSnapshot,
  previewCampaignSegment
} from "@/application/campaign-segmentation-service";
import type { SegmentDefinition } from "@/domain/campaign-types";
import type { SegmentPreviewCounts } from "@/features/leadops/segmentation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { usePersistence } from "@/persistence/provider";

type CampaignSegmentBuilderDialogProps = {
  copy: Dictionary["leadops"];
  locale: Locale;
  open: boolean;
  onClose: () => void;
  onCreated: (campaignId: string) => void | Promise<void>;
  segmentDefinition: SegmentDefinition;
  previewCounts: SegmentPreviewCounts | null;
};

export function CampaignSegmentBuilderDialog({
  copy,
  locale,
  open,
  onClose,
  onCreated,
  segmentDefinition,
  previewCounts: initialPreview
}: CampaignSegmentBuilderDialogProps) {
  const { state, tenantId, notifyDataChanged } = usePersistence();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<SegmentPreviewCounts | null>(initialPreview);

  useEffect(() => {
    if (!open || state.status !== "ready") return;
    void buildLeadManagementContext(state.repos, tenantId).then((context) => {
      const result = previewCampaignSegment(
        segmentDefinition,
        context,
        segmentDefinition.searchQuery ?? ""
      );
      setPreview(result.counts);
    });
  }, [open, segmentDefinition, state, tenantId]);

  const exclusionRows = useMemo(
    () =>
      preview
        ? [
            { key: "missingEmail", value: preview.missingEmail },
            { key: "invalidEmail", value: preview.invalidEmail },
            { key: "suppressed", value: preview.suppressed },
            { key: "duplicate", value: preview.duplicate },
            { key: "inactive", value: preview.inactive }
          ]
        : [],
    [preview]
  );

  if (!open) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (state.status !== "ready") return;
    if (!name.trim()) {
      setError(copy.segmentation.nameRequired);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { campaign } = await createCampaignWithSnapshot(state.repos, tenantId, {
        name: name.trim(),
        description: description.trim() || undefined,
        language: locale,
        segmentDefinition,
        searchQuery: segmentDefinition.searchQuery
      });
      notifyDataChanged();
      await onCreated(campaign.id);
      setName("");
      setDescription("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : copy.segmentation.createFailed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" data-testid="segment-builder-dialog">
      <form
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-xl"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <h2 className="text-xl font-bold">{copy.segmentation.createTitle}</h2>
        <p className="mt-2 text-sm text-slate-400">{copy.segmentation.createDescription}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <MetricCard label={copy.segmentation.matchingOrganizations} testId="segment-orgs" value={preview?.matchingOrganizations ?? 0} />
          <MetricCard label={copy.segmentation.matchingContacts} testId="segment-contacts" value={preview?.matchingContacts ?? 0} />
          <MetricCard label={copy.segmentation.sendableRecipients} testId="segment-sendable" value={preview?.sendableRecipients ?? 0} />
        </div>

        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
          <h3 className="text-sm font-semibold text-slate-300">{copy.segmentation.exclusionsTitle}</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {exclusionRows.map((row) => (
              <li className="flex justify-between" data-testid={`segment-exclusion-${row.key}`} key={row.key}>
                <span>{copy.segmentation.exclusions[row.key as keyof typeof copy.segmentation.exclusions]}</span>
                <span>{row.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <label className="mt-4 block text-sm">
          <span className="mb-1 block text-slate-400">{copy.segmentation.campaignName}</span>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2"
            data-testid="segment-campaign-name"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </label>

        <label className="mt-3 block text-sm">
          <span className="mb-1 block text-slate-400">{copy.segmentation.campaignDescription}</span>
          <textarea
            className="min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2"
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
        </label>

        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-orange-300">{copy.segmentation.reviewDefinition}</summary>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-400">
            {JSON.stringify(segmentDefinition, null, 2)}
          </pre>
        </details>

        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button className="rounded-lg border border-slate-700 px-4 py-2 text-sm" onClick={onClose} type="button">
            {copy.import.cancel}
          </button>
          <button
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
            data-testid="segment-create-campaign"
            disabled={submitting || (preview?.sendableRecipients ?? 0) === 0}
            type="submit"
          >
            {submitting ? copy.segmentation.creating : copy.segmentation.confirmCreate}
          </button>
        </div>
      </form>
    </div>
  );
}

function MetricCard({ label, testId, value }: { label: string; testId: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3" data-testid={testId}>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
