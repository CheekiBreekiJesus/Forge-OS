"use client";

import { useCallback, useEffect, useState } from "react";
import type { CompanyProfile, SenderIdentity, UserProfile } from "@/domain/profile-types";
import type { Product } from "@/domain/product-types";
import { usePersistence } from "@/persistence/provider";

export function useCompanyProfile(): {
  profile: CompanyProfile | null;
  loading: boolean;
  reload: () => Promise<void>;
} {
  const { tenantId, state, dataVersion } = usePersistence();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (state.status !== "ready") return;
    setLoading(true);
    const row = await state.repos.companyProfiles.getForTenant(tenantId);
    setProfile(row);
    setLoading(false);
  }, [state, tenantId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- repository read on mount
    void reload();
  }, [reload, dataVersion]);

  return { profile, loading, reload };
}

export function useCurrentUserProfile(): {
  profile: UserProfile | null;
  loading: boolean;
  reload: () => Promise<void>;
} {
  const { tenantId, state, dataVersion } = usePersistence();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (state.status !== "ready") return;
    setLoading(true);
    const row = await state.repos.userProfiles.getCurrent(tenantId);
    setProfile(row);
    setLoading(false);
  }, [state, tenantId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- repository read on mount
    void reload();
  }, [reload, dataVersion]);

  return { profile, loading, reload };
}

export function useUserProfiles(): {
  profiles: UserProfile[];
  loading: boolean;
  reload: () => Promise<void>;
} {
  const { tenantId, state, dataVersion } = usePersistence();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (state.status !== "ready") return;
    setLoading(true);
    const rows = await state.repos.userProfiles.list(tenantId);
    setProfiles(rows);
    setLoading(false);
  }, [state, tenantId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- repository read on mount
    void reload();
  }, [reload, dataVersion]);

  return { profiles, loading, reload };
}

export function useSenderIdentities(): {
  identities: SenderIdentity[];
  loading: boolean;
  reload: () => Promise<void>;
} {
  const { tenantId, state, dataVersion } = usePersistence();
  const [identities, setIdentities] = useState<SenderIdentity[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (state.status !== "ready") return;
    setLoading(true);
    const rows = await state.repos.senderIdentities.list(tenantId);
    setIdentities(rows);
    setLoading(false);
  }, [state, tenantId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- repository read on mount
    void reload();
  }, [reload, dataVersion]);

  return { identities, loading, reload };
}

export function useProducts(): {
  products: Product[];
  loading: boolean;
  reload: () => Promise<void>;
} {
  const { tenantId, state, dataVersion } = usePersistence();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (state.status !== "ready") return;
    setLoading(true);
    const rows = await state.repos.products.list(tenantId);
    setProducts(rows);
    setLoading(false);
  }, [state, tenantId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- repository read on mount
    void reload();
  }, [reload, dataVersion]);

  return { products, loading, reload };
}
