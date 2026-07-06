import type {
  EmailDeliveryProviderKey,
  EmailProviderDiagnostic
} from "@/domain/email-delivery-types";
import { assertServerOnlyModule } from "./server-only";

assertServerOnlyModule();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EmailDeliveryConfig = {
  provider: EmailDeliveryProviderKey;
  realSendEnabled: boolean;
  testSendEnabled: boolean;
  publicBaseUrl: string;
  unsubscribeSigningSecret: string;
  webhookSecret: string;
  brevoApiKey: string;
  brevoSenderEmail: string;
  brevoSenderName: string;
  brevoReplyTo: string;
  testRecipientAllowlist: string[];
  timeoutMs: number;
};

function readBoolean(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

function readProvider(value: string | undefined): EmailDeliveryProviderKey {
  return value?.trim().toLowerCase() === "brevo" ? "brevo" : "simulation";
}

function readProviderLabel(value: string | undefined): string {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return "simulation";
  if (normalized === "brevo") return "brevo";
  if (normalized === "gmail") return "gmail";
  if (normalized === "outlook") return "outlook";
  return normalized;
}

export function redactApiKey(apiKey: string): string | null {
  const trimmed = apiKey.trim();
  if (!trimmed) return null;
  if (trimmed.length <= 8) return "[configured]";
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}

function readAllowlist(value: string | undefined): string[] {
  return Array.from(
    new Set(
      (value ?? "")
        .split(/[\s,;]+/g)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function readTimeoutMs(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1000) return 15000;
  return Math.min(Math.trunc(parsed), 60000);
}

export function readEmailDeliveryConfig(
  env: Record<string, string | undefined> = process.env
): EmailDeliveryConfig {
  return {
    provider: readProvider(env.EMAIL_DELIVERY_PROVIDER ?? env.OUTREACH_DELIVERY_PROVIDER),
    realSendEnabled: readBoolean(env.OUTREACH_REAL_SEND_ENABLED),
    testSendEnabled: readBoolean(env.OUTREACH_TEST_SEND_ENABLED),
    publicBaseUrl: env.FORGEOS_PUBLIC_BASE_URL?.trim() ?? "",
    unsubscribeSigningSecret: env.OUTREACH_UNSUBSCRIBE_SECRET?.trim() ?? "",
    webhookSecret: env.BREVO_WEBHOOK_SECRET?.trim() ?? "",
    brevoApiKey: env.BREVO_API_KEY?.trim() ?? "",
    brevoSenderEmail: env.BREVO_SENDER_EMAIL?.trim() ?? "",
    brevoSenderName: env.BREVO_SENDER_NAME?.trim() ?? "",
    brevoReplyTo: env.BREVO_REPLY_TO?.trim() ?? "",
    testRecipientAllowlist: readAllowlist(env.OUTREACH_TEST_RECIPIENT_ALLOWLIST),
    timeoutMs: readTimeoutMs(env.OUTREACH_PROVIDER_TIMEOUT_MS)
  };
}

export function buildEmailProviderDiagnostic(
  config: EmailDeliveryConfig,
  env: Record<string, string | undefined> = process.env
): EmailProviderDiagnostic {
  const missing: string[] = [];
  const warnings: string[] = [];
  const emailDeliveryProvider = readProviderLabel(env.EMAIL_DELIVERY_PROVIDER);
  const outreachDeliveryProvider = readProviderLabel(
    env.OUTREACH_DELIVERY_PROVIDER ?? env.EMAIL_DELIVERY_PROVIDER
  );
  const gmailConfigured = readBoolean(env.GMAIL_SEND_ENABLED);
  const outlookConfigured = readBoolean(env.OUTLOOK_GRAPH_ENABLED);

  if (config.provider === "brevo") {
    if (!config.brevoApiKey) missing.push("BREVO_API_KEY");
    if (!EMAIL_RE.test(config.brevoSenderEmail)) missing.push("BREVO_SENDER_EMAIL");
    if (!config.brevoSenderName) missing.push("BREVO_SENDER_NAME");
    if (config.brevoReplyTo && !EMAIL_RE.test(config.brevoReplyTo)) {
      missing.push("BREVO_REPLY_TO");
    }
    if (!config.realSendEnabled) warnings.push("OUTREACH_REAL_SEND_ENABLED is false.");
    if (!config.testSendEnabled) warnings.push("OUTREACH_TEST_SEND_ENABLED is false.");
    if (!isValidPublicBaseUrl(config.publicBaseUrl)) missing.push("FORGEOS_PUBLIC_BASE_URL");
    if (config.unsubscribeSigningSecret.length < 32) missing.push("OUTREACH_UNSUBSCRIBE_SECRET");
    if (config.webhookSecret.length < 24) missing.push("BREVO_WEBHOOK_SECRET");
    if (config.testRecipientAllowlist.length === 0) {
      warnings.push("OUTREACH_TEST_RECIPIENT_ALLOWLIST is empty.");
    }
  }

  if (emailDeliveryProvider === "gmail" && !gmailConfigured) {
    warnings.push("Gmail provider is not configured yet.");
  }
  if (emailDeliveryProvider === "outlook" && !outlookConfigured) {
    warnings.push("Outlook provider is not configured yet.");
  }

  const demoStartForcedSimulation = env.FORGEOS_DEMO_START?.trim().toLowerCase() === "true";
  const runtimeStartupMode = demoStartForcedSimulation
    ? "demo:start-simulation"
    : config.provider === "brevo"
      ? "dev-env-brevo"
      : "dev-env-local";
  if (demoStartForcedSimulation) {
    warnings.push(
      "npm run demo:start always forces simulation mode. To test Brevo, start with .\\node_modules\\.bin\\next.cmd dev --port 3000."
    );
  }

  return {
    provider: config.provider,
    emailDeliveryProvider,
    outreachDeliveryProvider,
    configured: config.provider === "simulation" || missing.length === 0,
    realSendEnabled: config.realSendEnabled,
    testSendEnabled: config.testSendEnabled,
    sandboxMode: config.provider !== "brevo" || !config.realSendEnabled,
    apiKeyPresent: Boolean(config.brevoApiKey),
    brevoApiKeyRedacted: redactApiKey(config.brevoApiKey),
    senderEmail: EMAIL_RE.test(config.brevoSenderEmail) ? config.brevoSenderEmail : null,
    senderName: config.brevoSenderName || null,
    senderEmailConfigured: EMAIL_RE.test(config.brevoSenderEmail),
    senderNameConfigured: Boolean(config.brevoSenderName),
    replyToConfigured: !config.brevoReplyTo || EMAIL_RE.test(config.brevoReplyTo),
    allowlistConfigured: config.testRecipientAllowlist.length > 0,
    allowlistCount: config.testRecipientAllowlist.length,
    configuredTestRecipientEmail: config.testRecipientAllowlist[0] ?? null,
    publicBaseUrlConfigured: isValidPublicBaseUrl(config.publicBaseUrl),
    unsubscribeSecretConfigured: config.unsubscribeSigningSecret.length >= 32,
    webhookSecretConfigured: config.webhookSecret.length >= 24,
    gmailConfigured,
    outlookConfigured,
    runtimeStartupMode,
    demoStartForcedSimulation,
    missing,
    warnings
  };
}

export function isAllowlistedTestRecipient(config: EmailDeliveryConfig, email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return config.testRecipientAllowlist.includes(normalized);
}

export function isValidPublicBaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}
