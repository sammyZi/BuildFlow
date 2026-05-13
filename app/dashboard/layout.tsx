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
          <main className="flex-1 overflow-hidden">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="fixed top-4 left-4 z-20 p-2 text-text-muted hover:text-text-primary hover:bg-surface border border-border rounded-lg transition-colors"
                title="Open sidebar"
              >
                <PanelLeft size={18} strokeWidth={1.5} />
              </button>
            )}
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
