import { describe, expect, it } from "vitest";
import { parseForgeOSRoles, resolvePermissionsForRoles } from "./permissions";

describe("ForgeOS role permissions", () => {
  it("parses only canonical roles", () => {
    expect(parseForgeOSRoles("company_owner,warehouse_manager")).toEqual([
      "company_owner",
      "warehouse_manager"
    ]);
    expect(parseForgeOSRoles("company_owner,attacker")).toEqual([]);
  });

  it("does not grant every authenticated role owner permissions", () => {
    const viewerPermissions = resolvePermissionsForRoles(["viewer"]);
    expect(viewerPermissions).toContain("app:access");
    expect(viewerPermissions).not.toContain("settings:manage");
    expect(viewerPermissions).not.toContain("send_job:queue");
  });

  it("combines explicit valid permissions with role permissions", () => {
    expect(resolvePermissionsForRoles(["viewer"], ["send_job:view", "invalid"])).toContain(
      "send_job:view"
    );
  });
});
