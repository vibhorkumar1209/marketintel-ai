'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import GenerationProgress from '@/components/wizard/GenerationProgress';
import { clsx } from 'clsx';

type ReportType = 'industry_report' | 'datapack' | 'trends_report';

interface WizardState {
  reportType: ReportType;
  query: string;
  depth: 'light' | 'standard' | 'deep';
  regions: string[];
  competitorCount: number;
  forecastYears: number;
}

const creditCosts = {
  light: { industry_report: 30, datapack: 15, trends_report: 25 },
  standard: { industry_report: 50, datapack: 30, trends_report: 25 },
  deep: { industry_report: 100, datapack: 60, trends_report: 25 },
};

const PRODUCT_META: Record<ReportType, { label: string; badge: string; badgeVariant: 'teal' | 'amber' | 'navy'; accent: string; generateLabel: string }> = {
  industry_report: { label: 'Industry Report', badge: '9 sections', badgeVariant: 'teal', accent: '#3491E8', generateLabel: 'Generate Report →' },
  trends_report: { label: 'Trends Report', badge: '6 modules', badgeVariant: 'navy', accent: '#a855f7', generateLabel: 'Run Analysis →' },
  datapack: { label: 'Market Datapack', badge: '10 sheets', badgeVariant: 'amber', accent: '#00BDA8', generateLabel: 'Generate Datapack →' },
};

const STEP_HEADING: Record<ReportType, { heading: string; subtitle: string }> = {
  industry_report: { heading: 'Review & Generate', subtitle: 'Confirm your Industry Report configuration before generating' },
  trends_report: { heading: 'Review & Run Analysis', subtitle: 'Confirm your Trends Report scope before running the analysis' },
  datapack: { heading: 'Review & Build Datapack', subtitle: 'Confirm your datapack scope before generating the Excel file' },
};

export default function WizardConfirmPage() {
  const router = useRouter();
  const [state, setState] = useState<WizardState | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if resuming generation from URL
    const searchParams = new URLSearchParams(window.location.search);
    const existingJob = searchParams.get('jobId');
    if (existingJob) {
      setActiveJobId(existingJob);
    }

    const fetchData = async () => {
      try {
        const wizardState = sessionStorage.getItem('wizardState');
        if (!wizardState) { router.push('/wizard'); return; }
        setState(JSON.parse(wizardState));
        const res = await fetch('/api/credits');
        if (res.ok) setCredits((await res.json()).balance);
      } catch (err) {
        setError('Failed to load data'); console.error(err);
      } finally { setIsLoading(false); }
    };
    fetchData();
  }, [router]);

  const handleGenerate = async () => {
    if (!state) return;
    setIsGenerating(true); setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: state.reportType,
          query: state.query,
          config: { depth: state.depth, regions: state.regions, competitorCount: state.competitorCount, forecastYears: state.forecastYears },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.message || 'Failed to start generation');
        setIsGenerating(false); return;
      }

      const data = await res.json();
      sessionStorage.removeItem('wizardState');
      setActiveJobId(data.jobId);
      // Push URL silently to allow refresh
      window.history.replaceState({}, '', `/wizard/confirm?jobId=${data.jobId}`);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsGenerating(false); console.error(err);
    }
  };

  const handleTopUp = async () => {
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId: 'starter' }) });
      if (res.ok) { const data = await res.json(); window.location.href = data.url; }
    } catch { setError('Failed to redirect to checkout'); }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4"><Spinner size="lg" /><p className="text-[#8899BB]">Loading...</p></div>
    </div>
  );

  if (!state) return null;

  const meta = PRODUCT_META[state.reportType] || PRODUCT_META.industry_report;
  const step = STEP_HEADING[state.reportType] || STEP_HEADING.industry_report;
  const cost = (creditCosts[state.depth] as Record<string, number>)[state.reportType] ?? 35;
  const hasEnoughCredits = credits !== null && credits >= cost;

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: meta.accent, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>
          {activeJobId ? 'Step 4 of 4' : 'Step 3 of 3'}
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0c3649', marginBottom: 6 }}>
          {activeJobId ? `Generating Your ${meta.label}` : step.heading}
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>
          {activeJobId ? 'AI agents are researching and analyzing your market' : step.subtitle}
        </p>
      </div>

      {/* Progress */}
      {!activeJobId && (
        <div className="flex items-center gap-4 flex-1">
          {[1, 2, 3].map((s, i) => (
            <React.Fragment key={s}>
              <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-semibold" style={{ background: meta.accent }}>✓</div>
              {i < 2 && <div className="flex-1 h-1 rounded" style={{ background: meta.accent }} />}
            </React.Fragment>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-600 bg-opacity-10 border border-red-600 border-opacity-30 rounded-lg p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {activeJobId ? (
        <GenerationProgress jobId={activeJobId} meta={meta} />
      ) : (
        <>
          {/* Report Configuration */}
          <Card>
            <div className="space-y-6">
              <div className="pb-6 border-b border-[#2A3A55]">
                <p className="text-sm text-[#8899BB] mb-2">Report Type</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-[#E8EDF5]">{meta.label}</p>
                  <Badge variant={meta.badgeVariant}>{meta.badge}</Badge>
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
                    {state.regions.map(region => (
                      <p key={region} className="text-sm text-[#E8EDF5]">{region}</p>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[#8899BB] mb-2">Configuration</p>
                  <p className="text-sm text-[#E8EDF5]">{state.competitorCount} competitors</p>
                  <p className="text-sm text-[#E8EDF5]">{state.forecastYears}-year forecast</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Credits */}
          <Card variant={hasEnoughCredits ? 'default' : 'highlighted'}>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-[#8899BB] mb-1">Current Balance</p>
                <p className="text-2xl font-bold" style={{ color: meta.accent }}>
                  {credits !== null ? `${credits}` : '...'} credits
                </p>
                <p className="text-sm text-[#8899BB] mt-2">
                  Cost for this {meta.label.toLowerCase()}: <span className="font-semibold" style={{ color: meta.accent }}>{cost} credits</span>
                </p>
              </div>
              <div className="text-right">
                <p className={clsx('text-xl font-bold', hasEnoughCredits ? 'text-green-400' : 'text-amber-400')}>
                  {hasEnoughCredits ? `✓ ${(credits ?? 0) - cost} remaining` : `Need ${cost - (credits ?? 0)} more`}
                </p>
              </div>
            </div>
          </Card>

          {/* Buttons */}
          <div className="flex gap-4 justify-end">
            <Button variant="ghost" href="/wizard/query" size="lg">Back</Button>
            {hasEnoughCredits ? (
              <Button variant="primary" size="lg" onClick={handleGenerate} loading={isGenerating} disabled={isGenerating}>
                {meta.generateLabel}
              </Button>
            ) : (
              <Button variant="primary" size="lg" onClick={handleTopUp}>Top Up Credits →</Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
