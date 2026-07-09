import { NextResponse } from "next/server";
import { createProductImportJob } from "@/application/product-import-service";
import { withProductImportAuth } from "@/app/api/products/import/_shared";

export async function POST(request: Request) {
  return withProductImportAuth(request, async (session) => {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing import file." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const worksheetName = String(formData.get("worksheetName") ?? "");

    const job = await createProductImportJob({
      fileBuffer: buffer,
      filename: file.name,
      session,
      worksheetName
    });

    return NextResponse.json({ job });
  });
}
