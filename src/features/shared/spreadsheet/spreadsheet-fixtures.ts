import ExcelJS from "exceljs";

export type SyntheticSheetSpec = {
  name: string;
  rows: Array<Array<string | number | boolean | null>>;
  hidden?: boolean;
};

export async function buildSyntheticXlsxBuffer(
  sheets: SyntheticSheetSpec[]
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name);
    if (sheet.hidden) {
      worksheet.state = "hidden";
    }
    sheet.rows.forEach((row, rowIndex) => {
      row.forEach((value, columnIndex) => {
        const cell = worksheet.getCell(rowIndex + 1, columnIndex + 1);
        if (typeof value === "string" && /^0\d+$/.test(value)) {
          cell.value = value;
          cell.numFmt = "@";
          return;
        }
        cell.value = value;
      });
    });
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}

export async function buildSyntheticXlsxFile(
  filename: string,
  sheets: SyntheticSheetSpec[],
  mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
): Promise<File> {
  const buffer = await buildSyntheticXlsxBuffer(sheets);
  return new File([buffer], filename, { type: mimeType });
}

export async function buildSyntheticRowCountWorkbook(rowCount: number): Promise<ArrayBuffer> {
  const header = ["Name", "Email"];
  const rows: Array<Array<string | number | boolean | null>> = [header];
  for (let index = 0; index < rowCount; index += 1) {
    rows.push([`Org ${index + 1}`, `user${index + 1}@example.test`]);
  }
  return buildSyntheticXlsxBuffer([{ name: "Rows", rows }]);
}
