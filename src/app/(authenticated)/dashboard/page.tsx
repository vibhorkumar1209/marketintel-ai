'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Spinner from '@/components/ui/Spinner';

const C = {
  navy: '#064e3b', teal: '#00BDA8', blue: '#10b981', red: '#E63946',
  amber: '#f59e0b', green: '#16a34a', white: '#ffffff', border: '#e5e7eb',
  text: '#0f172a', sub: '#475569', muted: '#94a3b8',
};

const Ico = {
  credit: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
  report: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  grid: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" /></svg>,
  trend: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  plus: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>,
  download: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
};

interface Job { id: string; title: string; type: string; status: string; createdAt: string; reportId?: string; }

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
      <Spinner size="lg" />
    </div>
  );

  const completed = jobs.filter(j => j.status === 'completed').length;
  const processing = jobs.filter(j => j.status === 'processing').length;

  const kpis = [
    { label: 'Available Credits', value: credits !== null ? String(credits) : '—', color: C.blue, icon: Ico.credit, gradient: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' },
    { label: 'Completed Reports', value: String(completed), color: C.green, icon: Ico.report, gradient: 'linear-gradient(135deg,#fcfdf2,#f7fee7)' },
    { label: 'In Progress', value: String(processing), color: C.amber, icon: Ico.clock, gradient: 'linear-gradient(135deg,#fffbeb,#fef3c7)' },
    { label: 'Total Reports', value: String(jobs.length), color: C.navy, icon: Ico.grid, gradient: 'linear-gradient(135deg,#f8fafc,#f1f5f9)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(120deg,#064e3b 0%,#065f46 100%)',
        borderRadius: 16, padding: '28px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        boxShadow: '0 4px 24px rgba(12,54,73,0.18)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', top: -60, right: 120 }} />
        <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', bottom: -40, right: 40 }} />
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>Industry Intelligence</p>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
            {credits !== null && credits < 50 ? '⚠️ Low credit balance — consider topping up' : 'Your reports and market data, in one place'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <Link href="/wizard" style={{ textDecoration: 'none' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: C.red, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(230,57,70,0.35)' }}>
              {Ico.plus} New Report
            </button>
          </Link>
          <Link href="/billing" style={{ textDecoration: 'none' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>
              {Ico.credit} Top Up Credits
            </button>
          </Link>
        </div>
      </div>

      {error && <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', color: C.red, fontSize: 13 }}>{error}</div>}

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: k.gradient, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.sub, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{k.label}</p>
              <span style={{ color: k.color, opacity: 0.8 }}>{k.icon}</span>
            </div>
            <p style={{ fontSize: 30, fontWeight: 900, color: k.color, fontFamily: 'DM Mono,monospace', lineHeight: 1 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Workspace Actions */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.blue, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Workspace Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>

          {/* Industry Report */}
          <Link href="/wizard" style={{ textDecoration: 'none' }}>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: '22px 26px', height: '100%', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'all 150ms ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${C.blue}20`; (e.currentTarget as HTMLElement).style.borderColor = `${C.blue}50`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: `${C.blue}14`, color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>{Ico.report}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 5 }}>Industry Report</h3>
              <p style={{ fontSize: 12, color: C.sub, lineHeight: 1.65, marginBottom: 16, flex: 1 }}>9-section deep research — market sizing, competitive intelligence, 3-scenario forecast & TEI driver table</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: C.blue }}>Start Report {Ico.arrow}</div>
            </div>
          </Link>

          {/* Trends Report */}
          <Link href="/wizard?type=trends_report" style={{ textDecoration: 'none' }}>
            <div style={{ background: `linear-gradient(135deg,#fdf4ff,#fae8ff)`, border: `1px solid #d8b4fe50`, borderRadius: 14, padding: '22px 26px', height: '100%', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'all 150ms ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px #a855f720`; (e.currentTarget as HTMLElement).style.borderColor = '#a855f770'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = '#d8b4fe50'; }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: '#a855f718', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Ico.trend}</div>
                <span style={{ fontSize: 10, fontWeight: 700, background: '#a855f715', color: '#a855f7', border: '1px solid #a855f730', borderRadius: 20, padding: '2px 8px', letterSpacing: '1px' }}>NEW</span>
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 5 }}>Trends Report</h3>
              <p style={{ fontSize: 12, color: C.sub, lineHeight: 1.6, marginBottom: 14, flex: 1 }}>Detailed trends, drivers & barriers with TEI tables, scenario analysis and regulatory horizon scan</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#a855f7' }}>Run Analysis {Ico.arrow}</div>
            </div>
          </Link>

          {/* Market Datapack */}
          <Link href="/wizard?type=datapack" style={{ textDecoration: 'none' }}>
            <div style={{ background: `linear-gradient(135deg,#f0fdf9,#e6fff9)`, border: `1px solid ${C.teal}35`, borderRadius: 14, padding: '22px 26px', height: '100%', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'all 150ms ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${C.teal}20`; (e.currentTarget as HTMLElement).style.borderColor = `${C.teal}60`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = `${C.teal}35`; }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: `${C.teal}18`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Ico.grid}</div>
                <span style={{ fontSize: 10, fontWeight: 700, background: `${C.teal}15`, color: C.teal, border: `1px solid ${C.teal}35`, borderRadius: 20, padding: '2px 8px', letterSpacing: '1px' }}>XLSX</span>
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 5 }}>Market Datapack</h3>
              <p style={{ fontSize: 12, color: C.sub, lineHeight: 1.6, marginBottom: 14, flex: 1 }}>TAM time-series, segment breakdowns, 3-scenario CAGR & competitive share — delivered as Excel</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: C.teal }}>{Ico.download}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.teal }}>Download XLSX</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Report History teaser — full history available via sidebar */}
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${C.blue}12`, color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Ico.report}</div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>
              {jobs.length > 0 ? `${jobs.length} reports in your history` : 'No reports generated yet'}
            </p>
            <p style={{ fontSize: 12, color: C.muted }}>View, download and manage all your market intelligence reports from the sidebar</p>
          </div>
        </div>
        <Link href="/reports" style={{ textDecoration: 'none' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: C.blue, color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            View History {Ico.arrow}
          </button>
        </Link>
      </div>

    </div>
  );
}
