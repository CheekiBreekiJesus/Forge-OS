import { NextResponse } from "next/server";
import { ForgeOSAuthError } from "@/lib/auth/types";
import { assertTenantAccess, resolveForgeOSSession } from "@/lib/auth/session";
import { PersistenceError } from "@/persistence/interfaces";

export async function withInventoryAuth(
  request: Request,
  handler: (session: Awaited<ReturnType<typeof resolveForgeOSSession>>) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const session = await resolveForgeOSSession(request);
    assertTenantAccess(session, session.tenantId);
    return await handler(session);
  } catch (error) {
    if (error instanceof ForgeOSAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof PersistenceError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unexpected inventory error." }, { status: 500 });
  }
}
