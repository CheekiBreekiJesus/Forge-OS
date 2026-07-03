import type { TrustedSendJobActorContext } from "./send-job-actor-context";

export type SendJobPermission =
  | "send_job:view"
  | "send_job:view_errors"
  | "send_job:queue"
  | "send_job:process"
  | "send_job:pause"
  | "send_job:resume"
  | "send_job:cancel"
  | "send_job:retry";

export class SendJobAuthorizationError extends Error {
  constructor(
    public readonly permission: SendJobPermission,
    message = "Actor is not authorized for this send-job operation."
  ) {
    super(message);
    this.name = "SendJobAuthorizationError";
  }
}

const ALL_SEND_JOB_PERMISSIONS: SendJobPermission[] = [
  "send_job:view",
  "send_job:view_errors",
  "send_job:queue",
  "send_job:process",
  "send_job:pause",
  "send_job:resume",
  "send_job:cancel",
  "send_job:retry"
];

const ROLE_PERMISSIONS: Record<TrustedSendJobActorContext["roles"][number], SendJobPermission[]> = {
  company_owner: ALL_SEND_JOB_PERMISSIONS,
  marketing_manager: ALL_SEND_JOB_PERMISSIONS,
  outreach_operator: [
    "send_job:view",
    "send_job:queue",
    "send_job:process",
    "send_job:pause",
    "send_job:resume",
    "send_job:cancel",
    "send_job:retry"
  ],
  owner: ALL_SEND_JOB_PERMISSIONS,
  sales: ["send_job:view", "send_job:queue", "send_job:process", "send_job:pause", "send_job:resume"],
  super_admin: ALL_SEND_JOB_PERMISSIONS,
  viewer: ["send_job:view"]
};

export function hasSendJobPermission(
  actor: TrustedSendJobActorContext,
  permission: SendJobPermission
): boolean {
  return actor.roles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission));
}

export function requireSendJobPermission(
  actor: TrustedSendJobActorContext,
  permission: SendJobPermission
): void {
  if (!hasSendJobPermission(actor, permission)) {
    throw new SendJobAuthorizationError(permission);
  }
}
