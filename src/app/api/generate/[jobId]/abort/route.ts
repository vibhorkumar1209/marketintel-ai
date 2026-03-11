import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { releaseJobLock } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function POST(
    req: NextRequest,
    { params }: { params: { jobId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const job = await db.job.findUnique({ where: { id: params.jobId } });
        if (!job || job.userId !== session.user.id) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        // 1. Force state to failed in DB
        await db.job.update({
            where: { id: params.jobId },
            data: { 
                status: 'failed', 
                errorMessage: 'Aborted by user' 
            }
        });

        // 2. Release Redis lock immediately so it can be restarted if needed
        await releaseJobLock(params.jobId);

        return NextResponse.json({ success: true, message: "Job aborted" });
    } catch (err) {
        console.error('Abort route error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
