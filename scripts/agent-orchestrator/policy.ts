import { readFileSync } from "node:fs";
import path from "node:path";
import type { MaintenancePolicy } from "./types";

export function loadPolicy(repoRoot: string, policyPath?: string): MaintenancePolicy {
  const resolved = policyPath ?? path.join(repoRoot, "agent", "maintenance-policy.json");
  const raw = readFileSync(resolved, "utf8");
  return JSON.parse(raw) as MaintenancePolicy;
}

export function assertReadOnlyGuards(policy: MaintenancePolicy): string[] {
  const blockers: string[] = [];

  if (policy.allowCommit) {
    blockers.push("Policy allows commit in read-only implementation");
  }
  if (policy.allowPush) {
    blockers.push("Policy allows push in read-only implementation");
  }
  if (policy.allowMerge) {
    blockers.push("Policy allows merge in read-only implementation");
  }
  if (policy.allowDeploy) {
    blockers.push("Policy allows deploy in read-only implementation");
  }
  if (policy.allowSourceChanges) {
    blockers.push("Policy allows source changes in read-only implementation");
  }

  return blockers;
}

export function isGitOperationAllowed(policy: MaintenancePolicy, operation: string): boolean {
  switch (operation) {
    case "commit":
      return policy.allowCommit;
    case "push":
      return policy.allowPush;
    case "merge":
      return policy.allowMerge;
    case "deploy":
      return policy.allowDeploy;
    default:
      return false;
  }
}
