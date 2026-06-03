import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-bg font-sans selection:bg-blue-100 selection:text-blue-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-surface sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-text-primary">
            <Logo className="w-5 h-5 text-primary" />
            BuildFlow
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <h1 className="text-4xl font-extrabold text-text-primary mb-2 tracking-tight">Privacy Policy</h1>
        <p className="text-text-secondary mb-10">Last updated: {new Date().toLocaleDateString('en-GB')}</p>

        <div className="prose prose-slate max-w-none text-text-secondary prose-headings:text-text-primary prose-a:text-primary">
          <p>
            Welcome to BuildFlow. We respect your privacy and are committed to protecting your personal data. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
            visit our website and use our service.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            We collect personal information that you voluntarily provide to us when registering at the Services, 
            expressing an interest in obtaining information about us or our products and services. The personal 
            information that we collect depends on the context of your interactions with us and the Services, 
            the choices you make and the products and features you use. The personal information we collect can include:
          </p>
          <ul>
            <li><strong>Credentials:</strong> We collect passwords, and similar security information used for authentication and account access.</li>
            <li><strong>Contact Data:</strong> We collect email addresses provided during sign-up.</li>
            <li><strong>User Data:</strong> App ideas, requirements, and projects you generate using the platform.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>
            We use personal information collected via our Services for a variety of business purposes described below. 
            We process your personal information for these purposes in reliance on our legitimate business interests, 
            in order to enter into or perform a contract with you, with your consent, and/or for compliance with our 
            legal obligations.
          </p>
          <ul>
            <li>To facilitate account creation and logon process.</li>
            <li>To fulfill and manage your requests for AI generations.</li>
            <li>To send administrative information to you.</li>
          </ul>

          <h2>3. Third-Party Services</h2>
          <p>
            We use third-party services to provide the core functionality of our application, including:
          </p>
          <ul>
            <li><strong>Supabase:</strong> For secure authentication and database management.</li>
            <li><strong>Google Generative AI (Gemini):</strong> For generating app requirements and system designs based on your prompts.</li>
          </ul>

          <h2>4. Data Security</h2>
          <p>
            We have implemented appropriate technical and organizational security measures designed to protect 
            the security of any personal information we process. However, please also remember that we cannot 
            guarantee that the internet itself is 100% secure.
          </p>

          <h2>5. Contact Us</h2>
          <p>
            If you have questions or comments about this policy, you may email us at: <a href="mailto:bhingesamarth@gmail.com">bhingesamarth@gmail.com</a>.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-text-secondary">
          © {new Date().getFullYear()} BuildFlow. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
