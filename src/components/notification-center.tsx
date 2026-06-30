"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { LocalNotification } from "@/domain/customizer-types";
import {
  deriveLocalNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "@/features/notifications/local-notifications";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { usePersistence } from "@/persistence/provider";

type NotificationCenterProps = {
  dictionary: Dictionary;
  locale: Locale;
};

export function NotificationCenter({ dictionary, locale }: NotificationCenterProps) {
  const copy = dictionary.notificationsModule;
  const { state, tenantId, dataVersion, notifyDataChanged } = usePersistence();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LocalNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (state.status !== "ready") return;
    setLoading(true);
    const rows = await deriveLocalNotifications(state.repos, tenantId, locale);
    setItems(rows);
    setLoading(false);
  }, [locale, state, tenantId]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refresh when panel opens
    void reload();
  }, [open, reload, dataVersion]);

  const unreadCount = items.filter((item) => !item.read).length;

  async function handleMarkRead(id: string) {
    if (state.status !== "ready") return;
    await markNotificationRead(state.repos, id);
    notifyDataChanged();
    await reload();
  }

  async function handleMarkAllRead() {
    if (state.status !== "ready") return;
    await markAllNotificationsRead(
      state.repos,
      items.map((item) => item.id)
    );
    notifyDataChanged();
    await reload();
  }

  return (
    <div className="relative">
      <button
        aria-label={copy.trigger}
        className="relative rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span aria-hidden>🔔</span>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            aria-label={copy.close}
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <span className="text-sm font-bold">{copy.title}</span>
              <button
                className="text-xs text-blue-300 hover:underline"
                onClick={() => void handleMarkAllRead()}
                type="button"
              >
                {copy.markAllRead}
              </button>
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {loading ? (
                <li className="px-4 py-6 text-center text-sm text-slate-500">{copy.loading}</li>
              ) : items.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-slate-500">{copy.empty}</li>
              ) : (
                items.map((item) => (
                  <li className="border-b border-slate-800 last:border-0" key={item.id}>
                    <Link
                      className={`block px-4 py-3 hover:bg-slate-800 ${item.read ? "opacity-60" : ""}`}
                      href={item.href}
                      onClick={() => {
                        void handleMarkRead(item.id);
                        setOpen(false);
                      }}
                    >
                      <div className="text-sm font-semibold text-slate-100">{item.title}</div>
                      <div className="mt-0.5 text-xs text-slate-400">{item.message}</div>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
