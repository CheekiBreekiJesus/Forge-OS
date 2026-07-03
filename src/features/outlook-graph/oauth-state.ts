import type { PendingOAuthSession } from "./types";
import { generateCodeVerifier, generateOAuthState } from "./oauth-pkce";

const STATE_TTL_MS = 10 * 60 * 1000;

const pendingSessions = new Map<string, PendingOAuthSession>();

export function createPendingOAuthSession(now = Date.now()): PendingOAuthSession {
  const session: PendingOAuthSession = {
    state: generateOAuthState(),
    codeVerifier: generateCodeVerifier(),
    createdAt: now,
    expiresAt: now + STATE_TTL_MS
  };
  pendingSessions.set(session.state, session);
  purgeExpiredSessions(now);
  return session;
}

export function consumePendingOAuthSession(
  state: string,
  now = Date.now()
): PendingOAuthSession | null {
  purgeExpiredSessions(now);
  const session = pendingSessions.get(state);
  if (!session) return null;
  pendingSessions.delete(state);
  if (session.expiresAt < now) return null;
  return session;
}

export function validatePendingOAuthState(state: string, now = Date.now()): boolean {
  purgeExpiredSessions(now);
  const session = pendingSessions.get(state);
  return Boolean(session && session.expiresAt >= now);
}

export function clearPendingOAuthSessions(): void {
  pendingSessions.clear();
}

function purgeExpiredSessions(now: number): void {
  for (const [key, session] of pendingSessions.entries()) {
    if (session.expiresAt < now) pendingSessions.delete(key);
  }
}

/** Test helper — count pending sessions without exposing contents. */
export function countPendingOAuthSessions(): number {
  return pendingSessions.size;
}
