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
    <div className="flex flex-col md:flex-row min-h-screen bg-[#080f16]">
      {/* Sidebar: hidden on mobile by default, handled internally by Sidebar component */}
      <Sidebar />

      {/* Right column: topnav + content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f9fafb] pt-14 md:pt-0">
        {/* Navbar is hidden on md in Sidebar mobile view, so we keep parity here */}
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
