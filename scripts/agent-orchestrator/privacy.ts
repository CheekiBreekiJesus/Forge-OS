import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { detectPrivacyViolations, redactSensitiveText } from "./sanitize";
import type { PrivacyScanResult } from "./types";

export function scanFilesForPrivacyViolations(
  filePaths: string[],
  extraPatterns: string[] = [],
  repoRoot?: string
): PrivacyScanResult {
  const violations: string[] = [];
  const scannedFiles: string[] = [];

  for (const filePath of filePaths) {
    const displayPath = repoRoot
      ? filePath.replace(repoRoot, ".").replace(/\\/g, "/")
      : filePath.replace(/\\/g, "/");
    scannedFiles.push(redactSensitiveText(displayPath, extraPatterns));
    const content = readFileSync(filePath, "utf8");
    const fileViolations = detectPrivacyViolations(content, extraPatterns);
    for (const violation of fileViolations) {
      violations.push(`${displayPath}: ${violation}`);
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    scannedFiles
  };
}

export function sanitizeReportObject<T>(value: T, extraPatterns: string[] = []): T {
  if (typeof value === "string") {
    return redactSensitiveText(value, extraPatterns) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeReportObject(item, extraPatterns)) as T;
  }

  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      output[key] = sanitizeReportObject(nestedValue, extraPatterns);
    }
    return output as T;
  }

  return value;
}

export function scanReportDirectory(
  reportDir: string,
  extraPatterns: string[] = []
): PrivacyScanResult {
  if (!existsSync(reportDir)) {
    return { passed: true, violations: [], scannedFiles: [] };
  }

  const files = readdirSync(reportDir)
    .filter((name) => name.endsWith(".json") || name.endsWith(".md"))
    .map((name) => path.join(reportDir, name));

  return scanFilesForPrivacyViolations(files, extraPatterns);
}
