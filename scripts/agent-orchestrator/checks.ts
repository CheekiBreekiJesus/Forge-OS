import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { classifyFailure, truncateOutput } from "./classify";
import { getGitState } from "./git";
import { runNpmScript } from "./runner";
import type {
  CheckResult,
  CheckStatus,
  FailureClassification,
  MaintenanceMode,
  MaintenancePolicy,
  PolicyCheckDefinition
} from "./types";

const REQUIRED_STRUCTURE_PATHS = [
  "package.json",
  "AGENTS.md",
  "agent/maintenance-policy.json",
  "scripts/agent-orchestrator"
];

function makeCheckResult(
  definition: PolicyCheckDefinition,
  partial: Partial<CheckResult> & Pick<CheckResult, "command" | "workingDirectory" | "startedAt" | "finishedAt" | "durationMs">
): CheckResult {
  return {
    id: definition.id,
    label: definition.label,
    required: definition.required,
    exitCode: partial.exitCode ?? 0,
    status: partial.status ?? "pass",
    classification: partial.classification ?? "none",
    stdout: partial.stdout ?? "",
    stderr: partial.stderr ?? "",
    message: partial.message,
    ...partial
  };
}

function runStructureCheck(
  definition: PolicyCheckDefinition,
  repoRoot: string
): CheckResult {
  const startedAt = new Date();
  const missing = REQUIRED_STRUCTURE_PATHS.filter(
    (relativePath) => !existsSync(path.join(repoRoot, relativePath))
  );
  const finishedAt = new Date();

  if (missing.length > 0) {
    return makeCheckResult(definition, {
      command: "structure-validation",
      workingDirectory: ".",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      exitCode: 1,
      status: "fail",
      classification: "orchestration_problem",
      stdout: "",
      stderr: `Missing required paths: ${missing.join(", ")}`,
      message: "Repository structure validation failed"
    });
  }

  return makeCheckResult(definition, {
    command: "structure-validation",
    workingDirectory: ".",
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    exitCode: 0,
    status: "pass",
    classification: "none",
    stdout: "Required repository structure present",
    stderr: ""
  });
}

function runGitCheck(definition: PolicyCheckDefinition, repoRoot: string): CheckResult {
  const startedAt = new Date();

  try {
    const gitState = getGitState(repoRoot);
    const finishedAt = new Date();

    return makeCheckResult(definition, {
      command: "git status --porcelain",
      workingDirectory: ".",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      exitCode: 0,
      status: "pass",
      classification: "none",
      stdout: `branch=${gitState.branch}; commit=${gitState.commit}; dirty=${gitState.dirty}; changedFiles=${gitState.changedFiles.length}`,
      stderr: ""
    });
  } catch (error) {
    const finishedAt = new Date();
    const message = error instanceof Error ? error.message : "Git inspection failed";

    return makeCheckResult(definition, {
      command: "git status --porcelain",
      workingDirectory: ".",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      exitCode: 1,
      status: "orchestrator_error",
      classification: "orchestration_problem",
      stdout: "",
      stderr: message,
      message
    });
  }
}

function runPackageCheck(
  definition: PolicyCheckDefinition,
  repoRoot: string,
  policy: MaintenancePolicy
): CheckResult {
  const startedAt = new Date();
  const packageJsonPath = path.join(repoRoot, "package.json");

  if (!existsSync(packageJsonPath)) {
    const finishedAt = new Date();
    return makeCheckResult(definition, {
      command: "package-validation",
      workingDirectory: ".",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      exitCode: 1,
      status: "orchestrator_error",
      classification: "orchestration_problem",
      stdout: "",
      stderr: "package.json is missing",
      message: "Package validation failed"
    });
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    scripts?: Record<string, string>;
  };
  const scripts = packageJson.scripts ?? {};
  const requiredScripts = policy.checks
    .filter((check) => check.type === "npm-script" && check.required)
    .map((check) => check.npmScript)
    .filter((scriptName): scriptName is string => Boolean(scriptName));

  const missingRequiredScripts = requiredScripts.filter((scriptName) => !scripts[scriptName]);
  const finishedAt = new Date();

  if (missingRequiredScripts.length > 0) {
    return makeCheckResult(definition, {
      command: "package-validation",
      workingDirectory: ".",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      exitCode: 1,
      status: "fail",
      classification: "orchestration_problem",
      stdout: "",
      stderr: `Missing required npm scripts: ${missingRequiredScripts.join(", ")}`,
      message: "Required npm scripts are not configured"
    });
  }

  return makeCheckResult(definition, {
    command: "package-validation",
    workingDirectory: ".",
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    exitCode: 0,
    status: "pass",
    classification: "none",
    stdout: `Configured scripts: ${Object.keys(scripts).join(", ")}`,
    stderr: ""
  });
}

