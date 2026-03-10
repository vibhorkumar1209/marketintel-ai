import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateDatapackXLSX } from '@/services/xlsx-export';

export async function GET(req: NextRequest, { params }: { params: { reportId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const report = await db.report.findUnique({ where: { id: params.reportId } });
  if (!report || report.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    let xlsxBuffer: Buffer;
    const isHidden = (v: string) => /(source|methodology|estimation|assumption|confidence|primary)/i.test(v);

    if (report.reportType === 'datapack' && (report.sheets as unknown[])) {
      // Datapack: has structured sheets
      let sheets = (report.sheets as any[]);
      if (session?.user?.role !== 'admin') {
        sheets = sheets.map(sheet => ({
          ...sheet,
          columns: (sheet.columns || []).filter((c: string) => !isHidden(c)),
          rows: (sheet.rows || []).map((row: any) => {
            const newRow = { ...row };
            Object.keys(newRow).forEach(k => {
              if (isHidden(k)) delete newRow[k];
            });
            return newRow;
          })
        }));
      }
      xlsxBuffer = generateDatapackXLSX({ sheets });
    } else {
      // Industry report: convert sections into a summary spreadsheet
      const sections = (report.sections as Array<{ title?: string; content?: string[]; citations?: Array<{ claim: string; source: string }> }>) || [];

      const columns = ['Section', 'Paragraph', 'Content'];
      if (session?.user?.role === 'admin') columns.push('Citations');

      const rows = sections.flatMap(section =>
        (section.content || [])
          .filter(para => session?.user?.role === 'admin' || !isHidden(para))
          .map((para, i) => {
            const row: any = {
              Section: section.title || '',
              Paragraph: i + 1,
              Content: para || '',
            };
            if (session?.user?.role === 'admin') {
              row.Citations = (section.citations || []).slice(0, 3).map(c => `${c.source}: ${c.claim}`).join('; ');
            }
            return row;
          })
      );

      if (rows.length === 0) {
        rows.push({ Section: 'No content', Paragraph: 0, Content: 'Report has no text content' });
      }

      xlsxBuffer = generateDatapackXLSX({
        sheets: [{
          name: 'Report Summary',
          columns,
          rows,
        }]
      });
    }

    const filename = `${report.title?.replace(/[^a-z0-9]/gi, '_') || 'report'}.xlsx`;

    return new NextResponse(xlsxBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': xlsxBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error('XLSX generation failed:', err);
    return NextResponse.json({ error: 'Excel generation failed' }, { status: 500 });
  }
}
