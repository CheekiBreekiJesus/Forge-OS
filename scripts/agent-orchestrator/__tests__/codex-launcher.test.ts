import { EventEmitter } from "node:events";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveCodexExecutable } from "../codex-detect";
import { launchCodex } from "../codex-launcher";
import {
  captureScopeSnapshot,
  detectScopeViolations,
  findAmbiguousScopeFiles,
  isPathAllowed,
  isPathTraversal,
  restoreScopedFiles
} from "../codex-scope";
import { evaluateCodexLaunch } from "../codex";
import { loadPolicy } from "../policy";
import { redactSensitiveText } from "../sanitize";
import { runOrchestrator } from "../orchestrator";
import { createFixtureRepo, defaultPolicy, initGitRepo, writePackageJson, writePolicy } from "./helpers";

function createCanaryFixture(repoRoot: string): void {
  const fixtureDir = path.join(repoRoot, "qa", "fixtures", "agent-canary");
  mkdirSync(fixtureDir, { recursive: true });
  writeFileSync(
    path.join(fixtureDir, "calculate-total.ts"),
    "export function calculateTotal(quantity: number, unitPrice: number): number {\n  return quantity - unitPrice;\n}\n",
    "utf8"
  );
  writeFileSync(
    path.join(fixtureDir, "calculate-total.test.ts"),
    "import { describe, expect, it } from 'vitest';\nimport { calculateTotal } from './calculate-total';\n\ndescribe('calculateTotal', () => {\n  it('multiplies quantity by unit price', () => {\n    expect(calculateTotal(4, 2.5)).toBe(10);\n  });\n});\n",
    "utf8"
  );
}

function mockSpawnSuccess(stdout = "ok", stderr = "") {
  return vi.fn(() => {
    const child = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
      pid: number;
      kill: () => void;
    };
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.pid = 4242;
    child.kill = vi.fn();
    process.nextTick(() => {
      if (stdout) {
        child.stdout.emit("data", stdout);
      }
      if (stderr) {
        child.stderr.emit("data", stderr);
      }
      child.emit("close", 0, null);
    });
    return child;
  });
}

describe("codex scope", () => {
  it("rejects path traversal", () => {
    expect(isPathTraversal("../src/demo/workflow.ts")).toBe(true);
    expect(isPathAllowed("qa/fixtures/agent-canary/calculate-total.ts", ["qa/fixtures/agent-canary/**"])).toBe(true);
  });

  it("detects ambiguous scope when allowed files are already dirty", () => {
    const ambiguous = findAmbiguousScopeFiles(
      ["qa/fixtures/agent-canary/calculate-total.ts", "src/demo/workflow.ts"],
      ["qa/fixtures/agent-canary/**"]
    );
    expect(ambiguous).toEqual(["qa/fixtures/agent-canary/calculate-total.ts"]);
  });

  it("detects out-of-scope changes after launch", () => {
    const repoRoot = mkdtempSync(path.join(os.tmpdir(), "forgeos-scope-"));
    const before = captureScopeSnapshot(repoRoot, [], ["qa/fixtures/agent-canary/**"]);
    const result = detectScopeViolations({
      beforeSnapshot: before,
      afterChangedFiles: ["src/demo/workflow.ts"],
      allowedPatterns: ["qa/fixtures/agent-canary/**"],
      prohibitedPrefixes: ["src/"],
      repoRoot
    });
    expect(result.scopeViolation).toBe(true);
    rmSync(repoRoot, { recursive: true, force: true });
  });

  it("restores scoped files after violation", () => {
    const repoRoot = mkdtempSync(path.join(os.tmpdir(), "forgeos-restore-"));
    const fixtureDir = path.join(repoRoot, "qa", "fixtures", "agent-canary");
    mkdirSync(fixtureDir, { recursive: true });
    const filePath = path.join(fixtureDir, "calculate-total.ts");
    writeFileSync(filePath, "original\n", "utf8");
    const snapshot = captureScopeSnapshot(repoRoot, [], ["qa/fixtures/agent-canary/**"]);
    writeFileSync(filePath, "changed\n", "utf8");
    restoreScopedFiles(snapshot, repoRoot);
    expect(readFileSync(filePath, "utf8")).toBe("original\n");
    rmSync(repoRoot, { recursive: true, force: true });
  });
});

describe("sanitization", () => {
  it("redacts Windows and Unix home paths", () => {
    const output = redactSensitiveText(
      "C:\\Users\\secret\\AppData\\Local\\npm-cache /home/dev Bearer abc Authorization: Bearer token"
    );
    expect(output).not.toContain("secret");
    expect(output).not.toContain("/home/dev");
    expect(output).toContain("[REDACTED_SECRET]");
  });
});

