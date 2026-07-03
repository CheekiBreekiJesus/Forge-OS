import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildJhGomesMailStaticDiagnostic,
  readJhGomesMailConfig
} from "@/features/jh-gomes-mail/config";
import {
  validateImapConfiguration,
  validateSmtpConfiguration
} from "@/features/mailbox-connector/config-validation";
import { readPort } from "@/features/mailbox-connector/config-parsing";
import {
  containsSecret,
  redactCredentialsInText,
  sanitizeErrorMessage
} from "@/features/mailbox-connector/redaction";
import { verifyImapConnection } from "@/features/mailbox-connector/imap-verifier";
import { verifySmtpConnection } from "@/features/mailbox-connector/smtp-verifier";

const baseEnv = {
  JHGOMES_IMAP_HOST: "mail.jhgomes.com",
  JHGOMES_IMAP_PASSWORD: "imap-secret-password",
  JHGOMES_IMAP_PORT: "993",
  JHGOMES_IMAP_SECURE: "true",
  JHGOMES_IMAP_USERNAME: "comercial@jhgomes.com",
  JHGOMES_MAIL_CONNECTION_TEST_ENABLED: "true",
  JHGOMES_MAIL_ENABLED: "true",
  JHGOMES_MAIL_LIVE_SEND_ENABLED: "false",
  JHGOMES_MAIL_READ_SYNC_ENABLED: "false",
  JHGOMES_SMTP_HOST: "mail.jhgomes.com",
  JHGOMES_SMTP_PASSWORD: "smtp-secret-password",
  JHGOMES_SMTP_PORT: "465",
  JHGOMES_SMTP_SECURE: "true",
  JHGOMES_SMTP_USERNAME: "comercial@jhgomes.com"
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("JH Gomes mail configuration", () => {
  it("defaults connector and live features to disabled", () => {
    const config = readJhGomesMailConfig({});
    const diagnostic = buildJhGomesMailStaticDiagnostic(config);

    expect(config.enabled).toBe(false);
    expect(config.connectionTestEnabled).toBe(false);
    expect(config.liveSendEnabled).toBe(false);
    expect(config.readSyncEnabled).toBe(false);
    expect(diagnostic.smtp.passwordPresent).toBe(false);
    expect(diagnostic.imap.passwordPresent).toBe(false);
  });

  it("maps environment without exposing password values", () => {
    const config = readJhGomesMailConfig(baseEnv);
    const diagnostic = buildJhGomesMailStaticDiagnostic(config);

    expect(config.smtp.port).toBe(465);
    expect(config.smtp.secure).toBe(true);
    expect(config.imap.port).toBe(993);
    expect(config.imap.secure).toBe(true);
    expect(diagnostic.smtp.passwordPresent).toBe(true);
    expect(JSON.stringify(diagnostic)).not.toContain("smtp-secret-password");
    expect(JSON.stringify(diagnostic)).not.toContain("imap-secret-password");
  });

  it("reports missing password in static diagnostic", () => {
    const config = readJhGomesMailConfig({
      ...baseEnv,
      JHGOMES_IMAP_PASSWORD: "",
      JHGOMES_SMTP_PASSWORD: ""
    });
    const diagnostic = buildJhGomesMailStaticDiagnostic(config);

    expect(diagnostic.smtp.configurationValid).toBe(false);
    expect(diagnostic.imap.configurationValid).toBe(false);
    expect(diagnostic.smtp.missing).toContain("JHGOMES_SMTP_PASSWORD");
    expect(diagnostic.imap.missing).toContain("JHGOMES_IMAP_PASSWORD");
  });

  it("rejects invalid port values", () => {
    expect(readPort("70000", 465)).toBeNull();
    const smtp = validateSmtpConfiguration({
      host: "mail.jhgomes.com",
      password: "secret",
      port: 70000,
      secure: true,
      username: "comercial@jhgomes.com"
    });
    expect(smtp.configurationValid).toBe(false);
    expect(smtp.missing).toContain("port");
  });

  it("rejects invalid hostnames", () => {
    const imap = validateImapConfiguration({
      host: "not a valid host!!!",
      password: "secret",
      port: 993,
      secure: true,
      username: "comercial@jhgomes.com"
    });
    expect(imap.configurationValid).toBe(false);
    expect(imap.missing).toContain("host");
  });

  it("expects secure mode for SMTP port 465 and IMAP port 993", () => {
    const smtpMismatch = validateSmtpConfiguration({
      host: "mail.jhgomes.com",
      password: "secret",
      port: 465,
      secure: false,
      username: "comercial@jhgomes.com"
    });
    const imapMismatch = validateImapConfiguration({
      host: "mail.jhgomes.com",
      password: "secret",
      port: 993,
      secure: false,
      username: "comercial@jhgomes.com"
    });

    expect(smtpMismatch.configurationValid).toBe(false);
    expect(imapMismatch.configurationValid).toBe(false);
  });
});

describe("SMTP verification", () => {
  it("verifies SMTP without invoking sendMail", async () => {
    const verify = vi.fn().mockResolvedValue(true);
    const close = vi.fn();

    const result = await verifySmtpConnection(
      {
        host: "mail.jhgomes.com",
        password: "smtp-secret-password",
        port: 465,
        secure: true,
        username: "comercial@jhgomes.com"
      },
      {
        transportFactory: () => ({ close, verify })
      }
    );

    expect(verify).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
    expect(result.stages.every((stage) => stage.valid)).toBe(true);
  });

  it("reports SMTP authentication failures without leaking credentials", async () => {
    const result = await verifySmtpConnection(
      {
        host: "mail.jhgomes.com",
        password: "smtp-secret-password",
        port: 465,
        secure: true,
        username: "comercial@jhgomes.com"
      },
      {
        transportFactory: () => ({
          close: vi.fn(),
          verify: vi.fn().mockRejectedValue(new Error("Invalid login smtp-secret-password"))
        })
      }
    );

    const authStage = result.stages.find((stage) => stage.stage === "authentication");
    expect(authStage?.valid).toBe(false);
    expect(JSON.stringify(result)).not.toContain("smtp-secret-password");
  });

  it("reports SMTP TLS failures clearly", async () => {
    const result = await verifySmtpConnection(
      {
        host: "mail.jhgomes.com",
        password: "secret",
        port: 465,
        secure: true,
        username: "comercial@jhgomes.com"
      },
      {
        transportFactory: () => ({
          close: vi.fn(),
          verify: vi
            .fn()
            .mockRejectedValue(new Error("unable to verify the first certificate"))
        })
      }
    );

    const tlsStage = result.stages.find((stage) => stage.stage === "tls");
    expect(tlsStage?.valid).toBe(false);
    expect(tlsStage?.message.toLowerCase()).toContain("certificate");
  });

  it("cleans up transport after SMTP failure", async () => {
    const close = vi.fn();
    await verifySmtpConnection(
      {
        host: "mail.jhgomes.com",
        password: "secret",
        port: 465,
        secure: true,
        username: "comercial@jhgomes.com"
      },
      {
        transportFactory: () => ({
          close,
          verify: vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED"))
        })
      }
    );
    expect(close).toHaveBeenCalledOnce();
  });
});

describe("IMAP verification", () => {
  it("lists folders read-only without mutation methods", async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    const list = vi.fn().mockResolvedValue([
      { delimiter: "/", flags: new Set(["\\HasNoChildren"]), path: "INBOX" }
    ]);

    const result = await verifyImapConnection(
      {
        host: "mail.jhgomes.com",
        password: "imap-secret-password",
        port: 993,
        secure: true,
        username: "comercial@jhgomes.com"
      },
      {
        clientFactory: () => ({
          connect: vi.fn().mockResolvedValue(undefined),
          list,
          logout
        })
      }
    );

    expect(list).toHaveBeenCalledOnce();
    expect(logout).toHaveBeenCalledOnce();
    expect(result.folders).toEqual([
      { delimiter: "/", flags: ["\\HasNoChildren"], path: "INBOX", specialUse: undefined }
    ]);
  });

  it("reports IMAP authentication failures without leaking credentials", async () => {
    const result = await verifyImapConnection(
      {
        host: "mail.jhgomes.com",
        password: "imap-secret-password",
        port: 993,
        secure: true,
        username: "comercial@jhgomes.com"
      },
      {
        clientFactory: () => ({
          connect: vi.fn().mockRejectedValue(new Error("Authentication failed imap-secret-password")),
          list: vi.fn(),
          logout: vi.fn().mockResolvedValue(undefined)
        })
      }
    );

    expect(result.stages.some((stage) => stage.stage === "authentication" && !stage.valid)).toBe(
      true
    );
    expect(JSON.stringify(result)).not.toContain("imap-secret-password");
  });

  it("reports IMAP TLS failures clearly", async () => {
    const result = await verifyImapConnection(
      {
        host: "mail.jhgomes.com",
        password: "secret",
        port: 993,
        secure: true,
        username: "comercial@jhgomes.com"
      },
      {
        clientFactory: () => ({
          connect: vi
            .fn()
            .mockRejectedValue(new Error("self signed certificate in certificate chain")),
          list: vi.fn(),
          logout: vi.fn().mockResolvedValue(undefined)
        })
      }
    );

    const tlsStage = result.stages.find((stage) => stage.stage === "tls");
    expect(tlsStage?.valid).toBe(false);
  });

  it("cleans up IMAP client after connection failure", async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    await verifyImapConnection(
      {
        host: "mail.jhgomes.com",
        password: "secret",
        port: 993,
        secure: true,
        username: "comercial@jhgomes.com"
      },
      {
        clientFactory: () => ({
          connect: vi.fn().mockRejectedValue(new Error("ETIMEDOUT connection timed out")),
          list: vi.fn(),
          logout
        })
      }
    );
    expect(logout).toHaveBeenCalledOnce();
  });
});

describe("credential redaction", () => {
  it("redacts secrets from error messages and logs", () => {
    const sanitized = sanitizeErrorMessage(new Error("login failed for smtp-secret-password"), [
      "smtp-secret-password"
    ]);
    expect(sanitized).not.toContain("smtp-secret-password");
    expect(sanitized).toContain("[REDACTED]");
    expect(containsSecret(sanitized, "smtp-secret-password")).toBe(false);
    expect(redactCredentialsInText("user smtp-secret-password end", ["smtp-secret-password"])).toBe(
      "user [REDACTED] end"
    );
  });
});
