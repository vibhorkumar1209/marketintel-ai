'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { clsx } from 'clsx';

export default function WizardProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || '';
  const [selectedType, setSelectedType] = useState<'industry_report' | 'datapack' | ''>(
    (initialType as any) || ''
  );

  const handleContinue = () => {
    if (selectedType) {
      router.push(`/wizard/query?type=${selectedType}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#E8EDF5] mb-2">Choose Report Type</h1>
        <p className="text-[#8899BB]">What type of market intelligence do you need?</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-semibold">
            1
          </div>
          <div className="flex-1 h-1 bg-teal-600" />
          <div className="w-8 h-8 rounded-full bg-[#2A3A55] text-[#8899BB] flex items-center justify-center text-sm font-semibold">
            2
          </div>
          <div className="flex-1 h-1 bg-[#2A3A55]" />
          <div className="w-8 h-8 rounded-full bg-[#2A3A55] text-[#8899BB] flex items-center justify-center text-sm font-semibold">
            3
          </div>
        </div>
      </div>

      {/* Product Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Industry Report */}
        <Card
          onClick={() => setSelectedType('industry_report')}
          variant={selectedType === 'industry_report' ? 'highlighted' : 'default'}
          className={clsx(
            'cursor-pointer transition-all',
            selectedType === 'industry_report' && 'ring-2 ring-teal-600'
          )}
        >
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-5xl mb-4">📋</div>
                <h2 className="text-2xl font-bold text-[#E8EDF5]">Industry Report</h2>
                <p className="text-[#8899BB] mt-1">15-Section Deep Research Report</p>
              </div>
            </div>

            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-[#E8EDF5]">
                <span className="text-teal-500 mt-1">✓</span>
                <div>
                  <p className="font-medium">150–200 pages</p>
                  <p className="text-sm text-[#8899BB]">Comprehensive market analysis</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-[#E8EDF5]">
                <span className="text-teal-500 mt-1">✓</span>
                <div>
                  <p className="font-medium">8-step agent chain</p>
                  <p className="text-sm text-[#8899BB]">Multi-agent research pipeline</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-[#E8EDF5]">
                <span className="text-teal-500 mt-1">✓</span>
                <div>
                  <p className="font-medium">PDF + HTML output</p>
                  <p className="text-sm text-[#8899BB]">Multiple export formats</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-[#E8EDF5]">
                <span className="text-teal-500 mt-1">✓</span>
                <div>
                  <p className="font-medium">Full source citations</p>
                  <p className="text-sm text-[#8899BB]">Every claim verified and sourced</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-[#E8EDF5]">
                <span className="text-teal-500 mt-1">✓</span>
                <div>
                  <p className="font-medium">Quality scored sections</p>
                  <p className="text-sm text-[#8899BB]">Confidence ratings per section</p>
                </div>
              </li>
            </ul>

            <div className="border-t border-[#2A3A55] pt-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-2xl font-bold text-teal-600">From $49</p>
                <Badge variant="teal">50 credits</Badge>
              </div>
              <div className={clsx(
                'p-3 rounded-lg text-sm font-medium text-center transition-all',
                selectedType === 'industry_report'
                  ? 'bg-teal-600 text-white'
                  : 'bg-teal-600 bg-opacity-10 text-teal-400 hover:bg-opacity-20'
              )}>
                {selectedType === 'industry_report' ? '✓ Selected' : 'Select This'}
              </div>
            </div>
          </div>
        </Card>

        {/* Market Datapack */}
        <Card
          onClick={() => setSelectedType('datapack')}
          variant={selectedType === 'datapack' ? 'highlighted' : 'default'}
          className={clsx(
            'cursor-pointer transition-all',
            selectedType === 'datapack' && 'ring-2 ring-teal-600'
          )}
        >
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-5xl mb-4">📊</div>
                <h2 className="text-2xl font-bold text-[#E8EDF5]">Market Datapack</h2>
                <p className="text-[#8899BB] mt-1">10-Sheet Excel File</p>
              </div>
            </div>

            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-[#E8EDF5]">
                <span className="text-teal-500 mt-1">✓</span>
                <div>
                  <p className="font-medium">Time-series data</p>
                  <p className="text-sm text-[#8899BB]">Historical and forecast data</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-[#E8EDF5]">
                <span className="text-teal-500 mt-1">✓</span>
                <div>
                  <p className="font-medium">Segmentation analysis</p>
                  <p className="text-sm text-[#8899BB]">Market breakdown by key dimensions</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-[#E8EDF5]">
                <span className="text-teal-500 mt-1">✓</span>
                <div>
                  <p className="font-medium">6-step agent chain</p>
                  <p className="text-sm text-[#8899BB]">Optimized for data extraction</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-[#E8EDF5]">
                <span className="text-teal-500 mt-1">✓</span>
                <div>
                  <p className="font-medium">XLSX output</p>
                  <p className="text-sm text-[#8899BB]">Ready for pivot tables & analysis</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-[#E8EDF5]">
                <span className="text-teal-500 mt-1">✓</span>
                <div>
                  <p className="font-medium">Quick turnaround</p>
                  <p className="text-sm text-[#8899BB]">Faster generation than reports</p>
                </div>
              </li>
            </ul>

            <div className="border-t border-[#2A3A55] pt-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-2xl font-bold text-teal-600">From $30</p>
                <Badge variant="amber">30 credits</Badge>
              </div>
              <div className={clsx(
                'p-3 rounded-lg text-sm font-medium text-center transition-all',
                selectedType === 'datapack'
                  ? 'bg-teal-600 text-white'
                  : 'bg-teal-600 bg-opacity-10 text-teal-400 hover:bg-opacity-20'
              )}>
                {selectedType === 'datapack' ? '✓ Selected' : 'Select This'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Continue Button */}
      <div className="flex gap-4 justify-end">
        <Button variant="ghost" href="/dashboard" size="lg">
          Cancel
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleContinue}
          disabled={!selectedType}
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}
