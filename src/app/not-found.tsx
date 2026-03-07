'use client';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-teal-500 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-[#E8EDF5] mb-4">Page Not Found</h2>
        <p className="text-[#8899BB] mb-8">The page you are looking for does not exist.</p>
        <Link href="/dashboard" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
