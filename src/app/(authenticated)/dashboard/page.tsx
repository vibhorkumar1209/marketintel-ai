'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Spinner from '@/components/ui/Spinner';

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  navy: '#0c3649',
  teal: '#00BDA8',
  blue: '#3491E8',
  red: '#E63946',
  amber: '#f59e0b',
  green: '#16a34a',
  bg: '#f1f5f9',
  white: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  sub: '#475569',
  muted: '#94a3b8',
};

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const Ico = {
  credit: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  report: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  grid: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18" />
    </svg>
  ),
  clock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  view: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  download: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  plus: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  arrow: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  ),
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface Job {
  id: string;
  title: string;
  type: 'industry_report' | 'datapack';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  reportId?: string;
}

const STATUS: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  completed: { label: 'Completed', color: C.green, dot: C.green, bg: '#f0fdf4' },
  processing: { label: 'Processing', color: C.blue, dot: C.blue, bg: '#eff6ff' },
  failed: { label: 'Failed', color: C.red, dot: C.red, bg: '#fff5f5' },
  pending: { label: 'Pending', color: C.muted, dot: C.muted, bg: '#f8fafc' },
};

const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [credits, setCredits] = useState<number | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [cRes, jRes] = await Promise.all([fetch('/api/credits'), fetch('/api/jobs')]);
        if (cRes.ok) setCredits((await cRes.json()).balance);
        setJobs((jRes.ok ? (await jRes.json()).jobs : null) || []);
      } catch { setError('Failed to load dashboard data'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ textAlign: 'center' }}>
        <Spinner size="lg" />
        <p style={{ color: C.muted, marginTop: 12, fontSize: 14 }}>Loading...</p>
      </div>
    </div>
  );

  const completed = jobs.filter(j => j.status === 'completed').length;
  const processing = jobs.filter(j => j.status === 'processing').length;

  const kpis = [
    { label: 'Available Credits', value: credits !== null ? String(credits) : '—', color: C.blue, icon: Ico.credit, gradient: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' },
    { label: 'Completed Reports', value: String(completed), color: C.green, icon: Ico.report, gradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' },
    { label: 'In Progress', value: String(processing), color: C.amber, icon: Ico.clock, gradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' },
    { label: 'Total Reports', value: String(jobs.length), color: C.navy, icon: Ico.grid, gradient: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

      {/* ── Hero header ─────────────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(120deg, ${C.navy} 0%, #1a4a6b 100%)`,
        borderRadius: 16, padding: '32px 36px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 20,
        boxShadow: '0 4px 24px rgba(12,54,73,0.18)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', top: -60, right: 120, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', bottom: -40, right: 40, pointerEvents: 'none' }} />
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>
            Market Intelligence
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Dashboard</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
            {credits !== null && credits < 50
              ? '⚠️ Low credit balance — consider topping up'
              : 'Your reports and market data, in one place'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <Link href="/wizard" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '11px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: C.red, color: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(230,57,70,0.35)',
            }}>
              {Ico.plus} New Report
            </button>
          </Link>
          <Link href="/billing" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '11px 22px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'rgba(255,255,255,0.12)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
            }}>
              {Ico.credit} Top Up Credits
            </button>
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', color: C.red, fontSize: 13 }}>{error}</div>
      )}

      {/* ── KPI strip ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{
            background: k.gradient, border: `1px solid ${C.border}`,
            borderRadius: 14, padding: '20px 24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.sub, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{k.label}</p>
              <span style={{ color: k.color, opacity: 0.8 }}>{k.icon}</span>
            </div>
            <p style={{ fontSize: 32, fontWeight: 900, color: k.color, fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Actions ─────────────────────────────────────────────────────────── */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.blue, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>
          Workspace Actions
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'stretch' }}>

          {/* Industry Report — primary */}
          <Link href="/wizard" style={{ textDecoration: 'none' }}>
            <div style={{
              background: C.white, border: `1px solid ${C.border}`,
              borderRadius: 14, padding: '24px 28px', height: '100%',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              transition: 'box-shadow 150ms ease, border-color 150ms ease',
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${C.blue}20`; (e.currentTarget as HTMLElement).style.borderColor = `${C.blue}50`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${C.blue}15`, color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>{Ico.report}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>New Industry Report</h3>
              <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.65, marginBottom: 18, flex: 1 }}>
                9-section deep research — market sizing, competitive intelligence, 3-scenario forecast, TEI driver table & full citations
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: C.blue }}>
                Start Report {Ico.arrow}
              </div>
            </div>
          </Link>

          {/* Market Datapack — download only */}
          <Link href="/wizard?type=datapack" style={{ textDecoration: 'none' }}>
            <div style={{
              background: `linear-gradient(135deg, #f0fdf9 0%, #e6fff9 100%)`,
              border: `1px solid ${C.teal}35`, borderRadius: 14, padding: '24px 28px', height: '100%',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              transition: 'box-shadow 150ms ease, border-color 150ms ease',
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${C.teal}20`; (e.currentTarget as HTMLElement).style.borderColor = `${C.teal}60`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = `${C.teal}35`; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `${C.teal}18`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Ico.grid}</div>
                <span style={{ fontSize: 10, fontWeight: 700, background: `${C.teal}18`, color: C.teal, border: `1px solid ${C.teal}40`, borderRadius: 20, padding: '3px 10px', letterSpacing: '1px' }}>XLSX ONLY</span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Market Datapack</h3>
              <p style={{ fontSize: 12, color: C.sub, lineHeight: 1.65, marginBottom: 16, flex: 1 }}>
                TAM time-series (5yr historical + base + forecast), segment breakdowns by type / geography / application, 3-scenario CAGR & competitive share table
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: C.teal }}>{Ico.download}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.teal }}>Download as XLSX</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Report history ──────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.blue, letterSpacing: '2px', textTransform: 'uppercase' }}>Report History</p>
          <span style={{
            fontSize: 11, fontWeight: 700, background: '#eff6ff', color: C.blue,
            border: `1px solid #bfdbfe`, borderRadius: 20, padding: '3px 12px',
          }}>
            {jobs.length} total
          </span>
        </div>

        {jobs.length === 0 ? (
          <div style={{
            background: C.white, border: `1.5px dashed ${C.border}`,
            borderRadius: 14, padding: '56px 24px', textAlign: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#f1f5f9', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px', color: C.muted,
            }}>
              {Ico.report}
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>No reports yet</p>
            <p style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>
              Generate your first market intelligence report to get started
            </p>
            <Link href="/wizard" style={{ textDecoration: 'none' }}>
              <button style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '11px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: C.red, color: '#fff', border: 'none', cursor: 'pointer',
              }}>
                {Ico.plus} Create Your First Report
              </button>
            </Link>
          </div>
        ) : (
          <div style={{
            background: C.white, border: `1px solid ${C.border}`,
            borderRadius: 14, overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: `1px solid ${C.border}` }}>
                  {['Report Title', 'Type', 'Status', 'Created', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '12px 20px', textAlign: 'left',
                      fontSize: 10, fontWeight: 700, color: C.blue,
                      textTransform: 'uppercase', letterSpacing: '1.2px',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.slice(0, 15).map((job, ri) => {
                  const st = STATUS[job.status] || STATUS.pending;
                  return (
                    <tr
                      key={job.id}
                      style={{ borderBottom: ri < jobs.length - 1 ? `1px solid #f1f5f9` : 'none' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafcff'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 20px', maxWidth: 340 }}>
                        <span style={{
                          fontWeight: 600, color: C.text,
                          display: 'block', overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {job.title || 'Untitled Report'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          background: job.type === 'industry_report' ? '#eff6ff' : '#f0fdf4',
                          color: job.type === 'industry_report' ? C.blue : C.teal,
                          border: `1px solid ${job.type === 'industry_report' ? '#bfdbfe' : '#6ee7b7'}`,
                          borderRadius: 20, padding: '3px 10px',
                        }}>
                          {job.type === 'industry_report' ? 'Report' : 'Datapack'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          fontSize: 11, fontWeight: 700,
                          background: st.bg, color: st.color,
                          borderRadius: 20, padding: '3px 10px',
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, flexShrink: 0 }} />
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', color: C.muted, whiteSpace: 'nowrap', fontSize: 12 }}>
                        {fmt(job.createdAt)}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {job.status === 'completed' && job.reportId ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <Link href={`/report/${job.reportId}`} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              fontSize: 12, fontWeight: 700, color: C.blue, textDecoration: 'none',
                            }}>
                              {Ico.view} View
                            </Link>
                            <a href={`/api/report/${job.reportId}/download/pdf`} target="_blank" rel="noopener noreferrer" style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              fontSize: 12, fontWeight: 600, color: C.sub, textDecoration: 'none',
                            }}>
                              {Ico.download} PDF
                            </a>
                            <a href={`/api/report/${job.reportId}/download/xlsx`} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              fontSize: 12, fontWeight: 600, color: C.sub, textDecoration: 'none',
                            }}>
                              {Ico.download} Excel
                            </a>
                          </div>
                        ) : job.status === 'processing' ? (
                          <Spinner size="sm" />
                        ) : (
                          <span style={{ color: C.muted, fontSize: 12 }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
