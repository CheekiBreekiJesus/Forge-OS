"use client";

import { useCallback, useEffect, useState } from "react";
import type { CustomizerSimulation } from "@/domain/customizer-types";
import type {
  AdvertisingAccount,
  BrandKit,
  CampaignContentVariant,
  MarketingAsset,
  MarketingAudience,
  MarketingCampaign,
  VideoProject
} from "@/domain/marketing-types";
import type { Machine, InventoryItem } from "@/domain/operations-types";
import type { Product } from "@/domain/product-types";
import type { Lead, ProductionOrder, Quote, Customer, ActivityEvent } from "@/domain/types";
import type { ListOptions } from "@/persistence/archive-utils";
import { usePersistence } from "@/persistence/provider";

function toListOptions(includeArchived: boolean): ListOptions {
  return includeArchived ? { includeArchived: true } : {};
}

export function useTenantLeads(includeArchived = false): {
  leads: Lead[];
  loading: boolean;
  reload: () => Promise<void>;
} {
  const { tenantId, state, dataVersion } = usePersistence();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (state.status !== "ready") return;
    setLoading(true);
    const rows = await state.repos.leads.list(tenantId, toListOptions(includeArchived));
    setLeads(rows);
    setLoading(false);
  }, [state, tenantId, includeArchived]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- repository read on mount
    void reload();
  }, [reload, dataVersion]);

  return { leads, loading, reload };
}

export function useLeadById(leadId: string): {
  lead: Lead | null;
  loading: boolean;
  notFound: boolean;
} {
  const { tenantId, state, dataVersion } = usePersistence();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (state.status !== "ready") return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const row = await state.repos.leads.getById(tenantId, leadId);
      if (!cancelled) {
        setLead(row);
        setNotFound(!row);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state, tenantId, leadId, dataVersion]);

  return { lead, loading, notFound };
}

export function useCustomers(includeArchived = false): {
  customers: Customer[];
  loading: boolean;
  reload: () => Promise<void>;
} {
  const { tenantId, state, dataVersion } = usePersistence();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (state.status !== "ready") return;
    setLoading(true);
    const rows = await state.repos.customers.list(tenantId, toListOptions(includeArchived));
    setCustomers(rows);
    setLoading(false);
  }, [state, tenantId, includeArchived]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- repository read on mount
    void reload();
  }, [reload, dataVersion]);

  return { customers, loading, reload };
}

export function useQuotes(includeArchived = false): { quotes: Quote[]; loading: boolean; reload: () => Promise<void> } {
  const { tenantId, state, dataVersion } = usePersistence();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (state.status !== "ready") return;
    setLoading(true);
    const rows = await state.repos.quotes.list(tenantId, toListOptions(includeArchived));
    setQuotes(rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setLoading(false);
  }, [state, tenantId, includeArchived]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- repository read on mount
    void reload();
  }, [reload, dataVersion]);

  return { quotes, loading, reload };
}

export function useProductionOrders(includeArchived = false): {
  orders: ProductionOrder[];
  loading: boolean;
  reload: () => Promise<void>;
} {
  const { tenantId, state, dataVersion } = usePersistence();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (state.status !== "ready") return;
    setLoading(true);
    const rows = await state.repos.productionOrders.list(tenantId, toListOptions(includeArchived));
    setOrders(rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setLoading(false);
  }, [state, tenantId, includeArchived]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- repository read on mount
    void reload();
  }, [reload, dataVersion]);

  return { orders, loading, reload };
}

export function useActivities(): {
  activities: ActivityEvent[];
  loading: boolean;
  reload: () => Promise<void>;
} {
  const { tenantId, state, dataVersion } = usePersistence();
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (state.status !== "ready") return;
    setLoading(true);
    const rows = await state.repos.activities.list(tenantId);
    setActivities(rows.slice(0, 20));
    setLoading(false);
  }, [state, tenantId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- repository read on mount
    void reload();
  }, [reload, dataVersion]);

  return { activities, loading, reload };
}

export function useDashboardMetrics() {
  const { tenantId, state, dataVersion } = usePersistence();
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    qualifiedLeads: 0,
    customers: 0,
    opportunities: 0,
    openQuotations: 0,
    productionOrders: 0,
    outreachReady: 0,
    outreachQueued: 0,
    outreachSent: 0
  });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (state.status !== "ready") return;
    setLoading(true);
    const repos = state.repos;
    const [leads, customers, opportunities, quotes, orders] = await Promise.all([
      repos.leads.list(tenantId),
      repos.customers.list(tenantId),
      repos.opportunities.list(tenantId),
      repos.quotes.list(tenantId),
      repos.productionOrders.list(tenantId)
    ]);

    setMetrics({
      totalLeads: leads.length,
      qualifiedLeads: leads.filter(
        (l) => l.crmStatus === "qualified" || l.crmStatus === "quoted"
      ).length,
      customers: customers.length,
      opportunities: opportunities.filter((o) => o.stage !== "won" && o.stage !== "lost").length,
      openQuotations: quotes.filter((q) => q.status !== "approved").length,
      productionOrders: orders.length,
      outreachReady: leads.filter((l) => l.outreachStatus === "ready").length,
      outreachQueued: leads.filter((l) => l.outreachStatus === "queued").length,
      outreachSent: leads.filter(
        (l) => l.outreachStatus === "contacted" || l.providerState === "sent"
      ).length
    });
    setLoading(false);
  }, [state, tenantId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- repository read on mount
    void reload();
  }, [reload, dataVersion]);

  return { metrics, loading, reload };
}

