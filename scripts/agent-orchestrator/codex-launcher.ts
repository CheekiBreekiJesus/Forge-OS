import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { detectCodexExecutable } from "./codex-detect";
import {
  captureScopeSnapshot,
  detectScopeViolations,
  findAmbiguousScopeFiles,
  restoreScopedFiles
} from "./codex-scope";
import { getGitState } from "./git";
import { runCliCommand } from "./runner";
import { sanitizeCommandOutput } from "./sanitize";
import type {
  CodexLaunchFailureKind,
  CodexLauncherResult,
  MaintenancePolicy
} from "./types";

export type CodexLauncherOptions = {
  repoRoot: string;
  policy: MaintenancePolicy;
  taskPrompt: string;
  invokeLaunch?: boolean;
  spawnProcess?: typeof spawn;
};

function blockedResult(
  partial: Partial<CodexLauncherResult> & Pick<CodexLauncherResult, "reason" | "failureKind">
): CodexLauncherResult {
  return {
    allowed: false,
    launched: false,
    reason: partial.reason,
    failureKind: partial.failureKind,
    commandAvailable: partial.commandAvailable ?? false,
    codexVersion: partial.codexVersion ?? null,
    sanitizedCommand: partial.sanitizedCommand ?? "",
    startedAt: partial.startedAt ?? null,
    finishedAt: partial.finishedAt ?? null,
    durationMs: partial.durationMs ?? 0,
    processId: partial.processId ?? null,
    exitCode: partial.exitCode ?? null,
    signal: partial.signal ?? null,
    timedOut: partial.timedOut ?? false,
    stdout: partial.stdout ?? "",
    stderr: partial.stderr ?? "",
    allowedPaths: partial.allowedPaths ?? [],
    changedPaths: partial.changedPaths ?? [],
    scopeViolation: partial.scopeViolation ?? false,
    validationResult: partial.validationResult ?? null,
    decision: partial.decision ?? "BLOCKED"
  };
}

function classifyProcessFailure(stderr: string, stdout: string): CodexLaunchFailureKind {
  const combined = `${stdout}\n${stderr}`.toLowerCase();

  if (
    combined.includes("not authenticated") ||
    combined.includes("authentication") ||
    combined.includes("login required")
  ) {
    return "authentication_unavailable";
  }

  if (combined.includes("invalid model") || combined.includes("invalid configuration")) {
    return "invalid_configuration";
  }

  return "codex_task_failure";
}

export function buildCanaryTaskPrompt(input: {
  allowedPaths: string[];
  prohibitedPathPrefixes: string[];
  validationCommand: string[];
  objective: string;
}): string {
  return `${input.objective}

Allowed files only:
${input.allowedPaths.map((entry) => `- ${entry}`).join("\n")}

Prohibited paths:
${input.prohibitedPathPrefixes.map((entry) => `- ${entry}`).join("\n")}

Prohibited actions:
- commit, push, merge, deploy
- install dependencies
- change configuration outside the allowed files
- network-dependent research

Required validation command after editing:
${input.validationCommand.join(" ")}

Make only the smallest required change.
`;
}

async function runValidationCommand(
  validationCommand: string[],
  repoRoot: string,
  timeoutMs: number,
  redactionPatterns: string[]
): Promise<NonNullable<CodexLauncherResult["validationResult"]>> {
  const [command, ...args] = validationCommand;
  const result = await runCliCommand(validationCommand, repoRoot, timeoutMs, redactionPatterns);

  return {
    command: [command, ...args].join(" "),
    exitCode: result.exitCode,
    passed: result.exitCode === 0,
    stdout: result.stdout,
    stderr: result.stderr
  };
}

