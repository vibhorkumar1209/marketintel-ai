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

  const metadata = report.metadata as Record<string, unknown> || {};
  const sizing = report.sizing as Record<string, unknown> || {};
  const sizingResult = (sizing as any)?.validated_market_size || {};
  const cagr = (sizing as any)?.cagr_estimate || {};
  const sections = (report.sections as unknown[]) || [];

  // Build executiveSummary from stored metadata/sizing since it's not a separate DB field
  const executiveSummary = (metadata as any).executiveSummary || {
    headline: `${report.title} — ${String(metadata.geography || 'Global')} Market Analysis`,
    kpiPanel: [
      { label: 'Market Size', value: `${sizingResult.value || 'N/A'} ${sizingResult.unit || 'USD Million'}`, source_section: 'sizing_workings' },
      { label: 'CAGR', value: `${cagr.value || 'N/A'}% (${cagr.period || ''})`, source_section: 'sizing_workings' },
      { label: 'Geography', value: String(metadata.geography || 'Global'), source_section: 'regional_analysis' },
      { label: 'Quality Score', value: `${metadata.qualityScore ?? 'N/A'}%`, source_section: 'methodology' },
    ],
    paragraphs: (metadata.keyFindings as string[] || []).map(f => f),
    scenarios: {
      bull: 'Strong growth trajectory if key drivers materialize.',
      base: 'Steady growth in line with historical CAGR trends.',
      bear: 'Subdued growth if macro headwinds or regulatory constraints persist.',
    },
  };

  const data = {
    id: report.id,
    title: report.title,
    reportType: report.reportType,
    query: report.query,
    executiveSummary,
    sections,
    sheets: report.sheets,
    metadata,
    enrichment: report.enrichment,
    sizing: report.sizing,
    createdAt: report.createdAt,
  };

  // Re-cache
  await cacheReport(report.id, data);

  return NextResponse.json(data);
}
