import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { classifyFailure } from "../classify";
import { evaluateCodexLaunch } from "../codex";
import { runConfiguredChecks } from "../checks";
import { diffApplicationChanges } from "../git";
import { isGitOperationAllowed, loadPolicy } from "../policy";
import { redactSensitiveText, detectPrivacyViolations } from "../sanitize";
import { runOrchestrator } from "../orchestrator";
import {
  cleanupFixture,
  createFixtureRepo,
  defaultPolicy,
  initGitRepo,
  writePackageJson,
  writePolicy
} from "./helpers";

describe("sanitize", () => {
  it("redacts absolute Windows paths", () => {
    const input = "C:\\Users\\J35U5\\AppData\\Local\\npm-cache\\_logs\\test.log";
    const output = redactSensitiveText(input);
    expect(output).not.toContain("J35U5");
    expect(output).toContain("[USER_HOME]");
  });

  it("redacts Unix home paths", () => {
    const input = "/home/dev/project";
    const output = redactSensitiveText(input);
    expect(output).toContain("[USER_HOME]");
    expect(output).not.toContain("/home/dev");
  });

  it("redacts secrets and connection strings", () => {
    const input =
      "OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz postgres://user:pass@host/db Bearer abc.def";
    const output = redactSensitiveText(input);
    expect(output).not.toContain("sk-abc");
    expect(output).not.toContain("postgres://");
    expect(output).toContain("[REDACTED_SECRET]");
  });
});

describe("classification", () => {
  it("classifies missing dependency failures", () => {
    expect(
      classifyFailure("", "Error: Cannot find module 'missing-lib'", 1)
    ).toBe("missing_dependency");
  });

  it("classifies missing environment failures", () => {
    expect(
      classifyFailure("", "Missing required environment variable SUPABASE_URL", 1)
    ).toBe("missing_environment");
  });

  it("classifies actionable code failures", () => {
    expect(classifyFailure("", "ESLint found 2 problems", 1)).toBe(
      "actionable_code_failure"
    );
  });
});

describe("policy guards", () => {
  it("blocks git operations in read-only mode", () => {
    const policy = defaultPolicy();
    expect(isGitOperationAllowed(policy, "commit")).toBe(false);
    expect(isGitOperationAllowed(policy, "push")).toBe(false);
    expect(isGitOperationAllowed(policy, "merge")).toBe(false);
    expect(isGitOperationAllowed(policy, "deploy")).toBe(false);
  });
});

describe("optional and required npm scripts", () => {
  it("reports missing optional npm script as not_configured without crashing", async () => {
    const repoRoot = createFixtureRepo("optional-script");
    const policy = defaultPolicy();
    writePolicy(repoRoot, policy);
    writePackageJson(repoRoot, { test: "node -e \"process.exit(0)\"" });
    initGitRepo(repoRoot);

    const checks = await runConfiguredChecks(repoRoot, policy, "health");
    const optional = checks.find((check) => check.id === "optional-script");

    expect(optional?.status).toBe("not_configured");
    cleanupFixture(repoRoot);
  });

  it("reports missing required npm script as orchestration problem", async () => {
    const repoRoot = createFixtureRepo("required-script");
    const policy = defaultPolicy();
    policy.checks.push({
      id: "required-build",
      label: "Required build",
      required: true,
      type: "npm-script",
      npmScript: "build"
    });
    writePolicy(repoRoot, policy);
    writePackageJson(repoRoot, {});
    initGitRepo(repoRoot);

    const checks = await runConfiguredChecks(repoRoot, policy, "health");
    const packageCheck = checks.find((check) => check.id === "package-validation");
    const buildCheck = checks.find((check) => check.id === "required-build");

    expect(packageCheck?.classification).toBe("orchestration_problem");
    expect(buildCheck?.status).toBe("fail");
    cleanupFixture(repoRoot);
  });
});

