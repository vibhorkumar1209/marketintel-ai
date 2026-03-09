'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Spinner from '@/components/ui/Spinner';

const C = {
    navy: '#0c3649', teal: '#00BDA8', blue: '#3491E8', red: '#E63946',
    amber: '#f59e0b', green: '#16a34a', purple: '#a855f7',
    white: '#ffffff', border: '#e2e8f0', text: '#0f172a', sub: '#475569', muted: '#94a3b8',
};

const Ico = {
    view: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
    download: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
    plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
};

interface Job { id: string; title: string; type: string; status: string; createdAt: string; reportId?: string; }

const STATUS: Record<string, { label: string; color: string; dot: string; bg: string; border: string }> = {
    completed: { label: 'Completed', color: C.green, dot: C.green, bg: '#f0fdf4', border: '#bbf7d0' },
    processing: { label: 'Processing', color: C.blue, dot: C.blue, bg: '#eff6ff', border: '#bfdbfe' },
    failed: { label: 'Failed', color: C.red, dot: C.red, bg: '#fff5f5', border: '#fecaca' },
    pending: { label: 'Pending', color: C.muted, dot: C.muted, bg: '#f8fafc', border: '#e2e8f0' },
};

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
    industry_report: { label: 'Report', color: C.blue, bg: '#eff6ff', border: '#bfdbfe' },
    datapack: { label: 'Datapack', color: C.teal, bg: '#f0fdf9', border: '#6ee7b7' },
    trends_report: { label: 'Trends', color: C.purple, bg: '#fdf4ff', border: '#d8b4fe' },
};

const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function ReportsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'industry_report' | 'datapack' | 'trends_report'>('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('/api/jobs')
            .then(r => r.ok ? r.json() : { jobs: [] })
            .then(d => setJobs(d.jobs || []))
            .finally(() => setLoading(false));
    }, []);

    const filtered = jobs.filter(j => {
        if (filter !== 'all' && j.status !== filter) return false;
        if (typeFilter !== 'all' && j.type !== typeFilter) return false;
        if (search && !j.title?.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const counts = {
        all: jobs.length,
        completed: jobs.filter(j => j.status === 'completed').length,
        processing: jobs.filter(j => j.status === 'processing').length,
        failed: jobs.filter(j => j.status === 'failed').length,
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
            <Spinner size="lg" />
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: C.blue, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>Library</p>
                    <h1 style={{ fontSize: 24, fontWeight: 900, color: C.navy, marginBottom: 4 }}>Report History</h1>
                    <p style={{ fontSize: 13, color: C.muted }}>{jobs.length} total reports · {counts.completed} completed</p>
                </div>
                <Link href="/wizard" style={{ textDecoration: 'none' }}>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: C.red, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(230,57,70,0.25)' }}>
                        {Ico.plus} New Report
                    </button>
                </Link>
            </div>

            {/* Status filter tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '4px', borderRadius: 10, width: 'fit-content', border: `1px solid ${C.border}` }}>
                {(['all', 'completed', 'processing', 'failed'] as const).map(s => (
                    <button key={s} onClick={() => setFilter(s)} style={{
                        padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: filter === s ? 700 : 500,
                        background: filter === s ? C.white : 'transparent',
                        color: filter === s ? C.text : C.muted,
                        border: 'none', cursor: 'pointer',
                        boxShadow: filter === s ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 150ms ease',
                    }}>
                        {s.charAt(0).toUpperCase() + s.slice(1)} <span style={{ color: filter === s ? C.blue : C.muted, fontFamily: 'DM Mono,monospace' }}>({counts[s as keyof typeof counts] ?? jobs.filter(j => j.status === s).length})</span>
                    </button>
                ))}
            </div>

            {/* Type + Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    {(['all', 'industry_report', 'datapack', 'trends_report'] as const).map(t => {
                        const tl = TYPE_LABELS[t] || { label: 'All', color: C.muted, bg: '#f8fafc', border: C.border };
                        return (
                            <button key={t} onClick={() => setTypeFilter(t)} style={{
                                fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                                background: typeFilter === t ? (t === 'all' ? '#0f172a' : tl.bg) : C.white,
                                color: typeFilter === t ? (t === 'all' ? '#fff' : tl.color) : C.muted,
                                border: `1px solid ${typeFilter === t ? (t === 'all' ? '#0f172a' : tl.border) : C.border}`,
                                transition: 'all 150ms ease',
                            }}>
                                {t === 'all' ? 'All Types' : tl.label}
                            </button>
                        );
                    })}
                </div>
                <input
                    type="text"
                    placeholder="Search reports…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                        padding: '8px 14px', borderRadius: 8, fontSize: 13,
                        border: `1px solid ${C.border}`, outline: 'none',
                        background: C.white, color: C.text, minWidth: 220,
                    }}
                />
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div style={{ background: C.white, border: `1.5px dashed ${C.border}`, borderRadius: 14, padding: '56px 24px', textAlign: 'center' }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>No reports found</p>
                    <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Try adjusting the filters or search term</p>
                    <Link href="/wizard" style={{ textDecoration: 'none' }}>
                        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: C.red, color: '#fff', border: 'none', cursor: 'pointer' }}>
                            {Ico.plus} Create Report
                        </button>
                    </Link>
                </div>
            ) : (
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: `1px solid ${C.border}` }}>
                                {['Report Title', 'Type', 'Status', 'Created', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '1.2px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((job, ri) => {
                                const st = STATUS[job.status] || STATUS.pending;
                                const tl = TYPE_LABELS[job.type] || { label: job.type, color: C.muted, bg: '#f8fafc', border: C.border };
                                return (
                                    <tr key={job.id} style={{ borderBottom: ri < filtered.length - 1 ? `1px solid #f1f5f9` : 'none' }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafcff'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '14px 18px', maxWidth: 380 }}>
                                            <span style={{ fontWeight: 600, color: C.text, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {job.title || 'Untitled Report'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 18px' }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, background: tl.bg, color: tl.color, border: `1px solid ${tl.border}`, borderRadius: 20, padding: '3px 10px' }}>
                                                {tl.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 18px' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, borderRadius: 20, padding: '3px 10px' }}>
                                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot }} />
                                                {st.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 18px', color: C.muted, whiteSpace: 'nowrap', fontSize: 12 }}>{fmt(job.createdAt)}</td>
                                        <td style={{ padding: '14px 18px' }}>
                                            {job.status === 'completed' && job.reportId ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    {job.type !== 'datapack' && (
                                                        <Link href={`/report/${job.reportId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: C.blue, textDecoration: 'none' }}>
                                                            {Ico.view} View
                                                        </Link>
                                                    )}
                                                    {job.type !== 'datapack' && (
                                                        <a href={`/api/report/${job.reportId}/download/pdf`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: C.sub, textDecoration: 'none' }}>
                                                            {Ico.download} PDF
                                                        </a>
                                                    )}
                                                    <a href={`/api/report/${job.reportId}/download/xlsx`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: job.type === 'datapack' ? C.teal : C.sub, textDecoration: 'none' }}>
                                                        {Ico.download} {job.type === 'datapack' ? 'Excel' : 'Excel'}
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
    );
}
