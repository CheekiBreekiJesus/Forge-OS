export type SendJobRole =
  | "super_admin"
  | "company_owner"
  | "marketing_manager"
  | "outreach_operator"
  | "sales"
  | "owner"
  | "viewer";

export type TrustedSendJobActorContext = {
  userId: string;
  tenantId: string;
  roles: SendJobRole[];
  source: "development_headers" | "production_session";
  correlationId: string;
};

export class SendJobActorContextError extends Error {
  constructor(
    public readonly code: "authentication_required" | "production_auth_not_configured" | "invalid_actor_context",
    message: string
  ) {
    super(message);
    this.name = "SendJobActorContextError";
  }
}
