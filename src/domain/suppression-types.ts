export type SuppressionReason =
  | "manual"
  | "unsubscribe"
  | "hard_bounce"
  | "complaint"
  | "invalid_address"
  | "duplicate"
  | "legal_request"
  | "other";

export type SuppressionSource =
  | "operator"
  | "import"
  | "campaign"
  | "lead_detail"
  | "system";

export type EmailSuppression = {
  id: string;
  tenantId: string;
  normalizedEmail: string;
  reason: SuppressionReason;
  source: SuppressionSource;
  campaignId: string | null;
  leadId: string | null;
  contactId: string | null;
  notes: string;
  createdBy: string;
  createdAt: string;
  removedBy: string | null;
  removedAt: string | null;
  removalReason: string | null;
  active: boolean;
};

export type CreateEmailSuppressionInput = {
  email: string;
  reason: SuppressionReason;
  source?: SuppressionSource;
  campaignId?: string | null;
  leadId?: string | null;
  contactId?: string | null;
  notes?: string;
  createdBy?: string;
};

export type RemoveEmailSuppressionInput = {
  removalReason: string;
  removedBy?: string;
  elevatedConfirmed?: boolean;
};

export const ELEVATED_REMOVAL_REASONS: SuppressionReason[] = ["unsubscribe", "legal_request"];
