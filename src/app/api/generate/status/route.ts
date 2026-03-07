import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });

  const job = await db.job.findUnique({ where: { id: jobId } });
  if (!job || job.userId !== session.user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const report = job.status === 'completed'
    ? await db.report.findUnique({ where: { jobId }, select: { id: true } })
    : null;

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    progress: { step: job.currentStep, stepName: job.currentStepName, pct: job.progressPct },
    errorMessage: job.errorMessage,
    reportId: report?.id,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
  });
}
