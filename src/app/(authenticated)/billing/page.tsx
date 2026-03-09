'use client';

import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';

interface CreditUsage {
  id: string;
  description: string;
  creditsUsed: number;
  createdAt: string;
}

interface CreditsData {
  balance: number;
  subscription?: {
    plan: string;
    status: string;
    renewalDate?: string;
  };
}

export default function BillingPage() {
  const [creditsData, setCreditsData] = useState<CreditsData | null>(null);
  const [usage, setUsage] = useState<CreditUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [creditsRes, usageRes] = await Promise.all([
          fetch('/api/credits'),
          fetch('/api/credits/usage'),
        ]);

        if (creditsRes.ok) {
          const data = await creditsRes.json();
          setCreditsData(data);
        } else {
          setError('Failed to load credits');
        }

        if (usageRes.ok) {
          const data = await usageRes.json();
          setUsage(data.usage || []);
        }
      } catch (err) {
        setError('An error occurred while loading billing information');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCheckout = async (planId: string) => {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      } else {
        setError('Failed to initiate checkout');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 49,
      credits: 2500,
      period: 'one-time',
      features: ['Up to 50 reports', 'Standard depth', 'Email support', '6-month validity'],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 199,
      credits: 'Unlimited',
      period: '/month',
      features: ['Unlimited reports', 'All depths', 'Priority support', 'API access', 'Team seats (3)'],
      highlighted: true,
    },
    {
      id: 'team',
      name: 'Team',
      price: 599,
      credits: 'Unlimited',
      period: '/month',
      features: ['Unlimited everything', 'Dedicated support', 'Advanced API', 'White-label', 'Unlimited seats'],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#0c3649] mb-2">Billing & Subscription</h1>
        <p className="text-[#6b7280]">Manage your plan and credits</p>
      </div>

      {error && (
        <div className="bg-red-600 bg-opacity-10 border border-red-600 border-opacity-30 rounded-lg p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Current Balance */}
      {creditsData && (
        <Card variant="highlighted">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <p className="text-sm text-[#64748b] mb-2">Current Balance</p>
              <p className="text-4xl font-bold text-teal-600">
                {creditsData.balance}
              </p>
              <p className="text-xs text-[#64748b] mt-2">credits available</p>
            </div>

            {creditsData.subscription && (
              <>
                <div>
                  <p className="text-sm text-[#64748b] mb-2">Current Plan</p>
                  <p className="text-2xl font-bold text-[#0c3649] capitalize">
                    {creditsData.subscription.plan}
                  </p>
                  <Badge variant="green" className="mt-2">
                    {creditsData.subscription.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {creditsData.subscription.renewalDate && (
                  <div>
                    <p className="text-sm text-[#64748b] mb-2">Renewal Date</p>
                    <p className="text-2xl font-bold text-[#0c3649]">
                      {new Date(creditsData.subscription.renewalDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      )}

      {/* Usage History */}
      {usage.length > 0 && (
        <Card title="Recent Activity">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e5e7eb]">
                  <th className="text-left px-4 py-3 font-semibold text-[#64748b]">
                    Description
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-[#64748b]">
                    Credits Used
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-[#64748b]">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {usage.slice(0, 10).map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[#e5e7eb] hover:bg-[#f9fafb]"
                  >
                    <td className="px-4 py-3 text-[#0c3649]">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-right text-teal-400 font-semibold">
                      -{item.creditsUsed}
                    </td>
                    <td className="px-4 py-3 text-right text-[#64748b]">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pricing Plans */}
      <div>
        <h2 className="text-2xl font-bold text-[#0c3649] mb-6">Upgrade Your Plan</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              variant={plan.highlighted ? 'highlighted' : 'default'}
              className={plan.highlighted ? 'md:scale-105 md:shadow-2xl md:shadow-teal-600/20' : ''}
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-[#0c3649]">{plan.name}</h3>
                  <div className="mt-3 space-y-1">
                    <div>
                      <span className="text-4xl font-bold text-teal-600">${plan.price}</span>
                      <span className="text-teal-600 ml-2">{plan.period}</span>
                    </div>
                    <p className="text-[#64748b] text-sm">
                      {typeof plan.credits === 'number'
                        ? `${plan.credits.toLocaleString()} credits`
                        : 'Unlimited credits'}
                    </p>
                  </div>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-[#0c3649] text-sm"
                    >
                      <span className="text-teal-500 mt-0.5">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.highlighted ? 'primary' : 'secondary'}
                  onClick={() => handleCheckout(plan.id)}
                  className="w-full"
                >
                  {plan.period === '/month' ? 'Subscribe Now' : 'Buy Credits'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <Card title="Frequently Asked Questions">
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-[#0c3649] mb-2">
              How are credits calculated?
            </h4>
            <p className="text-[#64748b] text-sm">
              Industry reports cost 30-100 credits depending on depth level. Market
              datapacks cost 15-60 credits. Actual costs may vary based on complexity.
            </p>
          </div>

          <div className="border-t border-[#e5e7eb] pt-6">
            <h4 className="font-semibold text-[#0c3649] mb-2">
              Can I use credits from different purchases?
            </h4>
            <p className="text-[#64748b] text-sm">
              Yes, all credits are pooled into your account balance. You can use them
              in any order, and they don't expire as long as your account is active.
            </p>
          </div>

          <div className="border-t border-[#e5e7eb] pt-6">
            <h4 className="font-semibold text-[#0c3649] mb-2">
              What happens when I run out of credits?
            </h4>
            <p className="text-[#64748b] text-sm">
              You'll be notified and prompted to purchase more credits. Your existing
              reports will remain available for download.
            </p>
          </div>

          <div className="border-t border-[#e5e7eb] pt-6">
            <h4 className="font-semibold text-[#0c3649] mb-2">
              Can I cancel my subscription?
            </h4>
            <p className="text-[#64748b] text-sm">
              Yes, you can cancel anytime. No refunds are issued for partial months,
              but you can use remaining credits indefinitely.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
