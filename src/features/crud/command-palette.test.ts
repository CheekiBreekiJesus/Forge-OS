import { describe, expect, it } from "vitest";
import { canCreateEntity, canViewModule } from "@/features/crud/role-preview";
import { moduleKeyFromRouteSlug } from "@/features/crud/command-palette";

describe("command palette helpers", () => {
  it("resolves module key from route slug", () => {
    expect(moduleKeyFromRouteSlug("quotations")).toBe("orders");
    expect(moduleKeyFromRouteSlug("machines")).toBe("machines");
    expect(moduleKeyFromRouteSlug("unknown")).toBeNull();
  });

  it("exposes role-gated quick create targets", () => {
    expect(canCreateEntity("owner", "machine")).toBe(true);
    expect(canCreateEntity("sales", "machine")).toBe(false);
    expect(canViewModule("owner", "inventory")).toBe(true);
    expect(canViewModule("sales", "inventory")).toBe(false);
  });
});
