import { NextResponse } from "next/server";
import { listStockLocations } from "@/application/inventory-service";
import { withInventoryAuth } from "@/app/api/inventory/_shared";

export async function GET(request: Request) {
  return withInventoryAuth(request, async (session) => {
    const locations = await listStockLocations(session);
    return NextResponse.json({ locations });
  });
}
