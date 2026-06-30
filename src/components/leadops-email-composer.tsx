"use client";

import type { EmailComposition, EmailLink, EmailMediaBlock } from "@/features/email-composition/types";
import {
  buildGmailComposeUrl,
  buildMailtoUrl,
  buildOutlookComposeUrl,
  copyFormattedEmail,
  copyPlainText,
  formatFullMessageForCopy,
  formatPlainTextForCopy
} from "@/features/email-composition/copy";
import type { Dictionary } from "@/i18n/dictionaries";

type EmailCopyActionsProps = {
  composition: EmailComposition;
  dictionary: Dictionary;
  recipientEmail: string;
  onFeedback: (message: string, kind: "success" | "error") => void;
};

export function EmailCopyActions({
  composition,
  dictionary,
  recipientEmail,
  onFeedback
}: EmailCopyActionsProps) {
  const c = dictionary.leadops.copyActions;

  async function handleCopySubject() {
    const ok = await copyPlainText(composition.subject);
    onFeedback(ok ? c.copiedSubject : c.copyFailed, ok ? "success" : "error");
  }

  async function handleCopyPlain() {
    const ok = await copyPlainText(formatPlainTextForCopy(composition, true));
    onFeedback(ok ? c.copiedPlain : c.copyFailed, ok ? "success" : "error");
  }

  async function handleCopyFormatted() {
    const result = await copyFormattedEmail(composition);
    if (!result.ok) {
      onFeedback(c.copyFailed, "error");
      return;
    }
    const msg = result.htmlSupported
      ? c.copiedFormatted
      : `${c.copiedFormatted} ${c.htmlFallback}`;
    onFeedback(msg, "success");
  }

  async function handleCopyFull() {
    const ok = await copyPlainText(formatFullMessageForCopy(composition));
    onFeedback(ok ? c.copiedFull : c.copyFailed, ok ? "success" : "error");
  }

  function openMailto() {
    const mailto = buildMailtoUrl({
      body: composition.plainText,
      subject: composition.subject,
      to: recipientEmail
    });
    window.location.href = mailto.url;
    if (mailto.truncated) onFeedback(c.mailtoTruncated, "error");
  }

  function openGmail() {
    const { url, truncated } = buildGmailComposeUrl({
      body: composition.plainText,
      subject: composition.subject,
      to: recipientEmail
    });
    window.open(url, "_blank", "noopener,noreferrer");
    if (truncated) onFeedback(c.bodyTruncated, "error");
  }

  function openOutlook() {
    const { url, truncated } = buildOutlookComposeUrl({
      body: composition.plainText,
      subject: composition.subject,
      to: recipientEmail
    });
    window.open(url, "_blank", "noopener,noreferrer");
    if (truncated) onFeedback(c.bodyTruncated, "error");
  }

  return (
    <div className="space-y-3">
      {composition.localOnlyImageWarning ? (
        <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          {c.localImageWarning}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <ActionButton label={c.copySubject} onClick={() => void handleCopySubject()} />
        <ActionButton label={c.copyPlain} onClick={() => void handleCopyPlain()} />
        <ActionButton label={c.copyFormatted} onClick={() => void handleCopyFormatted()} />
        <ActionButton label={c.copyFull} onClick={() => void handleCopyFull()} />
        <ActionButton label={c.openDefault} onClick={openMailto} />
        <ActionButton label={c.openGmail} onClick={openGmail} />
        <ActionButton label={c.openOutlook} onClick={openOutlook} />
      </div>
    </div>
  );
}

export function EmailBrandingPreview({
  composition,
  dictionary
}: {
  composition: EmailComposition;
  dictionary: Dictionary;
}) {
  const p = dictionary.leadops.brandingPreview;
  return (
    <div className="space-y-3 text-sm">
      <PreviewBlock label={p.links} value={composition.links.map((l) => `${l.label}: ${l.url}`).join("\n") || "-"} />
      <PreviewBlock
        label={p.media}
        value={composition.mediaBlocks.map((b) => b.publicUrl ?? b.placeholderText).join("\n") || "-"}
      />
      <PreviewBlock label={p.signature} value={composition.signature.plainText || "-"} />
      <PreviewBlock label={p.footer} value={composition.legalFooter || "-"} />
    </div>
  );
}

function PreviewBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <pre className="mt-1 whitespace-pre-wrap text-slate-300">{value}</pre>
    </div>
  );
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

export function buildCupMockupBlock(locale: "pt-PT" | "en"): EmailMediaBlock {
  return {
    altText: locale === "pt-PT" ? "Mockup do copo personalizado" : "Personalized cup mockup",
    id: `cup-mockup-${Date.now()}`,
    kind: "cup-mockup",
    label: locale === "pt-PT" ? "[Mockup do copo personalizado]" : "[Personalized cup mockup]",
    localAssetId: null,
    placeholderText: locale === "pt-PT" ? "[Mockup do copo personalizado]" : "[Personalized cup mockup]",
    publicUrl: null
  };
}

export function buildWebsiteLink(url: string, locale: "pt-PT" | "en"): EmailLink {
  return {
    id: `website-${Date.now()}`,
    kind: "website",
    label: locale === "pt-PT" ? "Website" : "Website",
    url
  };
}
