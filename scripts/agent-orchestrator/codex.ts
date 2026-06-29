import type { CheckResult, CodexLaunchDecision, MaintenancePolicy } from "./types";
import { getActionableFailures } from "./checks";

export function evaluateCodexLaunch(
  policy: MaintenancePolicy,
  checks: CheckResult[]
): CodexLaunchDecision {
  if (!policy.allowCodexLaunch) {
    return {
      allowed: false,
      launched: false,
      reason: "Policy allowCodexLaunch is false",
      taskGenerated: false
    };
  }

  if (policy.readOnly) {
    return {
      allowed: false,
      launched: false,
      reason: "Read-only mode is enabled",
      taskGenerated: false
    };
  }

  if (!policy.codex || policy.codex.allowedPaths.length === 0) {
    return {
      allowed: false,
      launched: false,
      reason: "Codex allowlist is not configured",
      taskGenerated: false
    };
  }

  const actionableFailures = getActionableFailures(checks);

  if (
    policy.codexLaunchConditions.requiresActionableCodeFailure &&
    actionableFailures.length === 0 &&
    policy.maintenanceMode !== "canary-validation"
  ) {
    return {
      allowed: false,
      launched: false,
      reason: "No actionable code failure detected",
      taskGenerated: false
    };
  }

  const excludedFailures = actionableFailures.filter((check) => {
    if (
      policy.codexLaunchConditions.excludesMissingDependencies &&
      check.classification === "missing_dependency"
    ) {
      return true;
    }

    if (
      policy.codexLaunchConditions.excludesMissingEnvironment &&
      check.classification === "missing_environment"
    ) {
      return true;
    }

    if (check.classification === "orchestration_problem") {
      return true;
    }

    return false;
  });

  if (excludedFailures.length > 0) {
    return {
      allowed: false,
      launched: false,
      reason: "Failure classified as environment, dependency, or orchestration issue",
      taskGenerated: false
    };
  }

  return {
    allowed: true,
    launched: false,
    reason: "Codex launch permitted by policy; awaiting explicit launcher invocation",
    taskGenerated: false
  };
}

export function buildCodexTaskMarkdown(check: CheckResult): string {
  return `# Codex Task: Fix ${check.label}

## Context

ForgeOS maintenance detected a deterministic check failure during \`${check.command}\`.

## Failure evidence

- Check ID: ${check.id}
- Exit code: ${check.exitCode}
- Classification: ${check.classification}

### stdout

\`\`\`
${check.stdout}
\`\`\`

### stderr

\`\`\`
${check.stderr}
\`\`\`

## Goal

Resolve the single highest-priority failure with the smallest safe fix.

## Restrictions

- One significant change only.
- Do not commit or push unless explicitly authorized.
- Do not modify authentication, RLS, migrations, billing, or infrastructure.
- Do not include secrets, customer data, or absolute local paths in reports.

## Validation

- Re-run the failing command.
- Run \`npm run agent:maintain\`.
`;
}

export { buildCanaryTaskPrompt, launchCodex } from "./codex-launcher";
