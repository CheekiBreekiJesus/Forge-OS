import { spawnSync } from "node:child_process";
import { sanitizeCommandOutput } from "./sanitize";
import type { CodexLaunchFailureKind } from "./types";

export type CodexDetectionResult = {
  commandAvailable: boolean;
  executablePath: string | null;
  codexVersion: string | null;
  failureKind: CodexLaunchFailureKind;
  reason: string;
  stdout: string;
  stderr: string;
};

export function resolveCodexExecutable(configuredExecutable: string): string {
  if (process.platform === "win32") {
    const where = spawnSync("where.exe", [configuredExecutable], {
      encoding: "utf8",
      shell: false,
      windowsHide: true
    });

    if (where.status === 0 && where.stdout.trim()) {
      return where.stdout.split(/\r?\n/)[0].trim();
    }

    return `${configuredExecutable}.cmd`;
  }

  return configuredExecutable;
}

function classifyDetectionFailure(stderr: string, stdout: string): CodexLaunchFailureKind {
  const combined = `${stdout}\n${stderr}`.toLowerCase();

  if (
    combined.includes("not authenticated") ||
    combined.includes("authentication") ||
    combined.includes("login required") ||
    combined.includes("sign in")
  ) {
    return "authentication_unavailable";
  }

  if (
    combined.includes("invalid model") ||
    combined.includes("invalid configuration") ||
    combined.includes("unknown option")
  ) {
    return "invalid_configuration";
  }

  if (
    combined.includes("enoent") ||
    combined.includes("not recognized") ||
    combined.includes("not found")
  ) {
    return "executable_missing";
  }

  return "process_launch_failure";
}

export function detectCodexExecutable(
  configuredExecutable: string,
  versionArgs: string[],
  repoRoot: string,
  redactionPatterns: string[] = []
): CodexDetectionResult {
  const executablePath = resolveCodexExecutable(configuredExecutable);
  const result = spawnSync(executablePath, versionArgs, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false,
    windowsHide: true
  });

  const stdout = sanitizeCommandOutput(result.stdout ?? "", repoRoot, redactionPatterns);
  const stderr = sanitizeCommandOutput(result.stderr ?? "", repoRoot, redactionPatterns);

  if (result.error) {
    return {
      commandAvailable: false,
      executablePath,
      codexVersion: null,
      failureKind: "executable_missing",
      reason: "Codex executable is not available",
      stdout,
      stderr: sanitizeCommandOutput(result.error.message, repoRoot, redactionPatterns)
    };
  }

  if (result.status !== 0) {
    return {
      commandAvailable: false,
      executablePath,
      codexVersion: null,
      failureKind: classifyDetectionFailure(stderr, stdout),
      reason: "Codex version check failed",
      stdout,
      stderr
    };
  }

  return {
    commandAvailable: true,
    executablePath,
    codexVersion: stdout.trim() || null,
    failureKind: "none",
    reason: "Codex executable detected",
    stdout,
    stderr
  };
}
