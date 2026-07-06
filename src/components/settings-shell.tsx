"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AppFrame, panelClass } from "@/components/app-frame";
import { exportBackup, importBackup, isBackupSchemaCompatible, validateBackup } from "@/features/backup/service";
import { getClientIntegrationCards, type IntegrationCard } from "@/features/integrations/status";
import { HostedFeaturesDialog } from "@/components/hosted-features";
import { renderSignature } from "@/features/email-composition/signature";
import { validateLocalAsset } from "@/features/email-composition/local-asset";
import { revokeObjectUrlIfBlob } from "@/features/cup-customizer/use-managed-object-url";
import { isValidPublicUrl, normalizeUrl } from "@/features/email-composition/url-utils";
import type { CompanyProfile, SenderIdentity, UserProfile } from "@/domain/profile-types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  useCompanyProfile,
  useCurrentUserProfile,
  useSenderIdentities,
  useUserProfiles
} from "@/persistence/profile-hooks";
import { usePersistence } from "@/persistence/provider";
import { APP_VERSION, DEMO_DB_NAME, SCHEMA_VERSION, SEED_VERSION } from "@/domain/constants";
import { readPersistenceMode } from "@/persistence/mode";
import type { EmailDeliverySelfTestResult, EmailProviderDiagnostic } from "@/domain/email-delivery-types";
import { persistEmailDeliverySelfTestResult } from "@/application/email-delivery-self-test-client";

type SettingsSection =
  | "company"
  | "profile"
  | "senders"
  | "team"
  | "integrations"
  | "backup"
  | "about";

type SettingsShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

