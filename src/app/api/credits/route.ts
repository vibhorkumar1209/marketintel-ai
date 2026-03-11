import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [credits, subscription] = await Promise.all([
    db.credits.findUnique({ where: { userId: session.user.id } }),
    db.subscription.findFirst({
      where: { userId: session.user.id, status: 'active' },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json({
    balance: credits?.balance ?? 0,
    lifetimeEarned: credits?.lifetimeEarned ?? 0,
    lifetimeSpent: credits?.lifetimeSpent ?? 0,
    subscription: subscription
      ? {
          plan: subscription.plan,
          status: subscription.status,
          renewsAt: subscription.currentPeriodEnd,
        }
      : null,
  });
}
