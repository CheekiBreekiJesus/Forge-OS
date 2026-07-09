import { NextResponse } from "next/server";
import { postStockMovement } from "@/application/inventory-service";
import { withInventoryAuth } from "@/app/api/inventory/_shared";
import type { MobileMovementKind } from "@/features/inventory-mobile/offline-queue";

export async function POST(request: Request) {
  return withInventoryAuth(request, async (session) => {
    const body = (await request.json()) as {
      kind?: MobileMovementKind | "adjust_increase" | "adjust_decrease";
      itemId?: string;
      warehouseId?: string;
      locationId?: string;
      destinationLocationId?: string;
      quantity?: number;
      unitCode?: string;
      stockCondition?: string;
      destinationStockCondition?: string;
      lotId?: string | null;
      reasonCode?: string;
      notes?: string;
      allowNegative?: boolean;
      overrideReason?: string;
      idempotencyKey?: string;
    };

    if (
      !body.kind ||
      !body.itemId ||
      !body.warehouseId ||
      !body.locationId ||
      !body.idempotencyKey ||
      body.quantity === undefined
    ) {
      return NextResponse.json({ error: "Missing required movement fields." }, { status: 400 });
    }

    const result = await postStockMovement({
      allowNegative: body.allowNegative,
      destinationLocationId: body.destinationLocationId,
      destinationStockCondition: body.destinationStockCondition,
      idempotencyKey: body.idempotencyKey,
      itemId: body.itemId,
      kind: body.kind,
      locationId: body.locationId,
      lotId: body.lotId,
      notes: body.notes,
      overrideReason: body.overrideReason,
      quantity: body.quantity,
      reasonCode: body.reasonCode,
      session,
      stockCondition: body.stockCondition,
      unitCode: body.unitCode,
      warehouseId: body.warehouseId
    });

    return NextResponse.json({ result });
  });
}
