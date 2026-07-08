import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { MaintenancePolicy } from "../types";

const BASE_POLICY: MaintenancePolicy = {
  version: "1.0.0",
  maintenanceMode: "read-only-validation",
  readOnly: true,
  allowCodexLaunch: false,
  allowSourceChanges: false,
  allowCommit: false,
  allowPush: false,
  allowMerge: false,
  allowDeploy: false,
  maximumSignificantChangesPerRun: 0,
  reportPaths: {
    healthReport: "qa/reports/latest-health.json",
    codexTask: "qa/reports/next-codex-task.md",
    healthSchema: "qa/reports/health-report.schema.json"
  },
  allowedCommands: ["npm", "node", "git", "npx"],
  prohibitedActions: ["commit", "push", "merge", "deploy"],
  sensitivePathPatterns: ["\\\\Users\\\\[^\\\\]+\\\\"],
  secretRedactionPatterns: ["OPENAI_API_KEY=\\\\S+"],
  codexLaunchConditions: {
    requiresActionableCodeFailure: true,
    requiresPolicyAllowCodexLaunch: true,
    requiresReadOnlyDisabled: true,
    excludesMissingDependencies: true,
    excludesMissingEnvironment: true,
    maximumTasksPerRun: 1
  },
  healthyStopConditions: {
    allRequiredChecksPass: true,
    noActionableFailure: true,
    noUnexpectedApplicationChanges: true,
    noPrivateDataDetected: true,
    codexNotLaunched: true,
    noFollowUpTaskRequired: true
  },
  checks: [
    {
      id: "repository-structure",
      label: "Repository structure validation",
      required: true,
      type: "structure"
    },
    {
      id: "git-state",
      label: "Git state inspection",
      required: true,
      type: "git"
    },
    {
      id: "package-validation",
      label: "Package and workspace validation",
      required: true,
      type: "package"
    },
    {
      id: "lint",
      label: "Lint",
      required: false,
      type: "npm-script",
      npmScript: "lint"
    },
    {
      id: "optional-script",
      label: "Optional script",
      required: false,
      type: "npm-script",
      npmScript: "optional-check"
    }
  ],
  timeouts: {
    defaultMs: 30000,
    buildMs: 60000,
    gitMs: 10000
  },
  reportRetention: {
    ignoreGeneratedReportsInGitDirtyCheck: true,
    trackedArtifacts: ["qa/reports/.gitkeep", "qa/reports/health-report.schema.json"]
  }
};

export function createFixtureRepo(name: string): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), `forgeos-orchestrator-${name}-`));
  mkdirSync(path.join(dir, "agent"), { recursive: true });
  mkdirSync(path.join(dir, "scripts", "agent-orchestrator"), { recursive: true });
  mkdirSync(path.join(dir, "qa", "reports"), { recursive: true });

  writeFileSync(path.join(dir, "AGENTS.md"), "# AGENTS\n", "utf8");
  writeFileSync(path.join(dir, "scripts", "agent-orchestrator", ".gitkeep"), "", "utf8");
  writeFileSync(path.join(dir, "qa", "reports", ".gitkeep"), "", "utf8");

  return dir;
}

export function writePolicy(repoRoot: string, policy: MaintenancePolicy): void {
  writeFileSync(
    path.join(repoRoot, "agent", "maintenance-policy.json"),
    `${JSON.stringify(policy, null, 2)}\n`,
    "utf8"
  );
}

export function writePackageJson(
  repoRoot: string,
  scripts: Record<string, string> = {}
): void {
  writeFileSync(
    path.join(repoRoot, "package.json"),
    `${JSON.stringify({ name: "fixture", version: "1.0.0", scripts }, null, 2)}\n`,
    "utf8"
  );
}

export function initGitRepo(repoRoot: string): void {
  spawnSync("git", ["init"], { cwd: repoRoot, shell: false });
  spawnSync("git", ["config", "user.email", "fixture@example.com"], { cwd: repoRoot, shell: false });
  spawnSync("git", ["config", "user.name", "Fixture"], { cwd: repoRoot, shell: false });
  spawnSync("git", ["add", "."], { cwd: repoRoot, shell: false });
  spawnSync("git", ["commit", "-m", "fixture"], { cwd: repoRoot, shell: false });
}

export function cleanupFixture(repoRoot: string): void {
  rmSync(repoRoot, { recursive: true, force: true });
}

export function defaultPolicy(): MaintenancePolicy {
  return JSON.parse(JSON.stringify(BASE_POLICY)) as MaintenancePolicy;
}
