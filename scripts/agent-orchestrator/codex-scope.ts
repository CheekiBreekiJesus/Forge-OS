import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { normalizeRepoPath } from "./git";

export type ScopedFileSnapshot = {
  relativePath: string;
  exists: boolean;
  hash: string | null;
  content: string | null;
};

export type ScopeSnapshot = {
  changedFilesBefore: string[];
  allowedFiles: ScopedFileSnapshot[];
};

function globToRegExp(pattern: string): RegExp {
  const normalized = normalizeRepoPath(pattern);
  const escaped = normalized
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "___GLOBSTAR___")
    .replace(/\*/g, "[^/]*")
    .replace(/___GLOBSTAR___/g, ".*");
  return new RegExp(`^${escaped}$`);
}

export function isPathTraversal(candidate: string): boolean {
  const normalized = normalizeRepoPath(candidate);
  return normalized.split("/").some((segment) => segment === "..");
}

export function isPathAllowed(relativePath: string, allowedPatterns: string[]): boolean {
  const normalized = normalizeRepoPath(relativePath);
  if (isPathTraversal(normalized)) {
    return false;
  }

  return allowedPatterns.some((pattern) => globToRegExp(pattern).test(normalized));
}

export function isPathProhibited(
  relativePath: string,
  prohibitedPrefixes: string[]
): boolean {
  const normalized = normalizeRepoPath(relativePath);
  return prohibitedPrefixes.some((prefix) => normalized.startsWith(normalizeRepoPath(prefix)));
}

function listFilesRecursive(absoluteDir: string, repoRoot: string): string[] {
  if (!existsSync(absoluteDir)) {
    return [];
  }

  const entries = readdirSync(absoluteDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(absoluteDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(absolutePath, repoRoot));
      continue;
    }

    if (entry.isFile()) {
      files.push(normalizeRepoPath(path.relative(repoRoot, absolutePath)));
    }
  }

  return files;
}

export function listAllowedFiles(repoRoot: string, allowedPatterns: string[]): string[] {
  const discovered = new Set<string>();

  for (const pattern of allowedPatterns) {
    const normalized = normalizeRepoPath(pattern);
    if (normalized.endsWith("/**")) {
      const dirRelative = normalized.slice(0, -3);
      for (const file of listFilesRecursive(path.join(repoRoot, dirRelative), repoRoot)) {
        if (isPathAllowed(file, allowedPatterns)) {
          discovered.add(file);
        }
      }
      continue;
    }

    if (!normalized.includes("*")) {
      discovered.add(normalized);
    }
  }

  return [...discovered].sort();
}

function hashFileContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function snapshotAllowedFiles(
  repoRoot: string,
  allowedPatterns: string[]
): ScopedFileSnapshot[] {
  const files = listAllowedFiles(repoRoot, allowedPatterns);

  return files.map((relativePath) => {
    const absolutePath = path.join(repoRoot, relativePath);
    if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
      return {
        relativePath,
        exists: false,
        hash: null,
        content: null
      };
    }

    const content = readFileSync(absolutePath, "utf8");
    return {
      relativePath,
      exists: true,
      hash: hashFileContent(content),
      content
    };
  });
}

export function captureScopeSnapshot(
  repoRoot: string,
  changedFilesBefore: string[],
  allowedPatterns: string[]
): ScopeSnapshot {
  return {
    changedFilesBefore: changedFilesBefore.map(normalizeRepoPath),
    allowedFiles: snapshotAllowedFiles(repoRoot, allowedPatterns)
  };
}

export function findAmbiguousScopeFiles(
  changedFilesBefore: string[],
  allowedPatterns: string[]
): string[] {
  return changedFilesBefore
    .map(normalizeRepoPath)
    .filter((file) => isPathAllowed(file, allowedPatterns));
}

export function diffChangedPaths(
  beforeChangedFiles: string[],
  afterChangedFiles: string[]
): string[] {
  const before = new Set(beforeChangedFiles.map(normalizeRepoPath));
  const after = new Set(afterChangedFiles.map(normalizeRepoPath));
  const introduced = [...after].filter((file) => !before.has(file));
  const removed = [...before].filter((file) => !after.has(file));
  const modifiedCandidates = [...after].filter((file) => before.has(file));
  return [...new Set([...introduced, ...removed, ...modifiedCandidates])];
}

export function detectScopeViolations(input: {
  beforeSnapshot: ScopeSnapshot;
  afterChangedFiles: string[];
  allowedPatterns: string[];
  prohibitedPrefixes: string[];
  repoRoot: string;
}): { changedPaths: string[]; violations: string[]; scopeViolation: boolean } {
  const afterAllowed = snapshotAllowedFiles(input.repoRoot, input.allowedPatterns);
  const changedPaths: string[] = [];
  const violations: string[] = [];

  for (const afterFile of afterAllowed) {
    const beforeFile = input.beforeSnapshot.allowedFiles.find(
      (file) => file.relativePath === afterFile.relativePath
    );

    if (!beforeFile) {
      changedPaths.push(afterFile.relativePath);
      continue;
    }

    if (beforeFile.hash !== afterFile.hash) {
      changedPaths.push(afterFile.relativePath);
    }
  }

  for (const file of input.afterChangedFiles.map(normalizeRepoPath)) {
    if (isPathProhibited(file, input.prohibitedPrefixes)) {
      violations.push(`Prohibited path changed: ${file}`);
    }

    if (!isPathAllowed(file, input.allowedPatterns) && !file.startsWith("qa/reports/")) {
      const wasChangedBefore = input.beforeSnapshot.changedFilesBefore.includes(file);
      if (!wasChangedBefore) {
        violations.push(`Out-of-scope path changed: ${file}`);
      }
    }
  }

  if (changedPaths.length > 1) {
    violations.push("More than one significant change detected in allowed scope");
  }

  return {
    changedPaths,
    violations,
    scopeViolation: violations.length > 0
  };
}

export function restoreScopedFiles(snapshot: ScopeSnapshot, repoRoot: string): string[] {
  const restored: string[] = [];

  for (const file of snapshot.allowedFiles) {
    const absolutePath = path.join(repoRoot, file.relativePath);
    if (!file.exists) {
      if (existsSync(absolutePath)) {
        unlinkSync(absolutePath);
        restored.push(file.relativePath);
      }
      continue;
    }

    if (file.content !== null) {
      writeFileSync(absolutePath, file.content, "utf8");
      restored.push(file.relativePath);
    }
  }

  return restored;
}
