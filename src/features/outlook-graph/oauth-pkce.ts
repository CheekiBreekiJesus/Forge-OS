import { createHash, randomBytes } from "node:crypto";

export function generateCodeVerifier(): string {
  return base64UrlEncode(randomBytes(32));
}

export function generateCodeChallenge(verifier: string): string {
  return base64UrlEncode(createHash("sha256").update(verifier).digest());
}

export function generateOAuthState(): string {
  return base64UrlEncode(randomBytes(24));
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString("base64url");
}
