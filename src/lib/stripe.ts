import Stripe from 'stripe';
import { db } from './db';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// ─── CREDIT COSTS ─────────────────────────────────────────────────────────────
export const CREDIT_COSTS = {
  industry_report: 50,
  datapack: 30,
} as const;

// ─── PLAN DEFINITIONS ─────────────────────────────────────────────────────────
export const PLANS = {
  starter: {
    name: 'Starter',
    price: 4900,       // $49/report credit pack (100 credits)
    credits: 100,
    priceId: process.env.STRIPE_PRICE_STARTER!,
    type: 'one_time' as const,
    description: '100 credits (~2 reports)',
  },
  pro: {
    name: 'Pro',
    price: 19900,      // $199/month
    credits: 500,
    priceId: process.env.STRIPE_PRICE_PRO!,
    type: 'recurring' as const,
    description: '500 credits/month (~10 reports)',
  },
  team: {
    name: 'Team',
    price: 59900,      // $599/month
    credits: 9999,     // unlimited
    priceId: process.env.STRIPE_PRICE_TEAM!,
    type: 'recurring' as const,
    description: 'Unlimited reports + API access',
  },
} as const;

// ─── CHECKOUT SESSION ─────────────────────────────────────────────────────────
export async function createCheckoutSession(
  userId: string,
  plan: keyof typeof PLANS
): Promise<string> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const planConfig = PLANS[plan];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  let customer: Stripe.Customer | undefined;
  const existingSub = await db.subscription.findFirst({ where: { userId } });
  if (existingSub?.stripeCustomerId) {
    customer = await stripe.customers.retrieve(existingSub.stripeCustomerId) as Stripe.Customer;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customer?.id,
    customer_email: customer?.id ? undefined : user.email,
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    mode: planConfig.type === 'recurring' ? 'subscription' : 'payment',
    success_url: `${appUrl}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/billing?canceled=true`,
    metadata: { userId, plan, credits: planConfig.credits.toString() },
    allow_promotion_codes: true,
  });

  return session.url!;
}

// ─── WEBHOOK HANDLERS ─────────────────────────────────────────────────────────
export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, plan, credits } = session.metadata!;
  const creditAmount = parseInt(credits);

  // Add credits
  await db.credits.upsert({
    where: { userId },
    update: {
      balance: { increment: creditAmount },
      lifetimeEarned: { increment: creditAmount },
    },
    create: {
      userId,
      balance: creditAmount,
      lifetimeEarned: creditAmount,
    },
  });

  // If subscription, record it
  if (session.subscription) {
    const sub = await stripe.subscriptions.retrieve(session.subscription as string);
    await db.subscription.upsert({
      where: { stripeCustomerId: session.customer as string },
      update: {
        stripeSubscriptionId: sub.id,
        stripePriceId: sub.items.data[0].price.id,
        plan,
        status: sub.status,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
      },
      create: {
        userId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: sub.id,
        stripePriceId: sub.items.data[0].price.id,
        plan,
        status: sub.status,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
      },
    });
  }
}

export async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const customer = sub.customer as string;
  const existing = await db.subscription.findUnique({ where: { stripeCustomerId: customer } });
  if (!existing) return;

  // Determine monthly credit refresh
  const plan = Object.entries(PLANS).find(([, p]) => p.priceId === sub.items.data[0].price.id);
  if (plan && sub.status === 'active') {
    const [, planConfig] = plan;
    // Refresh credits on renewal
    await db.credits.update({
      where: { userId: existing.userId },
      data: {
        balance: planConfig.credits,
        lifetimeEarned: { increment: planConfig.credits },
      },
    });
  }

  await db.subscription.update({
    where: { stripeCustomerId: customer },
    data: {
      status: sub.status,
      stripePriceId: sub.items.data[0].price.id,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    },
  });
}

export async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  await db.subscription.updateMany({
    where: { stripeSubscriptionId: sub.id },
    data: { status: 'canceled', canceledAt: new Date() },
  });
}

// ─── DEDUCT CREDITS ───────────────────────────────────────────────────────────
export async function deductCredits(userId: string, amount: number, jobId: string): Promise<boolean> {
  const credits = await db.credits.findUnique({ where: { userId } });
  if (!credits || credits.balance < amount) return false;

  await db.$transaction([
    db.credits.update({
      where: { userId },
      data: {
        balance: { decrement: amount },
        lifetimeSpent: { increment: amount },
      },
    }),
    db.usage.create({
      data: { userId, reportType: '', creditsUsed: amount, jobId },
    }),
  ]);

  return true;
}

export async function refundCredits(userId: string, amount: number) {
  await db.credits.update({
    where: { userId },
    data: {
      balance: { increment: amount },
      lifetimeSpent: { decrement: amount },
    },
  });
}
