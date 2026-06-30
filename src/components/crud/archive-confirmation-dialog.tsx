"use client";

import { PrimaryActionButton } from "./primary-action-button";

type ArchiveConfirmationDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirming?: boolean;
};

export function ArchiveConfirmationDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  confirming = false
}: ArchiveConfirmationDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4" data-testid="archive-confirmation-dialog">
      <button aria-label={cancelLabel} className="absolute inset-0 bg-black/70" onClick={onCancel} type="button" />
      <div className="relative w-full max-w-md rounded-lg border border-slate-700 bg-[#07101d] p-5 shadow-xl" role="alertdialog">
        <h2 className="text-lg font-bold text-slate-100">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">{message}</p>
        <div className="mt-5 flex gap-2">
          <PrimaryActionButton disabled={confirming} onClick={onConfirm}>
            {confirming ? "…" : confirmLabel}
          </PrimaryActionButton>
          <PrimaryActionButton disabled={confirming} onClick={onCancel} variant="secondary">
            {cancelLabel}
          </PrimaryActionButton>
        </div>
      </div>
    </div>
  );
}