describe("codex launcher policy gates", () => {
  it("blocks launch under default read-only policy", async () => {
    const repoRoot = path.resolve(path.join(__dirname, "..", "..", ".."));
    const policy = loadPolicy(repoRoot);
    const result = await launchCodex({
      repoRoot,
      policy,
      taskPrompt: "test",
      invokeLaunch: true
    });

    expect(result.allowed).toBe(false);
    expect(result.launched).toBe(false);
    expect(result.failureKind).toBe("policy_blocked");
  });

  it("permits evaluation for explicit canary policy but blocks without fixture", async () => {
    const repoRoot = createFixtureRepo("canary-policy");
    writeFileSync(
      path.join(repoRoot, "agent", "canary-policy.json"),
      JSON.stringify({
        ...defaultPolicy(),
        maintenanceMode: "canary-validation",
        readOnly: false,
        allowCodexLaunch: true,
        maximumSignificantChangesPerRun: 1,
        codex: {
          executable: "codex",
          versionArgs: ["--version"],
          launchArgs: ["exec", "--full-auto"],
          allowedPaths: ["qa/fixtures/agent-canary/**"],
          prohibitedPathPrefixes: ["src/"],
          fixtureDirectory: "qa/fixtures/agent-canary",
          validationCommand: ["npx", "vitest", "run", "qa/fixtures/agent-canary"],
          timeoutMs: 1000
        }
      }),
      "utf8"
    );
    initGitRepo(repoRoot);

    const policy = loadPolicy(repoRoot, path.join(repoRoot, "agent", "canary-policy.json"));
    const result = await launchCodex({
      repoRoot,
      policy,
      taskPrompt: "fix",
      invokeLaunch: true
    });

    expect(result.allowed).toBe(false);
    expect(result.launched).toBe(false);
    expect(result.failureKind).toBe("executable_missing");
    rmSync(repoRoot, { recursive: true, force: true });
  });

  it("does not report launched without subprocess start", async () => {
    const repoRoot = createFixtureRepo("mock-launch");
    const policyPath = path.join(repoRoot, "agent", "canary-policy.json");
    writeFileSync(
      policyPath,
      JSON.stringify({
        ...defaultPolicy(),
        maintenanceMode: "canary-validation",
        readOnly: false,
        allowCodexLaunch: true,
        maximumSignificantChangesPerRun: 1,
        codex: {
          executable: "codex",
          versionArgs: ["--version"],
          launchArgs: ["exec"],
          allowedPaths: ["qa/fixtures/agent-canary/**"],
          prohibitedPathPrefixes: ["src/"],
          fixtureDirectory: "qa/fixtures/agent-canary",
          validationCommand: ["node", "-e", "process.exit(0)"],
          timeoutMs: 1000
        }
      }),
      "utf8"
    );
    createCanaryFixture(repoRoot);
    initGitRepo(repoRoot);
    const policy = loadPolicy(repoRoot, policyPath);

    const detectSpy = vi.spyOn(await import("../codex-detect"), "detectCodexExecutable").mockReturnValue({
      commandAvailable: true,
      executablePath: "codex",
      codexVersion: "1.0.0",
      failureKind: "none",
      reason: "mock",
      stdout: "1.0.0",
      stderr: ""
    });

    const spawnMock = mockSpawnSuccess("done");
    const result = await launchCodex({
      repoRoot,
      policy,
      taskPrompt: "fix canary",
      invokeLaunch: false,
      spawnProcess: spawnMock as never
    });

    expect(result.launched).toBe(false);
    expect(spawnMock).not.toHaveBeenCalled();
    detectSpy.mockRestore();
    rmSync(repoRoot, { recursive: true, force: true });
  });

  it("returns launched true only when subprocess starts and succeeds", async () => {
    const repoRoot = createFixtureRepo("mock-success");
    const policyPath = path.join(repoRoot, "agent", "canary-policy.json");
    writeFileSync(
      policyPath,
      JSON.stringify({
        ...defaultPolicy(),
        maintenanceMode: "canary-validation",
        readOnly: false,
        allowCodexLaunch: true,
        maximumSignificantChangesPerRun: 1,
        codex: {
          executable: "codex",
          versionArgs: ["--version"],
          launchArgs: ["exec"],
          allowedPaths: ["qa/fixtures/agent-canary/**"],
          prohibitedPathPrefixes: ["src/"],
          fixtureDirectory: "qa/fixtures/agent-canary",
          validationCommand: ["node", "-e", "process.exit(0)"],
          timeoutMs: 1000
        }
      }),
      "utf8"
    );
    createCanaryFixture(repoRoot);
    initGitRepo(repoRoot);
    const policy = loadPolicy(repoRoot, policyPath);

    vi.spyOn(await import("../codex-detect"), "detectCodexExecutable").mockReturnValue({
      commandAvailable: true,
      executablePath: "codex",
      codexVersion: "1.0.0",
      failureKind: "none",
      reason: "mock",
      stdout: "1.0.0",
      stderr: ""
    });

    const spawnMock = mockSpawnSuccess("done");
    const result = await launchCodex({
      repoRoot,
      policy,
      taskPrompt: "fix canary",
      invokeLaunch: true,
      spawnProcess: spawnMock as never
    });

    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(result.launched).toBe(true);
    expect(result.processId).toBe(4242);
    expect(result.stdout).toContain("done");
    rmSync(repoRoot, { recursive: true, force: true });
  });
});

describe("default maintenance command", () => {
  it("never launches Codex", async () => {
    const repoRoot = createFixtureRepo("maintain-default");
    const policy = defaultPolicy();
    writePolicy(repoRoot, policy);
    writePackageJson(repoRoot, { test: "node -e \"process.exit(0)\"" });
    initGitRepo(repoRoot);

    const result = await runOrchestrator({
      repoRoot,
      mode: "health",
      policyPath: path.join(repoRoot, "agent", "maintenance-policy.json"),
      invokeCodex: true
    });

    expect(result.report.codexLaunch.allowed).toBe(false);
    expect(result.report.codexLaunch.launched).toBe(false);
    rmSync(repoRoot, { recursive: true, force: true });
  });
});

describe("windows command resolution", () => {
  it("resolves codex executable path helper", () => {
    const resolved = resolveCodexExecutable("codex");
    expect(resolved.length).toBeGreaterThan(0);
  });
});

describe("evaluateCodexLaunch", () => {
  it("requires allowlist for canary-capable launch", () => {
    const policy = defaultPolicy();
    policy.allowCodexLaunch = true;
    policy.readOnly = false;
    const decision = evaluateCodexLaunch(policy, []);
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("allowlist");
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
