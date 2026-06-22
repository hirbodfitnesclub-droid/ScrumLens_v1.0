import Papa from "papaparse";

export interface ParsedCsvResult {
  rows: Record<string, string>[];
  errors: string[];
}

/**
 * Parses Plane.so exported CSV file using PapaParse.
 * Validates existence of core target headers.
 */
export function parseCsv(fileContent: string): Promise<ParsedCsvResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(fileContent, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (results) => {
        const rows = results.data;
        const parseErrors = results.errors.map(e => `خطای ردیف ${e.row}: ${e.message}`);
        
        if (rows.length === 0) {
          resolve({ rows: [], errors: ["فایل انتخاب شده فاقد اطلاعات یا خالی است."] });
          return;
        }

        // Validate core expected headers
        const firstRow = rows[0];
        const requiredHeaders = ["Identifier", "Name", "State Name", "Project Name", "Project Identifier"];
        const missingHeaders = requiredHeaders.filter(h => !(h in firstRow));

        if (missingHeaders.length > 0) {
          const PersianMissing = missingHeaders.join(", ");
          resolve({
            rows: [],
            errors: [
              `سربرگ‌های الزامی یافت نشدند: (${PersianMissing}) — مطمئن شوید فایل خروجی استاندارد Plane.so را بارگذاری کرده‌اید.`
            ]
          });
          return;
        }

        resolve({
          rows,
          errors: parseErrors
        });
      },
      error: (error) => {
        reject(new Error(`خطا در پارس قالب‌بندی فایل CSV: ${error.message}`));
      }
    });
  });
}
