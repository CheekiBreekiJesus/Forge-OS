import Link from "next/link";
import { AppFrame, panelClass } from "@/components/app-frame";
import type { DemoJobCard } from "@/demo/workflow";
import type { DemoMachine, DemoProductionOrder } from "@/demo/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type JobCardShellProps = {
  dictionary: Dictionary;
  jobCard: DemoJobCard;
  locale: Locale;
  machine: DemoMachine;
  order: DemoProductionOrder;
};

export function JobCardShell({
  dictionary,
  jobCard,
  locale,
  machine,
  order
}: JobCardShellProps) {
  const copy = dictionary.jobCard;
  const numberFormat = new Intl.NumberFormat(locale);

  return (
    <AppFrame activeModule="production" dictionary={dictionary} locale={locale}>
      <section className="mb-5">
        <Link
          className="text-sm font-semibold text-blue-300 hover:text-blue-200"
          href={`/${locale}/production`}
        >
          {copy.backToProduction}
        </Link>

        <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-orange-300">
          {copy.eyebrow}
        </p>
        <div className="mt-2 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {copy.title} {order.id}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              {copy.description}
            </p>
          </div>
          <div className={`${panelClass} grid gap-3 p-4 sm:grid-cols-3`}>
            <JobStat label={copy.status} value={order.status} />
            <JobStat label={copy.scheduledDate} value={order.scheduledDate} />
            <JobStat label={copy.progress} value={`${order.progress}%`} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className={`${panelClass} p-5`}>
          <h2 className="text-lg font-bold">{copy.sections.production}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label={copy.fields.customer} value={jobCard.customer} />
            <Field label={copy.fields.product} value={jobCard.product} />
            <Field
              label={copy.fields.quantity}
              value={numberFormat.format(jobCard.quantity)}
            />
            <Field label={copy.fields.qrUrl} value={jobCard.qrReadyJobUrl} />
          </div>
        </article>

        <article className={`${panelClass} p-5`}>
          <h2 className="text-lg font-bold">{copy.sections.machine}</h2>
          <div className="mt-5 grid gap-3">
            <Field label={copy.fields.machine} value={jobCard.assignedMachine} />
            <Field
              label={copy.fields.speed}
              value={numberFormat.format(machine.productionSpeedPerHour)}
            />
            <Field
              label={copy.fields.loadingBay}
              value={numberFormat.format(jobCard.loadingBayCapacity)}
            />
          </div>
        </article>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <article className={`${panelClass} p-5`}>
          <h2 className="text-lg font-bold">{copy.sections.artwork}</h2>
          <div className="mt-5 grid gap-3">
            <Field label={copy.fields.artworkStatus} value={jobCard.artworkStatus} />
            <Field label={copy.fields.screenStatus} value={jobCard.screenStatus} />
            <Field label={copy.fields.ink} value={`${jobCard.predictedInkKg} kg`} />
          </div>
        </article>

        <article className={`${panelClass} p-5`}>
          <h2 className="text-lg font-bold">{copy.sections.packing}</h2>
          <div className="mt-5 grid gap-3">
            <Field label={copy.fields.capacity} value={jobCard.cupCapacity} />
            <Field label={copy.fields.material} value={jobCard.material} />
            <Field label={copy.fields.loading} value={jobCard.stackLoadingInfo} />
          </div>
        </article>

        <article className={`${panelClass} p-5`}>
          <h2 className="text-lg font-bold">{copy.sections.notes}</h2>
          <p className="mt-5 rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm leading-6 text-slate-300">
            {jobCard.operatorNotes}
          </p>
        </article>
      </section>
    </AppFrame>
  );
}

function JobStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-bold text-slate-100">{value}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-100">{value}</div>
    </div>
  );
}
