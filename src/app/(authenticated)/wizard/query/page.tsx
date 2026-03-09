'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { clsx } from 'clsx';

type ReportType = 'industry_report' | 'datapack' | 'trends_report';
type Depth = 'light' | 'standard' | 'deep';

// Per-product copy
const PRODUCT_COPY: Record<ReportType, { heading: string; subtitle: string; placeholder: string; label: string }> = {
  industry_report: {
    heading: 'Define Your Market Scope',
    subtitle: 'Describe the market, geography and focus areas for your 9-section Industry Report',
    label: 'Market Research Query',
    placeholder: "E.g. 'Two-wheeler market in Australia — motorcycle, scooter, moped segments, competitive landscape, market size 2019–2030 with CAGR forecast'",
  },
  trends_report: {
    heading: 'Specify Your Trend Analysis',
    subtitle: 'Tell us which market to scan for trends, growth drivers, barriers and regulatory signals',
    label: 'Trends Analysis Query',
    placeholder: "E.g. 'Trends driving EV adoption in Southeast Asia — policy tailwinds, infrastructure barriers, battery technology shifts and 3-year regulatory horizon'",
  },
  datapack: {
    heading: 'Define Your Datapack Scope',
    subtitle: 'Specify the market and geography for your 10-sheet XLSX datapack with TAM time-series and segment breakdowns',
    label: 'Datapack Query',
    placeholder: "E.g. 'Electric vehicle battery market in India — TAM 2019–2030, segment breakdown by chemistry type, geography and application, CAGR projections'",
  },
};

const ACCENT: Record<ReportType, string> = {
  industry_report: '#3491E8',
  trends_report: '#a855f7',
  datapack: '#00BDA8',
};

