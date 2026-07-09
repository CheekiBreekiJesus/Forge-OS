import { describe, expect, it, vi } from "vitest";
import { resolvePreviewImageUrl } from "./preview-image-resolve";

function mockFetch(responses: Record<string, { ok: boolean }>) {
  return vi.fn(async (url: string) => {
    const entry = responses[url];
    if (!entry) {
      throw new Error(`unexpected fetch: ${url}`);
    }
    return { ok: entry.ok } as Response;
  });
}

describe("preview-image-resolve", () => {
  it("returns the primary URL when the asset exists", async () => {
    const fetchImpl = mockFetch({
      "/primary.png": { ok: true },
      "/fallback.png": { ok: true }
    });

    await expect(resolvePreviewImageUrl("/primary.png", "/fallback.png", fetchImpl)).resolves.toEqual({
      url: "/primary.png",
      missing: false
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("falls back when the primary asset is missing", async () => {
    const fetchImpl = mockFetch({
      "/primary.png": { ok: false },
      "/fallback.png": { ok: true }
    });

    await expect(resolvePreviewImageUrl("/primary.png", "/fallback.png", fetchImpl)).resolves.toEqual({
      url: "/fallback.png",
      missing: true
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("returns the fallback URL when both assets are unavailable", async () => {
    const fetchImpl = mockFetch({
      "/primary.png": { ok: false },
      "/fallback.png": { ok: false }
    });

    await expect(resolvePreviewImageUrl("/primary.png", "/fallback.png", fetchImpl)).resolves.toEqual({
      url: "/fallback.png",
      missing: true
    });
  });

  it("falls back when the primary HEAD request throws", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ ok: true } as Response);

    await expect(resolvePreviewImageUrl("/primary.png", "/fallback.png", fetchImpl)).resolves.toEqual({
      url: "/fallback.png",
      missing: true
    });
  });
});
