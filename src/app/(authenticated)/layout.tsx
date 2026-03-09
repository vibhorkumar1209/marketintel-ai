import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/signin');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080f16' }}>
      {/* Fixed-width navy sidebar */}
      <Sidebar />

      {/* Right column: topnav + content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#080f16' }}>
        <Navbar />
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
