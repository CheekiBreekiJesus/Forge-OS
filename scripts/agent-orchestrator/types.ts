export const HEALTH_REPORT_SCHEMA_VERSION = "1.0.0";

export type OverallStatus = "healthy" | "unhealthy" | "blocked" | "orchestrator_error";
export type StopDecision = "STOP" | "CONTINUE" | "BLOCKED";
export type CheckStatus =
  | "pass"
  | "fail"
  | "not_configured"
  | "skipped"
  | "orchestrator_error";

export type FailureClassification =
  | "actionable_code_failure"
  | "missing_dependency"
  | "missing_environment"
  | "orchestration_problem"
  | "none";

export type MaintenanceMode = "read-only-validation" | "maintain" | "health" | "canary";

export type CodexPolicyConfig = {
  executable: string;
  versionArgs: string[];
  launchArgs: string[];
  allowedPaths: string[];
  prohibitedPathPrefixes: string[];
  fixtureDirectory: string;
  validationCommand: string[];
  timeoutMs: number;
};

export type CodexLaunchFailureKind =
  | "executable_missing"
  | "authentication_unavailable"
  | "invalid_configuration"
  | "process_launch_failure"
  | "timeout"
  | "codex_task_failure"
  | "scope_violation"
  | "validation_failure"
  | "ambiguous_scope"
  | "policy_blocked"
  | "none";

export type CodexLauncherResult = {
  allowed: boolean;
  launched: boolean;
  reason: string;
  failureKind: CodexLaunchFailureKind;
  commandAvailable: boolean;
  codexVersion: string | null;
  sanitizedCommand: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number;
  processId: number | null;
  exitCode: number | null;
  signal: string | null;
  timedOut: boolean;
  stdout: string;
  stderr: string;
  allowedPaths: string[];
  changedPaths: string[];
  scopeViolation: boolean;
  validationResult: {
    command: string;
    exitCode: number | null;
    passed: boolean;
    stdout: string;
    stderr: string;
  } | null;
  decision: StopDecision;
};

export type PolicyCheckDefinition = {
  id: string;
  label: string;
  required: boolean;
  type: "structure" | "git" | "package" | "npm-script";
  npmScript?: string;
};

export type MaintenancePolicy = {
  version: string;
  maintenanceMode: string;
  readOnly: boolean;
  allowCodexLaunch: boolean;
  allowSourceChanges: boolean;
  allowCommit: boolean;
  allowPush: boolean;
  allowMerge: boolean;
  allowDeploy: boolean;
  maximumSignificantChangesPerRun: number;
  reportPaths: {
    healthReport: string;
    codexTask: string;
    healthSchema: string;
    canaryResult?: string;
  };
  allowedCommands: string[];
  prohibitedActions: string[];
  sensitivePathPatterns: string[];
  secretRedactionPatterns: string[];
  codexLaunchConditions: Record<string, boolean | number>;
  healthyStopConditions: Record<string, boolean>;
  checks: PolicyCheckDefinition[];
  timeouts: {
    defaultMs: number;
    buildMs: number;
    gitMs: number;
  };
  reportRetention?: {
    ignoreGeneratedReportsInGitDirtyCheck: boolean;
    trackedArtifacts: string[];
  };
  codex?: CodexPolicyConfig;
};

export type GitState = {
  branch: string;
  commit: string;
  dirty: boolean;
  changedFiles: string[];
};

export type CheckResult = {
  id: string;
  label: string;
  required: boolean;
  command: string;
  workingDirectory: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  exitCode: number | null;
  status: CheckStatus;
  classification: FailureClassification;
  stdout: string;
  stderr: string;
  message?: string;
};

export type PrivacyScanResult = {
  passed: boolean;
  violations: string[];
  scannedFiles: string[];
};

export type CodexLaunchDecision = {
  allowed: boolean;
  launched: boolean;
  reason: string;
  taskGenerated: boolean;
  launcherResult?: CodexLauncherResult;
};

export type CodexTaskState = {
  path: string;
  exists: boolean;
  current: boolean;
  stale: boolean;
  reason: string;
};

export type HealthReport = {
  schemaVersion: string;
  runId: string;
  timestamp: string;
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
  stopDecision: StopDecision;
  blockers: string[];
  overallStatus: OverallStatus;
  codexTask: CodexTaskState;
};

export type OrchestratorOptions = {
  repoRoot: string;
  mode: MaintenanceMode;
  policyPath?: string;
  invokeCodex?: boolean;
  codexTaskPrompt?: string;
};

export type OrchestratorResult = {
  report: HealthReport;
  exitCode: number;
};
