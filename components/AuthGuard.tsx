'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, onAuthStateChange } from '@/lib/supabase/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard component
 * Protects routes by checking authentication state
 * Redirects unauthenticated users to /login
 * Maintains session state across page refreshes
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check initial authentication state
    const checkAuth = async () => {
      try {
        const session = await getSession();
        
        if (session) {
          setIsAuthenticated(true);
        } else {
          // Redirect unauthenticated users to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      }
    };

    checkAuth();

    // Listen to auth state changes to maintain session across page refreshes
    const { data: authListener } = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        router.push('/login');
      }
    });

    // Cleanup subscription on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="glassmorphism-card">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#4a90e2]"></div>
            <span className="text-[#212529]">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Grant dashboard access when authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
}
