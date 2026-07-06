import { spawn } from "node:child_process";
import { describe, expect, it } from "vitest";
import { buildDemoDevSpawnOptions } from "../lib.mjs";

describe("demo dev spawn", () => {
  it("uses shell on Windows so npm spawn does not throw EINVAL", () => {
    const { command, args, options } = buildDemoDevSpawnOptions(
      process.cwd(),
      process.env,
      3000
    );

    expect(command).toBe("npm");
    expect(args).toEqual(["run", "dev", "--", "--port", "3000"]);
    expect(options.stdio).toBe("inherit");

    if (process.platform === "win32") {
      expect(options.shell).toBe(true);
      expect(() => spawn(command, ["-v"], { ...options, stdio: "pipe" })).not.toThrow();
    } else {
      expect(options.shell).toBe(false);
    }
  });
});
