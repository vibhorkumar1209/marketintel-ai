import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const jobs = await db.job.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { report: { select: { id: true } } },
  });

  return NextResponse.json({
    jobs: jobs.map((j: typeof jobs[number]) => ({
      id: j.id,
      reportType: j.reportType,
      query: j.query,
      status: j.status,
      currentStep: j.currentStep,
      currentStepName: j.currentStepName,
      progressPct: j.progressPct,
      estimatedCredits: j.estimatedCredits,
      createdAt: j.createdAt,
      completedAt: j.completedAt,
      reportId: j.report?.id ?? null,
    })),
  });
}
