"use client";

import { FormEvent, useState } from "react";
import { AppFrame, panelClass } from "@/components/app-frame";
import { validateProductUrls } from "@/features/email-composition/url-utils";
import type { Product } from "@/domain/product-types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useProducts } from "@/persistence/profile-hooks";
import { usePersistence } from "@/persistence/provider";

type ProductCatalogShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

export function ProductCatalogShell({ dictionary, locale }: ProductCatalogShellProps) {
  const { products, loading, reload } = useProducts();
  const d = dictionary.productCatalog;

  return (
    <AppFrame activeModule="products" dictionary={dictionary} locale={locale}>
      <section className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-300">{d.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{d.title}</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">{d.description}</p>
      </section>

      <section className={`${panelClass} p-5`}>
        <h2 className="text-lg font-bold">{d.fieldsTitle}</h2>
        {loading ? (
          <p className="mt-4 text-sm text-slate-400">Loading…</p>
        ) : (
          <div className="mt-4 grid gap-4">
            {products.map((product) => (
              <ProductEmailEditor key={product.id} onSaved={reload} product={product} />
            ))}
          </div>
        )}
      </section>
    </AppFrame>
  );
}

function ProductEmailEditor({
  product,
  onSaved
}: {
  product: Product;
  onSaved: () => Promise<void>;
}) {
  const { state, tenantId, notifyDataChanged } = usePersistence();
  const [form, setForm] = useState(product);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (state.status !== "ready") return;
    const validation = validateProductUrls(form);
    if (!validation.valid) {
      setFeedback(validation.errors.join(" "));
      return;
    }
    await state.repos.products.update(tenantId, product.id, form);
    notifyDataChanged();
    await onSaved();
    setFeedback("Saved.");
  }

  return (
    <form className="rounded-lg border border-slate-800 bg-slate-950/40 p-4" onSubmit={save}>
      <div className="font-semibold">{product.name}</div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Input label="Product page URL" onChange={(v) => setForm({ ...form, productPageUrl: v })} value={form.productPageUrl} />
        <Input label="Image URL" onChange={(v) => setForm({ ...form, imageUrl: v })} value={form.imageUrl} />
        <Input label="Thumbnail URL" onChange={(v) => setForm({ ...form, thumbnailUrl: v })} value={form.thumbnailUrl} />
        <Input label="Customizer URL" onChange={(v) => setForm({ ...form, customizerUrl: v })} value={form.customizerUrl} />
        <Input label="CTA label" onChange={(v) => setForm({ ...form, defaultCtaLabel: v })} value={form.defaultCtaLabel} />
        <Input label="Email title" onChange={(v) => setForm({ ...form, emailTitle: v })} value={form.emailTitle} />
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input
            checked={form.isEmailPromotable}
            onChange={(e) => setForm({ ...form, isEmailPromotable: e.target.checked })}
            type="checkbox"
          />
          Promotable in outreach emails
        </label>
      </div>
      {feedback ? <p className="mt-2 text-sm text-emerald-300">{feedback}</p> : null}
      <button className="mt-3 rounded-lg bg-orange-500 px-3 py-2 text-sm font-bold text-white" type="submit">
        Save
      </button>
    </form>
  );
}

function Input({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-xs uppercase text-slate-500">{label}</span>
      <input
        className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
        onChange={(e) => onChange(e.target.value)}
        value={value}
      />
    </label>
  );
}
