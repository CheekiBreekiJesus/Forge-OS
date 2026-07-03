import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { CachedOutlookTokens } from "./types";
import { assertOutlookServerOnlyModule } from "./server-only";

assertOutlookServerOnlyModule();

const CACHE_VERSION = 1;

type EncryptedEnvelope = {
  version: number;
  iv: string;
  authTag: string;
  ciphertext: string;
};

export function resolveOutlookTokenCachePath(): string {
  const localAppData = process.env.LOCALAPPDATA ?? process.env.HOME ?? ".";
  return join(localAppData, "ForgeOS", "auth", "outlook-token-cache.enc");
}

export async function writeEncryptedTokenCache(
  encryptionKey: string,
  tokens: CachedOutlookTokens,
  filePath = resolveOutlookTokenCachePath()
): Promise<void> {
  const key = deriveKey(encryptionKey);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = JSON.stringify(tokens);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const envelope: EncryptedEnvelope = {
    version: CACHE_VERSION,
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: encrypted.toString("base64")
  };
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(envelope), "utf8");
}

export async function readEncryptedTokenCache(
  encryptionKey: string,
  filePath = resolveOutlookTokenCachePath()
): Promise<CachedOutlookTokens | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    const envelope = JSON.parse(raw) as EncryptedEnvelope;
    if (envelope.version !== CACHE_VERSION) return null;
    const key = deriveKey(encryptionKey);
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(envelope.iv, "base64")
    );
    decipher.setAuthTag(Buffer.from(envelope.authTag, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, "base64")),
      decipher.final()
    ]);
    return JSON.parse(decrypted.toString("utf8")) as CachedOutlookTokens;
  } catch {
    return null;
  }
}

export async function deleteEncryptedTokenCache(
  filePath = resolveOutlookTokenCachePath()
): Promise<void> {
  try {
    await unlink(filePath);
  } catch {
    // cache may not exist
  }
}

export function encryptTokenCacheRoundTrip(
  encryptionKey: string,
  tokens: CachedOutlookTokens
): CachedOutlookTokens | null {
  const key = deriveKey(encryptionKey);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = JSON.stringify(tokens);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  return JSON.parse(decrypted.toString("utf8")) as CachedOutlookTokens;
}

function deriveKey(encryptionKey: string): Buffer {
  return createHash("sha256").update(encryptionKey).digest();
}
