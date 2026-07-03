import type { LocalRepositoryBundle } from "@/persistence/interfaces";
import {
  createOutlookDurableSendAttemptStore,
  type OutlookDurableSendAttemptStore
} from "@/features/outlook-graph/durable-send-attempt-store";
import type { OutlookGraphConfig } from "@/features/outlook-graph/config";
import { readOutlookGraphConfig } from "@/features/outlook-graph/config";
import { createOutlookGraphEmailProvider } from "@/features/outlook-graph/outlook-graph-provider";
import type { OutlookGraphEmailProvider } from "@/features/outlook-graph/outlook-graph-provider";
import { assertOutlookServerOnlyModule } from "./server-only";

assertOutlookServerOnlyModule();

export type OutlookSendServerDependencies = {
  repos: LocalRepositoryBundle;
  attemptStore: OutlookDurableSendAttemptStore;
  provider: OutlookGraphEmailProvider;
  config: OutlookGraphConfig;
};

let injectedDependencies: OutlookSendServerDependencies | null = null;

export function setOutlookSendServerDependenciesForTests(
  deps: OutlookSendServerDependencies | null
): void {
  injectedDependencies = deps;
}

export function getOutlookSendServerDependencies(): OutlookSendServerDependencies | null {
  return injectedDependencies;
}

export function createOutlookSendServerDependencies(
  repos: LocalRepositoryBundle,
  options: {
    attemptStore?: OutlookDurableSendAttemptStore;
    config?: OutlookGraphConfig;
    provider?: OutlookGraphEmailProvider;
  } = {}
): OutlookSendServerDependencies {
  const config = options.config ?? readOutlookGraphConfig();
  return {
    attemptStore: options.attemptStore ?? createOutlookDurableSendAttemptStore(),
    config,
    provider: options.provider ?? createOutlookGraphEmailProvider(config),
    repos
  };
}
