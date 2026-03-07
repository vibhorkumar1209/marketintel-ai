import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { getServerSession } from 'next-auth';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'MarketIntel AI',
  description: 'AI-powered market intelligence for modern enterprises',
  openGraph: {
    title: 'MarketIntel AI',
    description: 'AI-powered market intelligence for modern enterprises',
    type: 'website',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans bg-[#0A1628] text-[#E8EDF5]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
