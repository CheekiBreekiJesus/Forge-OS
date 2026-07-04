"use client";

import type { CustomizerWorkflowStep } from "@/features/cup-customizer/workflow";
import type { Dictionary } from "@/i18n/dictionaries";

type CupCustomizerWorkflowNavProps = {
  activeStep: CustomizerWorkflowStep;
  completedSteps: Set<CustomizerWorkflowStep>;
  copy: Dictionary["customizerModule"]["workflow"];
  onStepChange: (step: CustomizerWorkflowStep) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
};

const STEP_ORDER: CustomizerWorkflowStep[] = [
  "product",
  "printing",
  "artwork",
  "preview",
  "quotation"
];

export function CupCustomizerWorkflowNav({
  activeStep,
  completedSteps,
  copy,
  onStepChange,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious
}: CupCustomizerWorkflowNavProps) {
  return (
    <div className="mb-4 xl:hidden">
      <nav aria-label={copy.navLabel}>
        <ol className="flex flex-wrap gap-2">
          {STEP_ORDER.map((step) => {
            const isActive = step === activeStep;
            const isComplete = completedSteps.has(step);
            return (
              <li key={step}>
                <button
                  aria-current={isActive ? "step" : undefined}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "bg-orange-500 text-white"
                      : isComplete
                        ? "bg-emerald-500/20 text-emerald-200"
                        : "bg-slate-800 text-slate-400"
                  }`}
                  onClick={() => onStepChange(step)}
                  type="button"
                >
                  {copy.steps[step]}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="sticky bottom-0 z-20 mt-4 flex gap-2 border-t border-slate-800 bg-slate-950/95 py-3 backdrop-blur">
        <button
          className="flex-1 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 disabled:opacity-40"
          disabled={!canGoPrevious}
          onClick={onPrevious}
          type="button"
        >
          {copy.previous}
        </button>
        <button
          className="flex-1 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          disabled={!canGoNext}
          onClick={onNext}
          type="button"
        >
          {copy.next}
        </button>
      </div>
    </div>
  );
}

export function shouldShowWorkflowSection(
  step: CustomizerWorkflowStep,
  activeStep: CustomizerWorkflowStep,
  isDesktop: boolean
): boolean {
  if (isDesktop) return true;
  return step === activeStep;
}
