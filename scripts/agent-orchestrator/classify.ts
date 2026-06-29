import type { FailureClassification } from "./types";

const MISSING_DEPENDENCY_PATTERNS = [
  /cannot find module/i,
  /module not found/i,
  /enoent.*node_modules/i,
  /npm err! code enoent/i
];

const MISSING_ENVIRONMENT_PATTERNS = [
  /environment variable/i,
  /missing required env/i,
  /env\.[A-Z0-9_]+.*undefined/i,
  /supabase_.*not set/i
];

export function classifyFailure(
  stdout: string,
  stderr: string,
  exitCode: number | null,
  orchestrationProblem = false
): FailureClassification {
  if (orchestrationProblem) {
    return "orchestration_problem";
  }

  if (exitCode === 0) {
    return "none";
  }

  const combined = `${stdout}\n${stderr}`;

  if (MISSING_DEPENDENCY_PATTERNS.some((pattern) => pattern.test(combined))) {
    return "missing_dependency";
  }

  if (MISSING_ENVIRONMENT_PATTERNS.some((pattern) => pattern.test(combined))) {
    return "missing_environment";
  }

  return "actionable_code_failure";
}

export function truncateOutput(output: string, maxLength = 8000): string {
  if (output.length <= maxLength) {
    return output;
  }

  return `${output.slice(0, maxLength)}\n...[truncated]`;
}