export default function WizardQueryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportType = (searchParams.get('type') || 'industry_report') as ReportType;

  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState<Depth>('standard');
  const [regions, setRegions] = useState<string[]>(['Global']);
  const [competitorCount, setCompetitorCount] = useState(10);
  const [forecastYears, setForecastYears] = useState(5);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customCountry, setCustomCountry] = useState('');

  const CREDIT_COSTS = {
    industry_report: 50,
    datapack: 30,
    trends_report: 25,
  } as const;

  const currentCost = CREDIT_COSTS[reportType] ?? 35;
  const copy = PRODUCT_COPY[reportType] || PRODUCT_COPY.industry_report;
  const accent = ACCENT[reportType] || '#3491E8';

  const regionOptions = ['Global', 'North America', 'Europe', 'Asia-Pacific', 'South America', 'Middle East & Africa'];

  const toggleRegion = (region: string) => {
    setRegions(prev => prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]);
  };

  const handleAddCustomCountry = () => {
    const country = customCountry.trim();
    if (country && !regions.includes(country)) setRegions(prev => [...prev, country]);
    setCustomCountry('');
  };

  const handleContinue = () => {
    sessionStorage.setItem('wizardState', JSON.stringify({ reportType, query, depth, regions, competitorCount, forecastYears }));
    router.push('/wizard/confirm');
  };

  const isValid = query.trim().length > 10;

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>
          Step 2 of 3
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0c3649', marginBottom: 6 }}>{copy.heading}</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>{copy.subtitle}</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4 flex-1">
        <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-semibold" style={{ background: accent }}>✓</div>
        <div className="flex-1 h-1 rounded" style={{ background: accent }} />
        <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-semibold" style={{ background: accent }}>2</div>
        <div className="flex-1 h-1 bg-gray-200 rounded" />
        <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-semibold">3</div>
      </div>

      {/* Query Input */}
      <Card>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#0c3649' }}>
              {copy.label}
            </label>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={copy.placeholder}
              className="w-full px-4 py-3 bg-[#0A1628] border border-[#2A3A55] rounded-lg text-[#E8EDF5] placeholder-[#8899BB] focus:border-teal-600 focus:ring-2 focus:ring-teal-600 focus:ring-opacity-20 transition-all resize-none"
              rows={5}
            />
          </div>
          <p className="text-xs" style={{ color: '#9ca3af' }}>
            Minimum 10 characters • Be specific for better results
          </p>
        </div>
      </Card>

      {/* Configuration */}
      <Card>
        <div className="space-y-6">
          {/* Depth - Only show for non-trends */}
          {reportType !== 'trends_report' && (
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#0c3649' }}>
                Research Depth
              </label>
              <div className="grid grid-cols-3 gap-4">
                {(['light', 'standard', 'deep'] as const).map(d => (
                  <button key={d} onClick={() => setDepth(d)} className={clsx(
                    'p-4 rounded-lg border-2 transition-all text-left',
                    depth === d ? 'border-teal-600 bg-teal-600 bg-opacity-10' : 'border-[#2A3A55] hover:border-[#3A4A65]'
                  )}>
                    <p className="font-semibold text-[#E8EDF5] capitalize">{d}</p>
                    <p className="text-sm text-[#8899BB] mt-1">
                      {d === 'light' && '~15 pages'}{d === 'standard' && '~50 pages'}{d === 'deep' && '~150+ pages'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Regions */}
          <div>
            <label className="block text-sm font-semibold mb-3" style={{ color: '#0c3649' }}>
              Geographic Focus
            </label>
            <div className="grid grid-cols-2 gap-3">
              {regionOptions.map(region => (
                <button key={region} onClick={() => toggleRegion(region)} className={clsx(
                  'p-3 rounded-lg border-2 transition-all text-left',
                  regions.includes(region) ? 'border-teal-600 bg-teal-600 bg-opacity-10' : 'border-[#2A3A55] hover:border-[#3A4A65]'
                )}>
                  <p className="text-sm font-medium text-[#E8EDF5]">{region}</p>
                </button>
              ))}
              {regions.filter(r => !regionOptions.includes(r)).map(customRegion => (
                <button key={customRegion} onClick={() => toggleRegion(customRegion)}
                  className="p-3 rounded-lg border-2 transition-all text-left border-teal-600 bg-teal-600 bg-opacity-10">
                  <p className="text-sm font-medium text-[#E8EDF5] flex justify-between">
                    <span>{customRegion}</span><span className="opacity-60 ml-2">✕</span>
                  </p>
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Or enter a specific country..."
                value={customCountry}
                onChange={e => setCustomCountry(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomCountry(); } }}
                className="flex-1 px-4 py-2 bg-[#0A1628] border border-[#2A3A55] rounded-lg text-[#E8EDF5] placeholder-[#8899BB] focus:border-teal-600 focus:ring-2 focus:ring-teal-600 focus:ring-opacity-20 transition-all"
              />
              <Button variant="ghost" type="button" onClick={handleAddCustomCountry}>Add</Button>
            </div>
          </div>

          {/* Advanced Options - Only show for non-trends */}
          {reportType !== 'trends_report' && (
            <div className="border-t border-[#2A3A55] pt-6">
              <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-teal-600 hover:text-teal-500 font-medium text-sm">
                <svg className={clsx('w-4 h-4 transition-transform', showAdvanced && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                Advanced Options
              </button>
              {showAdvanced && (
                <div className="mt-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[#E8EDF5] mb-2">Competitor Count: {competitorCount}</label>
                    <input type="range" min="5" max="20" value={competitorCount} onChange={e => setCompetitorCount(parseInt(e.target.value))}
                      className="w-full h-2 bg-[#2A3A55] rounded-lg appearance-none cursor-pointer accent-teal-600" />
                    <p className="text-xs text-[#8899BB] mt-1">More competitors = deeper analysis</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#E8EDF5] mb-3">Forecast Period</label>
                    <div className="flex gap-3">
                      {[5, 7, 10].map(years => (
                        <button key={years} onClick={() => setForecastYears(years)} className={clsx(
                          'px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium',
                          forecastYears === years ? 'border-teal-600 bg-teal-600 bg-opacity-10 text-teal-400' : 'border-[#2A3A55] text-[#8899BB] hover:border-[#3A4A65]'
                        )}>
                          {years} years
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Credit Cost Preview */}
      <Card variant="highlighted">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-[#8899BB]">Estimated Cost</p>
            <p className="text-3xl font-bold mt-1" style={{ color: accent }}>{currentCost} credits</p>
            <p className="text-xs text-[#8899BB] mt-2">Costs may vary based on complexity</p>
          </div>
        </div>
      </Card>

      {/* Buttons */}
      <div className="flex gap-4 justify-end">
        <Button variant="ghost" href="/wizard" size="lg">Back</Button>
        <Button variant="primary" size="lg" onClick={handleContinue} disabled={!isValid}>
          Continue to Confirm →
        </Button>
      </div>
    </div>
  );
}
