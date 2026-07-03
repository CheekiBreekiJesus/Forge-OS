"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getOutlookIntegrationCopy } from "@/features/outlook-graph/integration-copy";
import type { OutlookConnectionStatus } from "@/features/outlook-graph/types";

type ConnectionPayload = {
  status: OutlookConnectionStatus;
  mailboxAddress: string | null;
  displayName: string | null;
  grantedScopes: string[];
  lastValidatedAt: string | null;
  liveSendEnabled: boolean;
  graphEnabled: boolean;
  liveSendDisabledLabel: string | null;
};

type StatusResponse = {
  connection: ConnectionPayload;
  configurationMissing: string[];
};

type OutlookIntegrationPanelProps = {
  locale: string;
};

export function OutlookIntegrationPanel({ locale }: OutlookIntegrationPanelProps) {
  const t = getOutlookIntegrationCopy(locale);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/integrations/outlook/status");
      if (!response.ok) throw new Error("status_failed");
      setStatus((await response.json()) as StatusResponse);
    } catch {
      setFeedback(t.validationFailed);
    } finally {
      setLoading(false);
    }
  }, [t.validationFailed]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- connection status loads from server API on mount
    void refresh();
  }, [refresh]);

  const connection = status?.connection;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <Link className="text-sm text-blue-300" href={`/${locale}/settings`}>
          {t.backToSettings}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{t.title}</h1>
        <p className="mt-2 text-sm text-slate-400">{t.description}</p>
      </div>

      {!connection?.graphEnabled ? (
        <p className="rounded-lg border border-amber-800 bg-amber-950/40 p-4 text-sm text-amber-200">
          {t.graphDisabled}
        </p>
      ) : null}

      {!connection?.liveSendEnabled ? (
        <p className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-sm font-semibold text-slate-200">
          {t.liveSendDisabledBanner}
        </p>
      ) : null}

      <article className="rounded-lg border border-slate-800 bg-slate-950/40 p-5">
        <div className="text-xs uppercase tracking-wide text-slate-500">{t.provider}</div>
        {loading ? (
          <p className="mt-3 text-sm text-slate-400">{t.loading}</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <InfoRow
              label="Status"
              value={t.statuses[connection?.status ?? "disconnected"]}
            />
            <InfoRow label={t.mailbox} value={connection?.mailboxAddress ?? "—"} />
            <InfoRow label={t.displayName} value={connection?.displayName ?? "—"} />
            <InfoRow
              label={t.liveSend}
              value={connection?.liveSendEnabled ? "ON" : t.liveSendDisabled}
            />
            <InfoRow
              label={t.scopes}
              value={connection?.grantedScopes?.join(", ") || "—"}
            />
            <InfoRow label={t.lastValidated} value={connection?.lastValidatedAt ?? "—"} />
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => {
              window.location.assign("/api/integrations/outlook/connect");
            }}
            type="button"
          >
            {connection?.status === "connected" ? t.reconnect : t.connect}
          </button>
          <button
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm"
            onClick={() => void refresh()}
            type="button"
          >
            {t.testConnection}
          </button>
          <button
            className="rounded-lg border border-red-800 px-4 py-2 text-sm text-red-200"
            onClick={() =>
              void fetch("/api/integrations/outlook/disconnect", { method: "POST" }).then(() => {
                setFeedback(t.disconnectedOk);
                void refresh();
              })
            }
            type="button"
          >
            {t.disconnect}
          </button>
        </div>

        {feedback ? <p className="mt-4 text-sm text-emerald-300">{feedback}</p> : null}
        {status?.configurationMissing?.length ? (
          <p className="mt-4 text-sm text-amber-300">
            Missing: {status.configurationMissing.join(", ")}
          </p>
        ) : null}
      </article>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/50 px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-100">{value}</div>
    </div>
  );
}
