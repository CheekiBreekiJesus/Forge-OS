"use client";

import { useParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { getPersistenceGateCopy } from "@/persistence/gate-copy";
import {
  usePersistence,
  usePersistenceErrorState,
  usePersistenceLoading,
  usePersistenceReady
} from "@/persistence/provider";
import { panelClass } from "@/theme/ui-classes";

type PersistenceGateProps = {
  children: ReactNode;
};

function resolveLocale(value: string | string[] | undefined): Locale {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && isSupportedLocale(raw) ? raw : "pt-PT";
}

export function PersistenceGate({ children }: PersistenceGateProps) {
  const params = useParams();
  const locale = resolveLocale(params?.locale);
  const copy = useMemo(() => getPersistenceGateCopy(locale), [locale]);
  const loading = usePersistenceLoading();
  const ready = usePersistenceReady();
  const errorState = usePersistenceErrorState();
  const { refresh, recoverLocalDatabase, localDbName } = usePersistence();
  const [resetConfirm, setResetConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (loading || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className={`${panelClass} w-full max-w-lg p-8 text-center text-slate-300`}>
          <p data-testid="persistence-loading">{copy.loading}</p>
          <p className="mt-2 text-xs text-slate-500">
            {copy.activeDbName}: <code>{localDbName}</code>
          </p>
        </div>
      </div>
    );
  }

  if (errorState) {
    const { message: error, recoverable } = errorState;

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div
          className={`${panelClass} w-full max-w-2xl border-red-500/30 p-8 text-slate-200`}
          data-testid="persistence-error-panel"
        >
          <h1 className="text-lg font-semibold text-red-200">{copy.unavailable}</h1>
          <p className="mt-3 text-sm text-slate-300">{error}</p>
          <p className="mt-2 text-xs text-slate-500">
            {copy.activeDbName}: <code>{localDbName}</code>
          </p>
          {recoverable ? <p className="mt-3 text-sm text-slate-400">{copy.recoverableHint}</p> : null}
          {statusMessage ? <p className="mt-3 text-sm text-green-300">{statusMessage}</p> : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-900 disabled:opacity-50"
              data-testid="persistence-retry"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                setStatusMessage(null);
                void refresh().finally(() => setBusy(false));
              }}
              type="button"
            >
              {copy.retry}
            </button>
            {recoverable ? (
              <>
                <label className="grid w-full gap-1 text-sm">
                  <span className="text-xs uppercase tracking-wide text-slate-500">{copy.resetConfirmLabel}</span>
                  <input
                    className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                    data-testid="persistence-reset-confirm"
                    onChange={(event) => setResetConfirm(event.target.value)}
                    placeholder={copy.resetConfirmPhrase}
                    value={resetConfirm}
                  />
                </label>
                <button
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-50"
                  data-testid="persistence-reset"
                  disabled={busy || resetConfirm.trim() !== copy.resetConfirmPhrase}
                  onClick={() => {
                    setBusy(true);
                    setStatusMessage(null);
                    void recoverLocalDatabase({ deleteDatabase: true })
                      .then(() => setStatusMessage(copy.resetDone))
                      .finally(() => setBusy(false));
                  }}
                  type="button"
                >
                  {copy.resetDatabase}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
