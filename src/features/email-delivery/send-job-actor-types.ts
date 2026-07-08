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
  permissions: string[];
  source: "development_headers" | "production_session";
  correlationId: string;
};

export type TrustedSendJobTenantMembership = {
  tenantId: string;
  roles: SendJobRole[];
  permissions: string[];
};

export type TrustedSendJobTenantMembershipList = {
  userId: string;
  memberships: TrustedSendJobTenantMembership[];
  source: TrustedSendJobActorContext["source"];
  correlationId: string;
};

export class SendJobActorContextError extends Error {
  constructor(
    public readonly code:
      | "authentication_required"
      | "production_auth_not_configured"
      | "tenant_membership_required"
      | "tenant_selection_required"
      | "invalid_actor_context",
    message: string
  ) {
    super(message);
    this.name = "SendJobActorContextError";
  }
}
