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
    const data = report.reportType === 'datapack'
      ? { sheets: report.sheets }
      : { sheets: report.sections }; // fallback for industry reports

    const xlsxBuffer = generateDatapackXLSX(data as object);
    const filename = `${report.title?.replace(/[^a-z0-9]/gi, '_') || 'datapack'}.xlsx`;

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
