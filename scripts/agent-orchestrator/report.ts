import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import type {
  CheckResult,
  CodexLaunchDecision,
  CodexTaskState,
  HealthReport,
  MaintenancePolicy,
  PrivacyScanResult
} from "./types";
import { HEALTH_REPORT_SCHEMA_VERSION } from "./types";
import { buildCodexTaskMarkdown } from "./codex";
import { sanitizeReportObject } from "./privacy";

export function ensureReportDirectory(reportDir: string): void {
  if (!existsSync(reportDir)) {
    mkdirSync(reportDir, { recursive: true });
  }
}

export function writeHealthReport(
  repoRoot: string,
  policy: MaintenancePolicy,
  report: HealthReport
): string {
  const reportPath = path.join(repoRoot, policy.reportPaths.healthReport);
  ensureReportDirectory(path.dirname(reportPath));
  const sanitized = sanitizeReportObject(report, policy.secretRedactionPatterns);
  writeFileSync(reportPath, `${JSON.stringify(sanitized, null, 2)}\n`, "utf8");
  return policy.reportPaths.healthReport.replace(/\\/g, "/");
}

export function writeCodexTaskIfAllowed(
  repoRoot: string,
  policy: MaintenancePolicy,
  codexLaunch: CodexLaunchDecision,
  failingCheck: CheckResult | undefined
): { generated: boolean; path: string } {
  const taskPath = path.join(repoRoot, policy.reportPaths.codexTask);

  if (!codexLaunch.allowed || !failingCheck || policy.readOnly) {
    return { generated: false, path: policy.reportPaths.codexTask.replace(/\\/g, "/") };
  }

  ensureReportDirectory(path.dirname(taskPath));
  writeFileSync(taskPath, buildCodexTaskMarkdown(failingCheck), "utf8");
  return { generated: true, path: policy.reportPaths.codexTask.replace(/\\/g, "/") };
}

export function inspectCodexTaskState(
  repoRoot: string,
  policy: MaintenancePolicy,
  taskGeneratedThisRun: boolean
): CodexTaskState {
  const relativePath = policy.reportPaths.codexTask.replace(/\\/g, "/");
  const absolutePath = path.join(repoRoot, policy.reportPaths.codexTask);
  const exists = existsSync(absolutePath);

  if (!exists) {
    return {
      path: relativePath,
      exists: false,
      current: false,
      stale: false,
      reason: "No Codex task file present"
    };
  }

  if (taskGeneratedThisRun) {
    return {
      path: relativePath,
      exists: true,
      current: true,
      stale: false,
      reason: "Codex task generated during this maintenance run"
    };
  }

  return {
    path: relativePath,
    exists: true,
    current: false,
    stale: true,
    reason: "Existing Codex task file was not regenerated during this run"
  };
}

export function createRunId(): string {
  return `maintain-${Date.now()}`;
}

export function buildHealthReportSkeleton(input: {
  runId: string;
  branch: string;
  commit: string;
  dirtyBefore: boolean;
  dirtyAfter: boolean;
  packageManager: string;
  policyMode: string;
  checks: CheckResult[];
  generatedFiles: string[];
  applicationFilesChanged: string[];
  privacyScan: PrivacyScanResult;
  codexLaunch: CodexLaunchDecision;
  stopDecision: HealthReport["stopDecision"];
  blockers: string[];
  overallStatus: HealthReport["overallStatus"];
  codexTask: CodexTaskState;
}): HealthReport {
  return {
    schemaVersion: HEALTH_REPORT_SCHEMA_VERSION,
    runId: input.runId,
    timestamp: new Date().toISOString(),
    branch: input.branch,
    commit: input.commit,
    dirtyBefore: input.dirtyBefore,
    dirtyAfter: input.dirtyAfter,
    packageManager: input.packageManager,
    policyMode: input.policyMode,
    checks: input.checks,
    generatedFiles: input.generatedFiles,
    applicationFilesChanged: input.applicationFilesChanged,
    privacyScan: input.privacyScan,
    codexLaunch: input.codexLaunch,
    stopDecision: input.stopDecision,
    blockers: input.blockers,
    overallStatus: input.overallStatus,
    codexTask: input.codexTask
  };
}

export function readExistingReportTimestamp(
  repoRoot: string,
  policy: MaintenancePolicy
): string | null {
  const reportPath = path.join(repoRoot, policy.reportPaths.healthReport);
  if (!existsSync(reportPath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(readFileSync(reportPath, "utf8")) as { timestamp?: string };
    return parsed.timestamp ?? null;
  } catch {
    return null;
  }
}

export function getFileModifiedTime(repoRoot: string, relativePath: string): number | null {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    return null;
  }

  return statSync(absolutePath).mtimeMs;
}
