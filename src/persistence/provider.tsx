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
import { DEFAULT_TENANT_ID, LOCAL_DB_NAME } from "@/domain/constants";
import {
  destroyRepositories,
  initializeRepositories,
  recoverLocalDatabase as recoverLocalDatabaseRegistry,
  type LocalRepositoryBundle
} from "@/persistence/registry";
import { PersistenceStartupError } from "@/persistence/startup";

type PersistenceState =
  | { status: "loading" }
  | { status: "ready"; repos: LocalRepositoryBundle; tenantId: string }
  | { status: "error"; message: string; recoverable: boolean };

type PersistenceContextValue = {
  state: PersistenceState;
  tenantId: string;
  dataVersion: number;
  refresh: () => Promise<void>;
  notifyDataChanged: () => void;
  resetDemoData: () => Promise<void>;
  reseedDemoData: () => Promise<void>;
  clearAllLocalData: () => Promise<void>;
  restoreDeterministicDemoState: () => Promise<void>;
  recoverLocalDatabase: (options?: { deleteDatabase?: boolean }) => Promise<void>;
  localDbName: string;
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

  const load = useCallback(async (isActive: () => boolean) => {
    if (isActive()) {
      setState({ status: "loading" });
    }
    try {
      const repos = await initializeRepositories(tenantId);
      if (isActive()) {
        setState({ status: "ready", repos, tenantId });
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("interrupted")) {
        try {
          const repos = await initializeRepositories(tenantId);
          if (isActive()) {
            setState({ status: "ready", repos, tenantId });
          }
          return;
        } catch (retryError) {
          error = retryError;
        }
      }
      const startupError =
        error instanceof PersistenceStartupError
          ? error
          : new PersistenceStartupError(
              error instanceof Error ? error.message : "Database initialization failed."
            );
      if (isActive()) {
        setState({
          status: "error",
          message: startupError.message,
          recoverable: startupError.recoverable
        });
      }
    }
  }, [tenantId]);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- IndexedDB init on mount
    void load(() => active);
    return () => {
      active = false;
    };
  }, [load, version]);

  const refresh = useCallback(async () => {
    await destroyRepositories();
    setVersion((v) => v + 1);
  }, []);

  const notifyDataChanged = useCallback(() => {
    setDataVersion((v) => v + 1);
  }, []);

  const resetDemoData = useCallback(async () => {
    if (state.status !== "ready") return;
    await state.repos.resetDemoData(tenantId);
    setVersion((v) => v + 1);
  }, [state, tenantId]);

  const reseedDemoData = useCallback(async () => {
    if (state.status !== "ready") return;
    await state.repos.resetDemoData(tenantId);
    setVersion((v) => v + 1);
  }, [state, tenantId]);

  const clearAllLocalData = useCallback(async () => {
    if (state.status !== "ready") return;
    await state.repos.reset();
    setVersion((v) => v + 1);
  }, [state]);

  const restoreDeterministicDemoState = useCallback(async () => {
    if (state.status !== "ready") return;
    await state.repos.restoreDeterministicDemoState(tenantId);
    setVersion((v) => v + 1);
  }, [state, tenantId]);

  const recoverLocalDatabase = useCallback(
    async (options?: { deleteDatabase?: boolean }) => {
      setState({ status: "loading" });
      try {
        const repos = await recoverLocalDatabaseRegistry(tenantId, options);
        setState({ status: "ready", repos, tenantId });
      } catch (error) {
        const startupError =
          error instanceof PersistenceStartupError
            ? error
            : new PersistenceStartupError(
                error instanceof Error ? error.message : "Database recovery failed."
              );
        setState({
          status: "error",
          message: startupError.message,
          recoverable: startupError.recoverable
        });
      }
    },
    [tenantId]
  );

  const value = useMemo(
    () => ({
      state,
      tenantId,
      dataVersion,
      refresh,
      notifyDataChanged,
      resetDemoData,
      reseedDemoData,
      clearAllLocalData,
      restoreDeterministicDemoState,
      recoverLocalDatabase,
      localDbName: LOCAL_DB_NAME
    }),
    [
      state,
      tenantId,
      dataVersion,
      refresh,
      notifyDataChanged,
      resetDemoData,
      reseedDemoData,
      clearAllLocalData,
      restoreDeterministicDemoState,
      recoverLocalDatabase
    ]
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

export function usePersistenceErrorState(): { message: string; recoverable: boolean } | null {
  const { state } = usePersistence();
  return state.status === "error"
    ? { message: state.message, recoverable: state.recoverable }
    : null;
}

export function usePersistenceLoading(): boolean {
  const { state } = usePersistence();
  return state.status === "loading";
}
