import { expect, type Page } from "@playwright/test";

const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]{10,}/,
  /ABACUS_API_KEY\s*=\s*\S+/,
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*\S+/,
  /Bearer\s+[A-Za-z0-9._-]{20,}/
];

const ALLOWED_THIRD_PARTY = [/Download the React DevTools/i, /DevTools/i];

export type ConsoleCollector = {
  errors: string[];
  pageErrors: string[];
  attach: () => void;
  assertClean: () => void;
};

export function createConsoleCollector(page: Page): ConsoleCollector {
  const errors: string[] = [];
  const pageErrors: string[] = [];

  const onConsole = (msg: { type(): string; text(): string }) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (ALLOWED_THIRD_PARTY.some((pattern) => pattern.test(text))) return;
    errors.push(text);
  };

  const onPageError = (error: Error) => {
    pageErrors.push(error.message);
  };

  return {
    errors,
    pageErrors,
    attach() {
      page.on("console", onConsole);
      page.on("pageerror", onPageError);
    },
    assertClean() {
      for (const text of [...errors, ...pageErrors]) {
        expect(text, "unexpected browser console error").not.toMatch(/hydration/i);
        expect(text, "secret-like value in console").not.toMatch(
          new RegExp(SECRET_PATTERNS.map((p) => p.source).join("|"))
        );
      }
      expect(pageErrors, "uncaught page errors").toEqual([]);
    }
  };
}
