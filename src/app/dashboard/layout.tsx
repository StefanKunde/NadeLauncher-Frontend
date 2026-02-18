'use client';

import { Construction } from 'lucide-react';
import { AuthProvider } from '@/components/auth/AuthProvider';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-[#0a0a0f]">
        <Sidebar />
        <main className="flex-1 lg:ml-72 p-4 pt-20 lg:pt-8 lg:p-8 overflow-y-auto">
          {/* Early Access Banner */}
          <div className="mb-6 max-w-7xl">
            <div className="rounded-xl bg-[#12121a] border border-[#f0a500]/15 px-4 py-3 flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f0a500]/10">
                <Construction className="h-3.5 w-3.5 text-[#f0a500]" />
              </div>
              <p className="text-xs text-[#6b6b8a]">
                <span className="text-[#f0a500]/80 font-medium">Early Access</span>
                <span className="mx-1.5 text-[#2a2a3e]">&middot;</span>
                NadePro is in development. Your feedback helps a lot!
              </p>
            </div>
          </div>
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
