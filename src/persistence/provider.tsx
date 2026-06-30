"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import {
  destroyRepositories,
  initializeRepositories,
  resetAndReseedRepositories,
  type LocalRepositoryBundle
} from "@/persistence/registry";

type PersistenceState =
  | { status: "loading" }
  | { status: "ready"; repos: LocalRepositoryBundle; tenantId: string }
  | { status: "error"; message: string };

type PersistenceContextValue = {
  state: PersistenceState;
  tenantId: string;
  dataVersion: number;
  refresh: () => Promise<void>;
  notifyDataChanged: () => void;
  resetDemoData: () => Promise<void>;
  reseedDemoData: () => Promise<void>;
};

const PersistenceContext = createContext<PersistenceContextValue | null>(null);

export function PersistenceProvider({
  children,
  tenantId = DEFAULT_TENANT_ID
}: {
  children: ReactNode;
  tenantId?: string;
}) {
  const [state, setState] = useState<PersistenceState>({ status: "loading" });
  const [version, setVersion] = useState(0);
  const [dataVersion, setDataVersion] = useState(0);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const repos = await initializeRepositories(tenantId);
      setState({ status: "ready", repos, tenantId });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Database initialization failed."
      });
    }
  }, [tenantId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- IndexedDB init on mount
    void load();
    return () => {
      void destroyRepositories();
    };
  }, [load, version]);

  const refresh = useCallback(async () => {
    setVersion((v) => v + 1);
  }, []);

  const notifyDataChanged = useCallback(() => {
    setDataVersion((v) => v + 1);
  }, []);

  const resetDemoData = useCallback(async () => {
    if (state.status !== "ready") return;
    await state.repos.reset();
    setVersion((v) => v + 1);
  }, [state]);

  const reseedDemoData = useCallback(async () => {
    await resetAndReseedRepositories(tenantId);
    setVersion((v) => v + 1);
  }, [tenantId]);

  const value = useMemo(
    () => ({
      state,
      tenantId,
      dataVersion,
      refresh,
      notifyDataChanged,
      resetDemoData,
      reseedDemoData
    }),
    [state, tenantId, dataVersion, refresh, notifyDataChanged, resetDemoData, reseedDemoData]
  );

  return (
    <PersistenceContext.Provider value={value}>{children}</PersistenceContext.Provider>
  );
}

export function usePersistence(): PersistenceContextValue {
  const ctx = useContext(PersistenceContext);
  if (!ctx) {
    throw new Error("usePersistence must be used within PersistenceProvider");
  }
  return ctx;
}

export function useRepositories(): LocalRepositoryBundle {
  const { state } = usePersistence();
  if (state.status !== "ready") {
    throw new Error("Repositories not ready");
  }
  return state.repos;
}

export function usePersistenceReady(): boolean {
  const { state } = usePersistence();
  return state.status === "ready";
}

export function usePersistenceError(): string | null {
  const { state } = usePersistence();
  return state.status === "error" ? state.message : null;
}

export function usePersistenceLoading(): boolean {
  const { state } = usePersistence();
  return state.status === "loading";
}
