import path from "node:path";
import {
  getActionableFailures,
  getOrchestrationProblems,
  getOrchestratorErrors,
  getRequiredFailures,
  runConfiguredChecks
} from "./checks";
import { evaluateCodexLaunch, buildCodexTaskMarkdown, launchCodex } from "./codex";
import { diffApplicationChanges, getGitState, getReportIgnorePaths } from "./git";
import { assertReadOnlyGuards, loadPolicy } from "./policy";
import { scanFilesForPrivacyViolations } from "./privacy";
import { detectPackageManager } from "./runner";
import {
  buildHealthReportSkeleton,
  createRunId,
  inspectCodexTaskState,
  writeCodexTaskIfAllowed,
  writeHealthReport
} from "./report";
import type {
  CheckResult,
  HealthReport,
  MaintenanceMode,
  OrchestratorOptions,
  OrchestratorResult,
  OverallStatus,
  StopDecision
} from "./types";

function determineOverallStatus(input: {
  orchestratorErrors: boolean;
  orchestrationProblems: boolean;
  requiredFailures: boolean;
  privacyFailed: boolean;
  policyBlockers: string[];
}): OverallStatus {
  if (input.orchestratorErrors) {
    return "orchestrator_error";
  }

  if (input.privacyFailed || input.policyBlockers.length > 0 || input.orchestrationProblems) {
    return "blocked";
  }

  if (input.requiredFailures) {
    return "unhealthy";
  }

  return "healthy";
}

function determineStopDecision(input: {
  overallStatus: OverallStatus;
  actionableFailures: boolean;
  unexpectedApplicationChanges: boolean;
  privacyFailed: boolean;
  policyBlockers: string[];
}): StopDecision {
  if (input.policyBlockers.length > 0 || input.privacyFailed) {
    return "BLOCKED";
  }

  if (input.overallStatus === "orchestrator_error") {
    return "BLOCKED";
  }

  if (input.actionableFailures || input.overallStatus === "unhealthy") {
    return "CONTINUE";
  }

  if (input.unexpectedApplicationChanges) {
    return "BLOCKED";
  }

  return "STOP";
}

function determineExitCode(overallStatus: OverallStatus, stopDecision: StopDecision): number {
  if (stopDecision === "STOP" && overallStatus === "healthy") {
    return 0;
  }

  if (overallStatus === "orchestrator_error") {
    return 3;
  }

  if (overallStatus === "blocked" || stopDecision === "BLOCKED") {
    return 2;
  }

  return 1;
}

