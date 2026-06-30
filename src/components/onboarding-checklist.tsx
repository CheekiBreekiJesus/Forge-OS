"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { panelClass } from "@/components/app-frame";
import {
  deriveOnboardingItems,
  dismissOnboarding,
  isOnboardingDismissed,
  onboardingProgress,
  type OnboardingItem
} from "@/features/onboarding/checklist";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { usePersistence } from "@/persistence/provider";

type OnboardingChecklistProps = {
  dictionary: Dictionary;
  locale: Locale;
};

export function OnboardingChecklist({ dictionary, locale }: OnboardingChecklistProps) {
  const copy = dictionary.onboardingModule;
  const { state, tenantId, dataVersion, notifyDataChanged } = usePersistence();
  const [dismissed, setDismissed] = useState(true);
  const [items, setItems] = useState<OnboardingItem[]>([]);

  const reload = useCallback(async () => {
    if (state.status !== "ready") return;
    const [isDismissed, rows] = await Promise.all([
      isOnboardingDismissed(state.repos),
      deriveOnboardingItems(state.repos, tenantId, locale)
    ]);
    setDismissed(isDismissed);
    setItems(rows);
  }, [locale, state, tenantId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- repository read on mount
    void reload();
  }, [reload, dataVersion]);

  if (dismissed) return null;

  const progress = onboardingProgress(items);
  if (progress.percent === 100) return null;

  async function handleDismiss() {
    if (state.status !== "ready") return;
    await dismissOnboarding(state.repos);
    notifyDataChanged();
    setDismissed(true);
  }

  return (
    <section className={`${panelClass} mb-5 p-5`} data-testid="onboarding-checklist">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{copy.title}</h2>
          <p className="mt-1 text-sm text-slate-400">{copy.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-orange-300">
            {copy.progress.replace("{completed}", String(progress.completed)).replace("{total}", String(progress.total))}
          </span>
          <button className="text-xs text-slate-400 hover:text-white" onClick={() => void handleDismiss()} type="button">
            {copy.dismiss}
          </button>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full bg-orange-500 transition-all" style={{ width: `${progress.percent}%` }} />
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                item.completed
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-slate-700 bg-slate-950/40 text-slate-200 hover:bg-slate-800"
              }`}
              href={item.href}
            >
              <span aria-hidden>{item.completed ? "✓" : "○"}</span>
              <span>{copy.items[item.id]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
