'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';

interface WizardState {
  reportType: 'industry_report' | 'datapack';
  query: string;
  depth: 'light' | 'standard' | 'deep';
  regions: string[];
  competitorCount: number;
  forecastYears: number;
}

const creditCosts = {
  light: { industry_report: 30, datapack: 15 },
  standard: { industry_report: 50, datapack: 30 },
  deep: { industry_report: 100, datapack: 60 },
};

export default function WizardConfirmPage() {
  const router = useRouter();
  const [state, setState] = useState<WizardState | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get wizard state
        const wizardState = sessionStorage.getItem('wizardState');
        if (!wizardState) {
          router.push('/wizard');
          return;
        }
        setState(JSON.parse(wizardState));

        // Get credits
        const res = await fetch('/api/credits');
        if (res.ok) {
          const data = await res.json();
          setCredits(data.balance);
        }
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleGenerate = async () => {
    if (!state) return;

    setIsGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: state.reportType,
          query: state.query,
          config: {
            depth: state.depth,
            regions: state.regions,
            competitorCount: state.competitorCount,
            forecastYears: state.forecastYears,
          },
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        setError(error.message || 'Failed to start generation');
        setIsGenerating(false);
        return;
      }

      const data = await res.json();
      sessionStorage.removeItem('wizardState');
      router.push(`/generate/${data.jobId}`);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsGenerating(false);
      console.error(err);
    }
  };

  const handleTopUp = async () => {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'starter' }),
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      }
    } catch (err) {
      setError('Failed to redirect to checkout');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-[#8899BB]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!state) return null;

  const cost = creditCosts[state.depth][state.reportType];
  const hasEnoughCredits = credits !== null && credits >= cost;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#E8EDF5] mb-2">Review & Generate</h1>
        <p className="text-[#8899BB]">Confirm your report configuration before generating</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-semibold">
            ✓
          </div>
          <div className="flex-1 h-1 bg-teal-600" />
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-semibold">
            ✓
          </div>
          <div className="flex-1 h-1 bg-teal-600" />
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-semibold">
            3
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-600 bg-opacity-10 border border-red-600 border-opacity-30 rounded-lg p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Report Configuration */}
      <Card>
        <div className="space-y-6">
          <div className="pb-6 border-b border-[#2A3A55]">
            <p className="text-sm text-[#8899BB] mb-2">Report Type</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-[#E8EDF5]">
                {state.reportType === 'industry_report'
                  ? 'Industry Report'
                  : 'Market Datapack'}
              </p>
              <Badge variant={state.reportType === 'industry_report' ? 'teal' : 'amber'}>
                {state.reportType === 'industry_report' ? '15 sections' : '10 sheets'}
              </Badge>
            </div>
          </div>

          <div className="pb-6 border-b border-[#2A3A55]">
            <p className="text-sm text-[#8899BB] mb-2">Research Query</p>
            <p className="text-[#E8EDF5] leading-relaxed">{state.query}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-[#8899BB] mb-2">Research Depth</p>
              <p className="text-lg font-semibold text-[#E8EDF5] capitalize">{state.depth}</p>
            </div>

            <div>
              <p className="text-sm text-[#8899BB] mb-2">Geographic Focus</p>
              <div className="space-y-1">
                {state.regions.map((region) => (
                  <p key={region} className="text-sm text-[#E8EDF5]">
                    {region}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-[#8899BB] mb-2">Configuration</p>
              <p className="text-sm text-[#E8EDF5]">
                {state.competitorCount} competitors
              </p>
              <p className="text-sm text-[#E8EDF5]">
                {state.forecastYears}-year forecast
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Credits Section */}
      <Card variant={hasEnoughCredits ? 'default' : 'highlighted'}>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-[#8899BB] mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-teal-600">
              {credits !== null ? `${credits}` : '...'} credits
            </p>
            <p className="text-sm text-[#8899BB] mt-2">
              Cost for this report: <span className="text-teal-400 font-semibold">{cost} credits</span>
            </p>
          </div>
          <div className="text-right">
            <p className={clsx(
              'text-xl font-bold',
              hasEnoughCredits ? 'text-green-400' : 'text-amber-400'
            )}>
              {hasEnoughCredits
                ? `✓ ${(credits ?? 0) - cost} remaining`
                : `Need ${cost - (credits ?? 0)} more`}
            </p>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button variant="ghost" href="/wizard/query" size="lg">
          Back
        </Button>
        {hasEnoughCredits ? (
          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerate}
            loading={isGenerating}
            disabled={isGenerating}
          >
            Generate Report →
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={handleTopUp}
          >
            Top Up Credits →
          </Button>
        )}
      </div>
    </div>
  );
}

import { clsx } from 'clsx';
