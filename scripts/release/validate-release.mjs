#!/usr/bin/env node

/**
 * ForgeOS local-demo release gate (reuses existing test scripts).
 * Does not duplicate lint/typecheck/e2e/acceptance — run validate:full first.
 */

import { spawnSync } from "node:child_process";
import { getRepoRoot, log, fail } from "../demo/lib.mjs";

const repoRoot = getRepoRoot();

function run(command, args, label) {
  log(`[validate:release] ${label}`);
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env
  });
  if ((result.status ?? 1) !== 0) {
    fail(`${label} failed (exit ${result.status ?? 1})`);
  }
}

log("ForgeOS release gate — demo lifecycle and walkthrough");

run("npm", ["test", "--", "src/demo/local-demo-lifecycle.test.ts"], "Demo lifecycle unit tests");
run("npm", ["run", "test:demo-walkthrough"], "Integrated demo walkthrough (Playwright)");
run("npx", ["playwright", "test", "--config", "playwright.demo.config.ts"], "Demo smoke harness");

log("Release demo validation passed.");
