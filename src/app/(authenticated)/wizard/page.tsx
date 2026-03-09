'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ── Inline SVG icons (no emoji) ──────────────────────────────────────────────

const IconCheck = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconReport = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconDatapack = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M3 15h18M9 3v18" />
  </svg>
);

const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// Feature list for each product
const REPORT_FEATURES = [
  { title: '9-section deep research report', desc: 'Scope → Sizing → Segments → Dynamics → Regulatory → Tech → Competitive → Forecast → Exec Summary' },
  { title: 'Dual-method market sizing', desc: 'Top-down + bottom-up with triangulation table and confidence tags' },
  { title: 'TEI driver & barrier tables', desc: 'Quantified impact, scenario type, risk horizon per driver/barrier' },
  { title: '3-scenario forecast', desc: 'Pessimistic / Base / Optimistic with reconciled CAGR projections' },
  { title: 'PDF + Excel export', desc: 'Print-ready PDF and structured XLSX with all data' },
];

const DATAPACK_FEATURES = [
  { title: 'Time-series data (2019–2030)', desc: 'Historical actuals and base + scenario forecasts' },
  { title: 'Multi-dimension segmentation', desc: 'By product type, application, end-use, geography, channel' },
  { title: 'Competitive share table', desc: 'Top 10 players with estimated revenue and market share' },
  { title: 'XLSX output', desc: 'Ready for pivot tables, charts, and further analysis' },
  { title: 'Source log included', desc: 'Every data point traced to source tier & date' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function WizardProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || '';
  const [selectedType, setSelectedType] = useState<'industry_report' | 'datapack' | ''>((initialType as any) || '');

  const handleContinue = () => {
    if (selectedType) router.push(`/wizard/query?type=${selectedType}`);
  };

  // Teal: #00BDA8  Navy card: #0f1c2e  Darker: #0c1828
  const TEAL = '#00BDA8';
  const NAVY = '#0f1c2e';
  const NAVY_BORDER = '#1e3a5f';
  const NAVY_LIGHT = '#142233';
  const TEXT_PRIMARY = '#E8F0F5';
  const TEXT_MUTED = '#7eaabf';
  const AMBER = '#f59e0b';

  const products = [
    {
      id: 'industry_report' as const,
      icon: <IconReport />,
      title: 'Industry Report',
      subtitle: '9-Section Deep Research Report',
      features: REPORT_FEATURES,
      price: 'From $49',
      credits: '50 credits',
      creditsColor: TEAL,
    },
    {
      id: 'datapack' as const,
      icon: <IconDatapack />,
      title: 'Market Datapack',
      subtitle: '10-Sheet Excel File',
      features: DATAPACK_FEATURES,
      price: 'From $30',
      credits: '30 credits',
      creditsColor: AMBER,
    },
  ];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#3491E8', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>
          Step 1 of 3
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0c3649', marginBottom: 6 }}>
          Describe Your Research
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Tell us what market you want to research</p>
      </div>

      {/* Step progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
        {[1, 2, 3].map((step, i) => (
          <React.Fragment key={step}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
              background: step === 1 ? TEAL : '#1e3a5f',
              color: step === 1 ? '#fff' : TEXT_MUTED,
              border: step === 1 ? 'none' : `2px solid ${NAVY_BORDER}`,
            }}>
              {step === 1 ? <IconCheck size={14} /> : step}
            </div>
            {i < 2 && (
              <div style={{
                flex: 1, height: 3, margin: '0 4px',
                background: step === 1 ? TEAL : NAVY_BORDER,
                borderRadius: 2,
              }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Product cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
        {products.map(prod => {
          const selected = selectedType === prod.id;
          return (
            <div
              key={prod.id}
              onClick={() => setSelectedType(prod.id)}
              style={{
                background: NAVY,
                border: `1px solid ${selected ? TEAL : NAVY_BORDER}`,
                borderRadius: 14,
                padding: 28,
                cursor: 'pointer',
                boxShadow: selected ? `0 0 0 2px ${TEAL}40` : 'none',
                transition: 'border-color 150ms ease, box-shadow 150ms ease',
              }}
            >
              {/* Icon */}
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: selected ? `${TEAL}20` : '#162540',
                color: selected ? TEAL : TEXT_MUTED,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 18,
                transition: 'all 150ms ease',
              }}>
                {prod.icon}
              </div>

              {/* Title */}
              <h2 style={{ fontSize: 20, fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 4 }}>
                {prod.title}
              </h2>
              <p style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 24 }}>
                {prod.subtitle}
              </p>

              {/* Feature list */}
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {prod.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{
                      flexShrink: 0, marginTop: 2,
                      color: TEAL, width: 16, height: 16,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <IconCheck />
                    </span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.3 }}>{f.title}</p>
                      <p style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2, lineHeight: 1.5 }}>{f.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Divider */}
              <div style={{ borderTop: `1px solid ${NAVY_BORDER}`, paddingTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: TEAL }}>{prod.price}</p>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    background: `${prod.creditsColor}22`,
                    color: prod.creditsColor,
                    border: `1px solid ${prod.creditsColor}44`,
                    borderRadius: 20, padding: '4px 12px',
                  }}>
                    {prod.credits}
                  </span>
                </div>

                {/* CTA */}
                <div style={{
                  width: '100%', padding: '12px', borderRadius: 8,
                  textAlign: 'center', fontSize: 14, fontWeight: 700,
                  background: selected ? TEAL : 'transparent',
                  color: selected ? '#fff' : TEAL,
                  border: `1px solid ${TEAL}`,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}>
                  {selected ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <IconCheck size={14} /> Selected
                    </span>
                  ) : 'Select This'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Continue */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <a href="/dashboard" style={{
          padding: '11px 22px', borderRadius: 8, fontSize: 14, fontWeight: 600,
          color: '#6b7280', background: 'transparent', border: '1px solid #e5e7eb',
          cursor: 'pointer', textDecoration: 'none',
        }}>
          Cancel
        </a>
        <button
          onClick={handleContinue}
          disabled={!selectedType}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700,
            background: selectedType ? '#E63946' : '#e5e7eb',
            color: selectedType ? '#fff' : '#9ca3af',
            border: 'none', cursor: selectedType ? 'pointer' : 'default',
            transition: 'all 150ms ease',
          }}
        >
          Continue <IconArrow />
        </button>
      </div>
    </div>
  );
}
