#!/usr/bin/env node

import { chromium } from "@playwright/test";
import { DEMO_DB_NAME, DEMO_ENTRY_PATH } from "./contract.mjs";
import { fail, log, waitForHealth } from "./lib.mjs";

async function clearIndexedDb(page, dbName) {
  await page.evaluate(async (name) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    await new Promise((resolve) => {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  }, dbName);
}

async function waitForPersistence(page) {
  await page
    .getByText(/carregar base de dados|loading local database|a carregar definições/i)
    .waitFor({ state: "hidden", timeout: 45000 });
}

/**
 * Reset browser IndexedDB for the demo database and reload to trigger auto-seed.
 */
export async function resetBrowserDemoData({
  baseUrl,
  dbName = DEMO_DB_NAME,
  entryPath = DEMO_ENTRY_PATH
}) {
  await waitForHealth(baseUrl);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}${entryPath}`, { waitUntil: "domcontentloaded" });
    await clearIndexedDb(page, dbName);
    log(`Cleared IndexedDB database "${dbName}".`);

    await page.goto(`${baseUrl}${entryPath}`, { waitUntil: "domcontentloaded" });
    await waitForPersistence(page);
    log("Demo database reloaded; deterministic seed applied on first persistence init.");
  } finally {
    await browser.close();
  }
}

/**
 * Ensure demo seed data is present without deleting operational records created during a session.
 * Navigates to dashboard and waits for persistence when the DB already exists.
 */
export async function seedBrowserDemoData({
  baseUrl,
  entryPath = DEMO_ENTRY_PATH
}) {
  await waitForHealth(baseUrl);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}${entryPath}`, { waitUntil: "domcontentloaded" });
    await waitForPersistence(page);
    await page.goto(`${baseUrl}/pt-PT/leadops`, { waitUntil: "domcontentloaded" });
    await waitForPersistence(page);
    const leadCells = page.getByRole("cell");
    await leadCells.first().waitFor({ state: "visible", timeout: 45000 });
    log("Demo seed verified (LeadOps table loaded with seed context).");
  } finally {
    await browser.close();
  }
}

export async function runBrowserDbAction(action, options) {
  try {
    if (action === "reset") {
      await resetBrowserDemoData(options);
      return;
    }
    if (action === "seed") {
      await seedBrowserDemoData(options);
      return;
    }
    fail(`Unknown browser DB action: ${action}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(message);
  }
}
