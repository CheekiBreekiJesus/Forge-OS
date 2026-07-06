import { describe, expect, it } from "vitest";
import { deriveActiveWorkflowStep } from "@/components/campaign-workflow-stepper";
import {
  CAMPAIGN_WORKFLOW_STEPS,
  MAX_QUEUE_INTERVAL_MINUTES,
  MIN_QUEUE_INTERVAL_MINUTES,
  validateQueueIntervalMinutes
} from "@/features/leadops/campaign-workflow";

describe("campaign workflow", () => {
  it("defines the MVP workflow order as draft, approve, queue, delivery", () => {
    expect(CAMPAIGN_WORKFLOW_STEPS).toEqual(["draft", "approve", "queue", "delivery"]);
  });

  it("keeps segment definition out of the primary workflow steps", () => {
    expect(CAMPAIGN_WORKFLOW_STEPS).not.toContain("segment");
    expect(CAMPAIGN_WORKFLOW_STEPS).not.toContain("segmentDefinition");
  });

  it("derives draft as the first active step before drafts exist", () => {
    expect(
      deriveActiveWorkflowStep({
        approvedCount: 0,
        hasDrafts: false,
        hasQueuedJob: false,
        includedCount: 3,
        jobCompleted: false
      })
    ).toBe("draft");
  });

  it("derives approve when drafts exist but not all are approved", () => {
    expect(
      deriveActiveWorkflowStep({
        approvedCount: 1,
        hasDrafts: true,
        hasQueuedJob: false,
        includedCount: 3,
        jobCompleted: false
      })
    ).toBe("approve");
  });

  it("derives queue when all included recipients are approved", () => {
    expect(
      deriveActiveWorkflowStep({
        approvedCount: 3,
        hasDrafts: true,
        hasQueuedJob: false,
        includedCount: 3,
        jobCompleted: false
      })
    ).toBe("queue");
  });

  it("derives delivery when a send job exists", () => {
    expect(
      deriveActiveWorkflowStep({
        approvedCount: 3,
        hasDrafts: true,
        hasQueuedJob: true,
        includedCount: 3,
        jobCompleted: false
      })
    ).toBe("delivery");
  });
});

describe("queue interval validation", () => {
  it("accepts zero and minute-based intervals up to 60 minutes", () => {
    expect(validateQueueIntervalMinutes(0)).toEqual({ delayMs: 0, valid: true });
    expect(validateQueueIntervalMinutes(5)).toEqual({ delayMs: 300_000, valid: true });
    expect(validateQueueIntervalMinutes(MAX_QUEUE_INTERVAL_MINUTES)).toEqual({
      delayMs: MAX_QUEUE_INTERVAL_MINUTES * 60_000,
      valid: true
    });
  });

  it("rejects intervals below the minimum and above the maximum", () => {
    expect(validateQueueIntervalMinutes(MIN_QUEUE_INTERVAL_MINUTES - 1)).toEqual({
      reason: "below_min",
      valid: false
    });
    expect(validateQueueIntervalMinutes(MAX_QUEUE_INTERVAL_MINUTES + 1)).toEqual({
      reason: "above_max",
      valid: false
    });
    expect(validateQueueIntervalMinutes(Number.NaN)).toEqual({
      reason: "not_finite",
      valid: false
    });
  });
});
