'use client';

import React, { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import ProjectHistory from '@/components/ProjectHistory';
import { signOut } from '@/lib/supabase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { PanelLeft, LogOut, Layers, Menu } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const match = pathname.match(/\/dashboard\/results\/(.+)/);
  const currentProjectId = match ? match[1] : undefined;

  const handleSelectProject = (projectId: string) => {
    if (projectId) {
      router.push(`/dashboard/results/${projectId}`);
    } else {
      router.push('/dashboard');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthGuard>
      <div className="flex flex-col lg:flex-row h-screen overflow-hidden font-sans bg-bg">
        {/* Mobile Backdrop */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50
            transform transition-all duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            ${isSidebarOpen ? 'lg:w-[260px]' : 'lg:w-0'}
            flex-shrink-0 overflow-hidden bg-bg border-r border-border shadow-2xl lg:shadow-none
          `}
        >
          <div className="w-[260px] h-full flex flex-col">
            <ProjectHistory
              onSelectProject={handleSelectProject}
              currentProjectId={currentProjectId}
              onCollapse={() => {
                if (window.innerWidth < 1024) {
                  setIsMobileMenuOpen(false);
                } else {
                  setIsSidebarOpen(false);
                }
              }}
              onSignOut={handleSignOut}
            />
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-bg">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
              >
                <Menu size={24} />
              </button>
              <div className="font-semibold text-text-primary flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                BuildFlow
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-hidden relative">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="absolute top-4 left-4 z-40 p-2.5 bg-surface text-text-primary hover:bg-surface-alt border-2 border-border/50 shadow-md rounded-xl transition-all hidden lg:block"
                title="Open sidebar"
              >
                <PanelLeft size={20} strokeWidth={2} />
              </button>
            )}
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
