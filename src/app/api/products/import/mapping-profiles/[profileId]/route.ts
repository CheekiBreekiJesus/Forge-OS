import { NextResponse } from "next/server";
import {
  deleteProductImportMappingProfile,
  updateProductImportMappingProfile
} from "@/application/product-import-service";
import type { ProductImportFieldKey } from "@/domain/product-import-types";
import { withProductImportAuth } from "@/app/api/products/import/_shared";

type RouteContext = { params: Promise<{ profileId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withProductImportAuth(request, async (session) => {
    const { profileId } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      sourceType?: string;
      sourceLabel?: string;
      worksheetPattern?: string;
      columnMappings?: Record<string, ProductImportFieldKey>;
    };
    const profile = await updateProductImportMappingProfile({
      columnMappings: body.columnMappings,
      name: body.name,
      profileId,
      session,
      sourceLabel: body.sourceLabel,
      sourceType: body.sourceType,
      worksheetPattern: body.worksheetPattern
    });
    return NextResponse.json({ profile });
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  return withProductImportAuth(request, async (session) => {
    const { profileId } = await context.params;
    await deleteProductImportMappingProfile({ profileId, session });
    return NextResponse.json({ ok: true });
  });
}
