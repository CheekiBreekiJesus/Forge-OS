import type { ReactNode } from "react";
import Link from "next/link";

type PageHeaderProps = {
  backHref?: string;
  backLabel?: string;
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
};

export function PageHeader({
  backHref,
  backLabel,
  title,
  description,
  eyebrow,
  actions
}: PageHeaderProps) {
  return (
    <section className="mb-5">
      {backHref && backLabel ? (
        <Link className="text-sm font-semibold text-blue-300 hover:text-blue-200" href={backHref}>
          {backLabel}
        </Link>
      ) : null}
      {eyebrow ? (
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-orange-300">{eyebrow}</p>
      ) : null}
      <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description ? <p className="mt-2 max-w-3xl text-sm text-slate-400">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
