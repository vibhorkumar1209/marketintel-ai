'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { RefractOneLogo } from '../common/RefractOneLogo';

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
          width: isCollapsed ? 80 : 280,
          minWidth: isCollapsed ? 80 : 280,
          background: 'linear-gradient(180deg, #0C3649 0%, #1a4a6b 100%)',
          borderRight: '1px solid #1a4a6b',
          transition: 'width 250ms ease, min-width 250ms ease',
          position: 'relative',
          zIndex: 20,
        }}
        className="hidden md:flex flex-col"
      >
        {/* Logo */}
        <div style={{
          height: 80,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          padding: isCollapsed ? '0 16px' : '0 24px',
          overflow: 'hidden',
        }}>
          <RefractOneLogo size={48} showText={!isCollapsed} />
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(c => !c)}
          style={{
            position: 'absolute', top: 16, right: isCollapsed ? -12 : -12,
            width: 24, height: 24, borderRadius: '50%',
            background: '#1a4a6b', border: '1px solid rgba(255,255,255,0.15)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#3491E8', zIndex: 30,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
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
                  background: active ? 'rgba(230, 57, 70, 0.1)' : 'transparent',
                  color: active ? '#ffffff' : '#7eaabf',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                      (e.currentTarget as HTMLElement).style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = '#7eaabf';
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
        <div style={{ borderTop: '1px solid #064e3b', padding: '12px' }}>
          {!isCollapsed && credits !== null && (
            <div style={{
              background: 'rgba(52, 145, 232, 0.1)', border: '1px solid rgba(52, 145, 232, 0.2)',
              borderRadius: 8, padding: '8px 12px', marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3491E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              <span style={{ fontSize: 11, color: '#3491E8', fontWeight: 600 }}>CREDITS</span>
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
              background: '#3491E8', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}>
              {initials}
            </div>
            {!isCollapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>
                  {session?.user?.name || 'User'}
                </div>
                <div style={{ fontSize: 10, color: '#7eaabf', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>
                  {session?.user?.email || ''}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Mobile: Navbar/Dropdown ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50">
        <div className="h-20 bg-[#0C3649] border-b border-[#1a4a6b] flex items-center justify-between px-6 shadow-lg">
          <Link href="/dashboard" className="flex items-center no-underline">
            <RefractOneLogo size={48} showText={true} />
          </Link>

          <div className="relative">
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="flex items-center gap-2 bg-[#1a4a6b] px-3 py-1.5 rounded-lg border border-white/10 text-[#3491E8] active:scale-95 transition-transform"
            >
              <span className="text-xs font-bold text-white uppercase tracking-wider">Menu</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {mobileOpen ? <path d="M18 10l-6-6-6 6" /> : <path d="M6 9l6 6 6-6" />}
              </svg>
            </button>

            {/* Dropdown Menu Overlay */}
            {mobileOpen && (
              <div className="absolute top-12 right-0 w-72 bg-[#0C3649] border border-[#1a4a6b] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-3 flex flex-col gap-1">

                  {/* Global Search in Mobile Dropdown */}
                  <div className="px-1 mb-3">
                    <div className="relative">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7eaabf" strokeWidth="2.5" className="absolute left-3 top-1/2 -translate-y-1/2">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search research..."
                        className="w-full bg-[#162540] border border-[#1a4a6b] text-white text-xs rounded-lg py-2 pl-9 pr-3 focus:outline-none focus:border-[#3491E8]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setMobileOpen(false);
                            // Navigate locally
                            window.location.href = `/wizard?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`;
                          }
                        }}
                      />
                    </div>
                  </div>

                  {NAV_ITEMS.map(item => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg no-underline transition-colors ${active ? 'bg-[#E63946]/10 text-white' : 'text-[#7eaabf] hover:bg-white/5 hover:text-white'
                          }`}
                      >
                        <span className={active ? 'text-[#E63946]' : 'text-inherit'}>{item.icon}</span>
                        <span className="text-sm font-semibold">{item.label}</span>
                        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E63946]" />}
                      </Link>
                    );
                  })}

                  {/* Bottom info in dropdown */}
                  <div className="mt-2 pt-2 border-t border-[#1a4a6b] px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#3491E8] flex items-center justify-center text-xs font-bold text-white">
                        {initials}
                      </div>
                      <span className="text-xs font-bold text-white truncate max-w-[100px]">{session?.user?.name || 'User'}</span>
                    </div>
                    {credits !== null && (
                      <div className="bg-[#3491E8]/10 px-2 py-1 rounded border border-[#3491E8]/20">
                        <span className="text-[10px] font-black text-[#3491E8]">{credits} Cr</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Backdrop for mobile dropdown */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/40 -z-10 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </div>
    </>
  );
};

export default Sidebar;
