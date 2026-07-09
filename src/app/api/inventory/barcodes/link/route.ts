import { NextResponse } from "next/server";
import { linkBarcodeToItem } from "@/application/inventory-service";
import { withInventoryAuth } from "@/app/api/inventory/_shared";

export async function POST(request: Request) {
  return withInventoryAuth(request, async (session) => {
    const body = (await request.json()) as { itemId?: string; scannedValue?: string };
    if (!body.itemId || !body.scannedValue?.trim()) {
      return NextResponse.json({ error: "itemId and scannedValue are required." }, { status: 400 });
    }
    const result = await linkBarcodeToItem({
      itemId: body.itemId,
      scannedValue: body.scannedValue,
      session
    });
    return NextResponse.json({ result });
  });
}
