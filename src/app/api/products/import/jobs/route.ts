import { NextResponse } from "next/server";
import { listProductImportJobs } from "@/application/product-import-service";
import { withProductImportAuth } from "@/app/api/products/import/_shared";

export async function GET(request: Request) {
  return withProductImportAuth(request, async (session) => {
    const jobs = await listProductImportJobs(session);
    return NextResponse.json({ jobs });
  });
}
