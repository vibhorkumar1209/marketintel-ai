'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Spinner from '@/components/ui/Spinner';
import ReportChart from '@/components/charts/ReportChart';
import { IndustryReport } from '@/types/reports';

// ── Design tokens (dark-card aesthetic matching screenshot) ───────────────────
const T = {
  bg: '#f9fafb',   // page background — light
  card: '#ffffff',   // light card
  cardBorder: '#e5e7eb',   // card border
  cardSurface: '#f3f4f6',   // slightly darker surface inside cards
  teal: '#0C3649',   // primary accent (#0C3649)
  blue: '#3491E8',   // secondary accent (#3491E8)
  red: '#E63946',   // danger / CTA (#E63946)
  amber: '#FFCD1A',   // warning (#FFCD1A)
  text: '#0c3649',   // primary text
  muted: '#64748b',   // secondary text
  navy: '#0C3649',   // header background
};

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconDownload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const IconBack = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);
const IconTable = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" />
  </svg>
);
const IconSource = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </svg>
);
const IconChart = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────
function Card({ children, style = {}, className = "" }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div className={`bg-white border border-[#e5e7eb] rounded-xl p-5 md:p-8 ${className}`} style={style}>
      {children}
    </div>
  );
}

function SectionLabel({ text, color = T.teal }: { text: string; color?: string }) {
  return (
    <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color }}>
      {text}
    </p>
  );
}

