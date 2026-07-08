"use client";

import type { FormEvent, ReactNode } from "react";
import { PrimaryActionButton } from "./primary-action-button";

type EntityFormDrawerProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  cancelLabel: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  children: ReactNode;
  submitting?: boolean;
  wide?: boolean;
};

export function EntityFormDrawer({
  open,
  title,
  submitLabel,
  cancelLabel,
  onClose,
  onSubmit,
  children,
  submitting = false,
  wide = false
}: EntityFormDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" data-testid="entity-form-drawer">
      <button
        aria-label={cancelLabel}
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        type="button"
      />
      <div
        className={`relative flex h-full w-full flex-col border-l border-slate-700 bg-[#07101d] shadow-xl ${
          wide ? "max-w-2xl" : "max-w-lg"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="entity-form-drawer-title"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="text-lg font-bold" id="entity-form-drawer-title">
            {title}
          </h2>
          <button
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>
        <form className="flex flex-1 flex-col overflow-hidden" onSubmit={onSubmit}>
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">{children}</div>
          <div className="flex gap-2 border-t border-slate-800 px-5 py-4">
            <PrimaryActionButton disabled={submitting} type="submit">
              {submitting ? "…" : submitLabel}
            </PrimaryActionButton>
            <PrimaryActionButton disabled={submitting} onClick={onClose} type="button" variant="secondary">
              {cancelLabel}
            </PrimaryActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FormField({
  label,
  children,
  required
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}

export const inputClassName =
  "w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-orange-400 focus:ring-1";

export const selectClassName = inputClassName;

export const textareaClassName = `${inputClassName} min-h-[80px] resize-y`;
