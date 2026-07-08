import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.argv[2];
const keysFile = process.argv[3];

if (!repoRoot || !keysFile) {
  console.error("Usage: node configure-release-env.mjs <repoRoot> <keysFile>");
  process.exit(1);
}

const envLocalPath = path.join(repoRoot, ".env.local");
const keysText = fs.readFileSync(keysFile, "utf8");
const keys = parseKeys(keysText);

function parseKeys(text) {
  const parsed = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=:\s]+)\s*[=:]\s*(.+)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (value) parsed[key] = value;
  }
  return parsed;
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const entries = new Map();
  const order = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      order.push({ type: "raw", value: line });
      continue;
    }
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1);
    entries.set(key, value);
    order.push({ type: "entry", key });
  }

  return { entries, order, lines };
}

function writeEnvFile(filePath, state) {
  const seen = new Set();
  const output = [];

  for (const item of state.order) {
    if (item.type === "raw") {
      output.push(item.value);
      continue;
    }
    if (seen.has(item.key)) continue;
    seen.add(item.key);
    output.push(`${item.key}=${state.entries.get(item.key) ?? ""}`);
  }

  for (const [key, value] of state.entries.entries()) {
    if (seen.has(key)) continue;
    output.push(`${key}=${value}`);
  }

  fs.writeFileSync(filePath, `${output.join("\n").replace(/\n*$/, "\n")}`, "utf8");
}

function upsert(state, key, value) {
  if (!state.entries.has(key)) {
    state.order.push({ type: "entry", key });
  }
  state.entries.set(key, value);
}

function isPlaceholder(value) {
  if (!value) return true;
  return /replace|your-|example\.com|xxx|<|placeholder/i.test(value);
}

function pickValue(...candidates) {
  for (const candidate of candidates) {
    if (candidate && !isPlaceholder(candidate)) return candidate;
  }
  return "";
}

const backupName = `.env.local.backup.${new Date().toISOString().replace(/[:.]/g, "-")}`;
const backupPath = path.join(repoRoot, backupName);
if (fs.existsSync(envLocalPath)) {
  fs.copyFileSync(envLocalPath, backupPath);
}

const state = readEnvFile(envLocalPath);
const publicBaseUrl =
  state.entries.get("FORGEOS_PUBLIC_BASE_URL") ||
  state.entries.get("NEXT_PUBLIC_APP_URL") ||
  "http://localhost:3000";

const sentryDsn = pickValue(keys.SENTRY_DSN, keys.NEXT_PUBLIC_SENTRY_DSN);
const brevoReplyTo = pickValue(keys.BREVO_REPLY_TO, keys.BREVO_REPLY_TO_EMAIL);
const testRecipient = pickValue(
  keys.OUTREACH_TEST_RECIPIENT_ALLOWLIST,
  keys.BREVO_SENDER_EMAIL,
  brevoReplyTo
);

const updates = {
  SENTRY_DSN: sentryDsn,
  SENTRY_ORG: pickValue(keys.SENTRY_ORG),
  SENTRY_PROJECT: pickValue(keys.SENTRY_PROJECT),
  SENTRY_AUTH_TOKEN: pickValue(keys.SENTRY_AUTH_TOKEN),
  EMAIL_DELIVERY_PROVIDER: "brevo",
  OUTREACH_DELIVERY_PROVIDER: "brevo",
  OUTREACH_REAL_SEND_ENABLED: "false",
  OUTREACH_TEST_SEND_ENABLED: "true",
  OUTREACH_TEST_RECIPIENT_ALLOWLIST: testRecipient,
  BREVO_API_KEY: pickValue(keys.BREVO_API_KEY),
  BREVO_SENDER_EMAIL: pickValue(keys.BREVO_SENDER_EMAIL),
  BREVO_SENDER_NAME: pickValue(keys.BREVO_SENDER_NAME),
  BREVO_REPLY_TO: brevoReplyTo,
  FORGEOS_PUBLIC_BASE_URL: publicBaseUrl,
  NEXT_PUBLIC_APP_URL: publicBaseUrl,
  NEXT_PUBLIC_SUPABASE_URL: pickValue(keys.SUPABASE_PROJECT_URL, keys.SUPABASE_URL),
  SUPABASE_URL: pickValue(keys.SUPABASE_PROJECT_URL, keys.SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: pickValue(keys.SUPABASE_ANON_KEY, keys.SUPABASE_PUBLISHABLE_KEY),
  SUPABASE_SERVICE_ROLE_KEY: pickValue(keys.SUPABASE_SECRET_KEY, keys.SUPABASE_SERVICE_ROLE_KEY),
  FORGEOS_TEST_DATABASE_URL: pickValue(keys.SUPABASE_DATABASE_URL),
  OPENAI_API_KEY: pickValue(keys.OPENAI_API_KEY),
  ABACUS_API_KEY: pickValue(keys.ABACUS_API_KEY),
  OUTREACH_UNSUBSCRIBE_SECRET:
    state.entries.get("OUTREACH_UNSUBSCRIBE_SECRET") || randomSecret(32),
  BREVO_WEBHOOK_SECRET: state.entries.get("BREVO_WEBHOOK_SECRET") || randomSecret(24)
};

function randomSecret(bytes) {
  return crypto.randomBytes(bytes).toString("base64url");
}

for (const [key, value] of Object.entries(updates)) {
  if (value) {
    upsert(state, key, value);
    continue;
  }
  if (state.entries.has(key)) {
    state.entries.delete(key);
  }
}

writeEnvFile(envLocalPath, state);

const report = {
  backupCreated: fs.existsSync(backupPath),
  keysUpdated: Object.keys(updates).filter((key) => Boolean(updates[key])),
  outreachRealSendEnabled: updates.OUTREACH_REAL_SEND_ENABLED === "true",
  outreachTestSendEnabled: updates.OUTREACH_TEST_SEND_ENABLED === "true",
  allowlistConfigured: Boolean(updates.OUTREACH_TEST_RECIPIENT_ALLOWLIST),
  sentryDsnConfigured: Boolean(updates.SENTRY_DSN),
  brevoProviderConfigured: updates.EMAIL_DELIVERY_PROVIDER === "brevo",
  supabaseUrlConfigured: Boolean(updates.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonConfigured: Boolean(updates.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  supabaseServiceRoleConfigured: Boolean(updates.SUPABASE_SERVICE_ROLE_KEY),
  openAiConfigured: Boolean(updates.OPENAI_API_KEY),
  abacusConfigured: Boolean(updates.ABACUS_API_KEY)
};

console.log(JSON.stringify(report, null, 2));
