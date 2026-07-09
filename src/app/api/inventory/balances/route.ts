import { NextResponse } from "next/server";
import { listStockBalances } from "@/application/inventory-service";
import { withInventoryAuth } from "@/app/api/inventory/_shared";

export async function GET(request: Request) {
  return withInventoryAuth(request, async (session) => {
    const url = new URL(request.url);
    const itemId = url.searchParams.get("itemId") ?? undefined;
    const balances = await listStockBalances(session, itemId);
    return NextResponse.json({ balances });
  });
}
