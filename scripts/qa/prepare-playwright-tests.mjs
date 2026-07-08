#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

function readPort(argv) {
  const flagIndex = argv.indexOf("--port");
  if (flagIndex >= 0 && argv[flagIndex + 1]) {
    return Number.parseInt(argv[flagIndex + 1], 10);
  }

  const legacyIndex = argv.indexOf("-TestPort");
  if (legacyIndex >= 0 && argv[legacyIndex + 1]) {
    return Number.parseInt(argv[legacyIndex + 1], 10);
  }

  return 3012;
}

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

async function main() {
  const port = readPort(process.argv.slice(2));
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));

  if (os.platform() === "win32") {
    const psScript = path.join(scriptDir, "prepare-playwright-tests.ps1");
    const result = spawnSync(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", psScript, "-TestPort", String(port)],
      { stdio: "inherit" }
    );

    process.exit(result.status ?? 1);
  }

  if (!(await isPortFree(port))) {
    console.error(`Test port ${port} is already in use.`);
    process.exit(1);
  }

  console.log(`Test port ${port} is free.`);
}

await main();
