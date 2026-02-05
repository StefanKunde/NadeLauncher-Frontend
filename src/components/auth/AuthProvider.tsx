'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { authApi } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const { refreshToken, setTokens, logout, hydrate } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const token = useAuthStore.getState().refreshToken;
    if (!token) {
      setLoading(false);
      router.replace('/');
      return;
    }

    authApi
      .refresh(token)
      .then((data) => {
        setTokens(data.accessToken, data.refreshToken, data.user);
        setLoading(false);
      })
      .catch(() => {
        logout();
        setLoading(false);
        router.replace('/');
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#f0a500] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
