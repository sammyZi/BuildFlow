import AuthGuard from '@/components/AuthGuard';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#f8f9fa] p-4">
        <div className="glassmorphism-card max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-[#212529]">Dashboard</h1>
          <p className="mt-4 text-[#6c757d]">
            Welcome to AI Architect Hub! You are now authenticated.
          </p>
        </div>
      </main>
    </AuthGuard>
  );
}
