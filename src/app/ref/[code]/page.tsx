'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ReferralRedirectPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const code = params.code as string;
    if (code) {
      localStorage.setItem('nl_referral', code.toUpperCase());
    }
    router.replace('/');
  }, [params.code, router]);

  return null;
}
