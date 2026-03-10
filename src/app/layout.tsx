import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { getServerSession } from 'next-auth';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'RefractOne Industry Report Hub',
  description: 'AI-powered market intelligence for modern enterprises',
  openGraph: {
    title: 'RefractOne Industry Report Hub',
    description: 'AI-powered market intelligence for modern enterprises',
    type: 'website',
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