export function SettingsShell({ dictionary, locale }: SettingsShellProps) {
  const s = dictionary.settings;
  const [section, setSection] = useState<SettingsSection>("company");

  const sections: Array<{ id: SettingsSection; label: string }> = [
    { id: "company", label: s.sections.company },
    { id: "profile", label: s.sections.profile },
    { id: "senders", label: s.sections.senders },
    { id: "team", label: s.sections.team },
    { id: "integrations", label: s.sections.integrations },
    { id: "backup", label: s.sections.backup },
    { id: "about", label: s.sections.about }
  ];

  return (
    <AppFrame activeModule="settings" dictionary={dictionary} locale={locale}>
      <section className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-300">{s.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{s.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{s.description}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <nav className={`${panelClass} flex flex-col gap-1 p-3`}>
          {sections.map((item) => (
            <button
              className={
                section === item.id
                  ? "rounded-lg bg-orange-500/20 px-3 py-2 text-left text-sm font-semibold text-orange-200"
                  : "rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800"
              }
              key={item.id}
              onClick={() => setSection(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div>
          {section === "company" ? <CompanySection s={s} /> : null}
          {section === "profile" ? <ProfileSection s={s} /> : null}
          {section === "senders" ? <SendersSection locale={locale} s={s} /> : null}
          {section === "team" ? <TeamSection s={s} /> : null}
          {section === "integrations" ? <IntegrationsSection dictionary={dictionary} s={s} /> : null}
          {section === "backup" ? <BackupSection s={s} /> : null}
          {section === "about" ? <AboutSection locale={locale} s={s} /> : null}
        </div>
      </div>
    </AppFrame>
  );
}

function CompanySection({ s }: { s: Dictionary["settings"] }) {
  const { state, tenantId, notifyDataChanged } = usePersistence();
  const { profile, loading, reload } = useCompanyProfile();
  const [form, setForm] = useState<CompanyProfile | null>(profile);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync form when profile loads
      setForm(profile);
    }
  }, [profile]);

  useEffect(() => {
    if (!profile?.logoLocalAssetId || state.status !== "ready") return;
    let cancelled = false;
    void (async () => {
      const asset = await state.repos.localAssets.getById(tenantId, profile.logoLocalAssetId!);
      if (!asset || cancelled) return;
      setLogoPreview((previous) => {
        revokeObjectUrlIfBlob(previous);
        return URL.createObjectURL(asset.blob);
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.logoLocalAssetId, state, tenantId]);

  useEffect(() => {
    return () => {
      revokeObjectUrlIfBlob(logoPreview);
    };
  }, [logoPreview]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (state.status !== "ready" || !form) return;
    const website = form.websiteUrl.trim();
    if (website) {
      const candidate = /^https?:\/\//i.test(website) || website.includes("://")
        ? website
        : normalizeUrl(website);
      if (!isValidPublicUrl(candidate)) {
        setFeedback(s.company.invalidWebsite);
        return;
      }
    }
    await state.repos.companyProfiles.update(tenantId, form.id, form);
    notifyDataChanged();
    setFeedback(s.saved);
    await reload();
  }

  async function uploadLogo(file: File) {
    if (state.status !== "ready" || !form) return;
    const validation = validateLocalAsset(file);
    if (!validation.ok) {
      setFeedback(validation.error);
      return;
    }
    const asset = await state.repos.localAssets.create(tenantId, {
      assetType: "logo",
      blob: file,
      fileName: file.name,
      mimeType: validation.mimeType,
      size: validation.size
    });
    if (form.logoLocalAssetId) {
      await state.repos.localAssets.delete(tenantId, form.logoLocalAssetId).catch(() => {});
    }
    const updated = await state.repos.companyProfiles.update(tenantId, form.id, {
      logoLocalAssetId: asset.id
    });
    setForm(updated);
    setLogoPreview((previous) => {
      revokeObjectUrlIfBlob(previous);
      return URL.createObjectURL(file);
    });
    notifyDataChanged();
    setFeedback(s.company.logoUploaded);
  }

  if (loading) {
    return <Panel title={s.sections.company}><p className="text-sm text-slate-400">{s.loading}</p></Panel>;
  }
  if (!form) {
    return <Panel title={s.sections.company}><p className="text-sm text-slate-400">{s.loading}</p></Panel>;
  }

  return (
    <Panel title={s.sections.company}>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={save}>
        <TextField label={s.company.legalName} onChange={(v) => setForm({ ...form, legalName: v })} value={form.legalName} />
        <TextField label={s.company.tradingName} onChange={(v) => setForm({ ...form, tradingName: v })} value={form.tradingName} />
        <TextField label={s.company.vatNumber} onChange={(v) => setForm({ ...form, vatNumber: v })} value={form.vatNumber} />
        <TextField label={s.company.websiteUrl} onChange={(v) => setForm({ ...form, websiteUrl: v })} value={form.websiteUrl} />
        <TextField label={s.company.generalEmail} onChange={(v) => setForm({ ...form, generalEmail: v })} value={form.generalEmail} />
        <TextField label={s.company.generalPhone} onChange={(v) => setForm({ ...form, generalPhone: v })} value={form.generalPhone} />
        <TextField label={s.company.addressLine1} onChange={(v) => setForm({ ...form, addressLine1: v })} value={form.addressLine1} />
        <TextField label={s.company.addressLine2} onChange={(v) => setForm({ ...form, addressLine2: v })} value={form.addressLine2} />
        <TextField label={s.company.postalCode} onChange={(v) => setForm({ ...form, postalCode: v })} value={form.postalCode} />
        <TextField label={s.company.city} onChange={(v) => setForm({ ...form, city: v })} value={form.city} />
        <TextField label={s.company.region} onChange={(v) => setForm({ ...form, region: v })} value={form.region} />
        <TextField label={s.company.country} onChange={(v) => setForm({ ...form, country: v })} value={form.country} />
        <TextField label={s.company.logoPublicUrl} onChange={(v) => setForm({ ...form, logoPublicUrl: v })} value={form.logoPublicUrl} />
        <TextField label={s.company.linkedinUrl} onChange={(v) => setForm({ ...form, linkedinUrl: v })} value={form.linkedinUrl} />
        <TextField label={s.company.facebookUrl} onChange={(v) => setForm({ ...form, facebookUrl: v })} value={form.facebookUrl} />
        <div className="md:col-span-2">
          <label className="grid gap-1 text-sm">
            <span className="text-xs uppercase tracking-wide text-slate-500">{s.company.legalFooter}</span>
            <textarea
              className="min-h-20 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              onChange={(e) => setForm({ ...form, legalFooter: e.target.value })}
              value={form.legalFooter}
            />
          </label>
        </div>
        <div className="md:col-span-2 flex flex-wrap items-center gap-4">
          {logoPreview || form.logoPublicUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="Logo" className="h-16 w-auto rounded border border-slate-700 bg-white p-1" src={logoPreview ?? form.logoPublicUrl} />
          ) : (
            <div className="flex h-16 w-32 items-center justify-center rounded border border-dashed border-slate-600 text-xs text-slate-500">
              {s.company.noLogo}
            </div>
          )}
          <input accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && void uploadLogo(e.target.files[0])} ref={fileRef} type="file" />
          <button className="rounded-lg border border-slate-700 px-3 py-2 text-sm" onClick={() => fileRef.current?.click()} type="button">
            {s.company.uploadLogo}
          </button>
          {form.logoLocalAssetId ? (
            <button
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-red-300"
              onClick={async () => {
                if (state.status !== "ready") return;
                await state.repos.companyProfiles.update(tenantId, form.id, { logoLocalAssetId: null });
                await state.repos.localAssets.delete(tenantId, form.logoLocalAssetId!).catch(() => {});
                setLogoPreview(null);
                notifyDataChanged();
              }}
              type="button"
            >
              {s.company.removeLogo}
            </button>
          ) : null}
        </div>
        {feedback ? <p className="md:col-span-2 text-sm text-emerald-300">{feedback}</p> : null}
        <div className="md:col-span-2">
          <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white" type="submit">
            {s.save}
          </button>
        </div>
      </form>
    </Panel>
  );
}

function ProfileSection({ s }: { s: Dictionary["settings"] }) {
  const { state, tenantId, notifyDataChanged } = usePersistence();
  const { profile, loading, reload } = useCurrentUserProfile();
  const [form, setForm] = useState<UserProfile | null>(profile);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync form when profile loads
      setForm(profile);
    }
  }, [profile]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (state.status !== "ready" || !form) return;
    await state.repos.userProfiles.update(tenantId, form.id, form);
    notifyDataChanged();
    setFeedback(s.saved);
    await reload();
  }

  if (loading || !form) {
    return <Panel title={s.sections.profile}><p className="text-sm text-slate-400">{s.loading}</p></Panel>;
  }

  return (
    <Panel title={s.sections.profile}>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={save}>
        <TextField label={s.profile.fullName} onChange={(v) => setForm({ ...form, fullName: v })} value={form.fullName} />
        <TextField label={s.profile.jobTitle} onChange={(v) => setForm({ ...form, jobTitle: v })} value={form.jobTitle} />
        <TextField label={s.profile.email} onChange={(v) => setForm({ ...form, email: v })} value={form.email} />
        <TextField label={s.profile.phone} onChange={(v) => setForm({ ...form, phone: v })} value={form.phone} />
        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-slate-500">{s.profile.language}</span>
          <select
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
            onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value as "pt-PT" | "en" })}
            value={form.preferredLanguage}
          >
            <option value="pt-PT">PT</option>
            <option value="en">EN</option>
          </select>
        </label>
        <TextField label={s.profile.role} onChange={() => {}} readOnly value={form.role} />
        {feedback ? <p className="md:col-span-2 text-sm text-emerald-300">{feedback}</p> : null}
        <div className="md:col-span-2">
          <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white" type="submit">{s.save}</button>
        </div>
      </form>
    </Panel>
  );
}

