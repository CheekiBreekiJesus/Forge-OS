import {
  buildJhGomesMailStaticDiagnostic,
  JhGomesMailConnectionTestError,
  runJhGomesMailConnectionTest
} from "@/features/jh-gomes-mail/config";
import { containsSecret } from "@/features/mailbox-connector/redaction";

async function main(): Promise<void> {
  const diagnostic = buildJhGomesMailStaticDiagnostic();
  console.log(JSON.stringify({ diagnostic }, null, 2));

  try {
    const result = await runJhGomesMailConnectionTest();
    const payload = JSON.stringify({ result }, null, 2);
    assertNoSecretsInPayload(payload);
    console.log(payload);
    const smtpOk = result.smtp.stages.every((stage) => stage.valid);
    const imapOk = result.imap.stages.every((stage) => stage.valid);
    if (!smtpOk || !imapOk) {
      process.exitCode = 1;
    }
  } catch (error) {
    if (error instanceof JhGomesMailConnectionTestError) {
      console.error(
        JSON.stringify(
          {
            error: {
              code: error.code,
              message: error.message
            }
          },
          null,
          2
        )
      );
      process.exitCode = 1;
      return;
    }
    throw error;
  }
}

function assertNoSecretsInPayload(payload: string): void {
  const secrets = [
    process.env.JHGOMES_SMTP_PASSWORD,
    process.env.JHGOMES_IMAP_PASSWORD
  ];
  for (const secret of secrets) {
    if (containsSecret(payload, secret)) {
      throw new Error("Connection test output leaked credential material.");
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unexpected connection test failure.");
  process.exitCode = 1;
});
