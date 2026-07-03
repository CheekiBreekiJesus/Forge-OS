import type {
  ImapConnectionDiagnostic,
  ImapMailboxConfig,
  MailConnectionStageResult
} from "@/domain/mailbox-connector-types";
import { assertServerOnlyModule } from "@/features/email-delivery/server-only";
import { ImapFlow } from "imapflow";
import { sanitizeErrorMessage } from "./redaction";
import { summarizeImapFolders, validateImapConfiguration } from "./config-validation";

assertServerOnlyModule();

export type ImapClientLike = {
  connect(): Promise<void>;
  logout(): Promise<void>;
  list(): Promise<
    Array<{
      path: string;
      delimiter: string;
      flags?: Set<string>;
      specialUse?: string;
    }>
  >;
};

export type ImapClientFactory = (config: ImapMailboxConfig) => ImapClientLike;

function classifyImapError(error: unknown): {
  stage: "dns_connectivity" | "tls" | "authentication" | "mailbox_access";
  errorCode: string;
} {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const code =
    error instanceof Error && "code" in error
      ? String((error as NodeJS.ErrnoException).code ?? "").toLowerCase()
      : "";

  if (
    code === "enotfound" ||
    code === "eai_again" ||
    code === "econnrefused" ||
    code === "etimedout" ||
    code === "esockettimedout" ||
    message.includes("getaddrinfo") ||
    message.includes("connection timed out") ||
    message.includes("connect econnrefused")
  ) {
    return { stage: "dns_connectivity", errorCode: code || "connectivity_failed" };
  }

  if (
    message.includes("certificate") ||
    message.includes("self signed") ||
    message.includes("unable to verify") ||
    message.includes("tls") ||
    message.includes("ssl") ||
    code === "depth_zero_self_signed_cert" ||
    code === "cert_has_expired"
  ) {
    return { stage: "tls", errorCode: code || "tls_verification_failed" };
  }

  if (
    message.includes("authentication") ||
    message.includes("invalid credentials") ||
    message.includes("auth") ||
    message.includes("no auth") ||
    message.includes("login failed")
  ) {
    return { stage: "authentication", errorCode: "authentication_failed" };
  }

  return { stage: "mailbox_access", errorCode: code || "imap_list_failed" };
}

export function createImapFlowClientFactory(): ImapClientFactory {
  return (config: ImapMailboxConfig) => {
    const client = new ImapFlow({
      auth: {
        pass: config.password,
        user: config.username
      },
      host: config.host,
      logger: false,
      port: config.port,
      secure: config.secure,
      tls: {
        rejectUnauthorized: true
      }
    });

    return {
      connect: () => client.connect(),
      list: () => client.list(),
      logout: () => client.logout()
    };
  };
}

export async function verifyImapConnection(
  input: Partial<ImapMailboxConfig> & { timeoutMs?: number },
  options: { clientFactory?: ImapClientFactory; listTimeoutMs?: number } = {}
): Promise<ImapConnectionDiagnostic> {
  const validation = validateImapConfiguration(input);
  const base: ImapConnectionDiagnostic = {
    configurationValid: validation.configurationValid,
    host: input.host?.trim() ?? "",
    passwordPresent: Boolean(input.password?.trim()),
    port: input.port ?? 0,
    secure: input.secure ?? false,
    stages: [...validation.stages],
    username: input.username?.trim() ?? ""
  };

  if (!validation.config) {
    return base;
  }

  const config = validation.config;
  const secrets = [config.password, config.username];
  const clientFactory = options.clientFactory ?? createImapFlowClientFactory();
  const client = clientFactory(config);
  const listTimeoutMs = options.listTimeoutMs ?? config.timeoutMs;

  try {
    await withTimeout(client.connect(), config.timeoutMs, "IMAP connect timed out.");
    base.stages.push(
      {
        stage: "dns_connectivity",
        valid: true,
        message: "IMAP host is reachable."
      },
      {
        stage: "tls",
        valid: true,
        message: "IMAP TLS handshake completed with certificate verification enabled."
      },
      {
        stage: "authentication",
        valid: true,
        message: "IMAP authentication succeeded."
      }
    );

    const mailboxes = await withTimeout(client.list(), listTimeoutMs, "IMAP mailbox listing timed out.");
    base.folders = summarizeImapFolders(mailboxes);
    base.stages.push({
      stage: "mailbox_access",
      valid: true,
      message: `Read-only mailbox listing returned ${base.folders.length} folder(s).`
    });
    return base;
  } catch (error) {
    const classified = classifyImapError(error);
    const message = sanitizeErrorMessage(error, secrets);
    const failureStage: MailConnectionStageResult = {
      errorCode: classified.errorCode,
      message,
      stage: classified.stage,
      valid: false
    };
    base.stages.push(failureStage);
    return base;
  } finally {
    await client.logout().catch(() => undefined);
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(message)), timeoutMs);
      })
    ]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}