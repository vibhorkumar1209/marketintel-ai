'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Spinner from '@/components/ui/Spinner';

// ── SVG icon components ──────────────────────────────────────────────────────

const IconReport = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconDatapack = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M3 15h18M9 3v18" />
  </svg>
);

const IconView = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconCredit = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// ── Types ────────────────────────────────────────────────────────────────────

interface Job {
  id: string;
  title: string;
  type: 'industry_report' | 'datapack';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  reportId?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  completed: { label: 'Completed', bg: '#f0fdf4', color: '#16a34a', dot: '#16a34a' },
  processing: { label: 'Processing', bg: '#eff6ff', color: '#3491E8', dot: '#3491E8' },
  failed: { label: 'Failed', bg: '#fff5f5', color: '#E63946', dot: '#E63946' },
  pending: { label: 'Pending', bg: '#f9fafb', color: '#6b7280', dot: '#d1d5db' },
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// ── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [credits, setCredits] = useState<number | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [cRes, jRes] = await Promise.all([fetch('/api/credits'), fetch('/api/jobs')]);
        if (cRes.ok) setCredits((await cRes.json()).balance);
        setJobs((jRes.ok ? (await jRes.json()).jobs : null) || []);
      } catch { setError('Failed to load dashboard data'); }
      finally { setIsLoading(false); }
    })();
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ color: '#6b7280', marginTop: 12, fontSize: 14 }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const completedCount = jobs.filter(j => j.status === 'completed').length;
  const processingCount = jobs.filter(j => j.status === 'processing').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* ── Page header ── */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0c3649', marginBottom: 4 }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Welcome back — your market intelligence workspace</p>
      </div>

      {error && (
        <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', color: '#dc2626', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* ── KPI strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        {[
          { label: 'Available Credits', value: credits !== null ? String(credits) : '—', accent: '#3491E8', icon: <IconCredit /> },
          { label: 'Reports Completed', value: String(completedCount), accent: '#16a34a', icon: <IconReport /> },
          { label: 'In Progress', value: String(processingCount), accent: '#f59e0b', icon: <IconDatapack /> },
          { label: 'Total Reports', value: String(jobs.length), accent: '#0c3649', icon: <IconReport /> },
        ].map((kpi, i) => (
          <div key={i} style={{
            background: '#fff', border: '1px solid #e5e7eb',
            borderTop: `3px solid ${kpi.accent}`,
            borderRadius: 10, padding: '16px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{kpi.label}</p>
              <span style={{ color: kpi.accent, opacity: 0.7 }}>{kpi.icon}</span>
            </div>
            <p style={{ fontSize: 26, fontWeight: 900, color: kpi.accent, fontFamily: 'DM Mono, monospace' }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 style={{ fontWeight: 700, color: '#3491E8', letterSpacing: '1px', marginBottom: 16, textTransform: 'uppercase', fontSize: 11 }}>
          Workspace Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {[
            {
              href: '/wizard',
              icon: <IconReport />,
              accent: '#3491E8',
              title: 'New Industry Report',
              desc: '9-section deep research report with market sizing, competitive intelligence & 3-scenario forecast',
              cta: 'Start Report',
            },
            {
              href: '/wizard?type=datapack',
              icon: <IconDatapack />,
              accent: '#0c3649',
              title: 'New Market Datapack',
              desc: 'Structured Excel datapack with historical data, segment breakdowns & CAGR projections',
              cta: 'Start Datapack',
            },
          ].map((action, i) => (
            <Link key={i} href={action.href} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: '#fff', border: '1px solid #e5e7eb',
                  borderRadius: 12, padding: 24,
                  transition: 'border-color 150ms ease, box-shadow 150ms ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = action.accent;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 3px ${action.accent}18`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: `${action.accent}12`,
                  color: action.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                }}>
                  {action.icon}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0c3649', marginBottom: 6 }}>{action.title}</h3>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>{action.desc}</p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 700, color: action.accent,
                }}>
                  {action.cta} <IconArrow />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Report History ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 11, fontWeight: 700, color: '#3491E8', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            Report History
          </h2>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{jobs.length} total</span>
        </div>

        {jobs.length === 0 ? (
          <div style={{
            background: '#fff', border: '1px dashed #d1d5db', borderRadius: 12,
            padding: '48px 24px', textAlign: 'center',
          }}>
            <div style={{ width: 48, height: 48, background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#9ca3af' }}>
              <IconReport />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>No reports yet</p>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>Generate your first market intelligence report to get started</p>
            <Link href="/wizard" style={{ textDecoration: 'none' }}>
              <button style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 20px', borderRadius: 8,
                background: '#E63946', color: '#fff',
                border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              }}>
                <IconPlus /> Create Report
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                  {['Report Title', 'Type', 'Status', 'Created', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '11px 18px', textAlign: 'left',
                      fontSize: 10, fontWeight: 700, color: '#3491E8',
                      textTransform: 'uppercase', letterSpacing: '1px',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.slice(0, 12).map((job, rowIdx) => {
                  const st = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
                  return (
                    <tr key={job.id} style={{
                      borderBottom: rowIdx < jobs.length - 1 ? '1px solid #f3f4f6' : 'none',
                      background: rowIdx % 2 === 0 ? '#fff' : '#fafafa',
                    }}>
                      <td style={{ padding: '13px 18px', maxWidth: 320 }}>
                        <span style={{ fontWeight: 600, color: '#0c3649', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {job.title || 'Untitled Report'}
                        </span>
                      </td>
                      <td style={{ padding: '13px 18px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, borderRadius: 4, padding: '3px 8px',
                          background: job.type === 'industry_report' ? '#eff6ff' : '#f0fdf4',
                          color: job.type === 'industry_report' ? '#3491E8' : '#16a34a',
                          border: `1px solid ${job.type === 'industry_report' ? '#bfdbfe' : '#bbf7d0'}`,
                        }}>
                          {job.type === 'industry_report' ? 'Report' : 'Datapack'}
                        </span>
                      </td>
                      <td style={{ padding: '13px 18px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: 11, fontWeight: 700, borderRadius: 4, padding: '3px 8px',
                          background: st.bg, color: st.color,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, flexShrink: 0 }} />
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding: '13px 18px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                        {formatDate(job.createdAt)}
                      </td>
                      <td style={{ padding: '13px 18px' }}>
                        {job.status === 'completed' && job.reportId ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Link href={`/report/${job.reportId}`} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              fontSize: 12, fontWeight: 700, color: '#3491E8', textDecoration: 'none',
                            }}>
                              <IconView /> View
                            </Link>
                            <a href={`/api/report/${job.reportId}/download/pdf`} target="_blank" rel="noopener noreferrer" style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              fontSize: 12, fontWeight: 700, color: '#6b7280', textDecoration: 'none',
                            }}>
                              <IconDownload /> PDF
                            </a>
                            <a href={`/api/report/${job.reportId}/download/xlsx`} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              fontSize: 12, fontWeight: 700, color: '#6b7280', textDecoration: 'none',
                            }}>
                              <IconDownload /> Excel
                            </a>
                          </div>
                        ) : job.status === 'processing' ? (
                          <Spinner size="sm" />
                        ) : (
                          <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>
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
