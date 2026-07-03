import type {
  MailConnectionStageResult,
  SmtpConnectionDiagnostic,
  SmtpMailboxConfig
} from "@/domain/mailbox-connector-types";
import { assertServerOnlyModule } from "@/features/email-delivery/server-only";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { sanitizeErrorMessage } from "./redaction";
import { validateSmtpConfiguration } from "./config-validation";

assertServerOnlyModule();

export type SmtpTransportFactory = (
  config: SmtpMailboxConfig
) => {
  verify(): Promise<true>;
  close(): void;
};

function classifySmtpError(error: unknown): {
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
    message.includes("invalid login") ||
    message.includes("auth") ||
    message.includes("535") ||
    message.includes("credentials")
  ) {
    return { stage: "authentication", errorCode: "authentication_failed" };
  }

  return { stage: "mailbox_access", errorCode: code || "smtp_verification_failed" };
}

export function createNodemailerTransportFactory(): SmtpTransportFactory {
  return (config: SmtpMailboxConfig) => {
    const transport = nodemailer.createTransport({
      auth: {
        pass: config.password,
        user: config.username
      },
      connectionTimeout: config.timeoutMs,
      greetingTimeout: config.timeoutMs,
      host: config.host,
      port: config.port,
      secure: config.secure,
      socketTimeout: config.timeoutMs,
      tls: {
        rejectUnauthorized: true
      }
    } satisfies SMTPTransport.Options);

    return {
      close() {
        transport.close();
      },
      verify() {
        return transport.verify();
      }
    };
  };
}

export async function verifySmtpConnection(
  input: Partial<SmtpMailboxConfig> & { timeoutMs?: number },
  options: { transportFactory?: SmtpTransportFactory } = {}
): Promise<SmtpConnectionDiagnostic> {
  const validation = validateSmtpConfiguration(input);
  const base: SmtpConnectionDiagnostic = {
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
  const transportFactory = options.transportFactory ?? createNodemailerTransportFactory();
  const transport = transportFactory(config);

  try {
    await transport.verify();
    base.stages.push(
      {
        stage: "dns_connectivity",
        valid: true,
        message: "SMTP host is reachable."
      },
      {
        stage: "tls",
        valid: true,
        message: "SMTP TLS handshake completed with certificate verification enabled."
      },
      {
        stage: "authentication",
        valid: true,
        message: "SMTP authentication succeeded."
      },
      {
        stage: "mailbox_access",
        valid: true,
        message: "SMTP server accepted the session without sending a message."
      }
    );
    return base;
  } catch (error) {
    const classified = classifySmtpError(error);
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
    transport.close();
  }
}