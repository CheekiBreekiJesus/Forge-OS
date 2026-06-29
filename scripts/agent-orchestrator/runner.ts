import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { sanitizeCommandOutput, sanitizeWorkingDirectory } from "./sanitize";

export type CommandRunResult = {
  command: string;
  args: string[];
  workingDirectory: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  errorMessage?: string;
};

export async function runCommand(
  command: string,
  args: string[],
  options: {
    cwd: string;
    repoRoot: string;
    timeoutMs: number;
    extraRedactionPatterns?: string[];
    shell?: boolean;
  }
): Promise<CommandRunResult> {
  const startedAt = new Date();
  const sanitizedCwd = sanitizeWorkingDirectory(options.cwd, options.repoRoot);

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      shell: options.shell ?? false,
      env: process.env,
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, options.timeoutMs);

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      const finishedAt = new Date();
      resolve({
        command,
        args,
        workingDirectory: sanitizedCwd,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        exitCode: null,
        stdout: sanitizeCommandOutput(stdout, options.repoRoot, options.extraRedactionPatterns),
        stderr: sanitizeCommandOutput(stderr, options.repoRoot, options.extraRedactionPatterns),
        errorMessage: error.message
      });
    });

    child.on("close", (exitCode) => {
      clearTimeout(timer);
      const finishedAt = new Date();
      resolve({
        command,
        args,
        workingDirectory: sanitizedCwd,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        exitCode: timedOut ? null : exitCode,
        stdout: sanitizeCommandOutput(stdout, options.repoRoot, options.extraRedactionPatterns),
        stderr: sanitizeCommandOutput(
          timedOut ? `${stderr}\nCommand timed out` : stderr,
          options.repoRoot,
          options.extraRedactionPatterns
        ),
        errorMessage: timedOut ? "Command timed out" : undefined
      });
    });
  });
}

export function detectPackageManager(repoRoot: string): "npm" | "unknown" {
  try {
    const lockFile = path.join(repoRoot, "package-lock.json");
    if (existsSync(lockFile)) {
      return "npm";
    }
  } catch {
    return "unknown";
  }

  return "unknown";
}

export async function runNpmScript(
  scriptName: string,
  repoRoot: string,
  timeoutMs: number,
  extraRedactionPatterns: string[] = []
): Promise<CommandRunResult> {
  if (process.platform === "win32") {
    return runCommand("cmd.exe", ["/d", "/s", "/c", `npm run ${scriptName}`], {
      cwd: repoRoot,
      repoRoot,
      timeoutMs,
      extraRedactionPatterns,
      shell: false
    });
  }

  return runCommand("npm", ["run", scriptName], {
    cwd: repoRoot,
    repoRoot,
    timeoutMs,
    extraRedactionPatterns,
    shell: false
  });
}

export async function runCliCommand(
  commandParts: string[],
  repoRoot: string,
  timeoutMs: number,
  extraRedactionPatterns: string[] = []
): Promise<CommandRunResult> {
  const [command, ...args] = commandParts;

  if (process.platform === "win32" && (command === "npx" || command === "npm")) {
    return runCommand("cmd.exe", ["/d", "/s", "/c", commandParts.join(" ")], {
      cwd: repoRoot,
      repoRoot,
      timeoutMs,
      extraRedactionPatterns,
      shell: false
    });
  }

  return runCommand(command, args, {
    cwd: repoRoot,
    repoRoot,
    timeoutMs,
    extraRedactionPatterns,
    shell: false
  });
}