async function executeCodexProcess(input: {
  executablePath: string;
  launchArgs: string[];
  prompt: string;
  repoRoot: string;
  timeoutMs: number;
  redactionPatterns: string[];
  spawnProcess: typeof spawn;
}) {
  const startedAt = new Date();
  const taskDir = path.join(input.repoRoot, "qa", "reports");
  if (!existsSync(taskDir)) {
    mkdirSync(taskDir, { recursive: true });
  }

  writeFileSync(path.join(taskDir, "codex-canary-task.prompt"), input.prompt, "utf8");

  const args = [...input.launchArgs, input.prompt];
  const sanitizedCommand = sanitizeCommandOutput(
    `${input.executablePath} ${args.join(" ")}`,
    input.repoRoot,
    input.redactionPatterns
  );

  return new Promise<{
    launched: boolean;
    sanitizedCommand: string;
    startedAt: string;
    finishedAt: string;
    durationMs: number;
    processId: number | null;
    exitCode: number | null;
    signal: string | null;
    timedOut: boolean;
    stdout: string;
    stderr: string;
    failureKind: CodexLaunchFailureKind;
  }>((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let child: ChildProcessWithoutNullStreams;

    try {
      child = input.spawnProcess(input.executablePath, args, {
        cwd: input.repoRoot,
        shell: false,
        windowsHide: true,
        env: process.env
      }) as ChildProcessWithoutNullStreams;
    } catch (error) {
      const finishedAt = new Date();
      resolve({
        launched: false,
        sanitizedCommand,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        processId: null,
        exitCode: null,
        signal: null,
        timedOut: false,
        stdout: "",
        stderr: sanitizeCommandOutput(
          error instanceof Error ? error.message : "Failed to launch Codex",
          input.repoRoot,
          input.redactionPatterns
        ),
        failureKind: "process_launch_failure"
      });
      return;
    }

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, input.timeoutMs);

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("close", (exitCode, signal) => {
      clearTimeout(timer);
      const finishedAt = new Date();
      const sanitizedStdout = sanitizeCommandOutput(stdout, input.repoRoot, input.redactionPatterns);
      const sanitizedStderr = sanitizeCommandOutput(stderr, input.repoRoot, input.redactionPatterns);

      resolve({
        launched: true,
        sanitizedCommand,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        processId: child.pid ?? null,
        exitCode: timedOut ? null : exitCode,
        signal: signal ?? null,
        timedOut,
        stdout: sanitizedStdout,
        stderr: sanitizedStderr,
        failureKind: timedOut
          ? "timeout"
          : exitCode === 0
            ? "none"
            : classifyProcessFailure(sanitizedStderr, sanitizedStdout)
      });
    });
  });
}

