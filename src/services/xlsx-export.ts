import * as XLSX from 'xlsx';

type SheetRow = Record<string, string | number | null>;
type SheetDef = { name: string; columns: string[]; rows: SheetRow[]; description?: string };

// Column width heuristic per column name
function colWidth(name: string): number {
  if (name.toLowerCase().includes('claim') || name.toLowerCase().includes('assumption') || name.toLowerCase().includes('implication') || name.toLowerCase().includes('note')) return 50;
  if (name.toLowerCase().includes('driver') || name.toLowerCase().includes('segment') || name.toLowerCase().includes('application') || name.toLowerCase().includes('source') || name.toLowerCase().includes('company')) return 36;
  if (name.toLowerCase().includes('year') || name.toLowerCase().includes('rank') || name.toLowerCase().includes('#')) return 8;
  if (name.toLowerCase().includes('pct') || name.toLowerCase().includes('%') || name.toLowerCase().includes('cagr')) return 14;
  return 20;
}

export function generateXLSX(datapack: { sheets: SheetDef[] }): Buffer {
  const workbook = XLSX.utils.book_new();

  for (const sheet of datapack.sheets) {
    if (!sheet.columns || !sheet.rows) continue;

    const sheetData: (string | number | null)[][] = [
      sheet.columns,
      ...sheet.rows.map(row => sheet.columns.map(col => row[col] ?? '[DATA UNAVAILABLE]')),
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = sheet.columns.map(c => ({ wch: colWidth(c) }));
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    XLSX.utils.book_append_sheet(workbook, ws, sheet.name.slice(0, 31));
  }

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

// Build a Datapack XLSX from raw report data
export function generateDatapackXLSX(reportData: object): Buffer {
  const data = reportData as { sheets?: SheetDef[] };
  if (data.sheets && data.sheets.length > 0) {
    return generateXLSX({ sheets: data.sheets });
  }

  // Fallback
  const workbook = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet([{ info: 'No structured data available', value: 'N/A' }]);
  XLSX.utils.book_append_sheet(workbook, ws, 'Summary');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
