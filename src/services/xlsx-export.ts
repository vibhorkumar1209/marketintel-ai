import * as XLSX from 'xlsx';
import { Datapack } from '@/types/reports';

export function generateXLSX(datapack: { sheets: Array<{ name: string; columns: string[]; rows: Array<Record<string, string | number | null>>; description?: string }> }): Buffer {
  const workbook = XLSX.utils.book_new();

  for (const sheet of datapack.sheets) {
    if (!sheet.columns || !sheet.rows) continue;

    // Build array of arrays for XLSX
    const sheetData: (string | number | null)[][] = [
      sheet.columns,  // header row
      ...sheet.rows.map(row => sheet.columns.map(col => row[col] ?? '[DATA UNAVAILABLE]')),
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Style header row (XLSX.js limited styling — set column widths)
    const colWidths = sheet.columns.map(() => ({ wch: 20 }));
    ws['!cols'] = colWidths;

    // Freeze top row
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    XLSX.utils.book_append_sheet(workbook, ws, sheet.name.slice(0, 31)); // Excel max 31 chars
  }

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

// Build a Datapack XLSX from raw report data
export function generateDatapackXLSX(reportData: object): Buffer {
  const data = reportData as { sheets?: Array<{ name: string; columns: string[]; rows: Array<Record<string, string | number | null>> }> };
  if (data.sheets) {
    return generateXLSX({ sheets: data.sheets });
  }

  // Fallback: create a single summary sheet
  const workbook = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet([{ info: 'No structured data available', value: 'N/A' }]);
  XLSX.utils.book_append_sheet(workbook, ws, 'Summary');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