export async function runOrchestrator(
  options: OrchestratorOptions
): Promise<OrchestratorResult> {
  const repoRoot = path.resolve(options.repoRoot);
  const mode: MaintenanceMode = options.mode;
  const policy = loadPolicy(repoRoot, options.policyPath);
  const policyBlockers = assertReadOnlyGuards(policy);
  const gitBefore = getGitState(repoRoot);
  const runId = createRunId();
  const generatedFiles: string[] = [];

  let checks: CheckResult[] = [];
  let orchestratorError: string | null = null;

  try {
    checks = await runConfiguredChecks(repoRoot, policy, mode);
  } catch (error) {
    orchestratorError = error instanceof Error ? error.message : "Unknown orchestrator error";
    checks = [];
  }

  const orchestrationProblems = getOrchestrationProblems(checks);
  const orchestratorErrors = getOrchestratorErrors(checks);
  const requiredFailures = getRequiredFailures(checks);
  const actionableFailures = getActionableFailures(checks);
  const codexLaunch = evaluateCodexLaunch(policy, checks);
  const highestPriorityFailure = actionableFailures[0];

  let launcherResult;
  if (options.invokeCodex && codexLaunch.allowed && !policy.readOnly) {
    launcherResult = await launchCodex({
      repoRoot,
      policy,
      taskPrompt:
        options.codexTaskPrompt ??
        (highestPriorityFailure
          ? buildCodexTaskMarkdown(highestPriorityFailure)
          : "No actionable failure prompt provided"),
      invokeLaunch: true
    });
    codexLaunch.launched = launcherResult.launched;
    codexLaunch.launcherResult = launcherResult;
    codexLaunch.reason = launcherResult.reason;
  }

  let taskGenerated = false;
  if (highestPriorityFailure && codexLaunch.allowed && !policy.readOnly) {
    const taskResult = writeCodexTaskIfAllowed(
      repoRoot,
      policy,
      { ...codexLaunch, allowed: true },
      highestPriorityFailure
    );
    taskGenerated = taskResult.generated;
    if (taskGenerated) {
      generatedFiles.push(taskResult.path);
    }
  }

  const gitAfter = getGitState(repoRoot);
  const ignoredPaths = getReportIgnorePaths(policy.reportPaths);
  const applicationFilesChanged = diffApplicationChanges(
    gitBefore.changedFiles,
    gitAfter.changedFiles,
    ignoredPaths
  );

  let overallStatus = determineOverallStatus({
    orchestratorErrors: orchestratorErrors.length > 0 || orchestratorError !== null,
    orchestrationProblems: orchestrationProblems.length > 0,
    requiredFailures: requiredFailures.length > 0,
    privacyFailed: false,
    policyBlockers
  });

  const blockers = [...policyBlockers];
  if (orchestratorError) {
    blockers.push(orchestratorError);
  }

  if (applicationFilesChanged.length > 0) {
    blockers.push(
      `Unexpected application source changes detected: ${applicationFilesChanged.join(", ")}`
    );
  }

  let stopDecision = determineStopDecision({
    overallStatus,
    actionableFailures: actionableFailures.length > 0,
    unexpectedApplicationChanges: applicationFilesChanged.length > 0,
    privacyFailed: false,
    policyBlockers
  });

  const preliminaryReport = buildHealthReportSkeleton({
    runId,
    branch: gitAfter.branch,
    commit: gitAfter.commit,
    dirtyBefore: gitBefore.dirty,
    dirtyAfter: gitAfter.dirty,
    packageManager: detectPackageManager(repoRoot),
    policyMode: policy.maintenanceMode,
    checks,
    generatedFiles,
    applicationFilesChanged,
    privacyScan: { passed: true, violations: [], scannedFiles: [] },
    codexLaunch: {
      ...codexLaunch,
      launched: false,
      taskGenerated
    },
    stopDecision,
    blockers,
    overallStatus,
    codexTask: inspectCodexTaskState(repoRoot, policy, taskGenerated)
  });

  let healthReportPath: string;
  try {
    healthReportPath = writeHealthReport(repoRoot, policy, preliminaryReport);
    generatedFiles.push(healthReportPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to write health report";
    return {
      report: {
        ...preliminaryReport,
        overallStatus: "orchestrator_error",
        stopDecision: "BLOCKED",
        blockers: [...blockers, message]
      },
      exitCode: 3
    };
  }

  const privacyScan = scanFilesForPrivacyViolations(
    [path.join(repoRoot, healthReportPath)],
    [...policy.sensitivePathPatterns, ...policy.secretRedactionPatterns],
    repoRoot
  );

  if (!privacyScan.passed) {
    overallStatus = "blocked";
    stopDecision = "BLOCKED";
    blockers.push(...privacyScan.violations);
  }

  const finalReport: HealthReport = {
    ...preliminaryReport,
    generatedFiles: [...new Set(generatedFiles)],
    privacyScan,
    stopDecision,
    blockers,
    overallStatus,
    codexTask: inspectCodexTaskState(repoRoot, policy, taskGenerated)
  };

  try {
    writeHealthReport(repoRoot, policy, finalReport);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to rewrite health report";
    return {
      report: {
        ...finalReport,
        overallStatus: "orchestrator_error",
        stopDecision: "BLOCKED",
        blockers: [...blockers, message]
      },
      exitCode: 3
    };
  }

  return {
    report: finalReport,
    exitCode: determineExitCode(finalReport.overallStatus, finalReport.stopDecision)
  };
}
