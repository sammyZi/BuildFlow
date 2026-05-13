'use client';

import React, { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import ProjectHistory from '@/components/ProjectHistory';
import { signOut } from '@/lib/supabase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { PanelLeft, LogOut, Layers } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

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
      <div className="flex h-screen overflow-hidden font-sans bg-bg">
        {/* Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? 'w-[260px]' : 'w-0'
          } transition-all duration-300 ease-in-out flex-shrink-0 hidden lg:block overflow-hidden`}
        >
          <div className="w-[260px] h-full">
            <ProjectHistory
              onSelectProject={handleSelectProject}
              currentProjectId={currentProjectId}
              onCollapse={() => setIsSidebarOpen(false)}
            />
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Header */}
          <header className="h-[48px] border-b border-border flex items-center justify-between px-4 flex-shrink-0 bg-surface z-10">
            <div className="flex items-center gap-2.5">
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
                  title="Open sidebar"
                >
                  <PanelLeft size={17} strokeWidth={1.5} />
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className="w-5.5 h-5.5 rounded bg-primary flex items-center justify-center">
                  <Layers size={12} className="text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[13px] font-bold text-text-primary tracking-tight">AI Architect</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-text-muted hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
              >
                <LogOut size={14} strokeWidth={1.5} />
                Sign out
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