function SendersSection({ locale, s }: { locale: Locale; s: Dictionary["settings"] }) {
  const { state, tenantId, notifyDataChanged } = usePersistence();
  const { identities, loading, reload } = useSenderIdentities();
  const { profile: company } = useCompanyProfile();
  const { profile: user } = useCurrentUserProfile();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "failed">("idle");

  const preview = useMemo(() => {
    const identity = identities.find((i) => i.id === previewId);
    if (!identity || !company) return null;
    return renderSignature(identity, company, locale);
  }, [identities, previewId, company, locale]);

  async function addSender() {
    if (state.status !== "ready" || !company || !user) return;
    await state.repos.senderIdentities.create(tenantId, {
      active: true,
      companyProfileId: company.id,
      defaultLanguage: locale,
      displayName: user.fullName,
      fromEmail: user.email,
      isDefault: identities.length === 0,
      jobTitle: user.jobTitle,
      phone: user.phone,
      replyToEmail: user.email,
      signatureHtml: "",
      signatureText: "",
      userProfileId: user.id
    });
    notifyDataChanged();
    await reload();
    setFeedback(s.senders.created);
  }

  if (loading) return <Panel title={s.sections.senders}><p className="text-sm text-slate-400">{s.loading}</p></Panel>;

  return (
    <Panel title={s.sections.senders}>
      <div className="mb-4 flex justify-end">
        <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white" onClick={() => void addSender()} type="button">
          {s.senders.add}
        </button>
      </div>
      <div className="space-y-3">
        {identities.map((identity) => (
          <SenderIdentityEditor
            company={company}
            feedback={feedback}
            identity={identity}
            isEditing={editingId === identity.id}
            key={identity.id}
            locale={locale}
            onPreview={() => setPreviewId(identity.id)}
            onSaved={async (message) => {
              setFeedback(message);
              notifyDataChanged();
              await reload();
            }}
            onStartEdit={() => {
              setEditingId(identity.id);
              setSaveState("idle");
            }}
            onStopEdit={() => setEditingId(null)}
            saveState={editingId === identity.id ? saveState : "idle"}
            s={s}
            setSaveState={setSaveState}
            state={state}
            tenantId={tenantId}
          />
        ))}
      </div>
      {preview ? (
        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900 p-4">
          <div className="text-xs uppercase text-slate-500">{s.senders.signaturePreview}</div>
          <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{preview.plainText}</pre>
        </div>
      ) : null}
      {feedback ? <p className="mt-3 text-sm text-emerald-300">{feedback}</p> : null}
    </Panel>
  );
}

