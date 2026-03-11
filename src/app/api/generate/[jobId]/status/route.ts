import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
    req: NextRequest,
    { params }: { params: { jobId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const job = await db.job.findUnique({ where: { id: params.jobId } });
    if (!job || job.userId !== session.user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // If completed, fetch reportId
    let reportId = null;
    if (job.status === 'completed') {
        const report = await db.report.findUnique({ where: { jobId: params.jobId } });
        reportId = report?.id;
    }

    return NextResponse.json({
        id: job.id,
        status: job.status,
        errorMessage: job.errorMessage,
        reportId,
        timestamp: new Date().toISOString()
    });
}
