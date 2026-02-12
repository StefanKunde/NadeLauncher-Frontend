'use client';

import { Construction } from 'lucide-react';
import { AuthProvider } from '@/components/auth/AuthProvider';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-[#0a0a0f]">
        <Sidebar />
        <main className="flex-1 ml-72 p-8 overflow-y-auto">
          {/* Early Access Banner */}
          <div className="mb-6 max-w-7xl">
            <div className="rounded-lg bg-[#f0a50010] border border-[#f0a50030] px-4 py-3 flex items-start gap-3">
              <Construction className="h-5 w-5 text-[#f0a500] shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-[#f0a500] font-medium">Early Access</p>
                <p className="text-[#6b6b8a] mt-0.5">
                  NadePro is still in development and may have bugs. If you encounter any issues, your feedback helps a lot!
                </p>
              </div>
            </div>
          </div>
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