function SenderIdentityEditor({
  identity,
  company,
  isEditing,
  locale,
  onPreview,
  onSaved,
  onStartEdit,
  onStopEdit,
  saveState,
  setSaveState,
  s,
  state,
  tenantId
}: {
  identity: SenderIdentity;
  company: CompanyProfile | null;
  isEditing: boolean;
  locale: Locale;
  onPreview: () => void;
  onSaved: (message: string) => Promise<void>;
  onStartEdit: () => void;
  onStopEdit: () => void;
  saveState: "idle" | "saving" | "saved" | "failed";
  setSaveState: (value: "idle" | "saving" | "saved" | "failed") => void;
  s: Dictionary["settings"];
  state: ReturnType<typeof usePersistence>["state"];
  tenantId: string;
  feedback: string | null;
}) {
  const [form, setForm] = useState(identity);

  async function saveIdentity(e: FormEvent) {
    e.preventDefault();
    if (state.status !== "ready") return;
    setSaveState("saving");
    try {
      const updated = await state.repos.senderIdentities.update(tenantId, form.id, {
        displayName: form.displayName.trim(),
        fromEmail: form.fromEmail.trim(),
        replyToEmail: form.replyToEmail.trim(),
        phone: form.phone.trim(),
        jobTitle: form.jobTitle.trim()
      });
      const reloaded = await state.repos.senderIdentities.getById(tenantId, updated.id);
      if (
        reloaded?.displayName !== form.displayName.trim() ||
        reloaded?.fromEmail !== form.fromEmail.trim()
      ) {
        setSaveState("failed");
        return;
      }
      setSaveState("saved");
      onStopEdit();
      await onSaved(s.senders.saved);
    } catch {
      setSaveState("failed");
    }
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4" data-testid={`sender-identity-${identity.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-semibold">{identity.displayName}</div>
          <div className="text-sm text-slate-400">{identity.fromEmail}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {identity.isDefault ? <Badge>{s.senders.defaultBadge}</Badge> : null}
          {!identity.active ? <Badge>{s.senders.inactive}</Badge> : null}
          <button className="text-sm text-blue-300" onClick={onPreview} type="button">{s.senders.preview}</button>
          {!isEditing ? (
            <button
              className="text-sm text-slate-300"
              onClick={() => {
                setForm(identity);
                onStartEdit();
              }}
              type="button"
            >
              {s.save}
            </button>
          ) : null}
          {!identity.isDefault ? (
            <button
              className="text-sm text-slate-300"
              onClick={async () => {
                if (state.status !== "ready") return;
                await state.repos.senderIdentities.setDefault(tenantId, identity.id);
                await onSaved(s.senders.saved);
              }}
              type="button"
            >
              {s.senders.setDefault}
            </button>
          ) : null}
          <button
            className="text-sm text-slate-300"
            onClick={async () => {
              if (state.status !== "ready") return;
              await state.repos.senderIdentities.archive(tenantId, identity.id);
              await onSaved(s.senders.archived);
            }}
            type="button"
          >
            {s.senders.archive}
          </button>
        </div>
      </div>
      {isEditing ? (
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={saveIdentity}>
          <TextField label={s.senders.displayName} onChange={(v) => setForm({ ...form, displayName: v })} value={form.displayName} />
          <TextField label={s.senders.fromEmail} onChange={(v) => setForm({ ...form, fromEmail: v })} value={form.fromEmail} />
          <TextField label={s.senders.replyToEmail} onChange={(v) => setForm({ ...form, replyToEmail: v })} value={form.replyToEmail} />
          <TextField label={s.senders.phone} onChange={(v) => setForm({ ...form, phone: v })} value={form.phone} />
          <TextField label={s.senders.jobTitle} onChange={(v) => setForm({ ...form, jobTitle: v })} value={form.jobTitle} />
          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white" type="submit">
              {saveState === "saving" ? s.saving : s.save}
            </button>
            <button className="rounded-lg border border-slate-700 px-4 py-2 text-sm" onClick={onStopEdit} type="button">
              Cancelar
            </button>
            {saveState === "saved" ? <span className="text-sm text-emerald-300">{s.saved}</span> : null}
            {saveState === "failed" ? <span className="text-sm text-red-300">{s.saveFailed}</span> : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}

function TeamSection({ s }: { s: Dictionary["settings"] }) {
  const { state, tenantId, notifyDataChanged } = usePersistence();
  const { profiles, loading, reload } = useUserProfiles();
  const [feedback, setFeedback] = useState<string | null>(null);

  async function addPreviewUser() {
    if (state.status !== "ready") return;
    await state.repos.userProfiles.create(tenantId, {
      active: true,
      email: `preview${profiles.length + 1}@demo.local`,
      fullName: `Preview User ${profiles.length + 1}`,
      isLocalPreview: true,
      jobTitle: "Comercial",
      phone: "",
      preferredLanguage: "pt-PT",
      profileImageLocalAssetId: null,
      role: "sales"
    });
    notifyDataChanged();
    await reload();
    setFeedback(s.team.added);
  }

  if (loading) return <Panel title={s.sections.team}><p className="text-sm text-slate-400">{s.loading}</p></Panel>;

  return (
    <Panel title={s.sections.team}>
      <p className="mb-4 text-sm text-slate-400">{s.team.notice}</p>
      <button className="mb-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white" onClick={() => void addPreviewUser()} type="button">
        {s.team.add}
      </button>
      <div className="space-y-2">
        {profiles.map((user) => (
          <div className="flex items-center justify-between rounded-lg border border-slate-800 p-3" key={user.id}>
            <div>
              <div className="font-semibold">{user.fullName}</div>
              <div className="text-sm text-slate-400">{user.email} · {user.role}</div>
            </div>
            <div className="flex items-center gap-2">
              {user.isLocalPreview ? <Badge>{s.team.localPreview}</Badge> : null}
              <Badge>{user.active ? s.team.active : s.team.inactive}</Badge>
            </div>
          </div>
        ))}
      </div>
      {feedback ? <p className="mt-3 text-sm text-emerald-300">{feedback}</p> : null}
    </Panel>
  );
}

function IntegrationsSection({
  dictionary,
  s
}: {
  dictionary: Dictionary;
  s: Dictionary["settings"];
}) {
  const cards = getClientIntegrationCards();
  const [diag, setDiag] = useState<string | null>(null);
  const [hostedCard, setHostedCard] = useState<IntegrationCard | null>(null);

  return (
    <Panel title={s.sections.integrations}>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <IntegrationCardView
            card={card}
            key={card.id}
            onDiagnostic={() => {
              if (card.status === "hosted-feature") {
                setHostedCard(card);
                return;
              }
              setDiag(`${card.name}: ${card.status} — ${card.detail}`);
            }}
            s={s}
          />
        ))}
      </div>
      <ProviderDiagnosticPanel s={s} />
      {diag ? <p className="mt-4 text-sm text-slate-300">{diag}</p> : null}
      <HostedFeaturesDialog card={hostedCard} dictionary={dictionary} onClose={() => setHostedCard(null)} />
    </Panel>
  );
}

function ProviderDiagnosticPanel({ s }: { s: Dictionary["settings"] }) {
  const t = s.integrations.provider;
  const { state, tenantId } = usePersistence();
  const [diagnostic, setDiagnostic] = useState<EmailProviderDiagnostic | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState(t.defaultSubject);
  const [messageBody, setMessageBody] = useState(t.defaultBody);
  const [confirmation, setConfirmation] = useState("");
  const [sending, setSending] = useState(false);
  const [selfTestResult, setSelfTestResult] = useState<EmailDeliverySelfTestResult | null>(null);
  const [selfTestFeedback, setSelfTestFeedback] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/leadops/email-provider/diagnostic", {
        method: "GET"
      });
      if (!response.ok) throw new Error("diagnostic_failed");
      const payload = (await response.json()) as EmailProviderDiagnostic;
      setDiagnostic(payload);
      if (!recipientEmail && payload.configuredTestRecipientEmail) {
        setRecipientEmail(payload.configuredTestRecipientEmail);
      }
    } catch {
      setError(t.unavailable);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- provider diagnostic is loaded from an external API on mount
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load diagnostic once on panel mount
  }, []);

  async function submitSelfTest(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setSelfTestResult(null);
    setSelfTestFeedback(null);
    try {
      const response = await fetch("/api/leadops/email-provider/self-test", {
        body: JSON.stringify({
          confirmation,
          initiatedBy: "settings-self-test",
          messageBody,
          recipientEmail,
          subject
        }),
        headers: { "content-type": "application/json" },
        method: "POST"
      });
      const payload = (await response.json()) as EmailDeliverySelfTestResult & { error?: string };
      setSelfTestResult(payload);
      if (state.status === "ready") {
        await persistEmailDeliverySelfTestResult(state.repos, tenantId, {
          initiatedBy: "settings-self-test",
          messageBody,
          recipientEmail,
          subject
        }, payload);
        setSelfTestFeedback(t.savedLocally);
      }
      if (payload.status === "accepted") {
        setSelfTestFeedback(`${t.resultAccepted} ${t.savedLocally}`);
      } else if (payload.status === "blocked") {
        setSelfTestFeedback(`${t.resultBlocked}: ${payload.errorMessage ?? payload.errorCode ?? response.status}`);
      } else if (payload.status === "failed") {
        setSelfTestFeedback(`${t.resultFailed}: ${payload.errorMessage ?? payload.errorCode ?? response.status}`);
      }
    } catch {
      setSelfTestFeedback(t.unavailable);
    } finally {
      setSending(false);
    }
  }

  const gmailStatus =
    diagnostic?.emailDeliveryProvider === "gmail"
      ? diagnostic.gmailConfigured
        ? t.yes
        : t.notConfiguredYet
      : t.notConfiguredYet;
  const outlookStatus =
    diagnostic?.emailDeliveryProvider === "outlook"
      ? diagnostic.outlookConfigured
        ? t.yes
        : t.notConfiguredYet
      : t.notConfiguredYet;

  return (
    <article className="mt-4 rounded-lg border border-slate-800 bg-slate-950/40 p-4" data-testid="email-delivery-diagnostics">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{t.title}</h3>
          <p className="mt-1 text-sm text-slate-400">{t.description}</p>
        </div>
        <button className="text-sm text-blue-300" onClick={() => void refresh()} type="button">
          {t.refresh}
        </button>
      </div>
      {loading ? <p className="mt-3 text-sm text-slate-400">{t.loading}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      {diagnostic ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <DiagnosticRow label={t.emailDeliveryProvider} value={diagnostic.emailDeliveryProvider} />
          <DiagnosticRow label={t.outreachDeliveryProvider} value={diagnostic.outreachDeliveryProvider} />
          <DiagnosticRow label={t.provider} value={diagnostic.provider} />
          <DiagnosticRow label={t.configured} value={diagnostic.configured ? t.yes : t.no} />
          <DiagnosticRow label={t.realSend} value={diagnostic.realSendEnabled ? t.yes : t.no} />
          <DiagnosticRow label={t.testSend} value={diagnostic.testSendEnabled ? t.yes : t.no} />
          <DiagnosticRow label={t.apiKey} value={diagnostic.apiKeyPresent ? t.yes : t.no} />
          <DiagnosticRow
            label={t.apiKeyRedacted}
            value={diagnostic.brevoApiKeyRedacted ?? t.no}
          />
          <DiagnosticRow label={t.senderEmail} value={diagnostic.senderEmail ?? t.no} />
          <DiagnosticRow label={t.senderName} value={diagnostic.senderName ?? t.no} />
          <DiagnosticRow label={t.gmail} value={gmailStatus} />
          <DiagnosticRow label={t.outlook} value={outlookStatus} />
          <DiagnosticRow
            label={t.allowlist}
            value={`${diagnostic.allowlistConfigured ? t.yes : t.no} (${diagnostic.allowlistCount})`}
          />
          <DiagnosticRow
            label={t.missing}
            value={diagnostic.missing.length > 0 ? diagnostic.missing.join(", ") : t.no}
          />
          {diagnostic.warnings.length > 0 ? (
            <p className="md:col-span-2 text-sm text-amber-300">
              {t.warnings}: {diagnostic.warnings.join(" ")}
            </p>
          ) : null}
        </div>
      ) : null}

      <form className="mt-6 grid gap-3 border-t border-slate-800 pt-4" onSubmit={submitSelfTest}>
        <div>
          <h4 className="font-semibold">{t.selfTestTitle}</h4>
          <p className="mt-1 text-sm text-slate-400">{t.selfTestDescription}</p>
        </div>
        <TextField label={t.recipientEmail} onChange={setRecipientEmail} value={recipientEmail} />
        <TextField label={t.subject} onChange={setSubject} value={subject} />
        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-slate-500">{t.messageBody}</span>
          <textarea
            className="min-h-24 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            onChange={(event) => setMessageBody(event.target.value)}
            value={messageBody}
          />
        </label>
        <TextField label={t.confirmation} onChange={setConfirmation} value={confirmation} />
        <div>
          <button
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            disabled={sending || !diagnostic?.testSendEnabled}
            type="submit"
          >
            {sending ? t.sending : t.sendSelfTest}
          </button>
        </div>
        {selfTestFeedback ? <p className="text-sm text-slate-300">{selfTestFeedback}</p> : null}
        {selfTestResult ? (
          <pre className="overflow-x-auto rounded-md border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-200">
            {JSON.stringify(
              {
                errorCode: selfTestResult.errorCode,
                errorMessage: selfTestResult.errorMessage,
                mode: selfTestResult.mode,
                provider: selfTestResult.provider,
                providerMessageId: selfTestResult.providerMessageId,
                status: selfTestResult.status
              },
              null,
              2
            )}
          </pre>
        ) : null}
      </form>
    </article>
  );
}

function DiagnosticRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/50 px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-100">{value}</div>
    </div>
  );
}

function IntegrationCardView({
  card,
  onDiagnostic,
  s
}: {
  card: IntegrationCard;
  onDiagnostic: () => void;
  s: Dictionary["settings"];
}) {
  const statusColors: Record<string, string> = {
    configured: "text-emerald-300",
    "hosted-feature": "text-blue-300",
    "local-only": "text-amber-300",
    "not-configured": "text-slate-400",
    unavailable: "text-red-300"
  };
  return (
    <article className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
      <div className="font-semibold">{card.name}</div>
      <div className={`mt-1 text-xs font-semibold uppercase ${statusColors[card.status] ?? ""}`}>
        {s.integrations.statuses[card.status] ?? card.status}
      </div>
      <p className="mt-2 text-sm text-slate-400">{card.description}</p>
      <p className="mt-1 text-xs text-slate-500">{card.detail}</p>
      <button className="mt-3 text-sm text-blue-300" onClick={onDiagnostic} type="button">
        {s.integrations.diagnostic}
      </button>
    </article>
  );
}

function BackupSection({ s }: { s: Dictionary["settings"] }) {
  const {
    state,
    tenantId,
    notifyDataChanged,
    refresh,
    resetDemoData,
    clearAllLocalData,
    restoreDeterministicDemoState,
    localDbName
  } = usePersistence();
  const [feedback, setFeedback] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  async function downloadBackup() {
    if (state.status !== "ready") return;
    const backup = await exportBackup(state.repos, tenantId, true);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forgeos-backup-${tenantId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    await state.repos.meta.set("lastBackupExportedAt", new Date().toISOString());
    notifyDataChanged();
    setFeedback(s.backup.exported);
  }

  async function handleImport(file: File) {
    if (state.status !== "ready") return;
    const text = await file.text();
    let data: unknown;
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      setFeedback(s.backup.invalid);
      return;
    }
    if (!validateBackup(data)) {
      setFeedback(s.backup.invalid);
      return;
    }
    if (!isBackupSchemaCompatible(data)) {
      setFeedback(s.backup.incompatible);
      return;
    }
    await importBackup(state.repos, data);
    await refresh();
    notifyDataChanged();
    setFeedback(s.backup.imported);
  }

  async function runConfirmed(action: () => Promise<void>, confirmMessage: string, doneMessage: string) {
    if (!window.confirm(confirmMessage)) return;
    await action();
    await refresh();
    notifyDataChanged();
    setFeedback(doneMessage);
  }

  return (
    <Panel title={s.sections.backup}>
      <p className="mb-2 text-sm text-slate-400">{s.backup.description}</p>
      <p className="mb-4 text-xs text-slate-500">
        {s.backup.activeDbName}: <code className="text-slate-300">{localDbName}</code>
      </p>
      <div className="flex flex-wrap gap-3">
        <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white" onClick={() => void downloadBackup()} type="button">
          {s.backup.export}
        </button>
        <input accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && void handleImport(e.target.files[0])} ref={importRef} type="file" />
        <button className="rounded-lg border border-slate-700 px-4 py-2 text-sm" onClick={() => importRef.current?.click()} type="button">
          {s.backup.import}
        </button>
        <button
          className="rounded-lg border border-amber-700 px-4 py-2 text-sm text-amber-200"
          onClick={() =>
            void runConfirmed(
              () => resetDemoData(),
              s.backup.resetDemoConfirm,
              s.backup.resetDemoDone
            )
          }
          type="button"
        >
          {s.backup.resetDemo}
        </button>
        <button
          className="rounded-lg border border-red-800 px-4 py-2 text-sm text-red-200"
          onClick={() =>
            void runConfirmed(() => clearAllLocalData(), s.backup.clearAllConfirm, s.backup.clearAllDone)
          }
          type="button"
        >
          {s.backup.clearAll}
        </button>
        <button
          className="rounded-lg border border-blue-800 px-4 py-2 text-sm text-blue-200"
          onClick={() =>
            void runConfirmed(
              () => restoreDeterministicDemoState(),
              s.backup.restoreDemoConfirm,
              s.backup.restoreDemoDone
            )
          }
          type="button"
        >
          {s.backup.restoreDemo}
        </button>
      </div>
      {feedback ? <p className="mt-3 text-sm text-emerald-300">{feedback}</p> : null}
    </Panel>
  );
}

