'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type ReportType = 'industry_report' | 'datapack';
type Depth = 'light' | 'standard' | 'deep';

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

  const creditCosts = {
    light: { industry_report: 30, datapack: 15 },
    standard: { industry_report: 50, datapack: 30 },
    deep: { industry_report: 100, datapack: 60 },
  };

  const currentCost = creditCosts[depth][reportType];

  const regionOptions = [
    'Global',
    'North America',
    'Europe',
    'Asia-Pacific',
    'South America',
    'Middle East & Africa',
  ];

  const toggleRegion = (region: string) => {
    setRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region]
    );
  };

  const handleAddCustomCountry = () => {
    const country = customCountry.trim();
    if (country && !regions.includes(country)) {
      setRegions((prev) => [...prev, country]);
    }
    setCustomCountry('');
  };

  const handleContinue = () => {
    // Store in sessionStorage since we're doing client-side navigation
    sessionStorage.setItem(
      'wizardState',
      JSON.stringify({
        reportType,
        query,
        depth,
        regions,
        competitorCount,
        forecastYears,
      })
    );
    router.push('/wizard/confirm');
  };

  const isValid = query.trim().length > 10;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#E8EDF5] mb-2">Describe Your Research</h1>
        <p className="text-[#8899BB]">Tell us what market you want to research</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-semibold">
            ✓
          </div>
          <div className="flex-1 h-1 bg-teal-600" />
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-semibold">
            2
          </div>
          <div className="flex-1 h-1 bg-[#2A3A55]" />
          <div className="w-8 h-8 rounded-full bg-[#2A3A55] text-[#8899BB] flex items-center justify-center text-sm font-semibold">
            3
          </div>
        </div>
      </div>

      {/* Query Input */}
      <Card>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#E8EDF5] mb-2">
              Research Query
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="E.g., 'Market for AI-powered customer service chatbots in North America, including competitive landscape, market size forecast, and technology trends'"
              className="w-full px-4 py-3 bg-[#0A1628] border border-[#2A3A55] rounded-lg text-[#E8EDF5] placeholder-[#8899BB] focus:border-teal-600 focus:ring-2 focus:ring-teal-600 focus:ring-opacity-20 transition-all resize-none"
              rows={5}
            />
          </div>
          <p className="text-xs text-[#8899BB]">
            Minimum 10 characters • Be specific for better results
          </p>
        </div>
      </Card>

      {/* Configuration */}
      <Card>
        <div className="space-y-6">
          {/* Depth Selection */}
          <div>
            <label className="block text-sm font-semibold text-[#E8EDF5] mb-3">
              Research Depth
            </label>
            <div className="grid grid-cols-3 gap-4">
              {(['light', 'standard', 'deep'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDepth(d)}
                  className={clsx(
                    'p-4 rounded-lg border-2 transition-all text-left',
                    depth === d
                      ? 'border-teal-600 bg-teal-600 bg-opacity-10'
                      : 'border-[#2A3A55] hover:border-[#3A4A65]'
                  )}
                >
                  <p className="font-semibold text-[#E8EDF5] capitalize">{d}</p>
                  <p className="text-sm text-[#8899BB] mt-1">
                    {d === 'light' && '~15 pages'}
                    {d === 'standard' && '~50 pages'}
                    {d === 'deep' && '~150+ pages'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Regions */}
          <div>
            <label className="block text-sm font-semibold text-[#E8EDF5] mb-3">
              Geographic Focus
            </label>
            <div className="grid grid-cols-2 gap-3">
              {regionOptions.map((region) => (
                <button
                  key={region}
                  onClick={() => toggleRegion(region)}
                  className={clsx(
                    'p-3 rounded-lg border-2 transition-all text-left',
                    regions.includes(region)
                      ? 'border-teal-600 bg-teal-600 bg-opacity-10'
                      : 'border-[#2A3A55] hover:border-[#3A4A65]'
                  )}
                >
                  <p className="text-sm font-medium text-[#E8EDF5]">{region}</p>
                </button>
              ))}
              {regions.filter(r => !regionOptions.includes(r)).map((customRegion) => (
                <button
                  key={customRegion}
                  onClick={() => toggleRegion(customRegion)}
                  className="p-3 rounded-lg border-2 transition-all text-left border-teal-600 bg-teal-600 bg-opacity-10"
                >
                  <p className="text-sm font-medium text-[#E8EDF5] flex justify-between">
                    <span>{customRegion}</span>
                    <span className="opacity-60 ml-2">✕</span>
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Or enter a specific country..."
                value={customCountry}
                onChange={(e) => setCustomCountry(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomCountry();
                  }
                }}
                className="flex-1 px-4 py-2 bg-[#0A1628] border border-[#2A3A55] rounded-lg text-[#E8EDF5] placeholder-[#8899BB] focus:border-teal-600 focus:ring-2 focus:ring-teal-600 focus:ring-opacity-20 transition-all"
              />
              <Button variant="ghost" type="button" onClick={handleAddCustomCountry}>
                Add
              </Button>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="border-t border-[#2A3A55] pt-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-teal-600 hover:text-teal-500 font-medium text-sm"
            >
              <svg
                className={clsx(
                  'w-4 h-4 transition-transform',
                  showAdvanced && 'rotate-180'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
              Advanced Options
            </button>

            {showAdvanced && (
              <div className="mt-6 space-y-6">
                {/* Competitor Count */}
                <div>
                  <label className="block text-sm font-medium text-[#E8EDF5] mb-2">
                    Competitor Count: {competitorCount}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    value={competitorCount}
                    onChange={(e) => setCompetitorCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-[#2A3A55] rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                  <p className="text-xs text-[#8899BB] mt-1">More competitors = deeper analysis</p>
                </div>

                {/* Forecast Years */}
                <div>
                  <label className="block text-sm font-medium text-[#E8EDF5] mb-3">
                    Forecast Period
                  </label>
                  <div className="flex gap-3">
                    {[5, 7, 10].map((years) => (
                      <button
                        key={years}
                        onClick={() => setForecastYears(years)}
                        className={clsx(
                          'px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium',
                          forecastYears === years
                            ? 'border-teal-600 bg-teal-600 bg-opacity-10 text-teal-400'
                            : 'border-[#2A3A55] text-[#8899BB] hover:border-[#3A4A65]'
                        )}
                      >
                        {years} years
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Credit Cost Preview */}
      <Card variant="highlighted">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-[#8899BB]">Estimated Cost</p>
            <p className="text-3xl font-bold text-teal-600 mt-1">{currentCost} credits</p>
            <p className="text-xs text-[#8899BB] mt-2">Costs may vary based on complexity</p>
          </div>
        </div>
      </Card>

      {/* Buttons */}
      <div className="flex gap-4 justify-end">
        <Button variant="ghost" href="/wizard" size="lg">
          Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleContinue}
          disabled={!isValid}
        >
          Continue to Confirm →
        </Button>
      </div>
    </div>
  );
}

import { clsx } from 'clsx';
