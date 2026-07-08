import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";

type AuthAccessShellProps = {
  action?: ReactNode;
  body: string;
  locale: Locale;
  signOutLabel: string;
  title: string;
};

export function AuthAccessShell({
  action,
  body,
  locale,
  signOutLabel,
  title
}: AuthAccessShellProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#06111f] px-4 text-slate-100">
      <section className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900/80 p-6 shadow-2xl">
        <div className="grid size-10 place-items-center rounded-lg bg-orange-500 text-lg font-black">
          F
        </div>
        <h1 className="mt-4 text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">{body}</p>
        {action ? <div className="mt-6">{action}</div> : null}
        <Link
          className="mt-6 inline-flex rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
          href={`/auth/signout?next=/${locale}`}
        >
          {signOutLabel}
        </Link>
      </section>
    </main>
  );
}
