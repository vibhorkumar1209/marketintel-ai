import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { generatePDF } from '@/services/pdf-export';
import { IndustryReport } from '@/types/reports';

export async function GET(req: NextRequest, { params }: { params: { reportId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const report = await db.report.findUnique({ where: { id: params.reportId } });
  if (!report || report.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const reportData: IndustryReport = {
    id: report.id,
    title: report.title || 'Market Intelligence Report',
    query: report.query,
    executiveSummary: {
      headline: 'Executive Summary',
      kpiPanel: [],
      paragraphs: [],
      scenarios: { bull: '', base: '', bear: '' },
    },
    sections: (report.sections as IndustryReport['sections']) || [],
    metadata: (report.metadata as IndustryReport['metadata']) || {
      generatedAt: report.createdAt.toISOString(),
      qualityScore: 75,
      keyFindings: [],
      sources: 0,
      depth: 'standard',
      geography: 'Global',
    },
  };

  try {
    const pdfBuffer = await generatePDF(reportData);
    const filename = `${report.title?.replace(/[^a-z0-9]/gi, '_') || 'report'}.pdf`;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error('PDF generation failed:', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
