'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  ArrowRight, ArrowLeft, Loader2, Send,
  Users, Scaling, ShieldCheck, Monitor,
  Palette, Sun, LayoutGrid, Smartphone,
  Code2, Server, Database, Cloud
} from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: string[];
  icon: React.ComponentType<any>;
}

interface Step {
  id: string;
  title: string;
  questions: Question[];
}

const STEPS: Step[] = [
  {
    id: 'requirements',
    title: 'Requirements',
    questions: [
      {
        id: 'users',
        question: 'Who are the target users?',
        options: ['Individual consumers', 'Small teams', 'Enterprise organizations', 'All of the above'],
        icon: Users,
      },
      {
        id: 'scale',
        question: 'What scale are you building for?',
        options: ['MVP / Proof of concept', 'Small (< 1K users)', 'Medium (1K–100K users)', 'Large scale (100K+ users)'],
        icon: Scaling,
      },
      {
        id: 'auth',
        question: 'What authentication is needed?',
        options: ['Email & password', 'Social login (Google, GitHub)', 'SSO / Enterprise auth', 'No authentication'],
        icon: ShieldCheck,
      },
      {
        id: 'platforms',
        question: 'Which platforms should it support?',
        options: ['Web only', 'Mobile only', 'Web + Mobile', 'Desktop application'],
        icon: Monitor,
      },
    ],
  },
  {
    id: 'design',
    title: 'Design & UX',
    questions: [
      {
        id: 'ui_style',
        question: 'What UI style do you prefer?',
        options: ['Minimal & clean', 'Feature-rich dashboard', 'Content-heavy / editorial', 'Interactive & animated'],
        icon: Palette,
      },
      {
        id: 'theme',
        question: 'Preferred color theme?',
        options: ['Light mode', 'Dark mode', 'Both (user toggle)', 'Match system preference'],
        icon: Sun,
      },
      {
        id: 'layout',
        question: 'Primary layout pattern?',
        options: ['Sidebar navigation', 'Top navigation bar', 'Tab-based navigation', 'Single page / scroll'],
        icon: LayoutGrid,
      },
      {
        id: 'responsive',
        question: 'Mobile responsiveness priority?',
        options: ['Mobile-first design', 'Desktop-first, responsive', 'Equal priority both', 'Not required'],
        icon: Smartphone,
      },
    ],
  },
  {
    id: 'tech',
    title: 'Tech Stack',
    questions: [
      {
        id: 'frontend',
        question: 'Frontend framework?',
        options: ['React / Next.js', 'Vue / Nuxt', 'Svelte / SvelteKit', 'No preference'],
        icon: Code2,
      },
      {
        id: 'backend',
        question: 'Backend approach?',
        options: ['Node.js / Express', 'Python / FastAPI', 'Serverless functions', 'No preference'],
        icon: Server,
      },
      {
        id: 'database',
        question: 'Database preference?',
        options: ['PostgreSQL', 'MongoDB', 'Firebase / Supabase', 'No preference'],
        icon: Database,
      },
      {
        id: 'deployment',
        question: 'Deployment target?',
        options: ['Vercel / Netlify', 'AWS / GCP', 'Docker / self-hosted', 'No preference'],
        icon: Cloud,
      },
    ],
  },
];

export default function QuestionnairePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idea = searchParams.get('idea') || '';

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idea) router.push('/dashboard');
  }, [idea, router]);

  const step = STEPS[currentStep];
  const totalSteps = STEPS.length;

  // Check if all questions in current step are answered
  const stepComplete = step.questions.every(q => answers[q.id]);
  const allComplete = STEPS.every(s => s.questions.every(q => answers[q.id]));

  const selectAnswer = (questionId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleGenerate = async () => {
    setIsSubmitting(true);
    setError(null);

    // Compile all answers into a structured prompt
    const sections = STEPS.map(s => {
      const qas = s.questions.map(q => `- ${q.question} → ${answers[q.id]}`).join('\n');
      return `## ${s.title}\n${qas}`;
    }).join('\n\n');

    const fullPrompt = `App Idea: ${idea}\n\nDetailed Requirements Gathered:\n\n${sections}`;

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error('Authentication error. Please sign in again.');

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ appIdea: fullPrompt, userId: session.user.id })
      });

      if (!response.ok) {
        let msg = 'Failed to generate';
        try { const d = await response.json(); msg = d.error || msg; } catch {}
        throw new Error(msg);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Generation failed');

      router.push(`/dashboard/results/${data.projectId}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      setIsSubmitting(false);
    }
  };

  if (!idea) return null;

  return (
    <div className="h-full overflow-y-auto bg-bg">
      <div className="max-w-[640px] mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <p className="text-[11px] font-bold text-primary uppercase tracking-[0.1em] mb-1">Detailed Mode</p>
          <h1 className="text-[24px] font-extrabold text-text-primary tracking-tight leading-tight mb-2">
            {step.title}
          </h1>
          <p className="text-[13px] text-text-muted leading-relaxed line-clamp-2">
            {idea}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 animate-fade-in-up anim-delay-1">
          {STEPS.map((s, i) => {
            const done = s.questions.every(q => answers[q.id]);
            const active = i === currentStep;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                  active
                    ? 'bg-primary text-white'
                    : done
                      ? 'bg-primary-muted text-primary'
                      : 'bg-surface-alt text-text-muted'
                }`}
              >
                <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center border ${
                  active ? 'border-white/40' : done ? 'border-primary/30' : 'border-text-faint'
                }">
                  {i + 1}
                </span>
                {s.title}
              </button>
            );
          })}
        </div>

        {/* Questions */}
        <div className="space-y-6 animate-fade-in-up anim-delay-2">
          {step.questions.map((q) => {
            const QIcon = q.icon;
            const selected = answers[q.id];
            return (
              <div key={q.id}>
                <div className="flex items-center gap-2 mb-3">
                  <QIcon size={16} className="text-primary" strokeWidth={1.8} />
                  <h3 className="text-[14px] font-bold text-text-primary">{q.question}</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((option) => {
                    const isSelected = selected === option;
                    return (
                      <button
                        key={option}
                        onClick={() => selectAnswer(q.id, option)}
                        className={`text-left px-4 py-3 rounded-lg text-[13px] font-medium transition-all border ${
                          isSelected
                            ? 'bg-primary-faint border-primary text-primary'
                            : 'bg-surface border-border text-text-secondary hover:border-text-faint hover:bg-surface-alt'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-5 p-2.5 rounded-lg bg-red-50 border border-red-200 text-error text-[12px] font-medium text-center">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border-light">
          <button
            onClick={currentStep === 0 ? () => router.push('/dashboard') : prevStep}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-text-muted hover:text-text-primary hover:bg-surface-alt transition-colors"
          >
            <ArrowLeft size={15} strokeWidth={2} />
            {currentStep === 0 ? 'Back' : 'Previous'}
          </button>

          {currentStep < totalSteps - 1 ? (
            <button
              onClick={nextStep}
              disabled={!stepComplete}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-[13px] font-bold bg-primary text-white hover:bg-primary-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ArrowRight size={15} strokeWidth={2} />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!allComplete || isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-[13px] font-bold bg-primary text-white hover:bg-primary-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  Generate
                  <Send size={14} strokeWidth={2} />
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
