import { describe, expect, it } from "vitest";
import { containsSecretLikeValue } from "@/features/outreach-test-profile/validation";

describe("outreach test profile validation", () => {
  it("rejects API-key-like values", () => {
    expect(containsSecretLikeValue("xkeysib-abc123-def456-ghi789")).toBe(true);
    expect(containsSecretLikeValue("operador@synthetic.example")).toBe(false);
  });
});
