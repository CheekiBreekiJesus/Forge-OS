#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import net from "node:net";
import {
  DEMO_DB_NAME,
  DEMO_SMOKE_PORT,
  DEMO_VERSION
} from "./contract.mjs";
import { assertNode22, fail, getRepoRoot, log } from "./lib.mjs";

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

assertNode22();

const repoRoot = getRepoRoot();

if (!(await isPortFree(DEMO_SMOKE_PORT))) {
  fail(
    `Demo smoke port ${DEMO_SMOKE_PORT} is already in use. ` +
      "Stop the conflicting process before running demo:smoke."
  );
}

log(`Running ForgeOS ${DEMO_VERSION} demo smoke (db: ${DEMO_DB_NAME}, port: ${DEMO_SMOKE_PORT})`);

const env = {
  ...process.env,
  FORGEOS_LOCAL_DB_NAME: DEMO_DB_NAME,
  NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME: DEMO_DB_NAME
};

const result = spawnSync(
  "npx",
  ["playwright", "test", "--config", "playwright.demo.config.ts"],
  {
    cwd: repoRoot,
    stdio: "inherit",
    env,
    shell: process.platform === "win32"
  }
);

process.exit(result.status ?? 1);
