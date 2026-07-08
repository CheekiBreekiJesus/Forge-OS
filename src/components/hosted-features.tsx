"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import type { IntegrationCard } from "@/features/integrations/status";

type HostedFeaturesDialogProps = {
  card: IntegrationCard | null;
  dictionary: Dictionary;
  onClose: () => void;
};

export function HostedFeaturesDialog({ card, dictionary, onClose }: HostedFeaturesDialogProps) {
  const copy = dictionary.hostedFeatures;

  if (!card) return null;

  const featureCopy = copy.features[card.id as keyof typeof copy.features];

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <button aria-label={copy.close} className="absolute inset-0 bg-black/70" onClick={onClose} type="button" />
      <div
        className="relative w-full max-w-lg rounded-lg border border-slate-700 bg-[#07101d] p-6 shadow-xl"
        role="dialog"
      >
        <h2 className="text-lg font-bold">{featureCopy?.title ?? card.name}</h2>
        <p className="mt-2 text-sm text-slate-400">{featureCopy?.description ?? card.description}</p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-300">
          {(featureCopy?.requirements ?? [card.detail]).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-amber-300">{copy.localMvpNote}</p>
        <button
          className="mt-5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white"
          onClick={onClose}
          type="button"
        >
          {copy.close}
        </button>
      </div>
    </div>
  );
}
