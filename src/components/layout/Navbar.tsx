'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { clsx } from 'clsx';
import Button from '../ui/Button';
import { ThemeToggle } from './ThemeToggle';

const Navbar: React.FC = () => {
  const { data: session } = useSession();
  const [credits, setCredits] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

    if (session?.user) {
      fetchCredits();
    }
  }, [session]);

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  return (
    <nav className="bg-[#111827] border-b border-[#2A3A55] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href={session ? '/dashboard' : '/'}
            className="flex items-center gap-2 font-bold text-xl"
          >
            <span className="text-[#E8EDF5]">MarketIntel</span>
            <span className="text-teal-600">AI</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {session?.user && (
              <>
                <div className="flex items-center gap-2 px-4 py-2 bg-[#0A1628] rounded-lg border border-[#2A3A55]">
                  <span className="text-teal-500 text-lg">⚡</span>
                  <span className="text-[#E8EDF5] font-semibold">
                    {credits !== null ? `${credits}` : '...'}
                  </span>
                  <span className="text-[#8899BB] text-sm">credits</span>
                </div>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#1B2A4A] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-semibold">
                      {session.user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-[#E8EDF5] text-sm font-medium">
                      {session.user.name || session.user.email}
                    </span>
                    <svg
                      className={clsx(
                        'w-4 h-4 text-[#8899BB] transition-transform',
                        isDropdownOpen && 'rotate-180'
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#111827] border border-[#2A3A55] rounded-lg shadow-lg overflow-hidden">
                      <Link
                        href="/settings"
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-4 py-2.5 text-[#E8EDF5] hover:bg-[#1B2A4A] transition-colors border-b border-[#2A3A55]"
                      >
                        Settings
                      </Link>
                      <Link
                        href="/billing"
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-4 py-2.5 text-[#E8EDF5] hover:bg-[#1B2A4A] transition-colors border-b border-[#2A3A55]"
                      >
                        Billing
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2.5 text-red-400 hover:bg-red-600 hover:bg-opacity-10 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {!session?.user && (
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Button variant="ghost" size="sm" href="/signin">
                  Sign In
                </Button>
                <Button variant="primary" size="sm" href="/signup">
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-[#1B2A4A] transition-colors"
            >
              <svg
                className="w-6 h-6 text-[#E8EDF5]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    isMobileMenuOpen
                      ? 'M6 18L18 6M6 6l12 12'
                      : 'M4 6h16M4 12h16M4 18h16'
                  }
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#2A3A55] py-4 space-y-3">
            {session?.user && (
              <>
                <div className="flex items-center gap-2 px-4 py-2 bg-[#0A1628] rounded-lg border border-[#2A3A55]">
                  <span className="text-teal-500 text-lg">⚡</span>
                  <span className="text-[#E8EDF5] font-semibold">
                    {credits !== null ? `${credits}` : '...'}
                  </span>
                  <span className="text-[#8899BB] text-sm">credits</span>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2 text-[#E8EDF5] hover:bg-[#1B2A4A] rounded-lg transition-colors"
                >
                  Settings
                </Link>
                <Link
                  href="/billing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2 text-[#E8EDF5] hover:bg-[#1B2A4A] rounded-lg transition-colors"
                >
                  Billing
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-600 hover:bg-opacity-10 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}

            {!session?.user && (
              <div className="flex flex-col gap-2">
                <Button variant="ghost" size="md" href="/signin" className="w-full">
                  Sign In
                </Button>
                <Button variant="primary" size="md" href="/signup" className="w-full">
                  Get Started
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