describe("orchestrator integration", () => {
  it("returns STOP for a healthy fixture repository", async () => {
    const repoRoot = createFixtureRepo("healthy");
    const policy = defaultPolicy();
    writePolicy(repoRoot, policy);
    writePackageJson(repoRoot, { test: "node -e \"process.exit(0)\"" });
    initGitRepo(repoRoot);

    const result = await runOrchestrator({
      repoRoot,
      mode: "health",
      policyPath: path.join(repoRoot, "agent", "maintenance-policy.json")
    });

    expect(result.report.overallStatus).toBe("healthy");
    expect(result.report.stopDecision).toBe("STOP");
    expect(result.exitCode).toBe(0);
    expect(existsSync(path.join(repoRoot, "qa/reports/latest-health.json"))).toBe(true);
    cleanupFixture(repoRoot);
  });

  it("does not create a Codex task for a healthy repository", async () => {
    const repoRoot = createFixtureRepo("healthy-no-task");
    const policy = defaultPolicy();
    writePolicy(repoRoot, policy);
    writePackageJson(repoRoot, {});
    initGitRepo(repoRoot);

    await runOrchestrator({
      repoRoot,
      mode: "health",
      policyPath: path.join(repoRoot, "agent", "maintenance-policy.json")
    });

    expect(existsSync(path.join(repoRoot, "qa/reports/next-codex-task.md"))).toBe(false);
    cleanupFixture(repoRoot);
  });

  it("does not launch Codex", async () => {
    const repoRoot = createFixtureRepo("no-codex");
    const policy = defaultPolicy();
    writePolicy(repoRoot, policy);
    writePackageJson(repoRoot, {});
    initGitRepo(repoRoot);

    const result = await runOrchestrator({
      repoRoot,
      mode: "health",
      policyPath: path.join(repoRoot, "agent", "maintenance-policy.json")
    });

    expect(result.report.codexLaunch.allowed).toBe(false);
    expect(result.report.codexLaunch.launched).toBe(false);
    cleanupFixture(repoRoot);
  });

  it("returns CONTINUE for actionable deterministic failures", async () => {
    const repoRoot = createFixtureRepo("failing");
    const policy = defaultPolicy();
    policy.checks = policy.checks.filter((check) => check.id !== "lint");
    policy.checks.push({
      id: "lint",
      label: "Lint",
      required: true,
      type: "npm-script",
      npmScript: "lint"
    });
    writePolicy(repoRoot, policy);
    writeFileSync(
      path.join(repoRoot, "fail-lint.cjs"),
      "console.error('ESLint found 1 problem'); process.exit(1);\n",
      "utf8"
    );
    writePackageJson(repoRoot, { lint: "node fail-lint.cjs" });
    initGitRepo(repoRoot);

    const result = await runOrchestrator({
      repoRoot,
      mode: "health",
      policyPath: path.join(repoRoot, "agent", "maintenance-policy.json")
    });

    expect(result.report.overallStatus).toBe("unhealthy");
    expect(result.report.stopDecision).toBe("CONTINUE");
    expect(result.exitCode).toBe(1);
    cleanupFixture(repoRoot);
  });

  it("returns BLOCKED for orchestrator report write failures", async () => {
    const repoRoot = createFixtureRepo("report-failure");
    const policy = defaultPolicy();
    policy.reportPaths.healthReport = "qa/reports/readonly/latest-health.json";
    writePolicy(repoRoot, policy);
    writePackageJson(repoRoot, {});
    initGitRepo(repoRoot);

    writeFileSync(path.join(repoRoot, "qa", "reports", "readonly"), "", "utf8");

    const result = await runOrchestrator({
      repoRoot,
      mode: "health",
      policyPath: path.join(repoRoot, "agent", "maintenance-policy.json")
    });

    expect(result.exitCode).toBe(3);
    expect(result.report.overallStatus).toBe("orchestrator_error");
    cleanupFixture(repoRoot);
  });

  it("marks an existing Codex task file as stale when not regenerated", async () => {
    const repoRoot = createFixtureRepo("stale-task");
    const policy = defaultPolicy();
    writePolicy(repoRoot, policy);
    writePackageJson(repoRoot, {});
    initGitRepo(repoRoot);
    writeFileSync(
      path.join(repoRoot, "qa/reports/next-codex-task.md"),
      "# stale task\n",
      "utf8"
    );

    const result = await runOrchestrator({
      repoRoot,
      mode: "health",
      policyPath: path.join(repoRoot, "agent", "maintenance-policy.json")
    });

    expect(result.report.codexTask.exists).toBe(true);
    expect(result.report.codexTask.stale).toBe(true);
    expect(result.report.codexTask.current).toBe(false);
    cleanupFixture(repoRoot);
  });
});

describe("codex launch decision", () => {
  it("does not allow Codex in read-only mode even with actionable failures", () => {
    const policy = defaultPolicy();
    policy.allowCodexLaunch = true;
    policy.readOnly = true;

    const decision = evaluateCodexLaunch(policy, [
      {
        id: "lint",
        label: "Lint",
        required: true,
        command: "npm run lint",
        workingDirectory: ".",
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 1,
        exitCode: 1,
        status: "fail",
        classification: "actionable_code_failure",
        stdout: "",
        stderr: "failed"
      }
    ]);

    expect(decision.allowed).toBe(false);
    expect(decision.launched).toBe(false);
  });
});

describe("git protections", () => {
  it("does not classify ignored report files as application changes", () => {
    const changed = diffApplicationChanges(
      [],
      ["qa/reports/latest-health.json", "src/demo/workflow.ts"],
      ["qa/reports/latest-health.json", "qa/reports/next-codex-task.md"]
    );

    expect(changed).toEqual(["src/demo/workflow.ts"]);
  });
});

describe("privacy scan", () => {
  it("detects unsanitized Windows profile paths in report content", () => {
    const violations = detectPrivacyViolations(
      "C:\\Users\\secret-user\\AppData\\Local\\npm-cache\\log"
    );
    expect(violations.length).toBeGreaterThan(0);
  });
});

describe("real policy file", () => {
  it("loads the repository maintenance policy with safe defaults", () => {
    const repoRoot = path.resolve(
      path.join(fileURLToPath(new URL(".", import.meta.url)), "..", "..", "..")
    );
    const policy = loadPolicy(repoRoot);
    expect(policy.readOnly).toBe(true);
    expect(policy.allowCodexLaunch).toBe(false);
    expect(policy.allowCommit).toBe(false);
  });
});

describe("generated health report privacy", () => {
  it("does not leak absolute Windows paths in generated reports", async () => {
    const repoRoot = createFixtureRepo("privacy-report");
    const policy = defaultPolicy();
    writePolicy(repoRoot, policy);
    writeFileSync(
      path.join(repoRoot, "leak-path.cjs"),
      "console.error('C:\\\\Users\\\\secret-user\\\\AppData\\\\Local\\\\npm-cache\\\\log'); process.exit(0);\n",
      "utf8"
    );
    writePackageJson(repoRoot, { lint: "node leak-path.cjs" });
    initGitRepo(repoRoot);

    const result = await runOrchestrator({
      repoRoot,
      mode: "health",
      policyPath: path.join(repoRoot, "agent", "maintenance-policy.json")
    });

    const report = readFileSync(path.join(repoRoot, "qa/reports/latest-health.json"), "utf8");
    expect(report).not.toContain("secret-user");
    expect(result.report.privacyScan.passed).toBe(true);
    cleanupFixture(repoRoot);
  });
});
