import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET() {
    await redis.flushall();
    return NextResponse.json({ success: true, message: "Cache purged" });
}
