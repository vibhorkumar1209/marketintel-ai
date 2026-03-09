'use client';

import React from 'react';
import Link from 'next/link';

const C = {
    navy: '#0c3649', purple: '#a855f7', blue: '#3491E8', red: '#E63946',
    white: '#ffffff', border: '#e2e8f0', text: '#0f172a', sub: '#475569', muted: '#94a3b8',
};

export default function TrendsLandingPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Header */}
            <div style={{
                background: 'linear-gradient(120deg,#4a044e 0%,#6b21a8 50%,#7e22ce 100%)',
                borderRadius: 16, padding: '32px 36px',
                boxShadow: '0 4px 24px rgba(74,4,78,0.25)',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', top: -50, right: 100 }} />
                <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', bottom: -30, right: 30 }} />
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>Market Intelligence</p>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Trends Report</h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', maxWidth: 520, marginBottom: 24 }}>
                    A focused deep-dive on market trends, growth drivers and structural barriers — with quantified TEI impact tables, scenario analysis and a regulatory horizon scan.
                </p>
                <Link href="/wizard?type=trends_report" style={{ textDecoration: 'none' }}>
                    <button style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '11px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700,
                        background: '#fff', color: C.purple, border: 'none', cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        Run New Trends Report
                    </button>
                </Link>
            </div>

            {/* What's inside */}
            <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.blue, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 16 }}>What&apos;s in a Trends Report</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                    {[
                        { num: '01', title: 'Macro Trend Identification', desc: '6–10 structural trends with evidence source, time horizon (short / medium / long), and direction (acceleration / stabilisation / reversal)' },
                        { num: '02', title: 'Growth Driver Table (TEI)', desc: 'Top 5–7 drivers with quantified market impact ($ or %), scenario type, probability, affected segments and strategic implication' },
                        { num: '03', title: 'Barrier & Risk Table', desc: 'Top 5–7 barriers with impact quantification, risk horizon (current / 1–2yr / 3–5yr) and mitigation pathway' },
                        { num: '04', title: '3-Scenario Outlook', desc: 'Pessimistic / Base / Optimistic scenario — each with CAGR, key trigger event, probability and market-size range' },
                        { num: '05', title: 'Regulatory Horizon Scan', desc: 'Pending regulations, compliance timelines, regional variance and financial exposure estimate per regulation' },
                        { num: '06', title: 'Technology Disruption Map', desc: 'Emerging technologies, current maturity (TRL), expected adoption window and substitution risk for incumbents' },
                    ].map((card, i) => (
                        <div key={i} style={{
                            background: C.white, border: `1px solid ${C.border}`,
                            borderRadius: 12, padding: '20px 22px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                            borderTop: `3px solid ${C.purple}`,
                        }}>
                            <p style={{ fontSize: 11, fontWeight: 800, color: C.purple, letterSpacing: '1px', marginBottom: 10 }}>{card.num}</p>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>{card.title}</h3>
                            <p style={{ fontSize: 12, color: C.sub, lineHeight: 1.65 }}>{card.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Methodology note */}
            <div style={{
                background: `${C.purple}08`, border: `1px solid ${C.purple}25`,
                borderRadius: 12, padding: '18px 22px',
            }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.purple, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Methodology</p>
                <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.7 }}>
                    The Trends Report is powered by the same multi-agent research pipeline as the full Industry Report, but focuses its search plan on regulatory filings, technology patent databases, trade press, and M&A signals. All drivers and barriers are extracted with a <strong>TEI (Trend-Evidence-Impact)</strong> framework — every claim requires a source citation, quantified impact range, and confidence classification. Scenario projections are triangulated against the sizing engine output.
                </p>
            </div>

        </div>
    );
}
