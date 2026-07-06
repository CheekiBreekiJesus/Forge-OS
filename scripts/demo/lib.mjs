import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEMO_HEALTH_PATH,
  DEMO_HOST,
  DEMO_PID_DIR,
  DEMO_PORT,
  DEMO_RUNTIME_METADATA,
  REQUIRED_NODE_MAJOR,
  REQUIRED_NPM_VERSION
} from "./contract.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getRepoRoot() {
  let current = path.resolve(__dirname, "..", "..");
  while (true) {
    if (fs.existsSync(path.join(current, "package.json"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error("Could not locate ForgeOS repository root (package.json not found).");
    }
    current = parent;
  }
}

export function parseNodeVersion(raw) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(raw.trim());
  if (!match) return null;
  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
    raw: raw.trim()
  };
}

export function assertNode22() {
  const result = spawnSync(process.execPath, ["-v"], { encoding: "utf8" });
  const version = parseNodeVersion(result.stdout || result.stderr || "");
  if (!version) {
    fail("Could not parse Node.js version. Run `node -v` manually.");
  }
  if (version.major !== REQUIRED_NODE_MAJOR) {
    fail(
      `ForgeOS 0.2.0 demo requires Node.js ${REQUIRED_NODE_MAJOR}.x (found ${version.raw}). ` +
        `Use nvm, fnm, or install Node ${REQUIRED_NODE_MAJOR} from https://nodejs.org/.`
    );
  }
  return version;
}

export function assertNpmVersion() {
  const result = spawnSync("npm", ["-v"], { encoding: "utf8", shell: process.platform === "win32" });
  const npmVersion = (result.stdout || "").trim();
  if (!npmVersion) {
    fail("Could not parse npm version. Run `npm -v` manually.");
  }
  if (npmVersion !== REQUIRED_NPM_VERSION) {
    console.warn(
      `Warning: expected npm ${REQUIRED_NPM_VERSION} (packageManager pin); found ${npmVersion}. ` +
        "Run `corepack enable` and `corepack prepare npm@10.9.8 --activate` if installs are inconsistent."
    );
  }
  return npmVersion;
}

export function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

export function log(message) {
  console.log(message);
}

export function ensureDemoDirectories(repoRoot) {
  for (const dir of [".demo", ".demo/logs", DEMO_PID_DIR]) {
    const full = path.join(repoRoot, dir);
    if (!fs.existsSync(full)) {
      fs.mkdirSync(full, { recursive: true });
    }
  }
}

export function isPortFree(port, host = DEMO_HOST) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

export function readRuntimeMetadata(repoRoot) {
  const file = path.join(repoRoot, DEMO_RUNTIME_METADATA);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

export function writeRuntimeMetadata(repoRoot, metadata) {
  ensureDemoDirectories(repoRoot);
  const file = path.join(repoRoot, DEMO_RUNTIME_METADATA);
  fs.writeFileSync(file, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
}

export function removeRuntimeMetadata(repoRoot) {
  const file = path.join(repoRoot, DEMO_RUNTIME_METADATA);
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function commandLineLooksLikeForgeDemo(commandLine, repoRoot) {
  if (!commandLine) return false;
  const normalized = commandLine.toLowerCase();
  const repo = repoRoot.toLowerCase();
  return (
    normalized.includes(repo) &&
    (normalized.includes("next dev") || normalized.includes("next start") || normalized.includes("node"))
  );
}

export function getWindowsProcessCommandLine(pid) {
  if (process.platform !== "win32") return null;
  const result = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `(Get-CimInstance Win32_Process -Filter "ProcessId = ${pid}" -ErrorAction SilentlyContinue).CommandLine`
    ],
    { encoding: "utf8" }
  );
  const line = (result.stdout || "").trim();
  return line || null;
}

export async function describePortOwner(port) {
  if (process.platform === "win32") {
    const result = spawnSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess`
      ],
      { encoding: "utf8" }
    );
    const pid = Number.parseInt((result.stdout || "").trim(), 10);
    if (!Number.isFinite(pid)) return null;
    const commandLine = getWindowsProcessCommandLine(pid);
    return { pid, commandLine };
  }

  const result = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"], { encoding: "utf8" });
  const pid = Number.parseInt((result.stdout || "").split("\n")[0], 10);
  if (!Number.isFinite(pid)) return null;
  return { pid, commandLine: null };
}

/**
 * Fail when the demo port is occupied by an unrelated process.
 * Reuse metadata when our demo server is already running.
 */
export async function assertDemoPortAvailable(repoRoot, port = DEMO_PORT) {
  const metadata = readRuntimeMetadata(repoRoot);
  if (metadata?.pid && isProcessRunning(metadata.pid)) {
    fail(
      `ForgeOS demo already appears to be running (PID ${metadata.pid}) on ${metadata.url ?? `port ${port}`}. ` +
        "Stop it before starting again."
    );
  }

  if (metadata?.pid && !isProcessRunning(metadata.pid)) {
    removeRuntimeMetadata(repoRoot);
  }

  if (await isPortFree(port)) {
    return;
  }

  const owner = await describePortOwner(port);
  if (owner && commandLineLooksLikeForgeDemo(owner.commandLine, repoRoot)) {
    fail(
      `Port ${port} is in use by another ForgeOS dev server (PID ${owner.pid}). ` +
        "Stop that process before starting the demo harness."
    );
  }

  const ownerHint = owner ? `PID ${owner.pid}` : "an unknown process";
  fail(
    `Port ${port} is already in use by ${ownerHint}. ` +
      "Stop the conflicting process or choose a different machine port before running demo:start."
  );
}

export async function waitForHealth(baseUrl, timeoutMs = 120000) {
  const url = `${baseUrl}${DEMO_HEALTH_PATH}`;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  fail(`Timed out waiting for demo health at ${url}`);
}

export function runNpmCi(repoRoot) {
  log("Running npm ci...");
  const result = spawnSync("npm", ["ci"], {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env
  });
  if (result.status !== 0) {
    fail("npm ci failed.");
  }
}

/**
 * Build spawn arguments for the demo Next.js dev server.
 * On Windows, npm is a .cmd shim and must run with shell:true (Node 22+ throws EINVAL otherwise).
 */
export function buildDemoDevSpawnOptions(repoRoot, env, port = DEMO_PORT) {
  const args = ["run", "dev", "--", "--port", String(port)];
  const options = {
    cwd: repoRoot,
    env,
    stdio: "inherit",
    shell: process.platform === "win32"
  };
  return { command: "npm", args, options };
}

export function spawnDemoDev(repoRoot, env, port = DEMO_PORT) {
  const { command, args, options } = buildDemoDevSpawnOptions(repoRoot, env, port);
  return spawn(command, args, options);
}

/** Optional git commit for demo metadata; returns null when git is unavailable. */
export function tryResolveGitCommit(repoRoot) {
  const result = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "ignore"]
  });
  if (result.status !== 0) {
    return null;
  }
  const commit = (result.stdout || "").trim();
  return commit || null;
}
