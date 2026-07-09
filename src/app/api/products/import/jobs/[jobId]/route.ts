import { NextResponse } from "next/server";
import {
  approveProductImportJob,
  applyProductImportJob,
  getProductImportJobRows,
  parseProductImportJob
} from "@/application/product-import-service";
import type { ProductImportFieldKey, ProductImportProposedAction } from "@/domain/product-import-types";
import { parseSpreadsheet } from "@/features/product-import/parse-spreadsheet";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { withProductImportAuth } from "@/app/api/products/import/_shared";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withProductImportAuth(request, async (session) => {
    const { jobId } = await context.params;
    const url = new URL(request.url);
    const offset = Number(url.searchParams.get("offset") ?? "0");
    const limit = Number(url.searchParams.get("limit") ?? "50");
    const rows = await getProductImportJobRows({ jobId, limit, offset, session });
    return NextResponse.json({ rows });
  });
}

export async function POST(request: Request, context: RouteContext) {
  return withProductImportAuth(request, async (session) => {
    const { jobId } = await context.params;
    const body = (await request.json()) as {
      action?: "parse" | "approve" | "apply";
      parsedFileBase64?: string;
      filename?: string;
      worksheetName?: string;
      columnMappings?: Record<string, ProductImportFieldKey>;
      rowApprovals?: Array<{ rowId: string; approvedAction: ProductImportProposedAction }>;
      idempotencyKey?: string;
    };

    if (body.action === "approve") {
      const job = await approveProductImportJob({
        jobId,
        rowApprovals: body.rowApprovals ?? [],
        session
      });
      return NextResponse.json({ job });
    }

    if (body.action === "apply") {
      const result = await applyProductImportJob({
        idempotencyKey: body.idempotencyKey,
        jobId,
        session
      });
      return NextResponse.json({ result });
    }

    if (!body.parsedFileBase64 || !body.filename || !body.worksheetName) {
      return NextResponse.json({ error: "Missing parse payload." }, { status: 400 });
    }

    const bytes = Buffer.from(body.parsedFileBase64, "base64");
    const parsed = await parseSpreadsheet({
      data: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      filename: body.filename
    });

    const client = createSupabaseServiceClient();
    const { data: inventoryItems } = await client
      .from("inv_item_masters")
      .select("id, internal_reference, name, barcode, sku")
      .eq("tenant_id", session.tenantId);

    const result = await parseProductImportJob({
      columnMappings: body.columnMappings ?? {},
      existingInventoryItems: (inventoryItems ?? []).map((item) => ({
        barcode: (item.barcode as string | null) ?? null,
        id: item.id as string,
        internalReference: item.internal_reference as string,
        name: item.name as string
      })),
      existingProducts: [],
      jobId,
      parsed,
      session,
      worksheetName: body.worksheetName
    });

    return NextResponse.json(result);
  });
}
