import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
    // 1. Flush Redis cache
    await redis.flushall();

    // 2. Clear stuck/failed jobs from DB
    await db.job.deleteMany({
        where: {
            OR: [
                { status: 'failed' },
                { status: 'processing', updatedAt: { lt: new Date(Date.now() - 300000) } } // older than 5 mins
            ]
        }
    });

    return NextResponse.json({ success: true, message: "Cache and stuck jobs purged" });
}
