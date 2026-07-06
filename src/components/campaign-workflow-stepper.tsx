"use client";

import React from "react";
import { CAMPAIGN_WORKFLOW_STEPS, type CampaignWorkflowStep } from "@/features/leadops/campaign-workflow";
import type { Dictionary } from "@/i18n/dictionaries";

type CampaignWorkflowStepperProps = {
  activeStep: CampaignWorkflowStep;
  dictionary: Dictionary;
};

export function CampaignWorkflowStepper({ activeStep, dictionary }: CampaignWorkflowStepperProps) {
  const copy = dictionary.leadops.campaigns.workflow;
  const activeIndex = CAMPAIGN_WORKFLOW_STEPS.indexOf(activeStep);

  return (
    <nav aria-label={copy.navLabel} className="mb-5" data-testid="campaign-workflow-stepper">
      <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {CAMPAIGN_WORKFLOW_STEPS.map((step, index) => {
          const isActive = step === activeStep;
          const isComplete = index < activeIndex;
          return (
            <li
              className={`rounded-lg border px-4 py-3 text-sm ${
                isActive
                  ? "border-orange-400 bg-orange-500/10 text-orange-100"
                  : isComplete
                    ? "border-green-500/40 bg-green-500/5 text-green-200"
                    : "border-slate-800 bg-slate-950 text-slate-400"
              }`}
              data-testid={`campaign-workflow-step-indicator-${step}`}
              key={step}
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {copy.stepNumber.replace("{number}", String(index + 1))}
              </p>
              <p className="mt-1 font-semibold">{copy.steps[step]}</p>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function deriveActiveWorkflowStep(input: {
  hasDrafts: boolean;
  approvedCount: number;
  includedCount: number;
  hasQueuedJob: boolean;
  jobCompleted: boolean;
}): CampaignWorkflowStep {
  if (input.jobCompleted || input.hasQueuedJob) return "delivery";
  if (input.approvedCount > 0 && input.approvedCount === input.includedCount) return "queue";
  if (input.hasDrafts) return "approve";
  return "draft";
}
