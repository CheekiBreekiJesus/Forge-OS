"use client";

import { useEffect } from "react";

export function useHashAction(hash: string, onMatch: () => void) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === `#${hash}`) {
      onMatch();
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, [hash, onMatch]);
}

export function isArchivedRecord(record: { active?: boolean; archivedAt?: string | null }): boolean {
  return record.active === false || Boolean(record.archivedAt);
}

export function filterBySearch<T>(rows: T[], query: string, getText: (row: T) => string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => getText(row).toLowerCase().includes(q));
}
