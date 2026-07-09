import { NextResponse } from "next/server";
import { createReservation, releaseReservation } from "@/application/inventory-service";
import { withInventoryAuth } from "@/app/api/inventory/_shared";

export async function POST(request: Request) {
  return withInventoryAuth(request, async (session) => {
    const body = (await request.json()) as {
      action?: "create" | "release";
      itemId?: string;
      warehouseId?: string;
      locationId?: string;
      quantity?: number;
      unitCode?: string;
      sourceDocumentType?: string;
      sourceDocumentId?: string;
      lotId?: string | null;
      idempotencyKey?: string;
      reservationId?: string;
      status?: "released" | "consumed";
    };

    if (body.action === "release") {
      if (!body.reservationId) {
        return NextResponse.json({ error: "reservationId is required." }, { status: 400 });
      }
      const result = await releaseReservation({
        reservationId: body.reservationId,
        session,
        status: body.status
      });
      return NextResponse.json({ result });
    }

    if (
      !body.itemId ||
      !body.warehouseId ||
      !body.locationId ||
      !body.idempotencyKey ||
      body.quantity === undefined
    ) {
      return NextResponse.json({ error: "Missing reservation fields." }, { status: 400 });
    }

    const result = await createReservation({
      idempotencyKey: body.idempotencyKey,
      itemId: body.itemId,
      locationId: body.locationId,
      lotId: body.lotId,
      quantity: body.quantity,
      session,
      sourceDocumentId: body.sourceDocumentId,
      sourceDocumentType: body.sourceDocumentType,
      unitCode: body.unitCode,
      warehouseId: body.warehouseId
    });
    return NextResponse.json({ result });
  });
}
