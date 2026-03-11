import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { redis } from '@/lib/redis';

export async function GET() {
    await redis.flushall();
    return NextResponse.json({ success: true, message: "Cache purged" });
}
