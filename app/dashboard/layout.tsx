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
              onSignOut={handleSignOut}
            />
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Page content */}
          <main className="flex-1 overflow-hidden relative">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="absolute top-4 left-4 z-40 p-2.5 bg-surface text-text-primary hover:bg-surface-alt border-2 border-border/50 shadow-md rounded-xl transition-all"
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