export async function launchCodex(options: CodexLauncherOptions): Promise<CodexLauncherResult> {
  const repoRoot = path.resolve(options.repoRoot);
  const policy = options.policy;
  const codex = policy.codex;
  const spawnProcess = options.spawnProcess ?? spawn;

  if (!policy.allowCodexLaunch || policy.readOnly) {
    return blockedResult({
      reason: "Codex launch is blocked by policy",
      failureKind: "policy_blocked",
      allowedPaths: codex?.allowedPaths ?? []
    });
  }

  if (!codex || codex.allowedPaths.length === 0) {
    return blockedResult({
      reason: "Codex allowlist is missing or invalid",
      failureKind: "invalid_configuration",
      allowedPaths: []
    });
  }

  if (policy.maximumSignificantChangesPerRun !== 1) {
    return blockedResult({
      reason: "Codex launch requires maximumSignificantChangesPerRun = 1",
      failureKind: "invalid_configuration",
      allowedPaths: codex.allowedPaths
    });
  }

  const detection = detectCodexExecutable(
    codex.executable,
    codex.versionArgs,
    repoRoot,
    policy.secretRedactionPatterns
  );

  if (!detection.commandAvailable) {
    return blockedResult({
      reason: detection.reason,
      failureKind: detection.failureKind,
      commandAvailable: false,
      codexVersion: detection.codexVersion,
      sanitizedCommand: `${codex.executable} ${codex.versionArgs.join(" ")}`,
      stdout: detection.stdout,
      stderr: detection.stderr,
      allowedPaths: codex.allowedPaths
    });
  }

  const gitBefore = getGitState(repoRoot);
  const scopeBefore = captureScopeSnapshot(repoRoot, gitBefore.changedFiles, codex.allowedPaths);
  const ambiguous = findAmbiguousScopeFiles(gitBefore.changedFiles, codex.allowedPaths);

  if (ambiguous.length > 0) {
    return blockedResult({
      reason: `Ambiguous scope: allowed files already modified before launch (${ambiguous.join(", ")})`,
      failureKind: "ambiguous_scope",
      commandAvailable: true,
      codexVersion: detection.codexVersion,
      allowedPaths: codex.allowedPaths,
      changedPaths: ambiguous
    });
  }

  if (!existsSync(path.join(repoRoot, codex.fixtureDirectory))) {
    return blockedResult({
      reason: `Canary fixture directory not found: ${codex.fixtureDirectory}`,
      failureKind: "invalid_configuration",
      commandAvailable: true,
      codexVersion: detection.codexVersion,
      allowedPaths: codex.allowedPaths
    });
  }

  if (!options.invokeLaunch) {
    return blockedResult({
      reason: "Codex launch was evaluated but not invoked",
      failureKind: "policy_blocked",
      commandAvailable: true,
      codexVersion: detection.codexVersion,
      allowedPaths: codex.allowedPaths,
      decision: "BLOCKED"
    });
  }

  const processResult = await executeCodexProcess({
    executablePath: detection.executablePath ?? codex.executable,
    launchArgs: codex.launchArgs,
    prompt: options.taskPrompt,
    repoRoot,
    timeoutMs: codex.timeoutMs,
    redactionPatterns: policy.secretRedactionPatterns,
    spawnProcess
  });

  const gitAfter = getGitState(repoRoot);
  const scopeCheck = detectScopeViolations({
    beforeSnapshot: scopeBefore,
    afterChangedFiles: gitAfter.changedFiles,
    allowedPatterns: codex.allowedPaths,
    prohibitedPrefixes: codex.prohibitedPathPrefixes,
    repoRoot
  });

  if (scopeCheck.scopeViolation) {
    restoreScopedFiles(scopeBefore, repoRoot);
    return {
      allowed: true,
      launched: processResult.launched,
      reason: scopeCheck.violations.join("; "),
      failureKind: "scope_violation",
      commandAvailable: true,
      codexVersion: detection.codexVersion,
      sanitizedCommand: processResult.sanitizedCommand,
      startedAt: processResult.startedAt,
      finishedAt: processResult.finishedAt,
      durationMs: processResult.durationMs,
      processId: processResult.processId,
      exitCode: processResult.exitCode,
      signal: processResult.signal,
      timedOut: processResult.timedOut,
      stdout: processResult.stdout,
      stderr: processResult.stderr,
      allowedPaths: codex.allowedPaths,
      changedPaths: scopeCheck.changedPaths,
      scopeViolation: true,
      validationResult: null,
      decision: "BLOCKED"
    };
  }

  if (!processResult.launched || processResult.timedOut || processResult.exitCode !== 0) {
    return {
      allowed: true,
      launched: processResult.launched,
      reason: processResult.timedOut
        ? "Codex process timed out"
        : processResult.exitCode !== 0
          ? "Codex process failed"
          : "Codex process did not launch",
      failureKind: processResult.failureKind,
      commandAvailable: true,
      codexVersion: detection.codexVersion,
      sanitizedCommand: processResult.sanitizedCommand,
      startedAt: processResult.startedAt,
      finishedAt: processResult.finishedAt,
      durationMs: processResult.durationMs,
      processId: processResult.processId,
      exitCode: processResult.exitCode,
      signal: processResult.signal,
      timedOut: processResult.timedOut,
      stdout: processResult.stdout,
      stderr: processResult.stderr,
      allowedPaths: codex.allowedPaths,
      changedPaths: scopeCheck.changedPaths,
      scopeViolation: false,
      validationResult: null,
      decision: "BLOCKED"
    };
  }

  const validationResult = await runValidationCommand(
    codex.validationCommand,
    repoRoot,
    codex.timeoutMs,
    policy.secretRedactionPatterns
  );

  return {
    allowed: true,
    launched: true,
    reason: validationResult.passed
      ? "Codex launch and validation completed"
      : "Codex completed but validation failed",
    failureKind: validationResult.passed ? "none" : "validation_failure",
    commandAvailable: true,
    codexVersion: detection.codexVersion,
    sanitizedCommand: processResult.sanitizedCommand,
    startedAt: processResult.startedAt,
    finishedAt: processResult.finishedAt,
    durationMs: processResult.durationMs,
    processId: processResult.processId,
    exitCode: processResult.exitCode,
    signal: processResult.signal,
    timedOut: processResult.timedOut,
    stdout: processResult.stdout,
    stderr: processResult.stderr,
    allowedPaths: codex.allowedPaths,
    changedPaths: scopeCheck.changedPaths,
    scopeViolation: false,
    validationResult,
    decision: validationResult.passed ? "STOP" : "CONTINUE"
  };
}
