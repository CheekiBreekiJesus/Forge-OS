import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCanaryTaskPrompt, launchCodex } from "./codex-launcher";
import { loadPolicy } from "./policy";
import { sanitizeReportObject } from "./privacy";
import { runCliCommand } from "./runner";

const repoRoot = path.resolve(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".."));
const canaryPolicyPath = path.join(repoRoot, "agent", "canary-policy.json");

async function runCanaryPreflight(
  validationCommand: string[],
  timeoutMs: number,
  redactionPatterns: string[]
): Promise<{ passed: boolean; stdout: string; stderr: string; exitCode: number | null }> {
  const result = await runCliCommand(validationCommand, repoRoot, timeoutMs, redactionPatterns);

  return {
    passed: result.exitCode === 0,
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode
  };
}

async function main(): Promise<void> {
  const policy = loadPolicy(repoRoot, canaryPolicyPath);

  if (!policy.codex) {
    console.error("Canary policy is missing codex configuration");
    process.exitCode = 2;
    return;
  }

  const preflight = await runCanaryPreflight(
    policy.codex.validationCommand,
    policy.codex.timeoutMs,
    policy.secretRedactionPatterns
  );

  const taskPrompt = buildCanaryTaskPrompt({
    allowedPaths: policy.codex.allowedPaths,
    prohibitedPathPrefixes: policy.codex.prohibitedPathPrefixes,
    validationCommand: policy.codex.validationCommand,
    objective: preflight.passed
      ? "The canary fixture currently passes validation. Do not make changes."
      : "A focused test in qa/fixtures/agent-canary is failing. Correct calculateTotal so the colocated test passes."
  });

  const launcherResult = await launchCodex({
    repoRoot,
    policy,
    taskPrompt,
    invokeLaunch: true
  });

  const reportPath = policy.reportPaths.canaryResult ?? "qa/reports/codex-canary-result.json";
  const absoluteReportPath = path.join(repoRoot, reportPath);
  mkdirSync(path.dirname(absoluteReportPath), { recursive: true });
  writeFileSync(
    absoluteReportPath,
    `${JSON.stringify(sanitizeReportObject(launcherResult, policy.secretRedactionPatterns), null, 2)}\n`,
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        decision: launcherResult.decision,
        launched: launcherResult.launched,
        failureKind: launcherResult.failureKind,
        reason: launcherResult.reason,
        report: reportPath.replace(/\\/g, "/")
      },
      null,
      2
    )
  );

  if (launcherResult.decision === "STOP") {
    process.exitCode = 0;
    return;
  }

  if (launcherResult.failureKind === "executable_missing") {
    process.exitCode = 2;
    return;
  }

  process.exitCode = launcherResult.decision === "BLOCKED" ? 2 : 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Canary orchestrator failed");
  process.exitCode = 3;
});
