'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChange } from '@/lib/supabase/auth';

export function AuthListener() {
  const router = useRouter();

  useEffect(() => {
    // Fallback: Manually check the hash in case Supabase processes it before the listener attaches
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      router.push('/reset-password');
    }

    const { data: authListener } = onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.push('/reset-password');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
