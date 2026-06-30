"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type LoginShellProps = {
  dictionary: Dictionary;
  locale: Locale;
  tenantName: string;
};

export function LoginShell({ dictionary, locale, tenantName }: LoginShellProps) {
  const l = dictionary.login;
  const [dialog, setDialog] = useState<"google" | "microsoft" | null>(null);

  return (
    <main className="grid min-h-screen place-items-center bg-[#06111f] px-4 text-slate-100">
      <section className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900/80 p-6 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-300">{l.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold">{l.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">{l.description}</p>

        <div className="mt-6 grid gap-3">
          <button
            className="rounded-lg border border-slate-600 bg-slate-950 px-4 py-3 text-sm font-semibold hover:bg-slate-800"
            onClick={() => setDialog("google")}
            type="button"
          >
            {l.googleSignIn}
          </button>
          <button
            className="rounded-lg border border-slate-600 bg-slate-950 px-4 py-3 text-sm font-semibold hover:bg-slate-800"
            onClick={() => setDialog("microsoft")}
            type="button"
          >
            {l.microsoftSignIn}
          </button>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-slate-500">
          <div className="h-px flex-1 bg-slate-700" />
          <span>{l.orContinueLocal}</span>
          <div className="h-px flex-1 bg-slate-700" />
        </div>

        <div className="grid gap-4">
          <Field label={l.tenant} value={tenantName} />
          <Field label={l.user} value="joao.gomes@demo.local" />
          <Field label={l.password} value="demo-password" />
        </div>

        <Link
          className="mt-6 block rounded-lg bg-orange-500 px-4 py-3 text-center text-sm font-bold text-white"
          href={`/${locale}`}
        >
          {l.submit}
        </Link>
        <p className="mt-4 text-xs leading-5 text-slate-500">{l.note}</p>
      </section>

      {dialog ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="text-lg font-bold">
              {dialog === "google" ? l.googleDialogTitle : l.microsoftDialogTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {dialog === "google" ? l.googleDialogBody : l.microsoftDialogBody}
            </p>
            <button
              className="mt-4 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold"
              onClick={() => setDialog(null)}
              type="button"
            >
              {l.closeDialog}
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm text-slate-200">{value}</div>
    </div>
  );
}
