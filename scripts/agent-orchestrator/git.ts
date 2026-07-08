import { spawnSync } from "node:child_process";
import path from "node:path";
import type { GitState } from "./types";

function runGit(repoRoot: string, args: string[]): string {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false
  });

  if (result.error) {
    throw result.error;
  }

  return (result.stdout ?? "").trim();
}

export function getGitState(repoRoot: string): GitState {
  const branch = runGit(repoRoot, ["branch", "--show-current"]) || "HEAD";
  const commit = runGit(repoRoot, ["rev-parse", "HEAD"]);
  const status = runGit(repoRoot, ["status", "--porcelain"]);
  const changedFiles = status
    ? status
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => line.slice(3).trim())
    : [];

  return {
    branch,
    commit,
    dirty: changedFiles.length > 0,
    changedFiles
  };
}

export function normalizeRepoPath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

export function isGeneratedReportPath(filePath: string, reportPaths: string[]): boolean {
  const normalized = normalizeRepoPath(filePath);
  return reportPaths.some((reportPath) => {
    const normalizedReport = normalizeRepoPath(reportPath);
    if (normalizedReport.endsWith("/")) {
      return normalized.startsWith(normalizedReport);
    }

    const reportDir = path.posix.dirname(normalizedReport);
    const reportBase = path.posix.basename(normalizedReport);
    if (reportBase.includes("*")) {
      return normalized.startsWith(`${reportDir}/`);
    }

    return normalized === normalizedReport;
  });
}

export function isTrackedReportArtifact(
  filePath: string,
  trackedArtifacts: string[]
): boolean {
  const normalized = normalizeRepoPath(filePath);
  return trackedArtifacts.some((artifact) => normalizeRepoPath(artifact) === normalized);
}

export function isApplicationSourcePath(filePath: string): boolean {
  const normalized = normalizeRepoPath(filePath);
  const applicationPrefixes = [
    "src/",
    "supabase/migrations/",
    "public/",
    "app/",
    "components/"
  ];

  if (applicationPrefixes.some((prefix) => normalized.startsWith(prefix))) {
    return true;
  }

  const applicationFiles = [
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "next.config.ts",
    "tailwind.config.ts",
    "eslint.config.mjs"
  ];

  return applicationFiles.includes(normalized);
}

export function diffApplicationChanges(
  before: string[],
  after: string[],
  ignoredPaths: string[]
): string[] {
  const ignored = new Set(ignoredPaths.map(normalizeRepoPath));
  const beforeSet = new Set(before.map(normalizeRepoPath));
  const afterSet = new Set(after.map(normalizeRepoPath));

  const introduced = [...afterSet].filter((file) => !beforeSet.has(file));
  return introduced.filter(
    (file) => !ignored.has(file) && isApplicationSourcePath(file)
  );
}

export function getReportIgnorePaths(policyReportPaths: {
  healthReport: string;
  codexTask: string;
}): string[] {
  const healthDir = path.posix.dirname(policyReportPaths.healthReport.replace(/\\/g, "/"));
  return [
    policyReportPaths.healthReport.replace(/\\/g, "/"),
    policyReportPaths.codexTask.replace(/\\/g, "/"),
    `${healthDir}/latest-health.json`,
    `${healthDir}/next-codex-task.md`
  ];
}
