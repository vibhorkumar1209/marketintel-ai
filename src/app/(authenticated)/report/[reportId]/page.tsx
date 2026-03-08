'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import ReportChart from '@/components/charts/ReportChart';
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
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 0,
      background: '#f9fafb', minHeight: '100vh',
      margin: '-32px', padding: 0  // break out of layout padding
    }}>
      {/* ── Report Header ── */}
      <div style={{
        background: '#0c3649',
        padding: '24px 32px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#7eaabf', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>Industry Report</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#E8F0F5', lineHeight: 1.3, marginBottom: 8 }}>{report.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#7eaabf' }}>Generated {new Date(report.metadata.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            {report.metadata.qualityScore && (
              <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(52,145,232,0.2)', color: '#6ab8ff', border: '1px solid rgba(52,145,232,0.35)', borderRadius: 4, padding: '2px 8px' }}>
                Quality: {report.metadata.qualityScore.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <a
            href={`/api/report/${reportId}/download/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600,
              background: 'rgba(255,255,255,0.1)', color: '#E8F0F5',
              border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            ↓ Print/PDF
          </a>
          <a
            href={`/api/report/${reportId}/download/xlsx`}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600,
              background: '#E63946', color: '#fff', border: 'none', cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            ↓ Excel
          </a>
        </div>
      </div>

      {/* ── Horizontal Section Nav ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: '#fff',
        borderBottom: '2px solid #e5e7eb',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        overflowX: 'auto',
      }}>
        <div style={{ display: 'flex', padding: '0 32px', whiteSpace: 'nowrap', minWidth: 'max-content' }}>
          {tableOfContents.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSection(idx)}
              style={{
                padding: '14px 18px',
                fontSize: 13,
                fontWeight: activeSection === idx ? 700 : 500,
                color: activeSection === idx ? '#E63946' : '#374151',
                background: 'none',
                border: 'none',
                borderBottom: activeSection === idx ? '2px solid #E63946' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 150ms ease',
                flexShrink: 0,
              } as React.CSSProperties}
            >
              {idx === 0 ? '✦ Exec Summary' : item}
            </button>
          ))}
        </div>
      </div>


      {/* ── Section Content ── */}
      <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto' }}>

        {/* Executive Summary */}
        {activeSection === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Big headline card */}
            <div style={{
              borderLeft: '4px solid #3491E8',
              paddingLeft: 20,
              paddingTop: 8, paddingBottom: 8,
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#3491E8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>Market Headline</p>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', lineHeight: 1.65 }}>
                {report.executiveSummary.headline}
              </p>
            </div>

            {/* KPI panel */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {report.executiveSummary.kpiPanel.map((kpi, idx) => (
                <div key={idx} style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderTop: `3px solid ${idx % 2 === 0 ? '#3491E8' : '#E63946'}`,
                  borderRadius: 10,
                  padding: '16px 20px',
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>{kpi.label}</p>
                  <p style={{ fontSize: 24, fontWeight: 900, color: '#0c3649', fontFamily: 'DM Mono, monospace' }}>{kpi.value}</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Source: {(kpi as { label: string; value: string; source_section?: string }).source_section || 'Analysis'}</p>
                </div>
              ))}
            </div>

            {/* Body paragraphs */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {report.executiveSummary.paragraphs.map((para, idx) => (
                  <p key={idx} style={{ color: '#1f2937', lineHeight: 1.75, fontSize: 14 }}>{para}</p>
                ))}
              </div>
            </div>

            {/* Scenarios */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0c3649', marginBottom: 16 }}>Market Scenarios</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Bull Case', value: report.executiveSummary.scenarios.bull, color: '#3491E8' },
                  { label: 'Base Case', value: report.executiveSummary.scenarios.base, color: '#0c3649' },
                  { label: 'Bear Case', value: report.executiveSummary.scenarios.bear, color: '#E63946' },
                ].map((scenario, idx) => (
                  <div key={idx} style={{
                    padding: '14px 16px',
                    borderLeft: `4px solid ${scenario.color}`,
                    background: '#f9fafb',
                    borderRadius: 8,
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: scenario.color, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>{scenario.label}</p>
                    <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{scenario.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Report Sections */}
        {report.sections.map((section, idx) =>
          activeSection === idx + 1 && (
            <div key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Section Header */}
              <div style={{ borderBottom: '2px solid #3491E8', paddingBottom: 14, marginBottom: 4 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#3491E8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>Section {idx + 1}</p>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0c3649' }}>{section.title}</h2>
                {section.flags && section.flags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    {section.flags.map((flag, fidx) => (
                      <span key={fidx} style={{
                        fontSize: 11, fontWeight: 600, color: '#92400e',
                        background: '#fef3c7', border: '1px solid #fcd34d',
                        borderRadius: 4, padding: '3px 8px',
                      }}>{flag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Body Content */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {section.content.map((paragraph, pidx) => (
                    <p key={pidx} style={{ color: '#1f2937', lineHeight: 1.8, fontSize: 14 }}>{paragraph}</p>
                  ))}
                </div>
              </div>

              {/* Key Table */}
              {section.keyTable && (
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ background: '#0c3649', padding: '12px 20px' }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#E8F0F5', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {(section.keyTable as { title?: string }).title || 'Data Table'}
                    </h3>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      {(section.keyTable as { headers?: string[] }).headers && (
                        <thead>
                          <tr style={{ background: '#f1f5f9' }}>
                            {((section.keyTable as { headers?: string[] }).headers || []).map((header, hidx) => (
                              <th key={hidx} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#3491E8', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #e5e7eb' }}>
                                {String(header)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                      )}
                      <tbody>
                        {((section.keyTable as { rows?: unknown[] }).rows || []).map((row, ridx) => (
                          <tr key={ridx} style={{ background: ridx % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                            {(Array.isArray(row) ? row : Object.values(row as object)).map((cell, cidx) => (
                              <td key={cidx} style={{ padding: '10px 16px', color: cidx === 0 ? '#0c3649' : '#374151', fontWeight: cidx === 0 ? 600 : 400 }}>
                                {String(cell ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Chart */}
              {section.chartSpec && (
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 24 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0c3649', marginBottom: 4 }}>
                    {String((section.chartSpec as { title?: unknown }).title || 'Market Chart')}
                  </h3>
                  <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
                    {String((section.chartSpec as { type?: unknown }).type || 'line')} chart
                  </p>
                  <ReportChart
                    chartSpec={section.chartSpec as any}
                    sizing={(report as any).sizing}
                  />
                </div>
              )}

              {/* Citations */}
              {section.citations && section.citations.length > 0 && (
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 }}>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 14 }}>Sources</h4>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {section.citations.map((citation, cidx) => (
                      <li key={cidx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, background: '#3491E820', color: '#3491E8', border: '1px solid #3491E835', borderRadius: 4, padding: '2px 7px', flexShrink: 0 }}>
                          {String(citation.tier || 'N/A')}
                        </span>
                        <div>
                          <span style={{ fontSize: 13, color: '#374151' }}>&ldquo;{String(citation.claim || '')}&rdquo;</span>
                          <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>{String(citation.source || '')} ({String(citation.date || 'N/A')})</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
