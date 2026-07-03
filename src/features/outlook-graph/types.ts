export const OUTLOOK_GRAPH_SCOPES = [
  "openid",
  "profile",
  "offline_access",
  "User.Read",
  "Mail.Send"
] as const;

export type OutlookConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "expired"
  | "reconnect_required";

export type OutlookGraphErrorClassification =
  | "accepted"
  | "permanent_request_failure"
  | "reconnect_required"
  | "permission_failure"
  | "throttled"
  | "temporary_provider_failure"
  | "uncertain"
  | "blocked";

export type OutlookConnectionInfo = {
  status: OutlookConnectionStatus;
  mailboxAddress: string | null;
  displayName: string | null;
  grantedScopes: string[];
  lastValidatedAt: string | null;
  liveSendEnabled: boolean;
  graphEnabled: boolean;
};

export type OutlookApprovedSendPayload = {
  attemptId: string;
  campaignId: string;
  recipientId: string;
  approvedDraftVersion: string;
  senderSnapshot: Record<string, string | null>;
  recipientEmail: string;
  subject: string;
  renderedBody: string;
  bodyContentType: "HTML" | "Text";
  locale: string;
};

export type OutlookSendResult = {
  classification: OutlookGraphErrorClassification;
  httpStatus: number | null;
  providerMessageId: string | null;
  retryable: boolean;
  errorMessage: string | null;
};

export type CachedOutlookTokens = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
  accountId: string;
  homeAccountId: string | null;
  mailboxAddress: string | null;
  displayName: string | null;
  scopes: string[];
  cachedAt: string;
};

export type PendingOAuthSession = {
  state: string;
  codeVerifier: string;
  createdAt: number;
  expiresAt: number;
};
