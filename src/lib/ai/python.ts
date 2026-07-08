import path from "node:path";
import { spawnSync } from "node:child_process";

export function resolvePythonBin(configured?: string): string {
  const localVenv =
    process.platform === "win32"
      ? path.join(process.cwd(), ".venv", "Scripts", "python.exe")
      : path.join(process.cwd(), ".venv", "bin", "python");
  const candidates = [configured, localVenv, "python", "py", "python3"].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const args = candidate === "py" ? ["-3", "--version"] : ["--version"];
    const result = spawnSync(candidate, args, {
      encoding: "utf8",
      windowsHide: true
    });

    if (result.status === 0) {
      return candidate;
    }
  }

  return configured ?? (process.platform === "win32" ? "python" : "python3");
}
