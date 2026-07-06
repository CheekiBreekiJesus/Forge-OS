import type { EmailDeliveryProviderKey } from "@/domain/email-delivery-types";

export type OutreachCampaignLanguage = "pt-PT" | "en";

export type LastEmailTestResult = {
  testedAt: string;
  provider: EmailDeliveryProviderKey | string;
  senderEmail: string | null;
  senderName: string | null;
  recipientEmail: string;
  status: string;
  providerMessageId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
};

export type OutreachTestProfile = {
  id: string;
  tenantId: string;
  companyName: string;
  companyWebsite: string;
  senderDisplayName: string;
  senderEmail: string;
  replyToEmail: string;
  defaultTestRecipient: string;
  defaultSignature: string;
  defaultOptOutLine: string;
  defaultProductFocus: string;
  campaignLanguage: OutreachCampaignLanguage;
  lastEmailTestResult: LastEmailTestResult | null;
  createdAt: string;
  updatedAt: string;
};

export type UpsertOutreachTestProfileInput = Omit<
  OutreachTestProfile,
  "id" | "tenantId" | "createdAt" | "updatedAt" | "lastEmailTestResult"
> & {
  lastEmailTestResult?: LastEmailTestResult | null;
};
