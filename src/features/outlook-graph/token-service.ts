import type { OutlookGraphConfig } from "./config";
import type { CachedOutlookTokens, OutlookConnectionInfo, OutlookConnectionStatus } from "./types";
import {
  deleteEncryptedTokenCache,
  readEncryptedTokenCache,
  writeEncryptedTokenCache
} from "./token-cache";
import { OUTLOOK_GRAPH_SCOPES } from "./types";
import { assertOutlookServerOnlyModule } from "./server-only";

assertOutlookServerOnlyModule();

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

type GraphProfile = {
  mail?: string;
  userPrincipalName?: string;
  displayName?: string;
  id?: string;
};

let inMemoryFallback: CachedOutlookTokens | null = null;

export async function loadCachedTokens(
  config: OutlookGraphConfig
): Promise<CachedOutlookTokens | null> {
  if (!config.encryptionKey) {
    return inMemoryFallback;
  }
  return readEncryptedTokenCache(config.encryptionKey);
}

export async function saveCachedTokens(
  config: OutlookGraphConfig,
  tokens: CachedOutlookTokens
): Promise<void> {
  if (!config.encryptionKey) {
    inMemoryFallback = tokens;
    return;
  }
  await writeEncryptedTokenCache(config.encryptionKey, tokens);
}

export async function clearCachedTokens(config: OutlookGraphConfig): Promise<void> {
  void config;
  inMemoryFallback = null;
  await deleteEncryptedTokenCache();
}

export function clearInMemoryTokenFallback(): void {
  inMemoryFallback = null;
}

export function buildAuthorizationUrl(
  config: OutlookGraphConfig,
  state: string,
  codeChallenge: string
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    redirect_uri: config.redirectUri,
    response_mode: "query",
    scope: OUTLOOK_GRAPH_SCOPES.join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "select_account"
  });
  return `${config.authority.replace(/\/$/, "")}/oauth2/v2.0/authorize?${params.toString()}`;
}

export async function exchangeAuthorizationCode(
  config: OutlookGraphConfig,
  code: string,
  codeVerifier: string
): Promise<CachedOutlookTokens> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
    scope: OUTLOOK_GRAPH_SCOPES.join(" ")
  });
  const response = await fetch(`${config.authority.replace(/\/$/, "")}/oauth2/v2.0/token`, {
    body,
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST"
  });
  const payload = (await response.json()) as TokenResponse;
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description ?? payload.error ?? "token_exchange_failed");
  }
  const profile = await fetchGraphProfile(config, payload.access_token);
  const now = Date.now();
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    expiresAt: now + (payload.expires_in ?? 3600) * 1000,
    accountId: profile.id ?? "unknown",
    homeAccountId: profile.id ?? null,
    mailboxAddress: profile.mail ?? profile.userPrincipalName ?? null,
    displayName: profile.displayName ?? null,
    scopes: (payload.scope ?? OUTLOOK_GRAPH_SCOPES.join(" ")).split(" "),
    cachedAt: new Date(now).toISOString()
  };
}

export async function refreshAccessToken(
  config: OutlookGraphConfig,
  cached: CachedOutlookTokens
): Promise<CachedOutlookTokens> {
  if (!cached.refreshToken) {
    throw new Error("refresh_token_missing");
  }
  const body = new URLSearchParams({
    client_id: config.clientId,
    grant_type: "refresh_token",
    refresh_token: cached.refreshToken,
    redirect_uri: config.redirectUri,
    scope: OUTLOOK_GRAPH_SCOPES.join(" ")
  });
  const response = await fetch(`${config.authority.replace(/\/$/, "")}/oauth2/v2.0/token`, {
    body,
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST"
  });
  const payload = (await response.json()) as TokenResponse;
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description ?? payload.error ?? "token_refresh_failed");
  }
  const now = Date.now();
  return {
    ...cached,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? cached.refreshToken,
    expiresAt: now + (payload.expires_in ?? 3600) * 1000,
    cachedAt: new Date(now).toISOString()
  };
}

export async function getValidAccessToken(config: OutlookGraphConfig): Promise<string | null> {
  const cached = await loadCachedTokens(config);
  if (!cached) return null;
  const now = Date.now();
  if (cached.expiresAt > now + 60_000) {
    return cached.accessToken;
  }
  try {
    const refreshed = await refreshAccessToken(config, cached);
    await saveCachedTokens(config, refreshed);
    return refreshed.accessToken;
  } catch {
    return null;
  }
}

export async function getConnectionInfo(config: OutlookGraphConfig): Promise<OutlookConnectionInfo> {
  const cached = await loadCachedTokens(config);
  const liveSendEnabled = config.graphEnabled && config.liveSendEnabled;
  if (!cached) {
    return {
      status: "disconnected",
      mailboxAddress: null,
      displayName: null,
      grantedScopes: [],
      lastValidatedAt: null,
      liveSendEnabled,
      graphEnabled: config.graphEnabled
    };
  }
  const now = Date.now();
  let status: OutlookConnectionStatus = "connected";
  if (!cached.refreshToken && cached.expiresAt < now) {
    status = "reconnect_required";
  } else if (cached.expiresAt < now) {
    status = "expired";
  }
  return {
    status,
    mailboxAddress: cached.mailboxAddress,
    displayName: cached.displayName,
    grantedScopes: cached.scopes,
    lastValidatedAt: cached.cachedAt,
    liveSendEnabled,
    graphEnabled: config.graphEnabled
  };
}

export async function validateMailboxConnection(
  config: OutlookGraphConfig
): Promise<{ ok: boolean; status: OutlookConnectionStatus }> {
  const token = await getValidAccessToken(config);
  if (!token) {
    return { ok: false, status: "reconnect_required" };
  }
  try {
    await fetchGraphProfile(config, token);
    const cached = await loadCachedTokens(config);
    if (cached) {
      await saveCachedTokens(config, {
        ...cached,
        cachedAt: new Date().toISOString()
      });
    }
    return { ok: true, status: "connected" };
  } catch {
    return { ok: false, status: "reconnect_required" };
  }
}

async function fetchGraphProfile(
  config: OutlookGraphConfig,
  accessToken: string
): Promise<GraphProfile> {
  const response = await fetch(`${config.graphBaseUrl}/me`, {
    headers: { authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) {
    throw new Error("profile_fetch_failed");
  }
  return (await response.json()) as GraphProfile;
}
