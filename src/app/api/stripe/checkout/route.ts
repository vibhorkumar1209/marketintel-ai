import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createCheckoutSession, PLANS } from '@/lib/stripe';
import { z } from 'zod';

const CheckoutSchema = z.object({
  plan: z.enum(['starter', 'pro', 'team']),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

  try {
    const url = await createCheckoutSession(session.user.id, parsed.data.plan);
    return NextResponse.json({ url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: 'Checkout session creation failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ plans: PLANS });
}
