#!/usr/bin/env node

import {
  buildDemoProcessEnv,
  DEMO_BASE_URL,
  DEMO_DB_NAME,
  DEMO_PORT,
  DEMO_VERSION
} from "./contract.mjs";
import {
  assertDemoPortAvailable,
  assertNode22,
  assertNpmVersion,
  ensureDemoDirectories,
  getRepoRoot,
  log,
  removeRuntimeMetadata,
  spawnDemoDev,
  tryResolveGitCommit,
  writeRuntimeMetadata
} from "./lib.mjs";

const repoRoot = getRepoRoot();

assertNode22();
assertNpmVersion();
ensureDemoDirectories(repoRoot);
await assertDemoPortAvailable(repoRoot, DEMO_PORT);

const env = buildDemoProcessEnv();
const commit = tryResolveGitCommit(repoRoot);
if (commit) {
  env.FORGEOS_GIT_COMMIT = commit;
}

log(`Starting ForgeOS ${DEMO_VERSION} local demo on ${DEMO_BASE_URL}`);
log(`Persistence: local IndexedDB (${DEMO_DB_NAME})`);
log(`AI: deterministic | Email: simulation`);
log("Press Ctrl+C to stop.");
log("");

const child = spawnDemoDev(repoRoot, env, DEMO_PORT);

writeRuntimeMetadata(repoRoot, {
  version: 1,
  mode: "demo",
  pid: child.pid,
  port: DEMO_PORT,
  url: DEMO_BASE_URL,
  dbName: DEMO_DB_NAME,
  startedAt: new Date().toISOString()
});

function shutdown() {
  removeRuntimeMetadata(repoRoot);
  if (!child.killed) {
    child.kill("SIGINT");
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

child.on("exit", (code) => {
  removeRuntimeMetadata(repoRoot);
  process.exit(code ?? 0);
});
