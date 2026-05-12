import React from 'react';

interface DashboardLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

export default function DashboardLayout({ leftPanel, rightPanel }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-light-bg p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-[40%_60%] gap-4 md:gap-6 max-w-[1600px] mx-auto">
        {/* Left Panel - Input Area */}
        <div className="w-full">
          {leftPanel}
        </div>
        
        {/* Right Panel - Results Area */}
        <div className="w-full">
          {rightPanel}
        </div>
      </div>
    </div>
  );
}
