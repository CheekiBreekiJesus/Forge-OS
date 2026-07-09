"use client";

import { ChangeEvent, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { AppFrame } from "@/components/app-frame";
import {
  LoadingState,
  PageHeader,
  PrimaryActionButton,
  inputClassName
} from "@/components/crud";
import type { ProductImportJobRow, ProductImportJobSummary } from "@/application/product-import-service";
import type { ProductImportFieldKey, ProductImportProposedAction } from "@/domain/product-import-types";
import { getProductImportCopy } from "@/features/product-import/copy";
import { suggestFieldMapping } from "@/features/product-import/field-mapping";
import { parseSpreadsheet, type ParsedSpreadsheet } from "@/features/product-import/parse-spreadsheet";
import {
  applyProductImportJobApi,
  approveProductImportJobApi,
  arrayBufferToBase64,
  createProductImportMappingProfileApi,
  fetchProductImportJobRows,
  listProductImportJobsApi,
  listProductImportMappingProfilesApi,
  parseProductImportJobApi,
  productImportErrorReportUrl,
  uploadProductImportJob
} from "@/lib/product-import/api-client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type ProductImportApiShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

type WizardStep = "file" | "worksheet" | "mapping" | "preview" | "approve" | "history";

export function ProductImportApiShell({ dictionary, locale }: ProductImportApiShellProps) {
  const copy = getProductImportCopy(locale);
  const [step, setStep] = useState<WizardStep>("file");
  const [busy, setBusy] = useState(false);
  const [parsed, setParsed] = useState<ParsedSpreadsheet | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [filename, setFilename] = useState("");
  const [worksheetName, setWorksheetName] = useState("");
  const [columnMappings, setColumnMappings] = useState<Record<string, ProductImportFieldKey>>({});
  const [job, setJob] = useState<ProductImportJobSummary | null>(null);
  const [rows, setRows] = useState<ProductImportJobRow[]>([]);
  const [jobs, setJobs] = useState<ProductImportJobSummary[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");

  const reloadJobs = useCallback(async () => {
    const list = await listProductImportJobsApi();
    setJobs(list);
  }, []);

  const reloadRows = useCallback(async () => {
    if (!job) return;
    const list = await fetchProductImportJobRows(job.id);
    setRows(list);
  }, [job]);

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const buffer = await file.arrayBuffer();
      const result = await parseSpreadsheet({ data: buffer, filename: file.name });
      setParsed(result);
      setFileBuffer(buffer);
      setFilename(file.name);
      setWorksheetName(result.worksheets.find((ws) => !ws.hidden)?.name ?? result.worksheets[0]?.name ?? "");
      const ws = result.worksheets[0];
      if (ws) setColumnMappings(suggestFieldMapping(ws.headers) as Record<string, ProductImportFieldKey>);
      setStep("worksheet");
    } finally {
      setBusy(false);
    }
  };

  const onUploadJob = async () => {
    if (!fileBuffer || !filename) return;
    setBusy(true);
    try {
      const uploaded = await uploadProductImportJob({
        file: new File([fileBuffer], filename)
      });
      setJob(uploaded);
      setMessage(`Job ${uploaded.id} uploaded.`);
    } finally {
      setBusy(false);
    }
  };

  const onParseJob = async () => {
    if (!job || !parsed || !fileBuffer || !worksheetName) return;
    setBusy(true);
    try {
      const result = await parseProductImportJobApi({
        columnMappings,
        filename,
        jobId: job.id,
        parsedFileBase64: arrayBufferToBase64(fileBuffer),
        worksheetName
      });
      setJob(result.job);
      setRows(result.rows);
      setStep("preview");
    } finally {
      setBusy(false);
    }
  };

  const onApprove = async () => {
    if (!job) return;
    setBusy(true);
    try {
      const approvals = rows.map((row) => ({
        approvedAction: (row.approvedAction ?? row.proposedAction) as ProductImportProposedAction,
        rowId: row.id
      }));
      const approvedJob = await approveProductImportJobApi({ jobId: job.id, rowApprovals: approvals });
      setJob(approvedJob);
      setStep("approve");
    } finally {
      setBusy(false);
    }
  };

  const onApply = async () => {
    if (!job) return;
    setBusy(true);
    try {
      const result = await applyProductImportJobApi({ jobId: job.id });
      setMessage(`${copy.commitSuccess} — applied ${String(result.applied_rows ?? 0)} rows.`);
      await reloadJobs();
      const refreshed = await listProductImportJobsApi();
      const current = refreshed.find((entry) => entry.id === job.id) ?? null;
      setJob(current);
    } finally {
      setBusy(false);
    }
  };

  const onSaveProfile = async () => {
    if (!profileName.trim()) return;
    setBusy(true);
    try {
      await createProductImportMappingProfileApi({
        columnMappings,
        name: profileName.trim()
      });
      setMessage("Mapping profile saved.");
      await listProductImportMappingProfilesApi();
    } finally {
      setBusy(false);
    }
  };

  const errorReportHref = useMemo(() => (job ? productImportErrorReportUrl(job.id) : null), [job]);

  return (
    <AppFrame activeModule="products" dictionary={dictionary} locale={locale}>
      <PageHeader
        actions={
          <Link className="text-sm text-forge-accent hover:underline" href={`/${locale}/products`}>
            {copy.backToCatalog}
          </Link>
        }
        description={`${copy.subtitle} (Supabase API)`}
        title={copy.title}
      />

      <p className="mb-4 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm">
        Production import mode — server is the source of truth.
      </p>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {(["file", "worksheet", "mapping", "preview", "approve", "history"] as WizardStep[]).map((key) => (
          <button
            className={`rounded-full px-3 py-1 ${step === key ? "bg-forge-accent text-white" : "bg-forge-surface-muted"}`}
            key={key}
            onClick={() => {
              setStep(key);
              if (key === "history") void reloadJobs();
            }}
            type="button"
          >
            {key}
          </button>
        ))}
      </div>

      {message ? <p className="mb-4 text-sm text-green-600 dark:text-green-400">{message}</p> : null}
      {errorReportHref ? (
        <p className="mb-4 text-sm">
          <a className="font-semibold text-forge-accent hover:underline" href={errorReportHref}>
            Download error report
          </a>
        </p>
      ) : null}

      {step === "file" ? (
        <section className="rounded-lg border border-forge-border p-4">
          <label className="block text-sm font-medium">{copy.selectFile}</label>
          <input accept=".xls,.xlsx,.csv" className={`${inputClassName} mt-2`} disabled={busy} onChange={onFileChange} type="file" />
          {job ? <p className="mt-2 text-sm">Current job: {job.filename} ({job.status})</p> : null}
          <PrimaryActionButton className="mt-3" disabled={busy || !fileBuffer} onClick={() => void onUploadJob()} type="button">
            Upload to server
          </PrimaryActionButton>
        </section>
      ) : null}

      {step === "worksheet" && parsed ? (
        <section className="space-y-4 rounded-lg border border-forge-border p-4">
          <select
            className={inputClassName}
            onChange={(event) => setWorksheetName(event.target.value)}
            value={worksheetName}
          >
            {parsed.worksheets.map((ws) => (
              <option key={ws.name} value={ws.name}>
                {ws.name}
              </option>
            ))}
          </select>
          <PrimaryActionButton disabled={busy} onClick={() => setStep("mapping")} type="button">
            Continue
          </PrimaryActionButton>
        </section>
      ) : null}

      {step === "mapping" && parsed ? (
        <section className="space-y-4 rounded-lg border border-forge-border p-4">
          {(parsed.worksheets.find((ws) => ws.name === worksheetName)?.headers ?? []).map((header) => (
            <label className="block text-sm" key={header}>
              {header}
              <input
                className={`${inputClassName} mt-1`}
                onChange={(event) =>
                  setColumnMappings((prev) => ({
                    ...prev,
                    [header]: event.target.value as ProductImportFieldKey
                  }))
                }
                value={columnMappings[header] ?? ""}
              />
            </label>
          ))}
          <div className="flex flex-wrap gap-2">
            <input className={inputClassName} onChange={(event) => setProfileName(event.target.value)} placeholder="Profile name" value={profileName} />
            <PrimaryActionButton disabled={busy} onClick={() => void onSaveProfile()} type="button">
              Save profile
            </PrimaryActionButton>
            <PrimaryActionButton disabled={busy || !job} onClick={() => void onParseJob()} type="button">
              Validate on server
            </PrimaryActionButton>
          </div>
        </section>
      ) : null}

      {step === "preview" ? (
        <section className="space-y-3 rounded-lg border border-forge-border p-4">
          <p className="text-sm">
            {rows.length} rows — valid {job?.validRows ?? 0}, invalid {job?.invalidRows ?? 0}
          </p>
          <PrimaryActionButton disabled={busy} onClick={() => void onApprove()} type="button">
            Approve
          </PrimaryActionButton>
        </section>
      ) : null}

      {step === "approve" ? (
        <section className="space-y-3 rounded-lg border border-forge-border p-4">
          <PrimaryActionButton disabled={busy} onClick={() => void onApply()} type="button">
            Apply import
          </PrimaryActionButton>
        </section>
      ) : null}

      {step === "history" ? (
        <section className="rounded-lg border border-forge-border p-4">
          {jobs.length === 0 ? <p className="text-sm">No import jobs yet.</p> : null}
          <ul className="space-y-2 text-sm">
            {jobs.map((entry) => (
              <li key={entry.id}>
                <button
                  className="text-left hover:underline"
                  onClick={() => {
                    setJob(entry);
                    void reloadRows();
                    setStep("preview");
                  }}
                  type="button"
                >
                  {entry.filename} — {entry.status}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {busy ? <LoadingState message="Working…" /> : null}
    </AppFrame>
  );
}
