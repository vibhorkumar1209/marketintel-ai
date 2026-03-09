'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: '/wizard',
    label: 'New Report',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    href: '/reports',
    label: 'Report History',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },

  {
    href: '/billing',
    label: 'Credits & Billing',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [credits, setCredits] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch('/api/credits').then(r => r.ok ? r.json() : null).then(d => d && setCredits(d.balance)).catch(() => { });
  }, []);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname.startsWith(href.split('#')[0]);
  };

  const initials = session?.user?.name?.slice(0, 1)?.toUpperCase() || session?.user?.email?.slice(0, 1)?.toUpperCase() || 'U';

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside
        style={{
          width: isCollapsed ? 68 : 220,
          minWidth: isCollapsed ? 68 : 220,
          background: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 250ms ease, min-width 250ms ease',
          position: 'relative',
          zIndex: 20,
        }}
        className="hidden md:flex"
      >
        {/* Logo */}
        <div style={{
          height: 56,
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          padding: isCollapsed ? '0 16px' : '0 20px',
          gap: 10,
          overflow: 'hidden',
        }}>
          {/* Triangle logo mark */}
          <div style={{
            width: 30, height: 30, flexShrink: 0,
            background: 'linear-gradient(135deg, #3491E8 0%, #E63946 100%)',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          }} />
          {!isCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0c3649', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                RefractOne
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                Industry Report Hub
              </div>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(c => !c)}
          style={{
            position: 'absolute', top: 16, right: isCollapsed ? -12 : -12,
            width: 24, height: 24, borderRadius: '50%',
            background: '#ffffff', border: '1px solid #e5e7eb',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#64748b', zIndex: 30,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d={isCollapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href);
            return (
              <Link key={item.label} href={item.href}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: isCollapsed ? '11px 0' : '11px 20px',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  margin: '2px 0',
                  borderLeft: active ? '3px solid #E63946' : '3px solid transparent',
                  background: active ? '#fff1f2' : 'transparent',
                  color: active ? '#E63946' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = '#f8fafc';
                      (e.currentTarget as HTMLElement).style.color = '#0c3649';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = '#64748b';
                    }
                  }}
                  title={isCollapsed ? item.label : ''}
                >
                  <span style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }}>{item.icon}</span>
                  {!isCollapsed && (
                    <span style={{ fontSize: 13, fontWeight: active ? 600 : 500, whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User + Credits */}
        <div style={{ borderTop: '1px solid #e5e7eb', padding: '12px' }}>
          {!isCollapsed && credits !== null && (
            <div style={{
              background: '#eff6ff', border: '1px solid #dbeafe',
              borderRadius: 8, padding: '8px 12px', marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3491E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>CREDITS</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#3491E8', fontFamily: 'DM Mono, monospace', marginLeft: 'auto' }}>
                {credits}
              </span>
            </div>
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: isCollapsed ? '4px 0' : '4px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#E63946', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}>
              {initials}
            </div>
            {!isCollapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0c3649', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>
                  {session?.user?.name || 'User'}
                </div>
                <div style={{ fontSize: 10, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>
                  {session?.user?.email || ''}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Mobile: Top bar + slide-out ── */}
      <div className="md:hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <div style={{
          height: 56, background: '#ffffff', borderBottom: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 26, height: 26,
              background: 'linear-gradient(135deg, #3491E8 0%, #E63946 100%)',
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            }} />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0c3649' }}>RefractOne</span>
          </div>
          <button onClick={() => setMobileOpen(o => !o)} style={{ background: 'none', border: 'none', color: '#7eaabf', cursor: 'pointer' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
            </svg>
          </button>
        </div>
        {mobileOpen && (
          <div style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '8px 0' }}>
            {NAV_ITEMS.map(item => (
              <Link key={item.label} href={item.href} onClick={() => setMobileOpen(false)}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                  color: isActive(item.href) ? '#E63946' : '#64748b',
                  borderLeft: isActive(item.href) ? '3px solid #E63946' : '3px solid transparent',
                  background: isActive(item.href) ? '#fff1f2' : 'transparent',
                  fontSize: 14, fontWeight: 500,
                }}>
                  {item.icon}<span>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
