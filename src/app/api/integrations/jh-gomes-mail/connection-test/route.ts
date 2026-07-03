import { NextResponse } from "next/server";
import {
  JhGomesMailConnectionTestError,
  runJhGomesMailConnectionTest
} from "@/features/jh-gomes-mail/config";
import {
  guardJhGomesMailMutationRequest,
  JhGomesMailRouteGuardError,
  mapJhGomesMailGuardErrorStatus
} from "@/features/jh-gomes-mail/route-guard";
import { containsSecret } from "@/features/mailbox-connector/redaction";

const CONFIRMATION_PHRASE = "TEST MAIL CONNECTION";

type ConnectionTestBody = {
  confirmation?: unknown;
};

export async function POST(request: Request) {
  try {
    await guardJhGomesMailMutationRequest(request, "integration:manage");
    const body = (await request.json().catch(() => ({}))) as ConnectionTestBody;
    if (body.confirmation !== CONFIRMATION_PHRASE) {
      return NextResponse.json(
        {
          error: {
            code: "confirmation_required",
            message: `Connection test requires confirmation: "${CONFIRMATION_PHRASE}".`
          },
          ok: false
        },
        { status: 400 }
      );
    }

    const result = await runJhGomesMailConnectionTest();
    assertNoSecretsInPayload(JSON.stringify(result), process.env);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return mapConnectionTestError(error);
  }
}

function assertNoSecretsInPayload(payload: string, env: Record<string, string | undefined>): void {
  const secrets = [
    env.JHGOMES_SMTP_PASSWORD,
    env.JHGOMES_IMAP_PASSWORD,
    env.JHGOMES_SMTP_USERNAME,
    env.JHGOMES_IMAP_USERNAME
  ];
  for (const secret of secrets) {
    if (containsSecret(payload, secret)) {
      throw new Error("Connection test response leaked credential material.");
    }
  }
}

function mapConnectionTestError(error: unknown): NextResponse {
  if (error instanceof JhGomesMailRouteGuardError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message
        },
        ok: false
      },
      { status: mapJhGomesMailGuardErrorStatus(error.code) }
    );
  }
  if (error instanceof JhGomesMailConnectionTestError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message
        },
        ok: false
      },
      { status: 403 }
    );
  }
  return NextResponse.json(
    {
      error: {
        code: "internal_error",
        message: "Unexpected JH Gomes mail connection test error."
      },
      ok: false
    },
    { status: 500 }
  );
}

export { CONFIRMATION_PHRASE };
