import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { CREDIT_COSTS, deductCredits } from '@/lib/stripe';
import { checkRateLimit } from '@/lib/redis';
import { z } from 'zod';

export const maxDuration = 60;

const GenerateSchema = z.object({
  reportType: z.enum(['industry_report', 'datapack']),
  query: z.string().min(10).max(2000),
  config: z.object({
    depth: z.enum(['light', 'standard', 'deep']).default('standard'),
    regions: z.array(z.string()).default(['Global']),
    competitorCount: z.number().int().min(5).max(20).default(10),
    sections: z.array(z.string()).optional(),
    currency: z.string().default('USD'),
    forecastYears: z.number().int().min(1).max(15).default(6),
  }).default({}),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Rate limit: 10 reports per hour
    const allowed = await checkRateLimit(userId, 10, 3600);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Max 10 reports per hour.' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = GenerateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    const { reportType, query, config } = parsed.data;
    const creditCost = CREDIT_COSTS[reportType];

    // Check credits
    const credits = await db.credits.findUnique({ where: { userId } });
    if (!credits || credits.balance < creditCost) {
      return NextResponse.json({
        error: 'Insufficient credits',
        required: creditCost,
        available: credits?.balance ?? 0,
        upgradeUrl: '/billing',
      }, { status: 402 });
    }

    // Create job
    const job = await db.job.create({
      data: {
        userId,
        reportType,
        query,
        config: config as object,
        status: 'queued',
        estimatedCredits: creditCost,
      },
    });

    // Deduct credits immediately (refunded on failure)
    await deductCredits(userId, creditCost, job.id);

    // Pipeline will be triggered by /api/generate/[jobId]/stream when client connects
    // This circumvents Vercel Serverless instantly suspending execution

    return NextResponse.json({
      jobId: job.id,
      reportType,
      estimatedCredits: creditCost,
      streamUrl: `/api/generate/${job.id}/stream`,
    });

  } catch (err) {
    console.error('Generate route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
