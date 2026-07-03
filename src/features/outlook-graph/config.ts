import { assertOutlookServerOnlyModule } from "./server-only";

assertOutlookServerOnlyModule();

export type OutlookGraphConfig = {
  graphEnabled: boolean;
  liveSendEnabled: boolean;
  clientId: string;
  authority: string;
  redirectUri: string;
  encryptionKey: string;
  testRecipients: string[];
  graphBaseUrl: string;
  timeoutMs: number;
};

function readBoolean(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
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

export function readOutlookGraphConfig(
  env: Record<string, string | undefined> = process.env
): OutlookGraphConfig {
  return {
    graphEnabled: readBoolean(env.OUTLOOK_GRAPH_ENABLED),
    liveSendEnabled: readBoolean(env.OUTLOOK_LIVE_SEND_ENABLED),
    clientId: env.MICROSOFT_CLIENT_ID?.trim() ?? "",
    authority: env.MICROSOFT_AUTHORITY?.trim() || "https://login.microsoftonline.com/common",
    redirectUri:
      env.MICROSOFT_REDIRECT_URI?.trim() ||
      "http://localhost:3000/api/integrations/outlook/callback",
    encryptionKey: env.FORGEOS_LOCAL_ENCRYPTION_KEY?.trim() ?? "",
    testRecipients: readAllowlist(env.OUTLOOK_TEST_RECIPIENTS),
    graphBaseUrl: env.MICROSOFT_GRAPH_BASE_URL?.trim() || "https://graph.microsoft.com/v1.0",
    timeoutMs: 15000
  };
}

export function isOutlookLiveSendAllowed(config: OutlookGraphConfig): boolean {
  return config.graphEnabled && config.liveSendEnabled;
}

export function isOutlookTestRecipientAllowed(
  config: OutlookGraphConfig,
  email: string
): boolean {
  return config.testRecipients.includes(email.trim().toLowerCase());
}

export function validateOutlookConfiguration(config: OutlookGraphConfig): string[] {
  const missing: string[] = [];
  if (!config.clientId) missing.push("MICROSOFT_CLIENT_ID");
  if (!config.encryptionKey || config.encryptionKey.length < 32) {
    missing.push("FORGEOS_LOCAL_ENCRYPTION_KEY");
  }
  return missing;
}
