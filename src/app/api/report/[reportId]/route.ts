import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getCachedReport, cacheReport } from '@/lib/redis';
import { safeJsonParse } from '@/lib/json-repair';
import { SectionDraft } from '@/types/agents';
import { ReportSection } from '@/types/reports';

export async function GET(req: NextRequest, { params }: { params: { reportId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  /*
  // Check cache first
  const cached = await getCachedReport(params.reportId);
  if (cached && (cached as any).executiveSummary?.headline) {
    return NextResponse.json(cached);
  }
  */

  const report = await db.report.findUnique({ where: { id: params.reportId } });
  if (!report || report.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const metadata = report.metadata as Record<string, unknown> || {};
  const sizing = report.sizing as Record<string, unknown> || {};
  const sizingResult = (sizing as any)?.validated_market_size || {};
  const cagr = (sizing as any)?.cagr_estimate || {};
  const rawSections = (report.sections as any[]) || [];

  // Repair logic: some sections might be stored as raw JSON strings in the content field
  const sections: ReportSection[] = rawSections.map((s: any): ReportSection => {
    // If content[0] looks like a JSON object of a SectionDraft
    if (s.content?.[0] && typeof s.content[0] === 'string' && (s.content[0].trim().startsWith('{') || s.content[0].includes('```json'))) {
      const parsed = safeJsonParse<SectionDraft | null>(s.content[0], null);
      if (parsed && (parsed.section_id || parsed.body_paragraphs)) {
        // Convert SectionDraft (snake_case) to ReportSection (camelCase)
        return {
          id: parsed.section_id || s.id,
          title: parsed.section_title || s.title,
          content: parsed.body_paragraphs || [],
          keyTable: parsed.key_table ? { title: parsed.key_table.title, headers: parsed.key_table.headers, rows: parsed.key_table.rows } : undefined,
          chartSpec: parsed.chart_spec ? { type: parsed.chart_spec.type, title: parsed.chart_spec.title, xAxis: parsed.chart_spec.x_axis, yAxis: parsed.chart_spec.y_axis, dataSource: parsed.chart_spec.data_source } : undefined,
          subsections: parsed.subsections?.map(sub => ({
            title: sub.title,
            content: sub.body_paragraphs,
            keyTable: sub.key_table ? { title: sub.key_table.title, headers: sub.key_table.headers, rows: sub.key_table.rows } : undefined,
            chartSpec: sub.chart_spec ? { type: sub.chart_spec.type, title: sub.chart_spec.title, xAxis: sub.chart_spec.x_axis, yAxis: sub.chart_spec.y_axis, dataSource: sub.chart_spec.data_source } : undefined,
          })),
          citations: parsed.citations || [],
          flags: parsed.section_flags || [],
          adminMethodology: parsed.admin_methodology,
        };
      }
    }
    return s as ReportSection;
  });

  // Build executiveSummary from stored metadata/sizing since it's not a separate DB field
  const metaExSum = (metadata as any).executiveSummary;
  const executiveSummary = (metaExSum && metaExSum.headline && metaExSum.paragraphs?.length > 0) ? metaExSum : {
    headline: `${report.title} — ${String(metadata.geography || 'Global')} Market Analysis`,
    kpiPanel: [
      { label: 'Market Size', value: `${sizingResult.value || 'N/A'} ${sizingResult.unit || 'USD Million'}`, source_section: 'sizing_workings' },
      { label: 'CAGR', value: `${cagr.value || 'N/A'}% (${cagr.period || ''})`, source_section: 'sizing_workings' },
      { label: 'Geography', value: String(metadata.geography || 'Global'), source_section: 'regional_analysis' },
      { label: 'Quality Score', value: `${metadata.qualityScore ?? 'N/A'}%`, source_section: 'methodology' },
    ],
    paragraphs: (metadata.keyFindings as string[] || []).length > 0
      ? (metadata.keyFindings as string[])
      : [`The ${report.title} represents a comprehensive analysis of the ${String(metadata.geography || 'Global')} market landscape.`, `Strategic drivers and technological shifts are expected to maintain a CAGR of ${cagr.value || 'N/A'}% through the forecast period.`],
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
