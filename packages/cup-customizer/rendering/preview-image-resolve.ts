export type PreviewImageResolveResult = {
  url: string;
  missing: boolean;
};

/**
 * Resolve a preview image URL with HEAD validation and a single fallback candidate.
 */
export async function resolvePreviewImageUrl(
  primaryUrl: string,
  fallbackUrl: string,
  fetchImpl: typeof fetch = fetch
): Promise<PreviewImageResolveResult> {
  try {
    const response = await fetchImpl(primaryUrl, { method: "HEAD" });
    if (response.ok) {
      return { url: primaryUrl, missing: false };
    }
  } catch {
    // try fallback below
  }

  try {
    const response = await fetchImpl(fallbackUrl, { method: "HEAD" });
    if (response.ok) {
      return { url: fallbackUrl, missing: true };
    }
  } catch {
    // no asset available
  }

  return { url: fallbackUrl, missing: true };
}
