import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getCachedReport, cacheReport } from '@/lib/redis';

export async function GET(req: NextRequest, { params }: { params: { reportId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check cache first
  const cached = await getCachedReport(params.reportId);
  if (cached) return NextResponse.json(cached);

  const report = await db.report.findUnique({ where: { id: params.reportId } });
  if (!report || report.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const data = {
    id: report.id,
    title: report.title,
    reportType: report.reportType,
    query: report.query,
    sections: report.sections,
    sheets: report.sheets,
    metadata: report.metadata,
    enrichment: report.enrichment,
    sizing: report.sizing,
    createdAt: report.createdAt,
  };

  // Re-cache
  await cacheReport(report.id, data);

  return NextResponse.json(data);
}
