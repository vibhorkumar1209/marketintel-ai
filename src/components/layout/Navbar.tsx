'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { RefractOneLogo } from '../common/RefractOneLogo';

const Navbar: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [credits, setCredits] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/credits').then(r => r.ok ? r.json() : null).then(d => d && setCredits(d.balance)).catch(() => { });
    }
  }, [session]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = session?.user?.name?.slice(0, 1)?.toUpperCase() || session?.user?.email?.slice(0, 1)?.toUpperCase() || 'U';

  return (
    <nav
      className="hidden md:flex items-center"
      style={{
        height: 56,
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        paddingLeft: 24,
        paddingRight: 24,
        gap: 24,
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Brand Logo */}
      <Link href="/" className="flex items-center no-underline mr-4">
        <RefractOneLogo size={32} showText={true} textColor="#0C3649" />
      </Link>

      {/* Search bar */}
      <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        >
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && search.trim()) router.push(`/wizard?q=${encodeURIComponent(search.trim())}`); }}
          placeholder="Search reports, companies, or keywords..."
          style={{
            width: '100%',
            height: 36,
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            background: '#f9fafb',
            paddingLeft: 36,
            paddingRight: 12,
            fontSize: 13,
            color: '#1f2937',
            outline: 'none',
            fontFamily: 'Inter, sans-serif',
          }}
          onFocus={e => { e.target.style.borderColor = '#3491E8'; e.target.style.background = '#fff'; }}
          onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Credits badge */}
      {session?.user && credits !== null && (
        <Link href="/billing">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            border: '1px solid #e5e7eb', borderRadius: 8,
            padding: '5px 12px', cursor: 'pointer',
            background: '#f9fafb',
            transition: 'all 150ms ease',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#3491E8'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3491E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1f2937', fontFamily: 'DM Mono, monospace' }}>
              {credits} Credits
            </span>
          </div>
        </Link>
      )}

      {/* Bell */}
      <button style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '1px solid #e5e7eb', background: '#f9fafb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', position: 'relative',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        <div style={{
          position: 'absolute', top: 6, right: 6,
          width: 8, height: 8, borderRadius: '50%',
          background: '#E63946', border: '2px solid #fff',
        }} />
      </button>

      {/* User avatar + dropdown */}
      {session?.user && (
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#0c3649', color: '#fff',
              border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {initials}
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 44,
              width: 200,
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              overflow: 'hidden', zIndex: 60,
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>
                  {session.user.name || 'User'}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                  {session.user.email}
                </div>
              </div>
              {[{ label: 'Settings', href: '/settings' }, { label: 'Billing', href: '/billing' }].map(item => (
                <Link key={item.label} href={item.href} onClick={() => setDropdownOpen(false)}>
                  <div style={{
                    padding: '10px 16px', fontSize: 13, color: '#374151',
                    cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    {item.label}
                  </div>
                </Link>
              ))}
              <button
                onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: '/' }); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 16px',
                  fontSize: 13, color: '#E63946', background: 'none', border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fff5f5'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
