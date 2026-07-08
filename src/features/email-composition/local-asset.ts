const MAX_ASSET_SIZE_BYTES = 2 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml"
]);

export type AssetValidationResult =
  | { ok: true; mimeType: string; size: number }
  | { ok: false; error: string };

export function validateLocalAsset(file: {
  name: string;
  type: string;
  size: number;
}): AssetValidationResult {
  if (file.size > MAX_ASSET_SIZE_BYTES) {
    return { error: "File exceeds 2 MB limit.", ok: false };
  }
  const mime = file.type || guessMimeFromName(file.name);
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    return { error: "Unsupported file type. Use PNG, JPEG, WebP, GIF, or SVG.", ok: false };
  }
  if (/\.(exe|bat|cmd|sh|js|html|htm)$/i.test(file.name)) {
    return { error: "Executable or unsafe file types are not allowed.", ok: false };
  }
  return { mimeType: mime, ok: true, size: file.size };
}

function guessMimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Data URLs must not be embedded in recipient-facing email HTML. */
export function isSafeExternalImageUrl(url: string): boolean {
  if (!url || url.startsWith("blob:") || url.startsWith("data:")) return false;
  if (url.includes("localhost") || url.includes("127.0.0.1")) return false;
  return /^https:\/\//i.test(url);
}
