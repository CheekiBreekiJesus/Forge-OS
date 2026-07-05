#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import {
  DEMO_BASE_URL,
  DEMO_DB_NAME,
  DEMO_ENV_TEMPLATE,
  DEMO_VERSION
} from "./contract.mjs";
import {
  assertNode22,
  assertNpmVersion,
  ensureDemoDirectories,
  getRepoRoot,
  isPortFree,
  log,
  runNpmCi
} from "./lib.mjs";

const repoRoot = getRepoRoot();

assertNode22();
assertNpmVersion();
ensureDemoDirectories(repoRoot);

const templatePath = path.join(repoRoot, DEMO_ENV_TEMPLATE);
if (!fs.existsSync(templatePath)) {
  console.error(`Error: missing ${DEMO_ENV_TEMPLATE}`);
  process.exit(1);
}

log(`ForgeOS ${DEMO_VERSION} demo prepare`);
log(`Repository: ${repoRoot}`);
log(`IndexedDB: ${DEMO_DB_NAME}`);
log(`Base URL: ${DEMO_BASE_URL}`);
log("");
log("Note: demo scripts inject environment variables at runtime.");
log("They do not modify .env.local automatically.");
log(`Optional reference: copy ${DEMO_ENV_TEMPLATE} to .env.local only when you intend to override defaults.`);
log("");

if (!(await isPortFree(3000))) {
  console.warn("Warning: port 3000 is currently in use. demo:start will fail until it is free.");
}

runNpmCi(repoRoot);

log("");
log("Prepare complete. Next steps:");
log("  npm run demo:seed   # optional fresh browser seed (requires demo:start)");
log("  npm run demo:start  # start local demo server");
log("  npm run demo:smoke  # run navigation smoke tests");
