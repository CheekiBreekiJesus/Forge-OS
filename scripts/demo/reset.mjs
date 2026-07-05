#!/usr/bin/env node

import { DEMO_BASE_URL } from "./contract.mjs";
import { runBrowserDbAction } from "./browser-db.mjs";
import { assertNode22, log } from "./lib.mjs";

function readBaseUrl(argv) {
  const index = argv.indexOf("--url");
  if (index >= 0 && argv[index + 1]) {
    return argv[index + 1];
  }
  return DEMO_BASE_URL;
}

assertNode22();

const baseUrl = readBaseUrl(process.argv.slice(2));
log(`Resetting ForgeOS demo data at ${baseUrl} ...`);

await runBrowserDbAction("reset", { baseUrl });
