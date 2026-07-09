import { NextResponse } from "next/server";
import { getInventoryItem } from "@/application/inventory-service";
import { withInventoryAuth } from "@/app/api/inventory/_shared";

type RouteContext = { params: Promise<{ itemId: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withInventoryAuth(request, async (session) => {
    const { itemId } = await context.params;
    const item = await getInventoryItem(session, itemId);
    if (!item) {
      return NextResponse.json({ error: "Item not found." }, { status: 404 });
    }
    return NextResponse.json({ item });
  });
}
