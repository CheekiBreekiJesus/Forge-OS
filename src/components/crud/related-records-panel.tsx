import { panelClass } from "@/components/app-frame";

export type RelatedRecord = {
  id: string;
  label: string;
  href?: string;
  meta?: string;
};

type RelatedRecordsPanelProps = {
  title: string;
  emptyLabel: string;
  records: RelatedRecord[];
};

export function RelatedRecordsPanel({ title, emptyLabel, records }: RelatedRecordsPanelProps) {
  return (
    <aside className={`${panelClass} p-4`}>
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">{title}</h3>
      {records.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {records.map((record) => (
            <li className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm" key={record.id}>
              {record.href ? (
                <a className="font-medium text-blue-300 hover:text-blue-200" href={record.href}>
                  {record.label}
                </a>
              ) : (
                <span className="font-medium text-slate-200">{record.label}</span>
              )}
              {record.meta ? <div className="mt-0.5 text-xs text-slate-500">{record.meta}</div> : null}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