// ── Main Report Page ──────────────────────────────────────────────────────────
export default function ReportPage() {
  const params = useParams();
  const { data: session } = useSession();
  const reportId = params.reportId as string;
  const [report, setReport] = useState<IndustryReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    fetch(`/api/report/${reportId}`)
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load report'))
      .then(setReport)
      .catch(e => setError(String(e)))
      .finally(() => setIsLoading(false));
  }, [reportId]);

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, background: T.bg }}>
      <div style={{ textAlign: 'center' }}>
        <Spinner size="lg" />
        <p style={{ color: T.muted, marginTop: 12, fontSize: 14 }}>Loading report...</p>
      </div>
    </div>
  );

  if (error || !report) return (
    <div className="p-4 md:p-8">
      <Card className="text-center p-10">
        <p className="text-red-500 font-bold text-lg mb-2">Error loading report</p>
        <p className="text-slate-500 text-sm mb-5">{error || 'Report not found'}</p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0C3649] text-white font-bold text-sm no-underline">
          <IconBack /> Back to Dashboard
        </Link>
      </Card>
    </div>
  );

  // Safety: ensure report is available for rendering
  if (!report) return null;

  const isTrends = (report as any).reportType === 'trends_report';

  let scopeSection: any, otherSections: any[], appendixSection: any, visibleSections: any[], tabs: string[], tocEntries: any[];

  const HIDE_KEYWORDS = /(source|methodology|estimation|assumption|confidence|primary)/i;
  const isAdmin = session?.user?.role === 'admin';

  if (isTrends) {
    const trendsSection = report.sections.find((s: any) => s.id === 'dynamics');
    if (trendsSection) trendsSection.title = 'Trend Report';
    visibleSections = trendsSection ? [trendsSection] : [];
    tabs = ['Trend Report'];
    tocEntries = visibleSections.map((s: any) => ({ title: s.title, id: s.id, subsections: s.subsections }));
  } else {
    scopeSection = report.sections.find((s: any) =>
      s.id === 'intro' ||
      s.id === 'market_report_scope' ||
      (s.title && s.title.toLowerCase().includes('report scope'))
    );
    otherSections = report.sections.filter((s: any) =>
      s.id !== (scopeSection?.id || 'intro') &&
      s.id !== (scopeSection?.id || 'market_report_scope') &&
      s.id !== 'appendix'
    );
    appendixSection = report.sections.find((s: any) => s.id === 'appendix');

    visibleSections = [
      ...(scopeSection ? [scopeSection] : []),
      ...otherSections,
      ...(appendixSection ? [appendixSection] : [])
    ];

    tabs = [
      ...(scopeSection ? [scopeSection.title] : []),
      'Executive Summary',
      ...(otherSections || []).map((s: any) => s.title),
      ...(appendixSection && isAdmin ? [appendixSection.title] : [])
    ];

    tocEntries = [
      ...(scopeSection ? [{ title: scopeSection.title, id: scopeSection.id, subsections: scopeSection.subsections }] : []),
      { title: 'Executive Summary', id: 'exsum', subsections: [] },
      ...(otherSections || []).map((s: any) => ({ title: s.title, id: s.id, subsections: s.subsections })),
      ...(appendixSection && isAdmin ? [{ title: appendixSection.title, id: appendixSection.id, subsections: appendixSection.subsections }] : [])
    ];
  }

  return (
    <div className="-m-4 md:-m-8 flex flex-col" style={{ background: T.bg, minHeight: '100vh' }}>

      {/* ── Dark header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 p-5 md:p-8" style={{ background: T.navy }}>
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <a href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.muted, textDecoration: 'none', marginBottom: 10 }}>
            <IconBack /> Back to Dashboard
          </a>
          <SectionLabel text="Industry Report" color={T.muted} />
          <h1 style={{ fontSize: 'clamp(18px, 4vw, 21px)', fontWeight: 800, color: '#ffffff', lineHeight: 1.3, marginBottom: 8 }}>{report.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: T.muted }}>
              Generated {new Date(report.metadata.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            {report.metadata.qualityScore && (
              <span style={{ fontSize: 11, fontWeight: 700, background: `${T.teal}22`, color: T.teal, border: `1px solid ${T.teal}44`, borderRadius: 20, padding: '2px 10px' }}>
                Quality: {report.metadata.qualityScore.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap sm:pt-7">
          <a href={`/api/report/${reportId}/download/pdf`} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '8px 14px md:padding: 9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: 'rgba(255,255,255,0.08)', color: '#ffffff',
            border: `1px solid rgba(255,255,255,0.15)`, textDecoration: 'none',
          }}>
            <IconDownload /> <span className="hidden sm:inline">Print / PDF</span><span className="sm:hidden">PDF</span>
          </a>
          <a href={`/api/report/${reportId}/download/xlsx`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '8px 14px md:padding: 9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: T.red, color: '#fff', border: 'none', textDecoration: 'none',
          }}>
            <IconDownload /> <span className="hidden sm:inline">Excel Export</span><span className="sm:hidden">Excel</span>
          </a>
        </div>
      </div>

      {/* ── Section Navigation (Dropdown on Mobile, Tabs on Desktop) ── */}
      <div className="sticky top-14 md:top-0 z-30" style={{
        background: T.card, borderBottom: `1px solid ${T.cardBorder}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}>
        {/* Mobile Dropdown */}
        <div className="md:hidden px-4 py-3">
          <div className="relative">
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(parseInt(e.target.value))}
              className="w-full bg-white border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm font-bold text-[#0C3649] appearance-none focus:outline-none focus:ring-2 focus:ring-[#3491E8]/20"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%230C3649\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
            >
              {(tabs || []).map((tab, idx) => (
                <option key={idx} value={idx}>{idx === 0 ? `✦ ${tab}` : `${idx + 1}. ${tab}`}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden md:flex px-6 whitespace-nowrap overflow-x-auto scrollbar-hide">
          {(tabs || []).map((tab, idx) => {
            const active = activeSection === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveSection(idx)}
                style={{
                  padding: '14px 18px', fontSize: 13, fontWeight: active ? 700 : 500,
                  color: active ? T.teal : T.muted,
                  background: 'none', border: 'none',
                  borderBottom: active ? `2px solid ${T.teal}` : '2px solid transparent',
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 150ms ease',
                }}
              >
                {idx === 0 ? `✦ ${tab}` : tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Section content ───────────────────────────────────────── */}
      <div className="p-4 md:p-8" style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>

        {/* EXECUTIVE SUMMARY (Now at index 1 for standard industry report, Hidden for trends_report) */}
        {!isTrends && activeSection === (scopeSection ? 1 : 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Headline */}
            <Card>
              <SectionLabel text="Market Headline" />
              <p style={{ fontSize: 16, fontWeight: 600, color: T.text, lineHeight: 1.7 }}>
                {report.executiveSummary.headline}
              </p>
            </Card>

            {/* KPI panel */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              {(report.executiveSummary?.kpiPanel || [])
                .filter((kpi: any) => isAdmin || !HIDE_KEYWORDS.test(kpi.label))
                .map((kpi, i) => (
                  <div key={i} style={{
                    background: T.card, border: `1px solid ${T.cardBorder}`,
                    borderTop: `3px solid ${i % 2 === 0 ? T.teal : T.blue}`,
                    borderRadius: 10, padding: '16px 20px',
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>{kpi.label}</p>
                    <p style={{ fontSize: 22, fontWeight: 900, color: i % 2 === 0 ? T.teal : T.blue, fontFamily: 'DM Mono, monospace' }}>{kpi.value}</p>
                    {isAdmin && (
                      <p style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>
                        {(kpi as { source_section?: string }).source_section || 'Market Analysis'}
                      </p>
                    )}
                  </div>
                ))}
            </div>

            {/* Body paragraphs */}
            <Card>
              <SectionLabel text="Summary" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(report.executiveSummary?.paragraphs || [])
                  .filter((p: string) => isAdmin || !HIDE_KEYWORDS.test(p))
                  .map((p, i) => (
                    <p key={i} style={{ color: T.muted, lineHeight: 1.8, fontSize: 14 }}>{p}</p>
                  ))}
              </div>
            </Card>

            {/* Scenarios */}
            <Card>
              <SectionLabel text="3-Scenario Forecast" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {[
                  { label: 'Pessimistic', value: report.executiveSummary?.scenarios?.bear || 'N/A', color: T.red },
                  { label: 'Base Case', value: report.executiveSummary?.scenarios?.base || 'N/A', color: T.teal },
                  { label: 'Optimistic', value: report.executiveSummary?.scenarios?.bull || 'N/A', color: T.blue },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: T.cardSurface, border: `1px solid ${T.cardBorder}`,
                    borderLeft: `4px solid ${s.color}`, borderRadius: 8, padding: '14px 16px',
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: s.color, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</p>
                    <p style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* REGULAR SECTIONS (With index shift handling) */}
        {(visibleSections || []).map((section: any, idx: number) => {
          let targetIndex;
          if (isTrends) {
            targetIndex = idx; // Direct mapping for Trends
          } else {
            // idx 0 -> tabs[0] -> activeSection 0
            // idx >= 1 -> tabs[idx+1] -> activeSection idx+1
            targetIndex = idx === 0 ? 0 : idx + 1;
            // Adjust if scopeSection doesn't exist
            if (!scopeSection) {
              targetIndex = idx + 1; // Since idx 0 of visibleSections is otherSections[0], which sits after ExSumm
            }
          }

          return activeSection === targetIndex && (
            <div key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Section header */}
              <div style={{ borderBottom: `2px solid ${T.teal}`, paddingBottom: 14 }}>
                <SectionLabel text={`Section ${idx + 1} of ${visibleSections.length}`} />
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0c3649' }}>{section.title}</h2>
              </div>

              {(section.id === 'intro' || section.id === 'market_report_scope') && (
                <Card style={{ padding: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
                  <SectionLabel text="Report Structure" />
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 20 }}>Table of Contents</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                    {(tocEntries || []).map((entry: any, tIdx: number) => {
                      const isTargetActive = activeSection === tIdx;
                      return (
                        <div key={tIdx} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div
                            onClick={() => setActiveSection(tIdx)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                              padding: '8px 12px', borderRadius: 8, marginLeft: -12,
                              background: isTargetActive ? 'rgba(12, 54, 73, 0.05)' : 'transparent',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <span style={{ fontSize: 13, fontWeight: 800, color: T.teal, opacity: 0.6 }}>{(tIdx + 1).toString().padStart(2, '0')}.</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{entry.title}</span>
                          </div>
                          {entry.subsections && entry.subsections.length > 0 && (
                            <div style={{ marginLeft: 22, display: 'flex', flexDirection: 'column', gap: 6, borderLeft: `1.5px solid ${T.cardBorder}`, paddingLeft: 14 }}>
                              {entry.subsections
                                .filter((sub: any) => isAdmin || !HIDE_KEYWORDS.test(sub.title || ''))
                                .map((sub: any, sIdx: number) => (
                                  <div key={sIdx} style={{ fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: T.cardBorder }} />
                                    {sub.title}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Body text */}
              <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {(section.content || [])
                    .filter((p: string) => isAdmin || !HIDE_KEYWORDS.test(p))
                    .map((para: any, pi: number) => (
                      <p key={pi} style={{ color: T.muted, lineHeight: 1.8, fontSize: 14 }}>{para}</p>
                    ))}
                </div>
              </Card>

              {/* Data table */}
              {section.keyTable && (
                <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ background: '#f8fafc', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${T.cardBorder}` }}>
                    <span style={{ color: T.teal }}><IconTable /></span>
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {(section.keyTable as { title?: string }).title || 'Data Table'}
                    </h3>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      {(section.keyTable as { headers?: string[] }).headers && (
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            {((section.keyTable as { headers?: string[] }).headers || [])
                              .filter(h => isAdmin || !HIDE_KEYWORDS.test(String(h)))
                              .map((h, hi) => (
                                <th key={hi} style={{
                                  padding: '10px 16px', textAlign: 'left',
                                  fontSize: 10, fontWeight: 700, color: T.teal,
                                  textTransform: 'uppercase', letterSpacing: '1px',
                                  borderBottom: `1px solid ${T.cardBorder}`,
                                }}>{String(h)}</th>
                              ))}
                          </tr>
                        </thead>
                      )}
                      <tbody>
                        {(section.keyTable as { rows?: any[][] }).rows?.map((row, ri) => {
                          const entries = Array.isArray(row) ? (row || []) : Object.values(row || {});
                          const headers = (section.keyTable as { headers?: string[] }).headers || [];

                          return (
                            <tr key={ri} style={{
                              background: ri % 2 === 0 ? 'transparent' : '#f9fafb',
                              borderBottom: `1px solid ${T.cardBorder}`,
                              transition: 'background 100ms ease',
                            }}>
                              {entries.map((cell, ci) => {
                                // Skip cell if the header contains 'source' and user is not admin
                                const header = headers[ci];
                                if (!isAdmin && header && HIDE_KEYWORDS.test(String(header))) {
                                  return null;
                                }
                                return (
                                  <td key={ci} style={{ padding: '12px 16px', color: ci === 0 ? T.text : T.muted }}>
                                    {String(cell)}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Chart */}
              {section.chartSpec && !section.subsections && (
                <Card>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <span style={{ color: T.teal }}><IconChart /></span>
                    <div>
                      <h3 style={{ fontSize: 12, fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {String((section.chartSpec as { title?: unknown }).title || 'Market Chart')}
                      </h3>
                      <p style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
                        {String((section.chartSpec as { type?: unknown }).type || 'line')} chart
                      </p>
                    </div>
                  </div>
                  <ReportChart
                    chartSpec={section.chartSpec as any}
                    sizing={(report as any).sizing}
                    tableData={section.keyTable as any}
                  />
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {isAdmin ? (
                      <p style={{ fontSize: 10, color: T.muted }}>
                        Data Source: {String((section.chartSpec as { data_source?: unknown }).data_source || 'MarketIntel Analysis')}
                      </p>
                    ) : <div />}
                    {section.flags?.includes('DATA_QUALITY') && (
                      <span style={{ fontSize: 9, color: T.red, fontWeight: 700 }}>INDICATIVE ESTIMATE</span>
                    )}
                  </div>
                </Card>
              )}

              {/* Fallback for direct content (e.g. if JSON parsing failed) */}
              {(!section.subsections || section.subsections.length === 0) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {(section.content || [])
                    .filter((p: string) => isAdmin || !HIDE_KEYWORDS.test(p))
                    .map((para: any, pi: number) => {
                      const isFailedJson = typeof para === 'string' && (para.includes('```json') || para.trim().startsWith('{'));
                      return (
                        <p key={pi} style={{
                          color: T.muted, lineHeight: 1.8, fontSize: 14,
                          whiteSpace: isFailedJson ? 'pre-wrap' : 'normal',
                          fontFamily: isFailedJson ? 'monospace' : 'inherit',
                          background: isFailedJson ? '#f1f5f9' : 'transparent',
                          padding: isFailedJson ? '12px' : '0',
                          borderRadius: isFailedJson ? '6px' : '0',
                          overflow: 'auto',
                          border: isFailedJson ? `1px solid ${T.cardBorder}` : 'none'
                        }}>
                          {isFailedJson ? 'Note: Standard formatting unavailable for this research section. Showing raw data: \n\n' + para : para}
                        </p>
                      );
                    })}
                </div>
              )}

              {/* Subsections */}
              {section.subsections && section.subsections.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 10 }}>
                  {(section.subsections || [])
                    .filter((sub: any) => isAdmin || !HIDE_KEYWORDS.test(sub.title))
                    .map((sub: any, si: number) => (
                      <Card key={si} className="p-4 md:p-6" style={{ borderLeft: `4px solid ${si % 2 === 0 ? T.teal : T.blue}` }}>
                        <h4 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 16 }}>{sub.title}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          {(sub.content || [])
                            .filter((p: string) => isAdmin || !HIDE_KEYWORDS.test(p))
                            .map((p: string, pi: number) => (
                              <p key={pi} style={{ color: T.muted, lineHeight: 1.8, fontSize: 14 }}>{p}</p>
                            ))}
                        </div>

                        {sub.keyTable && (
                          <div style={{ marginTop: 20, borderRadius: 8, border: `1px solid ${T.cardBorder}`, overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 400 }}>
                              {sub.keyTable.headers && (
                                <thead style={{ background: '#f8fafc' }}>
                                  <tr>
                                    {(sub.keyTable.headers || [])
                                      .filter((h: string) => isAdmin || !HIDE_KEYWORDS.test(String(h)))
                                      .map((h: string, hi: number) => (
                                        <th key={hi} style={{ padding: '10px 12px', textAlign: 'left', color: T.teal, fontSize: 9, textTransform: 'uppercase', fontWeight: 800 }}>{h}</th>
                                      ))}
                                  </tr>
                                </thead>
                              )}
                              <tbody>
                                {(sub.keyTable.rows || []).map((row: any[], ri: number) => (
                                  <tr key={ri} style={{ borderTop: `1px solid ${T.cardBorder}` }}>
                                    {(row || []).map((cell, ci) => {
                                      const header = sub.keyTable.headers?.[ci];
                                      if (!isAdmin && header && HIDE_KEYWORDS.test(String(header))) {
                                        return null;
                                      }
                                      return (
                                        <td key={ci} style={{ padding: '10px 12px', color: ci === 0 ? T.text : T.muted }}>{String(cell)}</td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {sub.chartSpec && (
                          <Card>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ color: T.teal }}><IconChart /></span>
                              <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                                {sub.chartSpec.title || 'Market Chart'}
                              </h3>
                            </div>
                            <p style={{ fontSize: 11, color: T.muted, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                              {sub.chartSpec.type || 'stacked_column'} chart
                            </p>
                            <ReportChart chartSpec={sub.chartSpec} sizing={(report as any).sizing} tableData={sub.keyTable} />
                          </Card>
                        )}
                      </Card>
                    ))}
                </div>
              )}


              {/* Admin-only methodology log */}
              {isAdmin && section.adminMethodology && (
                <div style={{ marginTop: 20, border: '1px solid #f59e0b', borderRadius: 12, padding: 20, background: 'rgba(245, 158, 11, 0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ color: '#f59e0b' }}>⚠️</span>
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Admin Internal Methodology Log
                    </h3>
                  </div>
                  <div style={{ background: '#fffbeb', borderRadius: 8, padding: 16, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <p style={{ color: '#d97706', fontSize: 13, lineHeight: 1.7, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {section.adminMethodology}
                    </p>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}