function Panel({ children, title }: { children: React.ReactNode; title: string }) {
  return <article className={`${panelClass} p-5`}><h2 className="text-lg font-bold">{title}</h2><div className="mt-4">{children}</div></article>;
}

function TextField({
  label,
  value,
  onChange,
  readOnly
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <input
        className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 disabled:opacity-60"
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        value={value}
      />
    </label>
  );
}

function AboutSection({ locale, s }: { locale: Locale; s: Dictionary["settings"] }) {
  const persistenceMode = readPersistenceMode();
  const databaseName =
    typeof window !== "undefined"
      ? window.localStorage.getItem("forgeos:persistence:db-name") ?? DEMO_DB_NAME
      : DEMO_DB_NAME;

  return (
    <Panel title={s.about.title}>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">{s.about.applicationVersion}</dt>
          <dd className="mt-1 font-semibold text-slate-100">ForgeOS v{APP_VERSION}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">{s.about.persistenceMode}</dt>
          <dd className="mt-1 font-semibold text-slate-100">{persistenceMode}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">{s.about.schemaVersion}</dt>
          <dd className="mt-1 font-semibold text-slate-100">{SCHEMA_VERSION}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">{s.about.seedVersion}</dt>
          <dd className="mt-1 font-semibold text-slate-100">{SEED_VERSION}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-wide text-slate-500">{s.about.databaseName}</dt>
          <dd className="mt-1 font-mono text-xs text-slate-200">{databaseName}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm text-slate-400">{s.about.releaseNotes}</p>
      <p className="mt-2 text-xs text-slate-500">
        {locale === "pt-PT" ? "Documentação:" : "Documentation:"}{" "}
        <code className="text-slate-300">docs/releases/0.2.0.md</code>
      </p>
    </Panel>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs">{children}</span>;
}
