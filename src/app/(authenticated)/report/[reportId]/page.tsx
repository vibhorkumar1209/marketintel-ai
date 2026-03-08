'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { IndustryReport } from '@/types/reports';
import { clsx } from 'clsx';

export default function ReportPage() {
  const params = useParams();
  const reportId = params.reportId as string;

  const [report, setReport] = useState<IndustryReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState(0);
  const [showToc, setShowToc] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/report/${reportId}`);
        if (!res.ok) {
          setError('Failed to load report');
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        setReport(data);
      } catch (err) {
        setError('An error occurred while loading the report');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-[#8899BB]">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-red-600 bg-opacity-10 border-red-600">
          <div className="text-center space-y-4">
            <p className="text-red-300 font-semibold">Error</p>
            <p className="text-[#8899BB]">{error || 'Report not found'}</p>
            <Button variant="primary" href="/dashboard">
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const tableOfContents = [
    'Executive Summary',
    ...report.sections.map((s) => s.title),
  ];

  return (
    <div className="space-y-8">
      {/* Header with Downloads */}
      <div className="sticky top-0 z-30 bg-[#0A1628] border-b border-[#2A3A55] -mx-4 -mt-8 px-4 sm:px-6 lg:px-8 py-6 sm:flex items-center justify-between">
        <div className="flex-1 mb-4 sm:mb-0">
          <h1 className="text-3xl font-bold text-[#E8EDF5] mb-2">{report.title}</h1>
          <div className="flex items-center gap-3 text-sm text-[#8899BB]">
            <span>
              Generated {new Date(report.metadata.generatedAt).toLocaleDateString()}
            </span>
            {report.metadata.qualityScore && (
              <>
                <span>•</span>
                <Badge variant="teal">
                  Quality: {report.metadata.qualityScore.toFixed(0)}%
                </Badge>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            href={`/api/report/${reportId}/download/pdf`}
          >
            📥 PDF
          </Button>
          <Button
            variant="secondary"
            size="md"
            href={`/api/report/${reportId}/download/xlsx`}
          >
            📊 Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Table of Contents */}
        <aside className={clsx(
          'lg:col-span-1',
          !showToc && 'hidden lg:block'
        )}>
          <div className="sticky top-32 space-y-4">
            <div className="flex items-center justify-between lg:hidden mb-4">
              <h3 className="font-semibold text-[#E8EDF5]">Contents</h3>
              <button
                onClick={() => setShowToc(!showToc)}
                className="text-teal-600 hover:text-teal-500"
              >
                ✕
              </button>
            </div>

            <nav className="scrollbar-thin overflow-y-auto max-h-[calc(100vh-150px)] space-y-2">
              {tableOfContents.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveSection(idx);
                    setShowToc(false);
                  }}
                  className={clsx(
                    'block w-full text-left px-3 py-2 rounded-lg transition-all text-sm',
                    activeSection === idx
                      ? 'bg-teal-600 bg-opacity-20 text-teal-400 border-l-2 border-teal-600'
                      : 'text-[#8899BB] hover:bg-[#1B2A4A] hover:text-[#E8EDF5]'
                  )}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3 space-y-8">
          {/* Toggle TOC on mobile */}
          {!showToc && (
            <button
              onClick={() => setShowToc(true)}
              className="lg:hidden px-4 py-2 bg-[#111827] border border-[#2A3A55] rounded-lg text-[#8899BB] hover:text-[#E8EDF5] transition-colors w-full text-left"
            >
              ≡ Show Table of Contents
            </button>
          )}

          {/* Executive Summary */}
          {activeSection === 0 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-3xl font-bold text-[#E8EDF5] mb-4">Executive Summary</h2>
              </div>

              {/* Market Headline */}
              <Card className="bg-gradient-to-r from-teal-600 from-opacity-10 to-teal-600 to-opacity-5 border-teal-600">
                <p className="text-lg font-semibold text-teal-300 leading-relaxed">
                  {report.executiveSummary.headline}
                </p>
              </Card>

              {/* KPI Panel */}
              <Card>
                <div className="grid md:grid-cols-2 gap-6">
                  {report.executiveSummary.kpiPanel.map((kpi, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-[#0A1628] border border-[#2A3A55] rounded-lg"
                    >
                      <p className="text-sm text-[#8899BB] mb-1">{kpi.label}</p>
                      <p className="text-2xl font-bold text-teal-600 mb-1">{kpi.value}</p>
                      <p className="text-xs text-[#8899BB]">From: {(kpi as { label: string; value: string; source_section?: string }).source_section || 'Analysis'}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Body Paragraphs */}
              <Card>
                <div className="space-y-4">
                  {report.executiveSummary.paragraphs.map((para, idx) => (
                    <p key={idx} className="text-[#E8EDF5] leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
              </Card>

              {/* Scenarios */}
              <Card>
                <h3 className="text-xl font-semibold text-[#E8EDF5] mb-4">Market Scenarios</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { label: 'Bull Case', value: report.executiveSummary.scenarios.bull, icon: '📈' },
                    { label: 'Base Case', value: report.executiveSummary.scenarios.base, icon: '→' },
                    { label: 'Bear Case', value: report.executiveSummary.scenarios.bear, icon: '📉' },
                  ].map((scenario, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-[#0A1628] border border-[#2A3A55] rounded-lg"
                    >
                      <div className="text-3xl mb-2">{scenario.icon}</div>
                      <p className="text-sm font-semibold text-[#E8EDF5] mb-2">
                        {scenario.label}
                      </p>
                      <p className="text-sm text-[#8899BB]">{scenario.value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Report Sections */}
          {report.sections.map((section, idx) => (
            activeSection === idx + 1 && (
              <div key={section.id} className="space-y-6 animate-fade-in">
                {/* Section Header */}
                <div className="pb-4 border-b border-[#2A3A55]">
                  <h2 className="text-3xl font-bold text-[#E8EDF5] mb-2">{section.title}</h2>
                  {section.flags && section.flags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {section.flags.map((flag, fidx) => (
                        <Badge key={fidx} variant="amber">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <Card>
                  <div className="space-y-4">
                    {section.content.map((paragraph, pidx) => (
                      <p key={pidx} className="text-[#E8EDF5] leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </Card>

                {/* Key Table */}
                {section.keyTable && (
                  <Card>
                    <h3 className="text-lg font-semibold text-[#E8EDF5] mb-4">
                      {(section.keyTable as { title?: string }).title || 'Data Table'}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        {(section.keyTable as { headers?: string[] }).headers && (
                          <thead>
                            <tr className="border-b border-[#2A3A55]">
                              {((section.keyTable as { headers?: string[] }).headers || []).map((header, hidx) => (
                                <th
                                  key={hidx}
                                  className="text-left px-3 py-3 font-semibold text-[#8899BB]"
                                >
                                  {String(header)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                        )}
                        <tbody>
                          {((section.keyTable as { rows?: unknown[] }).rows || []).map((row, ridx) => (
                            <tr
                              key={ridx}
                              className="border-b border-[#2A3A55] hover:bg-[#111827]"
                            >
                              {(Array.isArray(row) ? row : Object.values(row as object)).map((cell, cidx) => (
                                <td
                                  key={cidx}
                                  className="px-3 py-3 text-[#E8EDF5]"
                                >
                                  {String(cell ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* Chart Placeholder */}
                {section.chartSpec && (
                  <Card>
                    <div className="aspect-video bg-gradient-to-br from-teal-600 from-opacity-10 to-teal-600 to-opacity-5 border border-teal-600 border-opacity-30 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-3">📊</div>
                        <p className="text-[#E8EDF5] font-semibold mb-1">
                          {String((section.chartSpec as { title?: unknown }).title || 'Chart')}
                        </p>
                        <p className="text-sm text-[#8899BB]">
                          {String((section.chartSpec as { type?: unknown }).type || 'Data Visualization')}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Citations */}
                {section.citations && section.citations.length > 0 && (
                  <Card>
                    <h3 className="text-lg font-semibold text-[#E8EDF5] mb-4">Sources</h3>
                    <ul className="space-y-3">
                      {section.citations.map((citation, cidx) => (
                        <li key={cidx} className="text-sm">
                          <p className="text-[#E8EDF5] mb-1">"{String(citation.claim || '')}"</p>
                          <p className="text-[#8899BB]">
                            <Badge variant="teal">{String(citation.tier || 'N/A')}</Badge>
                            <span className="ml-2">{String(citation.source || '')}</span>
                            <span className="ml-2 text-xs">({String(citation.date || 'N/A')})</span>
                          </p>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
            )
          ))}
        </main>
      </div>
    </div>
  );
}
