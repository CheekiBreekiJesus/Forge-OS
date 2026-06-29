import path from "node:path";

const WINDOWS_USER_HOME_PATTERN = /[A-Za-z]:\\Users\\[^\\]+/g;
const WINDOWS_USER_PROFILE_PATTERN = /%USERPROFILE%/gi;
const UNIX_HOME_PATTERN = /\/(?:home|Users)\/[^/\s]+/g;
const NPM_CACHE_PATTERN = /[A-Za-z]:\\Users\\[^\\]+\\AppData\\Local\\npm-cache/gi;
const NPM_CACHE_UNIX_PATTERN = /\/home\/[^/\s]+\/.npm/g;

const SECRET_PATTERNS: RegExp[] = [
  /sk-[A-Za-z0-9]{10,}/g,
  /Bearer\s+[A-Za-z0-9._-]+/gi,
  /Authorization:\s*\S+/gi,
  /postgres(?:ql)?:\/\/\S+/gi,
  /mongodb(?:\+srv)?:\/\/\S+/gi,
  /SUPABASE_[A-Z_]+=\S+/g,
  /OPENAI_API_KEY=\S+/g,
  /API_KEY=\S+/g,
  /SECRET=\S+/g,
  /TOKEN=\S+/g
];

export function toRepoRelativePath(absolutePath: string, repoRoot: string): string {
  const normalizedRoot = path.resolve(repoRoot);
  const normalizedPath = path.resolve(absolutePath);

  if (normalizedPath === normalizedRoot) {
    return ".";
  }

  if (normalizedPath.startsWith(`${normalizedRoot}${path.sep}`)) {
    return normalizedPath.slice(normalizedRoot.length + 1).replace(/\\/g, "/");
  }

  return absolutePath.replace(/\\/g, "/");
}

export function sanitizeWorkingDirectory(workingDirectory: string, repoRoot: string): string {
  return toRepoRelativePath(workingDirectory, repoRoot);
}

export function redactSensitiveText(input: string, extraPatterns: string[] = []): string {
  let output = input;

  output = output.replace(WINDOWS_USER_HOME_PATTERN, "[USER_HOME]");
  output = output.replace(WINDOWS_USER_PROFILE_PATTERN, "[USER_HOME]");
  output = output.replace(NPM_CACHE_PATTERN, "[USER_HOME]\\AppData\\Local\\npm-cache");
  output = output.replace(NPM_CACHE_UNIX_PATTERN, "[USER_HOME]/.npm");
  output = output.replace(UNIX_HOME_PATTERN, "[USER_HOME]");

  for (const pattern of SECRET_PATTERNS) {
    output = output.replace(pattern, "[REDACTED_SECRET]");
  }

  for (const patternSource of extraPatterns) {
    output = output.replace(new RegExp(patternSource, "gi"), "[REDACTED]");
  }

  return output;
}

export function sanitizeCommandOutput(
  output: string,
  repoRoot: string,
  extraPatterns: string[] = []
): string {
  const relative = output.split(repoRoot).join(".");
  return redactSensitiveText(relative, extraPatterns);
}

export function detectPrivacyViolations(
  content: string,
  extraPatterns: string[] = []
): string[] {
  const violations: string[] = [];

  if (/[A-Za-z]:\\Users\\[^\\[\]]+/.test(content)) {
    violations.push("Windows user profile path detected");
  }

  if (/\/(?:home|Users)\/[^/\s\[]+/.test(content)) {
    violations.push("Unix home directory path detected");
  }

  if (/AppData\\Local\\npm-cache/i.test(content) && !content.includes("[USER_HOME]")) {
    violations.push("npm cache path detected");
  }

  for (const pattern of SECRET_PATTERNS) {
    const probe = new RegExp(pattern.source, pattern.flags.replace("g", ""));
    if (probe.test(content) && !content.includes("[REDACTED_SECRET]")) {
      violations.push(`Secret pattern detected: ${pattern.source}`);
    }
  }

  for (const patternSource of extraPatterns) {
    const probe = new RegExp(patternSource, "i");
    if (probe.test(content) && !content.includes("[REDACTED]")) {
      violations.push(`Sensitive pattern detected: ${patternSource}`);
    }
  }

  return violations;
}
