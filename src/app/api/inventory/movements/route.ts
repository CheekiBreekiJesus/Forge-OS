import { NextResponse } from "next/server";
import { listMovementHistory } from "@/application/inventory-service";
import { withInventoryAuth } from "@/app/api/inventory/_shared";

export async function GET(request: Request) {
  return withInventoryAuth(request, async (session) => {
    const url = new URL(request.url);
    const itemId = url.searchParams.get("itemId");
    if (!itemId) {
      return NextResponse.json({ error: "itemId is required." }, { status: 400 });
    }
    const limit = Number(url.searchParams.get("limit") ?? "50");
    const movements = await listMovementHistory(session, itemId, limit);
    return NextResponse.json({ movements });
  });
}