export function useMachines(includeArchived = false): {
  machines: Machine[];
  loading: boolean;
  reload: () => Promise<void>;
} {
  const { tenantId, state, dataVersion } = usePersistence();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (state.status !== "ready") return;
    setLoading(true);
    const rows = await state.repos.machines.list(tenantId, toListOptions(includeArchived));
    setMachines(rows);
    setLoading(false);
  }, [state, tenantId, includeArchived]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- repository read on mount
    void reload();
  }, [reload, dataVersion]);

  return { machines, loading, reload };
}

export function useInventory(includeArchived = false): {
  items: InventoryItem[];
  loading: boolean;
  reload: () => Promise<void>;
} {
  const { tenantId, state, dataVersion } = usePersistence();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (state.status !== "ready") return;
    setLoading(true);
    const rows = await state.repos.inventory.list(tenantId, toListOptions(includeArchived));
    setItems(rows);
    setLoading(false);
  }, [state, tenantId, includeArchived]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- repository read on mount
    void reload();
  }, [reload, dataVersion]);

  return { items, loading, reload };
}

export function useProducts(includeArchived = false): {
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
    const rows = await state.repos.products.list(tenantId, toListOptions(includeArchived));
    setProducts(rows);
    setLoading(false);
  }, [state, tenantId, includeArchived]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- repository read on mount
    void reload();
  }, [reload, dataVersion]);

  return { products, loading, reload };
}

export function useCustomizerSimulations(includeArchived = false): {
  simulations: CustomizerSimulation[];
  loading: boolean;
  reload: () => Promise<void>;
} {
  const { tenantId, state, dataVersion } = usePersistence();
  const [simulations, setSimulations] = useState<CustomizerSimulation[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (state.status !== "ready") return;
    setLoading(true);
    const rows = await state.repos.customizerSimulations.list(tenantId, toListOptions(includeArchived));
    setSimulations(rows);
    setLoading(false);
  }, [state, tenantId, includeArchived]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- repository read on mount
    void reload();
  }, [reload, dataVersion]);

  return { simulations, loading, reload };
}

export function useCustomizerSimulationById(simulationId: string | null): {
  simulation: CustomizerSimulation | null;
  loading: boolean;
} {
  const { tenantId, state, dataVersion } = usePersistence();
  const [simulation, setSimulation] = useState<CustomizerSimulation | null>(null);
  const [loading, setLoading] = useState(Boolean(simulationId));

  useEffect(() => {
    if (!simulationId || state.status !== "ready") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear when id removed
      setSimulation(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const row = await state.repos.customizerSimulations.getById(tenantId, simulationId);
      if (!cancelled) {
        setSimulation(row);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state, tenantId, simulationId, dataVersion]);

  return { simulation, loading };
}

export function useMarketingStudioData(includeArchived = false): {
  advertisingAccounts: AdvertisingAccount[];
  assets: MarketingAsset[];
  audiences: MarketingAudience[];
  brandKits: BrandKit[];
  campaigns: MarketingCampaign[];
  loading: boolean;
  reload: () => Promise<void>;
  variants: CampaignContentVariant[];
  videoProjects: VideoProject[];
} {
  const { tenantId, state, dataVersion } = usePersistence();
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [variants, setVariants] = useState<CampaignContentVariant[]>([]);
  const [audiences, setAudiences] = useState<MarketingAudience[]>([]);
  const [advertisingAccounts, setAdvertisingAccounts] = useState<AdvertisingAccount[]>([]);
  const [videoProjects, setVideoProjects] = useState<VideoProject[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (state.status !== "ready") return;
    setLoading(true);
    const options = toListOptions(includeArchived);
    const [
      nextBrandKits,
      nextAssets,
      nextCampaigns,
      nextAudiences,
      nextAdvertisingAccounts,
      nextVideoProjects
    ] = await Promise.all([
      state.repos.brandKits.list(tenantId, options),
      state.repos.marketingAssets.list(tenantId, options),
      state.repos.marketingCampaigns.list(tenantId, options),
      state.repos.marketingAudiences.list(tenantId, options),
      state.repos.advertisingAccounts.list(tenantId),
      state.repos.videoProjects.list(tenantId, options)
    ]);
    const nextVariants = (
      await Promise.all(
        nextCampaigns.map((campaign) =>
          state.repos.campaignContentVariants.listForCampaign(tenantId, campaign.id)
        )
      )
    ).flat();
    setBrandKits(nextBrandKits);
    setAssets(nextAssets.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setCampaigns(nextCampaigns.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setVariants(nextVariants);
    setAudiences(nextAudiences.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setAdvertisingAccounts(nextAdvertisingAccounts);
    setVideoProjects(nextVideoProjects.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setLoading(false);
  }, [state, tenantId, includeArchived]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- repository read on mount
    void reload();
  }, [reload, dataVersion]);

  return {
    advertisingAccounts,
    assets,
    audiences,
    brandKits,
    campaigns,
    loading,
    reload,
    variants,
    videoProjects
  };
}

export function useMarketingCampaignById(campaignId: string): {
  campaign: MarketingCampaign | null;
  loading: boolean;
  variants: CampaignContentVariant[];
} {
  const { tenantId, state, dataVersion } = usePersistence();
  const [campaign, setCampaign] = useState<MarketingCampaign | null>(null);
  const [variants, setVariants] = useState<CampaignContentVariant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state.status !== "ready") return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const nextCampaign = await state.repos.marketingCampaigns.getById(tenantId, campaignId);
      const nextVariants = nextCampaign
        ? await state.repos.campaignContentVariants.listForCampaign(tenantId, nextCampaign.id)
        : [];
      if (!cancelled) {
        setCampaign(nextCampaign);
        setVariants(nextVariants);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state, tenantId, campaignId, dataVersion]);

  return { campaign, loading, variants };
}
