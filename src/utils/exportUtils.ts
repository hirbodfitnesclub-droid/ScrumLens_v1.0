import Papa from "papaparse";
import * as XLSX from "xlsx";

/**
 * Downloads a file from a string data blob
 */
export function downloadFile(content: string, mimeType: string, fileName: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * CSV Export utility using PapaParse
 */
export function exportToCSV<T>(data: T[], fileName: string) {
  const csvString = Papa.unparse(data, {
    quotes: true,
    header: true,
  });
  // Add Unicode Byte Order Mark (BOM) to ensure Persian letters appear correctly in Microsoft Excel
  const bom = "\uFEFF";
  downloadFile(bom + csvString, "text/csv;charset=utf-8;", fileName);
}

/**
 * Multi-Sheet Advanced Excel Export utility using SheetJS
 */
export interface ExcelSheetData {
  sheetName: string;
  data: any[];
}

export function exportToExcel(sheets: ExcelSheetData[], fileName: string) {
  const wb = XLSX.utils.book_new();

  sheets.forEach(({ sheetName, data }) => {
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
