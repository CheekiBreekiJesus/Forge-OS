import { NextResponse } from "next/server";
import {
  articleProcessTypes,
  documentTemplates,
  importTemplates,
  labelPackagingRecords,
  operationalMachines,
  operationalProducts,
  personalizedCupQuotationRules,
  productionRoutings,
  qualityTemplates,
  stockItems
} from "@/demo/operational-seed";

export function GET() {
  return NextResponse.json({
    articleProcessTypes,
    documentTemplates,
    importTemplates,
    labelPackagingRecords,
    operationalMachines,
    operationalProducts,
    personalizedCupQuotationRules,
    productionRoutings,
    qualityTemplates,
    stockItems
  });
}
