"use client";

import { useCallback, useEffect, useState } from "react";
import type { OutreachTestProfile, UpsertOutreachTestProfileInput } from "@/domain/outreach-test-profile-types";
import { usePersistence } from "@/persistence/provider";

export function useOutreachTestProfile() {
  const { state, tenantId, dataVersion } = usePersistence();
  const [profile, setProfile] = useState<OutreachTestProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (state.status !== "ready") {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const row = await state.repos.outreachTestProfiles.getForTenant(tenantId);
    setProfile(row);
    setLoading(false);
  }, [state, tenantId]);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      void (async () => {
        if (state.status !== "ready") {
          if (!active) return;
          setProfile(null);
          setLoading(false);
          return;
        }

        setLoading(true);
        const row = await state.repos.outreachTestProfiles.getForTenant(tenantId);
        if (!active) return;
        setProfile(row);
        setLoading(false);
      })();
    });

    return () => {
      active = false;
    };
  }, [state, tenantId, dataVersion]);

  async function save(input: UpsertOutreachTestProfileInput) {
    if (state.status !== "ready") return null;
    const { saveOutreachTestProfile } = await import("@/application/outreach-test-profile-service");
    const saved = await saveOutreachTestProfile(state.repos, tenantId, input);
    setProfile(saved);
    return saved;
  }

  async function loadDefaults() {
    if (state.status !== "ready") return null;
    const { loadJhGomesOutreachTestProfileDefaults } = await import(
      "@/application/outreach-test-profile-service"
    );
    const saved = await loadJhGomesOutreachTestProfileDefaults(state.repos, tenantId);
    setProfile(saved);
    return saved;
  }

  async function reset() {
    if (state.status !== "ready") return;
    const { resetOutreachTestProfile } = await import("@/application/outreach-test-profile-service");
    await resetOutreachTestProfile(state.repos, tenantId);
    setProfile(null);
  }

  return { loadDefaults, loading, profile, reload, reset, save };
}
