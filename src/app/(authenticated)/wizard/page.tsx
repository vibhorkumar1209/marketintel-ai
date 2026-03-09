'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const IconCheck = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconReport = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const IconTrend = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const IconDatapack = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" />
  </svg>
);
const IconArrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// ── Product definitions ────────────────────────────────────────────────────────
type ProductType = 'industry_report' | 'trends_report' | 'datapack';

interface Product {
  id: ProductType;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  features: { title: string; desc: string }[];
  price: string;
  credits: string;
  accentColor: string;
  creditsColor: string;
  cardGradient: string;
  cardBorder: string;
  iconBg: string;
}

const NAVY = '#0f1c2e';
const TEAL = '#00BDA8';
const PURPLE = '#a855f7';
const TEXT = '#E8F0F5';
const MUTED = '#7eaabf';
const CARD_BORDER = '#1e3a5f';

const PRODUCTS: Product[] = [
  {
    id: 'industry_report',
    icon: <IconReport />,
    title: 'Industry Report',
    subtitle: '9-Section Deep Research',
    features: [
      { title: '9 core research sections', desc: 'Scope → Sizing → Segments → Dynamics → Regulatory → Tech → Competitive → Forecast → Exec Summary' },
      { title: 'Dual-method market sizing', desc: 'Top-down + bottom-up with triangulation table and confidence tags' },
      { title: 'TEI driver & barrier tables', desc: 'Quantified impact, scenario type, risk horizon per factor' },
      { title: '3-scenario forecast', desc: 'Pessimistic / Base / Optimistic with reconciled CAGR projections' },
      { title: 'PDF + Excel export', desc: 'Print-ready PDF and full XLSX data set' },
    ],
    price: 'From $49',
    credits: '50 credits',
    accentColor: TEAL,
    creditsColor: TEAL,
    cardGradient: NAVY,
    cardBorder: CARD_BORDER,
    iconBg: `${TEAL}20`,
  },
  {
    id: 'trends_report',
    icon: <IconTrend />,
    title: 'Trends Report',
    subtitle: 'Drivers, Barriers & Horizon Scan',
    badge: 'NEW',
    badgeColor: PURPLE,
    features: [
      { title: '6–10 macro trends identified', desc: 'Structural trends with time horizon and direction (acceleration / reversal)' },
      { title: 'Growth driver TEI table', desc: '5–7 drivers with quantified $ impact, probability and affected segments' },
      { title: 'Barrier & risk table', desc: '5–7 barriers with impact range, risk horizon and mitigation pathway' },
      { title: 'Regulatory horizon scan', desc: 'Pending regulations, compliance timelines & financial exposure estimates' },
      { title: '3-scenario outlook', desc: 'Pessimistic / Base / Optimistic with CAGR triggers and probability' },
    ],
    price: 'From $35',
    credits: '35 credits',
    accentColor: PURPLE,
    creditsColor: PURPLE,
    cardGradient: '#1a0a2e',
    cardBorder: '#3d1f6e',
    iconBg: `${PURPLE}20`,
  },
  {
    id: 'datapack',
    icon: <IconDatapack />,
    title: 'Market Datapack',
    subtitle: '10-Sheet Excel Download',
    badge: 'XLSX',
    badgeColor: TEAL,
    features: [
      { title: 'TAM time-series (2019–2030)', desc: '5yr historical + base year + full forecast with CAGR projections' },
      { title: 'Segmentation by product / geo / app', desc: 'Current year and historical baseline data for all key segments' },
      { title: '3-scenario market projections', desc: 'Pessimistic / Base / Optimistic projected end-market sizes' },
      { title: 'Competitive share table', desc: 'Top players ranked by estimated market share and revenue' },
      { title: 'Source log included', desc: 'Every data point traced to source tier and date' },
    ],
    price: 'From $30',
    credits: '30 credits',
    accentColor: TEAL,
    creditsColor: '#f59e0b',
    cardGradient: NAVY,
    cardBorder: CARD_BORDER,
    iconBg: `${TEAL}20`,
  },
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function WizardProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') as ProductType | '';
  const [selectedType, setSelectedType] = useState<ProductType | ''>(initialType || '');

  const handleContinue = () => {
    if (selectedType) router.push(`/wizard/query?type=${selectedType}`);
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#3491E8', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>Step 1 of 3</p>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0c3649', marginBottom: 6 }}>Choose Report Type</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Select the type of market intelligence you need</p>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36 }}>
        {[1, 2, 3].map((step, i) => (
          <React.Fragment key={step}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
              background: step === 1 ? TEAL : CARD_BORDER,
              color: step === 1 ? '#fff' : MUTED,
            }}>
              {step === 1 ? <IconCheck size={13} /> : step}
            </div>
            {i < 2 && <div style={{ flex: 1, height: 3, margin: '0 4px', background: step === 1 ? TEAL : CARD_BORDER, borderRadius: 2 }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Product cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
        {PRODUCTS.map(prod => {
          const selected = selectedType === prod.id;
          return (
            <div
              key={prod.id}
              onClick={() => setSelectedType(prod.id)}
              style={{
                background: prod.cardGradient,
                border: `1px solid ${selected ? prod.accentColor : prod.cardBorder}`,
                borderRadius: 14, padding: '22px 22px',
                cursor: 'pointer',
                boxShadow: selected ? `0 0 0 2px ${prod.accentColor}40` : 'none',
                transition: 'all 150ms ease', display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Icon + badge */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: selected ? prod.iconBg : '#162540',
                  color: selected ? prod.accentColor : MUTED,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 150ms ease',
                }}>
                  {prod.icon}
                </div>
                {prod.badge && (
                  <span style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: '1.5px',
                    background: `${prod.badgeColor}20`, color: prod.badgeColor,
                    border: `1px solid ${prod.badgeColor}40`, borderRadius: 20, padding: '3px 8px',
                  }}>{prod.badge}</span>
                )}
              </div>

              <h2 style={{ fontSize: 17, fontWeight: 800, color: TEXT, marginBottom: 3 }}>{prod.title}</h2>
              <p style={{ fontSize: 12, color: MUTED, marginBottom: 18 }}>{prod.subtitle}</p>

              <ul style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 20, flex: 1 }}>
                {prod.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, marginTop: 2, color: prod.accentColor, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconCheck />
                    </span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: TEXT, lineHeight: 1.3 }}>{f.title}</p>
                      <p style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.5 }}>{f.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Divider */}
              <div style={{ borderTop: `1px solid ${prod.cardBorder}`, paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <p style={{ fontSize: 18, fontWeight: 900, color: prod.accentColor }}>{prod.price}</p>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    background: `${prod.creditsColor}20`, color: prod.creditsColor,
                    border: `1px solid ${prod.creditsColor}40`, borderRadius: 20, padding: '3px 10px',
                  }}>{prod.credits}</span>
                </div>
                <div style={{
                  width: '100%', padding: '10px', borderRadius: 8, textAlign: 'center',
                  fontSize: 13, fontWeight: 700,
                  background: selected ? prod.accentColor : 'transparent',
                  color: selected ? '#fff' : prod.accentColor,
                  border: `1px solid ${prod.accentColor}`,
                  cursor: 'pointer', transition: 'all 150ms ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  {selected ? <><IconCheck size={13} /> Selected</> : (prod.id === 'datapack' ? <><IconDownload /> Select</> : 'Select This')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Continue */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <a href="/dashboard" style={{ padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#6b7280', background: 'transparent', border: '1px solid #e5e7eb', cursor: 'pointer', textDecoration: 'none' }}>
          Cancel
        </a>
        <button
          onClick={handleContinue}
          disabled={!selectedType}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 26px', borderRadius: 8, fontSize: 13, fontWeight: 700,
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
