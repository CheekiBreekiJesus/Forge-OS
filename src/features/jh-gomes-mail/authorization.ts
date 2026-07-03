import type { TrustedSendJobActorContext } from "@/features/email-delivery/send-job-actor-context";
import { assertServerOnlyModule } from "@/features/email-delivery/server-only";

assertServerOnlyModule();

export type JhGomesMailPermission = "integration:manage";

export class JhGomesMailAuthorizationError extends Error {
  constructor(
    public readonly permission: JhGomesMailPermission,
    message = "Actor is not authorized for this JH Gomes mail operation."
  ) {
    super(message);
    this.name = "JhGomesMailAuthorizationError";
  }
}

const INTEGRATION_MANAGE_ROLES: TrustedSendJobActorContext["roles"][number][] = [
  "super_admin",
  "company_owner",
  "marketing_manager",
  "owner"
];

export function hasJhGomesMailPermission(
  actor: TrustedSendJobActorContext,
  permission: JhGomesMailPermission
): boolean {
  if (permission === "integration:manage") {
    return (
      actor.permissions.includes(permission) ||
      actor.roles.some((role) => INTEGRATION_MANAGE_ROLES.includes(role))
    );
  }
  return false;
}

export function requireJhGomesMailPermission(
  actor: TrustedSendJobActorContext,
  permission: JhGomesMailPermission
): void {
  if (!hasJhGomesMailPermission(actor, permission)) {
    throw new JhGomesMailAuthorizationError(permission);
  }
}
