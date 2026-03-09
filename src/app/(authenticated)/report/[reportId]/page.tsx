'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Spinner from '@/components/ui/Spinner';
import ReportChart from '@/components/charts/ReportChart';
import { IndustryReport } from '@/types/reports';

// ── Design tokens (dark-card aesthetic matching screenshot) ───────────────────
const T = {
  bg: '#f1f5f9',   // page background — light
  card: '#0f1c2e',   // dark navy card
  cardBorder: '#1e3a5f',   // card border
  cardSurface: '#121f35',   // slightly lighter surface inside cards
  teal: '#00BDA8',   // primary accent
  blue: '#3491E8',   // secondary accent
  red: '#E63946',   // danger / CTA
  amber: '#f59e0b',   // warning
  text: '#E8F0F5',   // primary text on dark
  muted: '#7eaabf',   // secondary text on dark
  navy: '#0c3649',   // header background
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
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.cardBorder}`,
      borderRadius: 12, padding: 24, ...style,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ text, color = T.teal }: { text: string; color?: string }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>
      {text}
    </p>
  );
}

// ── Main Report Page ──────────────────────────────────────────────────────────
export default function ReportPage() {
  const params = useParams();
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
    <div style={{ padding: 32 }}>
      <Card style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ color: T.red, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Error loading report</p>
        <p style={{ color: T.muted, fontSize: 14, marginBottom: 20 }}>{error || 'Report not found'}</p>
        <a href="/dashboard" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '9px 18px', borderRadius: 8, background: T.teal, color: '#fff',
          fontSize: 13, fontWeight: 700, textDecoration: 'none',
        }}>
          <IconBack /> Back to Dashboard
        </a>
      </Card>
    </div>
  );

  const tabs = ['Executive Summary', ...report.sections.map(s => s.title)];

  return (
    // Full-bleed: break out of layout's 32px padding
    <div style={{ margin: '-32px', background: T.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Dark header ─────────────────────────────────────────── */}
      <div style={{ background: T.navy, padding: '20px 32px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <a href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.muted, textDecoration: 'none', marginBottom: 10 }}>
            <IconBack /> Back to Dashboard
          </a>
          <SectionLabel text="Industry Report" color={T.muted} />
          <h1 style={{ fontSize: 21, fontWeight: 800, color: T.text, lineHeight: 1.3, marginBottom: 8 }}>{report.title}</h1>
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
        <div style={{ display: 'flex', gap: 10, flexShrink: 0, paddingTop: 28 }}>
          <a href={`/api/report/${reportId}/download/pdf`} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: 'rgba(255,255,255,0.08)', color: T.text,
            border: `1px solid rgba(255,255,255,0.15)`, textDecoration: 'none',
          }}>
            <IconDownload /> Print / PDF
          </a>
          <a href={`/api/report/${reportId}/download/xlsx`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: T.red, color: '#fff', border: 'none', textDecoration: 'none',
          }}>
            <IconDownload /> Excel
          </a>
        </div>
      </div>

      {/* ── Horizontal section nav ────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: T.card, borderBottom: `1px solid ${T.cardBorder}`,
        overflowX: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', padding: '0 24px', whiteSpace: 'nowrap', minWidth: 'max-content' }}>
          {tabs.map((tab, idx) => {
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
      <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>

        {/* EXECUTIVE SUMMARY */}
        {activeSection === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Headline */}
            <Card>
              <SectionLabel text="Market Headline" />
              <p style={{ fontSize: 16, fontWeight: 600, color: T.text, lineHeight: 1.7 }}>
                {report.executiveSummary.headline}
              </p>
            </Card>

            {/* KPI panel */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
              {report.executiveSummary.kpiPanel.map((kpi, i) => (
                <div key={i} style={{
                  background: T.card, border: `1px solid ${T.cardBorder}`,
                  borderTop: `3px solid ${i % 2 === 0 ? T.teal : T.blue}`,
                  borderRadius: 10, padding: '16px 20px',
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>{kpi.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 900, color: i % 2 === 0 ? T.teal : T.blue, fontFamily: 'DM Mono, monospace' }}>{kpi.value}</p>
                  <p style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>
                    {(kpi as { source_section?: string }).source_section || 'Market Analysis'}
                  </p>
                </div>
              ))}
            </div>

            {/* Body paragraphs */}
            <Card>
              <SectionLabel text="Summary" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {report.executiveSummary.paragraphs.map((p, i) => (
                  <p key={i} style={{ color: T.muted, lineHeight: 1.8, fontSize: 14 }}>{p}</p>
                ))}
              </div>
            </Card>

            {/* Scenarios */}
            <Card>
              <SectionLabel text="3-Scenario Forecast" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[
                  { label: 'Pessimistic', value: report.executiveSummary.scenarios.bear, color: T.red },
                  { label: 'Base Case', value: report.executiveSummary.scenarios.base, color: T.teal },
                  { label: 'Optimistic', value: report.executiveSummary.scenarios.bull, color: T.blue },
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

        {/* REGULAR SECTIONS */}
        {report.sections.map((section, idx) =>
          activeSection === idx + 1 && (
            <div key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Section header */}
              <div style={{ borderBottom: `2px solid ${T.teal}`, paddingBottom: 14 }}>
                <SectionLabel text={`Section ${idx + 1} of ${report.sections.length}`} />
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0c3649' }}>{section.title}</h2>
                {section.flags && section.flags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    {section.flags.map((flag, fi) => (
                      <span key={fi} style={{
                        fontSize: 11, fontWeight: 600, color: T.amber,
                        background: `${T.amber}18`, border: `1px solid ${T.amber}44`,
                        borderRadius: 4, padding: '3px 8px',
                      }}>{flag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Body text */}
              <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {section.content.map((para, pi) => (
                    <p key={pi} style={{ color: T.muted, lineHeight: 1.8, fontSize: 14 }}>{para}</p>
                  ))}
                </div>
              </Card>

              {/* Data table */}
              {section.keyTable && (
                <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ background: '#0a1624', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${T.cardBorder}` }}>
                    <span style={{ color: T.teal }}><IconTable /></span>
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {(section.keyTable as { title?: string }).title || 'Data Table'}
                    </h3>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      {(section.keyTable as { headers?: string[] }).headers && (
                        <thead>
                          <tr style={{ background: '#0a1624' }}>
                            {((section.keyTable as { headers?: string[] }).headers || []).map((h, hi) => (
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
                        {((section.keyTable as { rows?: unknown[] }).rows || []).map((row, ri) => (
                          <tr key={ri} style={{ borderBottom: `1px solid ${T.cardBorder}`, background: ri % 2 === 0 ? T.card : T.cardSurface }}>
                            {(Array.isArray(row) ? row : Object.values(row as object)).map((cell, ci) => (
                              <td key={ci} style={{
                                padding: '10px 16px',
                                color: ci === 0 ? T.text : T.muted,
                                fontWeight: ci === 0 ? 600 : 400,
                                fontFamily: ci > 0 && String(cell ?? '').match(/^[\d$£€%.,\s\-]+$/) ? 'DM Mono, monospace' : 'inherit',
                              }}>
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
                <Card>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: T.teal }}><IconChart /></span>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                      {String((section.chartSpec as { title?: unknown }).title || 'Market Chart')}
                    </h3>
                  </div>
                  <p style={{ fontSize: 11, color: T.muted, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    {String((section.chartSpec as { type?: unknown }).type || 'line')} chart
                  </p>
                  <ReportChart
                    chartSpec={section.chartSpec as any}
                    sizing={(report as any).sizing}
                    tableData={section.keyTable as any}
                  />
                </Card>
              )}

              {/* Citations */}
              {section.citations && section.citations.length > 0 && (
                <div style={{ background: T.cardSurface, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span style={{ color: T.muted }}><IconSource /></span>
                    <p style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: '2px', textTransform: 'uppercase' }}>Sources</p>
                  </div>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {section.citations.map((cit, ci) => (
                      <li key={ci} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          background: `${T.teal}18`, color: T.teal,
                          border: `1px solid ${T.teal}33`,
                          borderRadius: 4, padding: '3px 8px', flexShrink: 0, marginTop: 1,
                        }}>
                          {String(cit.tier || 'N/A')}
                        </span>
                        <div>
                          <span style={{ fontSize: 13, color: T.text }}>
                            &ldquo;{String(cit.claim || '')}&rdquo;
                          </span>
                          <span style={{ fontSize: 11, color: T.muted, marginLeft: 8 }}>
                            {String(cit.source || '')} ({String(cit.date || 'N/A')})
                          </span>
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
