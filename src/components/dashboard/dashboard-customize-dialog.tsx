"use client";

import { useEffect, useState } from "react";
import {
  ALL_DASHBOARD_PANELS,
  readDashboardPreferences,
  restoreDefaultDashboardPreferences,
  writeDashboardPreferences,
  type DashboardDateRange,
  type DashboardDensity,
  type DashboardPanelKey,
  type DashboardPreferences
} from "@/features/dashboard/preferences";
import { inputClass, panelClass } from "@/theme/ui-classes";

type DashboardCustomizeDialogProps = {
  open: boolean;
  onClose: () => void;
  dictionary: {
    title: string;
    description: string;
    panelsTitle: string;
    densityTitle: string;
    densityComfortable: string;
    densityCompact: string;
    dateRangeTitle: string;
    dateToday: string;
    dateWeek: string;
    dateMonth: string;
    restore: string;
    save: string;
    close: string;
    panelLabels: Record<DashboardPanelKey, string>;
  };
  onSaved?: (preferences: DashboardPreferences) => void;
};

export function DashboardCustomizeDialog({
  open,
  onClose,
  dictionary,
  onSaved
}: DashboardCustomizeDialogProps) {
  const [draft, setDraft] = useState<DashboardPreferences>(() => readDashboardPreferences());

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reload local preferences when dialog opens
      setDraft(readDashboardPreferences());
    }
  }, [open]);

  if (!open) return null;

  function togglePanel(panel: DashboardPanelKey) {
    setDraft((current) => {
      const visible = current.visiblePanels.includes(panel)
        ? current.visiblePanels.filter((item) => item !== panel)
        : [...current.visiblePanels, panel];
      return { ...current, visiblePanels: visible.length ? visible : current.visiblePanels };
    });
  }

  function movePanel(panel: DashboardPanelKey, direction: -1 | 1) {
    setDraft((current) => {
      const order = [...current.panelOrder];
      const index = order.indexOf(panel);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= order.length) return current;
      [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
      return { ...current, panelOrder: order };
    });
  }

  function handleSave() {
    writeDashboardPreferences(draft);
    onSaved?.(draft);
    onClose();
  }

  function handleRestore() {
    const restored = restoreDefaultDashboardPreferences();
    setDraft(restored);
    onSaved?.(restored);
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <button
        aria-label={dictionary.close}
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        type="button"
      />
      <div
        className={`relative max-h-[90vh] w-full max-w-lg overflow-y-auto ${panelClass} p-5`}
        role="dialog"
      >
        <h2 className="text-lg font-bold text-[var(--forge-text-primary)]">{dictionary.title}</h2>
        <p className="mt-2 text-sm text-[var(--forge-text-muted)]">{dictionary.description}</p>

        <section className="mt-5">
          <h3 className="text-sm font-semibold text-[var(--forge-text-primary)]">
            {dictionary.panelsTitle}
          </h3>
          <div className="mt-3 space-y-2">
            {ALL_DASHBOARD_PANELS.map((panel) => (
              <div
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--forge-border-subtle)] px-3 py-2"
                key={panel}
              >
                <label className="flex items-center gap-2 text-sm text-[var(--forge-text-secondary)]">
                  <input
                    checked={draft.visiblePanels.includes(panel)}
                    onChange={() => togglePanel(panel)}
                    type="checkbox"
                  />
                  <span>{dictionary.panelLabels[panel]}</span>
                </label>
                <div className="flex gap-1">
                  <button
                    aria-label={`Move ${dictionary.panelLabels[panel]} up`}
                    className="rounded border border-[var(--forge-border)] px-2 text-xs"
                    onClick={() => movePanel(panel, -1)}
                    type="button"
                  >
                    ↑
                  </button>
                  <button
                    aria-label={`Move ${dictionary.panelLabels[panel]} down`}
                    className="rounded border border-[var(--forge-border)] px-2 text-xs"
                    onClick={() => movePanel(panel, 1)}
                    type="button"
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-semibold text-[var(--forge-text-primary)]">
              {dictionary.densityTitle}
            </span>
            <select
              className={`${inputClass} mt-2 w-full`}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  density: event.target.value as DashboardDensity
                }))
              }
              value={draft.density}
            >
              <option value="comfortable">{dictionary.densityComfortable}</option>
              <option value="compact">{dictionary.densityCompact}</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-[var(--forge-text-primary)]">
              {dictionary.dateRangeTitle}
            </span>
            <select
              className={`${inputClass} mt-2 w-full`}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  defaultDateRange: event.target.value as DashboardDateRange
                }))
              }
              value={draft.defaultDateRange}
            >
              <option value="today">{dictionary.dateToday}</option>
              <option value="week">{dictionary.dateWeek}</option>
              <option value="month">{dictionary.dateMonth}</option>
            </select>
          </label>
        </section>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            className="rounded-lg bg-[var(--forge-accent-orange)] px-4 py-2 text-sm font-bold text-white"
            onClick={handleSave}
            type="button"
          >
            {dictionary.save}
          </button>
          <button
            className="rounded-lg border border-[var(--forge-border)] px-4 py-2 text-sm font-semibold text-[var(--forge-text-secondary)]"
            onClick={handleRestore}
            type="button"
          >
            {dictionary.restore}
          </button>
          <button
            className="rounded-lg px-4 py-2 text-sm font-semibold text-[var(--forge-text-muted)]"
            onClick={onClose}
            type="button"
          >
            {dictionary.close}
          </button>
        </div>
      </div>
    </div>
  );
}
