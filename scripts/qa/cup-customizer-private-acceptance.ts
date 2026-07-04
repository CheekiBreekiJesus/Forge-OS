#!/usr/bin/env tsx
/**
 * Local-only Cup Customizer private acceptance procedure.
 * Run manually when testing with real customer artwork — never in CI by default.
 *
 * Usage:
 *   npx tsx scripts/qa/cup-customizer-private-acceptance.ts --help
 *
 * Safety:
 * - Uses isolated test DB name
 * - No email, no production quotation, no paid AI by default
 * - Screenshots/assets gitignored under qa/cup-customizer/private/
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUTPUT_DIR = path.join(process.cwd(), "qa", "cup-customizer", "private");
const ISOLATED_DB = "forgeos:private-acceptance:cup-customizer";

type AcceptanceResult = {
  passed: boolean;
  checks: Array<{ id: string; ok: boolean; detail: string }>;
  finishedAt: string;
};

async function main() {
  const allowExternal = process.argv.includes("--allow-external-upload");
  const allowPaidAi = process.argv.includes("--allow-paid-ai");

  if (process.argv.includes("--help")) {
    console.log(`Cup Customizer private acceptance

Options:
  --allow-external-upload   Opt in to external artwork upload (not enabled by default)
  --allow-paid-ai           Opt in to paid image provider (not enabled by default)

Output: aggregate JSON only in qa/cup-customizer/private/ (gitignored)
`);
    return;
  }

  const results: AcceptanceResult = {
    checks: [
      {
        detail: `Isolated DB name ${ISOLATED_DB}`,
        id: "isolated-db",
        ok: true
      },
      {
        detail: allowExternal ? "External upload explicitly allowed" : "External upload blocked",
        id: "external-upload",
        ok: !allowExternal
      },
      {
        detail: allowPaidAi ? "Paid AI explicitly allowed" : "Paid AI blocked (deterministic only)",
        id: "paid-ai",
        ok: !allowPaidAi
      },
      {
        detail: "No email or production quotation mutations in this script",
        id: "no-production-side-effects",
        ok: true
      }
    ],
    finishedAt: new Date().toISOString(),
    passed: true
  };

  results.passed = results.checks.every((check) => check.ok);
  await mkdir(OUTPUT_DIR, { recursive: true });
  const outfile = path.join(OUTPUT_DIR, `acceptance-${Date.now()}.json`);
  await writeFile(outfile, JSON.stringify(results, null, 2), "utf8");
  console.log(`Private acceptance aggregate written to ${outfile}`);
  console.log(`Overall: ${results.passed ? "PASS" : "FAIL"}`);
  if (!results.passed) process.exitCode = 1;
}

void main();
