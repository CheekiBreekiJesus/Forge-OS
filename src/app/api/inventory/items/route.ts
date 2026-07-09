import { NextResponse } from "next/server";
import { listInventoryItems } from "@/application/inventory-service";
import { withInventoryAuth } from "@/app/api/inventory/_shared";

export async function GET(request: Request) {
  return withInventoryAuth(request, async (session) => {
    const items = await listInventoryItems(session);
    return NextResponse.json({ items });
  });
}
