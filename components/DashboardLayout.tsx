'use client';

import React, { useState } from 'react';

import { signOut } from '@/lib/supabase/auth';
import { useRouter } from 'next/navigation';

import { Logo } from '@/components/ui/Logo';

interface DashboardLayoutProps {
  sidebar?: React.ReactNode;
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

export default function DashboardLayout({ sidebar, leftPanel, rightPanel }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex h-screen bg-chat-main text-chat-text overflow-hidden font-sans selection:bg-chat-accent/20">

      {/* Main Sidebar (Project History) */}
      {sidebar && (
        <div 
          className={`${
            isSidebarOpen ? 'w-[280px] opacity-100' : 'w-0 opacity-0'
          } transition-all duration-300 ease-in-out bg-chat-sidebar1 border-r border-chat-border flex-col flex-shrink-0 z-10 hidden lg:flex`}
        >
          <div className="w-[280px] h-full flex flex-col">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-full bg-chat-main w-full min-w-0">
        
        {/* Top Header */}
        <header className="h-[60px] border-b border-chat-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-10 bg-chat-main">
          <div className="flex items-center gap-3">
            {sidebar && (
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 -ml-2 text-chat-textMuted hover:text-chat-text hover:bg-chat-sidebar1 rounded-md transition-colors"
                title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </button>
            )}
            <div className="flex items-center gap-2">
              <Logo className="w-6 h-6" />
              <div className="text-[16px] font-bold text-chat-text tracking-tight">
                BuildFlow
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSignOut}
              className="text-[15px] font-semibold text-chat-textMuted hover:text-chat-text transition-colors"
            >
              Sign out
            </button>
            <div className="w-8 h-8 rounded-full bg-chat-textMuted overflow-hidden flex items-center justify-center text-white text-xs font-bold ring-2 ring-chat-border">
              US
            </div>
          </div>
        </header>

        {/* Chat / Results Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-8 pb-40 scroll-smooth custom-scrollbar">
          <div className="max-w-5xl mx-auto w-full h-full">
            {rightPanel}
          </div>
        </div>

        {/* Input Area Fixed Bottom */}
        <div className="absolute bottom-0 left-0 right-0 pt-6 pb-4 px-4 bg-chat-main pointer-events-none">
          <div className="max-w-5xl mx-auto w-full pointer-events-auto border-t border-transparent">
            {leftPanel}
            <div className="text-center text-[13px] text-chat-textMuted mt-3 pb-1 font-medium">
              BuildFlow can make mistakes. Check generated code and docs.
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
