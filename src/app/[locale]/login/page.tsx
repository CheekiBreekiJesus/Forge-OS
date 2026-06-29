import Link from "next/link";
import { notFound } from "next/navigation";
import { jhGomesTenant } from "@/demo/seed";
import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function generateStaticParams() {
  return [{ locale: "pt-PT" }, { locale: "en" }];
}

export default async function LoginPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return (
    <main className="grid min-h-screen place-items-center bg-[#06111f] px-4 text-slate-100">
      <section className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900/80 p-6 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-300">
          {dictionary.login.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-bold">{dictionary.login.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {dictionary.login.description}
        </p>

        <div className="mt-6 grid gap-4">
          <Field label={dictionary.login.tenant} value={jhGomesTenant.name} />
          <Field label={dictionary.login.user} value="joao.gomes@demo.local" />
          <Field label={dictionary.login.password} value="demo-password" />
        </div>

        <Link
          className="mt-6 block rounded-lg bg-orange-500 px-4 py-3 text-center text-sm font-bold text-white"
          href={`/${locale}`}
        >
          {dictionary.login.submit}
        </Link>
        <p className="mt-4 text-xs leading-5 text-slate-500">{dictionary.login.note}</p>
      </section>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm text-slate-200">{value}</div>
    </div>
  );
}
