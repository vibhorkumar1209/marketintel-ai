'use client';

import React from 'react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1B2A4A] to-[#0A1628] flex flex-col">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 bg-hero-pattern pointer-events-none" />

      {/* Auth Container */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center mb-8">
            <span className="text-3xl font-bold">
              <span className="text-[#E8EDF5]">MarketIntel</span>
              <span className="text-teal-600">AI</span>
            </span>
          </Link>

          {/* Auth Card */}
          <div className="bg-[#111827] border border-[#2A3A55] rounded-xl shadow-2xl p-8">
            <div className="space-y-6">
              {children}
            </div>
          </div>

          {/* Footer Text */}
          <p className="text-center text-[#8899BB] text-sm mt-8">
            By using MarketIntel AI, you agree to our{' '}
            <Link href="/terms" className="text-teal-600 hover:text-teal-500 transition-colors">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-teal-600 hover:text-teal-500 transition-colors">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
