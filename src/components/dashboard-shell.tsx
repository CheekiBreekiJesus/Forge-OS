import Link from "next/link";
import { AppFrame, panelClass } from "@/components/app-frame";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { getLocalizedModuleHref } from "@/modules/config";

type DashboardShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

type Tone = "green" | "blue" | "amber" | "red";

const toneClasses: Record<Tone, string> = {
  green: "text-emerald-300 bg-emerald-500/12 border-emerald-400/20",
  blue: "text-blue-300 bg-blue-500/12 border-blue-400/20",
  amber: "text-amber-300 bg-amber-500/12 border-amber-400/20",
  red: "text-red-300 bg-red-500/12 border-red-400/20"
};

const progressClasses: Record<Tone, string> = {
  green: "bg-emerald-400",
  blue: "bg-blue-400",
  amber: "bg-amber-400",
  red: "bg-red-400"
};

export function DashboardShell({ dictionary, locale }: DashboardShellProps) {
  return (
    <AppFrame activeModule="dashboard" dictionary={dictionary} locale={locale}>
      <section className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-300">
          {dictionary.dashboard.eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {dictionary.dashboard.greeting}
        </h1>
        <p className="mt-1 text-sm text-slate-400">{dictionary.dashboard.title}</p>
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        {dictionary.dashboard.metrics.map((metric) => (
          <article className={`${panelClass} p-4`} key={metric.label}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-300">{metric.label}</p>
                <p className="mt-2 text-2xl font-bold">{metric.value}</p>
              </div>
              <span className={`rounded-lg border px-2 py-1 text-xs ${toneClasses[metric.tone]}`}>
                ...
              </span>
            </div>
            <p className={`mt-4 text-sm font-semibold ${toneClasses[metric.tone]}`}>
              {metric.trend} <span className="font-normal text-slate-400">{metric.detail}</span>
            </p>
          </article>
        ))}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <ProductionPanel dictionary={dictionary} />
        <InventoryPanel dictionary={dictionary} />
        <ActivityPanel dictionary={dictionary} />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <OrdersPanel dictionary={dictionary} />
        <RevenuePanel dictionary={dictionary} />
        <CopilotPanel dictionary={dictionary} />
      </section>

      <section className={`${panelClass} mt-4 p-5`} id="modules">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold">{dictionary.dashboard.modulesTitle}</h2>
          <span className="rounded-md bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300">
            {dictionary.dashboard.status.prototype}
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {dictionary.dashboard.modules.map((module) => (
            <Link
              className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 transition hover:border-orange-400/60 hover:bg-slate-900"
              href={getLocalizedModuleHref(locale, module.key)}
              id={module.key}
              key={module.key}
            >
              <div className="text-sm font-bold">{module.title}</div>
              <p className="mt-2 min-h-12 text-xs leading-5 text-slate-400">
                {module.description}
              </p>
              <span className="mt-3 inline-block rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">
                {module.status}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </AppFrame>
  );
}

function ProductionPanel({ dictionary }: { dictionary: Dictionary }) {
  const values = [86, 88, 91, 87, 84, 62, 64];

  return (
    <article className={`${panelClass} p-5`}>
      <h2 className="text-lg font-bold">{dictionary.dashboard.production.title}</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-[10rem_1fr]">
        <div className="grid aspect-square place-items-center rounded-full border-[18px] border-emerald-400/80 bg-slate-950 text-center">
          <div>
            <div className="text-3xl font-bold">{dictionary.dashboard.production.score}</div>
            <div className="text-xs text-slate-400">OEE</div>
          </div>
        </div>
        <div className="space-y-4 text-sm">
          <MetricLine label={dictionary.dashboard.production.availability} value="90.3%" tone="blue" />
          <MetricLine label={dictionary.dashboard.production.performance} value="76.8%" tone="amber" />
          <MetricLine label={dictionary.dashboard.production.quality} value="95.4%" tone="green" />
        </div>
      </div>
      <div className="mt-6 flex h-28 items-end gap-4 border-t border-slate-800 pt-4">
        {values.map((value, index) => (
          <div className="flex flex-1 flex-col items-center gap-2" key={dictionary.dashboard.production.days[index]}>
            <div className="w-full rounded-t bg-blue-500" style={{ height: `${value}%` }} />
            <span className="text-xs text-slate-400">{dictionary.dashboard.production.days[index]}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function InventoryPanel({ dictionary }: { dictionary: Dictionary }) {
  return (
    <article className={`${panelClass} p-5`}>
      <PanelHeading title={dictionary.dashboard.inventory.title} action={dictionary.dashboard.inventory.viewAll} />
      <div className="mt-4 space-y-4">
        {dictionary.dashboard.inventory.items.map((item) => (
          <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-800 pb-3 last:border-0" key={item.name}>
            <div>
              <div className="font-semibold">{item.name}</div>
              <div className="text-xs text-slate-400">{item.category}</div>
            </div>
            <div className="min-w-40 text-right">
              <div className="text-sm font-semibold">{item.quantity}</div>
              <div className="text-xs text-slate-500">{item.minimum}</div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-800">
                <div className={`h-1.5 w-4/5 rounded-full ${progressClasses[item.tone]}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function ActivityPanel({ dictionary }: { dictionary: Dictionary }) {
  return (
    <article className={`${panelClass} p-5`}>
      <PanelHeading title={dictionary.dashboard.activity.title} action={dictionary.dashboard.activity.viewAll} />
      <div className="mt-4 space-y-3">
        {dictionary.dashboard.activity.items.map((item) => (
          <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-800 pb-3 last:border-0" key={item.title}>
            <div>
              <div className="text-sm font-semibold">{item.title}</div>
              <div className="text-xs text-slate-400">{item.detail}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">{item.time}</div>
              <div className={`mt-1 rounded-md border px-2 py-1 text-xs font-bold ${toneClasses[item.tone]}`}>
                {item.priority}
              </div>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function OrdersPanel({ dictionary }: { dictionary: Dictionary }) {
  return (
    <article className={`${panelClass} p-5`}>
      <PanelHeading title={dictionary.dashboard.orders.title} action={dictionary.dashboard.orders.viewAll} />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead className="text-xs text-slate-400">
            <tr>
              <th className="pb-3 font-medium">{dictionary.dashboard.orders.headers.order}</th>
              <th className="pb-3 font-medium">{dictionary.dashboard.orders.headers.product}</th>
              <th className="pb-3 font-medium">{dictionary.dashboard.orders.headers.quantity}</th>
              <th className="pb-3 font-medium">{dictionary.dashboard.orders.headers.progress}</th>
              <th className="pb-3 font-medium text-right">{dictionary.dashboard.orders.headers.delivery}</th>
            </tr>
          </thead>
          <tbody>
            {dictionary.dashboard.orders.rows.map((row) => (
              <tr className="border-t border-slate-800" key={row.order}>
                <td className="py-3 font-semibold">{row.order}</td>
                <td className="py-3 text-slate-300">{row.product}</td>
                <td className="py-3 text-slate-300">{row.quantity}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${toneClasses[row.tone]}`}>{row.progress}</span>
                    <div className="h-1.5 w-20 rounded-full bg-slate-800">
                      <div className={`h-1.5 rounded-full ${progressClasses[row.tone]}`} style={{ width: row.progress }} />
                    </div>
                  </div>
                </td>
                <td className="py-3 text-right text-slate-300">{row.delivery}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function RevenuePanel({ dictionary }: { dictionary: Dictionary }) {
  const points = [18, 32, 56, 47, 52, 54, 74];

  return (
    <article className={`${panelClass} p-5`}>
      <h2 className="text-lg font-bold">{dictionary.dashboard.metrics[1]?.label}</h2>
      <div className="mt-6 text-3xl font-bold">{dictionary.dashboard.metrics[1]?.value}</div>
      <p className="mt-2 text-sm font-semibold text-emerald-300">
        {dictionary.dashboard.metrics[1]?.trend}{" "}
        <span className="font-normal text-slate-400">{dictionary.dashboard.metrics[1]?.detail}</span>
      </p>
      <div className="mt-8 flex h-36 items-end gap-3 border-t border-slate-800 pt-4">
        {points.map((point, index) => (
          <div className="flex flex-1 flex-col items-center gap-2" key={point + index}>
            <div className="w-full rounded-t bg-blue-500/80" style={{ height: `${point}%` }} />
            <span className="text-xs text-slate-500">{dictionary.dashboard.production.days[index]}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function CopilotPanel({ dictionary }: { dictionary: Dictionary }) {
  return (
    <article className={`${panelClass} p-5`}>
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold">{dictionary.dashboard.copilot.title}</h2>
        <span className="rounded bg-orange-500/15 px-2 py-1 text-xs font-bold text-orange-300">
          {dictionary.dashboard.copilot.badge}
        </span>
      </div>
      <div className="mt-5 rounded-lg bg-slate-800 px-4 py-3 text-sm text-slate-200">
        {dictionary.dashboard.copilot.prompt}
      </div>
      <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
        {dictionary.dashboard.copilot.answer}
      </div>
      <div className="mt-4 flex gap-2 rounded-lg border border-slate-700 bg-slate-950 p-2">
        <div className="flex-1 px-2 py-2 text-sm text-slate-500">{dictionary.dashboard.copilot.input}</div>
        <button className="rounded-md bg-orange-500 px-3 text-sm font-bold text-white" type="button">
          &gt;
        </button>
      </div>
    </article>
  );
}

function PanelHeading({ title, action }: { title: string; action: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-lg font-bold">{title}</h2>
      <button className="text-sm font-semibold text-blue-300" type="button">
        {action}
      </button>
    </div>
  );
}

function MetricLine({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
      <div className="flex items-center gap-2 text-slate-300">
        <span className={`size-2 rounded-full ${progressClasses[tone]}`} />
        {label}
      </div>
      <div className="font-bold">{value}</div>
    </div>
  );
}