async function runNpmScriptCheck(
  definition: PolicyCheckDefinition,
  repoRoot: string,
  policy: MaintenancePolicy,
  packageScripts: Record<string, string>
): Promise<CheckResult> {
  const scriptName = definition.npmScript;

  if (!scriptName) {
    const now = new Date().toISOString();
    return makeCheckResult(definition, {
      command: "npm run",
      workingDirectory: ".",
      startedAt: now,
      finishedAt: now,
      durationMs: 0,
      exitCode: 1,
      status: "orchestrator_error",
      classification: "orchestration_problem",
      stdout: "",
      stderr: "npmScript is not defined for check",
      message: "Invalid npm-script check configuration"
    });
  }

  if (!packageScripts[scriptName]) {
    const now = new Date().toISOString();
    const status: CheckStatus = definition.required ? "fail" : "not_configured";
    const classification: FailureClassification = definition.required
      ? "orchestration_problem"
      : "none";

    return makeCheckResult(definition, {
      command: `npm run ${scriptName}`,
      workingDirectory: ".",
      startedAt: now,
      finishedAt: now,
      durationMs: 0,
      exitCode: definition.required ? 1 : 0,
      status,
      classification,
      stdout: "",
      stderr: definition.required
        ? `Required npm script "${scriptName}" is not configured`
        : `Optional npm script "${scriptName}" is not configured`,
      message: definition.required
        ? "Required npm script missing"
        : "Optional npm script not configured"
    });
  }

  const timeoutMs =
    scriptName === "build" ? policy.timeouts.buildMs : policy.timeouts.defaultMs;
  const commandResult = await runNpmScript(
    scriptName,
    repoRoot,
    timeoutMs,
    policy.secretRedactionPatterns
  );

  let status: CheckStatus = "pass";
  let classification: FailureClassification = "none";

  if (commandResult.errorMessage) {
    status = "orchestrator_error";
    classification = "orchestration_problem";
  } else if (commandResult.exitCode !== 0) {
    status = "fail";
    classification = classifyFailure(
      commandResult.stdout,
      commandResult.stderr,
      commandResult.exitCode
    );
  }

  return makeCheckResult(definition, {
    command: `npm run ${scriptName}`,
    workingDirectory: commandResult.workingDirectory,
    startedAt: commandResult.startedAt,
    finishedAt: commandResult.finishedAt,
    durationMs: commandResult.durationMs,
    exitCode: commandResult.exitCode,
    status,
    classification,
    stdout: truncateOutput(commandResult.stdout),
    stderr: truncateOutput(commandResult.stderr),
    message: commandResult.errorMessage
  });
}

export async function runConfiguredChecks(
  repoRoot: string,
  policy: MaintenancePolicy,
  mode: MaintenanceMode
): Promise<CheckResult[]> {
  const packageJson = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8")
  ) as { scripts?: Record<string, string> };
  const packageScripts = packageJson.scripts ?? {};
  const results: CheckResult[] = [];

  for (const definition of policy.checks) {
    if (mode === "health" && definition.id === "build") {
      const now = new Date().toISOString();
      results.push(
        makeCheckResult(definition, {
          command: "npm run build",
          workingDirectory: ".",
          startedAt: now,
          finishedAt: now,
          durationMs: 0,
          exitCode: 0,
          status: "skipped",
          classification: "none",
          stdout: "",
          stderr: "Skipped in agent:health mode",
          message: "Build skipped for lightweight health check"
        })
      );
      continue;
    }

    switch (definition.type) {
      case "structure":
        results.push(runStructureCheck(definition, repoRoot));
        break;
      case "git":
        results.push(runGitCheck(definition, repoRoot));
        break;
      case "package":
        results.push(runPackageCheck(definition, repoRoot, policy));
        break;
      case "npm-script":
        results.push(await runNpmScriptCheck(definition, repoRoot, policy, packageScripts));
        break;
      default:
        break;
    }
  }

  return results;
}

export function getActionableFailures(checks: CheckResult[]): CheckResult[] {
  return checks.filter(
    (check) =>
      check.required &&
      check.status === "fail" &&
      check.classification === "actionable_code_failure"
  );
}

export function getOrchestrationProblems(checks: CheckResult[]): CheckResult[] {
  return checks.filter(
    (check) =>
      check.classification === "orchestration_problem" && check.status !== "orchestrator_error"
  );
}

export function getOrchestratorErrors(checks: CheckResult[]): CheckResult[] {
  return checks.filter((check) => check.status === "orchestrator_error");
}

export function getRequiredFailures(checks: CheckResult[]): CheckResult[] {
  return checks.filter((check) => check.required && check.status === "fail");
}
