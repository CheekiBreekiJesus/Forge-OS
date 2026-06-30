"use client";

import { useCallback, useEffect, useState } from "react";
import type { Lead, ProductionOrder, Quote, Customer, ActivityEvent } from "@/domain/types";
import { usePersistence } from "@/persistence/provider";

export function useTenantLeads(): {
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
    const rows = await state.repos.leads.list(tenantId);
    setLeads(rows);
    setLoading(false);
  }, [state, tenantId]);

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

export function useCustomers(): {
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
    const rows = await state.repos.customers.list(tenantId);
    setCustomers(rows);
    setLoading(false);
  }, [state, tenantId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- repository read on mount
    void reload();
  }, [reload, dataVersion]);

  return { customers, loading, reload };
}

export function useQuotes(): { quotes: Quote[]; loading: boolean; reload: () => Promise<void> } {
  const { tenantId, state, dataVersion } = usePersistence();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (state.status !== "ready") return;
    setLoading(true);
    const rows = await state.repos.quotes.list(tenantId);
    setQuotes(rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setLoading(false);
  }, [state, tenantId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- repository read on mount
    void reload();
  }, [reload, dataVersion]);

  return { quotes, loading, reload };
}

export function useProductionOrders(): {
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
    const rows = await state.repos.productionOrders.list(tenantId);
    setOrders(rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setLoading(false);
  }, [state, tenantId]);

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
