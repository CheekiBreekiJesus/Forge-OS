"use client";

import { useState } from "react";
import Link from "next/link";
import {
  buildCopilotResponse,
  getSuggestedPromptKey,
  matchCopilotPrompt,
  type CopilotPromptKey
} from "@/features/dashboard/copilot";
import type { Locale } from "@/i18n/config";
import { inputClass, panelClass } from "@/theme/ui-classes";

type DashboardCopilotProps = {
  locale: Locale;
  title: string;
  badge: string;
  prompts: Record<CopilotPromptKey, string>;
  inputPlaceholder: string;
  sendLabel: string;
  disclaimer: string;
};

export function DashboardCopilot({
  locale,
  title,
  badge,
  prompts,
  inputPlaceholder,
  sendLabel,
  disclaimer
}: DashboardCopilotProps) {
  const suggestedKey = getSuggestedPromptKey();
  const [input, setInput] = useState("");
  const [response, setResponse] = useState(() => buildCopilotResponse(suggestedKey, locale));

  function handleSend() {
    const matched = matchCopilotPrompt(input) ?? suggestedKey;
    setResponse(buildCopilotResponse(matched, locale));
  }

  return (
    <article className={`${panelClass} p-5`}>
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-[var(--forge-text-primary)]">{title}</h2>
        <span className="rounded-md border border-[var(--forge-border)] bg-[var(--forge-accent-orange-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--forge-accent-orange)]">
          {badge}
        </span>
      </div>
      <div className="mt-4 space-y-3 rounded-lg border border-[var(--forge-border-subtle)] bg-[var(--forge-surface-muted)] p-4">
        <p className="text-sm font-medium text-[var(--forge-text-primary)]">
          {prompts[response.promptKey]}
        </p>
        <p className="text-sm leading-6 text-[var(--forge-text-secondary)]">{response.answer}</p>
        <div className="flex flex-wrap gap-2">
          {response.links.map((link) => (
            <Link
              className="rounded-md border border-[var(--forge-border)] bg-[var(--forge-surface)] px-2 py-1 text-xs font-semibold text-[var(--forge-accent-blue)]"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs text-[var(--forge-text-muted)]">{disclaimer}</p>
      <div className="mt-4 flex gap-2">
        <input
          aria-label={inputPlaceholder}
          className={`${inputClass} min-w-0 flex-1`}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSend();
          }}
          placeholder={inputPlaceholder}
          value={input}
        />
        <button
          className="rounded-lg bg-[var(--forge-accent-orange)] px-4 py-2 text-sm font-bold text-white"
          onClick={handleSend}
          type="button"
        >
          {sendLabel}
        </button>
      </div>
    </article>
  );
}
