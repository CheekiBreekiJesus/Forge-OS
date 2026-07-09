import { NextResponse } from "next/server";
import {
  createProductImportMappingProfile,
  listProductImportMappingProfiles
} from "@/application/product-import-service";
import type { ProductImportFieldKey } from "@/domain/product-import-types";
import { withProductImportAuth } from "@/app/api/products/import/_shared";

export async function GET(request: Request) {
  return withProductImportAuth(request, async (session) => {
    const profiles = await listProductImportMappingProfiles(session);
    return NextResponse.json({ profiles });
  });
}

export async function POST(request: Request) {
  return withProductImportAuth(request, async (session) => {
    const body = (await request.json()) as {
      name?: string;
      sourceType?: string;
      sourceLabel?: string;
      worksheetPattern?: string;
      columnMappings?: Record<string, ProductImportFieldKey>;
    };
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Profile name is required." }, { status: 400 });
    }
    const profile = await createProductImportMappingProfile({
      columnMappings: body.columnMappings ?? {},
      name: body.name.trim(),
      session,
      sourceLabel: body.sourceLabel,
      sourceType: body.sourceType,
      worksheetPattern: body.worksheetPattern
    });
    return NextResponse.json({ profile });
  });
}
