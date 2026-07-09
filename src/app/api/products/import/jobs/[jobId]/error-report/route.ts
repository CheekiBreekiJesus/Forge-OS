import { NextResponse } from "next/server";
import {
  buildErrorReportCsv,
  errorReportRowsFromImport
} from "@/features/product-import/error-report";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { requireProductImportPermission } from "@/features/product-import/auth";
import { withProductImportAuth } from "@/app/api/products/import/_shared";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withProductImportAuth(request, async (session) => {
    requireProductImportPermission(session);
    const { jobId } = await context.params;
    const client = createSupabaseServiceClient();

    const { data: issues, error } = await client
      .from("prod_import_validation_issues")
      .select("severity, code, message, field_key, row_id, prod_import_rows(source_row_number, normalized_values)")
      .eq("job_id", jobId)
      .eq("tenant_id", session.tenantId);

    if (error) {
      return NextResponse.json({ error: "Failed to build error report." }, { status: 500 });
    }

    const rows = errorReportRowsFromImport(
      (issues ?? []).map((issue) => {
        const row = Array.isArray(issue.prod_import_rows)
          ? issue.prod_import_rows[0]
          : issue.prod_import_rows;
        const normalized = (row?.normalized_values as Record<string, string> | undefined) ?? {};
        return {
          code: issue.code as string,
          fieldKey: issue.field_key as string | null,
          internalReference: normalized.internalReference,
          message: issue.message as string,
          severity: issue.severity as string,
          sourceRowNumber: Number(row?.source_row_number ?? 0)
        };
      })
    );

    const csv = buildErrorReportCsv(
      ["row", "severity", "code", "field", "reference", "message"],
      rows
    );

    return new NextResponse(csv, {
      headers: {
        "Content-Disposition": `attachment; filename="product-import-errors-${jobId}.csv"`,
        "Content-Type": "text/csv; charset=utf-8"
      }
    });
  });
}
