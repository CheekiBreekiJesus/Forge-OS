import path from "node:path";
import { fileURLToPath } from "node:url";
import { runOrchestrator } from "./orchestrator";

const repoRoot = path.resolve(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".."));

async function main(): Promise<void> {
  const result = await runOrchestrator({
    repoRoot,
    mode: "maintain"
  });

  console.log(
    JSON.stringify(
      {
        overallStatus: result.report.overallStatus,
        stopDecision: result.report.stopDecision,
        exitCode: result.exitCode,
        healthReport: "qa/reports/latest-health.json"
      },
      null,
      2
    )
  );

  process.exitCode = result.exitCode;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Maintenance orchestrator failed");
  process.exitCode = 3;
});
