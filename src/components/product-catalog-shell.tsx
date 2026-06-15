import { AppFrame, panelClass } from "@/components/app-frame";
import { demoProducts, jhGomesTenant } from "@/demo/seed";
import type { DemoProduct } from "@/demo/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type ProductCatalogShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

export function ProductCatalogShell({
  dictionary,
  locale
}: ProductCatalogShellProps) {
  return (
    <AppFrame activeModule="products" dictionary={dictionary} locale={locale}>
      <section className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-300">
          {dictionary.productCatalog.eyebrow}
        </p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {dictionary.productCatalog.title}
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
              {dictionary.productCatalog.description}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300">
            {jhGomesTenant.name} · {jhGomesTenant.defaultLocale}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(dictionary.productCatalog.categories).map(([category, label]) => {
          const count = demoProducts.filter((product) => product.category === category).length;

          return (
            <article className={`${panelClass} p-5`} key={category}>
              <p className="text-sm font-medium text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-bold">{count}</p>
            </article>
          );
        })}
      </section>

      <section className={`${panelClass} mt-4 p-5`}>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-lg font-bold">{dictionary.productCatalog.fieldsTitle}</h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            {dictionary.productCatalog.sourceNotice}
          </p>
        </div>
        <div className="mt-5 grid gap-4">
          {demoProducts.map((product) => (
          <ProductCard
            dictionary={dictionary}
            key={product.id}
            locale={locale}
            product={product}
          />
          ))}
        </div>
      </section>
    </AppFrame>
  );
}

function ProductCard({
  dictionary,
  locale,
  product
}: {
  dictionary: Dictionary;
  locale: Locale;
  product: DemoProduct;
}) {
  const fields = dictionary.productCatalog.fields;

  return (
    <article className="rounded-lg border border-slate-800 bg-slate-950/40 p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-lg font-bold">{product.name}</div>
          <div className="mt-1 text-sm text-slate-500">
            {fields.sku}: {product.sku}
          </div>
        </div>
        <div className="rounded-md bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200">
          {dictionary.productCatalog.categories[product.category]}
        </div>
      </div>

      <dl className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Field label={fields.material} value={product.material} />
        <Field label={fields.image} value={product.image} />
        <Field label={fields.capacity} value={product.capacity} />
        <Field label={fields.color} value={product.color} />
        <Field label={fields.unitsPerBox} value={product.unitsPerBox.toLocaleString("en-US")} />
        <Field label={fields.stacksPerBox} value={String(product.stacksPerBox)} />
        <Field label={fields.unitsPerStack} value={String(product.unitsPerStack)} />
        <Field
          label={fields.basePrice}
          value={formatCurrency(product.basePrice, locale)}
        />
        <Field
          label={fields.personalization}
          value={
            product.personalizationAvailable
              ? dictionary.productCatalog.yes
              : dictionary.productCatalog.no
          }
        />
        <Field label={fields.printArea} value={product.printArea} />
        <Field label={fields.setupCost} value={formatCurrency(product.setupCost, locale)} />
        <Field label={fields.screenCost} value={formatCurrency(product.screenCost, locale)} />
        <Field
          label={fields.leadTime}
          value={`${product.leadTimeDays} ${dictionary.productCatalog.days}`}
        />
      </dl>

      <div className="mt-4 grid gap-3 border-t border-slate-800 pt-4 md:grid-cols-[1fr_1fr]">
        <Field
          label={fields.compatible}
          value={product.compatibleLidsAccessories.join(", ")}
        />
        <Field label={fields.sourceUrl} value={product.sourceUrl ?? "-"} />
      </div>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-200">{value}</dd>
    </div>
  );
}

function formatCurrency(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale, {
    currency: "EUR",
    style: "currency"
  }).format(value);
}
