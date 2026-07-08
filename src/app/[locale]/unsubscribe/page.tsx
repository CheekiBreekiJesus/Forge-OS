import { notFound } from "next/navigation";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { verifyUnsubscribeToken } from "@/features/email-delivery/unsubscribe-token";

const copy = {
  "pt-PT": {
    title: "Cancelar contactos comerciais",
    description: "Confirme para deixar de receber futuros emails comerciais deste remetente.",
    invalid: "Este link nao e valido ou expirou.",
    submit: "Confirmar cancelamento",
    privacy: "Nao precisa de indicar mais dados pessoais para cancelar."
  },
  en: {
    title: "Unsubscribe from outreach",
    description: "Confirm to stop future commercial emails from this sender.",
    invalid: "This link is invalid or expired.",
    submit: "Confirm unsubscribe",
    privacy: "No additional personal information is required to unsubscribe."
  }
} satisfies Record<Locale, Record<string, string>>;

export default async function UnsubscribePage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token = "" } = await searchParams;
  if (!isSupportedLocale(locale)) notFound();

  const strings = copy[locale];
  const tokenResult = token
    ? verifyUnsubscribeToken(token, process.env.OUTREACH_UNSUBSCRIBE_SECRET ?? "")
    : { ok: false as const, reason: "invalid" as const };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <section className="w-full max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-300">ForgeOS</p>
        <h1 className="mt-3 text-2xl font-bold">{strings.title}</h1>
        {tokenResult.ok ? (
          <>
            <p className="mt-3 text-sm text-slate-300">{strings.description}</p>
            <form action="/api/outreach/unsubscribe" className="mt-5" method="post">
              <input name="token" type="hidden" value={token} />
              <button
                className="w-full rounded bg-orange-500 px-4 py-3 text-sm font-semibold text-slate-950"
                type="submit"
              >
                {strings.submit}
              </button>
            </form>
            <p className="mt-4 text-xs text-slate-500">{strings.privacy}</p>
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-300">{strings.invalid}</p>
        )}
      </section>
    </main>
  );
}
