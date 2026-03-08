'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [credits, setCredits] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await fetch('/api/credits');
        if (res.ok) {
          const data = await res.json();
          setCredits(data.balance);
        }
      } catch (error) {
        console.error('Failed to fetch credits:', error);
      }
    };

    fetchCredits();
  }, []);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/wizard', label: 'New Report', icon: '✨' },
    { href: '/dashboard', label: 'Report History', icon: '📜' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
    { href: '/billing', label: 'Billing', icon: '💳' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          'hidden md:flex flex-col bg-[#111827] border-r border-[#2A3A55] transition-all duration-300',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Toggle Button */}
        <div className="p-4 border-b border-[#2A3A55] flex items-center justify-between">
          {!isCollapsed && (
            <Link href="/dashboard" className="font-bold text-lg">
              <span className="text-[#E8EDF5]">RefractOne Industry Report Hub</span>
              <span className="text-teal-600">AI</span>
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-[#1B2A4A] rounded-lg transition-colors"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <svg
              className="w-5 h-5 text-[#8899BB]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isCollapsed ? 'M13 5l7 7m0 0l-7 7m7-7H5' : 'M11 19l-7-7m0 0l7-7m-7 7h16'}
              />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                'border-l-4 border-transparent',
                isActive(item.href)
                  ? 'bg-teal-600 bg-opacity-10 border-l-teal-600 text-teal-400'
                  : 'text-[#8899BB] hover:bg-[#1B2A4A] hover:text-[#E8EDF5]'
              )}
              title={isCollapsed ? item.label : ''}
            >
              <span className="text-xl">{item.icon}</span>
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Credit Balance */}
        <div className="p-4 border-t border-[#2A3A55]">
          <div
            className={clsx(
              'bg-[#0A1628] border border-[#2A3A55] rounded-lg p-3',
              'flex items-center justify-center gap-2'
            )}
            title={isCollapsed ? `${credits || '...'} credits` : ''}
          >
            <span className="text-teal-500 text-lg">⚡</span>
            {!isCollapsed && (
              <>
                <div className="flex-1">
                  <p className="text-xs text-[#8899BB]">Available</p>
                  <p className="text-lg font-bold text-[#E8EDF5]">
                    {credits !== null ? `${credits}` : '...'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar (shown as dropdown) */}
      <div className="md:hidden" />
    </>
  );
};

export default Sidebar;
