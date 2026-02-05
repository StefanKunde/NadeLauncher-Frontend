'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { authApi } from '@/lib/api';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setTokens = useAuthStore((s) => s.setTokens);

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');

    if (token && refreshToken) {
      useAuthStore.setState({ accessToken: token, refreshToken });
      authApi.getMe().then((data) => {
        setTokens(data.accessToken, data.refreshToken, data.user);
        router.replace('/dashboard');
      }).catch(() => {
        setTokens(token, refreshToken, {} as any);
        router.replace('/dashboard');
      });
    } else {
      router.replace('/');
    }
  }, [searchParams, setTokens, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#f0a500] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#555577]">Logging in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#f0a500] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#555577]">Loading...</p>
          </div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
