"use client";

import Link from "next/link";
import { useState } from "react";
import { SupabasePublicConfigError, createForgeOSBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { sanitizeAuthRedirect, type LoginErrorCode } from "@/lib/auth/safe-redirect";

type LoginShellProps = {
  auth: {
    localDemoEnabled: boolean;
    supabaseConfigured: boolean;
  };
  dictionary: Dictionary;
  initialError: LoginErrorCode | null;
  initialNextPath: string;
  locale: Locale;
  tenantName: string;
};

type OAuthProvider = "google" | "microsoft";

const PROVIDERS: Record<OAuthProvider, { provider: "google" | "azure"; scopes?: string }> = {
  google: { provider: "google" },
  microsoft: { provider: "azure", scopes: "openid email profile" }
};

export function LoginShell({
  auth,
  dictionary,
  initialError,
  initialNextPath,
  locale,
  tenantName
}: LoginShellProps) {
  const l = dictionary.login;
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const initialErrorMessage = initialError ? l.errors[initialError] : null;

  async function startOAuth(providerKey: OAuthProvider) {
    if (loadingProvider) return;
    setClientError(null);

    if (!auth.supabaseConfigured) {
      setClientError(l.errors.supabase_not_configured);
      return;
    }

    setLoadingProvider(providerKey);
    try {
      const supabase = createForgeOSBrowserSupabaseClient();
      const provider = PROVIDERS[providerKey];
      const nextPath = sanitizeAuthRedirect(initialNextPath, `/${locale}`);
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider.provider,
        options: {
          redirectTo,
          ...(provider.scopes ? { scopes: provider.scopes } : {})
        }
      });

      if (error) {
        setClientError(l.errors.oauth_provider_failed);
        setLoadingProvider(null);
      }
    } catch (error) {
      setClientError(
        error instanceof SupabasePublicConfigError
          ? l.errors.supabase_not_configured
          : l.errors.oauth_provider_failed
      );
      setLoadingProvider(null);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#06111f] px-4 text-slate-100">
      <section className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900/80 p-6 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-300">{l.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold">{l.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">{l.description}</p>

        {initialErrorMessage || clientError ? (
          <p className="mt-4 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
            {clientError ?? initialErrorMessage}
          </p>
        ) : null}

        <div className="mt-6 grid gap-3">
          <button
            className="rounded-lg border border-slate-600 bg-slate-950 px-4 py-3 text-sm font-semibold hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={Boolean(loadingProvider)}
            onClick={() => void startOAuth("google")}
            type="button"
          >
            {loadingProvider === "google" ? l.loadingGoogle : l.googleSignIn}
          </button>
          <button
            className="rounded-lg border border-slate-600 bg-slate-950 px-4 py-3 text-sm font-semibold hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={Boolean(loadingProvider)}
            onClick={() => void startOAuth("microsoft")}
            type="button"
          >
            {loadingProvider === "microsoft" ? l.loadingMicrosoft : l.microsoftSignIn}
          </button>
        </div>

        {auth.localDemoEnabled ? (
          <>
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
          </>
        ) : (
          <p className="mt-6 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-300">
            {l.hostedOnlyNote}
          </p>
        )}
        <p className="mt-4 text-xs leading-5 text-slate-500">
          {auth.localDemoEnabled ? l.note : l.membershipNote}
        </p>
      </section>
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
