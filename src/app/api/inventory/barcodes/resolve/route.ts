import { NextResponse } from "next/server";
import { resolveBarcode } from "@/application/inventory-service";
import { withInventoryAuth } from "@/app/api/inventory/_shared";

export async function POST(request: Request) {
  return withInventoryAuth(request, async (session) => {
    const body = (await request.json()) as { scannedValue?: string };
    if (!body.scannedValue?.trim()) {
      return NextResponse.json({ error: "scannedValue is required." }, { status: 400 });
    }
    const result = await resolveBarcode(session, body.scannedValue);
    return NextResponse.json({ result });
  });
}
